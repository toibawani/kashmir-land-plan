/**
 * Language strings for the critical path.
 *
 * English is the source of truth, and it is the only dictionary in this file.
 * Hindi and Urdu are in js/messages.hi.js and js/messages.ur.js, fetched when
 * someone chooses that language: an English reader was paying 11 KB of gzip
 * for two languages they never saw. Until the chosen file arrives `t()` falls
 * back to English, so the interface is never blank and never shows a raw key.
 *
 * Hindi and Urdu cover the screens a farmer meets first: home, the form, the
 * results header, the visit card, the share text and the confirm-locally
 * lines. Option prose in the catalogue is still English, and the interface
 * says so rather than pretending otherwise.
 *
 * These translations have NOT been checked by a native speaker. Every
 * language therefore carries `reviewed: false`, the interface shows a notice
 * while a language is unreviewed, and TRANSLATION_CHECK.md lists every string
 * for a reviewer. Do not flip `reviewed` without a person and a date.
 *
 * Adding Kashmiri later is one object: copy the EN key list, fill it in, add
 * it to LANGS with dir "rtl". No other file needs to change.
 *
 * Interface
 *   MLMP_MESSAGES.t(key, vars)          a translated string, English fallback
 *   MLMP_MESSAGES.apply(root)           paint [data-i18n] elements
 *   MLMP_MESSAGES.set(lang) / get()     current language, persisted on device
 *   MLMP_MESSAGES.use(lang)             the same, and waits for its strings
 *   MLMP_MESSAGES.dir(lang)             "ltr" or "rtl"
 *   MLMP_MESSAGES.available()           languages offered in the switcher
 *   MLMP_MESSAGES.reviewed(lang)        whether a native speaker checked it
 *   MLMP_MESSAGES.dict(lang) / keys()   strings, for the translation check
 *   MLMP_MESSAGES.register/markReady    add a language, mark it complete
 */
(function () {
  "use strict";

  var STORAGE_KEY = "mlmp_lang_v1";

  var EN = {
    "nav.home": "Home",
    "nav.plan": "Start plan",
    "nav.weather": "Weather",
    "nav.plans": "My plans",
    "nav.about": "About",
    "nav.menu": "Menu",
    "nav.language": "Language",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",

    "home.eyebrow": "For farmers in Jammu and Kashmir",
    "home.title": "My Land, My Plan",
    "home.lead":
      "An offline-first land planning app that helps you prepare practical options and questions for the agriculture office, without inventing scheme eligibility or crop guarantees.",
    "home.start": "Start a land plan",
    "home.demo": "Try sample journey",
    "home.note":
      "Prepare for the agriculture office visit. This is not a government service, and nothing it suggests has been approved.",

    "home.points.enterTitle": "What you enter",
    "home.points.enterBody":
      "District, altitude zone, village, plot size, water access, terrain, and the main constraint you face. Soil test is optional.",
    "home.points.getTitle": "What you get",
    "home.points.getBody":
      "Two or three activity options to discuss, an office visit card, questions to ask, a checklist, and the official portals to check.",

    "form.location": "Location",
    "form.district": "District",
    "form.altitude": "Altitude zone",
    "form.village": "Village or locality",
    "form.size": "Plot size",
    "form.unit": "Unit",
    "form.water": "Current use and water",
    "form.terrain": "Terrain and soil",
    "form.constraint": "Main constraint",
    "form.required": "required",
    "form.continue": "Continue",
    "form.back": "Back",
    "form.submit": "See options",
    "form.saveDraft": "Save draft on this device",
    "form.selectDistrict": "Select district",
    "form.selectAltitude": "Select the ground you farm",
    "altitude.valley": "Valley or low ground",
    "altitude.plains": "Plains and foothills",
    "altitude.hills": "Mid-altitude hills",
    "altitude.high_altitude": "High altitude",
    "form.landUse": "Current land use",
    "form.landUse.unused": "Mostly unused",
    "form.landUse.partly": "Partly used",
    "form.landUse.cultivated": "Currently cultivated",
    "form.water.reliable": "Reliable",
    "form.water.seasonal": "Seasonal",
    "form.water.limited": "Limited",
    "form.water.unknown": "Not sure",
    "form.terrain.flat": "Mostly flat",
    "form.terrain.sloped": "Sloped or hilly",
    "form.terrain.unknown": "Not sure",
    "form.soil": "Soil test (optional)",
    "form.soil.none": "No recent soil test",
    "form.soil.done": "I have a recent soil test",
    "form.soil.partial": "Partial or old results",
    "form.constraint.water": "Water",
    "form.constraint.cost": "Cost or investment",
    "form.constraint.labour": "Labour",
    "form.constraint.advice": "Access to advice",
    "form.constraint.market": "Market access",
    "form.constraint.unsure": "Not sure",

    "results.title": "Possible activities to explore",
    "results.intro":
      "These are options to discuss, based on what you entered and on general information about your district. They are not an assessment of your plot, and they are not an approval of anything.",
    "results.edit": "Edit details",
    "results.compare": "Compare options",
    "results.plans": "My saved plans",
    "results.reset": "Start over with new details",
    "results.questionsTitle": "Questions to ask at the office",
    "results.questionsIntro":
      "Written from what you entered and from the options you marked. They are questions, not answers, and no officer has seen them.",
    "results.gapTitle": "Not enough local data for this altitude",
    "results.gapBody":
      "This catalogue has no honest data for this altitude zone. No options are shown here on purpose, because filling the gap with lowland crops would be a guess. Ask the officer which activities are actually practised at your height.",

    "visit.title": "Office visit card",
    "visit.intro":
      "This is the one thing worth carrying to the office. It holds what you entered, the options you marked and the questions to ask, all on one page. Nothing on it is a recommendation, and none of it has been approved by anyone.",
    "visit.print": "Print or save as PDF",
    "visit.share": "Share on WhatsApp",
    "visit.download": "Download as text",
    "visit.back": "Back to summary",
    "visit.cardTitle": "My Land, My Plan: office visit card",
    "visit.whatIEntered": "What I entered",
    "visit.options": "Options I want to discuss",
    "visit.questions": "Questions I would like to ask",
    "visit.support": "Support worth asking about",
    "visit.notes": "Notes from the visit",
    "visit.documents": "Documents to carry",
    "visit.soil": "Soil checks",
    "visit.reference": "Plan reference",
    "visit.foot":
      "This card was made by the farmer using a prototype, not by any department. It is not an official document and it does not establish eligibility for anything.",
    "visit.visitMode": "Visit mode",
    "visit.visitModeExit": "Done, leave visit mode",

    "review.badgeNot": "Not reviewed by an officer yet",
    "review.badgeReviewed": "Reviewed by {name}, {office} on {date}",
    "review.notReviewed":
      "Not yet reviewed by an agriculture officer. Treat every suggestion as a question to discuss, not as advice to act on. Always confirm locally before acting.",
    "source.scope": "Scope",

    "review.reviewed":
      "Reviewed by {name}, {office} on {date}. Still confirm locally before acting.",

    "share.heading": "My land plan",
    "share.plan": "Plan",
    "share.options": "Options to discuss",
    "share.questions": "Questions I want to ask",
    "share.carry": "Carry",
    "share.soil": "Soil checks",
    "share.marked": "(marked)",
    "share.done": "[done]",
    "share.prepared": "Prepared",
    "share.madeWith": "Made with the My Land, My Plan prototype. Not an official document.",

    "lang.notice":
      "This translation has not been checked by a native speaker yet. Option details are still in English. Always confirm locally before acting.",
    "lang.englishOnly": "Option details are in English only for now.",
    "lang.uncheckedShort": "native-speaker check pending",

    "data.title": "On this device",
    "data.intro":
      "Everything this app keeps stays in this browser on this phone. There is no account and no server copy. From here you can take a backup, restore one, or delete it all.",
    "data.storedHeading": "What is stored here",
    "data.backupHeading": "Backup",
    "data.dangerHeading": "Delete",
    "data.plansCount": "Saved plans: {count}",
    "data.draftYes": "A draft of the form you last worked on",
    "data.draftNo": "No draft saved",
    "data.langYes": "Your language choice",
    "data.none": "No saved plans yet.",
    "data.export": "Export all data",
    "data.exportHint":
      "Saves one JSON file with your plans and draft. It is written to this device, and nothing is uploaded.",
    "data.import": "Import a backup",
    "data.importHint":
      "Choose a backup file made by this app. It replaces what is here now, so export first if you want to keep it.",
    "data.deleteAll": "Delete everything on this device",
    "data.deleteHint":
      "Removes every plan, the draft, the language choice and the feedback answers. This cannot be undone.",
    "data.back": "Back to my plans",
    "data.exported": "Backup saved on this device as a JSON file.",
    "data.imported": "{count} plans restored. Your saved plans now match the file.",
    "data.deleted": "Everything this app stored on this device has been removed.",
    "data.refused": "Not imported: {why}",
    "data.confirmImport":
      "Replace what is stored on this device with this backup? The plans and draft here now will be removed.",
    "data.confirmDelete":
      "Delete every plan, the draft, the language choice and the feedback answers from this device? This cannot be undone.",
    "notes.label": "Notes for this plot",
    "notes.hint": "What the officer said, and what to do next. Kept on this device with the plan.",
    "notes.save": "Save note",
    "notes.saved": "Note saved with this plan.",

    "photos.title": "Photos of this plot",
    "photos.note":
      "Kept on this device. Each photo is made smaller and its location data is dropped before it is stored. Nothing is uploaded.",
    "photos.slot.wide": "Wide view of the plot",
    "photos.slot.ground": "Ground close-up",
    "photos.slot.water": "Nearest water source",
    "photos.optional": "optional",
    "photos.take": "Take photo",
    "photos.choose": "Choose from gallery",
    "photos.retake": "Retake",
    "photos.remove": "Delete photo",
    "photos.empty": "No photo yet.",
    "photos.needPlan": "Save this plan first, then photos can be kept with it.",
    "photos.saving": "Saving the photo on this device...",
    "photos.saved": "Photo saved with this plan.",
    "photos.tooSmall": "This photo is too small to be useful. Move closer and take it again.",
    "photos.tooDark": "This photo is too dark. Move into better light and take it again.",
    "photos.tooBright": "This photo is too bright. Move out of the sun and take it again.",
    "photos.blurry": "This photo looks blurred. Hold the phone still and take it again.",
    "photos.quota": "This device has no room for another photo. Delete one, or free some space, then try again.",
    "photos.failed": "The photo could not be read. Try another one.",
    "photos.share": "Share the photos",
    "photos.noneToShare": "No photos to share yet.",
    "photos.downloaded": "This browser cannot share files, so the photos were saved on this device.",
    "photos.confirmRemove": "Delete this photo from this device?",
    "photos.removed": "Photo deleted from this device.",
    "photos.removeFailed": "This device refused to delete the photo. Try again.",
    "photos.timeline": "Photos over time",
    "photos.timelineNote":
      "Every photo kept for this plan, newest first, with the date it was taken. Pick two to see them side by side.",
    "photos.compare": "Compare",
    "photos.comparePicked": "Picked",
    "photos.compareHint": "Pick two photos to see them side by side.",
    "photos.compareTitle": "Side by side",
    "photos.compareClear": "Clear the comparison",
    "photos.photoNote": "Note",
    "photos.photoNoteLabel": "Note about this photo",
    "photos.photoNoteSave": "Save note",
    "photos.photoNoteSaved": "Note saved with this photo.",
    "photos.photoNoteFailed": "This device refused to store the note. Free some space and try again.",
    "photos.full": "This plan already has the maximum of 40 photos. Delete one to take another.",
    "observe.title": "Description of a photo (not connected)",
    "observe.note":
      "This build has no description service. The switch records your choice, but nothing is sent and there is nothing to show yet.",
    "observe.limits":
      "Even when connected, it may report only four things it can see: ground cover, water, a structure, and slope. It will not name a crop, a soil, a pest or a yield, and it will not advise.",
    "observe.consent": "I understand that a photo would leave this phone",
    "observe.try": "Ask for a description",
    "observe.notConnected": "No description service is connected in this build, so nothing was sent.",
    "observe.needConsent": "Turn the switch on first. Nothing is sent without it.",
    "observe.needPhoto": "Take a photo first.",
    "observe.consentOff": "Photos will not be sent from this phone.",
    "observe.unavailable": "The description service is switched off, so nothing was sent.",
    "observe.limited": "Too many descriptions have been asked for today. Nothing was sent.",
    "observe.refused": "The description service refused the request. Nothing was shown.",
    "observe.ready": "A description came back. This build does not show it yet.",
    "update.ready": "A newer version of this app is ready.",
    "update.reload": "Reload",

    "common.confirmLocally":
      "Always confirm crop choices, costs, and current scheme rules with your local agriculture office or Kisan Khidmat Ghar.",
    "common.notOfficial":
      "This is a working prototype, not a government service. It helps you prepare questions. It cannot verify land, approve a scheme, or guarantee that a crop will suit your plot.",
    "common.illustrative": "Illustrative",
    "common.yourAnswers": "Your answers",
    "common.regional": "Regional background",
    "common.liveWeather": "Live weather",
    "common.askOfficer": "Ask the officer",
    "common.roughEstimate": "Rough estimate, confirm locally",
    "land.actions": "Land card actions",
    "land.share": "Share",
    "land.download": "Save as text file",
    "a11y.skip": "Skip to main content",
    "offline.banner": "You are offline. The land plan still works on this device. Weather needs a connection.",
    "land.title": "Land in {district}",
    "land.summary": "Land in {district}: what the published sources say",
    "land.height": "Height",
    "land.rain": "Rain",
    "land.soils": "Soils",
    "land.crops": "Field crops",
    "land.fruit": "Fruit",
    "land.glance": "At a glance",
    "land.area": "Area",
    "land.population": "Population",
    "land.blocks": "Blocks",
    "land.tehsils": "Tehsils",
    "land.villages": "Revenue villages",
    "land.utTitle": "Across the Union Territory",
    "land.forest": "Under forest",
    "land.sown": "Net area sown",
    "land.irrigated": "Irrigated",
    "land.nearby": "Other districts in the {division} division",
    "land.division.Kashmir": "Kashmir",
    "land.division.Jammu": "Jammu",
    "land.copy": "Copy these details",
    "land.copied": "Copied",
    "land.copyManual": "Select the text above to copy",
    "land.sources": "Where this comes from",
    "land.villageCounts": "The Union Territory has {villages} villages in the 2011 census, {revenue} revenue villages and {halqas} patwar halqas.",
    "land.villageSource": "Village counts:",
    "lazy.failed": "This part could not be loaded. Check your connection and try again.",
    "lazy.retry": "Try again",
  };

  // `reviewed` is false until a native speaker has checked the agricultural
  // wording. The interface shows a notice while it is false.
  //
  // Hindi and Urdu start with empty dictionaries: they are offered in the
  // switcher from the first paint, and `use()` fills the dictionary from the
  // file the device already cached. Showing English words for the moment in
  // between is the honest fallback, and it is what `t()` does on its own.
  var LANGS = {
    en: { label: "English", dir: "ltr", ready: true, reviewed: true, strings: EN },
    hi: { label: "हिन्दी", dir: "ltr", ready: true, reviewed: false, strings: {} },
    ur: { label: "اردو", dir: "rtl", ready: true, reviewed: false, strings: {} },
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

  function available() {
    return Object.keys(LANGS)
      .filter(function (code) {
        return LANGS[code].ready;
      })
      .map(function (code) {
        return {
          code: code,
          label: LANGS[code].label,
          dir: LANGS[code].dir,
          reviewed: !!LANGS[code].reviewed,
        };
      });
  }

  function dictFor(lang) {
    var entry = LANGS[lang || current];
    return entry && entry.strings ? entry.strings : EN;
  }

  /**
   * Translate one key. A missing key falls back to English, and then to the
   * caller's fallback if it was given, so a half-filled language can never
   * blank a screen or print a raw key at a farmer.
   */
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

  function tr(key, fallback, vars) {
    var dict = dictFor(current);
    if (!Object.prototype.hasOwnProperty.call(dict, key) && !Object.prototype.hasOwnProperty.call(EN, key)) {
      return fallback == null ? key : fallback;
    }
    return t(key, vars);
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

  /**
   * Choose a language and make sure its strings are here. English resolves at
   * once; Hindi and Urdu resolve when their file has registered itself, which
   * the loader fetches from the cache the service worker filled on install.
   * The language is only switched after the strings arrive, so a caller that
   * repaints on the promise never paints a half-translated screen.
   */
  function use(lang) {
    if (!LANGS[lang]) return Promise.resolve(current);
    if (lang === "en") return Promise.resolve(set("en"));
    if (LANGS[lang].strings && Object.keys(LANGS[lang].strings).length) {
      return Promise.resolve(set(lang));
    }
    var load = window.MLMP_LOAD;
    if (!load || !load.need) return Promise.reject(new Error("no loader for the language file"));
    return load.need("messages." + lang).then(function () {
      // A file that loaded but never registered is a broken build, not a
      // fallback: say so instead of quietly staying in English.
      if (!LANGS[lang].strings || !Object.keys(LANGS[lang].strings).length) {
        throw new Error("the " + lang + " strings did not register");
      }
      return set(lang);
    });
  }

  function reviewed(lang) {
    var code = lang || current;
    return !!(LANGS[code] && LANGS[code].reviewed);
  }

  /**
   * The label for a language in the switcher. A language no native speaker has
   * checked is marked in the menu itself, where the choice is made, not only in
   * the notice that appears after the reader has already switched to it. The
   * marker is driven by the same `reviewed` flag as the notice, so it cannot be
   * removed by editing a label: setting `reviewed: true` is the only way, and
   * that needs a person and a date behind it.
   */
  function optionLabel(code) {
    var entry = LANGS[code];
    if (!entry) return "";
    if (entry.reviewed) return entry.label;
    var note =
      (entry.strings && entry.strings["lang.uncheckedShort"]) || EN["lang.uncheckedShort"];
    return entry.label + " \u2014 " + note;
  }

  function register(lang, dict) {
    if (!lang || !dict) return;
    var existing = LANGS[lang] || { label: lang, dir: "ltr", ready: false, reviewed: false, strings: {} };
    existing.strings = dict;
    LANGS[lang] = existing;
  }

  function markReady(lang, ok) {
    if (!LANGS[lang]) return;
    LANGS[lang].ready = ok !== false;
  }

  function markReviewed(lang, ok) {
    if (!LANGS[lang]) return;
    LANGS[lang].reviewed = ok === true;
  }

  function setLabel(lang, label, dirValue) {
    if (!LANGS[lang]) return;
    if (label) LANGS[lang].label = label;
    if (dirValue) LANGS[lang].dir = dirValue;
  }

  function keys() {
    return Object.keys(EN);
  }

  function dict(lang) {
    return dictFor(lang || "en");
  }

  /**
   * Paint every element carrying data-i18n. An element whose key has no
   * translation is left exactly as it is, so the English already in the
   * markup stands and a missing string can never blank a screen.
   */
  function apply(root) {
    var scope = root || (typeof document !== "undefined" ? document : null);
    if (!scope || !scope.querySelectorAll) return;
    var nodes = scope.querySelectorAll("[data-i18n]");
    Array.prototype.forEach.call(nodes, function (el) {
      var key = el.getAttribute("data-i18n");
      var d = dictFor(current);
      if (Object.prototype.hasOwnProperty.call(d, key)) {
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
    tr: tr,
    register: register,
    markReady: markReady,
    markReviewed: markReviewed,
    setLabel: setLabel,
    available: available,
    reviewed: reviewed,
    optionLabel: optionLabel,
    set: set,
    use: use,
    get: get,
    dir: dir,
    apply: apply,
    keys: keys,
    dict: dict,
  };
})();
