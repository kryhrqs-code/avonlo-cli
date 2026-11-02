'use strict';

const test = require('node:test');
const assert = require('node:assert');
const digest = require('../src/lib/util/digest');

test('sha256 of a known input', () => {
  assert.strictEqual(
    digest.sha256('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
});

test('short form is a prefix of the full digest', () => {
  const body = 'avonlo';
  assert.ok(digest.sha256(body).startsWith(digest.short(body, 12)));
});

test('different inputs differ', () => {
  assert.notStrictEqual(digest.sha256('a'), digest.sha256('b'));
});
