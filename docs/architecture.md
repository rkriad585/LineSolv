# Architecture

LineSolv is a cross-platform desktop application built with the **Wails v2** framework. A Go backend serves as the computation engine and plugin runtime, while a TypeScript frontend renders the UI in a WebView via Vite + Tailwind CSS v4.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│  Wails v2 (Go)                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │  main.go                                            ││
│  │  ├─ service.AppService (bound to frontend)          ││
│  │  │   ├─ app/calculator.Engine                       ││
│  │  │   │   └─ PEMDAS parser, units, functions, vars   ││
│  │  │   └─ app/plugin.PluginRuntime                    ││
│  │  │       └─ Goja JS VM for community plugins        ││
│  │  └─ wails.Run(...)                                  ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  Frontend (WebView)                                     │
│  ┌─────────────────────────────────────────────────────┐│
│  │  TypeScript + Vite                                  ││
│  │  ├─ App.ts (orchestrator)                          ││
│  │  ├─ components/ (TitleBar, CalculatorInput, etc)    ││
│  │  ├─ style.css (Tailwind v4 + CSS vars)              ││
│  │  └─ wailsjs/go/service/ (auto-generated bindings)   ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Go Backend

### `main.go`
Minimal entrypoint. Creates the service, loads plugins from disk, then calls `wails.Run`. The `AppService` is bound to the frontend, making its methods callable from JavaScript.

### `app/service/`
Wails-bound service layer exposing:
- `EvaluateLine(input string) (string, error)`
- `EvaluateAll(input string) []string`
- `GetVariables() map[string]float64`
- `ClearVariables()`
- `LoadPlugins(dirs []string) (int, error)`

### `app/calculator/`
The natural-language arithmetic engine. Recursive descent PEMDAS parser, unit conversion database, built-in math functions, variable storage, and natural language preprocessing pipeline.

### `app/plugin/`
Goja-based JavaScript runtime that loads `.js` plugin files from `plugins/` and `plugins/CommunityExtensions/`. Each plugin is wrapped in an IIFE for scope isolation. Plugins register units, functions, and variables via the `numi` API object.

## TypeScript Frontend

### `App.ts`
Orchestrator that wires all UI components, manages application state (notes, dark mode, eval versioning), schedules debounced evaluation calls to the Go backend, and handles keyboard shortcuts.

### Components
- **TitleBar** — Frameless drag region with app title and action buttons (theme, notes, variables)
- **CalculatorInput** — Textarea with synchronized line-number gutter
- **ResultDisplay** — Right-aligned results column synced with input scroll
- **NotesPanel** — Collapsible sidebar for managing multiple calculation notes
- **VariableExplorer** — Collapsible sidebar showing defined variables

### Theming
Dark/light mode via CSS custom properties on `:root` / `:root.light`. No Tailwind `dark:` variant used — all colors are driven by `--surface`, `--text`, `--accent`, etc.

### Communication
The frontend imports auto-generated TypeScript bindings from `frontend/wailsjs/go/service/` as static imports. Each backend call is `async/await` wrapped. A retry loop on startup waits for the Wails runtime to become ready.

## Plugin System

Plugins are standard JavaScript files placed in `plugins/` or `plugins/CommunityExtensions/`. They use the `numi` global object:

```js
numi.addUnit({
  id: 'myunit',
  phrases: 'myunit,myu',
  format: 'MyUnit',
  ratio: 0.5
});

numi.addFunction({
  id: 'myfunc',
  description: 'My custom function'
}, function(args) {
  return args[0].double * 2;
});

numi.setVariable('varname', 42);
```

See [plugin-system.md](plugin-system.md) for details.
