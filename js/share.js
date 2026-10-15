/**
 * A short, plain text summary a farmer can paste into WhatsApp.
 *
 * The office visit card is the full page; this is the one-paragraph version
 * for sending to a relative, a neighbour or an officer by message. It is
 * deliberately short and carries the same honest lines as everything else:
 * the review state, the "confirm locally" instruction, and the statement
 * that it was made with a prototype, not by any department.
 *
 * It never names an amount, a deadline, an eligibility rule or a promised
 * outcome, because the app does not know any of those. It reuses the exact
 * review wording the rest of the app shows, so the message and the screen
 * can never quietly disagree about whether an officer has looked at it.
 *
 * Interface
 *   MLMP_SHARE.build(input)   the message as plain text, ready to paste
 *   MLMP_SHARE.waUrl(text)    a wa.me link that opens WhatsApp with the text
 *
 * The build function takes a plain object, not the app state, so it can be
 * tested on its own and so the message is built from data, never scraped
 * from the DOM.
 */
(function () {
  "use strict";

  // How many questions to carry. A message that lists all seven reads like a
  // wall of text on a phone and gets ignored. Five is enough to start a real
  // conversation and still fits a single screen.
  var MAX_QUESTIONS = 5;

  function trim(value) {
    return value == null ? "" : String(value).trim();
  }

  function joinPlot(input) {
    var a = input.answers || {};
    var parts = [];
    if (a.district) parts.push(a.district);
    if (a.size) {
      var size = a.size + (a.unit ? " " + a.unit : "");
      parts.push(size);
    }
    if (a.water) parts.push(a.water + " water");
    if (a.terrain) parts.push(a.terrain + " land");
    if (a.constraint) parts.push("main concern: " + a.constraint);
    return parts.join(", ");
  }

  function build(input) {
    input = input || {};
    var lines = [];

    // WhatsApp treats *word* as bold, so the reference and the plan name are
    // wrapped rather than decorated, which keeps the paste clean on any phone.
    lines.push("*My land plan*" + (input.reference ? "  " + input.reference : ""));
    if (input.planName) lines.push("Plan: " + input.planName);
    lines.push("");

    var plot = joinPlot(input);
    if (plot) lines.push(plot);
    if (input.dateLabel) lines.push("Prepared " + input.dateLabel + (input.isDemo ? " (sample journey)" : "") + ".");
    lines.push("");

    var options = input.options || [];
    if (options.length) {
      lines.push("Options to discuss:");
      options.forEach(function (o, i) {
        var mark = o.marked ? " (marked)" : "";
        lines.push((i + 1) + ". " + o.title + mark);
      });
      lines.push("");
    }

    var questions = (input.questions || []).filter(function (q) {
      return trim(q.text);
    });
    if (questions.length) {
      var shown = questions.slice(0, MAX_QUESTIONS);
      lines.push("Questions I want to ask:");
      shown.forEach(function (q, i) {
        var ticked = q.ticked ? " [done]" : "";
        lines.push((i + 1) + ". " + q.text + ticked);
      });
      if (questions.length > shown.length) {
        lines.push("(and " + (questions.length - shown.length) + " more on the printed card)");
      }
      lines.push("");
    }

    // The review line is the app's own wording, passed in, so this message
    // cannot claim a review the rest of the app does not.
    if (input.reviewText) lines.push(input.reviewText);

    if (input.confirmLine) lines.push(input.confirmLine);

    lines.push("Made with the My Land, My Plan prototype. Not an official document.");

    return lines.join("\n");
  }

  function waUrl(text) {
    return "https://wa.me/?text=" + encodeURIComponent(text || "");
  }

  window.MLMP_SHARE = {
    build: build,
    waUrl: waUrl,
    MAX_QUESTIONS: MAX_QUESTIONS,
  };
})();
