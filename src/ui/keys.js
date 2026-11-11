'use strict';

/**
 * Pure key mapping for the prompt. Raw bytes in, an intent out. The IO shell
 * applies the intent, so the mapping is testable without a TTY.
 */
function keyAction(state, raw) {
  if (raw === '\u0003') return { type: 'quit' };
  if (raw === '\u000c') return { type: 'redraw' };

  if (state.busy) return null;

  if (raw === '\r' || raw === '\n') return { type: 'submit' };

  if (raw === '\u001b') {
    if (state.paletteOpen) return { type: 'palette:close' };
    if (state.input) return { type: 'input:clear' };
    return null;
  }

  if (raw === '\u001b[A') {
    if (state.paletteOpen) return { type: 'palette:move', delta: -1 };
    return { type: 'history:prev' };
  }
  if (raw === '\u001b[B') {
    if (state.paletteOpen) return { type: 'palette:move', delta: 1 };
    return { type: 'history:next' };
  }
  if (raw === '\u001b[C') return { type: 'cursor:delta', delta: 1 };
  if (raw === '\u001b[D') return { type: 'cursor:delta', delta: -1 };
  if (raw === '\u001b[5~') return { type: 'scroll', delta: 5 };
  if (raw === '\u001b[6~') return { type: 'scroll', delta: -5 };

  if (raw === '\t') {
    if (state.paletteOpen) return { type: 'palette:complete' };
    return null;
  }

  if (raw === '\u007f' || raw === '\b') return { type: 'input:backspace' };
  if (raw < ' ') return null;

  return { type: 'input:insert', text: raw };
}

/** Which palette entries match the current query. */
function paletteHits(commands, query) {
  const q = String(query || '').replace(/^\//, '').toLowerCase();
  if (!q) return commands;
  return commands.filter((c) => c.name.includes(q));
}

module.exports = { keyAction, paletteHits };
