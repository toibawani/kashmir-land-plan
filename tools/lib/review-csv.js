/**
 * Parsing and validation for an officer's filled-in review CSV.
 *
 * Kept apart from the command so the rules can be tested without touching the
 * filesystem, and so there is exactly one definition of "valid review".
 *
 * The CSV is untrusted input: it arrives from a visit, a phone, an email. It
 * is therefore never evaluated, every value is length-limited and stripped of
 * control characters, a value that a spreadsheet would treat as a formula is
 * rejected outright, and only the columns below are read. Anything else is an
 * error rather than something quietly ignored.
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

// accept: the entry is right for the district as written.
// reject: it is wrong here and should be removed or rewritten.
// fix:    a specific correction is written in the note.
var DECISIONS = ["accept", "reject", "fix"];

var MAX = {
  name: 80,
  office: 120,
  designation: 120,
  note: 600,
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
  return (
    d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
  );
}

/**
 * Validate parsed rows against the catalogue.
 *
 * Returns { records, corrections, errors } where records is keyed by activity
 * id and each value is a review record, corrections are the notes a person
 * still has to act on in the prose, and errors is a list of readable strings.
 * A row with any error produces no record at all: a partial import is worse
 * than a refused one, because the missing half looks reviewed.
 */
function validate(rows, knownIds) {
  var errors = [];
  var records = {};
  var corrections = [];
  var seen = Object.create(null);

  if (!rows.length) {
    return { records: records, corrections: corrections, errors: ["The file is empty."] };
  }

  var header = rows[0].map(function (h) {
    return clean(h, 40);
  });
  var missing = COLUMNS.filter(function (c) {
    return header.indexOf(c) === -1;
  });
  if (missing.length) {
    errors.push("The header is missing these columns: " + missing.join(", ") + ".");
  }
  var unknown = header.filter(function (h) {
    return COLUMNS.indexOf(h) === -1;
  });
  if (unknown.length) {
    errors.push("The header has columns this importer does not know: " + unknown.join(", ") + ".");
  }
  if (missing.length || unknown.length) {
    return { records: records, corrections: corrections, errors: errors };
  }

  var index = {};
  header.forEach(function (h, i) {
    index[h] = i;
  });

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
    return { records: {}, corrections: [], errors: errors };
  }
  return { records: records, corrections: corrections, errors: errors };
}

module.exports = {
  COLUMNS: COLUMNS,
  DECISIONS: DECISIONS,
  parseCsv: parseCsv,
  validate: validate,
  validDate: validDate,
};
