/**
 * My Land, My Plan, Kashmir.
 * Prototype. Sample scoring logic only, no claims of scientific precision.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "mlmp_draft_v1";
  const TOTAL_STEPS = 5;

  // --- Sample activity catalogue (illustrative only) ---
  const ACTIVITIES = {
    kitchen_garden: {
      id: "kitchen_garden",
      title: "Kitchen garden or mixed vegetables",
      why: "A small area can supply household vegetables and reduce market trips. Works with limited land when water is managed carefully.",
      requirements: [
        "Some reliable or seasonal water for critical periods",
        "Basic tools and seeds or seedlings",
        "Time for regular weeding and harvesting",
      ],
      risks: [
        "Water shortage in dry months",
        "Pest pressure if not monitored",
        "Market surplus if you scale beyond household use",
      ],
      missing: "Exact water calendar, soil type, and local pest patterns",
      waterNeed: "low-medium",
      labour: "medium",
      cost: "low",
      terrainFit: ["flat", "unknown"],
    },
    orchard_small: {
      id: "orchard_small",
      title: "Small fruit or nut orchard (sample)",
      why: "In parts of Jammu and Kashmir, temperate fruits and nuts are traditional. A small plot may suit a few trees if water and slope allow.",
      requirements: [
        "Multi-year commitment before full production",
        "Access to planting material and basic care advice",
        "Space and some irrigation support in dry spells",
      ],
      risks: [
        "Weather extremes and frost risk",
        "Long wait for returns",
        "Need for pruning and pest management knowledge",
      ],
      missing: "Verified variety suitability for your micro-location and elevation",
      waterNeed: "medium",
      labour: "medium",
      cost: "medium",
      terrainFit: ["flat", "sloped", "unknown"],
    },
    fodder_or_pasture: {
      id: "fodder_or_pasture",
      title: "Fodder crop or managed pasture",
      why: "If you keep or plan livestock, growing fodder on underused land can cut feed costs. Less intensive than high-value cash crops.",
      requirements: [
        "Some water for establishment",
        "Clarity on livestock numbers or sale of fodder",
        "Basic seed and fencing if animals are free-ranging nearby",
      ],
      risks: [
        "Low commercial return if not linked to animals",
        "Weed competition",
        "Seasonal yield variation",
      ],
      missing: "Local fodder species performance and current livestock plans",
      waterNeed: "low-medium",
      labour: "low-medium",
      cost: "low",
      terrainFit: ["flat", "sloped", "unknown"],
    },
    mushrooms_or_allied: {
      id: "mushrooms_or_allied",
      title: "Mushroom or other protected cultivation (sample)",
      why: "Where open-field water is limited, small protected or indoor activities sometimes use less land and different resource patterns. Suitability varies widely.",
      requirements: [
        "Access to advice and training",
        "Upfront cost for structure or trays",
        "Steady labour and hygiene discipline",
      ],
      risks: [
        "Contamination and crop failure without practice",
        "Market channel needed for surplus",
        "Electricity or temperature control costs if required",
      ],
      missing: "Local training availability, market prices, and infrastructure cost",
      waterNeed: "low",
      labour: "high",
      cost: "medium-high",
      terrainFit: ["flat", "unknown"],
    },
    intercrop_or_improve: {
      id: "intercrop_or_improve",
      title: "Improve existing cultivation or add intercrop",
      why: "If the plot is already partly or fully cultivated, adjusting varieties, timing, or adding a compatible intercrop may be more practical than starting something new.",
      requirements: [
        "Current crop calendar and inputs",
        "Willingness to trial small changes",
        "Advice on local best practices",
      ],
      risks: [
        "Change without advice can reduce yield",
        "Labour timing conflicts",
        "Input cost increases",
      ],
      missing: "Detailed current crop history and soil fertility status",
      waterNeed: "varies",
      labour: "medium",
      cost: "low-medium",
      terrainFit: ["flat", "sloped", "unknown"],
    },
    beekeeping: {
      id: "beekeeping",
      title: "Beekeeping (sample allied activity)",
      why: "Where flowering plants or orchard areas exist nearby, a few hives can be an allied activity. It does not need large land area but does need knowledge and a calm site.",
      requirements: [
        "Training or mentorship",
        "Equipment and protective gear",
        "Nearby forage and a suitable placement",
      ],
      risks: [
        "Disease and colony loss",
        "Need for seasonal management",
        "Market for honey or products",
      ],
      missing: "Local forage calendar, training access, and regulations",
      waterNeed: "low",
      labour: "medium",
      cost: "medium",
      terrainFit: ["flat", "sloped", "unknown"],
    },
  };

  // --- State ---
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

  let state = {
    step: 1,
    isDemo: false,
    data: blankData(),
    options: [],
    checklist: [],
  };

  // --- DOM helpers ---
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const scrollBehavior = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  function showScreen(id, opts = {}) {
    $$(".screen").forEach((s) => {
      s.hidden = true;
      s.classList.remove("screen-active");
    });
    const el = $(`#screen-${id}`);
    if (!el) return;
    el.hidden = false;
    el.classList.add("screen-active");

    // Keep the screen addressable without pushing history entries.
    if (history.replaceState) {
      history.replaceState(null, "", `#${id}`);
    }

    // Send focus to the new screen heading so keyboard and screen reader
    // users are not left behind on the previous screen.
    const heading = $(".screen-title", el) || el.querySelector("h1");
    if (opts.focus !== false && heading) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  }

  function setStatus(id, msg, timeout = 4000) {
    const el = $(`#${id}`);
    if (!el) return;
    if (setStatus.timer) clearTimeout(setStatus.timer);
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.textContent = msg;
    el.hidden = false;
    if (timeout) {
      setStatus.timer = setTimeout(() => {
        el.hidden = true;
      }, timeout);
    }
  }

  function updateProgress() {
    const pct = (state.step / TOTAL_STEPS) * 100;
    const fill = $("#progress-fill");
    const bar = $("#progress-bar");
    const label = $("#progress-label");
    if (fill) fill.style.width = `${pct}%`;
    if (bar) bar.setAttribute("aria-valuenow", String(Math.round(pct)));
    if (label) label.textContent = `Step ${state.step} of ${TOTAL_STEPS}`;
  }

  function showStep(n, opts = {}) {
    state.step = n;
    $$(".form-step").forEach((fs) => {
      fs.hidden = Number(fs.dataset.step) !== n;
    });
    const back = $("#btn-back");
    const next = $("#btn-next");
    const submit = $("#btn-submit");
    if (back) back.hidden = n === 1;
    if (next) next.hidden = n === TOTAL_STEPS;
    if (submit) submit.hidden = n !== TOTAL_STEPS;
    updateProgress();

    // Announce the step change instead of silently swapping content.
    const legend = $(`.form-step[data-step="${n}"] .step-legend`);
    if (opts.focus !== false && legend) {
      if (!legend.hasAttribute("tabindex")) legend.setAttribute("tabindex", "-1");
      legend.focus({ preventScroll: true });
    }
  }

  // A field can be a single control or a radio group sharing a name.
  function errorTargets(id) {
    const single = $(`#${id}`);
    if (single) return [single];
    return $$(`input[name="${id}"]`);
  }

  function clearErrors() {
    $$(".field-error").forEach((e) => {
      e.hidden = true;
      e.textContent = "";
    });
    $$("[aria-invalid='true']").forEach((el) => el.removeAttribute("aria-invalid"));
    $$("[data-error-link]").forEach((el) => {
      el.removeAttribute("aria-describedby");
      el.removeAttribute("data-error-link");
    });
  }

  function setError(id, msg) {
    const el = $(`#err-${id}`);
    if (el) {
      el.textContent = msg;
      el.hidden = false;
    }
    errorTargets(id).forEach((field) => {
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", `err-${id}`);
      field.setAttribute("data-error-link", "true");
    });
  }

  // Move focus to the first problem so keyboard and screen reader users
  // hear the message attached to the field, not just a floating error.
  function focusFirstInvalid(id) {
    const target = errorTargets(id)[0];
    if (target && typeof target.focus === "function") {
      target.focus();
      return;
    }
    const msg = $(`#err-${id}`);
    if (msg) msg.scrollIntoView({ block: "center", behavior: scrollBehavior() });
  }

  function validateStep(step) {
    clearErrors();
    let firstInvalid = null;
    const d = state.data;
    const fail = (id, msg) => {
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
      const size = parseFloat(d.size);
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
    const form = $("#land-form");
    if (!form) return;
    const fd = new FormData(form);
    state.data.district = (fd.get("district") || "").toString();
    state.data.village = (fd.get("village") || "").toString().trim();
    state.data.size = (fd.get("size") || "").toString();
    state.data.unit = (fd.get("unit") || "kanal").toString();
    state.data.landUse = (fd.get("landUse") || "").toString();
    state.data.water = (fd.get("water") || "").toString();
    state.data.terrain = (fd.get("terrain") || "").toString();
    state.data.soil = (fd.get("soil") || "none").toString();
    state.data.constraint = (fd.get("constraint") || "").toString();
  }

  function saveDraft() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          data: state.data,
          step: state.step,
          isDemo: state.isDemo,
          checklist: state.checklist || [],
        })
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data) {
        state.data = { ...blankData(), ...parsed.data };
        state.step = parsed.step || 1;
        state.isDemo = !!parsed.isDemo;
        state.checklist = Array.isArray(parsed.checklist) ? parsed.checklist : [];
        return true;
      }
    } catch (_) {}
    return false;
  }

  function clearDraft() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

  // Wipe everything and put the farmer back on a blank first step.
  function resetPlan() {
    clearDraft();
    state.isDemo = false;
    state.step = 1;
    state.options = [];
    state.checklist = [];
    state.data = blankData();
    const form = $("#land-form");
    if (form) form.reset();
    fillFormFromState();
    const notice = $("#draft-notice");
    if (notice) notice.hidden = true;
    setStatus("save-status", "");
    showStep(1, { focus: false });
    showScreen("form");
  }

  function fillFormFromState() {
    const d = state.data;
    const setVal = (id, val) => {
      const el = $(`#${id}`);
      if (el) el.value = val || "";
    };
    setVal("district", d.district);
    setVal("village", d.village);
    setVal("size", d.size);
    setVal("unit", d.unit);
    setVal("soil", d.soil);
    $$('input[name="landUse"]').forEach((r) => {
      r.checked = r.value === d.landUse;
    });
    $$('input[name="water"]').forEach((r) => {
      r.checked = r.value === d.water;
    });
    $$('input[name="terrain"]').forEach((r) => {
      r.checked = r.value === d.terrain;
    });
    $$('input[name="constraint"]').forEach((r) => {
      r.checked = r.value === d.constraint;
    });
  }

  // --- Sample recommendation logic (clearly illustrative) ---
  function computeOptions() {
    const d = state.data;
    const scores = {};

    Object.keys(ACTIVITIES).forEach((k) => {
      scores[k] = 0;
    });

    // Water-based preferences
    if (d.water === "limited" || d.water === "unknown") {
      scores.kitchen_garden += 2;
      scores.fodder_or_pasture += 2;
      scores.mushrooms_or_allied += 3;
      scores.beekeeping += 2;
      scores.orchard_small += 0;
    } else if (d.water === "seasonal") {
      scores.kitchen_garden += 2;
      scores.fodder_or_pasture += 2;
      scores.orchard_small += 1;
      scores.beekeeping += 1;
    } else if (d.water === "reliable") {
      scores.kitchen_garden += 2;
      scores.orchard_small += 3;
      scores.intercrop_or_improve += 2;
      scores.fodder_or_pasture += 1;
    }

    // Terrain
    if (d.terrain === "sloped") {
      scores.orchard_small += 2;
      scores.fodder_or_pasture += 2;
      scores.beekeeping += 1;
      scores.mushrooms_or_allied -= 1;
    } else if (d.terrain === "flat") {
      scores.kitchen_garden += 2;
      scores.mushrooms_or_allied += 1;
      scores.intercrop_or_improve += 1;
    }

    // Land use
    if (d.landUse === "cultivated" || d.landUse === "partly") {
      scores.intercrop_or_improve += 4;
    } else {
      scores.kitchen_garden += 1;
      scores.fodder_or_pasture += 1;
    }

    // Constraint
    if (d.constraint === "water") {
      scores.mushrooms_or_allied += 2;
      scores.beekeeping += 2;
      scores.kitchen_garden += 1;
    } else if (d.constraint === "cost") {
      scores.kitchen_garden += 2;
      scores.fodder_or_pasture += 2;
      scores.intercrop_or_improve += 1;
    } else if (d.constraint === "labour") {
      scores.fodder_or_pasture += 2;
      scores.orchard_small += 1;
      scores.beekeeping += 1;
    } else if (d.constraint === "advice") {
      scores.kitchen_garden += 1;
      scores.intercrop_or_improve += 1;
    } else if (d.constraint === "market") {
      scores.kitchen_garden += 2;
      scores.fodder_or_pasture += 1;
    }

    // Size: very small plots favour intensive / household
    const sizeNum = parseFloat(d.size) || 1;
    const unit = d.unit;
    let sizeKanalApprox = sizeNum;
    if (unit === "acre") sizeKanalApprox = sizeNum * 8;
    else if (unit === "hectare") sizeKanalApprox = sizeNum * 20;
    else if (unit === "marla") sizeKanalApprox = sizeNum / 20;

    if (sizeKanalApprox < 2) {
      scores.kitchen_garden += 2;
      scores.mushrooms_or_allied += 1;
      scores.beekeeping += 1;
      scores.orchard_small -= 1;
    } else if (sizeKanalApprox > 10) {
      scores.orchard_small += 1;
      scores.fodder_or_pasture += 1;
    }

    // Rank and pick top 2–3
    const ranked = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => ACTIVITIES[id]);

    state.options = ranked;
    return ranked;
  }

  function renderResults() {
    const opts = state.options.length ? state.options : computeOptions();
    const d = state.data;

    const strip = $("#summary-strip");
    if (strip) {
      strip.innerHTML = `
        <strong>Your inputs (sample plan):</strong>
        ${escapeHtml(d.district)}, ${escapeHtml(d.village)}.
        Plot ${escapeHtml(d.size)} ${escapeHtml(d.unit)},
        land ${escapeHtml(labelLandUse(d.landUse))},
        water ${escapeHtml(labelWater(d.water))},
        terrain ${escapeHtml(labelTerrain(d.terrain))},
        main limit: ${escapeHtml(labelConstraint(d.constraint))}.
      `;
    }

    const badge = $("#results-sample-badge");
    if (badge) {
      badge.hidden = false;
      badge.textContent = state.isDemo ? "Sample / demo journey" : "Illustrative options (sample logic)";
    }

    const list = $("#options-list");
    if (!list) return;
    list.innerHTML = opts
      .map(
        (o, i) => `
      <article class="option-card" id="opt-${o.id}">
        <h2>${i + 1}. ${escapeHtml(o.title)}</h2>
        <p class="option-meta">Illustrative option, not a verified recommendation</p>
        <div class="option-section">
          <h3>Why it may be worth exploring</h3>
          <p>${escapeHtml(o.why)}</p>
        </div>
        <div class="option-section">
          <h3>Basic requirements</h3>
          <ul>${o.requirements.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
        </div>
        <div class="option-section">
          <h3>Main risks or questions to verify</h3>
          <ul>${o.risks.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
        </div>
        <div class="option-section">
          <h3>What information is missing</h3>
          <p>${escapeHtml(o.missing)}</p>
        </div>
      </article>
    `
      )
      .join("");
  }

  // Short, genuinely comparable attributes. Long prose is kept out of the
  // table so it still reads as a table on a phone.
  const COMPARE_ROWS = [
    { key: "waterNeed", label: "Water need (sample)", format: (o) => o.waterNeed || "Not noted" },
    { key: "labour", label: "Labour (sample)", format: (o) => o.labour || "Not noted" },
    { key: "cost", label: "Relative cost (sample)", format: (o) => o.cost || "Not noted" },
    {
      key: "terrainFit",
      label: "Terrain (sample)",
      format: (o) => {
        const fit = o.terrainFit || [];
        const flat = fit.includes("flat");
        const sloped = fit.includes("sloped");
        if (flat && sloped) return "Flat or sloped";
        if (flat) return "Flat ground";
        if (sloped) return "Sloped ground";
        return "Not noted";
      },
    },
  ];

  function renderCompare() {
    const opts = state.options;
    const wrap = $("#compare-table-wrap");
    const table = $("#compare-table");
    const stacked = $("#compare-stacked");
    const notes = $("#compare-notes");
    if (!table || !stacked || !wrap || !opts.length) return;

    const narrow = window.matchMedia("(max-width: 700px)").matches;

    if (narrow) {
      // A horizontally scrolling table is unusable on a small phone, so
      // each option becomes its own block instead.
      wrap.hidden = true;
      stacked.hidden = false;
      stacked.innerHTML = opts
        .map(
          (o) => `
        <article class="stacked-option">
          <h2>${escapeHtml(o.title)}</h2>
          <dl>
            ${COMPARE_ROWS.map(
              (r) => `<dt>${escapeHtml(r.label)}</dt><dd>${escapeHtml(r.format(o))}</dd>`
            ).join("")}
          </dl>
        </article>`
        )
        .join("");
    } else {
      stacked.hidden = true;
      wrap.hidden = false;
      const thead = table.querySelector("thead tr");
      const tbody = table.querySelector("tbody");
      thead.innerHTML =
        `<th scope="col">Option</th>` +
        COMPARE_ROWS.map((r) => `<th scope="col">${escapeHtml(r.label)}</th>`).join("");
      tbody.innerHTML = opts
        .map(
          (o) => `
          <tr>
            <th scope="row">${escapeHtml(o.title)}</th>
            ${COMPARE_ROWS.map((r) => `<td>${escapeHtml(r.format(o))}</td>`).join("")}
          </tr>`
        )
        .join("");
    }

    if (notes) {
      notes.innerHTML = `
        <h2>What to verify for each option</h2>
        <p class="hint">These are questions to ask at the agriculture office, not conclusions.</p>
        <ul class="verify-list">
          ${opts
            .map(
              (o) => `
            <li>
              <strong>${escapeHtml(o.title)}</strong>
              <p>Main risk to check: ${escapeHtml((o.risks && o.risks[0]) || "Not noted")}</p>
              <p>Still needed: ${escapeHtml(o.missing)}</p>
            </li>`
            )
            .join("")}
        </ul>`;
    }
  }

  function getChecklistItems() {
    const d = state.data;
    return [
      "Visit or call the nearest agriculture office or Kisan Khidmat Ghar with your plot details.",
      d.soil === "none"
        ? "Ask how to get a soil test for your plot and what the process costs and takes."
        : "Take your soil test report when you meet the officer and ask for interpretation and advice.",
      "Discuss water access and whether any irrigation support or water-saving practices apply to your situation.",
      "Ask which of the activity ideas (if any) are realistic for your village and season, and what training is available.",
      "Request current information on any schemes related to horticulture, irrigation, livestock, or farm support. Do not rely on amounts or rules from this app.",
      "Note market or cooperative options if selling produce is part of your plan.",
      "Write down your questions before the visit so you cover costs, labour, and risks clearly.",
    ];
  }

  function renderChecklist() {
    const items = getChecklistItems();
    const ul = $("#checklist");
    if (!ul) return;

    // Keep ticks across re-renders and across visits.
    state.checklist = items.map((text, i) => ({
      text,
      checked: !!(state.checklist[i] && state.checklist[i].checked),
    }));

    ul.innerHTML = state.checklist
      .map(
        (item, i) => `
      <li>
        <input type="checkbox" id="chk-${i}" name="chk-${i}" ${item.checked ? "checked" : ""} />
        <label for="chk-${i}">${escapeHtml(item.text)}</label>
      </li>
    `
      )
      .join("");

    $$("#checklist input[type='checkbox']").forEach((box, i) => {
      box.addEventListener("change", () => {
        state.checklist[i].checked = box.checked;
        saveDraft();
      });
    });
  }

  function renderSummary() {
    const d = state.data;
    const opts = state.options;
    const card = $("#plan-summary");
    if (!card) return;

    const date = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // If someone lands straight on the summary, rebuild the checklist so the
    // printed plan is never missing its next steps.
    const checklist =
      state.checklist && state.checklist.length
        ? state.checklist
        : getChecklistItems().map((text) => ({ text, checked: false }));

    card.innerHTML = `
      <h2>My Land, My Plan: plan summary</h2>
      <p><strong>Date:</strong> ${escapeHtml(date)}</p>
      <p><strong>Note:</strong> Illustrative prototype only. Confirm everything with the local agriculture office or Kisan Khidmat Ghar.</p>
      <h3>Plot details</h3>
      <ul>
        <li>District: ${escapeHtml(d.district)}</li>
        <li>Village / locality: ${escapeHtml(d.village)}</li>
        <li>Approximate size: ${escapeHtml(d.size)} ${escapeHtml(d.unit)}</li>
        <li>Current use: ${escapeHtml(labelLandUse(d.landUse))}</li>
        <li>Water access: ${escapeHtml(labelWater(d.water))}</li>
        <li>Terrain: ${escapeHtml(labelTerrain(d.terrain))}</li>
        <li>Soil test: ${escapeHtml(labelSoil(d.soil))}</li>
        <li>Main constraint: ${escapeHtml(labelConstraint(d.constraint))}</li>
      </ul>
      <h3>Activities to explore (sample)</h3>
      <ol>
        ${opts.map((o) => `<li><strong>${escapeHtml(o.title)}</strong>: ${escapeHtml(o.why)}</li>`).join("")}
      </ol>
      <h3>Your next steps</h3>
      <ul class="summary-checklist">
        ${checklist
          .map(
            (c) =>
              `<li class="${c.checked ? "is-done" : ""}">${c.checked ? "Done" : "To do"}: ${escapeHtml(
                c.text
              )}</li>`
          )
          .join("")}
      </ul>
      <h3>Who to contact next</h3>
      <ul>
        <li>Agriculture office or Kisan Khidmat Ghar for your district</li>
        <li>Soil testing service, if you do not have a recent report</li>
        <li>Ask for the current list of schemes and their rules</li>
      </ul>
      <p class="summary-footnote">
        This summary was generated by the My Land, My Plan prototype. It does not verify ownership, suitability, or eligibility.
      </p>
    `;
  }

  function buildPlanText() {
    const card = $("#plan-summary");
    return card ? `${card.innerText.trim()}\n` : "";
  }

  // Save a plain text copy of the plan so it can be kept or shared.
  function downloadPlan() {
    const text = buildPlanText();
    if (!text) return;
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `my-land-my-plan-${date}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("copy-status", "Plan summary downloaded as a text file.");
  }

  // Labels
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
      cost: "cost / investment",
      labour: "labour",
      advice: "access to advice",
      market: "market access",
      unsure: "not sure",
    }[v] || v;
  }
  function labelSoil(v) {
    return { none: "no recent test", done: "recent test available", partial: "partial or old results" }[v] || v;
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Sample journey for judges. Every screen it reaches is labelled as sample.
  function loadDemo() {
    state.isDemo = true;
    state.checklist = [];
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
    // Keep the wizard at step 1 so "Edit details" opens the beginning of the
    // form rather than dropping the user on the last step.
    state.step = 1;
    fillFormFromState();
    computeOptions();
    renderResults();
    showScreen("results");
    saveDraft();
  }

  // Navigation
  function goHome() {
    showScreen("home");
  }

  function startPlan() {
    const hadDraft = loadDraft();
    fillFormFromState();

    // Only resume mid-form. A finished plan starts again from step 1.
    const resumeStep = state.step > 0 && state.step < TOTAL_STEPS ? state.step : 1;
    showStep(resumeStep, { focus: false });
    showScreen("form", { focus: false });

    const notice = $("#draft-notice");
    const noticeText = $("#draft-notice-text");
    if (notice) {
      notice.hidden = !hadDraft;
      if (hadDraft && noticeText) {
        noticeText.textContent = state.isDemo
          ? "These answers are sample data from the demo. Choose Start over to clear them."
          : "Your saved draft was restored. Continue where you left off, or start over.";
      }
    }
  }

  // Events
  function bind() {
    $("#btn-start")?.addEventListener("click", startPlan);
    $("#btn-demo")?.addEventListener("click", loadDemo);
    $("#btn-about-home")?.addEventListener("click", goHome);
    $("#logo-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      goHome();
    });

    $("#btn-next")?.addEventListener("click", () => {
      readFormIntoState();
      const firstInvalid = validateStep(state.step);
      if (firstInvalid) {
        focusFirstInvalid(firstInvalid);
        return;
      }
      // Advance first, then save, so the stored step matches what is on screen.
      if (state.step < TOTAL_STEPS) {
        showStep(state.step + 1);
      }
      saveDraft();
    });

    $("#btn-back")?.addEventListener("click", () => {
      readFormIntoState();
      if (state.step > 1) showStep(state.step - 1);
    });

    $("#land-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      readFormIntoState();
      const firstInvalid = validateStep(TOTAL_STEPS);
      if (firstInvalid) {
        focusFirstInvalid(firstInvalid);
        return;
      }
      computeOptions();
      saveDraft();
      renderResults();
      showScreen("results");
    });

    $("#btn-save-draft")?.addEventListener("click", () => {
      readFormIntoState();
      const ok = saveDraft();
      setStatus(
        "save-status",
        ok
          ? "Draft saved on this device. Nothing was sent anywhere."
          : "This browser blocked local storage, so the draft could not be saved."
      );
    });

    $("#btn-reset-form")?.addEventListener("click", resetPlan);
    $("#btn-reset-results")?.addEventListener("click", resetPlan);
    $("#btn-download")?.addEventListener("click", downloadPlan);

    $("#btn-edit")?.addEventListener("click", () => {
      fillFormFromState();
      showStep(1);
      showScreen("form");
    });

    $("#btn-compare")?.addEventListener("click", () => {
      renderCompare();
      showScreen("compare");
    });

    // The comparison swaps between a table and stacked blocks at this width.
    window.matchMedia("(max-width: 700px)").addEventListener("change", () => {
      if ($("#screen-compare")?.classList.contains("screen-active")) renderCompare();
    });

    $("#btn-back-results")?.addEventListener("click", () => showScreen("results"));
    $("#btn-next-steps")?.addEventListener("click", () => {
      renderChecklist();
      showScreen("next");
    });
    $("#btn-back-compare")?.addEventListener("click", () => showScreen("compare"));

    $("#btn-save-plan")?.addEventListener("click", () => {
      renderSummary();
      saveDraft();
      showScreen("summary");
    });

    $("#btn-print")?.addEventListener("click", () => window.print());
    $("#btn-copy")?.addEventListener("click", async () => {
      const card = $("#plan-summary");
      if (!card) return;
      const text = card.innerText;
      try {
        await navigator.clipboard.writeText(text);
        const st = $("#copy-status");
        if (st) {
          st.hidden = false;
          st.textContent = "Summary copied to clipboard.";
          setTimeout(() => (st.hidden = true), 3000);
        }
      } catch {
        const st = $("#copy-status");
        if (st) {
          st.hidden = false;
          st.textContent = "Could not copy automatically. Select the text and copy manually.";
        }
      }
    });

    $("#btn-done")?.addEventListener("click", goHome);

    // Nav links
    $$("[data-nav]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const target = a.getAttribute("data-nav");
        if (target === "home") goHome();
        else if (target === "plan") startPlan();
        else if (target === "about") showScreen("about");
        // close mobile menu
        $("#nav-menu")?.classList.remove("is-open");
        $("#nav-toggle")?.setAttribute("aria-expanded", "false");
      });
    });

    $("#nav-toggle")?.addEventListener("click", () => {
      const menu = $("#nav-menu");
      const btn = $("#nav-toggle");
      const open = menu?.classList.toggle("is-open");
      btn?.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Hash routing for simple deep links
    window.addEventListener("hashchange", handleHash);
    handleHash(true);
  }

  function handleHash(initial) {
    const h = (location.hash || "#home").replace("#", "");
    const focus = !initial;
    const restore = () => loadDraft();

    if (h === "about") showScreen("about", { focus });
    else if (h === "plan" || h === "form") startPlan();
    else if (h === "results" && (state.options.length || restore())) {
      if (!state.options.length) computeOptions();
      renderResults();
      showScreen("results", { focus });
    } else if (h === "compare" && (state.options.length || restore())) {
      if (!state.options.length) computeOptions();
      renderCompare();
      showScreen("compare", { focus });
    } else if (h === "next" && (state.options.length || restore())) {
      if (!state.options.length) computeOptions();
      renderChecklist();
      showScreen("next", { focus });
    } else if (h === "summary" && (state.options.length || restore())) {
      if (!state.options.length) computeOptions();
      renderSummary();
      showScreen("summary", { focus });
    } else {
      // Anything unknown, including a stale deep link, falls back home.
      showScreen("home", { focus });
    }
  }

  // Init
  document.addEventListener("DOMContentLoaded", () => {
    bind();
    // Restore draft indicator could be added; for now silent load on Start
  });
})();
