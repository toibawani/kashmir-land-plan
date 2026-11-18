/**
 * Photo observations: a closed, tiny vocabulary, and a gate in front of it.
 *
 * The temptation with a photo is to ask a model what is growing on the plot.
 * That is exactly what this app must not do: a wrong crop, a guessed soil, a
 * yield figure or a "you should plant this" would be repeated at an agriculture
 * office as if it were an official reading. So the only thing this module will
 * ever accept is a handful of neutral, visible facts with an explicit
 * "unclear" option, and a strict validator that refuses anything else.
 *
 * Nothing here calls the network. A real provider is wired in only after
 * REVIEW_PHOTO_QUESTIONS.md has been signed off by someone who knows what these
 * answers will be used for. Until then `describe()` reports that no service is
 * connected, and the mock provider exists for the eval harness, not for the
 * screen: a farmer is never shown invented observations as if they described
 * their land.
 *
 * Interface
 *   MLMP_OBSERVATIONS.SCHEMA                 the schema string in every payload
 *   MLMP_OBSERVATIONS.FIELDS                 the allowed field names and values
 *   MLMP_OBSERVATIONS.validate(payload)      pure, {ok, errors}
 *   MLMP_OBSERVATIONS.mock(slot)             a labelled sample, for the tests
 *   MLMP_OBSERVATIONS.connected()            whether an endpoint is configured
 *   MLMP_OBSERVATIONS.hasConsent()           whether this device opted in
 *   MLMP_OBSERVATIONS.setConsent(bool)       Promise-free, reports success
 *   MLMP_OBSERVATIONS.describe(slot)         Promise<{ok, reason}>
 */
(function () {
  "use strict";

  var SCHEMA = "mlmp.observation.v1";
  var CONSENT_KEY = "mlmp.observe.consent.v1";
  var PROVIDERS = ["mock"];
  var TOP_KEYS = ["schema", "provider", "mock", "createdAt", "photo", "fields", "uncertain"];

  /* Four visible things, each with an escape hatch. There is deliberately no
     crop, soil, pest, yield, price or advice field, and no free-text field at
     all, because free text is where those things come back in. */
  var FIELDS = {
    ground_cover: ["bare", "sparse", "covered", "unclear"],
    visible_water: ["none", "present", "unclear"],
    visible_structure: ["none", "present", "unclear"],
    slope_cue: ["flat", "sloped", "unclear"],
  };

  /* Named so a payload that tries to carry them fails loudly, with a message
     that says why, rather than "unexpected key". */
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

  var SLOTS = ["wide", "ground", "water"];

  function validate(payload) {
    var errors = [];
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return { ok: false, errors: ["the observation must be an object"] };
    }

    Object.keys(payload).forEach(function (key) {
      var lower = key.toLowerCase();
      if (FORBIDDEN.indexOf(lower) !== -1) {
        errors.push("forbidden field: " + key);
      } else if (TOP_KEYS.indexOf(key) === -1) {
        errors.push("unexpected field: " + key);
      }
    });

    if (payload.schema !== SCHEMA) errors.push("schema must be " + SCHEMA);
    if (PROVIDERS.indexOf(payload.provider) === -1) {
      errors.push("provider must be one of " + PROVIDERS.join(", "));
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
    } else {
      Object.keys(photo).forEach(function (key) {
        if (key !== "slot") errors.push("unexpected photo field: " + key);
      });
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

    var uncertain = payload.uncertain;
    if (!Array.isArray(uncertain)) {
      errors.push("uncertain must be a list");
    } else {
      uncertain.forEach(function (name) {
        if (Object.keys(FIELDS).indexOf(name) === -1) {
          errors.push("uncertain names a field that does not exist: " + name);
        }
      });
    }

    return { ok: errors.length === 0, errors: errors };
  }

  /**
   * A sample payload, labelled `mock: true` and saying nothing about the plot:
   * every field is "unclear". It exists so the validator and the server function
   * are exercised against the real shape, and so a reviewer can see exactly what
   * an approved provider would be allowed to return.
   */
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

  /* The endpoint is deliberately read from the page, not from a build step: an
     unconfigured build must behave exactly like this one. */
  function endpoint() {
    var value = window.MLMP_OBSERVE_ENDPOINT;
    return typeof value === "string" ? value.trim() : "";
  }

  function connected() {
    return endpoint() !== "";
  }

  function hasConsent() {
    try {
      return window.localStorage.getItem(CONSENT_KEY) === "yes";
    } catch (_) {
      return false;
    }
  }

  function setConsent(on) {
    try {
      if (on) window.localStorage.setItem(CONSENT_KEY, "yes");
      else window.localStorage.removeItem(CONSENT_KEY);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Ask for an observation. Every early return is a refusal with a reason the
   * screen can say in a sentence, and there is no path that sends a photo from
   * this build.
   */
  function describe(slot) {
    if (SLOTS.indexOf(slot) === -1) {
      return Promise.resolve({ ok: false, reason: "no_photo" });
    }
    if (!hasConsent()) {
      return Promise.resolve({ ok: false, reason: "no_consent" });
    }
    return Promise.resolve({ ok: false, reason: "not_connected" });
  }

  window.MLMP_OBSERVATIONS = {
    SCHEMA: SCHEMA,
    FIELDS: FIELDS,
    CONSENT_KEY: CONSENT_KEY,
    validate: validate,
    mock: mock,
    connected: connected,
    hasConsent: hasConsent,
    setConsent: setConsent,
    describe: describe,
  };
})();
