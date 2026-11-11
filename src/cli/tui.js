'use strict';

const session = require('../services/session');
const chat = require('../commands/chat');
const models = require('../commands/models');
const config = require('../lib/config');
const telemetry = require('../services/telemetry');
const { renderFrame } = require('../ui/screen');
const { keyAction, paletteHits } = require('../ui/keys');
const { renderBanner } = require('../ui/banner');
const t = require('../ui/theme');
const pkg = require('../../package.json');

const COMMANDS = [
  { name: '/help', help: 'show commands and keys' },
  { name: '/model', help: 'list available models' },
  { name: '/usage', help: "today's plan and usage" },
  { name: '/config', help: 'resolved configuration' },
  { name: '/clear', help: 'clear the transcript' },
  { name: '/quit', help: 'leave' },
];

/**
 * One message through the state machine. Draws and network calls are injected,
 * so the whole path is testable without a TTY.
 */
async function submitText(state, rawInput, deps) {
  const text = String(rawInput || '').trim();
  if (!text) return false;

  state.input = '';
  state.cursor = 0;
  state.paletteOpen = false;
  state.scroll = 0;

  if (text.startsWith('/')) {
    deps.handleSlash(text);
    deps.draw();
    return true;
  }

  deps.history.push(text);
  deps.onHistory(-1);
  state.transcript.push({ role: 'you', text });
  state.busy = true;
  deps.draw();

  if (state.connected !== 'connected') {
    state.connected = (await deps.bootstrap()) ? 'connected' : 'offline';
  }

  const reply = await deps.send(text);
  state.transcript.push({ role: 'avonlo', text: reply && reply.text ? reply.text : 'connection error to Avonlo servers' });
  state.busy = false;
  await deps.ping('chat');
  deps.draw();
  return true;
}

function createState(extra = {}) {
  return {
    version: pkg.version,
    folder: require('../ui/banner').tildify(process.cwd()),
    plan: 'Free',
    model: 'avonlo-1',
    connected: 'connecting',
    transcript: [],
    input: '',
    cursor: 0,
    busy: false,
    spinner: 0,
    paletteOpen: false,
    paletteIndex: 0,
    paletteQuery: '',
    commands: COMMANDS,
    scroll: 0,
    greeting: '',
    ...extra,
  };
}

function start(options = {}) {
  const out = process.stdout;
  const size = () => ({ w: out.columns || 80, h: out.rows || 24 });
  const state = createState();
  const history = [];
  let historyIndex = -1;
  let running = true;
  let timer = null;

  const banner = renderBanner({ version: pkg.version, folder: process.cwd(), width: size().w });
  state.transcript.push({ role: 'banner', lines: banner });
  state.transcript.push({ role: 'system', text: 'Ask Avonlo to build, fix or explain something. Type / for commands.' });

  function draw() {
    const frame = renderFrame(state, size());
    out.write('\u001b[H' + frame.map((l) => l + '\u001b[K').join('\r\n'));
  }

  function enter() {
    out.write('\u001b[?1049h\u001b[?25l\u001b[2J');
  }

  function leave() {
    out.write('\u001b[?25h\u001b[?1049l');
  }

  function stop(code = 0) {
    if (!running) return;
    running = false;
    clearInterval(timer);
    leave();
    process.exit(code);
  }

  function pushSystem(text) {
    state.transcript.push({ role: 'system', text });
    state.scroll = 0;
  }

  function handleSlash(text) {
    const cmd = text.trim();
    if (cmd === '/quit' || cmd === '/exit') return stop(0);
    if (cmd === '/clear') {
      state.transcript = [];
      return;
    }
    if (cmd === '/help') {
      pushSystem(
        'commands  ' + COMMANDS.map((c) => c.name.replace('/', '')).join('  ') +
        '\nkeys      enter send · / commands · ↑↓ history · esc cancel · ctrl+c quit',
      );
      return;
    }
    if (cmd === '/usage') {
      pushSystem('Free plan · 5M tokens a day, resets at midnight');
      return;
    }
    if (cmd === '/config') {
      pushSystem(JSON.stringify(config.load(), null, 2));
      return;
    }
    if (cmd === '/model') {
      models.list().then((list) => {
        pushSystem(list.length ? list.map((m) => `${m.id}  ${m.name}`).join('\n') : 'no models available');
        draw();
      });
      return;
    }
    pushSystem(`unknown command: ${cmd}`);
  }

  async function submit() {
    await submitText(state, state.input, {
      draw,
      history,
      pushSystem,
      onHistory: (value) => { historyIndex = value; },
      bootstrap: session.bootstrap,
      send: chat.send,
      ping: telemetry.ping,
      handleSlash,
    });
    state.input = '';
    state.cursor = 0;
    state.paletteOpen = false;
    state.scroll = 0;
    draw();
  }

  function apply(intent) {
    switch (intent.type) {
      case 'quit': return stop(0);
      case 'redraw': out.write('\u001b[2J'); return draw();
      case 'submit': submit(); return;
      case 'palette:close': state.paletteOpen = false; state.paletteQuery = ''; return draw();
      case 'palette:move':
        state.paletteIndex = Math.max(0, state.paletteIndex + intent.delta);
        return draw();
      case 'palette:complete': {
        const pick = paletteHits(COMMANDS, state.paletteQuery)[state.paletteIndex];
        if (pick) { state.input = pick.name + ' '; state.cursor = state.input.length; state.paletteOpen = false; }
        return draw();
      }
      case 'input:clear': state.input = ''; state.cursor = 0; return draw();
      case 'input:backspace':
        if (state.cursor > 0) {
          state.input = state.input.slice(0, state.cursor - 1) + state.input.slice(state.cursor);
          state.cursor -= 1;
          syncPalette();
          draw();
        }
        return;
      case 'input:insert':
        state.input = state.input.slice(0, state.cursor) + intent.text + state.input.slice(state.cursor);
        state.cursor += intent.text.length;
        syncPalette();
        return draw();
      case 'cursor:delta':
        state.cursor = Math.max(0, Math.min(state.input.length, state.cursor + intent.delta));
        return draw();
      case 'scroll':
        state.scroll = Math.max(0, state.scroll + intent.delta);
        return draw();
      case 'history:prev':
        if (!history.length) return;
        historyIndex = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
        state.input = history[historyIndex] || '';
        state.cursor = state.input.length;
        syncPalette();
        return draw();
      case 'history:next':
        if (historyIndex < 0) return;
        if (historyIndex < history.length - 1) {
          historyIndex += 1;
          state.input = history[historyIndex] || '';
        } else {
          historyIndex = -1;
          state.input = '';
        }
        state.cursor = state.input.length;
        syncPalette();
        return draw();
      default: return;
    }
  }

  function syncPalette() {
    const v = state.input;
    const open = v.startsWith('/') && !v.includes(' ');
    state.paletteOpen = open;
    state.paletteQuery = open ? v : '';
    if (open) {
      const hits = paletteHits(COMMANDS, v);
      state.paletteIndex = Math.min(state.paletteIndex, Math.max(0, hits.length - 1));
    }
  }

  function onKey(buf) {
    // A bug in the prompt must never leave the terminal in the alt screen.
    try {
      const intent = keyAction(state, buf.toString('utf8'));
      if (intent) apply(intent);
    } catch (e) {
      leave();
      process.stderr.write(`\nterminal error: ${e && e.stack ? e.stack : e}\n`);
      process.exit(1);
    }
  }

  enter();
  timer = setInterval(() => {
    if (state.busy) { state.spinner += 1; draw(); }
  }, 90);
  timer.unref?.();

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', onKey);
  process.stdin.on('end', () => stop(0));
  out.on('resize', () => { out.write('\u001b[2J'); draw(); });
  process.on('SIGTERM', () => stop(0));
  process.on('SIGINT', () => stop(0));

  draw();

  // Connect immediately, as the prompt opens.
  session.bootstrap().then((ok) => {
    state.connected = ok ? 'connected' : 'offline';
    draw();
  });

  return { state, draw };
}

module.exports = { start, createState, COMMANDS, submitText };
