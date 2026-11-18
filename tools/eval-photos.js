#!/usr/bin/env node
/**
 * Evaluation harness for photo observations.
 *
 * The interesting failure here is not a crash: it is a payload that quietly
 * carries a crop, a soil reading, a yield or a sentence of advice, gets shown
 * at an office, and is believed. So this file tries to smuggle each of those
 * past both validators, checks that both refuse the same things, and checks
 * that no code path in the shipped module can send a photo at all.
 *
 *   node tools/eval-photos.js
 *
 * Run by `npm test`. It needs no key, no network and no provider.
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

var store = Object.create(null);
var sandbox = {
  window: {
    localStorage: {
      getItem: function (key) {
        return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
      },
      setItem: function (key, value) {
        store[key] = String(value);
      },
      removeItem: function (key) {
        delete store[key];
      },
    },
  },
};
var observationsFile = path.join(root, "js", "observations.js");
var source = fs.readFileSync(observationsFile, "utf8");
new vm.Script(source, { filename: "js/observations.js" }).runInNewContext(sandbox);
var OBS = sandbox.window.MLMP_OBSERVATIONS;
var SERVER = require(path.join(root, "server", "observe.js"));

function withField(name, value) {
  var payload = OBS.mock("wide");
  payload.fields[name] = value;
  return payload;
}

function extra(patch) {
  var payload = OBS.mock("wide");
  Object.keys(patch).forEach(function (key) {
    payload[key] = patch[key];
  });
  return payload;
}

var sample = OBS.mock("ground");
var verdict = OBS.validate(sample);
check("the mock payload is valid against the shipped schema", verdict.ok, verdict.errors.join("; "));
check(
  "the mock payload says it is a mock, never that it read a photo",
  sample.mock === true && sample.provider === "mock"
);
check(
  "the mock payload marks every field unclear instead of inventing a reading",
  Object.keys(sample.fields).every(function (name) {
    return sample.fields[name] === "unclear";
  }) && sample.uncertain.length === Object.keys(sample.fields).length
);

/* ---- Everything that must be refused, on the client and on the server ---- */

var forbidden = [
  ["a crop name", extra({ crop: "apple" })],
  ["a soil type", extra({ soil: "loam" })],
  ["a soil pH", extra({ ph: 6.5 })],
  ["a yield figure", extra({ yield: "12 quintals" })],
  ["an income estimate", extra({ income: 40000 })],
  ["a recommendation", extra({ recommendation: "plant maize" })],
  ["free text", extra({ text: "The field looks ready for sowing." })],
  ["a note", extra({ note: "ask the officer" })],
  [
    "a crop inside the closed field list",
    extra({ fields: Object.assign({}, sample.fields, { crop: "apple" }) }),
  ],
  ["an unknown slot", extra({ photo: { slot: "kitchen" } })],
  ["a second photo field", extra({ photo: { slot: "wide", blurred: false } })],
  ["an unapproved provider", extra({ provider: "openai" })],
  ["a claim that this is not a mock", extra({ mock: false })],
];

forbidden.forEach(function (pair) {
  var label = pair[0];
  var payload = pair[1];
  check("the client refuses " + label, !OBS.validate(payload).ok);
  check("the server refuses " + label, !SERVER.validateOutput(payload).ok);
});

var invalid = [
  ["a missing field", (function () {
    var payload = OBS.mock("wide");
    delete payload.fields.slope_cue;
    return payload;
  })()],
  ["a value outside the vocabulary", withField("ground_cover", "very green")],
  ["a number where a word belongs", withField("visible_water", 1)],
  ["an uncertain list naming nothing real", extra({ uncertain: ["weather"] })],
  ["a wrong schema version", extra({ schema: "mlmp.observation.v2" })],
  ["no health check at all", {}],
  ["null", null],
];

invalid.forEach(function (pair) {
  check("the client refuses " + pair[0], !OBS.validate(pair[1]).ok);
  check("the server refuses " + pair[0], !SERVER.validateOutput(pair[1]).ok);
});

check("an allowed payload passes on both sides", SERVER.validateOutput(sample).ok);
check(
  "both validators agree on every case above",
  forbidden.concat(invalid).every(function (pair) {
    return OBS.validate(pair[1]).ok === SERVER.validateOutput(pair[1]).ok;
  })
);

/* ---- The gate: consent first, and no network from the shipped module ---- */

check("nothing is described before consent", OBS.hasConsent() === false);
OBS.describe("wide").then(function (result) {
  check("without consent the answer is a refusal, with a reason", result.ok === false && result.reason === "no_consent");
  check("consent is recorded on this device only", OBS.setConsent(true) === true && OBS.hasConsent() === true);
  return OBS.describe("wide");
}).then(function (result) {
  check(
    "with consent and no endpoint, the answer is still a refusal",
    result.ok === false && result.reason === "not_connected"
  );
  check("consent can be withdrawn cleanly", OBS.setConsent(false) === true && OBS.hasConsent() === false);
  return OBS.describe("kitchen");
}).then(function (result) {
  check("a slot that is not a photo is refused", result.ok === false && result.reason === "no_photo");
}).then(finish, finish);

function finish(err) {
  if (err) {
    failures.push("the consent sequence threw: " + String(err && err.message));
    console.error("  FAIL: the consent sequence threw");
  }
  check(
    "the shipped module contains no network call",
    !/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(source)
  );

  var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  var sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  check("index.html loads js/observations.js", /src="js\/observations\.js"/.test(html));
  check("the service worker precaches js/observations.js", sw.indexOf('"./js/observations.js"') !== -1);

  /* ---- The server function, which is not deployed ---- */

  function call(request, env) {
    return SERVER.respond(request, env);
  }
  var okBody = { slot: "wide" };
  check("GET is refused", call({ method: "GET" }).status === 405);
  check("a request without consent is refused", call({ method: "POST", body: okBody }).status === 403);
  check(
    "a request with consent but no service is refused rather than faked",
    call({ method: "POST", headers: { "X-MLMP-Consent": "yes" }, body: okBody }).status === 501
  );
  check(
    "an unknown slot is a bad request",
    call({
      method: "POST",
      headers: { "X-MLMP-Consent": "yes" },
      body: { slot: "kitchen" },
    }).status === 400
  );
  var mockResponse = call(
    {
      method: "POST",
      headers: { "x-mlmp-consent": "yes" },
      body: JSON.stringify({ slot: "ground" }),
    },
    { OBSERVE_MODE: "mock" }
  );
  check("the mock mode returns a payload the server itself validates", mockResponse.status === 200 && SERVER.validateOutput(mockResponse.body).ok);
  check(
    "the returned payload keeps the slot it was asked about",
    mockResponse.body.photo.slot === "ground"
  );
  check("the server never reports a provider it does not have", mockResponse.body.provider === "mock");
  check(
    "the provider contract forbids the agronomy words outright",
    /do not name a crop, soil type, pest, disease or yield/i.test(SERVER.OUTPUT_CONTRACT)
  );

  console.log("");
  if (failures.length) {
    console.error(failures.length + " of " + checks + " checks failed:");
    failures.forEach(function (f) {
      console.error("  - " + f);
    });
    process.exit(1);
  }
  console.log(checks + " observation checks passed.");
}
