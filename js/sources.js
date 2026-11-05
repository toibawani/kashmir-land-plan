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
