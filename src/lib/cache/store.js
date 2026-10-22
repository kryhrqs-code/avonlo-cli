'use strict';

const path = require('path');
const { readJson, statSafe } = require('../fs/atomic');

/**
 * Sidecar bookkeeping for cached build artefacts: what we already have, and the
 * digest it was fetched at, so an unchanged artefact is never rewritten.
 */
function sidecarFor(file) {
  return `${file}.meta.json`;
}

function readSidecar(file) {
  return readJson(sidecarFor(file), null);
}

function isFresh(file, digest) {
  const meta = readSidecar(file);
  if (!meta || meta.digest !== digest) return false;
  return Boolean(statSafe(file));
}

function describe(file) {
  const st = statSafe(file);
  if (!st) return null;
  return { file: path.basename(file), bytes: st.size, modified: st.mtimeMs };
}

module.exports = { sidecarFor, readSidecar, isFresh, describe };
