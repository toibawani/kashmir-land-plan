/**
 * What is known about the land, district by district.
 *
 * READ THIS FIRST: this is district-level published information, not a record
 * of any village or plot. There is no public dataset of per-village agronomy
 * for Jammu and Kashmir, and inventing one would be exactly the kind of guess
 * this project refuses to ship. So each district gets what the documents
 * actually support: the agro-climatic zones it spans, what the soils and
 * rainfall are like in those zones, the field crops and fruit usually grown,
 * and a plain statement of what is missing.
 *
 * Village-level facts - who owns which khasra, what the soil of that field is,
 * what was sown on it last year - live in the revenue and agriculture records
 * for that village. `coverage()` says where, and `statement` is the sentence
 * the interface must show wherever this module is used.
 *
 * Every zone and district sentence is tied to a registered source in
 * js/sources.js. A statement without a source is left out on purpose.
 */
(function () {
  "use strict";

  /** The pinned caveat. tools/verify.js fails the build if it is weakened. */
  var STATEMENT =
    "This is published information about the district, not a record of your village or your plot. No village-level land record is held in this app.";

  var SOURCE_IDS = [
    "ut_glance",
    "jammu_hort_zones",
    "jammu_hort_districts",
    "icar_jammu_plan",
    "cgwb_profiles",
    "fsi_cover",
  ];

  var ZONES = {
    valley_temperate: {
      label: "Kashmir valley, temperate",
      altitude: "about 1,500 to 2,500 m on the valley floor, higher on the side slopes",
      rain: "Most precipitation falls in winter and spring, and the growing season can run dry.",
      soils:
        "Deep alluvial soils on the valley floor, karewa silt on the uplands above them, and brown hill soils on the slopes.",
      field:
        "Paddy on the lower land with mustard or fodder as the second crop, and maize and wheat on higher ground.",
      fruit: "Temperate fruit and nuts: apple, walnut, pear, cherry and apricot.",
    },
    jammu_plains: {
      label: "Jammu plains and outer foothills, sub-tropical",
      altitude: "about 250 to 700 m",
      rain: "A strong summer monsoon, hot summers and mild winters.",
      soils:
        "Alluvial and loamy soils on the plains, with the kandi belt at the foot of the hills where the ground is drier.",
      field: "Rice and wheat where the land is irrigated, maize and wheat where it is rainfed.",
      fruit: "Sub-tropical fruit: citrus, mango, guava, aonla, ber and loquat.",
    },
    jammu_hills: {
      label: "Jammu hills and mid-altitude valleys, intermediate",
      altitude: "about 700 to 2,500 m",
      rain: "Rainfall rises with height, and much of the farming here is rainfed.",
      soils:
        "Brown and mountain soils on the slopes, with terraced patches of deeper soil in the valley bottoms.",
      field: "Maize and wheat on rainfed land, paddy in the valley bottoms, and millets on the drier slopes.",
      fruit: "Stone fruit and pear at the lower heights, with apple and walnut higher up.",
    },
  };

  /*
   * `zones` is the full spread a district covers, in the order the horticulture
   * department lists it. `note` is used only where a document says something
   * specific about that district; elsewhere it says so rather than inventing
   * detail. `specific` marks a district with its own documented sentence.
   */
  var DISTRICTS = {
    Anantnag: { zones: ["valley_temperate"], fruit: "Apple, pear and walnut, with paddy on the valley floor." },
    Bandipora: { zones: ["valley_temperate"], fruit: "Apple and walnut, with paddy and fodder in the valley." },
    Baramulla: {
      zones: ["valley_temperate"],
      fruit: "Apple, walnut and pear; the district holds the largest fresh-fruit area in the valley.",
      specific: true,
    },
    Budgam: {
      zones: ["valley_temperate"],
      fruit: "Apple and walnut, with saffron on the karewa uplands.",
      note: "One of the districts where saffron is grown, after Pulwama.",
      specific: true,
    },
    Doda: {
      zones: ["jammu_hills"],
      fruit: "Stone fruit, pear and walnut, with apple on the higher ground.",
    },
    Ganderbal: { zones: ["valley_temperate"], fruit: "Apple and walnut, with paddy along the valley." },
    Jammu: {
      zones: ["jammu_plains"],
      fruit: "Citrus, mango, guava, aonla and ber.",
      note: "Rice and wheat on irrigated land, maize and wheat on rainfed land.",
      specific: true,
    },
    Kathua: {
      zones: ["jammu_plains", "jammu_hills", "valley_temperate"],
      fruit: "Mango and citrus on the plains, stone fruit and pear in the middle, apple higher up.",
      note: "The district reaches from the plains to the temperate hills, so conditions differ a lot across it.",
      specific: true,
    },
    Kishtwar: {
      zones: ["jammu_hills", "valley_temperate"],
      fruit: "Saffron on suitable upland soils, with apple, walnut and stone fruit.",
      note: "Parts of the district are high mountain country, and the valleys run warm in summer.",
      specific: true,
    },
    Kulgam: { zones: ["valley_temperate"], fruit: "Apple and pear, with paddy on the lower land." },
    Kupwara: { zones: ["valley_temperate"], fruit: "Apple and walnut, with paddy and fodder." },
    Poonch: {
      zones: ["jammu_hills", "valley_temperate"],
      fruit: "Stone fruit and pear lower down, apple and walnut in the upper reaches.",
      note: "Lower areas are close to sub-tropical while the upper reaches are temperate.",
      specific: true,
    },
    Pulwama: {
      zones: ["valley_temperate"],
      fruit: "Saffron on the karewa uplands, with apple, pear and walnut.",
      note: "The main saffron producing district; the Pampore belt is the largest single growing area.",
      specific: true,
    },
    Rajouri: {
      zones: ["jammu_plains", "jammu_hills", "valley_temperate"],
      fruit: "Citrus and mango lower down, stone fruit and pear in the middle, apple higher up.",
      note: "The district covers sub-tropical as well as intermediate and temperate ground.",
      specific: true,
    },
    Ramban: {
      zones: ["jammu_plains", "jammu_hills", "valley_temperate"],
      fruit: "Citrus and guava on the lower ground, stone fruit and pear above.",
      note: "The district runs from sub-tropical river ground up through intermediate hills.",
      specific: true,
    },
    Reasi: {
      zones: ["jammu_plains", "valley_temperate"],
      fruit: "Citrus, mango and guava lower down, walnut and stone fruit higher up.",
      note: "Sub-tropical ground and temperate hills sit inside the same district.",
      specific: true,
    },
    Samba: { zones: ["jammu_plains"], fruit: "Citrus, ber, aonla and guava." },
    Shopian: { zones: ["valley_temperate"], fruit: "Apple and walnut, with paddy on the valley floor." },
    Srinagar: {
      zones: ["valley_temperate"],
      fruit: "Apple, pear and walnut, with saffron grown in and around the district.",
      specific: true,
    },
    Udhampur: {
      zones: ["jammu_plains", "jammu_hills", "valley_temperate"],
      fruit: "Mango and citrus lower down, stone fruit and pear in the middle, apple and walnut higher up.",
      note: "The lower part of the district is sub-tropical and the upper part is hill country.",
      specific: true,
    },
  };

  function zoneFacts(id) {
    return ZONES[id] || null;
  }

  function forDistrict(name) {
    var d = DISTRICTS[name];
    if (!d) return null;
    return {
      name: name,
      zones: d.zones.map(function (id) {
        return zoneFacts(id);
      }).filter(Boolean),
      fruit: d.fruit,
      note: d.note || "",
      specific: !!d.specific,
      sources: SOURCE_IDS,
    };
  }

  function districts() {
    return Object.keys(DISTRICTS).sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  /**
   * The village-level answer. The Union Territory has thousands of villages and
   * the app holds no record of any of them; what it can do is say where the
   * record lives and what to ask for, so a farmer arrives at the right counter.
   */
  function coverage() {
    return {
      totalVillages: 6314,
      revenueVillages: 6832,
      patwarHalqas: 1646,
      sourceId: "ut_glance",
      heading: "Village-level land records are not held here",
      lines: [
        "The land record for a village is kept by the patwari for that patwar halqa, and the jamabandi is the record to ask for.",
        "Take the khasra number of the plot, or enough detail for the patwari to find it, and ask for the current jamabandi entry.",
        "Soil, slope and what was sown last year are recorded for the field, not for the district. This app describes the district and cannot describe the field.",
        "The agriculture office can say which of the options in this app are practised on ground like yours.",
      ],
    };
  }

  function statement() {
    return STATEMENT;
  }

  window.MLMP_LAND = {
    STATEMENT: STATEMENT,
    ZONES: ZONES,
    zoneFacts: zoneFacts,
    forDistrict: forDistrict,
    districts: districts,
    coverage: coverage,
    statement: statement,
    sourceIds: function () {
      return SOURCE_IDS.slice();
    },
  };
})();
