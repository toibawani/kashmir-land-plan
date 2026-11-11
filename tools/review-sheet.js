#!/usr/bin/env node
/**
 * Build the officer review pack.
 *
 * The app's catalogue is grouped coarsely by zone, but an officer's answer is
 * about the district they actually serve. This writes four things into
 * `review-sheets/`, all from the live catalogue:
 *
 *   index.html       the pack cover: what is being asked, what to write, what
 *                    happens afterwards, and every district grouped by zone
 *   <District>.html  one printable sheet per district, with Right / Wrong /
 *                    Not sure boxes, a wide notes column and a signature block
 *   <District>.csv   the same rows, prefilled, so after the visit only the
 *                    verdict and the correction have to be typed
 *   all.html         every district in one document, for one print job or PDF
 *
 * Usage
 *   node tools/review-sheet.js                 all districts
 *   node tools/review-sheet.js Pulwama         one district (leaves the pack alone)
 *   node tools/review-sheet.js --check         fail if the pack is stale
 *
 * The sheet is a marking form, not a document to read: A4, 11pt body text,
 * one row per activity that never splits across a page boundary, three tick
 * boxes wide enough for a pen, and a notes column the width of a thumb. It has
 * to work printed on a district office's printer and saved as a PDF on a phone.
 *
 * No amount, deadline or eligibility rule is printed: the sheet asks the
 * officer to correct the entry, not to supply a figure for the app to quote.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var root = path.resolve(__dirname, "..");
var outDir = path.join(root, "review-sheets");

function load(files) {
  var sandbox = { window: {} };
  files.forEach(function (file) {
    new vm.Script(fs.readFileSync(path.join(root, "js", file), "utf8"), {
      filename: file,
    }).runInNewContext(sandbox);
  });
  return sandbox.window;
}

var win = load(["regions.js", "catalogue.js", "activities.js"]);
var REGIONS = win.MLMP_REGIONS;
var ACT = win.MLMP_ACTIVITIES;
var PACK = require("./lib/pack-version.js");

/**
 * Every printed page carries this: the release and a digest of the catalogue
 * text it was made from. It is also a column in every prefilled CSV, and the
 * importer refuses a file whose version no longer matches.
 */
var SHEET_VERSION = PACK.SHEET_VERSION;

/** The prefilled CSV columns. Kept in one place: the importer reads them. */
var PACK_COLUMNS = [
  "district",
  "entry_id",
  "entry_text",
  "verdict",
  "correction",
  "reviewer_name",
  "office",
  "date",
  "sheet_version",
];

function esc(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Quote every cell, and defuse anything a spreadsheet would run. */
function csvCell(value) {
  var text = String(value == null ? "" : value);
  if (/^[=+\-@\t]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function activitiesFor(district) {
  var altitudeId = REGIONS.defaultAltitude(district);
  var zone = REGIONS.catalogueZoneFor(altitudeId);
  if (!zone) return [];
  return ACT.ids
    .map(function (id) {
      return ACT.ALL[id];
    })
    .filter(function (a) {
      if (a.zones.indexOf(zone.id) === -1) return false;
      if (a.districtsOnly && a.districtsOnly.indexOf(district) === -1) return false;
      return true;
    })
    .sort(function (a, b) {
      return a.title.localeCompare(b.title);
    });
}

/**
 * Page budgets in millimetres: A4 is 297mm tall with 14mm margins, so 269mm of
 * paper. The page is filled by estimate and then checked by rendering, because
 * Chromium cannot print "page X of Y" in a margin box: the only honest page
 * number is one this file decides and lays out itself.
 */
var PAGE_MM = 258;
var FOOTER_MM = 9;
var TABLE_HEAD_MM = 9;
var HOW_TO_MM = 58;
var FIRST_HEAD_MM = 92;

/** Rough line count for a cell, from the column widths in STYLE below. */
function estimatedLines(text, perLine) {
  var length = String(text == null ? "" : text).trim().length;
  if (!length) return 0;
  return Math.max(1, Math.ceil(length / perLine));
}

/** A row's height in millimetres, deliberately on the generous side. */
function rowHeight(title, note, risk) {
  return (
    3.2 +
    estimatedLines(title, 45) * 4.4 +
    estimatedLines(note, 52) * 4.0 +
    estimatedLines("Main risk: " + risk, 58) * 3.6
  );
}

/**
 * Split rows into pages: the first page carries the header block, every page
 * carries the table head and the footer, and the last page carries "How to
 * reply".
 */
function planPages(heights) {
  var pages = [];
  var current = [];
  var used = 0;
  heights.forEach(function (height) {
    var cap =
      pages.length === 0
        ? PAGE_MM - FOOTER_MM - FIRST_HEAD_MM - TABLE_HEAD_MM
        : PAGE_MM - FOOTER_MM - TABLE_HEAD_MM - HOW_TO_MM;
    if (current.length && used + height > cap) {
      pages.push(current);
      current = [];
      used = 0;
    }
    current.push(height);
    used += height;
  });
  pages.push(current);
  return pages;
}

/** The line at the foot of every printed page. */
function footer(district, number, total) {
  return (
    '<div class="pgfoot">\n' +
    "<span>" +
    esc(district) +
    "</span>\n<span>page " +
    number +
    " of " +
    total +
    "</span>\n<span>sheet " +
    esc(SHEET_VERSION) +
    "</span>\n</div>\n"
  );
}

/**
 * The style is shared by the sheets, the cover and the print-all file.
 *
 * Sizes are in points because this only ever goes to paper or a PDF. 11pt body
 * text and 10.5pt table text are readable at arm's length; the tick columns are
 * 8% of an A4 text width, about 15mm, which is enough for a pen box rather than
 * a checkbox on a screen.
 */
var STYLE =
  "html{font-size:11pt;}" +
  "body{font-family:Georgia,'Times New Roman',serif;color:#1e241e;margin:0;padding:14px;line-height:1.35;}" +
  "h1{font-size:18pt;margin:0 0 5px;line-height:1.2;}h2{font-size:12pt;margin:12px 0 5px;}" +
  ".lede{max-width:52em;}.assumed{font-size:10.5pt;color:#3f443f;margin:0 0 8px;max-width:52em;}" +
  ".assumed strong{color:#1e241e;}" +
  ".spans{font-size:10pt;color:#4d3f22;border-left:3px solid #b9a878;padding:2px 0 2px 9px;margin:0 0 12px;max-width:50em;}" +
  ".who{display:flex;gap:14px;margin:8px 0 0;}" +
  ".who + .who{margin-top:10px;}" +
  ".line{flex:1 1 0;border-bottom:1px solid #444;height:26px;position:relative;}" +
  ".line span{position:absolute;left:0;bottom:3px;font-size:9pt;color:#4a4a42;}" +
  ".line.wide{flex:2 1 0;}" +
  ".key{font-size:10pt;margin:12px 0 7px;max-width:52em;}.key strong{white-space:nowrap;}" +
  "table{width:100%;border-collapse:collapse;font-size:10.5pt;}" +
  "th,td{border:1px solid #7e7e6e;padding:6px;vertical-align:top;text-align:left;}" +
  "th{background:#eee9dc;font-size:9.5pt;}" +
  "tr{break-inside:avoid;page-break-inside:avoid;}" +
  "thead{display:table-header-group;}" +
  ".num{width:5%;}.what{width:44%;}" +
  // The header cells and the tick cells are separate classes on purpose: a
  // 15pt box belongs in the grid, not in a 9pt column heading.
  "th.tickbox{width:7.5%;font-size:8.5pt;text-align:center;padding-left:3px;padding-right:3px;}" +
  "td.box{width:7.5%;text-align:center;font-size:15pt;line-height:1.2;padding:6px 2px;}" +
  ".notes{width:28%;}" +
  ".note{margin:2px 0 0;font-size:9.5pt;}.meta{margin:2px 0 0;font-size:8.5pt;color:#4d4d44;}" +
  ".how{margin-top:14px;font-size:10pt;max-width:52em;}.how ol{margin:6px 0;padding-left:1.3em;}.how li{margin-bottom:3px;}" +
  ".maintainer{margin-top:14px;padding:8px 10px;border:1px dashed #8a8a7a;font-size:8.5pt;max-width:52em;color:#3d423d;}" +
  ".pack h2{margin-top:16px;}.pack ul{padding-left:1.2em;}" +
  ".pack li{margin-bottom:4px;font-size:10.5pt;}" +
  ".pack .group{border-top:1px solid #c9c4b4;padding-top:5px;margin-top:12px;}" +
  ".pack .zone{font-size:9.5pt;color:#4a4a42;margin:2px 0 6px;}" +
  ".pack a{color:#1e241e;}" +
  ".pg{display:flex;flex-direction:column;height:" +
  PAGE_MM +
  "mm;break-after:page;page-break-after:always;}" +
  ".pg:last-of-type{break-after:auto;page-break-after:auto;}" +
  ".pgfoot{margin-top:auto;display:flex;justify-content:space-between;gap:10px;" +
  "border-top:1px solid #c9c4b4;padding-top:3px;font-size:8pt;color:#4d4d44;}" +
  ".pgfoot span:first-child{font-weight:bold;color:#1e241e;}" +
  "@page{size:A4;margin:14mm;}" +
  "@media print{body{padding:0;}" +
  "th{background:#eee9dc !important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}" +
  ".pack a{text-decoration:none;color:#1e241e;}.no-print{display:none;}}" +
  "section.sheet{break-before:page;page-break-before:always;}" +
  "section.sheet:first-of-type{break-before:auto;page-break-before:auto;}";

/** The body of one district sheet, reused by the single sheet and print-all. */
function sheetSections(district) {
  var zone = REGIONS.zoneFor(district) || {};
  var altitudeId = REGIONS.defaultAltitude(district);
  var altitude = REGIONS.altitudeZone(altitudeId) || {};
  var info = REGIONS.district(district) || {};
  var list = activitiesFor(district);

  var rows = list.map(function (a, i) {
    var note =
      (a.districtNotes && a.districtNotes[district]) ||
      (a.zoneNotes && a.zoneNotes[zone.id]) ||
      "";
    return {
      height: rowHeight(a.title, note, a.mainRisk),
      html:
        "<tr>" +
        '<td class="num">' +
        (i + 1) +
        "</td>" +
        '<td class="what"><strong>' +
        esc(a.title) +
        "</strong>" +
        (note ? '<p class="note">' + esc(note) + "</p>" : "") +
        '<p class="meta">Main risk: ' +
        esc(a.mainRisk) +
        "</p></td>" +
        '<td class="box">&#9744;</td>' +
        '<td class="box">&#9744;</td>' +
        '<td class="box">&#9744;</td>' +
        '<td class="notes"></td>' +
        "</tr>",
    };
  });

  var tableHead =
    "<table>\n<thead><tr>" +
    '<th class="num">No.</th><th class="what">What the app shows</th>' +
    '<th class="tickbox">Right</th><th class="tickbox">Wrong</th><th class="tickbox">Not&nbsp;sure</th>' +
    '<th class="notes">Correction or note</th>' +
    "</tr></thead>\n<tbody>";

  var emptyNote =
    '<p class="assumed"><strong>The app shows no options for this ground on purpose.</strong> ' +
    "The catalogue has no data it can stand behind here, so there is nothing to tick " +
    "except whether that gap is real. Write below if it is not.</p>\n";

  var head =
    "<h1>Catalogue review sheet: " +
    esc(district) +
    "</h1>\n" +
    '<p class="assumed"><strong>What the app assumes for this district:</strong> ' +
    esc(zone.label || "") +
    ", " +
    esc(altitude.band || zone.elevationBand || "") +
    ". Suggested ground: " +
    esc(altitude.label || "") +
    ".</p>\n" +
    (info.spans
      ? '<p class="spans">' +
        esc(info.spans) +
        " Tick for the ground named above. If you serve a different part of the district, write which ground you mean beside the rows it affects.</p>\n"
      : "") +
    '<div class="who">' +
    '<div class="line"><span>Reviewer name</span></div>' +
    '<div class="line"><span>Designation</span></div>' +
    '<div class="line"><span>Office</span></div>' +
    "</div>\n" +
    '<div class="who">' +
    '<div class="line"><span>Date (YYYY-MM-DD)</span></div>' +
    '<div class="line"><span>Signature</span></div>' +
    "</div>\n" +
    '<p class="key">Tick one box for each activity. <strong>Right</strong> means the app\'s ' +
    "line is correct for your district. <strong>Wrong</strong> means it should be removed " +
    "or rewritten: write why, and what should replace it. <strong>Not sure</strong> leaves " +
    "it unreviewed, which is a useful answer too.</p>\n" +
    "<h2>What the app would show for this district</h2>\n";

  var howTo =
    '<div class="how">\n<h2>How to reply</h2>\n<ol>' +
    "<li>Write your name, designation, office, the date and your signature at the top.</li>" +
    "<li>Tick right, wrong or not sure beside each activity.</li>" +
    "<li>Where it is wrong, write why, and what should replace it, in the last column.</li>" +
    "<li>Mark a misleading season or risk note even when the activity itself is fine.</li>" +
    "<li>Hand the sheet back, or send a photo of it. Nothing here needs a computer.</li>" +
    "</ol>\n" +
    "<p>A line with no tick stays unreviewed, and the app keeps saying so. The app never " +
    "prints an amount, deadline, eligibility rule or yield promise; if a figure comes up, " +
    "it is recorded as a question for the office, not as advice on screen.</p>\n" +
    "</div>\n";

  var plan = planPages(
    rows.map(function (row) {
      return row.height;
    })
  );
  var at = 0;

  return plan
    .map(function (heights, index) {
      var slice = rows.slice(at, at + heights.length);
      at += heights.length;
      var body = "";
      if (!list.length) body = emptyNote;
      else if (slice.length) {
        body =
          tableHead +
          slice
            .map(function (row) {
              return row.html;
            })
            .join("") +
          "</tbody>\n</table>\n";
      }
      return (
        '<section class="pg">\n' +
        (index === 0 ? head : "") +
        body +
        (index === plan.length - 1 ? howTo : "") +
        footer(district, index + 1, plan.length) +
        "</section>\n"
      );
    })
    .join("");
}

function page(district) {
  return (
    "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n" +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<meta name="robots" content="noindex" />\n' +
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'\" />\n" +
    '<meta name="referrer" content="no-referrer" />\n' +
    "<title>Catalogue review sheet: " +
    esc(district) +
    "</title>\n<style>" +
    STYLE +
    "</style>\n</head>\n<body>\n" +
    sheetSections(district) +
    '<p class="maintainer no-print">For the maintainer, not the officer: the prefilled rows are in ' +
    "<code>" +
    esc(district) +
    ".csv</code>, and a filled sheet imports with " +
    "<code>node tools/import-review.js " +
    esc(district) +
    ".csv</code>. Prose corrections are applied to <code>js/catalogue.js</code> by hand " +
    "before <code>npm test</code>.</p>\n" +
    "</body>\n</html>\n"
  );
}

/** One CSV per district, with the entry id and text filled so nothing is retyped. */
function packCsv(district) {
  var lines = [PACK_COLUMNS.join(",")];
  activitiesFor(district).forEach(function (a) {
    lines.push(
      [district, a.id, a.title, "", "", "", "", "", SHEET_VERSION]
        .map(csvCell)
        .join(",")
    );
  });
  return lines.join("\n") + "\n";
}

/** The pack cover: the conversation the maintainer is asking for, in words. */
function cover(districts) {
  var byZone = {};
  districts.forEach(function (name) {
    var zone = REGIONS.zoneFor(name);
    var id = zone ? zone.id : "no-data";
    byZone[id] = byZone[id] || { zone: zone, names: [] };
    byZone[id].names.push(name);
  });

  var groups = Object.keys(byZone)
    .map(function (id) {
      var group = byZone[id];
      var zone = group.zone || {};
      var band = String(zone.elevationBand || "").trim();
      if (band && !/[.!?]$/.test(band)) band += ".";
      return (
        '<div class="group">\n<h2>' +
        esc(zone.label || "No catalogue zone") +
        "</h2>\n" +
        '<p class="zone">' +
        esc(band) +
        (band && zone.summary ? " " : "") +
        esc(zone.summary || "") +
        "</p>\n<ul>" +
        group.names
          .map(function (name) {
            var altitude = REGIONS.altitudeZone(REGIONS.defaultAltitude(name)) || {};
            return (
              '<li><a href="' +
              encodeURIComponent(name) +
              '.html">' +
              esc(name) +
              "</a>" +
              ' <span class="zone">(suggested ground: ' +
              esc(altitude.label || "not set") +
              ", " +
              activitiesFor(name).length +
              " activities)</span></li>"
            );
          })
          .join("") +
        "</ul>\n</div>"
      );
    })
    .join("\n");

  var spanning = districts.filter(function (name) {
    var info = REGIONS.district(name) || {};
    return !!info.spans;
  });

  return (
    "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n" +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<meta name="robots" content="noindex" />\n' +
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'\" />\n" +
    '<meta name="referrer" content="no-referrer" />\n' +
    "<title>Catalogue review pack</title>\n<style>" +
    STYLE +
    "</style>\n</head>\n<body class=\"pack\">\n" +
    "<h1>Catalogue review pack</h1>\n" +
    '<p class="lede">For an agriculture or horticulture officer. One sheet per district, ' +
    ACT.ids.length +
    " activities in the app's list. There is nothing to install and nothing to edit: " +
    "tick the boxes on paper and hand the sheet back.</p>\n" +
    "<h2>What is being asked</h2>\n" +
    '<p class="lede">Farmers use the app to turn a few details about an unused plot into questions ' +
    "to bring to an office. The suggestions it shows come from a short list of activities. " +
    "<strong>Is anything on it wrong for your district?</strong> An option that does not make " +
    "sense for the area, a month that is off for local practice, a reason that misleads, or " +
    "something missing that farmers here are usually advised to consider. You do not need to " +
    "approve anything. Crossing out a wrong line is the most useful thing you can do.</p>\n" +
    "<h2>How to reply</h2>\n" +
    "<ul><li>Tick right, wrong or not sure beside each activity on your district sheet.</li>" +
    "<li>Write your name, designation, office, the date and your signature at the top.</li>" +
    "<li>Mark a misleading season or risk note even when the activity itself is fine.</li>" +
    "<li>Hand it back, or send a photo. Nothing here needs a computer.</li></ul>\n" +
    "<h2>What happens after</h2>\n" +
    '<p class="lede">You never touch the app. The maintainer fixes or removes what you marked ' +
    "wrong, and records that you checked it: your name, designation, office and the date. Every " +
    'screen then changes from "Not yet reviewed by an agriculture officer" to "Reviewed by ' +
    '[your name], [designation] on [date]". A row you marked not sure stays unreviewed. The ' +
    "line asking every farmer to confirm locally before acting does not go away, before or " +
    "after your review.</p>\n" +
    (spanning.length
      ? '<p class="lede"><strong>' +
        spanning.length +
        " of these districts span more than one kind of ground.</strong> The sheet lists the " +
        "activities the app assumes for the district's usual ground, and says so at the top. " +
        "If you serve a different part of the district, write which ground you are thinking of: " +
        "that answer is as useful as a correction.</p>\n"
      : "") +
    // The printing instructions are for the screen. Printing the cover would
    // otherwise leave a heading with nothing under it.
    '<div class="no-print">\n<h2>Printing</h2>\n' +
    '<p class="lede">Take one district sheet, or print them all at once: ' +
    '<a href="all.html">all districts in one document</a> (' +
    districts.length +
    " sheets, A4). Each district sheet also prints on its own. A prefilled CSV sits beside " +
    "each sheet for the maintainer to type the answers into afterwards.</p>\n</div>\n" +
    "<h2>District sheets</h2>\n" +
    groups +
    '\n<div class="maintainer">\n<p><strong>For the maintainer, not the officer.</strong> ' +
    "This pack is sheet version <code>" +
    esc(SHEET_VERSION) +
    "</code>. It is printed in each page footer and in every prefilled CSV, and the importer " +
    "refuses a file printed from a different version. Regenerate this pack after any catalogue " +
    "change with <code>npm run review-sheets</code>; " +
    "the build fails if the pack does not match the catalogue. A filled sheet's CSV has the " +
    "columns <code>" +
    PACK_COLUMNS.join(", ") +
    "</code>; import it with <code>node tools/import-review.js &lt;file.csv&gt;</code>, and add " +
    "<code>--dry-run</code> first to see exactly what would be recorded without writing anything. " +
    "Apply prose corrections to <code>js/catalogue.js</code> by hand. Never mark anything " +
    "reviewed without a real reply, a real name and a real date.</p>\n</div>\n" +
    "</body>\n</html>\n"
  );
}

/** Every district sheet in one file, so the whole pack can be one print job. */
function printAll(districts) {
  var sections = districts
    .map(function (name) {
      return '<section class="sheet">\n' + sheetSections(name) + "</section>\n";
    })
    .join("");

  return (
    "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n" +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<meta name="robots" content="noindex" />\n' +
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'\" />\n" +
    '<meta name="referrer" content="no-referrer" />\n' +
    "<title>Catalogue review sheets: all districts</title>\n<style>" +
    STYLE +
    "</style>\n</head>\n<body>\n" +
    sections +
    "</body>\n</html>\n"
  );
}

fs.mkdirSync(outDir, { recursive: true });

var checkOnly = process.argv.indexOf("--check") !== -1;
var requested = process.argv.filter(function (a) {
  return a !== "--check";
})[2];

if (requested && !REGIONS.district(requested)) {
  console.error("Unknown district: " + requested);
  process.exit(1);
}

var districts = requested ? [requested] : REGIONS.names;
var outputs = [];
districts.forEach(function (district) {
  outputs.push({ file: district + ".html", body: page(district) });
  outputs.push({ file: district + ".csv", body: packCsv(district) });
});
if (!requested) {
  outputs.push({ file: "index.html", body: cover(districts) });
  outputs.push({ file: "all.html", body: printAll(districts) });
}

/*
 * `--check` compares what the catalogue would generate now against what is
 * committed. A pack that quietly went stale after a catalogue edit would put an
 * officer's signature beside a line the app no longer shows, so `npm test`
 * refuses that instead of trusting the last person to run the generator.
 */
if (checkOnly) {
  var stale = outputs.filter(function (out) {
    var target = path.join(outDir, out.file);
    var current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
    return current !== out.body;
  });

  if (stale.length) {
    console.error("The review pack is out of date. Run `npm run review-sheets`.");
    stale.forEach(function (out) {
      console.error("  stale: review-sheets/" + out.file);
    });
    process.exit(1);
  }

  console.log(
    "Review pack is current: " + outputs.length + " files match the catalogue in js/catalogue.js."
  );
  process.exit(0);
}

outputs.forEach(function (out) {
  fs.writeFileSync(path.join(outDir, out.file), out.body, "utf8");
});

console.log(
  "Wrote " +
    districts.length +
    " review sheet" +
    (districts.length === 1 ? "" : "s") +
    " to review-sheets/" +
    (requested ? "." : ", each with a prefilled CSV, plus the cover and a print-all file.")
);
