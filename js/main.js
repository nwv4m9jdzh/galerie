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

  document.addEventListener("DOMContentLoaded", loadArtworks);
  document.addEventListener("i18n:changed", render);

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", render);
  } else if (mobileQuery.addListener) {
    // Safari < 14 fallback
    mobileQuery.addListener(render);
  }
})();
