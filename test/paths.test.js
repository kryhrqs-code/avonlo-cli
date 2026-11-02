'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const paths = require('../src/lib/platform/paths');

test('config and cache directories are separate', () => {
  assert.notStrictEqual(paths.configDir(), paths.cacheDir());
});

test('config file lives inside the config directory', () => {
  assert.ok(paths.configFile().startsWith(paths.configDir()));
});

test('every path is absolute', () => {
  for (const p of [paths.configDir(), paths.cacheDir(), paths.configFile()]) {
    assert.ok(path.isAbsolute(p), `${p} should be absolute`);
  }
});
