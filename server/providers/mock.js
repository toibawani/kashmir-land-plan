/**
 * The mock provider. The only provider that is enabled, and it cannot see.
 *
 * It returns every field as "unclear" because there is no model behind it: the
 * point is to exercise the whole path (request, limits, validation, screen)
 * without a photo ever leaving the device. A farmer never sees this output,
 * because the shipped build has no endpoint configured.
 *
 * `OBSERVE_MOCK_BREAK=1` makes it return a payload that carries a crop and an
 * advice sentence. That is a test switch, not a mode: the eval harness uses it
 * to prove the validator refuses a model that strays, and the response is a
 * 502 rather than a screen.
 */
"use strict";

var schema = require("../schema.js");

function analyse(input, env) {
  env = env || {};
  if (env.OBSERVE_MOCK_BREAK === "1") {
    return {
      schema: schema.SCHEMA,
      provider: "mock",
      mock: true,
      createdAt: new Date().toISOString(),
      photo: { slot: (input && input.slot) || "wide" },
      fields: {
        ground_cover: "covered",
        visible_water: "present",
        visible_structure: "none",
        slope_cue: "flat",
      },
      uncertain: [],
      crop: "apple",
      advice: "Plant apples here next spring.",
    };
  }
  var fields = {};
  var names = Object.keys(schema.FIELDS);
  names.forEach(function (name) {
    fields[name] = "unclear";
  });
  return {
    schema: schema.SCHEMA,
    provider: "mock",
    mock: true,
    createdAt: new Date().toISOString(),
    photo: { slot: (input && input.slot) || "wide" },
    fields: fields,
    uncertain: names.slice(),
  };
}

module.exports = {
  name: "mock",
  // Metadata a real adapter would use to describe itself to the orchestrator.
  model: "none",
  canSeeImages: false,
  analyse: analyse,
};
