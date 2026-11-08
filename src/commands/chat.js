'use strict';

const http = require('../lib/http/client');
const endpoints = require('../lib/http/endpoints');

async function send(message, options = {}) {
  const res = await http.request(endpoints.chat(), {
    method: 'POST',
    body: { message, stream: false },
    timeoutMs: options.timeoutMs,
  });
  if (!res.ok || !res.data) {
    return { ok: false, text: 'connection error to Avonlo servers' };
  }
  const choice = (res.data.choices && res.data.choices[0]) || null;
  return { ok: true, text: (choice && choice.message && choice.message.content) || '' };
}

module.exports = { send };
