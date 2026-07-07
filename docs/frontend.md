# Frontend

The frontend is a vanilla TypeScript application served in a Wails WebView. It uses **Vite** as the build tool and **Tailwind CSS v4** for utility-first styling.

## Entry Point

`frontend/src/main.ts` — Minimal bootstrap that imports `style.css` and calls `renderApp()` from `App.ts`.

## App Orchestrator (`App.ts`)

`App.ts` is the central controller. It:

1. Creates and wires all UI components
2. Creates a `CalculatorStore` for reactive state management
3. Schedules debounced (150ms) calls to `EvaluateAll` on each input change
4. Handles keyboard shortcuts (global and textarea-specific)
5. Runs a retry loop on startup (20 attempts, 100ms apart) waiting for the Wails runtime
6. Handles stale-result detection via an `evalVersion` counter — if a new evaluation starts before the previous one completes, the old result is discarded
7. Loads settings (theme, font, shortcuts) on startup and applies them
8. Applies theme by setting a `theme-{name}` class on `<html>`

### State Management

State is managed through `CalculatorStore` (`stores/calculator.ts`), a reactive store with a subscriber pattern:

- **Input** — current textarea content
- **Results** — per-line result strings
- **Variables** — name → value map
- **EvalState** — `'idle' | 'loading' | 'error'`
- **Error** — error message string or null
- **History** — array of `{input, output}` entries
- **HistoryIndex** — current position in history nav

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Tab` | Insert 2 spaces |
| `Shift+Enter` | Force-evaluate immediately |
| `Esc` | Clear input; if empty, close open panel |
| `F11` | Toggle fullscreen |
| `Ctrl/Cmd + Z` | Undo (native) |
| `Ctrl/Cmd + Y` | Redo (native) |
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
| `Ctrl/Cmd + K` | Clear all (input + variables + history) |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + ↑` | Navigate history back |
| `Ctrl/Cmd + ↓` | Navigate history forward |
| `Ctrl/Cmd + /` | Show keyboard shortcut reference |

## UI Components

### TitleBar

Frameless drag region at the top of the window. Contains:
- **Window controls**: Close, Minimize, Maximize
- **LineSolv** title (uppercase, tracked) centered in the drag region
- **Notes** button (clipboard SVG, toggles sidebar)
- **Variables** button (code SVG, toggles sidebar)
- **History** button (clock SVG, toggles sidebar)
- **Settings** button (gear SVG, opens settings)
- **Double-click** on the drag region toggles fullscreen

Uses `--wails-draggable:drag` CSS property for frameless window dragging. No theme toggle button — themes are managed exclusively in Settings.

### CalculatorInput

The main input area consisting of:
- **Gutter** (`#gutter`) — line numbers, synced scroll with textarea
- **Textarea** (`#input-area`) — free-form natural language input

Wrapped in a flex row container (`#notepad`). The textarea emits `input` events that trigger `scheduleEval()`.

### ResultDisplay

A `<div>` column to the right of the textarea. Results are rendered as HTML with color-coded variable names (`--text-muted`) and values (`--accent`). The column scroll is synced with the textarea's scroll. Supports three display states:

- **Loading** — shows `…` for each line during evaluation (pulsing disabled)
- **Empty** — shows non-breaking space for blank/comment lines
- **Result** — formatted result or empty for errors

### NotesPanel

Collapsible sidebar (left side) for managing multiple calculation notes:
- **Note list** — clickable note names, active note highlighted
- **+ New Note** button
- Opens/closes via width animation (0px ↔ 200px)
- Keyboard shortcut: `⌘B`

### VariableExplorer

Collapsible sidebar (right side) showing defined variables:
- Sorted alphabetically
- Displays variable name (accent color) and value (muted)
- Shows "No variables" when empty
- Opens/closes via width animation (0px ↔ 180px)
- Keyboard shortcut: `⌘I`

### HistoryPanel

Collapsible sidebar (left side, before notes) showing evaluation history:
- Each entry shows the input text (monospace, truncated at 40 chars) and its result
- Click any entry to restore its input into the textarea and re-evaluate
- Opens/closes via width animation (0px ↔ 200px)
- Keyboard shortcut: `⌘H`
- Automatically subscribes to store changes and re-renders when open

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

### SettingsModal

4-tab settings panel:
- **General** — font family and font size with live preview
- **Theme** — 7 color themes with color swatch thumbnails
- **Keyboard Shortcuts** — view and rebind all shortcuts
- **About** — version info, author, repo links, check for updates

Opened via `Ctrl/Cmd+,` or the gear icon in the title bar. Settings are saved to the backend and persisted in `config.toml`.

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

The active theme is set by adding a `theme-{name}` class to `<html>`. Font settings (`--calc-font-size`, `--calc-font-family`) are applied as inline style properties.

### Custom Scrollbar

Thin custom scrollbar (5px) using `::-webkit-scrollbar` pseudo-elements, colored with `--text-subtle` and `--text-muted`.

## Wails Bindings

Auto-generated TypeScript bindings in `frontend/wailsjs/go/service/` are imported statically:

```typescript
import * as serviceBindings from '../wailsjs/go/service/AppService';
```

Available methods:
- `serviceBindings.EvaluateAll(text)` → `string[]`
- `serviceBindings.EvaluateLine(text)` → `string`
- `serviceBindings.GetVariables()` → `Record<string, number>`
- `serviceBindings.ClearVariables()` → `void`
- `serviceBindings.GetHistory()` → `HistoryEntry[]`
- `serviceBindings.ClearHistory()` → `void`
- `serviceBindings.GetAllNotes()` → `Note[]`
- `serviceBindings.CreateNote()` → `Note`
- `serviceBindings.CreateNoteWithContent(content)` → `Note`
- `serviceBindings.RenameNote(id, name)` → `void`
- `serviceBindings.DeleteNote(id)` → `void`
- `serviceBindings.SaveNoteContent(id, content)` → `void`
- `serviceBindings.GetNote(id)` → `Note`
- `serviceBindings.ExportNote(id, format)` → `string`
- `serviceBindings.ExportNoteToFile(id, format)` → `void`
- `serviceBindings.ImportNoteFromFile()` → `Note`
- `serviceBindings.GetDeleteWithoutConfirm()` → `bool`
- `serviceBindings.SetDeleteWithoutConfirm(val)` → `void`
- `serviceBindings.GetSettings()` → `SettingsData`
- `serviceBindings.SaveSettings(settings)` → `void`
- `serviceBindings.GetAppVersion()` → `string`
- `serviceBindings.CheckForUpdate()` → `UpdateInfo`
