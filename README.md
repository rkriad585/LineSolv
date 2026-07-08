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

## Quick Start

### Download

Grab the latest release for your platform from the [releases page](https://github.com/rkriad585/LineSolv/releases).

| Platform | Package |
|---|---|
| Linux | `.deb` (Debian/Ubuntu) or standalone binary |
| macOS | `.dmg` (Intel & Apple Silicon) |
| Windows | `.exe` (NSIS installer) |

### Install

**Linux (Debian/Ubuntu)**

```bash
sudo dpkg -i linesolv-*.deb
linesolv
```

Or run the standalone binary:

```bash
chmod +x LineSolv
./LineSolv
```

**macOS**

Mount the `.dmg` and drag LineSolv into Applications. You may need to right-click -> Open to bypass Gatekeeper on first launch.

**Windows**

Run the NSIS installer. LineSolv will be available from the Start menu.

### Uninstall

**Linux (deb)**

```bash
sudo dpkg -r linesolv
```

To also remove user data:

```bash
rm -rf ~/.config/neostore/linesolv
```

**macOS**

```bash
rm -rf /Applications/LineSolv.app
rm -rf ~/.config/neostore/linesolv
```

**Windows**

Uninstall via Settings > Apps, then delete `%APPDATA%/neostore/linesolv` to remove user data.

### Requirements

- **Linux**: WebKit2GTK 4.1+ (Ubuntu 24.10+, Fedora 40+, Arch)
- **macOS**: macOS 12+
- **Windows**: Windows 10+

## Features

- **Natural Language Input** — type `twenty five times pi`, `add 5 plus 3`, `as = 10 * 5`
- **Unit Conversion** — `10 inches in cm`, `5 kg in lb`, `100 USD in EUR`, `celsius to fahrenheit`
- **Variables** — `x = 42`, then reference `x` on later lines
- **Built-in Functions** — `sin`, `cos`, `sqrt`, `log`, `round`, and more
- **Percentage Math** — `10% of 200`, `100 + 15%`
- **Context Awareness** — `of that`, `then`, `result` reference the previous line
- **Computation History** — navigate with `Ctrl/Cmd+↑` / `Ctrl/Cmd+↓`
- **7 Color Themes** — Dark, Light, Neon, Red, Obsidian, Plasma, Blood — choose in Settings
- **Multiple Notes** — create, rename, delete, export, import calculation notebooks
- **Keyboard Shortcuts** — full shortcut reference available via `Ctrl/Cmd+/`
- **Configurable Font** — font family and size adjustable in Settings
- **Customizable Shortcuts** — rebind any keyboard shortcut in Settings
- **Print Notes** — print calculations with A4 formatting, note name header, watermark, and date via the print button or `Ctrl/Cmd+P`
- **Notepad-Style UI** — free-form textarea with live results column, loading indicators
- **Delete Confirmation** — optional "Don't ask again" preference stored in config.toml

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

Type calculations naturally. `Shift+Enter` force-evaluates immediately. `Esc` clears input or closes sidebars. `Ctrl/Cmd+↑` / `Ctrl/Cmd+↓` navigates history.

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

## Documentation

| Guide | Description |
|---|---|
| [User Guide](docs/user-guide.md) | Full user documentation with input syntax, themes, shortcuts, and notes |
| [FAQ & Troubleshooting](docs/faq.md) | Frequently asked questions and common issues |
| [Architecture](docs/architecture.md) | High-level architecture and component overview |
| [Frontend](docs/frontend.md) | Frontend component structure and styling guide |
| [Development](docs/development.md) | Development setup, build, and code standards |
| [API Reference](docs/api-reference.md) | Wails-bound Go method reference |
| [Calculator Engine](docs/calculator-engine.md) | How the natural-language calculation engine works |

## License

[MIT](LICENSE) — LineSolv (c) 2026 rkriad585.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
