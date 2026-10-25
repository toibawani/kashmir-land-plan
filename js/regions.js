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
 * - Department of Horticulture, Jammu (hortijmu.jk.gov.in/agroclimate.html):
 *   Jammu Division has three agro-climatic zones: Sub-tropical (300-1000m),
 *   Intermediate (1000-1500m), and Temperate (>1500m). This matches the
 *   official department zoning and provides precise elevation bands.
 * - MDPI study on apple orchards in Kashmir Valley (2020): South Kashmir
 *   accounts for ~56% of total orchard area, North Kashmir 32%, Central 12%.
 *   Baramulla district has the highest land under apple orchards (305 km2).
 *   Apple contributes 27% to J&K economy.
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
        "Cool temperate valley floor and side valleys. Farming here is predominantly horticulture based, with apple as the major fruit crop. Paddy occupies the lower valley land, and temperate fruit and nuts are on the slopes and uplands. Winters are cold with snowfall, and the growing season is short. South Kashmir has the highest orchard concentration, followed by North and Central Kashmir.",
      established:
        "Apple, walnut, apricot, paddy, maize, fodder, and vegetables for household use are all part of the established system here. Apple orchards cover about 1,330 km2 in the valley and contribute significantly to the regional economy.",
    },
    jammu_plains: {
      id: "jammu_plains",
      label: "Jammu plains and outer foothills, sub-tropical",
      elevationBand: "300 to 1,000 m above MSL",
      summary:
        "Hot summers with heavy monsoon (1200-1500mm from mid-June to mid-September) and mild winters. This is the most intensively cropped part of the region where water is available. The zone includes irrigated areas around Kathua, Samba, Jammu city, and the R.S. Pura belt, plus unirrigated Kandi areas. Cropping systems include rice-wheat-moong and rice-wheat-summer fodder.",
      established:
        "Rice and wheat on irrigated land, maize and wheat on rainfed Kandi land, and sub-tropical fruit (mango, citrus, guava) are all part of the established system here. The zone spans Jammu, Samba districts entirely, and parts of Kathua, Udhampur, Reasi and Rajouri.",
    },
    jammu_hills: {
      id: "jammu_hills",
      label: "Jammu hills and mid-altitude valleys, intermediate",
      elevationBand: "1,000 to 1,500 m above MSL",
      summary:
        "The transition belt between the sub-tropical plains and the high temperate mountains. Climate changes quickly with elevation, so villages at different heights in the same district can have quite different growing conditions. Much of the farming is rainfed. This zone includes parts of districts like Udhampur, Reasi, Rajouri, Doda, Ramban, and the Chenab valley areas.",
      established:
        "Maize and wheat are the usual field crops on rainfed land, with paddy in valley pockets. Temperate fruit appears at higher elevations while sub-tropical fruit persists in lower areas. The zone is more risk-prone and has lower input usage compared to the plains.",
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
    Anantnag: {
      zone: "valley_temperate",
      note: "Part of South Kashmir, which has the highest concentration of apple orchards in the valley (~56% of total orchard area).",
    },
    Bandipora: { zone: "valley_temperate", weatherQuery: "Bandipura" },
    Baramulla: {
      zone: "valley_temperate",
      weatherQuery: "Baramula",
      note: "North Kashmir district with the highest land under apple orchards (305 km2). A major apple-producing area.",
    },
    Budgam: {
      weatherQuery: "Badgam",
      zone: "valley_temperate",
      note:
        "One of the four districts where saffron is grown in J&K, after Pulwama. Apple cultivation is also significant here.",
      saffron: true,
    },
    Doda: {
      zone: "jammu_hills",
      note: "Hill district in the Chenab valley region. Covers intermediate and temperate zones with mountain agriculture.",
    },
    Ganderbal: { zone: "valley_temperate" },
    Jammu: {
      zone: "jammu_plains",
      note: "The main city district in the sub-tropical zone. Intensive rice-wheat and maize-wheat systems in irrigated areas.",
    },
    Kathua: {
      zone: "jammu_plains",
      note: "Spans from irrigated sub-tropical plains (Kathua, Barnoti, Hiranagar) up into Kandi foothills. Rice-wheat-moong system is common.",
      spans: "The district reaches from the plains up into the foothills, so conditions differ a lot between the two.",
    },
    Kishtwar: {
      zone: "jammu_hills",
      note:
        "High mountain district where saffron is grown on suitable upland soils, well outside the Kashmir valley. Apples and temperate fruit are also grown at higher elevations.",
      saffron: true,
      spans: "Parts of the district are high mountain country, and the valleys run warm in summer.",
    },
    Kulgam: {
      zone: "valley_temperate",
      note: "South Kashmir district. Apple cultivation is significant, with studies showing yield variations across high, mid, and low altitude zones.",
    },
    Kupwara: {
      zone: "valley_temperate",
      note: "North Kashmir district bordering the higher mountain areas. Apple and walnut cultivation are established here.",
    },
    Poonch: {
      zone: "jammu_hills",
      note: "Hill district with lower sub-tropical areas and upper temperate reaches. Apple cultivation appears at higher elevations.",
      spans: "Lower areas are close to sub-tropical while the upper reaches are temperate.",
    },
    Pulwama: {
      zone: "valley_temperate",
      note:
        "The main saffron producing district in J&K. The Pampore belt on the karewa uplands is the largest single growing area. Also a significant apple-producing district in South Kashmir.",
      saffron: true,
    },
    Rajouri: {
      // "Rajouri" alone matches only an airport in the place list; the town
      // itself is indexed as Rajaori.
      weatherQuery: "Rajaori",
      zone: "jammu_hills",
      note: "Hill district spanning sub-tropical, intermediate and temperate zones. Maize-wheat is common on rainfed land.",
      spans: "The district covers sub-tropical as well as intermediate and temperate ground.",
    },
    Ramban: {
      zone: "jammu_hills",
      note: "Located along the Chenab valley. Covers intermediate and temperate zones with hill agriculture.",
    },
    Reasi: {
      zone: "jammu_hills",
      note: "Hill district with varied elevation from sub-tropical to temperate. Maize-wheat and fruit cultivation depending on height.",
    },
    Samba: {
      zone: "jammu_plains",
      note: "Sub-tropical district adjacent to Jammu city. Rice-wheat and sub-tropical fruit systems are established.",
    },
    Shopian: {
      zone: "valley_temperate",
      note: "South Kashmir district. Apple cultivation is prominent, with high-density planting being adopted in some areas.",
    },
    Srinagar: {
      zone: "valley_temperate",
      note: "Central Kashmir district. Saffron is grown in and around the district, one of the four main growing districts. Apple orchards exist but with smaller area compared to north and south Kashmir.",
      saffron: true,
    },
    Udhampur: {
      zone: "jammu_plains",
      note: "Lower part is sub-tropical (irrigated areas) while upper part is hill country (intermediate zone). Covers both intensive plains agriculture and rainfed hill farming.",
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
