# Architecture

LineSolv is a cross-platform desktop application built with the **Wails v2** framework. A Go backend serves as the computation engine, while a TypeScript frontend renders the UI in a WebView via Vite + Tailwind CSS v4.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│  Wails v2 (Go)                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │  main.go                                            ││
│  │  ├─ service.AppService (Wails-bound methods)        ││
│  │  │   └─ app/calculator.Engine                       ││
│  │  │       ├─ engine.go    — parser, pipeline, history ││
│  │  │       ├─ units.go     — unit DB + conversion      ││
│  │  │       ├─ functions.go — built-in math functions   ││
│  │  │       ├─ variables.go — get/set/clear variables   ││
│  │  │       ├─ steps.go     — Step / EvalDetail types   ││
│  │  │       └─ graph.go     — Point / GraphResult, EvaluateGraph ││
│  │  └─ storage/                                        ││
│  │      ├─ db.go          — SQLite notes CRUD           ││
│  │      ├─ config.go      — config.toml parse/save      ││
│  │      ├─ exporter.go    — Export/import notes + PDF   ││
│  │      └─ fancyname.go   — "{Adj} {Noun}"              ││
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
│  │  │              ShortcutModal, SettingsModal,         ││
│  │  │              StepsPanel, GraphPanel,               ││
│  │  │              DocsViewer)                           ││
│  │  ├─ style.css (Tailwind v4 + CSS vars)              ││
│  │  └─ wailsjs/go/service/ (auto-generated bindings)   ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Go Backend

### `main.go`
Minimal entrypoint. Creates the service and calls `wails.Run`. The `AppService` is bound to the frontend, making its methods callable from JavaScript.

### `app/service/`
Wails-bound service layer exposing methods for evaluation, variables, history, notes CRUD, settings, export/import, and update checking.

### `app/calculator/`
The natural-language arithmetic engine, split into six files:

- **`engine.go`** — Core `Engine` struct, PEMDAS recursive descent parser, lexer, natural language preprocessing pipeline (`naturalize`), `EvaluateLine`/`EvaluateAll`, history tracking, helpers
- **`units.go`** — `unitInfo` struct, `unitDB` map, `convertUnit` function, `RegisterUnit`
- **`functions.go`** — Built-in math function dispatch (`sin`, `cos`, `sqrt`, etc.)
- **`variables.go`** — `GetVariables`, `SetVariable`, `ClearVariables`
- **`steps.go`** — `Step` and `EvalDetail` types used for step-by-step evaluation display
- **`graph.go`** — `Point`, `GraphResult` types and `EvaluateGraph` for function plotting
- **`benchmark_test.go`** — Benchmark tests for `naturalize`, `EvaluateLine`, and `NewEngine`

### `app/storage/`
Persistent storage layer with four modules:

- **`db.go`** — SQLite database connection and CRUD operations for notes (`notes` table). A composite index `idx_notes_sort` on `(position, updated_at)` optimizes note reordering and listing queries.
- **`config.go`** — Parsing and saving `config.toml` with `[app]`, `[notes]`, `[behavior]`, `[settings]` sections
- **`exporter.go`** — Export notes to `.lv`, `.txt`, `.md`, `.json`, `.toml`, `.pdf` and import from `.json`
- **`fancyname.go`** — Random name generator for new notes

## TypeScript Frontend

### `App.ts`
Orchestrator that wires all UI components, uses `CalculatorStore` for reactive state, schedules debounced evaluation calls to the Go backend, handles keyboard shortcuts, and manages notes. Applies theme and font settings on startup from persisted config.

### `stores/calculator.ts`
Reactive store with subscriber pattern. Holds input, results, variables, eval state (idle/loading/error), error message, and computation history. Components subscribe to state changes.

### Components
- **TitleBar** — Frameless drag region with app title and action buttons (notes, variables, history, steps, docs, print, settings). Uses `--wails-draggable:drag` on the header with `--wails-draggable:no-drag` on all buttons per the Wails v2 pattern. Print button opens native print dialog via hidden iframe with watermark. Double-click toggles fullscreen. All interactive elements have `aria-label` attributes for accessibility.
- **CalculatorInput** — Textarea with synchronized line-number gutter. The gutter is virtualized — only DOM elements for visible lines are created (viewport + 5-line overscan), using top/bottom spacers for correct scroll height. `replaceChildren()` is used for DOM updates (no innerHTML). Updates are throttled via `requestAnimationFrame`. Enforces 10,000 character limit.
- **ResultDisplay** — Right-aligned results column synced with input scroll, shows loading indicator and empty state
- **NotesPanel** — Collapsible sidebar for managing multiple calculation notes, with real-time search/filter input, sort button, and drag-and-drop reordering. Each note has a dirty-state indicator (accent-colored dot) when unsaved changes exist. Right-click context menu (rename, delete, export, import, share). Uses lazy rendering — only rebuilds the DOM when `needsRender` is true and the panel is open.
- **VariableExplorer** — Collapsible sidebar showing defined variables. Uses lazy rendering with `needsRender` flag.
- **HistoryPanel** — Collapsible sidebar showing evaluation history, click to restore input, real-time search/filter input. Uses lazy rendering with `needsRender` flag.
- **StepsPanel** — Bottom dock panel showing step-by-step evaluation details. Displays naturalized expression and each parse-tree reduction. Toggle via `⌘S`.
- **GraphPanel** — Auto-appearing bottom panel for function plotting. Detects `plot`, `graph`, `y =` expressions. Renders Chart.js line chart with 200 sampled points. Supports custom ranges.
- **ContextMenu** — Reusable right-click menu with submenus and SVG icons
- **ConfirmDialog** — Modal confirmation dialog with "Don't ask again" option
- **ShortcutModal** — Keyboard shortcut reference overlay
- **SettingsModal** — 4-tab settings panel (General, Theme, Keyboard Shortcuts, About)

### Theming
Theme is driven by CSS custom properties defined per-theme in `style.css`. Each theme is a `<html>` class (`theme-dark`, `theme-light`, `theme-neon`, etc.) that overrides `--surface`, `--text`, `--accent`, and other color variables. No Tailwind `dark:` variants are used.

### Communication
The frontend imports auto-generated TypeScript bindings from `frontend/wailsjs/go/service/` as static imports. Each backend call is `async/await` wrapped. A retry loop on startup waits for the Wails runtime to become ready.

### Additional Utilities
- **`utils/toast.ts`** — Toast notification system with success/error/info types, auto-dismiss, and slide-in animation. Wired to note CRUD and clipboard actions.
- **`utils/shortcutDefs.ts`** — Shared keyboard shortcut definitions deduplicated across ShortcutModal and SettingsModal.
- **`utils/html.ts`** — Shared DOM-based `escapeHtml` function used across all components to prevent XSS.
- **`utils/shortcuts.ts`** — Custom 200-entry undo/redo stack for the input textarea with snapshot-based state capture.
- **`stores/notes.ts`** — Notes state store handling note CRUD, active note tracking, and reorder state.

### Accessibility
- All interactive elements have `aria-label` attributes (15 across TitleBar, NotesPanel, HistoryPanel, GraphPanel).
- Focus-visible rings use the theme accent color.
- `prefers-reduced-motion` media query disables all animations and transitions.
- Context menu uses `role="menu"` for screen reader compatibility.

### Offline Currency Cache
SQLite-backed cache table (`currency_cache`) stores exchange rates with timestamps. On startup, cached rates are loaded. `UpdateCurrencyRates()` fetches live rates from exchangerate-api.com, saves to cache on success, falls back to cache on network failure. Cache info (last updated, source) exposed via `GetCurrencyCacheInfo()`.
