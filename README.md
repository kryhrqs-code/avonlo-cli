<p align="center">
  <img src="assets/logo.svg" width="120" alt="Avonlo">
</p>

<h1 align="center">Avonlo CLI</h1>

<p align="center">
  <strong>Free AI coding agent for your terminal.</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#usage">Usage</a> •
  <a href="#pricing">Pricing</a>
</p>

---

## Quick Start

```bash
# Clone and run
git clone https://github.com/kryhrqs-code/avonlo-cli.git
cd avonlo-cli
npm install
npm start
```

Then type `avonlo` in any folder and that's it. Start chatting with AI about your code.

---

## About

Avonlo is a free, open-source AI coding assistant that runs in your terminal. Get intelligent code suggestions, refactoring help, and project-aware conversations without paying for expensive API subscriptions. Since we do show a small ad on each thinking cycle of the AI we're able to give a more generous amount of free daily tokens.

### Availability

| Platform | Status |
|----------|--------|
| **Terminal CLI** | Available now |
| **Desktop App** | Coming soon |
| **VS Code Extension** | Coming soon |

## Features

### Terminal-First Design
Type `avonlo` in any project folder and start chatting. A native terminal experience with streaming responses, syntax highlighting, and full keyboard navigation.

### Context-Aware AI
Avonlo understands your project structure, installed tools, and development environment. It reads your codebase to give relevant suggestions instead of generic answers.

### Multi-Model Support
We currently support **DeepSeek** and **Qwen** models. Use `/model` to switch between them or set a default in your config.

### Cross-Platform Sync
Your sessions, preferences, and environment settings sync across devices. Start a conversation on your laptop, continue on your desktop.

### Works With Your Stack
Avonlo detects your toolchain and adapts. Whether you're building React apps, writing Rust, deploying to AWS, working with Docker and Kubernetes, or building Web3 dApps with Foundry and Hardhat, Avonlo understands your context and gives relevant help.

### Shell Integration
Tab completion for Avonlo commands in bash, zsh, and fish. The optional shell hook provides context-aware suggestions based on your current directory.

## Usage

```bash
# Start an interactive chat about the current folder
avonlo

# Chat about a specific project
avonlo ~/code/my-app

# Quick one-off question (great for pipes)
avonlo chat "what does this error mean?"

# Pipe input for analysis
git diff | avonlo chat "review this"
cat logs.txt | avonlo chat "find the errors"
```

### Commands

| Command | Description |
|---------|-------------|
| `avonlo` | Open the interactive prompt |
| `avonlo chat "<message>"` | Send one message and print the reply |
| `avonlo models` | List available models |
| `avonlo login` | Establish or refresh the session |
| `avonlo config` | View settings |
| `avonlo version` | Print the version |
| `/help` | Show all commands |
| `/model` | Switch AI model |
| `/usage` | Check token usage |
| `/config` | View settings |
| `/quit` | Exit |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Ctrl+C` | Stop streaming / Exit |
| `Up/Down` | Message history |
| `Tab` | Complete command |
| `Ctrl+L` | Clear screen |

## Pricing

Avonlo is free to use.

| Plan | Price | Daily Tokens |
|------|-------|--------------|
| **Free** | $0 | 5M |
| **Plus** | $15/mo | 100M |
| **Unlimited** | $35/mo | Unlimited |

All plans include full access to all AI models, cross-device sync, and shell integrations.

## Configuration

Settings are stored in your config folder:

- **Linux/macOS:** `~/.config/avonlo/`
- **Windows:** `%APPDATA%\Avonlo\`

```bash
avonlo config          # View current settings
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `AVONLO_API_URL` | Service endpoint |
| `AVONLO_TIMEOUT_MS` | Request timeout in milliseconds |
| `AVONLO_RETRIES` | Retry count for failed requests |
| `AVONLO_NO_TELEMETRY` | Set to `1` to disable the usage ping |

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with frustration at paying $200/month for AI coding tools.
</p>
