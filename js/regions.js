/**
 * Region reference data for Jammu and Kashmir.
 *
 * READ THIS FIRST: the zone grouping is deliberately coarse. Every district in
 * J&K spans more than one agro-climatic zone, and an individual plot can sit on
 * a karewa upland, a river terrace or a hillside within the same village. The
 * grouping below puts each district under the zone that covers most of its
 * settled farmland, and it is background for choosing what to ask about. It is
 * never a suitability verdict for a plot.
 *
 * Sources
 * - Government of India, Department of Agriculture and Cooperation, Farmer's
 *   Guide for Jammu and Kashmir (farmech.dac.gov.in/Content/FarmerGuide/JK/):
 *   the region sits in the Western Himalayan agro-climatic zone with separate
 *   Jammu, Kashmir and Ladakh zones. Rice leads in the Kashmir zone, followed
 *   by maize, barley and wheat. Jammu leads on maize and wheat. Roughly three
 *   quarters of India's temperate fruit, mainly apples, is grown here.
 *   Elevation runs from about 330 m near Jammu to about 3,505 m in Ladakh, with
 *   rainfall falling from about 1,052 mm to 92 mm across the same distance.
 * - ICAR, Jammu and Kashmir profile (icar.org.in/en/node/17267): about 3.3% of
 *   the geographical area is cultivated and roughly 60% of that is rainfed.
 *   Farming in the Kashmir valley is predominantly horticulture based, with
 *   apple, walnut and apricot as the important fruits and rice-mustard and
 *   rice-oat fodder as the main systems. Jammu runs rice-wheat where irrigated
 *   and maize-wheat where rainfed.
 * - NITI Aayog, Roadmap for Horticulture Development in the UT of Jammu and
 *   Kashmir: four major agro-climatic zones, three of them in the Jammu region,
 *   with subtropical and intermediate zones covering Kathua, Jammu, Samba and
 *   Udhampur among others.
 * - CSIR-IIIM, Saffron production (iiim.res.in/saffron-production) and the RKVY
 *   National Mission on Saffron document: saffron in J&K is grown mainly in
 *   Pulwama, Budgam, Srinagar and Kishtwar, with the Pampore belt in Pulwama
 *   the largest contributor.
 */
(function () {
  "use strict";

  var ZONES = {
    valley_temperate: {
      id: "valley_temperate",
      label: "Kashmir valley, temperate",
      elevationBand: "roughly 1,500 to 2,500 m, rising quickly on the side slopes",
      summary:
        "Cool temperate valley floor and side valleys. Farming here is mostly horticulture based, with paddy on the lower land and temperate fruit and nuts on the slopes and uplands. Winters are cold and the growing season is short.",
      established:
        "Paddy, temperate fruit and nuts, fodder, and vegetables for household use are all part of the established system here.",
    },
    jammu_plains: {
      id: "jammu_plains",
      label: "Jammu plains and outer foothills, sub-tropical",
      elevationBand: "roughly 250 to 700 m",
      summary:
        "Hot summers, a stronger monsoon and mild winters. Where water is available this is the most intensively cropped part of the region, and rainfed land carries maize and wheat.",
      established:
        "Rice and wheat on irrigated land, maize and wheat on rainfed land, and sub-tropical fruit are all part of the established system here.",
    },
    jammu_hills: {
      id: "jammu_hills",
      label: "Jammu hills and mid-altitude valleys, intermediate",
      elevationBand: "roughly 700 to 2,500 m",
      summary:
        "The transition belt between the plains and the high mountains. Climate changes quickly with height, so villages at different elevations in the same district can have quite different growing conditions. Much of the farming is rainfed.",
      established:
        "Maize and wheat are the usual field crops on rainfed land, with paddy in the valleys and temperate or sub-tropical fruit depending on height.",
    },
  };

  /**
   * Districts as they stand now. Each entry carries the coarse zone and an
   * optional note where a reliable source supports a district-level statement.
   * Notes elsewhere are deliberately left empty rather than guessed.
   */
  /**
   * `weatherQuery` is only set where the weather service's place list does not
   * answer to the district name the app shows. Open-Meteo geocodes against
   * GeoNames, which spells three of these districts differently, and those
   * spellings return no result at all rather than a wrong one. Verified against
   * the live geocoder: without these, Baramulla, Bandipora and Budgam fail with
   * "no place found", and every other district resolves inside J&K unaided.
   */
  var DISTRICTS = {
    Anantnag: { zone: "valley_temperate" },
    Bandipora: { zone: "valley_temperate", weatherQuery: "Bandipura" },
    Baramulla: { zone: "valley_temperate", weatherQuery: "Baramula" },
    Budgam: {
      weatherQuery: "Badgam",
      zone: "valley_temperate",
      note:
        "One of the four districts where saffron is grown in J&K, after Pulwama.",
      saffron: true,
    },
    Doda: { zone: "jammu_hills" },
    Ganderbal: { zone: "valley_temperate" },
    Jammu: { zone: "jammu_plains" },
    Kathua: {
      zone: "jammu_plains",
      spans: "The district reaches from the plains up into the foothills, so conditions differ a lot between the two.",
    },
    Kishtwar: {
      zone: "jammu_hills",
      note:
        "Saffron is also grown here, well outside the valley, on suitable upland soils.",
      saffron: true,
      spans: "Parts of the district are high mountain country, and the valleys run warm in summer.",
    },
    Kulgam: { zone: "valley_temperate" },
    Kupwara: { zone: "valley_temperate" },
    Poonch: {
      zone: "jammu_hills",
      spans: "Lower areas are close to sub-tropical while the upper reaches are temperate.",
    },
    Pulwama: {
      zone: "valley_temperate",
      note:
        "The main saffron producing district in J&K. The Pampore belt on the karewa uplands is the largest single growing area.",
      saffron: true,
    },
    Rajouri: {
      // "Rajouri" alone matches only an airport in the place list; the town
      // itself is indexed as Rajaori.
      weatherQuery: "Rajaori",
      zone: "jammu_hills",
      spans: "The district covers sub-tropical as well as intermediate and temperate ground.",
    },
    Ramban: { zone: "jammu_hills" },
    Reasi: { zone: "jammu_hills" },
    Samba: { zone: "jammu_plains" },
    Shopian: { zone: "valley_temperate" },
    Srinagar: {
      zone: "valley_temperate",
      note: "Saffron is grown in and around the district, one of the four main growing districts.",
      saffron: true,
    },
    Udhampur: {
      zone: "jammu_plains",
      spans: "The lower part of the district is sub-tropical and the upper part is hill country.",
    },
  };

  /** Districts where the saffron activity is allowed to appear at all. */
  var SAFFRON_DISTRICTS = ["Pulwama", "Budgam", "Srinagar", "Kishtwar"];

  function district(name) {
    return DISTRICTS[name] || null;
  }

  function zoneFor(name) {
    var d = district(name);
    return d ? ZONES[d.zone] : null;
  }

  /**
   * Name sent to the weather geocoder. This is the district name, which in J&K
   * is also the usual name of the district headquarters town. It is a nearby
   * town lookup, never a field pin.
   */
  function weatherQuery(name) {
    var d = district(name);
    return (d && d.weatherQuery) || name || "";
  }

  window.MLMP_REGIONS = {
    ZONES: ZONES,
    DISTRICTS: DISTRICTS,
    SAFFRON_DISTRICTS: SAFFRON_DISTRICTS,
    district: district,
    zoneFor: zoneFor,
    weatherQuery: weatherQuery,
    /** Flat, ordered list for the district dropdown. */
    names: Object.keys(DISTRICTS).sort(function (a, b) {
      return a.localeCompare(b);
    }),
  };
})();
