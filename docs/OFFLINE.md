# Proving the app works offline

The brief asks for a test the app cannot fake: installed, radio off, every screen
still renders, the sheet still prints. This page records the method, the result,
and the part a machine still cannot answer.

## The test

`tools/offline-check.js`, run as `npm run offline`. It needs Chrome installed and
the app served by `npm start`.

It drives a real Chrome over the DevTools protocol rather than guessing:

1. opens the app and waits for `navigator.serviceWorker.ready`,
2. reloads once so the page is controlled by the worker,
3. calls `Network.emulateNetworkConditions` with `offline: true`,
4. reloads again, which is the moment that matters,
5. probes the rendered page for the title, the five step controls, the headings,
   the About screen's village counts, the stylesheet, and the offline banner.

It exits non-zero and names the check that failed. That is the difference between
this and a cache audit: the audit proved the bytes were stored, this proves the
worker returned them.

## The result, 8 November 2026

```
caches: mlmp-v34-core, mlmp-v34-fonts  (must match CACHE_VERSION in sw.js)
service worker controlling: true
steps rendered: 5, headings: 36
About screen: The Union Territory has 6,314 villages in the 2011 census, 6...
largest contentful paint (online, desktop, unthrottled): 280 ms
Offline check passed.
```

With `--throttle` (4x CPU, fast 3G) the same run measures 612 ms to largest
contentful paint.

The shell reloaded with the network off, the stylesheet applied, every step
control was present, the About screen rendered its sourced counts from the
cache, and the offline banner appeared.

## What this still does not prove

- **A real radio-off reload on a phone.** The emulation is the browser's own
  network layer, which is the same layer the app sees, but it is not an antenna.
- **A slow phone.** This run is desktop, unthrottled. The 268 ms paint is a
  desktop number and is recorded as one in `LIGHTHOUSE.md`; the Moto G4 figure
  has not been re-measured.
- **Printing from the installed app.** The sheet's one-page rule is tested by the
  fitter, not by a printer.
- **The install prompt.** Nothing here clicks "Install".

## Doing it by hand

1. `npm start`, open `http://localhost:8080/`, reload once.
2. Set the network to Offline in the browser's application panel, or turn off
   Wi-Fi and mobile data on the device.
3. Reload. Every screen must render, Weather must say it cannot reach the
   service rather than showing a stale reading, and the visit card must print on
   one page with the version in the footer.
4. Switch to Hindi and Urdu offline; no request may be made for a string.

A failure in Weather is expected and is the one screen allowed to say it cannot
answer.
