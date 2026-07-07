# Architecture

LineSolv is a cross-platform desktop application built with the **Wails v2** framework. A Go backend serves as the computation engine, while a TypeScript frontend renders the UI in a WebView via Vite + Tailwind CSS v4.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│  Wails v2 (Go)                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │  main.go                                            ││
│  │  ├─ service.AppService (16 Wails-bound methods)     ││
│  │  │   └─ app/calculator.Engine                       ││
│  │  │       ├─ engine.go  — parser, pipeline, history  ││
│  │  │       ├─ units.go   — unit DB + conversion       ││
│  │  │       ├─ functions.go — built-in math functions  ││
│  │  │       └─ variables.go — get/set/clear variables  ││
│  │  └─ storage/                                        ││
│  │      ├─ db.go          — SQLite notes CRUD          ││
│  │      ├─ config.go      — config.toml parse/save     ││
│  │      ├─ exporter.go    — Export/import note files   ││
│  │      └─ fancyname.go   — "{emoji} {Adj} {Noun}"    ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  Frontend (WebView)                                     │
│  ┌─────────────────────────────────────────────────────┐│
│  │  TypeScript + Vite                                  ││
│  │  ├─ App.ts (orchestrator)                          ││
│  │  ├─ stores/ (CalculatorStore — reactive state)      ││
│  │  ├─ components/ (TitleBar, CalculatorInput,         ││
│  │  │              ResultDisplay, HistoryPanel,         ││
│  │  │              NotesPanel, VariableExplorer,        ││
│  │  │              ContextMenu, ConfirmDialog,          ││
│  │  │              ShortcutModal)                       ││
│  │  ├─ style.css (Tailwind v4 + CSS vars)              ││
│  │  └─ wailsjs/go/service/ (auto-generated bindings)   ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Go Backend

### `main.go`
Minimal entrypoint. Creates the service and calls `wails.Run`. The `AppService` is bound to the frontend, making its methods callable from JavaScript.

### `app/service/`
Wails-bound service layer exposing methods:
- `EvaluateLine(input) (string, error)`
- `EvaluateAll(input) []string`
- `GetVariables() map[string]float64`
- `ClearVariables()`
- `GetHistory() []HistoryEntry`
- `ClearHistory()`

### `app/calculator/`
The natural-language arithmetic engine, split into four files:

- **`engine.go`** — Core `Engine` struct, PEMDAS recursive descent parser, lexer, natural language preprocessing pipeline (`naturalize`), `EvaluateLine`/`EvaluateAll`, history tracking, helpers
- **`units.go`** — `unitInfo` struct, `unitDB` map, `convertUnit` function, `RegisterUnit`
- **`functions.go`** — Built-in math function dispatch (`sin`, `cos`, `sqrt`, etc.)
- **`variables.go`** — `GetVariables`, `SetVariable`, `ClearVariables`

### `app/storage/`
Persistent storage layer with four modules:

- **`db.go`** — SQLite database connection and CRUD operations for notes (`notes` table)
- **`config.go`** — Parsing and saving `config.toml` with `[app]`, `[notes]`, `[behavior]` sections
- **`exporter.go`** — Export notes to `.lv`, `.txt`, `.md`, `.json`, `.toml` and import from `.json`
- **`fancyname.go`** — Random name generator (`"{emoji} {Adjective} {Noun}"`) for new notes

## TypeScript Frontend

### `App.ts`
Orchestrator that wires all UI components, uses `CalculatorStore` for reactive state, schedules debounced evaluation calls to the Go backend, handles keyboard shortcuts, and manages notes.

### `stores/calculator.ts`
Reactive store with subscriber pattern. Holds input, results, variables, eval state (idle/loading/error), error message, and computation history. Components subscribe to state changes.

### Components
- **TitleBar** — Frameless drag region with app title and action buttons (theme, notes, variables, history)
- **CalculatorInput** — Textarea with synchronized line-number gutter
- **ResultDisplay** — Right-aligned results column synced with input scroll, shows loading indicator and empty state
- **NotesPanel** — Collapsible sidebar for managing multiple calculation notes, with right-click context menu (rename, delete, export, import, share)
- **VariableExplorer** — Collapsible sidebar showing defined variables
- **HistoryPanel** — Collapsible sidebar showing evaluation history, click to restore input
- **ContextMenu** — Reusable right-click menu with submenus and SVG icons
- **ConfirmDialog** — Modal confirmation dialog with "Don't ask again" option
- **ShortcutModal** — Keyboard shortcut reference overlay

### Theming
Dark/light mode via CSS custom properties on `:root` / `:root.light`. No Tailwind `dark:` variant used — all colors are driven by `--surface`, `--text`, `--accent`, etc.

### Communication
The frontend imports auto-generated TypeScript bindings from `frontend/wailsjs/go/service/` as static imports. Each backend call is `async/await` wrapped. A retry loop on startup waits for the Wails runtime to become ready.
