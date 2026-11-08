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
var claims = require("./claims.js");

var root = path.resolve(__dirname, "..");
var failures = [];
var notes = [];

// Read once: the wording and copy checks both ask what the interface actually
// does with the text, not only whether the text exists.
var appCode = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");

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
  // Order is load order: activities.js refuses to load without the catalogue
  // already on `window`. schemes.js is standalone, and is loaded because the
  // support copy is scanned further down.
  ["regions.js", "catalogue.js", "activities.js", "schemes.js"]
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

  // A recorded review is a claim that a named person checked this list on a
  // particular day, so the date has to be a day that exists. This was a shape
  // check (YYYY-MM-DD) for a while; it is now a real calendar check, because
  // 2026-02-30 and month 13 can only ever be typos, never a review, and a
  // plausible-looking wrong date is exactly the mistake nobody notices.
  //
  // Two bounds come with it. A review cannot have happened in the future, and
  // one day of slack absorbs the difference between the officer's calendar and
  // this build's clock. Nor can it have happened before this project existed.
  function parseReviewDate(value) {
    var text = String(value || "").trim();
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (!m) return { ok: false, why: "is not a date in YYYY-MM-DD form" };

    var year = Number(m[1]);
    var month = Number(m[2]);
    var day = Number(m[3]);
    if (month < 1 || month > 12) return { ok: false, why: "names month " + m[2] + ", which does not exist" };
    if (day < 1) return { ok: false, why: "names day " + m[3] + ", which does not exist" };

    var leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    var lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day > lengths[month - 1]) {
      return {
        ok: false,
        why: "names day " + day + " of a month that has " + lengths[month - 1] + " days in " + year,
      };
    }

    if (year < 2020) return { ok: false, why: "is before this project existed (" + text + ")" };

    var today = new Date();
    var todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    var tomorrowUtc = todayUtc + 24 * 60 * 60 * 1000;
    if (Date.UTC(year, month - 1, day) > tomorrowUtc) {
      return { ok: false, why: "is in the future (" + text + "), so it cannot be a review that happened" };
    }
    return { ok: true, why: "" };
  }

  // A review recorded from the example text is the most likely way a half-done
  // edit reaches main: the docs and the About page both show
  // "Reviewed by [name], [designation] on [date]", and that string is one
  // copy and paste away from looking like a signed-off catalogue.
  function looksLikeAPlaceholder(value) {
    var text = String(value || "").trim();
    if (!text) return false;
    if (/[\[\]<>]/.test(text)) return true;
    if (/^(name|your name|designation|role|tbd|tba|test|officer|x+)$/i.test(text)) return true;
    // The fake sample CSV in review-sheets/samples/ names its reviewer
    // "TEST ONLY Fake Reviewer". If one of those ever reaches the real
    // catalogue, the build has to stop, not print a signature nobody gave.
    if (/^test\b/i.test(text)) return true;
    return text.length < 3;
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
      } else if (looksLikeAPlaceholder(record.reviewedBy)) {
        failures.push(
          where + ' is marked "reviewed" but the reviewer name is a placeholder ("' + record.reviewedBy + '"), so no officer is actually behind this review'
        );
      }
      if (!String(record.office || "").trim()) {
        failures.push(
          where + ' is marked "reviewed" but names no office; a review has to say where the officer sits'
        );
      }
      if (record.designation && looksLikeAPlaceholder(record.designation)) {
        failures.push(
          where + ' is marked "reviewed" but the designation is a placeholder ("' + record.designation + '")'
        );
      }
      var date = parseReviewDate(record.reviewedOn);
      if (!date.ok) {
        failures.push(
          where + ' is marked "reviewed" but the review date ' + date.why + '; leave it "not-reviewed" rather than guessing'
        );
      }
    }
  }

  checkReviewRecord("The whole-catalogue review", catalogue.review);

  Object.keys(catalogue.activities || {}).forEach(function (id) {
    var a = catalogue.activities[id];
    checkReviewRecord('The "' + id + '" activity review', {
      reviewStatus: a.reviewStatus || "not-reviewed",
      reviewedBy: a.reviewedBy || "",
      office: a.office || "",
      designation: a.designation || "",
      reviewedOn: a.reviewedOn || "",
    });
  });

  // The wording the farmer hears and reads carries a standing instruction to
  // confirm locally. If a future edit drops that sentence from one state, the
  // build should fail here, not on someone's phone.
  // Note the split: formatReview wordsmiths a single record, while reviewFor
  // decides what the whole shown list may claim. The mixed state only exists
  // at the list level, so that is where it is checked.
  [
    { status: "not-reviewed" },
    { status: "reviewed", reviewedBy: "Test Officer", office: "Test Office", reviewedOn: "2026-01-01" },
  ].forEach(
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
    { reviewStatus: "reviewed", reviewedBy: "Test Officer", office: "Test Office", reviewedOn: "2026-01-01" },
    {},
  ]);
  if (mixed.status !== "mixed") {
    failures.push('The half-reviewed list read as "' + mixed.status + '" instead of "mixed"; it must never look fully approved');
  }
  if (!/confirm locally/i.test(mixed.text)) {
    failures.push('The "mixed" review wording lost its confirm-locally sentence; a review must never remove it');
  }

  // The unreviewed state has to stay expressible as well as the reviewed one.
  // This app's honest position today is that nothing has been checked, and a
  // guard that only knows how to complain about a bad review would be happy to
  // let somebody delete the unreviewed path altogether.
  var emptyReview = activities.formatReview({});
  if (emptyReview.status !== "not-reviewed") {
    failures.push(
      'An empty review record no longer reads as "not-reviewed", it read as "' + emptyReview.status + '"'
    );
  }

  // And a record cannot render as reviewed on the strength of its flag alone:
  // a "reviewed" status with nobody named behind it is not a review.
  if (activities.isReviewed({ reviewStatus: "reviewed" }) !== false) {
    failures.push(
      'A record marked "reviewed" with no reviewer name still counts as reviewed, so the app could show a sign-off with no officer behind it'
    );
  }
  if (
    activities.isReviewed({
      reviewStatus: "reviewed",
      reviewedBy: "A Test Officer",
      office: "Test Office",
      reviewedOn: "2026-01-01",
    }) !== true
  ) {
    failures.push("A complete review record no longer counts as reviewed, so a real review would be hidden from the farmer");
  }
}

/* ---- 5. The shipped palette must meet WCAG AA ---- */

// This is a static, no-build site for farmers who will read it outdoors on a
// cheap phone, so legibility is not cosmetic, it is the whole product. Rather
// than trusting the colours by eye, the real palette is read out of the
// stylesheet and every foreground/background pair that actually ships is run
// through the WCAG contrast formula. AA needs 4.5:1 for normal text, 3:1 for
// large text and for the boundaries of controls. If someone later lightens a
// muted grey or darkens an accent, this build fails here, before it reaches a
// field in daylight, instead of quietly becoming unreadable.
var cssText = fs.readFileSync(path.join(root, "css", "styles.css"), "utf8");

function readPalette(css) {
  var root = css.match(/:root\s*\{([\s\S]*?)\}/);
  var vars = {};
  if (!root) return vars;
  var re = /--([\w-]+):\s*([^;]+);/g;
  var m;
  while ((m = re.exec(root[1])) !== null) {
    vars[m[1]] = m[2].trim();
  }
  return vars;
}

var palette = readPalette(cssText);

function hexToRgb(hex) {
  var h = String(hex).trim().replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function luminance(hex) {
  var rgb = hexToRgb(hex);
  if (!rgb) return null;
  function channel(v) {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function contrastRatio(fgHex, bgHex) {
  var lf = luminance(fgHex);
  var lb = luminance(bgHex);
  if (lf === null || lb === null) return null;
  var hi = Math.max(lf, lb);
  var lo = Math.min(lf, lb);
  return (hi + 0.05) / (lo + 0.05);
}

// Resolve a token to a hex literal, or null if the token is not a plain colour
// (a gradient, rgba, or a token this checker does not know). Anything unresolved
// is reported as a note rather than passed or failed, because guessing at an
// rgba over an unknown backdrop would be a lie.
function resolve(token) {
  if (!token) return null;
  var value = palette[token];
  if (!value) return null;
  if (hexToRgb(value)) return value;
  return null;
}

// The pairs the stylesheet actually renders, taken from the components a farmer
// touches. "min" is 4.5 for body text and 3 for large text and control borders.
// White text on the primary button is listed as a literal because the button
// sets color: #fff directly rather than through a token.
var contrastPairs = [
  { fg: "color-text", bg: "color-bg", min: 4.5, what: "body text on the page" },
  { fg: "color-text", bg: "color-surface", min: 4.5, what: "body text on a card" },
  { fg: "color-text-muted", bg: "color-bg", min: 4.5, what: "muted text on the page" },
  { fg: "color-text-muted", bg: "color-surface", min: 4.5, what: "muted text on a card" },
  { fg: "color-accent", bg: "color-surface", min: 4.5, what: "accent text and links on a card" },
  { fg: "color-accent", bg: "color-accent-soft", min: 4.5, what: "accent text on its soft tint" },
  { fg: "color-error", bg: "color-surface", min: 4.5, what: "error text on a card" },
  { fg: "color-focus", bg: "color-surface", min: 3, what: "focus ring against a card" },
  { fg: "color-focus", bg: "color-bg", min: 3, what: "focus ring against the page" },
  { fg: "phase-prepare-fg", bg: "phase-prepare-bg", min: 4.5, what: "calendar, prepare phase" },
  { fg: "phase-sow-fg", bg: "phase-sow-bg", min: 4.5, what: "calendar, sow phase" },
  { fg: "phase-care-fg", bg: "phase-care-bg", min: 4.5, what: "calendar, care phase" },
  { fg: "phase-harvest-fg", bg: "phase-harvest-bg", min: 4.5, what: "calendar, harvest phase" },
  { fg: "phase-quiet-fg", bg: "phase-quiet-bg", min: 4.5, what: "calendar, quiet phase" },
];

var whiteOnAccent = contrastRatio("#ffffff", resolve("color-accent"));
if (whiteOnAccent === null) {
  notes.push("could not check white-on-accent button text; --color-accent is not a plain hex");
} else if (whiteOnAccent < 4.5) {
  failures.push(
    "Primary button text is white on " + resolve("color-accent") + " at " + whiteOnAccent.toFixed(2) +
      ":1, below the 4.5:1 AA floor; darken --color-accent"
  );
}

contrastPairs.forEach(function (p) {
  var fg = resolve(p.fg);
  var bg = resolve(p.bg);
  if (!fg || !bg) {
    notes.push("skipped the contrast check for " + p.what + " (" + p.fg + " / " + p.bg + "): not a plain hex token");
    return;
  }
  var ratio = contrastRatio(fg, bg);
  if (ratio === null) return;
  if (ratio < p.min) {
    failures.push(
      "Contrast for " + p.what + " is " + ratio.toFixed(2) + ":1, below the " + p.min + ":1 AA floor (" + fg + " on " + bg + ")"
    );
  }
});

/* ---- 6. Every element the code wires up must exist in the page ---- */

// app.js reaches its buttons and panels by id: $("#btn-visit-print"). A typo
// in the id, or a rename in the markup that misses one call site, leaves a
// button that is present on screen but wired to nothing. It looks fine and
// does nothing, which is the worst kind of break. Every id that the code
// attaches an event listener to is checked against the ids in index.html, so
// this class of dead control fails the build rather than a farmer's tap.
//
// Only ids that are followed by an addEventListener call are checked, because
// those are the ones where a missing element silently swallows an action. Ids
// read for content (innerHTML, textContent) are allowed to be built at run
// time, so they are deliberately left out.
var pageIds = [];
var idRe = /id="([^"]+)"/g;
var idMatch;
while ((idMatch = idRe.exec(html)) !== null) {
  pageIds.push(idMatch[1]);
}

["js/app.js"].forEach(function (relFile) {
  var code = fs.readFileSync(path.join(root, relFile), "utf8");
  // $("#the-id") immediately followed by .addEventListener( on the same or
  // next line. The dot-star-newline covers the common split across two lines.
  var wireRe = /\$\(\s*"#([\w-]+)"\s*\)[^\n]*addEventListener/g;
  var m;
  var seen = [];
  while ((m = wireRe.exec(code)) !== null) {
    var elId = m[1];
    if (seen.indexOf(elId) !== -1) continue;
    seen.push(elId);
    if (pageIds.indexOf(elId) === -1) {
      failures.push(
        relFile + ' wires an event listener on "#' + elId + '" but no element with that id exists in index.html, so the control is dead'
      );
    }
  }
});

/* ---- 7. Every image the README shows must be on disk ---- */

// The README is the shop window, and a broken image there is the first thing a
// visitor sees. It has happened the easy way already: screenshots were
// regenerated into a different folder and the old paths stopped resolving.
var readmePath = path.join(root, "README.md");
var readmeImages = [];
if (exists(readmePath)) {
  var readme = fs.readFileSync(readmePath, "utf8");
  var imgRe = /!\[[^\]]*\]\(([^)\s]+)/g;
  var imgMatch;
  while ((imgMatch = imgRe.exec(readme)) !== null) {
    var imgTarget = imgMatch[1];
    if (/^(https?:)?\/\//.test(imgTarget)) continue;
    readmeImages.push(imgTarget);
  }
}

readmeImages.forEach(function (img) {
  if (!exists(path.join(root, img))) {
    failures.push("README.md shows " + img + " but it is not on disk");
  }
});

if (!readmeImages.length) {
  notes.push("README.md shows no images; run `npm run screenshots` to capture the four field screens");
}

/* ---- 8. The honesty wording must survive ---- */

// These sentences are the product, not decoration. Everything else here is
// checked, could be rewritten without harm; these are the lines that stop a
// suggestion being read as an instruction, and they are pinned literally so
// that weakening one is a build failure rather than a quiet edit. The expected
// text lives here, in the checker, and not read out of the app, because a test
// that asks the app what it says will always agree with it.
var REQUIRED_WORDING = {
  confirm: "Always confirm locally before acting.",
  stillConfirm: "Still confirm locally before acting.",
  notReviewedBy: "Not yet reviewed by an agriculture officer.",
  notReviewedRefusal: "Treat every suggestion as a question to discuss, not as advice to act on.",
  confirmationLine:
    "Confirm suitability, costs and current scheme rules with your local agriculture office or Kisan Khidmat Ghar before acting.",
};

function sentenceCount(text, sentence) {
  return String(text).split(sentence).length - 1;
}

if (catalogue && activities) {
  // 1. The catalogue's shared line, which every option and every scheme entry
  //    carries. A vague "check locally" is not the same promise as this one.
  if (catalogue.confirmationLine !== REQUIRED_WORDING.confirmationLine) {
    failures.push(
      "js/catalogue.js: the shared confirmation line no longer matches the pinned wording.\n" +
        "      expected: " + REQUIRED_WORDING.confirmationLine + "\n" +
        "      found:    " + catalogue.confirmationLine
    );
  }

  // 2. Each review state must keep its own instruction. "not-reviewed" and
  //    "mixed" keep the standing sentence; a recorded review keeps the shorter
  //    one, which is the whole point of recording a review: the officer checked
  //    the list, never the farmer's plot.
  var notReviewedText = activities.formatReview({ reviewStatus: "not-reviewed" }).text;
  var reviewedText = activities.formatReview({
    reviewStatus: "reviewed",
    reviewedBy: "Test Officer",
    office: "Test Office",
    designation: "Test Designation",
    reviewedOn: "2026-01-01",
  }).text;
  var mixedText = activities.reviewFor([
    { reviewStatus: "reviewed", reviewedBy: "Test Officer", reviewedOn: "2026-01-01" },
    {},
  ]).text;

  [
    ["not-reviewed", notReviewedText, REQUIRED_WORDING.confirm],
    ["mixed", mixedText, REQUIRED_WORDING.confirm],
    ["reviewed", reviewedText, REQUIRED_WORDING.stillConfirm],
  ].forEach(function (row) {
    var state = row[0];
    var text = row[1];
    var sentence = row[2];
    if (text.indexOf(sentence) === -1) {
      failures.push(
        'The "' + state + '" review wording dropped "' + sentence + '", so it no longer tells the farmer to confirm locally. A review must never remove that instruction'
      );
    }
  });

  if (notReviewedText.indexOf(REQUIRED_WORDING.notReviewedBy) === -1) {
    failures.push(
      'The unreviewed wording no longer says "' + REQUIRED_WORDING.notReviewedBy + '", so an unreviewed catalogue is not stated as unreviewed'
    );
  }
  if (notReviewedText.indexOf(REQUIRED_WORDING.notReviewedRefusal) === -1) {
    failures.push(
      'The unreviewed wording no longer says "' + REQUIRED_WORDING.notReviewedRefusal + '", which is what stops a suggestion reading as advice'
    );
  }

  // 3. The wording has to reach the surfaces, not merely exist. A perfect
  //    sentence that no screen paints is the failure this checks for.
  ["review-banner", "compare-review", "summary-review"].forEach(function (surfaceId) {
    if (pageIds.indexOf(surfaceId) === -1) {
      failures.push(
        "index.html no longer contains #" + surfaceId + ", so that screen would show no review status at all"
      );
    }
    if (appCode.indexOf('fillReviewSlot("' + surfaceId + '"') === -1) {
      failures.push(
        'js/app.js no longer fills #' + surfaceId + ' with the review wording, so that screen would drop the honesty line it is supposed to carry'
      );
    }
  });

  if (pageIds.indexOf("about-review-status") === -1) {
    failures.push("index.html no longer contains #about-review-status, so the About page would state no review status");
  }
  if (appCode.indexOf("#about-review-status") === -1 || appCode.indexOf("setAboutReviewStatus") === -1) {
    failures.push("js/app.js no longer writes the catalogue review status into #about-review-status");
  }

  // The visit card is the page that reaches the office, so the review line has
  // to be in the card itself, not only in the screen it was made from.
  if (appCode.indexOf("reviewBannerHtml(currentReview())") === -1) {
    failures.push(
      "js/app.js no longer builds the visit card with the review wording, and the visit card is the page that leaves the phone"
    );
  }

  // A review that has been recorded must never be able to silence the line. If
  // anyone ever makes the confirm sentence conditional, this catches the shape
  // of that mistake: both wordings must contain it unconditionally.
  if (sentenceCount(reviewedText, REQUIRED_WORDING.stillConfirm) !== 1) {
    failures.push('The "reviewed" wording must contain "' + REQUIRED_WORDING.stillConfirm + '" exactly once');
  }
}

/* ---- 9. The support copy must make no claim this app cannot back ---- */

// The catalogue and the scheme list are the two places a well-meaning edit
// would add a figure that reads like an authority: a subsidised rate, an
// application window, a list of papers to carry. The rule is that none of them
// may appear at all, so the copy is scanned rather than trusted. The patterns
// live in tools/claims.js, shared with the behavioural suite so the two cannot
// disagree about what a claim is.
//
// This covers the copy an editor writes. The text the app generates at run
// time - the questions, the share message, the office panel - is checked in
// tools/selftest.js, where a sample plan exists to generate it with.
var SCHEME_CONFIRM_LINE =
  "Confirm current details, eligibility and documents with the official portal or local agriculture office, or at your Kisan Khidmat Ghar.";

// Fields that are not prose: a URL is an address, not a sentence, and an id is
// a key. Everything else in these two files is read by a farmer.
var NOT_PROSE = ["url", "extraUrls", "linkLabel", "id", "appliesTo", "value"];

function proseStrings(node, trail, out) {
  if (typeof node === "string") {
    out.push({ where: trail, text: node });
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach(function (child, i) {
      proseStrings(child, trail + "[" + i + "]", out);
    });
    return out;
  }
  if (node && typeof node === "object") {
    Object.keys(node).forEach(function (key) {
      if (NOT_PROSE.indexOf(key) !== -1) return;
      proseStrings(node[key], trail + "." + key, out);
    });
  }
  return out;
}

if (sandbox.window.MLMP_SCHEMES) {
  var schemeModule = sandbox.window.MLMP_SCHEMES;

  // The instruction every scheme entry is rendered with. Weakening it is the
  // quiet way to turn a list of places to ask into a list of promises.
  if (schemeModule.CONFIRM_LINE !== SCHEME_CONFIRM_LINE) {
    failures.push(
      "js/schemes.js: the scheme confirmation line no longer matches the pinned wording.\n" +
        "      expected: " + SCHEME_CONFIRM_LINE + "\n" +
        "      found:    " + schemeModule.CONFIRM_LINE
    );
  }
  if (appCode.indexOf("SCHEMES.CONFIRM_LINE") === -1) {
    failures.push("js/app.js no longer renders the scheme confirmation line, so the entries would read as statements of fact");
  }

  var schemeCopy = proseStrings(schemeModule.ALL, "js/schemes.js", []);
  schemeCopy.forEach(function (item) {
    claims.findClaims(item.text).forEach(function (hit) {
      failures.push(
        item.where + " makes a claim this app cannot back: " + claims.describeClaim(hit) + "\n" +
          "      text: " + item.text.slice(0, 120) + (item.text.length > 120 ? "..." : "")
      );
    });

    // Eligibility may be mentioned, but only while refusing to settle it:
    // either with an instruction to confirm it, or by saying plainly that
    // working it out is not what this page is for. A bare mention is what turns
    // into a rule.
    //
    // The check is per string, not per entry, because a scheme entry usually
    // carries an unrelated "Ask the local office..." action, and that word
    // elsewhere in the same entry must not be allowed to cover for a sentence
    // that states eligibility on its own.
    if (
      /eligib/i.test(item.text) &&
      !/confirm|ask|rather than|instead of|cannot|never\b/i.test(item.text)
    ) {
      failures.push(
        item.where +
          " mentions eligibility without telling the farmer to confirm it or saying it is not decided here; eligibility must never read as a rule this app has settled"
      );
    }
  });
}

if (catalogue) {
  proseStrings(catalogue, "js/catalogue.js", []).forEach(function (item) {
    claims.findClaims(item.text).forEach(function (hit) {
      failures.push(
        item.where + " makes a claim this app cannot back: " + claims.describeClaim(hit) + "\n" +
          "      text: " + item.text.slice(0, 120) + (item.text.length > 120 ? "..." : "")
      );
    });
  });
}

/* ---- 10. Every catalogue entry declares its sources and its gaps ---- */

// A figure on an option card is only allowed when a public document backs it.
// The rule is enforced here rather than trusted to an editor, and an entry
// whose figure is missing has to be accounted for in NEEDS_SOURCES.md so the
// gap stays visible instead of quietly becoming a guess.
var sourcesSandbox = { window: {} };
try {
  new vm.Script(fs.readFileSync(path.join(root, "js", "sources.js"), "utf8"), {
    filename: "js/sources.js",
  }).runInNewContext(sourcesSandbox);
} catch (err) {
  failures.push("js/sources.js could not be loaded: " + err.message);
}
var SOURCES = sourcesSandbox.window.MLMP_SOURCES;

if (catalogue && SOURCES) {
  var needsSources = "";
  try {
    needsSources = fs.readFileSync(path.join(root, "NEEDS_SOURCES.md"), "utf8");
  } catch (_) {
    failures.push("NEEDS_SOURCES.md is missing, so an unverified figure has nowhere to be accounted for");
  }

  Object.keys(catalogue.activities).forEach(function (id) {
    var a = catalogue.activities[id];
    var label = 'js/catalogue.js activity "' + id + '"';

    if (!a.startupCost || !a.timeToFirstIncome) {
      failures.push(label + " has no startup cost or time to first income field");
    }
    if (!Array.isArray(a.sources)) {
      failures.push(label + " has no sources list");
    } else {
      a.sources.forEach(function (sid) {
        if (!SOURCES.byId(sid)) {
          failures.push(label + ' cites "' + sid + '", which is not registered in js/sources.js');
        }
      });
    }
    if (!a.mainRisk) {
      failures.push(label + " has no main risk");
    } else if (a.risks && a.risks[0] && a.mainRisk !== a.risks[0]) {
      failures.push(label + " mainRisk has drifted from the first risk in its own list");
    }

    ["startupCost", "timeToFirstIncome"].forEach(function (field) {
      var f = a[field];
      if (!f) return;
      if (f.status === "verified") {
        if (
          !f.value ||
          !f.sourceId ||
          !SOURCES.byId(f.sourceId) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(f.checkedOn || "")
        ) {
          failures.push(
            label +
              "." +
              field +
              " is marked verified without a value, a registered source and a YYYY-MM-DD check date"
          );
        }
      } else if (needsSources && needsSources.indexOf(a.title) === -1) {
        failures.push(label + " has no verified " + field + " and is missing from NEEDS_SOURCES.md");
      }
    });
  });
}

/* ---- 11. An unchecked language must say so where it is chosen ---- */

// The page notice only appears after the reader has already switched language,
// which is too late to be the only warning. Every unreviewed language is marked
// in the menu label itself, from the same `reviewed` flag, so setting that flag
// to true is the only way to remove the caveat.
var msgSandbox = { window: {} };
try {
  new vm.Script(fs.readFileSync(path.join(root, "js", "messages.js"), "utf8"), {
    filename: "js/messages.js",
  }).runInNewContext(msgSandbox);
} catch (err) {
  failures.push("js/messages.js could not be loaded: " + err.message);
}
var MESSAGES = msgSandbox.window.MLMP_MESSAGES;

if (MESSAGES) {
  MESSAGES.available().forEach(function (lang) {
    var label = MESSAGES.optionLabel(lang.code);
    var note = (MESSAGES.dict(lang.code) || {})["lang.uncheckedShort"] || "";
    if (!note) {
      failures.push("js/messages.js has no lang.uncheckedShort string for " + lang.code);
    } else if (!lang.reviewed && label.indexOf(note) === -1) {
      failures.push(
        'The language menu offers ' + lang.code + ' as "' + label + '" without saying the translation is unchecked'
      );
    } else if (lang.reviewed && label.indexOf(note) !== -1) {
      failures.push(
        "The language menu still marks " + lang.code + " as unchecked although it is marked reviewed"
      );
    }
  });

  if (appCode.indexOf("MSG.optionLabel") === -1) {
    failures.push(
      "js/app.js builds the language menu without MSG.optionLabel, so the unchecked caveat never reaches the menu"
    );
  }
}

/* ---- 7b. The manifest must describe icons that exist ---- */

// A manifest that names a missing icon, or declares a size the file does not
// have, is the difference between an install prompt on a farmer's phone and a
// silent refusal to install. The PNG dimensions are read from the file header
// rather than trusted, because the two drift apart when an icon is regenerated
// and only one of the two places is updated.
function isPng(buf) {
  var signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 24) return false;
  for (var i = 0; i < signature.length; i += 1) {
    if (buf[i] !== signature[i]) return false;
  }
  return true;
}

var manifestFile = path.join(root, "manifest.webmanifest");
if (!exists(manifestFile)) {
  failures.push("manifest.webmanifest is missing, so the app cannot be installed");
} else {
  var manifest = null;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  } catch (err) {
    failures.push("manifest.webmanifest is not valid JSON: " + err.message);
  }
  if (manifest) {
    ["name", "short_name", "start_url", "display", "theme_color", "background_color"].forEach(function (field) {
      if (!manifest[field]) failures.push("manifest.webmanifest has no " + field + ", which the install prompt needs");
    });
    (manifest.icons || []).forEach(function (icon) {
      var iconPath = path.join(root, icon.src || "");
      if (!icon.src || !exists(iconPath)) {
        failures.push("manifest.webmanifest names " + (icon.src || "(nothing)") + " but it is not on disk");
        return;
      }
      var declared = /^(\d+)x(\d+)$/.exec(String(icon.sizes || ""));
      if (!declared) {
        // "any" is legitimate for the SVG. Nothing to measure.
        if (String(icon.sizes) !== "any") {
          failures.push("manifest.webmanifest gives " + icon.src + ' the sizes value "' + icon.sizes + '", which is neither WxH nor "any"');
        }
        return;
      }
      if (!/\.png$/i.test(icon.src)) return;
      var buf = fs.readFileSync(iconPath);
      if (!isPng(buf)) {
        failures.push("manifest.webmanifest names " + icon.src + " as a PNG but the file is not one");
        return;
      }
      var width = buf.readUInt32BE(16);
      var height = buf.readUInt32BE(20);
      if (width !== Number(declared[1]) || height !== Number(declared[2])) {
        failures.push(
          "manifest.webmanifest declares " + icon.src + " as " + icon.sizes + " but the file is " + width + "x" + height
        );
      }
    });
  }
}

/* ---- 11b. Every screen must announce itself ---- */

// A heading on every screen is how a screen reader user knows the page
// changed, and how anyone scanning the page finds their place. A new screen
// added without one is invisible to the first and confusing to the second, so
// the markup is checked rather than trusted.
var screenBlocks = html.split(/<section\s+id="screen-/).slice(1);
screenBlocks.forEach(function (chunk) {
  var id = (chunk.match(/^([\w-]+)"/) || [])[1] || "(unknown)";
  var body = chunk.split(/<section\s+id="screen-/)[0];
  if (!/<h1[\s>]|<h2[\s>]/.test(body)) {
    failures.push('The "' + id + '" screen has no h1 or h2, so a screen reader has nothing to announce when it opens');
  }
});

/* ---- 11c. Every data-i18n key must exist in the messages ---- */

// `data-i18n` is translated at load. A key that is not in the dictionary shows
// the English fallback in its place and looks translated, so a typo survives
// review. Checking the page against `MSG.keys()` catches it here instead.
if (MESSAGES) {
  var i18nRe = /data-i18n="([^"]+)"/g;
  var i18nMatch;
  var seenKeys = [];
  while ((i18nMatch = i18nRe.exec(html)) !== null) {
    var key = i18nMatch[1];
    if (seenKeys.indexOf(key) !== -1) continue;
    seenKeys.push(key);
    if (MESSAGES.keys().indexOf(key) === -1) {
      failures.push('index.html uses data-i18n="' + key + '", which is not a key in js/messages.js');
    }
  }
}

/* ---- 11d. The land copy must stay sourced and claim-free ---- */

// js/land.js describes soils, rainfall bands and the crops a district is known
// for. A figure is legitimate there in a way it never is in a scheme entry: an
// altitude band is a measurement, not a promise. So this scans the copy for the
// money, deadline and eligibility rules in `claims.BANNED`, and leaves altitudes
// and village counts alone. It also pins the caveat, because the sentence that
// must never be dropped is the one saying this is district information and not a
// village record.
var landSandbox = { window: {} };
try {
  new vm.Script(fs.readFileSync(path.join(root, "js", "land.js"), "utf8"), {
    filename: "js/land.js",
  }).runInNewContext(landSandbox);
} catch (err) {
  failures.push("js/land.js could not be loaded: " + err.message);
}

var LAND = landSandbox.window.MLMP_LAND;
if (!LAND) {
  failures.push("js/land.js no longer defines MLMP_LAND, so the district panel has no data");
} else {
  var landCopy = [];
  function collect(node, trail, out) {
    if (typeof node === "string") {
      out.push({ where: trail, text: node });
      return out;
    }
    if (Array.isArray(node)) {
      node.forEach(function (child, i) {
        collect(child, trail + "[" + i + "]", out);
      });
      return out;
    }
    if (node && typeof node === "object") {
      Object.keys(node).forEach(function (key) {
        if (["url", "id", "short", "sourceId", "sourceIds"].indexOf(key) !== -1) return;
        collect(node[key], trail + "." + key, out);
      });
    }
    return out;
  }

  collect(LAND.ZONES, "js/land.js zone", landCopy);
  LAND.districts().forEach(function (name) {
    var profile = LAND.forDistrict(name);
    collect(profile.fruit, "js/land.js " + name + ".fruit", landCopy);
    if (profile.note) collect(profile.note, "js/land.js " + name + ".note", landCopy);
  });

  landCopy.forEach(function (item) {
    claims.BANNED.forEach(function (rule) {
      if (rule.unless && rule.unless.test(item.text)) return;
      var hit = rule.re.exec(item.text);
      if (hit) {
        failures.push(item.where + " makes a claim this app cannot back: " + rule.name + ' ("' + hit[0] + '")');
      }
    });
  });

  if (!/no village-level land record is held/i.test(LAND.statement())) {
    failures.push(
      "js/land.js no longer says plainly that no village-level land record is held, which is the sentence the panel depends on"
    );
  }

  var panelCode = "";
  try {
    panelCode = fs.readFileSync(path.join(root, "js", "landpanel.js"), "utf8");
  } catch (_) {
    failures.push("js/landpanel.js is missing, so the land reference has nowhere to render");
  }
  if (panelCode.indexOf("LAND.statement()") === -1) {
    failures.push("js/landpanel.js no longer shows the district-not-village caveat");
  }
  ["land-preview", "about-village"].forEach(function (id) {
    if (pageIds.indexOf(id) === -1) {
      failures.push("index.html no longer contains #" + id + ", so the land reference has nowhere to appear");
    }
  });
}

/* ---- 11e. Every figure the land panel prints must have a source ---- */

// The panel prints altitudes, rainfall, district counts and UT land use. Each
// group traces to a registered document, so a copied number cannot arrive
// without the citation that makes it checkable. This fails if a figure group
// loses its source, or if the panel stops showing one of them.
if (LAND) {
  var adminFields = ["area", "population", "blocks", "tehsils", "villages"];
  LAND.districts().forEach(function (name) {
    var a = LAND.admin(name);
    if (!a) {
      failures.push("js/land.js has no official counts for " + name);
      return;
    }
    adminFields.forEach(function (key) {
      if (typeof a[key] !== "number" || !(a[key] > 0)) {
        failures.push("js/land.js gives " + name + "." + key + " no positive number, so the panel would print a blank");
      }
    });
  });

  var landSources = LAND.sourceIds();
  ["ut_glance", "jammu_hort_zones", "jammu_hort_districts", "icar_jammu_plan", "cgwb_profiles", "fsi_cover"].forEach(function (id) {
    if (landSources.indexOf(id) === -1) {
      failures.push("js/land.js no longer lists " + id + " among its sources, so a figure on the panel lost its citation");
    }
    if (!SOURCES.byId(id)) {
      failures.push("js/sources.js has no entry for " + id + ", which js/land.js cites");
    }
  });

  var use = LAND.coverage().landUse;
  if (!use) {
    failures.push("js/land.js no longer carries the UT land-use figures");
  } else if (landSources.indexOf(use.sourceId) === -1) {
    failures.push("the land-use figures cite " + use.sourceId + ", which js/land.js does not list");
  }

  var panelText = "";
  try {
    panelText = fs.readFileSync(path.join(root, "js", "landpanel.js"), "utf8");
  } catch (_) {}
  ["LAND.admin(", "coverage().landUse", "LAND.statement()"].forEach(function (needle) {
    if (panelText.indexOf(needle) === -1) {
      failures.push("js/landpanel.js no longer renders " + needle + ", so a sourced figure or the caveat vanished from the screen");
    }
  });
}

/* ---- 11g. The page must not reuse an id ---- */

// A duplicated id makes `for=`, `aria-labelledby` and `#anchor` all resolve to
// whichever element the browser met first, so a label can describe the wrong
// field and a skip link can land halfway down the page. Browsers do not warn.
var idSeen = {};
var dupeRe = /\bid="([^"]+)"/g;
var dupeMatch;
while ((dupeMatch = dupeRe.exec(html)) !== null) {
  if (idSeen[dupeMatch[1]]) {
    failures.push(
      'index.html uses id="' + dupeMatch[1] + '" more than once, so a label or anchor can point at the wrong element'
    );
  }
  idSeen[dupeMatch[1]] = true;
}

/* ---- 11f. Every control must have a name, and every image its alt ---- */

// A screen reader announces a control by its accessible name. A button whose
// only child is an icon, or an input with a placeholder instead of a label, is
// announced as nothing useful. This is a static check on the shipped page; it
// does not replace a real audit, but it stops the common regression landing.
var buttonRe = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
var buttonMatch;
while ((buttonMatch = buttonRe.exec(html)) !== null) {
  var attrs = buttonMatch[1] || "";
  var inner = buttonMatch[2]
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  var labelled = /aria-label="[^"]+"/.test(attrs) || /aria-labelledby="[^"]+"/.test(attrs);
  if (!inner && !labelled) {
    failures.push('index.html has a button with no readable text and no aria-label, so it is announced as just "button"');
  }
}

var labelFor = [];
var forRe = /<label\b[^>]*\bfor="([^"]+)"/gi;
var forMatch;
while ((forMatch = forRe.exec(html)) !== null) labelFor.push(forMatch[1]);

var controlRe = /<(input|select|textarea)\b([^>]*)>/gi;
var controlMatch;
while ((controlMatch = controlRe.exec(html)) !== null) {
  var tag = controlMatch[1].toLowerCase();
  var cattrs = controlMatch[2] || "";
  var type = (cattrs.match(/\btype="([^"]+)"/) || [])[1] || "";
  if (tag === "input" && /^(hidden|submit|button|reset)$/i.test(type)) continue;
  var id = (cattrs.match(/\bid="([^"]+)"/) || [])[1] || "";
  var named = /aria-label="[^"]+"/.test(cattrs) || /aria-labelledby="[^"]+"/.test(cattrs);
  var before = html.slice(0, controlMatch.index);
  var wrapped = before.lastIndexOf("<label") > before.lastIndexOf("</label>");
  if (!named && !wrapped && (!id || labelFor.indexOf(id) === -1)) {
    failures.push(
      "index.html has a " + tag + (id ? " #" + id : "") + " with no <label for>, no wrapping label and no aria-label, so its purpose is not announced"
    );
  }
}

var imgRe = /<img\b([^>]*)>/gi;
var imgMatch;
while ((imgMatch = imgRe.exec(html)) !== null) {
  if (!/\balt="/.test(imgMatch[1])) {
    failures.push("index.html has an <img> without alt text");
  }
}

/* ---- 11h. Every aria-* reference must point at something that exists ---- */

// `aria-labelledby="district-label"` with no such id leaves the control with no
// name at all, and the page still looks fine. The same goes for `aria-controls`
// on the menu button: it is either a real element or it is a lie to the reader
// about what the button opens.
var ariaRefRe = /\b(aria-labelledby|aria-describedby|aria-controls)="([^"]+)"/g;
var ariaRefMatch;
while ((ariaRefMatch = ariaRefRe.exec(html)) !== null) {
  ariaRefMatch[2].split(/\s+/).forEach(function (ref) {
    if (!ref) return;
    if (!idSeen[ref]) {
      failures.push(
        "index.html points " + ariaRefMatch[1] + ' at #' + ref + ", which is not an id on the page"
      );
    }
  });
}



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
    " assets precached for offline, " +
    readmeImages.length +
    " README images present."
);

/* ---- 11i. Every in-page link must land somewhere ---- */

// The nav, the skip link and the footer all use `#id`. A renamed section leaves
// those links silently dead: the URL changes, nothing moves, and the reader
// concludes the button is broken.
var anchorRe = /<a\b[^>]*\bhref="#([^"]*)"/g;
var anchorMatch;
while ((anchorMatch = anchorRe.exec(html)) !== null) {
  var anchorTarget = anchorMatch[1];
  if (!anchorTarget) continue;
  if (!idSeen[anchorTarget]) {
    failures.push(
      'index.html links to #' + anchorTarget + ", which is not an id on the page, so the link goes nowhere"
    );
  }
}

/* ---- 11j. The manifest must not promise icons that are missing or mis-sized ---- */

// An install prompt needs the 192 and 512 icons to exist at the sizes the
// manifest claims. A missing file or a renamed export degrades installability
// with no visible error, and a PNG that is really 180px wide is still declared
// as 512x512 to the launcher.
var manifestPath = path.join(root, "manifest.webmanifest");
if (!fs.existsSync(manifestPath)) {
  failures.push("manifest.webmanifest is missing, so the app cannot be installed");
} else {
  var manifest = {};
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err) {
    failures.push("manifest.webmanifest is not valid JSON: " + err.message);
  }
  (manifest.icons || []).forEach(function (icon) {
    var iconFile = path.join(root, icon.src);
    if (!fs.existsSync(iconFile)) {
      failures.push("manifest.webmanifest lists " + icon.src + ", which is not in the folder");
      return;
    }
    if (!/^\d+x\d+$/.test(icon.sizes || "")) return;
    var buf = fs.readFileSync(iconFile);
    if (buf.length > 24 && buf.toString("ascii", 1, 4) === "PNG") {
      var declared = icon.sizes.split("x").map(Number);
      var width = buf.readUInt32BE(16);
      var height = buf.readUInt32BE(20);
      if (width !== declared[0] || height !== declared[1]) {
        failures.push(
          "manifest.webmanifest says " + icon.src + " is " + icon.sizes + " but the file is " + width + "x" + height
        );
      }
    }
  });
}

/* ---- 11k. Page-level metadata must describe the page ---- */

// One h1 tells a screen reader what the page is; none, or three, leaves it
// guessing. A lang attribute decides how the text is pronounced, and a title
// that is missing or 200 characters long is truncated in every tab and search
// result.
var h1Count = (html.match(/<h1[\s>]/g) || []).length;
if (h1Count !== 1) {
  failures.push("index.html has " + h1Count + " h1 element(s); exactly one names the page for a screen reader");
}
var htmlLang = (html.match(/<html\b[^>]*\blang="([^"]+)"/) || [])[1];
if (!htmlLang) {
  failures.push("index.html's <html> has no lang attribute, so a screen reader guesses how to pronounce it");
}
var titleText = ((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "").trim();
if (titleText.length < 10 || titleText.length > 70) {
  failures.push("index.html's <title> is " + titleText.length + " characters; it should be 10 to 70");
}
var description = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
if (description.length < 50) {
  failures.push("index.html's meta description is missing or too short to be useful in a search result");
}

/* ---- 11l. A link that opens a new tab must not keep the opener ---- */

// `window.opener` lets the opened page navigate the app's own tab. Every
// external source link opens in a new tab, so each one needs rel="noopener".
var blankRe = /<a\b[^>]*\btarget="_blank"[^>]*>/g;
var blankMatch;
while ((blankMatch = blankRe.exec(html)) !== null) {
  if (!/\brel="[^"]*noopener/.test(blankMatch[0])) {
    failures.push('index.html has a target="_blank" link without rel="noopener": ' + blankMatch[0].slice(0, 80));
  }
}

/* ---- 11m. An image needs its dimensions before it loads ---- */

// Without width and height the browser reserves no space, so the page jumps as
// each image arrives. On a slow connection that is the layout shift a reader
// feels most.
var imgBoxRe = /<img\b[^>]*>/g;
var imgBoxMatch;
while ((imgBoxMatch = imgBoxRe.exec(html)) !== null) {
  if (!/\bwidth="\d+"/.test(imgBoxMatch[0]) || !/\bheight="\d+"/.test(imgBoxMatch[0])) {
    failures.push("index.html has an <img> without width and height, so the page will shift as it loads");
  }
}

/* ---- 11n. The README must name the version in package.json ---- */

// The status section is the first thing a reader trusts. It still said v1.0.0
// after v1.1.0 shipped, which makes the release notes look stale and the app
// look unmaintained. The version string is the cheapest thing to check and the
// most visible thing to get wrong.
var pkg = {};
try {
  pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
} catch (err) {
  failures.push("package.json is not valid JSON: " + err.message);
}
var readmeText = fs.readFileSync(path.join(root, "README.md"), "utf8");
if (pkg.version && readmeText.indexOf("Version v" + pkg.version) === -1) {
  failures.push("README.md does not name the shipped version v" + pkg.version + " from package.json");
}

/* ---- 11o. Every document must be reachable from the index ---- */

// docs/ is where a reader goes to understand a decision, a check or a gap. A
// file nobody links to is a file nobody reads, so the index is checked rather
// than trusted.
var docsDir = path.join(root, "docs");
if (fs.existsSync(docsDir)) {
  var docsIndexPath = path.join(docsDir, "README.md");
  var docsIndex = fs.existsSync(docsIndexPath) ? fs.readFileSync(docsIndexPath, "utf8") : "";
  fs.readdirSync(docsDir)
    .filter(function (file) {
      return /\.md$/.test(file) && file !== "README.md";
    })
    .forEach(function (file) {
      if (docsIndex.indexOf(file) === -1) {
        failures.push("docs/" + file + " is not listed in docs/README.md, so a reader will not find it");
      }
    });
}

/* ---- 11p. Every registered source must be usable as a citation ---- */

// A source is what makes a figure checkable. An entry with a dead host, a
// missing `usedFor` or an id that does not match its key is a citation in
// appearance only: the panel renders a link, and the reader who follows it
// finds nothing to support the sentence.
SOURCES.all().forEach(function (source) {
  var where = "js/sources.js " + (source.id || "(no id)");
  if (!source.id) failures.push("js/sources.js has an entry with no id");
  if (!/^https:\/\//.test(source.url || "")) {
    failures.push(where + " has no https URL, so the citation cannot be checked from the app");
  }
  ["short", "name", "usedFor"].forEach(function (field) {
    if (!source[field] || String(source[field]).trim().length < 4) {
      failures.push(where + " has no " + field + ", so the reader cannot tell what it supports");
    }
  });
  if (SOURCES.byId(source.id) !== source) {
    failures.push(where + " is not reachable by its own id");
  }
});

/* ---- 11q. Every shipped script and stylesheet must be precached ---- */

// Offline is the product. A new `js/*.js` or `css/*.css` file that nobody adds
// to the worker's list loads online and fails on the first reload in a field,
// which is the one place this app is meant to work.
var shippedAssets = [];
["js", "css"].forEach(function (dir) {
  fs.readdirSync(path.join(root, dir)).forEach(function (file) {
    if (/\.(js|css)$/.test(file)) shippedAssets.push(dir + "/" + file);
  });
});
shippedAssets.forEach(function (asset) {
  if (precache.indexOf(asset) === -1 && precache.indexOf("./" + asset) === -1) {
    failures.push(asset + " is shipped but not in sw.js's precache list, so it is missing offline");
  }
});

/* ---- 11r. The cache name must be a version, not a wish ---- */

// Bumping the cache name is what retires old assets. A typo here silently keeps
// the previous shell, so the format is checked: `mlmp-v` and a number.
var swSource = fs.readFileSync(path.join(root, "sw.js"), "utf8");
var cacheVersion = (swSource.match(/CACHE_VERSION\s*=\s*"([^"]+)"/) || [])[1];
if (!cacheVersion) {
  failures.push("sw.js has no CACHE_VERSION, so an update cannot retire the old cache");
} else if (!/^mlmp-v\d+$/.test(cacheVersion)) {
  failures.push("sw.js CACHE_VERSION is \"" + cacheVersion + "\"; it should look like mlmp-v31");
}

/* ---- 11s. Tehsil names must reconcile to the official table ---- */

// The rule for every district row applies to the tehsil names too: the number of
// names must equal the official count, every name must be present, and the list
// must cite a registered document. A list that is one short is not a rounding
// error, it is a farmer sent to the wrong office.
var tehsilSandbox = { window: {} };
try {
  new vm.Script(fs.readFileSync(path.join(root, "js", "tehsils.js"), "utf8"), {
    filename: "js/tehsils.js",
  }).runInNewContext(tehsilSandbox);
} catch (err) {
  failures.push("js/tehsils.js could not be loaded: " + err.message);
}
var TEHSILS = tehsilSandbox.window.MLMP_TEHSILS;
if (!TEHSILS) {
  failures.push("js/tehsils.js no longer defines MLMP_TEHSILS");
} else {
  TEHSILS.covered().forEach(function (name) {
    var names = TEHSILS.forDistrict(name);
    if (!SOURCES.byId(TEHSILS.sourceId(name))) {
      failures.push("js/tehsils.js has no registered citation for " + name);
    }
    if (names.length !== LAND.admin(name).tehsils) {
      failures.push(
        "js/tehsils.js gives " + name + " " + names.length + " names, but the official table says " + LAND.admin(name).tehsils
      );
    }
    names.forEach(function (tehsil) {
      if (!tehsil || !tehsil.trim()) {
        failures.push("js/tehsils.js has a blank tehsil name for " + name);
      }
    });
  });
}

/* ---- 11t. Data files must actually be loaded and precached ---- */

// js/tehsils.js shipped once without a script tag: the file existed, the panel
// looked for it, and the card silently said no names were held. A data file that
// nobody requests is worse than no file, because it looks like coverage.
["js/tehsils.js"].forEach(function (asset) {
  if (!fs.existsSync(path.join(root, asset))) return;
  if (html.indexOf(asset) === -1) {
    failures.push(asset + " exists but index.html never loads it, so the interface silently ignores it");
  }
  if (swSource.indexOf(asset) === -1) {
    failures.push(asset + " exists but sw.js does not precache it, so it is missing offline");
  }
});

/* ---- Report ---- */























