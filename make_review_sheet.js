#!/usr/bin/env node
// Write a printable review sheet straight out of the catalogue.
// The app reads its review fields from exactly these activities, so the
// sheet can never drift from what the app shows.
var fs = require("fs");
var vm = require("vm");

var root = "/Users/apple/Desktop/kashmir-land-plan";
var sb = { window: {} };
vm.runInNewContext(fs.readFileSync(root + "/js/regions.js", "utf8"), sb);
vm.runInNewContext(fs.readFileSync(root + "/js/catalogue.js", "utf8"), sb);
var C = sb.window.MLMP_CATALOGUE;
var ids = Object.keys(C.activities).sort();

var L = [];
L.push("# Catalogue review sheet");
L.push("");
L.push("This sheet is a paper copy of the activity list, with space for an");
L.push("officer's comment beside each one. The app reads its review fields");
L.push("from this same catalogue, so nothing the officer writes here can");
L.push("drift from the app.");
L.push("");
L.push("| No. | Activity | Main local notes |");
L.push("| --- | --- | --- |");
var n = 1;
ids.forEach(function (id) {
  var a = C.activities[id];
  L.push("| " + (n++) + " | " + a.title + " |  |");
});
L.push("");
L.push("## How to use");
L.push("");
L.push("- Write the officer's name and designation at the top of the page.");
L.push("- Tick, cross or write in the remarks by each activity as you go.");
L.push("- Mark anything you disagree with, and a reason, not just a tick.");
L.push("- Anything left plain is accepted as-is by the app.");
L.push("");
L.push("## Fields the maintainer fills in afterwards (" + ids.length + ")");
L.push("");
L.push("For the whole list the maintainer fills in the review record once, or");
L.push("per entry. These are the fields the app reads back:");
L.push("");
L.push("| Field | What it holds | Example |");
L.push("| --- | --- | --- |");
L.push("| reviewStatus | \"not-reviewed\" or \"reviewed\" | not-reviewed |");
L.push("| reviewedBy | the officer's name | A. Sharma |");
L.push("| designation | their role | Agriculture Extension Officer |");
L.push("| reviewedOn | the check date, YYYY-MM-DD | 2026-11-04 |");
L.push("");
L.push("A half-recorded review is refused by the build: a name or date must");
L.push("accompany a reviewed status, and anything missing stays not-reviewed.");
L.push("");
L.push("## Review status wording, for reference");
L.push("");
L.push("- Not reviewed: \"Not yet reviewed by an agriculture officer. Treat");
L.push("  every suggestion as a question to discuss, not as advice to act on.");
L.push("  Always confirm locally before acting.\"");
L.push("- Reviewed: \"Reviewed by [name], [designation] on [date]. Still");
L.push("  confirm locally before acting.\"");
L.push("");
L.push("---");
L.push("");
L.push("This sheet is generated from the live catalogue. The app builds its");
L.push("review status from the same fields, so a review recorded on paper");
L.push("cannot drift from what the app shows.");
fs.writeFileSync("/Users/apple/Desktop/kashmir-land-plan/REVIEW_SHEET.md", L.join("\n") + "\n");
console.log("wrote REVIEW_SHEET.md for " + ids.length + " activities");
