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
| JavaScript (22 files) | 111.0 KB | 119.9 KB |
| CSS (1 file) | 14.9 KB | 16.1 KB |
| index.html | 11.1 KB | 12.0 KB |
| **Total first visit** | **137.1 KB** | |

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
