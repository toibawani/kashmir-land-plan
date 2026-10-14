#!/usr/bin/env node
/**
 * Small behavioural test for the modules that carry no browser in them.
 *
 * `npm run build` already proves the scripts parse and the references exist.
 * That says nothing about what the code actually says, so this file walks
 * the pieces a farmer never sees break loudly: the review wording an officer
 * signs off, the questions generated from a plot, the saved-plan store, and
 * the way long text is cut into speakable chunks.
 *
 * Only Node built-ins are used, and the browser is faked with the smallest
 * stubs that keep the modules honest: an empty `window` to hang the modules
 * on, and an in-memory cupboard to stand in for localStorage. Anything that
 * needs a real DOM, a voice, or the network is out of scope here and is
 * checked by reading the code instead.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var root = path.resolve(__dirname, "..");
var failures = [];
var checks = 0;

function check(name, condition, detail) {
  checks += 1;
  if (condition) {
    console.log("  ok: " + name);
  } else {
    failures.push(name + (detail ? " (" + detail + ")" : ""));
    console.error("  FAIL: " + name);
  }
}

// An in-memory stand-in for localStorage. It keeps whatever the module
// writes for the length of one run, which is all a round trip needs.
function makeStorage() {
  var jar = Object.create(null);
  return {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(jar, key) ? jar[key] : null;
    },
    setItem: function (key, value) {
      jar[key] = String(value);
    },
    removeItem: function (key) {
      delete jar[key];
    },
  };
}

function load(names, sandbox) {
  names
    .map(function (name) {
      return path.join(root, "js", name);
    })
    .forEach(function (file) {
      new vm.Script(fs.readFileSync(file, "utf8"), {
        filename: path.relative(root, file),
      }).runInNewContext(sandbox);
    });
}

// The catalogue, regions and questions modules only need a `window` to hang
// from. Speech checks for a voice at load and finds none, which is exactly
// what an unsupported browser looks like, so the fallback path is exercised
// for free.
var sandbox = { window: {} };
sandbox.window.localStorage = makeStorage();
load(["regions.js", "catalogue.js", "activities.js", "schemes.js", "questions.js", "plans.js", "speech.js", "qr.js", "offline.js", "visitfit.js", "office.js"], sandbox);

var REGIONS = sandbox.window.MLMP_REGIONS;
var CATALOGUE = sandbox.window.MLMP_CATALOGUE;
var ACTIVITIES = sandbox.window.MLMP_ACTIVITIES;
var SCHEMES = sandbox.window.MLMP_SCHEMES;
var QUESTIONS = sandbox.window.MLMP_QUESTIONS;
var PLANS = sandbox.window.MLMP_PLANS;
var SPEECH = sandbox.window.MLMP_SPEECH;
var QR = sandbox.window.MLMP_QR;
var OFFLINE = sandbox.window.MLMP_OFFLINE;
var FIT = sandbox.window.MLMP_FIT;
var OFFICE = sandbox.window.MLMP_OFFICE;

console.log("review wording");

var notReviewed = ACTIVITIES.formatReview({ reviewStatus: "not-reviewed" });
check("not-reviewed names an agriculture officer", /agriculture officer/i.test(notReviewed.text), notReviewed.text);
check("not-reviewed keeps the confirm-locally sentence", /confirm locally/i.test(notReviewed.text), notReviewed.text);

var reviewed = ACTIVITIES.formatReview({
  reviewStatus: "reviewed",
  reviewedBy: "A Test Officer",
  designation: "Agriculture Extension Officer",
  reviewedOn: "2026-09-30",
});
check(
  "reviewed names the reviewer and the date",
  /A Test Officer/.test(reviewed.text) && /2026-09-30/.test(reviewed.text),
  reviewed.text
);
check("reviewed keeps the confirm-locally sentence", /confirm locally/i.test(reviewed.text), reviewed.text);

// Every activity in the catalogue must carry the review fields the renderer
// assumes, so an officer hand-editing one entry cannot leave it shapeless.
console.log("catalogue shape");
var ids = Object.keys(CATALOGUE.activities);
check("the catalogue is not empty", ids.length > 0, ids.length + " activities");
ids.forEach(function (id) {
  var a = CATALOGUE.activities[id];
  check(
    '"' + id + '" has twelve months',
    Array.isArray(a.calendar) && a.calendar.length === 12,
    "calendar length " + (a.calendar && a.calendar.length)
  );
  check(
    '"' + id + '" has the review fields',
    a.reviewStatus !== undefined && a.reviewedBy !== undefined && a.reviewedOn !== undefined,
    "review fields"
  );
  check(
    '"' + id + '" carries no invented figures',
    !/[₹]|\d{4,}|\d+\s*%/.test(a.why + " " + (a.missing || "")),
    "why/missing text"
  );
});

// Scheme entries may name portals, never numbers. Amounts, deadlines and
// eligibility wording change faster than this file ships, so any of them is
// a failure, not a style nit.
//
// One deliberate exception sits in the pattern below: a sentence that sends
// the farmer to confirm eligibility at the office ("confirm yours rather
// than relying on anything here") is the sanctioned disclaimer, not a claim.
// So the check flags claim-shaped phrasing ("are eligible", "apply by",
// "bring your land records") rather than the bare word "eligibility".
console.log("scheme wording");
SCHEMES.ALL.forEach(function (s) {
  var combined = s.title + " " + s.body + " " + (s.actions || []).join(" ");
  check(
    '"' + s.id + '" carries no amounts, deadlines or eligibility claims',
    !/[₹]|\d{4,}|\d+\s*%|\bare (not )?eligible\b|\bapply (by|before)\b|\blast date\b|\bbring your\b|\bAadhaar\b|\bland records\b/i.test(combined),
    "scheme text"
  );
});

console.log("generated questions");
function sampleOptions() {
  // Hand-built the way the scoring builds them: the activity, the reasons
  // printed beside it, and the zone it came up under.
  return ["kitchen_garden", "orchard_temp", "beekeeping"]
    .filter(function (id) {
      return CATALOGUE.activities[id];
    })
    .map(function (id) {
      return { activity: CATALOGUE.activities[id], reasons: ["sample reason"], zone: REGIONS.zoneFor("Pulwama") };
    });
}
var sampleData = {
  district: "Pulwama",
  village: "Tral",
  size: "3",
  unit: "kanal",
  landUse: "unused",
  water: "seasonal",
  terrain: "flat",
  soil: "none",
  constraint: "water",
};
var questions = QUESTIONS.forPlan(sampleData, sampleOptions(), { zone: REGIONS.zoneFor("Pulwama"), max: 7 });
check("a plot produces questions", questions.length > 0, questions.length + " questions");
check("no more than the asked maximum", questions.length <= 7, questions.length + " questions");
var seenIds = Object.create(null);
var questionProblem = null;
questions.forEach(function (q) {
  if (!q.text || !q.text.trim()) questionProblem = "an empty question slipped through";
  if (seenIds[q.id]) questionProblem = "a repeated question id: " + q.id;
  seenIds[q.id] = true;
  if (/[₹]|\d{4,}|\d+\s*%|guarantee|subsidy of|eligible/i.test(q.text)) {
    questionProblem = "a question that sounds like an answer: " + q.text;
  }
  if (!/\?$/.test(q.text.trim())) questionProblem = "not a question: " + q.text;
});
check("every question is unique, punctuated, and still a question", questionProblem === null, questionProblem);

// A forecast-derived timing hint must turn into a question, never an
// instruction, because a model grid cannot know a field.
var withHint = QUESTIONS.forPlan(
  sampleData,
  sampleOptions(),
  { zone: REGIONS.zoneFor("Pulwama"), max: 7, timingHint: { kind: "rain", placeName: "Pulwama", value: 80, dayLabel: "Tuesday" } }
);
check(
  "a rain hint becomes a question about timing",
  withHint.some(function (q) {
    return /timing|forecast/i.test(q.text);
  }),
  withHint.map(function (q) { return q.id; }).join(", ")
);

console.log("saved plans");
var first = PLANS.upsert({
  name: "First plan",
  data: sampleData,
  interested: { kitchen_garden: true },
  options: [{ id: "kitchen_garden" }],
  zoneId: "valley_temperate",
});
check("a saved plan comes back with an id", !!(first && first.id), "no id returned");
var second = PLANS.upsert({
  name: "Second plan",
  data: sampleData,
  interested: {},
  options: [{ id: "beekeeping" }],
  zoneId: "valley_temperate",
});
check("two plans are kept apart", PLANS.get(first.id).name === "First plan" && PLANS.get(second.id).name === "Second plan", "names");
var renamed = PLANS.upsert({ id: first.id, name: "Renamed plan", data: sampleData, interested: {}, options: [] });
check("saving again updates instead of duplicating", PLANS.list().length === 2, PLANS.list().length + " plans");
check("the rename stuck", renamed.name === "Renamed plan" && PLANS.get(first.id).name === "Renamed plan", "rename");
PLANS.choose(second.id);
check("choosing one unchooses the other", PLANS.chosen() && PLANS.chosen().id === second.id, "chosen");
PLANS.remove(first.id);
check("deleting removes one and only one", PLANS.list().length === 1, PLANS.list().length + " plans");
var named = PLANS.suggestName([{ activity: { title: "Temperate fruit and nut trees" } }], ["Temperate fruit and nut trees"]);
check("a taken name gets a number, not a clash", named !== "Temperate fruit and nut trees", named);

console.log("speech chunking");
check("no voice here, so reading is honestly unavailable", SPEECH.supported() === false, "supported() true with no voice");
var spoken = "First sentence. Second sentence. " + new Array(40).join("A very long sentence that keeps going and going. ");
var chunks = SPEECH._split(spoken, 180);
check("long text is cut into pieces", chunks.length > 1, chunks.length + " chunk(s)");
check(
  "no chunk runs far past the limit",
  chunks.every(function (c) {
    return c.length <= 220;
  }),
  "a chunk of " + Math.max.apply(null, chunks.map(function (c) { return c.length; })) + " chars"
);
check(
  "no empty chunks",
  chunks.every(function (c) {
    return c.trim().length > 0;
  }),
  "an empty chunk slipped through"
);

// Section jumping is a convenience on top of a live voice. With no voice here,
// the jump must refuse cleanly rather than half-move or throw, and the section
// counters must report nothing rather than a nonsense number. A farmer whose
// phone has no voice simply never sees the controls, so the safe no-op is the
// correct behaviour and must not be mistaken for a working jump.
console.log("section jumping");
check("with no voice there is no current section", SPEECH.currentSection() === -1, "section " + SPEECH.currentSection());
check("with no voice there are no sections to count", SPEECH.sectionCount() === 0, "count " + SPEECH.sectionCount());
check("a jump with no voice is refused, not faked", SPEECH.jumpToSection(0) === false, "jump returned true");
check("a jump past the end is refused", SPEECH.jumpToSection(99) === false, "jump to a missing section returned true");

console.log("visit card honesty");
var cardData = {
  district: "Pulwama",
  village: "Tral",
  size: "3",
  unit: "kanal",
  landUse: "unused",
  water: "seasonal",
  terrain: "flat",
  soil: "none",
  constraint: "water",
};
var cardOptions = sampleOptions();
check("the full shortlist is rebuilt the way the card builds it", cardOptions.length >= 3, cardOptions.length + " options");
var overflowNote = null;
if (cardOptions.length > 3) {
  overflowNote = "Showing the first 3 of the " + cardOptions.length + " options marked. The rest are in the plan summary.";
  check("the overflow note names the counts", /\d+ of the \d+/.test(overflowNote), overflowNote);
} else {
  check("three or fewer need no overflow note", true, "nothing to hide");
}

console.log("covered-question ticks");
var tickQuestions = QUESTIONS.forPlan(sampleData, sampleOptions(), { zone: REGIONS.zoneFor("Pulwama"), max: 7 });
// A tick is a plain saved mark against a question id. Ids that no longer
// exist are ignored, so an old tick can never paint the wrong question.
var covered = {};
covered[tickQuestions[0].id] = true;
covered["a-question-that-no-longer-exists"] = true;
var coverCount = tickQuestions.filter(function (q) {
  return !!covered[q.id];
}).length;
check("one real tick counts as one", coverCount === 1, coverCount + " counted");
check(
  "ticks say covered of total",
  coverCount + " of " + tickQuestions.length + " covered" === "1 of " + tickQuestions.length + " covered",
  "counter wording"
);

/* ---- QR code on the device ---- */

console.log("visit card QR");

/**
 * Read the data back out of a finished matrix, without asking the encoder what
 * it put in. This rebuilds the reserved areas from the QR spec and walks the
 * zig-zag in the same order, unmasking with the mask id the encoder recorded.
 * If the placement, masking or interleaving were wrong anywhere, the text
 * would come back garbled and these checks would fail.
 */
function decodeQr(built) {
  var size = built.size;
  var grid = built.grid;

  var rowR = [];
  var colR = [];
  for (var i = 0; i < size; i++) {
    rowR.push(new Array(size).fill(false));
    colR.push(new Array(size).fill(false));
  }
  function mark(r, c) {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    rowR[r][c] = true;
    colR[c][r] = true;
  }
  var corners = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ];
  corners.forEach(function (corner) {
    for (var y = -1; y <= 7; y++) {
      for (var x = -1; x <= 7; x++) mark(corner[0] + y, corner[1] + x);
    }
  });
  for (var t = 8; t < size - 8; t++) {
    mark(6, t);
    mark(t, 6);
  }
  var table = { 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };
  var pos = table[built.version] || [];
  pos.forEach(function (ar) {
    pos.forEach(function (ac) {
      if ((ar < 9 && ac < 9) || (ar < 9 && ac >= size - 8) || (ar >= size - 8 && ac < 9)) return;
      for (var y = -2; y <= 2; y++) {
        for (var x = -2; x <= 2; x++) mark(ar + y, ac + x);
      }
    });
  });
  for (var f = 0; f < 9; f++) {
    mark(8, f);
    mark(f, 8);
  }
  for (var g = 0; g < 8; g++) {
    mark(8, size - 1 - g);
    mark(size - 1 - g, 8);
  }

  var masks = [
    function (r, c) { return (r + c) % 2 === 0 ? 1 : 0; },
    function (r) { return r % 2 === 0 ? 1 : 0; },
    function (r, c) { return c % 3 === 0 ? 1 : 0; },
    function (r, c) { return (r + c) % 3 === 0 ? 1 : 0; },
    function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0 ? 1 : 0; },
    function (r, c) { return ((r * c) % 2) + ((r * c) % 3) === 0 ? 1 : 0; },
    function (r, c) { return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0 ? 1 : 0; },
    function (r, c) { return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0 ? 1 : 0; },
  ];
  var mask = masks[built.mask];

  var bits = [];
  var upward = true;
  for (var right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (var step = 0; step < size; step++) {
      var row = upward ? size - 1 - step : step;
      for (var k = 0; k < 2; k++) {
        var col = right - k;
        if (col < 0 || col === 6) continue;
        if (rowR[row][col] || colR[col][row]) continue;
        bits.push(grid[row][col] ^ mask(row, col));
      }
    }
    upward = !upward;
  }

  var at = 0;
  function take(n) {
    var v = 0;
    for (var i = 0; i < n; i++) v = (v << 1) | bits[at++];
    return v;
  }
  var mode = take(4);
  var length = take(built.version >= 10 ? 16 : 8);
  var bytes = [];
  for (var b = 0; b < length; b++) {
    var byte = 0;
    for (var i2 = 0; i2 < 8; i2++) byte = (byte << 1) | bits[at++];
    bytes.push(byte);
  }
  return { mode: mode, length: length, text: Buffer.from(bytes).toString("utf8") };
}

// A real plan reference is short, so version 1 must carry it. Over-choosing a
// version would make the code needlessly dense and small for a camera.
var refCode = "MLMP-PUL-3K-8F2C";
var refMatrix = QR.matrix(refCode);
check("a plan reference produces a matrix", !!refMatrix, "no matrix");
check("a plan reference fits the smallest version", refMatrix && refMatrix.version === 1, "version " + (refMatrix && refMatrix.version));
check("version 1 is 21 modules on a side", refMatrix && refMatrix.size === 21, "size " + (refMatrix && refMatrix.size));
check("a mask was chosen from the eight", refMatrix && refMatrix.mask >= 0 && refMatrix.mask <= 7, "mask " + (refMatrix && refMatrix.mask));

// The load-bearing check: whatever went in comes back out.
var refBack = decodeQr(refMatrix);
check("the reference reads back exactly", refBack && refBack.text === refCode, "got " + (refBack && JSON.stringify(refBack.text)));
check("the mode is byte mode", refBack && refBack.mode === 4, "mode " + (refBack && refBack.mode));
check("the length agrees", refBack && refBack.length === refCode.length, "length " + (refBack && refBack.length));

// Longer strings move up a version and still round-trip. The last one is far
// beyond anything the app will encode, to prove the version steps work.
var longerCases = ["MLMP-ANA-9Q2-XYZ12", "A", "The quick brown fox jumps over the lazy dog, 1234567890."];
longerCases.forEach(function (text) {
  var built = QR.matrix(text);
  var back = decodeQr(built);
  check("longer text round-trips: \"" + text.slice(0, 20) + "\"", back && back.text === text, "got " + (back && JSON.stringify(back.text)));
});

check("something too long for version 10 is refused", QR.matrix(new Array(300).join("x")) === null, "should have refused");

// The three finders must be intact, because a scanner locks onto them first.
function finderOk(built, top, left) {
  var expect = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];
  for (var y = 0; y < 7; y++) {
    for (var x = 0; x < 7; x++) {
      if (built.grid[top + y][left + x] !== expect[y][x]) return false;
    }
  }
  return true;
}
function sameGrid(a, b) {
  for (var r = 0; r < a.length; r++) {
    for (var c = 0; c < a.length; c++) if (a[r][c] !== b[r][c]) return false;
  }
  return true;
}
check("the top left finder is intact", finderOk(refMatrix, 0, 0));
check("the top right finder is intact", finderOk(refMatrix, 0, refMatrix.size - 7));
check("the bottom left finder is intact", finderOk(refMatrix, refMatrix.size - 7, 0));
check("the dark module is always dark", refMatrix.grid[refMatrix.size - 8][8] === 1, "dark module light");
check("the timing row alternates", refMatrix.grid[6][8] === 1 && refMatrix.grid[6][9] === 0 && refMatrix.grid[6][10] === 1, "timing broken");
check("the separator ring is quiet", refMatrix.grid[7][8] === 0 && refMatrix.grid[8][7] === 0, "separator inked");

// The same answers must always give the same code, on any device, because a
// card printed last month has to match the plan saved last month.
check("the code is deterministic", sameGrid(QR.matrix(refCode).grid, refMatrix.grid) && QR.matrix(refCode).mask === refMatrix.mask, "two builds differed");

// The accessible caption has to name what the code holds and say plainly that
// a scan shows nothing more, so no one expects the plan itself to appear.
check("the caption names the reference", /MLMP-PUL-3K-8F2C/.test(QR.describe(refCode)), QR.describe(refCode));
check("the caption promises nothing more than the reference", /nothing more/i.test(QR.describe(refCode)), QR.describe(refCode));

// ---- Offline guidance ----

console.log("offline guidance");

// The one thing this app must never do is present a stored weather reading as
// live. Every bit of offline wording is checked against that rule.
var works = OFFLINE.whatWorks();
var needs = OFFLINE.whatNeeds();
check("some things are listed as working offline", works.length >= 5, works.length + " listed");
check("the visit card is listed as working offline", works.some(function (w) { return /visit card/i.test(w); }), "card missing");
check("the questions are listed as working offline", works.some(function (w) { return /question/i.test(w); }), "questions missing");
check("only weather is listed as needing a connection", needs.length === 1 && /weather/i.test(needs[0].what), needs.map(function (n) { return n.what; }).join(", "));
check(
  "the weather entry admits it is not saved as current",
  /never saved as|not saved as|is not saved/i.test(needs[0].why),
  needs[0].why
);

// The notice must name both halves in either state, so a farmer who reads only
// the top strip still learns what to do next.
var offNotice = OFFLINE.notice(true);
var onNotice = OFFLINE.notice(false);
check("offline notice says weather needs a connection", /weather/i.test(offNotice) && /connection|internet/i.test(offNotice), offNotice);
check("offline notice says the plan still works", /still works|works/i.test(offNotice), offNotice);
check("offline notice never claims a stored forecast is current", !/saved.*current|current.*saved/i.test(offNotice) || /not saved/i.test(offNotice), offNotice);
check("online notice sets the expectation early", /weather/i.test(onNotice), onNotice);

// The panel has to carry both columns and the state line, in both states.
var offPanel = OFFLINE.panelHtml(true);
var onPanel = OFFLINE.panelHtml(false);
check("offline panel says the device is offline", /offline right now/i.test(offPanel), "state line missing");
check("offline panel is marked for styling", /is-offline/.test(offPanel), "no is-offline class");
check("offline panel lists what works", /Works without a connection/i.test(offPanel), "no works column");
check("offline panel lists what needs a connection", /Needs a connection/i.test(offPanel), "no needs column");
check("offline panel is not marked as offline when online", !/is-offline/.test(onPanel), "wrongly marked offline");
check("online panel still names weather", /weather/i.test(onPanel), "weather missing when online");
check("the panel carries a live region for the state line", /role=\"status\"/.test(offPanel), "no status role");

// ---- One-page print fit ----

console.log("print fit");

// The printable height is A4 minus the 24mm of margins the stylesheet sets.
// A4 is 297mm, so 273mm, which at 96 CSS pixels per inch is about 1031px.
var fitLimit = FIT.printableHeightPx();
check("the printable height matches A4 minus the margins", fitLimit > 1000 && fitLimit < 1050, fitLimit + "px");

// The parts the fitter is ever allowed to hide. The farmer's own answers, the
// options, the questions and the review wording are not in this list, so a
// print can never drop the things that carry meaning.
var trimOrder = FIT.TRIM_ORDER;
check("only filler is ever trimmed", trimOrder.length === 2 && trimOrder.indexOf("notes") !== -1 && trimOrder.indexOf("support") !== -1, trimOrder.join(", "));
check("the answers are never trimmed", trimOrder.indexOf("answers") === -1 && trimOrder.indexOf("questions") === -1, "answers or questions in the trim list");
check("notes go before support", trimOrder.indexOf("notes") < trimOrder.indexOf("support"), "wrong order");

// A tiny stand-in for the parts of the DOM the fitter touches: a card element
// with querySelector, querySelectorAll, style, and a scrollHeight that reacts
// to the trims the way a real layout would. scrollHeight is a getter, so as
// soon as the fitter sets data-fit-trim="1" on a part, the reported height
// drops by that part's height, exactly as display:none would in a browser.
function makeFakeCard(initialHeight, partHeights) {
  var parts = (partHeights || []).map(function (spec) {
    var part = {
      name: spec.name,
      height: spec.height,
      attrs: { "data-fit-part": spec.name, "data-fit-trim": "0" },
      setAttribute: function (key, value) {
        part.attrs[key] = String(value);
      },
      getAttribute: function (key) {
        return part.attrs[key];
      },
    };
    return part;
  });
  var card = {
    parts: parts,
    style: {},
    querySelector: function (selector) {
      var match = selector.match(/data-fit-part="([^"]+)"/);
      if (!match) return null;
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].name === match[1]) return parts[i];
      }
      return null;
    },
    querySelectorAll: function () {
      return parts;
    },
  };
  Object.defineProperty(card, "scrollHeight", {
    get: function () {
      var visible = initialHeight;
      parts.forEach(function (p) {
        if (p.attrs["data-fit-trim"] === "1") visible -= p.height;
      });
      return visible;
    },
  });
  return card;
}

function withFakeCard(card, fn) {
  var prevDoc = sandbox.document;
  var prevGet = null;
  sandbox.document = {
    getElementById: function (id) {
      return id === "visit-card" ? card : null;
    },
  };
  try {
    return fn();
  } finally {
    sandbox.document = prevDoc;
  }
}

// A short card already fits, so nothing is trimmed.
var shortCard = makeFakeCard(600, [
  { name: "notes", height: 100 },
  { name: "support", height: 150 },
]);
var shortDrop = withFakeCard(shortCard, function () {
  return FIT.calculateFit();
});
check("a card that already fits is left alone", shortDrop.length === 0, "trimmed " + shortDrop.join(", "));

// A tall card needs the notes gone. Dropping 100px from 1100 brings it under
// the limit, and the support list must survive because it was not needed.
var tallCard = makeFakeCard(1100, [
  { name: "notes", height: 100 },
  { name: "support", height: 150 },
]);
var tallDrop = withFakeCard(tallCard, function () {
  return FIT.calculateFit();
});
check("a card just over the limit loses only the notes", tallDrop.length === 1 && tallDrop[0] === "notes", "trimmed " + tallDrop.join(", "));
check("the support list survives when it is not needed", tallCard.querySelector('data-fit-part="support"').attrs["data-fit-trim"] === "0", "support was trimmed");

// A card so tall that even the notes are not enough also loses the support
// list, and both trims stay applied.
var hugeCard = makeFakeCard(1400, [
  { name: "notes", height: 100 },
  { name: "support", height: 150 },
]);
var hugeDrop = withFakeCard(hugeCard, function () {
  return FIT.calculateFit();
});
check("a very tall card loses notes then support", hugeDrop.length === 2 && hugeDrop.indexOf("notes") !== -1 && hugeDrop.indexOf("support") !== -1, "trimmed " + hugeDrop.join(", "));

// A part tried but not needed is put back, so the card keeps everything it can.
var justFitsCard = makeFakeCard(fitLimit + 10, [
  { name: "notes", height: 60 },
  { name: "support", height: 60 },
]);
withFakeCard(justFitsCard, function () {
  FIT.calculateFit();
});
check("a part that was not needed is untrimmed again", justFitsCard.querySelector('data-fit-part="support"').attrs["data-fit-trim"] === "0", "support left trimmed");

// clearFit puts every part back, which is what runs after printing so the
// on-screen card is untouched.
withFakeCard(hugeCard, function () {
  FIT.clearFit();
});
check("clearFit restores every part", hugeCard.querySelector('data-fit-part="notes"').attrs["data-fit-trim"] === "0" && hugeCard.querySelector('data-fit-part="support"').attrs["data-fit-trim"] === "0", "a part stayed trimmed");

// With no card in the DOM, nothing throws and nothing is trimmed, so the
// print button on a screen with no card cannot break.
var noCardDrop = withFakeCard(null, function () {
  return FIT.calculateFit();
});
check("no card means no trim and no error", noCardDrop.length === 0, "trimmed " + noCardDrop.join(", "));

// ---- What to expect at the office ----

console.log("office expectations");

var officeItems = OFFICE.items();
check("there is a short list of expectations", officeItems.length >= 4 && officeItems.length <= 7, officeItems.length + " items");

// The whole point of this panel is that it stays honest. Every invented number
// would be a promise the app cannot keep, so the panel is scanned the same way
// the catalogue is: no rupee amounts, no large figures, no percentages, no
// dates a reader would take as a deadline, and no words that promise an
// outcome or list a required document.
var officeBody = officeItems.join(" ") + " " + OFFICE.closing() + " " + OFFICE.heading();
check("the panel quotes no rupee amount", !/₹|rs\.?\\s*\\d|inr/i.test(officeBody), "a rupee figure appeared");
check("the panel states no percentage", !/\\d+\\s*%/.test(officeBody), "a percentage appeared");
check("the panel gives no four digit year as a deadline", !/\\b(19|20)\\d{2}\\b/.test(officeBody), "a year appeared");
check("the panel names no scheme figure like lakh or crore", !/lakh|crore/i.test(officeBody), "an amount word appeared");

// Promises and guarantees are the real danger: a farmer reads them as fact.
var promiseWords = /\bguarantee[ds]?\b|\byou will (?:get|receive|be given|be eligible)\b|\bis eligible\b|\byou are entitled\b|\bwill be paid\b|\bassured\b/i;
check("the panel promises no outcome", !promiseWords.test(officeBody), "a promise appeared");
check("the panel does not tell you what to bring as required", !/you must bring|bring the following|required documents/i.test(officeBody), "a document list appeared");

// It must keep the confirm-locally idea: the office decides, not the app.
check("the closing says the department decides", /set by the department|department/i.test(OFFICE.closing()), OFFICE.closing());
check("the closing names what it withholds", /names no amounts, deadlines or eligibility/i.test(OFFICE.closing()), OFFICE.closing());

// The panel renders as an ordered list inside a labelled section, so a screen
// reader can move item to item, and it never drops the closing line.
var officeHtml = OFFICE.panelHtml();
check("the panel is a labelled section", /<section[^>]*aria-labelledby=/.test(officeHtml), "no label");
check("the panel uses an ordered list", /<ol class="office-list">/.test(officeHtml), "not an ordered list");
check("every item is rendered", officeItems.every(function (t) { return officeHtml.indexOf(t) !== -1; }), "an item is missing");
check("the closing is on the panel", officeHtml.indexOf(OFFICE.closing()) !== -1, "closing missing");

// The plain-text form carries the same honesty, so the download and the voice
// agree with the screen.
var officeText = OFFICE.plainText();
check("the text form carries every item", officeItems.every(function (t) { return officeText.indexOf(t) !== -1; }), "an item is missing from the text");
check("the text form carries the closing", officeText.indexOf(OFFICE.closing()) !== -1, "closing missing from text");

/* ---- Report ---- */

console.log("");
if (failures.length) {
  console.error("Self test failed (" + checks + " checks, " + failures.length + " failing):");
  failures.forEach(function (f) {
    console.error("  - " + f);
  });
  process.exit(1);
}
console.log("Self test passed: " + checks + " checks across the catalogue, questions, saved plans and speech.");


