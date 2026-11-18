/**
 * Shared browser harness for the checks that need a real page.
 *
 * `phone-check.js` and `shots.js` each carry their own copy of a small CDP
 * client because they are older than this file; new checks use this one so a
 * fidelity fix (a longer wait for deferred scripts, say) lands in one place.
 *
 * Only Node built-ins. Chrome must be listening and the folder served, the
 * same two things every browser tool in this repo needs.
 */
"use strict";

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function connect(port) {
  port = port || "9333";
  return fetch("http://127.0.0.1:" + port + "/json/list")
    .then(function (r) {
      return r.json();
    })
    .then(function (targets) {
      var page = targets.filter(function (t) {
        return t.type === "page";
      })[0];
      if (!page) throw new Error("Chrome has no page target open");
      return new Promise(function (resolve, reject) {
        var ws = new WebSocket(page.webSocketDebuggerUrl);
        var nextId = 1;
        var pending = {};
        var listeners = [];
        ws.addEventListener("open", function () {
          resolve({
            send: function (method, params) {
              var id = nextId++;
              return new Promise(function (res, rej) {
                pending[id] = { res: res, rej: rej };
                ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
              });
            },
            on: function (fn) {
              listeners.push(fn);
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
          } else {
            listeners.forEach(function (fn) {
              fn(msg);
            });
          }
        });
      });
    });
}

function evaluate(cdp, expression) {
  return cdp
    .send("Runtime.evaluate", { expression: expression, returnByValue: true, awaitPromise: true })
    .then(function (r) {
      if (r.exceptionDetails) {
        throw new Error(
          "page threw: " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description)
        );
      }
      return r.result && r.result.value;
    });
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
  // Ready can arrive while a deferred script is still running; the app binds
  // its handlers at the end of that script.
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
  await sleep(800);
}

/**
 * Draw test photos in the page and store them through the app's own photo
 * store, under every plan on the device. A real photograph must never be
 * committed for this purpose.
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
      c.fillStyle = slot === "water" ? "#5f7f86" : "#8a7a52";
      c.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.45);
      var n = seed;
      function rand() {
        n = (n * 1103515245 + 12345) % 2147483648;
        return n / 2147483648;
      }
      for (var i = 0; i < 90; i++) {
        c.fillStyle = rand() > 0.5 ? "rgba(60,70,50,0.55)" : "rgba(190,180,140,0.5)";
        c.fillRect(rand() * canvas.width, canvas.height * 0.55 + rand() * canvas.height * 0.45, 6 + rand() * 26, 3 + rand() * 8);
      }
      c.fillStyle = "rgba(240,240,230,0.9)";
      c.fillRect(canvas.width * 0.12, canvas.height * 0.62, canvas.width * 0.2, canvas.height * 0.1);
      canvas.toBlob(function (blob) { resolve({ blob: blob, width: canvas.width, height: canvas.height }); }, "image/jpeg", 0.8);
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
  window.__mlmpSeedPhotos = function (slots, planIds, dates) {
    var made = [];
    planIds.forEach(function (planId) {
      slots.forEach(function (slot, i) {
        made.push(drawn(slot, 7 + i * 31).then(function (img) {
          return {
            id: "probe-" + planId + "-" + slot + "-" + i,
            planId: planId,
            slot: slot,
            createdAt: dates[i] || new Date().toISOString(),
            blob: img.blob,
            width: img.width,
            height: img.height
          };
        }));
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

/**
 * Save a sample plan, reopen it from My plans (which is what makes it the
 * current plan), store the given photos against it and open the visit card.
 */
async function openSeededVisit(cdp, base, slots, dates) {
  await navigate(cdp, base + "/");
  await click(cdp, "#btn-demo");
  await click(cdp, "#btn-save-named");
  await click(cdp, "#btn-results-plans");
  var planId = await evaluate(
    cdp,
    "(function(){var b=document.querySelector('[data-plan-open]');return b?b.getAttribute('data-plan-open'):'';})()"
  );
  if (!planId) throw new Error("the sample plan was not saved");
  await click(cdp, "[data-plan-open]");
  await evaluate(cdp, SEED);
  var stored = await evaluate(
    cdp,
    "window.__mlmpSeedPhotos(" + JSON.stringify(slots) + "," + JSON.stringify([planId]) + "," + JSON.stringify(dates) + ")"
  );
  if (stored !== slots.length) throw new Error("stored " + stored + " of " + slots.length + " photos");
  await click(cdp, "#btn-results-visit");
  return planId;
}

module.exports = {
  sleep: sleep,
  connect: connect,
  evaluate: evaluate,
  waitFor: waitFor,
  navigate: navigate,
  click: click,
  openSeededVisit: openSeededVisit,
  SEED: SEED,
};
