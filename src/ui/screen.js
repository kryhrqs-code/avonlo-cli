'use strict';

const t = require('./theme');

const ANSI = /\u001b\[[0-9;]*m/g;
/** Strip colour, and measure what is left. Two different jobs, two names. */
const visible = (s) => String(s).replace(ANSI, '');
const vlen = (s) => visible(s).length;

function trunc(s, width) {
  if (width <= 0) return '';
  if (vlen(s) <= width) return s;
  let out = '';
  let shown = 0;
  for (let i = 0; i < s.length && shown < width - 1; ) {
    if (s[i] === '\u001b') {
      const end = s.indexOf('m', i);
      if (end === -1) break;
      out += s.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    out += s[i++];
    shown += 1;
  }
  return out + '…';
}

function pad(s, width) {
  const len = vlen(s);
  return len >= width ? trunc(s, width) : s + ' '.repeat(width - len);
}

/** Hard-wrap on words, falling back to character breaks for long tokens. */
function wrap(text, width) {
  const out = [];
  for (const raw of String(text).split('\n')) {
    if (!raw) { out.push(''); continue; }
    let rest = raw;
    while (rest.length > width) {
      let cut = rest.lastIndexOf(' ', width);
      if (cut <= 0) cut = width;
      out.push(rest.slice(0, cut));
      rest = rest.slice(cut).replace(/^ +/, '');
    }
    out.push(rest);
  }
  return out;
}

function boxTop(width, label) {
  const inner = width - 2;
  if (!label) return t.border('╭' + '─'.repeat(inner) + '╮');
  const text = ` ${label} `;
  const room = Math.max(0, inner - vlen(text));
  return t.border('╭' + '─' + text + '─'.repeat(Math.max(0, room - 1)) + '╮');
}

function boxBottom(width) {
  return t.border('╰' + '─'.repeat(width - 2) + '╯');
}

function boxLine(content, width) {
  return t.border('│') + pad(content, width - 2) + t.border('│');
}

function header(state, width) {
  const left = ` ${t.accent(t.LOGO)} ${t.bold('Avonlo')} ${t.muted('v' + state.version)}`;
  const full = `${t.muted(state.folder)} ${t.muted('·')} ${t.accent(state.plan.toLowerCase())} `;
  const short = `${t.muted(state.folder)} `;
  const inner = width - 2;
  const right = vlen(left) + vlen(full) + 2 <= inner ? full : short;
  const gap = Math.max(1, inner - vlen(left) - vlen(right));
  return t.border('╭' + '─'.repeat(width - 2) + '╮') + '\n' +
    boxLine(left + ' '.repeat(gap) + right, width) + '\n' +
    boxBottom(width);
}

function statusDot(state) {
  if (state.connected === 'connected') return t.accent('●');
  if (state.connected === 'offline') return t.error('●');
  return t.muted('○');
}

/** Turns the transcript into plain rendered lines. */
function transcriptLines(state, width) {
  const lines = [];
  for (const entry of state.transcript) {
    if (entry.role === 'banner') {
      // Rendered exactly as composed: no extra indent, no re-wrapping.
      for (const l of entry.lines) lines.push(l);
      lines.push('');
      continue;
    }
    if (entry.role === 'system') {
      lines.push(' ' + t.muted(entry.text));
      lines.push('');
      continue;
    }
    const label = entry.role === 'you' ? t.user('You') : t.accent('Avonlo');
    lines.push(' ' + label);
    const body = entry.role === 'you' ? entry.text : entry.text;
    for (const l of wrap(body, width - 4)) lines.push('   ' + (entry.role === 'you' ? l : l));
    lines.push('');
  }
  return lines;
}

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function paletteLines(state, width, max) {
  const { paletteHits } = require('./keys');
  const all = state.commands || [];
  const hits = paletteHits(all, state.paletteQuery);
  if (!hits.length) return null;
  const shown = hits.slice(0, max);
  const idx = Math.min(state.paletteIndex, shown.length - 1);
  const out = [];
  shown.forEach((c, i) => {
    const row = ` ${c.name.padEnd(12)}${t.muted(c.help)}`;
    out.push(i === idx ? t.accent(pad(row, width)) : pad(row, width));
  });
  return out;
}

/**
 * Full frame. Always exactly `h` lines, each exactly `w` visible columns.
 *
 * Layout: header box (3), blank (1), transcript (flexible), palette when open,
 * input box (3..7), hint line (1).
 */
function renderFrame(state, size) {
  const w = Math.max(40, size.w | 0);
  const h = Math.max(12, size.h | 0);

  const headerLines = header(state, w).split('\n');
  const inputBody = wrap(state.input || '', w - 6).slice(0, 5);
  if (!inputBody.length) inputBody.push('');
  const inputBox = [boxTop(w, 'prompt'), ...inputBody.map((l) => boxLine(` ${t.accent('❯')} ${l}`, w)), boxBottom(w)];
  const palette = state.paletteOpen ? paletteLines(state, w, 8) : null;

  const keys = ['⏎ send', '/ commands', '↑↓', 'ctrl+c'];
  const hint = ' ' + keys.join(t.muted(' · ')) + '   ' + statusDot(state) + ' ' +
    t.muted(state.connected === 'connected' ? 'connected' : state.connected === 'offline' ? 'offline' : 'connecting');

  const fixed = headerLines.length + 1 + (palette ? palette.length + 1 : 0) + inputBox.length + 1;
  const bodyHeight = Math.max(1, h - fixed);

  const all = transcriptLines(state, w);
  if (state.busy) {
    all.push(' ' + t.accent(SPINNER[state.spinner % SPINNER.length]) + ' ' + t.muted('thinking…'));
    all.push('');
  }
  if (!all.length) {
    for (const l of wrap(state.greeting || '', w - 4)) all.push(' ' + t.muted(l));
    all.push('');
  }

  const total = all.length;
  const offset = Math.max(0, Math.min(state.scroll, Math.max(0, total - bodyHeight)));
  const start = Math.max(0, total - bodyHeight - offset);
  const view = all.slice(start, start + bodyHeight);
  // Content starts at the top and grows down; the input box stays pinned.
  while (view.length < bodyHeight) view.push('');

  const lines = [
    ...headerLines,
    '',
    ...view.map((l) => pad(trunc(l, w), w)),
    ...(palette ? [...palette, ''] : []),
    ...inputBox,
    pad(hint, w),
  ];

  while (lines.length < h) lines.push(' '.repeat(w));
  return lines.slice(0, h).map((l) => pad(l, w));
}

module.exports = {
  renderFrame, wrap, trunc, pad, visible, width: vlen, boxTop, boxBottom, boxLine, SPINNER,
};
