#!/usr/bin/env node
/**
 * Capture the README screenshots, run by `npm run screenshots`.
 *
 * The images under docs/screenshots are the ones a visitor sees first, so they
 * have to be reproducible: anyone should be able to regenerate them from the
 * app in this folder rather than trusting a set of pictures that quietly went
 * stale. This drives a real Chrome over the DevTools protocol at a 390x844
 * phone viewport, which is the size the app is actually used at.
 *
 * The script uses only Node built-ins, but it needs two things running. It
 * says so plainly and exits non-zero if either is missing:
 *
 *   1. The site itself:            npm start
 *   2. A headless Chrome with remote debugging, for example on macOS:
 *
 *        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *          --headless=new --disable-gpu --remote-debugging-port=9333 \
 *          --user-data-dir=/tmp/mlmp-chrome about:blank
 *
 * Then:  npm run screenshots
 *
 * Requires Node 22 or newer for the global WebSocket and fetch.
 */
"use strict";

var fs = require("fs");
var path = require("path");

var base = process.argv[2] || "http://127.0.0.1:8080";
var outDir = process.argv[3] || path.resolve(__dirname, "..", "docs", "screenshots");
var port = process.argv[4] || "9333";

var VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

/**
 * A very small CDP client over one WebSocket, so this stays dependency-free.
 */
function connect(url) {
  return new Promise(function (resolve, reject) {
    var ws = new WebSocket(url);
    var nextId = 1;
    var pending = {};
    ws.addEventListener("open", function () {
      resolve({
        send: function (method, params) {
          var id = nextId++;
          return new Promise(function (res, rej) {
            pending[id] = { res: res, rej: rej };
            ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
          });
        },
        close: function () {
          ws.close();
        },
      });
    });
    ws.addEventListener("error", function () {
      reject(
        new Error(
          "no Chrome is listening on 127.0.0.1:" +
            port +
            ". Start one with --remote-debugging-port=" +
            port +
            " (see the comment at the top of this file)."
        )
      );
    });
    ws.addEventListener("message", function (e) {
      var msg = JSON.parse(e.data);
      if (msg.id && pending[msg.id]) {
        var p = pending[msg.id];
        delete pending[msg.id];
        if (msg.error) p.rej(new Error(msg.method + ": " + JSON.stringify(msg.error)));
        else p.res(msg.result);
      }
    });
  });
}

async function evaluate(cdp, expression) {
  var r = await cdp.send("Runtime.evaluate", { expression: expression, returnByValue: true });
  if (r.exceptionDetails) throw new Error("page threw: " + r.exceptionDetails.text);
  return r.result && r.result.value;
}

async function waitReady(cdp) {
  for (var i = 0; i < 60; i++) {
    if ((await evaluate(cdp, "document.readyState")) === "complete") return;
    await sleep(100);
  }
  throw new Error("the page never finished loading");
}

async function shot(cdp, name) {
  var file = path.join(outDir, name);
  var r = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(file, Buffer.from(r.data, "base64"));
  console.log("wrote " + path.relative(process.cwd(), file) + " (" + Math.round(fs.statSync(file).size / 1024) + " KB)");
}

async function go(cdp, url) {
  await cdp.send("Page.navigate", { url: url });
  await waitReady(cdp);
  // Fonts, layout and the app's own first paint.
  await sleep(700);
  await evaluate(cdp, "window.scrollTo(0, 0)");
}

async function click(cdp, selector) {
  var result = await evaluate(
    cdp,
    "(function(){var el=document.querySelector(" +
      JSON.stringify(selector) +
      ");if(!el){return 'missing';}el.click();return 'clicked';})()"
  );
  if (result !== "clicked") {
    throw new Error("could not click " + selector + " (" + result + "): the app is not in the expected state");
  }
  await sleep(900);
}

(async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  var targets = await (await fetch("http://127.0.0.1:" + port + "/json/list")).json();
  var page = targets.filter(function (t) {
    return t.type === "page";
  })[0];
  if (!page) throw new Error("Chrome has no page target open");

  var cdp = await connect(page.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", VIEWPORT);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });

  // 1. Home, the first thing anyone sees.
  await go(cdp, base + "/");
  await shot(cdp, "01-home.png");

  // 2. Options, reached through the sample journey so the screen has content.
  await click(cdp, "#btn-demo");
  await shot(cdp, "02-options.png");

  // 3. The plan summary, rebuilt from the saved draft by the deep link.
  await go(cdp, base + "/#summary");
  await shot(cdp, "03-summary.png");

  // 4. The office visit card, the artefact that leaves the phone.
  await click(cdp, "#btn-visit-card");
  await shot(cdp, "04-visit-card.png");

  cdp.close();
  console.log("Captured 4 screenshots into " + path.relative(process.cwd(), outDir));
})().catch(function (err) {
  console.error("Screenshot capture failed: " + err.message);
  process.exit(1);
});
