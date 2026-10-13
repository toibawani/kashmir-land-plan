/**
 * Questions worth asking at the agriculture office.
 *
 * Generated from what the farmer entered and from the options they marked, so
 * the list is about their plot rather than a generic checklist. Nothing here
 * answers anything. Every question is something to put to an officer, and the
 * wording never assumes the answer.
 *
 * This file holds no facts about crops, schemes or eligibility. It only turns
 * the answers, the catalogue entry and a weather observation into questions,
 * which is why it can be honest about things it does not know.
 *
 * Interface
 *   MLMP_QUESTIONS.forPlan(data, options, opts) -> [{ id, kind, text, about }]
 *     data    the answers object the app already stores
 *     options [{ activity, reasons }] as returned by the scoring, already
 *             narrowed to the options the farmer marked if any
 *     opts    { zone, timingHint, max }
 */
(function () {
  "use strict";

  var WATER_PHRASE = {
    reliable: "reliable water",
    seasonal: "water that is only seasonal",
    limited: "very limited water",
    unknown: "water I am not sure about",
  };

  var TERRAIN_PHRASE = {
    flat: "flat ground",
    sloped: "sloped ground",
    unknown: "ground I have not described",
  };

  /** Everyday wording for the titles, which read better mid-sentence lowercase. */
  function titleOf(option) {
    var t = option && option.activity ? option.activity.title : "";
    if (!t) return "";
    return t.charAt(0).toLowerCase() + t.slice(1);
  }

  function sizePhrase(data) {
    if (!data || !data.size) return "my plot";
    return "about " + data.size + " " + (data.unit || "kanal");
  }

  function waterPhrase(data) {
    return WATER_PHRASE[(data && data.water) || ""] || "the water I have";
  }

  function terrainPhrase(data) {
    return TERRAIN_PHRASE[(data && data.terrain) || ""] || "my ground";
  }

  function placePhrase(data) {
    return (data && data.district) || "my district";
  }

  function hasScheme(option, id) {
    var list = option && option.activity && option.activity.schemes;
    return !!list && list.indexOf(id) !== -1;
  }

  function needsWater(option, data) {
    var need = option && option.activity ? option.activity.waterNeed : null;
    var userWater = (data && data.water) || "";
    if (userWater === "limited" || userWater === "seasonal") return need !== "low" && need !== "varies";
    return need === "high";
  }

  /**
   * Build the list. Framing questions and one question per option are kept,
   * along with a closing question about schemes and paperwork. Everything else
   * competes for the remaining slots on priority.
   */
  function forPlan(data, options, opts) {
    opts = opts || {};
    var max = opts.max || 7;
    var chosen = (options || []).slice();
    var hint = opts.timingHint || null;
    var zone = opts.zone || null;
    var seen = Object.create(null);

    var required = [];
    var optional = [];
    var closing = [];

    function make(id, kind, text, about) {
      return { id: id, kind: kind, text: text, about: about || null };
    }

    function unique(bucket, question) {
      if (seen[question.id]) return;
      seen[question.id] = true;
      bucket.push(question);
    }

    var lead = chosen[0];
    var leadTitle = titleOf(lead);

    // The question the whole visit is really about.
    if (leadTitle) {
      unique(
        required,
        make(
          "framing",
          "suitability",
          "On " +
            sizePhrase(data) +
            " in " +
            placePhrase(data) +
            ", with " +
            waterPhrase(data) +
            " and " +
            terrainPhrase(data) +
            ", is " +
            leadTitle +
            " realistic to start with, or is the plot better suited to something else?",
          lead.activity.title
        )
      );
    }

    // One question per option, aimed at whatever that option asks most of.
    chosen.forEach(function (option) {
      var title = titleOf(option);
      if (!title) return;
      if (needsWater(option, data)) {
        unique(
          required,
          make(
            "water:" + option.activity.id,
            "water",
            "How much water does " +
              title +
              " need at the stage where it matters most, and what would you do if my supply ran short at that point?",
            option.activity.title
          )
        );
        return;
      }
      if (option.activity.firstReturns === "multi-year") {
        unique(
          required,
          make(
            "wait:" + option.activity.id,
            "patience",
            "If I plant " +
              title +
              ", how many seasons before there is anything to sell, and what would the work and cost be in those years?",
            option.activity.title
          )
        );
        return;
      }
      if (option.activity.cost === "high") {
        unique(
          required,
          make(
            "cost:" + option.activity.id,
            "cost",
            "What would " +
              title +
              " cost to set up and run for the first year, and which of those costs are usually underestimated?",
            option.activity.title
          )
        );
        return;
      }
      unique(
        required,
        make(
          "start:" + option.activity.id,
          "first season",
          "What would the first season of " +
            title +
            " actually involve on a plot like mine, month by month, and what would I need before I start?",
          option.activity.title
        )
      );
    });

    // Choosing between options. Kept in the optional pool rather than the
    // required one, so that when several options each raise a question of their
    // own this still competes for a slot instead of pushing the others out.
    // It sits first because with more than one option it is the question the
    // visit is really about.
    if (chosen.length > 1) {
      unique(
        optional,
        make(
          "choice",
          "choice",
          "If I can only start one of these this year, which would you start with, and what makes it the better first step on this plot?",
          null
        )
      );
    }

    // The forecast, offered as something to ask about rather than act on. It is
    // near the top because it goes stale within days, unlike the rest.
    if (hint && leadTitle) {
      var fact =
        hint.kind === "rain"
          ? "Rain looks likely around " + hint.dayLabel + ", with about " + hint.value + "% chance for the nearest town"
          : hint.kind === "cold"
            ? "Night temperatures near " + hint.placeName + " are forecast close to " + hint.value + hint.unit
            : "Daytime temperatures near " + hint.placeName + " are forecast close to " + hint.value + hint.unit;
      unique(
        optional,
        make(
          "timing",
          "timing",
          fact +
            ". Does that change when I should start " +
            leadTitle +
            ", or how I prepare the ground? The forecast is for a town, not for my field."
        )
      );
    }

    // Soil, which the app cannot interpret.
    if (data && data.soil === "none") {
      unique(
        optional,
        make(
          "soil",
          "soil",
          "How do I arrange a soil test for this plot, how long does the result take, and what should I ask them to check?"
        )
      );
    } else {
      unique(
        optional,
        make(
          "soil-report",
          "soil",
          "I have a soil test report with me. Reading it for this plot, does it support the option we discussed, or does it point somewhere else?"
        )
      );
    }

    // Cost, which is the constraint people most often name.
    unique(
      optional,
      make(
        "cost-detail",
        "cost",
        "What is the smallest version of this that still makes sense, and could it be done in stages rather than all at once?"
      )
    );

    // Training, wherever the catalogue says training is part of the picture.
    if (chosen.some(function (o) { return hasScheme(o, "training"); })) {
      unique(
        optional,
        make(
          "training",
          "training",
          "Is there training near " +
            placePhrase(data) +
            " for this, who runs it, and when is the next batch likely to start?"
        )
      );
    }

    // Selling, where an option produces something that has to be sold.
    if (chosen.some(function (o) { return hasScheme(o, "market"); })) {
      unique(
        optional,
        make(
          "market",
          "market",
          "Who buys this near me, what quality and packing do they expect, and is there a cooperative or group I could sell through instead?"
        )
      );
    }

    // Water in general, when no single option question already covered it.
    var anyWaterQuestion = required.some(function (q) { return q.kind === "water"; });
    if (!anyWaterQuestion && data && (data.water === "limited" || data.water === "seasonal")) {
      unique(
        optional,
        make(
          "water-general",
          "water",
          "With " +
            waterPhrase(data) +
            ", what is the realistic way to water this plot, and what would a dry spell cost me if it came at the wrong time?"
        )
      );
    }

    // Elevation and zone, where the district genuinely spans more than one.
    var spans = chosen.some(function (o) {
      return o.activity.districtNotes && o.activity.districtNotes[placePhrase(data)];
    });
    if (spans || (zone && zone.elevationBand)) {
      unique(
        optional,
        make(
          "elevation",
          "elevation",
          "This district covers more than one kind of ground. At my elevation, does this behave differently from the district as a whole?"
        )
      );
    }

    // Ask for the documents rather than guessing them, and always close on it.
    // The paperwork is folded into the same question so that closing the list
    // costs one slot rather than two, which keeps room for the middle.
    unique(
      closing,
      make(
        "scheme",
        "schemes",
        "Which current schemes apply to a plot like mine for " +
          (leadTitle || "this") +
          ", what should I bring when I apply, and does anything about my land records or tenancy affect it?"
      )
    );

    // Fill the middle while leaving room for the closing questions. The order
    // the optional questions were added above is their priority, so no sort is
    // needed and the intent stays readable.
    var room = Math.max(0, max - required.length - closing.length);
    optional.slice(0, room).forEach(function (q) {
      required.push(q);
    });
    closing.forEach(function (q) {
      required.push(q);
    });

    return required.slice(0, max);
  }

  window.MLMP_QUESTIONS = {
    forPlan: forPlan,
  };
})();
