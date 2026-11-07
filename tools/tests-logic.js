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
    "land.js",
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
var PLANS = sandbox.window.MLMP_PLANS;

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

console.log("catalogue shape");

check("no activity id appears twice", CATALOGUE.ids.length === new Set(CATALOGUE.ids).size);
check(
  "every activity has a title, a reason and a risk",
  CATALOGUE.ids.every(function (id) {
    var a = CATALOGUE.activities[id];
    return String(a.title || "").trim() && String(a.why || "").trim() && (a.risks || []).length > 0;
  })
);
check(
  "every title is distinct, so a sheet cannot show the same line twice",
  new Set(
    CATALOGUE.ids.map(function (id) {
      return CATALOGUE.activities[id].title;
    })
  ).size === CATALOGUE.ids.length
);
check(
  "every activity names only catalogue zones",
  CATALOGUE.ids.every(function (id) {
    return CATALOGUE.activities[id].zones.every(function (zone) {
      return !!R.ZONES[zone];
    });
  })
);

console.log("districts and their altitudes");

/** The district list, whichever shape the module exports it in. */
function districtNames() {
  if (typeof R.names === "function") return R.names();
  if (Array.isArray(R.names)) return R.names.slice();
  return Object.keys(R.DISTRICTS || {});
}

// The list comes from the app, not from this test: writing the four ids out by
// hand is exactly how an earlier version of this check missed `hills` and
// reported six healthy districts as broken.
var OFFERED_ALTITUDES = [""].concat(Object.keys(R.ALTITUDE_ZONES));
check("the district list is not empty", districtNames().length > 0, String(districtNames().length));

var badAltitudes = districtNames().filter(function (name) {
  return OFFERED_ALTITUDES.indexOf(R.defaultAltitude(name)) === -1;
});
check(
  "no district suggests an altitude the form does not offer",
  badAltitudes.length === 0,
  badAltitudes
    .map(function (name) {
      return name + "=" + R.defaultAltitude(name);
    })
    .join(", ")
);

check(
  "a district that suggests an altitude gets a zone the catalogue knows",
  districtNames().every(function (name) {
    var altitude = R.defaultAltitude(name);
    return !altitude || !!R.altitudeZone(altitude);
  })
);

check(
  "every altitude the form offers has a label and a band",
  Object.keys(R.ALTITUDE_ZONES).every(function (id) {
    var a = R.ALTITUDE_ZONES[id];
    return a.label && a.band && a.summary;
  })
);

console.log("the district land reference");

var LAND = sandbox.window.MLMP_LAND;

check("the land module is loaded", !!LAND && typeof LAND.forDistrict === "function");
check(
  "every district the app offers has a land profile",
  R.names.every(function (name) {
    return !!LAND.forDistrict(name);
  }),
  R.names
    .filter(function (name) {
      return !LAND.forDistrict(name);
    })
    .join(", ")
);
check(
  "no land profile exists for a district the app does not offer",
  LAND.districts().every(function (name) {
    return R.names.indexOf(name) !== -1;
  }),
  LAND.districts()
    .filter(function (name) {
      return R.names.indexOf(name) === -1;
    })
    .join(", ")
);
check(
  "every land profile names zones the region module knows",
  LAND.districts().every(function (name) {
    var profile = LAND.forDistrict(name);
    return profile.zones.length > 0 && profile.zones.every(function (z) {
      return Object.keys(R.ZONES).indexOf(z.label === R.ZONES[Object.keys(R.ZONES).filter(function (k) { return R.ZONES[k] === z; })[0]] ? "" : "") !== -1 || z.label;
    });
  })
);
check(
  "every land profile cites only registered sources",
  LAND.districts().every(function (name) {
    return LAND.forDistrict(name).sources.every(function (id) {
      return !!SOURCES.byId(id);
    });
  })
);
check("an unknown district has no land profile", LAND.forDistrict("Atlantis") === null);
check(
  "the village answer admits the app holds no village record",
  /no village-level land record is held/i.test(LAND.statement())
);
check(
  "the village coverage states where the record lives",
  /patwari/.test(LAND.coverage().lines.join(" ")) && /jamabandi/.test(LAND.coverage().lines.join(" "))
);
check(
  "the village coverage cites a source for its counts",
  !!SOURCES.byId(LAND.coverage().sourceId)
);

check(
  "the village counts are real counts, not placeholders",
  [LAND.coverage().totalVillages, LAND.coverage().revenueVillages, LAND.coverage().patwarHalqas].every(
    function (n) {
      return typeof n === "number" && n > 100;
    }
  )
);
check(
  "every zone fact is filled in, so no panel row is blank",
  Object.keys(LAND.ZONES).every(function (id) {
    var z = LAND.ZONES[id];
    return z.label && z.altitude && z.rain && z.soils && z.field && z.fruit;
  })
);
check(
  "every district names its fruit",
  LAND.districts().every(function (name) {
    return String(LAND.forDistrict(name).fruit || "").trim().length > 20;
  })
);
check(
  "at least a third of the districts have their own documented line",
  LAND.districts().filter(function (name) {
    return LAND.forDistrict(name).specific;
  }).length >= 7
);
check(
  "the caveat says this is published information, not a record",
  /published information/i.test(LAND.statement()) && /not a record/i.test(LAND.statement())
);

check(
  "every district has the official counts",
  LAND.districts().every(function (name) {
    var a = LAND.admin(name);
    return a && a.area > 0 && a.population > 0 && a.blocks > 0 && a.tehsils > 0 && a.villages > 0;
  })
);
var landTotals = LAND.totals();
check("the district areas add up to the published total", landTotals.area === 42241, String(landTotals.area));
check("the district populations add up to the census total", landTotals.population === 12267013, String(landTotals.population));
check("the district blocks add up to the published total", landTotals.blocks === 285, String(landTotals.blocks));
check("the district tehsils add up to the published total", landTotals.tehsils === 207, String(landTotals.tehsils));
check("the district revenue villages add up to the published total", landTotals.villages === 6832, String(landTotals.villages));
check(
  "each division total matches the published figure",
  LAND.DIVISIONS.Kashmir.reduce(function (n, name) {
    return n + LAND.admin(name).villages;
  }, 0) === 3075 &&
    LAND.DIVISIONS.Jammu.reduce(function (n, name) {
      return n + LAND.admin(name).villages;
    }, 0) === 3757
);
check(
  "the two divisions cover every district exactly once",
  LAND.DIVISIONS.Kashmir.concat(LAND.DIVISIONS.Jammu).length === LAND.districts().length &&
    LAND.districts().every(function (name) {
      return LAND.divisionOf(name) !== "";
    })
);
check(
  "nearby districts are in the same division and never the district itself",
  LAND.districts().every(function (name) {
    return LAND.nearby(name).every(function (other) {
      return other !== name && LAND.divisionOf(other) === LAND.divisionOf(name);
    });
  })
);
check(
  "the panel offers every other district in the division, not a sample",
  LAND.districts().every(function (name) {
    return LAND.nearby(name).length === LAND.districts().length / 2 - 1;
  }) && LAND.nearby("Anantnag", 3).length === 3
);

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

console.log("the card and the share message over-claim nothing");

var cardLines = VISIT.documents({ soil: "none" })
  .concat(VISIT.documents({ soil: "done" }))
  .concat(VISIT.soilChecks({ soil: "none" }))
  .concat(VISIT.soilChecks({ soil: "done" }));
var claimTools = require("../tools/claims.js");
check(
  "no line on the office card states an amount, deadline or rule",
  cardLines.every(function (line) {
    return claimTools.findClaims(line).length === 0;
  }),
  cardLines.filter(function (line) {
    return claimTools.findClaims(line).length > 0;
  })[0]
);

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

// A sheet exported from Excel arrives with a byte-order mark and CRLF endings.
// Both are ordinary, and neither may be mistaken for a broken file.
var bomRows = csv.parseCsv(
  "\uFEFF" +
    csvRow("kitchen_garden,accept,A Review Officer,District Agriculture Office,Agriculture Extension Officer,2026-11-05,")
);
check("a byte-order mark does not hide the header", bomRows[0][0] === "activity_id", bomRows[0][0]);
check("a file saved with a byte-order mark still imports", csv.validate(bomRows, CATALOGUE.ids).errors.length === 0);

var crlfRows = csv.parseCsv(
  csvRow("kitchen_garden,accept,A Review Officer,District Agriculture Office,Agriculture Extension Officer,2026-11-05,").replace(
    /\n/g,
    "\r\n"
  )
);
check(
  "windows line endings import like unix ones",
  csv.validate(crlfRows, CATALOGUE.ids).errors.length === 0 && crlfRows.length === 2,
  String(crlfRows.length)
);

var twice = csv.validate(
  csv.parseCsv(
    csvRow("kitchen_garden,accept,A Review Officer,District Agriculture Office,Agriculture Extension Officer,2026-11-05,") +
      "\n" +
      csvRow("kitchen_garden,accept,B Review Officer,District Agriculture Office,Agriculture Extension Officer,2026-11-05,")
  ),
  CATALOGUE.ids
);
check(
  "the same activity twice in one file is refused",
  /more than once/.test(twice.errors.join(" ")) && Object.keys(twice.records).length === 0,
  twice.errors.join("; ")
);

var longName = new Array(201).join("A");
var capped = csv.validate(
  csv.parseCsv(csvRow("kitchen_garden,accept," + longName + ",Office,Officer,2026-11-05,")),
  CATALOGUE.ids
);
check(
  "an over-long name is capped, not stored whole",
  capped.records.kitchen_garden.reviewedBy.length === 80,
  String((capped.records.kitchen_garden || {}).reviewedBy || "").length
);

var unknownColumn = csv.parseCsv(
  "activity_id,decision,reviewer_name,office,designation,reviewed_on,note,extra\nkitchen_garden,accept,A,Office,Officer,2026-11-05,,"
);
check(
  "an unknown column is refused rather than ignored",
  /does not know/.test(csv.validate(unknownColumn, CATALOGUE.ids).errors.join(" ")),
  csv.validate(unknownColumn, CATALOGUE.ids).errors.join("; ")
);

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

console.log("prefilled district review sheets");

var PACK_HEADER = csv.PACK_COLUMNS.join(",");
var PACKV = require(path.join(root, "tools", "lib", "pack-version.js"));
var packContext = {
  sheetVersion: PACKV.SHEET_VERSION,
  districts: {
    Baramulla: {
      beekeeping: "Beekeeping as an allied activity",
      fodder_or_pasture: "Fodder crop or managed pasture",
    },
  },
};

/** A row of the eight officer columns; the sheet version is appended here. */
function packResult(row, sheetVersion) {
  return csv.validate(
    [
      PACK_HEADER.split(","),
      row.concat([sheetVersion === undefined ? PACKV.SHEET_VERSION : sheetVersion]),
    ],
    [],
    packContext
  );
}

var packRight = packResult([
  "Baramulla",
  "beekeeping",
  "Beekeeping as an allied activity",
  "right",
  "",
  "A Review Officer",
  "District Agriculture Office",
  "2026-11-05",
]);
check(
  "a right tick records a review",
  packRight.errors.length === 0 && packRight.records.beekeeping.reviewStatus === "reviewed",
  packRight.errors.join("; ")
);
check(
  "a right tick carries the office and the date",
  packRight.records.beekeeping.office === "District Agriculture Office" &&
    packRight.records.beekeeping.reviewedOn === "2026-11-05"
);
check("a right tick needs no correction", packRight.corrections.length === 0);

var packFix = packResult([
  "Baramulla",
  "fodder_or_pasture",
  "Fodder crop or managed pasture",
  "wrong",
  "Oats are the local second crop here, not mustard",
  "A Review Officer",
  "District Agriculture Office",
  "2026-11-05",
]);
check(
  "a wrong tick with a correction becomes a fix",
  packFix.corrections.length === 1 && packFix.corrections[0].decision === "fix"
);
check("a wrong tick still records the review", Object.keys(packFix.records).length === 1);

var packReject = packResult([
  "Baramulla",
  "fodder_or_pasture",
  "Fodder crop or managed pasture",
  "wrong",
  "",
  "A Review Officer",
  "District Agriculture Office",
  "2026-11-05",
]);
check(
  "a wrong tick without a correction becomes a reject",
  packReject.corrections.length === 1 && packReject.corrections[0].decision === "reject"
);

function packSkip(verdict, name) {
  var result = packResult([
    "Baramulla",
    "beekeeping",
    "Beekeeping as an allied activity",
    verdict,
    "",
    "",
    "",
    "",
  ]);
  check(
    name,
    result.errors.length === 0 && Object.keys(result.records).length === 0 && result.skipped === 1,
    result.errors.join("; ")
  );
}
packSkip("not sure", "not sure records nothing and is not an error");
packSkip("", "a blank verdict is skipped, not recorded");

function packError(row, name) {
  var result = packResult(row);
  check(name, result.errors.length > 0 && Object.keys(result.records).length === 0, result.errors.join("; "));
}

packError(
  ["Baramulla", "beekeeping", "A different line entirely", "right", "", "A", "Office", "2026-11-05"],
  "a stale entry text is refused rather than guessed at"
);
packError(
  ["Pulwama", "beekeeping", "Beekeeping as an allied activity", "right", "", "A", "Office", "2026-11-05"],
  "an entry not on that district's sheet is refused"
);
packError(
  ["Atlantis", "beekeeping", "Beekeeping as an allied activity", "right", "", "A", "Office", "2026-11-05"],
  "an unknown district is refused"
);
packError(
  ["Baramulla", "beekeeping", "Beekeeping as an allied activity", "maybe", "", "A", "Office", "2026-11-05"],
  "an unknown verdict is refused"
);
packError(
  ["Baramulla", "beekeeping", "Beekeeping as an allied activity", "right", "", "", "Office", "2026-11-05"],
  "a tick with no reviewer name is refused"
);
packError(
  ["Baramulla", "beekeeping", "Beekeeping as an allied activity", "wrong", "=cmd", "A", "Office", "2026-11-05"],
  "a formula-shaped correction is refused"
);

var stalePack = packResult(
  ["Baramulla", "beekeeping", "Beekeeping as an allied activity", "right", "", "A", "Office", "2026-11-05"],
  "v0.9.0 · catalogue 0000000"
);
check(
  "a sheet printed from a different catalogue is refused",
  stalePack.errors.length === 1 && Object.keys(stalePack.records).length === 0,
  stalePack.errors.join("; ")
);
check(
  "the refusal tells the officer to reprint the sheet",
  /reprint the sheet/i.test(stalePack.errors.join(" ")),
  stalePack.errors.join("; ")
);
check(
  "the refusal names both versions, so a maintainer can see which is which",
  stalePack.errors.join(" ").indexOf("v0.9.0 · catalogue 0000000") !== -1 &&
    stalePack.errors.join(" ").indexOf(PACKV.SHEET_VERSION) !== -1,
  stalePack.errors.join("; ")
);

var noVersion = packResult(
  ["Baramulla", "beekeeping", "Beekeeping as an allied activity", "right", "", "A", "Office", "2026-11-05"],
  ""
);
check(
  "a sheet with no version at all is refused",
  noVersion.errors.length === 1 && /no sheet version/i.test(noVersion.errors[0]),
  noVersion.errors.join("; ")
);

var mixedVersions = csv.validate(
  [
    PACK_HEADER.split(","),
    ["Baramulla", "beekeeping", "Beekeeping as an allied activity", "not sure", "", "", "", ""].concat([
      PACKV.SHEET_VERSION,
    ]),
    ["Baramulla", "fodder_or_pasture", "Fodder crop or managed pasture", "not sure", "", "", "", ""].concat([
      "v0.9.0 · catalogue 0000000",
    ]),
  ],
  [],
  packContext
);
check(
  "a file stitched from two printouts is refused",
  mixedVersions.errors.length === 1 && /more than one sheet version/.test(mixedVersions.errors[0]),
  mixedVersions.errors.join("; ")
);

var committedSheet = csv.parseCsv(
  fs.readFileSync(path.join(root, "review-sheets", "Baramulla.csv"), "utf8")
);
check(
  "the committed district CSV uses the documented columns",
  committedSheet[0].join(",") === PACK_HEADER
);
check(
  "the committed district CSV has one row per activity",
  committedSheet.length === 7,
  String(committedSheet.length)
);
/** The entries the generator would list for a district, from the live data. */
function districtEntries(name) {
  var zone = R.catalogueZoneFor(R.defaultAltitude(name));
  var map = {};
  if (!zone) return map;
  ACT.ids
    .map(function (id) {
      return ACT.ALL[id];
    })
    .forEach(function (a) {
      if (a.zones.indexOf(zone.id) === -1) return;
      if (a.districtsOnly && a.districtsOnly.indexOf(name) === -1) return;
      map[a.id] = a.title;
    });
  return map;
}

check(
  "every committed sheet row carries the current sheet version",
  committedSheet.slice(1).every(function (row) {
    return row[row.length - 1] === PACKV.SHEET_VERSION;
  }),
  committedSheet.length > 1 ? committedSheet[1][committedSheet[1].length - 1] : "no rows"
);

var blankImport = csv.validate(committedSheet, [], {
  sheetVersion: PACKV.SHEET_VERSION,
  districts: { Baramulla: districtEntries("Baramulla") },
});
check(
  "an unmarked committed sheet imports as nothing, with no error",
  blankImport.errors.length === 0 &&
    Object.keys(blankImport.records).length === 0 &&
    blankImport.skipped === committedSheet.length - 1,
  blankImport.errors.join("; ")
);

// A correction of spaces is not a correction: it has to become a plain reject,
// so the app shows the line as wrong instead of as fixed with an empty note.
var packBlankCorrection = packResult([
  "Baramulla",
  "fodder_or_pasture",
  "Fodder crop or managed pasture",
  "wrong",
  "   ",
  "A Review Officer",
  "District Agriculture Office",
  "2026-11-05",
]);
check(
  "a wrong tick with only spaces in the correction becomes a reject",
  packBlankCorrection.corrections.length === 1 && packBlankCorrection.corrections[0].decision === "reject",
  JSON.stringify(packBlankCorrection.corrections[0] || {})
);

console.log("field test answers, summarised");

var summaryTools = require(path.join(root, "tools", "feedback-summary.js"));
check("the summary reads the same header the page exports", summaryTools.header().join(",") === FB.CSV_HEADER.join(","));

var summary = summaryTools.summarise(
  [FB.CSV_HEADER].concat([
    ["2026-11-05T10:00:00Z", "Baramulla", "valley", "ur", "Yes", "Beekeeping note", "Maybe"],
    ["2026-11-05T10:05:00Z", "Baramulla", "valley", "ur", "No", "", "No"],
    ["2026-11-05T10:10:00Z", "Pulwama", "valley", "hi", "A little", "", "Yes"],
    ["2026-11-05T10:15:00Z", "", "", "", "", "Only free text", ""],
    ["2026-11-05T10:20:00Z", "", "", "", "", "", ""],
  ])
);
check("every answered row is counted", summary.total === 4, String(summary.total));
check("the empty row is ignored", summary.skipped === 1, String(summary.skipped));
check(
  "the useful counts follow the options",
  summary.useful.Yes === 1 && summary.useful.No === 1 && summary.useful["A little"] === 1
);
check("an unanswered closed question is counted as unanswered", summary.useful["(no answer)"] === 1);
check("the free text is kept with its district and language", summary.freeText.length === 2 && summary.freeText[0].district === "Baramulla");
check("the free text wording survives", summary.freeText.some(function (t) { return t.text === "Only free text"; }));
check("answers are counted by language", summary.byLanguage.ur === 2 && summary.byLanguage.hi === 1);
check("answers are counted by district", summary.byDistrict.Baramulla === 2 && summary.byDistrict.Pulwama === 1);

console.log("honest language labels");

["en", "hi", "ur"].forEach(function (code) {
  var label = MSG.optionLabel(code);
  var marked = /जाँच|جانچ|pending/i.test(label);
  check(
    "the " + code + " menu label carries the caveat exactly when the language is unreviewed",
    marked === !MSG.reviewed(code),
    label
  );
});
check("the English option is just its own name", MSG.optionLabel("en") === "English", MSG.optionLabel("en"));

console.log("");

if (failures.length) {
  console.error(failures.length + " of " + checks + " checks failed:");
  failures.forEach(function (f) {
    console.error("  - " + f);
  });
  process.exit(1);
}
console.log(checks + " checks passed.");
