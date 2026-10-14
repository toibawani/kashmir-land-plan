/**
 * What a farmer can reasonably expect at a public agriculture office.
 *
 * This is deliberately thin, and honest about being thin. It is common
 * public knowledge, written down so the app can be specific about the shape
 * of a visit without ever inventing a figure, a deadline, a list of documents
 * or a promise about a scheme. Those are exactly the things that change from
 * district to district and year to year, so this module names none of them,
 * and says plainly that the office decides.
 *
 * The point is not to explain a government office to a farmer. It is to set
 * expectations so a visit does not feel like a test the farmer failed. Every
 * line is either something the farmer can do, or a plain statement that the
 * app cannot know. No line tells the farmer what the office will give them.
 *
 * Interface
 *   MLMP_OFFICE.items()          the numbered expectations, as plain sentences
 *   MLMP_OFFICE.closing()        the honesty line under the list
 *   MLMP_OFFICE.heading()        the panel heading
 *   MLMP_OFFICE.panelHtml()      the panel for the visit card screen
 *   MLMP_OFFICE.plainText()      the same thing as text, for reading aloud
 */
(function () {
  "use strict";

  var HEADING = "What to expect at the office";

  // Each item is one thing a farmer can do or one plain truth. Written as
  // sentences, not bullet jargon, and none of them contains a number the app
  // would be standing behind, because it would be guessing.
  var ITEMS = [
    "The officer will usually ask which district and village the plot is in, and roughly how big it is. That is already at the top of your card.",
    "Bring any soil test report you already have. If you do not have one, you can ask where the nearest soil testing is done.",
    "You may be pointed to a nearby centre for seeds, saplings or training. What is offered, and when it is open, changes from place to place, so ask on the day rather than assuming.",
    "You can ask the officer to write down the name of any scheme or department, so you can follow it up afterwards.",
    "Counter time can be short. Having your questions on one page helps you cover the ones that matter most to you first.",
  ];

  // The closing line is the load-bearing one. It repeats, in the same breath
  // as the reassurance, that this app promises nothing about a scheme.
  var CLOSING =
    "This describes steps that are common at public agriculture offices. It is not a promise of what any particular office will do, and it names no amounts, deadlines or eligibility rules, because those change and are set by the department.";

  function items() {
    return ITEMS.slice();
  }

  function closing() {
    return CLOSING;
  }

  function heading() {
    return HEADING;
  }

  function screen() {
    return ITEMS.map(function (text) {
      return "<li>" + text + "</li>";
    }).join("");
  }

  function panelHtml() {
    return (
      '<section class="office-panel" id="visit-office" aria-labelledby="visit-office-title">' +
      '<h2 id="visit-office-title">' + HEADING + "</h2>" +
      '<ol class="office-list">' +
      screen() +
      "</ol>" +
      '<p class="office-closing">' + CLOSING + "</p>" +
      "</section>"
    );
  }

  function plainText() {
    return HEADING + ".\n" + ITEMS.map(function (t, i) { return i + 1 + ". " + t; }).join("\n") + "\n" + CLOSING;
  }

  window.MLMP_OFFICE = {
    items: items,
    closing: closing,
    heading: heading,
    panelHtml: panelHtml,
    plainText: plainText,
  };
})();
