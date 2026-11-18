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

/* Measured 2026-11-17 with gzip -9, which is what the host serves. Raise these
   only with a number in LIGHTHOUSE.md explaining what was added.

   Raised on 2026-11-17 for the data controls to 129.0/16.1/12.8 KB, and again
   the same day for guided photo capture: js/photos.js (IndexedDB, resize and
   the quality check), the visit-card photo section in app.js and index.html,
   its 26 strings in messages.js and the photo styles. The budget is now
   138.0 KB JS, 16.5 KB CSS, 13.0 KB HTML.

   Raised on 2026-11-18 for the photo timeline: newest-first ordering, notes on
   each photo, the two-photo comparison in app.js, the photo cap and 13 more
   strings in messages.js. Measured 141885/16536/13082 bytes, so the budget is
   now 141.4 KB JS, 16.5 KB CSS, 13.0 KB HTML.

   Raised again the same day for the photo description block: js/observations.js
   (the closed schema and the consent gate), its section and wiring in
   index.html and app.js, and 9 more strings. Measured 146005/16675/13395 bytes,
   so the budget is now 145.5 KB JS, 16.5 KB CSS, 13.5 KB HTML. The module ships
   even though no service is connected, so the switch a farmer sees is the same
   code that would gate a provider.

   And once more for the update strip: 146713/16825/13464 bytes measured, with
   CSS only 71 bytes under its old limit, so the CSS budget moves to 17.0 KB to
   leave room for a fix rather than a scramble.

   Rebalanced, not raised, on 2026-11-18 for the system font stack and the
   header fix: 147691/17483/13483 measured, so the total is 174.5 KB against a
   176.0 KB total before. 512 bytes move from the JS line to the CSS line and
   the overall ceiling stays where it was.

   The same day, the boot path was split. Measured after the split: 109,935 JS,
   17,629 CSS, 13,724 HTML, which is a 138.1 KB first visit against 174.5 KB
   before, and 45,121 bytes of on-demand JavaScript in twelve files that are
   fetched by js/loader.js on the click that needs them. The JS ceiling stays
   at its old figure, so the saving is banked as headroom rather than spent.
   The on-demand total gets its own ceiling, because a first-visit-only budget
   would let the other half grow unwatched. Note the split costs about 7 KB in
   total (file headers and the loader itself) while saving 36 KB on the first
   screen: the trade is deliberate, and the on-demand figure is what keeps it
   accounted for. */
var BUDGET = { js: 148480, css: 17920, html: 13824, lazy: 46080 };

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

/* The files js/loader.js fetches on demand are not part of a first visit's
   download, but they are still shipped and still have to fit on a phone that
   uses the whole app. Measuring them separately keeps the boot figure honest
   without letting the on-demand half grow unwatched. */
var lazy = { total: 0, files: {} };
var loaderFile = path.join(root, "js", "loader.js");
if (fs.existsSync(loaderFile)) {
  var loaderText = fs.readFileSync(loaderFile, "utf8");
  var lazyRe = /"(js\/[a-z0-9._-]+\.js)"/gi;
  var lazyMatch;
  var seen = [];
  while ((lazyMatch = lazyRe.exec(loaderText)) !== null) {
    var rel = lazyMatch[1];
    if (seen.indexOf(rel) !== -1 || refs.indexOf(rel) !== -1) continue;
    seen.push(rel);
    var bytes = gz(rel);
    lazy.total += bytes;
    lazy.files[rel] = bytes;
  }
}
measured.lazy = lazy.total;
measured.lazyFiles = lazy.files;

if (process.argv.indexOf("--measure") !== -1) {
  console.log(JSON.stringify(measured, null, 2));
  process.exit(0);
}

var failures = [];
[["js", "JavaScript"], ["css", "CSS"], ["html", "index.html"], ["lazy", "On-demand JavaScript"]].forEach(function (pair) {
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
    ", first visit " +
    kb(total) +
    ", on demand " +
    kb(measured.lazy) +
    " of " +
    kb(BUDGET.lazy) +
    "."
);
