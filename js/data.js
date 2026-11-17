/**
 * Everything that belongs to the farmer, in one place.
 *
 * The app stores plans and a draft in localStorage on this device and nowhere
 * else. That makes two things a promise the app has to keep: the farmer can
 * take a copy away with them, and the farmer can delete everything. This module
 * is both, plus a strict reader for a file that arrives from outside.
 *
 * An imported file is treated as untrusted input. Every field is checked
 * against a closed list, unknown keys are a refusal rather than something to
 * ignore quietly, and one bad plan refuses the whole file so a restore can
 * never half-happen and leave someone with three of their five plans. That is
 * the same rule the review CSV importer follows.
 *
 * Interface
 *   MLMP_DATA.build(plans, draft)          the backup object, nothing written
 *   MLMP_DATA.validate(text, opts)         { ok, plans, draft, error }
 *   MLMP_DATA.download(plans, draft)       save the backup file on the device
 *   MLMP_DATA.facts(keys)                  what is stored: key names and sizes
 *   MLMP_DATA.clearAll()                   remove every mlmp_ key, returns names
 *   MLMP_DATA.PREFIX / MAX_PLANS / MAX_NOTES
 *
 * No value read here is ever put in the document; the caller escapes what it
 * shows, and this module only returns plain objects.
 */
(function () {
  "use strict";

  var APP_ID = "my-land-my-plan";
  var BACKUP_VERSION = 1;
  var PREFIX = "mlmp_";
  var MAX_PLANS = 8;
  var MAX_NAME = 60;
  var MAX_NOTES = 2000;
  var MAX_VILLAGE = 80;
  var MAX_OPTIONS = 6;

  var DATA_KEYS = [
    "district",
    "altitude",
    "village",
    "size",
    "unit",
    "landUse",
    "water",
    "terrain",
    "soil",
    "constraint",
  ];
  var ALTITUDES = ["valley", "plains", "hills", "high_altitude"];
  var UNITS = ["kanal", "acre", "hectare", "marla"];
  var LAND_USE = ["unused", "partly", "cultivated"];
  var WATER = ["reliable", "seasonal", "limited", "unknown"];
  var TERRAIN = ["flat", "sloped", "unknown"];
  var SOIL = ["none", "done", "partial"];
  var CONSTRAINT = ["water", "cost", "labour", "advice", "market", "unsure"];

  var PLAN_KEYS = [
    "id",
    "name",
    "createdAt",
    "updatedAt",
    "chosen",
    "data",
    "interested",
    "coveredQuestions",
    "options",
    "zoneId",
    "isDemo",
    "notes",
  ];

  var DRAFT_KEYS = [
    "data",
    "step",
    "isDemo",
    "checklist",
    "interested",
    "coveredQuestions",
    "planReady",
    "weatherPlaceMode",
    "weatherCustomPlace",
    "currentPlanId",
    "currentPlanName",
  ];

  var BACKUP_KEYS = ["app", "backupVersion", "exportedAt", "plans", "draft"];

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  /**
   * Text that came from storage or from a file. Control characters are dropped
   * rather than rendered, and the length is capped so a pasted document cannot
   * bloat the store past what a phone can hold.
   */
  function cleanText(value, max) {
    if (typeof value !== "string") return null;
    var text = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
    text = text.trim();
    if (max && text.length > max) text = text.slice(0, max);
    return text;
  }

  function unknownKeys(object, allowed) {
    return Object.keys(object).filter(function (key) {
      return allowed.indexOf(key) === -1;
    });
  }

  /** A saved note, as the plan card shows it. Plain text, never markup. */
  function cleanNotes(value) {
    if (value == null) return "";
    var text = cleanText(String(value), MAX_NOTES);
    return text === null ? "" : text;
  }

  function validDate(value) {
    if (typeof value !== "string" || !value) return false;
    var time = Date.parse(value);
    return !isNaN(time) && value.length <= 40;
  }

  function validMap(value) {
    if (!isPlainObject(value)) return null;
    var keys = Object.keys(value);
    if (keys.length > 200) return null;
    var out = {};
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key.length > 64) return null;
      if (value[key] !== true && value[key] !== false) return null;
      out[key] = value[key] === true;
    }
    return out;
  }

  /**
   * The six answers plus the optional soil answer. Enum fields must be one of
   * the values the form can produce; a file that says `soil: "very good"` is
   * not this app's data and is refused instead of being shown as if it were.
   */
  function validAnswers(raw, districts, requireDistrict) {
    if (!isPlainObject(raw)) return { ok: false, error: "the answers are not an object" };
    var extra = unknownKeys(raw, DATA_KEYS);
    if (extra.length) return { ok: false, error: "the answers carry unknown fields (" + extra.join(", ") + ")" };

    var out = {};
    for (var i = 0; i < DATA_KEYS.length; i++) {
      var key = DATA_KEYS[i];
      if (!Object.prototype.hasOwnProperty.call(raw, key)) return { ok: false, error: "the answer " + key + " is missing" };
      if (typeof raw[key] !== "string") return { ok: false, error: "the answer " + key + " is not text" };
      if (raw[key].length > 120) return { ok: false, error: "the answer " + key + " is too long" };
      out[key] = raw[key];
    }

    if (out.district) {
      if (districts && districts.length && districts.indexOf(out.district) === -1) {
        return { ok: false, error: "the district " + out.district + " is not one this app offers" };
      }
    } else if (requireDistrict !== false) {
      return { ok: false, error: "the district is empty" };
    }

    if (out.altitude && ALTITUDES.indexOf(out.altitude) === -1) return { ok: false, error: "the altitude zone is not one this app offers" };
    if (UNITS.indexOf(out.unit) === -1) return { ok: false, error: "the unit is not one this app offers" };
    if (out.landUse && LAND_USE.indexOf(out.landUse) === -1) return { ok: false, error: "the land use is not one this app offers" };
    if (out.water && WATER.indexOf(out.water) === -1) return { ok: false, error: "the water answer is not one this app offers" };
    if (out.terrain && TERRAIN.indexOf(out.terrain) === -1) return { ok: false, error: "the terrain answer is not one this app offers" };
    if (out.soil && SOIL.indexOf(out.soil) === -1) return { ok: false, error: "the soil answer is not one this app offers" };
    if (out.constraint && CONSTRAINT.indexOf(out.constraint) === -1) return { ok: false, error: "the constraint answer is not one this app offers" };
    if (out.village.length > MAX_VILLAGE) return { ok: false, error: "the village name is too long" };

    if (out.size) {
      var size = Number(out.size);
      if (isNaN(size) || size <= 0 || size > 500) return { ok: false, error: "the plot size is not a number this app can hold" };
    }
    return { ok: true, value: out };
  }

  function validPlan(raw, districts) {
    if (!isPlainObject(raw)) return { ok: false, error: "a plan is not an object" };
    var extra = unknownKeys(raw, PLAN_KEYS);
    if (extra.length) return { ok: false, error: "a plan carries unknown fields (" + extra.join(", ") + ")" };

    if (typeof raw.id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(raw.id)) {
      return { ok: false, error: "a plan has an unusable id" };
    }
    var name = cleanText(raw.name, MAX_NAME);
    if (!name) return { ok: false, error: "a plan has no name" };

    var answers = validAnswers(raw.data, districts);
    if (!answers.ok) return { ok: false, error: answers.error };

    var interested = validMap(raw.interested || {});
    if (!interested) return { ok: false, error: "a plan's marked options are not a set of ticks" };
    var covered = validMap(raw.coveredQuestions || {});
    if (!covered) return { ok: false, error: "a plan's ticked questions are not a set of ticks" };

    if (!Array.isArray(raw.options) || raw.options.length > MAX_OPTIONS) {
      return { ok: false, error: "a plan's options are not a short list" };
    }
    var options = [];
    for (var i = 0; i < raw.options.length; i++) {
      var option = raw.options[i];
      if (!isPlainObject(option)) return { ok: false, error: "a plan's option is not an object" };
      if (typeof option.id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(option.id)) {
        return { ok: false, error: "a plan's option has an unusable id" };
      }
      options.push({ id: option.id });
    }

    if (raw.createdAt != null && !validDate(raw.createdAt)) return { ok: false, error: "a plan has an unreadable created date" };
    if (raw.updatedAt != null && !validDate(raw.updatedAt)) return { ok: false, error: "a plan has an unreadable updated date" };
    if (raw.zoneId != null && (typeof raw.zoneId !== "string" || raw.zoneId.length > 40)) {
      return { ok: false, error: "a plan has an unreadable zone" };
    }
    if (raw.notes != null && typeof raw.notes !== "string") return { ok: false, error: "a plan's notes are not text" };

    return {
      ok: true,
      value: {
        id: raw.id,
        name: name,
        createdAt: validDate(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
        updatedAt: validDate(raw.updatedAt) ? raw.updatedAt : new Date().toISOString(),
        chosen: raw.chosen === true,
        data: answers.value,
        interested: interested,
        coveredQuestions: covered,
        options: options,
        zoneId: raw.zoneId || null,
        isDemo: raw.isDemo === true,
        notes: cleanNotes(raw.notes),
      },
    };
  }

  function validDraft(raw, districts) {
    if (!isPlainObject(raw)) return { ok: false, error: "the draft is not an object" };
    var extra = unknownKeys(raw, DRAFT_KEYS);
    if (extra.length) return { ok: false, error: "the draft carries unknown fields (" + extra.join(", ") + ")" };

    // A draft can be saved before the district is chosen, so its answers are
    // allowed to be blank. A saved plan cannot: it was made from a finished
    // form, and a backup that says otherwise is not this app's data.
    var answers = validAnswers(raw.data, districts, false);
    if (!answers.ok) return { ok: false, error: answers.error };

    var step = Number(raw.step);
    if (!isFinite(step) || step < 1 || step > 5) return { ok: false, error: "the draft is on an impossible step" };

    var interested = validMap(raw.interested || {});
    if (!interested) return { ok: false, error: "the draft's marked options are not a set of ticks" };
    var covered = validMap(raw.coveredQuestions || {});
    if (!covered) return { ok: false, error: "the draft's ticked questions are not a set of ticks" };

    var checklist = [];
    if (raw.checklist != null) {
      if (!Array.isArray(raw.checklist) || raw.checklist.length > 64) {
        return { ok: false, error: "the draft's checklist is not a short list" };
      }
      for (var i = 0; i < raw.checklist.length; i++) {
        var item = raw.checklist[i];
        if (!isPlainObject(item)) return { ok: false, error: "a checklist item is not an object" };
        var text = cleanText(item.text, 300);
        if (!text) return { ok: false, error: "a checklist item has no text" };
        checklist.push({ text: text, checked: item.checked === true });
      }
    }

    var place = cleanText(raw.weatherCustomPlace == null ? "" : String(raw.weatherCustomPlace), MAX_VILLAGE);
    if (place === null) return { ok: false, error: "the draft's weather town is not text" };

    return {
      ok: true,
      value: {
        data: answers.value,
        step: step,
        isDemo: raw.isDemo === true,
        checklist: checklist,
        interested: interested,
        coveredQuestions: covered,
        planReady: raw.planReady === true,
        weatherPlaceMode: raw.weatherPlaceMode === "custom" ? "custom" : "district",
        weatherCustomPlace: place,
        currentPlanId: typeof raw.currentPlanId === "string" && raw.currentPlanId.length <= 64 ? raw.currentPlanId : null,
        currentPlanName: cleanText(raw.currentPlanName == null ? "" : String(raw.currentPlanName), MAX_NAME) || "",
      },
    };
  }

  /** The backup object. Reading it back through validate() must change nothing. */
  function build(plans, draft) {
    return {
      app: APP_ID,
      backupVersion: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      plans: Array.isArray(plans) ? plans : [],
      draft: draft || null,
    };
  }

  /**
   * Read a backup file. `opts.districts` is the list of district names this
   * build offers; passing it makes a file from a different catalogue a clear
   * refusal rather than a plan that opens onto a blank district.
   */
  function validate(text, opts) {
    opts = opts || {};
    var parsed;
    if (typeof text !== "string" || !text.trim()) return { ok: false, error: "the file is empty" };
    if (text.length > 2000000) return { ok: false, error: "the file is larger than this app will read" };

    try {
      parsed = JSON.parse(text);
    } catch (_) {
      return { ok: false, error: "the file is not a JSON backup" };
    }
    if (!isPlainObject(parsed)) return { ok: false, error: "the file does not hold a backup object" };

    var extra = unknownKeys(parsed, BACKUP_KEYS);
    if (extra.length) return { ok: false, error: "the backup carries unknown fields (" + extra.join(", ") + ")" };
    if (parsed.app !== APP_ID) return { ok: false, error: "the file was not made by this app" };
    if (Number(parsed.backupVersion) !== BACKUP_VERSION) {
      return { ok: false, error: "the file is from a different version of the backup format" };
    }
    if (!Array.isArray(parsed.plans)) return { ok: false, error: "the backup holds no list of plans" };
    if (parsed.plans.length > MAX_PLANS) {
      return { ok: false, error: "the backup holds more than the " + MAX_PLANS + " plans this device keeps" };
    }

    var plans = [];
    var seen = {};
    for (var i = 0; i < parsed.plans.length; i++) {
      var plan = validPlan(parsed.plans[i], opts.districts);
      if (!plan.ok) return { ok: false, error: "plan " + (i + 1) + ": " + plan.error };
      if (seen[plan.value.id]) return { ok: false, error: "two plans share the id " + plan.value.id };
      seen[plan.value.id] = true;
      plans.push(plan.value);
    }

    var draft = null;
    if (parsed.draft != null) {
      var checked = validDraft(parsed.draft, opts.districts);
      if (!checked.ok) return { ok: false, error: "the draft: " + checked.error };
      draft = checked.value;
    }

    return { ok: true, plans: plans, draft: draft };
  }

  function download(plans, draft) {
    var payload = build(plans, draft);
    var text = JSON.stringify(payload, null, 2);
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = "my-land-my-plan-backup-" + stamp + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    return { plans: payload.plans.length, bytes: text.length };
  }

  /** Every key this app owns, with its size. Names only, never values. */
  function facts() {
    var out = [];
    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var key = window.localStorage.key(i);
        if (!key || key.indexOf(PREFIX) !== 0) continue;
        var value = window.localStorage.getItem(key);
        out.push({ key: key, bytes: value ? value.length : 0 });
      }
    } catch (_) {
      return out;
    }
    return out;
  }

  /** Remove every key this app owns. Returns their names, so the caller can say what went. */
  function clearAll() {
    var names = facts().map(function (f) {
      return f.key;
    });
    try {
      names.forEach(function (key) {
        window.localStorage.removeItem(key);
      });
    } catch (_) {
      return [];
    }
    return names;
  }

  window.MLMP_DATA = {
    APP_ID: APP_ID,
    BACKUP_VERSION: BACKUP_VERSION,
    PREFIX: PREFIX,
    MAX_PLANS: MAX_PLANS,
    MAX_NOTES: MAX_NOTES,
    build: build,
    validate: validate,
    download: download,
    facts: facts,
    clearAll: clearAll,
    cleanNotes: cleanNotes,
  };
})();
