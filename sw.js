/**
 * Service worker for My Land, My Plan.
 *
 * The point of this file is narrow: once the app has been opened, the whole
 * land plan (form, options, calendars, checklist, schemes, summary, downloads)
 * must keep working with no connection. Weather is the single exception, and it
 * is never cached. A stored temperature shown as "current" would be a lie, and
 * this app would rather say it cannot reach the weather service.
 *
 * Bump CACHE_VERSION when any cached file changes, so old copies are dropped.
 */

var CACHE_VERSION = "mlmp-v16";

/* A fingerprint of CORE_ASSETS below, checked by tools/verify.js. It is here
   because a cached file can change while the version does not, and the browser
   then keeps serving the old copy: the app looks unfixed when it is fixed.
   When the build complains, bump CACHE_VERSION and paste the fingerprint it
   prints. Both move together. */
var CACHE_FINGERPRINT = "663068371c3ea4eb";
var CORE_CACHE = CACHE_VERSION + "-core";
var FONT_CACHE = CACHE_VERSION + "-fonts";

/* Everything the core flow needs. Kept as an explicit list rather than a
   wildcard so a missing file is visible instead of silently skipped. */
var CORE_ASSETS = [
  "./index.html",
  "./css/styles.css",
  "./js/regions.js",
  "./js/catalogue.js",
  "./js/activities.js",
  "./js/schemes.js",
  "./js/weather.js",
  "./js/questions.js",
  "./js/plans.js",
  "./js/speech.js",
  "./js/qr.js",
  "./js/offline.js",
  "./js/visitfit.js",
  "./js/office.js",
  "./js/share.js",
  "./js/officepack.js",
  "./js/messages.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
];

/* The weather hosts are intentionally absent from every list above. Requests
   to them fall through to the network, so an offline device gets a real
   failure that the app can explain, never a stale reading. */
var WEATHER_HOSTS = ["api.open-meteo.com", "geocoding-api.open-meteo.com"];
var FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", function (event) {
  // Take over as soon as the new copy is ready. Without this a new version
  // waits until every open tab is closed, which looks like the app ignoring an
  // update, and the person using it has no way to know why.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CORE_CACHE).then(function (cache) {
      // Cache files one at a time, so one bad path cannot take the whole
      // offline plan down with it.
      return Promise.all(
        CORE_ASSETS.map(function (url) {
          return cache.add(new Request(url, { cache: "reload" })).catch(function () {
            return null;
          });
        })
      );
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (names) {
        return Promise.all(
          names.map(function (name) {
            if (name !== CORE_CACHE && name !== FONT_CACHE) return caches.delete(name);
            return null;
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

function isWeatherRequest(url) {
  return WEATHER_HOSTS.indexOf(url.hostname) !== -1;
}

function isFontRequest(url) {
  return FONT_HOSTS.indexOf(url.hostname) !== -1;
}

/* Cache first, then network, and quietly refresh the copy for next time. Used
   only for the font files, whose URLs are versioned and therefore immutable. */
function cacheFirst(request, cacheName) {
  return caches.match(request).then(function (hit) {
    if (hit) {
      fetch(request)
        .then(function (response) {
          if (response && response.ok) {
            caches.open(cacheName).then(function (cache) {
              cache.put(request, response.clone());
            });
          }
        })
        .catch(function () {
          // Offline is expected here. The cached copy already answered.
        });
      return hit;
    }
    return fetch(request).then(function (response) {
      if (response && response.ok) {
        var copy = response.clone();
        caches.open(cacheName).then(function (cache) {
          cache.put(request, copy);
        });
      }
      return response;
    });
  });
}

/* Network first, cache as the offline fallback. Used for the page itself and
   for the app's own scripts and styles, because those change whenever the app
   is edited. Serving them cache first would show a stale interface until the
   second reload, which is exactly the kind of confusion a farmer should not
   have to debug. When there is no connection the stored copy answers instead. */
function networkFirstAsset(request) {
  return fetch(request)
    .then(function (response) {
      if (response && response.ok) {
        var copy = response.clone();
        caches.open(CORE_CACHE).then(function (cache) {
          cache.put(request, copy);
        });
      }
      return response;
    })
    .catch(function () {
      return caches.match(request).then(function (hit) {
        if (hit) return hit;
        return new Response("", { status: 504, statusText: "Offline and not stored" });
      });
    });
}

function networkFirstPage(request) {
  return fetch(request)
    .then(function (response) {
      if (response && response.ok) {
        var copy = response.clone();
        caches.open(CORE_CACHE).then(function (cache) {
          cache.put("./index.html", copy);
        });
      }
      return response;
    })
    .catch(function () {
      return caches.match("./index.html", { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        return new Response(
          "<!DOCTYPE html><p>My Land, My Plan needs to be loaded once with a connection before it can open offline.</p>",
          { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 }
        );
      });
    });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;

  if (request.method !== "GET") return;

  var url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }

  // Weather is live or it is nothing. Never stored, never served from cache.
  if (isWeatherRequest(url)) return;

  if (isFontRequest(url)) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  event.respondWith(networkFirstAsset(request));
});
