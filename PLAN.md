# LineSolv — Wails v2 Desktop Calculator

## Overview

Rewrite this Numi plugin & Alfred workflow repository into a full cross-platform desktop
natural-language calculator using **Wails v2** (Go backend) + **Vite** (build tool) +
**Tailwind CSS v4** (styling) + **TypeScript** (frontend logic).

The new app merges three pieces:
- The **Go CLI calculator engine** (parsing, arithmetic, unit conversion, dates, variables)
- The **plugin system** (16 community extensions + `numi.addUnit/addFunction/setVariable` API)
- A **modern desktop UI** (Wails + Tailwind CSS)

---

## ✅ Completed

### Phase 0 — Prerequisites & Scaffold
- [x] Wails CLI installed (v2.12.0)
- [x] Project scaffolded from `vanilla-ts` template
- [x] Frontend deps installed (Vite 6, Tailwind v4, TypeScript 5)

### Phase 1 — Project Structure & Build Setup
- [x] Directory layout: `app/calculator/`, `app/service/`, `frontend/src/`
- [x] `wails.json` configured
- [x] Tailwind CSS v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js`)
- [x] `vite.config.ts` with Tailwind v4 plugin
- [x] `tsconfig.json` with strict mode (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- [x] `main.go` wires `service.AppService` → `wails.Run`
- [x] Linux build works with `-tags "webkit2_41"`

### Phase 2 — Backend Core (partial)
- [x] **Calculator engine** (`app/calculator/engine.go`):
  - [x] Recursive descent PEMDAS parser (`+`, `-`, `*`, `/`, `^`, `%`, parens, unary)
  - [x] Built-in functions: `sin`, `cos`, `tan`, `sqrt`, `abs`, `round`, `floor`, `ceil`, `log`/`ln`, `log10`, `exp`
  - [x] Named constants: `pi`/`π`, `e`
  - [x] Variable assignment and storage across lines
  - [x] Unit conversion (length, mass, volume, temperature, currency)
  - [x] Percentage patterns: `X% of Y`, `X ± Y%`
  - [x] Natural language preprocessing pipeline:
    - [x] Strip query prefixes (`what is`, `calculate`, `compute`, etc.)
    - [x] Strip trailing fluff (`please`, `thanks`)
    - [x] Word-to-number conversion (`twenty five` → `25`, `two hundred` → `200`, hyphen expansion)
    - [x] Context references (`of that`, `then`, `result` → previous line result)
    - [x] Word operators (`plus` → `+`, `minus` → `-`, `times` → `*`, `divided by` → `/`, `per` → `/`, `to the power of` → `^`, etc.)
    - [x] `percent` word → `%`
    - [x] Commas in numbers (`1,000` → `1000`)
  - [x] Division/modulo by zero returns human-readable error
- [x] **Service layer** (`app/service/app.go`): `EvaluateLine`, `EvaluateAll`, `GetVariables`, `ClearVariables`

### Phase 3 — Frontend Layout (partial)
- [x] Notepad-style split UI: textarea (left) + results column (right)
- [x] Line numbers gutter with synced scroll
- [x] Frameless window with `data-wails-drag` title bar
- [x] Sidebars for Notes and Variables (collapsible, closed by default)
- [x] Zinc-based dark theme (`#18181b` bg, `#a78bfa` results accent)
- [x] 150ms debounced evaluation via single `EvaluateAll` RPC call
- [x] Stale-result detection (`evalVersion` counter)
- [x] Errors return empty result (no error messages shown)

### Phase 4 — State & Data Binding (partial)
- [x] Auto-generated bindings in `frontend/wailsjs/go/service/`
- [x] Dynamic import of bindings (cached via module system)
- [x] Variables panel reads from `GetVariables()` after each evaluation
- [x] Keyboard shortcuts: ⌘N (new note), ⌘B (notes toggle), ⌘I (variables toggle), ⌘K (clear + clear vars)

---

## 🔲 Remaining

### Phase 2 — Backend Core (remaining)
- [ ] **Plugin system** (`app/plugin/`):
  - Option A: Native Go `Plugin` interface with directory scanner
  - Option B: Goja JS runtime (`github.com/dop251/goja`) executing existing `.js` plugin files
  - API: `numi.addUnit`, `numi.addFunction`, `numi.setVariable`
- [ ] Split `engine.go` into separate files: `units.go`, `functions.go`, `variables.go`
- [ ] Service methods should accept `context.Context` (plan rule #2)
- [ ] Add `GetHistory` method for computation history
- [ ] Add `LoadPlugin` / `ListPlugins` service methods

### Phase 3 — Frontend Layout (remaining)
- [ ] Split `App.ts` into separate components:
  - `TitleBar.ts` — frameless drag region, traffic-light buttons (or Linux equivalent)
  - `CalculatorInput.ts` — textarea (or contenteditable) for expressions
  - `ResultDisplay.ts` — live results column
  - `HistoryPanel.ts` — scrollable past evaluations
  - `VariableExplorer.ts` — sidebar variable list
  - `PluginStatus.ts` — loaded plugins indicator
- [ ] Dark/light mode toggle (Tailwind `dark:` variant + CSS custom properties)
- [ ] Responsive CSS grid: `grid-cols-[1fr_240px]` adapts to window width

### Phase 4 — State & Data Binding (remaining)
- [ ] Formal reactive store class (`stores/calculator.ts` with subscriber pattern)
- [ ] Explicit loading / empty / error UI states per plan's state table:
  | State | UI Treatment |
  |---|---|
  | **Loading** | Spinner or skeleton pulse on result area |
  | **Empty** | Placeholder text: "Type a calculation..." |
  | **Error** | Red highlight on input border + error message |
  | **Success** | Animated result with unit formatting |
- [ ] History navigation (↑/↓ arrows)
- [ ] `Enter` to force-evaluate immediately
- [ ] `Esc` to clear input / close panels

### Phase 5 — Plugin Migration
- [ ] Decide Option A (Go plugins) vs Option B (Goja JS runtime)
- [ ] Port/mount all 16 community plugins from `plugins/CommunityExtensions/`:
  - `BasicCombinatorics`, `BitcoinSatoshis`, `ChangeMoneyCAD`, `CryptoChanger`,
    `Currency`, `DateAndTime`, `EmissionsCalculator`, `Energy`,
    `Euros`, `GeneralConverter`, `Gematria`, `GradeCalculator`,
    `HomeBrewing`, `IntrinsicStock`, `RealEstate`, `TimeCalculator`
- [ ] Plugin loader in `main.go` or service constructor

### Phase 6 — Build & Distribution
- [ ] `wails dev` workflow (HMR)
- [ ] CI/CD via GitHub Actions on push/tag
- [ ] `goreleaser` for multi-platform publishing
- [ ] Integration tests: `go test ./...` + `wails build`
- [ ] Linux: AppImage or .deb packaging
- [ ] macOS: `.app` bundle with codesigning
- [ ] Notarization setup

---

## Phase Summary

| Phase | What | Status |
|---|---|---|
| **0** | Install Wails CLI, scaffold project | ✅ Done |
| **1** | Configure Vite + Tailwind v4 + Wails | ✅ Done |
| **2** | Build Go engine + plugin runtime + service layer | ⚠️ Partial (engine done, plugin system missing) |
| **3** | Build TypeScript UI (vanilla, Tailwind classes) | ⚠️ Partial (monolithic App.ts, no component split) |
| **4** | Wire store → bindings → DOM reactivity | ⚠️ Partial (inline store, no formal reactive pattern) |
| **5** | Migrate 16 community plugins | ❌ Not started |
| **6** | Build scripts, CI/CD, packaging | ❌ Not started |

---

## Architectural Rules

1. **`main.go` is minimal** — wire dependencies, call `wails.Run`, nothing else.
2. **All Go ⇔ frontend methods** should accept `context.Context`, return `(T, error)`.
3. **No global mutable state** — inject `*Engine` and `*AppService` via constructor.
4. **Frontend never hardcodes URLs** — always use `frontend/wailsjs/go/` bindings.
5. **Every Go call** is wrapped in `async/await` + `try/catch`.
6. **`select-none` + drag region** on all non-interactive UI.
7. **Tailwind v4 CSS-first config** — no `tailwind.config.js` or PostCSS.
8. **Frameless window** with custom `data-wails-drag` title bar.
