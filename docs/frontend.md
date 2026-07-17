# Frontend

The frontend is a vanilla TypeScript application served in a Wails WebView. It uses **Vite** as the build tool and **Tailwind CSS v4** for utility-first styling. There is no framework — all 15 components use class-based, imperative DOM manipulation.

## Entry Point

`frontend/src/main.ts` — Minimal bootstrap that imports `style.css` and calls `renderApp(document.body)` from `App.ts`.

### Splash Screen

On startup, `App.ts` appends a `#splash-screen` div to `document.body` before any components are created. DOM structure:

```
#splash-screen
  ├─ <svg> (logo)
  ├─ <span> (app name "LineSolv")
  └─ #splash-bar (animated loading bar)
```

The splash screen is removed from the DOM after initialization completes, using an opacity fade transition (opacity 0 → remove).

## App Orchestrator (`App.ts`)

`App.ts` (≈720 lines) is the central controller. It:

1. Creates and wires all 15 UI components
2. Creates a `CalculatorStore` for reactive state management
3. Schedules debounced (150ms) calls to `EvaluateAll` on each input change
4. Handles keyboard shortcuts (global and textarea-specific)
5. Runs a retry loop on startup (20 attempts, 100ms apart) waiting for the Wails runtime
6. Detects stale results via an `evalVersion` counter — if a new evaluation starts before the previous completes, the old result is discarded
7. Loads settings (theme, font, opacity, line numbers, autocomplete, animations, toast, plugin themes, result panel visibility, line wrap) on startup and applies them
8. Manages note CRUD, auto-save (500ms debounce), dirty-state tracking, and import/export
9. Manages plugin themes by injecting CSS custom properties at runtime
10. Coordinates panel cross-closing — `switchNote()`, `onToggleNotes`, `onToggleDocs`, `onTogglePlugins`, `handleNewNote` all close conflicting panels before opening the target panel

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
  ├─ append splash screen (#splash-screen) to document.body
  │   └─ contains: logo SVG, app name, animated loading bar (#splash-bar)
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
       ├─ apply result_panel_enabled → results.el.style.display
       ├─ apply line_wrap_enabled → CalculatorInput.setLineWrap()
       └─ evaluateAll()
       └─ remove splash screen with opacity fade
```

## State Management

State is managed through `CalculatorStore` (`stores/calculator.ts`), a reactive store with a subscriber pattern:

```typescript
interface StoreState {
  input: string; // current textarea content
  results: string[]; // per-line result strings
  variables: Record<string, number>; // name → value map
  evalState: 'idle' | 'loading' | 'error';
  error: string | null; // error message or null
  history: HistoryEntry[]; // {input, output} entries
  historyIndex: number; // current position in history nav
}
```

State updates use immutable spread (`{ ...state, field: newVal }`). All subscribers receive the full state on every change. `pushHistory` appends an entry and resets `historyIndex`. `navigateHistory` walks the history array in reverse order (most recent first).

`SettingsStore` (`stores/settings.ts`) is a separate reactive store for application settings. It manages theme, font, opacity, line numbers, autocomplete, animations, toast, `result_panel_enabled`, and `line_wrap_enabled` preferences. Changes are debounced (50ms) and auto-saved to the backend. Subscribers are notified on every state change.

`NotesManager` (`stores/notes.ts`) manages multiple notes in memory with active-note tracking, sort state (field: name/created/updated, direction: asc/desc), and CRUD operations.

## Keyboard Shortcuts

| Shortcut                                | Action                                            |
| --------------------------------------- | ------------------------------------------------- |
| `Tab`                                   | Insert 2 spaces                                   |
| `Shift+Enter`                           | Force-evaluate immediately                        |
| `Esc`                                   | Close open modal/panel; if none open, clear input |
| `F11`                                   | Toggle fullscreen                                 |
| `Ctrl/Cmd + Z`                          | Undo (custom 200-entry stack)                     |
| `Ctrl/Cmd + Shift + Z` / `Ctrl/Cmd + Y` | Redo                                              |
| `Ctrl/Cmd + D`                          | Duplicate line or selection                       |
| `Ctrl/Cmd + L`                          | Select current line                               |
| `Ctrl/Cmd + Shift + K`                  | Delete current line                               |
| `Alt + Shift`                           | Toggle case (lower → UPPER → Title)               |
| `Alt + ↑ / ↓`                           | Move line up/down                                 |
| `Alt + ← / →`                           | Jump word left/right (native)                     |
| `Home / End`                            | Start/end of line (native)                        |
| `Ctrl/Cmd + Home / End`                 | Start/end of text (native)                        |
| `Page Up / Page Down`                   | Scroll page (native)                              |
| `↑ / ↓ / ← / →`                         | Cursor navigation (native)                        |
| `Ctrl/Cmd + N`                          | New note                                          |
| `Ctrl/Cmd + B`                          | Toggle notes sidebar                              |
| `Ctrl/Cmd + I`                          | Toggle variables sidebar                          |
| `Ctrl/Cmd + H`                          | Toggle history sidebar                            |
| `Ctrl/Cmd + S`                          | Toggle steps panel                                |
| `Ctrl/Cmd + K`                          | Clear all (input + variables + history)           |
| `Ctrl/Cmd + P`                          | Print current note                                |
| `Ctrl/Cmd + ,`                          | Open settings                                     |
| `Ctrl/Cmd + ↑`                          | Navigate history back                             |
| `Ctrl/Cmd + ↓`                          | Navigate history forward                          |
| `Ctrl/Cmd + /`                          | Show keyboard shortcut reference                  |
| `Ctrl/Cmd + F`                          | Focus notes search input                          |
| `Ctrl/Cmd + J`                          | Toggle documentation viewer                       |
| `Ctrl/Cmd + `` `                        | Toggle settings                                   |

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
- **Menu dropdown** (`menuEl`) — dropdown containing Documentation, Print, Plugins, and Settings items
- **Double-click** on the drag region toggles fullscreen

The `<header>` element carries `--wails-draggable:drag` for frameless window dragging; all buttons and their container divs override with `--wails-draggable:no-drag` so clicks on them pass through without initiating a drag.

**`closeMenu()`** — Dismisses the menu dropdown. Called automatically on outside click, Escape key, or after a menu item is selected.

### CalculatorInput

The main input area consisting of:

- **Gutter** (`#gutter`) — line numbers, synced scroll with textarea, virtualized
- **Textarea** (`#input-area`) — free-form natural language input

Wrapped in a flex row container (`#notepad`). The textarea emits `input` events that trigger `scheduleEval()`.

**`setLineWrap(enabled)`** — Toggles word wrapping on the textarea. When enabled, sets `textarea.wrap = "soft"` and applies `white-space: pre-wrap` / `overflow-x: hidden` CSS. When disabled, sets `textarea.wrap = "off"` and applies `white-space: pre` / `overflow-x: auto`. The gutter measurement element recalculates visual line counts after the wrap mode changes.

**Gutter virtualization**: The gutter only creates DOM elements for lines visible in the viewport (with 5-line overscan) rather than for every line in the input. Uses a hidden measurement element to compute visual line counts for word-wrapped lines. Continuation lines (wrapped lines) show a middle dot (`·`) instead of a line number. `DocumentFragment` + `replaceChildren()` is used for atomic DOM updates (no empty-gutter flash). `requestAnimationFrame` throttles viewport updates. An early return guard (`clientHeight === 0`) avoids unnecessary rebuilds when the gutter is not visible.

### ResultDisplay

A `<div>` column to the right of the textarea. Results are rendered as HTML with color-coded variable names (`--text-muted`) and values (`--accent`). The column scroll is synced with the textarea's scroll. Visibility is toggled via the `result_panel_enabled` setting, which sets `results.el.style.display` to show or hide the `#results-column` element. Supports three display states:

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
- Switch Note items in the main context menu show a checkmark icon (`✓`) for the currently active note
- All label text is escaped via `escapeHtml()`

### Panel Cross-Closing

Opening any sidebar or panel automatically closes conflicting panels to avoid overlap:

- `switchNote()` closes notes panel if it was triggered from context menu
- `onToggleNotes` closes docs, plugins, and settings panels
- `onToggleDocs` closes notes, plugins, and settings panels
- `onTogglePlugins` closes notes, docs, and settings panels
- `handleNewNote` closes conflicting panels and creates a new note

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

### AutocompletePopup

Floating keyword suggestion popup that appears near the caret position in the textarea:

- Displays up to **8 visible items** from 6 categories: functions, variables, units, constants, keywords, and plugin functions
- Uses **prefix matching** against data from the `GetAutocompleteKeywords` backend method
- **Keyboard navigation**: arrow keys to move selection, Tab to accept, Esc to dismiss
- Auto-hides when input is empty or no matches found
- Positioned dynamically to stay within viewport bounds

### SettingsModal

5-tab settings panel:

- **General** — font family (dropdown), font size (slider/input), opacity (slider 30%-100%), line numbers toggle, autocomplete toggle, animations toggle, toast notifications toggle, result panel toggle, line wrap toggle, with live preview
- **Theme** — 27 built-in color themes + plugin themes with color swatch thumbnails (surface, accent, text colors)
- **Keyboard Shortcuts** — view and rebind all shortcuts; reset to defaults button
- **About** — version info, author, repo links, check for updates

Opens via `Ctrl/Cmd+,`, `` Ctrl/Cmd+` ``, or the gear icon in the title bar. Settings auto-save on every change with 50ms debounce and apply immediately (real-time).

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

**27 built-in themes**: dark, light, neon, red, obsidian, plasma, blood, midnight, aurora, mono, frost, prism, lavender, sage, warm-light, blue-trust-dark, blue-trust-light, orange-energy-dark, orange-energy-light, green-growth-dark, green-growth-light, yellow-optimism-dark, yellow-optimism-light, purple-innovation-dark, purple-innovation-light, red-passion-dark, red-passion-light. Plugin themes are injected at runtime as additional CSS custom properties, making them selectable in Settings alongside built-in themes.

### CSS Custom Properties Across Components

All 26 previously hardcoded values (border-radius, box-shadow, font-family) across 11 component files have been replaced with CSS custom properties (`var(--ui-radius-*)`, `var(--ui-shadow-*)`, `var(--ui-font-display)`). This ensures every UI style applies consistently to all components — toast notifications, plugin cards, confirm dialogs, toggle switches, and all other UI elements respond to the active style without per-component overrides.

### Material 3 UI Tokens

When the Material 3 (Material) UI style is active, the following tokens are available:

**Typography:**

- `--ui-font-display: 'Inter', sans-serif`

**Radius tokens:**

- `--ui-radius-xs: 4px`
- `--ui-radius-sm: 6px`
- `--ui-radius-md: 8px`
- `--ui-radius-lg: 12px`
- `--ui-radius-xl: 16px`
- `--ui-radius-full: 9999px`

**Material 3 color tokens:**

- `--md-primary` / `--md-on-primary` / `--md-primary-container` / `--md-on-primary-container`
- `--md-secondary` / `--md-on-secondary` / `--md-secondary-container` / `--md-on-secondary-container`
- `--md-tertiary` / `--md-on-tertiary` / `--md-tertiary-container` / `--md-on-tertiary-container`
- `--md-surface` / `--md-on-surface` / `--md-surface-variant` / `--md-on-surface-variant`
- `--md-outline` / `--md-outline-variant`

**Material 3 elevation:** Tonal elevation is implemented via a `::before` overlay on elevated surfaces. State layers provide hover (8% opacity) and press (10% opacity) feedback. FAB uses 56dp sizing, and chips use 32dp height.

### Style-Specific CSS Rules

Each UI style can define component-specific overrides. The following components have dedicated style-specific rules:

- **Toast notifications** (`.toast-item`) — style-specific border-radius, background, and shadow
- **Plugin panel** (`#plugin-viewer`, `.plugin-card`) — style-specific card styling and panel chrome
- **Confirm dialog** (`#confirm-dialog`) — style-specific dialog frame and button styling
- **Toggle switches** (`.toggle-track`, `.toggle-thumb`) — style-specific track/thumb sizing and colors

### Custom Scrollbar

Scrollbars are hidden globally (kept functional via `overflow: auto`) since the app uses a custom frameless window with no native scrollbar chrome.

### CVD-Safe Status Tokens

Status tokens (`--color-error`, `--color-success`, `--color-warning`, `--color-info`) are defined per-theme and pass WCAG contrast checks for color-vision-deficient users. These ensure that error, success, warning, and info states remain distinguishable regardless of the active theme.

### Tinted Gray Scale

A tinted gray scale (`--gray-50` through `--gray-950`) provides warm/cool-tinted neutrals rather than pure grays, ensuring visual harmony with each theme's palette. Each theme defines its own gray scale to match its color temperature.

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

| Method                                               | Returns                  |
| ---------------------------------------------------- | ------------------------ |
| `EvaluateAll(text)`                                  | `string[]`               |
| `EvaluateLine(text)`                                 | `string`                 |
| `EvaluateGraph(text)`                                | `GraphResult \| null`    |
| `GetSteps(text)`                                     | `EvalDetail`             |
| `GetVariables()`                                     | `Record<string, number>` |
| `ClearVariables()`                                   | `void`                   |
| `GetHistory()`                                       | `HistoryEntry[]`         |
| `ClearHistory()`                                     | `void`                   |
| `GetAllNotes()`                                      | `Note[]`                 |
| `CreateNote()`                                       | `Note`                   |
| `CreateNoteInFolder(folderID)`                       | `Note`                   |
| `GetNote(id)`                                        | `Note`                   |
| `RenameNote(id, name)`                               | `void`                   |
| `DeleteNote(id)`                                     | `void`                   |
| `SaveNoteContent(id, content)`                       | `void`                   |
| `ReorderNotes(ids)`                                  | `void`                   |
| `UpdateNoteIcon(id, icon)`                           | `void`                   |
| `MoveNoteToFolder(noteID, folderID)`                 | `void`                   |
| `CreateFolder(name, parentID)`                       | `Folder`                 |
| `GetAllFolders()`                                    | `Folder[]`               |
| `RenameFolder(id, name)`                             | `void`                   |
| `DeleteFolder(id)`                                   | `void`                   |
| `MoveFolder(id, newParentID)`                        | `void`                   |
| `UpdateFolderIcon(id, icon)`                         | `void`                   |
| `ReorderFolders(folderIDs)`                          | `void`                   |
| `UniqueFolderName(parentID)`                         | `string`                 |
| `ExportNote(id, format)`                             | `string`                 |
| `ExportNoteToFile(id, format)`                       | `void`                   |
| `ImportNoteFromFile()`                               | `Note`                   |
| `GetDataDir()`                                       | `string`                 |
| `GetSettings()`                                      | `SettingsData`           |
| `SaveSettings(settings)`                             | `void`                   |
| `GetDeleteWithoutConfirm()`                          | `bool`                   |
| `SetDeleteWithoutConfirm(val)`                       | `void`                   |
| `GetAppVersion()`                                    | `string`                 |
| `GetDocList()`                                       | `string[]`               |
| `GetDocContent(name)`                                | `string`                 |
| `GetPlugins()`                                       | `PluginInfo[]`           |
| `SetPluginEnabled(name, enabled)`                    | `void`                   |
| `ReloadPlugins()`                                    | `void`                   |
| `InstallPlugin(pluginsDir, pluginDir, manifestJSON)` | `void`                   |
| `RemovePlugin(pluginsDir, pluginDir)`                | `void`                   |
| `GetPluginThemes()`                                  | `ThemeDef[]`             |
| `GetPluginsDir()`                                    | `string`                 |
| `GetAutocompleteKeywords()`                          | `AutocompleteItem[]`     |
| `GetCurrencyCacheInfo()`                             | `CurrencyCacheInfo`      |
| `UpdateCurrencyRates()`                              | `CurrencyCacheInfo`      |
