/**
 * Loads data/artworks.json and renders the gallery:
 * - desktop (>768px): grid of thumbnails, click opens the lightbox
 * - mobile (<=768px): full-size images stacked, caption as bottom overlay
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
      thumb: "images/thumbs/" + artwork.filename,
      full: "images/full/" + artwork.filename,
      title: artwork.title[lang] || artwork.title.cs || "",
      description: artwork.description[lang] || artwork.description.cs || "",
    };
  }

  function clearGallery() {
    galleryEl.querySelectorAll(".gallery-grid, .gallery-stack").forEach(function (el) {
      el.remove();
    });
  }

  function renderDesktop(items) {
    var list = document.createElement("ul");
    list.className = "gallery-grid";

    items.forEach(function (item, index) {
      var li = document.createElement("li");
      li.className = "gallery-item";

      var button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-thumb";
      button.addEventListener("click", function () {
        window.Lightbox.open(items, index);
      });

      var img = document.createElement("img");
      img.src = item.thumb;
      img.alt = item.title;
      img.loading = "lazy";

      var caption = document.createElement("span");
      caption.className = "gallery-caption";
      caption.textContent = item.title;

      button.appendChild(img);
      button.appendChild(caption);
      li.appendChild(button);
      list.appendChild(li);
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

      var caption = document.createElement("figcaption");
      caption.textContent = item.description
        ? item.title + " — " + item.description
        : item.title;

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
