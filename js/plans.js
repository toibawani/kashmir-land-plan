/**
 * Saved plans.
 *
 * A farmer often wants to weigh two different ideas, so more than one plan can
 * be kept and compared. A saved plan is a snapshot: the answers as they were,
 * the option ids that were shown, and the reasons the app gave at the time. It
 * is stored that way rather than recomputed so that changing the scoring later
 * cannot quietly rewrite a plan someone already printed and took to an office.
 *
 * Everything lives in this browser. There is no account and nothing is sent.
 *
 * Interface
 *   MLMP_PLANS.list()                     all saved plans, newest first
 *   MLMP_PLANS.get(id)                    one plan, or null
 *   MLMP_PLANS.upsert(plan)               save new or update in place, returns the plan
 *   MLMP_PLANS.remove(id)                 delete one
 *   MLMP_PLANS.rename(id, name)           rename
 *   MLMP_PLANS.choose(id)                 mark which one goes to the office
 *   MLMP_PLANS.chosen()                   the chosen plan, or null
 *   MLMP_PLANS.suggestName(options, taken)  a short human name for a new plan
 *   MLMP_PLANS.MAX                        how many are kept
 */
(function () {
  "use strict";

  var STORAGE_KEY = "mlmp_plans_v1";
  var MAX = 8;

  /** Storage can be unavailable or hold nonsense, so reads never throw. */
  function readRaw() {
    try {
      var text = window.localStorage.getItem(STORAGE_KEY);
      if (!text) return [];
    } catch (_) {
      return [];
    }
    var parsed;
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      return [];
    }
    var list = parsed && Array.isArray(parsed.plans) ? parsed.plans : [];
    return list.filter(isUsable);
  }

  function isUsable(plan) {
    if (!plan || typeof plan !== "object") return false;
    if (typeof plan.id !== "string" || !plan.id) return false;
    if (!plan.data || typeof plan.data !== "object") return false;
    return true;
  }

  // A covered-questions map is keyed by question id, so only a plain object
  // is ever trusted as one. Anything else (a string, an array, null) falls
  // back to the previous value rather than corrupting the field.
  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function writeRaw(plans) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, plans: plans.slice(0, MAX) })
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  function newId() {
    return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  /** Newest first, so the list reads the way the farmer last used it. */
  function list() {
    return readRaw().sort(function (a, b) {
      return String(b.updatedAt || b.createdAt || "").localeCompare(
        String(a.updatedAt || a.createdAt || "")
      );
    });
  }

  function get(id) {
    var found = readRaw().filter(function (p) {
      return p.id === id;
    });
    return found.length ? found[0] : null;
  }

  /**
   * Save a plan. Passing an existing id updates that plan in place and returns
   * the stored version, so "save again" does not litter the list with copies.
   */
  function upsert(input) {
    if (!input || !input.data) return null;
    var plans = readRaw();
    var id = input.id;
    var existingIndex = -1;
    if (id) {
      for (var i = 0; i < plans.length; i++) {
        if (plans[i].id === id) {
          existingIndex = i;
          break;
        }
      }
    }

    var previous = existingIndex === -1 ? null : plans[existingIndex];
    var name = String(input.name || (previous && previous.name) || "").trim();
    var plan = {
      id: existingIndex === -1 ? newId() : id,
      name: name || "Untitled plan",
      createdAt: (previous && previous.createdAt) || nowIso(),
      updatedAt: nowIso(),
      chosen: previous ? !!previous.chosen : !!input.chosen,
      data: input.data,
      interested: input.interested || {},
      // The covered questions ride with the plan, not the draft. A plan is a
      // frozen snapshot of the answers and options, but the questions covered
      // at the office are meant to keep updating: reopening the plan a week
      // later must still show what was already talked through, and a tick
      // made during a visit must not vanish the next time the plan is opened.
      // Without this, upsert would quietly drop the field every save.
      coveredQuestions: isPlainObject(input.coveredQuestions) ? input.coveredQuestions : (previous && previous.coveredQuestions) || {},
      options: input.options || [],
      zoneId: input.zoneId || null,
      isDemo: !!input.isDemo,
    };

    if (existingIndex === -1) {
      plans.unshift(plan);
    } else {
      plans[existingIndex] = plan;
    }
    writeRaw(plans);
    return plan;
  }

  function remove(id) {
    var plans = readRaw().filter(function (p) {
      return p.id !== id;
    });
    writeRaw(plans);
    return plans;
  }

  function rename(id, name) {
    var plans = readRaw();
    var clean = String(name || "").trim().slice(0, 60);
    plans.forEach(function (p) {
      if (p.id === id) {
        p.name = clean || p.name;
        p.updatedAt = nowIso();
      }
    });
    writeRaw(plans);
    return get(id);
  }

  /**
   * Only one plan can be the one being taken to the office, so choosing one
   * clears the flag on the others. Choosing the same one again clears it, which
   * gives a way back out without a separate control.
   */
  function choose(id) {
    var plans = readRaw();
    var wasChosen = false;
    plans.forEach(function (p) {
      if (p.id === id) wasChosen = !!p.chosen;
    });
    plans.forEach(function (p) {
      p.chosen = !wasChosen && p.id === id;
    });
    writeRaw(plans);
    return get(id);
  }

  function chosen() {
    var found = readRaw().filter(function (p) {
      return p.chosen;
    });
    return found.length ? found[0] : null;
  }

  function clear() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

  /**
   * A short, readable name for a new plan, taken from the option it leads with
   * rather than from a number. The first clause usually carries the meaning on
   * its own, so "Improve what you already grow, or add an intercrop" becomes
   * "Improve what you already grow" and "Protected cultivation: polyhouse,
   * mushroom or nursery" becomes "Protected cultivation". Only a name that is
   * still long after that gets cut, and then at a word boundary.
   */
  function shortTitle(title) {
    var text = String(title || "")
      .split(":")[0]
      .split(",")[0]
      .trim();
    if (text.length <= 40) return text;
    var cut = text.slice(0, 40);
    var lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > 16 ? cut.slice(0, lastSpace) : cut).trim();
  }

  function suggestName(options, taken) {
    var takenLower = (taken || []).map(function (n) {
      return String(n).toLowerCase();
    });
    var lead = options && options.length ? options[0] : null;
    var base = lead ? shortTitle(lead.activity ? lead.activity.title : "") : "";
    if (!base) base = "My plan";
    if (base.length > 1) base = base.charAt(0).toUpperCase() + base.slice(1);

    if (takenLower.indexOf(base.toLowerCase()) === -1) return base;
    for (var n = 2; n < 20; n++) {
      var candidate = base + " " + n;
      if (takenLower.indexOf(candidate.toLowerCase()) === -1) return candidate;
    }
    return base + " " + Date.now().toString(36).slice(-3);
  }

  window.MLMP_PLANS = {
    STORAGE_KEY: STORAGE_KEY,
    MAX: MAX,
    list: list,
    get: get,
    upsert: upsert,
    remove: remove,
    rename: rename,
    choose: choose,
    chosen: chosen,
    clear: clear,
    suggestName: suggestName,
  };
})();
