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
│   │   ├── engine.go       # Core engine, parser, NL pipeline, history
│   │   ├── units.go         # Unit database + conversion
│   │   ├── functions.go     # Built-in math functions
│   │   └── variables.go     # Variable get/set/clear
│   ├── service/
│   │   └── app.go           # Wails-bound service methods (16 methods)
│   └── storage/
│       ├── db.go            # SQLite notes CRUD
│       ├── config.go        # config.toml parse/save
│       ├── exporter.go      # Export/import: .lv, .txt, .md, .json, .toml
│       └── fancyname.go     # Random name generator
├── frontend/
│   ├── src/
│   │   ├── App.ts           # Orchestrator (~335 lines)
│   │   ├── main.ts          # Entry point
│   │   ├── types.ts         # Shared interfaces
│   │   ├── style.css        # Tailwind + CSS custom properties
│   │   ├── stores/
│   │   │   ├── calculator.ts  # Reactive state store
│   │   │   └── notes.ts       # Note manager
│   │   ├── utils/
│   │   │   ├── html.ts       # escapeHtml()
│   │   │   ├── shortcuts.ts  # Keyboard shortcut handler
│   │   │   └── format.ts     # Result formatting helpers
│   │   └── components/
│   │       ├── TitleBar.ts
│   │       ├── CalculatorInput.ts
│   │       ├── ResultDisplay.ts
│   │       ├── NotesPanel.ts
│   │       ├── VariableExplorer.ts
│   │       ├── HistoryPanel.ts
│   │       ├── ContextMenu.ts
│   │       ├── ConfirmDialog.ts
│   │       └── ShortcutModal.ts
│   ├── wailsjs/             # Auto-generated bindings (do not edit)
│   └── index.html
├── docs/
│   ├── architecture.md      # Architecture overview
│   ├── api-reference.md     # Wails-bound method reference
│   ├── calculator-engine.md # How the calculation engine works
│   ├── frontend.md          # Frontend architecture guide
│   ├── development.md       # Development setup and workflow
│   ├── faq.md               # FAQ and troubleshooting
│   └── user-guide.md        # User-facing documentation
├── main.go                  # Entry point
├── wails.json               # Wails configuration
├── go.mod
└── package.json
```

## Code Standards

### Go

- Follow `gofmt` formatting
- No unused exports
- Inject dependencies via constructor (`NewEngine`, `NewAppService`)

### TypeScript

- Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- State management via `CalculatorStore` (subscriber pattern)
- All Wails calls wrapped in `async/await` + `try/catch`

### CSS

- Prefer Tailwind utility classes for layout/spacing
- Use CSS custom properties for theme colors
- No `dark:` variants — toggled via `.light` class on `<html>`

## Testing

```bash
go test ./...
```

## Build Configuration

Key flags:
- `-tags "webkit2_41"` — required on Ubuntu 26.04+ (webkit2gtk 4.1)
- `-ldflags` — customize via `wails.json` or CLI
