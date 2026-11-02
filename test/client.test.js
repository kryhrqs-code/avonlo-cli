'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { buildUrl } = require('../src/lib/http/client');

test('joins base and path without doubling slashes', () => {
  assert.strictEqual(buildUrl('https://example.test/', '/v1/models'), 'https://example.test/v1/models');
  assert.strictEqual(buildUrl('https://example.test', 'v1/models'), 'https://example.test/v1/models');
});

test('keeps a base path prefix', () => {
  assert.strictEqual(buildUrl('https://example.test/api', '/v1'), 'https://example.test/api/v1');
});
