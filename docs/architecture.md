# Architecture

LineSolv is a cross-platform desktop application built with the **Wails v2** framework. A Go backend serves as the computation engine, while a TypeScript frontend renders the UI in a WebView via Vite + Tailwind CSS v4.

## High-Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Wails v2 (Go)                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  main.go                                                     │ │
│  │  ├─ embed: frontend/dist, docs/, build/appicon.png          │ │
│  │  ├─ service.AppService (Wails-bound methods)                 │ │
│  │  │   ├─ app/calculator.Engine                                │ │
│  │  │   │   ├─ engine.go    — parser, pipeline, history         │ │
│  │  │   │   ├─ units.go     — unit DB + conversion              │ │
│  │  │   │   ├─ functions.go — 50+ built-in math functions       │ │
│  │  │   │   ├─ variables.go — get/set/clear variables           │ │
│  │  │   │   ├─ steps.go     — Step / EvalDetail types           │ │
│  │  │   │   └─ graph.go     — Point / GraphResult, plot eval    │ │
│  │  │   ├─ plugin.Manager                                        │ │
│  │  │   │   ├─ types.go    — Manifest, FunctionDef, ThemeDef    │ │
│  │  │   │   ├─ loader.go   — scan, load, enable/disable, state  │ │
│  │  │   │   ├─ builtins.go — 20 builtin plugin functions        │ │
│  │  │   │   └─ expr.go     — expression evaluator for plugins   │ │
│  │  │   └─ storage.DB                                          │ │
│  │  │       ├─ db.go          — SQLite (WAL, notes + cache)     │ │
│  │  │       ├─ config.go      — config.toml parse/save          │ │
│  │  │       ├─ exporter.go    — export notes (TXT/MD/JSON/TOML/ │ │
│  │  │       │                   PDF) + import                    │ │
│  │  │       └─ fancyname.go   — random "{Adj} {Noun}" names     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Frontend (WebView)                                              │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  TypeScript + Vite + Tailwind CSS v4                         │ │
│  │  ├─ main.ts              — bootstrap, imports style.css      │ │
│  │  ├─ App.ts               — orchestrator (≈720 lines)         │ │
│  │  ├─ stores/                                                 │ │
│  │  │   ├─ calculator.ts    — subscriber-pattern reactive store │ │
│  │  │   ├─ settings.ts      — SettingsStore (50ms auto-save)    │ │
│  │  │   └─ notes.ts         — NotesManager (sort, active track) │ │
│  │  ├─ components/ (15 components)                              │ │
│  │  │   ├─ TitleBar.ts (menu dropdown + closeMenu)              │ │
│  │  │   ├─ CalculatorInput.ts, ResultDisplay.ts                │ │
│  │  │   ├─ NotesPanel.ts, VariableExplorer.ts, HistoryPanel.ts  │ │
│  │  │   ├─ StepsPanel.ts, GraphPanel.ts, PluginPanel.ts        │ │
│  │  │   ├─ ContextMenu.ts, ConfirmDialog.ts                     │ │
│  │  │   ├─ ShortcutModal.ts, SettingsModal.ts, DocsViewer.ts   │ │
│  │  │   ├─ AutocompletePopup.ts (floating keyword popup)       │ │
│  │  │   └─ (see §Components below)                              │ │
│  │  ├─ utils/                                                   │ │
│  │  │   ├─ shortcuts.ts    — global handler, undo/redo stacks   │ │
│  │  │   ├─ shortcutDefs.ts — shortcut definitions table         │ │
│  │  │   ├─ toast.ts        — toast notification system           │ │
│  │  │   ├─ html.ts         — escapeHtml (XSS prevention)        │ │
│  │  │   └─ format.ts       — result formatting + alignment      │ │
│  │  ├─ style.css          — Tailwind v4 + CSS vars (27 themes)  │ │
│  │  ├─ types.ts           — shared TS types                     │ │
│  │  └─ wailsjs/go/service/ — auto-generated Wails bindings      │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Go Backend

### `main.go`

Minimal entrypoint. Creates the DB, loads embedded docs from `//go:embed all:docs`, initializes the plugin system (`~/.config/neostore/linesolv/plugins`), and calls `wails.Run`. Platform options include frameless window, translucent backgrounds, and platform-specific title bar behavior.

### `app/service/`

Wails-bound `AppService` struct exposes 42+ methods to the frontend:

| Category      | Methods                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evaluation    | `EvaluateLine`, `EvaluateAll`, `EvaluateGraph`, `GetSteps`                                                                                                        |
| Variables     | `GetVariables`, `ClearVariables`                                                                                                                                  |
| History       | `GetHistory`, `ClearHistory`                                                                                                                                      |
| Notes         | `GetAllNotes`, `CreateNote`, `CreateNoteInFolder`, `GetNote`, `SaveNoteContent`, `RenameNote`, `DeleteNote`, `ReorderNotes`, `UpdateNoteIcon`, `MoveNoteToFolder` |
| Folders       | `CreateFolder`, `GetAllFolders`, `RenameFolder`, `DeleteFolder`, `MoveFolder`, `UpdateFolderIcon`, `ReorderFolders`, `UniqueFolderName`                           |
| Export/Import | `ExportNote`, `ExportNoteToFile`, `ImportNoteFromFile`, `GetDataDir`                                                                                              |
| Settings      | `GetSettings`, `SaveSettings`, `GetDeleteWithoutConfirm`, `SetDeleteWithoutConfirm`                                                                               |
| Plugins       | `GetPlugins`, `SetPluginEnabled`, `ReloadPlugins`, `InstallPlugin`, `RemovePlugin`, `GetPluginThemes`, `GetPluginsDir`                                            |
| Autocomplete  | `GetAutocompleteKeywords`                                                                                                                                         |
| System        | `GetAppVersion`, `GetCurrencyCacheInfo`, `UpdateCurrencyRates`                                                                                                    |
| Docs          | `GetDocList`, `GetDocContent`                                                                                                                                     |

All evaluation methods (`EvaluateLine`, `EvaluateAll`, `EvaluateGraph`, `GetSteps`) run in goroutines with a 5-second timeout to prevent UI hangs.

### `app/calculator/`

The natural-language arithmetic engine, split into six files:

- **`engine.go`** (2010 lines) — Core `Engine` struct with `variables`, `lastResult`, `history`, and plugin extension maps. Contains:
  - **Natural language preprocessing** — `normalize()` handles Unicode normalization (smart quotes, dashes, math symbols, CJK brackets), then `naturalize()` runs a 21-step pipeline: strip prefixes (greetings, queries, conversational fillers, action verbs), strip trailing fluff, convert currencies, expand fractions, convert word numbers, strip ordinals, expand SI notation, expand possessive plurals, substitute context references ("that", "then", "result", "previous"), apply multiplicative prefixes, power words, complex phrase patterns (comparison, ratio, shape area/volume), natural function names, percentage phrases, tip/discount, word operators, and comma removal.
  - **PEMDAS recursive descent parser** — `lex()` tokenizer + `parseAddSub → parseMulDiv → parsePow → parseUnary → parseAtom` grammar. Supports: numbers, parenthesized expressions, binary operators (`+`, `-`, `*`, `/`, `^`, `%`), unary minus, factorial (`!`), function calls with comma-separated args, variable lookup, constants (`pi`, `e`), and plugin function/variable lookup.
  - **Line evaluation** — `EvaluateLine` handles: empty/comment/label lines, variable assignment (`x = expr`), and general expressions. `EvaluateAll` processes multi-line input with persistent variables across lines.
  - **Date math** — `computeDateMath` handles `today`, `now`, `next/last week/month/year`, `N days/weeks/months/years from now`, `N days ago`, `today ± N units`, specific dates (`March 15 + 30 days`), weekday computation (`next Monday`). `extractDateMath` handles embedded date patterns. `computeAge` computes age from birth year.
  - **Currency handling** — `convertCurrencies` maps 27 currency symbols to ISO codes, handles single/multi-currency expressions, cross-rate conversion, and code-prefix fallback (`BTC5k in USD`).

- **`units.go`** — `unitInfo` struct (name + toSI conversion factor), `unitDB` map with 100+ aliases covering: length (m, km, cm, mm, inch, ft, yd, mile), mass (g, kg, lb, oz), volume (L, mL, gal, qt, cup), temperature (°C, °F with special conversion), area (sqm, acre, hectare), speed (mph, kmh, knot), time (sec, min, hr, day, week, month, year), data (B, KB, MB, GB, TB, PB), and 30+ currencies (USD, EUR, GBP, JPY, CNY, INR, CAD, AUD, CHF, KRW, RUB, ILS, VND, PHP, UAH, KZT, PYG, GHS, TRY, AZN, GEL, BTC, THB, CRC, NGN, BDT, MNT, KHR, EUR). `convertUnit` handles same-category conversion and temperature special cases.

- **`functions.go`** — `callBuiltinOrPlugin` dispatches 50+ functions: trig (`sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `sinh`, `cosh`, `tanh`), roots (`sqrt`, `cbrt`), rounding (`round`, `floor`, `ceil`, `trunc`, `sign`), logarithmic (`log`, `ln`, `log10`, `log2`), hyperbolic (`sinh`, `cosh`, `tanh`), combinatorial (`nCr`, `nPr`), constants (`pi`, `e`), angle conversion (`deg`, `rad`), and utility (`min`, `max`, `abs`, `exp`, `pow`, `clamp`). Plugin functions are tried as a fallback if no builtin matches.

- **`variables.go`** — `GetVariables` (returns defensive copy), `SetVariable` (case-insensitive, stored lowercase), `ClearVariables` (also resets `lastResult`).

- **`steps.go`** — `Step` struct (operation, expression, result) and `EvalDetail` struct (result + steps slice). `recordStep` on the parser appends to the steps pointer. `fmtVal` formats numbers for display. Used by `GetSteps` for the step-by-step panel.

- **`graph.go`** — `Point` (x, y), `GraphResult` (points, expression, from, to). `parseGraphInput` matches `plot ...`, `graph ...`, `y = ...` with optional `from N to N` range. `EvaluateGraph` samples 200 points across the range, temporarily setting `x` in the variable store and restoring it afterward. Skips `Inf`/`NaN` results.

### `app/plugin/`

Plugin system providing extensibility through JSON manifests:

- **`types.go`** — `Manifest` (name, version, description, author, homepage, functions, themes, variables), `FunctionDef` (name, description, args, min/max args, expression or builtin, examples), `ThemeDef` (id, label, colors map), `VariableDef` (name, description, value). `Plugin` struct holds manifest, directory, enabled state, and compiled function/theme/variable maps.

- **`loader.go`** — `Manager` scans `~/.config/neostore/linesolv/plugins/`, each subdirectory containing `plugin.json`. Validates manifests (name, version, at least one function/theme/variable, no duplicate names). Builds `PluginFunction` closures from `FunctionDef` — either expression-based (using `EvalExpr` with `a,b,c...` arg substitution) or builtin-based (dispatching to `BuiltinFuncs`). Persists enabled/disabled state to `state.json`. `PluginInfo` is the JSON-serializable representation sent to the frontend.

- **`builtins.go`** — 20 builtin operations: `clamp`, `lerp`, `smoothstep`, `wrap`, `average`, `median`, `std_dev`, `variance`, `percentile`, `sum`, `product`, `gcd`, `lcm`, `fact`, `npr`, `ncr`, `hypot`, `rad`, `deg`.

- **`expr.go`** — Lightweight expression evaluator for plugin function expressions. Supports: numbers, arithmetic operators (`+`, `-`, `*`, `/`, `^`), parentheses, and variable substitution (`a`, `b`, `c`... mapped to function arguments).

### `app/storage/`

Persistent storage layer with four modules:

- **`db.go`** — SQLite database with WAL mode, single-connection limit. Tables: `notes` (id, name, content, created_at, updated_at, position) and `currency_cache` (rates JSON, updated_at). Composite index `idx_notes_sort` on `(position, updated_at)` optimizes note listing and reordering. CRUD: `CreateNote`, `CreateNoteWithContent`, `CreateNoteWithContentAndDates` (preserves timestamps on import), `GetAllNotes` (ordered by position, then updated_at), `ReorderNotes` (transactional position update), `RenameNote`, `DeleteNote`, `SaveNoteContent`. Currency: `SaveCurrencyRates`, `GetCachedCurrencyRates`.

- **`config.go`** — TOML config with sections: `[app]` (theme, version), `[notes]` (last_active, sort_by), `[behavior]` (delete_without_confirm), `[settings]` (font_size, font_family, shortcut_overrides, result_panel_enabled, line_wrap_enabled). Manual TOML parser (no external dependency). Defaults: dark theme, font size 16, system font family, result panel enabled, line wrap enabled.

- **`exporter.go`** — Export to 6 formats: `.lv` (raw content), `.txt` (title + created date + content), `.md` (Markdown with header + code block), `.json` (full metadata + content), `.toml` (key-value with name/content), `.pdf` (using `gofpdf`). Import from `.json` (preserves timestamps), `.toml`, `.lv`/`.txt`/`.md` (raw content), `.pdf` (text extraction via `ledongthuc/pdf`). `ExportNoteBytes` returns raw bytes for binary-safe PDF export.

- **`fancyname.go`** — Random name generator combining an adjective with a noun (e.g., "Cosmic Panda", "Quantum Ember").

## TypeScript Frontend

### Entry Point

`frontend/src/main.ts` — Minimal bootstrap: imports `style.css` (Tailwind v4), calls `renderApp(document.body)` from `App.ts`. On startup, `App.ts` appends a `#splash-screen` div to `document.body` containing the logo SVG, app name, and an animated loading bar (`#splash-bar`). The splash screen is removed after initialization completes with an opacity fade transition.

### App Orchestrator (`App.ts`)

`App.ts` is the central controller (≈720 lines). It:

1. Creates all UI components (TitleBar, CalculatorInput, ResultDisplay, NotesPanel, VariableExplorer, HistoryPanel, StepsPanel, GraphPanel, PluginPanel, DocsViewer, AutocompletePopup, SettingsModal, ShortcutModal, ConfirmDialog)
2. Creates a `CalculatorStore` for reactive state management
3. Wires keyboard shortcuts via `installGlobalShortcuts`
4. Manages note operations (create, rename, delete, export, import, share, reorder)
5. Handles debounced evaluation, loading spinner visibility, and history navigation
6. Manages plugin themes (injected as `<style>` elements with CSS custom properties)
7. Loads and applies all settings on startup: theme, font, opacity, line numbers, autocomplete, animations, toast, result panel visibility, line wrap
8. Coordinates panel cross-closing — `switchNote()`, `onToggleNotes`, `onToggleDocs`, `onTogglePlugins`, `handleNewNote` all close conflicting panels before opening the target panel

**Debounced evaluation**: Input changes trigger `scheduleEval()` which debounces at 150ms. A deferred loading state shows `…` only if evaluation takes >60ms (prevents flicker for fast evals).

**Stale-result detection**: An `evalVersion` counter is incremented on each evaluation. If a new evaluation starts before the previous completes, the old result is discarded (`if (version !== evalVersion) return`).

**Startup retry loop**: On mount, `init()` retries `EvaluateAll` up to 20 times (100ms apart) waiting for the Wails runtime to become ready. Falls back to an in-memory note if backend is unavailable. The splash screen (`#splash-screen`) is appended to `document.body` before init and removed with an opacity fade once initialization completes.

**Note auto-save**: Content changes are debounced at 500ms via `scheduleSaveContent`. A dirty-state indicator is shown on unsaved notes.

**Plugin theme injection**: On startup, `GetPluginThemes` returns themes from enabled plugins. Each theme's color map is injected as CSS custom properties in a `<style id="plugin-themes">` element, making them selectable alongside built-in themes.

### State Management

State is managed through `CalculatorStore` (`stores/calculator.ts`), a reactive store with a subscriber pattern (pub/sub, not framework reactivity):

```typescript
interface StoreState {
  input: string; // current textarea content
  results: string[]; // per-line result strings
  variables: Record<string, number>; // name → value map
  evalState: 'idle' | 'loading' | 'error';
  error: string | null;
  history: HistoryEntry[]; // {input, output} entries
  historyIndex: number; // current position in history nav
}
```

Subscribers receive the full state on every change. Components subscribe via `store.subscribe(fn)` and receive an unsubscribe function. State updates use immutable spread (`{ ...state, field: newVal }`).

`SettingsStore` (`stores/settings.ts`) is a separate reactive store for application settings. It manages theme, font, opacity, line numbers, autocomplete, animations, toast, `result_panel_enabled`, and `line_wrap_enabled` preferences. Changes are debounced (50ms) and auto-saved to the backend via `SaveSettings`. Subscribers are notified on every state change.

`NotesManager` (`stores/notes.ts`) manages note CRUD, active-note tracking, and sort state (by name, created, or updated — ascending or descending).

### Keyboard Shortcuts

| Shortcut                                | Action                                              |
| --------------------------------------- | --------------------------------------------------- |
| `Tab`                                   | Insert 2 spaces                                     |
| `Shift+Enter`                           | Force-evaluate immediately                          |
| `Esc`                                   | Close open modal/panel, or clear input if none open |
| `F11`                                   | Toggle fullscreen                                   |
| `Ctrl/Cmd + Z`                          | Undo (custom 200-entry stack)                       |
| `Ctrl/Cmd + Shift + Z` / `Ctrl/Cmd + Y` | Redo                                                |
| `Ctrl/Cmd + D`                          | Duplicate line or selection                         |
| `Ctrl/Cmd + L`                          | Select current line                                 |
| `Ctrl/Cmd + Shift + K`                  | Delete current line                                 |
| `Alt + Shift`                           | Toggle case (lower → UPPER → Title)                 |
| `Alt + ↑ / ↓`                           | Move line up/down                                   |
| `Alt + ← / →`                           | Jump word left/right (native)                       |
| `Home / End`                            | Start/end of line (native)                          |
| `Ctrl/Cmd + Home / End`                 | Start/end of text (native)                          |
| `Page Up / Page Down`                   | Scroll page (native)                                |
| `↑ / ↓ / ← / →`                         | Cursor navigation (native)                          |
| `Ctrl/Cmd + N`                          | New note                                            |
| `Ctrl/Cmd + B`                          | Toggle notes sidebar                                |
| `Ctrl/Cmd + I`                          | Toggle variables sidebar                            |
| `Ctrl/Cmd + H`                          | Toggle history sidebar                              |
| `Ctrl/Cmd + S`                          | Toggle steps panel                                  |
| `Ctrl/Cmd + K`                          | Clear all (input + variables + history)             |
| `Ctrl/Cmd + P`                          | Print current note                                  |
| `Ctrl/Cmd + ,`                          | Open settings                                       |
| `Ctrl/Cmd + ↑`                          | Navigate history back                               |
| `Ctrl/Cmd + ↓`                          | Navigate history forward                            |
| `Ctrl/Cmd + /`                          | Show keyboard shortcut reference                    |
| `Ctrl/Cmd + F`                          | Focus notes search input                            |
| `Ctrl/Cmd + J`                          | Toggle documentation viewer                         |
| `Ctrl/Cmd + `` `                        | Toggle settings                                     |

All shortcuts are rebindable via the Settings modal. Custom overrides are persisted in `config.toml` as `shortcut_overrides`.

### Components

All 15 components are class-based, using imperative DOM manipulation (no framework). Each creates a root `el: HTMLElement` property that App.ts mounts into the DOM tree.

- **TitleBar** — Frameless drag region (`--wails-draggable:drag`) with app title, window controls (close/minimize/maximize), and action buttons (notes, variables, history, steps, plugins, docs, print, settings). Includes a `menuEl` dropdown menu with Documentation, Print, Plugins, and Settings items. `closeMenu()` dismisses the dropdown. Double-click toggles fullscreen. All buttons use `--wails-draggable:no-drag`. Print button builds a self-contained HTML document in a hidden iframe with watermark.

- **CalculatorInput** — Textarea (`#input-area`) with synchronized virtualized line-number gutter (`#gutter`). Gutter renders only visible lines (viewport + 5-line overscan) using `DocumentFragment` + `replaceChildren()`. Word-wrap is handled by a hidden measurement element that computes visual line counts. `requestAnimationFrame` throttles gutter rebuilds. Enforces 10,000 character `maxLength`. `setLineWrap(enabled)` method toggles textarea wrapping by setting `textarea.wrap` and `white-space`/`overflow-x` CSS properties.

- **ResultDisplay** — Right-aligned results column (`#results-column`) synced with textarea scroll. Supports three states: loading (`…` per line), empty (non-breaking space), and result (color-coded variable names in `--text-muted`, values in `--accent`).

- **NotesPanel** — Collapsible sidebar (0px ↔ 200px width animation) for managing multiple calculation notes. Features: note list with active highlight, real-time search/filter (visible when >1 note), sort button (by name/created/updated, asc/desc), drag-and-drop reorder (HTML5 DnD API with visual indicator), dirty-state indicator (6px accent dot), context menu (rename, delete, export, import, share). Lazy rendering via `needsRender` flag.

- **VariableExplorer** — Collapsible sidebar (0px ↔ 180px) showing variables sorted alphabetically. Lazy rendering. Shows "No variables" when empty.

- **HistoryPanel** — Collapsible sidebar (0px ↔ 200px) showing evaluation history. Each entry shows input (truncated at 40 chars) and result. Click restores input and re-evaluates. Search field filters in real-time. Auto-focused on open, cleared on close. Lazy rendering.

- **StepsPanel** — Bottom dock panel showing step-by-step evaluation details. Displays the naturalized expression and each parse-tree reduction (addition, multiplication, exponentiation, etc.). Only updates when open; queries `GetSteps` backend method. Toggle via steps button or `⌘S`.

- **GraphPanel** — Auto-appearing bottom panel for function plotting. Detects `plot`, `graph`, `y =` prefixed expressions. Renders a Chart.js line chart with 200 sampled points. Supports custom ranges via `from N to N` syntax. Shows close button in header bar.

- **PluginPanel** — Full-screen overlay for plugin marketplace and management. Features: local/remote tabs, search, install from GitHub (`rkriad585/linesolv-plugins`), enable/disable toggle, remove, README rendering, function/variable/theme listing. Fetches plugin index from remote repository.

- **ContextMenu** — Reusable right-click menu with submenu support. Renders at cursor position, closes on outside click. Submenus use 100ms show / 200ms hide hover delays. Items have optional SVG icons. Switch Note items show a checkmark icon for the active note. All labels escaped via `escapeHtml()`.

- **ConfirmDialog** — Modal for destructive actions (delete note). Shows title, message, Cancel and Confirm buttons. Optional "Don't ask again" checkbox (stored in `config.toml`). Supports async callbacks.

- **ShortcutModal** — Keyboard shortcut reference overlay. Shows table of all shortcuts with key bindings and descriptions. Triggered by `Ctrl/Cmd+/`. Closes on Escape or backdrop click.

- **SettingsModal** — 5-tab settings panel: General (font family, font size, opacity slider, line numbers toggle, autocomplete toggle, animations toggle, toast toggle, result panel toggle, line wrap toggle with live preview), Theme (27 built-in + plugin themes with color swatch thumbnails), UI Style (5 styles: Default, Glass, Material, Alivated, Neon), Keyboard Shortcuts (view and rebind all shortcuts), About (version info, author, repo links). Settings auto-save on every change with 50ms debounce and apply immediately (real-time).

- **DocsViewer** — Full-screen documentation viewer with sidebar tab navigation. Left sidebar lists all embedded docs. Content area renders markdown via a built-in inline renderer (headers, tables, code blocks, links, lists, blockquotes, horizontal rules). Async loading from Go backend. In-memory cache for instant re-opening. All docs embedded in the Go binary (offline). User Guide opens by default. Logo header with LineSolv SVG.

- **AutocompletePopup** — Floating keyword suggestion popup anchored to the caret position. Displays up to 8 visible items from 6 categories (functions, variables, units, constants, keywords, plugins). Uses prefix matching against `GetAutocompleteKeywords` backend data. Supports keyboard navigation (arrow keys, Tab to accept, Esc to dismiss). Auto-hides when input is empty or no matches found.

### Theming

Theme is driven by CSS custom properties defined per-theme in `style.css`. The `:root` block defines dark theme defaults. Each `.theme-*` class overrides color variables:

| Variable                                                        | Purpose                |
| --------------------------------------------------------------- | ---------------------- |
| `--surface`                                                     | Main background        |
| `--surface-secondary`                                           | Card/panel background  |
| `--surface-hover`                                               | Hover state background |
| `--border`                                                      | Border color           |
| `--text`                                                        | Primary text           |
| `--text-muted`                                                  | Muted text             |
| `--text-subtle`                                                 | Subtle/dim text        |
| `--accent`                                                      | Primary accent color   |
| `--error`                                                       | Error color            |
| `--btn-hover`                                                   | Button hover color     |
| `--note-bg` / `--note-hover` / `--note-text`                    | Note item colors       |
| `--calc-font-size` / `--calc-font-family` / `--calc-font-color` | Calculator font        |

**27 built-in themes**: dark, light, neon, red, obsidian, plasma, blood, midnight, aurora, mono, frost, prism, lavender, sage, warm-light, blue-trust-dark, blue-trust-light, orange-energy-dark, orange-energy-light, green-growth-dark, green-growth-light, yellow-optimism-dark, yellow-optimism-light, purple-innovation-dark, purple-innovation-light, red-passion-dark, red-passion-light. Plugin themes are injected as CSS custom properties at runtime, making them selectable in the Settings modal alongside built-in themes. The active theme is set by adding a `theme-{name}` class to `<html>`.

All 26 previously hardcoded values (border-radius, box-shadow, font-family) across 11 component files have been replaced with CSS custom properties (`var(--ui-radius-*)`, `var(--ui-shadow-*)`, `var(--ui-font-display)`), ensuring consistent styling across all UI styles. Style-specific CSS rules override components for individual UI styles: toast notifications (`.toast-item`), plugin panel (`#plugin-viewer`, `.plugin-card`), confirm dialog (`#confirm-dialog`), and toggle switches (`.toggle-track`, `.toggle-thumb`).

**CVD-safe status tokens** (`--color-error`, `--color-success`, `--color-warning`, `--color-info`) are defined per-theme and pass WCAG contrast checks for color-vision-deficient users. A **tinted gray scale** (`--gray-50` through `--gray-950`) provides warm/cool-tinted neutrals rather than pure grays, ensuring visual harmony with each theme's palette.

No Tailwind `dark:` variants are used — all theming is CSS custom properties.

### Communication

The frontend imports auto-generated TypeScript bindings from `frontend/wailsjs/go/service/AppService` as static imports. Each backend call is `async/await` wrapped. A retry loop on startup waits for the Wails runtime to become ready (20 attempts, 100ms apart).

```typescript
import * as serviceBindings from '../wailsjs/go/service/AppService';
const result = await serviceBindings.EvaluateAll(text);
```

### Accessibility

- **ARIA labels**: 15+ `aria-label` attributes across TitleBar, NotesPanel, HistoryPanel, GraphPanel
- **Focus rings**: `:focus-visible` outlines all interactive elements in theme accent color; `:focus:not(:focus-visible)` hides mouse-focus outlines
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables all animations and transitions
- **Input limit**: Textarea enforces 10,000 character `maxLength`
- **Context menu**: Uses `role="menu"` for screen reader compatibility

### Offline Currency Cache

SQLite-backed `currency_cache` table stores exchange rates with timestamps. On startup, cached rates are loaded. `UpdateCurrencyRates()` fetches live rates from `exchangerate-api.com/v4/latest/USD`, saves to cache on success, falls back to cache on network failure. `GetCurrencyCacheInfo()` exposes cache state (last updated, source: "live" | "cache" | "hardcoded").

### Printing

Printing is triggered by the print icon in the TitleBar or `Ctrl/Cmd+P`. The `onPrint` callback builds a self-contained HTML document inside a hidden iframe:

- **Header**: Currently active note name
- **Table**: All input lines and their results (65%/35% split)
- **Watermark**: LineSolv logo SVG + text at 15% opacity (`position: fixed; bottom: 10mm; left: 15mm`) — repeats on every printed page
- **Date footer**: `position: fixed; bottom: 10mm; right: 15mm`

The iframe approach provides a clean, standalone document with `body` as root, ensuring `position: fixed` elements repeat reliably. A fallback `@media print` CSS block hides screen chrome if the browser's native print dialog is triggered directly.

### Toast Notifications

Lightweight toast system (`utils/toast.ts`): three types (success/green, error/red, info/indigo), auto-dismiss after 2500ms, slide-in animation from right. Wired to note CRUD and clipboard actions.

### Undo/Redo

Custom 200-entry undo/redo stack (`utils/shortcuts.ts`) replaces deprecated `document.execCommand`. `pushSnapshot()` captures textarea state before input events. Stacks are per-textarea-instance via `Map<HTMLTextAreaElement, string[]>`.
