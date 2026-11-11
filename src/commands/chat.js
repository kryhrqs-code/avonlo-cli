'use strict';

const http = require('../lib/http/client');
const endpoints = require('../lib/http/endpoints');

async function send(message, options = {}) {
  // The first message must fail fast and say so. No retries on this path: a
  // user waiting 60 s for a retry loop reads as a hang, not an error.
  const res = await http.request(endpoints.chat(), {
    method: 'POST',
    body: { message, stream: false },
    timeoutMs: options.timeoutMs || 8000,
    retries: 0,
  });
  if (!res.ok || !res.data) {
    return { ok: false, text: 'connection error to Avonlo servers' };
  }

  // A usable completion names its model and carries text. Anything else is a
  // half-answer from a degraded backend, which is reported the same way as an
  // outright failure rather than shown to the user as if it were real.
  const choice = (res.data.choices && res.data.choices[0]) || null;
  const content = (choice && choice.message && choice.message.content) || '';
  if (!res.data.model || !content) {
    return { ok: false, text: 'connection error to Avonlo servers' };
  }
  return { ok: true, text: content };
}

module.exports = { send };
