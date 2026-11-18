#!/usr/bin/env node
/**
 * Turn Lighthouse JSON reports into a few honest lines, and fail on a floor.
 *
 * The scores are recorded in LIGHTHOUSE.md by hand, because a number in a doc
 * that nobody updates is worse than no number. This script prints the exact
 * figures to copy and refuses a build that drops below the floors below.
 *
 *   node tools/lighthouse-report.js /path/to/lighthouse.json [/path/to/2.json ...]
 *
 * Give it three runs and the floors are enforced on the median, not on
 * whichever run happened to land. Lighthouse has always recommended a median
 * of several runs; the reason is visible in this project's own history. One
 * CI run of this exact tree measured Performance 96 with 120 ms of blocking
 * time, and the next measured 80 with 710 ms on the same commit, on the same
 * shared runner type. A single sample on a machine somebody else shares is a
 * coin toss, and a floor that flips on it teaches people to ignore the floor.
 * The median is not a lower bar: a genuinely slower build moves all three
 * runs down.
 *
 * Lighthouse 11 is pinned in CI because 12 removed the PWA category. The PWA
 * score is therefore the old installability bundle, which is coarse; the real
 * offline behaviour is proved by tools/offline-check.js and the update flow by
 * tools/sw-update-check.js.
 */
"use strict";

var fs = require("fs");

var files = process.argv.slice(2);
if (!files.length || files.some(function (file) { return !fs.existsSync(file); })) {
  console.error("usage: node tools/lighthouse-report.js <lighthouse.json> [more.json ...]");
  process.exit(2);
}

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

var failures = [];
var runs = [];

files.forEach(function (file, index) {
  var report = JSON.parse(fs.readFileSync(file, "utf8"));
  var categories = report.categories || {};
  var audits = report.audits || {};
  var missing = Object.keys(NAMES).filter(function (key) {
    return !categories[key];
  });
  // A run that measured nothing is not a pass. This script reported "all
  // floors met" on a run where the browser never loaded the page, which is
  // exactly the shape of mistake a report is meant to catch. It must never be
  // averaged away with a good run either.
  if (missing.length) {
    missing.forEach(function (key) {
      failures.push("run " + (index + 1) + ": " + NAMES[key] + " was not measured, so that run proves nothing");
    });
    return;
  }
  runs.push({
    index: index + 1,
    version: report.lighthouseVersion || "unknown",
    categories: categories,
    audits: audits,
    performance: categories.performance.score,
  });
});

function metric(audits, id) {
  var a = audits[id];
  if (!a) return "n/a";
  if (typeof a.numericValue !== "number") return a.displayValue || "n/a";
  return a.displayValue || String(Math.round(a.numericValue));
}

function describe(run) {
  var audits = run.audits;
  return (
    "  FCP " + metric(audits, "first-contentful-paint") +
    ", LCP " + metric(audits, "largest-contentful-paint") +
    ", TBT " + metric(audits, "total-blocking-time") +
    ", CLS " + metric(audits, "cumulative-layout-shift") +
    ", Speed Index " + metric(audits, "speed-index")
  );
}

function percent(score) {
  return score === null || score === undefined ? "n/a" : String(Math.round(score * 100));
}

console.log("Lighthouse " + (runs.length ? runs[0].version : "unknown") + ", mobile emulation");

runs.forEach(function (run) {
  console.log(
    "Run " + run.index + " of " + files.length + ": " +
      Object.keys(NAMES).map(function (key) {
        return NAMES[key].replace(/ \(.*\)$/, "") + " " + percent(run.categories[key].score);
      }).join(", ")
  );
  console.log(describe(run));
});

// The median run is the one whose Performance score sits in the middle. Every
// other category correlates with it, so the whole run is reported rather than
// mixing categories from different runs, which would invent a sample nobody
// measured.
var median = runs
  .slice()
  .sort(function (a, b) { return (a.performance || 0) - (b.performance || 0); })[
  Math.floor((runs.length - 1) / 2)
];
if (runs.length > 1) {
  console.log(
    "\nPerformance across " + runs.length + " runs: " +
      runs.map(function (run) { return percent(run.performance); }).join(", ") +
      ". Floors are enforced on the median, run " + median.index + "."
  );
  console.log("The median run, run " + median.index + ":");
}

Object.keys(NAMES).forEach(function (key) {
  if (!median) return;
  var score = median.categories[key].score;
  console.log("  " + NAMES[key] + ": " + percent(score));
  if (score !== null && score !== undefined && score < FLOORS[key]) {
    failures.push(NAMES[key] + " is " + percent(score) + ", floor is " + Math.round(FLOORS[key] * 100));
  }
});

if (median) {
  console.log(describe(median));

  // The three audits that decide whether this app can be installed and used
  // with no signal, named individually so a regression is not hidden inside a
  // score.
  ["installable-manifest", "service-worker", "maskable-icon"].forEach(function (id) {
    var a = median.audits[id];
    if (!a) return;
    console.log("  " + id + ": " + (a.score === 1 ? "pass" : a.score === null ? "n/a" : "fail") +
      (a.displayValue ? " (" + a.displayValue + ")" : ""));
  });
}

if (failures.length) {
  console.error("\nLighthouse floor not met:");
  failures.forEach(function (f) {
    console.error("  - " + f);
  });
  process.exit(1);
}
console.log("\nAll Lighthouse floors met. Record these numbers in LIGHTHOUSE.md.");
