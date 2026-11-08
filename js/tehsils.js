/**
 * Tehsil names, one district at a time.
 *
 * The counts come from the official district table already in `js/land.js`. The
 * names come from each district administration's own page, which is the only
 * public source that publishes them. A district is added here only when its
 * list is counted against `LAND.admin(name).tehsils` and matches: a district
 * whose page lists a different number is left out rather than trimmed to fit,
 * because a farmer sent to the wrong tehsil office loses a day.
 *
 * Kupwara is the only district whose published list has been checked so far.
 * The other nineteen are not "coming later" in the interface: the card says
 * plainly that their names are not held here, and shows the official count.
 *
 * Interface
 *   MLMP_TEHSILS.forDistrict(name)  the names, or an empty array
 *   MLMP_TEHSILS.covered()         the districts with names
 *   MLMP_TEHSILS.total()           how many names are held
 *   MLMP_TEHSILS.sourceId()        the citation for every row here
 */
(function () {
  "use strict";

  var TEHSILS = {
    Kupwara: [
      "Kupwara",
      "Handwara",
      "Karnah",
      "Keran",
      "Kralpora",
      "Trehgam",
      "Machil",
      "Drugmulla",
      "Ramhal",
      "Qaziabad",
      "Langate",
      "Zachaldara",
      "Lolab",
      "Lalpora",
      "Villgam",
      "Kalamabad",
    ],
  };

  function forDistrict(name) {
    return Object.prototype.hasOwnProperty.call(TEHSILS, name) ? TEHSILS[name].slice() : [];
  }

  function covered() {
    return Object.keys(TEHSILS);
  }

  function total() {
    return covered().reduce(function (sum, name) {
      return sum + TEHSILS[name].length;
    }, 0);
  }

  window.MLMP_TEHSILS = {
    forDistrict: forDistrict,
    covered: covered,
    total: total,
    sourceId: function () {
      return "kupwara_tehsils";
    },
  };
})();
