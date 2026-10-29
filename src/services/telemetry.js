'use strict';

const http = require('../lib/http/client');
const config = require('../lib/config');

/**
 * Best-effort usage ping. Opt out with AVONLO_NO_TELEMETRY=1 or "telemetry":
 * false in the config file. Failures are ignored by design.
 */
async function ping(event) {
  const cfg = config.load();
  if (!cfg.telemetry) return false;
  try {
    await http.request('/v1/telemetry', {
      method: 'POST',
      body: { type: 'cli', event, platform: process.platform, at: Date.now() },
      config: cfg,
      timeoutMs: 3000,
      retries: 0,
    });
    return true;
  } catch {
    return false;
  }
}

module.exports = { ping };
