#!/usr/bin/env node
/**
 * Evaluation harness for photo observations.
 *
 * The interesting failure here is not a crash: it is a payload that quietly
 * carries a crop, a soil reading, a yield or a sentence of advice, gets shown
 * at an office, and is believed. So this file tries to smuggle each of those
 * past both validators, then drives the endpoint through every refusal it
 * claims to make: wrong origin, missing consent, a body that is too big, bytes
 * that are not an image, a burst, a daily ceiling, and a provider that strays.
 *
 * It also reads `eval-photos/expected.json`, the file a reviewer edits when
 * they want to argue about a case, and fails if the client and the server
 * disagree about any of it.
 *
 *   node tools/eval-photos.js
 *
 * No key, no network and no provider. Run by `npm test`.
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
    console.error("  FAIL: " + name + (detail ? " (" + detail + ")" : ""));
  }
}

/* ---- The client module, in the smallest browser it needs ---- */

var store = Object.create(null);
var fetchCalls = [];
var fetchReply = null;
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
  fetch: function (url, options) {
    fetchCalls.push({ url: url, options: options });
    return Promise.resolve(fetchReply);
  },
  FileReader: function () {
    var self = this;
    this.readAsDataURL = function () {
      setTimeout(function () {
        self.result = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
        self.onload();
      }, 0);
    };
  },
};
var source = fs.readFileSync(path.join(root, "js", "observations.js"), "utf8");
new vm.Script(source, { filename: "js/observations.js" }).runInNewContext(sandbox);
var OBS = sandbox.window.MLMP_OBSERVATIONS;

var schema = require(path.join(root, "server", "schema.js"));
var providers = require(path.join(root, "server", "providers", "index.js"));
var limits = require(path.join(root, "server", "limits.js"));
var server = require(path.join(root, "server", "observe.js"));

function jpegBase64() {
  // The endpoint checks the first bytes, not a decoder, so the fixture only has
  // to start like a JPEG. Nothing here is a photograph of anyone's land.
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 0x20)]).toString("base64");
}

function post(overrides) {
  var request = {
    method: "POST",
    headers: { "x-mlmp-consent": "yes" },
    body: { slot: "wide", imageBase64: jpegBase64() },
  };
  Object.keys(overrides || {}).forEach(function (key) {
    request[key] = overrides[key];
  });
  return request;
}

function respond(request, env) {
  limits.reset();
  return server.respond(request, env || { OBSERVE_MODE: "on" });
}

/* ---- The format itself ---- */

var sample = OBS.mock("ground");
var verdict = OBS.validate(sample);
check("the mock payload is valid against the shipped schema", verdict.ok, verdict.errors.join("; "));
check(
  "the schema and the provider registry agree on the schema string",
  schema.SCHEMA === OBS.SCHEMA && schema.SCHEMA === sample.schema
);
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

function extra(patch) {
  var payload = OBS.mock("wide");
  Object.keys(patch).forEach(function (key) {
    payload[key] = patch[key];
  });
  return payload;
}

function withField(name, value) {
  var payload = OBS.mock("wide");
  payload.fields[name] = value;
  return payload;
}

var forbidden = [
  ["a crop name", extra({ crop: "apple" })],
  ["a soil type", extra({ soil: "loam" })],
  ["a soil pH", extra({ ph: 6.5 })],
  ["a yield figure", extra({ yield: "12 quintals" })],
  ["an income estimate", extra({ income: 40000 })],
  ["a recommendation", extra({ recommendation: "plant maize" })],
  ["free text", extra({ text: "The field looks ready for sowing." })],
  ["a note", extra({ note: "ask the officer" })],
  ["a crop inside the closed field list", extra({ fields: Object.assign({}, sample.fields, { crop: "apple" }) })],
  ["an unknown slot", extra({ photo: { slot: "kitchen" } })],
  ["a second photo field", extra({ photo: { slot: "wide", blurred: false } })],
  ["an unapproved provider", extra({ provider: "openai" })],
  ["a claim that this is not a mock", extra({ mock: false })],
];

forbidden.forEach(function (pair) {
  check("the client refuses " + pair[0], !OBS.validate(pair[1]).ok);
  check("the server refuses " + pair[0], !schema.validate(pair[1]).ok);
});

var invalid = [
  [
    "a missing field",
    (function () {
      var payload = OBS.mock("wide");
      delete payload.fields.slope_cue;
      return payload;
    })(),
  ],
  ["a value outside the vocabulary", withField("ground_cover", "very green")],
  ["a number where a word belongs", withField("visible_water", 1)],
  ["an uncertain list naming nothing real", extra({ uncertain: ["weather"] })],
  ["a wrong schema version", extra({ schema: "mlmp.observation.v2" })],
  ["no health check at all", {}],
  ["null", null],
];

invalid.forEach(function (pair) {
  check("the client refuses " + pair[0], !OBS.validate(pair[1]).ok);
  check("the server refuses " + pair[0], !schema.validate(pair[1]).ok);
});

check("an allowed payload passes on both sides", schema.validate(sample).ok);
check(
  "both validators agree on every case above",
  forbidden.concat(invalid).every(function (pair) {
    return OBS.validate(pair[1]).ok === schema.validate(pair[1]).ok;
  })
);

/* ---- The reviewer's own cases ---- */

var fixturesFile = path.join(root, "eval-photos", "expected.json");
var fixtures = JSON.parse(fs.readFileSync(fixturesFile, "utf8"));
check("eval-photos/expected.json lists at least one case", Array.isArray(fixtures.cases) && fixtures.cases.length > 0);
fixtures.cases.forEach(function (item) {
  var client = OBS.validate(item.payload);
  var serverVerdict = schema.validate(item.payload);
  check(
    "expected.json: " + item.name + " is " + (item.accept ? "accepted" : "refused") + " by both",
    client.ok === item.accept && serverVerdict.ok === item.accept,
    "client " + client.ok + ", server " + serverVerdict.ok + ", expected " + item.accept
  );
});

/* ---- The gate in the browser module ---- */

var photo = { slot: "wide", blob: { size: 10 } };

check("nothing is described before consent", OBS.hasConsent() === false);
check("no endpoint is configured in this repository", OBS.connected() === false);

OBS.describe(photo)
  .then(function (result) {
    check("without consent the answer is a refusal, with a reason", result.ok === false && result.reason === "no_consent");
    check("and nothing was sent", fetchCalls.length === 0);
    check("consent is recorded on this device only", OBS.setConsent(true) === true && OBS.hasConsent() === true);
    return OBS.describe(photo);
  })
  .then(function (result) {
    check(
      "with consent but no endpoint, the answer is still a refusal and no request",
      result.ok === false && result.reason === "not_connected" && fetchCalls.length === 0
    );
    check("consent can be withdrawn cleanly", OBS.setConsent(false) === true && OBS.hasConsent() === false);
    return OBS.describe({ slot: "kitchen", blob: {} });
  })
  .then(function (result) {
    check("a slot that is not a photo is refused", result.ok === false && result.reason === "no_photo");
    // Now pretend an endpoint has been approved: the client must handle every
    // answer the server can give without throwing.
    sandbox.window.MLMP_OBSERVE_ENDPOINT = "https://example.test/observe";
    OBS.setConsent(true);
    fetchReply = { status: 503, ok: false };
    return OBS.describe(photo);
  })
  .then(function (result) {
    check("the kill switch shows as unavailable, not as an error", result.ok === false && result.reason === "unavailable");
    check("the photo was only sent after consent and a configured endpoint", fetchCalls.length === 1);
    var headers = fetchCalls[0].options.headers || {};
    check("the request carries the consent header", headers["x-mlmp-consent"] === "yes");
    fetchReply = { status: 429, ok: false };
    return OBS.describe(photo);
  })
  .then(function (result) {
    check("a rate limit shows as limited", result.ok === false && result.reason === "limited");
    fetchReply = {
      status: 200,
      ok: true,
      json: function () {
        return Promise.resolve({ ok: true, observation: OBS.mock("wide") });
      },
    };
    return OBS.describe(photo);
  })
  .then(function (result) {
    check("a valid answer is accepted", result.ok === true && !!result.observation);
    fetchReply = {
      status: 200,
      ok: true,
      json: function () {
        return Promise.resolve({ ok: true, observation: extra({ crop: "apple" }) });
      },
    };
    return OBS.describe(photo);
  })
  .then(function (result) {
    check("an answer that names a crop is refused on arrival", result.ok === false && result.reason === "refused");
  })
  .then(finish, finish);

function finish(err) {
  if (err) {
    failures.push("the client sequence threw: " + String(err && err.message));
    console.error("  FAIL: the client sequence threw");
  }
  serverChecks();
}

/* ---- The endpoint ---- */

function serverChecks() {
  var allowed = { OBSERVE_MODE: "on", OBSERVE_ALLOWED_ORIGINS: "https://toibawani.github.io" };
  var allowedOrigin = "https://toibawani.github.io";

  function call(overrides, env) {
    var request = post(overrides);
    return respond(request, env || allowed);
  }

  check("GET is refused", respond({ method: "GET" }, allowed).status === 405);
  check("a request without consent is refused", respond({ method: "POST", body: post().body }, allowed).status === 403);

  var foreign = call({ headers: { "x-mlmp-consent": "yes", origin: "https://evil.test" } });
  check("a foreign origin is refused", foreign.status === 403 && foreign.body.error === "origin_not_allowed");

  var preflight = respond(
    { method: "OPTIONS", headers: { origin: allowedOrigin } },
    allowed
  );
  check(
    "a preflight from the allowlisted origin is answered",
    preflight.status === 204 && preflight.headers["Access-Control-Allow-Origin"] === allowedOrigin
  );
  var badPreflight = respond({ method: "OPTIONS", headers: { origin: "https://evil.test" } }, allowed);
  check("a preflight from anywhere else is refused", badPreflight.status === 403);

  var okResponse = call({ headers: { "x-mlmp-consent": "yes", origin: allowedOrigin } });
  check("an allowed origin gets a validated observation", okResponse.status === 200 && okResponse.body.ok === true);
  check("the CORS header is on the answer", okResponse.headers["Access-Control-Allow-Origin"] === allowedOrigin);

  var huge = call({ body: { slot: "wide", imageBase64: "x".repeat(3000000) } });
  check("an oversize body is refused before it is parsed", huge.status === 413);

  var textFile = call({
    body: { slot: "wide", imageBase64: Buffer.from("this is not an image at all").toString("base64") },
  });
  check("bytes that are not an image are refused", textFile.status === 415 && textFile.body.error === "not_an_image");

  var offSwitch = respond(post(), { OBSERVE_MODE: "off" });
  check("the default mode is off and answers unavailable", offSwitch.status === 503 && offSwitch.body.error === "unavailable");
  var unset = respond(post(), {});
  check("a host with no OBSERVE_MODE at all is off too", unset.status === 503);

  var unknown = respond(post(), { OBSERVE_MODE: "on", OBSERVE_PROVIDER: "not-a-provider" });
  check("an unknown provider is a configuration error, not a guess", unknown.status === 501);

  var broken = respond(post(), { OBSERVE_MODE: "on", OBSERVE_MOCK_BREAK: "1" });
  check("a model answer that names a crop is refused", broken.status === 502 && broken.body.error === "invalid_observation");
  check(
    "the refusal leaks no field names from the model",
    JSON.stringify(broken.body).indexOf("crop") === -1
  );
  check(
    "the refusal carries no stack trace",
    JSON.stringify(broken.body).indexOf(" at ") === -1 && !broken.body.errors
  );

  limits.reset();
  var last;
  for (var i = 0; i < limits.PER_WINDOW + 1; i++) last = server.respond(post(), allowed);
  check("a burst past the window is rate limited", last.status === 429 && last.body.error === "rate_limited");
  check("the rate limit says when to try again", Number(last.headers["Retry-After"]) > 0);

  // server.respond directly: the helper resets the counters, and this test is
  // about three requests in a row on one day.
  limits.reset();
  var capEnv = Object.assign({}, allowed, { OBSERVE_DAILY_CAP: "2" });
  server.respond(post(), capEnv);
  server.respond(post(), capEnv);
  var capped = server.respond(post(), capEnv);
  check("the daily ceiling stops the day", capped.status === 429 && capped.body.error === "daily_cap_reached");

  check("the mock is the only provider registered", providers.names().join(",") === "mock");
  check(
    "the provider contract forbids the agronomy words outright",
    /do not name a crop, soil type, pest, disease or yield/i.test(schema.OUTPUT_CONTRACT)
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
