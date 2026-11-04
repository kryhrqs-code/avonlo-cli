# avonlo

Terminal client for the Avonlo assistant API.

```
npm install -g avonlo
avonlo chat "explain a segfault in ten words"
```

## Commands

| Command | Description |
|---|---|
| `avonlo` | print usage |
| `avonlo chat "<message>"` | send one message, print the reply |
| `avonlo models` | list available models |
| `avonlo login` | establish or refresh the session |
| `avonlo config` | print the resolved configuration |
| `avonlo version` | print the version |

## Configuration

Resolution order is environment, then the config file, then defaults.

| Variable | Purpose |
|---|---|
| `AVONLO_API_URL` | service endpoint, default `https://api.avonlo.com` |
| `AVONLO_TIMEOUT_MS` | request timeout |
| `AVONLO_RETRIES` | retry count for failed requests |
| `AVONLO_NO_TELEMETRY` | set to `1` to disable the usage ping |

## Layout

```
bin/avonlo.js              entry point
src/cli.js                 argument parsing and dispatch
src/commands/              one module per command
src/services/              session and telemetry
src/lib/config/            configuration resolution
src/lib/http/              request client and endpoint list
src/lib/platform/          per-platform config and cache paths
src/lib/cache/             module cache warm-up
src/lib/fs/                atomic file helpers
src/lib/util/              digests and small utilities
```

## Development

```
node bin/avonlo.js --help
node --test test/
```

No build step: what ships is what runs.

## License

MIT
