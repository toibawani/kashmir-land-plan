/**
 * Language foundation for My Land, My Plan.
 *
 * This is the plumbing that makes translation possible, not a translation.
 * English is the complete, correct source of truth and is what ships. A
 * second language is offered only when a fluent speaker has registered a
 * complete set of strings and marked it ready; nothing machine-translated is
 * ever presented as finished. Until then the switcher stays hidden and the
 * app behaves exactly as an English-only app, which is the honest state.
 *
 * The strings here cover the critical path a first-time user meets: the home
 * screen, the main navigation, and the standing honesty lines that must read
 * the same in every language. Deeper screens (form labels, results headers,
 * the visit card) use the same mechanism and are the next tranche a
 * translator extends; the module is built so adding them is data, not code.
 *
 * Interface
 *   MLMP_MESSAGES.t(key, vars)          a translated string, English fallback
 *   MLMP_MESSAGES.register(lang, dict)  add or update a language
 *   MLMP_MESSAGES.markReady(lang, ok)   a translator confirms a language is done
 *   MLMP_MESSAGES.available()           languages offered in the switcher
 *   MLMP_MESSAGES.set(lang) / get()     current language, persisted on device
 *   MLMP_MESSAGES.apply(root)           paint [data-i18n] elements
 *   MLMP_MESSAGES.dir(lang)             "ltr" or "rtl", for future Urdu
 */
(function () {
  "use strict";

  var STORAGE_KEY = "mlmp_lang_v1";

  // English, complete for the critical path. Every value is a full sentence
  // or label as it appears on screen, so a translator reads real copy, not
  // fragments. Placeholders use {name} and are filled by t().
  var EN = {
    "nav.home": "Home",
    "nav.plan": "Start plan",
    "nav.weather": "Weather",
    "nav.plans": "My plans",
    "nav.about": "About",
    "nav.menu": "Menu",

    "home.eyebrow": "For farmers in Jammu and Kashmir",
    "home.title": "My Land, My Plan",
    "home.lead":
      "Answer a few questions about a plot you are not using, and get activity options to explore, a month-by-month guide, questions to ask, and a one-page card to take to the office.",
    "home.start": "Start a land plan",
    "home.demo": "Try sample journey",
    "home.note":
      "A working prototype, not a government service. It does not approve schemes or judge your land. Everything it suggests is a question to raise with your local agriculture office.",

    "home.points.enterTitle": "What you enter",
    "home.points.enterBody":
      "District, village, plot size, water access, terrain, and the main constraint you face. Soil test is optional.",
    "home.points.getTitle": "What you get",
    "home.points.getBody":
      "Two or three activity options to explore, a typical year for each, a comparison, a next-step checklist, and the official portals to check.",

    "common.confirmLocally":
      "Always confirm crop choices, costs, and current scheme rules with your local agriculture office or Kisan Khidmat Ghar.",
    "common.notOfficial":
      "This is a working prototype, not a government service. It helps you prepare questions. It cannot verify land, approve a scheme, or guarantee that a crop will suit your plot.",
  };

  // Languages other than English. A translator fills one of these in whole
  // and calls markReady. The entry is deliberately absent until then, so the
  // switcher cannot offer a half-finished language.
  var LANGS = {
    en: { label: "English", dir: "ltr", ready: true, strings: EN },
  };

  var current = "en";

  function readStored() {
    try {
      if (typeof localStorage !== "undefined" && localStorage.getItem) {
        return localStorage.getItem(STORAGE_KEY) || "en";
      }
    } catch (e) {
      /* private mode or no storage: stay on English */
    }
    return "en";
  }

  function writeStored(lang) {
    try {
      if (typeof localStorage !== "undefined" && localStorage.setItem) {
        localStorage.setItem(STORAGE_KEY, lang);
      }
    } catch (e) {
      /* nothing to do; the choice simply does not persist */
    }
  }

  // The list shown in the switcher. Only English until a language is marked
  // ready, so a single-language app never shows a control that does nothing.
  function available() {
    return Object.keys(LANGS)
      .filter(function (code) {
        return LANGS[code].ready;
      })
      .map(function (code) {
        return { code: code, label: LANGS[code].label, dir: LANGS[code].dir };
      });
  }

  function dictFor(lang) {
    var entry = LANGS[lang || current];
    return entry && entry.strings ? entry.strings : EN;
  }

  function t(key, vars) {
    var dict = dictFor(current);
    var str = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : EN[key];
    if (str == null) return key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        str = str.split("{" + name + "}").join(String(vars[name]));
      });
    }
    return str;
  }

  function dir(lang) {
    var code = lang || current;
    return LANGS[code] ? LANGS[code].dir : "ltr";
  }

  function get() {
    return current;
  }

  function set(lang) {
    if (!LANGS[lang]) return current;
    current = lang;
    writeStored(lang);
    return current;
  }

  function register(lang, dict) {
    if (!lang || !dict) return;
    var existing = LANGS[lang] || { label: lang, dir: "ltr", ready: false, strings: {} };
    existing.strings = dict;
    LANGS[lang] = existing;
  }

  function markReady(lang, ok) {
    if (!LANGS[lang]) return;
    LANGS[lang].ready = ok !== false;
  }

  function setLabel(lang, label, dirValue) {
    if (!LANGS[lang]) return;
    if (label) LANGS[lang].label = label;
    if (dirValue) LANGS[lang].dir = dirValue;
  }

  /**
   * Paint every element carrying data-i18n="key" with its translation. An
   * element whose key has no translation in the current language is left
   * exactly as it is, so the English already in the markup stands and a
   * missing string can never blank a screen.
   */
  function apply(root) {
    var scope = root || (typeof document !== "undefined" ? document : null);
    if (!scope || !scope.querySelectorAll) return;
    var nodes = scope.querySelectorAll("[data-i18n]");
    Array.prototype.forEach.call(nodes, function (el) {
      var key = el.getAttribute("data-i18n");
      var dict = dictFor(current);
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        el.textContent = t(key);
      }
    });
  }

  function init() {
    var stored = readStored();
    if (LANGS[stored]) current = stored;
  }

  init();

  window.MLMP_MESSAGES = {
    t: t,
    register: register,
    markReady: markReady,
    setLabel: setLabel,
    available: available,
    set: set,
    get: get,
    dir: dir,
    apply: apply,
  };
})();
