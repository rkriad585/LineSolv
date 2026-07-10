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

## `GetHistory`

```typescript
interface HistoryEntry {
  input: string;
  output: string;
}

function GetHistory(): Promise<HistoryEntry[]>
```

Returns the evaluation history — each entry records the input line and its computed result.

## `ClearHistory`

```typescript
function ClearHistory(): Promise<void>
```

Clears all stored history entries.

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

function GetSteps(input: string): Promise<EvalDetail>
```

Evaluates a single expression and returns the intermediate computation steps. Does not modify engine state (no side effects on history or variables).

**Parameters:**
- `input` — single expression string

**Returns:**
- `EvalDetail` with the final result and an ordered array of `Step` objects showing each parser level reduction.

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

function EvaluateGraph(input: string): Promise<GraphResult | null>
```

Evaluates a graphing expression (`plot`, `graph`, `y =` syntax) and returns 200 sampled points across the expression's range.

**Parameters:**
- `input` — graphing expression (e.g. `"plot x^2"`, `"graph sin(x) from -5 to 5"`)

**Returns:**
- `GraphResult` with sampled points, cleaned expression, and range, or `null` if the input is not a graph expression or evaluation fails.

## `ReorderNotes`

```typescript
function ReorderNotes(noteIDs: string[]): Promise<void>
```

Updates the position of notes to match the given order. All note IDs must exist.

**Parameters:**
- `noteIDs` — array of note IDs in their desired order

## Usage from TypeScript

```typescript
import * as svc from '../wailsjs/go/service/AppService';

// Evaluate all lines
const results = await svc.EvaluateAll("42\n10 inches in cm\nx = 5");

// Get variables
const vars = await svc.GetVariables();
// vars: { x: 5 }

// Get history
const history = await svc.GetHistory();
// history: [{ input: "42", output: "42" }, ...]

// Clear everything
await svc.ClearVariables();
await svc.ClearHistory();
```

## `UpdateCurrencyRates`

```typescript
interface CurrencyCacheInfo {
  cached: boolean;
  updatedAt: string;
  source: string;
}

function UpdateCurrencyRates(): Promise<CurrencyCacheInfo>
```

Fetches live exchange rates from exchangerate-api.com. Falls back to cached rates on network failure. Returns cache info (cached status, last updated timestamp, source).

## `GetCurrencyCacheInfo`

```typescript
function GetCurrencyCacheInfo(): Promise<CurrencyCacheInfo>
```

Returns the current currency cache status without attempting a refresh.

## `GetDataDir`

```typescript
function GetDataDir(): Promise<string>
```

Returns the application data directory path (e.g. `~/.config/neostore/linesolv`).

## Error Handling

All Go errors result in an empty string being returned to the frontend. No error messages are displayed to the user. The frontend wraps every call in `try/catch` to handle cases where the Wails runtime is not yet initialized.
