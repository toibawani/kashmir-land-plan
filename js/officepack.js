/**
 * The office pack: one plain-text page that holds everything a farmer needs
 * for a visit to an agriculture office.
 *
 * It is deliberately a separate module from the visit card rather than a
 * second renderer inside the app. The card is laid out for paper and for the
 * screen; this is the message that gets pasted into WhatsApp or read out at a
 * counter. Keeping the builder pure means the tests can call it with a plain
 * object and check the words that leave the phone, without starting a browser.
 *
 * What is inside is fixed, and each part exists for a reason:
 *   - the reference code, so a printed page and a message name the same plan
 *   - the plot answers, so the officer does not have to ask for them again
 *   - the marked options, each labelled as an option to discuss
 *   - the questions to ask, with the ones already covered ticked
 *   - the review state, in the app's own words, not softened for a message
 *   - what to expect at the office, which the app can describe in general terms
 *   - the confirm-locally line, so no message can read as a decision
 *
 * It never contains an amount, a deadline, an eligibility rule, a document
 * list or a promised outcome, because the app does not know any of those. The
 * wording of the review line and the confirm line is passed in from the app,
 * so the message cannot claim a review the screen does not show.
 *
 * Interface
 *   MLMP_OFFICEPACK.build(input)   the pack as plain text
 *   MLMP_OFFICEPACK.HEADING        the name used on screen and in the text
 */
(function () {
  "use strict";

  var HEADING = "Office pack";

  // Used only when the caller does not pass the app's own line. The self test
  // asserts this is identical to the catalogue line, so the two cannot drift
  // apart and quietly disagree about what a farmer should confirm.
  var CONFIRM_FALLBACK =
    "Confirm suitability, costs and current scheme rules with your local agriculture office or Kisan Khidmat Ghar before acting.";

  var FOOTER = "Made with the My Land, My Plan prototype. Not an official document.";
  var REFERENCE_NOTE =
    "The reference code names this plan on this phone. It opens nothing and looks up nothing.";

  // A message that lists every option and every question becomes a wall of
  // text on a phone and gets ignored. Three and seven match the card, so the
  // message and the printout describe the same shortlist.
  var MAX_OPTIONS = 3;
  var MAX_QUESTIONS = 7;

  function text(value) {
    return value == null ? "" : String(value).trim();
  }

  function or(value, fallback) {
    var v = text(value);
    return v || fallback;
  }

  function rule() {
    return "------------------------------";
  }

  function pushHeading(lines, title) {
    lines.push(title);
    lines.push(rule());
  }

  function build(input) {
    try {
      return buildUnsafe(input || {});
    } catch (_) {
      // A message that fails to build must still say the two things that
      // matter: this is a prototype, and suitability is confirmed locally.
      return (
        HEADING +
        "\n" +
        CONFIRM_FALLBACK +
        "\n" +
        FOOTER
      );
    }
  }

  function buildUnsafe(input) {
    var a = input.answers || {};
    var options = Array.isArray(input.options) ? input.options.slice(0, MAX_OPTIONS) : [];
    var questions = Array.isArray(input.questions) ? input.questions.slice(0, MAX_QUESTIONS) : [];
    var expectations = Array.isArray(input.expectations) ? input.expectations : [];
    var lines = [];

    lines.push(HEADING.toUpperCase());
    lines.push("My Land, My Plan");
    lines.push("==============================");
    lines.push("");
    lines.push("Plan reference: " + or(input.reference, "not assigned"));
    if (text(input.planName)) lines.push("Plan name: " + text(input.planName));
    lines.push(
      "Prepared " +
        or(input.dateLabel, "today") +
        (input.isDemo ? " from the sample journey" : "") +
        "."
    );
    lines.push("");

    // The review state goes near the top, before anything that could be read
    // as approval. A message forwarded to a relative must carry it too.
    if (text(input.reviewText)) {
      pushHeading(lines, "OFFICER REVIEW");
      lines.push(text(input.reviewText));
      lines.push("");
    }

    pushHeading(lines, "THE PLOT");
    lines.push("District: " + or(a.district, "not given"));
    lines.push("Village or locality: " + or(a.village, "not given"));
    lines.push("Approximate size: " + or(a.size, "not given") + (text(a.unit) ? " " + text(a.unit) : ""));
    lines.push("Currently: " + or(a.landUse, "not given"));
    lines.push("Water access: " + or(a.water, "not given"));
    lines.push("Terrain: " + or(a.terrain, "not given"));
    lines.push("Soil test: " + or(a.soil, "not given"));
    lines.push("Main constraint: " + or(a.constraint, "not given"));
    lines.push("");

    pushHeading(lines, "OPTIONS TO DISCUSS");
    if (options.length) {
      options.forEach(function (option, i) {
        var title = or(option && option.title, "an option");
        lines.push(i + 1 + ". " + title + (option && option.marked ? "   [marked to follow up]" : ""));
        lines.push("   An option to discuss, not a recommendation.");
      });
      if (input.optionNote) lines.push(input.optionNote);
    } else {
      lines.push("No options were marked or shown.");
    }
    lines.push("");

    pushHeading(lines, "QUESTIONS TO ASK");
    if (questions.length) {
      questions.forEach(function (question, i) {
        var q = question || {};
        lines.push(i + 1 + ". [" + (q.ticked ? "x" : " ") + "] " + or(q.text, "a question for the officer"));
      });
      var covered = questions.filter(function (q) {
        return !!(q && q.ticked);
      }).length;
      lines.push(covered + " of " + questions.length + " covered so far.");
    } else {
      lines.push("No questions were generated.");
    }
    lines.push("");

    if (expectations.length) {
      pushHeading(lines, "WHAT TO EXPECT AT THE OFFICE");
      expectations.forEach(function (item, i) {
        lines.push(i + 1 + ". " + text(item));
      });
      if (text(input.expectationsClosing)) {
        lines.push("");
        lines.push(text(input.expectationsClosing));
      }
      lines.push("");
    }

    pushHeading(lines, "BEFORE YOU ACT");
    lines.push(or(input.confirmLine, CONFIRM_FALLBACK));
    lines.push("");
    lines.push(REFERENCE_NOTE);
    lines.push(FOOTER);

    return lines.join("\n");
  }

  window.MLMP_OFFICEPACK = {
    HEADING: HEADING,
    build: build,
    MAX_OPTIONS: MAX_OPTIONS,
    MAX_QUESTIONS: MAX_QUESTIONS,
    CONFIRM_FALLBACK: CONFIRM_FALLBACK,
  };
})();
