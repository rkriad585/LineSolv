# From Words to Numbers

This document traces a query from the moment you press a key until the result appears on screen.

## End-to-End Flow

```
Keystroke
  │
  ▼
Frontend: CalculatorInput.onInput()
  │  schedules debounced evaluation (150ms)
  │  increments evalVersion counter
  ▼
Frontend: App.ts scheduleEval()
  │  calls serviceBindings.EvaluateAll(text)
  │  (Wails RPC bridge — Go backend)
  ▼
Backend: AppService.EvaluateAll()
  │  splits input into lines
  │  for each line:
  │    Engine.EvaluateLine(line)
  ▼
Backend: Engine.naturalize(line)
  │  19-step natural language pipeline
  │  (see pipeline section below)
  ▼
Backend: Engine.parse(expression)
  │  recursive descent PEMDAS parser
  │  builds and evaluates AST on the fly
  ▼
Backend: result string returned ← back across Wails bridge
  │
  ▼
Frontend: CalculatorStore.setResults()
  │  notifies all subscribers
  ▼
Frontend: ResultDisplay.render()
  │  formats and displays each result
```

## The Naturalize Pipeline

The preprocessing pipeline converts natural language into a pure arithmetic expression. Steps run in order from 0 (normalize) through 18 (final cleanup), with each step producing input for the next.

### Step 0 — Normalize

- Unicode normalisation (NFD → NFC)
- Strip noise words (`exactly`, `actually`, `maybe`, `perhaps`, `like`)
- Normalise whitespace and math symbols (`×` → `*`, `÷` → `/`, `π` → `pi`)
- Remove possessive `'s`

### Step 1 — Prefix stripping (loop)

The prefix loop runs up to 5 iterations, applying ~20 regex patterns per pass:

- **Query prefixes**: `what is`, `what's`, `calculate`, `find`, `solve`, `determine`, `how much is`, `how many is`, `show me`, `tell me`, `could you`, `can you`, `i want to`, `i need to`, `compute`, `evaluate`, `figure out`, `work out`
- **Pronouns/fillers**: `the total cost of`, `the`, `a`, `an`, `i am`, `i'm`, `my`, `your`
- **Conversation words**: `please`, `okay`, `so`, `well`, `now`, `then`
- Each pass: if no pattern matches, exit early (typically 1–2 iterations)

### Step 2 — Trailing cleanup

- `please`, `thanks`, `thank you`, `for me`, `if possible`, `yrs old`
- Trailing `?` and `.` (before word-to-number to preserve decimal points)

### Step 3 — Currency extraction

- `$20` → `20`, `€50` → `50`, `£100` → `100`, `¥500` → `500`
- Handles SI suffixes: `$5k` → `5000`

### Step 4 — Word to number

- `twenty five` → `25`, `one hundred` → `100`
- Fraction words: `half` → `0.5`, `quarter` → `0.25`, `three quarters` → `0.75`
- Scale words: `double` → `*2`, `triple` → `*3`
- Collective nouns: `dozen` → `12`, `gross` → `144`, `score` → `20`

### Step 5 — Fraction detection

- `3/4` → maintained as fraction, `2 1/2` → `2 + 1/2` = `2.5`

### Step 6 — Percent to decimal

- `25% of 200` → `0.25 * 200`
- `100 + 15%` → `100 + 100 * 15 / 100` (via tip/discount step 14d)

### Step 7 — Ordinal to number

- `1st` → `1`, `2nd` → `2`, `3rd` → `3`

### Step 8 — Compact time

- `2h30m` → `2*3600 + 30*60`

### Step 9 — Date math

- `today + 14 days` → computed as days difference from current date
- `March 1 + 30 days` → parsed date + days

### Step 10 — SI prefix expansion

- `5km` → `5000 m`, `2ms` → `0.002 s`
- Case-sensitive: `5K` = 5000, `5k` = 5000, `5M` = 5,000,000

### Step 11 — Comparison phrases

- `X more than Y` → `Y + X`
- `X less than Y` → `Y - X`
- `half as much as X` → `X * 0.5`
- `difference between X and Y` → `abs(X - Y)`
- `X out of Y` → `X / Y`

### Step 12 — Shape formulas

- `area of circle with radius 5` → `pi * 5^2`
- `area of rectangle 10 by 20` → `10 * 20`
- `volume of sphere radius 5` → `(4 / 3) * pi * 5^3`

### Step 13 — Complex phrases

- `product of X and Y` → `X * Y`
- `sum of X and Y` → `X + Y`
- `the total cost of 5 items at $20 each` → `(5 * 20)`
- `the total cost of 5 items at $20 each with a 15% discount and 8% sales tax added on top` → `(((5 * 20) * (100 - 15) / 100) * (100 + 8) / 100)`

### Step 14 — Natural functions, comparison operators, tip/discount

- `square root of 144` → `sqrt(144)`, `sine of 30` → `sin(30)`
- `100 plus 15% tip` → `100 + 100 * 15 / 100`
- `100 with a 15% discount` → `100 - 100 * 15 / 100`
- `100 and 8% sales tax added on top` → `100 + 100 * 8 / 100`

### Step 15 — Word operators

- `plus`, `and`, `added to` → `+`
- `minus`, `subtracted from`, `less` → `-`
- `times`, `multiplied by` → `*`
- `divided by`, `per` → `/`
- `to the power of`, `raised to` → `^`

### Step 16 — Math symbols

- `×` → `*`, `÷` → `/`, `√` → `sqrt`

### Step 17 — Implicit multiplication

- `2x` → `2 * x`, `2(3+4)` → `2 * (3 + 4)`, `5 pi` → `5 * pi`

### Step 18 — Final cleanup

- Collapse consecutive signs (`--` → `+`, `+-` → `-`)
- Trim whitespace

## The Parser

After naturalization, the expression is parsed by a recursive descent parser that follows standard PEMDAS precedence:

```
parse(expression):
  parseAddSubtract()
    parseMultiplyDivide()
      parsePower()
        parseUnary()
          parseModulo()
            parseFactorial()
              parseFunction()
                parseConstant()
                  parseVariable()
                    parseNumber()
                      parseParen()
```

### Parsing levels

| Level                 | Handles                    | Example                      |
| --------------------- | -------------------------- | ---------------------------- |
| `parseAddSubtract`    | `+`, `-`                   | `5 + 3 * 2` → `5 + 6` → `11` |
| `parseMultiplyDivide` | `*`, `/`                   | `3 * 2` → `6`                |
| `parsePower`          | `^`                        | `2 ^ 3` → `8`                |
| `parseUnary`          | `-` prefix                 | `-5` → `-5`                  |
| `parseModulo`         | `%`                        | `17 % 5` → `2`               |
| `parseFactorial`      | `!` postfix                | `5!` → `120`                 |
| `parseFunction`       | `sin()`, `cos()`, `sqrt()` | `sqrt(144)` → `12`           |
| `parseConstant`       | `pi`, `e`                  | `pi` → `3.14159`             |
| `parseVariable`       | `x`, `y`, user-defined     | `x` → `42`                   |
| `parseNumber`         | `42`, `3.14`, `1.5e2`      |                              |
| `parseParen`          | `(`, `)`                   | `2 * (3 + 4)` → `14`         |

The parser is a flat recursive descent — no operator-precedence table, just function call order. Each `parseX` function:

1. Calls the next-lower-precedence `parseY` for the left operand
2. Checks for an operator token at its level
3. If found, loops to combine left with right operands

### Lexer

The lexer (`Engine.lex()`) tokenises the expression into tokens:

- Numbers (ints and floats, including scientific notation like `1e5`)
- Operators (`+`, `-`, `*`, `/`, `^`, `!`, `%`)
- Parentheses and commas
- Function names and variable names
- Constants (`pi`, `e`)

It skips whitespace and handles multi-character tokens. The comma token is needed for multi-argument functions like `atan2(y, x)`, `nCr(n, r)`, `min(a, b, c)`.

## Frontend Architecture

### Reactive State

`CalculatorStore` (`stores/calculator.ts`) implements a subscriber pattern:

```typescript
class CalculatorStore {
  private subscribers: Set<() => void> = new Set();
  state = { input: '', results: [], variables: {}, evalState: 'idle', ... };

  subscribe(cb) { this.subscribers.add(cb); return () => this.subscribers.delete(cb); }
  setState(partial) { Object.assign(this.state, partial); this.notify(); }
  private notify() { this.subscribers.forEach(cb => cb()); }
}
```

Components subscribe to store changes and `render()` themselves when notified. This avoids a full virtual DOM framework while keeping the UI reactive.

### Debounced Evaluation

Typing triggers `scheduleEval()` which:

1. Increments `evalVersion` (for stale-result detection)
2. Clears any pending timeout
3. Sets a 150ms debounce timer
4. On fire: calls `EvaluateAll`, passes the current `evalVersion`
5. On response: discards the result if `evalVersion` doesn't match (older request returned after a newer one)

### Virtualized Gutter

The input gutter (`CalculatorInput.ts`) creates DOM elements only for visible lines:

```
onScroll:
  gutter.scrollTop = textarea.scrollTop

rebuildGutter:
  const st = this.gutter.scrollTop
  this.gutter.innerHTML = ''     // clears children, resets scrollTop to 0
  for (visible lines) { append line number div }
  this.gutter.scrollTop = st     // restore position to prevent jump
```

An early return when `this.gutter.clientHeight === 0` prevents rebuilds on invisible gutters.

### Lazy Panel Rendering

Sidebar panels (NotesPanel, HistoryPanel, VariableExplorer) use a `needsRender` flag:

```typescript
render(): void {
  this.needsRender = false;
  if (!this.isOpen) return;  // skip DOM work when collapsed
  // rebuild panel content
}

onStateChange(): void {
  this.needsRender = true;
  if (this.isOpen) this.render();
}
```

This avoids unnecessary DOM operations when panels are hidden.

### Steps Panel

The StepsPanel queries the backend `GetSteps` method on demand (when the panel is opened). The backend runs the full parse pipeline in read-only mode, recording each reduction as a `Step` object:

```json
{
  "Steps": [
    { "Operation": "naturalize", "Expression": "5 + 3 * 2", "Result": "5 + 3 * 2" },
    { "Operation": "multiply", "Expression": "3 * 2", "Result": "6" },
    { "Operation": "add", "Expression": "5 + 6", "Result": "11" }
  ]
}
```

### Graph Panel

When the input matches a graph pattern (`plot`, `graph`, `y =`), the backend's `EvaluateGraph` samples 200 x-values across the range, evaluates the expression at each point, and returns `Point[]` for Chart.js rendering.

## Theming

All colors are CSS custom properties. The active theme is applied as a class on `<html>`:

```html
<html class="theme-dark"></html>
```

Each `.theme-*` class overrides:

```css
--surface           /* main background (#18181b dark) */
--surface-secondary /* secondary background */
--text              /* primary text */
--text-muted        /* muted/secondary text */
--text-subtle       /* subtle text */
--accent            /* accent/highlight color */
--border            /* border color */
--scrollbar-bg      /* scrollbar track */
--scrollbar-thumb   /* scrollbar handle */
```

No `@media (prefers-color-scheme)` or `dark:` variants — themes are explicit user choices stored in `config.toml`.

## Storage

### SQLite Database (`linesolv.db`)

The `notes` table schema:

```sql
CREATE TABLE notes (
  id         TEXT PRIMARY KEY,      -- UUID
  name       TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  position   INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_sort ON notes(position, updated_at);
```

The composite index `idx_notes_sort` optimizes the common query pattern: listing all notes ordered by position (for the sidebar) while also covering `ORDER BY updated_at` for sort-by-last-modified.

### Config File (`config.toml`)

```toml
[app]
theme = "dark"
version = "1.0.0"

[notes]
last = "uuid-of-last-note"
sort = "position"

[behavior]
delete_without_confirm = true

[settings]
font_size = 14
font_family = "JetBrains Mono"
[customShortcuts]
```

### Export/Import

The exporter (`app/storage/exporter.go`) supports six formats:

| Format  | Content                                         |
| ------- | ----------------------------------------------- |
| `.lv`   | name + each line's input and result             |
| `.txt`  | plain text of note content                      |
| `.md`   | markdown with code blocks for each line         |
| `.json` | structured: `{"name": "...", "content": "..."}` |
| `.toml` | TOML `[note]` section                           |
| `.pdf`  | A4 PDF with Arial 10pt, page numbers, watermark |

## Codebase Map

```
main.go                          ← Wails entry point
  app/
    service/app.go                ← 42 Wails-bound methods
    calculator/
      engine.go                   ← Engine, naturalize, parse, evaluate (~1200 lines)
      units.go                    ← unit conversion DB
      functions.go                ← math function dispatch
      variables.go                ← get/set/clear variables
      steps.go                    ← Step/EvalDetail types
      graph.go                    ← GraphResult, EvaluateGraph
      benchmark_test.go           ← performance benchmarks
    storage/
      db.go                       ← SQLite CRUD, composite index
      config.go                   ← config.toml parse/save
      exporter.go                 ← 6 export formats + import
      fancyname.go                ← random note name generator
  frontend/
    src/
      App.ts                      ← orchestrator, debounce, keyboard, eval
      main.ts                     ← bootstrap
      types.ts                    ← shared interfaces
      style.css                   ← Tailwind v4 + theme vars
      stores/
        calculator.ts             ← reactive state store
        notes.ts                  ← note manager
        settings.ts               ← settings state and persistence
      utils/
        html.ts                   ← escapeHtml
        shortcuts.ts              ← keyboard shortcut handler
        format.ts                 ← result formatting
      components/
        TitleBar.ts               ← frameless drag, window controls, buttons
        CalculatorInput.ts        ← textarea + virtualized gutter
        ResultDisplay.ts          ← results column, loading/empty states
        NotesPanel.ts             ← sidebar, lazy render, drag-and-drop reorder
        VariableExplorer.ts       ← sidebar, lazy render
        HistoryPanel.ts           ← sidebar, lazy render, search filter
        StepsPanel.ts             ← step-by-step evaluation display
        GraphPanel.ts             ← Chart.js function plot
        ContextMenu.ts            ← right-click menu with submenus
        ConfirmDialog.ts          ← modal confirmation
        AutocompletePopup.ts      ← function/variable autocomplete suggestions
        ShortcutModal.ts          ← keyboard shortcut reference
        SettingsModal.ts          ← 5-tab settings (General, Theme, UI Style, Keyboard Shortcuts, About)
        DocsViewer.ts             ← embedded documentation viewer
```

## Trace Example

Query: `what is the total cost of 5 items at $20 each with a 15% discount and 8% sales tax added on top`

**Step 1 (Prefix loop, iter 1):**

- `what is` matches → `the total cost of 5 items at $20 each with a 15% discount and 8% sales tax added on top`

**Step 1 (Prefix loop, iter 2):**

- `the total cost of` matches → `5 items at $20 each with a 15% discount and 8% sales tax added on top`

**Step 1 (Prefix loop, iter 3):**

- No prefix matches → exit loop

**Step 3 (Currency):**

- `$20` → `20` → `5 items at 20 each with a 15% discount and 8% sales tax added on top`

**Step 13c (Purchase math):**

- `purchaseDiscountTaxPattern` matches:
  - N = `5`, P = `20`, D = `15`, T = `8`
  - Output: `(((5 * 20) * (100 - 15) / 100) * (100 + 8) / 100)`

**Parser:**

- `parseAddSubtract` → only `*`, `/`, `-` found → delegates to `parseMultiplyDivide`
- `parseMultiplyDivide` processes left to right:
  - `5 * 20` = `100`
  - `100 * (100 - 15) / 100` → `100 * 85 / 100` → `8500 / 100` → `85`
  - `85 * (100 + 8) / 100` → `85 * 108 / 100` → `9180 / 100` → `91.8`

**Result:** `91.8`

---

## More Stories from Real Life

### Story 2: Pizza Night

> _"Game night is coming up. I need 5 pizzas, and each one costs $12. Just the pizzas, no discounts or tax for now."_

**Query:** `5 items at $12 each`

**Step 1 (Prefix loop):**

- No prefixes to strip — straight into matching.

**Step 13c (Purchase math):**

- `itemsAtPattern` matches `5 items at $12 each`
  - N = `5`, P = `12`
  - Output: `(5 * 12)`

**Parser:**

- `parseParen`: evaluates `(5 * 12)` = `60`

**Result:** `60`

---

### Story 3: Tax Season

> _"I just made $200 from a side gig. I need to set aside 8% for sales tax. How much total with tax?"_

**Query:** `200 and 8% sales tax added on top`

**Step 1 (Prefix loop):**

- No prefixes to strip.

**Step 14d (Tip/tax pattern):**

- `tipPattern` matches `200 and 8% sales tax added on top`
  - Base = `200`, Rate = `8`
  - Builds: `(200 + 200 * 8 / 100)`

**Parser:**

- `parseAddSubtract`:
  - `200 + 200 * 8 / 100`
  - `parseMultiplyDivide`: `200 * 8 / 100` → `1600 / 100` → `16`
  - back to add: `200 + 16` = `216`

**Result:** `216`

---

### Story 4: Flash Sale

> _"That $200 jacket I've been eyeing is 25% off. What's the sale price?"_

**Query:** `200 with a 25% discount`

**Step 1 (Prefix loop):**

- No prefixes to strip.

**Step 14d (Discount pattern):**

- `discountPattern` matches `200 with a 25% discount`
  - Base = `200`, Rate = `25`
  - Builds: `(200 - 200 * 25 / 100)`

**Parser:**

- `parseAddSubtract`:
  - `200 - 200 * 25 / 100`
  - `parseMultiplyDivide`: `200 * 25 / 100` → `5000 / 100` → `50`
  - back to add/subtract: `200 - 50` = `150`

**Result:** `150`

---

### Story 5: Brain Fog

> _"I got 25 hours of freelance work at $37 per hour. What did I earn?"_

**Query:** `25 times 37`

**Step 4 (Word to number):**

- `twenty five` → not present (`25` is already numeric)
- `thirty seven` → not present (`37` is already numeric)

**Step 15 (Word operators):**

- `times` → `*`
- Expression becomes: `25 * 37`

**Parser:**

- `parseMultiplyDivide`: `25 * 37` = `925`

**Result:** `925`

---

### Story 6: Combining Patterns

> _"I bought 8 items at $5 each with a 10% discount and 6% sales tax. What's the final price?"_

**Query:** `8 items at $5 each with a 10% discount and 6% sales tax added on top`

**Step 13c (Purchase math):**

- `purchaseDiscountTaxPattern` matches:
  - N = `8`, P = `5`, D = `10`, T = `6`
  - Output: `(((8 * 5) * (100 - 10) / 100) * (100 + 6) / 100)`

**Parser:**

- `parseMultiplyDivide` left to right:
  - `8 * 5` = `40`
  - `40 * (100 - 10) / 100` → `40 * 90 / 100` → `3600 / 100` → `36`
  - `36 * (100 + 6) / 100` → `36 * 106 / 100` → `3816 / 100` → `38.16`

**Result:** `38.16`
