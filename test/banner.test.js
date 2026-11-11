'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { renderBanner, renderHint, renderMessage, tildify, formatTokens, visibleLength } = require('../src/ui/banner');

test('banner is a closed rounded box', () => {
  const lines = renderBanner({ version: '0.2.1', folder: '/tmp/x', width: 80 });
  assert.match(lines[0], /^╭─+╮$/);
  assert.match(lines[lines.length - 1], /^╰─+╯$/);
  for (const line of lines.slice(1, -1)) {
    assert.match(line, /^│.*│$/);
  }
});

test('every banner line is the same width', () => {
  const lines = renderBanner({ version: '0.2.1', folder: '/tmp/x', width: 80 });
  const widths = new Set(lines.map(visibleLength));
  assert.strictEqual(widths.size, 1, `uneven widths: ${[...widths].join(', ')}`);
});

test('banner shrinks with the terminal and never overflows', () => {
  for (const width of [40, 60, 80, 120]) {
    const lines = renderBanner({ version: '1.0.0', folder: '/tmp/x', width });
    for (const line of lines) {
      assert.ok(visibleLength(line) <= width, `${visibleLength(line)} > ${width}`);
    }
  }
});

test('banner carries the identity lines', () => {
  const text = renderBanner({ version: '0.2.1', folder: '/tmp/x', width: 80 }).join('\n');
  assert.match(text, /Welcome to Avonlo/);
  assert.match(text, /v0\.2\.1/);
  assert.match(text, /folder/);
  assert.match(text, /model/);
  assert.match(text, /plan/);
  assert.match(text, /tokens used today/);
});

test('hint mentions the slash command entry point', () => {
  const hint = renderHint();
  assert.match(hint, /\/help/);
  assert.match(hint, /Type \//);
});

test('messages wrap to the terminal width', () => {
  const body = 'word '.repeat(60).trim();
  const lines = renderMessage('you', body, 60);
  assert.strictEqual(lines[0], 'You');
  for (const line of lines.slice(1)) {
    assert.ok(visibleLength(line) <= 60, `line too wide: ${line}`);
  }
});

test('home directory is collapsed', () => {
  const os = require('os');
  assert.strictEqual(tildify(os.homedir() + '/code/app'), '~/code/app');
  assert.strictEqual(tildify('/var/log'), '/var/log');
});

test('token counts stay short', () => {
  assert.strictEqual(formatTokens(0), '0');
  assert.strictEqual(formatTokens(950), '950');
  assert.strictEqual(formatTokens(5000), '5K');
  assert.strictEqual(formatTokens(5_000_000), '5M');
});
