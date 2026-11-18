/**
 * The one observation format, server side.
 *
 * The browser keeps its own copy in `js/observations.js` because it is loaded
 * as a plain script. Both copies are written out in full on purpose: the
 * promise is that the same payloads pass on both sides, and
 * `tools/eval-photos.js` tries every forbidden case against both and fails if
 * they disagree.
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

var OUTPUT_CONTRACT =
  "Return only JSON with schema, provider and mock, a photo object with slot, a " +
  "fields object containing exactly ground_cover, visible_water, " +
  "visible_structure and slope_cue, and an uncertain list. Use only the listed " +
  "values and prefer unclear. Do not name a crop, soil type, pest, disease or " +
  "yield, do not estimate income, and do not give advice or any prose.";

function validate(payload) {
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
    errors.push("provider must be mock: no real provider has been approved");
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
  } else if (
    Object.keys(photo).some(function (key) {
      return key !== "slot";
    })
  ) {
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

module.exports = {
  SCHEMA: SCHEMA,
  SLOTS: SLOTS,
  FIELDS: FIELDS,
  FORBIDDEN: FORBIDDEN,
  OUTPUT_CONTRACT: OUTPUT_CONTRACT,
  validate: validate,
};
