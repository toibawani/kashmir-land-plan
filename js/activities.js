/**
 * Activity helpers used by the interface.
 *
 * The catalogue itself lives in js/catalogue.js so an officer can review the
 * data without reading the scoring or rendering code.
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

  function formatReview(entry) {
    if (!isReviewed(entry)) {
      return {
        status: "not-reviewed",
        text: "These suggestions have not yet been checked by an agriculture officer.",
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
    if (reviewed > 0) {
      return {
        status: "mixed",
        text:
          "Some of these suggestions have been checked and some have not. Still confirm locally before acting.",
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
