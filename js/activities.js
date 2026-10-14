/**
 * Activity helpers used by the interface.
 *
 * The catalogue itself lives in js/catalogue.js, kept readable on its own
 * apart from the scoring or rendering code.
 */
(function () {
  "use strict";

  var CATALOGUE = window.MLMP_CATALOGUE;
  if (!CATALOGUE) {
    throw new Error("js/catalogue.js must load before js/activities.js");
  }

  function isReviewed(entry) {
    return !!(entry && entry.reviewStatus === "reviewed" && entry.reviewedBy);
  }

  // The exact words below matter, because they are shown word for word on the
  // results screen, the plan summary, the office visit card and its plain
  // text download, and they are read out by the reading voice. Every state
  // keeps a sentence that tells the farmer to confirm locally before acting,
  // and a review must never remove that sentence. A review adds trust, it
  // never turns an illustrative suggestion into an instruction.
  function formatReview(entry) {
    if (!isReviewed(entry)) {
      return {
        status: "not-reviewed",
        text:
          "Not yet reviewed by an agriculture officer. Treat every suggestion " +
          "as a question to discuss, not as advice to act on. " +
          "Always confirm locally before acting.",
      };
    }
    var parts = [entry.reviewedBy];
    if (entry.designation) parts.push(entry.designation);
    var who = parts.join(", ");
    var when = entry.reviewedOn ? " on " + entry.reviewedOn : "";
    return {
      status: "reviewed",
      text:
        "Reviewed by " +
        who +
        when +
        ". Still confirm locally before acting.",
    };
  }

  /**
   * Prefer a whole-catalogue review. If that is still not-reviewed, look at
   * the activities actually shown so a partial review can still be stated.
   */
  function reviewFor(activities) {
    var catalogue = formatReview(CATALOGUE.review);
    if (catalogue.status === "reviewed") return catalogue;
    var list = activities || [];
    if (!list.length) return catalogue;
    var reviewed = 0;
    list.forEach(function (a) {
      if (isReviewed(a)) reviewed += 1;
    });
    if (reviewed === list.length) {
      return formatReview(list[0]);
    }
    // Half-reviewed is told plainly as half-reviewed. Mixing a reviewed entry
    // with unreviewed ones must never look fully approved, so the wording
    // names the split and keeps the same standing instruction to confirm.
    if (reviewed > 0) {
      return {
        status: "mixed",
        text:
          "Some of these suggestions have been reviewed by an agriculture officer and some have not. " +
          "Treat the unreviewed ones like questions to discuss. " +
          "Always confirm locally before acting.",
      };
    }
    return catalogue;
  }

  window.MLMP_ACTIVITIES = {
    ALL: CATALOGUE.activities,
    PHASES: CATALOGUE.phases,
    MONTHS: CATALOGUE.months,
    ids: CATALOGUE.ids,
    review: CATALOGUE.review,
    confirmationLine: CATALOGUE.confirmationLine,
    reviewFor: reviewFor,
    formatReview: formatReview,
    isReviewed: isReviewed,
  };
})();
