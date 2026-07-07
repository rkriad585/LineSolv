<p align="center">
  <img src="logo.svg" alt="LineSolv" width="128" height="128">
  <h1 align="center">LineSolv</h1>
  <p align="center">A cross-platform desktop natural-language calculator</p>
  <p align="center">
    <a href="https://github.com/rkriad585/LineSolv/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License">
    </a>
    <img src="https://img.shields.io/badge/platform-linux%20|%20macOS%20|%20windows-lightgrey" alt="Platform">
  </p>
</p>

## Overview

LineSolv is a natural-language calculator that understands phrases like `$20 in euro - 5% discount` or `what is the just plus five`. It combines a powerful Go-based arithmetic engine with a clean, distraction-free desktop UI.

Built with **Wails v2** (Go + WebView), **Vite**, **Tailwind CSS v4**, and **TypeScript**.

## Features

- **Natural Language Input** — type `twenty five times pi`, `add 5 plus 3`, `as = 10 * 5`
- **Unit Conversion** — `10 inches in cm`, `5 kg in lb`, `100 USD in EUR`, `celsius to fahrenheit`
- **Variables** — `x = 42`, then reference `x` on later lines
- **Built-in Functions** — `sin`, `cos`, `sqrt`, `log`, `round`, and more
- **Percentage Math** — `10% of 200`, `100 + 15%`
- **Context Awareness** — `of that`, `then`, `result` reference the previous line
- **Computation History** — navigate with `Cmd+↑` / `Cmd+↓`
- **Dark / Light Theme** — toggle with one click
- **Keyboard Shortcuts** — `⌘N` new note, `⌘B` / `⌘I` toggle sidebars, `⌘K` clear all, `Shift+Enter` force evaluate, `Esc` clear / close panels
- **Notepad-Style UI** — free-form textarea with live results column, loading indicators

## Installation

### Linux

Download the latest binary from the [releases page](https://github.com/rkriad585/LineSolv/releases).

```bash
chmod +x LineSolv
./LineSolv
```

Requirements: WebKitGTK 4.1 (Ubuntu 26.04+ ships this by default).

### macOS

Download the latest `.dmg` for your architecture (Intel or Apple Silicon) from the [releases page](https://github.com/rkriad585/LineSolv/releases).

> **Note:** macOS binaries are unsigned — you may need to right-click → Open to bypass Gatekeeper.

### Windows

Download the latest `.exe` (NSIS installer) from the [releases page](https://github.com/rkriad585/LineSolv/releases).

## Building from Source

### Prerequisites

- [Go](https://go.dev) 1.23+
- [Wails CLI](https://wails.io) v2.12.0+
- [Node.js](https://nodejs.org) 20+
- Linux: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`

### Steps

```bash
git clone https://github.com/rkriad585/LineSolv.git
cd LineSolv
wails build -tags "webkit2_41"
./build/bin/LineSolv
```

### Development (HMR)

```bash
wails dev -tags "webkit2_41"
```

## Usage

Type calculations naturally. `Shift+Enter` force-evaluates immediately. `Esc` clears input or closes sidebars. `Cmd+↑` / `Cmd+↓` navigates history.

| Input | Output |
|---|---|
| `42` | `42` |
| `twenty five plus 3` | `28` |
| `x = 10` | `x = 10` |
| `x times pi` | `31.4159` |
| `10 inches in cm` | `25.4 cm` |
| `100 + 15%` | `115` |

## Architecture

```
LineSolv/
├── app/
│   ├── calculator/    # Arithmetic engine (engine.go, units.go, functions.go, variables.go)
│   └── service/       # Wails-bound Go methods
├── frontend/
│   └── src/
│       ├── components/  # UI components (TitleBar, CalculatorInput, etc.)
│       ├── stores/      # Reactive state store
│       ├── App.ts       # Orchestrator
│       └── style.css    # Tailwind v4 + CSS custom properties
└── main.go            # Entrypoint
```

## License

[MIT](LICENSE) — LineSolv (c) 2026 rkriad585.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
