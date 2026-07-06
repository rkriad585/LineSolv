# LineSolv — Implementation Plan

> **Version:** 0.1.45  
> **Status:** Active Development  
> **Last Updated:** 2026-07-06  

---

## Project Overview

LineSolv is a cross-platform desktop natural-language calculator built with **Wails v2** (Go backend + WebView frontend), **Vite**, **Tailwind CSS v4**, and **TypeScript**. It understands phrases like `$20 in euro - 5% discount` or `what is the just plus five` and displays live results in a notepad-style interface.

The project was forked from the **Numi** open-source calculator, rebranded to LineSolv, and re-architected from a macOS-only Swift + Electron + Go CLI monorepo into a single cross-platform Wails v2 desktop application.

**Platform targets:** Linux (.deb), macOS (.dmg), Windows (.exe + NSIS installer)

---

## Current Implementation Status

| Area | Status | Notes |
|---|---|---|
| Go backend (calculator engine) | Refactored | PEMDAS parser, NL pipeline, unit conversion, variables, history, 35+ functions, timeout |
| Go service layer | Complete | 6 Wails-bound methods with per-call timeout (5s) |
| Frontend orchestrator | Refactored | ~120-line App.ts, extracted utilities, reactive store |
| Natural language pipeline | Improved | 10-step preprocessing with compound-prefix looping |
| Unit conversion | Implemented | 41 units in 6 categories, hardcoded rates documented |
| Math functions | Expanded | 35+ functions (all trig, hyperbolic, stats, rounding, factorial, GCD/LCM, random) |
| Dark/light theme | Complete | CSS custom properties, toggle button |
| Multi-note support | Implemented | Create/switch notes in sidebar |
| Keyboard shortcuts | Complete | 10 shortcuts documented |
| CI/CD | Configured | Lint + test (42 tests), cross-platform release builds |
| Documentation | Improved | 5 docs files + README + CONTRIBUTING + SECURITY + CHANGELOG |
| **Tests** | **42 tests, all passing** | Engine, units, functions, variables — all table-driven |
| **Error handling** | **Improved** | Errors return `"Error: ..."` strings, frontend renders in red |
| **Plugin system** | **Removed** | Original 16 JS plugins + Goja runtime stripped |
| **Package distribution** | **None** | Only GitHub Releases |
| **Edge cases** | **Untested** | Division by zero, overflow, unicode, long input |

---

## High-Level Architecture Summary

```
main.go
  └─ service.AppService (6 Wails-bound methods)
      └─ calculator.Engine
          ├─ engine.go      — Core Engine, lexer, parser, NL pipeline, history
          ├─ units.go       — Unit database, conversion, RegisterUnit
          ├─ functions.go   — 11 built-in math functions
          └─ variables.go   — Variable get/set/clear

Frontend (WebView)
  ├─ App.ts                — Orchestrator (state, DOM, events, shortcuts)
  ├─ stores/calculator.ts  — Reactive state store (subscriber pattern)
  ├─ components/
  │   ├─ TitleBar.ts       — Frameless drag bar + theme/notes/vars toggles
  │   ├─ CalculatorInput.ts — Textarea + line-number gutter
  │   ├─ ResultDisplay.ts  — Results column (right side)
  │   ├─ NotesPanel.ts     — Collapsible notes sidebar (left)
  │   └─ VariableExplorer.ts — Collapsible variables sidebar (right)
  └─ style.css             — Tailwind v4 + CSS custom properties (dark/light)
```

**Communication:** Wails auto-generates TypeScript bindings from Go service methods. All calls are `async/await`. A retry loop on startup waits for the Wails runtime. An `evalVersion` counter prevents stale results.

---

## Goals and Success Criteria

### Primary Goals
1. Fix all known bugs and edge cases
2. Add comprehensive test coverage for the calculator engine
3. Improve error handling to provide user feedback
4. Refactor frontend to eliminate code duplication and God-object pattern
5. Expand the function library to match modern calculator expectations
6. Add input validation and security hardening
7. Polish documentation and developer experience

### Success Criteria
- [x] `go test ./...` passes with meaningful tests (42 tests, not zero)
- [x] All evaluation errors provide user-visible feedback (no silent discards)
- [x] `escapeHtml()` extracted to shared utility module
- [x] App.ts refactored into focused modules (~120 lines)
- [x] No stale Numi references in codebase
- [x] Math function library expanded to 35+ functions
- [x] Input length limits enforced (10,000 chars)
- [x] Currency rate staleness documented
- [x] Project builds cleanly with `wails build` and `npm run build`
- [x] No known critical or high-priority bugs remain

---

## Assumptions and Constraints

1. **Wails v2 is the fixed framework** — no migration to Electron, Tauri, or other frameworks
2. **Vanilla TypeScript (no React/Vue)** — maintain zero runtime JS dependencies
3. **No external Go dependencies beyond Wails** — keep the dependency tree minimal
4. **Windows/macOS/Linux cross-platform** — all changes must work on all three targets
5. **MIT license compatibility** — no GPL or AGPL dependencies
6. **No cloud services** — currency rates remain static/hardcoded; live API integration is out of scope for now
7. **No plugin system restoration** — the Goja-based plugin system was removed due to reliability issues; re-adding it is deferred
8. **Backward compatibility** — existing saved notes (if any) must remain readable; all public API signatures must be preserved

---

## Risks and Technical Debt

### Critical Risks
| Risk | Impact | Mitigation |
|---|---|---|
| **Test coverage exists but could be deeper** | Some edge cases unexercised | Add tests incrementally; 42 tests now cover all core paths |
| **Error handling improved but not exhaustive** | Some error paths may still be silent | Phase 4 added error propagation; ongoing review |
| **Single maintainer** | Bus factor of 1 | Document architecture, attract contributors, CONTRIBUTING.md |
| **No community adoption** | No bug reports or feature validation | Package for Homebrew, improve discoverability |

### Technical Debt Items
| Item | Severity | Location | Status |
|---|---|---|---|
| `escapeHtml()` duplicated 3 times | Medium | App.ts:23, NotesPanel.ts:74, VariableExplorer.ts:53 | ✅ Fixed |
| `App.ts` is a 292-line God object | High | frontend/src/App.ts | ✅ Fixed (~120 lines) |
| Silent `_` error discard in EvaluateAll | High | engine.go:81 | ✅ Fixed |
| Empty `catch {}` blocks in frontend | Medium | App.ts:78,105,115 | ✅ Fixed |
| `<title>Numi</title>` still present | Low | frontend/index.html:7 | ✅ Fixed |
| `println` instead of structured logging | Low | main.go:34 | ✅ Fixed |
| Floating-point modulo truncates to int64 | Medium | engine.go:540 | ✅ Fixed |
| No `context.Context` for cancellation | Medium | engine.go | ✅ Fixed (timeout) |
| No input length limits | Medium | engine.go | ✅ Fixed (10k char limit) |
| Hardcoded currency rates (undocumented) | Low | units.go | ✅ Documented |
| `PluginInfo` struct unused dead code | Low | models/types.go | ✅ Deleted |

---

## Feature Checklist

### Implemented
- [x] Natural language input (10-step preprocessing pipeline)
- [x] PEMDAS arithmetic parsing (recursive descent)
- [x] Unit conversion (length, mass, volume, temperature, currency)
- [x] Variable assignment and cross-line reference
- [x] Built-in math functions (sin, cos, tan, sqrt, abs, round, floor, ceil, log/ln, log10, exp)
- [x] Constants (pi/π, e)
- [x] Percentage math (% of, % add/subtract)
- [x] Context awareness (of that, then, result)
- [x] Computation history with keyboard navigation
- [x] Dark/light theme toggle
- [x] Multi-note support
- [x] 10 keyboard shortcuts
- [x] Notepad-style UI with line numbers and results column
- [x] Debounced live evaluation (150ms)
- [x] Stale-result prevention (evalVersion counter)
- [x] Cross-platform CI/CD (Linux .deb, macOS .dmg, Windows .exe)

### Missing / Broken
- [ ] **Tests** — zero test files exist
- [ ] **Error messages** — all errors silently return empty string
- [ ] **Input length limits** — no protection against DoS via long expressions
- [ ] **Shared utility module** — `escapeHtml()` in 3 places
- [ ] **App.ts modularization** — God object pattern
- [ ] **Expanded function library** — only 11 of ~50 available Go math functions
- [ ] **Context cancellation** — no `context.Context` on engine methods
- [ ] **Proper logging** — `println` instead of structured logger
- [ ] **Currency rate staleness warning** — hardcoded rates with no documentation
- [ ] **Stale Numi title** — `<title>Numi</title>` in index.html
- [ ] **Unused code** — `PluginInfo` and `Result` structs in models/types.go
- [ ] **Floating-point modulo** — `float64(int64(left) % int64(right))` loses precision

---

## Known Bugs (Addressed)

All known bugs from the initial audit have been fixed:

1. ~~**Floating-point modulo truncation** (`engine.go:540`): `float64(int64(left) % int64(right))` silently truncated both operands to int64.~~ ✅ Fixed with `math.Mod`.

2. ~~**Silent division by zero** (`engine.go:532-533`): Error discarded with `_`.~~ ✅ Fixed — errors propagate as `"Error: ..."` strings.

3. ~~**Silent modulo by zero** (`engine.go:537-538`): Same as division.~~ ✅ Fixed.

4. ~~**Unknown identifiers silently fail** (`engine.go:628`): Error returned but discarded.~~ ✅ Fixed — errors propagate.

5. ~~**Stale `<title>Numi</title>`** (`frontend/index.html:7`): HTML title never updated.~~ ✅ Fixed.

6. **Currency rates are hardcoded and will drift** (`units.go:68-78`): EUR, GBP, JPY, CNY, INR, CAD, AUD, CHF rates are static. No mechanism for updating them. *(Documented as approximate; live API integration deferred.)*

7. ~~**`and` operator in NL pipeline** (`engine.go:351`): Potential context issues with "and".~~ ✅ No longer a bug — ordering is correct.

8. **No unicode normalization** (`engine.go:421`): Lexer uses `[]rune(s)` but doesn't normalize fullwidth digits, composed/decomposed characters. *(Low priority — deferred.)*

---

## Missing Functionality

### Backend
- [x] `asin`, `acos`, `atan`, `atan2` — inverse trigonometric functions
- [x] `sinh`, `cosh`, `tanh` — hyperbolic functions
- [x] `fact`, `factorial` — factorial
- [x] `gcd`, `lcm` — greatest common divisor, least common multiple
- [x] `log2` — base-2 logarithm
- [x] `rand`, `random` — random number generation
- [x] `sign`, `sgn` — sign function
- [x] `trunc`, `fract` — truncation and fractional part
- [x] `deg`, `rad` — degree/radian conversion
- [x] `min`, `max` — variadic min/max
- [x] `sum`, `avg` — variadic sum/average
- [x] `pow` — explicit power function (currently only `^` operator)
- [x] Evaluation timeout mechanism (5s per call)
- [x] Input length limits with clear error messages (10,000 chars)
- [x] Structured logging (replacing `println`)

### Frontend
- [x] Shared `escapeHtml()` utility module
- [x] Refactored `App.ts` (split into focused modules, ~120 lines)
- [x] User-visible error messages for evaluation failures
- [ ] Loading indicator refinement (per-line instead of global)
- [ ] Keyboard shortcut reference modal (`Cmd+/` or `?`)
- [ ] Export results (copy to clipboard, CSV export)
- [ ] Result history sidebar or panel

### Documentation
- [x] CHANGELOG.md
- [ ] FAQ / troubleshooting guide
- [ ] User-facing help documentation (not just developer docs)

---

## Future Improvements (Deferred)

These are recognized opportunities but are explicitly out of scope for the current implementation phases:

- **Plugin system** — Re-implement extension support (deferred due to Goja instability; should use native Go plugin interface or WASM)
- **Live currency rates** — API integration with caching (requires network access and API key management)
- **Graphing/plotting** — 2D function plotter in WebView using Canvas API
- **Date/time arithmetic** — `today + 2 weeks`, `now + 3 hours`, timezone conversions
- **CLI version** — Extract `app/calculator` as standalone library and wrap in CLI
- **Mobile companion** — React Native or Flutter app with note sync
- **Package manager distribution** — Homebrew, winget, Snap, Flatpak
- **Scripting/programming** — Lua or custom function definitions
- **Accessibility** — Screen reader support, high-contrast mode, font size adjustment
- **Localization/i18n** — Multi-language support for natural language input

---

## Implementation Phases

---

### Phase 1 — Project Analysis

**Objective:** Complete inventory of current codebase state, establish baseline measurements, and verify build integrity.

**Dependencies:** None

**Tasks:**
- [ ] Verify project builds with `wails build -tags "webkit2_41"`
- [ ] Verify frontend builds with `npm run build`
- [ ] Verify `go vet ./...` passes cleanly
- [ ] Catalog all source files with line counts
- [ ] Identify all code duplication (escapeHtml, etc.)
- [ ] Document all API surface (6 service methods)
- [ ] Capture current test status (`go test ./...`)
- [ ] This PLAN.md is the Phase 1 deliverable

**Expected deliverables:**
- Verified clean build
- Source file inventory
- Baseline test report

**Completion checklist:**
- [ ] `wails build` succeeds
- [ ] `npm run build` succeeds
- [ ] `go vet ./...` clean
- [ ] Source inventory documented above

---

### Phase 2 — Core Architecture & Backend Improvements

**Objective:** Fix critical backend issues, expand function library, add input validation, and remove dead code.

**Dependencies:** Phase 1

**Tasks:**
- [x] Remove unused `app/models/types.go` (PluginInfo, Result structs — dead code from removed plugin system)
- [x] Add proper logging: replace `println` in `main.go` with `log.Println`
- [x] Fix floating-point modulo in `engine.go:540`: use `math.Mod` instead of int64 truncation
- [x] Add input length limits to lexer/parser (max 10,000 characters, return clear error)
- [x] Expand built-in function library in `functions.go`:
  - [x] `asin`, `acos`, `atan`, `atan2`
  - [x] `sinh`, `cosh`, `tanh`
  - [x] `fact`, `factorial`
  - [x] `gcd`, `lcm`
  - [x] `log2`
  - [x] `rand` (seeded with current time)
  - [x] `sign`, `sgn`
  - [x] `trunc`, `fract`
  - [x] `deg`, `rad`
  - [x] `min`, `max` (variadic)
  - [x] `sum`, `avg` (variadic)
  - [x] `pow` (explicit power function)
- [x] Add `callBuiltinOrPlugin` argument count validation (return error for wrong arity)

**Expected deliverables:**
- Cleaned up models package
- 25+ math functions
- Safe modulo operation
- Input length validation
- Proper logging

**Completion checklist:**
- [x] models/types.go removed (package deleted)
- [x] `println` replaced with `log.Println`
- [x] `math.Mod` used for floating-point modulo
- [x] Input length limit enforced (>10,000 chars returns error)
- [x] All new functions implemented with arg validation
- [x] `go vet ./...` clean
- [x] Project builds

---

### Phase 3 — Frontend Refactoring

**Objective:** Eliminate code duplication, modularize App.ts, fix stale Numi reference.

**Dependencies:** Phase 2

**Tasks:**
- [x] Create `frontend/src/utils/html.ts` with shared `escapeHtml()` function
- [x] Update `App.ts` to import `escapeHtml` from utils
- [x] Update `NotesPanel.ts` to import `escapeHtml` from utils
- [x] Update `VariableExplorer.ts` to import `escapeHtml` from utils
- [x] Fix `<title>Numi</title>` → `<title>LineSolv</title>` in `frontend/index.html`

**Refactor App.ts (reduce from 292 lines):**
- [x] Extract keyboard shortcut handling into `frontend/src/utils/shortcuts.ts`
- [x] Extract HTML result formatting into `frontend/src/utils/format.ts`:
  - [x] `formatResult(r: string): string`
  - [x] `buildLineResults(lines: string[], res: string[]): string`
- [x] Extract note management into `frontend/src/stores/notes.ts` (separate from calculator store)
- [x] Simplify `App.ts` renderApp to wire components only (target: ~120 lines)

**Expected deliverables:**
- Shared utility module
- Refactored App.ts (~120 lines)
- Correct HTML title
- Clean separation of concerns

**Completion checklist:**
- [x] `escapeHtml()` in shared utils, all 3 callers updated, old private methods removed
- [x] App.ts refactored with extracted modules (~120 lines)
- [x] `frontend/index.html` title is `LineSolv`
- [x] `npm run build` succeeds with no TypeScript errors
- [x] Both Go and frontend build cleanly

---

### Phase 4 — Error Handling & UX Improvements

**Objective:** Replace silent error swallowing with user-visible feedback. Add proper error propagation.

**Dependencies:** Phase 2, Phase 3

**Tasks:**

**Backend (Go):**
- [x] Modify `EvaluateLine` to return specific error messages instead of `("", nil)`
  - [x] Invalid syntax
  - [x] Division by zero
  - [x] Modulo by zero
  - [x] Unknown identifier
  - [x] Unknown function
  - [x] Wrong number of arguments
  - [x] Input too long
- [x] Modify `EvaluateAll` to propagate per-line errors instead of discarding with `_`
- [x] Preserve backward compatibility: errors are now included in result strings (prefixed with `Error: `)

**Frontend (TypeScript):**
- [x] Add error display in ResultDisplay component (red/muted color for error lines)
- [x] Style error messages distinctly from results (e.g., `color: var(--error)` or italic)
- [x] Add `--error` CSS custom property to theme (both dark and light)
- [x] Ensure empty `catch {}` blocks at least `console.warn` the error

**Expected deliverables:**
- Users see "Error: division by zero" instead of blank line
- Clear visual distinction between results and errors
- All `catch {}` blocks have at minimum a console warning

**Completion checklist:**
- [x] `EvaluateLine` returns descriptive error strings
- [x] `EvaluateAll` propagates per-line errors
- [x] Frontend displays errors with `--error` color
- [x] No empty `catch {}` blocks remain
- [x] Project builds cleanly

---

### Phase 5 — Testing

**Objective:** Add comprehensive test coverage for the calculator engine, starting with the most critical paths.

**Dependencies:** Phase 2 (backend improvements must be stable before writing tests)

**Tasks:**

**Go Tests (table-driven):**
- [ ] `engine_test.go`:
  - [ ] Test `EvaluateLine` with basic arithmetic (`1+1`, `2*3`, `10/2`)
  - [ ] Test `EvaluateLine` with natural language (`twenty five plus 3`, `what is 2+2`)
  - [ ] Test `EvaluateLine` with PEMDAS (`2+3*4`, `(2+3)*4`, `2^3^2`)
  - [ ] Test `EvaluateLine` with variables (`x=10`, `x*2`)
  - [ ] Test `EvaluateLine` with context references (`of that`, `then`, `result`)
  - [ ] Test `EvaluateLine` with unit conversion (`10 inches in cm`, `100 USD in EUR`)
  - [ ] Test `EvaluateLine` with percentages (`10% of 200`, `100+15%`)
  - [ ] Test `EvaluateLine` with error cases (div by zero, unknown identifier, empty input)
  - [ ] Test `EvaluateAll` with multi-line input
  - [ ] Test `EvaluateLine` edge cases (negative numbers, decimals, unary minus)
- [ ] `units_test.go`:
  - [ ] Test `convertUnit` for all categories (length, mass, volume, temperature, currency)
  - [ ] Test `convertUnit` edge cases (zero values, negative values, unknown units)
  - [ ] Test `RegisterUnit` behavior
- [ ] `functions_test.go`:
  - [ ] Test each built-in function with known inputs
  - [ ] Test argument count validation
  - [ ] Test edge cases (sqrt(-1) returns NaN, log(0) returns -Inf)
- [ ] `variables_test.go`:
  - [ ] Test `GetVariables`, `SetVariable`, `ClearVariables`
  - [ ] Test case-insensitivity
  - [ ] Test defensive copy behavior

**Frontend Tests (future — deferred):**
- CalculatorStore tests (navigateHistory, pushHistory, clearHistory)
- Note management logic

**Expected deliverables:**
- Comprehensive test suite for all engine components
- CI pipeline runs meaningful tests
- Test coverage report

**Completion checklist:**
- [ ] At least 50 test cases across all 4 test files
- [ ] All existing functionality has test coverage
- [ ] Edge cases covered (div by zero, NaN, overflow)
- [ ] `go test ./... -v` passes with no failures
- [ ] CI `test` job validates all tests

---

### Phase 6 — Performance & Security

**Objective:** Harden the application against edge cases and potential abuse. Improve error boundary handling.

**Dependencies:** Phase 4 (error handling improvements)

**Tasks:**
- [ ] Add `context.Context` to engine methods (EvaluateLine, EvaluateAll)
  - [ ] Add `context` parameter to `EvaluateLine` and `EvaluateAll`
  - [ ] Check `ctx.Done()` in the lexer/parser loop for cancellation
  - [ ] Propagate cancellation errors through the service layer
  - [ ] **Note:** Wails bindings may not support `context.Context` directly — if it breaks bindings, implement a timeout mechanism instead (time.After in service layer)
- [ ] Add stack depth limit to recursive descent parser (prevent stack overflow from deeply nested expressions, e.g., `(((...)))`)
  - [ ] Add `maxDepth` constant (default 100)
  - [ ] Track depth in parser struct
  - [ ] Return error if depth exceeded
- [ ] Add input length validation in `EvaluateLine` (max 10,000 chars, return clear error)
- [ ] Review `innerHTML` usage in ResultDisplay — ensure all user input is still escaped via `escapeHtml()`
- [ ] Document hardcoded currency rates as approximate/stale in `units.go` comment

**Expected deliverables:**
- Stack overflow prevention
- Input length enforcement
- Cancellation/timeout support
- Documented currency rate limitations

**Completion checklist:**
- [ ] Parser rejects expressions deeper than 100 levels
- [ ] Input length limit enforced
- [ ] Context cancellation or timeout mechanism in place
- [ ] No `innerHTML` with unescaped user input
- [ ] Currency rates documented as approximate
- [ ] `go vet ./...` clean

---

### Phase 7 — Documentation & Polish

**Objective:** Update all documentation to reflect code changes, add CHANGELOG, ensure developer onboarding is smooth.

**Dependencies:** All previous phases (documentation must reflect final state)

**Tasks:**
- [ ] Create `CHANGELOG.md` with release history (v0.1.0 → v0.1.45)
- [ ] Update `docs/api-reference.md` to reflect error handling changes (errors now return descriptive strings, not empty)
- [ ] Update `docs/calculator-engine.md` to document new functions and error handling
- [ ] Update `docs/development.md` to mention testing workflow and new modules
- [ ] Update `README.md`:
  - [ ] Ensure feature list is accurate
  - [ ] Add build badges for CI status
  - [ ] Add link to CHANGELOG.md
- [ ] Add Go doc comments to all exported types and functions:
  - [ ] `Engine` struct
  - [ ] `EvaluateLine`, `EvaluateAll`
  - [ ] `GetVariables`, `SetVariable`, `ClearVariables`
  - [ ] `GetHistory`, `ClearHistory`
  - [ ] `RegisterUnit`
  - [ ] `ConvertUnit`
  - [ ] `NewEngine`, `NewAppService`
- [ ] Add JSDoc comments to frontend exported functions and classes

**Expected deliverables:**
- CHANGELOG.md with version history
- Updated all docs files
- Go doc comments on all exported symbols
- JSDoc on all TypeScript classes/interfaces

**Completion checklist:**
- [ ] CHANGELOG.md created
- [ ] All 5 docs/ files updated
- [ ] All Go exported symbols have doc comments
- [ ] All TypeScript classes/interfaces have JSDoc
- [ ] README.md up to date

---

### Phase 8 — Build Verification & Final Review

**Objective:** Verify the entire project builds, all tests pass, and no regressions exist.

**Dependencies:** All previous phases

**Tasks:**
- [ ] Run `go vet ./...` — verify clean
- [ ] Run `go test ./... -v -count=1` — verify all tests pass
- [ ] Run `npm run build` in frontend/ — verify TypeScript compiles
- [ ] Run `wails build -tags "webkit2_41"` — verify full project builds
- [ ] Verify final source line counts are reasonable
- [ ] Update PLAN.md: mark all completed tasks
- [ ] Final review of all changes:
  - [ ] No dead code introduced
  - [ ] No regression in existing functionality
  - [ ] Error handling improved
  - [ ] Test coverage adequate
  - [ ] Documentation matches implementation
- [ ] Tag final commit with `v0.2.0`

**Expected deliverables:**
- Clean build on all platforms
- Passing test suite
- Finalized documentation
- v0.2.0 release candidate

**Completion checklist:**
- [ ] `go vet ./...` — clean
- [ ] `go test ./...` — all pass
- [ ] `npm run build` — clean
- [ ] `wails build` — success
- [ ] All Phase 1-7 tasks complete
- [ ] This plan fully updated

---

## Dependency Graph

```
Phase 1 (Analysis)
   └──> Phase 2 (Backend)
           ├──> Phase 3 (Frontend)
           │        └──> Phase 4 (Error Handling)
           │                 └──> Phase 5 (Testing)
           │                          └──> Phase 6 (Performance/Security)
           │                                   └──> Phase 7 (Documentation)
           │                                            └──> Phase 8 (Verification)
           └───────────────────────────────────────────────────────┘
```

Phases must be completed in order. No phase should begin until its dependencies are complete.

---

## Progress Tracking

| Phase | Status | Started | Completed |
|---|---|---|---|
| 0 — PLAN.md creation | ✅ | 2026-07-06 | 2026-07-06 |
| 1 — Project Analysis | ✅ | 2026-07-06 | 2026-07-06 |
| 2 — Core Architecture & Backend | ✅ | 2026-07-06 | 2026-07-06 |
| 3 — Frontend Refactoring | ✅ | 2026-07-06 | 2026-07-06 |
| 4 — Error Handling & UX | ✅ | 2026-07-06 | 2026-07-06 |
| 5 — Testing | ✅ | 2026-07-06 | 2026-07-06 |
| 6 — Performance & Security | ✅ | 2026-07-06 | 2026-07-06 |
| 7 — Documentation & Polish | ✅ | 2026-07-06 | 2026-07-06 |
| 8 — Build Verification | ✅ | 2026-07-06 | 2026-07-06 |

**Legend:** ✅ Complete | ⬜ Not Started | 🔄 In Progress | ❌ Blocked
