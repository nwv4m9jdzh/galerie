/**
 * Handles UI language (CZ/EN): loads lang/*.json, applies data-i18n
 * attributes, persists choice in localStorage, and notifies other
 * scripts via the "i18n:changed" event on document.
 */
(function () {
  var STORAGE_KEY = "galerie-lang";
  var DEFAULT_LANG = "cs";
  var OTHER_LANG = { cs: "en", en: "cs" };

  var currentLang = DEFAULT_LANG;
  var currentDict = {};

  function getStoredLang() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      return stored === "cs" || stored === "en" ? stored : null;
    } catch (e) {
      return null;
    }
  }

  function storeLang(lang) {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* localStorage unavailable (e.g. private mode) — ignore */
    }
  }

  function applyDict(dict) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) {
        el.textContent = dict[key];
      }
    });

    document.querySelectorAll("[data-i18n-attr-aria-label]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-attr-aria-label");
      if (dict[key] !== undefined) {
        el.setAttribute("aria-label", dict[key]);
      }
    });
  }

  function setLang(lang) {
    if (lang !== "cs" && lang !== "en") {
      lang = DEFAULT_LANG;
    }

    fetch("lang/" + lang + ".json")
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Nepodařilo se načíst jazyk: " + lang);
        }
        return res.json();
      })
      .then(function (dict) {
        currentLang = lang;
        currentDict = dict;
        document.documentElement.setAttribute("lang", lang);
        applyDict(dict);
        storeLang(lang);

        var toggle = document.getElementById("lang-toggle");
        if (toggle) {
          toggle.textContent = OTHER_LANG[lang].toUpperCase();
        }

        document.dispatchEvent(
          new CustomEvent("i18n:changed", { detail: { lang: lang, dict: dict } })
        );
      })
      .catch(function (err) {
        console.error(err);
      });
  }

  function init() {
    var initial = getStoredLang() || DEFAULT_LANG;
    setLang(initial);

    var toggle = document.getElementById("lang-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        setLang(OTHER_LANG[currentLang]);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  window.i18n = {
    getLang: function () {
      return currentLang;
    },
    getDict: function () {
      return currentDict;
    },
    setLang: setLang,
  };
})();
