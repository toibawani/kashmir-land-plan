#!/usr/bin/env node
/**
 * Prove the on-demand files behave in a real browser.
 *
 * `npm test` proves the logic with a fake DOM. This proves the parts only a
 * browser can: which files a first visit actually fetches, that choosing a
 * language fetches its file and turns the page around, that a file which cannot
 * be fetched shows the message and the Retry button instead of an empty panel,
 * and that every one of those features still opens with the network off.
 *
 * It needs Chrome and the app served (`npm start`), like the other browser
 * tools, so it is not part of `npm test`:
 *
 *   node tools/lazy-check.js http://127.0.0.1:8080 9333
 *
 * Exit code 0 means the split is safe. Non-zero names the check that failed.
 */
"use strict";

var H = require("./lib/harness");

var BASE = (process.argv[2] || "http://127.0.0.1:8080").replace(/\/$/, "");
var PORT = process.argv[3] || "9333";

var failures = [];
var checks = 0;

function check(name, condition, detail) {
  checks += 1;
  if (condition) {
    console.log("  ok: " + name);
  } else {
    failures.push(name + (detail ? " (" + detail + ")" : ""));
    console.error("  FAIL: " + name);
  }
}

/** Every file the browser has actually fetched for this page. */
function fetched(cdp) {
  return H.evaluate(
    cdp,
    "(function(){try{return performance.getEntriesByType('resource').map(function(e){return e.name;});}catch(err){return [];}})()"
  );
}

function fetchedName(list, file) {
  return list.some(function (url) {
    return url.indexOf("/" + file) !== -1;
  });
}

async function chooseLanguage(cdp, code) {
  await H.evaluate(
    cdp,
    "(function(){var s=document.getElementById('lang-select');s.value=" +
      JSON.stringify(code) +
      ";s.dispatchEvent(new Event('change',{bubbles:true}));return true;})()"
  );
}

async function main() {
  var cdp = await H.connect(PORT);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 360,
    height: 800,
    deviceScaleFactor: 2,
    mobile: true,
  });

  /* -------------------------------------------------- 1. What boot fetches */

  console.log("\nBoot path");
  await H.navigate(cdp, BASE + "/");
  await H.sleep(1200);

  var bootFetched = await fetched(cdp);
  var onDemand = [
    "messages.hi.js",
    "messages.ur.js",
    "photos.js",
    "observations.js",
    "speech.js",
    "qr.js",
    "visitfit.js",
    "office.js",
    "share.js",
    "visitcard.js",
    "feedback.js",
    "data.js",
  ];

  onDemand.forEach(function (file) {
    check("a first visit does not fetch " + file, !fetchedName(bootFetched, file));
  });

  check("the loader is on the page", (await H.evaluate(cdp, "typeof window.MLMP_LOAD === 'object'")) === true);
  check("the English dictionary is on the page", (await H.evaluate(cdp, "Object.keys(MLMP_MESSAGES.dict('en')).length > 200")) === true);
  check(
    "Hindi is empty before it is chosen",
    (await H.evaluate(cdp, "Object.keys(MLMP_MESSAGES.dict('hi')).length")) === 0
  );
  check(
    "the file list and the boot markup do not overlap",
    (await H.evaluate(
      cdp,
      "(function(){var l=MLMP_LOAD;return l.names().every(function(n){return !document.querySelector('script[src=\"'+l.fileOf(n)+'\"]');});})()"
    )) === true
  );

  /* --------------------------------------------------- 2. Urdu and Hindi */

  console.log("\nLanguages");
  await chooseLanguage(cdp, "ur");
  var urduReady = await H.waitFor(
    cdp,
    "(function(){var M=MLMP_MESSAGES;return document.documentElement.getAttribute('dir')==='rtl' && Object.keys(M.dict('ur')).length>200;})()",
    8000
  );
  check("choosing Urdu fetches and registers its file", urduReady);
  check(
    "the document turns right to left",
    (await H.evaluate(cdp, "document.documentElement.getAttribute('dir')")) === "rtl"
  );
  check(
    "a translated string is on screen",
    (await H.evaluate(cdp, "document.querySelector('[data-i18n=\"nav.home\"]').textContent")) ===
      (await H.evaluate(cdp, "MLMP_MESSAGES.dict('ur')['nav.home']"))
  );
  check("Urdu shows the unchecked-translation notice", (await H.evaluate(cdp, "!document.getElementById('translation-notice').hidden")) === true);
  check("no retry message was needed", (await H.evaluate(cdp, "!document.querySelector('.lazy-fail')")) === true);

  await chooseLanguage(cdp, "hi");
  var hindiReady = await H.waitFor(
    cdp,
    "(function(){var M=MLMP_MESSAGES;return document.documentElement.getAttribute('dir')!=='rtl' && Object.keys(M.dict('hi')).length>200;})()",
    8000
  );
  check("choosing Hindi fetches and registers its file", hindiReady);
  check(
    "the document goes back to left to right",
    (await H.evaluate(cdp, "document.documentElement.getAttribute('dir')")) === null
  );

  await chooseLanguage(cdp, "en");
  await H.sleep(300);

  /* ------------------------------------- 3. A file that cannot be fetched */

  console.log("\nFailed fetch and Retry");
  await H.navigate(cdp, BASE + "/");
  await H.sleep(1200);
  // Empty the cache, so the blocked file really has nowhere else to come from.
  await H.evaluate(cdp, "caches.keys().then(function(n){return Promise.all(n.map(function(k){return caches.delete(k);}));})");
  await cdp.send("Network.setBlockedURLs", { urls: ["*js/qr.js*"] });

  await H.click(cdp, "#btn-demo");
  await H.click(cdp, "#btn-results-visit");
  var sawFailure = await H.waitFor(cdp, "!!document.querySelector('.lazy-fail')", 10000);
  check("a blocked file shows a message instead of an empty card", sawFailure);
  check(
    "the message is the translated sentence",
    (await H.evaluate(
      cdp,
      "(function(){var b=document.querySelector('.lazy-fail-text');return b?b.textContent:'';})()"
    )) === (await H.evaluate(cdp, "MLMP_MESSAGES.t('lazy.failed')"))
  );
  check(
    "there is a Retry button",
    (await H.evaluate(
      cdp,
      "(function(){var b=document.querySelector('.lazy-fail-retry');return !!b && b.textContent.length>0;})()"
    )) === true
  );
  check(
    "the visit screen is still on screen, not blank",
    (await H.evaluate(cdp, "!document.getElementById('screen-visit').hidden")) === true
  );

  await cdp.send("Network.setBlockedURLs", { urls: [] });
  await H.click(cdp, ".lazy-fail-retry");
  var recovered = await H.waitFor(
    cdp,
    "(function(){return !document.querySelector('.lazy-fail') && document.getElementById('visit-card').textContent.trim().length>40;})()",
    12000
  );
  check("Retry fetches the file and builds the card", recovered);

  /* ---------------------------------------------- 4. Every feature offline */

  console.log("\nOffline, after one online visit");
  await H.navigate(cdp, BASE + "/");
  var controlled = await H.waitFor(
    cdp,
    "!!(navigator.serviceWorker && navigator.serviceWorker.controller)",
    15000
  );
  check("the worker controls the page", controlled);

  await cdp.send("Network.emulateNetworkConditions", {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
  });

  await H.navigate(cdp, BASE + "/");
  await H.sleep(600);
  check(
    "the app itself opens offline",
    (await H.evaluate(cdp, "document.querySelectorAll('[data-i18n]').length > 20")) === true
  );

  await H.click(cdp, "#btn-demo");
  await H.click(cdp, "#btn-results-visit");
  var offlineCard = await H.waitFor(
    cdp,
    "(function(){return document.getElementById('visit-card').textContent.trim().length>40;})()",
    12000
  );
  check("the visit card is built offline", offlineCard);
  check(
    "no retry message appeared offline",
    (await H.evaluate(cdp, "!document.querySelector('.lazy-fail')")) === true
  );
  check(
    "the photo slots rendered, so the photo store loaded offline",
    (await H.evaluate(cdp, "document.querySelectorAll('#photo-slots li').length > 0")) === true
  );
  check(
    "the feedback questions rendered offline",
    (await H.evaluate(cdp, "document.getElementById('feedback-host').textContent.trim().length>10")) === true
  );
  check(
    "the QR encoder loaded offline",
    (await H.evaluate(cdp, "typeof window.MLMP_QR === 'object'")) === true
  );
  check(
    "the speech engine loaded offline",
    (await H.evaluate(cdp, "typeof window.MLMP_SPEECH === 'object'")) === true
  );
  check(
    "the office pack loaded offline",
    (await H.evaluate(cdp, "typeof window.MLMP_OFFICE === 'object'")) === true
  );

  await H.click(cdp, "#btn-visit-plans");
  await H.click(cdp, "#btn-plans-data");
  var offlineData = await H.waitFor(
    cdp,
    "(function(){return document.getElementById('data-facts').children.length>0;})()",
    10000
  );
  check("the data screen opens offline", offlineData);
  check(
    "the backup module loaded offline",
    (await H.evaluate(cdp, "typeof window.MLMP_DATA === 'object'")) === true
  );
  check(
    "the data screen shows no retry message",
    (await H.evaluate(cdp, "!document.querySelector('#data-load-error .lazy-fail')")) === true
  );

  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  cdp.close();
}

main()
  .catch(function (err) {
    failures.push("the check could not run: " + err.message);
  })
  .then(function () {
    console.log("");
    if (failures.length) {
      console.error(failures.length + " of " + checks + " checks failed:");
      failures.forEach(function (f) {
        console.error("  - " + f);
      });
      process.exit(1);
    }
    console.log(checks + " lazy-loading browser checks passed.");
  });
