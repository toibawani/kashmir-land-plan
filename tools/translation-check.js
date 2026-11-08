#!/usr/bin/env node
/**
 * Keep the translations honest and complete.
 *
 * Run with no arguments to regenerate TRANSLATION_CHECK.md, the file a native
 * speaker reviews. Run with --check to validate without writing, which is what
 * `npm test` does:
 *
 *   - every key in English exists in every other ready language,
 *   - no ready language has a key English does not have,
 *   - no language claims to have been reviewed unless a person said so,
 *   - the document is up to date.
 *
 * The document deliberately says the translations are unchecked. Generating a
 * nice table is not a review, and this script must not imply one happened.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var root = path.resolve(__dirname, "..");
var target = path.join(root, "TRANSLATION_CHECK.md");
var checkOnly = process.argv.indexOf("--check") !== -1;

var sandbox = { window: {} };
new vm.Script(fs.readFileSync(path.join(root, "js", "messages.js"), "utf8"), {
  filename: "js/messages.js",
}).runInNewContext(sandbox);
var M = sandbox.window.MLMP_MESSAGES;

var keys = M.keys();
var langs = M.available();
var errors = [];

langs.forEach(function (lang) {
  var dict = M.dict(lang.code);
  var missing = keys.filter(function (key) {
    return !Object.prototype.hasOwnProperty.call(dict, key);
  });
  var extra = Object.keys(dict).filter(function (key) {
    return keys.indexOf(key) === -1;
  });
  if (missing.length) {
    errors.push(lang.code + " is missing " + missing.length + " key(s): " + missing.join(", "));
  }
  if (extra.length) {
    errors.push(lang.code + " has " + extra.length + " key(s) not in English: " + extra.join(", "));
  }
});

if (langs.length < 3) {
  errors.push("Expected English, Hindi and Urdu to be offered, found " + langs.length + " language(s).");
}

// A translation that drops {district} or renames {villages} still renders — it
// just silently loses the only part of the sentence that changes. Comparing the
// placeholder sets catches that before a reader sees a sentence missing its
// subject. An empty value is treated as a failure too: it blanks the screen
// rather than falling back, because the key exists.
function placeholders(value) {
  var found = [];
  var re = /\{([a-zA-Z0-9_]+)\}/g;
  var match;
  while ((match = re.exec(String(value == null ? "" : value))) !== null) {
    if (found.indexOf(match[1]) === -1) found.push(match[1]);
  }
  return found.sort();
}

langs.forEach(function (lang) {
  var dict = M.dict(lang.code);
  keys.forEach(function (key) {
    var value = dict[key];
    if (value == null) return;
    if (!String(value).trim()) {
      errors.push(lang.code + " has an empty string for " + key);
      return;
    }
    var want = placeholders(M.dict("en")[key]);
    var got = placeholders(value);
    if (want.join(",") !== got.join(",")) {
      errors.push(
        lang.code + " " + key + " uses {" + got.join("}, {") + "} where English uses {" + want.join("}, {") + "}"
      );
    }
  });
});

var hi = M.dict("hi");
var ur = M.dict("ur");

function cell(value) {
  return String(value == null ? "" : value)
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
}

var md = [];
md.push("# Translation check");
md.push("");
md.push(
  "Every string the app shows on the critical path, in the three languages it offers. This file exists so a native speaker can review the wording without reading any code."
);
md.push("");
md.push("**These translations have not been checked by a native speaker.** They were written to be plain and short, and the app shows a notice while that is true. Do not change this line or mark a language reviewed until someone has actually read it.");
md.push("");
md.push("## What still needs a person");
md.push("");
md.push("- Every row below needs a fluent reader to confirm it says the same thing as the English, in the words a farmer in J&K would use.");
md.push("- The agricultural nouns matter most: the words for a plot, an office, a scheme, a soil test and confirm-locally.");
md.push("- The option text in the catalogue is still English only. That is deliberate, not a missing translation: translating agronomy without an officer reviewing it would be worse than leaving it in one language.");
md.push("- If a language is corrected, edit `js/messages.js`, run `node tools/translation-check.js`, and commit the regenerated file.");
md.push("");
md.push("## Strings");
md.push("");
md.push("| Key | English | हिन्दी | اردو |");
md.push("| --- | --- | --- | --- |");
keys.forEach(function (key) {
  md.push(
    "| `" +
      key +
      "` | " +
      cell(M.dict("en")[key]) +
      " | " +
      cell(hi[key]) +
      " | " +
      cell(ur[key]) +
      " |"
  );
});
md.push("");
md.push("## Direction");
md.push("");
md.push("- Urdu is right to left. The app sets `dir=\"rtl\"` on the document and the layout mirrors; the catalogue prose stays left to right inside its own block.");
md.push("- Hindi is left to right.");
md.push("- Adding Kashmiri later is one object in `js/messages.js` plus a `LANGS` entry. No other file needs to change.");
md.push("");

var content = md.join("\n");

if (errors.length) {
  console.error("Translation check failed:");
  errors.forEach(function (e) {
    console.error("  - " + e);
  });
  process.exit(1);
}

if (checkOnly) {
  if (!fs.existsSync(target)) {
    console.error("TRANSLATION_CHECK.md is missing. Run node tools/translation-check.js.");
    process.exit(1);
  }
  var current = fs.readFileSync(target, "utf8");
  if (current !== content) {
    console.error("TRANSLATION_CHECK.md is out of date. Run node tools/translation-check.js.");
    process.exit(1);
  }
  console.log(
    "Translation check passed: " +
      keys.length +
      " keys across " +
      langs.length +
      " languages, and the review sheet is current."
  );
  process.exit(0);
}

fs.writeFileSync(target, content, "utf8");
console.log("Wrote TRANSLATION_CHECK.md with " + keys.length + " strings across " + langs.length + " languages.");
