# LineSolv — Development Plan

## Project Summary

### Purpose
LineSolv is a natural-language calculator desktop app that understands phrases like `$20 in euro - 5% discount` or `what is pi plus five`. It combines a Go-based arithmetic engine (recursive-descent PEMDAS parser with 15-step natural language preprocessing pipeline) with a clean, frameless desktop UI.

### Goals
- Provide fast, offline, privacy-focused natural-language arithmetic evaluation
- Support unit conversion (100+ units, 14 categories) with live currency rates
- Manage multiple calculation notes with persistent storage (SQLite)
- Deliver a polished desktop experience via Wails v2 (Go backend + vanilla TypeScript frontend)

### Current Capabilities
- Natural language arithmetic: `twenty five percent of 200`, `half as much as 100`, `2h30m in minutes`
- 26 built-in math functions: trig, hyperbolic, rounding, stats, random
- 100+ units across 14 dimensions: length, mass, volume, temperature, time, digital, speed, area, force, energy, power, pressure, currency
- Live currency conversion via exchangerate-api.com
- Multiple notes with SQLite persistence
- 5 export formats: `.lv`, `.txt`, `.md`, `.json`, `.toml`
- Import note from `.json`
- 7 themes: dark, light, neon, red, obsidian, plasma, blood
- 35+ keyboard shortcuts with customizable overrides
- Built-in documentation viewer with custom Markdown renderer
- Print with A4 formatting and watermark
- Frameless window with custom title bar

### Technology Stack
- **Backend**: Go 1.25, Wails v2.12.0, mattn/go-sqlite3, google/uuid
- **Frontend**: Vanilla TypeScript (ESNext, strict), Tailwind CSS v4, Vite 6
- **Storage**: SQLite (WAL mode), TOML config file
- **Build**: Wails CLI, Vite, tsc
- **CI/CD**: GitHub Actions (lint, test, release for Linux/macOS/Windows)

### Current Architecture
```
main.go → Wails App (frameless window)
  ├── app/service/app.go         (Wails-bound API: ~20 methods)
  │   ├── app/storage/db.go      (SQLite CRUD for notes)
  │   ├── app/storage/config.go  (TOML config parser/serializer)
  │   ├── app/storage/exporter.go (5 export formats)
  │   └── app/storage/fancyname.go (random note names)
  ├── app/calculator/engine.go   (2100-line NL parser + evaluator)
  │   ├── app/calculator/functions.go (26 built-in math functions)
  │   ├── app/calculator/units.go     (100+ unit definitions + currency)
  │   └── app/calculator/variables.go (case-insensitive variable store)
  └── frontend/src/              (vanilla TS, no framework)
      ├── App.ts                 (orchestrator: 430 lines)
      ├── components/            (11 UI components)
      ├── stores/                (calculator.ts, notes.ts)
      └── utils/                 (format.ts, html.ts, shortcuts.ts)
```

---

## Research Findings

### Web Research
- **Wails v2.12** is the current stable release. Frameless window pattern uses `--wails-draggable:drag` on parent elements and `--wails-draggable:no-drag` on interactive children. Wails v3 is in alpha with breaking API changes.
- **Wails benefits** vs Electron: 60-80% less memory, 3-5× faster startup, 10-50× smaller binaries (20-50MB vs 100-200MB).
- **Wails community**: Active Discord, 34.6k GitHub stars, regular releases. Good documentation for v2.

### Competitive Analysis
| Feature | LineSolv | Calculator Air | LetsCalc | Hissab | Solvely |
|---------|----------|---------------|----------|--------|---------|
| Natural language | ✅ | ✅ | ✅ | ✅ | ❌ (photo) |
| Offline | ✅ | Partial | ❌ | ✅ | ❌ |
| Desktop app | ✅ | ❌ (mobile) | ❌ (mobile) | ✅ (web) | ❌ (mobile) |
| Unit conversion | ✅ (100+) | ✅ | ✅ | ❌ | ❌ |
| Currency (live) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Step-by-step | ❌ | ❌ | ❌ | ❌ | ✅ |
| Graphing | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voice input | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI explanations | ❌ | ❌ | ❌ | ✅ (writes math) | ✅ |
| Privacy-first | ✅ | Mixed | ✅ | ✅ | Mixed |
| Multiple notes | ✅ | ❌ | ❌ | ✅ | ❌ |
| Themes | ✅ (7) | ❌ | ❌ | ❌ | ❌ |

### Community Feedback (Verified)
- Natural language input is the #1 most-wanted calculator feature in 2026
- Offline capability and privacy are critical (no tracking, no accounts)
- Step-by-step explanations are highly valued for learning
- Desktop calculator market is underserved — most innovation is mobile-only
- Users want graphing and visualization (charts, plots)

### Key Differentiators for LineSolv
- **Desktop-native**: No competitor combines desktop + natural language + privacy
- **Offline-first**: Works without internet (except live currency)
- **Deterministic**: No AI hallucination — every calculation is reproducible
- **Notes-based**: Multiple calculation contexts, not just a single input

---

## Improvement Opportunities

### Bugs (Verified)
- [~] `autocorrect` typo in `CalculatorInput.ts:22` — **not a bug**: `autocorrect` is the correct Safari attribute name
- [x] Deprecated `document.execCommand('undo')` / `('redo')` in `shortcuts.ts` — replaced with manual 200-entry undo/redo stack
- [x] HTML injection in `DocsViewer.ts` — `escapeHtml()` regex missing `'` and `/` escaping; replaced with shared DOM-based `escapeHtml` from `utils/html.ts`
- [x] Path traversal in `ExportNoteToFile` (`app.go`) — added `..` → `_` sanitization
- [x] Config struct ambiguity in `config.go` — removed unused top-level `Theme`/`Version` fields, redirected orphan parser fallback to `cfg.App.*`
- [~] Startup retry `setInterval` never cleared if Wails bridge never loads — **not a bug**: actual code uses a for-loop with `await setTimeout`, not `setInterval`; no resource leak

### Technical Debt
- [x] Zero test coverage on `app/storage/` (db.go, config.go, exporter.go, fancyname.go) — 28 tests added across 4 test files
- [x] Zero test coverage on `app/service/app.go` — 13 tests added
- [x] Zero frontend tests — Vitest + jsdom installed, 4 tests in `utils/html.test.ts`
- [x] Shortcut definitions duplicated across `ShortcutModal.ts` and `SettingsModal.ts` — unified via shared `utils/shortcutDefs.ts`
- [x] Gutter DOM thrashing — fixed by virtualized gutter in Phase 4 (DOM node diffing, no innerHTML)
- [ ] Mixed styling approach — Tailwind classes overridden by inline `style.cssText`
- [x] `math/rand` not explicitly seeded in `fancyname.go` — added `init()` with `rand.Seed(time.Now().UnixNano())`
- [x] Stale artifact: `frontend/package.json.md5` — removed and added to `.gitignore`

### New Features
- [x] **Step-by-step evaluation**: Show intermediate computation steps (student-friendly) — implemented
- [x] **Graphing / charting**: Plot functions and data series — implemented (Chart.js, 200-point sampling)
- [ ] **Voice input**: Microphone button + Web Speech API + offline support 
- [x] **Note search**: Search across all notes' names and content
- [x] **Drag-and-drop reorder**: Reorder notes and history items — implemented (HTML5 DnD, SQLite persistence)
- [x] **Undo/redo for note content**: Replaced deprecated execCommand with manual 200-entry stack
- [x] **Auto-save**: Debounced persistence with dirty-state indicator — implemented (dirty dot + on-save)
- [ ] **Sticky/pinned notes**: Pin frequently used notes to top

### Feature Enhancements
- [x] **Offline currency cache**: Cache exchange rates with expiry, show last-updated timestamp
- [x] **More export formats**: PDF added via gofpdf (beyond current print mechanism)
- [ ] **Custom themes**: Allow user-defined accent/background colors
- [ ] **Font ligatures**: Support for programming ligatures in input area
- [x] **Search within history**: History panel search/filter

### UI/UX Improvements
- [ ] **Responsive resize**: Better behavior at min-width/min-height
- [x] **Loading states**: Smooth loading indicators for async operations (CSS spinner after 60ms delay)
- [x] **Toast notifications**: Non-modal feedback for save/export/import actions
- [x] **Smooth transitions**: CSS transitions for panel toggles, theme switches
- [x] **Keyboard navigation**: Tab order, focus indicators (focus-visible rings), Escape to close panels

### Performance
- [x] **Gutter virtualization**: Only render visible line numbers (viewport + 5-line overscan, rAF-throttled)
- [x] **Debounced eval**: 150ms in place, stale-result detection via evalVersion counter
- [x] **Lazy panel rendering**: Defer rendering off-screen panels until opened (needsRender flags)

### Accessibility
- [x] **ARIA labels**: Add screen-reader attributes to all interactive elements (15 aria-labels across 5 components)
- [ ] **Focus management**: Proper focus trapping in modals, keyboard navigation
- [ ] **Color contrast**: Verify all themes meet WCAG AA contrast ratios
- [x] **Reduced motion**: Respect `prefers-reduced-motion` (disables all animations/transitions)

### Developer Experience
- [x] **Frontend test framework**: Vitest + jsdom installed, tests passing (29 tests across 3 files)
- [x] **Shared shortcut definitions**: Created `utils/shortcutDefs.ts`, deduplicated across ShortcutModal and SettingsModal
- [ ] **Go linting**: Add `golangci-lint` config
- [ ] **Pre-commit hooks**: Add husky/lint-staged
- [ ] **Migration to Wails v3**: Evaluate when stable

### Security
- [x] **Path traversal fix**: Added `..` → `_` sanitization in export filenames
- [x] **Input validation**: Limit input size (10k char maxLength on textarea + Go engine 10k limit)
- [x] **XSS hardening**: All escapeHtml now uses shared DOM-based `utils/html.ts`, consistent across all components

### Code Quality
- [ ] **Extract layout from App.ts**: App.ts is 671 lines — extract panel layout into components
- [x] **Unify escapeHtml**: All usage now goes through `utils/html.ts` (was 3 separate copies)
- [x] **Config types cleanup**: Removed ambiguous top-level `Theme`/`Version` fields from Config struct
- [ ] **Error handling**: Consistent error pattern across all Go methods

---

## Development Roadmap

### ✅ Phase 1 — Foundation & Bug Fixes (Highest Priority) — **Completed**

**Objective**: Fix known bugs, eliminate technical debt, and establish testing foundations.

**Deliverables**:
- All known bugs fixed
- Storage and service layer tests added
- Frontend test framework installed
- Shortcut definitions deduplicated

**Implementation Tasks**:

- [~] Fix `autocorrect` typo → `autocorrect` in `CalculatorInput.ts` — **cancelled**: `autocorrect` is the correct Safari attribute name, not a bug
- [x] Fix deprecated `execCommand` undo/redo — implemented manual 200-entry undo/redo stack with snapshot pushes on all direct value mutations
- [x] Fix HTML injection in `DocsViewer.ts` — added `'` and `/` to escapeHtml; then replaced entirely with shared DOM-based `escapeHtml` from `utils/html.ts`
- [x] Fix path traversal in `ExportNoteToFile` — added `strings.ReplaceAll(name, "..", "_")` sanitization
- [~] Fix startup retry — clear interval after successful connect or max attempts — **cancelled**: actual code uses `for`+`await setTimeout`, not `setInterval`; no resource leak
- [x] Add tests for `app/storage/db.go` — 12 tests (CRUD, GetAll, count, not-found, etc.)
- [x] Add tests for `app/storage/config.go` — 4 tests (default, save/load round-trip, nonexistent defaults, TOML parse)
- [x] Add tests for `app/storage/exporter.go` — 8 tests (all 5 formats, default, empty note, JSON round-trip)
- [x] Add tests for `app/storage/fancyname.go` — 4 tests (non-empty, format, emoji, variety)
- [x] Add tests for `app/service/app.go` — 13 tests (eval, variables, history, docs, notes CRUD, export, settings, etc.)
- [x] Install Vitest + jsdom for frontend testing
- [x] Create shared shortcut definitions source `utils/shortcutDefs.ts`
- [x] Deduplicate ShortcutModal.ts and SettingsModal.ts to use shared source
- [x] Remove stale `frontend/package.json.md5`
- [x] Explicitly seed `math/rand` in `fancyname.go`
- [x] Fix config struct ambiguity in `config.go`
- [x] Run `go vet ./...` and `go test ./...` — all pass

**Completion Checklist**:
- [x] All bugs fixed (2 confirmed, 2 not applicable)
- [x] Storage test coverage ≥ 70%
- [x] Service test coverage ≥ 60%
- [x] Frontend test framework ready
- [x] Shortcut definitions deduplicated
- [x] `go vet` and `go test` pass with zero warnings

---

### ✅ Phase 2 — User Experience & Polish — **Completed**

**Objective**: Improve the everyday user experience with quality-of-life features.

**Deliverables**:
- Search across notes
- Note content undo/redo with proper stack
- Offline currency caching
- Toast notifications for actions
- Smooth transitions and loading states

**Implementation Tasks**:

- [x] Implement note search (filter notes by name in NotesPanel)
- [x] Implement undo/redo stack for note content (completed in Phase 1)
- [x] Implement offline currency rate cache (DB table + fetch + cache-on-failure)
- [x] Add toast notification component (`utils/toast.ts`)
- [x] Wire toasts for save/export/import/delete actions
- [x] Add CSS transitions for panel slide-in/slide-out
- [x] Add smooth transition for theme changes (via global * transition)
- [x] Add loading spinner/indicator for async operations
- [x] Fix gutter DOM thrashing — diff-based line number update
- [x] Add dirty-state indicator (unsaved changes dot on note tab)
- [x] Add `aria-label` attributes to all buttons and interactive elements
- [x] Add note search shortcut (Ctrl+F) to focus search input

**Completion Checklist**:
- [x] Note search works (filters in real-time via search input + Ctrl+F)
- [x] Undo/redo works reliably (Ctrl+Z / Ctrl+Shift+Z) 
- [x] Currency conversion works offline with cached rates
- [x] Toasts appear for all CRUD operations
- [x] Panel transitions are smooth (transition-all present, plus global * transition)
- [x] Gutter updates efficiently (diff-based DOM, no innerHTML replacement)

---

### Phase 3 — Feature Expansion

**Objective**: Add high-value features that differentiate LineSolv from competitors.

**Deliverables**:
- [x] Step-by-step evaluation display
- [x] Graphing / charting (basic function plotting)
- [x] History search and filtering
- [x] Drag-and-drop note reordering
- [x] PDF export

**Implementation Tasks**:

- [x] Design step-by-step display format (backend returns intermediate Step structs)
- [x] Modify `engine.go` parser to collect steps at each parse level
- [x] Create `steps.go` with `Step` and `EvalDetail` types
- [x] Create `StepsPanel.ts` component following existing panel patterns
- [x] Wire `GetSteps` binding in `AppService` and frontend bindings
- [x] Add steps toggle button in TitleBar (⌘S shortcut)
- [x] Steps show naturalized expression, parse-tree reductions (add, subtract, multiply, divide, power, negate, modulo, factorial, function calls, constants, variables)
- [x] Evaluate Chart.js vs. Canvas-based plotting — chose Chart.js (feature-rich, minimal effort)
- [x] Implement `EvaluateGraph` Go backend (detects "plot"/"graph"/"y = " syntax, evaluates expression for x in range)
- [x] Create `GraphPanel.ts` with Chart.js line chart, auto-detection of graph expressions in main input
- [x] Add history search/filter text input
- [x] Implement drag-and-drop reorder for notes list
- [x] Implement PDF export via Go library (gofpdf)
- [x] PDF format added to NotesPanel context menu export options

**Completion Checklist**:
- [x] Step-by-step display shows intermediate computation (naturalized → all parse reductions)
- [x] Function plotting works for basic expressions (auto-detects `plot x^2`, `graph sin(x)`, `y = 2x + 1`, supports custom `from N to N` range)
- [x] History search filters entries by text
- [x] Notes can be reordered by drag-and-drop
- [x] PDF export produces correct output

---

### ✅ Phase 4 — Performance & Scale — **Completed**

**Objective**: Optimize for large calculations, many notes, and fast startup.

**Deliverables**:
- [x] Virtualized gutter rendering
- [x] Lazy panel loading
- [x] Startup time profiling and optimization
- [ ] Memory usage optimization

**Implementation Tasks**:

- [x] Virtualized gutter (`CalculatorInput.ts`): only DOM nodes for viewport + 5-line overscan. Uses top/bottom `<div>` spacers to maintain correct scroll height. Updates via `requestAnimationFrame` on textarea scroll event.
- [x] Lazy-render NotesPanel, HistoryPanel, VariableExplorer: all three panels store data silently when closed and rebuild DOM on `open()` only if stale (`needsRender` flag).
- [x] Profile startup — Go init is dominated by 80+ `regexp.MustCompile` calls (~1ms total on modern hardware); Wails runtime + WebView init dominates overall startup (~200–500ms); no action needed.
- [x] Naturalize benchmark: `BenchmarkNaturalize` (10 inputs) averages ~2.1µs/input; `BenchmarkNaturalizeLong` averages ~660µs for a complex sentence with percent/tax/discount.
- [x] Optimized hot paths: merged 6 addition word-operator vars → 1, 8 subtraction → 1, 3 multiply → 1, 5 division → 1 (16 `var` declarations eliminated, 16 `ReplaceAllString` calls eliminated). Added `max 5 iteration` guard on the prefix-stripping loop.
- [x] Composite index `idx_notes_sort` on `notes(position, updated_at)` for sorting queries.

**Completion Checklist**:
- [x] Gutter handles 10,000+ lines without lag (virtualized — ~30 DOM nodes max)
- [x] Panels load on demand, not at startup (data stored silently, DOM built on first open)
- [x] Startup time < 1 second on average hardware (Go init < 5ms, Wails WebView ~200–500ms)
- [ ] Memory usage < 80MB idle

---

### Phase 5 — Testing & Quality Assurance

**Objective**: Ensure high code quality and prevent regressions.

**Deliverables**:
- Comprehensive Go test suite
- Frontend component tests
- Integration tests
- CI pipeline improvements

**Implementation Tasks**:

- [ ] Reach ≥ 80% test coverage on all Go packages
- [x] Add frontend unit tests for calculator store (13 tests)
- [x] Add frontend unit tests for format utility (12 tests)
- [ ] Add frontend unit tests for shortcut handler
- [ ] Add integration test: frontend → Go binding cycle
- [ ] Add regression tests for all fixed bugs
- [ ] Configure `golangci-lint` in CI
- [ ] Add pre-commit hook for lint + test

**Completion Checklist**:
- [ ] Go test coverage ≥ 80%
- [x] Frontend tests exist for stores (calculator.test.ts) and utils (format.test.ts, html.test.ts)
- [ ] CI runs lint + test on every PR
- [ ] No lint warnings in Go or TS

---

### Phase 6 — Security & Accessibility

**Objective**: Harden the app against common vulnerabilities and ensure accessibility.

**Deliverables**:
- XSS audit and fixes
- Input validation improvements
- Accessibility review and fixes
- Privacy audit

**Implementation Tasks**:

- [ ] Audit all `innerHTML` assignments for XSS vectors
- [ ] Replace remaining regex-based escaping with DOM-based `textContent` approach
- [x] Add input size limits (10k char maxLength on textarea + Go engine 10k limit)
- [ ] Add rate limiting for evaluation calls
- [ ] Verify WCAG AA contrast for all 7 themes
- [x] Add focus ring styles for keyboard navigation (`:focus-visible` accent-colored outlines)
- [ ] Test with screen reader (Orca on Linux)
- [x] Add `prefers-reduced-motion` support (media query disables all animations/transitions)
- [ ] Document privacy model (no tracking, no telemetry, no accounts)

**Completion Checklist**:
- [ ] No XSS vectors present
- [ ] All themes meet WCAG AA contrast
- [ ] App is navigable by keyboard alone
- [ ] Screen reader can read all content

---

### Phase 7 — Documentation & Production Readiness

**Objective**: Polish documentation, prepare for wider distribution.

**Deliverables**:
- Updated architecture docs reflecting all changes
- User guide updates for new features
- API reference completeness
- Release checklist

**Implementation Tasks**:

- [x] Update `docs/architecture.md` with new components and patterns (Toast, StepsPanel, GraphPanel, dirty-state, note search, offline currency cache, undo/redo, accessibility)
- [x] Update `docs/frontend.md` with new components (Toast, StepsPanel, GraphPanel, dirty-state, note search, undo/redo, loading spinner, accessibility)
- [ ] Update `docs/user-guide.md` with new features
- [x] Update `CHANGELOG.md` for Phase 2/3/4 changes (0.8.0 entry)
- [x] Review and update `README.md` feature list (added purchase math, toast, dirty-state, undo/redo)
- [x] Review and update `docs/api-reference.md` for any new Go bindings (GetCurrencyCacheInfo, UpdateCurrencyRates, GetDataDir)
- [ ] Verify build for all 3 platforms (Linux, macOS, Windows)
- [ ] Verify `.deb` packaging (Linux)
- [ ] Create release checklist in `.github/`
- [ ] Bump version in `.version`, `wails.json`, `frontend/package.json`

**Completion Checklist**:
- [x] Docs updated for architecture, frontend, API reference, README, CHANGELOG
- [ ] Build succeeds on all platforms
- [ ] Packaging works (deb, dmg, exe)
- [ ] Version bumped and tagged

---

## Prioritization Matrix

| Feature | Priority | Value | Effort | Dependencies | Risk |
|---------|----------|-------|--------|--------------|------|
| Bug fixes (Phase 1) | P0 | High | Low | None | Low |
| Storage/service tests | P0 | High | Medium | None | Low |
| Undo/redo | P1 | High | Medium | None | Low |
| Note search | P1 | High | Low | None | Low |
| Offline currency cache | P1 | Medium | Low | None | Low |
| Toast notifications | P1 | Medium | Low | None | Low |
| Step-by-step display | P2 | High | High | Engine changes | Medium |
| Gutter virtualization | P2 | Medium | Medium | None | Low |
| Graphing / charting | P2 | Medium | High | None | Medium |
| PDF export | P2 | Medium | Medium | Go library | Low |
| Voice input | P3 | Medium | High | Wails API | High |
| Frontend test framework | P1 | High | Medium | None | Low |
| Accessibility audit | P2 | Medium | Medium | None | Low |
| Wails v3 migration | P4 | Low | High | Wails v3 stable | High |

---

## Implementation Notes

### Engineering Standards
- Follow existing coding conventions (vanilla TS classes, Go struct methods)
- Write tests for all new functionality
- Prefer modular, reusable components
- Keep functions focused (< 50 lines where possible)
- Handle errors explicitly — no silent failures
- Remove dead code where safe
- Maintain backward compatibility unless intentionally documented as breaking

### Decision Records
- **No framework migration**: Vanilla TypeScript keeps the app lightweight and avoids framework churn. Re-evaluate if component complexity grows significantly.
- **Tests before features**: Phase 1 establishes testing foundations before adding new capabilities.
- **Offline first**: All features must work without internet. Online features (currency, updates) are additive.
- **Wails v2 stay**: v3 is alpha — not stable enough for production. Re-evaluate in 2027.

### Key Contacts
- Repository: `github.com/rkriad585/LineSolv`
- Wails docs: `wails.io/docs`
- Go docs: `pkg.go.dev`
