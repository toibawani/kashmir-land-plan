/**
 * Parsing and validation for a filled-in review CSV.
 *
 * Kept apart from the command so the rules can be tested without touching the
 * filesystem, and so there is exactly one definition of "valid review".
 *
 * Two formats are accepted, and only these two:
 *
 *   activity_id,decision,reviewer_name,office,designation,reviewed_on,note
 *     the original hand-written form, decisions accept / reject / fix
 *
 *   district,entry_id,entry_text,verdict,correction,reviewer_name,office,date
 *     the prefilled CSV that sits beside each district sheet, so an officer's
 *     verdicts are typed next to text they never have to copy
 *
 * The CSV is untrusted input: it arrives from a visit, a phone, an email. It is
 * therefore never evaluated, every value is length-limited and stripped of
 * control characters, a value that a spreadsheet would treat as a formula is
 * rejected outright, and only the columns of the detected format are read.
 * Anything else is an error rather than something quietly ignored.
 *
 * A verdict of "not sure", or no verdict at all, records nothing: an officer
 * declining to sign a line off must leave the app saying that line is
 * unreviewed, not turn it into an implicit approval.
 */
"use strict";

var COLUMNS = [
  "activity_id",
  "decision",
  "reviewer_name",
  "office",
  "designation",
  "reviewed_on",
  "note",
];

var PACK_COLUMNS = [
  "district",
  "entry_id",
  "entry_text",
  "verdict",
  "correction",
  "reviewer_name",
  "office",
  "date",
];

// accept: the entry is right for the district as written.
// reject: it is wrong here and should be removed or rewritten.
// fix:    a specific correction is written in the note.
var DECISIONS = ["accept", "reject", "fix"];

// The words a person writes on the paper sheet, lowercased.
var PACK_VERDICTS = ["right", "wrong", "not sure"];

var MAX = {
  name: 80,
  office: 120,
  designation: 120,
  note: 600,
  text: 200,
  district: 60,
};

var DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** RFC4180-style parse. Handles quoted fields, commas and newlines in them. */
function parseCsv(text) {
  var rows = [];
  var row = [];
  var field = "";
  var inQuotes = false;
  var value = String(text == null ? "" : text).replace(/^\uFEFF/, "");

  for (var i = 0; i < value.length; i += 1) {
    var c = value[i];
    if (inQuotes) {
      if (c === '"') {
        if (value[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      /* line endings are normalised away */
    } else {
      field += c;
    }
  }
  row.push(field);
  rows.push(row);

  return rows.filter(function (r) {
    return r.some(function (cell) {
      return cell.trim() !== "";
    });
  });
}

/** Trim, collapse whitespace, drop control characters, cap the length. */
function clean(value, limit) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

/** A spreadsheet formula is not a review note. Refuse it, do not strip it. */
function looksLikeFormula(value) {
  return /^[=+\-@\t\r]/.test(value);
}

function validDate(value) {
  var m = DATE.exec(value);
  if (!m) return false;
  var year = Number(m[1]);
  var month = Number(m[2]);
  var day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  var d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

function headerProblems(header, expected) {
  var problems = [];
  var missing = expected.filter(function (c) {
    return header.indexOf(c) === -1;
  });
  if (missing.length) {
    problems.push("The header is missing these columns: " + missing.join(", ") + ".");
  }
  var unknown = header.filter(function (c) {
    return expected.indexOf(c) === -1;
  });
  if (unknown.length) {
    problems.push("The header has columns this importer does not know: " + unknown.join(", ") + ".");
  }
  return problems;
}

function indexOf(header) {
  var index = {};
  header.forEach(function (h, i) {
    index[h] = i;
  });
  return index;
}

function validateLegacy(rows, knownIds) {
  var errors = [];
  var records = {};
  var corrections = [];
  var seen = Object.create(null);

  var header = rows[0].map(function (h) {
    return clean(h, 40);
  });
  errors = errors.concat(headerProblems(header, COLUMNS));
  if (errors.length) return { records: records, corrections: corrections, errors: errors, skipped: 0 };

  var index = indexOf(header);

  rows.slice(1).forEach(function (row, n) {
    var line = n + 2;
    var get = function (name) {
      return row[index[name]] == null ? "" : row[index[name]];
    };
    var id = clean(get("activity_id"), 40);
    var decision = clean(get("decision"), 20).toLowerCase();
    var name = clean(get("reviewer_name"), MAX.name);
    var office = clean(get("office"), MAX.office);
    var designation = clean(get("designation"), MAX.designation);
    var date = clean(get("reviewed_on"), 10);
    var note = clean(get("note"), MAX.note);

    if (!id) {
      errors.push("Line " + line + ": no activity id.");
      return;
    }
    if (knownIds.indexOf(id) === -1) {
      errors.push("Line " + line + ': "' + id + '" is not an activity in the catalogue.');
      return;
    }
    if (seen[id]) {
      errors.push("Line " + line + ': "' + id + '" appears more than once.');
      return;
    }
    if (DECISIONS.indexOf(decision) === -1) {
      errors.push("Line " + line + ": decision must be accept, reject or fix.");
      return;
    }
    if (!name) {
      errors.push("Line " + line + ": the officer's name is required.");
      return;
    }
    if (!office) {
      errors.push("Line " + line + ": the officer's office is required.");
      return;
    }
    if (!validDate(date)) {
      errors.push("Line " + line + ": the date must be a real date as YYYY-MM-DD.");
      return;
    }
    if (!designation && decision !== "accept") {
      errors.push("Line " + line + ": a designation is required when the entry needs a change.");
      return;
    }
    [name, office, designation, note].forEach(function (value) {
      if (looksLikeFormula(value)) {
        errors.push("Line " + line + ": a value starts with a spreadsheet formula character.");
      }
    });

    seen[id] = true;
    records[id] = {
      reviewStatus: "reviewed",
      reviewedBy: name,
      office: office,
      designation: designation,
      reviewedOn: date,
    };
    if (note || decision !== "accept") {
      corrections.push({
        id: id,
        decision: decision,
        note: note,
        office: office,
        reviewedOn: date,
      });
    }
  });

  if (errors.length) {
    // All or nothing. Half an import is a review nobody can account for.
    return { records: {}, corrections: [], errors: errors, skipped: 0 };
  }
  return { records: records, corrections: corrections, errors: errors, skipped: 0 };
}

/**
 * Validate the prefilled per-district sheet.
 *
 * `context` is `{ districts: { Baramulla: { beekeeping: "Beekeeping ..." } } }`,
 * built from the same modules the sheet generator uses. The entry text in the
 * CSV is checked against the catalogue: if it does not match, the pack the
 * officer marked is stale, and their ticks may be about a line the app no
 * longer shows, so the file is refused rather than guessed at.
 */
function validatePack(rows, context) {
  var errors = [];
  var records = {};
  var corrections = [];
  var seen = Object.create(null);
  var skipped = 0;
  var districts = (context && context.districts) || {};

  var header = rows[0].map(function (h) {
    return clean(h, 40);
  });
  errors = errors.concat(headerProblems(header, PACK_COLUMNS));
  if (errors.length) return { records: records, corrections: corrections, errors: errors, skipped: 0 };

  var index = indexOf(header);

  rows.slice(1).forEach(function (row, n) {
    var line = n + 2;
    var get = function (name) {
      return row[index[name]] == null ? "" : row[index[name]];
    };
    var district = clean(get("district"), MAX.district);
    var id = clean(get("entry_id"), 40);
    var entryText = clean(get("entry_text"), MAX.text);
    var verdict = clean(get("verdict"), 20).toLowerCase();
    var correction = clean(get("correction"), MAX.note);
    var name = clean(get("reviewer_name"), MAX.name);
    var office = clean(get("office"), MAX.office);
    var date = clean(get("date"), 10);

    if (!district) {
      errors.push("Line " + line + ": no district.");
      return;
    }
    if (!id) {
      errors.push("Line " + line + ": no entry id.");
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(districts, district)) {
      errors.push("Line " + line + ': "' + district + '" is not a district in this app.');
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(districts[district], id)) {
      errors.push(
        "Line " + line + ': the ' + district + " sheet does not list \"" + id + "\"."
      );
      return;
    }
    if (seen[id]) {
      errors.push("Line " + line + ': "' + id + '" appears more than once.');
      return;
    }
    if (verdict && PACK_VERDICTS.indexOf(verdict) === -1) {
      errors.push("Line " + line + ": verdict must be right, wrong, not sure, or empty.");
      return;
    }

    // No tick, or "not sure", records nothing at all. That is the point of the
    // third box: it must never become an approval by omission.
    if (!verdict || verdict === "not sure") {
      skipped += 1;
      return;
    }

    if (!name) {
      errors.push("Line " + line + ": the officer's name is required.");
      return;
    }
    if (!office) {
      errors.push("Line " + line + ": the officer's office is required.");
      return;
    }
    if (!validDate(date)) {
      errors.push("Line " + line + ": the date must be a real date as YYYY-MM-DD.");
      return;
    }
    var wanted = clean(districts[district][id], MAX.text);
    if (entryText !== wanted) {
      errors.push(
        "Line " + line +
          ": the entry text does not match the catalogue (" +
          id +
          ' is "' +
          wanted +
          '"), so this sheet is out of date. Run npm run review-sheets and mark the new sheet.'
      );
      return;
    }
    [name, office, correction].forEach(function (value) {
      if (looksLikeFormula(value)) {
        errors.push("Line " + line + ": a value starts with a spreadsheet formula character.");
      }
    });

    seen[id] = true;
    var decision = verdict === "right" ? "accept" : correction ? "fix" : "reject";
    records[id] = {
      reviewStatus: "reviewed",
      reviewedBy: name,
      office: office,
      designation: "",
      reviewedOn: date,
    };
    if (decision !== "accept") {
      corrections.push({
        id: id,
        decision: decision,
        note: correction,
        office: office,
        reviewedOn: date,
      });
    }
  });

  if (errors.length) {
    return { records: {}, corrections: [], errors: errors, skipped: skipped };
  }
  return { records: records, corrections: corrections, errors: errors, skipped: skipped };
}

/**
 * Validate parsed rows against the catalogue.
 *
 * `context` is optional and only needed for the pack format; `knownIds` is the
 * legacy list of activity ids. Returns `{ records, corrections, errors,
 * skipped }`, where records is keyed by activity id and each value is a review
 * record, corrections are the notes a person still has to act on in the prose,
 * skipped counts rows that carried no verdict, and errors is a list of readable
 * strings. A row with any error produces no record at all: a partial import is
 * worse than a refused one, because the missing half looks reviewed.
 */
function validate(rows, knownIds, context) {
  if (!rows.length) {
    return { records: {}, corrections: [], errors: ["The file is empty."], skipped: 0 };
  }

  var header = rows[0].map(function (h) {
    return clean(h, 40);
  });

  if (header.indexOf("entry_id") !== -1) {
    return validatePack(rows, context);
  }
  return validateLegacy(rows, knownIds || []);
}

module.exports = {
  COLUMNS: COLUMNS,
  PACK_COLUMNS: PACK_COLUMNS,
  DECISIONS: DECISIONS,
  PACK_VERDICTS: PACK_VERDICTS,
  parseCsv: parseCsv,
  validate: validate,
  validDate: validDate,
};
