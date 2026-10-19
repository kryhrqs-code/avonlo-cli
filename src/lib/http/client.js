'use strict';

const config = require('../config');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(base, pathname) {
  const trimmed = String(base || '').replace(/\/+$/, '');
  const suffix = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return trimmed + suffix;
}

/**
 * Minimal JSON client with bounded retries. Network errors and 5xx responses are
 * retried; 4xx is returned to the caller because the request itself was wrong.
 */
async function request(pathname, options = {}) {
  const cfg = options.config || config.load();
  const url = options.url || buildUrl(cfg.baseUrl, pathname);
  const attempts = Math.max(1, (options.retries ?? cfg.retries) + 1);
  const timeout = options.timeoutMs ?? cfg.timeoutMs;

  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'content-type': 'application/json',
          'user-agent': `avonlo/${require('../../../package.json').version}`,
          ...(options.headers || {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status >= 500 && attempt < attempts) {
        await sleep(200 * attempt);
        continue;
      }
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      return { ok: res.ok, status: res.status, data, headers: res.headers };
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (attempt < attempts) await sleep(200 * attempt);
    }
  }
  return { ok: false, status: 0, data: null, error: lastError };
}

/** Raw text fetch, used for content that is not JSON. */
async function text(url, options = {}) {
  const timeout = options.timeoutMs ?? 20000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: options.headers });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

module.exports = { request, text, buildUrl };
