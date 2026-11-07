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

  if (!LAND) return;

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
    return '<details class="land-sources"><summary>Where this comes from</summary><ul>' + items.join("") + "</ul></details>";
  }

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
    parts.push("<h2>Land in " + esc(profile.name) + "</h2>");
    parts.push('<p class="land-caveat">' + esc(LAND.statement()) + "</p>");

    profile.zones.forEach(function (zone) {
      parts.push("<h3>" + esc(zone.label) + "</h3>");
      parts.push("<dl class=\"land-facts\">");
      [
        ["Height", zone.altitude],
        ["Rain", zone.rain],
        ["Soils", zone.soils],
        ["Field crops", zone.field],
        ["Fruit", zone.fruit],
      ].forEach(function (row) {
        parts.push("<dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd>");
      });
      parts.push("</dl>");
    });

    var a = LAND.admin(profile.name);
    if (a) {
      parts.push('<h3>At a glance</h3>');
      parts.push('<dl class="land-facts land-admin">');
      [
        ["Area", a.area.toLocaleString("en-IN") + " sq km"],
        ["Population", a.population.toLocaleString("en-IN") + " (2011 census)"],
        ["Blocks", a.blocks],
        ["Tehsils", a.tehsils],
        ["Revenue villages", a.villages],
      ].forEach(function (row) {
        parts.push("<dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd>");
      });
      parts.push("</dl>");
    }

    var use = LAND.coverage().landUse;
    if (use) {
      parts.push("<h3>Across the Union Territory</h3>");
      parts.push('<dl class="land-facts land-use">');
      [
        ["Under forest", use.forestShare],
        ["Net area sown", use.sownShare],
        ["Irrigated", use.irrigatedShare],
      ].forEach(function (row) {
        parts.push("<dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd>");
      });
      parts.push("</dl>");
      parts.push('<p class="option-note">These are the Union Territory figures, not your district\'s and not your field\'s.</p>');
    }

    parts.push("<p><strong>The district's fruit:</strong> " + esc(profile.fruit) + "</p>");
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
      parts.push('<h3>Other districts in the ' + esc(division) + " division</h3>");
      parts.push('<p class="option-note">Same division, not necessarily the same ground: pick one to see its land.</p>');
      parts.push('<div class="land-chips">');
      others.forEach(function (name) {
        parts.push('<button type="button" class="land-chip" data-district="' + esc(name) + '">' + esc(name) + "</button>");
      });
      parts.push("</div>");
    }

    parts.push(sourceLinks());

    host.innerHTML = parts.join("");
    host.hidden = false;
  }

  function renderVillage() {
    var host = document.getElementById("about-village");
    if (!host) return;
    var c = LAND.coverage();
    var counts =
      "The Union Territory has " +
      c.totalVillages.toLocaleString("en-IN") +
      " villages in the 2011 census, " +
      c.revenueVillages.toLocaleString("en-IN") +
      " revenue villages and " +
      c.patwarHalqas.toLocaleString("en-IN") +
      " patwar halqas.";
    var source = SOURCES && SOURCES.byId(c.sourceId);
    host.innerHTML =
      "<p>" +
      esc(counts) +
      " This app holds no record of any one of them, and it will not invent one." +
      "</p><p>" +
      esc(LAND.statement()) +
      "</p><ul>" +
      c.lines.map(function (line) {
        return "<li>" + esc(line) + "</li>";
      }).join("") +
      "</ul>" +
      (source
        ? '<p class="option-note">Village counts: <a href="' + esc(source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(source.name) + "</a>.</p>"
        : "");
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderVillage();
    var select = document.getElementById("district");
    if (!select) return;
    select.addEventListener("change", function () {
      renderDistrict(select.value);
    });

    var host = document.getElementById("land-preview");
    if (host) {
      host.addEventListener("click", function (event) {
        var chip = event.target.closest ? event.target.closest("button[data-district]") : null;
        if (!chip) return;
        select.value = chip.getAttribute("data-district");
        select.dispatchEvent(new Event("change", { bubbles: true }));
        var heading = host.querySelector("h2");
        if (heading) heading.focus();
      });
    }
    renderDistrict(select.value);
  });
})();
