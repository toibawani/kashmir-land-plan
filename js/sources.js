/**
 * The public documents this catalogue is allowed to point at.
 *
 * A source is here because someone read it and could say exactly what it
 * supports. It is not a logo to borrow credibility from: `usedFor` states the
 * one thing the document backs, and an activity may only list a source whose
 * statement actually appears in that activity's text.
 *
 * Anything not in this registry cannot be cited. A missing source stays
 * missing, and the field it would have backed says "ask the officer" instead.
 * Every such gap is listed in NEEDS_SOURCES.md at the repository root.
 *
 * Interface
 *   MLMP_SOURCES.byId(id)      a source or null
 *   MLMP_SOURCES.ids()         every registered id
 *   MLMP_SOURCES.all()         every source, in registry order
 *   MLMP_SOURCES.tagLabel(id)  the short label shown on a tag
 */
(function () {
  "use strict";

  var SOURCES = {
    icar_jk: {
      id: "icar_jk",
      short: "ICAR",
      name: "ICAR, Jammu and Kashmir profile",
      url: "https://icar.org.in/en/node/17267",
      usedFor: "The farming systems of the two regions, including horticulture in the valley and the rice and maize rotations.",
    },
    dac_jk_guide: {
      id: "dac_jk_guide",
      short: "Farmer's Guide",
      name: "Government of India, Farmer's Guide for Jammu and Kashmir",
      url: "https://farmech.dac.gov.in/Content/FarmerGuide/JK/1J.html",
      usedFor: "The agro-climatic zones, the elevation and rainfall range, and the leading crops of each zone.",
    },
    niti_horticulture: {
      id: "niti_horticulture",
      short: "NITI Aayog",
      name: "NITI Aayog, Roadmap for Horticulture Development in Jammu and Kashmir",
      url: "https://www.niti.gov.in/",
      usedFor: "The zone structure of the Union Territory and which districts fall in the sub-tropical and intermediate zones.",
    },
    iiim_saffron: {
      id: "iiim_saffron",
      short: "CSIR-IIIM",
      name: "CSIR Indian Institute of Integrative Medicine, saffron production",
      url: "https://iiim.res.in/saffron-production/",
      usedFor: "The districts where saffron is grown in Jammu and Kashmir.",
    },
    ut_glance: {
      id: "ut_glance",
      short: "UT at a Glance",
      name: "Directorate of Economics and Statistics, J&K, Union Territory at a Glance",
      url: "https://ecostatjk.nic.in/pdf/publications/utglance/UT%20at%20a%20Glance%205.75%20X%209.pdf",
      usedFor: "The number of villages, patwar halqas and the land use pattern of the Union Territory.",
    },
    jammu_hort_zones: {
      id: "jammu_hort_zones",
      short: "Horticulture zones",
      name: "Department of Horticulture, Jammu, agro-climatic zones of the division",
      url: "https://hortijmu.jk.gov.in/agroclimate.html",
      usedFor: "The sub-tropical, intermediate and temperate bands of the Jammu division and their altitude ranges.",
    },
    jammu_hort_districts: {
      id: "jammu_hort_districts",
      short: "Horticulture districts",
      name: "Department of Horticulture, Jammu, district-wise focused crops",
      url: "https://hortijmu.jk.gov.in/districtwise.html",
      usedFor: "Which zones each Jammu district spans and the fruit crops each district focuses on.",
    },
    icar_jammu_plan: {
      id: "icar_jammu_plan",
      short: "ICAR plan",
      name: "ICAR, agriculture contingency plan for Jammu district",
      url: "https://icar-crida.res.in/CP-2012/statewiseplans/J&K%20(Pdf)/J&K14_Jammu_28.12.2013.pdf",
      usedFor: "The rice-wheat and maize-wheat patterns of the sub-tropical and intermediate zones.",
    },
    cgwb_profiles: {
      id: "cgwb_profiles",
      short: "CGWB profile",
      name: "Central Ground Water Board, district ground water information booklets",
      url: "https://cgwb.gov.in/old_website/District_Profile/JandK/Udhampur.pdf",
      usedFor: "The soil types and land use reported for the Jammu districts.",
    },
    fsi_cover: {
      id: "fsi_cover",
      short: "Forest survey",
      name: "Forest Survey of India, India State of Forest Report, Jammu and Kashmir",
      url: "https://fsi.nic.in/isfr19/vol2/isfr-2019-vol-ii-jammu-kashmir.pdf",
      usedFor: "The forest share of the land and the land use pattern of the region.",
    },
    rkvy_saffron: {
      id: "rkvy_saffron",
      short: "RKVY saffron mission",
      name: "Rashtriya Krishi Vikas Yojana, National Mission on Saffron",
      url: "https://rkvy.da.gov.in/static/download/pdf/Saffron_Mission.pdf",
      usedFor: "The place of the Pampore belt and the karewa uplands in saffron growing.",
    },
    kupwara_tehsils: {
      id: "kupwara_tehsils",
      short: "Kupwara tehsils",
      name: "District Administration Kupwara, tehsils of the district",
      url: "https://kupwara.nic.in/tehsils/",
      usedFor: "The names of the sixteen tehsils of Kupwara district, counted against the official table.",
    },
    budgam_tehsils: {
      id: "budgam_tehsils",
      short: "Budgam tehsils",
      name: "District Administration Budgam, tehsils of the district",
      url: "https://budgam.nic.in/tehsil/",
      usedFor: "The names of the nine tehsils of Budgam district, counted against the official table.",
    },
    kathua_tehsils: {
      id: "kathua_tehsils",
      short: "Kathua tehsils",
      name: "District Administration Kathua, tehsils of the district",
      url: "https://kathua.nic.in/tehsils/",
      usedFor: "The names of the eleven tehsils of Kathua district, counted against the official table.",
    },
    poonch_tehsils: {
      id: "poonch_tehsils",
      short: "Poonch tehsils",
      name: "District Administration Poonch, tehsils of the district",
      url: "https://poonch.nic.in/tehsil/",
      usedFor: "The names of the six tehsils of Poonch district, counted against the official table.",
    },
    reasi_tehsils: {
      id: "reasi_tehsils",
      short: "Reasi tehsils",
      name: "District Administration Reasi, tehsils of the district",
      url: "https://reasi.nic.in/tehsil/",
      usedFor: "The names of the nine tehsils of Reasi district, counted against the official table.",
    },
    srinagar_tehsils: {
      id: "srinagar_tehsils",
      short: "Srinagar tehsils",
      name: "District Administration Srinagar, tehsils of the district",
      url: "https://srinagar.nic.in/tehsil/",
      usedFor: "The names of the seven tehsils of Srinagar district, counted against the official table.",
    },
    anantnag_tehsils: {
      id: "anantnag_tehsils",
      short: "Anantnag tehsils",
      name: "District Administration Anantnag, tehsils of the district",
      url: "https://anantnag.nic.in/village-directory/",
      usedFor: "The names of the twelve tehsils of Anantnag district, taken from the tehsil column of the district's village directory and counted against the official table.",
    },
    doda_tehsils: {
      id: "doda_tehsils",
      short: "Doda tehsils",
      name: "District Administration Doda, tehsils of the district",
      url: "https://doda.nic.in/tehsil/",
      usedFor: "The names of the seventeen tehsils of Doda district, taken from the tehsildar designations the district publishes, and counted against the official table.",
    },
    jammu_tehsils: {
      id: "jammu_tehsils",
      short: "Jammu tehsils",
      name: "District Administration Jammu, tehsils of the district",
      url: "https://jammu.nic.in/tehsil/",
      usedFor: "The names of the twenty-one tehsils of Jammu district, counted against the official table.",
    },
    kishtwar_tehsils: {
      id: "kishtwar_tehsils",
      short: "Kishtwar tehsils",
      name: "District Administration Kishtwar, tehsils of the district",
      url: "https://kishtwar.nic.in/tehsil/",
      usedFor: "The names of the eleven tehsils of Kishtwar district, counted against the official table.",
    },
    kulgam_tehsils: {
      id: "kulgam_tehsils",
      short: "Kulgam tehsils",
      name: "District Administration Kulgam, tehsils of the district",
      url: "https://kulgam.nic.in/tehsil/",
      usedFor: "The names of the seven tehsils of Kulgam district, counted against the official table.",
    },
    rajouri_tehsils: {
      id: "rajouri_tehsils",
      short: "Rajouri tehsils",
      name: "District Administration Rajouri, tehsils of the district",
      url: "https://rajouri.nic.in/tehsils/",
      usedFor: "The names of the thirteen tehsils of Rajouri district, counted against the official table.",
    },
    shopian_tehsils: {
      id: "shopian_tehsils",
      short: "Shopian tehsils",
      name: "District Administration Shopian, tehsils of the district",
      url: "https://shopian.nic.in/tehsil/",
      usedFor: "The names of the seven tehsils of Shopian district, taken from the tehsildar designations the district publishes, and counted against the official table.",
    },
  };

  function byId(id) {
    return Object.prototype.hasOwnProperty.call(SOURCES, id) ? SOURCES[id] : null;
  }

  function ids() {
    return Object.keys(SOURCES);
  }

  function all() {
    return ids().map(function (id) {
      return SOURCES[id];
    });
  }

  function tagLabel(id) {
    var s = byId(id);
    return s ? s.short : "";
  }

  window.MLMP_SOURCES = {
    byId: byId,
    ids: ids,
    all: all,
    tagLabel: tagLabel,
  };
})();
