/**
 * Two limits: a short burst per client, and a hard daily ceiling.
 *
 * These live in memory, so they are per running instance: they stop one phone
 * hammering the endpoint and stop a runaway day, but they are not a billing
 * guarantee. The provider's own spend cap is the guarantee, which is why
 * DEPLOY_OBSERVE.md puts it first. A durable counter would need a database
 * binding; this app has none and does not want one for a feature that is off.
 *
 * `reset()` exists for the tests.
 */
"use strict";

var WINDOW_MS = 60 * 1000;
var PER_WINDOW = 5;
var buckets = new Map();
var today = { day: "", count: 0 };

function allow(key, now) {
  var t = now || Date.now();
  var bucket = buckets.get(key);
  if (!bucket || t - bucket.start >= WINDOW_MS) bucket = { count: 0, start: t };
  if (bucket.count >= PER_WINDOW) {
    buckets.set(key, bucket);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((WINDOW_MS - (t - bucket.start)) / 1000)) };
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  return { ok: true };
}

function underDailyCap(limit, now) {
  var day = new Date(now || Date.now()).toISOString().slice(0, 10);
  if (today.day !== day) today = { day: day, count: 0 };
  if (today.count >= limit) return { ok: false, remaining: 0 };
  today.count += 1;
  return { ok: true, remaining: Math.max(0, limit - today.count) };
}

function reset() {
  buckets.clear();
  today = { day: "", count: 0 };
}

function state() {
  return { clients: buckets.size, day: today.day, count: today.count };
}

module.exports = {
  allow: allow,
  underDailyCap: underDailyCap,
  reset: reset,
  state: state,
  WINDOW_MS: WINDOW_MS,
  PER_WINDOW: PER_WINDOW,
};
