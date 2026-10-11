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
  function pickPlace(results, districtName) {
    var wanted = districtName.toLowerCase();
    var inState = results.filter(function (r) {
      return isJammuAndKashmir(r);
    });
    var pool = inState.length ? inState : results;

    function score(place) {
      var name = String(place.name || "").toLowerCase();
      var s = 0;
      if (name === wanted) s += 100;
      else if (name.indexOf(wanted) === 0) s += 40;
      else if (name.indexOf(wanted) !== -1) s += 20;
      if (String(place.admin2 || "").toLowerCase() === wanted) s += 60;
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

  function geocode(name) {
    var url =
      GEO_URL +
      "?name=" +
      encodeURIComponent(name) +
      "&count=10&language=en&format=json";
    return fetchJson(url).then(function (data) {
      var results = (data && data.results) || [];
      var picked = pickPlace(results, name);
      if (!picked) {
        var err = new Error("No place called " + name + " was found.");
        err.reason = "not_found";
        throw err;
      }
      return picked;
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
  function get(districtName, force) {
    var key = String(districtName || "").trim().toLowerCase();
    if (!key) {
      var empty = new Error("No district given.");
      empty.reason = "no_district";
      return Promise.reject(empty);
    }
    if (!force && cache[key]) return Promise.resolve(cache[key]);

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
    attribution: "Weather data from Open-Meteo (CC BY 4.0), general for a town, not your plot.",
  };
})();
