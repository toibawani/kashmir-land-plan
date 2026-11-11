/**
 * The field-test answers page: read, export and delete what is stored locally.
 *
 * This is the whole behaviour of `feedback.html`. It lives in a file rather
 * than an inline `<script>` so that page can carry a Content Security Policy
 * with `script-src 'self'`, which refuses any injected inline script.
 *
 * It reads only this browser's storage, through `js/feedback.js`, which
 * validates every row again on the way out. Nothing here reaches the network.
 */
(function () {
  "use strict";

  var FB = window.MLMP_FEEDBACK;
  var countEl = document.getElementById("feedback-count");
  var host = document.getElementById("feedback-table-host");
  var status = document.getElementById("feedback-status");

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    if (!FB) {
      countEl.textContent = "The feedback module did not load.";
      return;
    }
    var rows = FB.list();
    countEl.textContent =
      rows.length === 0
        ? "No answers saved in this browser yet."
        : rows.length + (rows.length === 1 ? " answer" : " answers") + " saved in this browser.";
    if (!rows.length) {
      host.innerHTML = "";
      return;
    }
    host.innerHTML =
      '<table class="feedback-table"><thead><tr>' +
      ["Saved", "District", "Altitude", "Language", "Useful", "Wrong for this district", "Would use"]
        .map(function (h) {
          return '<th scope="col">' + h + "</th>";
        })
        .join("") +
      "</tr></thead><tbody>" +
      rows
        .map(function (r) {
          return (
            "<tr><td>" +
            esc(r.savedAt) +
            "</td><td>" +
            esc(r.district) +
            "</td><td>" +
            esc(r.altitude) +
            "</td><td>" +
            esc(r.language) +
            "</td><td>" +
            esc(r.useful) +
            "</td><td>" +
            esc(r.wrong) +
            "</td><td>" +
            esc(r.wouldUse) +
            "</td></tr>"
          );
        })
        .join("") +
      "</tbody></table>";
  }

  document.getElementById("btn-export").addEventListener("click", function () {
    if (!FB) return;
    var rows = FB.list();
    if (!rows.length) {
      status.textContent = "There is nothing to export yet.";
      return;
    }
    var blob = new Blob([FB.toCsv(rows)], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "mlmp-field-test-answers.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    status.textContent = "Exported. The file was created on this device.";
  });

  document.getElementById("btn-clear").addEventListener("click", function () {
    if (!FB) return;
    var ok = window.confirm("Delete every field-test answer saved in this browser? This cannot be undone.");
    if (!ok) return;
    FB.clear();
    status.textContent = "Local answers deleted.";
    render();
  });

  render();
})();
