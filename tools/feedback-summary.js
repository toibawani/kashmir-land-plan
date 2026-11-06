#!/usr/bin/env node
/**
 * Summarise the answers exported from feedback.html after a field test.
 *
 * Usage
 *   node tools/feedback-summary.js field-test-answers.csv
 *
 * Reads only the CSV the app exported (columns from js/feedback.js) and prints
 * plain counts for the two closed questions and the free-text answers grouped
 * under the question they answer. No charts, no scoring, no interpretation: the
 * point of a first field test is to read what people actually said, not to turn
 * four answers into a metric.
 *
 * The file is untrusted input like any other: every cell is length-limited and
 * stripped of control characters (including terminal escapes) before printing,
 * and the documented header is required. Nothing is written anywhere.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var csv = require("./lib/review-csv.js");

var root = path.resolve(__dirname, "..");
var MAX_FILE_BYTES = 1024 * 1024;
var MAX_TEXT = 300;
var NO_ANSWER = "(no answer)";

/** The same module the page uses, so the columns cannot drift apart. */
function loadFeedback() {
  var sandbox = { window: {} };
  new vm.Script(fs.readFileSync(path.join(root, "js", "feedback.js"), "utf8"), {
    filename: "js/feedback.js",
  }).runInNewContext(sandbox);
  return sandbox.window.MLMP_FEEDBACK;
}

var FB = loadFeedback();

/** Strip anything that could move a terminal cursor or hide text. */
function clean(value, limit) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function blankCounts(options) {
  var out = {};
  options.forEach(function (option) {
    out[option] = 0;
  });
  return out;
}

/**
 * `rows` is the parsed CSV, header included. Returns counts and the free-text
 * answers in the order they were written.
 */
function summarise(rows) {
  var header = (rows[0] || []).map(function (h) {
    return clean(h, 40);
  });
  var index = {};
  header.forEach(function (h, i) {
    index[h] = i;
  });

  var questions = FB.questions();
  var usefulQuestion = questions[0];
  var freeQuestion = questions[1];
  var wouldUseQuestion = questions[2];

  var result = {
    total: 0,
    useful: blankCounts(usefulQuestion.options),
    wouldUse: blankCounts(wouldUseQuestion.options),
    freeText: [],
    byLanguage: {},
    byDistrict: {},
    skipped: 0,
  };
  result.useful[NO_ANSWER] = 0;
  result.wouldUse[NO_ANSWER] = 0;

  var cell = function (row, name) {
    return index[name] == null ? "" : row[index[name]] || "";
  };

  rows.slice(1).forEach(function (row) {
    var useful = clean(cell(row, "useful"), 40);
    var wouldUse = clean(cell(row, "would_use"), 40);
    var wrong = clean(cell(row, "wrong_for_district"), MAX_TEXT);
    var language = clean(cell(row, "language"), 10);
    var district = clean(cell(row, "district"), 60);

    // A row with nothing answered is not an answer.
    if (!useful && !wouldUse && !wrong) {
      result.skipped += 1;
      return;
    }

    result.total += 1;
    if (usefulQuestion.options.indexOf(useful) === -1) result.useful[NO_ANSWER] += 1;
    else result.useful[useful] += 1;
    if (wouldUseQuestion.options.indexOf(wouldUse) === -1) result.wouldUse[NO_ANSWER] += 1;
    else result.wouldUse[wouldUse] += 1;

    if (wrong) {
      result.freeText.push({
        question: freeQuestion.text,
        text: wrong,
        district: district || "",
        language: language || "",
      });
    }
    if (language) result.byLanguage[language] = (result.byLanguage[language] || 0) + 1;
    if (district) result.byDistrict[district] = (result.byDistrict[district] || 0) + 1;
  });

  return result;
}

function printCounts(title, counts, order) {
  var names = order.concat(
    Object.keys(counts).filter(function (name) {
      return order.indexOf(name) === -1 && counts[name] > 0;
    })
  );
  console.log(title);
  names.forEach(function (name) {
    if (name === NO_ANSWER && counts[name] === 0) return;
    console.log("    " + (name + "                    ").slice(0, 20) + counts[name]);
  });
  console.log("");
}

function printSummary(data, file) {
  console.log("Field test answers: " + file);
  console.log(
    data.total +
      (data.total === 1 ? " answer" : " answers") +
      (data.skipped ? ", " + data.skipped + " empty row(s) ignored" : "") +
      "."
  );
  console.log("No names, phones or villages are in this file, and nothing was uploaded.");
  console.log("");

  var questions = FB.questions();
  printCounts("1. " + questions[0].text, data.useful, questions[0].options);
  console.log("2. " + questions[1].text);
  if (!data.freeText.length) {
    console.log("    (nobody wrote anything)");
  } else {
    data.freeText.forEach(function (entry) {
      var where = [entry.district || "district not recorded", entry.language || "language not recorded"];
      console.log('    - "' + entry.text + '"  [' + where.join(", ") + "]");
    });
  }
  console.log("");
  printCounts("3. " + questions[2].text, data.wouldUse, questions[2].options);

  var langs = Object.keys(data.byLanguage);
  if (langs.length) {
    console.log(
      "Answers by language: " +
        langs
          .map(function (code) {
            return code + " " + data.byLanguage[code];
          })
          .join(", ")
    );
  }
  var districts = Object.keys(data.byDistrict);
  if (districts.length) {
    console.log(
      "Answers by district: " +
        districts
          .map(function (name) {
            return name + " " + data.byDistrict[name];
          })
          .join(", ")
    );
  }
  console.log("");
  console.log("This is a count of what people said, not evidence that the app works.");
}

module.exports = {
  summarise: summarise,
  header: function () {
    return FB.CSV_HEADER.slice();
  },
};

if (require.main === module) {
  var file = process.argv[2];
  if (!file) {
    console.error("Usage: node tools/feedback-summary.js <exported-feedback.csv>");
    process.exit(1);
  }
  var filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error("No such file: " + file);
    process.exit(1);
  }
  if (fs.statSync(filePath).size > MAX_FILE_BYTES) {
    console.error("That file is larger than 1 MB, so it is not a feedback export.");
    process.exit(1);
  }

  var rows = csv.parseCsv(fs.readFileSync(filePath, "utf8"));
  if (!rows.length) {
    console.error("The file is empty.");
    process.exit(1);
  }
  var header = rows[0].map(function (h) {
    return clean(h, 40);
  });
  var missing = FB.CSV_HEADER.filter(function (name) {
    return header.indexOf(name) === -1;
  });
  if (missing.length) {
    console.error("This is not a feedback export. Missing columns: " + missing.join(", ") + ".");
    console.error("Export it from feedback.html with the Export as CSV button.");
    process.exit(1);
  }

  printSummary(summarise(rows), file);
}
