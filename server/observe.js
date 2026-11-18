/**
 * Server side of photo observations. Deliberately not deployed.
 *
 * The app is served as static files from GitHub Pages, so there is no function
 * runtime behind it and no place a key could safely live. This file exists to
 * make the contract testable before anyone approves a provider: it validates
 * the request, refuses without consent, validates the answer against the same
 * closed vocabulary the client uses, and can return the labelled mock payload
 * so the whole path is exercised in `tools/eval-photos.js`.
 *
 * It never calls a provider. Wiring one in means, in this order:
 *   1. REVIEW_PHOTO_QUESTIONS.md signed off by an agriculture officer.
 *   2. A host that can keep a key server-side.
 *   3. A provider behind OBSERVE_PROVIDER, with its own eval run.
 *
 * The validator is written out again here rather than shared, because the
 * client copy is loaded as a plain browser script and the promise that matters
 * is that the same payloads pass on both sides. The eval harness asserts that
 * agreement on every case it tries.
 *
 *   respond({ method, headers, body }, env)  ->  { status, body }
 */
"use strict";

var SCHEMA = "mlmp.observation.v1";
var SLOTS = ["wide", "ground", "water"];
var TOP_KEYS = ["schema", "provider", "mock", "createdAt", "photo", "fields", "uncertain"];
var FIELDS = {
  ground_cover: ["bare", "sparse", "covered", "unclear"],
  visible_water: ["none", "present", "unclear"],
  visible_structure: ["none", "present", "unclear"],
  slope_cue: ["flat", "sloped", "unclear"],
};
var FORBIDDEN = [
  "soil",
  "soil_type",
  "ph",
  "fertility",
  "crop",
  "crop_id",
  "crop_name",
  "pest",
  "disease",
  "weed",
  "yield",
  "income",
  "water_table",
  "ownership",
  "boundary",
  "suitability",
  "recommendation",
  "recommendations",
  "advice",
  "next_steps",
  "summary",
  "description",
  "text",
  "note",
  "prose",
];

/* What a provider would be asked for. Kept beside the validator so the prompt
   and the schema cannot drift apart. */
var OUTPUT_CONTRACT =
  "Return only JSON with schema, provider and mock, a photo object with slot, a " +
  "fields object containing exactly ground_cover, visible_water, " +
  "visible_structure and slope_cue, and an uncertain list. Use only the listed " +
  "values and prefer unclear. Do not name a crop, soil type, pest, disease or " +
  "yield, do not estimate income, and do not give advice or any prose.";

function validateOutput(payload) {
  var errors = [];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, errors: ["the observation must be an object"] };
  }
  Object.keys(payload).forEach(function (key) {
    var lower = key.toLowerCase();
    if (FORBIDDEN.indexOf(lower) !== -1) errors.push("forbidden field: " + key);
    else if (TOP_KEYS.indexOf(key) === -1) errors.push("unexpected field: " + key);
  });
  if (payload.schema !== SCHEMA) errors.push("schema must be " + SCHEMA);
  if (payload.provider !== "mock") {
    errors.push("provider must be one of mock: no real provider has been approved");
  }
  if (payload.mock !== true) {
    errors.push("mock must be true: no real provider has been approved");
  }
  if (typeof payload.createdAt !== "string" || isNaN(new Date(payload.createdAt).getTime())) {
    errors.push("createdAt must be a date");
  }
  var photo = payload.photo;
  if (!photo || typeof photo !== "object" || SLOTS.indexOf(photo.slot) === -1) {
    errors.push("photo.slot must be one of " + SLOTS.join(", "));
  } else if (Object.keys(photo).some(function (key) {
    return key !== "slot";
  })) {
    errors.push("unexpected photo field");
  }
  var fields = payload.fields;
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    errors.push("fields must be an object");
  } else {
    var names = Object.keys(FIELDS);
    names.forEach(function (name) {
      if (!Object.prototype.hasOwnProperty.call(fields, name)) {
        errors.push("missing field: " + name);
        return;
      }
      if (FIELDS[name].indexOf(fields[name]) === -1) {
        errors.push(name + " must be one of " + FIELDS[name].join(", "));
      }
    });
    Object.keys(fields).forEach(function (key) {
      if (names.indexOf(key) === -1) errors.push("unexpected field: fields." + key);
    });
  }
  if (!Array.isArray(payload.uncertain)) {
    errors.push("uncertain must be a list");
  } else {
    payload.uncertain.forEach(function (name) {
      if (Object.keys(FIELDS).indexOf(name) === -1) {
        errors.push("uncertain names a field that does not exist: " + name);
      }
    });
  }
  return { ok: errors.length === 0, errors: errors };
}

function mock(slot) {
  var fields = {};
  var names = Object.keys(FIELDS);
  names.forEach(function (name) {
    fields[name] = "unclear";
  });
  return {
    schema: SCHEMA,
    provider: "mock",
    mock: true,
    createdAt: new Date().toISOString(),
    photo: { slot: SLOTS.indexOf(slot) === -1 ? "wide" : slot },
    fields: fields,
    uncertain: names.slice(),
  };
}

function header(headers, name) {
  if (!headers) return "";
  var wanted = name.toLowerCase();
  var found = "";
  Object.keys(headers).forEach(function (key) {
    if (key.toLowerCase() === wanted) found = String(headers[key]);
  });
  return found;
}

function respond(request, env) {
  env = env || {};
  request = request || {};
  if (String(request.method || "").toUpperCase() !== "POST") {
    return { status: 405, body: { error: "use POST" } };
  }
  // Consent is checked before the body is read, so a request that carries a
  // photo without it never reaches any provider code.
  if (header(request.headers, "x-mlmp-consent").toLowerCase() !== "yes") {
    return { status: 403, body: { error: "no consent for this photo" } };
  }
  var body = request.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (_) {
      return { status: 400, body: { error: "body must be JSON" } };
    }
  }
  var slot = body && body.slot;
  if (SLOTS.indexOf(slot) === -1) {
    return { status: 400, body: { error: "slot must be one of " + SLOTS.join(", ") } };
  }
  // Only the mock path exists. There is no branch here that can reach a network,
  // which is the point: approving a provider means adding one, deliberately.
  if (env.OBSERVE_MODE !== "mock") {
    return { status: 501, body: { error: "no description service is connected" } };
  }
  var payload = mock(slot);
  var verdict = validateOutput(payload);
  if (!verdict.ok) {
    return { status: 500, body: { error: "the mock payload failed its own schema" } };
  }
  return { status: 200, body: payload };
}

module.exports = {
  SCHEMA: SCHEMA,
  FIELDS: FIELDS,
  FORBIDDEN: FORBIDDEN,
  OUTPUT_CONTRACT: OUTPUT_CONTRACT,
  validateOutput: validateOutput,
  mock: mock,
  respond: respond,
};
