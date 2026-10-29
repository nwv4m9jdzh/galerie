/**
 * Loads data/artworks.json and renders the gallery:
 * - desktop (>768px): one artwork per viewport-height section, image and
 *   caption side by side, alternating left/right, scroll-snapped
 * - mobile (<=768px): full-size images stacked, caption below each image
 * Re-renders when the language changes or the layout crosses the
 * mobile/desktop breakpoint.
 */
(function () {
  var galleryEl = document.getElementById("gallery");
  var emptyEl = document.getElementById("gallery-empty");
  var mobileQuery = window.matchMedia("(max-width: 768px)");

  var artworks = [];

  function localize(artwork) {
    var lang = window.i18n.getLang();
    return {
      id: artwork.id,
      full: "images/full/" + artwork.filename,
      title: artwork.title[lang] || artwork.title.cs || "",
      description: artwork.description[lang] || artwork.description.cs || "",
      width: artwork.width,
      height: artwork.height,
    };
  }

  // Description can hold multiple lines (technika, rozměry, rok…), one per
  // "\n". Desktop keeps them as separate lines; mobile joins them onto the
  // title's line with commas to save space.
  function descriptionLines(description) {
    if (!description) return [];
    return description
      .split("\n")
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean);
  }

  function clearGallery() {
    galleryEl.querySelectorAll(".gallery-sections, .gallery-stack").forEach(function (el) {
      el.remove();
    });
  }

  function renderDesktop(items) {
    var list = document.createElement("div");
    list.className = "gallery-sections";

    items.forEach(function (item, index) {
      var section = document.createElement("section");
      section.className = "gallery-section";
      if (index % 2 === 1) {
        section.className += " gallery-section--reverse";
      }

      var figure = document.createElement("figure");
      figure.className = "gallery-section__image";

      var img = document.createElement("img");
      img.src = item.full;
      img.alt = item.title;
      img.loading = "lazy";
      if (item.width && item.height) {
        img.width = item.width;
        img.height = item.height;
      }
      figure.appendChild(img);

      var caption = document.createElement("div");
      caption.className = "gallery-section__caption";

      var title = document.createElement("p");
      title.className = "gallery-section__title";
      title.textContent = item.title;
      caption.appendChild(title);

      var lines = descriptionLines(item.description);
      if (lines.length) {
        var description = document.createElement("p");
        description.className = "gallery-section__description";
        lines.forEach(function (line, i) {
          if (i > 0) description.appendChild(document.createElement("br"));
          description.appendChild(document.createTextNode(line));
        });
        caption.appendChild(description);
      }

      section.appendChild(figure);
      section.appendChild(caption);
      list.appendChild(section);
    });

    galleryEl.appendChild(list);
  }

  function renderMobile(items) {
    var stack = document.createElement("div");
    stack.className = "gallery-stack";

    items.forEach(function (item) {
      var figure = document.createElement("figure");
      figure.className = "gallery-full";

      var img = document.createElement("img");
      img.src = item.full;
      img.alt = item.title;
      img.loading = "lazy";
      if (item.width && item.height) {
        img.width = item.width;
        img.height = item.height;
      }

      var caption = document.createElement("figcaption");

      var titleSpan = document.createElement("span");
      titleSpan.className = "gallery-full__title";
      titleSpan.textContent = item.title;
      caption.appendChild(titleSpan);

      var lines = descriptionLines(item.description);
      if (lines.length) {
        caption.appendChild(document.createTextNode(", "));
        var descSpan = document.createElement("span");
        descSpan.className = "gallery-full__description";
        descSpan.textContent = lines.join(", ");
        caption.appendChild(descSpan);
      }

      figure.appendChild(img);
      figure.appendChild(caption);
      stack.appendChild(figure);
    });

    galleryEl.appendChild(stack);
  }

  function render() {
    clearGallery();

    if (!artworks.length) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    var items = artworks
      .slice()
      .sort(function (a, b) {
        return b.date.localeCompare(a.date);
      })
      .map(localize);

    if (mobileQuery.matches) {
      renderMobile(items);
    } else {
      renderDesktop(items);
    }
  }

  function loadArtworks() {
    fetch("data/artworks.json")
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Nepodařilo se načíst data/artworks.json");
        }
        return res.json();
      })
      .then(function (data) {
        artworks = data;
        render();
      })
      .catch(function (err) {
        console.error(err);
        artworks = [];
        render();
      });
  }

  // Slow, eased section-to-section scrolling on desktop. Native CSS snap
  // jumps too fast, so wheel/keys are animated here; CSS snap stays as the
  // fallback (touch) and is switched off only while the animation runs.
  var SCROLL_MS = 1100;
  var animating = false;
  var lastWheel = 0;

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function currentIndex(sections) {
    var y = window.pageYOffset;
    var best = 0;
    sections.forEach(function (s, i) {
      if (Math.abs(s.offsetTop - y) < Math.abs(sections[best].offsetTop - y)) best = i;
    });
    return best;
  }

  function goTo(sections, index) {
    var from = window.pageYOffset;
    var to = sections[index].offsetTop;
    if (from === to) return;
    var root = document.documentElement;
    animating = true;
    root.style.scrollSnapType = "none";
    var start = null;
    function step(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / SCROLL_MS, 1);
      window.scrollTo(0, from + (to - from) * ease(t));
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        root.style.scrollSnapType = "";
        animating = false;
      }
    }
    requestAnimationFrame(step);
  }

  function step(dir) {
    var sections = Array.prototype.slice.call(document.querySelectorAll(".gallery-section"));
    if (!sections.length) return;
    var next = Math.max(0, Math.min(sections.length - 1, currentIndex(sections) + dir));
    goTo(sections, next);
  }

  window.addEventListener(
    "wheel",
    function (e) {
      if (mobileQuery.matches || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      var now = Date.now();
      var fresh = now - lastWheel > 120; // trackpad inertia keeps firing events
      lastWheel = now;
      if (animating || !fresh || Math.abs(e.deltaY) < 4) return;
      step(e.deltaY > 0 ? 1 : -1);
    },
    { passive: false }
  );

  window.addEventListener("keydown", function (e) {
    if (mobileQuery.matches || e.altKey || e.ctrlKey || e.metaKey) return;
    var dir = 0;
    if (e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) dir = 1;
    else if (e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) dir = -1;
    if (!dir) return;
    e.preventDefault();
    if (!animating) step(dir);
  });

  document.addEventListener("DOMContentLoaded", loadArtworks);
  document.addEventListener("i18n:changed", render);

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", render);
  } else if (mobileQuery.addListener) {
    // Safari < 14 fallback
    mobileQuery.addListener(render);
  }
})();
