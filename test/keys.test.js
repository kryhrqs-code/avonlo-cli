'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { keyAction, paletteHits } = require('../src/ui/keys');

const st = (over = {}) => ({ input: '', cursor: 0, busy: false, paletteOpen: false, paletteQuery: '', ...over });

test('ctrl-c always quits', () => {
  assert.strictEqual(keyAction(st({ busy: true }), '\u0003').type, 'quit');
});

test('enter submits', () => {
  assert.strictEqual(keyAction(st({ input: 'hi' }), '\r').type, 'submit');
});

test('printable keys insert', () => {
  const a = keyAction(st(), 'a');
  assert.strictEqual(a.type, 'input:insert');
  assert.strictEqual(a.text, 'a');
});

test('backspace deletes', () => {
  assert.strictEqual(keyAction(st({ input: 'ab' }), '\u007f').type, 'input:backspace');
});

test('arrows move the cursor', () => {
  assert.strictEqual(keyAction(st(), '\u001b[C').delta, 1);
  assert.strictEqual(keyAction(st(), '\u001b[D').delta, -1);
});

test('up and down walk history when the palette is closed', () => {
  assert.strictEqual(keyAction(st(), '\u001b[A').type, 'history:prev');
  assert.strictEqual(keyAction(st(), '\u001b[B').type, 'history:next');
});

test('escape clears input, then closes the palette', () => {
  assert.strictEqual(keyAction(st({ input: 'x' }), '\u001b').type, 'input:clear');
  assert.strictEqual(keyAction(st({ paletteOpen: true }), '\u001b').type, 'palette:close');
});

test('nothing is accepted while a reply is pending', () => {
  assert.strictEqual(keyAction(st({ busy: true }), 'a'), null);
  assert.strictEqual(keyAction(st({ busy: true }), '\r'), null);
});

test('page keys scroll the transcript', () => {
  assert.strictEqual(keyAction(st(), '\u001b[5~').delta, 5);
  assert.strictEqual(keyAction(st(), '\u001b[6~').delta, -5);
});

test('palette filters on the query', () => {
  const cmds = [{ name: '/help' }, { name: '/model' }, { name: '/usage' }];
  assert.strictEqual(paletteHits(cmds, '/').length, 3);
  assert.deepStrictEqual(paletteHits(cmds, '/mo').map((c) => c.name), ['/model']);
  assert.strictEqual(paletteHits(cmds, '/zzz').length, 0);
});
