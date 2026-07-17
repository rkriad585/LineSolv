# API Reference

The Go backend exposes methods to the TypeScript frontend through auto-generated Wails bindings. These are imported from `frontend/wailsjs/go/service/AppService`.

All methods are bound via the Wails `Bind` option in `main.go` and are available as async functions in the frontend.

---

## `EvaluateAll`

```typescript
function EvaluateAll(input: string): Promise<string[]>;
```

Evaluates every line of the input string. Each line is processed independently. Variables persist across lines. Empty lines and comment lines (`#`, `//`) return empty strings. Lines ending with `:` (labels) also return empty strings.

**Parameters:**

- `input` — Multi-line string, lines separated by `\n`

**Returns:**

- `string[]` — Array of result strings, one per line. Empty string for no result or evaluation errors.

**Limits:**

- Input length: max 10,000 characters per line
- Evaluation timeout: 5 seconds per call (returns `["Error: evaluation timed out"]`)

**Example:**

```typescript
const results = await svc.EvaluateAll('x = 10\nx * pi\ntwenty five + 3');
// results: ["x = 10", "31.4159", "28"]
```

---

## `EvaluateLine`

```typescript
function EvaluateLine(input: string): Promise<string>;
```

Evaluates a single line of natural-language arithmetic. Variables are preserved across calls. Empty lines, comment lines (`#`, `//`), and label lines (ending with `:`) return an empty string.

**Parameters:**

- `input` — Single line string

**Returns:**

- `string` — Result string, or empty string on error/unsupported input.

**Limits:**

- Input length: max 10,000 characters
- Evaluation timeout: 5 seconds (returns `"Error: evaluation timed out"`)

---

## `GetVariables`

```typescript
function GetVariables(): Promise<Record<string, number>>;
```

Returns all currently defined variables as a map of name to value.

**Returns:**

- `Record<string, number>` — Object with variable names as keys (lowercase) and float64 values.

**Example:**

```typescript
await svc.EvaluateAll('x = 42\ny = 100');
const vars = await svc.GetVariables();
// vars: { x: 42, y: 100 }
```

---

## `ClearVariables`

```typescript
function ClearVariables(): Promise<void>;
```

Clears all stored variables and resets the last-result context tracker.

---

## `GetHistory`

```typescript
interface HistoryEntry {
  input: string;
  output: string;
}

function GetHistory(): Promise<HistoryEntry[]>;
```

Returns the evaluation history — each entry records the input line and its computed result.

**Returns:**

- `HistoryEntry[]` — Array of `{ input, output }` objects, ordered chronologically (oldest first).

---

## `ClearHistory`

```typescript
function ClearHistory(): Promise<void>;
```

Clears all stored history entries.

---

## `GetSteps`

```typescript
interface Step {
  operation: string;
  expression: string;
  result: string;
}

interface EvalDetail {
  result: string;
  steps: Step[];
}

function GetSteps(input: string): Promise<EvalDetail>;
```

Evaluates a single expression and returns the intermediate computation steps. Does **not** modify engine state (no side effects on history or variables).

**Parameters:**

- `input` — Single expression string

**Returns:**

- `EvalDetail` with:
  - `result` — The final result string
  - `steps` — Ordered array of `Step` objects showing each parser-level reduction

**`Step` fields:**

- `operation` — The operation type (e.g. `"+"`, `"×"`, `"÷"`, `"^"`, `"mod"`)
- `expression` — The sub-expression being reduced
- `result` — The result of that reduction

**Limits:**

- Input length: max 10,000 characters
- Evaluation timeout: 5 seconds

**Example:**

```typescript
const detail = await svc.GetSteps('2 + 3 * 4');
// detail.result: "14"
// detail.steps: [
//   { operation: "×", expression: "3 * 4", result: "12" },
//   { operation: "+", expression: "2 + 12", result: "14" }
// ]
```

---

## `EvaluateGraph`

```typescript
interface Point {
  x: number;
  y: number;
}

interface GraphResult {
  points: Point[];
  expression: string;
  from: number;
  to: number;
}

function EvaluateGraph(input: string): Promise<GraphResult | null>;
```

Evaluates a graphing expression (`plot`, `graph`, `y =` syntax) and returns 200 sampled points across the expression's range.

**Parameters:**

- `input` — Graphing expression (e.g. `"plot x^2"`, `"graph sin(x) from -5 to 5"`)

**Supported prefixes:**

- `plot <expr>` — e.g. `plot x^2`
- `graph <expr>` — e.g. `graph sin(x)`
- `y = <expr>` — e.g. `y = 2*x + 3`

**Range specifiers:**

- `from N to N` at the end of the expression — e.g. `plot x^2 from -5 to 5`
- Default range: `-10` to `10`

**Returns:**

- `GraphResult | null` — Object with:
  - `points` — Array of 200 `{ x, y }` sampled points
  - `expression` — The cleaned expression (prefix and range stripped)
  - `from` — Start of the x range
  - `to` — End of the x range
- Returns `null` if the input is not a graph expression or evaluation fails.

**Limits:**

- Evaluation timeout: 5 seconds

**Example:**

```typescript
const graph = await svc.EvaluateGraph('plot x^2 from -2 to 2');
// graph.points: [{ x: -2, y: 4 }, { x: -1.98, y: 3.9204 }, ...]
// graph.expression: "x^2"
// graph.from: -2
// graph.to: 2
```

---

## `ReorderNotes`

```typescript
function ReorderNotes(noteIDs: string[]): Promise<void>;
```

Updates the position of notes to match the given order. All note IDs in the array must exist in the database.

**Parameters:**

- `noteIDs` — Array of note ID strings in the desired display order

**Example:**

```typescript
await svc.ReorderNotes(['uuid-3', 'uuid-1', 'uuid-2']);
```

---

## `UpdateCurrencyRates`

```typescript
interface CurrencyCacheInfo {
  cached: boolean;
  updatedAt: number; // Unix timestamp in milliseconds
  source: string; // "live", "cache", or "hardcoded"
}

function UpdateCurrencyRates(): Promise<CurrencyCacheInfo>;
```

Fetches live exchange rates from [exchangerate-api.com](https://api.exchangerate-api.com/v4/latest/USD). Falls back to cached rates on network failure. Rates are stored in the SQLite `currency_cache` table and applied to the calculator engine.

**Returns:**

- `CurrencyCacheInfo` with:
  - `cached` — `true` if rates are available (live or cached)
  - `updatedAt` — Unix timestamp in milliseconds of when rates were last updated
  - `source` — `"live"` if freshly fetched, `"cache"` if using cached rates, `"hardcoded"` if no cache exists

**Error handling:**

- Returns an error if the fetch fails and no cached rates are available

---

## `GetCurrencyCacheInfo`

```typescript
function GetCurrencyCacheInfo(): Promise<CurrencyCacheInfo>;
```

Returns the current currency cache status without attempting a refresh.

**Returns:**

- `CurrencyCacheInfo` — Same structure as `UpdateCurrencyRates`, but `source` is `"hardcoded"` when no cache exists.

---

## `GetDataDir`

```typescript
function GetDataDir(): Promise<string>;
```

Returns the application data directory path.

**Returns:**

- `string` — The data directory path (e.g. `~/.config/neostore/linesolv` on Linux/macOS, `%APPDATA%/neostore/linesolv` on Windows)

---

## `GetSettings`

```typescript
interface SettingsData {
  theme: string;
  font_size: string;
  font_family: string;
  shortcut_overrides: string; // JSON string
  opacity: string; // "0.30" to "1.00"
  line_numbers_enabled: string; // "true" or "false"
  autocomplete_enabled: string; // "true" or "false"
  animations_enabled: string; // "true" or "false"
  toast_enabled: string; // "true" or "false"
  result_panel_enabled: string; // "true" or "false"
  line_wrap_enabled: string; // "true" or "false"
  ui_style: string; // e.g. "default", "glass", "material"
  theme_manually_set: string; // "true" or "false" — whether user manually selected a theme
  noise: string; // "true" or "false" — background noise animation
  context_menu_notes: string; // "true" or "false"
  context_menu_folders: string; // "true" or "false"
  drag_and_drop: string; // "true" or "false"
  confirm_dialog: string; // "true" or "false"
}

function GetSettings(): Promise<SettingsData>;
```

Returns the current application settings loaded from `config.toml`.

**Returns:**

- `SettingsData` with theme name, font size, font family, shortcut overrides as a JSON string, opacity, line numbers toggle, autocomplete toggle, animations toggle, toast toggle, result panel toggle, line wrap toggle, UI style, theme manual override, noise animation, context menu toggles (notes/folders), drag-and-drop toggle, and confirm dialog toggle.

**Valid theme values (17 built-in):**
`dark`, `light`, `neon`, `red`, `obsidian`, `plasma`, `blood`, `midnight`, `aurora`, `mono`, `frost`, `prism`, `lavender`, `sage`, `warm-light`, `claude-dark`, `claude-light`

Plugin themes are also valid — their IDs are defined in each plugin's `plugin.json` manifest.

**Valid ui_style values (7 built-in):**
`default`, `nothing`, `glass`, `material`, `alivated`, `neon`, `claude`

---

## `SaveSettings`

```typescript
function SaveSettings(settings: SettingsData): Promise<void>;
```

Saves application settings to `config.toml`. In the frontend, settings auto-save on every change with a 50ms debounce and apply immediately (real-time pattern).

**Parameters:**

- `settings` — `SettingsData` object with the values to persist

---

## `GetAppVersion`

```typescript
function GetAppVersion(): Promise<string>;
```

Returns the current application version string (e.g. `"0.17.0"`).

---

## `CheckForUpdate`

```typescript
interface UpdateInfo {
  update_available: boolean;
  current_version: string;
  latest_version: string;
  download_url: string;
}

function CheckForUpdate(): Promise<UpdateInfo>;
```

Checks the GitHub repository for a newer version by fetching the `.version` file from the `main` branch.

**Returns:**

- `UpdateInfo` with:
  - `update_available` — `true` if the remote version differs from the local version
  - `current_version` — The local app version
  - `latest_version` — The remote version string
  - `download_url` — URL to the releases page

---

## `GetDeleteWithoutConfirm` / `SetDeleteWithoutConfirm`

```typescript
function GetDeleteWithoutConfirm(): Promise<boolean>;
function SetDeleteWithoutConfirm(v: boolean): Promise<void>;
```

Gets or sets the "Don't ask again" preference for note deletion confirmation. Stored in `config.toml` under `[behavior] -> delete_without_confirm`.

---

## Note Management Methods

```typescript
function GetAllNotes(): Promise<Note[]>;
function CreateNote(): Promise<Note>;
function CreateNoteInFolder(folderID: string): Promise<Note>;
function GetNote(id: string): Promise<Note>;
function RenameNote(id: string, name: string): Promise<void>;
function DeleteNote(id: string): Promise<void>;
function SaveNoteContent(id: string, content: string): Promise<void>;
function ExportNote(id: string, format: string): Promise<string>;
function ExportNoteToFile(id: string, format: string): Promise<string>;
function ImportNoteFromFile(): Promise<Note>;
function UpdateNoteIcon(id: string, icon: string): Promise<void>;
function MoveNoteToFolder(noteID: string, folderID: string): Promise<void>;
```

Where `Note` is:

```typescript
interface Note {
  id: string;
  name: string;
  content: string;
  icon: string; // Emoji or icon identifier
  createdAt: number; // Unix timestamp in milliseconds
  updatedAt: number; // Unix timestamp in milliseconds
  position: number; // Sort order
}
```

- `CreateNote()` generates a random fancy name (e.g. "Amber Fox")
- `CreateNoteInFolder(folderID)` creates a note inside the specified folder
- `UpdateNoteIcon(id, icon)` sets the emoji/icon for a note
- `MoveNoteToFolder(noteID, folderID)` moves a note into the specified folder
- `ExportNoteToFile()` opens a native Save As dialog; supported formats: `lv`, `txt`, `md`, `json`, `toml`, `pdf`
- `ImportNoteFromFile()` opens a native Open file dialog; supported formats: `lv`, `txt`, `md`, `json`, `toml`, `pdf`

---

## Folder Management Methods

```typescript
function CreateFolder(name: string, parentID: string): Promise<Folder>;
function GetAllFolders(): Promise<Folder[]>;
function RenameFolder(id: string, name: string): Promise<void>;
function DeleteFolder(id: string): Promise<void>;
function MoveFolder(id: string, newParentID: string): Promise<void>;
function UpdateFolderIcon(id: string, icon: string): Promise<void>;
function UniqueFolderName(parentID: string): Promise<string>;
function ReorderFolders(folderIDs: string[]): Promise<void>;
```

Where `Folder` is:

```typescript
interface Folder {
  id: string;
  name: string;
  parentId: string; // Empty string for root-level folders
  icon: string; // Emoji or icon identifier
  position: number; // Sort order
  createdAt: number; // Unix timestamp in milliseconds
  updatedAt: number; // Unix timestamp in milliseconds
}
```

- `CreateFolder(name, parentID)` creates a folder; pass `""` for `parentID` to create at root level
- `UniqueFolderName(parentID)` returns an auto-generated unique name for a new folder within the given parent
- `ReorderFolders(folderIDs)` updates folder positions to match the given order

---

## `GetAutocompleteKeywords`

```typescript
function GetAutocompleteKeywords(): Promise<string[]>;
```

Returns all available autocomplete keywords — built-in function names, constant names, and user-defined variable names. Used by the frontend `AutocompletePopup` to suggest completions as the user types.

**Returns:**

- `string[]` — Sorted array of keyword strings (e.g. `["abs", "acos", "asin", "atan", "avg", "cbrt", ...]`)

---

## Documentation Methods

```typescript
function GetDocList(): Promise<string[]>;
function GetDocContent(name: string): Promise<string>;
```

- `GetDocList()` — Returns sorted list of embedded documentation file names
- `GetDocContent(name)` — Returns the raw Markdown content of a documentation file

Docs are embedded at build time via Go's `embed` package from the `docs/` directory.

---

## Plugin Methods

### `GetPlugins`

```typescript
function GetPlugins(): Promise<PluginInfo[]>;
```

Returns all loaded plugins with their manifest data and enabled state.

**Returns:**

- `PluginInfo[]` — Array of plugin info objects:

```typescript
interface PluginInfo {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  dir: string; // Full path to the plugin directory
  enabled: boolean;
  error?: string; // Error message if the plugin failed to load
  functions?: FunctionDef[];
  themes?: ThemeDef[];
  variables?: VariableDef[];
}

interface FunctionDef {
  name: string;
  description: string;
  args: number; // -1 = variadic
  min_args: number;
  max_args: number; // -1 = unlimited
  expression?: string; // Math expression using a,b,c... as args
  builtin?: string; // Pre-defined operation name
  examples?: string[];
}

interface ThemeDef {
  id: string;
  label: string;
  colors: Record<string, string>; // 14 CSS custom properties
}

interface VariableDef {
  name: string;
  description: string;
  value: number;
}
```

### `ReloadPlugins`

```typescript
function ReloadPlugins(): Promise<void>;
```

Rescans the plugins directory, re-reads all manifests, and re-registers enabled plugin functions/variables/themes with the calculator engine.

### `SetPluginEnabled`

```typescript
function SetPluginEnabled(name: string, enabled: boolean): Promise<void>;
```

Enables or disables a plugin by name. Persists the state to `state.json` and re-registers all plugin functions.

**Parameters:**

- `name` — Plugin name (case-insensitive)
- `enabled` — `true` to enable, `false` to disable

### `InstallPlugin`

```typescript
function InstallPlugin(pluginsDir: string, pluginDir: string, manifestJSON: string): Promise<void>;
```

Installs a plugin by writing its manifest to the plugins directory, then triggers a rescan.

**Parameters:**

- `pluginsDir` — Path to the plugins directory (obtained from `GetPluginsDir()`)
- `pluginDir` — Subdirectory name for the plugin (e.g. `"finance"`)
- `manifestJSON` — The `plugin.json` content as a JSON string

### `RemovePlugin`

```typescript
function RemovePlugin(pluginsDir: string, pluginDir: string): Promise<void>;
```

Removes a plugin directory entirely and triggers a rescan.

**Parameters:**

- `pluginsDir` — Path to the plugins directory
- `pluginDir` — Subdirectory name of the plugin to remove

### `GetPluginsDir`

```typescript
function GetPluginsDir(): Promise<string>;
```

Returns the absolute path to the plugins directory.

### `GetPluginThemes`

```typescript
function GetPluginThemes(): Promise<ThemeDef[]>;
```

Returns all themes from currently enabled plugins.

---

## Usage from TypeScript

```typescript
import * as svc from '../wailsjs/go/service/AppService';

// Evaluate all lines in a note
const results = await svc.EvaluateAll('42\n10 inches in cm\nx = 5');

// Evaluate a single expression
const result = await svc.EvaluateLine('sqrt(144)');

// Get variables
const vars = await svc.GetVariables();
// vars: { x: 5 }

// Get step-by-step breakdown
const detail = await svc.GetSteps('2 + 3 * 4');
console.log(detail.result); // "14"
console.log(detail.steps); // [{ operation: "×", ... }, { operation: "+", ... }]

// Graph a function
const graph = await svc.EvaluateGraph('plot sin(x) from 0 to 6.2832');
if (graph) {
  console.log(graph.points.length); // 200
}

// Get history
const history = await svc.GetHistory();
// history: [{ input: "42", output: "42" }, ...]

// Clear everything
await svc.ClearVariables();
await svc.ClearHistory();

// Currency rates
const info = await svc.UpdateCurrencyRates();
console.log(info.source); // "live" or "cache"

// Notes
const notes = await svc.GetAllNotes();
const note = await svc.CreateNote();
const folderNote = await svc.CreateNoteInFolder('folder-uuid');
await svc.SaveNoteContent(note.id, '2 + 2\npi * 2');
await svc.RenameNote(note.id, 'My Calculations');
await svc.UpdateNoteIcon(note.id, '\u{1F4C8}');
await svc.MoveNoteToFolder(note.id, 'folder-uuid');
await svc.ReorderNotes([note.id]);

// Folders
const folder = await svc.CreateFolder('Work', '');
const folders = await svc.GetAllFolders();
await svc.RenameFolder(folder.id, 'Personal');
await svc.UpdateFolderIcon(folder.id, '\u{1F4C1}');
await svc.MoveFolder(folder.id, 'parent-folder-uuid');
const uniqueName = await svc.UniqueFolderName('');
await svc.ReorderFolders([folder.id]);
await svc.DeleteFolder(folder.id);

// Autocomplete keywords
const keywords = await svc.GetAutocompleteKeywords();

// Plugins
const plugins = await svc.GetPlugins();
await svc.SetPluginEnabled('finance', true);
await svc.ReloadPlugins();
const pluginsDir = await svc.GetPluginsDir();
await svc.InstallPlugin(pluginsDir, 'my-plugin', JSON.stringify(manifest));
await svc.RemovePlugin(pluginsDir, 'my-plugin');

// Settings
const settings = await svc.GetSettings();
await svc.SaveSettings({ ...settings, theme: 'neon' });

// Toggle result panel and line wrap
await svc.SaveSettings({ ...settings, result_panel_enabled: 'false', line_wrap_enabled: 'true' });

// Data directory
const dir = await svc.GetDataDir();

// Documentation
const docs = await svc.GetDocList();
const content = await svc.GetDocContent('user-guide.md');
```

---

## Error Handling

All Go errors result in an empty string (or empty array) being returned to the frontend. No error messages are propagated to the user through the API layer.

The frontend should wrap every Wails binding call in `try/catch` to handle cases where:

- The Wails runtime is not yet initialized (e.g. during app startup)
- The Go backend encountered an unexpected error
- A timeout occurred (5-second evaluation limit)

```typescript
try {
  const result = await svc.EvaluateLine('2 + 2');
  if (result === '') {
    // Expression was invalid or timed out
  }
} catch (e) {
  // Wails runtime not initialized or communication error
}
```

### Evaluation Limits

| Limit                  | Value                      |
| ---------------------- | -------------------------- |
| Max input length       | 10,000 characters per line |
| Max nested parentheses | ~100 levels                |
| Evaluation timeout     | 5 seconds per call         |
| Max graph points       | 200 sampled points         |
