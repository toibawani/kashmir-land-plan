/**
 * My Land, My Plan, Kashmir. Application logic.
 *
 * Depends on the data and service modules loaded before it:
 *   js/regions.js, js/activities.js, js/schemes.js, js/weather.js
 *
 * Prototype only. Recommendations are illustrative, scheme entries carry no
 * amounts or eligibility rules, and nothing here verifies ownership or
 * suitability. Data is stored in this browser only.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "mlmp_draft_v3";
  var LEGACY_KEYS = ["mlmp_draft_v2", "mlmp_draft_v1"];
  var TOTAL_STEPS = 5;

  var REGIONS = window.MLMP_REGIONS;
  var ACTIVITIES = window.MLMP_ACTIVITIES;
  var SCHEMES = window.MLMP_SCHEMES;
  var WEATHER = window.MLMP_WEATHER;
  var QUESTIONS = window.MLMP_QUESTIONS;
  var PLANS = window.MLMP_PLANS;
  var SPEECH = window.MLMP_SPEECH;
  var QR = window.MLMP_QR;
  var OFFLINE = window.MLMP_OFFLINE;
  var FIT = window.MLMP_FIT;
  var OFFICE = window.MLMP_OFFICE;
  var SHARE = window.MLMP_SHARE;
  var OFFICEPACK = window.MLMP_OFFICEPACK;
  var MSG = window.MLMP_MESSAGES;

  /** The four kinds of information this app mixes together. Kept explicit so
   *  a farmer can always tell which one they are looking at. */
  var PROVENANCE = [
    {
      id: "user",
      label: "Your answers",
      body: "What you typed. Stored on this device to build the plan.",
      kind: "user",
    },
    {
      id: "illustrative",
      label: "Illustrative",
      body: "The options, ratings and checklists. Sample logic, not an assessment.",
      kind: "illustrative",
    },
    {
      id: "regional",
      label: "Regional background",
      body: "General information about J&K farming from published sources. Not specific to your plot.",
      kind: "regional",
    },
    {
      id: "weather",
      label: "Live weather",
      body: "From Open-Meteo. For a nearby town, not your field, and only when you are online.",
      kind: "weather",
    },
  ];

  // ---------------------------------------------------------------- State

  function blankData() {
    return {
      district: "",
      village: "",
      size: "",
      unit: "kanal",
      landUse: "",
      water: "",
      terrain: "",
      soil: "none",
      constraint: "",
    };
  }

  var state = {
    step: 1,
    isDemo: false,
    data: blankData(),
    options: [],
    checklist: [],
    interested: {},
    // Which generated questions the farmer has already covered with the
    // officer, keyed by the question id. The ids are stable for a plan, so a
    // tick survives a re-render and a restart; ids that no longer exist are
    // simply ignored when the lists are painted.
    coveredQuestions: {},
    weather: { district: "", query: "", result: null, error: null, status: "idle" },
    weatherPlaceMode: "district",
    weatherCustomPlace: "",
    planReady: false,
    /** The saved plan currently being edited, so saving again updates it. */
    currentPlanId: null,
    currentPlanName: "",
    /** Held from beforeinstallprompt until the farmer asks to install. */
    installPrompt: null,
  };

  // ------------------------------------------------------------- Helpers

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function scrollBehavior() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  }

  function pretty(value) {
    if (value == null || value === "") return "Not given";
    var s = String(value);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function setStatus(id, msg, timeout) {
    var el = $("#" + id);
    if (!el) return;
    if (setStatus.timers === undefined) setStatus.timers = {};
    if (setStatus.timers[id]) clearTimeout(setStatus.timers[id]);
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.textContent = msg;
    el.hidden = false;
    if (timeout !== 0) {
      setStatus.timers[id] = setTimeout(function () {
        el.hidden = true;
      }, timeout || 5000);
    }
  }

  function showScreen(id, opts) {
    opts = opts || {};
    // Moving to another screen stops anything being read out. Without this the
    // voice carries on describing a page the farmer has already left.
    var leaving = $(".screen-active");
    if (leaving && leaving.id !== "screen-" + id && speechAvailable() && SPEECH.speaking()) {
      stopReading();
    }
    $$(".screen").forEach(function (s) {
      s.hidden = true;
      s.classList.remove("screen-active");
    });
    var el = $("#screen-" + id);
    if (!el) return;
    el.hidden = false;
    el.classList.add("screen-active");

    if (history.replaceState) history.replaceState(null, "", "#" + id);

    var heading = $(".screen-title", el) || el.querySelector("h1");
    if (opts.focus !== false && heading) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
    syncNav(id);
  }

  function syncNav(screenId) {
    $$("[data-nav]").forEach(function (a) {
      var isCurrent = a.getAttribute("data-nav") === screenId;
      if (isCurrent) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  // One shared banner for the review state, used on the results screen, the
  // comparison, the plan summary and the office visit card. Sharing one
  // builder is deliberate: the farmer should never have to wonder whether
  // two slightly different wordings mean two different things.
  function reviewBannerHtml(review, extraClass) {
    extraClass = extraClass || "";
    var status = review && review.status ? review.status : "not-reviewed";
    return (
      '<div class="review-card review-' +
      escapeHtml(status) +
      (extraClass ? " " + extraClass : "") +
      '" role="status">' +
      '<p class="review-label">Officer review</p>' +
      "<p>" +
      escapeHtml(review.text) +
      "</p></div>"
    );
  }

  function currentReview() {
    var activities = (state.options || []).map(function (o) {
      return o.activity;
    });
    return ACTIVITIES.reviewFor(activities);
  }

  function fillReviewSlot(id, extraClass) {
    var el = $("#" + id);
    if (!el) return;
    el.hidden = false;
    el.innerHTML = reviewBannerHtml(currentReview(), extraClass);
  }

  function locationContextHtml(opts) {
    opts = opts || {};
    var d = state.data;
    if (!d.district) return "";
    var zone = REGIONS.zoneFor(d.district);
    var info = REGIONS.district(d.district) || {};
    var weatherName = REGIONS.weatherQuery(d.district) || d.district;
    var parts = [];
    parts.push("<h2>Location used for this plan</h2>");
    parts.push('<p class="section-kind"><span class="kind-tag kind-user">Your answers</span> <span class="kind-tag kind-regional">Regional background</span></p>');
    parts.push("<p><strong>District you selected:</strong> " + escapeHtml(d.district) + (d.village ? ", village " + escapeHtml(d.village) : "") + ".</p>");
    if (zone) {
      parts.push(
        "<p><strong>Regional grouping used:</strong> " +
          escapeHtml(zone.label) +
          ". Approximate elevation band for this grouping: " +
          escapeHtml(zone.elevationBand) +
          ".</p>"
      );
    }
    parts.push(
      "<p><strong>Weather, if you check it:</strong> looked up for a nearby town matching <strong>" +
        escapeHtml(weatherName) +
        "</strong>, not for your field. The weather screen shows the place actually matched, and its model elevation.</p>"
    );
    if (info.spans) {
      parts.push('<p class="option-note">' + escapeHtml(info.spans) + "</p>");
    }
    if (opts.adjust) {
      parts.push(
        '<p class="option-note">If the district town is a long way from your village, open weather and name a closer town. The forecast will still be a town grid, not the plot.</p>'
      );
    }
    return parts.join("");
  }

  function updateFormLocationContext() {
    var el = $("#form-location-context");
    if (!el) return;
    if (!state.data.district) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    el.hidden = false;
    el.innerHTML = locationContextHtml({ adjust: false });
  }

  function provenanceLegend(opts) {
    opts = opts || {};
    var items = opts.only
      ? PROVENANCE.filter(function (p) {
          return opts.only.indexOf(p.id) !== -1;
        })
      : PROVENANCE;
    return (
      '<ul class="provenance' +
      (opts.compact ? " provenance-compact" : "") +
      '">' +
      items
        .map(function (p) {
          return (
            '<li class="provenance-item provenance-' +
            p.kind +
            '"><span class="provenance-label">' +
            escapeHtml(p.label) +
            "</span><span class=\"provenance-body\">" +
            escapeHtml(p.body) +
            "</span></li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  // ------------------------------------------------------------- Form nav

  function updateProgress() {
    var pct = (state.step / TOTAL_STEPS) * 100;
    var fill = $("#progress-fill");
    var bar = $("#progress-bar");
    var label = $("#progress-label");
    if (fill) fill.style.width = pct + "%";
    if (bar) bar.setAttribute("aria-valuenow", String(Math.round(pct)));
    if (label) label.textContent = "Step " + state.step + " of " + TOTAL_STEPS;
  }

  function showStep(n, opts) {
    opts = opts || {};
    state.step = n;
    $$(".form-step").forEach(function (fs) {
      fs.hidden = Number(fs.dataset.step) !== n;
    });
    var back = $("#btn-back");
    var next = $("#btn-next");
    var submit = $("#btn-submit");
    if (back) back.hidden = n === 1;
    if (next) next.hidden = n === TOTAL_STEPS;
    if (submit) submit.hidden = n !== TOTAL_STEPS;
    updateProgress();

    var legend = $('.form-step[data-step="' + n + '"] .step-legend');
    if (opts.focus !== false && legend) {
      if (!legend.hasAttribute("tabindex")) legend.setAttribute("tabindex", "-1");
      legend.focus({ preventScroll: true });
    }
  }

  function errorTargets(id) {
    var single = $("#" + id);
    if (single) return [single];
    return $$('input[name="' + id + '"]');
  }

  function clearErrors() {
    $$(".field-error").forEach(function (e) {
      e.hidden = true;
      e.textContent = "";
    });
    $$("[aria-invalid='true']").forEach(function (el) {
      el.removeAttribute("aria-invalid");
    });
    $$("[data-error-link]").forEach(function (el) {
      el.removeAttribute("aria-describedby");
      el.removeAttribute("data-error-link");
    });
  }

  function setError(id, msg) {
    var el = $("#err-" + id);
    if (el) {
      el.textContent = msg;
      el.hidden = false;
    }
    errorTargets(id).forEach(function (field) {
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", "err-" + id);
      field.setAttribute("data-error-link", "true");
    });
  }

  function focusFirstInvalid(id) {
    var target = errorTargets(id)[0];
    if (target && typeof target.focus === "function") {
      target.focus();
      return;
    }
    var msg = $("#err-" + id);
    if (msg) msg.scrollIntoView({ block: "center", behavior: scrollBehavior() });
  }

  function validateStep(step) {
    clearErrors();
    var firstInvalid = null;
    var d = state.data;
    var fail = function (id, msg) {
      setError(id, msg);
      if (!firstInvalid) firstInvalid = id;
    };

    if (step === 1) {
      if (!d.district) fail("district", "Please select a district.");
      if (!d.village || d.village.trim().length < 2) {
        fail("village", "Please enter a village or locality name.");
      }
    }
    if (step === 2) {
      var size = parseFloat(d.size);
      if (!d.size || isNaN(size) || size <= 0) {
        fail("size", "Enter a positive number for plot size.");
      } else if (size > 500) {
        fail("size", "Please check the size. For this prototype use up to 500.");
      }
    }
    if (step === 3) {
      if (!d.landUse) fail("landUse", "Please select current land use.");
      if (!d.water) fail("water", "Please select water access.");
    }
    if (step === 4) {
      if (!d.terrain) fail("terrain", "Please select terrain.");
    }
    if (step === 5) {
      if (!d.constraint) fail("constraint", "Please select the main constraint.");
    }
    return firstInvalid;
  }

  function readFormIntoState() {
    var form = $("#land-form");
    if (!form) return;
    var fd = new FormData(form);
    state.data.district = String(fd.get("district") || "");
    state.data.village = String(fd.get("village") || "").trim();
    state.data.size = String(fd.get("size") || "");
    state.data.unit = String(fd.get("unit") || "kanal");
    state.data.landUse = String(fd.get("landUse") || "");
    state.data.water = String(fd.get("water") || "");
    state.data.terrain = String(fd.get("terrain") || "");
    state.data.soil = String(fd.get("soil") || "none");
    state.data.constraint = String(fd.get("constraint") || "");
  }

  function fillFormFromState() {
    var d = state.data;
    var setVal = function (id, val) {
      var el = $("#" + id);
      if (el) el.value = val || "";
    };
    setVal("district", d.district);
    setVal("village", d.village);
    setVal("size", d.size);
    setVal("unit", d.unit);
    setVal("soil", d.soil);
    var radios = { landUse: d.landUse, water: d.water, terrain: d.terrain, constraint: d.constraint };
    Object.keys(radios).forEach(function (name) {
      $$('input[name="' + name + '"]').forEach(function (r) {
        r.checked = r.value === radios[name];
      });
    });
    var wd = $("#weather-district");
    if (wd && d.district) wd.value = d.district;
    var mode = $("#weather-place-mode");
    if (mode) mode.value = state.weatherPlaceMode || "district";
    var custom = $("#weather-custom-place");
    if (custom) custom.value = state.weatherCustomPlace || "";
    syncWeatherCustomField();
    updateFormLocationContext();
  }

  // ------------------------------------------------------------- Storage

  function saveDraft() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          data: state.data,
          step: state.step,
          isDemo: state.isDemo,
          checklist: state.checklist || [],
          interested: state.interested || {},
          // The covered questions ride with the answers, so a reopened draft
          // still shows what the office already talked through.
          coveredQuestions: state.coveredQuestions || {},
          planReady: !!state.planReady,
          weatherPlaceMode: state.weatherPlaceMode || "district",
          weatherCustomPlace: state.weatherCustomPlace || "",
          // Which saved plan this draft belongs to, so saving again updates
          // that plan instead of adding a duplicate.
          currentPlanId: state.currentPlanId || null,
          currentPlanName: state.currentPlanName || "",
        })
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  function readDraft() {
    var raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (_) {
        return null;
      }
    }
    // Migration: earlier prototype versions used a different key. The plot
    // answers have the same shape, so carry them over rather than losing the
    // work of someone who already filled the form in.
    for (var i = 0; i < LEGACY_KEYS.length; i++) {
      try {
        var legacy = localStorage.getItem(LEGACY_KEYS[i]);
        if (legacy) {
          var parsed = JSON.parse(legacy);
          if (parsed && parsed.data) return parsed;
        }
      } catch (_) {}
    }
    return null;
  }

  function loadDraft() {
    var parsed = readDraft();
    if (!parsed || !parsed.data) return false;
    state.data = Object.assign(blankData(), parsed.data);
    state.step = parsed.step || 1;
    state.isDemo = !!parsed.isDemo;
    state.checklist = Array.isArray(parsed.checklist) ? parsed.checklist : [];
    state.interested = parsed.interested && typeof parsed.interested === "object" ? parsed.interested : {};
    // Only plain yes-marks are kept. Anything shaped otherwise is dropped on
    // the floor instead of trusted, because this map is read on every render.
    state.coveredQuestions =
      parsed.coveredQuestions && typeof parsed.coveredQuestions === "object" ? parsed.coveredQuestions : {};
    state.planReady = !!parsed.planReady;
    state.weatherPlaceMode = parsed.weatherPlaceMode === "custom" ? "custom" : "district";
    state.weatherCustomPlace = parsed.weatherCustomPlace || "";
    state.currentPlanId = parsed.currentPlanId || null;
    state.currentPlanName = parsed.currentPlanName || "";
    return true;
  }

  function clearDraft() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      LEGACY_KEYS.forEach(function (k) {
        localStorage.removeItem(k);
      });
    } catch (_) {}
  }

  function resetPlan() {
    clearDraft();
    state.isDemo = false;
    state.step = 1;
    state.options = [];
    state.checklist = [];
    state.interested = {};
    // Starting over clears the ticks too. They describe a visit about
    // answers that are being thrown away, so keeping them would be a lie.
    state.coveredQuestions = {};
    state.planReady = false;
    state.weatherPlaceMode = "district";
    state.weatherCustomPlace = "";
    state.data = blankData();
    // Starting over abandons the working copy but leaves saved plans alone, so
    // nothing the farmer deliberately saved disappears with it.
    state.currentPlanId = null;
    state.currentPlanName = "";
    state.weather = { district: "", query: "", result: null, error: null, status: "idle" };
    var form = $("#land-form");
    if (form) form.reset();
    fillFormFromState();
    var notice = $("#draft-notice");
    if (notice) notice.hidden = true;
    var openSaved = $("#btn-open-saved-plan");
    if (openSaved) openSaved.hidden = true;
    setStatus("save-status", "");
    renderWeather();
    showStep(1, { focus: false });
    showScreen("form");
  }

  // ------------------------------------------- Recommendation (sample)

  /** Convert the plot size to an approximate kanal figure for coarse banding. */
  function sizeInKanal() {
    var n = parseFloat(state.data.size) || 0;
    var unit = state.data.unit;
    if (unit === "acre") return n * 8;
    if (unit === "hectare") return n * 20;
    if (unit === "marla") return n / 20;
    return n;
  }

  var WATER_LABEL = {
    reliable: "water is reliable",
    seasonal: "water is seasonal",
    limited: "water is limited",
    unknown: "you are not sure about water",
  };
  var TERRAIN_LABEL = {
    flat: "the plot is mostly flat",
    sloped: "the plot is sloped or hilly",
    unknown: "terrain is not known",
  };
  var CONSTRAINT_LABEL = {
    water: "water is your main constraint",
    cost: "cost is your main constraint",
    labour: "labour is your main constraint",
    advice: "access to advice is your main constraint",
    market: "market access is your main constraint",
    unsure: "you are not sure what limits you most",
  };

  /**
   * Sample scoring. It ranks the catalogue against the answers and records a
   * plain reason for every point it awards, so the user can see exactly what
   * drove the suggestion. It is a rule of thumb, not an agronomic model.
   */
  function computeOptions() {
    var d = state.data;
    var zone = REGIONS.zoneFor(d.district);
    var zoneId = zone ? zone.id : null;
    var scores = {};
    var reasons = {};

    ACTIVITIES.ids.forEach(function (id) {
      scores[id] = 0;
      reasons[id] = [];
    });

    function bump(id, pts, reason) {
      if (scores[id] === -999) return;
      scores[id] += pts;
      if (reason) reasons[id].push(reason);
    }

    // Hard gates. An activity that cannot grow in this zone, or that is only
    // listed for particular districts, is excluded outright rather than
    // ranked low.
    ACTIVITIES.ids.forEach(function (id) {
      var a = ACTIVITIES.ALL[id];
      if (zoneId && a.zones.indexOf(zoneId) === -1) scores[id] = -999;
      if (a.districtsOnly && a.districtsOnly.indexOf(d.district) === -1) scores[id] = -999;
    });

    // Zone fit.
    if (zoneId === "valley_temperate") {
      bump("orchard_temp", 4, "your district is in the temperate valley zone, where these crops are already grown");
      bump("intercrop_or_improve", 2, "rice with mustard or fodder is an established pattern in the valley");
      bump("fodder_or_pasture", 1, null);
      bump("protected_cultivation", 1, "cover extends a short growing season");
    } else if (zoneId === "jammu_plains") {
      bump("orchard_subtrop", 4, "your district is in the sub-tropical plains zone, where these species grow");
      bump("kitchen_garden", 1, null);
      bump("fodder_or_pasture", 1, null);
      bump("intercrop_or_improve", 1, "rice with wheat, or maize with wheat, are the usual patterns here");
    } else if (zoneId === "jammu_hills") {
      bump("fodder_or_pasture", 2, "much of the farmland in this zone is rainfed, which suits fodder");
      bump("intercrop_or_improve", 2, "maize with wheat is a usual pattern on rainfed land here");
      bump("orchard_temp", 2, "fruit is grown in the higher parts of this zone");
      bump("orchard_subtrop", 1, null);
    }

    // Saffron is only listed for the districts where it is documented as
    // grown, and it gets the same weight in each of them so the suggestion
    // does not depend on which side of the mountains the district sits.
    var districtInfo = REGIONS.district(d.district);
    if (districtInfo && districtInfo.saffron) {
      bump("saffron_karewa", 4, d.district + " is one of the four districts where saffron is grown");
    }

    // Water.
    if (d.water === "limited" || d.water === "unknown") {
      bump("protected_cultivation", 3, WATER_LABEL[d.water]);
      bump("kitchen_garden", 2, WATER_LABEL[d.water]);
      bump("fodder_or_pasture", 2, WATER_LABEL[d.water]);
      bump("beekeeping", 2, WATER_LABEL[d.water]);
    } else if (d.water === "seasonal") {
      bump("kitchen_garden", 2, WATER_LABEL.seasonal);
      bump("fodder_or_pasture", 2, WATER_LABEL.seasonal);
      bump("orchard_temp", 1, WATER_LABEL.seasonal);
      bump("saffron_karewa", 1, WATER_LABEL.seasonal);
    } else if (d.water === "reliable") {
      bump("orchard_temp", 3, WATER_LABEL.reliable);
      bump("orchard_subtrop", 2, WATER_LABEL.reliable);
      bump("intercrop_or_improve", 2, WATER_LABEL.reliable);
      bump("kitchen_garden", 2, WATER_LABEL.reliable);
    }

    // Terrain.
    if (d.terrain === "sloped") {
      bump("orchard_temp", 2, TERRAIN_LABEL.sloped);
      bump("fodder_or_pasture", 2, TERRAIN_LABEL.sloped);
      bump("beekeeping", 1, TERRAIN_LABEL.sloped);
      bump("protected_cultivation", -1, TERRAIN_LABEL.sloped);
      bump("saffron_karewa", -1, TERRAIN_LABEL.sloped);
    } else if (d.terrain === "flat") {
      bump("kitchen_garden", 2, TERRAIN_LABEL.flat);
      bump("protected_cultivation", 1, TERRAIN_LABEL.flat);
      bump("intercrop_or_improve", 1, null);
      bump("orchard_subtrop", 1, TERRAIN_LABEL.flat);
    }

    // Current land use.
    if (d.landUse === "cultivated" || d.landUse === "partly") {
      bump("intercrop_or_improve", 4, "the plot is already being cultivated");
    } else {
      bump("kitchen_garden", 1, "the plot is largely unused");
      bump("fodder_or_pasture", 1, "the plot is largely unused");
      bump("orchard_temp", 1, "the plot is largely unused");
    }

    // Main constraint.
    var c = CONSTRAINT_LABEL[d.constraint];
    if (d.constraint === "water") {
      bump("protected_cultivation", 2, c);
      bump("beekeeping", 2, c);
      bump("kitchen_garden", 1, c);
    } else if (d.constraint === "cost") {
      bump("kitchen_garden", 2, c);
      bump("fodder_or_pasture", 2, c);
      bump("beekeeping", 1, c);
      bump("intercrop_or_improve", 1, c);
      bump("protected_cultivation", -2, c);
    } else if (d.constraint === "labour") {
      bump("fodder_or_pasture", 2, c);
      bump("orchard_temp", 1, c);
      bump("beekeeping", 1, c);
      bump("protected_cultivation", -1, c);
    } else if (d.constraint === "advice") {
      bump("kitchen_garden", 1, c);
      bump("intercrop_or_improve", 1, c);
    } else if (d.constraint === "market") {
      bump("kitchen_garden", 2, c);
      bump("fodder_or_pasture", 1, c);
      bump("beekeeping", -1, c);
    }

    // Plot size, banded coarsely.
    var kanal = sizeInKanal();
    if (kanal > 0 && kanal < 2) {
      bump("kitchen_garden", 2, "the plot is small");
      bump("protected_cultivation", 1, "the plot is small");
      bump("beekeeping", 1, "the plot is small");
      bump("saffron_karewa", 1, "the plot is small");
      bump("orchard_temp", -1, "the plot is small for a tree block");
      bump("orchard_subtrop", -1, "the plot is small for a tree block");
    } else if (kanal > 10) {
      bump("fodder_or_pasture", 2, "the plot is fairly large");
      bump("orchard_temp", 1, "there is room for a tree block");
      bump("orchard_subtrop", 1, "there is room for a tree block");
    }

    // Rank, keeping catalogue order as a stable tie-break.
    var ranked = ACTIVITIES.ids
      .filter(function (id) {
        return scores[id] > -900;
      })
      .map(function (id, i) {
        return { id: id, score: scores[id], order: i };
      })
      .sort(function (a, b) {
        return b.score - a.score || a.order - b.order;
      })
      .slice(0, 3)
      .map(function (row) {
        return {
          activity: ACTIVITIES.ALL[row.id],
          reasons: reasons[row.id],
          zone: zone,
        };
      });

    state.options = ranked;
    return ranked;
  }

  // ------------------------------------------------------------ Rendering

  function optionReasonList(option) {
    if (!option.reasons.length) return "";
    return (
      '<div class="option-section option-why">' +
      "<h3>Why this came up</h3>" +
      '<p class="section-kind"><span class="kind-tag kind-illustrative">Sample logic</span></p>' +
      "<ul>" +
      option.reasons
        .slice(0, 4)
        .map(function (r) {
          return "<li>" + escapeHtml(r) + "</li>";
        })
        .join("") +
      "</ul>" +
      "</div>"
    );
  }

  function ratingRow(label, value) {
    return (
      '<div class="rating-item"><dt>' +
      escapeHtml(label) +
      "</dt><dd>" +
      escapeHtml(value) +
      "</dd></div>"
    );
  }

  function optionRatings(a) {
    return (
      '<div class="option-section">' +
      "<h3>At a glance</h3>" +
      '<p class="section-kind"><span class="kind-tag kind-illustrative">Illustrative, approximate</span></p>' +
      '<dl class="rating-list">' +
      ratingRow("Water need", a.waterNeed) +
      ratingRow("Effort", a.effort) +
      ratingRow("Relative cost", a.cost) +
      ratingRow("First returns", a.firstReturns) +
      ratingRow("Return potential", a.returnPotential) +
      "</dl>" +
      '<p class="option-note">These five ratings are ordered judgements used to make the options comparable. They are not measured, and they are not a forecast of money or yield.</p>' +
      "</div>"
    );
  }

  function optionZoneNote(option, districtLabel) {
    var a = option.activity;
    var zone = option.zone;
    if (!zone) return "";
    var note = a.zoneNotes ? a.zoneNotes[zone.id] : "";
    var districtNote = a.districtNotes ? a.districtNotes[districtLabel] : "";
    if (!note && !districtNote) return "";
    return (
      '<div class="option-section option-region">' +
      "<h3>Why this might fit your area</h3>" +
      '<p class="section-kind"><span class="kind-tag kind-regional">Regional background</span></p>' +
      (note ? "<p>" + escapeHtml(note) + "</p>" : "") +
      (districtNote ? "<p>" + escapeHtml(districtNote) + "</p>" : "") +
      '<p class="option-note">This describes the zone and the district in general terms. Your plot can differ from the area around it.</p>' +
      "</div>"
    );
  }

  function renderCalendar(a) {
    var months = ACTIVITIES.MONTHS;
    var phases = ACTIVITIES.PHASES;
    var cells = a.calendar
      .map(function (c, i) {
        return (
          '<li class="cal-cell phase-' +
          c.p +
          '"><span class="cal-month">' +
          escapeHtml(months[i]) +
          '</span><span class="cal-phase">' +
          escapeHtml(phases[c.p].short || phases[c.p].label) +
          '</span><span class="cal-detail">' +
          escapeHtml(c.t) +
          "</span></li>"
        );
      })
      .join("");

    var used = Object.keys(phases)
      .filter(function (p) {
        return (
          a.calendar.some(function (c) {
            return c.p === p;
          }) && p !== "quiet"
        );
      })
      .sort(function (x, y) {
        return phases[x].order - phases[y].order;
      })
      .map(function (p) {
        return (
          '<li class="cal-key phase-' +
          p +
          '"><span class="cal-key-swatch" aria-hidden="true"></span>' +
          escapeHtml(phases[p].label) +
          "</li>"
        );
      })
      .join("");

    return (
      '<details class="calendar">' +
      "<summary>Typical year for this activity</summary>" +
      '<p class="section-kind"><span class="kind-tag kind-regional">General guidance</span></p>' +
      '<ul class="calendar-grid">' +
      cells +
      "</ul>" +
      '<ul class="calendar-key">' +
      used +
      "</ul>" +
      '<p class="option-note">Typical windows only. Sowing, care and harvest move with elevation, variety and the year, so treat this as a starting point for a question rather than a schedule.</p>' +
      "</details>"
    );
  }

  function renderResults() {
    var opts = state.options.length ? state.options : computeOptions();
    var d = state.data;

    var strip = $("#summary-strip");
    if (strip) {
      strip.innerHTML =
        '<p class="section-kind"><span class="kind-tag kind-user">Your answers</span></p>' +
        "<strong>What you entered:</strong> " +
        escapeHtml(d.district) +
        ", " +
        escapeHtml(d.village) +
        ". Plot " +
        escapeHtml(d.size) +
        " " +
        escapeHtml(d.unit) +
        ", land " +
        escapeHtml(labelLandUse(d.landUse)) +
        ", water " +
        escapeHtml(labelWater(d.water)) +
        ", terrain " +
        escapeHtml(labelTerrain(d.terrain)) +
        ", main limit: " +
        escapeHtml(labelConstraint(d.constraint)) +
        ".";
    }

    var badge = $("#results-sample-badge");
    if (badge) {
      badge.hidden = false;
      badge.textContent = state.isDemo ? "Sample journey, with sample answers" : "Illustrative options from sample logic";
    }

    var zoneCard = $("#results-zone");
    if (zoneCard) {
      var zone = REGIONS.zoneFor(d.district);
      if (zone) {
        var info = REGIONS.district(d.district) || {};
        zoneCard.hidden = false;
        zoneCard.innerHTML =
          "<h2>" +
          escapeHtml(d.district) +
          ": " +
          escapeHtml(zone.label) +
          "</h2>" +
          '<p class="section-kind"><span class="kind-tag kind-regional">Regional background</span></p>' +
          "<p>" +
          escapeHtml(zone.summary) +
          "</p>" +
          "<dl class=\"rating-list\">" +
          ratingRow("Approximate elevation band", zone.elevationBand) +
          "</dl>" +
          (info.note ? "<p><strong>This district:</strong> " + escapeHtml(info.note) + "</p>" : "") +
          (info.spans ? '<p class="option-note">' + escapeHtml(info.spans) + "</p>" : "") +
          '<p class="option-note">Districts are grouped coarsely here. Elevation and soil change quickly, so what grows well on one side of a village may not suit the other.</p>';
      } else {
        zoneCard.hidden = true;
        zoneCard.innerHTML = "";
      }
    }

    var list = $("#options-list");
    if (!list) return;
    list.innerHTML = opts
      .map(function (option, i) {
        var a = option.activity;
        var isInterested = !!state.interested[a.id];
        return (
          '<article class="option-card data-illustrative' +
          (isInterested ? " is-interested" : "") +
          '" id="opt-' +
          a.id +
          '">' +
          "<h2>" +
          (i + 1) +
          ". " +
          escapeHtml(a.title) +
          "</h2>" +
          '<p class="option-meta"><span class="kind-tag kind-illustrative">Illustrative</span> An option to discuss, not a verified recommendation</p>' +
          '<p class="option-confirm">' +
          escapeHtml(ACTIVITIES.confirmationLine) +
          "</p>" +
          '<div class="option-section">' +
          "<h3>Why it may be worth exploring</h3>" +
          "<p>" +
          escapeHtml(a.why) +
          "</p>" +
          "</div>" +
          optionZoneNote(option, d.district) +
          optionRatings(a) +
          optionReasonList(option) +
          '<div class="option-section">' +
          "<h3>Basic requirements</h3>" +
          "<ul>" +
          a.requirements
            .map(function (r) {
              return "<li>" + escapeHtml(r) + "</li>";
            })
            .join("") +
          "</ul>" +
          "</div>" +
          '<div class="option-section">' +
          "<h3>Main risks or questions to verify</h3>" +
          "<ul>" +
          a.risks
            .map(function (r) {
              return "<li>" + escapeHtml(r) + "</li>";
            })
            .join("") +
          "</ul>" +
          "</div>" +
          '<div class="option-section">' +
          "<h3>What information is missing</h3>" +
          "<p>" +
          escapeHtml(a.missing) +
          "</p>" +
          "</div>" +
          '<div class="option-section">' +
          "<h3>Water, roughly</h3>" +
          "<p>" +
          escapeHtml(a.waterNote) +
          "</p>" +
          '<p class="option-note">Not a water requirement estimate. No litres, no schedules.</p>' +
          "</div>" +
          renderCalendar(a) +
          '<div class="option-actions">' +
          '<button type="button" class="btn btn-secondary btn-toggle" data-interest="' +
          a.id +
          '" aria-pressed="' +
          (isInterested ? "true" : "false") +
          '">' +
          (isInterested ? "Interested, included in your plan" : "I want to follow this up") +
          "</button>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    fillReviewSlot("review-banner");

    var loc = $("#results-location");
    if (loc) {
      loc.hidden = false;
      loc.innerHTML = locationContextHtml({ adjust: true });
    }

    var legend = $("#results-provenance");
    if (legend) legend.innerHTML = provenanceLegend({});

    var nameTag = $("#results-plan-name");
    if (nameTag) {
      if (state.currentPlanId && state.currentPlanName) {
        nameTag.hidden = false;
        // When this plan is the one marked for the office, say so here. A
        // farmer who keeps several plans and opens one should not have to go
        // back to the plans list to remember which one the card will follow.
        var chosenHere = false;
        if (plansAvailable()) {
          var stored = PLANS.get(state.currentPlanId);
          chosenHere = !!stored && !!stored.chosen;
        }
        nameTag.textContent =
          'Saved as "' +
          state.currentPlanName +
          '".' +
          (chosenHere ? " This is the one marked to take to the office." : "") +
          " Saving again updates that plan.";
      } else {
        nameTag.hidden = true;
        nameTag.textContent = "";
      }
    }

    // These three follow the shortlist, so they rebuild whenever the marks or
    // a loaded forecast change.
    renderTimingNote();
    renderMonthView();
    renderQuestions();

    updateInterestedStatus();
  }

  function interestedCount() {
    return Object.keys(state.interested).filter(function (k) {
      return state.interested[k];
    }).length;
  }

  function updateInterestedStatus() {
    var count = $("#interested-status");
    if (!count) return;
    var n = interestedCount();
    if (!n) {
      count.textContent = "Mark any option you want to take to the office. That mark is saved in your plan.";
      return;
    }
    count.textContent =
      n === 1
        ? "1 option marked to follow up. It will be highlighted in your plan summary."
        : n + " options marked to follow up. They will be highlighted in your plan summary.";
  }

  var COMPARE_ROWS = [
    { label: "Water need", get: function (a) { return a.waterNeed; } },
    { label: "Effort", get: function (a) { return a.effort; } },
    { label: "Relative cost", get: function (a) { return a.cost; } },
    { label: "First returns", get: function (a) { return a.firstReturns; } },
    { label: "Potential", get: function (a) { return a.returnPotential; } },
    {
      label: "Terrain",
      get: function (a) {
        var fit = a.terrainFit || [];
        var flat = fit.indexOf("flat") !== -1;
        var sloped = fit.indexOf("sloped") !== -1;
        if (flat && sloped) return "flat or sloped";
        if (flat) return "flat ground";
        if (sloped) return "sloped ground";
        return "not noted";
      },
    },
  ];

  function renderCompare() {
    var opts = state.options;
    var wrap = $("#compare-table-wrap");
    var table = $("#compare-table");
    var stacked = $("#compare-stacked");
    var notes = $("#compare-notes");
    var legend = $("#compare-provenance");
    if (!table || !stacked || !wrap || !opts.length) return;

    if (legend) legend.innerHTML = provenanceLegend({ only: ["illustrative"] });
    fillReviewSlot("compare-review", "compact");

    if (window.matchMedia("(max-width: 700px)").matches) {
      wrap.hidden = true;
      stacked.hidden = false;
      stacked.innerHTML = opts
        .map(function (option) {
          var a = option.activity;
          var isInterested = !!state.interested[a.id];
          return (
            '<article class="stacked-option' +
            (isInterested ? " is-interested" : "") +
            '">' +
            "<h2>" +
            escapeHtml(a.title) +
            "</h2>" +
            (isInterested ? '<p class="summary-marked">You want to follow this up.</p>' : "") +
            "<dl>" +
            COMPARE_ROWS.map(function (r) {
              return "<dt>" + escapeHtml(r.label) + "</dt><dd>" + escapeHtml(pretty(r.get(a))) + "</dd>";
            }).join("") +
            "</dl></article>"
          );
        })
        .join("");
    } else {
      stacked.hidden = true;
      wrap.hidden = false;
      var thead = table.querySelector("thead tr");
      var tbody = table.querySelector("tbody");
      thead.innerHTML =
        '<th scope="col">Option</th>' +
        COMPARE_ROWS.map(function (r) {
          return '<th scope="col">' + escapeHtml(r.label) + "</th>";
        }).join("");
      tbody.innerHTML = opts
        .map(function (option) {
          var a = option.activity;
          var isInterested = !!state.interested[a.id];
          return (
            "<tr>" +
            '<th scope="row">' +
            escapeHtml(a.title) +
            (isInterested ? ' <span class="pill">follow up</span>' : "") +
            "</th>" +
            COMPARE_ROWS.map(function (r) {
              return "<td>" + escapeHtml(pretty(r.get(a))) + "</td>";
            }).join("") +
            "</tr>"
          );
        })
        .join("");
    }

    if (notes) {
      notes.innerHTML =
        "<h2>What to verify for each option</h2>" +
        '<p class="hint">These are questions to ask at the office, not conclusions.</p>' +
        '<ul class="verify-list">' +
        opts
          .map(function (option) {
            var a = option.activity;
            return (
              "<li><strong>" +
              escapeHtml(a.title) +
              "</strong>" +
              "<p>Main risk to check: " +
              escapeHtml((a.risks && a.risks[0]) || "not noted") +
              "</p><p>Still needed: " +
              escapeHtml(a.missing) +
              "</p><p>Water, roughly: " +
              escapeHtml(a.waterNote) +
              "</p></li>"
            );
          })
          .join("") +
        "</ul>" +
        '<p class="option-note">Every rating above is an ordered judgement, not a measurement.</p>';
    }
  }

  function getChecklistItems() {
    var d = state.data;
    var items = [
      "Visit or call the nearest agriculture office or Kisan Khidmat Ghar with your plot details.",
      d.soil === "none"
        ? "Ask how to get a soil test for your plot, and what it involves."
        : "Take your soil test report when you meet the officer and ask for it to be interpreted.",
      "Discuss water access and whether any irrigation or water-saving support applies to your situation.",
      "Ask which of the activity ideas, if any, are realistic for your village and season, and what training is available.",
      "Check the current position on any scheme you were told about. Do not rely on amounts, deadlines or rules from this app.",
    ];
    if (Object.keys(state.interested).some(function (k) { return state.interested[k]; })) {
      items.push("Ask specifically about the options you marked interested in, including what the first year would actually cost you.");
    }
    items.push(
      "Note down market or cooperative options if you plan to sell anything.",
      "Write your questions down before the visit so costs, labour and risks all get covered."
    );
    return items;
  }

  function renderChecklist() {
    var items = getChecklistItems();
    var ul = $("#checklist");
    if (!ul) return;

    state.checklist = items.map(function (text, i) {
      return { text: text, checked: !!(state.checklist[i] && state.checklist[i].checked) };
    });

    ul.innerHTML = state.checklist
      .map(function (item, i) {
        return (
          "<li><input type=\"checkbox\" id=\"chk-" +
          i +
          '" name="chk-' +
          i +
          '"' +
          (item.checked ? " checked" : "") +
          ' /><label for="chk-' +
          i +
          '">' +
          escapeHtml(item.text) +
          "</label></li>"
        );
      })
      .join("");

    $$("#checklist input[type='checkbox']").forEach(function (box, i) {
      box.addEventListener("change", function () {
        state.checklist[i].checked = box.checked;
        saveDraft();
      });
    });
  }

  function schemeHtml(entry, relevant) {
    var s = entry.scheme;
    var links =
      '<a class="scheme-link" href="' +
      escapeHtml(s.url) +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(s.linkLabel) +
      "</a>";
    if (s.extraUrls) {
      links += s.extraUrls
        .map(function (u) {
          return (
            ' <a class="scheme-link" href="' +
            escapeHtml(u.url) +
            '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(u.label) +
            "</a>"
          );
        })
        .join("");
    }
    return (
      "<li" +
      (relevant ? "" : ' class="is-secondary"') +
      ">" +
      // No per-row "relevant" pill: nearly every entry relates to some option,
      // so a repeated pill would carry no signal. The ordering and the section
      // note do that job instead.
      '<p class="scheme-cat">' +
      escapeHtml(s.category) +
      "</p>" +
      "<strong>" +
      escapeHtml(s.title) +
      "</strong>" +
      "<p>" +
      escapeHtml(s.body) +
      "</p>" +
      (s.actions
        ? '<ul class="scheme-actions">' +
          s.actions
            .map(function (a) {
              return "<li>" + escapeHtml(a) + "</li>";
            })
            .join("") +
          "</ul>"
        : "") +
      '<p class="link-line">' +
      links +
      "</p>" +
      '<p class="link-placeholder">' +
      escapeHtml(SCHEMES.CONFIRM_LINE) +
      "</p></li>"
    );
  }

  function renderSchemes() {
    var list = $("#schemes-list");
    if (!list) return;

    var markedIds = Object.keys(state.interested).filter(function (k) {
      return state.interested[k];
    });
    var contextIds = markedIds.length
      ? markedIds
      : state.options.map(function (o) {
          return o.activity.id;
        });

    var entries = SCHEMES.relevantTo(contextIds);
    var primary = entries.filter(function (e) { return e.relevant; });
    var secondary = entries.filter(function (e) { return !e.relevant; });

    var contextNote = $("#schemes-context");
    if (contextNote) {
      contextNote.hidden = false;
      contextNote.textContent =
        (markedIds.length
          ? "Grouped against the " +
            markedIds.length +
            (markedIds.length === 1 ? " option" : " options") +
            " you marked interested in"
          : "Grouped against the options you were shown") +
        ". The grouping says which entries came up for those options, not whether you qualify for anything.";
    }

    list.innerHTML =
      primary.map(function (e) { return schemeHtml(e, true); }).join("") +
      (secondary.length
        ? '<li class="schemes-divider"><strong>Others worth knowing about</strong><p>Not tied to the options above, but commonly asked about.</p></li>' +
          secondary.map(function (e) { return schemeHtml(e, false); }).join("")
        : "");
  }

  function renderSummary() {
    var d = state.data;
    var card = $("#plan-summary");
    if (!card) return;

    fillReviewSlot("summary-review");

    var date = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    var checklist = state.checklist && state.checklist.length
      ? state.checklist
      : getChecklistItems().map(function (text) {
          return { text: text, checked: false };
        });

    var interestedIds = Object.keys(state.interested).filter(function (k) {
      return state.interested[k];
    });

    // The printed and downloaded plans should carry the same detail, otherwise
    // someone who prints the page gets a much thinner plan than someone who
    // downloads it. This block mirrors buildPlanText().
    var zone = REGIONS.zoneFor(d.district);
    var regionHtml = "";
    if (zone) {
      var districtInfo = REGIONS.district(d.district) || {};
      regionHtml =
        "<h3>Regional background</h3>" +
        '<p class="section-kind"><span class="kind-tag kind-regional">Regional background</span></p>' +
        "<p><strong>" +
        escapeHtml(zone.label) +
        ":</strong> " +
        escapeHtml(zone.summary) +
        "</p>" +
        "<ul>" +
        "<li>Approximate elevation band: " +
        escapeHtml(zone.elevationBand) +
        "</li>" +
        "</ul>" +
        (districtInfo.note
          ? "<p><strong>This district:</strong> " + escapeHtml(districtInfo.note) + "</p>"
          : "") +
        (districtInfo.spans
          ? '<p class="summary-note">' + escapeHtml(districtInfo.spans) + "</p>"
          : "") +
        '<p class="summary-note">General information about the area, never about your plot. Districts span more than one zone, and soil and elevation change within a single village.</p>';
    }

    var optsHtml = state.options
      .map(function (option, i) {
        var a = option.activity;
        var isInterested = !!state.interested[a.id];
        var zoneNote = a.zoneNotes && option.zone ? a.zoneNotes[option.zone.id] : "";
        var districtNote = a.districtNotes ? a.districtNotes[d.district] : "";
        var list = function (items) {
          return (
            "<ul>" +
            items
              .map(function (r) {
                return "<li>" + escapeHtml(r) + "</li>";
              })
              .join("") +
            "</ul>"
          );
        };
        return (
          '<li class="summary-option' +
          (isInterested ? " is-interested" : "") +
          '"><h4>' +
          (i + 1) +
          ". " +
          escapeHtml(a.title) +
          "</h4>" +
          (isInterested
            ? '<p class="summary-marked">You want to follow this up.</p>'
            : "") +
          '<p class="section-kind"><span class="kind-tag kind-illustrative">Illustrative</span></p>' +
          '<p class="option-confirm">' +
          escapeHtml(ACTIVITIES.confirmationLine) +
          "</p>" +
          "<p><strong>Why it may be worth exploring.</strong> " +
          escapeHtml(a.why) +
          "</p>" +
          (zoneNote
            ? "<p><strong>Why this might fit your area.</strong> " + escapeHtml(zoneNote) + "</p>"
            : "") +
          (districtNote ? "<p>" + escapeHtml(districtNote) + "</p>" : "") +
          '<ul class="summary-ratings">' +
          '<li>Water need: ' + escapeHtml(a.waterNeed) + "</li>" +
          "<li>Effort: " + escapeHtml(a.effort) + "</li>" +
          "<li>Relative cost: " + escapeHtml(a.cost) + "</li>" +
          "<li>First returns: " + escapeHtml(a.firstReturns) + "</li>" +
          "<li>Return potential: " + escapeHtml(a.returnPotential) + "</li>" +
          "</ul>" +
          '<p class="summary-note">These five ratings are ordered judgements, not measurements, and they are not a forecast of money or yield.</p>' +
          (option.reasons.length
            ? "<p><strong>Why this came up.</strong></p>" + list(option.reasons.slice(0, 4))
            : "") +
          "<p><strong>Basic requirements.</strong></p>" +
          list(a.requirements) +
          "<p><strong>Main risks or questions to verify.</strong></p>" +
          list(a.risks) +
          "<p><strong>What information is missing.</strong> " +
          escapeHtml(a.missing) +
          "</p>" +
          "<p><strong>Water, roughly.</strong> " +
          escapeHtml(a.waterNote) +
          "</p>" +
          '<p class="summary-note">Not a water requirement estimate. No litres, no schedules.</p>' +
          "</li>"
        );
      })
      .join("");

    var weatherBlock = "";
    var r = weatherForPlan();
    if (r) {
      weatherBlock =
        "<h3>Weather at the time this plan was made</h3>" +
        '<p class="section-kind"><span class="kind-tag kind-weather">Live weather</span></p>' +
        "<p>Live data from Open-Meteo for the nearby town <strong>" +
        escapeHtml(r.place.name) +
        "</strong>" +
        (r.place.district && r.place.district !== r.place.name ? ", " + escapeHtml(r.place.district) : "") +
        (r.place.elevation != null
          ? ", model elevation about " + Math.round(r.place.elevation) + " m"
          : "") +
        ", recorded " +
        escapeHtml(r.fetchedLabel) +
        " at " +
        escapeHtml(formatUpdated(r)) +
        ". This is general weather for a town, not for your plot, and it changes.</p>";
    } else if (state.weather.result) {
      weatherBlock =
        "<h3>Weather</h3>" +
        "<p>A forecast was loaded while the plan was about a different district, so it is not shown here. Open the weather screen again to get one for " +
        escapeHtml(state.data.district) +
        ".</p>";
    }

    card.innerHTML =
      "<h2>My Land, My Plan: plan summary</h2>" +
      "<p><strong>Date:</strong> " +
      escapeHtml(date) +
      (state.isDemo ? " (sample journey)" : "") +
      "</p>" +
      '<p class="summary-disclaimer"><strong>Illustrative prototype.</strong> ' +
      escapeHtml(currentReview().text) +
      " Nothing here verifies ownership or suitability, approves a subsidy, or decides scheme eligibility. Confirm everything with the local agriculture office or Kisan Khidmat Ghar.</p>" +
      "<h3>Your plot details</h3>" +
      '<p class="section-kind"><span class="kind-tag kind-user">Your answers</span></p>' +
      "<ul>" +
      "<li>District: " + escapeHtml(d.district) + "</li>" +
      "<li>Village or locality: " + escapeHtml(d.village) + "</li>" +
      "<li>Approximate size: " + escapeHtml(d.size) + " " + escapeHtml(d.unit) + "</li>" +
      "<li>Current use: " + escapeHtml(labelLandUse(d.landUse)) + "</li>" +
      "<li>Water access: " + escapeHtml(labelWater(d.water)) + "</li>" +
      "<li>Terrain: " + escapeHtml(labelTerrain(d.terrain)) + "</li>" +
      "<li>Soil test: " + escapeHtml(labelSoil(d.soil)) + "</li>" +
      "<li>Main constraint: " + escapeHtml(labelConstraint(d.constraint)) + "</li>" +
      "</ul>" +
      regionHtml +
      "<h3>Activities to explore</h3>" +
      '<p class="section-kind"><span class="kind-tag kind-illustrative">Illustrative</span></p>' +
      "<ol class=\"summary-options\">" +
      optsHtml +
      "</ol>" +
      (interestedIds.length
        ? "<p><strong>You marked " +
          interestedIds.length +
          (interestedIds.length === 1 ? " option" : " options") +
          " to follow up.</strong> Take those to the office first.</p>"
        : "<p>No options were marked to follow up. You can go back and mark the ones you want to take to the office.</p>") +
      "<h3>Your next steps</h3>" +
      "<ul class=\"summary-checklist\">" +
      checklist
        .map(function (item) {
          return (
            '<li class="' +
            (item.checked ? "is-done" : "") +
            '">' +
            (item.checked ? "Done" : "To do") +
            ": " +
            escapeHtml(item.text) +
            "</li>"
          );
        })
        .join("") +
      "</ul>" +
      monthSummaryHtml() +
      questionsSummaryHtml() +
      "<h3>Who to contact next</h3>" +
      "<ul>" +
      "<li>Your Kisan Khidmat Ghar or district agriculture office</li>" +
      "<li>The J&K Horticulture Department, if fruit, nuts or saffron is on your list</li>" +
      "<li>A soil testing service, if you do not have a recent report</li>" +
      "</ul>" +
      weatherBlock +
      '<p class="summary-footnote">Generated by the My Land, My Plan prototype. It does not verify ownership, suitability, or eligibility. Scheme details change, so confirm them with the official portal or local office.</p>';

    var legend = $("#summary-provenance");
    if (legend) legend.innerHTML = provenanceLegend({ compact: true });
  }

  /**
   * The weather reading, but only when it belongs to the district the plan is
   * currently about. Without this check, changing the district after loading
   * the forecast would print yesterday's reading for somewhere else.
   */
  function weatherForPlan() {
    var w = state.weather;
    if (!w || !w.result || !w.result.place) return null;
    if (String(w.district || "").toLowerCase() !== String(state.data.district || "").toLowerCase()) {
      return null;
    }
    return w.result;
  }

  function formatUpdated(result) {
    var d = result.fetchedAt instanceof Date ? result.fetchedAt : new Date(result.fetchedAt);
    try {
      return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    } catch (_) {
      return "";
    }
  }

  // -------------------------------------------------------------- Weather

  function setWeatherState(status, error) {
    state.weather.status = status;
    state.weather.error = error || null;
  }

  function renderWeather() {
    var district = state.data.district || ($("#weather-district") || {}).value || "";
    var out = $("#weather-output");
    if (!out) return;

    var w = state.weather;

    if (w.status === "loading") {
      out.innerHTML =
        '<p class="weather-status" role="status">Checking the forecast for ' +
        escapeHtml(w.district || district) +
        ". This needs an internet connection.</p>";
      return;
    }

    if (w.status === "error") {
      var reason = w.error && w.error.reason;
      var detail = (w.error && w.error.message) || "The weather service could not be reached.";
      var hint =
        reason === "not_found"
          ? "The place name could not be found in the weather service's place list. Try another district, or name a nearby town."
          : reason === "offline"
            ? "This device is offline. Weather is the only part that needs the internet. Your land plan, options, checklist and summary still work."
            : "Weather needs an internet connection. Everything else in this plan works without it, so you can carry on and come back.";
      out.innerHTML =
        '<div class="weather-error" role="alert">' +
        "<h2>Weather is not available right now</h2>" +
        // When the device is offline the hint already says so, so the detail
        // line would just repeat it in different words.
        (reason === "offline" ? "" : "<p>" + escapeHtml(detail) + "</p>") +
        "<p>" +
        escapeHtml(hint) +
        "</p>" +
        '<button type="button" class="btn btn-secondary" id="btn-weather-retry">Try again</button>' +
        "</div>";
      var retry = $("#btn-weather-retry");
      if (retry) {
        retry.addEventListener("click", function () {
          loadWeather(w.district || district, true);
        });
      }
      return;
    }

    var r = w.result;
    if (w.status !== "ok" || !r) {
      if (WEATHER.isOffline && WEATHER.isOffline()) {
        out.innerHTML =
          '<div class="weather-error" role="status">' +
          "<h2>Weather needs a connection</h2>" +
          "<p>This device is offline. Weather is the only part of the app that needs the internet. Your land plan, options, checklist and summary still work.</p>" +
          "</div>";
        return;
      }
      out.innerHTML =
        '<p class="weather-status">Choose a district and get the forecast. Weather is the only part of this app that needs the internet.</p>';
      return;
    }

    var cur = r.current;
    var placeLabel =
      r.place.name +
      (r.place.district && r.place.district !== r.place.name ? ", " + r.place.district : "") +
      (r.place.state ? ", " + r.place.state : "");

    out.innerHTML =
      '<div class="weather-head">' +
      "<h2>Weather near " +
      escapeHtml(r.place.name) +
      "</h2>" +
      '<p class="section-kind"><span class="kind-tag kind-weather">Live weather</span></p>' +
      "<p class=\"weather-place\">This is the weather for the nearby town <strong>" +
      escapeHtml(placeLabel) +
      "</strong>, not for your field. Updated " +
      escapeHtml(formatUpdated(r)) +
      ".</p>" +
      (WEATHER.isOffline && WEATHER.isOffline()
        ? '<p class="weather-warn">This reading was stored earlier. The device is offline, so it may be out of date.</p>'
        : "") +
      (r.confidence === "approximate"
        ? '<p class="weather-warn">The weather service matched a place of this name outside Jammu and Kashmir, so check the place name below before reading much into it.</p>'
        : '<p class="weather-ok">Matched inside Jammu and Kashmir from the name you gave.</p>') +
      "</div>" +
      '<ul class="weather-now">' +
      '<li><span class="wn-label">Temperature</span><span class="wn-value">' +
      fmtNumber(cur.temperature, "°C") +
      "</span></li>" +
      '<li><span class="wn-label">Conditions</span><span class="wn-value">' +
      escapeHtml(cur.conditions) +
      "</span></li>" +
      '<li><span class="wn-label">Humidity</span><span class="wn-value">' +
      fmtNumber(cur.humidity, "%") +
      "</span></li>" +
      '<li><span class="wn-label">Rain so far</span><span class="wn-value">' +
      fmtNumber(cur.precipitation, " mm") +
      "</span></li>" +
      '<li><span class="wn-label">Wind</span><span class="wn-value">' +
      fmtNumber(cur.wind, " km/h") +
      "</span></li>" +
      "</ul>" +
      "<h3>Next few days</h3>" +
      '<ul class="weather-days">' +
      r.days
        .map(function (day, i) {
          return (
            '<li class="weather-day">' +
            '<span class="wd-day">' +
            escapeHtml(i === 0 ? "Today" : day.label) +
            "</span>" +
            '<span class="wd-cond">' +
            escapeHtml(day.conditions) +
            "</span>" +
            '<span class="wd-temp">' +
            escapeHtml(fmtRange(day.min, day.max)) +
            "</span>" +
            '<span class="wd-rain">' +
            (day.rainChance != null ? escapeHtml(day.rainChance + "% rain") : "rain chance not given") +
            "</span></li>"
          );
        })
        .join("") +
      "</ul>" +
      "<h3>About this reading</h3>" +
      "<dl class=\"rating-list\">" +
      ratingRow("Name you asked for", r.queryUsed || state.weather.query || "not given") +
      ratingRow("Place matched", placeLabel) +
      ratingRow(
        "Approximate elevation",
        r.place.elevation != null
          ? Math.round(r.place.elevation) + " m, weather model average for this grid cell"
          : "not given"
      ) +
      ratingRow("Coordinates used", r.place.latitude.toFixed(2) + ", " + r.place.longitude.toFixed(2)) +
      "</dl>" +
      '<p class="option-note">The matched place is a town, and the elevation is the average of a wide model grid around it. Your field can sit much higher or lower. This is not a frost warning, an irrigation schedule, or a forecast for the plot. If the town is a long way from your village, name a closer town above and get the forecast again.</p>' +
      '<p class="option-note">' +
      escapeHtml(WEATHER.attribution) +
      "</p>";
  }

  function fmtNumber(value, suffix) {
    if (value == null || value === "") return "not given";
    var n = Number(value);
    if (isNaN(n)) return "not given";
    return (Math.round(n * 10) / 10).toString() + (suffix || "");
  }

  function fmtRange(min, max) {
    var lo = min == null ? null : Math.round(min);
    var hi = max == null ? null : Math.round(max);
    if (lo == null && hi == null) return "not given";
    if (lo == null) return hi + "°C";
    if (hi == null) return lo + "°C";
    return lo + " to " + hi + "°C";
  }

  function weatherQueryFromUi(districtName) {
    var district = (districtName || state.data.district || "").trim();
    if (state.weatherPlaceMode === "custom") {
      var custom = (state.weatherCustomPlace || "").trim();
      if (custom) return custom;
    }
    return REGIONS.weatherQuery(district) || district;
  }

  function loadWeather(districtName, force) {
    var district = (districtName || "").trim();
    if (!district) {
      setWeatherState("error", { reason: "no_district", message: "No district was selected." });
      renderWeather();
      return Promise.resolve();
    }

    if (state.weatherPlaceMode === "custom" && !(state.weatherCustomPlace || "").trim()) {
      setWeatherState("error", {
        reason: "no_district",
        message: "Enter a nearby town name, or switch back to the district town name.",
      });
      renderWeather();
      return Promise.resolve();
    }

    var query = weatherQueryFromUi(district);
    state.weather.district = district;
    state.weather.query = query;
    setWeatherState("loading");
    renderWeather();

    return WEATHER.get(query, force)
      .then(function (result) {
        state.weather.result = result;
        setWeatherState("ok");
        renderWeather();
        saveDraft();
      })
      .catch(function (err) {
        state.weather.result = null;
        setWeatherState("error", err);
        renderWeather();
      });
  }

  // ---------------------------------------------------------- Plan export

  function labelLandUse(v) {
    return { unused: "mostly unused", partly: "partly used", cultivated: "currently cultivated" }[v] || v;
  }
  function labelWater(v) {
    return { reliable: "reliable", seasonal: "seasonal", limited: "limited", unknown: "not sure" }[v] || v;
  }
  function labelTerrain(v) {
    return { flat: "mostly flat", sloped: "sloped or hilly", unknown: "not sure" }[v] || v;
  }
  function labelConstraint(v) {
    return {
      water: "water",
      cost: "cost or investment",
      labour: "labour",
      advice: "access to advice",
      market: "market access",
      unsure: "not sure",
    }[v] || v;
  }
  function labelSoil(v) {
    return { none: "no recent test", done: "recent test available", partial: "partial or old results" }[v] || v;
  }

  /** Build the printable plain text plan from state, not from the DOM. */
  function buildPlanText() {
    var d = state.data;
    var lines = [];
    var date = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

    lines.push("MY LAND, MY PLAN: PLAN SUMMARY");
    lines.push("=".repeat(34));
    lines.push("");
    lines.push("Date: " + date + (state.isDemo ? " (sample journey)" : ""));
    lines.push("");
    lines.push("Review status: " + currentReview().text);
    lines.push("");
    lines.push("Illustrative prototype. Nothing here verifies ownership or suitability,");
    lines.push("approves a subsidy, or decides scheme eligibility. Confirm everything with");
    lines.push("the local agriculture office or your Kisan Khidmat Ghar.");
    lines.push("");
    lines.push("YOUR ANSWERS");
    lines.push("------------");
    lines.push("District: " + (d.district || "not given"));
    lines.push("Village or locality: " + (d.village || "not given"));
    lines.push("Approximate size: " + (d.size || "not given") + " " + d.unit);
    lines.push("Current use: " + labelLandUse(d.landUse));
    lines.push("Water access: " + labelWater(d.water));
    lines.push("Terrain: " + labelTerrain(d.terrain));
    lines.push("Soil test: " + labelSoil(d.soil));
    lines.push("Main constraint: " + labelConstraint(d.constraint));
    lines.push("");

    var zone = REGIONS.zoneFor(d.district);
    if (zone) {
      lines.push("REGIONAL BACKGROUND (general, not plot specific)");
      lines.push("------------------------------------------------");
      lines.push(d.district + " is grouped under: " + zone.label);
      lines.push(zone.summary);
      lines.push("Approximate elevation band: " + zone.elevationBand);
      lines.push("");
      lines.push(
        "General information about the area, never about your plot. Districts span"
      );
      lines.push("more than one zone, and soil and elevation change within a village.");
      lines.push("");

      var info = REGIONS.district(d.district) || {};
      if (info.note) {
        lines.push("This district: " + info.note);
        lines.push("");
      }
    }

    lines.push("ACTIVITIES TO EXPLORE (illustrative)");
    lines.push("------------------------------------");
    state.options.forEach(function (option, i) {
      var a = option.activity;
      var isInterested = !!state.interested[a.id];
      lines.push(
        i + 1 + ". " + a.title + (isInterested ? "   [FOLLOW UP]" : "")
      );
      lines.push("   Illustrative option, not a verified recommendation.");
      lines.push("   " + ACTIVITIES.confirmationLine);
      lines.push("   Why it may be worth exploring: " + a.why);
      var zoneNote = a.zoneNotes ? a.zoneNotes[zone ? zone.id : ""] : "";
      if (zoneNote) lines.push("   Why it might fit your area: " + zoneNote);
      lines.push(
        "   At a glance (approximate): water need " +
          a.waterNeed +
          ", effort " +
          a.effort +
          ", relative cost " +
          a.cost +
          ", first returns " +
          a.firstReturns +
          ", return potential " +
          a.returnPotential
      );
      lines.push(
        "   These five ratings are ordered judgements, not measurements, and they"
      );
      lines.push("   are not a forecast of money or yield.");
      if (option.reasons.length) {
        lines.push("   Why this came up (sample logic):");
        option.reasons.slice(0, 4).forEach(function (r) {
          lines.push("     - " + r);
        });
      }
      lines.push("   Basic requirements:");
      a.requirements.forEach(function (r) {
        lines.push("     - " + r);
      });
      lines.push("   Main risks or questions to verify:");
      a.risks.forEach(function (r) {
        lines.push("     - " + r);
      });
      lines.push("   What information is missing: " + a.missing);
      lines.push("   Water, roughly: " + a.waterNote);
      if (isInterested) {
        lines.push("   Typical year (general guidance, timing shifts with elevation and variety):");
        a.calendar.forEach(function (c, m) {
          lines.push("     " + ACTIVITIES.MONTHS[m] + ": " + ACTIVITIES.PHASES[c.p].label + " - " + c.t);
        });
      }
      lines.push("");
    });

    var marked = Object.keys(state.interested).filter(function (k) {
      return state.interested[k];
    });
    lines.push(
      marked.length
        ? "You marked " + marked.length + (marked.length === 1 ? " option" : " options") + " to follow up. Take those to the office first."
        : "No options were marked to follow up."
    );
    lines.push("");

    var monthIndexNow = new Date().getMonth();
    var monthOptions = chosenOptions();
    if (monthOptions.length) {
      lines.push(ACTIVITIES.MONTHS[monthIndexNow] + " IN THE OPTIONS YOU PICKED");
      lines.push("----------------------------------------");
      monthOptions.forEach(function (o) {
        var cell = o.activity.calendar[monthIndexNow];
        var phase = ACTIVITIES.PHASES[cell.p] || { label: cell.p };
        lines.push(o.activity.title + ": " + phase.label + ", " + cell.t);
      });
      lines.push("General guidance only. Sowing, care and harvest move with elevation,");
      lines.push("variety and the year.");
      lines.push("");
    }

    var planQuestions = currentQuestions();
    if (planQuestions.length) {
      lines.push("QUESTIONS TO ASK AT THE OFFICE (illustrative, from your answers)");
      lines.push("------------------------------------------------------------");
      planQuestions.forEach(function (q, i) {
        var ticked = state.coveredQuestions && state.coveredQuestions[q.id];
        lines.push(i + 1 + ". [" + (ticked ? "x" : " ") + "] " + q.text);
      });
      lines.push(questionCoverCount(planQuestions) + " of " + planQuestions.length + " covered.");
      lines.push("");
      lines.push("These are questions, not answers. No officer has seen or approved them.");
      lines.push("");
    }

    lines.push("YOUR NEXT STEPS");
    lines.push("---------------");
    var checklist = state.checklist && state.checklist.length
      ? state.checklist
      : getChecklistItems().map(function (text) {
          return { text: text, checked: false };
        });
    checklist.forEach(function (item) {
      lines.push("[" + (item.checked ? "x" : " ") + "] " + item.text);
    });
    lines.push("");

    var contextIds = marked.length
      ? marked
      : state.options.map(function (o) {
          return o.activity.id;
        });
    lines.push("SUPPORT TO ASK ABOUT");
    lines.push("--------------------");
    SCHEMES.relevantTo(contextIds).forEach(function (entry) {
      var s = entry.scheme;
      lines.push(s.title + " (" + s.category + ")");
      lines.push("   " + s.body);
      lines.push("   " + s.url);
      lines.push("   " + SCHEMES.CONFIRM_LINE);
      lines.push("");
    });
    lines.push("No amounts, deadlines, eligibility rules or document lists are given here,");
    lines.push("because those change and this prototype cannot verify them.");
    lines.push("");

    var wr = weatherForPlan();
    if (wr) {
      var r = wr;
      lines.push("LIVE WEATHER AT THE TIME THIS PLAN WAS MADE");
      lines.push("-------------------------------------------");
      lines.push(
        r.place.name +
          (r.place.district && r.place.district !== r.place.name ? ", " + r.place.district : "") +
          " on " +
          r.fetchedLabel +
          " at " +
          formatUpdated(r)
      );
      lines.push(
        "Now: " +
          fmtNumber(r.current.temperature, "°C") +
          ", " +
          r.current.conditions +
          ", humidity " +
          fmtNumber(r.current.humidity, "%") +
          ", wind " +
          fmtNumber(r.current.wind, " km/h")
      );
      r.days.forEach(function (day) {
        lines.push(
          "  " +
            day.label +
            ": " +
            day.conditions +
            ", " +
            fmtRange(day.min, day.max) +
            (day.rainChance != null ? ", " + day.rainChance + "% rain" : "")
        );
      });
      if (r.place.elevation != null) {
        lines.push("Model elevation (grid average): about " + Math.round(r.place.elevation) + " m");
      }
      lines.push("General weather for a nearby town, not for your plot, and it changes.");
      lines.push(WEATHER.attribution);
      lines.push("");
    } else {
      lines.push("LIVE WEATHER");
      lines.push("------------");
      lines.push("Not included. Weather was not loaded when this plan was saved.");
      lines.push("");
    }

    lines.push("Generated by the My Land, My Plan prototype.");
    lines.push("It does not verify ownership, suitability, or eligibility.");
    lines.push("");
    return lines.join("\n");
  }

  function downloadPlan(fmt) {
    var date = new Date().toISOString().slice(0, 10);
    var filename;
    var type;
    var text;

    if (fmt === "html") {
      filename = "my-land-my-plan-" + date + ".html";
      type = "text/html;charset=utf-8";
      var summary = $("#plan-summary");
      var styles =
        "body{font-family:Georgia,serif;max-width:44rem;margin:2rem auto;padding:0 1rem;line-height:1.55;color:#1a1f1a}" +
        "h1,h2,h3{font-family:Helvetica,Arial,sans-serif;line-height:1.25}" +
        ".summary-disclaimer{background:#f7f5f0;padding:0.75rem;border-left:0}";
      text =
        "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">" +
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
        "<title>My Land, My Plan, plan summary</title><style>" +
        styles +
        "</style></head><body>" +
        (summary ? summary.innerHTML : "<p>No plan summary was generated.</p>") +
        "</body></html>";
    } else {
      filename = "my-land-my-plan-" + date + ".txt";
      type = "text/plain;charset=utf-8";
      text = buildPlanText();
    }

    triggerDownload(text, filename, type);
    setStatus("copy-status", "Downloaded " + filename + ".");
  }

  function triggerDownload(text, filename, type) {
    var blob = new Blob([text], { type: type });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function downloadVisitCard() {
    var date = new Date().toISOString().slice(0, 10);
    // The reference goes into the filename for the same reason it is printed on
    // the card: two cards downloaded on the same day must not land in the
    // folder with the same name, and a file is matched back to its card by the
    // code, not by the date. The reference is already made of letters, digits
    // and hyphens, so it is safe in a filename on any phone.
    var filename = "my-land-my-plan-office-card-" + currentPlanReference() + "-" + date + ".txt";
    triggerDownload(buildVisitCardText(), filename, "text/plain;charset=utf-8");
    setStatus("visit-status", "Downloaded " + filename + ". Print the page instead if you want it on paper.");
  }

  // ------------------------------------------------------------ Sharing out

  /**
   * The plain object the share module turns into a WhatsApp-sized message.
   * Built from state, the same source as the visit card, so what is shared
   * and what is on screen describe the same plan. The review text and the
   * confirmation line are passed through unchanged: the message must not
   * soften or drop them, because a message is exactly where a farmer is most
   * likely to forward something that looks official.
   */
  function buildShareInput() {
    var d = state.data;
    var questions = currentQuestions().map(function (q) {
      return {
        text: q.text,
        ticked: !!(state.coveredQuestions && state.coveredQuestions[q.id]),
      };
    });
    return {
      reference: currentPlanReference(),
      planName: state.currentPlanName || "",
      dateLabel: formatVisitDate(),
      isDemo: state.isDemo,
      answers: {
        district: d.district || "",
        village: d.village || "",
        size: d.size || "",
        unit: d.unit || "",
        water: labelWater(d.water),
        terrain: labelTerrain(d.terrain),
        constraint: labelConstraint(d.constraint),
      },
      options: visitOptions().map(function (o) {
        return { title: o.activity.title, marked: !!state.interested[o.activity.id] };
      }),
      questions: questions,
      reviewText: currentReview().text,
      confirmLine: ACTIVITIES.confirmationLine,
    };
  }

  function buildShareText() {
    return SHARE && SHARE.build ? SHARE.build(buildShareInput()) : "";
  }

  /**
   * Share the visit card. Two paths, in order of what a farmer's phone
   * actually offers:
   *   1. navigator.share, which opens the system share sheet. On a phone
   *      that is WhatsApp, Messages, email, anything, with no copy step.
   *   2. The clipboard, so the farmer can open WhatsApp and paste. Older
   *      phones and desktop browsers land here.
   * A share sheet can be dismissed as easily as opened, so that is not an
   * error and is not reported as one. Only a real failure is, and it points
   * at the fallbacks that always work: print, or download as text.
   */
  function shareVisitCard() {
    sharePlan("visit-status");
  }

  function sharePlan(statusId) {
    statusId = statusId || "copy-status";
    if (!state.planReady || !state.options.length) {
      setStatus(statusId, "Finish the plot details first, then the plan can be shared.");
      return;
    }
    var text = buildShareText();
    if (!text) {
      setStatus(statusId, "The plan could not be prepared for sharing. Print it or download it as text instead.");
      return;
    }
    if (navigator.share) {
      navigator.share({ title: "My land plan", text: text }).then(
        function () {
          /* dismissed or sent: nothing to say */
        },
        function () {
          // A cancel arrives here too, so fall back quietly to the clipboard
          // rather than shouting about something the farmer meant to do.
          copyShareText(text, statusId);
        }
      );
    } else {
      copyShareText(text, statusId);
    }
  }

  function copyShareText(text, statusId) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          setStatus(statusId, "Copied. Open WhatsApp, paste it into a chat, and send.");
        },
        function () {
          setStatus(statusId, "Could not copy automatically. Use Download as text, then paste that file.");
        }
      );
    } else {
      setStatus(statusId, "This browser will not copy automatically. Use Download as text instead.");
    }
  }

  // ------------------------------------------------------------ Office pack

  /**
   * The plain object the office pack module turns into one message.
   *
   * It is built from state, the same source as the card and the share text, so
   * the message, the printout and the screen describe one plan rather than
   * three drifting copies of it. The review wording and the confirm-locally
   * line are passed through unchanged, because a message is exactly where a
   * farmer is most likely to forward something that looks official.
   */
  function buildOfficePackInput() {
    var d = state.data;
    var options = visitOptions();
    return {
      reference: currentPlanReference(),
      planName: state.currentPlanName || "",
      dateLabel: formatVisitDate(),
      isDemo: state.isDemo,
      reviewText: currentReview().text,
      answers: {
        district: d.district,
        village: d.village,
        size: d.size,
        unit: d.unit,
        landUse: labelLandUse(d.landUse),
        water: labelWater(d.water),
        terrain: labelTerrain(d.terrain),
        soil: labelSoil(d.soil),
        constraint: labelConstraint(d.constraint),
      },
      options: options.map(function (o) {
        return { title: o.activity.title, marked: !!state.interested[o.activity.id] };
      }),
      optionNote: visitOptionNote(options.length, chosenOptions().length),
      questions: currentQuestions().map(function (q) {
        return {
          text: q.text,
          ticked: !!(state.coveredQuestions && state.coveredQuestions[q.id]),
        };
      }),
      expectations: OFFICE && OFFICE.items ? OFFICE.items() : [],
      expectationsClosing: OFFICE && OFFICE.closing ? OFFICE.closing() : "",
      confirmLine: ACTIVITIES.confirmationLine,
    };
  }

  function buildOfficePackText() {
    if (!OFFICEPACK || !OFFICEPACK.build) return "";
    return OFFICEPACK.build(buildOfficePackInput());
  }

  /**
   * Open the pack on the visit screen. It is shown in place rather than on a
   * new screen so a farmer can compare it with the card without losing the
   * page they were on, and the text can be selected by hand if a browser
   * blocks the clipboard.
   */
  function openOfficePack() {
    var panel = $("#office-pack-panel");
    var pre = $("#office-pack-text");
    if (!panel || !pre) return;
    if (!state.planReady || !state.options.length) {
      setStatus("visit-status", "Finish the plot details first, then the office pack can be opened.");
      return;
    }
    pre.textContent = buildOfficePackText();
    panel.hidden = false;
    var wa = $("#btn-pack-whatsapp");
    if (wa && SHARE && SHARE.waUrl) wa.setAttribute("href", SHARE.waUrl(pre.textContent));
    panel.scrollIntoView({ block: "start", behavior: scrollBehavior() });
    setStatus("visit-status", "Office pack ready. Share it, copy it, or print the card.");
  }

  function shareOfficePack() {
    var text = buildOfficePackText();
    if (!text) {
      setStatus("visit-status", "The office pack could not be prepared. Print the card instead.");
      return;
    }
    if (navigator.share) {
      navigator.share({ title: "My land plan office pack", text: text }).then(
        function () {
          /* sent or dismissed: nothing to say */
        },
        function () {
          copyOfficePack(text);
        }
      );
    } else {
      copyOfficePack(text);
    }
  }

  function copyOfficePack(text) {
    text = text || buildOfficePackText();
    if (!text) return;
    var done = function () {
      setStatus("visit-status", "Office pack copied. Paste it into a message and send.");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        if (legacyCopy(text)) done();
        else setStatus("visit-status", "Could not copy automatically. Use Download as text, then share that file.");
      });
    } else if (legacyCopy(text)) {
      done();
    } else {
      setStatus("visit-status", "This browser will not copy automatically. Use Download as text instead.");
    }
  }

  /**
   * The clipboard fallback for browsers without navigator.clipboard. The
   * temporary field is off screen and readonly so a phone keyboard does not
   * open, and it is always removed, including when the copy is refused.
   */
  function legacyCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "readonly");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.left = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (_) {
      ok = false;
    }
    if (area.parentNode) area.parentNode.removeChild(area);
    return ok;
  }

  // ------------------------------------------------------------ Reading out

  /**
   * The options to carry forward: the ones marked, or everything shown when
   * nothing is marked yet. Everything downstream uses this, so the questions,
   * the month view and the office card all talk about the same shortlist.
   */
  function chosenOptions() {
    if (!state.options.length) return [];
    var marked = state.options.filter(function (o) {
      return !!state.interested[o.activity.id];
    });
    return marked.length ? marked : state.options.slice();
  }

  function markedCount() {
    return Object.keys(state.interested).filter(function (k) {
      return state.interested[k];
    }).length;
  }

  function questionsAvailable() {
    return !!(QUESTIONS && QUESTIONS.forPlan);
  }

  function currentQuestions() {
    if (!questionsAvailable() || !state.options.length) return [];
    var hint = WEATHER && WEATHER.timingHint ? WEATHER.timingHint(weatherForPlan()) : null;
    return QUESTIONS.forPlan(state.data, chosenOptions(), {
      zone: REGIONS.zoneFor(state.data.district),
      timingHint: hint,
      max: 7,
    });
  }

  /**
   * A forecast fact, the reason it is only a fact about a town, and the advice
   * to ask rather than act. Deliberately no instruction, because a model grid
   * cannot know a field.
   */
  function timingNoteText(hint) {
    if (!hint) return "";
    var lead;
    if (hint.kind === "rain") {
      lead =
        "The forecast for " + hint.placeName + " puts the chance of rain at about " +
        hint.value + "% around " + hint.dayLabel + ".";
    } else if (hint.kind === "cold") {
      lead =
        "Night temperatures near " + hint.placeName + " are forecast close to " +
        hint.value + hint.unit + " around " + hint.dayLabel + ".";
    } else {
      lead =
        "Daytime temperatures near " + hint.placeName + " are forecast close to " +
        hint.value + hint.unit + " around " + hint.dayLabel + ".";
    }
    return (
      lead +
      " This is a forecast for a town, not for your field, and it changes. Worth asking the officer whether it affects the timing you had in mind."
    );
  }

  function renderTimingNote() {
    var el = $("#timing-note");
    if (!el) return;
    var hint = WEATHER && WEATHER.timingHint ? WEATHER.timingHint(weatherForPlan()) : null;
    var text = timingNoteText(hint);
    if (!text) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    el.hidden = false;
    el.innerHTML =
      "<h2>Something in the forecast</h2>" +
      '<p class="section-kind"><span class="kind-tag kind-weather">Live weather</span></p>' +
      "<p>" +
      escapeHtml(text) +
      "</p>" +
      '<p class="option-note">Shown because a forecast was loaded for this district. It is one more thing to raise at the office, not a plan.</p>';
  }

  /** Which month each option is usually at, using the calendar already shown. */
  function renderMonthView() {
    var el = $("#month-view");
    if (!el) return;
    var options = chosenOptions();
    if (!options.length) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    var monthIndex = new Date().getMonth();
    var monthName = ACTIVITIES.MONTHS[monthIndex];
    var rows = options
      .map(function (o) {
        var cell = o.activity.calendar[monthIndex];
        var phase = ACTIVITIES.PHASES[cell.p] || { label: cell.p };
        return (
          '<li class="month-row">' +
          '<span class="month-option">' +
          escapeHtml(o.activity.title) +
          "</span>" +
          '<span class="month-phase phase-' +
          cell.p +
          '">' +
          escapeHtml(phase.label) +
          ": " +
          escapeHtml(cell.t) +
          "</span></li>"
        );
      })
      .join("");
    el.hidden = false;
    el.innerHTML =
      "<h2>" +
      escapeHtml(monthName) +
      " in the options you picked</h2>" +
      '<p class="section-kind"><span class="kind-tag kind-illustrative">Illustrative</span></p>' +
      '<ul class="month-list">' +
      rows +
      "</ul>" +
      '<p class="option-note">Taken from the typical year shown for each option. Sowing, care and harvest move with elevation, variety and the year, so read this as what the month usually means for that option rather than as something to do now.</p>';
  }

  /** The month view again, in summary form, because the summary is what prints. */
  function monthSummaryHtml() {
    var options = chosenOptions();
    if (!options.length) return "";
    var monthIndex = new Date().getMonth();
    var rows = options
      .map(function (o) {
        var cell = o.activity.calendar[monthIndex];
        var phase = ACTIVITIES.PHASES[cell.p] || { label: cell.p };
        return (
          "<li><strong>" +
          escapeHtml(o.activity.title) +
          ":</strong> " +
          escapeHtml(phase.label + ", " + cell.t) +
          "</li>"
        );
      })
      .join("");
    return (
      "<h3>" +
      escapeHtml(ACTIVITIES.MONTHS[monthIndex]) +
      " in the options you picked</h3>" +
      '<p class="section-kind"><span class="kind-tag kind-illustrative">Illustrative</span></p>' +
      "<ul>" +
      rows +
      "</ul>" +
      '<p class="summary-note">From the typical year recorded for each option. General guidance only: sowing, care and harvest move with elevation, variety and the year.</p>'
    );
  }

  function questionsSummaryHtml() {
    var questions = currentQuestions();
    if (!questions.length) return "";
    return (
      "<h3>Questions to ask at the office</h3>" +
      '<p class="section-kind"><span class="kind-tag kind-illustrative">Illustrative</span></p>' +
      '<p class="summary-note">Written from your answers and the options you marked. They are questions, not answers, and no officer has seen them.</p>' +
      questionsListHtml(questions, { hideAbout: true, ticked: true }) +
      questionCounterHtml(questions)
    );
  }

  function questionsListHtml(questions, opts) {
    opts = opts || {};
    if (!questions.length) return "";
    // opts.checkable paints each question as a real checklist row with a box
    // the farmer can tick during the visit, on the phone and then again with
    // a pen when the card is printed. opts.ticked renders the saved ticks as
    // plain [x] and [ ] marks for the summary, the card and the downloads,
    // where an interactive box would print as nothing.
    var checkable = !!opts.checkable;
    var showTicks = checkable || !!opts.ticked;
    return (
      '<ol class="question-list' + (checkable ? " question-checklist" : "") + '">' +
      questions
        .map(function (q) {
          var ticked = !!(state.coveredQuestions && state.coveredQuestions[q.id]);
          if (checkable) {
            return (
              '<li class="question-item">' +
              '<label class="question-tick">' +
              '<input type="checkbox" data-question-tick="' +
              escapeHtml(q.id) +
              '"' +
              (ticked ? " checked" : "") +
              ' /><span class="question-box" aria-hidden="true"></span>' +
              '<span class="question-text">' +
              escapeHtml(q.text) +
              "</span></label>" +
              (q.about && !opts.hideAbout
                ? '<span class="question-about">About: ' + escapeHtml(q.about) + "</span>"
                : "") +
              "</li>"
            );
          }
          return (
            '<li class="question-item">' +
            '<span class="question-text">' +
            (showTicks ? (ticked ? "[x] " : "[ ] ") : "") +
            escapeHtml(q.text) +
            "</span>" +
            (q.about && !opts.hideAbout
              ? '<span class="question-about">About: ' + escapeHtml(q.about) + "</span>"
              : "") +
            "</li>"
          );
        })
        .join("") +
      "</ol>"
    );
  }

  // The counter under the checklist. "3 of 7 covered" needs no lesson to
  // parse, and it updates as boxes are ticked, so progress is visible while
  // the visit is still happening rather than only after it.
  function questionCoverCount(questions) {
    return questions.filter(function (q) {
      return state.coveredQuestions && state.coveredQuestions[q.id];
    }).length;
  }

  function questionCounterHtml(questions) {
    return (
      '<p class="question-counter" role="status">' +
      escapeHtml(questionCoverCount(questions) + " of " + questions.length + " covered") +
      "</p>"
    );
  }

  function renderQuestions() {
    var el = $("#questions-block");
    if (!el) return;
    var questions = currentQuestions();
    if (!questions.length) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    el.hidden = false;
    // The results screen carries the tickable checklist itself. Tick boxes
    // during the visit, and the ticks follow the same questions into the
    // summary, the visit card and the downloads.
    el.innerHTML =
      "<h2>Questions to ask at the office</h2>" +
      '<p class="section-kind"><span class="kind-tag kind-illustrative">Illustrative</span></p>' +
      "<p>Written from what you entered and from the options you marked. They are questions, not answers, and no officer has seen them.</p>" +
      '<p class="option-note">Tick each one as the officer covers it. The tick is saved on this device and shows on the visit card too.</p>' +
      questionsListHtml(questions, { checkable: true }) +
      questionCounterHtml(questions) +
      '<p class="option-note">Take these to your Kisan Khidmat Ghar or district agriculture office, along with any soil test report you have. The office visit card collects them onto one page.</p>';
  }

  // ------------------------------------------------------------ Reading out

  // ------------------------------------------------------------ Reading out

  // Reading is tap to play, tap to hold, tap to carry on. A smaller Stop sits
  // beside the big button while anything plays, and leaving the screen stops
  // the voice outright. The two big buttons live on different screens and
  // never play at once, so starting one always stops the other and resets it.
  //
  // Which read is active is tracked in activeReadId, not guessed from the
  // voice alone; guessing is how buttons end up saying Stop while nothing is
  // playing. The paused label ("Carry on reading") is what makes the hold
  // state visible to someone who cannot hear the silence.
  var READ_CONTROLS = {
    "btn-read-plan": {
      play: "Read the plan aloud",
      pause: "Pause the reading",
      stop: "btn-read-plan-stop",
      status: "read-plan-status",
      fallback: "read-plan-fallback",
      skip: "read-plan-skip",
      prev: "btn-read-plan-prev",
      next: "btn-read-plan-next",
    },
    "btn-visit-read": {
      play: "Read the card aloud",
      pause: "Pause the reading",
      stop: "btn-visit-read-stop",
      status: "read-visit-status",
      fallback: "read-visit-fallback",
      skip: "read-visit-skip",
      prev: "btn-visit-read-prev",
      next: "btn-visit-read-next",
    },
  };
  var activeReadId = null;

  function speechAvailable() {
    return !!(SPEECH && SPEECH.supported && SPEECH.supported());
  }

  function readPaused() {
    return !!(SPEECH && SPEECH.paused && SPEECH.paused());
  }

  // One renderer for every read button, driven by the voice engine state
  // rather than by optimistic flags set at click time.
  function setReadState(activeId) {
    Object.keys(READ_CONTROLS).forEach(function (id) {
      var c = READ_CONTROLS[id];
      var play = $("#" + id);
      var stop = $("#" + c.stop);
      if (!play) return;
      var isActive = activeId != null && id === activeId && SPEECH.speaking();
      var paused = isActive && readPaused();
      play.setAttribute("aria-pressed", isActive && !paused ? "true" : "false");
      if (isActive && !paused) play.textContent = c.pause;
      else if (isActive && paused) play.textContent = "Carry on reading";
      else play.textContent = c.play;
      // The stop control only exists while its own reading plays, so it can
      // never stop silence or someone else's voice.
      if (stop) stop.hidden = !isActive;
      // The part-to-part controls appear only while a sectioned read plays.
      // A single chunk has no parts to skip between, so they stay hidden then.
      var skip = c.skip ? $("#" + c.skip) : null;
      if (skip) {
        skip.hidden = !(isActive && SPEECH.sectionCount && SPEECH.sectionCount() > 1);
      }
    });
  }

  function readStatusElement(id) {
    var c = READ_CONTROLS[id];
    return c ? $("#" + c.status) : null;
  }

  // The spoken status names the section being read and the count, because
  // "something is playing" on its own is not enough to follow a long plan.
  // The part-to-part buttons are greyed at the ends, so it is obvious when
  // there is nothing further that way.
  function setReadProgress(id, index, total, label) {
    var el = readStatusElement(id);
    if (!el) return;
    el.textContent = "Reading: " + label + " (" + (index + 1) + " of " + total + "). Press Pause to hold it.";
    el.hidden = false;
    var c = READ_CONTROLS[id];
    if (c && c.prev) {
      var prev = $("#" + c.prev);
      var next = $("#" + c.next);
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= total - 1;
    }
  }

  function clearReadProgress(id) {
    var el = readStatusElement(id);
    if (!el) return;
    el.textContent = "";
    el.hidden = true;
  }

  // Move the active reading to the part before or after the one being spoken.
  // The buttons are only reachable while a sectioned read plays, so the guard
  // is belt and braces: a stray tap after it stops does nothing rather than
  // throwing. A jump returns false when it cannot move, and the status line is
  // left as it is so the reader does not think the button silently failed.
  function jumpReadSection(id, delta) {
    if (!activeReadId || activeReadId !== id) return;
    if (!SPEECH.speaking() || !SPEECH.jumpToSection) return;
    var current = SPEECH.currentSection ? SPEECH.currentSection() : -1;
    if (current < 0) return;
    SPEECH.jumpToSection(current + delta);
  }

  function stopReading() {
    // Stopping is safe to call any time, including from a screen change while
    // nothing plays. The guards inside make the no-op genuinely free.
    if (SPEECH.speaking()) SPEECH.stop();
    activeReadId = null;
    setReadState(null);
    Object.keys(READ_CONTROLS).forEach(clearReadProgress);
  }

  function toggleRead(id, sections) {
    if (!READ_CONTROLS[id]) return;
    // Tapping the active button holds or carries on. The voice carries on
    // from the held word rather than starting over.
    if (activeReadId === id && SPEECH.speaking()) {
      if (readPaused()) SPEECH.resume();
      else if (SPEECH.pause) SPEECH.pause();
      else stopReading();
      setReadState(id);
      return;
    }
    // Anything playing from the other screen is stopped first, and then the
    // new text starts. A previous version just stopped and went quiet here,
    // which read as a broken button: tap the card's reader while the plan is
    // playing and nothing seemed to happen at all.
    if (SPEECH.speaking()) stopReading();
    if (!speechAvailable()) {
      var silent = readStatusElement(id);
      if (silent) {
        silent.textContent = "This browser does not offer a reading voice. The text stays on screen, and it can still be printed.";
        silent.hidden = false;
      }
      return;
    }
    if (!sections || !sections.length) {
      var empty = readStatusElement(id);
      if (empty) {
        empty.textContent = "There is nothing to read yet.";
        empty.hidden = false;
      }
      return;
    }
    activeReadId = id;
    setReadState(id);
    SPEECH.speak(sections, {
      onState: function (s) {
        if (activeReadId !== id) return;
        if (s === "paused" || s === "resumed" || s === "speaking") {
          setReadState(id);
          return;
        }
        if (s === "done" || s === "stopped") {
          stopReading();
          return;
        }
        if (s === "unavailable") {
          stopReading();
          var failed = readStatusElement(id);
          if (failed) {
            failed.textContent = "This device could not read it out. The text is still on screen and can be printed.";
            failed.hidden = false;
          }
        }
      },
      onSection: function (index, total, label) {
        if (activeReadId === id) setReadProgress(id, index, total, label);
      },
    });
  }

  // Browsers with no voice never get a dead button. The play controls are
  // swapped for a plain sentence that says so. The sentence lives in the
  // static HTML too, so it shows even before any reading was attempted.
  function initReadButtons() {
    var ok = speechAvailable();
    Object.keys(READ_CONTROLS).forEach(function (id) {
      var c = READ_CONTROLS[id];
      var play = $("#" + id);
      var note = $("#" + c.fallback);
      if (!play) return;
      if (ok) {
        if (note) note.hidden = true;
      } else {
        play.hidden = true;
        var stop = $("#" + c.stop);
        if (stop) stop.hidden = true;
        if (note) note.hidden = false;
      }
    });
  }

  // ---------------------------------------------------------- Reading aloud

  // The plan, cut into named sections so the ear can follow what the eye sees
  // as headings. Each section is read in order, and the interface names the
  // one being read: "Reading: Questions to ask at the office (5 of 7)".
  // Portal addresses are left out on purpose. A spelled-out web address is
  // useful on paper but only noise in a spoken sentence.
  function buildSpokenSections() {
    var d = state.data;
    var sections = [];
    sections.push({
      label: "Your plan summary",
      text:
        "My Land, My Plan. Your plan summary for " + (d.district || "your district") + ". " +
        currentReview().text,
    });
    sections.push({
      label: "What you entered",
      text:
        "You entered " + (d.size || "a plot") + " " + (d.unit || "") + ", " + labelLandUse(d.landUse) +
        ", with " + labelWater(d.water) + " water, " + labelTerrain(d.terrain) + " ground, and " +
        labelConstraint(d.constraint) + " as the main thing holding you back.",
    });

    var options = chosenOptions();
    if (options.length) {
      var optionsText =
        (markedCount()
          ? "You marked " + markedCount() + " of the options to follow up."
          : "No options were marked, so these are all the ones shown.") +
        " ";
      optionsText += options
        .map(function (o, i) {
          return "Option " + (i + 1) + ": " + o.activity.title + ". " + o.activity.why;
        })
        .join(" ");
      sections.push({ label: "Options to explore", text: optionsText });
    }

    var hint = WEATHER && WEATHER.timingHint ? WEATHER.timingHint(weatherForPlan()) : null;
    if (hint) {
      sections.push({ label: "Something in the forecast", text: timingNoteText(hint) });
    }

    var monthIndex = new Date().getMonth();
    if (options.length) {
      var monthText = "In " + ACTIVITIES.MONTHS[monthIndex] + ", the typical year says: ";
      monthText += options
        .map(function (o) {
          var cell = o.activity.calendar[monthIndex];
          var phase = ACTIVITIES.PHASES[cell.p] || { label: cell.p };
          return o.activity.title + ": " + phase.label + ", " + cell.t + ".";
        })
        .join(" ");
      monthText += " That is general guidance only, and it moves with elevation and the year.";
      sections.push({ label: ACTIVITIES.MONTHS[monthIndex] + " in the options you picked", text: monthText });
    }

    var questions = currentQuestions();
    if (questions.length) {
      sections.push({
        label: "Questions to ask at the office",
        text:
          questions
            .map(function (q, i) {
              var wasCovered = state.coveredQuestions && state.coveredQuestions[q.id];
              return (
                "Question " + (i + 1) + (wasCovered ? ", already covered at the office" : "") + ". " + q.text
              );
            })
            .join(" ") +
          (questionCoverCount(questions) > 0
            ? " " + questionCoverCount(questions) + " of " + questions.length + " covered."
            : ""),
      });
    }

    var checklist = state.checklist && state.checklist.length ? state.checklist : [];
    var stepsText = checklist.length
      ? checklist
          .map(function (item) {
            return (item.checked ? "Done: " : "To do: ") + item.text;
          })
          .join(" ")
      : getChecklistItems().join(" ");
    sections.push({ label: "Your next steps", text: stepsText });

    sections.push({
      label: "A last word",
      text: ACTIVITIES.confirmationLine + " This is an illustrative prototype, not an official service.",
    });
    return sections;
  }

  // The office visit card, cut the same way: short sections with the card's
  // own headings, so what the card names in print is what the voice names.
  function buildVisitSections() {
    var d = state.data;
    var options = visitOptions();
    var questions = currentQuestions();
    // The named plan is spoken first for the same reason it leads the printed
    // card and the downloaded file: a farmer with several plans cannot tell one
    // spoken card from another unless the voice says which one this is.
    var heading = "My Land, My Plan. Your office visit card.";
    if (state.currentPlanName) heading += " Plan: " + state.currentPlanName + ".";
    return [
      {
        label: "Office visit card",
        text: heading + " " + currentReview().text,
      },
      {
        label: "What you entered",
        text:
          "District " + (d.district || "not given") + ". Village or locality " + (d.village || "not given") +
          ". About " + (d.size || "not given") + " " + (d.unit || "") + ". Currently " + labelLandUse(d.landUse) +
          ", water " + labelWater(d.water) + ", terrain " + labelTerrain(d.terrain) +
          ", soil test " + labelSoil(d.soil) + ", main constraint " + labelConstraint(d.constraint) + ".",
      },
      {
        label: "Options to discuss",
        // When more options were marked than fit, the card and the download
        // say so in words. The voice must say it too, or a listener who marked
        // five and hears three will assume the app forgot. Marked options are
        // named as such for the same reason. visitOptionNote stays the single
        // source of the overflow words everywhere.
        text: options.length
          ? "Options to discuss, not recommendations. " +
            options
              .map(function (o, i) {
                return (
                  "Option " +
                  (i + 1) +
                  ": " +
                  o.activity.title +
                  (state.interested[o.activity.id] ? ", marked to follow up." : ".")
                );
              })
              .join(" ") +
            (visitOptionNote(options.length, chosenOptions().length)
              ? " " + visitOptionNote(options.length, chosenOptions().length)
              : "")
          : "No options were marked or shown, so there is nothing listed here.",
      },
      {
        label: "Questions to ask",
        // The printed card greys nothing out: a covered question still reads in
        // full, and the counter says how many were covered. The voice mirrors
        // that rather than skipping what was asked: a skipped line would sound
        // like a missing question, while the counter tells a revisiting farmer
        // exactly what the office already talked through.
        text: questions.length
          ? "Questions to ask at the office. " +
            questions
              .map(function (q, i) {
                var wasCovered = state.coveredQuestions && state.coveredQuestions[q.id];
                return (
                  "Question " + (i + 1) + (wasCovered ? ", already covered at the office" : "") + ". " + q.text
                );
              })
              .join(" ") +
            (questionCoverCount(questions) > 0
              ? " " + questionCoverCount(questions) + " of " + questions.length + " covered."
              : "")
          : "No questions were generated.",
      },
      // The "What to expect" panel is on the same screen, so it belongs in the
      // spoken card too. Reading the card aloud and then leaving this panel
      // silent would mean the ear misses what the eye can see. It is guarded,
      // because a missing module must never stop the rest of the card being
      // read.
      OFFICE && OFFICE.plainText
        ? {
            label: OFFICE.heading ? OFFICE.heading() : "What to expect at the office",
            text:
              OFFICE.items().map(function (item, i) {
                return i + 1 + ". " + item;
              }).join(" ") + " " + OFFICE.closing(),
          }
        : null,
      {
        label: "A last word",
        text: ACTIVITIES.confirmationLine + " This card was made by the farmer using a prototype, not by any department.",
      },
      // Drop any section that was turned off, so the reader never sees a gap
      // where a missing module would have been.
    ].filter(Boolean);
  }

  // The plain-text ear version survives for copying, and any older caller
  // that only knows strings. It is the same content as the sections, joined.
  function buildSpokenText() {
    return buildSpokenSections()
      .map(function (s) {
        return s.label + ".\n\n" + s.text;
      })
      .join("\n\n");
  }

  // ------------------------------------------------------------ Visit card

  // A short reference the farmer can quote and the officer can write down.
  // It is a fingerprint of the answers plus the options the farmer marked,
  // made on this device from a tiny hash, so no network or account is needed
  // and the same answers always give the same code on any phone.
  //
  // What it is for: matching a printed card to the saved plan on the device
  // it was made on, and naming the plan in a phone call ("we talked about
  // MLMP-PUL-3K-8F2C"). What it is not: it links nowhere and looks up
  // nothing. An officer with a different phone cannot open the plan from it,
  // and this app must never pretend otherwise.
  function planReferenceFor(data, interested) {
    var marked = Object.keys(interested || {})
      .filter(function (k) {
        return !!interested[k];
      })
      .sort();
    var seed = [
      data.district,
      data.village,
      data.size,
      data.unit,
      data.landUse,
      data.water,
      data.terrain,
      data.soil,
      data.constraint,
      marked.join(","),
    ].join("|");
    // FNV-1a, 32 bits. Small, deterministic, and good enough for a short
    // human code; it is not security, it is a nametag.
    var hash = 0x811c9dc5;
    for (var i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    var alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    var code = "";
    var value = hash;
    for (var n = 0; n < 5; n++) {
      code += alphabet[value % alphabet.length];
      value = Math.floor(value / alphabet.length);
    }
    // Skip the easily misread characters (0, O, 1, I, L) at the source, so
    // the card prints nothing an officer has to guess at over the phone.
    var district = String(data.district || "")
      .replace(/[^A-Za-z]/g, "")
      .slice(0, 3)
      .toUpperCase();
    return "MLMP-" + (district || "JK") + "-" + code.slice(0, 2) + "-" + code.slice(2);
  }

  function currentPlanReference() {
    return planReferenceFor(state.data, state.interested);
  }

  function formatVisitDate() {
    return new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function visitOptions() {
    return chosenOptions().slice(0, 3);
  }

  // The card fits three options on a page. When more are marked, the card
  // must say so in words rather than quietly dropping the rest, because a
  // farmer who marked five and sees three will assume the app forgot.
  function visitOptionNote(count, total) {
    if (total <= count) return "";
    return "Showing the first " + count + " of the " + total + " options marked. The rest are in the plan summary.";
  }

  function buildVisitCard() {
    var d = state.data;
    var options = visitOptions();
    var questions = currentQuestions();

    var answerRows = [
      ["District", d.district || "not given"],
      ["Village or locality", d.village || "not given"],
      ["Approximate size", (d.size || "not given") + " " + (d.unit || "")],
      ["Currently", labelLandUse(d.landUse)],
      ["Water access", labelWater(d.water)],
      ["Terrain", labelTerrain(d.terrain)],
      ["Soil test", labelSoil(d.soil)],
      ["Main constraint", labelConstraint(d.constraint)],
    ];

    var optionsHtml = options.length
      ? "<ol class=\"visit-options\">" +
        options
          .map(function (o) {
            return (
              "<li>" +
              escapeHtml(o.activity.title) +
              (state.interested[o.activity.id] ? ' <span class="visit-flag">marked to follow up</span>' : "") +
              "</li>"
            );
          })
          .join("") +
        "</ol>"
      : "<p>No options were marked or shown, so there is nothing listed here.</p>";

    var supportHtml = (function () {
      var ids = options.length
        ? options.map(function (o) {
            return o.activity.id;
          })
        : state.options.map(function (o) {
            return o.activity.id;
          });
      if (!ids.length) return "";
      var entries = SCHEMES.relevantTo(ids).filter(function (e) {
        return e.relevant;
      });
      if (!entries.length) return "";
      return (
        "<ul class=\"visit-support\">" +
        entries
          .slice(0, 5)
          .map(function (e) {
            return "<li>" + escapeHtml(e.scheme.category) + ": " + escapeHtml(e.scheme.title) + "</li>";
          })
          .join("") +
        "</ul>" +
        '<p class="visit-note">Ask which of these applies to a plot like mine, and what to bring. The app lists no amounts, deadlines or eligibility rules because those change.</p>'
      );
    })();

    var lines = "";
    for (var i = 0; i < 5; i++) lines += '<div class="visit-line"></div>';

    // The review banner here is the same shared banner used on the results
    // screen and the summary, word for word. The visit card is the page an
    // officer actually looks at, so its review state has to be as loud as it
    // is everywhere else, never a quieter paragraph.
    return (
      '<div class="visit-head">' +
      "<h2>My Land, My Plan: office visit card</h2>" +
      // When the card comes from a named saved plan, the name goes at the very
      // top. A farmer who keeps several plans can end up with a stack of
      // printed cards that all read "MLMP-PUL-3K-8F2C", and the code is exactly
      // the thing a farmer cannot tell apart at a glance. The name is the one
      // line they will recognise, so it leads. It is only shown when there is
      // a name, because an unnamed card still works and needs no empty line.
      (state.currentPlanName
        ? '<p class="visit-plan-name">Plan: ' + escapeHtml(state.currentPlanName) + "</p>"
        : "") +
      '<p class="visit-date">Prepared ' + escapeHtml(formatVisitDate()) +
      (state.isDemo ? " from the sample journey" : "") +
      ".</p>" +
      // The reference sits directly under the date, before anything else, so
      // it is the first line of every phone call, letter and file name.
      '<p class="visit-reference">Plan reference: <strong>' + escapeHtml(currentPlanReference()) + "</strong></p>" +
      '<p class="visit-reference-note">Made on this device from your answers. Quote it when you call about this plan.</p>' +
      // The code beside the letters. An officer can point a phone at it instead
      // of typing twelve characters, and the caption keeps it honest: the scan
      // shows the same characters and nothing more. There is no server here
      // and no plan to fetch, and the app must never pretend otherwise.
      '<div class="visit-qr">' +
      '<canvas class="visit-qr-canvas" id="visit-qr-canvas" role="img" aria-label=""></canvas>' +
      '<p class="visit-qr-note">Scan to see the same reference. It carries nothing else.</p>' +
      "</div>" +
      reviewBannerHtml(currentReview()) +
      "</div>" +
      '<div class="visit-section">' +
      "<h3>What I entered</h3>" +
      '<dl class="visit-answers">' +
      answerRows
        .map(function (row) {
          return "<dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(row[1]) + "</dd>";
        })
        .join("") +
      "</dl>" +
      "</div>" +
      '<div class="visit-section break-avoid">' +
      "<h3>Options I want to discuss</h3>" +
      optionsHtml +
      '<p class="visit-note">These are options to discuss, not recommendations. Nothing about them has been checked against my plot.</p>' +
      (visitOptionNote(options.length, chosenOptions().length)
        ? '<p class="visit-note">' + escapeHtml(visitOptionNote(options.length, chosenOptions().length)) + "</p>"
        : "") +
      "</div>" +
      '<div class="visit-section break-avoid">' +
      "<h3>Questions I would like to ask</h3>" +
      (questions.length
        ? questionsListHtml(questions, { hideAbout: true, ticked: true, checkable: true }) +
          questionCounterHtml(questions) +
          '<p class="visit-note no-print">Ticked boxes are saved on this device. Tick the rest with a pen once this is printed.</p>'
        : "<p>No questions were generated.</p>") +
      "</div>" +
      (supportHtml
        ? '<div class="visit-section break-avoid" data-fit-part="support"><h3>Support worth asking about</h3>' + supportHtml + "</div>"
        : "") +
      '<div class="visit-section break-avoid" data-fit-part="notes">' +
      "<h3>Notes from the visit</h3>" +
      '<div class="visit-lines">' +
      lines +
      "</div>" +
      "</div>" +
      '<p class="visit-foot">' +
      escapeHtml(ACTIVITIES.confirmationLine) +
      " This card was made by the farmer using a prototype, not by any department. It is not an official document and it does not establish eligibility for anything." +
      "</p>"
    );
  }

  /** The same card as plain text, for downloading and for reading aloud. */
  function buildVisitCardText() {
    var d = state.data;
    var options = visitOptions();
    var questions = currentQuestions();
    var allMarked = chosenOptions();
    var lines = [];

    lines.push("MY LAND, MY PLAN: OFFICE VISIT CARD");
    lines.push("=".repeat(36));
    lines.push("");
    lines.push("Prepared " + formatVisitDate() + (state.isDemo ? " from the sample journey" : ""));
    lines.push("Plan reference: " + currentPlanReference());
    // The named plan goes here too, for the same reason it leads the printed
    // card: a downloaded file is just as likely to sit in a pile of others.
    if (state.currentPlanName) lines.push("Plan name: " + state.currentPlanName);
    lines.push(currentReview().text);
    lines.push("");
    lines.push("WHAT I ENTERED");
    lines.push("--------------");
    lines.push("District: " + (d.district || "not given"));
    lines.push("Village or locality: " + (d.village || "not given"));
    lines.push("Approximate size: " + (d.size || "not given") + " " + (d.unit || ""));
    lines.push("Currently: " + labelLandUse(d.landUse));
    lines.push("Water access: " + labelWater(d.water));
    lines.push("Terrain: " + labelTerrain(d.terrain));
    lines.push("Soil test: " + labelSoil(d.soil));
    lines.push("Main constraint: " + labelConstraint(d.constraint));
    lines.push("");

    lines.push("OPTIONS I WANT TO DISCUSS");
    lines.push("------------------------");
    if (options.length) {
      options.forEach(function (o, i) {
        lines.push(
          i + 1 + ". " + o.activity.title +
            (state.interested[o.activity.id] ? "   [marked to follow up]" : "")
        );
        lines.push("   An option to discuss, not a recommendation.");
      });
      // The plain text download must carry the same warning as the printed
      // card, or the file and the page will quietly disagree.
      if (visitOptionNote(options.length, allMarked.length)) {
        lines.push(visitOptionNote(options.length, allMarked.length));
      }
    } else {
      lines.push("No options were marked or shown.");
    }
    lines.push("");

    lines.push("QUESTIONS I WOULD LIKE TO ASK");
    lines.push("-----------------------------");
    if (questions.length) {
      questions.forEach(function (q, i) {
        // The tick rides along into the download, so a downloaded card read
        // later still shows what the office already covered.
        var ticked = state.coveredQuestions && state.coveredQuestions[q.id];
        lines.push(i + 1 + ". [" + (ticked ? "x" : " ") + "] " + q.text);
      });
      lines.push(questionCoverCount(questions) + " of " + questions.length + " covered.");
    } else {
      lines.push("No questions were generated.");
    }
    lines.push("");

    lines.push("NOTES FROM THE VISIT");
    lines.push("--------------------");
    lines.push("");
    lines.push("");
    lines.push("");
    lines.push("");
    lines.push("");
    lines.push(ACTIVITIES.confirmationLine);
    lines.push("Made by the farmer using a prototype. Not an official document.");
    // The printed and on-screen card also carry a small scannable code beside
    // the reference. Plain text cannot hold one, so the download says so rather
    // than leaving the farmer to wonder whether the reference alone is enough.
    lines.push("The printed card also shows a scannable code beside the reference. It carries only that reference and nothing else.");
    return lines.join("\n");
  }

  function renderVisitCard() {
    var host = $("#visit-card");
    if (!host) return;
    host.innerHTML = buildVisitCard();
    drawVisitQr();
    renderOfficePanel();
  }

  /**
   * Fill the "what to expect" panel below the card. It is separate from the
   * card itself because it is guidance for the journey, not part of the
   * one-page artefact, and it is rendered from the same module the self test
   * checks for honesty. If the module is missing the screen still works, so a
   * broken panel can never take the card down with it.
   */
  function renderOfficePanel() {
    var host = $("#office-host");
    if (!host) return;
    if (OFFICE && OFFICE.panelHtml) host.innerHTML = OFFICE.panelHtml();
    else host.innerHTML = "";
  }

  /**
   * Draw the code into the canvas the card just built. The reference is drawn
   * fresh on every render rather than saved, so the letters and the code can
   * never disagree. It is drawn after the HTML is in place, because the canvas
   * only exists once it is.
   *
   * The code is meant to be scanned off paper, so it is drawn big enough for a
   * camera and kept in whole pixels to stay crisp when it is printed. If there
   * is no canvas support the letters alone still carry the reference, which is
   * why the note beside it never claims the code is the only way.
   */
  function drawVisitQr() {
    var canvas = $("#visit-qr-canvas");
    if (!canvas || !QR || !QR.draw) return;
    var reference = currentPlanReference();
    // Screen: large enough to scan on a phone. The card is narrow, so the
    // width is capped and the quiet zone is kept by the encoder itself.
    QR.draw(canvas, reference, { pixelSize: 168 });
    var label = QR.describe ? QR.describe(reference) : "A QR code holding the plan reference " + reference;
    canvas.setAttribute("aria-label", label);
  }

  // ------------------------------------------------------------- My plans

  function plansAvailable() {
    return !!(PLANS && PLANS.list);
  }

  function planSnapshot() {
    var zone = REGIONS.zoneFor(state.data.district);
    return {
      id: state.currentPlanId || undefined,
      name: state.currentPlanName || "",
      data: JSON.parse(JSON.stringify(state.data)),
      interested: JSON.parse(JSON.stringify(state.interested)),
      // The covered questions are part of the snapshot for the same reason
      // the answers are: a plan someone printed and took to an office should
      // still say what was covered when it is opened again next month.
      coveredQuestions: JSON.parse(JSON.stringify(state.coveredQuestions || {})),
      // A snapshot of the option ids shown, so a later change to the scoring
      // cannot rewrite a plan someone already printed.
      options: state.options.map(function (o) {
        return { id: o.activity.id };
      }),
      zoneId: zone ? zone.id : null,
      isDemo: state.isDemo,
    };
  }

  function saveCurrentPlan() {
    if (!plansAvailable()) {
      setStatus("copy-status", "This browser blocked local storage, so plans cannot be saved.");
      return null;
    }
    if (!state.planReady || !state.options.length) {
      setStatus("copy-status", "Finish the plot details first, then this can be saved.");
      return null;
    }
    var snapshot = planSnapshot();
    if (!state.currentPlanId) {
      var taken = PLANS.list().map(function (p) {
        return p.name;
      });
      snapshot.name = PLANS.suggestName(chosenOptions(), taken);
    }
    var saved = PLANS.upsert(snapshot);
    if (saved) {
      state.currentPlanId = saved.id;
      state.currentPlanName = saved.name;
    }
    return saved;
  }

  /**
   * Write the covered questions back to the saved plan this draft belongs to.
   *
   * Ticking a question mid-visit updates the working state and the draft, but
   * a draft that was opened from a saved plan has to push those ticks into the
   * plan itself. Otherwise the next time that plan is opened the visit is
   * silently lost, which is exactly the wrong outcome for the one thing a
   * farmer is doing while standing at the counter.
   *
   * Only the covered questions move. The answers, options and reasons in the
   * plan stay frozen, so a card already printed cannot change under the farmer.
   */
  function saveCoveredToSavedPlan() {
    if (!plansAvailable() || !state.currentPlanId) return null;
    var plan = PLANS.get(state.currentPlanId);
    if (!plan) return null;
    PLANS.upsert({
      id: plan.id,
      name: plan.name,
      data: plan.data,
      interested: plan.interested || {},
      coveredQuestions: state.coveredQuestions || {},
      options: plan.options || [],
      zoneId: plan.zoneId || null,
      isDemo: plan.isDemo,
      chosen: plan.chosen,
    });
    return plan.id;
  }

  function planById(id) {
    return PLANS.get(id);
  }

  function activityTitleFor(id) {
    var a = ACTIVITIES.ALL[id];
    return a ? a.title : id;
  }

  /** Titles of the options in a saved plan, marked ones first. */
  function planOptionLines(plan) {
    var ids = (plan.options || []).map(function (o) {
      return o.id;
    });
    var marked = ids.filter(function (id) {
      return plan.interested && plan.interested[id];
    });
    var others = ids.filter(function (id) {
      return marked.indexOf(id) === -1;
    });
    return { marked: marked, others: others, ids: ids };
  }

  function planMonthLine(plan) {
    var ids = planOptionLines(plan);
    var leadId = (ids.marked.length ? ids.marked : ids.ids)[0];
    var activity = leadId ? ACTIVITIES.ALL[leadId] : null;
    if (!activity) return "not available";
    var cell = activity.calendar[new Date().getMonth()];
    var phase = ACTIVITIES.PHASES[cell.p] || { label: cell.p };
    return phase.label + ": " + cell.t;
  }

  function savedDate(iso) {
    if (!iso) return "not recorded";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "not recorded";
    try {
      return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
    } catch (_) {
      return "not recorded";
    }
  }

  function compareRows(plans) {
    var rows = [
      { label: "District and village", value: function (p) { return (p.data.district || "not given") + (p.data.village ? ", " + p.data.village : ""); } },
      { label: "Plot size", value: function (p) { return (p.data.size || "not given") + " " + (p.data.unit || ""); } },
      { label: "Currently", value: function (p) { return labelLandUse(p.data.landUse); } },
      { label: "Water access", value: function (p) { return labelWater(p.data.water); } },
      { label: "Terrain", value: function (p) { return labelTerrain(p.data.terrain); } },
      { label: "Main constraint", value: function (p) { return labelConstraint(p.data.constraint); } },
      { label: "Soil test", value: function (p) { return labelSoil(p.data.soil); } },
      {
        label: "Options to explore",
        value: function (p) {
          var ids = planOptionLines(p);
          if (!ids.ids.length) return "none recorded";
          return ids.ids
            .map(function (id) {
              return activityTitleFor(id) + (p.interested && p.interested[id] ? " (marked)" : "");
            })
            .join("; ");
        },
      },
      { label: "Usually at this time of year", value: planMonthLine },
      { label: "Saved on", value: function (p) { return savedDate(p.updatedAt || p.createdAt); } },
    ];
    return rows;
  }

  function renderPlansList() {
    var host = $("#plans-list");
    var empty = $("#plans-empty");
    if (!host) return;

    if (!plansAvailable()) {
      host.innerHTML = "";
      if (empty) {
        empty.hidden = false;
        empty.innerHTML =
          "<h2>Plans cannot be saved here</h2><p>This browser is blocking local storage, so nothing can be kept between visits. The plan still works on this screen and can be printed or downloaded.</p>";
      }
      return;
    }

    var plans = PLANS.list();
    if (!plans.length) {
      host.innerHTML = "";
      if (empty) {
        empty.hidden = false;
        empty.innerHTML =
          "<h2>No saved plans yet</h2>" +
          "<p>Finish a plan, then use Save this plan on the summary. Saving a second one lets you put them side by side here and decide which to take to the office.</p>";
      }
      return;
    }

    if (empty) {
      empty.hidden = true;
      empty.innerHTML = "";
    }

    host.innerHTML =
      '<h2 class="plans-heading">' +
      plans.length +
      (plans.length === 1 ? " saved plan" : " saved plans") +
      "</h2>" +
      '<ul class="plans-cards">' +
      plans
        .map(function (p) {
          var ids = planOptionLines(p);
          var lead = (ids.marked.length ? ids.marked : ids.ids)[0];
          return (
            '<li class="plan-card' +
            (p.chosen ? " is-chosen" : "") +
            '">' +
            '<h3>' +
            escapeHtml(p.name) +
            (p.chosen ? ' <span class="pill">taking this one to the office</span>' : "") +
            "</h3>" +
            '<p class="plan-meta">' +
            escapeHtml(p.data.district || "district not given") +
            " | " +
            escapeHtml((p.data.size || "size not given") + " " + (p.data.unit || "")) +
            " | saved " +
            escapeHtml(savedDate(p.updatedAt || p.createdAt)) +
            (p.isDemo ? " | sample " : "") +
            "</p>" +
            // The reference printed on a visit card always matches the plan
            // it came from, on the device it came from, so a stack of cards
            // and a stack of saved plans can be paired up later.
            '<p class="plan-reference">Reference: ' +
            escapeHtml(planReferenceFor(p.data || {}, p.interested || {})) +
            "</p>" +
            (lead
              ? '<p class="plan-lead">Leads with ' + escapeHtml(activityTitleFor(lead)) + "</p>"
              : "") +
            '<div class="plan-actions">' +
            '<button type="button" class="btn btn-secondary" data-plan-open="' +
            escapeHtml(p.id) +
            '">Open this plan</button>' +
            '<button type="button" class="btn btn-primary" data-plan-choose="' +
            escapeHtml(p.id) +
            '" aria-pressed="' +
            (p.chosen ? "true" : "false") +
            '">' +
            (p.chosen ? "Taking this one" : "Take this one to the office") +
            "</button>" +
            '<button type="button" class="btn btn-secondary" data-plan-rename="' +
            escapeHtml(p.id) +
            '">Rename</button>' +
            '<button type="button" class="btn btn-quiet" data-plan-remove="' +
            escapeHtml(p.id) +
            '">Delete</button>' +
            "</div></li>"
          );
        })
        .join("") +
      "</ul>";
  }

  function renderPlansCompare() {
    var host = $("#plans-compare");
    if (!host) return;
    if (!plansAvailable()) {
      host.hidden = true;
      return;
    }
    var plans = PLANS.list().slice(0, 3);
    if (plans.length < 2) {
      host.hidden = true;
      host.innerHTML = "";
      return;
    }

    var rows = compareRows(plans);
    var narrow = window.matchMedia("(max-width: 700px)").matches;

    var head =
      "<h2 class=\"plans-heading\">Side by side</h2>" +
      '<p class="section-kind"><span class="kind-tag kind-user">Your answers</span></p>' +
      '<p>Only your own answers and the options recorded with each plan. Nothing here is compared against any standard.</p>';

    if (narrow) {
      host.innerHTML =
        head +
        '<div class="compare-stacked">' +
        plans
          .map(function (p) {
            return (
              '<div class="stacked-option">' +
              "<h3>" +
              escapeHtml(p.name) +
              (p.chosen ? ' <span class="pill">chosen</span>' : "") +
              "</h3>" +
              '<dl class="rating-list">' +
              rows
                .map(function (row) {
                  return ratingRow(row.label, String(row.value(p)));
                })
                .join("") +
              "</dl></div>"
            );
          })
          .join("") +
        "</div>";
    } else {
      host.innerHTML =
        head +
        '<div class="table-wrap">' +
        '<table class="compare-table"><thead><tr><th scope="col">Field</th>' +
        plans
          .map(function (p) {
            return "<th scope=\"col\">" + escapeHtml(p.name) + (p.chosen ? " (chosen)" : "") + "</th>";
          })
          .join("") +
        "</tr></thead><tbody>" +
        rows
          .map(function (row) {
            return (
              '<tr><th scope="row">' +
              escapeHtml(row.label) +
              "</th>" +
              plans
                .map(function (p) {
                  return "<td>" + escapeHtml(String(row.value(p))) + "</td>";
                })
                .join("") +
              "</tr>"
            );
          })
          .join("") +
        "</tbody></table></div>";
    }
    host.hidden = false;
  }

  function renderPlans() {
    renderPlansList();
    renderPlansCompare();
  }

  /** Load a saved plan back into the working state so it can be edited. */
  function openSavedPlan(id) {
    var plan = planById(id);
    if (!plan) return false;
    state.data = Object.assign(blankData(), plan.data);
    state.interested = Object.assign({}, plan.interested || {});
    // A saved plan remembers what the office already covered, so reopening
    // it a week later does not wipe the visit. Unknown ids ride along
    // harmlessly and are ignored at render time.
    state.coveredQuestions = Object.assign({}, plan.coveredQuestions || {});
    state.currentPlanId = plan.id;
    state.currentPlanName = plan.name;
    state.isDemo = !!plan.isDemo;
    state.checklist = [];
    state.weather = { district: "", query: "", result: null, error: null, status: "idle" };
    fillFormFromState();
    updateFormLocationContext();
    computeOptions();
    state.planReady = true;
    // If the option ids recorded with the plan are no longer in the catalogue,
    // the plan still opens; it just cannot mark anything that has gone.
    var known = {};
    ACTIVITIES.ids.forEach(function (x) {
      known[x] = true;
    });
    Object.keys(state.interested).forEach(function (x) {
      if (!known[x]) delete state.interested[x];
    });
    renderResults();
    showScreen("results");
    saveDraft();
    return true;
  }

  // --------------------------------------------------------------- Events

  function goHome() {
    showScreen("home");
  }

  function startPlan() {
    var hadDraft = loadDraft();
    fillFormFromState();
    var resumeStep = Math.min(Math.max(Number(state.step) || 1, 1), TOTAL_STEPS);
    showStep(resumeStep, { focus: false });
    showScreen("form", { focus: false });

    var notice = $("#draft-notice");
    var noticeText = $("#draft-notice-text");
    var openSaved = $("#btn-open-saved-plan");
    if (notice) {
      notice.hidden = !hadDraft;
      if (hadDraft && noticeText) {
        if (state.isDemo) {
          noticeText.textContent =
            "These answers are sample data from the demo. Choose Start over to clear them.";
        } else if (state.planReady) {
          noticeText.textContent =
            "A saved plan is on this device. Continue editing these answers, open the saved options, or start over.";
        } else {
          noticeText.textContent =
            "Your saved draft was restored. Continue where you left off, or start over.";
        }
      }
    }
    if (openSaved) openSaved.hidden = !(hadDraft && state.planReady);
  }

  function loadDemo() {
    state.isDemo = true;
    state.checklist = [];
    state.interested = {};
    state.data = {
      district: "Pulwama",
      village: "Tral (sample)",
      size: "3",
      unit: "kanal",
      landUse: "unused",
      water: "seasonal",
      terrain: "flat",
      soil: "none",
      constraint: "water",
    };
    state.step = 1;
    fillFormFromState();
    computeOptions();
    state.planReady = true;
    renderResults();
    showScreen("results");
    saveDraft();
  }

  function toggleInterested(id) {
    state.interested[id] = !state.interested[id];
    if (!state.interested[id]) delete state.interested[id];
    saveDraft();
    var on = !!state.interested[id];
    var btn = $('[data-interest="' + id + '"]');
    if (btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = on ? "Interested, included in your plan" : "I want to follow this up";
    }
    var card = $("#opt-" + id);
    if (card) {
      if (on) card.classList.add("is-interested");
      else card.classList.remove("is-interested");
    }
    updateInterestedStatus();
    // The questions, the month view and the forecast note all follow the
    // shortlist, so they have to be rebuilt when a mark changes.
    renderTimingNote();
    renderMonthView();
    renderQuestions();
  }

  function confirmStartOver() {
    var ok = window.confirm(
      "Start over? This clears the answers and the saved draft on this device. Nothing else is deleted."
    );
    if (ok) resetPlan();
  }

  function syncWeatherCustomField() {
    var wrap = $("#weather-custom-wrap");
    var mode = $("#weather-place-mode");
    if (!wrap) return;
    var custom = mode && mode.value === "custom";
    wrap.hidden = !custom;
  }

  function setAboutReviewStatus() {
    var el = $("#about-review-status");
    if (!el) return;
    var review = ACTIVITIES.reviewFor(
      ACTIVITIES.ids.map(function (id) {
        return ACTIVITIES.ALL[id];
      })
    );
    el.innerHTML =
      '<strong>Current catalogue status.</strong> ' + escapeHtml(review.text);
  }

  /**
   * The language switcher. It appears only when more than one language is
   * marked ready by a translator. With English alone, as it ships, the
   * control stays hidden: a switcher that offers one choice is noise, and
   * the honest state of the app today is English only. The strings painted
   * here are the same English already in the markup, so turning a language
   * on later changes the words and nothing else.
   */
  function initLanguage() {
    if (!MSG) return;
    var wrap = $("#lang-switch");
    var select = $("#lang-select");
    var langs = MSG.available();
    if (wrap && select && langs.length > 1) {
      wrap.hidden = false;
      select.innerHTML = langs
        .map(function (l) {
          var sel = l.code === MSG.get() ? " selected" : "";
          return '<option value="' + escapeHtml(l.code) + '"' + sel + ">" + escapeHtml(l.label) + "</option>";
        })
        .join("");
      select.addEventListener("change", function () {
        MSG.set(select.value);
        MSG.apply();
        if (MSG.dir(select.value) === "rtl") {
          document.documentElement.setAttribute("dir", "rtl");
        } else {
          document.documentElement.removeAttribute("dir");
        }
        document.documentElement.setAttribute("lang", select.value);
      });
    }
    // Paint the critical-path strings. In English this is a no-op on screen
    // (the markup already holds the same words), but it keeps the markup and
    // the module in step, so a translator's work shows up with no code change.
    MSG.apply();
  }

  /**
   * The strip at the top says the short version. The panel on the home page
   * says the whole answer, listing what still works beside the one thing that
   * does not. Both read the same module, so they can never disagree about
   * which part of the app needs a connection.
   */
  function isDeviceOffline() {
    if (OFFLINE && OFFLINE.isOffline) return OFFLINE.isOffline();
    if (WEATHER && WEATHER.isOffline) return WEATHER.isOffline();
    return navigator.onLine === false;
  }

  function updateOfflineBanner() {
    var banner = $("#offline-banner");
    var offline = isDeviceOffline();
    if (banner) {
      if (OFFLINE && OFFLINE.notice) {
        banner.textContent = OFFLINE.notice(offline);
      }
      banner.hidden = !offline;
    }
    renderOfflinePanel(offline);
  }

  function renderOfflinePanel(offline) {
    var host = $("#offline-panel-host");
    if (!host) return;
    if (OFFLINE && OFFLINE.panelHtml) {
      host.innerHTML = OFFLINE.panelHtml(offline);
    }
  }

  /**
   * The add to home screen path. Chrome and Android offer a real install
   * prompt and it is held here until it is asked for, because prompting on
   * arrival is exactly the kind of nagging this app avoids. Where there is no
   * prompt event, most often Safari, the written instruction stays visible
   * instead of a dead button.
   */
  function initInstall() {
    var button = $("#btn-install");
    var hint = $("#install-hint");

    function showHintOnly() {
      if (button) button.hidden = true;
      if (hint) hint.hidden = false;
    }

    // Already installed: say nothing about installing.
    var standalone = false;
    try {
      standalone = window.matchMedia("(display-mode: standalone)").matches;
    } catch (_) {}
    if (standalone) {
      if (button) button.hidden = true;
      if (hint) hint.hidden = true;
      return;
    }

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      state.installPrompt = e;
      if (button) button.hidden = false;
      if (hint) hint.hidden = true;
    });

    if (button) {
      button.addEventListener("click", function () {
        var promptEvent = state.installPrompt;
        state.installPrompt = null;
        if (!promptEvent || typeof promptEvent.prompt !== "function") {
          showHintOnly();
          return;
        }
        promptEvent.prompt();
        button.hidden = true;
        if (hint) hint.hidden = false;
      });
    }

    window.addEventListener("appinstalled", function () {
      state.installPrompt = null;
      if (button) button.hidden = true;
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol === "file:") return;
    navigator.serviceWorker.register("sw.js").catch(function () {
      // Installability is optional. The app still works from index.html.
    });
  }

  function bind() {
    $("#btn-start") && $("#btn-start").addEventListener("click", startPlan);
    $("#btn-demo") && $("#btn-demo").addEventListener("click", loadDemo);
    $("#btn-about-home") && $("#btn-about-home").addEventListener("click", goHome);
    $("#logo-link") &&
      $("#logo-link").addEventListener("click", function (e) {
        e.preventDefault();
        goHome();
      });

    $("#btn-next") &&
      $("#btn-next").addEventListener("click", function () {
        readFormIntoState();
        var firstInvalid = validateStep(state.step);
        if (firstInvalid) {
          focusFirstInvalid(firstInvalid);
          return;
        }
        if (state.step < TOTAL_STEPS) showStep(state.step + 1);
        saveDraft();
      });

    $("#btn-back") &&
      $("#btn-back").addEventListener("click", function () {
        readFormIntoState();
        if (state.step > 1) showStep(state.step - 1);
      });

    $("#land-form") &&
      $("#land-form").addEventListener("submit", function (e) {
        e.preventDefault();
        readFormIntoState();
        var firstInvalid = validateStep(TOTAL_STEPS);
        if (firstInvalid) {
          focusFirstInvalid(firstInvalid);
          return;
        }
        computeOptions();
        // The plan is finished, so reset the wizard position. A saved step
        // then only ever means "this is where the farmer stopped", which is
        // what makes resuming land on the right screen.
        state.step = 1;
        state.planReady = true;
        saveDraft();
        renderResults();
        showScreen("results");
      });

    $("#btn-save-draft") &&
      $("#btn-save-draft").addEventListener("click", function () {
        readFormIntoState();
        var ok = saveDraft();
        setStatus(
          "save-status",
          ok
            ? "Draft saved on this device. Nothing was sent anywhere."
            : "This browser blocked local storage, so the draft could not be saved."
        );
      });

    $("#btn-reset-form") && $("#btn-reset-form").addEventListener("click", confirmStartOver);
    $("#btn-reset-results") && $("#btn-reset-results").addEventListener("click", confirmStartOver);
    $("#btn-open-saved-plan") &&
      $("#btn-open-saved-plan").addEventListener("click", function () {
        if (!state.options.length) computeOptions();
        state.planReady = true;
        renderResults();
        showScreen("results");
      });

    $("#btn-download-text") &&
      $("#btn-download-text").addEventListener("click", function () {
        downloadPlan("txt");
      });
    $("#btn-download-html") &&
      $("#btn-download-html").addEventListener("click", function () {
        downloadPlan("html");
      });

    $("#btn-edit") &&
      $("#btn-edit").addEventListener("click", function () {
        fillFormFromState();
        showStep(1);
        showScreen("form");
      });

    $("#btn-compare") &&
      $("#btn-compare").addEventListener("click", function () {
        renderCompare();
        showScreen("compare");
      });

    var narrowQuery = window.matchMedia("(max-width: 700px)");
    if (narrowQuery.addEventListener) {
      narrowQuery.addEventListener("change", function () {
        var el = $("#screen-compare");
        if (el && el.classList.contains("screen-active")) renderCompare();
        // The saved-plans comparison picks its own shape (table or stacked)
        // at render time, so a rotated phone gets the right shape here too.
        var plansEl = $("#screen-plans");
        if (plansEl && plansEl.classList.contains("screen-active")) renderPlans();
      });
    } else if (narrowQuery.addListener) {
      // Older browsers only know addListener. Same re-render, older name.
      narrowQuery.addListener(function () {
        var el = $("#screen-compare");
        if (el && el.classList.contains("screen-active")) renderCompare();
        var plansEl = $("#screen-plans");
        if (plansEl && plansEl.classList.contains("screen-active")) renderPlans();
      });
    }

    $("#btn-back-results") && $("#btn-back-results").addEventListener("click", function () { showScreen("results"); });
    $("#btn-next-steps") &&
      $("#btn-next-steps").addEventListener("click", function () {
        renderChecklist();
        renderSchemes();
        showScreen("next");
      });
    $("#btn-back-compare") && $("#btn-back-compare").addEventListener("click", function () { showScreen("compare"); });

    $("#btn-save-plan") &&
      $("#btn-save-plan").addEventListener("click", function () {
        renderSummary();
        saveDraft();
        showScreen("summary");
      });

    $("#btn-print") && $("#btn-print").addEventListener("click", function () { window.print(); });

    $("#btn-copy") &&
      $("#btn-copy").addEventListener("click", function () {
        var text = buildPlanText();
        var done = function (msg) {
          setStatus("copy-status", msg);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () {
              done("Plan copied to the clipboard.");
            },
            function () {
              done("Could not copy automatically. Use Download instead, or select the text and copy it.");
            }
          );
        } else {
          done("This browser will not copy automatically. Use Download instead.");
        }
      });
    $("#btn-share-summary") &&
      $("#btn-share-summary").addEventListener("click", function () {
        sharePlan("copy-status");
      });

    $("#btn-done") && $("#btn-done").addEventListener("click", goHome);
    $("#btn-summary-back") &&
      $("#btn-summary-back").addEventListener("click", function () {
        renderChecklist();
        renderSchemes();
        showScreen("next");
      });

    // ---- Office visit card and my plans

    function openVisitCard() {
      if (!state.planReady || !state.options.length) {
        setStatus("copy-status", "Finish the plot details first, then the card can be made.");
        return;
      }
      setVisitMode(false);
      var packPanel = $("#office-pack-panel");
      if (packPanel) packPanel.hidden = true;
      renderVisitCard();
      showScreen("visit");
    }

    /**
     * Visit mode. Standing in front of an officer, the only things worth having
     * on the screen are the card, the tickable questions and the reading
     * controls. Everything else, the intro paragraph, the download button, the
     * saved-plans buttons, the guidance panel, is chrome for a different moment.
     *
     * The toggle only adds a class to the screen and flips a couple of buttons.
     * The nodes stay in place, so leaving visit mode restores the exact same
     * screen with no re-render and nothing lost. That matters because a farmer
     * may switch in and out of it while talking to an officer, and a re-render
     * would reset a scrolled position or a ticked question at the wrong moment.
     */
    function setVisitMode(on) {
      var screen = $("#screen-visit");
      if (!screen) return;
      screen.classList.toggle("is-visit-mode", !!on);
      var onBtn = $("#btn-visit-mode");
      if (onBtn) onBtn.setAttribute("aria-pressed", on ? "true" : "false");
      var exitRow = $("#visit-mode-exit-row");
      if (exitRow) exitRow.hidden = !on;
      var hint = $("#visit-mode-hint");
      if (hint) hint.hidden = !!on;
      // The reading controls stay usable in visit mode, so the status line and
      // the stop button must not be swept away by the hiding rule. They are
      // outside the visit-mode-hide markers already, so nothing to do here, but
      // the screen is scrolled to the top so the card is the first thing seen.
      if (on) {
        window.scrollTo({ top: 0, behavior: scrollBehavior() });
        // Moving focus with the keyboard is the one thing the class toggle
        // cannot do. When the toggle button is about to be hidden, focus would
        // otherwise fall back to <body> and a keyboard or screen-reader user
        // would lose their place with no announcement. Focus lands on the card
        // instead, which is the whole reason the mode exists, so the next key
        // press acts on the card. When the toggle stays visible, it keeps focus
        // so the person can turn the mode straight back off.
        var card = $("#visit-card");
        if (card && card.querySelector) card.setAttribute("tabindex", "-1");
        if (card) card.focus({ preventScroll: true });
      } else if (onBtn) {
        onBtn.focus({ preventScroll: true });
      }
    }

    function visitModeOn() {
      var screen = $("#screen-visit");
      return !!screen && screen.classList.contains("is-visit-mode");
    }

    function openPlans() {
      renderPlans();
      showScreen("plans");
    }

    $("#btn-visit-card") && $("#btn-visit-card").addEventListener("click", openVisitCard);
    // The card is the outcome of the whole app, so it is reachable straight
    // from the options rather than only after the summary. One less step in
    // the moment a farmer actually decides to go to the office.
    $("#btn-results-visit") && $("#btn-results-visit").addEventListener("click", openVisitCard);
    $("#btn-visit-plans") && $("#btn-visit-plans").addEventListener("click", openPlans);
    $("#btn-results-plans") && $("#btn-results-plans").addEventListener("click", openPlans);
    $("#btn-plans-visit") && $("#btn-plans-visit").addEventListener("click", openVisitCard);
    $("#btn-visit-back") &&
      $("#btn-visit-back").addEventListener("click", function () {
        renderSummary();
        showScreen("summary");
      });
    $("#btn-plans-back") &&
      $("#btn-plans-back").addEventListener("click", function () {
        if (state.planReady && state.options.length) showScreen("results");
        else showScreen("home");
      });
    $("#btn-visit-print") && $("#btn-visit-print").addEventListener("click", function () {
      // Trim the card to one page if it measured as too tall, then print, then
      // put everything back. If there is no fitter the card still prints as it
      // is, so a missing module can never leave a farmer with a dead button.
      if (FIT && FIT.prepareForPrint) FIT.prepareForPrint();
      window.print();
    });
    // The one-page fit must not depend on the Print button being the way in. A
    // farmer printing from the browser menu or a keyboard shortcut bypasses the
    // button entirely and should still get one page, not two. The browser's own
    // beforeprint signal covers those paths, and the fitter's restore signals
    // already put the card back afterwards. The guard keeps it to the visit
    // screen: other screens have their own print shapes, and a stray trim there
    // would hide what the farmer meant to print.
    if (window.addEventListener && "onbeforeprint" in window) {
      window.addEventListener("beforeprint", function () {
        if (!FIT || !FIT.prepareForPrint) return;
        var visitScreen = $("#screen-visit");
        if (!visitScreen || !visitScreen.classList.contains("screen-active")) return;
        FIT.prepareForPrint();
      });
    }
    $("#btn-visit-download") && $("#btn-visit-download").addEventListener("click", downloadVisitCard);
    $("#btn-visit-share") && $("#btn-visit-share").addEventListener("click", shareVisitCard);
    $("#btn-visit-office-pack") &&
      $("#btn-visit-office-pack").addEventListener("click", openOfficePack);
    $("#btn-pack-share") && $("#btn-pack-share").addEventListener("click", shareOfficePack);
    $("#btn-pack-copy") &&
      $("#btn-pack-copy").addEventListener("click", function () {
        copyOfficePack();
      });
    $("#btn-pack-print") &&
      $("#btn-pack-print").addEventListener("click", function () {
        if (FIT && FIT.prepareForPrint) FIT.prepareForPrint();
        window.print();
      });
    $("#btn-visit-mode") &&
      $("#btn-visit-mode").addEventListener("click", function () {
        setVisitMode(!visitModeOn());
      });
    $("#btn-visit-mode-exit") &&
      $("#btn-visit-mode-exit").addEventListener("click", function () {
        setVisitMode(false);
      });
    $("#btn-visit-read") &&
      $("#btn-visit-read").addEventListener("click", function () {
        renderVisitCard();
        toggleRead("btn-visit-read", buildVisitSections());
      });
    $("#btn-visit-read-stop") &&
      $("#btn-visit-read-stop").addEventListener("click", stopReading);
    $("#btn-visit-read-prev") &&
      $("#btn-visit-read-prev").addEventListener("click", function () {
        jumpReadSection("btn-visit-read", -1);
      });
    $("#btn-visit-read-next") &&
      $("#btn-visit-read-next").addEventListener("click", function () {
        jumpReadSection("btn-visit-read", 1);
      });

    $("#btn-read-plan") &&
      $("#btn-read-plan").addEventListener("click", function () {
        toggleRead("btn-read-plan", buildSpokenSections());
      });
    $("#btn-read-plan-stop") &&
      $("#btn-read-plan-stop").addEventListener("click", stopReading);
    $("#btn-read-plan-prev") &&
      $("#btn-read-plan-prev").addEventListener("click", function () {
        jumpReadSection("btn-read-plan", -1);
      });
    $("#btn-read-plan-next") &&
      $("#btn-read-plan-next").addEventListener("click", function () {
        jumpReadSection("btn-read-plan", 1);
      });

    $("#btn-save-named") &&
      $("#btn-save-named").addEventListener("click", function () {
        var saved = saveCurrentPlan();
        if (saved) {
          setStatus("copy-status", 'Saved as "' + saved.name + '" on this device. My plans shows it beside any others.');
          var nameTag = $("#results-plan-name");
          if (nameTag) {
            nameTag.hidden = false;
            nameTag.textContent = 'Saved as "' + saved.name + '". Saving again updates that plan.';
          }
        }
      });

    // One delegated listener covers every card in the saved list, including
    // ones rendered after this runs.
    document.addEventListener("click", function (e) {
      if (!e.target.closest) return;
      var open = e.target.closest("[data-plan-open]");
      if (open) {
        openSavedPlan(open.getAttribute("data-plan-open"));
        return;
      }
      var choose = e.target.closest("[data-plan-choose]");
      if (choose) {
        PLANS.choose(choose.getAttribute("data-plan-choose"));
        renderPlans();
        setStatus("plans-status", "Noted. The office visit card will carry the plan you marked.");
        return;
      }
      var rename = e.target.closest("[data-plan-rename]");
      if (rename) {
        var plan = PLANS.get(rename.getAttribute("data-plan-rename"));
        if (!plan) return;
        var next = window.prompt("Name for this plan", plan.name);
        if (next === null) return;
        PLANS.rename(plan.id, next);
        if (state.currentPlanId === plan.id) state.currentPlanName = PLANS.get(plan.id).name;
        renderPlans();
        setStatus("plans-status", "Renamed.");
        return;
      }
      var remove = e.target.closest("[data-plan-remove]");
      if (remove) {
        var target = PLANS.get(remove.getAttribute("data-plan-remove"));
        if (!target) return;
        var ok = window.confirm('Delete "' + target.name + '"? This removes it from this device only.');
        if (!ok) return;
        PLANS.remove(target.id);
        if (state.currentPlanId === target.id) {
          state.currentPlanId = null;
          state.currentPlanName = "";
        }
        renderPlans();
        setStatus("plans-status", "Deleted.");
      }
    });

    var districtSelectLive = $("#district");
    if (districtSelectLive) {
      districtSelectLive.addEventListener("change", function () {
        readFormIntoState();
        updateFormLocationContext();
      });
    }

    var weatherForm = $("#weather-form");
    if (weatherForm) {
      weatherForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var select = $("#weather-district");
        var name = select ? select.value : "";
        var mode = $("#weather-place-mode");
        var custom = $("#weather-custom-place");
        state.weatherPlaceMode = mode && mode.value === "custom" ? "custom" : "district";
        state.weatherCustomPlace = custom ? custom.value.trim() : "";
        var err = $("#weather-district-error");
        var customErr = $("#weather-custom-error");
        if (customErr) {
          customErr.hidden = true;
          customErr.textContent = "";
        }
        if (!name) {
          if (err) {
            err.textContent = "Please choose a district to check the weather for.";
            err.hidden = false;
          }
          if (select) {
            select.setAttribute("aria-invalid", "true");
            select.focus();
          }
          return;
        }
        if (state.weatherPlaceMode === "custom" && !state.weatherCustomPlace) {
          if (customErr) {
            customErr.textContent = "Enter a nearby town, or switch back to the district town name.";
            customErr.hidden = false;
          }
          if (custom) {
            custom.setAttribute("aria-invalid", "true");
            custom.focus();
          }
          return;
        }
        if (custom) custom.removeAttribute("aria-invalid");
        if (err) err.hidden = true;
        if (select) select.removeAttribute("aria-invalid");
        loadWeather(name, true);
      });
    }

    var placeMode = $("#weather-place-mode");
    if (placeMode) {
      placeMode.addEventListener("change", function () {
        state.weatherPlaceMode = placeMode.value === "custom" ? "custom" : "district";
        syncWeatherCustomField();
        if (placeMode.value === "custom") {
          var customInput = $("#weather-custom-place");
          if (customInput) customInput.focus();
        }
      });
    }

    $("#btn-results-weather") &&
      $("#btn-results-weather").addEventListener("click", function () {
        var select = $("#weather-district");
        if (select && state.data.district) select.value = state.data.district;
        showScreen("weather", { focus: false });
        var name = state.data.district || "";
        if (name) {
          loadWeather(name, false).then(function () {
            var heading = $("#weather-output h2");
            if (heading) {
              heading.setAttribute("tabindex", "-1");
              heading.focus({ preventScroll: true });
            }
          });
        } else {
          renderWeather();
        }
      });

    $("#btn-weather-home") &&
      $("#btn-weather-home").addEventListener("click", function () {
        if (state.planReady) {
          renderResults();
          showScreen("results");
        } else {
          showScreen("home");
        }
      });

    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-interest]") : null;
      if (btn) toggleInterested(btn.getAttribute("data-interest"));
    });

    // One listener covers every question tick in the app, including the boxes
    // the visit card renders after this runs. The tick is saved at once, the
    // counter beside it is repainted, and the summary and card read the same
    // map the next time they render, so nothing can drift.
    document.addEventListener("change", function (e) {
      var box = e.target && e.target.closest ? e.target.closest("[data-question-tick]") : null;
      if (!box || box.type !== "checkbox") return;
      var key = box.getAttribute("data-question-tick");
      if (!key) return;
      if (!state.coveredQuestions || typeof state.coveredQuestions !== "object") state.coveredQuestions = {};
      if (box.checked) state.coveredQuestions[key] = true;
      else delete state.coveredQuestions[key];
      saveDraft();
      // If this working draft is a saved plan that was reopened, the tick has
      // to reach the saved plan too, or a visit recorded on the card would be
      // wiped the next time that plan is opened. The answers and options stay
      // frozen in the snapshot; only the covered questions are written back,
      // so nothing a farmer already printed and showed an officer can shift
      // underneath them.
      saveCoveredToSavedPlan();
      // Repaint the counter in place without a full re-render, which would
      // steal the farmer's place on the page mid-visit.
      var list = box.closest(".question-checklist");
      var questions = currentQuestions();
      if (list && list.parentElement) {
        var counter = list.parentElement.querySelector(".question-counter");
        if (counter) {
          counter.textContent = questionCoverCount(questions) + " of " + questions.length + " covered";
        }
      }
    });

    $$("[data-nav]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var target = a.getAttribute("data-nav");
        if (target === "home") goHome();
        else if (target === "plan") startPlan();
        else if (target === "about") showScreen("about");
        else if (target === "plans") {
          renderPlans();
          showScreen("plans");
        }
        else if (target === "weather") {
          var select = $("#weather-district");
          if (select && state.data.district) select.value = state.data.district;
          showScreen("weather");
          renderWeather();
          if (state.weather.status === "idle" && state.data.district) loadWeather(state.data.district, false);
        }
        var menu = $("#nav-menu");
        var toggle = $("#nav-toggle");
        if (menu) menu.classList.remove("is-open");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      });
    });

    $("#nav-toggle") &&
      $("#nav-toggle").addEventListener("click", function () {
        var menu = $("#nav-menu");
        var btn = $("#nav-toggle");
        var open = menu ? menu.classList.toggle("is-open") : false;
        if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
      });

    window.addEventListener("hashchange", function () {
      handleHash(false);
    });
    handleHash(true);
  }

  function handleHash(initial) {
    var h = (location.hash || "#home").replace("#", "");
    var focus = !initial;
    var restore = function () { return loadDraft(); };

    if (h === "about") showScreen("about", { focus: focus });
    else if (h === "plans") {
      // Saved plans stand on their own, so this deep link never needs a draft.
      renderPlans();
      showScreen("plans", { focus: focus });
    } else if (h === "weather") {
      showScreen("weather", { focus: focus });
      renderWeather();
      if (state.weather.status === "idle" && state.data.district) {
        loadWeather(state.data.district, false);
      }
    } else if (h === "plan" || h === "form") startPlan();
    else if (h === "results" && (state.options.length || restore())) {
      if (!state.options.length) computeOptions();
      renderResults();
      showScreen("results", { focus: focus });
    } else if (h === "compare" && (state.options.length || restore())) {
      if (!state.options.length) computeOptions();
      renderCompare();
      showScreen("compare", { focus: focus });
    } else if (h === "next" && (state.options.length || restore())) {
      if (!state.options.length) computeOptions();
      renderChecklist();
      renderSchemes();
      showScreen("next", { focus: focus });
    } else if (h === "summary" && (state.options.length || restore())) {
      if (!state.options.length) computeOptions();
      renderSummary();
      showScreen("summary", { focus: focus });
    } else if (h === "visit" && (state.options.length || restore())) {
      if (!state.options.length) computeOptions();
      renderVisitCard();
      showScreen("visit", { focus: focus });
    } else if (
      h === "summary" ||
      h === "results" ||
      h === "compare" ||
      h === "next" ||
      h === "visit"
    ) {
      // A deep link with nothing saved behind it falls back home rather than
      // showing an empty screen.
      showScreen("home", { focus: focus });
    } else {
      showScreen("home", { focus: focus });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Populate the district dropdowns from one source of truth.
    var options = REGIONS.names
      .map(function (name) {
        return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + "</option>";
      })
      .join("");

    var districtSelect = $("#district");
    if (districtSelect) {
      districtSelect.innerHTML = '<option value="">Select district</option>' + options;
    }
    var weatherSelect = $("#weather-district");
    if (weatherSelect) {
      weatherSelect.innerHTML = '<option value="">Select district</option>' + options;
    }

    bind();
    setAboutReviewStatus();
    initLanguage();
    updateOfflineBanner();
    initInstall();
    initReadButtons();
    registerServiceWorker();
    window.addEventListener("online", updateOfflineBanner);
    window.addEventListener("offline", function () {
      updateOfflineBanner();
      if ($("#screen-weather") && $("#screen-weather").classList.contains("screen-active")) {
        if (state.weather.status === "loading" || state.weather.status === "ok") {
          renderWeather();
        }
      }
    });
  });
})();
