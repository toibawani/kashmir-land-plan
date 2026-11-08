/**
 * Tehsil names, one district at a time.
 *
 * The counts come from the official district table already in `js/land.js`. The
 * names come from each district administration's own page, or, where that page
 * publishes no name column, from the Revenue Department's patwar halqa table.
 * A district is added here only when its list is counted against
 * `LAND.admin(name).tehsils` and matches: a district whose page lists a different
 * number is left out rather than trimmed to fit, because a farmer sent to the
 * wrong tehsil office loses a day.
 *
 * Fifteen districts have a published list that reconciles. The other five are not
 * "coming later" in the interface: the card says plainly that their names are not
 * held here, and shows the official count. Each is absent for a reason:
 * Baramulla's page truncates a name to "Singh" and drops Rafiabad; Bandipora's
 * halqa page carries no table; Ganderbal publishes only the number six; Samba
 * names four of its six; Udhampur spells one tehsil two ways, which gives nine
 * rows for eight.
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
    Anantnag: [
      "Anantnag",
      "Anantnag East (Mattan)",
      "Bijbehara",
      "Dooru",
      "Kokernag",
      "Larnoo",
      "Pahalgam",
      "Qazigund",
      "Sallar",
      "Shangus",
      "Shahabad Bala",
      "Srigufwara",
    ],
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
    Doda: [
      "Doda",
      "Bhaderwah",
      "Gundana",
      "Bhalla",
      "Thathri",
      "Bhella",
      "Kasthigarh",
      "Assar",
      "Mohalla",
      "Gandoh",
      "Phagsoo",
      "Chilli Pingal",
      "Kahara",
      "Marmat",
      "Bharat Bagla",
      "Chirala",
      "Bhagwah",
    ],
    Jammu: [
      "Akhnoor",
      "Arnia",
      "Bahu",
      "Bhalwal",
      "Bishnah",
      "Chowki Choura",
      "Dansal",
      "Jammu",
      "Jammu North",
      "Jammu South",
      "Jammu West",
      "Jourian",
      "Kharah Balli",
      "Khour",
      "Maira Mandrian",
      "Mandal",
      "Marh",
      "Nagrota",
      "Pargwal",
      "Ranbir Singh Pura",
      "Suchetgarh",
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
    Kishtwar: [
      "Kishtwar",
      "Atholi (Paddar)",
      "Chattroo",
      "Marwah",
      "Warwan",
      "Dachhan",
      "Drabshalla",
      "Nagseni",
      "Bonjwah",
      "Machail",
      "Mughal Maidan",
    ],
    Kulgam: ["Kulgam", "D H Pora", "Devsar", "Frisal", "Yaripora", "Qaimoh", "Pahloo"],
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
    Pulwama: [
      "Pulwama",
      "Kakapora",
      "Awantipora",
      "Pampore",
      "Shahoora Litter",
      "Rajpora",
      "Tral",
      "Aripal",
    ],
    Rajouri: [
      "Rajouri",
      "Manjakote",
      "Darhal",
      "Thanamandi",
      "Koteranka",
      "Khawas",
      "Teryath",
      "Kalakote",
      "Siot",
      "Beripattan",
      "Sunderbani",
      "Nowshera",
      "Qila Darhal",
    ],
    Ramban: ["Ramban", "Rajgarh", "Jhatgali", "Ramsoo", "Batote", "Ranihal", "Gool", "Khari"],
    Reasi: ["Reasi", "Pouni", "Mahore", "Throo", "Arnas", "Chassana", "Katra", "Bhamag", "Thakrakote"],
    Shopian: ["Shopian", "Barbugh", "Hermain", "Keegam", "Chitragam", "Zainpora", "Keller"],
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
    Anantnag: "anantnag_tehsils",
    Budgam: "budgam_tehsils",
    Doda: "doda_tehsils",
    Jammu: "jammu_tehsils",
    Kathua: "kathua_tehsils",
    Kishtwar: "kishtwar_tehsils",
    Kulgam: "kulgam_tehsils",
    Kupwara: "kupwara_tehsils",
    Poonch: "poonch_tehsils",
    Pulwama: "pulwama_tehsils",
    Rajouri: "rajouri_tehsils",
    Ramban: "ramban_tehsils",
    Reasi: "reasi_tehsils",
    Shopian: "shopian_tehsils",
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
