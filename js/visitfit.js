/**
 * Keep the office visit card to one page when it is printed.
 *
 * The card carries a lot: what the farmer entered, up to three options, up to
 * seven questions, a support list, the review banner and a ruled area. On a
 * small phone all of that is fine, but on paper it can spill past the first
 * sheet, and a question cut in half by a page break is worse than no page at
 * all.
 *
 * The honest way to guarantee one page is to measure the card as the browser
 * would lay it out for paper, and if it is too tall, drop the least important
 * pieces in a known order until it fits. Nothing the farmer wrote is ever
 * dropped: the answers, the options, the questions and the review wording
 * always print. What can give way is the ruled notes area and the support
 * list, because the support list is a starting point for a conversation and
 * the notes are literally blank space.
 *
 * The trimming happens just before printing and is undone just after, so the
 * on-screen card is untouched and a farmer reading it on the phone still sees
 * everything.
 *
 * Interface
 *   MLMP_FIT.calculateFit()     decide which parts to drop for the current card
 *   MLMP_FIT.applyFit(drop)     set the trim markers on the live card
 *   MLMP_FIT.clearFit()         undo them
 *   MLMP_FIT.prepareForPrint()  measure, trim if needed, print, then restore
 *   MLMP_FIT.printableHeightPx  the printable height, for the self test
 *   MLMP_FIT.TRIM_ORDER         the parts, cheapest to lose first
 */
(function () {
  "use strict";

  // A4 is 297mm tall. With 12mm top and bottom margins that leaves 273mm of
  // printable height. The measurement is done in CSS pixels and converted, so
  // the check does not depend on a fixed pixel number.
  var MM_PER_INCH = 25.4;
  var CSS_PER_INCH = 96;
  var PAGE_MARGIN_MM = 24; // matches the @page margin in the stylesheet

  function printableHeightPx() {
    var mm = 297 - PAGE_MARGIN_MM;
    return Math.round((mm / MM_PER_INCH) * CSS_PER_INCH);
  }

  // The parts, cheapest to give up first. Each name maps to a data-fit-part
  // marker on the card. The order is deliberate: blank ruled space goes before
  // a list of places to ask, and the farmer's own answers are never here.
  var TRIM_ORDER = ["notes", "support"];

  function cardEl() {
    return document.getElementById("visit-card");
  }

  function cardHeight() {
    var card = cardEl();
    return card ? card.scrollHeight : 0;
  }

  /**
   * Measure the card at its printed width. The live card is narrower than a
   * printed page on a phone, and a narrower card is taller, so measuring the
   * live card would overestimate. The card is temporarily given the printable
   * width, measured, and put back in the same tick, so nothing the farmer is
   * looking at ever moves. When matchMedia already reports print, the card is
   * already at that width and no swap is needed.
   */
  function measureAtPrintWidth() {
    var card = cardEl();
    if (!card) return 0;
    var inPrint = window.matchMedia && window.matchMedia("print").matches;
    if (inPrint) return card.scrollHeight;

    var prevWidth = card.style.width;
    var prevPosition = card.style.position;
    var prevLeft = card.style.left;
    var printWidthPx = Math.round(((210 - PAGE_MARGIN_MM) / MM_PER_INCH) * CSS_PER_INCH);
    // Held off-screen and out of the flow, so the measurement cannot shift
    // anything on screen for even a frame the eye can catch.
    card.style.position = "absolute";
    card.style.left = "-10000px";
    card.style.width = printWidthPx + "px";
    var height = card.scrollHeight;
    card.style.width = prevWidth;
    card.style.position = prevPosition;
    card.style.left = prevLeft;
    return height;
  }

  function setTrim(part, on) {
    var card = cardEl();
    if (!card) return;
    var el = card.querySelector('[data-fit-part="' + part + '"]');
    if (!el) return;
    el.setAttribute("data-fit-trim", on ? "1" : "0");
  }

  function setAllTrim(on) {
    var card = cardEl();
    if (!card) return;
    var parts = card.querySelectorAll("[data-fit-part]");
    for (var i = 0; i < parts.length; i++) {
      parts[i].setAttribute("data-fit-trim", on ? "1" : "0");
    }
  }

  /**
   * Decide what to drop, and drop it. The first measurement is taken at the
   * true printed width, because a narrower on-screen card is taller and would
   * overestimate. If it already fits, nothing is trimmed. Otherwise the parts
   * are dropped one at a time, cheapest first, re-measuring after each, and the
   * process stops the moment the card fits. So a card that only needs the
   * notes gone never also loses its support list, and every part left trimmed
   * is one the card genuinely cannot fit without. The returned list is exactly
   * the set left hidden, ready for applyFit before printing.
   */
  function calculateFit() {
    var limit = printableHeightPx();
    setAllTrim(false);
    if (measureAtPrintWidth() <= limit) return [];
    var drop = [];
    for (var i = 0; i < TRIM_ORDER.length; i++) {
      var part = TRIM_ORDER[i];
      setTrim(part, true);
      drop.push(part);
      if (measureAtPrintWidth() <= limit) break;
    }
    return drop;
  }

  function applyFit(drop) {
    (drop || []).forEach(function (part) {
      setTrim(part, true);
    });
  }

  function clearFit() {
    var card = cardEl();
    if (!card) return;
    var parts = card.querySelectorAll("[data-fit-part]");
    for (var i = 0; i < parts.length; i++) {
      parts[i].setAttribute("data-fit-trim", "0");
    }
  }

  /**
   * Trim if needed, print, then put everything back. The restore runs on
   * afterprint rather than straight after window.print(), because print()
   * blocks until the dialog closes in some browsers and returns immediately in
   * others, and only afterprint is dependable in both.
   */
  function prepareForPrint() {
    var dropped = calculateFit();
    if (!dropped.length) return;
    // Two signals, because neither is dependable alone. afterprint is missing
    // or unreliable in older Safari, and the print media query is the one that
    // works everywhere: it flips to true as the dialog opens and back to false
    // as it closes. Whichever arrives first puts the card back, and clearFit is
    // idempotent so the second is free. Both listeners remove themselves so a
    // farmer who prints several cards does not leave them piling up.
    var media = window.matchMedia ? window.matchMedia("print") : null;
    function restore() {
      clearFit();
      window.removeEventListener("afterprint", restore);
      if (media) {
        if (media.removeEventListener) media.removeEventListener("change", onMedia);
        else if (media.removeListener) media.removeListener(onMedia);
      }
    }
    function onMedia(m) {
      // Only the closing edge matters. Entering print keeps the trim in place;
      // leaving it is what must put the notes and support list back.
      if (!m.matches) restore();
    }
    window.addEventListener("afterprint", restore);
    if (media) {
      if (media.addEventListener) media.addEventListener("change", onMedia);
      else if (media.addListener) media.addListener(onMedia);
    }
  }

  window.MLMP_FIT = {
    printableHeightPx: printableHeightPx,
    calculateFit: calculateFit,
    applyFit: applyFit,
    clearFit: clearFit,
    prepareForPrint: prepareForPrint,
    TRIM_ORDER: TRIM_ORDER.slice(),
  };
})();
