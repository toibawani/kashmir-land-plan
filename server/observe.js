/**
 * The photo-observation endpoint. Not deployed, and off by default.
 *
 * Every check below is the difference between a careful feature and a hole:
 *
 *   method      POST only; OPTIONS is answered for the allowlisted origin
 *   origin      a browser origin not on OBSERVE_ALLOWED_ORIGINS is refused
 *   consent     an explicit `x-mlmp-consent: yes` header, or nothing happens
 *   size        the body is refused before it is parsed if it is too big
 *   image       the bytes must start like a JPEG, PNG or WebP, not be a file
 *               that merely claims to be one
 *   mode        OBSERVE_MODE=off answers 503 and the app says "unavailable";
 *               that is the kill switch, no deploy needed
 *   limits      a short burst per client and a hard daily ceiling
 *   output      the provider's answer is validated against the closed schema
 *               before anyone sees it; a model that names a crop is a 502
 *
 * Errors are codes, never messages from a provider, a stack, or an env value.
 *
 *   respond({ method, headers, body, clientId, origin }, env, now)
 *     -> { status, body, headers }
 */
"use strict";

var schema = require("./schema.js");
var providers = require("./providers/index.js");
var limits = require("./limits.js");

var MAX_BYTES = 2000000;
var DAILY_CAP = 100;

function header(headers, name) {
  if (!headers) return "";
  var wanted = name.toLowerCase();
  var found = "";
  Object.keys(headers).forEach(function (key) {
    if (key.toLowerCase() === wanted) found = String(headers[key]);
  });
  return found;
}

function allowedOrigins(env) {
  return String((env && env.OBSERVE_ALLOWED_ORIGINS) || "")
    .split(",")
    .map(function (value) {
      return value.trim().replace(/\/$/, "");
    })
    .filter(Boolean);
}

function corsHeaders(origin, env) {
  if (!origin) return {};
  if (allowedOrigins(env).indexOf(origin.replace(/\/$/, "")) === -1) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-mlmp-consent",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

function maxBytes(env) {
  var value = Number((env && env.OBSERVE_MAX_BYTES) || MAX_BYTES);
  return isFinite(value) && value > 0 ? value : MAX_BYTES;
}

function dailyCap(env) {
  var value = Number((env && env.OBSERVE_DAILY_CAP) || DAILY_CAP);
  return isFinite(value) && value > 0 ? value : DAILY_CAP;
}

/** A file is what its first bytes say it is, not what its name says. */
function imageType(bytes) {
  if (!bytes || bytes.length < 12) return "";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return "";
}

function respond(request, env, now) {
  env = env || {};
  request = request || {};
  var method = String(request.method || "").toUpperCase();
  var origin = header(request.headers, "origin") || request.origin || "";
  var cors = corsHeaders(origin, env);

  if (method === "OPTIONS") {
    if (!cors) return { status: 403, body: { error: "origin_not_allowed" }, headers: {} };
    return { status: 204, body: null, headers: cors };
  }
  if (method !== "POST") return { status: 405, body: { error: "use_post" }, headers: {} };
  if (!cors) return { status: 403, body: { error: "origin_not_allowed" }, headers: {} };
  if (header(request.headers, "x-mlmp-consent").toLowerCase() !== "yes") {
    return { status: 403, body: { error: "no_consent" }, headers: cors };
  }

  var body = request.body;
  var raw = typeof body === "string" ? body : JSON.stringify(body || {});
  if (raw.length > maxBytes(env)) {
    return { status: 413, body: { error: "body_too_large" }, headers: cors };
  }
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (_) {
      return { status: 400, body: { error: "body_not_json" }, headers: cors };
    }
  }
  body = body || {};

  if (schema.SLOTS.indexOf(body.slot) === -1) {
    return { status: 400, body: { error: "bad_slot" }, headers: cors };
  }

  var base64 = String(body.imageBase64 || "").replace(/^data:[^;]+;base64,/, "");
  var bytes = base64 ? Buffer.from(base64, "base64") : Buffer.alloc(0);
  if (!bytes.length) return { status: 400, body: { error: "no_image" }, headers: cors };
  if (bytes.length > maxBytes(env)) {
    return { status: 413, body: { error: "image_too_large" }, headers: cors };
  }
  var contentType = imageType(bytes);
  if (!contentType) return { status: 415, body: { error: "not_an_image" }, headers: cors };

  var state = providers.enabled(env);
  if (!state.on) {
    if (state.mode === "unconfigured") {
      return { status: 501, body: { error: "provider_not_configured" }, headers: cors };
    }
    // The kill switch. Deliberately indistinguishable from "not set up yet": a
    // caller learns the feature is unavailable and nothing about the internals.
    return { status: 503, body: { error: "unavailable" }, headers: cors };
  }

  var client = request.clientId || header(request.headers, "x-forwarded-for") || "anonymous";
  var burst = limits.allow(client, now);
  if (!burst.ok) {
    return {
      status: 429,
      body: { error: "rate_limited", retryAfter: burst.retryAfter },
      headers: Object.assign({ "Retry-After": String(burst.retryAfter) }, cors),
    };
  }
  var daily = limits.underDailyCap(dailyCap(env), now);
  if (!daily.ok) {
    return { status: 429, body: { error: "daily_cap_reached" }, headers: cors };
  }

  var output;
  try {
    output = state.provider.analyse({ slot: body.slot, bytes: bytes, contentType: contentType }, env);
  } catch (_) {
    return { status: 502, body: { error: "provider_failed" }, headers: cors };
  }
  if (output && typeof output.then === "function") {
    return Promise.resolve(output).then(function (resolved) {
      return finish(resolved);
    });
  }
  return finish(output);

  function finish(payload) {
    var verdict = schema.validate(payload);
    if (!verdict.ok) {
      // The model strayed. Nothing is shown to the farmer; the codes are kept
      // server-side in a real deployment, not returned.
      return { status: 502, body: { error: "invalid_observation" }, headers: cors };
    }
    return { status: 200, body: { ok: true, observation: payload }, headers: cors };
  }
}

module.exports = {
  respond: respond,
  imageType: imageType,
  allowedOrigins: allowedOrigins,
  schema: schema,
  providers: providers,
  limits: limits,
};
