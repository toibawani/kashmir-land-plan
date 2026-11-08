# Proving the app works offline

The brief asks for a test the app cannot fake: installed, radio off, every screen
still renders, the sheet still prints. This page records what has been measured,
what has not, and how to finish it in ten minutes.

## What is measured today

- `tools/verify.js` fails if any asset listed in `sw.js` is missing, if a script
  referenced by `index.html` is not precached, or if the precache list shrinks.
- In the browser, the service worker reaches `activated` and controls the page,
  and `caches.keys()` contains the current `mlmp-vNN` cache with the same 30
  entries the precache list names.
- A cache-only read of the shell (`fetch(url, {cache: "only-if-cached"})` for
  each precached asset) returns a response for every entry, so the cache is
  complete rather than merely registered.

## What is not measured

A real disconnected reload. The cache audit proves the bytes are stored; it does
not prove the worker's fetch handler returns them when the network is gone. Those
are different failures, and only one of them has been observed.

## How to run it

1. Serve the folder: `npm start`, then open `http://localhost:8080/`.
2. Open the browser's application panel and confirm the service worker is
   `activated`. Reload once so the page is controlled.
3. Set the network to **Offline** in the application panel, or turn off Wi-Fi and
   mobile data on the device.
4. Reload. Every screen must render: Home, Plan through all five steps, Weather
   (which must say it cannot reach the service, not show a stale reading), My
   plans, About, and the printable visit card.
5. Print the visit card. It must be one page and the footer must carry the
   version and digest.
6. Switch to Hindi and Urdu offline. The interface must change; no request may be
   attempted for a string.

A failure at step 3 that disappears at step 4 is a cache-first/network-first
question, not a data problem. A failure in Weather is expected and is the one
screen allowed to say it cannot answer.
