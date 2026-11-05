/**
 * The three optional questions shown after the visit card.
 *
 * This is a field-test instrument, not a product feature. It stores answers in
 * this browser only, sends nothing anywhere, and has no account, no identifier
 * and no analytics. The CSV export exists so the answers can be read by the
 * person running a field test without a backend.
 *
 * Because the input arrives from a person typing on a phone, everything is
 * validated and cleaned before it is stored: known values only for the two
 * closed questions, a length limit and no control characters for the free
 * text, and a leading spreadsheet formula character is stripped so an export
 * cannot run as a formula. The CSV writer quotes every cell as well.
 *
 * Interface
 *   MLMP_FEEDBACK.questions()          the three questions and their options
 *   MLMP_FEEDBACK.save(entry)          -> { ok, error, entry }
 *   MLMP_FEEDBACK.list()               stored answers, newest last
 *   MLMP_FEEDBACK.count()
 *   MLMP_FEEDBACK.toCsv(rows)          header plus escaped rows
 *   MLMP_FEEDBACK.clear()
 */
(function () {
  "use strict";

  var STORAGE_KEY = "mlmp_feedback_v1";
  var MAX_TEXT = 400;
  var MAX_ROWS = 500;

  var QUESTIONS = [
    {
      id: "useful",
      text: "Was this useful?",
      kind: "choice",
      options: ["Yes", "A little", "No"],
    },
    {
      id: "wrong",
      text: "What is wrong for your district?",
      kind: "text",
      hint: "Optional. Write anything that would be wrong here.",
    },
    {
      id: "wouldUse",
      text: "Would you use this before an office visit?",
      kind: "choice",
      options: ["Yes", "Maybe", "No"],
    },
  ];

  var CSV_HEADER = [
    "saved_at",
    "district",
    "altitude",
    "language",
    "useful",
    "wrong_for_district",
    "would_use",
  ];

  function storage() {
    try {
      if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
      return typeof localStorage !== "undefined" ? localStorage : null;
    } catch (e) {
      return null;
    }
  }

  function cleanText(value, limit) {
    return String(value == null ? "" : value)
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, limit)
      // A leading =, +, - or @ is a spreadsheet formula, not an answer. Drop
      // the character rather than storing something an export could execute.
      .replace(/^[=+\-@\t]+/, "");
  }

  function oneOf(value, options) {
    var text = cleanText(value, 40);
    return options.indexOf(text) === -1 ? "" : text;
  }

  function readRaw() {
    var store = storage();
    if (!store) return [];
    try {
      var parsed = JSON.parse(store.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  /** Everything read back is treated as untrusted too, including old rows. */
  function normalise(row) {
    if (!row || typeof row !== "object") return null;
    var useful = oneOf(row.useful, QUESTIONS[0].options);
    var wouldUse = oneOf(row.wouldUse, QUESTIONS[2].options);
    var wrong = cleanText(row.wrong, MAX_TEXT);
    if (!useful && !wouldUse && !wrong) return null;
    return {
      savedAt: cleanText(row.savedAt, 40),
      district: cleanText(row.district, 60),
      altitude: cleanText(row.altitude, 30),
      language: oneOf(row.language, ["en", "hi", "ur"]),
      useful: useful,
      wrong: wrong,
      wouldUse: wouldUse,
    };
  }

  function list() {
    return readRaw()
      .map(normalise)
      .filter(function (row) {
        return !!row;
      });
  }

  function count() {
    return list().length;
  }

  function save(entry) {
    var row = normalise(
      Object.assign({}, entry, {
        savedAt: new Date().toISOString(),
      })
    );
    if (!row) {
      return { ok: false, error: "Answer at least one question before saving." };
    }
    var store = storage();
    if (!store) {
      return { ok: false, error: "This browser is blocking local storage, so the answer cannot be kept." };
    }
    var rows = list();
    rows.push(row);
    if (rows.length > MAX_ROWS) rows = rows.slice(rows.length - MAX_ROWS);
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(rows));
      return { ok: true, error: null, entry: row };
    } catch (e) {
      return { ok: false, error: "The answer could not be saved on this device." };
    }
  }

  function csvCell(value) {
    var text = String(value == null ? "" : value);
    // Belt and braces with cleanText: even a hand-edited stored row cannot
    // turn into a formula when the file is opened in a spreadsheet.
    if (/^[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function toCsv(rows) {
    var data = rows || list();
    var lines = [CSV_HEADER.join(",")];
    data.forEach(function (row) {
      var r = normalise(row);
      if (!r) return;
      lines.push(
        [
          r.savedAt,
          r.district,
          r.altitude,
          r.language,
          r.useful,
          r.wrong,
          r.wouldUse,
        ]
          .map(csvCell)
          .join(",")
      );
    });
    return lines.join("\r\n") + "\r\n";
  }

  function clear() {
    var store = storage();
    if (!store) return false;
    try {
      store.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  function questions() {
    return QUESTIONS.map(function (q) {
      return {
        id: q.id,
        text: q.text,
        kind: q.kind,
        hint: q.hint || "",
        options: q.options ? q.options.slice() : [],
      };
    });
  }

  window.MLMP_FEEDBACK = {
    questions: questions,
    save: save,
    list: list,
    count: count,
    toCsv: toCsv,
    clear: clear,
    CSV_HEADER: CSV_HEADER,
  };
})();
