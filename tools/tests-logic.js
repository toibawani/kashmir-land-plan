#!/usr/bin/env node
/**
 * Behavioural tests for the logic that decides what a farmer is shown.
 *
 * `tools/verify.js` proves the files parse and the references exist. This file
 * proves the rules do what they claim: an altitude zone really narrows the
 * options, a zone with no catalogue data really shows the gap state instead of
 * lowland crops, and a review is never shown unless a person and a date are
 * recorded. It uses only Node built-ins, and fakes the browser with the
 * smallest sandbox the modules need.
 *
 * Run by `npm test`, after the build check.
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

function load(files, sandbox) {
  files.forEach(function (name) {
    var file = path.join(root, "js", name);
    new vm.Script(fs.readFileSync(file, "utf8"), {
      filename: path.relative(root, file),
    }).runInNewContext(sandbox);
  });
}

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

var sandbox = { window: {} };
sandbox.window.localStorage = makeStorage();
load(
  [
    "regions.js",
    "reviews.js",
    "catalogue.js",
    "sources.js",
    "activities.js",
    "schemes.js",
    "questions.js",
    "plans.js",
    "speech.js",
    "qr.js",
    "offline.js",
    "visitfit.js",
    "office.js",
    "share.js",
    "visitcard.js",
    "feedback.js",
    "messages.js",
  ],
  sandbox
);

var R = sandbox.window.MLMP_REGIONS;
var CATALOGUE = sandbox.window.MLMP_CATALOGUE;
var ACT = sandbox.window.MLMP_ACTIVITIES;
var SOURCES = sandbox.window.MLMP_SOURCES;
var csv = require("../tools/lib/review-csv.js");
var MSG = sandbox.window.MLMP_MESSAGES;
var SHARE = sandbox.window.MLMP_SHARE;
var VISIT = sandbox.window.MLMP_VISIT;
var FB = sandbox.window.MLMP_FEEDBACK;

console.log("altitude zones");

check("altitude zones are defined", !!R.ALTITUDE_ZONES, "no ALTITUDE_ZONES");
["valley", "plains", "high_altitude"].forEach(function (id) {
  check('the "' + id + '" altitude zone exists', !!R.altitudeZone(id));
});
check("every altitude zone carries a label and a band", Object.keys(R.ALTITUDE_ZONES).every(function (id) {
  var a = R.ALTITUDE_ZONES[id];
  return a.label && a.band;
}));

check(
  "valley maps to the valley catalogue zone",
  (R.catalogueZoneFor("valley") || {}).id === "valley_temperate"
);
check(
  "plains maps to the plains catalogue zone",
  (R.catalogueZoneFor("plains") || {}).id === "jammu_plains"
);
check(
  "high altitude maps to no catalogue zone, on purpose",
  R.catalogueZoneFor("high_altitude") === null
);
check(
  "high altitude carries a gap sentence instead of crop data",
  !!(R.altitudeZone("high_altitude").gap || "").match(/no honest data/i),
  R.altitudeZone("high_altitude").gap
);

check(
  "a district suggests an altitude the farmer can change",
  R.defaultAltitude("Pulwama") === "valley" && R.defaultAltitude("Jammu") === "plains",
  R.defaultAltitude("Pulwama") + ", " + R.defaultAltitude("Jammu")
);
check("an unknown district suggests nothing", R.defaultAltitude("Nowhere") === "");

// The gate that matters: an activity must not appear for an altitude whose
// catalogue has no entries. This mirrors the rule in app.js, kept here as a
// plain function so the behaviour is testable without a DOM.
function optionsFor(altitudeId, district) {
  var zone = R.catalogueZoneFor(altitudeId);
  var zoneId = zone ? zone.id : null;
  if (!zoneId) return [];
  return CATALOGUE.ids.filter(function (id) {
    var a = CATALOGUE.activities[id];
    if (a.zones.indexOf(zoneId) === -1) return false;
    if (a.districtsOnly && a.districtsOnly.indexOf(district) === -1) return false;
    return true;
  });
}

var high = optionsFor("high_altitude", "Pulwama");
check("high altitude returns no options at all", high.length === 0, high.join(", "));
check(
  "high altitude does not fall back to lowland crops",
  optionsFor("high_altitude", "Jammu").length === 0
);

var valley = optionsFor("valley", "Pulwama");
check("valley returns options", valley.length > 0);
check(
  "valley options all carry the valley zone",
  valley.every(function (id) {
    return CATALOGUE.activities[id].zones.indexOf("valley_temperate") !== -1;
  })
);
check(
  "a sub-tropical orchard is not offered in the valley",
  valley.indexOf("orchard_subtrop") === -1
);
check(
  "a temperate orchard is not offered on the plains",
  optionsFor("plains", "Jammu").indexOf("orchard_temp") === -1
);
check(
  "saffron stays limited to the districts where it is documented",
  optionsFor("valley", "Anantnag").indexOf("saffron_karewa") === -1 &&
    optionsFor("valley", "Pulwama").indexOf("saffron_karewa") !== -1
);

console.log("sources and figures");

check("the source registry loads", !!SOURCES && SOURCES.ids().length > 0);
check("every source has a name, a url and a stated use", SOURCES.all().every(function (s) {
  return s.name && /^https?:\/\//.test(s.url) && s.usedFor;
}));

var needsFile = fs.readFileSync(path.join(root, "NEEDS_SOURCES.md"), "utf8");

CATALOGUE.ids.forEach(function (id) {
  var a = CATALOGUE.activities[id];
  check('"' + id + '" declares cost, time, risk and sources', !!(a.startupCost && a.timeToFirstIncome && a.mainRisk && Array.isArray(a.sources)));
  check('"' + id + '" main risk matches its own risk list', a.mainRisk === a.risks[0], a.mainRisk);
  check(
    '"' + id + '" cites only registered sources',
    a.sources.every(function (sid) {
      return !!SOURCES.byId(sid);
    }),
    a.sources.join(", ")
  );
  check('"' + id + '" is accounted for in NEEDS_SOURCES.md', needsFile.indexOf(a.title) !== -1);

  ["startupCost", "timeToFirstIncome"].forEach(function (field) {
    var f = a[field];
    if (f.status === "verified") {
      check(
        '"' + id + '" ' + field + ' has a value, source and check date',
        !!f.value && !!SOURCES.byId(f.sourceId) && /^\d{4}-\d{2}-\d{2}$/.test(f.checkedOn || "")
      );
    } else {
      check('"' + id + '" ' + field + ' is a question, not a number', !/\d/.test(String(f.value || "")));
    }
  });
});

console.log("review wording");

var raw = { reviewStatus: "reviewed" };
var formatted = ACT.formatReview(raw);
check(
  "a reviewed flag with no name is shown as not reviewed",
  formatted.status === "not-reviewed",
  formatted.status
);

var reviewed = ACT.formatReview({
  reviewStatus: "reviewed",
  reviewedBy: "A Test Officer",
  office: "District Agriculture Office, Test District",
  designation: "Agriculture Extension Officer",
  reviewedOn: "2026-09-30",
});
check("a complete review names the officer", /A Test Officer/.test(reviewed.text));
check("every review wording keeps confirm locally", /confirm locally/i.test(reviewed.text));

console.log("review records");

var CLEAN = CATALOGUE.cleanReviewRecord;
check(
  "a review with no office is refused",
  CLEAN({ reviewStatus: "reviewed", reviewedBy: "A", reviewedOn: "2026-09-30" }).reviewStatus === "not-reviewed"
);
check(
  "a review with no name is refused",
  CLEAN({ reviewStatus: "reviewed", office: "Office", reviewedOn: "2026-09-30" }).reviewStatus === "not-reviewed"
);
check(
  "a review with an impossible date is refused",
  CLEAN({ reviewStatus: "reviewed", reviewedBy: "A", office: "Office", reviewedOn: "2026-13-45" }).reviewStatus === "not-reviewed"
);
var good = CLEAN({
  reviewStatus: "reviewed",
  reviewedBy: "A Test Officer",
  office: "District Agriculture Office",
  reviewedOn: "2026-09-30",
});
check("a complete record is accepted", good.reviewStatus === "reviewed" && good.office === "District Agriculture Office");
check(
  "nothing in the shipped catalogue displays as reviewed",
  CATALOGUE.ids.every(function (id) {
    return ACT.formatReview(CATALOGUE.activities[id]).status === "not-reviewed";
  })
);

console.log("visit card parts");

var carryNone = VISIT.documents({ soil: "none" });
var carryDone = VISIT.documents({ soil: "done" });
check("the carry list always tells the farmer to ask", carryNone.join(" ").match(/does not guess/i) !== null);
check("the carry list mentions the card itself", carryNone.join(" ").match(/This card/i) !== null);
check("a soil report changes the carry list", carryDone.join(" ").match(/soil test report/i) !== null);
check("with no soil test the list says to ask for one", carryNone.join(" ").match(/Ask where to get one/i) !== null);
check("no carry line states a document requirement", !carryNone.concat(carryDone).some(function (line) { return /must bring|documents? required|required documents/i.test(line); }));

var soilNo = VISIT.soilChecks({ soil: "none" }).join(" ");
var soilYes = VISIT.soilChecks({ soil: "done" }).join(" ");
check("soil checks ask how to get a test when there is none", /how to get a soil test/i.test(soilNo));
check("soil checks use a report the farmer already has", /take your soil test report/i.test(soilYes));
check("soil checks ask about drainage and sampling", /drainage/i.test(soilNo) && /sample/i.test(soilNo));

var groupOptions = [
  { activity: { id: "a", title: "Option A" } },
  { activity: { id: "b", title: "Option B" } },
];
var groupQs = [
  { id: "q1", about: "Option A", text: "A question" },
  { id: "q2", about: "Option B", text: "B question" },
  { id: "q3", about: null, text: "Closing question" },
];
var grouped = VISIT.groupQuestions(groupOptions, groupQs);
check("each question lands under its own option", grouped.byOption[0].questions[0].id === "q1" && grouped.byOption[1].questions[0].id === "q2");
check("a question with no option stays in the general list", grouped.general.length === 1 && grouped.general[0].id === "q3");
check(
  "no question is lost when grouping",
  grouped.byOption.reduce(function (n, g) { return n + g.questions.length; }, 0) + grouped.general.length === groupQs.length
);

console.log("languages");

check("three languages are offered", MSG.available().length === 3);
check("Urdu is right to left", MSG.dir("ur") === "rtl");
check("Hindi is left to right", MSG.dir("hi") === "ltr");
check("English is the reviewed source", MSG.reviewed("en") === true);
check("Hindi is not claimed as reviewed", MSG.reviewed("hi") === false);
check("Urdu is not claimed as reviewed", MSG.reviewed("ur") === false);

var enKeys = MSG.keys();
["hi", "ur"].forEach(function (code) {
  var dict = MSG.dict(code);
  var missing = enKeys.filter(function (k) {
    return !Object.prototype.hasOwnProperty.call(dict, k);
  });
  check(code + " covers every English key", missing.length === 0, missing.join(", "));
  check(
    code + " has no empty translation",
    enKeys.every(function (k) {
      return String(dict[k] || "").trim().length > 0;
    })
  );
});

["form.location", "results.title", "visit.title", "share.questions", "common.confirmLocally"].forEach(function (key) {
  check(
    '"' + key + '" is actually translated in Hindi and Urdu',
    MSG.dict("hi")[key] !== MSG.dict("en")[key] && MSG.dict("ur")[key] !== MSG.dict("en")[key]
  );
});

check("an unknown key falls back to the caller's English", MSG.tr("no.such.key", "English fallback") === "English fallback");

// The share message is built from labels, so it follows the chosen language.
var urShare = SHARE.build({
  reference: "MLMP-TEST",
  options: [{ title: "Test", marked: true }],
  questions: [{ text: "Test question", ticked: false }],
  labels: {
    heading: MSG.dict("ur")["share.heading"],
    options: MSG.dict("ur")["share.options"],
    questions: MSG.dict("ur")["share.questions"],
    marked: MSG.dict("ur")["share.marked"],
    madeWith: MSG.dict("ur")["share.madeWith"],
  },
});
check("the share message can be built in Urdu", urShare.indexOf(MSG.dict("ur")["share.options"]) !== -1);
check("the share message still carries the reference", urShare.indexOf("MLMP-TEST") !== -1);

console.log("review csv import");

var HEADER = "activity_id,decision,reviewer_name,office,designation,reviewed_on,note";
function csvRow(values) {
  return HEADER + "\n" + values;
}

var parsed = csv.parseCsv('a,b\n"x,y","line1\nline2"\n');
check("quoted commas survive parsing", parsed[1][0] === "x,y", parsed[1][0]);
check("quoted newlines survive parsing", parsed[1][1] === "line1\nline2");

var okRows = csv.parseCsv(
  csvRow("kitchen_garden,accept,A Review Officer,District Agriculture Office,Agriculture Extension Officer,2026-11-05,")
);
var okResult = csv.validate(okRows, CATALOGUE.ids);
check("a complete row is accepted", okResult.errors.length === 0 && !!okResult.records.kitchen_garden);
check("the accepted record carries the office", okResult.records.kitchen_garden.office === "District Agriculture Office");

function rejectRow(values, name) {
  var result = csv.validate(csv.parseCsv(csvRow(values)), CATALOGUE.ids);
  check(name, result.errors.length > 0 && Object.keys(result.records).length === 0, result.errors.join("; "));
}

rejectRow("not_an_activity,accept,A,Office,Officer,2026-11-05,", "an unknown activity id is refused");
rejectRow("kitchen_garden,accept,,Office,Officer,2026-11-05,", "a review with no name is refused by the importer");
rejectRow("kitchen_garden,accept,A,,Officer,2026-11-05,", "a review with no office is refused by the importer");
rejectRow("kitchen_garden,accept,A,Office,Officer,2026-02-31,", "an impossible date is refused by the importer");
rejectRow("kitchen_garden,accept,A,Office,Officer,05/11/2026,", "a non-ISO date is refused by the importer");
rejectRow("kitchen_garden,maybe,A,Office,Officer,2026-11-05,", "an unknown decision is refused by the importer");
rejectRow("kitchen_garden,accept,=cmd,Office,Officer,2026-11-05,", "a formula-shaped name is refused by the importer");

var badHeader = csv.validate([["activity_id", "decision"], ["kitchen_garden", "accept"]], CATALOGUE.ids);
check("a missing header column is refused", badHeader.errors.length > 0);

console.log("field-test answers");

check("three questions are defined", FB.questions().length === 3);
check("the questions are the ones the field test asks", FB.questions().map(function (q) { return q.id; }).join(",") === "useful,wrong,wouldUse");
check("there is no name or phone field", !FB.questions().some(function (q) { return /name|phone|email/i.test(q.id + " " + q.text); }));

var emptySave = FB.save({ useful: "Maybe", wouldUse: "Perhaps" });
check("an answer with nothing valid is refused", emptySave.ok === false);

var saved = FB.save({
  district: "Pulwama",
  altitude: "valley",
  language: "ur",
  useful: "Yes",
  wrong: "=cmd something on this plot",
  wouldUse: "Maybe",
});
check("a valid answer is saved locally", saved.ok === true);
check("the store has one answer", FB.list().length === 1, String(FB.list().length));
check("the free text has no spreadsheet formula prefix", FB.list()[0].wrong.charAt(0) !== "=", FB.list()[0].wrong);
check("the district and language are kept", FB.list()[0].district === "Pulwama" && FB.list()[0].language === "ur");

var csvText = FB.toCsv(FB.list());
check("the csv starts with the documented header", csvText.indexOf(FB.CSV_HEADER.join(",")) === 0);
check("the csv carries the answer", csvText.indexOf("Pulwama") !== -1);
check("the csv quotes every cell", csvText.split("\r\n")[1].indexOf('"') === 0);

var formulaRow = FB.toCsv([{ savedAt: "2026-11-05", district: "=HYPERLINK()", useful: "Yes" }]);
check("a formula-shaped stored value cannot start a cell on export", !/[",]=/.test(formulaRow), formulaRow);
check("the formula text itself is kept as plain text", formulaRow.indexOf("HYPERLINK()") !== -1, formulaRow);

FB.clear();
check("clearing removes the answers", FB.count() === 0);

console.log("");

if (failures.length) {
  console.error(failures.length + " of " + checks + " checks failed:");
  failures.forEach(function (f) {
    console.error("  - " + f);
  });
  process.exit(1);
}
console.log(checks + " checks passed.");
