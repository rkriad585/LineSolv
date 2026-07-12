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
│   │   ├── engine_test.go      # Engine unit tests
│   │   ├── units.go            # Unit database + conversion
│   │   ├── units_test.go       # Unit conversion tests
│   │   ├── functions.go        # Built-in math functions
│   │   ├── functions_test.go   # Function tests
│   │   ├── variables.go        # Variable get/set/clear
│   │   ├── variables_test.go   # Variable tests
│   │   ├── steps.go            # Step / EvalDetail types + GetSteps
│   │   ├── graph.go            # Point / GraphResult + EvaluateGraph
│   │   ├── benchmark_test.go   # Benchmark tests
│   │   ├── fuzz_test.go        # Fuzz testing
│   │   └── docs_examples_test.go  # Docs example tests
│   ├── plugin/
│   │   ├── types.go            # Manifest, Plugin, FunctionDef, ThemeDef, VariableDef types
│   │   ├── loader.go           # Plugin scanning and loading
│   │   ├── loader_test.go      # Loader tests
│   │   ├── builtins.go         # 20+ builtin plugin functions
│   │   ├── builtins_test.go    # Builtin function tests
│   │   ├── expr.go             # Expression evaluator for plugins
│   │   └── expr_test.go        # Expression evaluator tests
│   ├── service/
│   │   ├── app.go              # Wails-bound service methods
│   │   └── app_test.go         # Service tests
│   └── storage/
│       ├── db.go               # SQLite notes CRUD + currency cache
│       ├── db_test.go          # Database tests
│       ├── config.go           # config.toml parse/save
│       ├── config_test.go      # Config tests
│       ├── exporter.go         # Export/import: .lv, .txt, .md, .json, .toml, .pdf
│       ├── exporter_test.go    # Exporter tests
│       ├── fancyname.go        # Random name generator
│       └── fancyname_test.go   # Fancy name tests
├── frontend/
│   ├── src/
│   │   ├── App.ts              # Main orchestrator
│   │   ├── main.ts             # Entry point
│   │   ├── types.ts            # Shared interfaces
│   │   ├── style.css           # Tailwind + CSS custom properties + themes
│   │   ├── stores/
│   │   │   ├── calculator.ts   # Reactive calculator state store
│   │   │   ├── calculator.test.ts
│   │   │   ├── notes.ts        # Note manager
│   │   │   └── notes.test.ts
│   │   ├── utils/
│   │   │   ├── html.ts         # escapeHtml()
│   │   │   ├── html.test.ts
│   │   │   ├── shortcuts.ts    # Keyboard shortcut handler
│   │   │   ├── shortcutDefs.ts # Shortcut definitions
│   │   │   ├── format.ts       # Result formatting helpers
│   │   │   ├── format.test.ts
│   │   │   └── toast.ts        # Toast notification utility
│   │   └── components/
│   │       ├── TitleBar.ts
│   │       ├── CalculatorInput.ts
│   │       ├── ResultDisplay.ts
│   │       ├── result-display.test.ts
│   │       ├── NotesPanel.ts
│   │       ├── VariableExplorer.ts
│   │       ├── variable-explorer.test.ts
│   │       ├── HistoryPanel.ts
│   │       ├── history-panel.test.ts
│   │       ├── StepsPanel.ts
│   │       ├── steps-panel.test.ts
│   │       ├── GraphPanel.ts
│   │       ├── DocsViewer.ts
│   │       ├── PluginPanel.ts
│   │       ├── SettingsModal.ts
│   │       ├── ShortcutModal.ts
│   │       ├── ConfirmDialog.ts
│   │       ├── confirm-dialog.test.ts
│   │       └── ContextMenu.ts
│   ├── wailsjs/                # Auto-generated bindings (do not edit)
│   └── index.html
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   ├── calculator-engine.md
│   ├── configuration.md
│   ├── development.md
│   ├── faq.md
│   ├── from-words-to-numbers.md
│   ├── frontend.md
│   ├── getting-started.md
│   ├── plugins.md
│   ├── themes.md
│   └── user-guide.md
├── main.go
├── wails.json
├── go.mod
└── package.json
```

## Code Standards

### Go

- Follow `gofmt` formatting
- No unused exports
- Inject dependencies via constructor (`NewEngine`, `NewAppService`)
- Error paths must handle or propagate errors — no silent swallowing

### TypeScript

- Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- State management via `CalculatorStore` (subscriber pattern)
- All Wails calls wrapped in `async/await` + `try/catch`

### CSS

- Prefer Tailwind utility classes for layout/spacing
- Use CSS custom properties for theme colors
- No `dark:` variants — toggled via `.light` class on `<html>`

## Testing

### Backend

```bash
go test ./app/... -v
```

### Plugin Tests

```bash
go test ./app/plugin/... -v
```

### Frontend

```bash
npx vitest run
```

95 tests across 9 suites covering stores, components, and utilities.

### Type Checking

```bash
npx tsc --noEmit
```

### Build

```bash
npx vite build
```

### Full Verification

Run all checks in sequence:

```bash
go test ./app/... -v && \
cd frontend && npx vitest run && npx tsc --noEmit && npx vite build
```

## Benchmarks

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

## Profiling

pprof is available in development builds (automatic when using `wails dev`):

```bash
# Start dev server (pprof auto-starts on localhost:6060)
wails dev -tags "webkit2_41"

# In another terminal — CPU profile (30s sample)
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Heap snapshot
go tool pprof http://localhost:6060/debug/pprof/heap

# Interactive web UI with flame graphs
go tool pprof -http=:8080 http://localhost:6060/debug/pprof/heap

# Goroutine dump
curl http://localhost:6060/debug/pprof/goroutine?debug=1
```

Profiling is disabled in production builds via build tags (`app/pprof_dev.go` / `app/pprof_prod.go`).

## Build Configuration

Key flags:
- `-tags "webkit2_41"` — required on Ubuntu 26.04+ (webkit2gtk 4.1)
- `-ldflags` — customize via `wails.json` or CLI
