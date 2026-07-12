# Frontend

The frontend is a vanilla TypeScript application served in a Wails WebView. It uses **Vite** as the build tool and **Tailwind CSS v4** for utility-first styling. There is no framework — all 15 components use class-based, imperative DOM manipulation.

## Entry Point

`frontend/src/main.ts` — Minimal bootstrap that imports `style.css` and calls `renderApp(document.body)` from `App.ts`.

## App Orchestrator (`App.ts`)

`App.ts` (≈720 lines) is the central controller. It:

1. Creates and wires all 15 UI components
2. Creates a `CalculatorStore` for reactive state management
3. Schedules debounced (150ms) calls to `EvaluateAll` on each input change
4. Handles keyboard shortcuts (global and textarea-specific)
5. Runs a retry loop on startup (20 attempts, 100ms apart) waiting for the Wails runtime
6. Detects stale results via an `evalVersion` counter — if a new evaluation starts before the previous completes, the old result is discarded
7. Loads settings (theme, font, plugin themes) on startup and applies them
8. Manages note CRUD, auto-save (500ms debounce), dirty-state tracking, and import/export
9. Manages plugin themes by injecting CSS custom properties at runtime

### Evaluation Flow

```
User types → scheduleEval() → 150ms debounce → evaluateAll()
                                                    ├─ increment evalVersion
                                                    ├─ save note content (500ms debounce)
                                                    ├─ store.setInput(text)
                                                    ├─ defer loading state (60ms threshold)
                                                    ├─ await serviceBindings.EvaluateAll(text)
                                                    ├─ if version !== evalVersion → discard
                                                    ├─ store.setResults(res)
                                                    ├─ results.setResults(buildLineResults(...))
                                                    ├─ push non-empty results to history
                                                    ├─ if stepsPanel open → await GetSteps(lastExpr)
                                                    ├─ if graph detected → await EvaluateGraph(lastExpr)
                                                    └─ updateVars()
```

The deferred loading state (60ms threshold) prevents the `…` loading indicator from flashing during fast evaluations. The `evalVersion` counter ensures only the most recent evaluation's results are displayed.

### Startup Sequence

```
renderApp()
  ├─ create CalculatorStore, NotesManager
  ├─ create all components
  ├─ build DOM tree and mount
  ├─ install global shortcuts
  ├─ subscribe store → loading spinner + history panel
  └─ init() retry loop:
       ├─ 20 attempts × 100ms waiting for Wails runtime
       ├─ await loadNotes() from backend
       ├─ initFallbackNote() if backend unavailable
       ├─ injectPluginThemes() from enabled plugins
       ├─ applyTheme() + applyFontSettings() from config
       └─ evaluateAll()
```

## State Management

State is managed through `CalculatorStore` (`stores/calculator.ts`), a reactive store with a subscriber pattern:

```typescript
interface StoreState {
  input: string;                        // current textarea content
  results: string[];                    // per-line result strings
  variables: Record<string, number>;    // name → value map
  evalState: 'idle' | 'loading' | 'error';
  error: string | null;                 // error message or null
  history: HistoryEntry[];              // {input, output} entries
  historyIndex: number;                 // current position in history nav
}
```

State updates use immutable spread (`{ ...state, field: newVal }`). All subscribers receive the full state on every change. `pushHistory` appends an entry and resets `historyIndex`. `navigateHistory` walks the history array in reverse order (most recent first).

`NotesManager` (`stores/notes.ts`) manages multiple notes in memory with active-note tracking, sort state (field: name/created/updated, direction: asc/desc), and CRUD operations.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Tab` | Insert 2 spaces |
| `Shift+Enter` | Force-evaluate immediately |
| `Esc` | Close open modal/panel; if none open, clear input |
| `F11` | Toggle fullscreen |
| `Ctrl/Cmd + Z` | Undo (custom 200-entry stack) |
| `Ctrl/Cmd + Shift + Z` / `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + D` | Duplicate line or selection |
| `Ctrl/Cmd + L` | Select current line |
| `Ctrl/Cmd + Shift + K` | Delete current line |
| `Alt + Shift` | Toggle case (lower → UPPER → Title) |
| `Alt + ↑ / ↓` | Move line up/down |
| `Alt + ← / →` | Jump word left/right (native) |
| `Home / End` | Start/end of line (native) |
| `Ctrl/Cmd + Home / End` | Start/end of text (native) |
| `Page Up / Page Down` | Scroll page (native) |
| `↑ / ↓ / ← / →` | Cursor navigation (native) |
| `Ctrl/Cmd + N` | New note |
| `Ctrl/Cmd + B` | Toggle notes sidebar |
| `Ctrl/Cmd + I` | Toggle variables sidebar |
| `Ctrl/Cmd + H` | Toggle history sidebar |
| `Ctrl/Cmd + S` | Toggle steps panel |
| `Ctrl/Cmd + K` | Clear all (input + variables + history) |
| `Ctrl/Cmd + P` | Print current note |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + ↑` | Navigate history back |
| `Ctrl/Cmd + ↓` | Navigate history forward |
| `Ctrl/Cmd + /` | Show keyboard shortcut reference |
| `Ctrl/Cmd + F` | Focus notes search input |

All shortcuts are rebindable via the Settings modal. Custom overrides are persisted in `config.toml` as a JSON string in the `shortcut_overrides` field.

## UI Components

### TitleBar

Frameless drag region at the top of the window. Contains:
- **Window controls**: Close, Minimize, Maximize
- **LineSolv** title (uppercase, tracked) centered in the drag region
- **Notes** button (clipboard SVG, toggles sidebar)
- **Variables** button (code SVG, toggles sidebar)
- **History** button (clock SVG, toggles sidebar)
- **Steps** button (list SVG, toggles steps panel)
- **Plugins** button (puzzle SVG, opens plugin marketplace)
- **Documentation** button (book SVG, opens documentation viewer)
- **Print** button (printer SVG, opens native print dialog for the current note)
- **Settings** button (gear SVG, opens settings)
- **Double-click** on the drag region toggles fullscreen

The `<header>` element carries `--wails-draggable:drag` for frameless window dragging; all buttons and their container divs override with `--wails-draggable:no-drag` so clicks on them pass through without initiating a drag.

### CalculatorInput

The main input area consisting of:
- **Gutter** (`#gutter`) — line numbers, synced scroll with textarea, virtualized
- **Textarea** (`#input-area`) — free-form natural language input

Wrapped in a flex row container (`#notepad`). The textarea emits `input` events that trigger `scheduleEval()`.

**Gutter virtualization**: The gutter only creates DOM elements for lines visible in the viewport (with 5-line overscan) rather than for every line in the input. Uses a hidden measurement element to compute visual line counts for word-wrapped lines. Continuation lines (wrapped lines) show a middle dot (`·`) instead of a line number. `DocumentFragment` + `replaceChildren()` is used for atomic DOM updates (no empty-gutter flash). `requestAnimationFrame` throttles viewport updates. An early return guard (`clientHeight === 0`) avoids unnecessary rebuilds when the gutter is not visible.

### ResultDisplay

A `<div>` column to the right of the textarea. Results are rendered as HTML with color-coded variable names (`--text-muted`) and values (`--accent`). The column scroll is synced with the textarea's scroll. Supports three display states:

- **Loading** — shows `…` for each line during evaluation (pulsing disabled)
- **Empty** — shows non-breaking space for blank/comment lines
- **Result** — formatted result or empty for errors

### NotesPanel

Collapsible sidebar (left side) for managing multiple calculation notes:
- **Note list** — clickable note names, active note highlighted
- **Real-time search** — search input visible when >1 note exists, filters by name case-insensitively (Ctrl+F to focus)
- **Sort button** — cycles through sort by name/created/updated × asc/desc
- **Drag-and-drop reorder** — HTML5 drag-and-drop API: drag handles, visual drop indicator (accent border), persisted to SQLite via `ReorderNotes`
- **Dirty-state indicator** — accent-colored dot (6px) shown next to note name when unsaved changes exist; cleared on auto-save
- **+ New Note** button
- Opens/closes via width animation (0px ↔ 200px)
- Keyboard shortcut: `⌘B`
- **Lazy rendering** — uses a `needsRender` flag that is set to `true` on state changes but only triggers a DOM rebuild when the panel is open.

### VariableExplorer

Collapsible sidebar (right side) showing defined variables:
- Sorted alphabetically
- Displays variable name (accent color) and value (muted)
- Shows "No variables" when empty
- Opens/closes via width animation (0px ↔ 180px)
- Keyboard shortcut: `⌘I`
- **Lazy rendering** — uses `needsRender` flag to rebuild DOM only when open

### HistoryPanel

Collapsible sidebar (left side, before notes) showing evaluation history:
- Each entry shows the input text (monospace, truncated at 40 chars) and its result
- Click any entry to restore its input into the textarea and re-evaluate
- Search field at the top filters entries by input/output text in real-time; auto-focused on open, cleared on close
- Opens/closes via width animation (0px ↔ 200px)
- Keyboard shortcut: `⌘H`
- **Lazy rendering** — uses `needsRender` flag; automatically subscribes to store changes on open

### StepsPanel

Bottom dock panel showing step-by-step evaluation details:
- Displays the naturalized expression followed by each parse-tree reduction (addition, multiplication, exponentiation, etc.)
- Toggle with the steps button in the TitleBar or `⌘S`
- Only updates when the panel is open; queries the backend `GetSteps` method for the last evaluated expression
- Closes on clicking the close button or pressing `Esc`

### GraphPanel

Auto-appearing bottom panel for function plotting:
- Detects `plot`, `graph`, `y =` prefixed expressions in the input
- Calls `EvaluateGraph` on the backend, renders a Chart.js line chart with 200 sampled points
- Supports custom ranges via `from N to N` syntax
- Shows a close button in the header bar; dismissed by clicking close

### PluginPanel

Full-screen overlay for plugin marketplace and management:
- **Two tabs**: Local (installed plugins) and Remote (available from GitHub repository)
- **Remote plugins**: Fetches plugin index from `rkriad585/linesolv-plugins` GitHub repo, shows name/version/description/author, install button
- **Local plugins**: Shows installed plugins with enable/disable toggle, remove button, function/variable/theme count badges
- **Search**: Filters plugin lists by name/description
- **Detail view**: Shows plugin README (rendered markdown), function signatures with examples, variables, themes
- **Install**: Downloads plugin manifest from remote repo, writes to local plugins directory, triggers rescan
- **Remove**: Deletes plugin directory, triggers rescan
- Opens via plugins button in TitleBar or `⌘.`; closes on Escape

### ContextMenu

Reusable right-click context menu with submenu support:
- Renders at cursor position, closes on outside click or right-click
- Submenus use 100ms show / 200ms hide hover delays
- Items can have optional SVG icons rendered via `innerHTML` in a `.ctx-icon` span
- All label text is escaped via `escapeHtml()`

### ConfirmDialog

Modal confirmation dialog for destructive actions:
- Shows a title, message, Cancel and Confirm buttons
- Optional "Don't ask again" checkbox (preference stored in backend `config.toml`)
- Supports async callbacks for confirm/cancel actions

### ShortcutModal

Keyboard shortcut reference overlay:
- Shows a table of all keyboard shortcuts with key bindings and descriptions
- Triggered by `Ctrl/Cmd+/`
- Closes on Escape or clicking the backdrop

### DocsViewer

Full-screen documentation viewer with sidebar tab navigation:
- **Left sidebar** — list of all documentation files as clickable tabs
- **Content area** — rendered markdown (headers, tables, code blocks, links, lists, blockquotes, horizontal rules)
- Built-in inline markdown-to-HTML renderer (no external dependencies)
- **Logo header** — LineSolv SVG logo at the top of the sidebar
- **Async loading** — document list and content fetched from embedded Go backend
- **Caching** — loaded documents are cached in memory for instant re-opening
- **Offline** — all docs embedded in the Go binary, no internet connection required
- **Default** — User Guide opens automatically on first launch
- **Text selection** — content area allows user-select for copying
- Opens via the book icon in the title bar; closes on Escape or close button

### SettingsModal

4-tab settings panel:
- **General** — font family (dropdown) and font size (slider/input) with live preview
- **Theme** — 7 built-in color themes + plugin themes with color swatch thumbnails (surface, accent, text colors)
- **Keyboard Shortcuts** — view and rebind all shortcuts; reset to defaults button
- **About** — version info, author, repo links, check for updates

Opened via `Ctrl/Cmd+,` or the gear icon in the title bar. Settings are saved to the backend and persisted in `config.toml`.

## Printing

Printing is triggered by the print icon in the TitleBar or `Ctrl/Cmd+P`. The `onPrint` callback in `App.ts` builds a self-contained HTML document inside a hidden iframe and calls `iframe.contentWindow!.print()`.

The print document contains:
- A **header** with the currently active note name
- An HTML **table** of all input lines and their results (65%/35% width split)
- A **watermark** (`position: fixed; bottom: 10mm; left: 15mm`) with the LineSolv logo SVG and "LineSolv" text at 15% opacity — uses `position: fixed` to repeat on every printed page
- A **date footer** (`position: fixed; bottom: 10mm; right: 15mm`)

The iframe approach was chosen because:
1. It provides a clean, standalone document with `body` as the root, ensuring `position: fixed` elements repeat reliably on every printed page
2. The print content is fully isolated from the app's screen UI
3. All styles are inlined in the iframe document for self-containment

A fallback `@media print` CSS block hides the screen chrome if the browser's native print dialog is triggered directly.

## Toast Notifications

A lightweight toast notification system (`utils/toast.ts`) provides non-modal feedback:
- Three types: `success` (green), `error` (red), `info` (indigo)
- Auto-dismiss after 2500ms (configurable)
- Slide-in animation from the right
- Wired to note create/rename/delete/export/import and clipboard copy actions

## Undo / Redo

Custom 200-entry undo/redo stack (`utils/shortcuts.ts`) replaces the deprecated `document.execCommand('undo'/'redo')`:
- `pushSnapshot()` captures textarea state on every keystroke before input events fire
- `undo()` restores previous state; `redo()` restores the undone state
- Bound to Ctrl/Cmd+Z (undo) and Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y (redo)
- Stacks are per-textarea-instance via `Map<HTMLTextAreaElement, string[]>`

## Loading Spinner

A CSS-animated spinner appears when evaluation takes >60ms (prevents flicker on fast operations):
- Created in `App.ts` as a 16px spinning ring (border + `@keyframes spin`)
- Positioned at the bottom center of the notepad
- Visibility toggled by `CalculatorStore.evalState` subscription

## Accessibility

- **ARIA labels**: 15+ `aria-label` attributes across TitleBar (9), NotesPanel (3), HistoryPanel (1), GraphPanel (1), plus `role="menu"` on ContextMenu
- **Focus rings**: `:focus-visible` outlines all interactive elements in theme accent color; `:focus:not(:focus-visible)` hides mouse-focus outlines
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables all animations and transitions for accessibility
- **Input limit**: Textarea enforces 10,000 character `maxLength`

## Styling

### Tailwind CSS v4

Configured via the `@tailwindcss/vite` Vite plugin in `vite.config.ts`. No `tailwind.config.js` or PostCSS is used — Tailwind v4 uses CSS-first configuration.

### CSS Custom Properties

All theme colors are defined as CSS custom properties in `style.css`. The `:root` block defines the dark theme defaults, and each `.theme-*` class overrides for its palette:

```css
:root {
  --surface: #18181b;
  --surface-secondary: #27272a;
  --accent: #a78bfa;
}

:root.theme-light {
  --surface: #fafafa;
  --accent: #7c3aed;
}

:root.theme-neon {
  --surface: #0a0a0a;
  --accent: #00ff41;
}
```

The active theme is set by adding a `theme-{name}` class to `<html>`. Font settings (`--calc-font-size`, `--calc-font-family`, `--calc-font-color`) are applied as inline style properties on `<html>`.

**7 built-in themes**: dark, light, neon, red, obsidian, plasma, blood. Plugin themes are injected at runtime as additional CSS custom properties, making them selectable in Settings alongside built-in themes.

### Custom Scrollbar

Scrollbars are hidden globally (kept functional via `overflow: auto`) since the app uses a custom frameless window with no native scrollbar chrome.

### Theme Transitions

Interactive elements (buttons, panels, notes, toggles) use `transition: background 0.15s ease, border-color 0.15s ease` for smooth theme switching. Panel slide-in/slide-out animations use `transition-all duration-150 ease-out`.

### Document Viewer Styles

The `#docs-viewer` block defines styles for rendered markdown content: headers, paragraphs, code blocks, tables, lists, links, blockquotes, and horizontal rules — all using CSS custom properties for theme integration.

### Text Selection

Docs viewer content and plugin detail content allow user text selection (`-webkit-user-select: text; user-select: text`), while the main calculator UI remains non-selectable (`select-none` on the root).

## Wails Bindings

Auto-generated TypeScript bindings in `frontend/wailsjs/go/service/` are imported statically:

```typescript
import * as serviceBindings from '../wailsjs/go/service/AppService';
```

Available methods:

| Method | Returns |
|---|---|
| `EvaluateAll(text)` | `string[]` |
| `EvaluateLine(text)` | `string` |
| `EvaluateGraph(text)` | `GraphResult \| null` |
| `GetSteps(text)` | `EvalDetail` |
| `GetVariables()` | `Record<string, number>` |
| `ClearVariables()` | `void` |
| `GetHistory()` | `HistoryEntry[]` |
| `ClearHistory()` | `void` |
| `GetAllNotes()` | `Note[]` |
| `CreateNote()` | `Note` |
| `GetNote(id)` | `Note` |
| `RenameNote(id, name)` | `void` |
| `DeleteNote(id)` | `void` |
| `SaveNoteContent(id, content)` | `void` |
| `ReorderNotes(ids)` | `void` |
| `ExportNote(id, format)` | `string` |
| `ExportNoteToFile(id, format)` | `void` |
| `ImportNoteFromFile()` | `Note` |
| `GetDataDir()` | `string` |
| `GetSettings()` | `SettingsData` |
| `SaveSettings(settings)` | `void` |
| `GetDeleteWithoutConfirm()` | `bool` |
| `SetDeleteWithoutConfirm(val)` | `void` |
| `GetAppVersion()` | `string` |
| `CheckForUpdate()` | `UpdateInfo` |
| `GetDocList()` | `string[]` |
| `GetDocContent(name)` | `string` |
| `GetPlugins()` | `PluginInfo[]` |
| `SetPluginEnabled(name, enabled)` | `void` |
| `ReloadPlugins()` | `void` |
| `InstallPlugin(pluginsDir, pluginDir, manifestJSON)` | `void` |
| `RemovePlugin(pluginsDir, pluginDir)` | `void` |
| `GetPluginThemes()` | `ThemeDef[]` |
| `GetPluginsDir()` | `string` |
| `GetCurrencyCacheInfo()` | `CurrencyCacheInfo` |
| `UpdateCurrencyRates()` | `CurrencyCacheInfo` |
