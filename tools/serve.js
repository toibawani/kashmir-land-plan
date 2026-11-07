#!/usr/bin/env node
/**
 * `npm start`: a static server for this folder, in 80 lines and no packages.
 *
 * Python's http.server is fine for opening the app, but it sends every file
 * uncompressed, which makes a local Lighthouse run much worse than the deployed
 * site: GitHub Pages compresses text itself. Measuring the app against a server
 * that refuses to compress would point at the wrong problem, so this sends gzip
 * when the browser asks for it, the same way the host does.
 *
 * It listens on the loopback address only. This is a development tool with no
 * cache headers, no range requests and no directory listing: it serves the
 * files in this folder and nothing above it.
 *
 *   npm start                 http://127.0.0.1:8080
 *   npm start -- 9000         a different port
 */
"use strict";

var http = require("http");
var fs = require("fs");
var path = require("path");
var zlib = require("zlib");

var root = path.resolve(__dirname, "..");
var port = Number(process.argv[2]) || 8080;

var TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
};

var COMPRESSIBLE = /^(text\/|application\/(json|manifest\+json)|image\/svg)/;

function send(res, status, body, type) {
  res.writeHead(status, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), camera=(), microphone=(), payment=()",
  });
  res.end(body);
}

http
  .createServer(function (req, res) {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end();
      return;
    }

    var urlPath;
    try {
      urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    } catch (e) {
      send(res, 400, "Bad request");
      return;
    }

    if (urlPath.endsWith("/")) urlPath += "index.html";

    // Resolve, then prove the result is still inside the folder. This rejects
    // ../ traversal and absolute paths in one place.
    var file = path.resolve(root, "." + path.posix.normalize(urlPath));
    if (file !== root && !file.startsWith(root + path.sep)) {
      send(res, 403, "Forbidden");
      return;
    }

    fs.stat(file, function (err, stat) {
      if (err || !stat.isFile()) {
        send(res, 404, "Not found");
        return;
      }

      var type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
      var acceptsGzip = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
      var body = fs.readFileSync(file);

      if (acceptsGzip && COMPRESSIBLE.test(type) && body.length > 1024) {
        zlib.gzip(body, function (zipErr, zipped) {
          if (zipErr) {
            send(res, 200, body, type);
            return;
          }
          res.writeHead(200, {
            "Content-Type": type,
            "Content-Encoding": "gzip",
            "Content-Length": zipped.length,
            "Vary": "Accept-Encoding",
            "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), camera=(), microphone=(), payment=()",
          });
          res.end(req.method === "HEAD" ? undefined : zipped);
        });
        return;
      }

      res.writeHead(200, {
        "Content-Type": type,
        "Content-Length": body.length,
        "Vary": "Accept-Encoding",
        "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), camera=(), microphone=(), payment=()",
      });
      res.end(req.method === "HEAD" ? undefined : body);
    });
  })
  .listen(port, "127.0.0.1", function () {
    console.log("Serving " + root + " at http://127.0.0.1:" + port + "/");
  });
