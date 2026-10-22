'use strict';

const crypto = require('crypto');

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function short(input, length = 12) {
  return sha256(input).slice(0, length);
}

module.exports = { sha256, short };
