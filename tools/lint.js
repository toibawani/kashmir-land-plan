#!/usr/bin/env node
/**
 * `npm run lint`: the checks ESLint would not know about.
 *
 * There is no framework and no dependencies here, so a linter config would be
 * mostly ceremony. What this file does is enforce the handful of rules this
 * project actually cares about, and fail the build on them:
 *
 *   - nothing writes to the console in shipped code (a tool may)
 *   - no `debugger`, `eval` or `new Function`, all of which turn a mistake into
 *     a security problem in a file a browser executes
 *   - no insecure http:// resource, apart from the SVG namespace identifier
 *   - every `target="_blank"` is paired with rel="noopener"
 *   - nothing that looks like a committed secret or an API key
 *   - no TODO, FIXME or XXX left in something a farmer is meant to use
 *   - no tab indentation in the shipped JavaScript and CSS
 *
 * It reads only. Exit code 0 means the folder passed.
 */
"use strict";

var fs = require("fs");
var path = require("path");

var root = path.resolve(__dirname, "..");
var problems = [];
var checked = 0;

function rel(file) {
  return path.relative(root, file);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function fail(file, line, message) {
  problems.push(rel(file) + ":" + line + " " + message);
}

/** Line number for a character offset, so a message points at the right place. */
function lineAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

function eachMatch(text, regex, callback) {
  var m;
  regex.lastIndex = 0;
  while ((m = regex.exec(text))) {
    callback(m, lineAt(text, m.index));
    if (!regex.global) return;
  }
}

function checkJs(file) {
  var text = read(file);
  var isTool = rel(file).indexOf("tools" + path.sep) === 0;

  if (!isTool) {
    eachMatch(text, /console\.(log|debug|info|warn|error)\s*\(/g, function (m, line) {
      fail(file, line, "writes to the console; shipped code should be silent");
    });
  }

  eachMatch(text, /\bdebugger\b/g, function (m, line) {
    fail(file, line, "contains a debugger statement");
  });

  eachMatch(text, /(^|[^.\w])eval\s*\(|new\s+Function\s*\(/g, function (m, line) {
    fail(file, line, "evaluates a string as code");
  });

  eachMatch(text, /\b(TODO|FIXME|XXX)\b/g, function (m, line) {
    fail(file, line, "has a " + m[1] + " marker in user-facing code");
  });

  eachMatch(text, /(^|\n)\t/g, function (m, line) {
    fail(file, line, "is indented with a tab; the project uses spaces");
  });

  // `document.write` and a string passed to `setTimeout` both turn a text
  // value into executable markup, which is the shape of most injection bugs a
  // file like this could grow. Nothing here needs either.
  eachMatch(text, /document\.write(ln)?\s*\(/g, function (m, line) {
    fail(file, line, "writes into the document while it is parsing");
  });

  eachMatch(text, /set(Timeout|Interval)\s*\(\s*["']/g, function (m, line) {
    fail(file, line, "passes a string to " + m[1] + ", which executes it");
  });
}

function checkCss(file) {
  var text = read(file);
  eachMatch(text, /(^|\n)\t/g, function (m, line) {
    fail(file, line, "is indented with a tab; the project uses spaces");
  });
  eachMatch(text, /url\(\s*['"]?http:\/\//g, function (m, line) {
    fail(file, line, "loads a resource over plain http");
  });
}

function checkHtml(file) {
  var text = read(file);

  eachMatch(text, /<[^>]+\son[a-z]+\s*=/gi, function (m, line) {
    // The one deliberate exception: the webfont link flips its media attribute
    // on load so the first paint is not blocked. It runs nothing but that.
    if (/media="print"\s+onload="this\.media='all'"/.test(text.slice(m.index, m.index + 220))) return;
    fail(file, line, "uses an inline event handler");
  });

  eachMatch(text, /target="_blank"/g, function (m, line) {
    var tag = text.slice(Math.max(0, m.index - 300), m.index + 300);
    if (!/rel="[^"]*noopener/.test(tag)) {
      fail(file, line, 'opens a new tab without rel="noopener"');
    }
  });

  eachMatch(text, /(src|href)="http:\/\//g, function (m, line) {
    fail(file, line, "loads a resource over plain http");
  });

  eachMatch(text, /\b(TODO|FIXME|XXX)\b/g, function (m, line) {
    fail(file, line, "has a " + m[1] + " marker in a shipped page");
  });
}

function checkText(file) {
  var text = read(file);
  var patterns = [
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "contains a private key"],
    [/\bAKIA[0-9A-Z]{16}\b/, "contains an AWS access key"],
    [/\bsk-[A-Za-z0-9]{16,}\b/, "contains something shaped like an API secret"],
    [/\b(api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{8,}["']/i, "assigns a literal secret"],
    [/\bghp_[A-Za-z0-9]{20,}\b/, "contains a GitHub token"],
  ];
  patterns.forEach(function (pair) {
    eachMatch(text, pair[0] instanceof RegExp && pair[0].global ? pair[0] : new RegExp(pair[0].source, pair[0].flags + "g"), function (m, line) {
      fail(file, line, pair[1]);
    });
  });
}

function walk(dir, filter, list) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "docs") return;
    var full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, filter, list);
    } else if (filter(full)) {
      list.push(full);
    }
  });
  return list;
}

var jsFiles = walk(path.join(root, "js"), function (f) {
  return f.endsWith(".js");
}, []);
jsFiles.push(path.join(root, "sw.js"));

var cssFiles = walk(path.join(root, "css"), function (f) {
  return f.endsWith(".css");
}, []);

var htmlFiles = fs
  .readdirSync(root)
  .filter(function (f) {
    return f.endsWith(".html");
  })
  .map(function (f) {
    return path.join(root, f);
  });

var textFiles = jsFiles.concat(cssFiles, htmlFiles).concat([path.join(root, "manifest.webmanifest")]);

jsFiles.forEach(function (file) {
  checked++;
  checkJs(file);
  checkText(file);
});
cssFiles.forEach(function (file) {
  checked++;
  checkCss(file);
  checkText(file);
});
htmlFiles.forEach(function (file) {
  checked++;
  checkHtml(file);
  checkText(file);
});
textFiles
  .filter(function (f) {
    return f.endsWith(".webmanifest");
  })
  .forEach(function (file) {
    checked++;
    checkText(file);
  });

if (problems.length) {
  console.error("Lint failed with " + problems.length + " problem(s):");
  problems.forEach(function (p) {
    console.error("  " + p);
  });
  process.exit(1);
}

console.log("Lint passed: " + checked + " files, no console output, no eval, no secrets, no insecure links.");
