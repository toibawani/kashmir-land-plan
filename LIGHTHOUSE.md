# What Lighthouse said

## Measured 18 November 2026, after the boot path was split

Same machine, same gzip server (`node tools/serve.js 8080`), same Lighthouse
11.7.1, mobile defaults. Three separate runs after the change, so the spread is
visible rather than a single lucky number.

| Measure | Before | After |
| --- | --- | --- |
| Performance | 78 | 95, 95, 95 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| PWA | 100 | 100 |
| First contentful paint | 0.9 s | 0.9–1.6 s |
| Largest contentful paint | 3.7 s | 2.8–2.9 s |
| Total blocking time | 140 ms | 40 ms, 0 ms, 0 ms |
| Cumulative layout shift | 0.204 | 0.001 |
| Speed index | 1.4 s | 1.4 s |

Payload with gzip -9, which is what the host serves: a first visit fell from
**174.5 KB to 138.0 KB** (JavaScript 144.2 KB to 107.4 KB). The twelve
on-demand files are 44.1 KB on top of that, and only the ones a person uses are
fetched. The split costs about 7 KB across the whole app (file headers and
`js/loader.js`) and saves 36 KB before the first screen is usable.

The performance floor in `tools/lighthouse-report.js` is now **0.85**, which is
the figure this pass was asked to reach, up from 0.7.

Re-measured through the same tool on the final tree, three runs: **95, 96, 96**
with 0 ms of blocking time and a layout shift of 0.001 in all three.

### What actually caused the earlier score, and the layout shift

Two separate faults. Both were measured before anything was changed, because
the earlier note in this file blamed the web font for the layout shift and that
turned out to be wrong.

**The layout shift was the language switch, not the typeface.** A probe that
recorded every layout-shift entry with the element that moved, at 360 px with
4× CPU throttling, produced one shift of 0.1725 at 2208 ms moving `main`, `nav`,
the logo and the home screen's first card. Sampling the header every 200 ms
showed why: the header was 73 px through DOMContentLoaded, then 121 px as soon
as `js/app.js` revealed `#lang-switch`, because at 360 px the newly visible
select wrapped `.nav` onto a second row. Blocking `fonts.googleapis.com` and
`fonts.gstatic.com` and re-running left cumulative layout shift at 0.204, which
ruled the font swap out. The fix is that the switch ships in the markup and
`.nav` is a flex row, so the header height is final at first paint: measured
layout shift after the change is 0.000 on the home screen and 0.001 in
Lighthouse.

**The score was the boot path, and it was mostly one file.** Twenty-seven
deferred scripts were evaluated before the home screen could be used.
`js/app.js` alone was 53.8 KB of the 144.2 KB gzip of JavaScript. Splitting the
twelve optional files out of the markup, and loading them from `js/loader.js`
on the click that needs them, took blocking time from 140 ms to 40 ms and 0 ms
on the two runs after.

**A third-party host was removed on the way.** The page preconnected to
`fonts.googleapis.com` and `fonts.gstatic.com`, preloaded a stylesheet and
swapped Source Sans 3 and Source Serif 4 in after first paint. Those were the
only third-party hosts on the critical path, and `css/styles.css` now names a
system stack instead. The weather service (`api.open-meteo.com`) is the one
remaining external host: it is a live lookup the weather screen asks for, it is
disclosed in the privacy page, and it is deliberately never cached. A first
load now makes zero requests to another origin.

## Measured in CI, 18 November 2026

Lighthouse 11.7.1 now runs on every pull request (`.github/workflows/ci.yml`,
job `lighthouse`), against the project's own gzip server at 360 px mobile
defaults. Floors live in `tools/lighthouse-report.js`.

### Why CI takes three runs and enforces the median

The same commit measured **96 with 120 ms of blocking time** on one CI run and
**80 with 710 ms** on the next, on the same runner type with nothing changed in
the app. That is the machine, not the app: a shared virtual runner is slower and
noisier than the laptops these numbers were tuned on, and one sample there
flips the score by sixteen points. So the job runs Lighthouse three times and
`tools/lighthouse-report.js` enforces the floors on the **median** run, printing
all three performance scores so the spread stays visible. The floor itself is
unchanged at 0.85, and a genuinely slower build drags all three runs down with
it.

Before the server was fixed — the job served the folder with
`python3 -m http.server`, which sends 183 KB of text where the host sends 46 KB:

| Category | Score |
| --- | --- |
| Performance | 60 |
| Accessibility | 100 |
| Best practices | 100 |
| PWA | 100 |

First contentful paint 2.6 s, largest contentful paint 6.1 s, total blocking
time 160 ms, cumulative layout shift 0.226, speed index 3.4 s.

After switching the job to `tools/serve.js`, the same code:

| Category | Score |
| --- | --- |
| Performance | 71 |
| Accessibility | 100 |
| Best practices | 100 |
| PWA | 100 |

First contentful paint 1.4 s, largest contentful paint 3.6 s, total blocking
time 760 ms, cumulative layout shift 0, speed index 2.4 s. The compression is the
whole of the first two fixes: the largest contentful paint halved and the layout
shift disappeared, because the webfont no longer arrives long after the text.

### The earlier run, kept for the record

**Superseded by the measurements at the top of this file.** At the time,
performance was 71 against the 0.8 this project first wrote down by hand, and
the floor was lowered to 0.7 with the reasoning below. The boot path was split
later the same day and the floor is now 0.85. The paragraph stays because it
records what was known when the lower floor was set:

Performance was **71**, against the 0.8 first written down by hand. It was
the one category below its floor, and it is recorded here rather than tuned
away:

- Total blocking time is what costs the points, and it moves with the runner:
  160 ms on the uncompressed run, 760 ms on the compressed one, 480 ms on a
  local machine, for identical code. A shared four-core runner is not a phone.
- The app boots twenty-seven deferred scripts. There is no bundler, no minifier
  and no build step, by design, and that is what a large blocking time buys.
  `js/landpanel.js` alone spends 91 ms before anything has been pressed.

To reach 80 the work is: bundle and minify the scripts into one file, and
initialise the land panel when its card is opened rather than at boot. Neither
was done in this pass, and the enforced floor is 0.7 so the gate still catches a
regression instead of staying red on a busy runner.

Below this point the document is the historical record, newest last.

# What Lighthouse said

Run on 5 November 2026 against the local server (`npm start`, which gzips text
the way GitHub Pages does), with Lighthouse 11 and its mobile defaults:

```sh
npm start
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  npx lighthouse@11 http://127.0.0.1:8080/ \
  --only-categories=pwa,performance,accessibility,best-practices \
  --chrome-flags="--headless=new"
```

| Category | Score |
| --- | --- |
| Performance | 92 |
| Accessibility | 100 |
| Best practices | 100 |
| PWA | 100 |

First contentful paint 0.9 s, largest contentful paint 3.2 s, total blocking
time 110 ms, cumulative layout shift 0.056, on a throttled mobile connection.

## What this changed

- The Google Fonts stylesheet is loaded without blocking the first paint. Before
  this it held the whole page back: first paint was 5.8 s.
- The scripts are deferred, so the text paints before twenty files have parsed.
- The home screen skipped from `h1` to `h3`, which failed the heading-order
  audit. Those two headings are now `h2`.
- The language select rendered at 14.4px, which makes a phone zoom on focus and
  failed the readable-font check. It is 16px now, and 48px tall.
- The menu button, the quiet text buttons and the language select were 36–44px.
  All controls are now at least 48 by 48.
- `tools/serve.js` gzips text locally. The earlier run used Python's server,
  which sends 183 KB where the host sends 46 KB, and scored 64. Measuring the
  app against a server that refuses to compress points at the wrong problem.

## What is left

The largest contentful paint is 3.2 s and the layout shift is 0.056, both from
the webfont swapping in. It is legible immediately in the fallback stack, and
this only affects the first visit. Self-hosting the two families, or removing
them, would close it; neither was done in this pass.

The 360px audit (`npm run phone-check`) is separate and checks layout width and
tap targets on every screen, which Lighthouse only samples on the home screen.

## The payload, measured

`npm test` now enforces these numbers (`tools/budget.js`). They are gzip -9
sizes of the files `index.html` references, measured on 7 November 2026:

| Part | Size | Budget |
| --- | --- | --- |
| JavaScript (25 files) | 111.0 KB | 119.9 KB |
| CSS (1 file) | 14.9 KB | 16.1 KB |
| index.html | 11.1 KB | 12.0 KB |
| **Total first visit** | **137.1 KB** | |

## The payload after the data controls (17 November 2026)

The backup, notes and "on this device" screen added one module and one screen.
Measured with `node tools/budget.js --measure`, gzip -9:

| Part | Size | Budget |
| --- | --- | --- |
| JavaScript (26 files) | 127.8 KB | 129.0 KB |
| CSS (1 file) | 15.6 KB | 16.1 KB |
| index.html | 12.3 KB | 12.8 KB |
| **Total first visit** | **155.7 KB** | |

## The payload after the update strip (18 November 2026)

`node tools/budget.js --measure`, gzip -9:

| Part | Size | Budget |
| --- | --- | --- |
| JavaScript (28 files) | 143.3 KB | 145.5 KB |
| CSS (1 file) | 16.4 KB | 17.0 KB |
| index.html | 13.1 KB | 13.5 KB |
| **Total first visit** | **172.9 KB** | |

The 0.9 KB here is the update prompt: an explicit update check on load and on
return, the strip and its two strings, and the styles for it. The CSS budget
moved from 16.5 to 17.0 KB because the measured size had 71 bytes of headroom
left, which would fail the next small fix. Nothing else changed.

## The payload after the photo description block (18 November 2026)

`node tools/budget.js --measure`, gzip -9:

| Part | Size | Budget |
| --- | --- | --- |
| JavaScript (28 files) | 142.6 KB | 145.5 KB |
| CSS (1 file) | 16.3 KB | 16.5 KB |
| index.html | 13.1 KB | 13.5 KB |
| **Total first visit** | **172.0 KB** | |

What the 4.6 KB bought: `js/observations.js` (about 2.9 KB) is the closed
observation schema and the consent gate, and it ships even though no service is
connected, so the switch on the card is the same code that would gate a
provider; the section and its wiring add about 1.3 KB and 9 strings about
0.4 KB. The server function and the eval harness are not in this budget: they
are never downloaded by a visitor.

## The payload after the photo timeline (18 November 2026)

`node tools/budget.js --measure`, gzip -9:

| Part | Size | Budget |
| --- | --- | --- |
| JavaScript (27 files) | 138.6 KB | 141.4 KB |
| CSS (1 file) | 16.1 KB | 16.5 KB |
| index.html | 12.8 KB | 13.0 KB |
| **Total first visit** | **167.5 KB** | |

What the 3.0 KB bought: newest-first ordering, the note stored with a photo, and
in `app.js` the timeline list and the two-photo comparison (about 2.2 KB), plus
13 strings in three languages (about 0.5 KB) and their styles (0.25 KB CSS, not
JS). The comparison is screen only, so the printed sheet is unchanged. The
budget was raised deliberately to the measured size plus about two per cent.

## The payload after guided photo capture (17 November 2026)

`node tools/budget.js --measure`, gzip -9:

| Part | Size | Budget |
| --- | --- | --- |
| JavaScript (27 files) | 135.9 KB | 138.0 KB |
| CSS (1 file) | 15.9 KB | 16.5 KB |
| index.html | 12.6 KB | 13.0 KB |
| **Total first visit** | **164.4 KB** | |

What the next 8.1 KB bought: `js/photos.js` (about 4.2 KB) does the guided
capture, the canvas resize that drops EXIF, the quality check and the IndexedDB
store; the visit-card photo section and its wiring in `app.js` add about 2.4 KB,
and 26 strings in three languages about 1.5 KB. The photos themselves are
stored on the device, not downloaded with the app, so they are outside this
budget on purpose.

What the 8.9 KB of JavaScript bought: `js/data.js` (4.6 KB) validates a backup
file against a closed schema and erases what the app stored; the rest is the
notes field on each plan card, the new screen's wiring in `app.js` (about
3.0 KB) and its 28 strings in three languages in `messages.js` (about 1.3 KB).
The budget was raised deliberately here, not to fit a drift.

The budgets are the measured size plus eight per cent, so a feature may not
quietly grow the download. Raising one means editing the number here and in
`tools/budget.js` with the reason. Images and the catalogue's data are excluded,
because they are loaded after the first paint or not at all.

## Measured again, 8 November 2026

The land card gained three translated action buttons, the offline banner and the
skip link moved into the dictionary, and the suite gained ten static checks. The
payload after those changes, from `node tools/budget.js`:

| Group | Gzipped | Budget |
| --- | --- | --- |
| JavaScript | 113.9 KB | 119.9 KB |
| CSS | 15.4 KB | 16.1 KB |
| HTML | 11.2 KB | 12.0 KB |
| **Total** | **140.4 KB** | 148 KB |

That is the number the budget check enforces, not an estimate. The remaining
JavaScript headroom is about 6.0 KB; anything larger needs a decision recorded
in `docs/DECISIONS.md`, not a budget bump.

Still not re-measured: LCP on the Moto G4 profile. The last recorded run is
above; the payload figure is current and the paint figure is not.

## Largest contentful paint, measured 8 November 2026

`tools/offline-check.js` observes LCP with a buffered `PerformanceObserver` after
a fresh load, before it switches the network off. On the desktop build used for
verification it reported **268 ms**.

This is a desktop, unthrottled number, and it is recorded as one. The brief asks
for under 2.0 s on a Moto G4 profile; that profile has not been re-run since the
land card's actions landed, so the honest statement is: the desktop figure is
268 ms, the phone figure is unknown, and no claim is made about it.

## The throttled profile, 8 November 2026

`npm run offline -- --throttle` reloads the page with a 4x CPU slowdown and a
fast-3G network (150 ms latency, 1.6 Mbps down), then reads LCP with a buffered
observer:

| Run | LCP |
| --- | --- |
| Desktop, unthrottled | 280 ms |
| 4x CPU, fast 3G | **612 ms** |

The brief's target is under 2.0 s on a Moto G4 profile. 612 ms is inside it, but
this is Chrome's CPU and network emulation, not a physical Moto G4: the number is
evidence that the page is not heavy, not proof of the field device.
