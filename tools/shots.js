#!/usr/bin/env node
/**
 * 360px screenshots in English, Hindi and Urdu, run by `npm run shots`.
 *
 * The phone audit proves the layout fits and the tap targets are big enough.
 * This proves something a stylesheet cannot: what the screens actually look
 * like, in three scripts, one of them right to left, with photos in place. The
 * images are uploaded as a CI artifact so a reviewer can look at all of them
 * without a phone.
 *
 * The photos are drawn in the page with a canvas and stored through the app's
 * own IndexedDB, not read from disk: a real plot photo must never enter this
 * repository.
 *
 * Like the other browser tools it needs the folder served and Chrome listening:
 *
 *   python3 -m http.server 8080 --bind 127.0.0.1 &
 *   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *     --headless=new --disable-gpu --remote-debugging-port=9333 \
 *     --user-data-dir=/tmp/mlmp-shots about:blank &
 *   node tools/shots.js http://127.0.0.1:8080 /tmp/shots 9333
 *
 * It fails the run on a horizontal overflow, on an Urdu screen that is not
 * right to left, or on a screenshot that could not be taken. Requires Node 22
 * for the global WebSocket and fetch.
 */
"use strict";

var fs = require("fs");
var path = require("path");

var base = process.argv[2] || "http://127.0.0.1:8080";
var outDir = process.argv[3] || "/tmp/mlmp-shots";
var port = process.argv[4] || "9333";
var LANGS = (process.argv[5] || "en,hi,ur").split(",");
var VIEWPORT = { width: 360, height: 740, deviceScaleFactor: 2, mobile: true };
var MAX_HEIGHT = 6000;

var problems = [];

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

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
      reject(new Error("no Chrome is listening on 127.0.0.1:" + port));
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
  var r = await cdp.send("Runtime.evaluate", {
    expression: expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) {
    throw new Error("page threw: " + (r.exceptionDetails.text || "") + " " + JSON.stringify(r.result && r.result.value));
  }
  return r.result && r.result.value;
}

async function waitFor(cdp, expression, timeoutMs) {
  var deadline = Date.now() + (timeoutMs || 10000);
  while (Date.now() < deadline) {
    if (await evaluate(cdp, expression)) return true;
    await sleep(120);
  }
  return false;
}

async function navigate(cdp, url) {
  await cdp.send("Page.navigate", { url: url });
  for (var i = 0; i < 100; i++) {
    if ((await evaluate(cdp, "document.readyState")) === "complete") break;
    await sleep(100);
  }
  // "complete" can arrive while a deferred script is still parsing; clicking
  // before the app has bound its handlers produces no error, just nothing.
  await waitFor(
    cdp,
    "typeof window.MLMP_MESSAGES === 'object' || !document.querySelector('script[src=\"js/app.js\"]')",
    15000
  );
  await sleep(400);
  await evaluate(cdp, "window.scrollTo(0, 0)");
}

async function click(cdp, selector) {
  var result = await evaluate(
    cdp,
    "(function(){var el=document.querySelector(" + JSON.stringify(selector) + ");" +
      "if(!el){return 'missing';}el.scrollIntoView({block:'center'});el.click();return 'clicked';})()"
  );
  if (result !== "clicked") throw new Error("could not click " + selector + " (" + result + ")");
  await sleep(900);
}

/**
 * Everything that proves a screen is not spilling sideways. Reported from
 * inside the page so the failure names the element.
 */
var OVERFLOW = `(function () {
  var vw = window.innerWidth;
  var out = [];
  if (document.documentElement.scrollWidth > vw + 1) {
    out.push("page is " + document.documentElement.scrollWidth + "px wide in " + vw + "px");
  }
  var all = document.querySelectorAll("body *");
  Array.prototype.forEach.call(all, function (el) {
    var style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || el.hidden) return;
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    if (r.right > vw + 1 || r.left < -1) {
      var name = el.tagName.toLowerCase() + (el.id ? "#" + el.id : "." + String(el.className).split(" ")[0]);
      out.push(name + " spans " + Math.round(r.left) + " to " + Math.round(r.right) + "px");
    }
  });
  return { problems: out.slice(0, 8), total: out.length };
})()`;

async function audit(cdp, label) {
  var r = await evaluate(cdp, OVERFLOW);
  if (r.total) {
    problems.push({ label: label, list: r.problems });
    console.log("FAIL overflow " + label + ": " + r.total);
    r.problems.forEach(function (p) {
      console.log("  - " + p);
    });
  } else {
    console.log("ok   fits 360px: " + label);
  }
}

/** Capture either the whole page or one element, in CSS pixels. */
async function shot(cdp, name, selector, maxHeight) {
  var clip = null;
  var cap = maxHeight || MAX_HEIGHT;
  if (selector) {
    var box = await evaluate(
      cdp,
      "(function(){var el=document.querySelector(" + JSON.stringify(selector) + ");" +
        "if(!el){return null;}var r=el.getBoundingClientRect();" +
        "return {x:r.left+window.scrollX,y:r.top+window.scrollY,width:r.width,height:r.height};})()"
    );
    if (!box) throw new Error("nothing matches " + selector + ", so " + name + " cannot be captured");
    clip = {
      x: Math.max(0, Math.floor(box.x) - 4),
      y: Math.max(0, Math.floor(box.y) - 4),
      width: Math.ceil(box.width) + 8,
      height: Math.min(Math.ceil(box.height) + 8, cap),
      scale: 1,
    };
  } else {
    var size = await evaluate(
      cdp,
      "({w: document.documentElement.scrollWidth, h: Math.min(document.documentElement.scrollHeight, " + cap + ")})"
    );
    clip = { x: 0, y: 0, width: size.w, height: size.h, scale: 1 };
  }
  var r = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: clip,
  });
  var file = path.join(outDir, name);
  fs.writeFileSync(file, Buffer.from(r.data, "base64"));
  var kb = Math.round(fs.statSync(file).size / 1024);
  console.log("wrote " + name + " (" + clip.width + "x" + clip.height + ", " + kb + " KB)");
}

/**
 * The app's own photo store, filled with pictures drawn here. A canvas,
 * textured and mid-grey, is what a phone camera produces for this purpose
 * without being a photograph of anyone's land.
 */
var SEED = `(function () {
  function drawn(slot, seed) {
    return new Promise(function (resolve) {
      var canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 675;
      var c = canvas.getContext("2d");
      var sky = c.createLinearGradient(0, 0, 0, canvas.height);
      sky.addColorStop(0, "#9fc2d8");
      sky.addColorStop(1, "#dfe6cf");
      c.fillStyle = sky;
      c.fillRect(0, 0, canvas.width, canvas.height);
      // Ground, with a few marks so the picture is not a flat block.
      c.fillStyle = slot === "water" ? "#5f7f86" : "#8a7a52";
      c.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.45);
      var n = seed;
      function rand() {
        n = (n * 1103515245 + 12345) % 2147483648;
        return n / 2147483648;
      }
      for (var i = 0; i < 90; i++) {
        var x = rand() * canvas.width;
        var y = canvas.height * 0.55 + rand() * canvas.height * 0.45;
        c.fillStyle = rand() > 0.5 ? "rgba(60,70,50,0.55)" : "rgba(190,180,140,0.5)";
        c.fillRect(x, y, 6 + rand() * 26, 3 + rand() * 8);
      }
      c.fillStyle = "rgba(240,240,230,0.9)";
      c.fillRect(canvas.width * 0.12, canvas.height * 0.62, canvas.width * 0.2, canvas.height * 0.1);
      canvas.toBlob(function (blob) {
        resolve({ blob: blob, width: canvas.width, height: canvas.height });
      }, "image/jpeg", 0.8);
    });
  }

  function open() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open("mlmp_photos_v1", 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains("photos")) {
          var store = db.createObjectStore("photos", { keyPath: "id" });
          store.createIndex("planId", "planId", { unique: false });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  // Photos are attached to every plan on this device rather than to the one
  // this tool guesses is current: the app's own idea of the open plan is not
  // exposed, and a photo under the wrong plan is an empty timeline.
  window.__mlmpSeedPhotos = function (slots, planIds, dates) {
    var made = [];
    planIds.forEach(function (planId) {
      slots.forEach(function (slot, i) {
        made.push(
          drawn(slot, 7 + i * 31).then(function (img) {
            return {
              id: "shot-" + planId + "-" + slot + "-" + i,
              planId: planId,
              slot: slot,
              createdAt: dates[i] || new Date().toISOString(),
              blob: img.blob,
              width: img.width,
              height: img.height,
            };
          })
        );
      });
    });
    return Promise.all(made).then(function (rows) {
      return open().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction("photos", "readwrite");
          var store = tx.objectStore("photos");
          store.clear();
          rows.forEach(function (row) { store.put(row); });
          tx.oncomplete = function () { resolve(rows.length); };
          tx.onerror = function () { reject(tx.error); };
        });
      });
    });
  };
  return true;
})()`;

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

  for (var i = 0; i < LANGS.length; i++) {
    var lang = LANGS[i];
    // The language is set before the app boots, so every screen is painted in
    // it rather than repainted after the first screenshot.
    var injected = await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source:
        "try{localStorage.setItem('mlmp_lang_v1','" +
        lang +
        "');}catch(e){}" +
        ";window.__mlmpMarker='alive';",
    });

    await navigate(cdp, base + "/");
    var dir = await evaluate(cdp, "document.documentElement.getAttribute('dir')");
    if (lang === "ur" && dir !== "rtl") problems.push({ label: lang + " direction", list: ["page is not rtl"] });
    if (lang !== "ur" && dir === "rtl") problems.push({ label: lang + " direction", list: ["page is rtl unexpectedly"] });
    await audit(cdp, lang + " home");
    await shot(cdp, lang + "-home.png");

    await click(cdp, "#btn-start");
    await audit(cdp, lang + " form");
    await shot(cdp, lang + "-form.png", "#screen-form");

    await navigate(cdp, base + "/");
    await click(cdp, "#btn-demo");
    await audit(cdp, lang + " results");
    // The results screen is several screenshot-heights of options. One
    // screenful is what a phone shows, and the rest is text that the 360px
    // audit already measured for overflow.
    await shot(cdp, lang + "-results.png", "#screen-results", 1600);

    // Three slots filled, which is what the printed card carries. The plan is
    // opened from My plans rather than assumed: that is the one path that
    // tells us which plan the card will read photos for.
    await click(cdp, "#btn-save-named");
    await click(cdp, "#btn-results-plans");
    var planId = await evaluate(
      cdp,
      "(function(){var b=document.querySelector('[data-plan-open]');return b?b.getAttribute('data-plan-open'):'';})()"
    );
    if (!planId) throw new Error("the sample plan was not saved, so photos cannot be attached");
    await click(cdp, "[data-plan-open]");
    await evaluate(cdp, SEED);
    var three = ["wide", "ground", "water"];
    var dates3 = ["2026-03-02T08:00:00.000Z", "2026-03-02T08:05:00.000Z", "2026-06-14T09:00:00.000Z"];
    var seeded = await evaluate(
      cdp,
      "window.__mlmpSeedPhotos(" + JSON.stringify(three) + "," + JSON.stringify([planId]) + "," + JSON.stringify(dates3) + ")"
    );
    if (seeded !== 3) throw new Error("stored " + seeded + " photos, expected 3");
    await click(cdp, "#btn-results-visit");
    await audit(cdp, lang + " visit card");
    await shot(cdp, lang + "-visit.png", "#screen-visit", 1600);
    await shot(cdp, lang + "-photos.png", "#visit-photos", 4000);

    // The timeline itself, with exactly two entries, then the comparison.
    var two = ["wide", "wide"];
    var dates2 = ["2026-03-02T08:00:00.000Z", "2026-06-14T09:00:00.000Z"];
    var second = await evaluate(
      cdp,
      "window.__mlmpSeedPhotos(" + JSON.stringify(two) + "," + JSON.stringify([planId]) + "," + JSON.stringify(dates2) + ")"
    );
    if (second !== 2) throw new Error("stored " + second + " photos for the timeline, expected 2");
    await click(cdp, "#btn-results-visit");
    await waitFor(
      cdp,
      "(function(){var t=document.querySelector('#photo-timeline');return !!t && !t.hidden && document.querySelectorAll('.photo-timeline-item').length === 2;})()",
      5000
    );
    var timeline = await evaluate(
      cdp,
      "(function(){var t=document.querySelector('#photo-timeline');return t && !t.hidden && document.querySelectorAll('.photo-timeline-item').length;})()"
    );
    if (timeline !== 2) problems.push({ label: lang + " timeline", list: ["expected 2 entries, saw " + timeline] });
    await shot(cdp, lang + "-timeline.png", "#photo-timeline");

    // Two separate taps, in the order a person would make them: the first
    // re-renders the list, so a second click on the old node would do nothing.
    await click(cdp, "[data-photo-compare]");
    await click(cdp, '[data-photo-compare][aria-pressed="false"]');
    var shown = await evaluate(
      cdp,
      "(function(){var p=document.querySelector('#photo-compare');return p && !p.hidden;})()"
    );
    if (!shown) problems.push({ label: lang + " compare", list: ["the comparison panel did not open"] });
    await audit(cdp, lang + " compare");
    await shot(cdp, lang + "-compare.png", "#photo-compare");

    await navigate(cdp, base + "/privacy.html");
    await audit(cdp, lang + " privacy");
    await shot(cdp, lang + "-privacy.png");

    // Leave the browser as it was found, so a later tool does not inherit the
    // last language of this run.
    if (injected && injected.identifier) {
      await cdp
        .send("Page.removeScriptToEvaluateOnNewDocument", { identifier: injected.identifier })
        .catch(function () {});
    }
  }

  cdp.close();

  if (problems.length) {
    console.error("\nScreenshot run found " + problems.length + " problem(s):");
    problems.forEach(function (p) {
      console.error("  - " + p.label + ": " + p.list.join("; "));
    });
    process.exit(1);
  }
  console.log("\nCaptured " + LANGS.length * 8 + " screenshots into " + outDir + ", no overflow and Urdu is rtl.");
})().catch(function (err) {
  console.error("Screenshot run failed: " + err.message);
  process.exit(1);
});
