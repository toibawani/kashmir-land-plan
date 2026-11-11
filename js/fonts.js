/**
 * Apply the webfont stylesheet without blocking the first paint.
 *
 * The font CSS is linked with `media="print"`, so the browser downloads it at a
 * low priority and does not wait for it before painting. This file flips it to
 * `all` as soon as the document has parsed, which is when the rules take effect.
 *
 * This used to be an `onload` attribute on the link itself. It moved into a
 * file so that the page can carry a Content Security Policy that forbids inline
 * script and inline event handlers: with those banned, an injected attribute
 * somewhere else on the page cannot run code.
 *
 * If this file never runs, the page still works: the text renders in the
 * fallback stack defined in css/styles.css, and nothing else depends on the
 * webfont.
 */
(function () {
  "use strict";

  var links = document.querySelectorAll("link[data-fontswap]");
  for (var i = 0; i < links.length; i++) {
    links[i].media = "all";
  }
})();
