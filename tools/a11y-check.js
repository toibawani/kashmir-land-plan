#!/usr/bin/env node
/**
 * Keyboard, 200% text and contrast checks, run by `npm run a11y`.
 *
 * These are the checks a manual reviewer would do, made repeatable:
 *
 *   1. Keyboard only: Tab through the visit card, the photo buttons, the
 *      timeline and the comparison, and prove every stop is visible, reachable
 *      and not a trap.
 *   2. Text at 200%: the whole layout has to survive a doubled root font size
 *      without spilling sideways or clipping a heading.
 *   3. Contrast: every run of text is measured against its own background, in
 *      the default scheme and with a dark scheme requested.
 *
 * Like the other browser tools it needs the folder served and Chrome on 9333.
 * Exit code 1 means at least one check found something.
 */
"use strict";

var H = require("./lib/harness.js");

var base = process.argv[2] || "http://127.0.0.1:8080";
var port = process.argv[3] || "9333";
var VIEWPORT = { width: 360, height: 740, deviceScaleFactor: 1, mobile: true };

var failures = [];
var notes = [];

function fail(name, detail) {
  failures.push({ name: name, detail: detail });
  console.log("FAIL " + name);
  (detail || []).forEach(function (d) {
    console.log("  - " + d);
  });
}

function ok(name, detail) {
  console.log("ok   " + name + (detail ? ": " + detail : ""));
}

/** Press Tab once and describe what it landed on. */
var FOCUS_STATE = `(function () {
  var el = document.activeElement;
  if (!el || el === document.body) return { none: true };
  var cs = window.getComputedStyle(el);
  var r = el.getBoundingClientRect();
  var outline = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ||
    (cs.boxShadow && cs.boxShadow !== "none");
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || "",
    cls: typeof el.className === "string" ? el.className : "",
    text: (el.getAttribute("aria-label") || el.textContent || el.value || "").replace(/\\s+/g, " ").trim().slice(0, 48),
    html: el.outerHTML.slice(0, 90),
    tick: el.getAttribute("data-question-tick") || "",
    compareId: el.getAttribute("data-photo-compare") || "",
    photoTake: el.hasAttribute("data-photo-take"),
    photoCompare: el.hasAttribute("data-photo-compare"),
    top: Math.round(r.top + window.scrollY),
    height: Math.round(r.height),
    visibleFocus: !!outline,
    outline: cs.outlineStyle + " " + cs.outlineWidth + " / " + (cs.boxShadow || "none").slice(0, 30)
  };
})()`;

async function pressTab(cdp) {
  // rawKeyDown, not keyDown: the latter is treated as text input by the
  // protocol and types a tab character into a focused field instead of moving
  // focus, which looks exactly like a keyboard trap.
  await cdp.send("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
  });
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
  });
  await H.sleep(90);
  return H.evaluate(cdp, FOCUS_STATE);
}

async function pressEnter(cdp) {
  // Enter carries a carriage return as text; without it the protocol sends a
  // key event that a button does not treat as an activation.
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Enter",
    code: "Enter",
    text: "\r",
    unmodifiedText: "\r",
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  });
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  });
  await H.sleep(250);
}

/**
 * The comparison panel only exists once two photos are picked, so walking the
 * tab order can never find its Clear button. This picks both with the Enter
 * key, then tabs to Clear, which is the path a keyboard user actually takes.
 */
async function compareByKeyboard(cdp) {
  await H.openSeededVisit(cdp, base, ["wide", "wide"], [
    "2026-03-02T08:00:00.000Z",
    "2026-06-14T09:00:00.000Z",
  ]);
  var picked = 0;
  for (var i = 0; i < 2; i++) {
    var moved = await H.evaluate(
      cdp,
      "(function(){var b=document.querySelector('[data-photo-compare][aria-pressed=\"false\"]');" +
        "if(!b)return false;b.focus();return document.activeElement===b;})()"
    );
    if (!moved) break;
    await pressEnter(cdp);
    // The list re-renders after a pick, so the button that was focused is gone.
    // What matters is that the pick was recorded.
    picked = await H.evaluate(
      cdp,
      "document.querySelectorAll('[data-photo-compare][aria-pressed=\"true\"]').length"
    );
  }
  if (picked !== 2) {
    fail("the compare buttons work with Enter", ["picked " + picked + " of 2 photos"]);
    return;
  }
  var panel = await H.evaluate(
    cdp,
    "(function(){var p=document.querySelector('#photo-compare');return p && !p.hidden;})()"
  );
  if (!panel) {
    fail("the comparison opens from the keyboard", ["the panel stayed hidden"]);
    return;
  }
  // The app moves focus to Clear when the comparison opens, so it may already
  // be there; otherwise it has to be reached by tabbing from the panel.
  var reached = await H.evaluate(
    cdp,
    "document.activeElement && document.activeElement.id === 'btn-photo-compare-clear'"
  );
  for (var t = 0; t < 12 && !reached; t++) {
    await pressTab(cdp);
    if (await H.evaluate(cdp, "document.activeElement && document.activeElement.id === 'btn-photo-compare-clear'")) {
      reached = true;
      break;
    }
  }
  if (!reached) fail("Clear the comparison is reachable by Tab", ["not reached in 12 stops"]);
  else ok("compare opens and Clear is reachable with the keyboard");
}

async function keyboardWalk(cdp) {
  await H.openSeededVisit(cdp, base, ["wide", "wide"], [
    "2026-03-02T08:00:00.000Z",
    "2026-06-14T09:00:00.000Z",
  ]);

  var seen = [];
  var invisible = [];
  var repeats = 0;
  var lastKey = "";
  var key = "";
  for (var i = 0; i < 160; i++) {
    var f = await pressTab(cdp);
    if (!f || f.none) continue;
    // A checkbox has no id and no text, so the identity has to come from its
    // own attribute, or three different questions look like one trap.
    key = f.id || f.tick || f.compareId || f.html;
    if (key === lastKey) repeats++;
    else repeats = 0;
    lastKey = key;
    seen.push(f);
    if (!f.visibleFocus) invisible.push(key + " (" + f.outline + ")");
    // Two identical stops in a row is a trap in every layout this app has; a
    // third would mean the tab key can never leave that element.
    if (repeats >= 2) {
      fail("the tab key cannot leave " + key, [
        "three identical stops in a row",
        "previous stops: " +
          seen
            .slice(-5)
            .map(function (f) {
              return f.html;
            })
            .join(" → "),
      ]);
      return;
    }
  }

  var ids = seen.map(function (f) {
    return f.id || f.text;
  });
  var required = {
    "photo capture button": seen.some(function (f) {
      return f.photoTake;
    }),
    "timeline compare button": seen.some(function (f) {
      return f.photoCompare;
    }),

    "description consent switch": seen.some(function (f) {
      return f.id === "observe-consent";
    }),
    "print button": seen.some(function (f) {
      return f.id === "btn-visit-print";
    }),
  };

  var missing = Object.keys(required).filter(function (k) {
    return !required[k];
  });
  if (missing.length) fail("keyboard reaches every control", missing);
  else ok("keyboard reaches every control", seen.length + " stops, " + ids.length + " described");

  if (invisible.length) fail("every stop shows a focus ring", invisible.slice(0, 6));
  else ok("every stop shows a focus ring");
}

/**
 * The form is the one screen where tab order can be compared with document
 * order, so it is checked rather than eyeballed.
 */
async function formOrder(cdp) {
  await H.navigate(cdp, base + "/");
  await H.click(cdp, "#btn-start");
  var expected = await H.evaluate(
    cdp,
    "(function(){var s=document.querySelector('#screen-form');" +
      "var nodes=s.querySelectorAll('input,select,textarea,button,a[href]');" +
      "return Array.prototype.filter.call(nodes,function(el){return !el.hidden && el.offsetParent!==null;})" +
      ".map(function(el){return el.id || el.getAttribute('data-i18n') || el.textContent.trim().slice(0,30);});})()"
  );
  var order = [];
  // The header plus the draft notice come before the fields, so walk past them.
  for (var i = 0; i < expected.length + 12; i++) {
    var f = await pressTab(cdp);
    if (!f || f.none) continue;
    order.push(f.id || f.text);
  }
  // The header (skip link, logo, language, menu) comes before the form on the
  // page, so the form's own order is the tail of the walk, not the whole walk.
  var at = order.indexOf(expected[0]);
  var form = at === -1 ? [] : order.slice(at, at + expected.length);
  var mismatch = expected.filter(function (name, i) {
    return form[i] !== name;
  });
  if (mismatch.length) {
    fail("the form's tab order follows the screen", [
      "expected " + expected.join(" → "),
      "tabbed   " + form.join(" → "),
    ]);
  } else {
    ok("the form's tab order follows the screen", expected.length + " stops");
  }
}

/** 200% text, as a browser's text-only zoom would do it. */
var OVERFLOW = `(function () {
  var vw = window.innerWidth;
  var out = [];
  if (document.documentElement.scrollWidth > vw + 1) {
    out.push("page is " + document.documentElement.scrollWidth + "px wide in " + vw + "px");
  }
  Array.prototype.forEach.call(document.querySelectorAll("body *"), function (el) {
    var style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || el.hidden) return;
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    // Screen-reader-only labels are 1px by design; their overflow is not a bug.
    if (r.width <= 2 || r.height <= 2) return;
    if (style.clip && style.clip !== "auto") return;
    if (r.right > vw + 1 || r.left < -1) {
      out.push((el.tagName.toLowerCase() + (el.id ? "#" + el.id : "")) + " spans " +
        Math.round(r.left) + " to " + Math.round(r.right));
    }
    if (style.overflow === "hidden" && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0) {
      out.push((el.tagName.toLowerCase() + (el.id ? "#" + el.id : "")) + " clips " +
        (el.scrollHeight - el.clientHeight) + "px of text");
    }
  });
  return out.slice(0, 8);
})()`;

async function zoom200(cdp) {
  await cdp.send("Page.navigate", { url: base + "/" });
  await H.sleep(1500);
  for (var i = 0; i < 3; i++) {
    var screen = ["home", "form", "results"][i];
    if (screen === "form") await H.click(cdp, "#btn-start");
    if (screen === "results") {
      await H.navigate(cdp, base + "/");
      await H.click(cdp, "#btn-demo");
    }
    await H.evaluate(cdp, "(function(){var s=document.getElementById('mlmp-zoom');" +
      "if(!s){s=document.createElement('style');s.id='mlmp-zoom';document.head.appendChild(s);}" +
      "s.textContent='html{font-size:200% !important}';return true;})()");
    await H.sleep(350);
    var problems = await H.evaluate(cdp, OVERFLOW);
    if (problems.length) fail("200% text on " + screen, problems);
    else ok("200% text on " + screen);
  }
  await H.evaluate(cdp, "(function(){var s=document.getElementById('mlmp-zoom');if(s)s.remove();return true;})()");
}

/**
 * WCAG contrast for every visible run of text. Background is resolved by
 * walking ancestors until a non-transparent colour is found, which is what the
 * eye sees on these flat screens.
 */
var CONTRAST = `(function () {
  function parse(c) {
    var m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    var p = m[1].split(",").map(function (x) { return parseFloat(x); });
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function lum(c) {
    var v = [c.r, c.g, c.b].map(function (x) {
      x = x / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function background(el) {
    var node = el;
    while (node && node !== document.documentElement) {
      var bg = parse(window.getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0.5) return bg;
      node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }
  var out = [];
  var checked = 0;
  Array.prototype.forEach.call(document.querySelectorAll("body *"), function (el) {
    var own = Array.prototype.some.call(el.childNodes, function (n) {
      return n.nodeType === 3 && n.textContent.trim().length > 1;
    });
    if (!own) return;
    var style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || el.hidden) return;
    if (el.offsetParent === null && style.position !== "fixed") return;
    var color = parse(style.color);
    if (!color || color.a === 0) return;
    var bg = background(el);
    var ratio = (Math.max(lum(color), lum(bg)) + 0.05) / (Math.min(lum(color), lum(bg)) + 0.05);
    var size = parseFloat(style.fontSize);
    var bold = parseInt(style.fontWeight, 10) >= 700;
    var large = size >= 24 || (bold && size >= 18.66);
    var need = large ? 3 : 4.5;
    checked++;
    if (ratio + 0.01 < need) {
      out.push(
        (el.tagName.toLowerCase() + (el.id ? "#" + el.id : "." + String(el.className).split(" ")[0])) +
        " is " + ratio.toFixed(2) + ":1, needs " + need + " for " +
        (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 30)
      );
    }
  });
  return { checked: checked, problems: out.slice(0, 10), total: out.length };
})()`;

async function contrast(cdp, scheme) {
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: scheme }],
  });
  var screens = ["home", "form", "results", "visit", "privacy"];
  for (var i = 0; i < screens.length; i++) {
    var name = screens[i];
    if (name === "home" || name === "privacy") {
      await H.navigate(cdp, base + "/" + (name === "privacy" ? "privacy.html" : ""));
    } else if (name === "form") {
      await H.navigate(cdp, base + "/");
      await H.click(cdp, "#btn-start");
    } else if (name === "results") {
      await H.navigate(cdp, base + "/");
      await H.click(cdp, "#btn-demo");
    } else {
      await H.openSeededVisit(cdp, base, ["wide", "ground", "water"], [
        "2026-03-02T08:00:00.000Z",
        "2026-03-02T08:05:00.000Z",
        "2026-06-14T09:00:00.000Z",
      ]);
    }
    var r = await H.evaluate(cdp, CONTRAST);
    if (r.total) fail("contrast (" + scheme + ") on " + name, r.problems);
    else ok("contrast (" + scheme + ") on " + name, r.checked + " text runs");
  }
}

(async function main() {
  var cdp = await H.connect(port);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", VIEWPORT);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });

  await keyboardWalk(cdp);
  await compareByKeyboard(cdp);
  await formOrder(cdp);
  await zoom200(cdp);
  // The app has no dark theme, so the dark request is checked to prove it does
  // not produce an unreadable palette through some inherited rule.
  await contrast(cdp, "light");
  await contrast(cdp, "dark");

  cdp.close();

  console.log("");
  notes.forEach(function (n) {
    console.log("note: " + n);
  });
  if (failures.length) {
    console.error(failures.length + " accessibility problem(s).");
    process.exit(1);
  }
  console.log("Keyboard, 200% text and contrast checks passed at 360px.");
})().catch(function (err) {
  console.error("Accessibility checks failed to run: " + err.message);
  process.exit(1);
});
