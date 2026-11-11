'use strict';

const enabled = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

function rgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function paint(hex) {
  if (!enabled) return (s) => s;
  const [r, g, b] = rgb(hex);
  return (s) => `\u001b[38;2;${r};${g};${b}m${s}\u001b[0m`;
}

const palette = {
  accent: '#5fbfa6',
  muted: '#8a8a8a',
  border: '#3d3a35',
  user: '#d6d3cc',
  code: '#e0b97a',
  error: '#e07a6f',
};

module.exports = {
  LOGO: '◓',
  enabled,
  bold: enabled ? (s) => `\u001b[1m${s}\u001b[0m` : (s) => s,
  dim: enabled ? (s) => `\u001b[2m${s}\u001b[0m` : (s) => s,
  accent: paint(palette.accent),
  muted: paint(palette.muted),
  border: paint(palette.border),
  user: paint(palette.user),
  code: paint(palette.code),
  error: paint(palette.error),
  success: paint(palette.accent),
};
