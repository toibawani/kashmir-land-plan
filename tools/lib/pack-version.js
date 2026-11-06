/**
 * The version of the printed review pack.
 *
 * A sheet leaves the building on paper, comes back weeks later, and has to be
 * traceable to the exact catalogue text it was printed from. So the version has
 * two halves:
 *
 *   the release   package.json's version, with a leading v: "v1.0.0". The tag
 *                 on main and the GitHub release carry the same string.
 *   the catalogue a short digest of js/regions.js, js/catalogue.js and
 *                 js/activities.js, the three files the pack is built from.
 *
 * That makes a printed page answerable: the release says what the app was, the
 * digest says whether the catalogue has moved since. The importer refuses a CSV
 * whose version does not match, because the officer's ticks may be about lines
 * the app no longer shows.
 *
 * Nothing here is a promise that the catalogue is right. It is a fingerprint.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

var root = path.resolve(__dirname, "..", "..");
var pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

var SOURCES = ["js/regions.js", "js/catalogue.js", "js/activities.js"];

function digest() {
  var hash = crypto.createHash("sha1");
  SOURCES.forEach(function (file) {
    hash.update(file + "\n");
    hash.update(fs.readFileSync(path.join(root, file), "utf8"));
  });
  return hash.digest("hex").slice(0, 7);
}

var RELEASE = "v" + pkg.version;
var CATALOGUE = digest();
var SHEET_VERSION = RELEASE + " · catalogue " + CATALOGUE;

module.exports = {
  RELEASE: RELEASE,
  CATALOGUE: CATALOGUE,
  SHEET_VERSION: SHEET_VERSION,
  SOURCES: SOURCES,
};
