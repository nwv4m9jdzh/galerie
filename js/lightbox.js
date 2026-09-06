/**
 * Desktop-only lightbox: full-size image + caption, dark overlay,
 * closes via close button / click outside / Esc, prev/next navigation.
 */
(function () {
  var lightboxEl = document.getElementById("lightbox");
  var imageEl = document.getElementById("lightbox-image");
  var captionEl = document.getElementById("lightbox-caption");
  var closeBtn = document.getElementById("lightbox-close");
  var prevBtn = document.getElementById("lightbox-prev");
  var nextBtn = document.getElementById("lightbox-next");

  var items = []; // [{ full, title, description }]
  var currentIndex = -1;

  function render() {
    var item = items[currentIndex];
    if (!item) return;
    imageEl.src = item.full;
    imageEl.alt = item.title;
    captionEl.textContent = item.description
      ? item.title + " — " + item.description
      : item.title;
  }

  function open(list, index) {
    items = list;
    currentIndex = index;
    render();
    lightboxEl.hidden = false;
    closeBtn.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function close() {
    lightboxEl.hidden = true;
    imageEl.src = "";
    document.removeEventListener("keydown", onKeydown);
  }

  function next() {
    if (!items.length) return;
    currentIndex = (currentIndex + 1) % items.length;
    render();
  }

  function prev() {
    if (!items.length) return;
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    render();
  }

  function onKeydown(e) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  }

  closeBtn.addEventListener("click", close);
  nextBtn.addEventListener("click", next);
  prevBtn.addEventListener("click", prev);

  lightboxEl.addEventListener("click", function (e) {
    if (e.target === lightboxEl) close();
  });

  window.Lightbox = {
    open: open,
    close: close,
  };
})();
