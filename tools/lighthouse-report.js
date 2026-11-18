#!/usr/bin/env node
/**
 * Turn a Lighthouse JSON report into a few honest lines, and fail on a floor.
 *
 * The scores are recorded in LIGHTHOUSE.md by hand, because a number in a doc
 * that nobody updates is worse than no number. This script prints the exact
 * figures to copy and refuses a build that drops below the floors below.
 *
 *   node tools/lighthouse-report.js /path/to/lighthouse.json
 *
 * Lighthouse 11 is pinned in CI because 12 removed the PWA category. The PWA
 * score is therefore the old installability bundle, which is coarse; the real
 * offline behaviour is proved by tools/offline-check.js and the update flow by
 * tools/sw-update-check.js.
 */
"use strict";

var fs = require("fs");

var file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error("usage: node tools/lighthouse-report.js <lighthouse.json>");
  process.exit(2);
}

var report = JSON.parse(fs.readFileSync(file, "utf8"));
var categories = report.categories || {};
var audits = report.audits || {};

// Floors, set from measured runs and recorded in LIGHTHOUSE.md. They are a
// regression guard, not a target.
//
// Performance was 0.7 because the boot path evaluated twenty-seven scripts and
// total blocking time swung between 160 ms and 760 ms on a shared runner. The
// boot path was then split: eleven files moved to js/loader.js and are fetched
// on the click that needs them. Three measured runs after the split gave 95, 95
// and 95, with 40 ms, 0 ms and 0 ms of blocking time. The floor is now 0.85,
// which is the figure this work was asked to reach, so a regression that gave
// the boot path back would fail here instead of being absorbed.
var FLOORS = { performance: 0.85, accessibility: 0.95, "best-practices": 0.9, pwa: 0.8 };
var NAMES = {
  performance: "Performance",
  accessibility: "Accessibility",
  "best-practices": "Best practices",
  pwa: "PWA (Lighthouse 11 installability bundle)",
};

console.log("Lighthouse " + (report.lighthouseVersion || "unknown") + ", mobile emulation");
var failures = [];
Object.keys(NAMES).forEach(function (key) {
  var category = categories[key];
  if (!category) {
    // A run that measured nothing is not a pass. This script reported "all
    // floors met" on a run where the browser never loaded the page, which is
    // exactly the shape of mistake a report is meant to catch.
    console.log("  " + NAMES[key] + ": not reported by this version");
    failures.push(NAMES[key] + " was not measured, so this run proves nothing");
    return;
  }
  var score = category.score;
  var percent = score === null || score === undefined ? "n/a" : String(Math.round(score * 100));
  console.log("  " + NAMES[key] + ": " + percent);
  if (score !== null && score !== undefined && score < FLOORS[key]) {
    failures.push(NAMES[key] + " is " + percent + ", floor is " + Math.round(FLOORS[key] * 100));
  }
});

function metric(id) {
  var a = audits[id];
  if (!a) return "n/a";
  if (typeof a.numericValue !== "number") return a.displayValue || "n/a";
  return a.displayValue || String(Math.round(a.numericValue));
}
console.log(
  "  FCP " + metric("first-contentful-paint") +
    ", LCP " + metric("largest-contentful-paint") +
    ", TBT " + metric("total-blocking-time") +
    ", CLS " + metric("cumulative-layout-shift") +
    ", Speed Index " + metric("speed-index")
);

// The three audits that decide whether this app can be installed and used with
// no signal, named individually so a regression is not hidden inside a score.
["installable-manifest", "service-worker", "maskable-icon"].forEach(function (id) {
  var a = audits[id];
  if (!a) return;
  console.log("  " + id + ": " + (a.score === 1 ? "pass" : a.score === null ? "n/a" : "fail") +
    (a.displayValue ? " (" + a.displayValue + ")" : ""));
});

if (failures.length) {
  console.error("\nLighthouse floor not met:");
  failures.forEach(function (f) {
    console.error("  - " + f);
  });
  process.exit(1);
}
console.log("\nAll Lighthouse floors met. Record these numbers in LIGHTHOUSE.md.");
