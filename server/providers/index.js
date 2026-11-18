/**
 * The provider registry. Exactly one entry today, and it cannot see.
 *
 * Adding a real provider is meant to be one new file and one line here:
 *
 *   1. `server/providers/<name>.js` exporting:
 *        { name, model, canSeeImages,
 *          analyse({ slot, bytes, contentType }, env) -> payload | Promise }
 *      The payload is validated by the orchestrator before anyone sees it, so
 *      an adapter cannot bypass the closed vocabulary.
 *   2. Add it to `PROVIDERS` below.
 *   3. Answer REVIEW_PHOTO_QUESTIONS.md, set OBSERVE_PROVIDER=<name> and
 *      OBSERVE_MODE=on in the host's environment, and run the eval harness.
 *
 * Nothing else in `observe.js` has to change, and the mock stays reachable so
 * the tests keep proving the path without a network.
 */
"use strict";

var PROVIDERS = {
  mock: require("./mock.js"),
};

function get(name) {
  var key = String(name || "").toLowerCase();
  return Object.prototype.hasOwnProperty.call(PROVIDERS, key) ? PROVIDERS[key] : null;
}

function names() {
  return Object.keys(PROVIDERS);
}

/**
 * Read the two switches. `OBSERVE_MODE` defaults to "off", so a host that has
 * been set up but not switched on serves a 503 and the app says the feature is
 * unavailable. `OBSERVE_MODE=off` is the kill switch: it takes effect on the
 * next request, with no deploy.
 */
function enabled(env) {
  env = env || {};
  var mode = String(env.OBSERVE_MODE || "off").toLowerCase();
  if (mode !== "on") return { on: false, mode: mode === "on" ? "on" : mode };
  var name = String(env.OBSERVE_PROVIDER || "mock").toLowerCase();
  var provider = get(name);
  if (!provider) return { on: false, mode: "unconfigured", requested: name };
  return { on: true, mode: "on", provider: provider };
}

module.exports = { get: get, names: names, enabled: enabled };
