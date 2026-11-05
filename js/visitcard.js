/**
 * The parts of the office visit card that are not one of the catalogue entries.
 *
 * The card is the output the app is judged by, so its contents are kept in a
 * small testable module rather than buried in the render function.
 *
 * Two rules run through everything here:
 *
 *   1. Nothing states a document requirement. The app cannot know one, and a
 *      farmer sent home for the wrong paper has wasted a trip. The list says
 *      what to carry if you already have it, and tells the farmer to ask what
 *      else is needed.
 *   2. Questions stay attached to the option they came from, so the farmer can
 *      ask them in the order the conversation happens.
 *
 * Interface
 *   MLMP_VISIT.documents(data)               strings, honest carry list
 *   MLMP_VISIT.soilChecks(data)              strings, soil questions
 *   MLMP_VISIT.groupQuestions(options, qs)   { byOption, general }
 */
(function () {
  "use strict";

  function hasSoilReport(data) {
    return !!(data && (data.soil === "done" || data.soil === "partial"));
  }

  function documents(data) {
    return [
      "This card, printed or on your phone.",
      hasSoilReport(data)
        ? "The soil test report you already have."
        : "No soil test yet. Ask where to get one and how long it takes.",
      "Ask the officer which papers are needed for your case. This card does not guess.",
    ];
  }

  function soilChecks(data) {
    var list = [];
    if (!hasSoilReport(data)) {
      list.push("Ask how to get a soil test for this plot, and how long the result takes.");
    } else {
      list.push("Take your soil test report and ask what it means for this option.");
    }
    list.push("Ask whether drainage, slope or soil depth matters here.");
    list.push("Ask whether one sample is enough, or the plot needs more than one.");
    return list;
  }

  /**
   * Attach each question to the option it is about. Questions with no option
   * are kept in `general` rather than dropped, because the closing question
   * about schemes and paperwork belongs to the visit, not to one crop.
   */
  function groupQuestions(options, questions) {
    var list = questions || [];
    var used = Object.create(null);
    var byOption = (options || []).map(function (option) {
      var title = option && option.activity ? option.activity.title : "";
      var mine = list.filter(function (q) {
        return q.about && q.about === title;
      });
      mine.forEach(function (q) {
        used[q.id] = true;
      });
      return { activity: option.activity, questions: mine };
    });
    var general = list.filter(function (q) {
      return !used[q.id];
    });
    return { byOption: byOption, general: general };
  }

  window.MLMP_VISIT = {
    documents: documents,
    soilChecks: soilChecks,
    groupQuestions: groupQuestions,
  };
})();
