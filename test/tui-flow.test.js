'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { createState, submitText } = require('../src/cli/tui');

function harness(reply, connection = true) {
  const state = createState();
  const calls = { draw: 0, ping: 0, bootstrap: 0 };
  const deps = {
    draw: () => { calls.draw += 1; },
    history: [],
    pushSystem: (t) => state.transcript.push({ role: 'system', text: t }),
    onHistory: () => {},
    bootstrap: async () => { calls.bootstrap += 1; return connection; },
    send: async () => reply,
    ping: async () => { calls.ping += 1; },
    handleSlash: (t) => state.transcript.push({ role: 'system', text: t }),
  };
  return { state, deps, calls };
}

test('a failing reply lands in the transcript without throwing', async () => {
  const { state, deps, calls } = harness({ ok: false, text: 'connection error to Avonlo servers' });
  await submitText(state, 'hello', deps);
  const roles = state.transcript.map((e) => e.role);
  assert.deepStrictEqual(roles, ['you', 'avonlo']);
  assert.strictEqual(state.transcript[1].text, 'connection error to Avonlo servers');
  assert.strictEqual(state.busy, false);
  assert.strictEqual(state.input, '');
  assert.ok(calls.draw >= 2, 'redrew before and after');
  assert.strictEqual(calls.ping, 1);
});

test('the connection is established before sending', async () => {
  const { state, deps } = harness({ ok: false, text: 'x' }, false);
  await submitText(state, 'hi', deps);
  assert.strictEqual(state.connected, 'offline');
});

test('empty input does nothing', async () => {
  const { state, deps, calls } = harness({ ok: true, text: 'x' });
  await submitText(state, '   ', deps);
  assert.strictEqual(state.transcript.length, 0);
  assert.strictEqual(calls.draw, 0);
});

test('slash input is routed to the command handler, not the service', async () => {
  const { state, deps, calls } = harness({ ok: true, text: 'x' });
  await submitText(state, '/help', deps);
  assert.strictEqual(calls.ping, 0);
  assert.strictEqual(state.transcript.length, 1);
  assert.strictEqual(state.transcript[0].role, 'system');
});

test('a missing reply body still produces the connection error', async () => {
  const { state, deps } = harness({ ok: true, text: '' });
  await submitText(state, 'hello', deps);
  assert.strictEqual(state.transcript[1].text, 'connection error to Avonlo servers');
});

test('history records the message and resets the index', async () => {
  const { state, deps } = harness({ ok: false, text: 'x' });
  await submitText(state, 'first', deps);
  await submitText(state, 'second', deps);
  assert.deepStrictEqual(deps.history, ['first', 'second']);
});
