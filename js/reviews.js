/**
 * Officer review records, kept apart from the catalogue prose.
 *
 * This file is the only thing `tools/import-review.js` rewrites. It is
 * generated data: edit the CSV and run the import, not this file by hand.
 *
 * Shape
 *   catalogue  one record for the whole activity list, or null
 *   entries    one record per activity id
 *
 * A record is only honoured when reviewStatus is "reviewed" AND it carries
 * the officer's name, their office and a YYYY-MM-DD date. The catalogue
 * validates every record on load and downgrades anything incomplete to
 * not-reviewed, so a half-recorded review can never be shown as a review.
 */
(function () {
  "use strict";

  window.MLMP_REVIEWS = {
    catalogue: null,
    entries: {},
  };
})();
