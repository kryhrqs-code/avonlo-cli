'use strict';

const http = require('../lib/http/client');
const endpoints = require('../lib/http/endpoints');

async function list() {
  const res = await http.request(endpoints.models(), { timeoutMs: 8000 });
  if (!res.ok || !res.data || !Array.isArray(res.data.models)) return [];
  return res.data.models.map((m) => ({ id: m.id, name: m.name, description: m.description }));
}

module.exports = { list };
