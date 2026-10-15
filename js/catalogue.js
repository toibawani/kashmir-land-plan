/**
 * Activity catalogue. The data behind the suggestions is kept here, apart
 * from the scoring and rendering code, so it stays readable on its own.
 * It is not a suitability model and it does not approve anything.
 *
 * Recording an officer review (maintainer only)
 * Officers never edit this file. The review process for them is in
 * REVIEW.md at the repo root: they reply by message, on paper, in person
 * or by email, and the maintainer records it here afterwards.
 * - Whole list checked: fill in CATALOGUE_REVIEW below.
 * - One entry checked: fill reviewStatus, reviewedBy, designation and
 *   reviewedOn on that activity, and leave the whole-list record alone.
 * - reviewStatus must be "not-reviewed" or "reviewed".
 * - When reviewStatus is "reviewed", reviewedBy (the officer's name) and
 *   reviewedOn (the date of the check, as YYYY-MM-DD) are both required.
 *   `npm run build` fails loudly if either is missing, so a half-recorded
 *   review can never slip through looking finished.
 * - Only record a review the officer actually gave. Leave fields empty
 *   rather than guessing a name or a date.
 * - A review never changes the confirmation line. Everything stays a
 *   question to confirm locally, reviewed or not.
 *
 * The ratings, calendars and "why" text are illustrative. Regional crop
 * patterns follow the sources in js/regions.js and the README. Do not add a
 * crop, scheme or suitability claim here without a public source.
 */
(function () {
  "use strict";

  /**
   * Whole-catalogue review. The maintainer records it here after an officer
   * has checked the list (see REVIEW.md). Until then it stays not-reviewed,
   * which the interface says plainly.
   */
  var CATALOGUE_REVIEW = {
    reviewStatus: "not-reviewed",
    reviewedBy: "",
    designation: "",
    reviewedOn: "",
  };

  var CONFIRM_LINE =
    "Confirm suitability, costs and current scheme rules with your local agriculture office or Kisan Khidmat Ghar before acting.";

  // Shorthand for building the twelve month calendars.
  // p = phase (prepare | sow | care | harvest | quiet), t = short label.
  function month(p, t) {
    return { p: p, t: t };
  }
  var IDLE = month("quiet", "Quiet period");

  var ACTIVITIES = {
    kitchen_garden: {
      id: "kitchen_garden",
      title: "Kitchen garden and mixed vegetables",
      zones: ["valley_temperate", "jammu_plains", "jammu_hills"],
      why:
        "A small plot near the house can cover part of what the family eats and cut trips to the market. It needs little space and can start on a few marla, so it fits land that is sitting idle but is not worth a field crop.",
      zoneNotes: {
        valley_temperate:
          "Vegetables are already grown across the valley, mostly for household use. The growing season is short, so timing matters more than the size of the plot.",
        jammu_plains:
          "The longer, hotter season allows more than one round of vegetables in a year. Water rather than heat is usually the limiting factor.",
        jammu_hills:
          "Something can be grown through most of the year, but the crop changes with height and the summer rains bring more disease pressure.",
      },
      requirements: [
        "Water that can actually reach the plot through the dry spells you expect",
        "Basic tools, seed or seedlings, and compost or manure",
        "Regular time for weeding, watering and picking",
      ],
      risks: [
        "Water running short at flowering and fruiting",
        "Pests and disease when the plot is not checked often",
        "Surplus that cannot be sold, stored or given away",
      ],
      missing: "Your soil test, the local pest pattern, and which vegetables actually sell nearby",
      waterNote:
        "The lightest option on water if the area stays small. Establishment and flowering are the windows that matter, so arrange water for those rather than every single day.",
      waterNeed: "low",
      effort: "low",
      cost: "low",
      firstReturns: "quick",
      returnPotential: "low",
      terrainFit: ["flat", "unknown"],
      sizeFit: "small",
      calendar: [
        IDLE,
        month("prepare", "Bed preparation"),
        month("sow", "Spring sowing"),
        month("care", "Weeding, watering"),
        month("harvest", "Summer picking"),
        month("harvest", "Summer picking"),
        month("sow", "Kharif sowing"),
        month("care", "Weeding, watering"),
        month("sow", "Autumn sowing"),
        month("harvest", "Main harvest"),
        month("harvest", "Late picking"),
        month("quiet", "Under cover or idle"),
      ],
      schemes: ["soil", "irrigation", "training", "market", "local"],
    },

    orchard_temp: {
      id: "orchard_temp",
      title: "Temperate fruit and nut trees",
      zones: ["valley_temperate", "jammu_hills"],
      why:
        "Apple, walnut, almond and cherry are the backbone of farming in the Kashmir valley and on the higher ground of the Jammu hills. Trees suit sloping ground that is awkward for field crops, and a small block is easier to manage than a large one.",
      zoneNotes: {
        valley_temperate:
          "Temperate fruit and nuts are the established system here, so planting material, advice and buyers are usually easier to find than for an unfamiliar crop.",
        jammu_hills:
          "Fruit is grown in the upper parts of these districts, so tree crops only make sense on ground that is high and cool enough for the species you pick.",
      },
      requirements: [
        "Enough cold winter weather for the species and variety you choose",
        "Water for the first few years while the trees establish",
        "Willingness to wait several seasons before any real return",
      ],
      risks: [
        "Frost or hail at flowering, which can cost a whole crop",
        "Disease and pest pressure, which builds up in older orchards",
        "Several years with no income, then a price fall in a heavy harvest year",
      ],
      missing:
        "Whether your exact elevation and winter cold suit the species and variety you have in mind, and which varieties the local horticulture office recommends",
      waterNote:
        "Water matters most in the first two or three years and again at flowering and fruit fill. Once established on deep soil, trees cope with short dry spells better than young ones do.",
      waterNeed: "medium",
      effort: "medium",
      cost: "medium",
      firstReturns: "multi-year",
      returnPotential: "high",
      terrainFit: ["flat", "sloped", "unknown"],
      sizeFit: "any",
      calendar: [
        month("care", "Dormant pruning"),
        month("care", "Pruning, sanitation"),
        month("care", "Flowering, frost watch"),
        month("care", "Fruit set, thinning"),
        month("care", "Spray, irrigation"),
        month("care", "Spray, irrigation"),
        month("care", "Orchard maintenance"),
        month("harvest", "Early varieties"),
        month("harvest", "Main picking"),
        month("harvest", "Picking, grading"),
        month("care", "Post-harvest care"),
        IDLE,
      ],
      schemes: ["horticulture", "irrigation", "mechanisation", "market", "training", "local"],
    },

    orchard_subtrop: {
      id: "orchard_subtrop",
      title: "Sub-tropical fruit trees",
      zones: ["jammu_plains", "jammu_hills"],
      why:
        "Citrus, mango, guava and litchi grow in the warmer parts of the Jammu region. A small block or a field edge can carry them without taking land away from the main cereal crop.",
      zoneNotes: {
        jammu_plains:
          "These species already grow in the district, so the questions are about water, frost pockets and drainage rather than whether the crop can grow here at all.",
        jammu_hills:
          "This only works on the lower, warmer ground. The upper parts of the district are too cold for most sub-tropical fruit except in sheltered spots.",
      },
      requirements: [
        "Ground that stays frost free in winter for the species you choose",
        "Water through the hot months",
        "Good drainage, because these trees suffer in waterlogged ground",
      ],
      risks: [
        "Winter frost in the colder pockets",
        "Fruit fly and other pests, which need attention right through the season",
        "The fruit is perishable, so picking, packing and selling have to be planned together",
      ],
      missing: "How cold your site gets in winter, and whether local buyers take the species you have in mind",
      waterNote:
        "Needs water through the hot season, especially while the trees are young. In low-lying fields, poor drainage is a bigger problem than shortage in most years.",
      waterNeed: "medium",
      effort: "medium",
      cost: "medium",
      firstReturns: "multi-year",
      returnPotential: "medium",
      terrainFit: ["flat", "unknown"],
      sizeFit: "any",
      calendar: [
        IDLE,
        month("care", "Pruning, manuring"),
        month("care", "Flowering"),
        month("care", "Fruit set"),
        month("care", "Irrigation, spray"),
        month("care", "Irrigation, spray"),
        month("care", "Canopy care"),
        month("harvest", "Early fruit"),
        month("harvest", "Main picking"),
        month("harvest", "Picking, grading"),
        month("harvest", "Late picking"),
        month("care", "Post-harvest care"),
      ],
      schemes: ["horticulture", "irrigation", "mechanisation", "market", "training", "local"],
    },

    fodder_or_pasture: {
      id: "fodder_or_pasture",
      title: "Fodder crop or managed pasture",
      zones: ["valley_temperate", "jammu_plains", "jammu_hills"],
      why:
        "If the household keeps cattle, sheep or goats, growing fodder on underused land cuts what you spend on feed. It is less demanding than a cash crop and it keeps the land working.",
      zoneNotes: {
        valley_temperate:
          "Fodder is already part of the cropping system in the valley, often grown after paddy, so the practice and the seed are both familiar locally.",
        jammu_plains:
          "Fodder fits between the main cereal seasons and needs less water than a second cash crop would.",
        jammu_hills:
          "Rainfed land here often suits fodder better than a demanding cash crop, and livestock are usually kept alongside the farming.",
      },
      requirements: [
        "Seed, and fencing where free-ranging animals are nearby",
        "Some water to get the stand established",
        "A clear idea of how much fodder the household actually needs",
      ],
      risks: [
        "Low cash return if there is no livestock to feed",
        "Weeds taking over a stand that is not managed",
        "Yield swinging with the weather, so the lean months need planning",
      ],
      missing: "How many animals you keep, what you spend on feed now, and which fodder species the local office recommends",
      waterNote:
        "A modest and fairly forgiving water need once the stand is up. Establishment is the risky phase, so time sowing to when rain or irrigation is likely.",
      waterNeed: "low",
      effort: "low",
      cost: "low",
      firstReturns: "seasonal",
      returnPotential: "low",
      terrainFit: ["flat", "sloped", "unknown"],
      sizeFit: "any",
      calendar: [
        month("care", "Feed stored crop"),
        month("care", "Feed stored crop"),
        month("sow", "Spring sowing"),
        month("care", "Weeding"),
        month("harvest", "First cut"),
        month("harvest", "Cutting, drying"),
        month("harvest", "Cutting, drying"),
        month("care", "Regrowth"),
        month("sow", "Autumn sowing"),
        month("harvest", "Cutting, drying"),
        month("care", "Late growth"),
        IDLE,
      ],
      schemes: ["irrigation", "mechanisation", "livestock", "local", "training"],
    },

    protected_cultivation: {
      id: "protected_cultivation",
      title: "Protected cultivation: polyhouse, mushroom or nursery",
      zones: ["valley_temperate", "jammu_plains", "jammu_hills"],
      why:
        "A polyhouse, a mushroom shed or a small nursery earns from a much smaller area than open field cropping. It needs more attention and some upfront spending, but it can work on land where water or open ground is the constraint.",
      zoneNotes: {
        valley_temperate:
          "Cover extends the short valley season at both ends, which is where much of the advantage comes from here.",
        jammu_plains:
          "The problem to solve here is heat and strong light, not cold, so shading and ventilation matter as much as the structure itself.",
        jammu_hills:
          "The cooler conditions help some crops, but access to the site and a reliable water supply need checking before spending anything.",
      },
      requirements: [
        "Training, because the margin is in the management rather than the structure",
        "Upfront money for the structure, trays or growing beds",
        "Reliable water and, for some crops, reliable power",
      ],
      risks: [
        "Disease or contamination causing a total loss while you are still learning",
        "Finding a buyer, which is usually harder than growing the crop",
        "Running costs that continue whether or not the crop does well",
      ],
      missing: "What training is available locally, what a structure would really cost you, and who would buy the produce",
      waterNote:
        "Water is easier to control under cover than in the open, so this can suit a plot with limited water better than open field cropping. It still needs a dependable supply.",
      waterNeed: "low",
      effort: "high",
      cost: "high",
      firstReturns: "quick",
      returnPotential: "medium",
      terrainFit: ["flat", "unknown"],
      sizeFit: "small",
      calendar: [
        month("care", "Winter crop care"),
        month("care", "Winter crop care"),
        month("sow", "Spring crop sown"),
        month("care", "Ventilation, spray"),
        month("harvest", "Spring harvest"),
        month("sow", "Summer crop sown"),
        month("care", "Shade, ventilation"),
        month("harvest", "Summer harvest"),
        month("sow", "Autumn crop sown"),
        month("prepare", "Sterilise, refill beds"),
        month("sow", "Winter crop sown"),
        month("harvest", "Winter harvest"),
      ],
      schemes: ["horticulture", "irrigation", "training", "market", "local"],
    },

    intercrop_or_improve: {
      id: "intercrop_or_improve",
      title: "Improve what you already grow, or add an intercrop",
      zones: ["valley_temperate", "jammu_plains", "jammu_hills"],
      why:
        "If the plot is already cropped, changing a variety, changing when you sow, or adding a second crop that suits the first one is usually cheaper and lower risk than starting something new.",
      zoneNotes: {
        valley_temperate:
          "Rice followed by mustard or oats is an established pattern in the valley, so a second crop along those lines is a known route rather than an experiment.",
        jammu_plains:
          "Rice-wheat where you have irrigation and maize-wheat where you do not are the usual patterns here, so the adjustment is normally within that rotation.",
        jammu_hills:
          "Maize-wheat rotations on rainfed land leave gaps that a well-chosen second crop or mix can use.",
      },
      requirements: [
        "A record of what you grew and how it did",
        "Willingness to trial the change on part of the plot first",
        "Advice on what actually works in your area",
      ],
      risks: [
        "Changing something without advice can reduce the harvest you already have",
        "Labour clashing between the two crops",
        "Extra input cost with no certainty of extra return",
      ],
      missing: "Your recent crop history and the current fertility status of the soil",
      waterNote:
        "This follows the crop you already grow, so it mostly uses water you are already applying. A second crop in the same year usually needs more water, not less.",
      waterNeed: "varies",
      effort: "low",
      cost: "low",
      firstReturns: "seasonal",
      returnPotential: "medium",
      terrainFit: ["flat", "sloped", "unknown"],
      sizeFit: "any",
      calendar: [
        month("care", "Rabi crop in field"),
        month("care", "Rabi crop in field"),
        month("harvest", "Rabi harvest"),
        month("prepare", "Land preparation"),
        month("sow", "Kharif sowing"),
        month("care", "Weeding, inputs"),
        month("care", "Weeding, inputs"),
        month("care", "Crop growth"),
        month("harvest", "Kharif harvest"),
        month("harvest", "Second crop sown"),
        month("care", "Second crop care"),
        month("care", "Rabi crop sown"),
      ],
      schemes: ["soil", "irrigation", "training", "mechanisation", "local"],
    },

    beekeeping: {
      id: "beekeeping",
      title: "Beekeeping as an allied activity",
      zones: ["valley_temperate", "jammu_plains", "jammu_hills"],
      why:
        "A few hives need almost no land and can run alongside whatever else the household does. Where there are fruit trees, oilseed crops or flowering plants nearby, there is usually forage for part of the year.",
      zoneNotes: {
        valley_temperate:
          "Orchards and oilseed crops around the valley give a forage season, though it is short and the colonies need managing for winter.",
        jammu_plains:
          "A longer flowering season supports more foraging, but summer heat and pesticide drift from neighbouring fields are the risks to watch.",
        jammu_hills:
          "Mixed vegetation and fruit trees usually give reasonable forage, and the sites are often shaded and calm.",
      },
      requirements: [
        "Training, and ideally someone experienced living nearby",
        "Equipment, protective clothing and a calm, shaded site",
        "Flowers to forage on within flying distance, through the season",
      ],
      risks: [
        "Colony loss from disease, mites, or spray drifting from nearby fields",
        "Seasonal work that has to be done on time, not when there is spare time",
        "Honey and wax still need a buyer, and prices move year to year",
      ],
      missing: "What flowers when in your area, whether hives already exist nearby, and who could mentor you",
      waterNote:
        "Uses almost no land and no irrigation. Bees need a clean source of water close by, which is normally the only water consideration.",
      waterNeed: "low",
      effort: "medium",
      cost: "medium",
      firstReturns: "quick",
      returnPotential: "low",
      terrainFit: ["flat", "sloped", "unknown"],
      sizeFit: "small",
      calendar: [
        IDLE,
        month("care", "Colony build-up"),
        month("care", "Colony build-up"),
        month("care", "Forage season opens"),
        month("harvest", "Honey flow"),
        month("harvest", "Honey harvest"),
        month("harvest", "Honey harvest"),
        month("care", "Dearth care"),
        month("care", "Mite treatment"),
        month("care", "Winter preparation"),
        month("care", "Winter preparation"),
        IDLE,
      ],
      schemes: ["training", "market", "livestock", "local"],
    },

    saffron_karewa: {
      id: "saffron_karewa",
      title: "Saffron on suitable upland",
      districtsOnly: ["Pulwama", "Budgam", "Srinagar", "Kishtwar"],
      zones: ["valley_temperate", "jammu_hills"],
      why:
        "Saffron is grown in J&K mainly in Pulwama, Budgam, Srinagar and Kishtwar, mostly on the raised uplands known locally as karewas. It is a high-value crop on a small area, and it is also a specialised one with its own risks.",
      zoneNotes: {
        valley_temperate:
          "This is one of the four districts where saffron is actually grown, so there are growers, planting material and advice to be found locally. Whether your particular ground is suitable is still the first question.",
        jammu_hills:
          "Saffron is grown here on suitable upland soils, well outside the valley, which shows the crop follows the ground rather than the district.",
      },
      districtNotes: {
        Pulwama:
          "The Pampore belt on the karewa uplands is the largest saffron growing area in J&K.",
        Budgam: "One of the four main saffron growing districts, after Pulwama.",
        Srinagar: "Saffron is grown in and around the district on suitable upland ground.",
        Kishtwar: "Saffron is grown here on suitable uplands at a distance from the valley.",
      },
      requirements: [
        "Upland ground with the well-drained soil saffron is grown on here",
        "Planting material, which is the first practical constraint",
        "Advice from an existing grower, because this crop is not learned from a leaflet",
      ],
      risks: [
        "Corm rot and disease where the ground does not drain properly",
        "The crop needs water at a particular point in autumn, which is easy to miss",
        "Prices and yields both move, so a good year is not a reliable plan",
      ],
      missing:
        "Whether your ground is the kind saffron is actually grown on here, and where you would realistically get planting material",
      waterNote:
        "Saffron is grown on uplands largely because they drain well, so drainage and soil type matter more than the quantity of water available. There is still a critical irrigation window just before flowering.",
      waterNeed: "low",
      effort: "high",
      cost: "medium",
      firstReturns: "seasonal",
      returnPotential: "high",
      terrainFit: ["flat", "unknown"],
      sizeFit: "small",
      calendar: [
        IDLE,
        IDLE,
        month("care", "Weeding"),
        month("care", "Weeding, check corms"),
        month("prepare", "Bed preparation"),
        month("harvest", "Corm lifting in off years"),
        month("prepare", "Corms stored, beds rested"),
        month("sow", "Irrigation, corm planting"),
        month("sow", "Corm planting"),
        month("harvest", "Flowering and picking"),
        month("harvest", "Picking, drying, separation"),
        IDLE,
      ],
      schemes: ["horticulture", "irrigation", "training", "market", "local"],
    },
  };

  // `short` is used inside the calendar cells where space is tight, `label`
  // everywhere else.
  var PHASES = {
    prepare: { label: "Prepare", short: "Prepare", order: 0 },
    sow: { label: "Sow or plant", short: "Sow", order: 1 },
    care: { label: "Care", short: "Care", order: 2 },
    harvest: { label: "Harvest", short: "Harvest", order: 3 },
    quiet: { label: "Quiet", short: "Quiet", order: 4 },
  };

  var MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  Object.keys(ACTIVITIES).forEach(function (id) {
    var a = ACTIVITIES[id];
    if (!a.reviewStatus) a.reviewStatus = "not-reviewed";
    if (a.reviewedBy == null) a.reviewedBy = "";
    if (a.designation == null) a.designation = "";
    if (a.reviewedOn == null) a.reviewedOn = "";
  });

  window.MLMP_CATALOGUE = {
    review: CATALOGUE_REVIEW,
    confirmationLine: CONFIRM_LINE,
    activities: ACTIVITIES,
    phases: PHASES,
    months: MONTHS,
    ids: Object.keys(ACTIVITIES),
  };
})();
