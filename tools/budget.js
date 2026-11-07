#!/usr/bin/env node
/**
 * Hold the shipped payload to a measured budget.
 *
 * The app is downloaded on a phone, often once, often on a metered connection.
 * That makes weight a product decision, not a build detail: this fails when the
 * code grows past what LIGHTHOUSE.md records, so growth has to be a deliberate
 * edit to the budget rather than a side effect of a feature.
 *
 * Only files index.html actually references are counted, because those are what
 * a first visit downloads. Images and the catalogue's own data are excluded.
 *
 *   node tools/budget.js            compare against the budget
 *   node tools/budget.js --measure  print the current sizes as JSON
 */
"use strict";

var fs = require("fs");
var path = require("path");
var zlib = require("zlib");

var root = path.resolve(__dirname, "..");

/* Measured 2026-11-07 with gzip -9, which is what the host serves. Raise these
   only with a number in LIGHTHOUSE.md explaining what was added. */
var BUDGET = { js: 122784, css: 16470, html: 12331 };

function gz(file) {
  return zlib.gzipSync(fs.readFileSync(path.join(root, file)), { level: 9 }).length;
}

var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var refs = [];
var re = /<(?:script[^>]+src|link[^>]+href)="([^"]+)"/g;
var match;
while ((match = re.exec(html)) !== null) {
  var url = match[1];
  if (/^https?:/i.test(url) || /\.webmanifest$/.test(url)) continue;
  if (/^(js|css)\//.test(url) && refs.indexOf(url) === -1) refs.push(url);
}

var measured = { js: 0, css: 0, html: gz("index.html"), files: {} };
refs.forEach(function (rel) {
  var size = gz(rel);
  measured[rel.slice(0, 2) === "js" ? "js" : "css"] += size;
  measured.files[rel] = size;
});

if (process.argv.indexOf("--measure") !== -1) {
  console.log(JSON.stringify(measured, null, 2));
  process.exit(0);
}

var failures = [];
[["js", "JavaScript"], ["css", "CSS"], ["html", "index.html"]].forEach(function (pair) {
  var key = pair[0];
  if (BUDGET[key] && measured[key] > BUDGET[key]) {
    failures.push(
      pair[1] +
        " is " +
        kb(measured[key]) +
        ", past the " +
        kb(BUDGET[key]) +
        " budget. Measure the change, record it in LIGHTHOUSE.md, then raise the budget deliberately."
    );
  }
});

function kb(bytes) {
  return (bytes / 1024).toFixed(1) + " KB";
}

var total = measured.js + measured.css + measured.html;

if (failures.length) {
  console.error("Payload budget failed:");
  failures.forEach(function (f) {
    console.error("  - " + f);
  });
  process.exit(1);
}

console.log(
  "Payload within budget: JS " +
    kb(measured.js) +
    " of " +
    kb(BUDGET.js) +
    ", CSS " +
    kb(measured.css) +
    " of " +
    kb(BUDGET.css) +
    ", HTML " +
    kb(measured.html) +
    " of " +
    kb(BUDGET.html) +
    ", total " +
    kb(total) +
    "."
);
