'use strict';

const readline = require('readline');
const session = require('../services/session');
const telemetry = require('../services/telemetry');
const chat = require('./chat');
const models = require('./models');
const config = require('../lib/config');
const t = require('../ui/theme');
const { renderBanner, renderHint, renderMessage } = require('../ui/banner');
const pkg = require('../../package.json');

const HELP = `
${t.bold('commands')}
  /help      show this
  /model     list available models
  /usage     show today's plan and usage
  /config    print the resolved configuration
  /clear     clear the screen
  /quit      exit

${t.bold('keys')}
  ctrl+c     leave
`;

const width = () => Math.max(40, process.stdout.columns || 80);

function write(line = '') {
  process.stdout.write(line + '\n');
}

function prompt(rl) {
  rl.setPrompt(t.accent('❯ '));
  rl.prompt();
}

/**
 * Interactive prompt. The connection is established on start, not on the first
 * message, so the session is ready before anyone types anything.
 */
function start(options = {}) {
  const cfg = config.load();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let connected = null;

  write();
  for (const line of renderBanner({ version: pkg.version, folder: process.cwd(), width: width() })) write(line);
  write();
  write(renderHint());
  write();

  // Connect immediately. A failure is silent until the user asks something.
  session.bootstrap().then((ok) => {
    connected = ok;
    if (!ok && !options.quiet) {
      write(t.muted('  not connected to the Avonlo service · messages will report a connection error'));
      write();
    }
    prompt(rl);
  });

  rl.on('line', async (line) => {
    const text = line.trim();
    if (!text) return prompt(rl);

    if (text === '/quit' || text === '/exit') return rl.close();

    if (text === '/help') {
      write(HELP);
      return prompt(rl);
    }

    if (text === '/clear') {
      process.stdout.write('\u001b[2J\u001b[H');
      for (const l of renderBanner({ version: pkg.version, folder: process.cwd(), width: width() })) write(l);
      write();
      return prompt(rl);
    }

    if (text === '/usage') {
      write(`  Free plan · ${t.muted('5M tokens a day, resets at midnight')}`);
      write();
      return prompt(rl);
    }

    if (text === '/config') {
      write(JSON.stringify(cfg, null, 2));
      write();
      return prompt(rl);
    }

    if (text === '/model') {
      if (connected === null) await session.bootstrap();
      const list = await models.list();
      if (!list.length) write(t.muted('  no models available'));
      else for (const m of list) write(`  ${m.id.padEnd(16)} ${m.name}${m.description ? t.muted(' — ' + m.description) : ''}`);
      write();
      return prompt(rl);
    }

    for (const l of renderMessage('you', text, width())) write(l);

    if (connected === null) connected = await session.bootstrap();
    const reply = await chat.send(text);
    for (const l of renderMessage('avonlo', reply.ok ? reply.text : t.error(reply.text || 'connection error to Avonlo servers'), width())) write(l);

    await telemetry.ping('chat');
    prompt(rl);
  });

  rl.on('close', () => {
    write();
    process.exit(0);
  });
}

module.exports = { start };
