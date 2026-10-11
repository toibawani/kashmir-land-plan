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

  var STORAGE_KEY = "mlmp_draft_v2";
  var LEGACY_KEYS = ["mlmp_draft_v1"];
  var TOTAL_STEPS = 5;

  var REGIONS = window.MLMP_REGIONS;
  var ACTIVITIES = window.MLMP_ACTIVITIES;
  var SCHEMES = window.MLMP_SCHEMES;
  var WEATHER = window.MLMP_WEATHER;

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
    weather: { district: "", result: null, error: null, status: "idle" },
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
    state.data = blankData();
    state.weather = { district: "", result: null, error: null, status: "idle" };
    var form = $("#land-form");
    if (form) form.reset();
    fillFormFromState();
    var notice = $("#draft-notice");
    if (notice) notice.hidden = true;
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
        "<strong>Your answers:</strong> " +
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
          '<article class="option-card" id="opt-' +
          a.id +
          '">' +
          "<h2>" +
          (i + 1) +
          ". " +
          escapeHtml(a.title) +
          "</h2>" +
          '<p class="option-meta">Illustrative option, not a verified recommendation</p>' +
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
          '<button type="button" class="btn btn-toggle" data-interest="' +
          a.id +
          '" aria-pressed="' +
          (isInterested ? "true" : "false") +
          '">' +
          (isInterested ? "Marked interested" : "Mark as interested") +
          "</button>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    var legend = $("#results-provenance");
    if (legend) legend.innerHTML = provenanceLegend({});

    var count = $("#interested-status");
    if (count) {
      var n = Object.keys(state.interested).filter(function (k) {
        return state.interested[k];
      }).length;
      count.textContent = n
        ? n + (n === 1 ? " option marked interested. " : " options marked interested. ") + "It will be highlighted in your plan summary."
        : "";
    }
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

    if (window.matchMedia("(max-width: 700px)").matches) {
      wrap.hidden = true;
      stacked.hidden = false;
      stacked.innerHTML = opts
        .map(function (option) {
          var a = option.activity;
          return (
            '<article class="stacked-option">' +
            "<h2>" +
            escapeHtml(a.title) +
            "</h2>" +
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
            (isInterested ? ' <span class="pill">interested</span>' : "") +
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
      '<p class="scheme-cat">' +
      escapeHtml(s.category) +
      (relevant ? ' <span class="pill">likely relevant</span>' : "") +
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
      if (markedIds.length) {
        contextNote.hidden = false;
        contextNote.textContent =
          "Grouped against the " +
          markedIds.length +
          (markedIds.length === 1 ? " option" : " options") +
          " you marked interested in. Relevance to your plan is a pointer for the conversation at the office, not a statement about eligibility.";
      } else {
        contextNote.hidden = true;
        contextNote.textContent = "";
      }
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

    var optsHtml = state.options
      .map(function (option) {
        var a = option.activity;
        var isInterested = !!state.interested[a.id];
        return (
          '<li class="' +
          (isInterested ? "is-interested" : "") +
          '"><strong>' +
          escapeHtml(a.title) +
          "</strong>" +
          (isInterested ? ' <span class="pill">interested</span>' : "") +
          ": " +
          escapeHtml(a.why)
        );
      })
      .join("");

    var weatherBlock = "";
    var r = weatherForPlan();
    if (r) {
      weatherBlock =
        "<h3>Weather at the time this plan was made</h3>" +
        "<p>Live data from Open-Meteo for " +
        escapeHtml(r.place.name) +
        (r.place.district && r.place.district !== r.place.name ? ", " + escapeHtml(r.place.district) : "") +
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
      '<p class="summary-disclaimer"><strong>Illustrative prototype.</strong> Nothing here verifies ownership or suitability, approves a subsidy, or decides scheme eligibility. Confirm everything with the local agriculture office or Kisan Khidmat Ghar.</p>' +
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
      "<h3>Activities to explore</h3>" +
      '<p class="section-kind"><span class="kind-tag kind-illustrative">Illustrative</span></p>' +
      "<ol>" + optsHtml + "</ol>" +
      (interestedIds.length
        ? "<p><strong>You marked " +
          interestedIds.length +
          (interestedIds.length === 1 ? " option" : " options") +
          " as interested.</strong> Take those to the office first.</p>"
        : "<p>No options were marked as interested. You can go back and mark the ones you want to follow up.</p>") +
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
          ? "The place name could not be found in the weather service's place list. Try another district, or the nearest large town."
          : "Weather needs an internet connection. Everything else in this plan works without it, so you can carry on and come back.";
      out.innerHTML =
        '<div class="weather-error" role="alert">' +
        "<h2>Weather is not available right now</h2>" +
        "<p>" +
        escapeHtml(detail) +
        "</p>" +
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
      "<p class=\"weather-place\">General weather for <strong>" +
      escapeHtml(placeLabel) +
      "</strong>, updated " +
      escapeHtml(formatUpdated(r)) +
      ".</p>" +
      (r.confidence === "approximate"
        ? '<p class="weather-warn">The weather service matched a place of this name outside Jammu and Kashmir, so check the place name below before reading much into it.</p>'
        : "") +
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
      ratingRow("Place matched", placeLabel) +
      ratingRow(
        "Approximate elevation",
        r.place.elevation != null ? Math.round(r.place.elevation) + " m (weather model average)" : "not given"
      ) +
      ratingRow("Coordinates used", r.place.latitude.toFixed(2) + ", " + r.place.longitude.toFixed(2)) +
      "</dl>" +
      '<p class="option-note">This is the weather for the town the service matched, taken from a grid that covers a wide area. It is not a field-level forecast, it does not predict frost at your plot, and it is not a disease or irrigation warning. Elevation is the average for the grid cell, so it can differ from your field.</p>' +
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

  function loadWeather(districtName, force) {
    var name = (districtName || "").trim();
    if (!name) {
      setWeatherState("error", { reason: "no_district", message: "No district was selected." });
      renderWeather();
      return Promise.resolve();
    }

    state.weather.district = name;
    setWeatherState("loading");
    renderWeather();

    return WEATHER.get(name, force)
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
        i + 1 + ". " + a.title + (isInterested ? "   [MARKED INTERESTED]" : "")
      );
      lines.push("   Illustrative option, not a verified recommendation.");
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
        ? "You marked " + marked.length + (marked.length === 1 ? " option" : " options") + " as interested. Take those to the office first."
        : "No options were marked as interested."
    );
    lines.push("");

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
      lines.push("General weather for a town, not for your plot, and it changes.");
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
    setStatus("copy-status", "Downloaded " + filename + ".");
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
    if (notice) {
      notice.hidden = !hadDraft;
      if (hadDraft && noticeText) {
        noticeText.textContent = state.isDemo
          ? "These answers are sample data from the demo. Choose Start over to clear them."
          : "Your saved draft was restored. Continue where you left off, or start over.";
      }
    }
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
    renderResults();
    showScreen("results");
    saveDraft();
  }

  function toggleInterested(id) {
    state.interested[id] = !state.interested[id];
    if (!state.interested[id]) delete state.interested[id];
    saveDraft();
    var btn = $('[data-interest="' + id + '"]');
    if (btn) {
      var on = !!state.interested[id];
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = on ? "Marked interested" : "Mark as interested";
    }
    var count = $("#interested-status");
    if (count) {
      var n = Object.keys(state.interested).filter(function (k) {
        return state.interested[k];
      }).length;
      count.textContent = n
        ? n + (n === 1 ? " option marked interested. " : " options marked interested. ") + "It will be highlighted in your plan summary."
        : "";
    }
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

    $("#btn-reset-form") && $("#btn-reset-form").addEventListener("click", resetPlan);
    $("#btn-reset-results") && $("#btn-reset-results").addEventListener("click", resetPlan);

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

    $("#btn-done") && $("#btn-done").addEventListener("click", goHome);

    var weatherForm = $("#weather-form");
    if (weatherForm) {
      weatherForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var select = $("#weather-district");
        var name = select ? select.value : "";
        if (!name) {
          var err = $("#weather-district-error");
          if (err) {
            err.textContent = "Please choose a district to check the weather for.";
            err.hidden = false;
          }
          if (select) select.setAttribute("aria-invalid", "true");
          return;
        }
        var err2 = $("#weather-district-error");
        if (err2) err2.hidden = true;
        if (select) select.removeAttribute("aria-invalid");
        loadWeather(name, true);
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
        showScreen("home");
      });

    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-interest]") : null;
      if (btn) toggleInterested(btn.getAttribute("data-interest"));
    });

    $$("[data-nav]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var target = a.getAttribute("data-nav");
        if (target === "home") goHome();
        else if (target === "plan") startPlan();
        else if (target === "about") showScreen("about");
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
    else if (h === "weather") {
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
    } else if (h === "summary" || h === "results" || h === "compare" || h === "next") {
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
  });
})();
