#!/usr/bin/env node
/**
 * The 360px audit, run by `npm run phone-check`.
 *
 * The field-test phone is a 360 CSS-pixel Android, so this drives Chrome at
 * exactly that width and asserts two things a stylesheet review cannot:
 *
 *   1. no screen is wider than the window (the classic phone bug: one long
 *      word, one table, one flex row that refuses to wrap);
 *   2. every real control is at least 48 by 48 CSS pixels, and every form
 *      field renders at 16px or more so a phone does not zoom on focus.
 *
 * It walks home, the form, the sample options and the visit card, because a
 * layout that fits on the first screen can still break on the fourth.
 *
 * Only Node built-ins are used, but Chrome must already be listening:
 *
 *   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *     --headless=new --disable-gpu --remote-debugging-port=9333 \
 *     --user-data-dir=/tmp/mlmp-chrome about:blank
 *
 * Then, with `npm start` serving the folder:
 *
 *   npm run phone-check
 *
 * Requires Node 22 or newer for the global WebSocket and fetch.
 */
"use strict";

var port = process.argv[2] || "9333";
var base = process.argv[3] || "http://127.0.0.1:8080";
var VIEWPORT = { width: 360, height: 740, deviceScaleFactor: 2, mobile: true };

var failures = [];

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

/**
 * The audit itself, evaluated inside the page. It reports instead of deciding,
 * so the Node side can name the screen and fail the run.
 */
var AUDIT = `(function () {
  var problems = [];
  var checked = 0;
  var vw = window.innerWidth;

  if (document.documentElement.scrollWidth > vw + 1) {
    problems.push(
      "the page is " + document.documentElement.scrollWidth + "px wide inside " + vw + "px"
    );
  }

  function describe(el) {
    var text = (el.getAttribute("aria-label") || el.textContent || el.value || "")
      .replace(/\\s+/g, " ")
      .trim()
      .slice(0, 40);
    var cls = typeof el.className === "string" && el.className ? "." + el.className.split(" ")[0] : "";
    return el.tagName.toLowerCase() + (el.id ? "#" + el.id : cls) + (text ? ' "' + text + '"' : "");
  }

  var controls = document.querySelectorAll(
    "button, select, .btn, a.btn, .radio-card, .checklist label, label.checkbox"
  );
  Array.prototype.forEach.call(controls, function (el) {
    var style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || el.hidden) return;
    var rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    checked++;
    if (rect.width < 47.5 || rect.height < 47.5) {
      problems.push(
        describe(el) + " is " + Math.round(rect.width) + "x" + Math.round(rect.height)
      );
    }
  });

  var fields = document.querySelectorAll("input:not([type=radio]):not([type=checkbox]), select, textarea");
  Array.prototype.forEach.call(fields, function (el) {
    if (el.hidden || el.offsetParent === null) return;
    var size = parseFloat(window.getComputedStyle(el).fontSize);
    if (size && size < 16) {
      problems.push(describe(el) + " renders at " + size + "px, so a phone may zoom on focus");
    }
  });

  var bodySize = parseFloat(window.getComputedStyle(document.body).fontSize);
  if (bodySize && bodySize < 16) {
    problems.push("body text is " + bodySize + "px");
  }

  return { problems: problems.slice(0, 12), total: problems.length, checked: checked, width: vw };
})()`;

async function go(cdp, url) {
  await cdp.send("Page.navigate", { url: url });
  for (var i = 0; i < 60; i++) {
    if ((await evaluate(cdp, "document.readyState")) === "complete") break;
    await sleep(100);
  }
  await sleep(600);
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
  await sleep(800);
}

async function audit(cdp, screen) {
  var r = await evaluate(cdp, AUDIT);
  if (r.total) {
    failures.push({ screen: screen, problems: r.problems, total: r.total });
    console.log("FAIL " + screen + ": " + r.total + " problem(s)");
    r.problems.forEach(function (p) {
      console.log("  - " + p);
    });
  } else {
    console.log("ok   " + screen + ": " + r.checked + " controls fit 360px");
  }
}

(async function main() {
  var targets = await (await fetch("http://127.0.0.1:" + port + "/json/list")).json();
  var page = targets.filter(function (t) {
    return t.type === "page";
  })[0];
  if (!page) throw new Error("Chrome has no page target open");

  var cdp = await connect(page.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", VIEWPORT);

  await go(cdp, base + "/");
  await audit(cdp, "home");

  await click(cdp, "#btn-start");
  await audit(cdp, "form");

  await go(cdp, base + "/");
  await click(cdp, "#btn-demo");
  await audit(cdp, "options");

  await click(cdp, "#btn-visit-card");
  await audit(cdp, "visit card");

  cdp.close();

  if (failures.length) {
    var count = failures.reduce(function (n, f) {
      return n + f.total;
    }, 0);
    console.error("\n" + count + " phone problem(s) on " + failures.length + " screen(s).");
    process.exit(1);
  }
  console.log("\n360px audit passed: home, form, options and visit card.");
})().catch(function (err) {
  console.error("Phone audit failed: " + err.message);
  process.exit(1);
});
