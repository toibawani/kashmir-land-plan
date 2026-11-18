#!/usr/bin/env node
/**
 * Build the paper pack for one agriculture office visit.
 *
 * The app is the thing a farmer uses; this is the thing they carry. It prints,
 * in this order and as one PDF:
 *
 *   1. a cover: what the app is and is not, the live address, the one question
 *      being asked, and how to mark the sheet
 *   2. the Baramulla district sheet from the current stamp, pen-markable
 *   3. the ten questions from docs/EVIDENCE.md, each with a line to write on
 *   4. the photo-question templates, marked not reviewed, each with a tick box
 *   5. four English screenshots of the app at 360px, with test photos drawn in
 *      code, so the officer can see what the sheet is about
 *
 * Plus the Baramulla prefilled CSV beside it, so the answers can be typed in
 * afterwards without retyping a single row.
 *
 * Nothing personal is written: the screenshots come from the sample journey,
 * and the photos are drawn on a canvas in the page, never read from disk.
 *
 * Usage, with the folder served and Chrome listening like the other browser
 * tools:
 *
 *   node tools/serve.js 8080 &
 *   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *     --headless=new --disable-gpu --remote-debugging-port=9333 \
 *     --user-data-dir=/tmp/mlmp-visit about:blank &
 *   npm run visit-pack
 *
 *   npm run visit-pack -- --out ~/Desktop/somewhere   (default ~/Desktop/officer-visit)
 *
 * The PDF is rendered by Chrome's own print engine at A4, because that is the
 * paper the sheet is designed for. Every page is then converted to an image and
 * looked at, because a layout that fits in a browser can still cut a row in
 * half on paper.
 */
"use strict";

var fs = require("fs");
var http = require("http");
var os = require("os");
var path = require("path");
var H = require("./lib/harness.js");
var PACK = require("./lib/pack-version.js");

var root = path.resolve(__dirname, "..");
var appUrl = (process.argv[2] || "http://127.0.0.1:8080").replace(/\/$/, "");
var chromePort = process.argv[3] || "9333";

var outFlag = process.argv.indexOf("--out");
var outDir =
  outFlag !== -1 && process.argv[outFlag + 1]
    ? process.argv[outFlag + 1].replace(/^~/, os.homedir())
    : path.join(os.homedir(), "Desktop", "officer-visit");

var DISTRICT = "Baramulla";
var LIVE_URL = "https://toibawani.github.io/kashmir-land-plan/";

function esc(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** One stylesheet for every page this tool prints. A4, generous type. */
var STYLE =
  "@page{size:A4;margin:14mm;}" +
  "html{font-size:11.5pt;}" +
  "body{font-family:Georgia,'Times New Roman',serif;color:#1e241e;margin:0;line-height:1.4;}" +
  "h1{font-size:21pt;line-height:1.15;margin:0 0 6px;}" +
  "h2{font-size:13pt;margin:14px 0 6px;}" +
  "p{margin:0 0 7px;max-width:52em;}" +
  ".lede{font-size:11.5pt;}" +
  ".rule{border-top:2px solid #1e241e;margin:10px 0 12px;}" +
  ".address{font-size:19pt;font-weight:bold;letter-spacing:.2px;word-break:break-all;" +
  "border:2px solid #1e241e;padding:8px 10px;margin:6px 0 12px;}" +
  ".small{font-size:9.5pt;color:#3f443f;}" +
  ".ask{border-left:5px solid #6b5a2a;padding:4px 0 4px 12px;margin:8px 0 12px;font-size:12.5pt;}" +
  ".q{break-inside:avoid;page-break-inside:avoid;margin:0 0 9px;}" +
  ".q .no{font-weight:bold;}" +
  ".q .text{font-size:11pt;margin:0;}" +
  ".compact .q .text{font-size:9.6pt;line-height:1.3;}" +
  ".compact h1{font-size:17pt;margin-bottom:3px;}" +
  ".compact p{margin-bottom:4px;}" +
  ".compact .q{margin-bottom:6px;}" +
  ".answer{border-bottom:1px solid #4a4a42;height:19px;margin-top:4px;}" +
  ".compact .answer{height:17px;margin-top:2px;}" +
  ".tick{display:inline-block;width:13px;height:13px;border:1.5px solid #1e241e;margin-right:7px;vertical-align:-1px;}" +
  ".shot{break-inside:avoid;page-break-inside:avoid;margin:0 0 9px;text-align:center;}" +
  // Four phone screens two by two: at 42mm wide each is about 86mm tall, so the
  // whole grid with captions fits one A4 page with room to spare. Wider images
  // pushed the page onto a second sheet.
  ".shot img{width:42mm;border:1px solid #7e7e6e;}" +
  ".shot .cap{font-size:8pt;color:#3f443f;margin-top:2px;max-width:52mm;}" +
  ".grid{display:grid;grid-template-columns:1fr 1fr;justify-items:center;align-items:start;gap:5mm;}" +
  ".pg{break-after:page;page-break-after:always;}" +
  ".pg:last-child{break-after:auto;page-break-after:auto;}" +
  ".foot{position:fixed;bottom:0;left:0;right:0;font-size:8pt;color:#4d4d44;" +
  "border-top:1px solid #c9c4b4;padding-top:3px;}";

function pageShell(title, body) {
  return (
    "<!DOCTYPE html>\n<html lang=\"en\"><head><meta charset=\"utf-8\" />" +
    '<meta name="robots" content="noindex" />' +
    "<title>" +
    esc(title) +
    "</title><style>" +
    STYLE +
    "</style></head><body>" +
    body +
    "</body></html>"
  );
}

/* ------------------------------------------------------------------ content */

/**
 * The numbered items in one section of a markdown file, with their wrapped
 * lines joined. Only the sections this pack prints are read.
 */
function numberedItems(markdown, heading) {
  var lines = markdown.split("\n");
  var start = lines.findIndex(function (line) {
    return line.trim() === heading;
  });
  if (start === -1) return [];
  var items = [];
  var current = null;
  for (var i = start + 1; i < lines.length; i++) {
    var line = lines[i];
    if (/^##\s/.test(line)) break;
    var numbered = line.match(/^(\d+)\.\s+(.*)$/);
    if (numbered) {
      if (current) items.push(current);
      current = { no: numbered[1], text: numbered[2] };
      continue;
    }
    if (!current) continue;
    if (!line.trim()) continue;
    if (/^---\s*$/.test(line)) {
      items.push(current);
      current = null;
      break;
    }
    current.text += " " + line.trim();
  }
  if (current) items.push(current);
  return items.map(function (item) {
    return {
      no: item.no,
      // Markdown emphasis would print as asterisks on paper.
      text: item.text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, ""),
    };
  });
}

function coverPage() {
  return (
    '<section class="pg"><h1>My Land, My Plan</h1>' +
    '<p class="lede">Preparation for an agriculture office visit, for one farmer and one plot. ' +
    "Printed from the app on the day of the visit.</p>" +
    '<div class="rule"></div>' +
    "<h2>The app itself, on any phone</h2>" +
    '<p class="address">' + esc(LIVE_URL) + "</p>" +
    '<p class="small">Works with no connection after one visit. Nothing is sent anywhere; ' +
    "the plan stays on the phone.</p>" +
    "<h2>What it is, and what it is not</h2>" +
    '<p class="lede">It turns a few details about an unused plot into a short list of options, ' +
    "questions to ask, a checklist and a card for this visit.</p>" +
    '<p class="lede"><strong>It does not decide scheme eligibility, and it does not promise ' +
    "a crop will suit the ground.</strong> It does not know your soil test, your land records " +
    "or the current scheme rules. Every suggestion is a question to discuss, never advice " +
    "to act on.</p>" +
    "<h2>What is being asked of the officer</h2>" +
    '<p class="ask">Is anything on this list wrong for your district?</p>' +
    '<p class="lede">An option that does not make sense for the area, a month that is off for ' +
    "local practice, a reason that misleads, or something missing that farmers here are " +
    "commonly advised to consider. Crossing out a wrong line is the most useful answer. " +
    "Nothing needs approving.</p>" +
    "<h2>How to mark the sheet</h2>" +
    '<p class="lede">On the district sheet, tick <strong>Right</strong>, <strong>Wrong</strong> ' +
    "or <strong>Not sure</strong> beside each activity. Where it is wrong, write why and what " +
    "should replace it in the last column. Write your name, designation, office, the date and " +
    "your signature at the top. A line with no tick stays unreviewed, which is a useful answer " +
    "too.</p>" +
    '<p class="lede">The questions page is separate: those are mine, not the app\'s, and a short ' +
    "answer beside any of them is more than enough.</p>" +
    '<p class="small">Sheet ' +
    esc(PACK.SHEET_VERSION) +
    ". Printed for " +
    esc(DISTRICT) +
    " district.</p></section>"
  );
}

function questionsPage(markdown) {
  var items = numberedItems(markdown, "## Ask the officer first");
  if (items.length !== 10) {
    throw new Error(
      "expected 10 questions in docs/EVIDENCE.md, found " + items.length + ", so the pack would be wrong"
    );
  }
  var body = items
    .map(function (item) {
      return (
        '<div class="q"><p class="text"><span class="no">' +
        esc(item.no) +
        ".</span> " +
        esc(item.text) +
        '</p><div class="answer"></div></div>'
      );
    })
    .join("");
  // Ten questions with a writing line each have to fit one A4 page, so the
  // heading block is short and the text is set a little tighter than the
  // cover. The tool measures the result and fails if it spills.
  return (
    '<section class="pg compact"><h1>Ten questions, for the officer</h1>' +
    '<p class="lede small">Mine, not the app\'s, weakest evidence first. A word beside any of ' +
    "them is useful; none needs a figure.</p>" +
    body +
    "</section>"
  );
}

function photoPage(markdown) {
  var items = numberedItems(markdown, "## Questions for an agriculture officer");
  if (!items.length) throw new Error("no photo questions found in REVIEW_PHOTO_QUESTIONS.md");
  var body = items
    .map(function (item) {
      return (
        '<div class="q"><p class="text"><span class="tick"></span><span class="no">' +
        esc(item.no) +
        ".</span> " +
        esc(item.text) +
        '</p><div class="answer"></div></div>'
      );
    })
    .join("");
  return (
    '<section class="pg compact"><h1>Photo questions — not yet reviewed</h1>' +
    '<p class="lede small"><strong>Not reviewed, and nothing is connected.</strong> The ' +
    "photo-description feature is switched off in every sense: no provider, no key, no network " +
    "call. These questions decide whether it should exist at all.</p>" +
    '<p class="lede small">A photo may be described, never judged: four visible facts, each ' +
    "with an \"unclear\" option, and no sentence of prose. Tick a question only if you would " +
    "keep it.</p>" +
    body +
    "</section>"
  );
}

function shotsPage(images) {
  if (images.length !== 4) throw new Error("expected 4 screenshots, captured " + images.length);
  var caps = [
    "Home. The one sentence that says what this is.",
    "The plan. Six short questions about the plot.",
    "Options. Two or three activities to discuss, with the reason each came up.",
    "The visit card. Questions to ask, a checklist, and the caveat on every copy.",
  ];
  return (
    '<section class="pg"><h1>The app, at 360 pixels</h1>' +
    '<p class="lede">English, on the sample journey, with test photos drawn in code. Nothing here ' +
    "belongs to a real plot, a real person or a real land record.</p>" +
    '<div class="grid">' +
    images
      .map(function (src, index) {
        return (
          '<div class="shot"><img src="' +
          src +
          '" alt="' +
          esc(caps[index]) +
          '" /><p class="cap">' +
          esc(caps[index]) +
          "</p></div>"
        );
      })
      .join("") +
    "</div></section>"
  );
}

/* ------------------------------------------------------------- Chrome plumbing */

async function shoot(cdp, outPath) {
  var shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  var buffer = Buffer.from(shot.data, "base64");
  fs.writeFileSync(outPath, buffer);
  return "data:image/png;base64," + shot.data;
}

async function printToPdf(cdp, url, outPath) {
  await H.navigate(cdp, url);
  await new Promise(function (resolve) {
    setTimeout(resolve, 600);
  });
  // Margins come from @page in the stylesheets, so they are set to zero here:
  // two sets of margins would print the sheet smaller than it is designed to
  // be, and the row heights are budgeted to the millimetre.
  var printed = await cdp.send("Page.printToPDF", {
    printBackground: true,
    preferCSSPageSize: true,
    paperWidth: 8.27,
    paperHeight: 11.69,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  });
  fs.writeFileSync(outPath, Buffer.from(printed.data, "base64"));
  return outPath;
}

/**
 * Measure and photograph each laid-out page, and compare with the PDF.
 * Returns the counts so the caller can print them, and throws on a spill.
 */
async function inspectPages(cdp, url, pdfPath, imageDir) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 794,
    height: 1123,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await H.navigate(cdp, url);
  await new Promise(function (resolve) {
    setTimeout(resolve, 500);
  });

  // A4 text area with 14mm margins: 297mm - 28mm = 269mm, which is 1016.7px
  // at the 96 dots per inch a browser lays out in.
  var LIMIT = 1016;
  var sections = await H.evaluate(
    cdp,
    "(function(){var s=[].slice.call(document.querySelectorAll('section.pg'));" +
      "return s.map(function(e){var r=e.getBoundingClientRect();" +
      "return {top:Math.round(r.top+window.scrollY),height:Math.round(r.height)," +
      "content:e.scrollHeight};});})()"
  );

  var tall = sections.filter(function (s) {
    return s.content > LIMIT + 2;
  });
  if (tall.length) {
    throw new Error(
      "page" +
        (tall.length > 1 ? "s " : " ") +
        tall
          .map(function (s, index) {
            return sections.indexOf(s) + 1 + " (" + s.content + "px)";
          })
          .join(", ") +
        " exceed the A4 text area of " +
        LIMIT +
        "px, so they would spill onto a second sheet"
    );
  }

  var images = [];
  for (var i = 0; i < sections.length; i++) {
    var shot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: sections[i].top,
        width: 794,
        height: Math.min(sections[i].height, 1123),
        scale: 1.4,
      },
    });
    var file = path.join(imageDir, "page-" + (i + 1) + ".png");
    fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
    images.push(file);
  }

  var pdfPages = (fs.readFileSync(pdfPath).toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pdfPages !== sections.length) {
    throw new Error(
      "the PDF has " + pdfPages + " pages but the pack lays out " + sections.length +
        ", so a page is splitting or a row row is being cut"
    );
  }
  return { sections: sections.length, pdfPages: pdfPages, images: images };
}

function serve(dir) {
  return new Promise(function (resolve) {
    var server = http.createServer(function (req, res) {
      var rel = decodeURIComponent(req.url.split("?")[0]);
      if (rel === "/") rel = "/index.html";
      var file = path.join(dir, rel);
      if (file.indexOf(dir) !== 0 || !fs.existsSync(file)) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", function () {
      resolve(server);
    });
  });
}

(async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  var scratch = fs.mkdtempSync(path.join(os.tmpdir(), "mlmp-visit-"));

  var cdp = await H.connect(chromePort);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 360,
    height: 740,
    deviceScaleFactor: 2,
    mobile: true,
  });

  /* 1. Four English screens in the order the pages describe them, with the
     sample journey and photos the app draws itself. */
  await H.navigate(cdp, appUrl + "/");
  await H.evaluate(cdp, "(function(){localStorage.clear();return true;})()");
  await H.navigate(cdp, appUrl + "/");
  var images = [];
  images.push(await shoot(cdp, path.join(scratch, "1-home.png")));

  await H.evaluate(cdp, "(function(){var b=document.getElementById('btn-start');if(b)b.click();return true;})()");
  await H.sleep(800);
  images.push(await shoot(cdp, path.join(scratch, "2-plan.png")));

  await H.navigate(cdp, appUrl + "/");
  await H.evaluate(cdp, "(function(){document.getElementById('btn-demo').click();return true;})()");
  await H.sleep(900);
  images.push(await shoot(cdp, path.join(scratch, "3-options.png")));

  await H.click(cdp, "#btn-results-visit");
  var cardShown = await H.waitFor(
    cdp,
    "(function(){var s=document.getElementById('screen-visit');return !!s && !s.hidden && document.getElementById('visit-card').textContent.trim().length>40;})()",
    12000
  );
  if (!cardShown) throw new Error("the office visit card did not open, so its screenshot would be the wrong screen");
  await H.sleep(500);
  images.push(await shoot(cdp, path.join(scratch, "4-visit-card.png")));

  /* 2. The pages, in the order they are carried. */
  var evidence = fs.readFileSync(path.join(root, "docs", "EVIDENCE.md"), "utf8");
  var photos = fs.readFileSync(path.join(root, "REVIEW_PHOTO_QUESTIONS.md"), "utf8");

  var sheetHtml = fs.readFileSync(path.join(root, "review-sheets", DISTRICT + ".html"), "utf8");
  var sheetStyle = (sheetHtml.match(/<style>([\s\S]*?)<\/style>/) || ["", ""])[1];
  var sheetBody = (sheetHtml.match(/<body[^>]*>([\s\S]*)<\/body>/) || ["", ""])[1];
  if (!sheetBody.trim()) throw new Error("the district sheet from tools/review-sheet.js could not be read");

  // The sheet keeps its own type and page rules, so the paper inside this pack
  // is the same paper the pack generator makes on its own: same rows, same
  // tick boxes, same footer and stamp.
  var pack = pageShell(
    "Officer visit pack: " + DISTRICT,
    coverPage() + sheetBody + questionsPage(evidence) + photoPage(photos) + shotsPage(images)
  ).replace("</head>", "<style>" + sheetStyle + "</style></head>");

  fs.writeFileSync(path.join(scratch, "pack.html"), pack, "utf8");
  var server = await serve(scratch);
  var base = "http://127.0.0.1:" + server.address().port;

  var stamp = PACK.RELEASE;
  var packFile = path.join(outDir, "officer-visit-pack-" + stamp + ".pdf");
  await printToPdf(cdp, base + "/pack.html", packFile);

  /* 3. Every page is measured and photographed. A section taller than the A4
     text area spills onto a second sheet, which is how this pack reached eight
     pages the first time it was printed. Counting the PDF's own page objects
     is the only check that sees the spill, so both are done. */
  // The page images are for looking at, not for handing out, so they go to a
  // stable temporary folder rather than into the pack folder.
  var imageDir = path.join(os.tmpdir(), "mlmp-visit-pages");
  fs.mkdirSync(imageDir, { recursive: true });
  var pages = await inspectPages(cdp, base + "/pack.html", packFile, imageDir);
  console.log(
    "Checked " + pages.sections + " laid-out pages, " + pages.pdfPages + " PDF pages, " +
      pages.images.length + " page images in " + imageDir
  );

  /* The sheet on its own, for the officer who wants one page to mark. */
  var sheetFile = path.join(outDir, DISTRICT + "-sheet-" + stamp + ".pdf");
  await printToPdf(cdp, appUrl + "/review-sheets/" + DISTRICT + ".html", sheetFile);

  /* The prefilled CSV, so the answers only need typing where they differ. */
  var csvFile = path.join(outDir, DISTRICT + ".csv");
  fs.copyFileSync(path.join(root, "review-sheets", DISTRICT + ".csv"), csvFile);

  server.close();
  cdp.close();

  console.log("Wrote, into " + outDir + ":");
  [packFile, sheetFile, csvFile].forEach(function (file) {
    var size = Math.round(fs.statSync(file).size / 1024);
    console.log("  " + path.basename(file) + " (" + size + " KB)");
  });
  console.log("Sheet version in the pack: " + PACK.SHEET_VERSION);
  fs.rmSync(scratch, { recursive: true, force: true });
  process.exit(0);
})().catch(function (err) {
  console.error("Visit pack failed: " + err.message);
  process.exit(1);
});
