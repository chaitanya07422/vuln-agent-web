#!/usr/bin/env node
/**
 * Tiny always-on front for ScanLead web.
 * Listens on EDGE_PORT (3010) and proxies to UPSTREAM_PORT (3011).
 * While Next is restarting, serves a short "Updating…" page instead of a blank drop.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const EDGE_PORT = Number(process.env.EDGE_PORT || 3010);
const UPSTREAM_HOST = process.env.UPSTREAM_HOST || "127.0.0.1";
const UPSTREAM_PORT = Number(process.env.UPSTREAM_PORT || 3011);
const UPDATING_HTML = path.join(__dirname, "updating.html");

function updatingBody() {
  try {
    return fs.readFileSync(UPDATING_HTML);
  } catch {
    return Buffer.from(
      "<!doctype html><title>Updating</title><p>ScanLead is updating — retry in a few seconds.</p>",
      "utf8",
    );
  }
}

function proxy(req, res) {
  const headers = { ...req.headers, host: `${UPSTREAM_HOST}:${UPSTREAM_PORT}` };
  const opts = {
    hostname: UPSTREAM_HOST,
    port: UPSTREAM_PORT,
    path: req.url,
    method: req.method,
    headers,
    timeout: 60_000,
  };

  const upstream = http.request(opts, (upRes) => {
    res.writeHead(upRes.statusCode || 502, upRes.headers);
    upRes.pipe(res);
  });

  upstream.on("timeout", () => {
    upstream.destroy();
    if (!res.headersSent) {
      res.writeHead(504, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      res.end(updatingBody());
    }
  });

  upstream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(503, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "retry-after": "5",
      });
      res.end(updatingBody());
    } else {
      res.end();
    }
  });

  req.pipe(upstream);
}

const server = http.createServer(proxy);
server.listen(EDGE_PORT, "0.0.0.0", () => {
  console.log(`scanlead-edge :${EDGE_PORT} → ${UPSTREAM_HOST}:${UPSTREAM_PORT}`);
});
