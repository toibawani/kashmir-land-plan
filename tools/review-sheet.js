#!/usr/bin/env node
/**
 * Build the officer review pack.
 *
 * The app's catalogue is grouped coarsely by zone, but an officer's answer is
 * about the district they actually serve. This writes three things into
 * `review-sheets/`, all from the live catalogue:
 *
 *   index.html   the pack cover: what is being asked, what to write, what
 *                happens afterwards, and every district grouped by zone
 *   <District>.html  one printable sheet per district, with a right/wrong box
 *                and space to correct each line
 *   all.html     every district in one document, for a single print job or PDF
 *
 * Usage
 *   node tools/review-sheet.js                 all districts
 *   node tools/review-sheet.js Pulwama         one district (leaves the pack alone)
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

/** The style is shared by the sheets, the cover and the print-all file. */
var STYLE =
  "body{font-family:Georgia,'Times New Roman',serif;color:#1e241e;margin:0;padding:18px;line-height:1.45;}" +
  "h1{font-size:20pt;margin:0 0 4px;}h2{font-size:12pt;margin:18px 0 6px;}" +
  ".lede{max-width:52em;}.zone{font-size:10pt;color:#4a4a42;margin:0 0 10px;max-width:52em;}" +
  ".zone strong{color:#1e241e;}" +
  ".spans{font-size:9.5pt;color:#5a4a2a;border-left:3px solid #c8b98a;padding-left:8px;margin:0 0 14px;max-width:50em;}" +
  ".fields{display:flex;flex-wrap:wrap;gap:14px;margin:12px 0 16px;}" +
  ".field{flex:1 1 180px;border-bottom:1px solid #555;padding:14px 0 2px;font-size:10pt;}" +
  "table{width:100%;border-collapse:collapse;font-size:10pt;}" +
  "th,td{border:1px solid #8a8a7a;padding:6px;vertical-align:top;text-align:left;}" +
  "th{background:#eee9dc;font-size:9pt;}" +
  ".num{width:4%;}.tick{width:7%;text-align:center;font-size:14pt;}.comment{width:32%;}" +
  ".note{margin:3px 0 0;font-size:9pt;color:#3d423d;}.meta{margin:3px 0 0;font-size:8.5pt;color:#5a5a50;}" +
  ".how{margin-top:16px;font-size:9.5pt;max-width:52em;}.how li{margin-bottom:4px;}" +
  ".pack h2{margin-top:20px;}.pack ul{padding-left:1.2em;}" +
  ".pack li{margin-bottom:6px;font-size:10.5pt;}" +
  ".pack .group{border-top:1px solid #c9c4b4;padding-top:6px;margin-top:14px;}" +
  ".pack .maintainer{margin-top:22px;padding:10px;border:1px dashed #8a8a7a;font-size:9pt;max-width:52em;}" +
  ".pack a{color:#1e241e;}" +
  "@page{size:A4;margin:12mm;}" +
  "@media print{body{padding:0;}th{background:#eee9dc !important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}" +
  ".pack a{text-decoration:none;color:#1e241e;}.no-print{display:none;}}" +
  "section.sheet{break-before:page;}section.sheet:first-of-type{break-before:auto;}";

/** The body of one district sheet, reused by the single sheet and print-all. */
function sheetBody(district) {
  var zone = REGIONS.zoneFor(district) || {};
  var altitudeId = REGIONS.defaultAltitude(district);
  var altitude = REGIONS.altitudeZone(altitudeId) || {};
  var info = REGIONS.district(district) || {};
  var list = activitiesFor(district);

  var rows = list
    .map(function (a, i) {
      var note =
        (a.districtNotes && a.districtNotes[district]) ||
        (a.zoneNotes && a.zoneNotes[zone.id]) ||
        "";
      return (
        "<tr>" +
        '<td class="num">' +
        (i + 1) +
        "</td>" +
        "<td><strong>" +
        esc(a.title) +
        "</strong>" +
        (note ? '<p class="note">' + esc(note) + "</p>" : "") +
        '<p class="meta">Main risk: ' +
        esc(a.mainRisk) +
        "</p></td>" +
        '<td class="tick">&#9744;</td>' +
        '<td class="tick">&#9744;</td>' +
        '<td class="comment"></td>' +
        "</tr>"
      );
    })
    .join("");

  var table = list.length
    ? "<table>\n<thead><tr><th class=\"num\">No.</th><th>Activity and what the app says</th>" +
      '<th class="tick">Right</th><th class="tick">Wrong</th><th class="comment">Correction or note</th>' +
      "</tr></thead>\n<tbody>" +
      rows +
      "</tbody>\n</table>\n"
    : '<p class="zone"><strong>The app shows no options for this ground on purpose.</strong> ' +
      "The catalogue has no data it can stand behind here, so there is nothing to correct " +
      "except whether that gap is real. Write below if it is not.</p>\n";

  return (
    "<h1>Catalogue review sheet: " +
    esc(district) +
    "</h1>\n" +
    '<p class="zone"><strong>What the app assumes for this district:</strong> ' +
    esc(zone.label || "") +
    ", " +
    esc(altitude.band || zone.elevationBand || "") +
    ". Suggested ground: " +
    esc(altitude.label || "") +
    ".</p>\n" +
    (info.spans ? '<p class="spans">' + esc(info.spans) + " If the activities below do not match the part of the district you serve, write which ground you are thinking of beside them.</p>\n" : "") +
    '<div class="fields">' +
    '<div class="field">Officer name</div>' +
    '<div class="field">Designation</div>' +
    '<div class="field">Office</div>' +
    '<div class="field">Date (YYYY-MM-DD)</div>' +
    "</div>\n" +
    "<h2>Activities the app would show for this district</h2>\n" +
    table +
    '<div class="how">\n<h2>How to reply</h2>\n<ol>' +
    "<li>Write your name, designation, office and the date at the top.</li>" +
    "<li>Tick right or wrong beside each activity. If it is wrong, write why, and what should replace it.</li>" +
    "<li>Mark any season, risk or local note that is misleading, even if the activity itself is fine.</li>" +
    "<li>Hand the sheet back, or send a photo of it. Nothing here needs a computer.</li>" +
    "</ol>\n" +
    "<p>The app never prints an amount, deadline, eligibility rule or yield promise. If a figure comes up, it is recorded as a question for the office, not as advice on screen.</p>\n" +
    "<p>For the maintainer: the fields above map to the CSV columns <code>activity_id, decision, reviewer_name, office, designation, reviewed_on, note</code>. Import with <code>node tools/import-review.js &lt;file.csv&gt;</code> and apply any correction to <code>js/catalogue.js</code> before running <code>npm test</code>.</p>\n" +
    "</div>\n"
  );
}

function page(district) {
  return (
    "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n" +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<meta name="robots" content="noindex" />\n' +
    "<title>Catalogue review sheet: " +
    esc(district) +
    "</title>\n<style>" +
    STYLE +
    "</style>\n</head>\n<body>\n" +
    sheetBody(district) +
    "</body>\n</html>\n"
  );
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
      return (
        '<div class="group">\n<h2>' +
        esc(zone.label || "No catalogue zone") +
        "</h2>\n" +
        '<p class="zone">' +
        esc(zone.elevationBand || "") +
        " " +
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
              "</a> <span class=\"zone\">(suggested ground: " +
              esc(altitude.label || "not set") +
              ")</span></li>"
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

  var activityCount = ACT.ids.length;

  return (
    "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n" +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<meta name="robots" content="noindex" />\n' +
    "<title>Catalogue review pack</title>\n<style>" +
    STYLE +
    "</style>\n</head>\n<body class=\"pack\">\n" +
    "<h1>Catalogue review pack</h1>\n" +
    '<p class="lede">For an agriculture or horticulture officer. One page per district, ' +
    activityCount +
    " activities in the app's list. There is nothing to install and nothing to edit: " +
    "write on the paper and hand it back.</p>\n" +
    "<h2>What is being asked</h2>\n" +
    '<p class="lede">Farmers use the app to turn a few details about an unused plot into questions ' +
    "to bring to an office. The suggestions it shows come from a short list of activities. " +
    "<strong>Is anything on it wrong for your district?</strong> An option that does not make " +
    "sense for the area, a month that is off for local practice, a reason that misleads, or " +
    "something missing that farmers here are usually advised to consider. You do not need to " +
    "approve anything. Crossing out a wrong line is the most useful thing you can do.</p>\n" +
    "<h2>How to reply</h2>\n" +
    '<ul><li>Write your name, designation, office and the date at the top of the district sheet.</li>' +
    "<li>Tick right or wrong beside each activity. Where it is wrong, write why, and what should replace it.</li>" +
    "<li>Mark a misleading season or risk note even when the activity itself is fine.</li>" +
    "<li>Hand it back, or send a photo. Nothing here needs a computer.</li></ul>\n" +
    "<h2>What happens after</h2>\n" +
    '<p class="lede">You never touch the app. The maintainer fixes or removes what you marked, ' +
    "and records that you checked it: your name, designation, office and the date. Every screen " +
    "then changes from \"Not yet reviewed by an agriculture officer\" to \"Reviewed by [your name], " +
    "[designation] on [date]\". The line asking every farmer to confirm locally before acting does " +
    "not go away, before or after your review.</p>\n" +
    "<h2>Printing</h2>\n" +
    '<p class="lede no-print">Take one district sheet, or print them all at once: ' +
    '<a href="all.html">all districts in one document</a> (' +
    districts.length +
    " pages, A4). Each district sheet also prints on its own.</p>\n" +
    (spanning.length
      ? '<p class="lede"><strong>' +
        spanning.length +
        " of these districts span more than one kind of ground.</strong> The sheet lists the " +
        "activities the app assumes for the district's usual ground, and says so at the top. " +
        "If you serve a different part of the district, write which ground you are thinking of: " +
        "that answer is as useful as a correction.</p>\n"
      : "") +
    "<h2>District sheets</h2>\n" +
    groups +
    '\n<div class="maintainer">\n<p><strong>For the maintainer, not the officer.</strong> ' +
    "Regenerate this pack after any catalogue change with <code>npm run review-sheets</code>. " +
    "A filled sheet comes back as the CSV columns <code>activity_id, decision, reviewer_name, " +
    "office, designation, reviewed_on, note</code>; import it with " +
    "<code>node tools/import-review.js &lt;file.csv&gt;</code> and apply prose corrections to " +
    "<code>js/catalogue.js</code> by hand. Never mark anything reviewed without a real reply, a " +
    "real name and a real date.</p>\n</div>\n" +
    "</body>\n</html>\n"
  );
}

/** Every district sheet in one file, so the whole pack can be one print job. */
function printAll(districts) {
  var sections = districts
    .map(function (name) {
      return '<section class="sheet">\n' + sheetBody(name) + "</section>\n";
    })
    .join("");

  return (
    "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n" +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<meta name="robots" content="noindex" />\n' +
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
var outputs = districts.map(function (district) {
  return { file: district + ".html", body: page(district) };
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
    "Review pack is current: " +
      outputs.length +
      " files match the catalogue in js/catalogue.js."
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
    (requested ? "." : ", with the pack cover and a print-all file.")
);
