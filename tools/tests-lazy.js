#!/usr/bin/env node
/**
 * Tests for the files that are no longer loaded at boot.
 *
 * Three things have to be true for the split to be safe, and none of them can
 * be proved by looking at the size of the page:
 *
 *   1. A phone that only ever fetched English still renders every screen, in
 *      English, with no raw key and no blank space.
 *   2. Choosing Urdu or Hindi fetches that language and leaves the document in
 *      the right direction, and does it before the screen is repainted.
 *   3. A file that cannot be fetched puts a translated sentence and a Retry
 *      button where the feature would have been, and the button tries again.
 *
 * The browser half of the same story is tools/lazy-check.js, which proves the
 * real fetches, the real cache and the real offline behaviour. This file proves
 * the logic without needing a browser, so it runs inside `npm test`.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var root = path.resolve(__dirname, "..");
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

function read(name) {
  return fs.readFileSync(path.join(root, "js", name), "utf8");
}

function sandboxWith(files, extra) {
  var box = Object.assign({ window: {}, Promise: Promise }, extra || {});
  files.forEach(function (name) {
    new vm.Script(read(name), { filename: "js/" + name }).runInNewContext(box);
  });
  return box;
}

/**
 * The smallest DOM that js/loader.js needs: elements with children, a class
 * name, listeners, and a querySelector that understands `.class`. A real DOM
 * would prove the same thing more slowly.
 */
function fakeDocument() {
  function Element(tag) {
    this.tagName = tag;
    this.className = "";
    this.textContent = "";
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.listeners = {};
  }
  Element.prototype.setAttribute = function (key, value) {
    this.attributes[key] = value;
  };
  Element.prototype.getAttribute = function (key) {
    return this.attributes[key];
  };
  Element.prototype.appendChild = function (child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  };
  Element.prototype.removeChild = function (child) {
    var at = this.children.indexOf(child);
    if (at !== -1) this.children.splice(at, 1);
    child.parentNode = null;
    return child;
  };
  Element.prototype.addEventListener = function (type, fn) {
    this.listeners[type] = fn;
  };
  Element.prototype.querySelector = function (selector) {
    if (selector.charAt(0) !== ".") return null;
    var wanted = selector.slice(1);
    function walk(node) {
      for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i];
        if (child.className.split(/\s+/).indexOf(wanted) !== -1) return child;
        var deeper = walk(child);
        if (deeper) return deeper;
      }
      return null;
    }
    return walk(this);
  };
  return {
    createElement: function (tag) {
      return new Element(tag);
    },
    head: new Element("head"),
  };
}

/* ---------------------------------------------------------------- 1. Boot */

// Exactly what a first visit in English has: the boot file, no language files.
var boot = sandboxWith(["messages.js"]);
var BOOT = boot.window.MLMP_MESSAGES;

check("the switcher still offers three languages with one file loaded", BOOT.available().length === 3);
check(
  "Hindi has no dictionary before its file is fetched",
  Object.keys(BOOT.dict("hi")).length === 0
);
check(
  "Urdu has no dictionary before its file is fetched",
  Object.keys(BOOT.dict("ur")).length === 0
);

BOOT.set("ur");
check(
  "an unfetched language shows the English words, never a raw key",
  BOOT.t("nav.home") === BOOT.dict("en")["nav.home"] && BOOT.t("nav.home") !== "nav.home",
  BOOT.t("nav.home")
);
check("Urdu is right to left even before its strings arrive", BOOT.dir("ur") === "rtl");
check("Hindi is left to right", BOOT.dir("hi") === "ltr");
check("the fallback is a sentence, so no screen is blank", BOOT.t("home.title").length > 0);
check(
  "an unknown key still falls back to the English dictionary",
  BOOT.t("nav.plan") === BOOT.dict("en")["nav.plan"]
);

/* ------------------------------------------------ 2. Loading on demand */

var withLoader = sandboxWith(["messages.js"]);
var MSG = withLoader.window.MLMP_MESSAGES;

// A stand-in for js/loader.js that runs the real file, the way the browser
// would after its own fetch.
withLoader.window.MLMP_LOAD = {
  need: function (name) {
    var file = name === "messages.hi" ? "messages.hi.js" : name === "messages.ur" ? "messages.ur.js" : "";
    if (!file) return Promise.reject(new Error("unexpected " + name));
    new vm.Script(read(file), { filename: "js/" + file }).runInNewContext(withLoader);
    return Promise.resolve(true);
  },
};

var EN_TITLE = MSG.dict("en")["home.title"];

var urdu = MSG.use("ur").then(function (lang) {
  check("choosing Urdu resolves with Urdu", lang === "ur");
  check("choosing Urdu fills its dictionary", Object.keys(MSG.dict("ur")).length === MSG.keys().length);
  check("the document direction is right to left", MSG.dir(MSG.get()) === "rtl");
  check(
    "the screen is painted in Urdu, not English",
    MSG.t("home.title") !== EN_TITLE && MSG.t("home.title").length > 0,
    MSG.t("home.title")
  );
  check("the choice is remembered", MSG.get() === "ur");
  check(
    "the retry sentence is translated too",
    MSG.t("lazy.retry") === MSG.dict("ur")["lazy.retry"] && MSG.t("lazy.retry") !== "lazy.retry"
  );
});

var hindi = urdu.then(function () {
  return MSG.use("hi").then(function (lang) {
    check("choosing Hindi resolves with Hindi", lang === "hi");
    check("choosing Hindi fills its dictionary", Object.keys(MSG.dict("hi")).length === MSG.keys().length);
    check("the document direction goes back to left to right", MSG.dir(MSG.get()) === "ltr");
    check(
      "the screen is painted in Hindi, not the Urdu that was showing",
      MSG.t("home.title") !== MSG.dict("ur")["home.title"] && MSG.t("home.title").length > 0
    );
  });
});

/* --------------------------------------------- 3. A failed lazy fetch */

var broken = sandboxWith(["messages.js"]);
broken.window.MLMP_LOAD = {
  need: function () {
    return Promise.reject(new Error("could not fetch js/messages.ur.js"));
  },
};

var failed = broken.window.MLMP_MESSAGES.use("ur").then(
  function () {
    check("a failed language fetch rejects instead of pretending", false);
  },
  function () {
    check("a failed language fetch rejects instead of pretending", true);
    check(
      "a failed fetch leaves English on screen",
      broken.window.MLMP_MESSAGES.get() !== "ur"
    );
  }
);

/* The message and the button, from the real translations. */
var ui = sandboxWith(["messages.js"]);
ui.document = fakeDocument();
ui.window.MLMP_MESSAGES = ui.window.MLMP_MESSAGES;
// loader.js reads `document` and `window` from its own scope, so both are
// handed to the sandbox before it runs.
new vm.Script(read("loader.js"), { filename: "js/loader.js" }).runInNewContext(ui);
var LOAD = ui.window.MLMP_LOAD;

var host = ui.document.createElement("div");
var retried = 0;
LOAD.showFailure(host, function () {
  retried += 1;
});

var box = host.querySelector(".lazy-fail");
check("a failed load puts a message in the page", !!box);
check("the message is the translated sentence", box && box.children[0].textContent === ui.window.MLMP_MESSAGES.t("lazy.failed"));
check("the message is not a console line", box && box.children[0].textContent.length > 20);
check("the message is announced to a screen reader", box && box.getAttribute("role") === "alert");
check("there is a Retry button", !!box && box.children[1].tagName === "button");
check("the button is labelled in words", box && box.children[1].textContent === ui.window.MLMP_MESSAGES.t("lazy.retry"));

if (box) box.children[1].listeners.click();
check("Retry calls the work again", retried === 1);
check("the message is taken away before the retry", !host.querySelector(".lazy-fail"));

/* ------------------------------------------------------------ Report */

Promise.all([urdu, hindi, failed])
  .catch(function (err) {
    failures.push("an async check threw: " + err.message);
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
    console.log(checks + " lazy-loading checks passed.");
  });
