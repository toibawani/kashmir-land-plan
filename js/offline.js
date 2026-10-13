/**
 * What still works with no signal, and what does not.
 *
 * A farmer in the valley loses signal often, and the honest question at that
 * moment is not "is this app broken" but "what can I still do". This module
 * holds the answer in one place so the wording never drifts between the home
 * page, the weather screen and the office visit card.
 *
 * The list is deliberately split in two, because the useful half is the one
 * that still works. Weather is the only part that needs a connection, and it
 * is never cached as if it were current, so offline the app says it cannot
 * reach the service rather than showing a stale temperature as though it were
 * live. Everything else runs from files already on the phone.
 *
 * Interface
 *   MLMP_OFFLINE.isOffline()               true when the device has no connection
 *   MLMP_OFFLINE.whatWorks()               the list that needs no signal
 *   MLMP_OFFLINE.whatNeeds()               the short list that does
 *   MLMP_OFFLINE.notice(isOffline)         one sentence, right for the moment
 *   MLMP_OFFLINE.panelHtml(isOffline)      the panel for the home page
 */
(function () {
  "use strict";

  /**
   * navigator.onLine is a hint, not a promise. It reports false when the
   * device has no connection at all, which is exactly the case worth saying
   * something about, and it can report true on a captive network where nothing
   * loads. So it is treated as a signal to be reassuring rather than a fact to
   * hang a block on: nothing here hides a feature, it only explains one.
   */
  function isOffline() {
    return typeof navigator !== "undefined" && navigator.onLine === false;
  }

  // Each entry is what a farmer actually does, not a technical label. The
  // wording is checked by the self test so it can never quietly promise
  // something the app does not do.
  var WORKS = [
    "Fill in your plot details",
    "See the options for your plot",
    "Read the typical year for each option",
    "Compare the options side by side",
    "Get the questions to ask at the office",
    "Make and print the office visit card",
    "Save, rename and reopen your plans",
    "Read the plan aloud, where the phone has a voice",
  ];

  var NEEDS = [
    {
      what: "The weather forecast",
      why: "It is fetched live for a nearby town. It is never saved as though it were current, so with no connection this app says so instead of showing an old reading as live.",
    },
  ];

  /** One sentence for the strip at the top of the page. */
  function notice(offline) {
    if (offline) {
      return (
        "You are offline. The land plan still works on this device: " +
        "your answers, the options, the questions and the visit card. " +
        "Weather is the only part that needs a connection, and it is not saved as current."
      );
    }
    return (
      "Once this page has loaded, the land plan works with no connection. " +
      "Weather is the only part that needs the internet."
    );
  }

  /**
   * The panel. It names both halves plainly, because a farmer who knows what
   * will not work stops hunting for a fault. The tone stays the same in both
   * states, so the panel does not feel like an error message when it appears.
   */
  function panelHtml(offline) {
    var state = offline ? "You are offline right now." : "This works with no signal.";
    var works = WORKS.map(function (item) {
      return "<li>" + item + "</li>";
    }).join("");
    var needs = NEEDS.map(function (item) {
      return (
        "<li><strong>" +
        item.what +
        "</strong> " +
        item.why +
        "</li>"
      );
    }).join("");

    return (
      '<div class="offline-panel' +
      (offline ? " is-offline" : "") +
      '" id="offline-panel">' +
      '<p class="offline-panel-state" role="status">' +
      state +
      "</p>" +
      '<div class="offline-panel-cols">' +
      '<div class="offline-panel-col">' +
      '<h3>Works without a connection</h3>' +
      '<ul class="offline-works">' +
      works +
      "</ul>" +
      "</div>" +
      '<div class="offline-panel-col">' +
      "<h3>Needs a connection</h3>" +
      '<ul class="offline-needs">' +
      needs +
      "</ul>" +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  window.MLMP_OFFLINE = {
    isOffline: isOffline,
    whatWorks: function () {
      return WORKS.slice();
    },
    whatNeeds: function () {
      return NEEDS.slice();
    },
    notice: notice,
    panelHtml: panelHtml,
  };
})();
