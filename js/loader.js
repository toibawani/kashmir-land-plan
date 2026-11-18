/**
 * Load the optional parts of the app the first time they are needed.
 *
 * Before this file existed every module was a <script defer> in index.html, so
 * a farmer opening the home screen downloaded and evaluated the photo store,
 * the print layout, the QR encoder and both other languages before the form
 * could be filled in. That was 27 scripts and 48 KB of gzip for a first screen
 * that uses nine of them.
 *
 * The boot file list is now the minimum the home, form and results screens
 * need. Everything here is fetched on the click that needs it, from the copy
 * the service worker cached on install, so it works with no signal too.
 *
 * Interface
 *   MLMP_LOAD.need(name | [names])   a promise, resolved when each file ran
 *   MLMP_LOAD.has(name)              whether its global is on the page now
 *   MLMP_LOAD.showFailure(host, fn)  the plain message and Retry button
 *   MLMP_LOAD.clearFailure(host)     take that message away again
 *   MLMP_LOAD.names() / fileOf(name) what this file knows about, for the tests
 *
 * A file that cannot be fetched is not a broken screen: `showFailure` puts a
 * translated sentence and a Retry button where the feature would have been,
 * and the button calls the same work again. Offline on a first visit is the
 * expected case, not an exception.
 */
(function () {
  "use strict";

  /* One line per lazily loaded file. The name is what callers ask for; the
     path is what is fetched. Keep this list and CORE_ASSETS in sw.js in step:
     tools/verify.js fails when a file here is not precached. */
  var FILES = {
    data: "js/data.js",
    photos: "js/photos.js",
    observations: "js/observations.js",
    speech: "js/speech.js",
    qr: "js/qr.js",
    visitfit: "js/visitfit.js",
    office: "js/office.js",
    share: "js/share.js",
    visitcard: "js/visitcard.js",
    feedback: "js/feedback.js",
    "messages.hi": "js/messages.hi.js",
    "messages.ur": "js/messages.ur.js",
  };

  /* The global each file defines. Reading the global rather than trusting a
     flag means a file that threw halfway through still counts as missing. */
  var GLOBALS = {
    data: "MLMP_DATA",
    photos: "MLMP_PHOTOS",
    observations: "MLMP_OBSERVATIONS",
    speech: "MLMP_SPEECH",
    qr: "MLMP_QR",
    visitfit: "MLMP_FIT",
    office: "MLMP_OFFICE",
    share: "MLMP_SHARE",
    visitcard: "MLMP_VISIT",
    feedback: "MLMP_FEEDBACK",
    // js/landpanel.js is deliberately absent: it defines no global and wires
    // itself on DOMContentLoaded, so fetching it after boot would leave its
    // wiring unbound. It stays on the boot path until it earns a ready guard.
  };

  /* The two language files register into MLMP_MESSAGES instead of defining a
     global of their own, so they are checked through that registry. */
  var REGISTERS = { "messages.hi": "hi", "messages.ur": "ur" };

  var pending = {};

  function fileOf(name) {
    return FILES[name] || "";
  }

  function names() {
    return Object.keys(FILES);
  }

  function has(name) {
    var code = REGISTERS[name];
    if (code) {
      var M = window.MLMP_MESSAGES;
      return !!(M && M.dict && Object.keys(M.dict(code) || {}).length);
    }
    var key = GLOBALS[name];
    if (!key) return false;
    return !!window[key];
  }

  function load(name) {
    if (has(name)) return Promise.resolve(true);
    if (pending[name]) return pending[name];
    var src = fileOf(name);
    if (!src) return Promise.reject(new Error("no file is registered for " + name));

    pending[name] = new Promise(function (resolve, reject) {
      var el = document.createElement("script");
      el.src = src;
      // Ordered async loading would let two files race; these are independent,
      // so each is simply appended and resolves on its own onload.
      el.async = true;
      el.onload = function () {
        delete pending[name];
        // A file that parsed but defined nothing is a broken build. Saying so
        // here turns a silent half-feature into the retry message.
        if (!has(name)) {
          reject(new Error(name + " loaded without defining anything"));
          return;
        }
        resolve(true);
      };
      el.onerror = function () {
        delete pending[name];
        reject(new Error("could not fetch " + src));
      };
      document.head.appendChild(el);
    });
    return pending[name];
  }

  /** `need("photos")` or `need(["photos", "observations"])`. */
  function need(which) {
    if (!which) return Promise.resolve(true);
    var list = Object.prototype.toString.call(which) === "[object Array]" ? which : [which];
    return Promise.all(list.map(load)).then(function () {
      return true;
    });
  }

  function sentence(key, fallback) {
    var M = window.MLMP_MESSAGES;
    if (M && M.t) {
      var text = M.t(key);
      // t() returns the key itself when a build has lost the string.
      if (text && text !== key) return text;
    }
    return fallback;
  }

  /**
   * Put the message where the feature would have been. Built with DOM calls
   * rather than a string of HTML, so a translated sentence can never be read
   * as markup.
   */
  function showFailure(host, retry) {
    if (!host) return null;
    clearFailure(host);
    var box = document.createElement("div");
    box.className = "lazy-fail";
    box.setAttribute("role", "alert");

    var text = document.createElement("p");
    text.className = "lazy-fail-text";
    text.textContent = sentence(
      "lazy.failed",
      "This part could not be loaded. Check your connection and try again."
    );

    var button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-secondary lazy-fail-retry";
    button.textContent = sentence("lazy.retry", "Try again");
    button.addEventListener("click", function () {
      clearFailure(host);
      if (retry) retry();
    });

    box.appendChild(text);
    box.appendChild(button);
    host.appendChild(box);
    return box;
  }

  function clearFailure(host) {
    if (!host) return;
    var old = host.querySelector(".lazy-fail");
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }

  window.MLMP_LOAD = {
    need: need,
    has: has,
    showFailure: showFailure,
    clearFailure: clearFailure,
    names: names,
    fileOf: fileOf,
  };
})();
