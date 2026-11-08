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
 * Six districts have a published list that reconciles so far. The other fourteen are not "coming later" in the interface: the card says
 * plainly that their names are not held here, and shows the official count.
 *
 * Interface
 *   MLMP_TEHSILS.forDistrict(name)  the names, or an empty array
 *   MLMP_TEHSILS.covered()         the districts with names
 *   MLMP_TEHSILS.total()           how many names are held
 *   MLMP_TEHSILS.sourceId(name)    the citation for that district's list
 */
(function () {
  "use strict";

  var TEHSILS = {
    Budgam: [
      "Budgam",
      "Beerwah",
      "Chadoora",
      "Khansahib",
      "Chrarisharief",
      "B K Pora",
      "Khag",
      "Narbal",
      "Magam",
    ],
    Kathua: [
      "Kathua",
      "Hiranagar",
      "Basohli",
      "Bani",
      "Billawar",
      "Ramkot",
      "Dinga Amb",
      "Marheen",
      "Nagri Parole",
      "Mahanpur",
      "Lohai Malhar",
    ],
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
    Poonch: ["Haveli", "Mandi", "Surankote", "Mendhar", "Mankote", "Balakote"],
    Reasi: ["Reasi", "Pouni", "Mahore", "Throo", "Arnas", "Chassana", "Katra", "Bhamag", "Thakrakote"],
    Srinagar: [
      "Central Shalteng",
      "Chanapora / Natipora",
      "Eidgah",
      "Khanyar",
      "Pantha chowk",
      "Srinagar North",
      "Srinagar South",
    ],
  };

  // Each district's list is cited to the page it came from. A district without
  // an entry here cannot be added: the build fails on an unregistered source.
  var SOURCE_BY_DISTRICT = {
    Budgam: "budgam_tehsils",
    Kathua: "kathua_tehsils",
    Kupwara: "kupwara_tehsils",
    Poonch: "poonch_tehsils",
    Reasi: "reasi_tehsils",
    Srinagar: "srinagar_tehsils",
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
    sourceId: function (name) {
      return Object.prototype.hasOwnProperty.call(SOURCE_BY_DISTRICT, name) ? SOURCE_BY_DISTRICT[name] : null;
    },
  };
})();
