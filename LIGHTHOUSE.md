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
