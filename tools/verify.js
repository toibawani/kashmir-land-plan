#!/usr/bin/env node
/**
 * Pre-flight check for a no-build site, run by `npm run build`.
 *
 * There is nothing to compile here, so "build" does the job that actually
 * matters for a static app: it fails loudly before a broken file reaches a
 * farmer's phone. Two things have broken this app for real before, and both
 * are checked here.
 *
 *   1. A stray character in a script left it unparseable, so no screen
 *      responded at all. Every JavaScript file is syntax-checked the same way
 *      `node --check` does it, by compiling without running it.
 *   2. A file was referenced but not present, or the service worker's
 *      precache list drifted from what the page loads, so the app worked
 *      online and broke offline. Every local reference in index.html is
 *      confirmed on disk, and the precache list is reconciled against it.
 *
 * It uses only Node built-ins. A non-zero exit means do not ship.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var root = path.resolve(__dirname, "..");
var failures = [];
var notes = [];

function rel(p) {
  return path.relative(root, p) || p;
}

function exists(p) {
  try {
    return fs.statSync(p).isFile();
  } catch (_) {
    return false;
  }
}

/* ---- 1. Every JavaScript file must parse ---- */

function listJsFiles(dir) {
  var out = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    var full = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(listJsFiles(full));
    else if (entry.name.endsWith(".js")) out.push(full);
  });
  return out;
}

var jsFiles = listJsFiles(path.join(root, "js")).concat([path.join(root, "sw.js")]);

jsFiles.forEach(function (file) {
  var code = fs.readFileSync(file, "utf8");
  try {
    // Compiles without running, so browser globals like `window` are fine.
    new vm.Script(code, { filename: rel(file) });
  } catch (err) {
    failures.push(rel(file) + " does not parse: " + err.message);
  }
});

/* ---- 2. Every local reference in index.html must exist on disk ---- */

var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var refs = [];
var refRe = /(?:src|href)="([^"]+)"/g;
var match;
while ((match = refRe.exec(html)) !== null) {
  var target = match[1];
  // Skip anything that leaves the site: absolute URLs, in-page anchors, data.
  if (/^(https?:)?\/\//.test(target) || target.startsWith("#") || target.startsWith("data:")) continue;
  refs.push(target);
}
refs = refs.filter(function (v, i, a) {
  return a.indexOf(v) === i;
});

var htmlScripts = refs.filter(function (r) {
  return r.endsWith(".js");
});

refs.forEach(function (r) {
  if (!exists(path.join(root, r))) {
    failures.push("index.html references " + r + " but it is not on disk");
  }
});

/* ---- 3. The service worker must precache what the page loads ---- */

var sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
var assetsBlock = sw.match(/var\s+CORE_ASSETS\s*=\s*\[([\s\S]*?)\]/);
var precache = [];
if (assetsBlock) {
  var itemRe = /"([^"]+)"/g;
  var item;
  while ((item = itemRe.exec(assetsBlock[1])) !== null) {
    precache.push(item[1].replace(/^\.\//, ""));
  }
}

precache.forEach(function (r) {
  if (!exists(path.join(root, r))) {
    failures.push("sw.js precaches " + r + " but it is not on disk");
  }
});

// Anything the page loads that is not precached will break offline.
htmlScripts
  .concat(refs.filter(function (r) { return r.endsWith(".css") || r === "manifest.webmanifest"; }))
  .forEach(function (r) {
    if (precache.indexOf(r) === -1) {
      failures.push("index.html loads " + r + " but sw.js does not precache it, so it breaks offline");
    }
  });

// The reverse is only a note: an extra precached file is harmless.
precache.forEach(function (r) {
  if (refs.indexOf(r) === -1 && !/\.js$/.test(r)) {
    notes.push("sw.js precaches " + r + " which index.html does not reference directly");
  }
});

/* ---- 4. A recorded officer review must be complete ---- */

// A half-filled review is worse than none at all: a bare "reviewed" flag
// with no name and no date would look signed off without any officer behind
// it. So whenever the catalogue claims a review, the build refuses to pass
// until the name of the reviewer and the date of the check are both there.
// This is run, not just parsed, which is safe here because the data modules
// only define objects on a fake `window` and touch the network nowhere.
var sandbox = { window: {} };
try {
  // The order is load order, not luck: activities.js refuses to load without
  // the catalogue already on `window`, so the files are named in the same
  // sequence index.html loads them in.
  ["regions.js", "catalogue.js", "activities.js"]
    .map(function (name) {
      return path.join(root, "js", name);
    })
    .forEach(function (file) {
      new vm.Script(fs.readFileSync(file, "utf8"), { filename: rel(file) }).runInNewContext(sandbox);
    });
} catch (err) {
  failures.push("review check could not run the catalogue: " + err.message);
}

if (!failures.length && sandbox.window.MLMP_CATALOGUE && sandbox.window.MLMP_ACTIVITIES) {
  var catalogue = sandbox.window.MLMP_CATALOGUE;
  var activities = sandbox.window.MLMP_ACTIVITIES;

  // Dates are checked by shape (YYYY-MM-DD) rather than by calendar, because
  // rejecting an unlikely-but-real date would be a worse mistake than
  // accepting one nobody can vouch for. The officer's name carries the trust.
  function dateLooksRight(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  function checkReviewRecord(where, record) {
    if (!record) {
      failures.push(where + " has no review record");
      return;
    }
    if (record.reviewStatus !== "not-reviewed" && record.reviewStatus !== "reviewed") {
      failures.push(where + ' has reviewStatus "' + record.reviewStatus + '", which must be "not-reviewed" or "reviewed"');
      return;
    }
    if (record.reviewStatus === "reviewed") {
      if (!String(record.reviewedBy || "").trim()) {
        failures.push(where + ' is marked "reviewed" but names no reviewer; leave it "not-reviewed" rather than guessing');
      }
      if (!dateLooksRight(record.reviewedOn)) {
        failures.push(where + ' is marked "reviewed" but the date is missing or not YYYY-MM-DD; leave it "not-reviewed" rather than guessing');
      }
    }
  }

  checkReviewRecord("The whole-catalogue review", catalogue.review);

  Object.keys(catalogue.activities || {}).forEach(function (id) {
    var a = catalogue.activities[id];
    checkReviewRecord('The "' + id + '" activity review', {
      reviewStatus: a.reviewStatus || "not-reviewed",
      reviewedBy: a.reviewedBy || "",
      reviewedOn: a.reviewedOn || "",
    });
  });

  // The wording the farmer hears and reads carries a standing instruction to
  // confirm locally. If a future edit drops that sentence from one state, the
  // build should fail here, not on someone's phone.
  // Note the split: formatReview wordsmiths a single record, while reviewFor
  // decides what the whole shown list may claim. The mixed state only exists
  // at the list level, so that is where it is checked.
  [{ status: "not-reviewed" }, { status: "reviewed", reviewedBy: "Test Officer", reviewedOn: "2026-01-01" }].forEach(
    function (entry) {
      var text = activities.formatReview(entry).text;
      if (!/confirm locally/i.test(text)) {
        failures.push('The "' + entry.status + '" review wording lost its confirm-locally sentence; a review must never remove it');
      }
    }
  );

  // Two entries where only one is reviewed must read as mixed, never as fully
  // approved. That is the state most likely to be misread on a small screen,
  // so it is pinned here: the mixed path only triggers when part of the list
  // is still unchecked, which needs at least two entries on the list.
  var mixed = activities.reviewFor([
    { reviewStatus: "reviewed", reviewedBy: "Test Officer", reviewedOn: "2026-01-01" },
    {},
  ]);
  if (mixed.status !== "mixed") {
    failures.push('The half-reviewed list read as "' + mixed.status + '" instead of "mixed"; it must never look fully approved');
  }
  if (!/confirm locally/i.test(mixed.text)) {
    failures.push('The "mixed" review wording lost its confirm-locally sentence; a review must never remove it');
  }
}

/* ---- Report ---- */

notes.forEach(function (n) {
  console.log("note: " + n);
});

if (failures.length) {
  console.error("\nBuild check failed:");
  failures.forEach(function (f) {
    console.error("  - " + f);
  });
  process.exit(1);
}

console.log(
  "\nBuild check passed: " +
    jsFiles.length +
    " scripts parse, " +
    refs.length +
    " local references resolve, " +
    precache.length +
    " assets precached for offline."
);
