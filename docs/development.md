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
│   │   ├── engine.go           # Core engine, parser, NL pipeline, history
│   │   ├── units.go            # Unit database + conversion
│   │   ├── functions.go        # Built-in math functions
│   │   ├── variables.go        # Variable get/set/clear
│   │   ├── steps.go            # Step / EvalDetail types + GetSteps
│   │   ├── graph.go            # Point / GraphResult + EvaluateGraph
│   │   └── benchmark_test.go   # Benchmark tests for naturalize, EvaluateLine, NewEngine
│   ├── service/
│   │   └── app.go              # Wails-bound service methods (19 methods)
│   └── storage/
│       ├── db.go               # SQLite notes CRUD (composite index idx_notes_sort)
│       ├── config.go           # config.toml parse/save
│       ├── exporter.go         # Export/import: .lv, .txt, .md, .json, .toml, .pdf
│       └── fancyname.go        # Random name generator
├── frontend/
│   ├── src/
│   │   ├── App.ts           # Orchestrator (~360 lines)
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
│   │       ├── NotesPanel.ts     # Drag-and-drop reorder
│   │       ├── VariableExplorer.ts
│   │       ├── HistoryPanel.ts   # Search/filter
│   │       ├── StepsPanel.ts     # Step-by-step evaluation
│   │       ├── GraphPanel.ts     # Chart.js function plotting
│   │       ├── ContextMenu.ts
│   │       ├── ConfirmDialog.ts
│   │       ├── ShortcutModal.ts
│   │       ├── SettingsModal.ts
│   │       └── DocsViewer.ts
│   ├── wailsjs/             # Auto-generated bindings (do not edit)
│   └── index.html
├── docs/
│   ├── architecture.md       # Architecture overview
│   ├── api-reference.md      # Wails-bound method reference
│   ├── calculator-engine.md  # How the calculation engine works
│   ├── frontend.md           # Frontend architecture guide
│   ├── development.md        # Development setup and workflow
│   ├── faq.md                # FAQ and troubleshooting
│   ├── from-words-to-numbers.md  # End-to-end walkthrough (query → result)
│   └── user-guide.md         # User-facing documentation
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

### Benchmarks

Benchmark tests in `app/calculator/benchmark_test.go` cover the engine's core operations:

```bash
go test ./app/calculator/ -bench=. -benchmem
```

| Name | Iterations | Time/op |
|---|---|---|
| BenchmarkNaturalize | 280 | ~2,100,000 ns/op |
| BenchmarkEvaluateLine | 170 | ~3,400,000 ns/op |
| BenchmarkNaturalizeLong | 856 | ~657,000 ns/op |
| BenchmarkEvaluateLineLong | 606 | ~957,000 ns/op |
| BenchmarkEngineNew | 31,468,534 | ~20 ns/op |

### Frontend

```bash
npx vitest run              # unit tests
npx tsc --noEmit            # type checking
npx vite build              # production build
```

## Build Configuration

Key flags:
- `-tags "webkit2_41"` — required on Ubuntu 26.04+ (webkit2gtk 4.1)
- `-ldflags` — customize via `wails.json` or CLI
