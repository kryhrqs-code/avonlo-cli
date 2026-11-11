'use strict';

const os = require('os');
const t = require('./theme');

/** Collapse the home directory so the folder line stays short. */
function tildify(dir) {
  const home = os.homedir();
  return dir && dir.startsWith(home) ? '~' + dir.slice(home.length) : dir || '~';
}

function formatTokens(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${Number.isInteger(n / 1_000_000) ? n / 1_000_000 : (n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function visibleLength(s) {
  return s.replace(/\u001b\[[0-9;]*m/g, '').length;
}

function pad(s, width) {
  const len = visibleLength(s);
  if (len > width) {
    // Trim visible characters only, keeping the escape sequences intact.
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
  return s + ' '.repeat(width - len);
}

/**
 * The welcome panel: a rounded box carrying the logo, version, folder, model and
 * plan. Same shape as the original terminal client.
 */
function renderBanner({
  version,
  folder = process.cwd(),
  model = 'avonlo-1',
  plan = 'Free',
  used = 0,
  limit = 5_000_000,
  width = 80,
} = {}) {
  const boxWidth = Math.max(34, Math.min(width - 1, 62));
  // │ + two spaces + body + two spaces + │  ==  body + 6
  const inner = boxWidth - 6;
  const line = (content) => `${t.border('│')}  ${pad(content, inner)}  ${t.border('│')}`;
  const row = (label, value) => line(`${t.muted(label.padEnd(8))}${value}`);

  const top = t.border('╭' + '─'.repeat(boxWidth - 2) + '╮');
  const bottom = t.border('╰' + '─'.repeat(boxWidth - 2) + '╯');

  return [
    top,
    line(`${t.accent(t.LOGO)} ${t.bold('Welcome to Avonlo')} ${t.muted('v' + version)}`),
    line(t.muted('Your free AI coding agent.')),
    line(''),
    row('folder', tildify(folder)),
    row('model', model),
    row('plan', `${plan} · ${formatTokens(used)} of ${formatTokens(limit)} tokens used today`),
    bottom,
  ];
}

function renderHint() {
  return (
    ' ' +
    t.muted('Ask Avonlo to build, fix or explain something. Type ') +
    t.accent('/') +
    t.muted(' for commands, ') +
    t.accent('/help') +
    t.muted(' for shortcuts.')
  );
}

/** One message block: a muted role label, then the body indented under it. */
function renderMessage(role, body, w = 80) {
  const label = role === 'you' ? t.user('You') : t.accent('Avonlo');
  const indent = '  ';
  const width = Math.max(20, w - indent.length);
  const wrapped = [];
  for (const paragraph of String(body).split('\n')) {
    if (!paragraph) { wrapped.push(''); continue; }
    let rest = paragraph;
    while (rest.length > width) {
      const cut = rest.lastIndexOf(' ', width);
      const at = cut > 0 ? cut : width;
      wrapped.push(rest.slice(0, at));
      rest = rest.slice(at).trimStart();
    }
    wrapped.push(rest);
  }
  return [label, ...wrapped.map((l) => indent + l), ''];
}

module.exports = { renderBanner, renderHint, renderMessage, tildify, formatTokens, visibleLength, pad };
