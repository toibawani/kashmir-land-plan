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
