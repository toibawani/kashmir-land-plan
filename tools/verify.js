#!/usr/bin/env node
/**
 * Pre-flight check for a no-build site, run by `npm run build`.
 *
 * There is nothing to compile here, so "build" does the job that actually
 * matters for a static app: it fails loudly before a broken file reaches a
 * farmer's phone. Two things have broken this app for real before, and both
 * are checked here.
 *
 *   1. A stray character in a script left it unparseable, so no screen
 *      responded at all. Every JavaScript file is syntax-checked the same way
 *      `node --check` does it, by compiling without running it.
 *   2. A file was referenced but not present, or the service worker's
 *      precache list drifted from what the page loads, so the app worked
 *      online and broke offline. Every local reference in index.html is
 *      confirmed on disk, and the precache list is reconciled against it.
 *
 * It uses only Node built-ins. A non-zero exit means do not ship.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var root = path.resolve(__dirname, "..");
var failures = [];
var notes = [];

function rel(p) {
  return path.relative(root, p) || p;
}

function exists(p) {
  try {
    return fs.statSync(p).isFile();
  } catch (_) {
    return false;
  }
}

/* ---- 1. Every JavaScript file must parse ---- */

function listJsFiles(dir) {
  var out = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    var full = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(listJsFiles(full));
    else if (entry.name.endsWith(".js")) out.push(full);
  });
  return out;
}

var jsFiles = listJsFiles(path.join(root, "js")).concat([path.join(root, "sw.js")]);

jsFiles.forEach(function (file) {
  var code = fs.readFileSync(file, "utf8");
  try {
    // Compiles without running, so browser globals like `window` are fine.
    new vm.Script(code, { filename: rel(file) });
  } catch (err) {
    failures.push(rel(file) + " does not parse: " + err.message);
  }
});

/* ---- 2. Every local reference in index.html must exist on disk ---- */

var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var refs = [];
var refRe = /(?:src|href)="([^"]+)"/g;
var match;
while ((match = refRe.exec(html)) !== null) {
  var target = match[1];
  // Skip anything that leaves the site: absolute URLs, in-page anchors, data.
  if (/^(https?:)?\/\//.test(target) || target.startsWith("#") || target.startsWith("data:")) continue;
  refs.push(target);
}
refs = refs.filter(function (v, i, a) {
  return a.indexOf(v) === i;
});

var htmlScripts = refs.filter(function (r) {
  return r.endsWith(".js");
});

refs.forEach(function (r) {
  if (!exists(path.join(root, r))) {
    failures.push("index.html references " + r + " but it is not on disk");
  }
});

/* ---- 3. The service worker must precache what the page loads ---- */

var sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
var assetsBlock = sw.match(/var\s+CORE_ASSETS\s*=\s*\[([\s\S]*?)\]/);
var precache = [];
if (assetsBlock) {
  var itemRe = /"([^"]+)"/g;
  var item;
  while ((item = itemRe.exec(assetsBlock[1])) !== null) {
    precache.push(item[1].replace(/^\.\//, ""));
  }
}

precache.forEach(function (r) {
  if (!exists(path.join(root, r))) {
    failures.push("sw.js precaches " + r + " but it is not on disk");
  }
});

// Anything the page loads that is not precached will break offline.
htmlScripts
  .concat(refs.filter(function (r) { return r.endsWith(".css") || r === "manifest.webmanifest"; }))
  .forEach(function (r) {
    if (precache.indexOf(r) === -1) {
      failures.push("index.html loads " + r + " but sw.js does not precache it, so it breaks offline");
    }
  });

// The reverse is only a note: an extra precached file is harmless.
precache.forEach(function (r) {
  if (refs.indexOf(r) === -1 && !/\.js$/.test(r)) {
    notes.push("sw.js precaches " + r + " which index.html does not reference directly");
  }
});

/* ---- Report ---- */

notes.forEach(function (n) {
  console.log("note: " + n);
});

if (failures.length) {
  console.error("\nBuild check failed:");
  failures.forEach(function (f) {
    console.error("  - " + f);
  });
  process.exit(1);
}

console.log(
  "\nBuild check passed: " +
    jsFiles.length +
    " scripts parse, " +
    refs.length +
    " local references resolve, " +
    precache.length +
    " assets precached for offline."
);
