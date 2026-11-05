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
    "catalogue.js",
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
    "messages.js",
  ],
  sandbox
);

var R = sandbox.window.MLMP_REGIONS;
var CATALOGUE = sandbox.window.MLMP_CATALOGUE;
var ACT = sandbox.window.MLMP_ACTIVITIES;

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
  designation: "Agriculture Extension Officer",
  reviewedOn: "2026-09-30",
});
check("a complete review names the officer", /A Test Officer/.test(reviewed.text));
check("every review wording keeps confirm locally", /confirm locally/i.test(reviewed.text));

console.log("");

if (failures.length) {
  console.error(failures.length + " of " + checks + " checks failed:");
  failures.forEach(function (f) {
    console.error("  - " + f);
  });
  process.exit(1);
}
console.log(checks + " checks passed.");
