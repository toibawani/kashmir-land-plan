/**
 * Weather for the My Land, My Plan prototype.
 *
 * Data comes from Open-Meteo (open-meteo.com), which needs no API key. The
 * place name is resolved through the Open-Meteo geocoding service, which is
 * built on GeoNames, so the weather is for a town or city, not for a plot.
 * The elevation that comes back is the average for the model grid cell the
 * town sits in, so it is approximate and can differ from a particular field.
 *
 * Two failure modes are handled explicitly:
 * 1. A network or HTTP error.
 * 2. A response with status 200 whose body is an error. Open-Meteo does this
 *    when it is overloaded, so checking res.ok alone is not enough.
 */
(function () {
  "use strict";

  var GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
  var FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
  var REQUEST_TIMEOUT_MS = 12000;

  /**
   * WMO 4677 weather codes as returned by Open-Meteo. The default branch
   * covers codes outside this table so an unfamiliar value never shows as a
   * blank or misleading label.
   */
  var WMO = {
    0: { label: "Clear sky", group: "clear" },
    1: { label: "Mainly clear", group: "clear" },
    2: { label: "Partly cloudy", group: "cloud" },
    3: { label: "Overcast", group: "cloud" },
    45: { label: "Fog", group: "fog" },
    48: { label: "Freezing fog", group: "fog" },
    51: { label: "Light drizzle", group: "drizzle" },
    53: { label: "Drizzle", group: "drizzle" },
    55: { label: "Heavy drizzle", group: "drizzle" },
    56: { label: "Freezing drizzle", group: "drizzle" },
    57: { label: "Heavy freezing drizzle", group: "drizzle" },
    61: { label: "Light rain", group: "rain" },
    63: { label: "Rain", group: "rain" },
    65: { label: "Heavy rain", group: "rain" },
    66: { label: "Freezing rain", group: "rain" },
    67: { label: "Heavy freezing rain", group: "rain" },
    71: { label: "Light snow", group: "snow" },
    73: { label: "Snow", group: "snow" },
    75: { label: "Heavy snow", group: "snow" },
    77: { label: "Snow grains", group: "snow" },
    80: { label: "Light showers", group: "rain" },
    81: { label: "Showers", group: "rain" },
    82: { label: "Heavy showers", group: "rain" },
    85: { label: "Light snow showers", group: "snow" },
    86: { label: "Heavy snow showers", group: "snow" },
    95: { label: "Thunderstorm", group: "storm" },
    96: { label: "Thunderstorm with hail", group: "storm" },
    99: { label: "Thunderstorm with heavy hail", group: "storm" },
  };

  function describeCode(code) {
    return WMO[code] || { label: "Conditions not reported", group: "unknown" };
  }

  /** A fetch that fails loudly on both real errors and error bodies. */
  function fetchJson(url) {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, REQUEST_TIMEOUT_MS);

    var options = controller ? { signal: controller.signal } : {};

    return fetch(url, options)
      .then(function (res) {
        if (!res.ok) {
          throw new Error("The weather service answered with status " + res.status + ".");
        }
        return res.json();
      })
      .then(function (data) {
        // Open-Meteo can return 200 with an error body, so this check matters.
        if (data && data.error) {
          throw new Error(data.reason || "The weather service reported an error.");
        }
        return data;
      })
      .finally(function () {
        clearTimeout(timer);
      });
  }

  function isJammuAndKashmir(place) {
    var admin = String(place.admin1 || "").toLowerCase();
    return admin.indexOf("kashmir") !== -1 || admin.indexOf("jammu") !== -1;
  }

  /**
   * Pick the best match for a district name. District names are also common
   * place names elsewhere in India, so J&K matches are preferred, then the
   * largest place, and the caller is told how confident to be.
   */
  /**
   * Lower case with accents removed, so a name match is not lost to a diacritic.
   * The place list writes Kupwara as "Kupwāra" and Budgam as "Badgām", and
   * without this the exact-name bonus never fires for those.
   */
  function foldName(value) {
    var text = String(value == null ? "" : value).toLowerCase();
    if (typeof text.normalize === "function") {
      text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    return text;
  }

  function pickPlace(results, districtName) {
    var wanted = foldName(districtName);
    var inState = results.filter(function (r) {
      return isJammuAndKashmir(r);
    });
    var pool = inState.length ? inState : results;

    /**
     * The place list holds more than one record per name, and a near-miss
     * spelling can point at somewhere else entirely. "Kupwara" returns both
     * Kopawor, the district town at 1662 m, and Kupwara, a similarly spelled
     * place in Baramulla district at 3681 m. A farmer acting on the second one
     * would be reading the wrong valley. So where a record is filed counts for
     * more here than how its name happens to be spelled.
     */
    function districtSignal(place) {
      var admin2 = foldName(place.admin2);
      if (!admin2) return 0;
      if (admin2 === wanted) return 120;
      // "Kupwara District" should count for Kupwara.
      if (admin2.indexOf(wanted) === 0) return 100;
      return 0;
    }

    function score(place) {
      var name = foldName(place.name);
      var s = districtSignal(place);
      if (name === wanted) s += 60;
      else if (name.indexOf(wanted) === 0) s += 25;
      else if (name.indexOf(wanted) !== -1) s += 12;
      if (place.feature_code && String(place.feature_code).indexOf("PPLA") === 0) s += 15;
      s += Math.min(Number(place.population) || 0, 200000) / 20000;
      return s;
    }

    var best = pool
      .slice()
      .sort(function (a, b) {
        return score(b) - score(a);
      })[0];

    if (!best) return null;
    return {
      place: best,
      confidence: isJammuAndKashmir(best) ? "district" : "approximate",
    };
  }

  function geocodeUrl(name) {
    return (
      GEO_URL +
      "?name=" +
      encodeURIComponent(name) +
      "&count=10&language=en&format=json&countryCode=IN"
    );
  }

  function geocodeOnce(name) {
    return fetchJson(geocodeUrl(name)).then(function (data) {
      return (data && data.results) || [];
    });
  }

  /**
   * Resolve a place name to a town in J&K where possible. The first attempt
   * uses the name as given, limited to India. If that misses J&K, a second
   * attempt adds "Jammu and Kashmir" so common district names are not matched
   * to a town of the same name elsewhere.
   */
  function geocode(name) {
    var wanted = String(name || "").trim();
    return geocodeOnce(wanted).then(function (results) {
      var picked = pickPlace(results, wanted);
      var alreadyQualified = /jammu|kashmir/i.test(wanted);
      if (picked && picked.confidence === "district") {
        picked.queryUsed = wanted;
        return picked;
      }
      if (alreadyQualified) {
        if (!picked) {
          var err = new Error("No place called " + wanted + " was found.");
          err.reason = "not_found";
          throw err;
        }
        picked.queryUsed = wanted;
        return picked;
      }
      var qualified = wanted + ", Jammu and Kashmir";
      return geocodeOnce(qualified).then(function (extra) {
        var second = pickPlace(extra, wanted);
        var best = second && second.confidence === "district" ? second : picked || second;
        if (!best) {
          var missing = new Error("No place called " + wanted + " was found.");
          missing.reason = "not_found";
          throw missing;
        }
        best.queryUsed = second && second.confidence === "district" ? qualified : wanted;
        return best;
      });
    });
  }

  function forecast(lat, lon) {
    var params = [
      "latitude=" + lat,
      "longitude=" + lon,
      "current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
      "daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
      "timezone=auto",
      "forecast_days=6",
    ];
    return fetchJson(FORECAST_URL + "?" + params.join("&"));
  }

  function today(timezone) {
    try {
      return new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch (_) {
      return "";
    }
  }

  function normalise(picked, data) {
    var daily = data.daily || {};
    var days = (daily.time || []).map(function (iso, i) {
      var code = daily.weather_code ? daily.weather_code[i] : null;
      var d = new Date(iso + "T12:00:00");
      var label;
      try {
        label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
      } catch (_) {
        label = iso;
      }
      return {
        date: iso,
        label: label,
        code: code,
        conditions: describeCode(code).label,
        group: describeCode(code).group,
        max: daily.temperature_2m_max ? daily.temperature_2m_max[i] : null,
        min: daily.temperature_2m_min ? daily.temperature_2m_min[i] : null,
        rainChance:
          daily.precipitation_probability_max != null
            ? daily.precipitation_probability_max[i]
            : null,
        rainSum: daily.precipitation_sum ? daily.precipitation_sum[i] : null,
      };
    });

    var current = data.current || {};
    var currentCode = current.weather_code;
    var p = picked.place;

    return {
      place: {
        name: p.name,
        district: p.admin2 || "",
        state: p.admin1 || "",
        country: p.country || "",
        latitude: p.latitude,
        longitude: p.longitude,
        timezone: data.timezone || p.timezone || "",
        elevation: typeof data.elevation === "number" ? data.elevation : null,
        population: p.population || null,
      },
      confidence: picked.confidence,
      queryUsed: picked.queryUsed || "",
      current: {
        time: current.time || "",
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        precipitation: current.precipitation,
        wind: current.wind_speed_10m,
        code: currentCode,
        conditions: describeCode(currentCode).label,
        group: describeCode(currentCode).group,
      },
      days: days,
      fetchedAt: new Date(),
      fetchedLabel: today(),
    };
  }

  var cache = Object.create(null);

  /**
   * Look up weather for a district name.
   * Resolves with the normalised result, rejects with an Error carrying a
   * `reason` of "not_found" or "unreachable" where those can be told apart.
   */
  function isOffline() {
    return typeof navigator !== "undefined" && navigator.onLine === false;
  }

  function get(districtName, force) {
    var key = String(districtName || "").trim().toLowerCase();
    if (!key) {
      var empty = new Error("No district given.");
      empty.reason = "no_district";
      return Promise.reject(empty);
    }
    if (!force && cache[key]) return Promise.resolve(cache[key]);
    if (isOffline()) {
      var offline = new Error(
        "This device is offline. Weather is the only part of the app that needs the internet."
      );
      offline.reason = "offline";
      return Promise.reject(offline);
    }

    return geocode(districtName)
      .then(function (picked) {
        return forecast(picked.place.latitude, picked.place.longitude).then(function (data) {
          return normalise(picked, data);
        });
      })
      .then(function (result) {
        cache[key] = result;
        return result;
      })
      .catch(function (err) {
        if (err && err.reason) throw err;
        var wrapped = new Error(
          err && err.message
            ? err.message
            : "The weather service could not be reached from this device."
        );
        wrapped.reason = "unreachable";
        wrapped.cause = err;
        throw wrapped;
      });
  }

  function cached(districtName) {
    return cache[String(districtName || "").trim().toLowerCase()] || null;
  }

  window.MLMP_WEATHER = {
    get: get,
    cached: cached,
    describeCode: describeCode,
    isOffline: isOffline,
    attribution: "Weather data from Open-Meteo (CC BY 4.0), general for a town, not your plot.",
  };
})();
