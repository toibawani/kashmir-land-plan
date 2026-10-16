/**
 * What counts as a claim this app is not allowed to make.
 *
 * This project shows a farmer options to discuss, never figures to rely on: no
 * amounts, no deadlines, no eligibility rules, no document lists, no promised
 * outcomes. Those are the facts that change, and this prototype cannot verify
 * any of them. A number on a screen reads like an authority even when a caveat
 * sits underneath it, so the rule is to ship no number rather than to ship a
 * warning next to one.
 *
 * The patterns live here, in one place, because they are used twice: the build
 * check (tools/verify.js) applies them to the shipped copy an officer or a
 * maintainer might edit, and the behavioural suite (tools/selftest.js) applies
 * them to the text the app generates at run time. Two copies of this list would
 * drift, and the weaker copy would be the one that mattered.
 *
 * What this deliberately does NOT catch, so nobody mistakes it for complete:
 * a misleading sentence with no numbers in it, or a claim phrased in a way
 * nobody has thought of. It catches the shapes that have been argued about
 * here, and a person still has to read the copy.
 */
"use strict";

/* A number in this copy is a quantity or a date, and this app ships neither.
   Kept as its own rule so the failure says that plainly rather than listing
   twelve patterns that all amount to "there is a number here". */
var DIGITS = {
  name: "a number",
  re: /\d/,
  why: "a figure in this copy is a quantity or a date, and this app ships neither",
};

var BANNED = [
  {
    name: "a currency symbol",
    // Rupee, dollar, euro and pound, written as escapes so this file stays ASCII.
    re: /[\u20b9\u20ac\u00a3$]/,
    why: "amounts change and this app cannot verify them",
  },
  {
    name: "a currency name",
    re: /\b(Rs\.?|INR|rupees?)\b/i,
    why: "an amount reads like an authority even with a caveat under it",
  },
  {
    name: "a large-sum word",
    re: /\b(lakhs?|crores?)\b/i,
    why: "an amount reads like an authority even with a caveat under it",
  },
  {
    name: "a percentage",
    re: /%|\bper ?cent\b/i,
    why: "a rate is an amount, and this app cannot verify one",
  },
  {
    name: "an amount word",
    re: /\b(amount|subsidy of|payment of|cost of|price of|rate of)\b/i,
    why: "this app lists what a programme is for, never what it pays",
  },
  {
    name: "a deadline",
    re: /\b(deadline|last date|due date|apply by|applications? (close|open)|cut-?off date)\b/i,
    why: "deadlines move faster than a static page can follow",
  },
  {
    name: "a dated window",
    re: /\bwithin\s+(a|an|\d+)\s+(day|week|month|year)s?\b/i,
    why: "a window is a deadline in other words",
  },
  {
    name: "a month with a year",
    re: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/,
    why: "a dated claim goes stale in the browser of a farmer who installed this months ago",
  },
  {
    name: "an eligibility promise",
    re: /\b(you|farmers?|households?|applicants?)\s+(are|is|will be|may be)\s+(also\s+)?eligible\b/i,
    why: "this app cannot determine who is eligible for anything",
  },
  {
    name: "an eligibility condition",
    re: /\beligible\s+(if|when|only|provided)\b/i,
    why: "a condition reads as a rule, and the office decides rules",
  },
  {
    name: "eligibility criteria",
    re: /\beligibility\s+(criteria|conditions?|requirement)\b/i,
    why: "listing criteria is the same as setting them",
  },
  {
    name: "a requirement to own or hold something",
    re: /\b(must|should|need to|required to)\s+(own|have|hold|submit|produce)\b/i,
    why: "this app does not state what a scheme requires",
  },
  {
    name: "a document list",
    re: /\b(required|needed|supporting|following)\s+documents?\b|\bdocuments?\s+(required|needed|to submit|to bring)\b/i,
    why: "document lists change, and a farmer who carries the wrong papers has wasted a trip",
  },
  {
    name: "a promised outcome",
    re: /\b(guarantee|guaranteed|guarantees|assured|promised?)\b/i,
    why: "no yield, price or income can be promised here",
  },
  {
    name: "an earning claim",
    re: /\b(will|can|should)\s+(earn|get|receive)\s+(up to|\d|the)\b/i,
    why: "an expected income is exactly the kind of figure this app refuses to print",
  },
];

/**
 * Every claim pattern a piece of user-facing text trips over, as
 * `{ name, why, match }`. Empty means the text makes no claim this app bans.
 */
function findClaims(text) {
  var found = [];
  var value = String(text == null ? "" : text);
  BANNED.concat([DIGITS]).forEach(function (rule) {
    var m = rule.re.exec(value);
    if (m) found.push({ name: rule.name, why: rule.why, match: m[0] });
  });
  return found;
}

/** One readable line for a failure message. */
function describeClaim(hit) {
  return hit.name + ' ("' + hit.match + '"): ' + hit.why;
}

module.exports = {
  BANNED: BANNED,
  DIGITS: DIGITS,
  findClaims: findClaims,
  describeClaim: describeClaim,
};
