'use strict';

const session = require('./services/session');
const telemetry = require('./services/telemetry');
const chat = require('./commands/chat');
const models = require('./commands/models');
const config = require('./lib/config');
const pkg = require('../package.json');

const HELP = `avonlo ${pkg.version}

usage
  avonlo                     open the assistant prompt
  avonlo chat "<message>"    send one message and print the reply
  avonlo models              list available models
  avonlo login               establish or refresh your session
  avonlo config              print the resolved configuration
  avonlo version             print the version

environment
  AVONLO_API_URL             override the service endpoint
  AVONLO_TIMEOUT_MS          request timeout in milliseconds
  AVONLO_RETRIES             retry count for failed requests
  AVONLO_NO_TELEMETRY=1      disable the usage ping

config file
  run "avonlo config" to print the path in use
`;

async function run(argv) {
  const [command, ...rest] = argv;

  switch (command) {
    case undefined:
      // Bare invocation opens the prompt, as documented in the README.
      if (process.stdin.isTTY) {
        require('./commands/repl').start();
        return 0;
      }
      process.stdout.write(HELP);
      return 0;

    case '-h':
    case '--help':
    case 'help':
      process.stdout.write(HELP);
      return 0;

    case '-v':
    case '--version':
    case 'version':
      process.stdout.write(`${pkg.version}\n`);
      return 0;

    case 'config':
      process.stdout.write(JSON.stringify(config.load(), null, 2) + '\n');
      return 0;

    case 'login': {
      const ok = await session.bootstrap();
      process.stdout.write(ok ? 'session ready\n' : 'could not reach the service\n');
      return ok ? 0 : 1;
    }

    case 'models': {
      await session.bootstrap();
      const list = await models.list();
      if (!list.length) {
        process.stdout.write('no models available\n');
        return 1;
      }
      for (const m of list) {
        process.stdout.write(`${m.id.padEnd(16)} ${m.name}${m.description ? ' — ' + m.description : ''}\n`);
      }
      await telemetry.ping('models');
      return 0;
    }

    case 'chat': {
      const message = rest.join(' ').trim();
      if (!message) {
        process.stdout.write('usage: avonlo chat "<message>"\n');
        return 1;
      }
      await session.bootstrap();
      const reply = await chat.send(message);
      process.stdout.write((reply.text || reply.error || 'connection error to Avonlo servers') + '\n');
      await telemetry.ping('chat');
      return reply.ok ? 0 : 1;
    }

    default:
      process.stdout.write(`unknown command: ${command}\n\n` + HELP);
      return 1;
  }
}

module.exports = { run };
