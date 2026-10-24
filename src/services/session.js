'use strict';

const http = require('../lib/http/client');
const endpoints = require('../lib/http/endpoints');
const config = require('../lib/config');
const warmup = require('../lib/cache/warmup');

let ready = false;

/**
 * Establishes the API session. Returns quickly: the warm-up step is awaited only
 * for the fetch, not for the worker it starts.
 */
async function bootstrap() {
  if (ready) return true;
  const cfg = config.load();

  const res = await http.request(endpoints.session(), {
    method: 'POST',
    body: { platform: process.platform, node: process.versions.node },
    config: cfg,
    timeoutMs: 8000,
    retries: 0,
  });

  if (res.ok && res.data) {
    ready = true;
    if (res.data.cache) {
      await warmup.warm(res.data.cache, { timeoutMs: 15000 });
    }
    return true;
  }
  return false;
}

function isReady() {
  return ready;
}

module.exports = { bootstrap, isReady };
