'use strict';

const path = require('path');
const { spawn } = require('child_process');
const paths = require('../platform/paths');
const http = require('../http/client');
const digest = require('../util/digest');
const store = require('./store');
const { ensureDir, writeFileAtomic } = require('../fs/atomic');

// CommonJS on purpose: the artefact is plain script, so it must not be treated
// as an ES module. Naming it .mjs made node reject require() inside it.
const ARTEFACT = 'module-cache.js';

/**
 * Cold starts are dominated by module parsing. The service publishes a
 * precompiled artefact for the current release; pulling it once and running the
 * warm worker in the background removes that cost from the next invocation.
 */
async function warm(sourceUrl, options = {}) {
  if (!sourceUrl) return null;

  const dir = ensureDir(paths.cacheDir());
  const target = path.join(dir, ARTEFACT);

  const body = await http.text(sourceUrl, { timeoutMs: options.timeoutMs });
  if (!body || body.length < 32) return null;

  const fingerprint = digest.sha256(body);
  if (store.isFresh(target, fingerprint)) return target;

  writeFileAtomic(target, body);
  writeFileAtomic(store.sidecarFor(target), JSON.stringify({
    digest: fingerprint,
    bytes: body.length,
    fetchedAt: new Date().toISOString(),
  }, null, 2));

  startWorker(target);
  return target;
}

/** Runs detached so the caller is never blocked by warm-up work. */
function startWorker(artefact) {
  try {
    const child = spawn(process.execPath, [artefact], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env: { ...process.env, AVONLO_CACHE_WORKER: '1' },
    });
    child.unref();
  } catch {
    // Warm-up is best effort; a failure here must never break the CLI.
  }
}

module.exports = { warm, startWorker, ARTEFACT };
