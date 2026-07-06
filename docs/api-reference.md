# API Reference

The Go backend exposes methods to the TypeScript frontend through auto-generated Wails bindings. These are imported from `frontend/wailsjs/go/service/AppService`.

## `EvaluateAll`

```typescript
function EvaluateAll(input: string): Promise<string[]>
```

Evaluates every line of the input string. Each line is processed independently. Variables persist across lines. Empty lines and comment lines (`#`, `//`) return empty strings.

**Parameters:**
- `input` — Multi-line string, lines separated by `\n`

**Returns:**
- Array of result strings, one per line. Empty string for no result or evaluation errors.

**Example:**
```
Input:  "x = 10\nx * pi\ntwenty five + 3"
Result: ["x = 10", "31.4159", "28"]
```

## `EvaluateLine`

```typescript
function EvaluateLine(input: string): Promise<string>
```

Evaluates a single line. Variables are preserved across calls.

**Parameters:**
- `input` — Single line string

**Returns:**
- Result string, or empty string on error.

## `GetVariables`

```typescript
function GetVariables(): Promise<Record<string, number>>
```

Returns all currently defined variables as a map of name → value.

**Returns:**
- Object with variable names as keys and float64 values.

## `ClearVariables`

```typescript
function ClearVariables(): Promise<void>
```

Clears all stored variables and resets the last result tracker.

## `LoadPlugins`

```typescript
function LoadPlugins(dirs: string[]): Promise<number>
```

Loads JavaScript plugins from the specified directories. Called once at startup from `main.go`.

**Parameters:**
- `dirs` — Array of directory paths relative to the binary

**Returns:**
- Number of plugin files loaded.

## Usage from TypeScript

```typescript
import * as svc from '../wailsjs/go/service/AppService';

// Evaluate all lines
const results = await svc.EvaluateAll("42\n10 inches in cm\nx = 5");

// Get variables
const vars = await svc.GetVariables();
// vars: { x: 5 }

// Clear everything
await svc.ClearVariables();
```

## Error Handling

All Go errors result in an empty string being returned to the frontend. No error messages are displayed to the user. The frontend wraps every call in `try/catch` to handle cases where the Wails runtime is not yet initialized.
