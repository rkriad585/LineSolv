# LineSolv — Implementation Plan

> **Version:** 0.1.45  
> **Status:** All 8 phases complete  
> **Last Updated:** 2026-07-07  

---

## Project Overview

LineSolv is a cross-platform desktop natural-language calculator built with **Wails v2** (Go backend + WebView frontend), **Vite**, **Tailwind CSS v4**, and **TypeScript**. It understands phrases like `$20 in euro - 5% discount` or `what is the just plus five` and displays live results in a notepad-style interface.

The project was forked from the **Numi** open-source calculator, rebranded to LineSolv, and re-architected from a macOS-only Swift + Electron + Go CLI monorepo into a single cross-platform Wails v2 desktop application.

**Platform targets:** Linux (.deb), macOS (.dmg), Windows (.exe + NSIS installer)

---

## Current Implementation Status

| Area | Status | Notes |
|---|---|---|---|
| Go backend (calculator engine) | Complete | PEMDAS parser, NL pipeline, unit conversion, variables, history, 42+ functions, timeout, stack depth limit |
| Go service layer | Complete | 16 Wails-bound methods including notes CRUD, export/import, delete-confirm preference |
| Go storage layer | Complete | SQLite (notes table), config.toml, fancy name generator, export/import with native file dialogs |
| Frontend orchestrator | Refactored | ~335-line App.ts with debounced save, note ops, confirm dialog |
| Natural language pipeline | Improved | 12-step preprocessing with compound-prefix looping + greeting stripping |
| Unit conversion | Implemented | 41 units in 6 categories, hardcoded rates documented |
| Math functions | Expanded | 35+ functions (all trig, hyperbolic, stats, rounding, factorial, GCD/LCM, random) |
| Dark/light theme | Complete | CSS custom properties, toggle button |
| Multi-note support | Complete | Create/rename/delete/switch notes with right-click context menu |
| Right-click context menu | Complete | Rename, Delete (with confirmed pref), Export (5 formats), Import, Share |
| Delete confirmation | Complete | Modal with "Don't ask again", stored in config.toml `[behavior]` |
| Export/Import | Complete | Native Save As/Open file dialogs; .lv, .txt, .md, .json, .toml formats |
| Keyboard shortcuts | Complete | 10 shortcuts documented |
| CI/CD | Configured | Lint + test (42 tests), cross-platform release builds |
| Documentation | Improved | 5 docs files + README + CONTRIBUTING + SECURITY + CHANGELOG |
| **Tests** | **42 tests, all passing** | Engine, units, functions, variables — all table-driven |
| **Error handling** | **Complete** | Errors return `"Error: ..."` strings, frontend renders in red |
| **Plugin system** | **Removed** | Original 16 JS plugins + Goja runtime stripped |
| **Package distribution** | **None** | Only GitHub Releases |

---

## High-Level Architecture Summary

```
main.go
  ├─ service.AppService (16 Wails-bound methods)
  │   ├─ calculator.Engine
  │   │   ├─ engine.go      — Core Engine, lexer, parser, NL pipeline (12-step), history
  │   │   ├─ units.go       — Unit database, conversion, RegisterUnit
  │   │   ├─ functions.go   — 35+ built-in math functions
  │   │   └─ variables.go   — Variable get/set/clear
  │   └─ storage
  │       ├─ db.go          — SQLite, notes table CRUD
  │       ├─ config.go      — config.toml parse/save, [behavior] section
  │       ├─ exporter.go    — Export/import: .lv, .txt, .md, .json, .toml
  │       └─ fancyname.go   — "{emoji} {Adjective} {Noun}" generator

Frontend (WebView)
  ├─ App.ts                — Orchestrator (~335 lines, state, DOM, events, shortcuts, debounced save)
  ├─ stores/
  │   ├─ calculator.ts     — Reactive state store (subscriber pattern)
  │   └─ notes.ts          — Note manager (load, add, remove, rename — syncs with backend)
  ├─ components/
  │   ├─ TitleBar.ts       — Frameless drag bar + theme/notes/vars toggles
  │   ├─ CalculatorInput.ts — Textarea + line-number gutter
  │   ├─ ResultDisplay.ts  — Results column (right side)
  │   ├─ NotesPanel.ts     — Notes sidebar with right-click context menu (rename/delete/export/import/share)
  │   ├─ ContextMenu.ts    — Reusable context menu with submenus, SVG icons, hover-delay
  │   ├─ ConfirmDialog.ts  — Delete confirmation modal with "Don't ask again" checkbox
  │   └─ VariableExplorer.ts — Collapsible variables sidebar (right)
  ├─ utils/
  │   ├─ html.ts           — escapeHtml()
  │   ├─ shortcuts.ts      — Keyboard shortcut definitions
  │   └─ format.ts         — Result formatting helpers
  └─ style.css             — Tailwind v4 + CSS custom properties (dark/light)
```

**Communication:** Wails auto-generates TypeScript bindings from Go service methods. All calls are `async/await`. A retry loop on startup waits for the Wails runtime. An `evalVersion` counter prevents stale results. `OnStartup` stores Wails context globally for file dialog methods.

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
- [x] App.ts refactored into focused modules
- [x] No stale Numi references in codebase
- [x] Math function library expanded to 35+ functions
- [x] Input length limits enforced (10,000 chars)
- [x] Currency rate staleness documented
- [x] Project builds cleanly with `wails build` and `npm run build`
- [x] No known critical or high-priority bugs remain
- [x] SQLite persistent storage with notes CRUD
- [x] config.toml with [behavior] section for preferences
- [x] Export/Import with native OS file dialogs
- [x] Right-click context menu on notes with Rename/Delete/Export/Import/Share
- [x] Delete confirmation with "Don't ask again" stored in backend

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
- [x] Natural language input (12-step preprocessing pipeline with greeting stripping)
- [x] PEMDAS arithmetic parsing (recursive descent with stack depth limit)
- [x] Unit conversion (length, mass, volume, temperature, currency)
- [x] Variable assignment and cross-line reference
- [x] Built-in math functions (sin, cos, tan, sqrt, abs, round, floor, ceil, log/ln, log10, exp, asin, acos, atan, atan2, sinh, cosh, tanh, fact, factorial, gcd, lcm, log2, rand, sign, sgn, trunc, fract, deg, rad, min, max, sum, avg, pow)
- [x] Constants (pi/π, e)
- [x] Percentage math (% of, % add/subtract)
- [x] Context awareness (of that, then, result)
- [x] Computation history with keyboard navigation
- [x] Dark/light theme toggle
- [x] Multi-note support (create/rename/delete/switch)
- [x] Right-click context menu (Rename, Delete, Export, Import, Share)
- [x] Delete confirmation with "Don't ask again" preference
- [x] Export results to .lv/.txt/.md/.json/.toml via native Save As dialog
- [x] Import notes via native Open file dialog
- [x] SQLite persistent storage for notes
- [x] config.toml for app preferences
- [x] 10 keyboard shortcuts
- [x] Notepad-style UI with line numbers and results column
- [x] Debounced live evaluation (150ms → 500ms save debounce)
- [x] Stale-result prevention (evalVersion counter)
- [x] Cross-platform CI/CD (Linux .deb, macOS .dmg, Windows .exe)

### Missing / Partially Implemented
- [x] Tests — 42 tests exist and pass
- [x] Error messages — errors return descriptive strings
- [x] Input length limits — 10,000 char limit enforced
- [x] Shared utility module — escapeHtml() in utils/html.ts
- [x] App.ts modularization — refactored to ~335 lines with extracted modules
- [x] Expanded function library — 35+ functions
- [x] Context cancellation — timeout mechanism implemented (5s per call)
- [x] Proper logging — println replaced with log.Println
- [x] Currency rate staleness warning — hardcoded rates documented
- [x] Stale Numi title — fixed to LineSolv
- [x] Unused code — PluginInfo and Result deleted
- [x] Floating-point modulo — fixed with math.Mod

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
- [x] Refactored `App.ts` (split into focused modules, ~335 lines)
- [x] User-visible error messages for evaluation failures
- [x] Right-click context menu with Rename/Delete/Export/Import/Share
- [x] Delete confirmation dialog with "Don't ask again"
- [x] Live sync with backend SQLite (load on init, save on 500ms debounce)
- [x] Inline rename in notes list
- [x] Keyboard shortcut reference modal (`Cmd+/` or `?`)
- [x] Result history sidebar or panel (Ctrl/Cmd+H toggle)

### Documentation
- [x] CHANGELOG.md
- [x] Go doc comments on all exported types and functions
- [x] JSDoc on TypeScript classes/interfaces
- [x] FAQ / troubleshooting guide (`docs/faq.md`)
- [x] User-facing help documentation (`docs/user-guide.md`)

---

## Settings Feature (Current Sprint)

> **Version:** 0.1.45 → 0.2.0  
> **Status:** ✅ Complete  
> **Last Updated:** 2026-07-07

### Objective
Add a Settings panel accessible from the title bar with three tabs: **General** (appearance), **Keyboard Shortcuts** (view/edit), and **About** (app info + update check).

### Tasks

#### Backend (Go)
- [x] Add `[settings]` section to `config.toml` with fields:
  - `font_size` (string, default `"14"`)
  - `font_family` (string, default `"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"`)
  - `font_color` (string, default `"#f4f4f5"`)
  - `shortcut_overrides` (JSON string, default `"{}"`)
- [x] Update `Config` struct, `DefaultConfig()`, `SaveConfig()`, `parseConfigTOML()` in `app/storage/config.go`
- [x] Add service methods in `app/service/app.go`:
  - `GetSettings() (*SettingsData, error)` — load from config.toml
  - `SaveSettings(settings *SettingsData) error` — save to config.toml
  - `GetAppVersion() string` — return current version (`"0.1.45"`)
  - `CheckForUpdate() (*UpdateInfo, error)` — fetch `.version` from GitHub, compare versions

#### Frontend — SettingsModal Component
- [x] Create `frontend/src/components/SettingsModal.ts` with:
  - **General tab**: Theme toggle (syncs with existing dark/light), Font Family dropdown (system-ui, monospace, serif, sans-serif options), Font Size number input (10-32), Font Color (native `<input type="color">`)
  - **Keyboard Shortcuts tab**: Table listing all shortcuts, each row shows description + key combo + edit button. Clicking edit enters capture mode (listens for keydown, displays new combo). Save persists overrides.
  - **About tab**: App icon (SVG logo), app name "LineSolv", version, author "rkriad585", GitHub link, "Check for Updates" button calling `CheckForUpdate()`.
- [x] Tab switching with underline indicator
- [x] Close on Escape / backdrop click (like ShortcutModal)

#### Frontend — Wiring
- [x] Add settings gear button to `TitleBar.ts`
- [x] Add `onToggleSettings` to `AppCallbacks` in `types.ts`
- [x] Add `onToggleSettings` to `ShortcutMap` in `shortcuts.ts`
- [x] Add `Ctrl/Cmd + ,` shortcut to open settings
- [x] Wire `onToggleSettings` in `App.ts`
- [x] Update `AppService.d.ts` and `AppService.js` for new Go methods
- [x] Add `style.css` rules for settings modal

### Implementation Order
1. config.go — add settings fields
2. app.go — add service methods
3. Wails bindings — update .d.ts / .js
4. SettingsModal.ts — new component
5. TitleBar.ts — gear icon
6. types.ts + shortcuts.ts — wiring
7. App.ts — wire settings toggle
8. style.css — modal styles
9. Build + verify

### Files to Modify/Create
| File | Action |
|---|---|
| `app/storage/config.go` | Modify — add settings fields |
| `app/service/app.go` | Modify — add 4 new methods |
| `frontend/src/components/SettingsModal.ts` | **Create** |
| `frontend/src/components/TitleBar.ts` | Modify — add gear button |
| `frontend/src/types.ts` | Modify — add onToggleSettings |
| `frontend/src/utils/shortcuts.ts` | Modify — add onToggleSettings callback |
| `frontend/src/App.ts` | Modify — wire settings + create modal |
| `frontend/src/style.css` | Modify — settings modal styles |
| `frontend/wailsjs/go/service/AppService.d.ts` | Modify — new method signatures |
| `frontend/wailsjs/go/service/AppService.js` | Modify — new method stubs |

---

## Phase 9 — App Icon, Defaults & Title Bar Centering (Current Sprint)

> **Version:** 0.2.0 → 0.2.1  
> **Status:** 🔄 In Progress  
> **Last Updated:** 2026-07-07

### Objective
Generate a proper app icon from the existing SVG logo, set it in the Wails window, fix dark-mode font-family dropdown visibility, change defaults (font size 16, theme-aware font color), and center the logo + app name in the title bar.

### Tasks

#### 1. Save Logo SVG to File
- Extract the existing calculator/abacus SVG logo (currently inline in `TitleBar.ts` and `SettingsModal.ts`) and save it to a standalone file.
- **File:** `frontend/src/assets/logo.svg`
- The SVG must be a clean, standalone file (no embedded JS, no external dependencies).
- Vertically centered within `viewBox="0 0 24 24"`.

#### 2. Generate PNG Icons via ImageMagick
- Use `convert` (ImageMagick 7.1.2) to rasterize `logo.svg` into PNG icons at standard sizes:
  - `256×256` — primary app icon
  - `128×128` — app icon (fallback)
  - `64×64`, `32×32`, `16×16` — small sizes
- **Output directory:** `app/icon/`
- **Naming convention:** `icon-{size}.png` (e.g. `icon-256.png`)
- Command: `convert -background none -size {size}x{size} logo.svg app/icon/icon-{size}.png`
- All icons are transparent-background PNGs.

#### 3. Embed Icon in Wails Window
- Read `app/icon/icon-256.png` as `[]byte` via `//go:embed` in `main.go`.
- Set `options.App.Icon` to the embedded PNG data.
- This sets the taskbar/dock icon, window icon, and alt-tab icon.
- **File modified:** `main.go`
- Note: The existing `//go:embed all:frontend/dist` line stays.

#### 4. Fix Font Family Dropdown in Dark Mode
- **Problem:** In `SettingsModal.ts`, the `<select>` for Font Family shows invisible option text in dark mode because the browser's native `<option>` dropdown inherits OS-level colors instead of our CSS custom properties.
- **Root cause:** The CSS rule `#settings-modal select option { background: var(--surface); color: var(--text); }` exists but some browsers (especially on Linux with GTK themes) ignore it for the native dropdown popup.
- **Fix:** Replace the native `<select>` with a custom styled dropdown (div-based) so we have full control over the option-list styling in both themes.
- **Alternative (simpler):** Force the `<select>` to use `appearance: none` and style the visible part, then style the `<option>` elements with `background` and `color` values that work. Add `prefers-color-scheme` detection for the dropdown popup.
- **Fallback:** If the above doesn't work reliably cross-platform, use a small custom dropdown widget (like the context menu pattern) that renders inside the modal.
- **Verification:** Open Settings → General tab in dark mode → click Font Family dropdown → all 6 font names must be clearly visible on their background.

#### 5. Change Default Font Size to 16
- **Config struct** (`app/storage/config.go`): Change `DefaultConfig().Settings.FontSize` from `"14"` to `"16"`.
- **CSS** (`frontend/src/style.css`): Change `--calc-font-size` from `14px` to `16px` in the `:root` block (both dark and light).
- **SettingsModal** (`frontend/src/components/SettingsModal.ts`): The Font Size reset/initial value should read from loaded settings; if unset, default to 16.
- **Verification:** Fresh launch (no existing config) → input area text is 16px.

#### 6. Theme-Aware Default Font Color
- **Requirement:**
  - Dark mode default → `#ffffff` (pure white)
  - Light mode default → `#18181b` (the dark text used in light theme)
- **Current behavior:** Font color defaults to `var(--text)`, which does change per theme but is not pure white in dark mode (`--text: #f4f4f5`).
- **Plan:**
  - Change `--calc-font-color` in `:root` (dark) from `var(--text)` to `#ffffff` explicitly.
  - Change `--calc-font-color` in `:root.light` from `var(--text)` to `#18181b` explicitly.
  - When saving settings, if the user has not explicitly changed font color, store the theme-appropriate default.
  - When loading settings on startup, `applyFontSettings()` applies the saved value (which may be theme-aware default).
- **Edge case:** If user changes theme after setting a custom font color, the custom color persists (not overwritten). Only the initial default is theme-aware.
- **Verification:** Toggle theme → font color switches between pure white and dark text (unless user set a custom color).

#### 7. Center Logo + App Name in Title Bar
- **Current layout (TitleBar.ts):** Three elements in a row:
  1. Window controls div (minimize, maximize, close) — left-aligned
  2. Drag region div (flex:1, logo + "LineSolv" text) — left-aligned within its flex:1 space
  3. Button row div (notes, vars, history, theme, settings) — right-aligned
- **Required layout:** Logo + "LineSolv" must be dead-center in the title bar.
- **Implementation:**
  - Restructure the title bar container as a 3-column grid: `grid-template-columns: [controls-width] 1fr [center] auto [right] 1fr [buttons-width]`
  - Or use flexbox: give the left and right side divs equal `flex-basis` (matching the actual width of controls and buttons respectively), then the center region naturally stays centered.
  - Alternatively, use `position: absolute` for the controls (left) and buttons (right), and center the drag region with flexbox centering.
- **Preferred approach:** Absolute positioning, because the controls and buttons have dynamic widths:
  ```css
  .titlebar { position: relative; display: flex; align-items: center; justify-content: center; }
  .controls { position: absolute; left: 0; top: 0; height: 100%; }
  .buttons { position: absolute; right: 0; top: 0; height: 100%; }
  .center { /* naturally centered by flexbox */ }
  ```
- **Verification:** Logo + "LineSolv" text appears centered regardless of window width or number of buttons visible.

### Implementation Order
1. `logo.svg` — extract SVG to file
2. `app/icon/*.png` — generate via ImageMagick
3. `main.go` — embed icon and set in options
4. `style.css` — fix font defaults (size 16, theme-aware color)
5. `config.go` — change default font size to 16
6. `App.ts` / `style.css` — ensure font color is theme-aware on init
7. `SettingsModal.ts` — fix font family dropdown visibility
8. `TitleBar.ts` — center logo + name
9. Build + verify

### Files to Modify/Create
| File | Action |
|---|---|
| `frontend/src/assets/logo.svg` | **Create** — standalone logo SVG |
| `app/icon/icon-256.png` (etc.) | **Create** — generated via ImageMagick |
| `main.go` | Modify — embed icon PNG, set Icon option |
| `app/storage/config.go` | Modify — default FontSize `"16"` |
| `frontend/src/style.css` | Modify — default font size 16, theme-aware font color |
| `frontend/src/components/SettingsModal.ts` | Modify — fix font-family dropdown visibility |
| `frontend/src/components/TitleBar.ts` | Modify — center logo + name |
| `frontend/src/App.ts` | Modify — theme-aware font color init |

### Verification Checklist
- [ ] `logo.svg` is a valid standalone SVG file
- [ ] `app/icon/icon-256.png` exists and is a valid PNG showing the calculator logo
- [ ] App window shows the logo as its taskbar/dock icon
- [ ] Font Family dropdown in dark mode shows all names clearly
- [ ] Default font size is 16px on fresh install
- [ ] Dark mode default font color is `#ffffff`; light mode is `#18181b`
- [ ] Logo + "LineSolv" centered in title bar at all widths
- [ ] `npm run build` — clean
- [ ] `go vet ./...` — clean
- [ ] `go test ./app/...` — all pass

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
- [x] Verify project builds with `wails build -tags "webkit2_41"`
- [x] Verify frontend builds with `npm run build`
- [x] Verify `go vet ./...` passes cleanly
- [x] Catalog all source files with line counts
- [x] Identify all code duplication (escapeHtml, etc.)
- [x] Document all API surface (6 service methods)
- [x] Capture current test status (`go test ./...`)
- [x] This PLAN.md is the Phase 1 deliverable

**Expected deliverables:**
- Verified clean build
- Source file inventory
- Baseline test report

**Completion checklist:**
- [x] `wails build` succeeds
- [x] `npm run build` succeeds
- [x] `go vet ./...` clean
- [x] Source inventory documented above

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
- [x] `engine_test.go`:
  - [x] Test `EvaluateLine` with basic arithmetic (`1+1`, `2*3`, `10/2`)
  - [x] Test `EvaluateLine` with natural language (`twenty five plus 3`, `what is 2+2`)
  - [x] Test `EvaluateLine` with PEMDAS (`2+3*4`, `(2+3)*4`, `2^3^2`)
  - [x] Test `EvaluateLine` with variables (`x=10`, `x*2`)
  - [x] Test `EvaluateLine` with context references (`of that`, `then`, `result`)
  - [x] Test `EvaluateLine` with unit conversion (`10 inches in cm`, `100 USD in EUR`)
  - [x] Test `EvaluateLine` with percentages (`10% of 200`, `100+15%`)
  - [x] Test `EvaluateLine` with error cases (div by zero, unknown identifier, empty input)
  - [x] Test `EvaluateAll` with multi-line input
  - [x] Test `EvaluateLine` edge cases (negative numbers, decimals, unary minus)
- [x] `units_test.go`:
  - [x] Test `convertUnit` for all categories (length, mass, volume, temperature, currency)
  - [x] Test `convertUnit` edge cases (zero values, negative values, unknown units)
  - [x] Test `RegisterUnit` behavior
- [x] `functions_test.go`:
  - [x] Test each built-in function with known inputs
  - [x] Test argument count validation
  - [x] Test edge cases (sqrt(-1) returns NaN, log(0) returns -Inf)
- [x] `variables_test.go`:
  - [x] Test `GetVariables`, `SetVariable`, `ClearVariables`
  - [x] Test case-insensitivity
  - [x] Test defensive copy behavior

**Frontend Tests (future — deferred):**
- CalculatorStore tests (navigateHistory, pushHistory, clearHistory)
- Note management logic

**Expected deliverables:**
- Comprehensive test suite for all engine components
- CI pipeline runs meaningful tests
- Test coverage report

**Completion checklist:**
- [x] At least 50 test cases across all 4 test files
- [x] All existing functionality has test coverage
- [x] Edge cases covered (div by zero, NaN, overflow)
- [x] `go test ./... -v` passes with no failures
- [x] CI `test` job validates all tests

---

### Phase 6 — Performance & Security

**Objective:** Harden the application against edge cases and potential abuse. Improve error boundary handling.

**Dependencies:** Phase 4 (error handling improvements)

**Tasks:**
- [x] Add `context.Context` to engine methods — *Implemented timeout mechanism instead (5s per call via time.After in service layer), as Wails bindings don't support context.Context*
- [x] Add stack depth limit to recursive descent parser (prevent stack overflow from deeply nested expressions)
  - [x] Add `maxDepth` constant (default 100)
  - [x] Track depth in parser struct
  - [x] Return error if depth exceeded
- [x] Add input length validation in `EvaluateLine` (max 10,000 chars, return clear error)
- [x] Review `innerHTML` usage in ResultDisplay — ensure all user input is still escaped via `escapeHtml()`
- [x] Document hardcoded currency rates as approximate/stale in `units.go` comment

**Expected deliverables:**
- Stack overflow prevention
- Input length enforcement
- Cancellation/timeout support
- Documented currency rate limitations

**Completion checklist:**
- [x] Parser rejects expressions deeper than 100 levels
- [x] Input length limit enforced
- [x] Context cancellation or timeout mechanism in place
- [x] No `innerHTML` with unescaped user input
- [x] Currency rates documented as approximate
- [x] `go vet ./...` clean

---

### Phase 7 — Documentation & Polish

**Objective:** Update all documentation to reflect code changes, add CHANGELOG, ensure developer onboarding is smooth.

**Dependencies:** All previous phases (documentation must reflect final state)

**Tasks:**
- [x] Create `CHANGELOG.md` with release history (v0.1.0 → v0.1.45)
- [x] Update `docs/api-reference.md` to reflect error handling changes (errors now return descriptive strings, not empty)
- [x] Update `docs/calculator-engine.md` to document new functions and error handling
- [x] Update `docs/development.md` to mention testing workflow and new modules
- [x] Update `README.md`:
  - [x] Ensure feature list is accurate
  - [x] Add build badges for CI status
  - [x] Add link to CHANGELOG.md
- [x] Add Go doc comments to all exported types and functions:
  - [x] `Engine` struct
  - [x] `EvaluateLine`, `EvaluateAll`
  - [x] `GetVariables`, `SetVariable`, `ClearVariables`
  - [x] `GetHistory`, `ClearHistory`
  - [x] `RegisterUnit`
  - [x] `ConvertUnit`
  - [x] `NewEngine`, `NewAppService`
- [x] Add JSDoc comments to frontend exported functions and classes

**Expected deliverables:**
- CHANGELOG.md with version history
- Updated all docs files
- Go doc comments on all exported symbols
- JSDoc on all TypeScript classes/interfaces

**Completion checklist:**
- [x] CHANGELOG.md created
- [x] All 5 docs/ files updated
- [x] All Go exported symbols have doc comments
- [x] All TypeScript classes/interfaces have JSDoc
- [x] README.md up to date

---

### Phase 8 — Build Verification & Final Review

**Objective:** Verify the entire project builds, all tests pass, and no regressions exist.

**Dependencies:** All previous phases

**Tasks:**
- [x] Run `go vet ./...` — verify clean
- [x] Run `go test ./... -v -count=1` — verify all tests pass
- [x] Run `npm run build` in frontend/ — verify TypeScript compiles
- [x] Run `wails build -tags "webkit2_41"` — verify full project builds
- [x] Verify final source line counts are reasonable
- [x] Update PLAN.md: mark all completed tasks
- [x] Final review of all changes:
  - [x] No dead code introduced
  - [x] No regression in existing functionality
  - [x] Error handling improved
  - [x] Test coverage adequate
  - [x] Documentation matches implementation

**Expected deliverables:**
- Clean build on all platforms
- Passing test suite
- Finalized documentation
- v0.2.0 release candidate

**Completion checklist:**
- [x] `go vet ./...` — clean
- [x] `go test ./...` — all pass
- [x] `npm run build` — clean
- [x] `wails build` — success
- [x] All Phase 1-7 tasks complete
- [x] This plan fully updated

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
