#!/usr/bin/env node
/**
 * Prove that an installed copy of the app notices a new version.
 *
 * This is the one behaviour that decides whether a fix reaches a farmer who
 * already used the app: the worker has to be replaced, and the page has to say
 * so instead of reloading under a half-typed plan.
 *
 * The test copies the site to a temporary folder, loads it, waits until a
 * worker controls the page, then rewrites the copy's CACHE_VERSION (which is
 * exactly what a deploy does) and asks the registration to update. It passes
 * when the Reload strip appears without the page reloading itself.
 *
 *   python3 -m http.server is not used: this tool starts its own server on a
 *   port of its own so it can edit the files it serves. Chrome still has to be
 *   listening on 9333.
 *
 * Exit code 1 means the update flow is broken.
 */
"use strict";

var fs = require("fs");
var http = require("http");
var os = require("os");
var path = require("path");
var H = require("./lib/harness.js");

var root = path.resolve(__dirname, "..");
var port = 8099;
var chromePort = process.argv[2] || "9333";
var base = "http://127.0.0.1:" + port;

var MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
  ".ico": "image/x-icon",
};

var failures = [];
function check(name, condition, detail) {
  if (condition) {
    console.log("ok   " + name);
  } else {
    failures.push(name + (detail ? " (" + detail + ")" : ""));
    console.log("FAIL " + name + (detail ? ": " + detail : ""));
  }
}

function copySite(target) {
  var skip = [".git", "tools", "node_modules", "review-sheets", "_site", ".github", ".freebuff"];
  fs.mkdirSync(target, { recursive: true });
  fs.readdirSync(root).forEach(function (name) {
    if (skip.indexOf(name) !== -1) return;
    if (/\.md$/i.test(name)) return;
    fs.cpSync(path.join(root, name), path.join(target, name), { recursive: true });
  });
}

function serve(dir) {
  return new Promise(function (resolve) {
    var server = http.createServer(function (req, res) {
      var rel = decodeURIComponent(req.url.split("?")[0]);
      if (rel === "/") rel = "/index.html";
      var file = path.join(dir, rel);
      if (file.indexOf(dir) !== 0 || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
        // GitHub Pages sends max-age=600; a dev server must not be faster than
        // the real host, or this test would prove a flow nobody has.
        "Cache-Control": "max-age=0, must-revalidate",
      });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(port, "127.0.0.1", function () {
      resolve(server);
    });
  });
}

(async function main() {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "mlmp-sw-"));
  copySite(dir);
  var server = await serve(dir);

  var cdp = await H.connect(chromePort);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 360,
    height: 740,
    deviceScaleFactor: 1,
    mobile: true,
  });

  try {
    await H.navigate(cdp, base + "/");

    var controlled = await H.waitFor(
      cdp,
      "(function(){return !!(navigator.serviceWorker && navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL.indexOf('sw.js') !== -1);})()",
      20000
    );
    check("a worker controls the first load", controlled);
    if (!controlled) throw new Error("no service worker took control, so an update cannot be simulated");

    var initial = await H.evaluate(cdp, "document.getElementById('update-strip').hidden");
    check("the reload strip starts hidden", initial === true);

    // A marker that only survives if the page is not reloaded.
    await H.evaluate(cdp, "(function(){window.__mlmpUpdateProbe='kept';return true;})()");

    var swFile = path.join(dir, "sw.js");
    var current = fs.readFileSync(swFile, "utf8");
    var version = (current.match(/CACHE_VERSION = "([^"]+)"/) || [])[1];
    if (!version) throw new Error("sw.js has no CACHE_VERSION to bump");
    var next = version.replace(/(\d+)$/, function (n) {
      return String(Number(n) + 1);
    });
    fs.writeFileSync(swFile, current.replace('CACHE_VERSION = "' + version + '"', 'CACHE_VERSION = "' + next + '"'), "utf8");
    console.log("bumped " + version + " to " + next + " in the served copy");

    await H.evaluate(
      cdp,
      "(function(){return navigator.serviceWorker.getRegistration().then(function(r){return r.update();});})()"
    );

    var shown = await H.waitFor(
      cdp,
      "(function(){var s=document.getElementById('update-strip');return !!s && !s.hidden;})()",
      25000
    );
    check("the reload strip appears after the worker updates", shown);

    var kept = await H.evaluate(cdp, "window.__mlmpUpdateProbe");
    check("the page did not reload itself", kept === "kept");

    if (shown) {
      var text = await H.evaluate(cdp, "document.getElementById('update-strip').textContent.replace(/\\s+/g,' ').trim()");
      check("the strip says a newer version is ready", /newer version/i.test(text), text);
      var button = await H.evaluate(cdp, "!!document.getElementById('btn-update-reload')");
      check("the strip offers a Reload button", button);
    }
  } finally {
    cdp.close();
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }

  if (failures.length) {
    console.error("\n" + failures.length + " update-flow problem(s).");
    process.exit(1);
  }
  console.log("\nUpdate flow works: a new worker is noticed and offered, without a forced reload.");
})().catch(function (err) {
  console.error("Update check failed to run: " + err.message);
  process.exit(1);
});
