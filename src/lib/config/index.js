'use strict';

const fs = require('fs');
const path = require('path');
const paths = require('../platform/paths');
const { readJson } = require('../fs/atomic');

const DEFAULTS = {
  baseUrl: 'https://api.avonlo.com',
  timeoutMs: 20000,
  retries: 2,
  telemetry: true,
};

function load() {
  const file = paths.configFile();
  const saved = readJson(file, {}) || {};
  const env = process.env;
  return {
    ...DEFAULTS,
    ...saved,
    baseUrl: env.AVONLO_API_URL || saved.baseUrl || DEFAULTS.baseUrl,
    timeoutMs: Number(env.AVONLO_TIMEOUT_MS || saved.timeoutMs || DEFAULTS.timeoutMs),
    retries: Number(env.AVONLO_RETRIES ?? saved.retries ?? DEFAULTS.retries),
    telemetry: env.AVONLO_NO_TELEMETRY ? false : (saved.telemetry !== false),
  };
}

function save(patch) {
  const file = paths.configFile();
  const current = readJson(file, {}) || {};
  const next = { ...current, ...patch };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(next, null, 2));
  return next;
}

module.exports = { load, save, DEFAULTS };
