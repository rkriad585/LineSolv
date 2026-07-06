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
| `⌘N` / `Ctrl+N` | New note |
| `⌘B` / `Ctrl+B` | Toggle notes sidebar |
| `⌘I` / `Ctrl+I` | Toggle variables sidebar |
| `⌘K` / `Ctrl+K` | Clear all (input + variables + history) |
| `Shift+Enter` | Force-evaluate immediately |
| `Esc` | Clear input; if empty, close open sidebar |
| `⌘↑` / `Ctrl+↑` | Navigate history back |
| `⌘↓` / `Ctrl+↓` | Navigate history forward |
| `Tab` | Insert 2 spaces |

## UI Components

### TitleBar

Frameless drag region at the top of the window. Contains:
- **LineSolv** title (uppercase, tracked)
- **Theme toggle** button (moon/sun SVG icon)
- **Notes** button (clipboard SVG, toggles sidebar)
- **Variables** button (code SVG, toggles sidebar)

Uses `data-wails-drag` attribute for frameless window dragging.

### CalculatorInput

The main input area consisting of:
- **Gutter** (`#gutter`) — line numbers, synced scroll with textarea
- **Textarea** (`#input-area`) — free-form natural language input

Wrapped in a flex row container (`#notepad`). The textarea emits `input` events that trigger `scheduleEval()`.

### ResultDisplay

A `<div>` column to the right of the textarea. Results are rendered as HTML with color-coded variable names (`--text-muted`) and values (`--accent`). The column scroll is synced with the textarea's scroll. Supports three display states:

- **Loading** — shows `…` for each line during evaluation
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

## Styling

### Tailwind CSS v4

Configured via the `@tailwindcss/vite` Vite plugin in `vite.config.ts`. No `tailwind.config.js` or PostCSS is used — Tailwind v4 uses CSS-first configuration.

### CSS Custom Properties

All theme colors are defined as CSS custom properties in `style.css`. The `:root` block defines the dark theme, and `:root.light` overrides for light mode:

```css
:root {
  --surface: #18181b;
  --surface-secondary: #27272a;
  --accent: #a78bfa;
}

:root.light {
  --surface: #fafafa;
  --accent: #7c3aed;
}
```

The theme is toggled by adding/removing the `light` class on `<html>`.

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
