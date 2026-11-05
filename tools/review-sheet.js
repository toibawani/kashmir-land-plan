#!/usr/bin/env node
/**
 * Build one printable review sheet per district.
 *
 * The app's catalogue is grouped coarsely by zone, but an officer's answer is
 * about the district they actually serve. These sheets put the activities
 * relevant to that district on one page, with the district's own note where
 * the catalogue has one, and a space to accept or correct each line.
 *
 * Usage
 *   node tools/review-sheet.js                 all districts
 *   node tools/review-sheet.js Pulwama         one district
 *
 * The output is plain HTML with inline CSS so it prints or saves to PDF from
 * any browser, and so it can be handed over on a phone with no connection.
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

function esc(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function page(district) {
  var zone = REGIONS.catalogueZoneFor(REGIONS.defaultAltitude(district));
  var info = REGIONS.district(district) || {};
  var list = activitiesFor(district);

  var rows = list
    .map(function (a, i) {
      var note = (a.districtNotes && a.districtNotes[district]) || (a.zoneNotes && a.zoneNotes[zone.id]) || "";
      return (
        "<tr>" +
        "<td class=\"num\">" +
        (i + 1) +
        "</td>" +
        "<td><strong>" +
        esc(a.title) +
        "</strong>" +
        (note ? "<p class=\"note\">" + esc(note) + "</p>" : "") +
        "<p class=\"meta\">Main risk: " +
        esc(a.mainRisk) +
        "</p></td>" +
        "<td class=\"tick\">&#9744;</td>" +
        "<td class=\"tick\">&#9744;</td>" +
        "<td class=\"comment\"></td>" +
        "</tr>"
      );
    })
    .join("");

  return (
    "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n" +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<meta name="robots" content="noindex" />\n' +
    "<title>Catalogue review sheet: " +
    esc(district) +
    "</title>\n<style>" +
    "body{font-family:Georgia,'Times New Roman',serif;color:#1e241e;margin:0;padding:18px;line-height:1.45;}" +
    "h1{font-size:20pt;margin:0 0 4px;}h2{font-size:12pt;margin:18px 0 6px;}" +
    ".lede{max-width:52em;}.zone{font-size:10pt;color:#4a4a42;margin:0 0 12px;}" +
    ".fields{display:flex;flex-wrap:wrap;gap:14px;margin:12px 0 16px;}" +
    ".field{flex:1 1 180px;border-bottom:1px solid #555;padding:14px 0 2px;font-size:10pt;}" +
    "table{width:100%;border-collapse:collapse;font-size:10pt;}" +
    "th,td{border:1px solid #8a8a7a;padding:6px;vertical-align:top;text-align:left;}" +
    "th{background:#eee9dc;font-size:9pt;}" +
    ".num{width:4%;}.tick{width:7%;text-align:center;font-size:14pt;}.comment{width:32%;}" +
    ".note{margin:3px 0 0;font-size:9pt;color:#3d423d;}.meta{margin:3px 0 0;font-size:8.5pt;color:#5a5a50;}" +
    ".how{margin-top:16px;font-size:9.5pt;max-width:52em;}" +
    ".how li{margin-bottom:4px;}" +
    "@page{size:A4;margin:12mm;}" +
    "@media print{body{padding:0;}th{background:#eee9dc !important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}}" +
    "</style>\n</head>\n<body>\n" +
    "<h1>Catalogue review sheet: " +
    esc(district) +
    "</h1>\n" +
    '<p class="zone">' +
    esc(zone.title || zone.label) +
    ". " +
    esc(zone.summary) +
    "</p>\n" +
    '<div class="fields">' +
    '<div class="field">Officer name</div>' +
    '<div class="field">Designation</div>' +
    '<div class="field">Office</div>' +
    '<div class="field">Date (YYYY-MM-DD)</div>' +
    "</div>\n" +
    '<h2>Activities the app would show for this district</h2>\n' +
    "<table>\n<thead><tr><th class=\"num\">No.</th><th>Activity and what the app says</th><th class=\"tick\">Right</th><th class=\"tick\">Wrong</th><th class=\"comment\">Correction or note</th></tr></thead>\n<tbody>" +
    rows +
    "</tbody>\n</table>\n" +
    (info.spans ? '<p class="zone">' + esc(info.spans) + "</p>\n" : "") +
    '<div class="how">\n<h2>How to reply</h2>\n<ol>' +
    "<li>Write your name, designation, office and the date at the top.</li>" +
    "<li>Tick right or wrong beside each activity. If it is wrong, write why, and what should replace it.</li>" +
    "<li>Mark any season, risk or local note that is misleading, even if the activity itself is fine.</li>" +
    "<li>Hand the sheet back, or send a photo of it. Nothing here needs a computer.</li>" +
    "</ol>\n" +
    "<p>The app never prints an amount, deadline, eligibility rule or yield promise. If a figure comes up, it is recorded as a question for the office, not as advice on screen.</p>\n" +
    "<p>For the maintainer: the fields above map to the CSV columns <code>activity_id, decision, reviewer_name, office, designation, reviewed_on, note</code>. Import with <code>node tools/import-review.js &lt;file.csv&gt;</code> and apply any correction to <code>js/catalogue.js</code> before running <code>npm test</code>.</p>\n" +
    "</div>\n</body>\n</html>\n"
  );
}

fs.mkdirSync(outDir, { recursive: true });

var requested = process.argv[2];
var districts = requested ? [requested] : REGIONS.names;
if (requested && !REGIONS.district(requested)) {
  console.error("Unknown district: " + requested);
  process.exit(1);
}

districts.forEach(function (district) {
  fs.writeFileSync(path.join(outDir, district + ".html"), page(district), "utf8");
});

if (!requested) {
  var links = districts
    .map(function (d) {
      return '<li><a href="' + encodeURIComponent(d) + '.html">' + esc(d) + "</a></li>";
    })
    .join("");
  fs.writeFileSync(
    path.join(outDir, "index.html"),
    "<!DOCTYPE html>\n<html lang=\"en\"><head><meta charset=\"utf-8\" />" +
      '<meta name="viewport" content="width=device-width, initial-scale=1" />' +
      '<meta name="robots" content="noindex" />' +
      "<title>Catalogue review sheets</title>" +
      "<style>body{font-family:system-ui,sans-serif;max-width:44rem;margin:2rem auto;padding:0 1rem;line-height:1.6}" +
      "li{margin-bottom:.35rem}</style></head><body>" +
      "<h1>Catalogue review sheets</h1>" +
      "<p>One printable page per district, generated from the live catalogue by <code>node tools/review-sheet.js</code>. Regenerate after a catalogue change.</p>" +
      "<ul>" +
      links +
      "</ul></body></html>\n",
    "utf8"
  );
}

console.log("Wrote " + districts.length + " review sheet" + (districts.length === 1 ? "" : "s") + " to review-sheets/.");
