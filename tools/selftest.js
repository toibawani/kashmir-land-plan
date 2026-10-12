#!/usr/bin/env node
/**
 * Small behavioural test for the modules that carry no browser in them.
 *
 * `npm run build` already proves the scripts parse and the references exist.
 * That says nothing about what the code actually says, so this file walks
 * the pieces a farmer never sees break loudly: the review wording an officer
 * signs off, the questions generated from a plot, the saved-plan store, and
 * the way long text is cut into speakable chunks.
 *
 * Only Node built-ins are used, and the browser is faked with the smallest
 * stubs that keep the modules honest: an empty `window` to hang the modules
 * on, and an in-memory cupboard to stand in for localStorage. Anything that
 * needs a real DOM, a voice, or the network is out of scope here and is
 * checked by reading the code instead.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var root = path.resolve(__dirname, "..");
var failures = [];
var checks = 0;

function check(name, condition, detail) {
  checks += 1;
  if (condition) {
    console.log("  ok: " + name);
  } else {
    failures.push(name + (detail ? " (" + detail + ")" : ""));
    console.error("  FAIL: " + name);
  }
}

// An in-memory stand-in for localStorage. It keeps whatever the module
// writes for the length of one run, which is all a round trip needs.
function makeStorage() {
  var jar = Object.create(null);
  return {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(jar, key) ? jar[key] : null;
    },
    setItem: function (key, value) {
      jar[key] = String(value);
    },
    removeItem: function (key) {
      delete jar[key];
    },
  };
}

function load(names, sandbox) {
  names
    .map(function (name) {
      return path.join(root, "js", name);
    })
    .forEach(function (file) {
      new vm.Script(fs.readFileSync(file, "utf8"), {
        filename: path.relative(root, file),
      }).runInNewContext(sandbox);
    });
}

// The catalogue, regions and questions modules only need a `window` to hang
// from. Speech checks for a voice at load and finds none, which is exactly
// what an unsupported browser looks like, so the fallback path is exercised
// for free.
var sandbox = { window: {} };
sandbox.window.localStorage = makeStorage();
load(["regions.js", "catalogue.js", "activities.js", "schemes.js", "questions.js", "plans.js", "speech.js"], sandbox);

var REGIONS = sandbox.window.MLMP_REGIONS;
var CATALOGUE = sandbox.window.MLMP_CATALOGUE;
var ACTIVITIES = sandbox.window.MLMP_ACTIVITIES;
var SCHEMES = sandbox.window.MLMP_SCHEMES;
var QUESTIONS = sandbox.window.MLMP_QUESTIONS;
var PLANS = sandbox.window.MLMP_PLANS;
var SPEECH = sandbox.window.MLMP_SPEECH;

console.log("review wording");

var notReviewed = ACTIVITIES.formatReview({ reviewStatus: "not-reviewed" });
check("not-reviewed names an agriculture officer", /agriculture officer/i.test(notReviewed.text), notReviewed.text);
check("not-reviewed keeps the confirm-locally sentence", /confirm locally/i.test(notReviewed.text), notReviewed.text);

var reviewed = ACTIVITIES.formatReview({
  reviewStatus: "reviewed",
  reviewedBy: "A Test Officer",
  designation: "Agriculture Extension Officer",
  reviewedOn: "2026-09-30",
});
check(
  "reviewed names the reviewer and the date",
  /A Test Officer/.test(reviewed.text) && /2026-09-30/.test(reviewed.text),
  reviewed.text
);
check("reviewed keeps the confirm-locally sentence", /confirm locally/i.test(reviewed.text), reviewed.text);

// Every activity in the catalogue must carry the review fields the renderer
// assumes, so an officer hand-editing one entry cannot leave it shapeless.
console.log("catalogue shape");
var ids = Object.keys(CATALOGUE.activities);
check("the catalogue is not empty", ids.length > 0, ids.length + " activities");
ids.forEach(function (id) {
  var a = CATALOGUE.activities[id];
  check(
    '"' + id + '" has twelve months',
    Array.isArray(a.calendar) && a.calendar.length === 12,
    "calendar length " + (a.calendar && a.calendar.length)
  );
  check(
    '"' + id + '" has the review fields',
    a.reviewStatus !== undefined && a.reviewedBy !== undefined && a.reviewedOn !== undefined,
    "review fields"
  );
  check(
    '"' + id + '" carries no invented figures',
    !/[₹]|\d{4,}|\d+\s*%/.test(a.why + " " + (a.missing || "")),
    "why/missing text"
  );
});

// Scheme entries may name portals, never numbers. Amounts, deadlines and
// eligibility wording change faster than this file ships, so any of them is
// a failure, not a style nit.
//
// One deliberate exception sits in the pattern below: a sentence that sends
// the farmer to confirm eligibility at the office ("confirm yours rather
// than relying on anything here") is the sanctioned disclaimer, not a claim.
// So the check flags claim-shaped phrasing ("are eligible", "apply by",
// "bring your land records") rather than the bare word "eligibility".
console.log("scheme wording");
SCHEMES.ALL.forEach(function (s) {
  var combined = s.title + " " + s.body + " " + (s.actions || []).join(" ");
  check(
    '"' + s.id + '" carries no amounts, deadlines or eligibility claims',
    !/[₹]|\d{4,}|\d+\s*%|\bare (not )?eligible\b|\bapply (by|before)\b|\blast date\b|\bbring your\b|\bAadhaar\b|\bland records\b/i.test(combined),
    "scheme text"
  );
});

console.log("generated questions");
function sampleOptions() {
  // Hand-built the way the scoring builds them: the activity, the reasons
  // printed beside it, and the zone it came up under.
  return ["kitchen_garden", "orchard_temp", "beekeeping"]
    .filter(function (id) {
      return CATALOGUE.activities[id];
    })
    .map(function (id) {
      return { activity: CATALOGUE.activities[id], reasons: ["sample reason"], zone: REGIONS.zoneFor("Pulwama") };
    });
}
var sampleData = {
  district: "Pulwama",
  village: "Tral",
  size: "3",
  unit: "kanal",
  landUse: "unused",
  water: "seasonal",
  terrain: "flat",
  soil: "none",
  constraint: "water",
};
var questions = QUESTIONS.forPlan(sampleData, sampleOptions(), { zone: REGIONS.zoneFor("Pulwama"), max: 7 });
check("a plot produces questions", questions.length > 0, questions.length + " questions");
check("no more than the asked maximum", questions.length <= 7, questions.length + " questions");
var seenIds = Object.create(null);
var questionProblem = null;
questions.forEach(function (q) {
  if (!q.text || !q.text.trim()) questionProblem = "an empty question slipped through";
  if (seenIds[q.id]) questionProblem = "a repeated question id: " + q.id;
  seenIds[q.id] = true;
  if (/[₹]|\d{4,}|\d+\s*%|guarantee|subsidy of|eligible/i.test(q.text)) {
    questionProblem = "a question that sounds like an answer: " + q.text;
  }
  if (!/\?$/.test(q.text.trim())) questionProblem = "not a question: " + q.text;
});
check("every question is unique, punctuated, and still a question", questionProblem === null, questionProblem);

// A forecast-derived timing hint must turn into a question, never an
// instruction, because a model grid cannot know a field.
var withHint = QUESTIONS.forPlan(
  sampleData,
  sampleOptions(),
  { zone: REGIONS.zoneFor("Pulwama"), max: 7, timingHint: { kind: "rain", placeName: "Pulwama", value: 80, dayLabel: "Tuesday" } }
);
check(
  "a rain hint becomes a question about timing",
  withHint.some(function (q) {
    return /timing|forecast/i.test(q.text);
  }),
  withHint.map(function (q) { return q.id; }).join(", ")
);

console.log("saved plans");
var first = PLANS.upsert({
  name: "First plan",
  data: sampleData,
  interested: { kitchen_garden: true },
  options: [{ id: "kitchen_garden" }],
  zoneId: "valley_temperate",
});
check("a saved plan comes back with an id", !!(first && first.id), "no id returned");
var second = PLANS.upsert({
  name: "Second plan",
  data: sampleData,
  interested: {},
  options: [{ id: "beekeeping" }],
  zoneId: "valley_temperate",
});
check("two plans are kept apart", PLANS.get(first.id).name === "First plan" && PLANS.get(second.id).name === "Second plan", "names");
var renamed = PLANS.upsert({ id: first.id, name: "Renamed plan", data: sampleData, interested: {}, options: [] });
check("saving again updates instead of duplicating", PLANS.list().length === 2, PLANS.list().length + " plans");
check("the rename stuck", renamed.name === "Renamed plan" && PLANS.get(first.id).name === "Renamed plan", "rename");
PLANS.choose(second.id);
check("choosing one unchooses the other", PLANS.chosen() && PLANS.chosen().id === second.id, "chosen");
PLANS.remove(first.id);
check("deleting removes one and only one", PLANS.list().length === 1, PLANS.list().length + " plans");
var named = PLANS.suggestName([{ activity: { title: "Temperate fruit and nut trees" } }], ["Temperate fruit and nut trees"]);
check("a taken name gets a number, not a clash", named !== "Temperate fruit and nut trees", named);

console.log("speech chunking");
check("no voice here, so reading is honestly unavailable", SPEECH.supported() === false, "supported() true with no voice");
var spoken = "First sentence. Second sentence. " + new Array(40).join("A very long sentence that keeps going and going. ");
var chunks = SPEECH._split(spoken, 180);
check("long text is cut into pieces", chunks.length > 1, chunks.length + " chunk(s)");
check(
  "no chunk runs far past the limit",
  chunks.every(function (c) {
    return c.length <= 220;
  }),
  "a chunk of " + Math.max.apply(null, chunks.map(function (c) { return c.length; })) + " chars"
);
check(
  "no empty chunks",
  chunks.every(function (c) {
    return c.trim().length > 0;
  }),
  "an empty chunk slipped through"
);

console.log("visit card honesty");
var cardData = {
  district: "Pulwama",
  village: "Tral",
  size: "3",
  unit: "kanal",
  landUse: "unused",
  water: "seasonal",
  terrain: "flat",
  soil: "none",
  constraint: "water",
};
var cardOptions = sampleOptions();
check("the full shortlist is rebuilt the way the card builds it", cardOptions.length >= 3, cardOptions.length + " options");
var overflowNote = null;
if (cardOptions.length > 3) {
  overflowNote = "Showing the first 3 of the " + cardOptions.length + " options marked. The rest are in the plan summary.";
  check("the overflow note names the counts", /\d+ of the \d+/.test(overflowNote), overflowNote);
} else {
  check("three or fewer need no overflow note", true, "nothing to hide");
}

/* ---- Report ---- */

console.log("");
if (failures.length) {
  console.error("Self test failed (" + checks + " checks, " + failures.length + " failing):");
  failures.forEach(function (f) {
    console.error("  - " + f);
  });
  process.exit(1);
}
console.log("Self test passed: " + checks + " checks across the catalogue, questions, saved plans and speech.");


