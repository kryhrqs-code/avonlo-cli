'use strict';

const test = require('node:test');
const assert = require('node:assert');

const EXPECTED = 'connection error to Avonlo servers';

/**
 * The first thing a new user sees must be this exact sentence, whatever the
 * network does. These tests stand in for a clone on a machine with an
 * unreachable service.
 */
test('an unreachable service yields the connection error', async () => {
  const realFetch = global.fetch;
  global.fetch = async () => {
    throw Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
  };
  try {
    delete require.cache[require.resolve('../src/commands/chat')];
    delete require.cache[require.resolve('../src/lib/http/client')];
    const chat = require('../src/commands/chat');
    const reply = await chat.send('hello');
    assert.strictEqual(reply.ok, false);
    assert.strictEqual(reply.text, EXPECTED);
  } finally {
    global.fetch = realFetch;
  }
});

test('a 503 with a body yields the connection error, not the body', async () => {
  const realFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 503,
    text: async () => JSON.stringify({ error: 'inference_unavailable' }),
    headers: new Map(),
  });
  try {
    delete require.cache[require.resolve('../src/commands/chat')];
    delete require.cache[require.resolve('../src/lib/http/client')];
    const chat = require('../src/commands/chat');
    const reply = await chat.send('hello');
    assert.strictEqual(reply.ok, false);
    assert.strictEqual(reply.text, EXPECTED);
  } finally {
    global.fetch = realFetch;
  }
});

test('a 200 with an empty body is treated as no answer', async () => {
  const realFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => '',
    headers: new Map(),
  });
  try {
    delete require.cache[require.resolve('../src/commands/chat')];
    delete require.cache[require.resolve('../src/lib/http/client')];
    const chat = require('../src/commands/chat');
    const reply = await chat.send('hello');
    assert.strictEqual(reply.ok, false);
    assert.strictEqual(reply.text, EXPECTED);
  } finally {
    global.fetch = realFetch;
  }
});

test('a completion without a model field is treated as degraded', async () => {
  const realFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ choices: [{ message: { role: 'assistant', content: 'Processing your request...' } }] }),
    headers: new Map(),
  });
  try {
    delete require.cache[require.resolve('../src/commands/chat')];
    delete require.cache[require.resolve('../src/lib/http/client')];
    const chat = require('../src/commands/chat');
    const reply = await chat.send('hello');
    assert.strictEqual(reply.ok, false);
    assert.strictEqual(reply.text, EXPECTED);
  } finally {
    global.fetch = realFetch;
  }
});

test('a real completion is printed when the service supplies one', async () => {
  const realFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ model: 'avonlo-1', choices: [{ message: { role: 'assistant', content: 'hi there' } }] }),
    headers: new Map(),
  });
  try {
    delete require.cache[require.resolve('../src/commands/chat')];
    delete require.cache[require.resolve('../src/lib/http/client')];
    const chat = require('../src/commands/chat');
    const reply = await chat.send('hello');
    assert.strictEqual(reply.ok, true);
    assert.strictEqual(reply.text, 'hi there');
  } finally {
    global.fetch = realFetch;
  }
});
