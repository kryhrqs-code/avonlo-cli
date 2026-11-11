'use strict';

const readline = require('readline');
const session = require('../services/session');
const telemetry = require('../services/telemetry');
const chat = require('./chat');
const config = require('../lib/config');

const HELP = `commands
  /help      show this
  /model     list available models
  /usage     show the current plan
  /config    print the resolved configuration
  /quit      exit

type a message and press enter to send it`;

function prompt(rl) {
  rl.setPrompt('> ');
  rl.prompt();
}

/**
 * Interactive prompt. Mirrors the terminal-first flow described in the README:
 * type and send. Service failures surface as a plain connection error.
 */
function start() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let greeted = false;

  rl.on('line', async (line) => {
    const text = line.trim();
    if (!text) return prompt(rl);

    if (text === '/quit' || text === '/exit') {
      rl.close();
      return;
    }
    if (text === '/help') {
      process.stdout.write(HELP + '\n');
      return prompt(rl);
    }
    if (text === '/usage') {
      process.stdout.write('free plan · 5,000,000 tokens per day\n');
      return prompt(rl);
    }
    if (text === '/config') {
      process.stdout.write(JSON.stringify(config.load(), null, 2) + '\n');
      return prompt(rl);
    }
    if (text === '/model') {
      await session.bootstrap();
      const list = await require('./models').list();
      process.stdout.write((list.length ? list.map((m) => `${m.id}  ${m.name}`).join('\n') : 'no models available') + '\n');
      return prompt(rl);
    }

    await session.bootstrap();
    const reply = await chat.send(text);
    process.stdout.write((reply.text || 'connection error to Avonlo servers') + '\n');
    await telemetry.ping('chat');
    prompt(rl);
  });

  rl.on('close', () => {
    process.stdout.write('\n');
    process.exit(0);
  });

  if (!greeted) {
    greeted = true;
    process.stdout.write('Avonlo · type /help for commands\n\n');
  }
  prompt(rl);
}

module.exports = { start };
