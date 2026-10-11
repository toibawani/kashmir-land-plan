/**
 * Scheme and support pathway entries.
 *
 * Rules this file follows:
 * - Only official portals. Every link below was checked and answered with a
 *   successful response before being added.
 * - No amounts, no deadlines, no eligibility rules and no document lists.
 *   Those change and this prototype cannot verify them.
 * - Each entry is described only in terms of what the programme is for, which
 *   is public information, and each one carries the same instruction to
 *   confirm current details.
 *
 * `appliesTo` lists the activity ids an entry is most likely to be relevant
 * to, or "*" for entries worth checking whatever the user does. Relevance is
 * only a pointer for the conversation at the office, nothing more.
 */
(function () {
  "use strict";

  var SCHEMES = [
    {
      id: "kkg",
      title: "Kisan Khidmat Ghar, the local single window",
      category: "Start here",
      body:
        "J&K runs Kisan Khidmat Ghar centres as a single window for agriculture and allied services, with a portal behind them. This is normally the first place to take your questions, your plot details and any soil report you have.",
      url: "https://kkg.jk.gov.in/",
      linkLabel: "kkg.jk.gov.in",
      appliesTo: ["*"],
      actions: [
        "Take your plot details and your soil test report, if you have one",
        "Ask which of your activity ideas are realistic for your village and season",
        "Ask what training is available before you spend money",
      ],
    },
    {
      id: "dir_agri",
      title: "Directorate of Agriculture, Kashmir and Jammu",
      category: "Advisory and local offices",
      body:
        "The two directorates are the departmental side of agriculture in the region and the route to your block and district agriculture office. Crop advisories and local recommendations come through them.",
      url: "https://diragrikmr.jk.gov.in/",
      linkLabel: "diragrikmr.jk.gov.in (Kashmir)",
      extraUrls: [
        { url: "https://diragrijmu.jk.gov.in/", label: "diragrijmu.jk.gov.in (Jammu)" },
      ],
      appliesTo: ["*"],
      actions: [
        "Ask for the crop advisory for your district",
        "Ask which varieties are recommended locally",
      ],
    },
    {
      id: "horticulture",
      title: "J&K Horticulture Department",
      category: "Horticulture",
      body:
        "The horticulture department handles fruit, nuts, saffron and floriculture in the Union Territory, and runs nurseries and planting material programmes. If your interest is fruit or nuts, this is the department to ask.",
      url: "https://horticulture.jk.gov.in/",
      linkLabel: "horticulture.jk.gov.in",
      appliesTo: ["orchard_temp", "orchard_subtrop", "protected_cultivation", "saffron_karewa"],
      actions: [
        "Ask which varieties suit your elevation, and where planting material comes from",
        "Ask about nursery registration if you plan to raise your own plants",
      ],
    },
    {
      id: "midh",
      title: "Mission for Integrated Development of Horticulture",
      category: "Horticulture",
      body:
        "MIDH is the national horticulture mission covering fruit, vegetables, spices, flowers and protected cultivation. It is the programme behind much horticulture support across states and Union Territories.",
      url: "https://midh.gov.in/",
      linkLabel: "midh.gov.in",
      appliesTo: ["orchard_temp", "orchard_subtrop", "protected_cultivation", "kitchen_garden"],
      actions: [
        "Ask which MIDH components are currently open in J&K",
        "Ask what the current process is, and what it requires of you",
      ],
    },
    {
      id: "soil",
      title: "Soil Health Card",
      category: "Soil",
      body:
        "The national soil testing programme gives a soil health card with nutrient status and recommendations for a plot. If you do not have a recent test, this is the route to one.",
      url: "https://soilhealth.dac.gov.in/",
      linkLabel: "soilhealth.dac.gov.in",
      appliesTo: ["*"],
      actions: [
        "Ask how to get a soil test done in your block and how long it takes",
        "Take any existing report with you and ask for it to be interpreted",
      ],
    },
    {
      id: "pmksy",
      title: "Pradhan Mantri Krishi Sinchayee Yojana",
      category: "Water and irrigation",
      body:
        "PMKSY is the national irrigation programme, including micro-irrigation such as drip and sprinkler systems and work on water sources. It is the programme to ask about when water is your main constraint.",
      url: "https://pmksy.gov.in/",
      linkLabel: "pmksy.gov.in",
      appliesTo: ["*"],
      actions: [
        "Ask what irrigation or micro-irrigation support is currently available in your district",
        "Ask what the current process is and what it requires of you",
      ],
    },
    {
      id: "mechanisation",
      title: "Farm mechanisation support",
      category: "Machinery and equipment",
      body:
        "The national farm mechanisation programme covers machinery, implements and custom hiring centres, which matters most where fields are small and irregular.",
      url: "https://farmech.dac.gov.in/",
      linkLabel: "farmech.dac.gov.in",
      appliesTo: [
        "kitchen_garden",
        "fodder_or_pasture",
        "intercrop_or_improve",
        "orchard_temp",
        "orchard_subtrop",
      ],
      actions: [
        "Ask whether there is a custom hiring centre nearby before buying anything",
        "Ask which implements are recommended for your soil and plot size",
      ],
    },
    {
      id: "livestock",
      title: "Department of Animal Husbandry and Dairying",
      category: "Livestock and dairy",
      body:
        "Livestock and dairy programmes sit with the animal husbandry department rather than agriculture. This matters if your plan includes fodder, milk or small ruminants.",
      url: "https://dahd.gov.in/",
      linkLabel: "dahd.gov.in",
      appliesTo: ["fodder_or_pasture", "beekeeping"],
      actions: [
        "Ask about livestock and fodder support available in your district",
        "Ask about breeding and veterinary services you would need",
      ],
    },
    {
      id: "training",
      title: "Daksh Kisan training",
      category: "Training",
      body:
        "J&K runs a farmer training and skilling portal. Several of the options in this plan need training before money is spent, and this is where to look for it.",
      url: "https://dakshkisan.jk.gov.in/",
      linkLabel: "dakshkisan.jk.gov.in",
      appliesTo: ["*"],
      actions: [
        "Look for training on the activity you are considering",
        "Ask what practical follow-up support comes with the training",
      ],
    },
    {
      id: "hadp",
      title: "Holistic Agriculture Development Programme",
      category: "J&K programmes",
      body:
        "HADP is J&K's own agriculture development programme, organised as a set of projects across agriculture, horticulture, livestock and allied sectors. Availability and rules are set by the department.",
      url: "https://hadp.jk.gov.in/",
      linkLabel: "hadp.jk.gov.in",
      appliesTo: ["*"],
      actions: [
        "Ask which HADP projects are currently open in your district",
        "Ask whether the process starts on the portal or at the local office",
      ],
    },
    {
      id: "pmkisan",
      title: "PM-KISAN income support",
      category: "Income support",
      body:
        "PM-KISAN is a central scheme that provides income support to farmer families. Eligibility rules are set by the government and change, so confirm yours rather than relying on anything here.",
      url: "https://pmkisan.gov.in/",
      linkLabel: "pmkisan.gov.in",
      appliesTo: ["*"],
      actions: [
        "Check whether your household is already enrolled",
        "Ask the local office to confirm your eligibility status",
      ],
    },
    {
      id: "market",
      title: "e-NAM national agriculture market",
      category: "Selling",
      body:
        "e-NAM links regulated markets online so produce can be traded beyond the nearest mandi. Fruit and perishable produce also move through local markets and commission agents, so ask about both.",
      url: "https://enam.gov.in/",
      linkLabel: "enam.gov.in",
      appliesTo: [
        "kitchen_garden",
        "orchard_temp",
        "orchard_subtrop",
        "protected_cultivation",
        "saffron_karewa",
      ],
      actions: [
        "Ask which nearby mandis are on the platform",
        "Ask about grading, packing and transport before you plan to sell",
      ],
    },
    {
      id: "ministry",
      title: "Ministry of Agriculture and Farmers Welfare",
      category: "Central schemes",
      body:
        "The ministry site lists central schemes across agriculture. Use it to find the programme a local office has mentioned, rather than to work out eligibility yourself.",
      url: "https://agriwelfare.gov.in/",
      linkLabel: "agriwelfare.gov.in",
      appliesTo: ["*"],
      actions: ["Use it to look up a scheme name you were told about locally"],
    },
  ];

  /** The one line that has to appear with every entry. */
  var CONFIRM_LINE =
    "Confirm current details, eligibility and documents with the official portal or local agriculture office, or at your Kisan Khidmat Ghar.";

  window.MLMP_SCHEMES = {
    ALL: SCHEMES,
    CONFIRM_LINE: CONFIRM_LINE,
    relevantTo: function (activityIds) {
      var ids = activityIds && activityIds.length ? activityIds : [];
      return SCHEMES.map(function (s) {
        var relevant =
          s.appliesTo.indexOf("*") !== -1 ||
          ids.some(function (id) {
            return s.appliesTo.indexOf(id) !== -1;
          });
        return { scheme: s, relevant: relevant };
      });
    },
  };
})();
