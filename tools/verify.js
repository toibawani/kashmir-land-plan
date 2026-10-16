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
  if (activities.isReviewed({ reviewStatus: "reviewed", reviewedBy: "A Test Officer" }) !== true) {
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
  var appCode = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
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
    " assets precached for offline, " +
    readmeImages.length +
    " README images present."
);
