#!/usr/bin/env node
/**
 * Prove the app opens with the network off.
 *
 * A cache audit proves the bytes are stored. It does not prove that the worker
 * returns them when the network is gone, and those are different failures. This
 * script drives a real Chrome over the DevTools protocol: it loads the app,
 * waits for the worker to control the page, switches the browser itself offline,
 * reloads, and checks what a reader would see.
 *
 * It needs Chrome installed and the app already served (`npm start`). It is not
 * part of `npm test`, because it needs both. Run it with `npm run offline`.
 *
 * Exit code 0 means the shell rendered offline. Non-zero names the first check
 * that failed, so the failure is actionable rather than "it did not work".
 */
"use strict";

var spawn = require("child_process").spawn;
var http = require("http");

var PORT = 9333;
var APP = "http://127.0.0.1:8080/";
var CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function getJson(path) {
  return new Promise(function (resolve, reject) {
    http
      .get({ host: "127.0.0.1", port: PORT, path: path }, function (res) {
        var body = "";
        res.on("data", function (chunk) {
          body += chunk;
        });
        res.on("end", function () {
          try {
            resolve(JSON.parse(body));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function connect(url) {
  var ws = new WebSocket(url);
  var id = 0;
  var pending = new Map();
  var listeners = [];

  ws.addEventListener("message", function (event) {
    var msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      var entry = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(msg.error.message));
      else entry.resolve(msg.result);
      return;
    }
    if (msg.method) listeners.forEach(function (fn) { fn(msg); });
  });

  function send(method, params, sessionId) {
    return new Promise(function (resolve, reject) {
      var messageId = ++id;
      pending.set(messageId, { resolve: resolve, reject: reject });
      ws.send(JSON.stringify({ id: messageId, method: method, params: params || {}, sessionId: sessionId }));
    });
  }

  function once(method, sessionId, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error("timed out waiting for " + method));
      }, timeoutMs || 15000);
      var fn = function (msg) {
        if (msg.method === method && (!sessionId || msg.sessionId === sessionId)) {
          clearTimeout(timer);
          listeners = listeners.filter(function (other) { return other !== fn; });
          resolve(msg.params);
        }
      };
      listeners.push(fn);
    });
  }

  return new Promise(function (resolve, reject) {
    ws.addEventListener("open", function () {
      resolve({ send: send, once: once, close: function () { ws.close(); } });
    });
    ws.addEventListener("error", reject);
  });
}

(async function main() {
  var failures = [];
  var chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-port=" + PORT,
      "--user-data-dir=/tmp/mlmp-offline-profile",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  var version = null;
  for (var attempt = 0; attempt < 60 && !version; attempt++) {
    try {
      version = await getJson("/json/version");
    } catch (_) {
      await wait(200);
    }
  }
  if (!version) {
    console.error("Chrome did not expose a DevTools endpoint on port " + PORT);
    process.exit(2);
  }

  var client = await connect(version.webSocketDebuggerUrl);
  var target = await client.send("Target.createTarget", { url: "about:blank" });
  var attached = await client.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  var session = attached.sessionId;

  await client.send("Page.enable", {}, session);
  await client.send("Runtime.enable", {}, session);
  await client.send("Network.enable", {}, session);

  async function evaluate(expression, awaitPromise) {
    var result = await client.send(
      "Runtime.evaluate",
      { expression: expression, returnByValue: true, awaitPromise: !!awaitPromise },
      session
    );
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }

  async function waitForReady() {
    for (var i = 0; i < 60; i++) {
      var state = await evaluate("document.readyState");
      if (state === "complete") return;
      await wait(200);
    }
    throw new Error("the page never reached readyState complete");
  }

  // Load online once so the worker installs and activates.
  await client.send("Page.navigate", { url: APP }, session);
  await waitForReady();
  await evaluate("navigator.serviceWorker.ready.then(function (r) { return !!r.active; })", true);
  var controlled = await evaluate("!!navigator.serviceWorker.controller");
  if (!controlled) {
    await client.send("Page.reload", {}, session);
    await waitForReady();
    await wait(500);
    controlled = await evaluate("!!navigator.serviceWorker.controller");
  }
  if (!controlled) failures.push("the service worker never took control of the page");

  // LCP is only observable through a buffered observer, so it is captured here,
  // online, before the network is switched off.
  var lcp = await evaluate(
    "new Promise(function (resolve) {" +
      "var seen = [];" +
      "try { new PerformanceObserver(function (list) { list.getEntries().forEach(function (e) { seen.push(e.startTime); }); })" +
      ".observe({ type: 'largest-contentful-paint', buffered: true }); } catch (_) {}" +
      "setTimeout(function () { resolve(seen.length ? Math.round(seen[seen.length - 1]) : null); }, 1200);" +
      "})",
    true
  );

  await client.send(
    "Network.emulateNetworkConditions",
    { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 },
    session
  );
  await client.send("Page.reload", { ignoreCache: false }, session);
  await waitForReady();
  await wait(800);

  var probe = await evaluate(
    "Promise.all([" +
      "caches.keys()," +
      "caches.match('./js/app.js').then(function (r) { return !!r; })," +
      "caches.match('./index.html').then(function (r) { return !!r; })" +
      "]).then(function (values) {" +
      "return {" +
      "online: navigator.onLine," +
      "controlled: !!navigator.serviceWorker.controller," +
      "caches: values[0]," +
      "appCached: values[1]," +
      "pageCached: values[2]," +
      "title: document.title," +
      "bannerVisible: document.getElementById('offline-banner') ? !document.getElementById('offline-banner').hidden : null," +
      "steps: document.querySelectorAll('[data-step]').length," +
      "headings: document.querySelectorAll('h1,h2').length," +
      "aboutVillage: (document.getElementById('about-village') || {}).textContent || ''," +
      "cssApplied: document.querySelector('.site-header') ? getComputedStyle(document.querySelector('.site-header')).position : 'missing'," +
      "landSourceCount: document.querySelectorAll('#land-preview a[href^=\"https\"]').length" +
      "};" +
      "})",
    true
  );

  if (probe.online !== false) failures.push("the browser still reports itself online; the emulation did not apply");
  if (!probe.controlled) failures.push("the reloaded page is not controlled by the service worker");
  if (!probe.appCached) failures.push("js/app.js is not in the cache after the online visit");
  if (!probe.pageCached) failures.push("index.html is not in the cache after the online visit");
  if (!probe.caches.length) failures.push("there is no cache at all");
  if (!/My Land, My Plan/.test(probe.title || "")) failures.push("the offline page has no title, so the shell did not render");
  if (probe.steps !== 5) failures.push("the offline page has " + probe.steps + " step controls, expected 5");
  if (probe.headings < 5) failures.push("the offline page rendered " + probe.headings + " headings, so screens did not render");
  if (!/6,832/.test(probe.aboutVillage)) failures.push("the About screen did not render its village counts offline");
  if (probe.cssApplied === "missing") failures.push("the stylesheet did not load offline");
  if (!probe.bannerVisible) failures.push("the offline banner did not appear");

  console.log("Disconnected reload, " + new Date().toISOString());
  console.log("  caches: " + probe.caches.join(", "));
  console.log("  service worker controlling: " + probe.controlled);
  console.log("  steps rendered: " + probe.steps + ", headings: " + probe.headings);
  console.log("  About screen: " + probe.aboutVillage.trim().slice(0, 60));
  console.log("  land source links in the shell: " + probe.landSourceCount);
  console.log("  largest contentful paint (online, desktop, unthrottled): " + (lcp == null ? "not observed" : lcp + " ms"));

  client.close();
  chrome.kill("SIGTERM");

  if (failures.length) {
    console.error("\nOffline check failed:");
    failures.forEach(function (f) { console.error("  - " + f); });
    process.exit(1);
  }
  console.log("\nOffline check passed: the installed shell reloads and renders with the network off.");
})().catch(function (err) {
  console.error("Offline check could not run: " + err.message);
  process.exit(2);
});
