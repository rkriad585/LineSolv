# Development

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| [Go](https://go.dev) | 1.23+ | |
| [Wails CLI](https://wails.io) | v2.12.0+ | Install via `go install github.com/wailsapp/wails/v2/cmd/wails@latest` |
| [Node.js](https://nodejs.org) | 20+ | |
| npm | 10+ | |
| Linux: WebKit2GTK | 4.1+ | Ubuntu 24.10+, Fedora 40+, or Arch |
| Linux: GTK3 dev | | `libgtk-3-dev` on Debian/Ubuntu |

### Ubuntu / Debian

```bash
sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev
```

### Fedora

```bash
sudo dnf install gtk3-devel webkit2gtk4.1-devel
```

## Getting Started

```bash
git clone https://github.com/rkriad585/LineSolv.git
cd LineSolv
npm install
```

## Development Mode (HMR)

```bash
wails dev -tags "webkit2_41"
```

This starts the Wails dev server with Vite HMR. Changes to Go files trigger a rebuild; frontend changes are hot-reloaded.

## Production Build

```bash
wails build -tags "webkit2_41"
```

The binary is written to `build/bin/LineSolv`.

## Project Structure

```
LineSolv/
├── app/
│   ├── calculator/
│   │   └── engine.go      # Arithmetic engine, parser, units, NL pipeline
│   ├── plugin/
│   │   ├── runtime.go      # Goja JS VM, numi API bindings
│   │   └── loader.go       # Recursive .js file loader
│   └── service/
│       └── app.go          # Wails-bound service methods
├── frontend/
│   ├── src/
│   │   ├── App.ts          # Orchestrator
│   │   ├── main.ts         # Entry point
│   │   ├── types.ts        # Shared interfaces
│   │   ├── style.css       # Tailwind + CSS custom properties
│   │   └── components/     # UI components
│   │       ├── TitleBar.ts
│   │       ├── CalculatorInput.ts
│   │       ├── ResultDisplay.ts
│   │       ├── NotesPanel.ts
│   │       └── VariableExplorer.ts
│   ├── wailsjs/            # Auto-generated bindings (do not edit)
│   └── index.html
├── plugins/                # JavaScript plugin files
│   ├── sample.js
│   └── CommunityExtensions/ # 16 community extension plugins
├── main.go                 # Entry point
├── wails.json              # Wails configuration
├── go.mod
└── package.json
```

## Code Standards

### Go

- Follow `gofmt` formatting
- No unused exports
- Inject dependencies via constructor (`NewEngine`, `NewAppService`)
- Methods bound to Wails must return `(T, error)`

### TypeScript

- Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- No external state libraries — use module-level variables
- All Wails calls wrapped in `async/await` + `try/catch`

### CSS

- Prefer Tailwind utility classes for layout/spacing
- Use CSS custom properties for theme colors
- No `dark:` variants — toggled via `.light` class on `<html>`

## Testing

```bash
go test ./...
```

Tests exist in `app/calculator/` and `app/plugin/`. Frontend testing is not yet set up.

## Adding Plugins

Drop a `.js` file into `plugins/`. See [plugin-system.md](plugin-system.md) for the API.

## Build Configuration

Key flags:
- `-tags "webkit2_41"` — required on Ubuntu 26.04+ (webkit2gtk 4.1)
- `-ldflags` — customize via `wails.json` or CLI
