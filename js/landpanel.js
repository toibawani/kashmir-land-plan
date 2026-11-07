/**
 * Draws the district land reference and the village-records answer.
 *
 * Kept apart from app.js on purpose: it reads two small modules and writes two
 * containers, and none of the planning logic needs to know it exists. If the
 * containers are missing, it does nothing.
 *
 * The panel is shown while the district is being chosen, because that is where
 * "what is this district like" is a useful question, and on the About screen
 * beside the explanation of what the app does not hold.
 */
(function () {
  "use strict";

  var LAND = window.MLMP_LAND;
  var SOURCES = window.MLMP_SOURCES;
  var MSG = window.MLMP_MESSAGES;

  if (!LAND) return;

  /* Interface labels come from the shared dictionary, so the land card speaks
     the language the reader chose. The district prose — zones, soils, crops and
     the caveat — stays in English and is not passed off as translated, the same
     policy the catalogue's option text follows: rewriting agronomy without a
     native reviewer would be worse than leaving it in one language. */
  function t(key, vars) {
    if (MSG && MSG.t) return MSG.t(key, vars);
    return "";
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function sourceLinks() {
    if (!SOURCES) return "";
    var seen = {};
    var items = LAND.sourceIds()
      .map(function (id) {
        if (seen[id]) return "";
        seen[id] = true;
        var s = SOURCES.byId(id);
        if (!s) return "";
        return (
          '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' +
          esc(s.short) +
          "</a> " +
          esc(s.usedFor) +
          "</li>"
        );
      })
      .filter(Boolean);
    if (!items.length) return "";
    return (
      '<details class="land-sources"><summary>' +
      esc(t("land.sources")) +
      "</summary><ul>" +
      items.join("") +
      "</ul></details>"
    );
  }

  /* A plain-text version of what is on screen, so a farmer can paste it into a
     message to the agriculture office. Nothing is added that is not visible
     above, and the caveat travels with it. */
  function summaryText(profile) {
    var lines = [t("land.title", { district: profile.name }), LAND.statement(), ""];
    profile.zones.forEach(function (zone) {
      lines.push(zone.label);
      lines.push("  " + t("land.height") + ": " + zone.altitude);
      lines.push("  " + t("land.rain") + ": " + zone.rain);
      lines.push("  " + t("land.soils") + ": " + zone.soils);
      lines.push("  " + t("land.crops") + ": " + zone.field);
      lines.push("  " + t("land.fruit") + ": " + zone.fruit);
    });
    var a = LAND.admin(profile.name);
    if (a) {
      lines.push(
        t("land.area") + " " + a.area + " sq km; " +
          t("land.population") + " " + a.population + " (2011); " +
          t("land.blocks") + " " + a.blocks + "; " +
          t("land.tehsils") + " " + a.tehsils + "; " +
          t("land.villages") + " " + a.villages + "."
      );
    }
    lines.push(t("land.fruit") + ": " + profile.fruit);
    if (SOURCES) {
      var cited = LAND.sourceIds()
        .map(function (id) {
          var s = SOURCES.byId(id);
          return s ? s.short + " " + s.url : "";
        })
        .filter(Boolean);
      if (cited.length) lines.push("", t("land.sources") + ":", cited.join("\n"));
    }
    return lines.join("\n");
  }

  var landOpen = false;

  function renderDistrict(name) {
    var host = document.getElementById("land-preview");
    if (!host) return;
    var profile = name ? LAND.forDistrict(name) : null;
    if (!profile) {
      host.hidden = true;
      host.innerHTML = "";
      return;
    }

    var parts = [];
    parts.push("<h2>" + esc(t("land.title", { district: profile.name })) + "</h2>");
    parts.push('<p class="land-caveat">' + esc(LAND.statement()) + "</p>");

    profile.zones.forEach(function (zone) {
      parts.push("<h3>" + esc(zone.label) + "</h3>");
      parts.push('<dl class="land-facts">');
      [
        [t("land.height"), zone.altitude],
        [t("land.rain"), zone.rain],
        [t("land.soils"), zone.soils],
        [t("land.crops"), zone.field],
        [t("land.fruit"), zone.fruit],
      ].forEach(function (row) {
        parts.push("<dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd>");
      });
      parts.push("</dl>");
    });

    var a = LAND.admin(profile.name);
    if (a) {
      parts.push("<h3>" + esc(t("land.glance")) + "</h3>");
      parts.push('<dl class="land-facts land-admin">');
      [
        [t("land.area"), a.area.toLocaleString("en-IN") + " sq km"],
        [t("land.population"), a.population.toLocaleString("en-IN") + " (2011)"],
        [t("land.blocks"), a.blocks],
        [t("land.tehsils"), a.tehsils],
        [t("land.villages"), a.villages],
      ].forEach(function (row) {
        parts.push("<dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd>");
      });
      parts.push("</dl>");
    }

    var use = LAND.coverage().landUse;
    if (use) {
      parts.push("<h3>" + esc(t("land.utTitle")) + "</h3>");
      parts.push('<dl class="land-facts land-use">');
      [
        [t("land.forest"), use.forestShare],
        [t("land.sown"), use.sownShare],
        [t("land.irrigated"), use.irrigatedShare],
      ].forEach(function (row) {
        parts.push("<dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd>");
      });
      parts.push("</dl>");
      parts.push('<p class="option-note">These are the Union Territory figures, not your district\'s and not your field\'s.</p>');
    }

    parts.push("<p><strong>" + esc(t("land.fruit")) + ":</strong> " + esc(profile.fruit) + "</p>");
    if (profile.note) parts.push("<p>" + esc(profile.note) + "</p>");
    parts.push(
      '<p class="option-note">' +
        (profile.specific
          ? "This district has its own line in the sources below."
          : "No district-specific survey is recorded here, so this is the zone description the sources support.") +
        "</p>"
    );

    var division = LAND.divisionOf(profile.name);
    var others = LAND.nearby(profile.name);
    if (division && others.length) {
      parts.push(
        "<h3>" + esc(t("land.nearby", { division: t("land.division." + division) })) + "</h3>"
      );
      parts.push('<p class="option-note">Same division, not necessarily the same ground: pick one to see its land.</p>');
      parts.push('<div class="land-chips">');
      others.forEach(function (other) {
        parts.push(
          '<button type="button" class="land-chip" data-district="' + esc(other) + '">' + esc(other) + "</button>"
        );
      });
      parts.push("</div>");
    }

    parts.push('<button type="button" class="land-copy" data-copy="1">' + esc(t("land.copy")) + "</button>");
    parts.push(sourceLinks());

    // In the form this is reference material sitting between the district picker
    // and Continue, so it starts folded: a farmer reads it when they want it and
    // keeps the form short otherwise. On About it is the subject of the page, so
    // it stays open.
    var collapsible = host.id === "land-preview";
    var open = collapsible ? (landOpen ? " open" : "") : " open";
    host.innerHTML =
      '<details class="land-details"' +
      open +
      '><summary class="land-summary">' +
      esc(t("land.summary", { district: profile.name })) +
      "</summary>" +
      parts.join("") +
      "</details>";
    var details = host.querySelector("details");
    if (details) {
      details.addEventListener("toggle", function () {
        landOpen = details.open;
      });
    }
    host.hidden = false;
  }

  function renderVillage() {
    var host = document.getElementById("about-village");
    if (!host) return;
    var c = LAND.coverage();
    var counts = t("land.villageCounts", {
      villages: c.totalVillages.toLocaleString("en-IN"),
      revenue: c.revenueVillages.toLocaleString("en-IN"),
      halqas: c.patwarHalqas.toLocaleString("en-IN"),
    });
    var source = SOURCES && SOURCES.byId(c.sourceId);
    host.innerHTML =
      "<p>" +
      esc(counts) +
      " This app holds no record of any one of them, and it will not invent one." +
      "</p><p>" +
      esc(LAND.statement()) +
      "</p><ul>" +
      c.lines
        .map(function (line) {
          return "<li>" + esc(line) + "</li>";
        })
        .join("") +
      "</ul>" +
      (source
        ? '<p class="option-note">' +
          esc(t("land.villageSource")) +
          ' <a href="' +
          esc(source.url) +
          '" target="_blank" rel="noopener noreferrer">' +
          esc(source.name) +
          "</a>.</p>"
        : "");
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderVillage();
    var select = document.getElementById("district");
    if (!select) return;
    select.addEventListener("change", function () {
      renderDistrict(select.value);
    });

    var langSelect = document.getElementById("lang-select");
    if (langSelect) {
      langSelect.addEventListener("change", function () {
        renderVillage();
        renderDistrict(select.value);
      });
    }

    var host = document.getElementById("land-preview");
    if (host) {
      host.addEventListener("click", function (event) {
        var copy = event.target.closest ? event.target.closest("button[data-copy]") : null;
        if (copy) {
          var current = LAND.forDistrict(select.value);
          if (!current) return;
          var text = summaryText(current);
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(
              function () {
                copy.textContent = t("land.copied");
                setTimeout(function () {
                  copy.textContent = t("land.copy");
                }, 2000);
              },
              function () {
                copy.textContent = t("land.copyManual");
              }
            );
          } else {
            copy.textContent = t("land.copyManual");
          }
          return;
        }
        var chip = event.target.closest ? event.target.closest("button[data-district]") : null;
        if (!chip) return;
        select.value = chip.getAttribute("data-district");
        landOpen = true;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        var heading = host.querySelector("h2");
        if (heading) heading.focus();
      });
    }
    renderDistrict(select.value);
  });
})();
