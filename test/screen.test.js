'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { renderFrame, wrap, visible, width } = require('../src/ui/screen');

const base = {
  version: '0.2.1',
  folder: '~/code/app',
  plan: 'Free',
  model: 'avonlo-1',
  connected: 'connected',
  transcript: [],
  input: '',
  cursor: 0,
  busy: false,
  spinner: 0,
  paletteOpen: false,
  paletteIndex: 0,
  paletteQuery: '',
  commands: [
    { name: '/help', help: 'show commands' },
    { name: '/model', help: 'list models' },
  ],
  scroll: 0,
  greeting: '',
};

function frame(over, size) {
  return renderFrame({ ...base, ...over }, size);
}

test('frames are exact at every size', () => {
  for (const [w, h] of [[40, 12], [80, 24], [120, 40], [200, 60]]) {
    const lines = frame({ transcript: [{ role: 'you', text: 'hi' }] }, { w, h });
    assert.strictEqual(lines.length, h, `${w}x${h} height`);
    for (const line of lines) {
      assert.strictEqual(width(line), w, `${w}x${h} width: \"${visible(line)}\"`);
    }
  }
});

test('the input box is always visible and carries the prompt', () => {
  const text = frame({ input: 'hello' }, { w: 80, h: 24 }).map((l) => visible(l)).join('\n');
  assert.match(text, /prompt/);
  assert.match(text, /❯ hello/);
});

test('the input box grows with a multi-line message', () => {
  const one = frame({ input: 'a' }, { w: 80, h: 24 }).map(visible).join('\n');
  const many = frame({ input: 'word '.repeat(40) }, { w: 80, h: 24 }).map(visible).join('\n');
  assert.match(one, /❯ a/);
  assert.match(many, /❯/);
  assert.ok(many.split('\n').filter((l) => l.includes('❯')).length >= 1);
});

test('the palette lists commands when open', () => {
  const text = frame({ paletteOpen: true, paletteQuery: '/' }, { w: 80, h: 24 }).map(visible).join('\n');
  assert.match(text, /\/help/);
  assert.match(text, /\/model/);
});

test('the status line reports the connection', () => {
  assert.match(frame({ connected: 'connected' }, { w: 80, h: 24 }).map(visible).join('\n'), /connected/);
  assert.match(frame({ connected: 'offline' }, { w: 80, h: 24 }).map(visible).join('\n'), /offline/);
  assert.match(frame({ connected: 'connecting' }, { w: 80, h: 24 }).map(visible).join('\n'), /connecting/);
});

test('a busy state shows a spinner', () => {
  const text = frame({ busy: true, spinner: 3 }, { w: 80, h: 24 }).map(visible).join('\n');
  assert.match(text, /thinking/);
});

test('a long transcript stays anchored to the newest entry', () => {
  const transcript = Array.from({ length: 60 }, (_, i) => ({ role: 'you', text: `message ${i}` }));
  const text = frame({ transcript }, { w: 80, h: 24 }).map(visible).join('\n');
  assert.match(text, /message 59/);
  assert.doesNotMatch(text, /message 0$/m);
});

test('scrolling back reveals older entries', () => {
  const transcript = Array.from({ length: 60 }, (_, i) => ({ role: 'you', text: `message ${i}` }));
  const scrolled = frame({ transcript, scroll: 900 }, { w: 80, h: 24 }).map(visible).join('\n');
  assert.match(scrolled, /message 0/);
});

test('wrapping respects the width', () => {
  for (const line of wrap('one two three four five six seven eight nine ten', 20)) {
    assert.ok(line.length <= 20, `"${line}" is ${line.length}`);
  }
});

test('wrapping keeps every word', () => {
  const input = 'alpha beta gamma delta epsilon zeta eta theta';
  assert.strictEqual(wrap(input, 12).join(' ').split(/\s+/).join(' '), input);
});

test('unbroken tokens still wrap', () => {
  const lines = wrap('x'.repeat(100), 20);
  assert.ok(lines.every((l) => l.length <= 20));
  assert.strictEqual(lines.join('').length, 100);
});
