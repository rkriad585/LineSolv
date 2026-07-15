# LineSolv UI/Theme System Overhaul & Bug Fixes

## Project Summary

**LineSolv** is a Wails v2 desktop natural-language calculator built with Go + WebView + vanilla TypeScript + CSS custom properties. It features 15 color themes, 6 UI styles, a plugin system, markdown docs viewer, graphing, and a multi-note notepad.

**Goal:** Resolve all theme/style application issues, add UI Style→Theme auto-selection, fix UI/UX bugs, implement full state persistence, and eliminate performance bottlenecks.

**Stack:** Go (Wails v2), TypeScript, CSS custom properties, vanilla DOM manipulation (no framework), Chart.js, TOML config.

---

## Research Findings

### Architecture Overview

The theme system is **class-based** (not `data-theme` attribute). Themes apply via `theme-{name}` class on `document.documentElement`, UI styles via `style-{name}` class. CSS rules use `:root.theme-{name}` and `:root.style-{name}` selectors. Both systems define separate variable namespaces (themes = colors, styles = layout/shape/depth), so they don't conflict with each other.

**Application chain:** `applySettingsState()` → `applyTheme()` (CSS class swap) → `applySurfaceOpacity()` (inline `root.style.setProperty` for `--surface`, `--surface-secondary`, `--note-bg`) → `applyUiStyle()` (CSS class swap).

### Sources Consulted
- Wails v2 official documentation (wails.io) — app lifecycle, Options.Theme, OnStartup/OnBeforeClose
- MDN Web Docs — CSS custom properties, `will-change`, `contain`, `prefers-reduced-motion`
- Chrome DevTools Performance documentation — compositor layers, GPU acceleration
- Web.dev — layout thrashing, `requestAnimationFrame` batching, font loading strategies

---

## Improvement Opportunities — Organized by Core Issue

---

### CORE ISSUE 1: Theme/UI Style Not Applying Correctly

#### 1.1 THEME_ORIGINS Mismatches (MEDIUM)
**Files:** `frontend/src/App.ts:101-117` vs `frontend/src/style.css`

4 themes have different values between the `THEME_ORIGINS` map (used by `applySurfaceOpacity`) and the actual CSS definitions. When opacity is not 100%, the opacity system computes rgba from wrong base colors.

| Theme | Property | THEME_ORIGINS | CSS |
|---|---|---|---|
| red | `--surface-secondary` | `#2a0f0f` | `#2a1414` |
| red | `--note-bg` | `#2a0f0f` | `#2a1414` |
| obsidian | `--surface-secondary` | `#1a1a14` | `#1a1a1a` |
| obsidian | `--note-bg` | `#1a1a14` | `#1a1a1a` |
| plasma | `--surface-secondary` | `#15152a` | `#1a1a30` |
| plasma | `--note-bg` | `#15152a` | `#1a1a30` |
| blood | `--surface-secondary` | `#1a0808` | `#1a0a0a` |
| blood | `--note-bg` | `#1a0808` | `#1a0a0a` |

**Fix:** Sync `THEME_ORIGINS` with CSS values, or better — compute origin values from live CSS at runtime to eliminate the dual source of truth.

#### 1.2 applySurfaceOpacity Creates Fragile Dual Source of Truth (MEDIUM)
**File:** `frontend/src/App.ts:119-143`

`applySurfaceOpacity()` sets inline styles on `document.documentElement` for `--surface`, `--surface-secondary`, and `--note-bg`. Inline styles have higher specificity than CSS rules, permanently shadowing the `:root.theme-*` definitions. `applyTheme()` doesn't clear these inline overrides. After the first `applySettingsState()` call, the CSS theme definitions for these 3 properties are effectively dead code.

**Fix:** When opacity is 1.0, clear the inline styles instead of setting `rgba(..., 1)`. This lets CSS rules take effect and eliminates the dual source of truth.

#### 1.3 Plugin Themes Invisible to applySurfaceOpacity (LOW-MEDIUM)
**File:** `frontend/src/App.ts:122`

`THEME_ORIGINS` only has entries for 15 built-in themes. Plugin themes fall back to `#18181b` (dark theme surface), causing incorrect opacity calculations.

**Fix:** Read computed CSS variable values from the DOM instead of using a hardcoded map.

#### 1.4 Glass Style Targets Wrong Element for Textarea (MEDIUM)
**File:** `frontend/src/style.css:422-429`

`.style-glass` applies translucent background to `input[type="text"]` and `input[type="search"]`, but the calculator uses a `<textarea>` (`#input-area`). The glass effect never applies to the main editor.

**Fix:** Add `.style-glass textarea, .style-glass #input-area` to the glass CSS rule.

#### 1.5 Hardcoded Colors Bypass Theme System (MEDIUM)

| File | Line | Hardcoded | Should Use |
|---|---|---|---|
| `ConfirmDialog.ts` | 43 | `background:#ef4444` | `var(--error)` |
| `toast.ts` | 16-18 | `rgba(34,197,94,0.95)` etc. | `var(--success)`, `var(--error)`, `var(--accent)` |
| `AutocompletePopup.ts` | 7-13 | `#a78bfa`, `#60a5fa` etc. | CSS variables or theme-aware palette |
| `AutocompletePopup.ts` | 177 | `color:#fff` | Computed from accent luminance |
| `DocsViewer.ts` | 326 | `color: #fff` | Computed from accent luminance |
| `SettingsModal.ts` | 251 | `color: #fff` | Computed from accent luminance |
| `PluginPanel.ts` | 469, 814 | `background:white` | `var(--text)` |
| `style.css` | 375 | `color: #000` | `var(--text)` |
| `CalculatorInput.ts` | 27 | (no `box-shadow:none`) | Add `box-shadow:none` |

#### 1.6 7 Dead CSS Variables (LOW)

Defined but never consumed via `var()`:
- `--btn-hover` (all 15 themes)
- `--anim-fast` (`:root`)
- `--ui-surface-alpha`, `--ui-border-style`, `--ui-border-width`, `--ui-glow-color`, `--ui-radius-full` (all 6 UI styles)

**Fix:** Wire them up or remove them.

#### 1.7 No Explicit `:root.theme-dark` Rule (LOW)
**File:** `frontend/src/style.css:1-55`

The dark theme values live in bare `:root` while all 14 other themes use `:root.theme-*`. The `theme-dark` class is a no-op. Architecturally inconsistent.

**Fix:** Extract dark theme variables into explicit `:root.theme-dark` block.

---

### CORE ISSUE 2: UI Style → Theme Auto-Selection

No existing mechanism. Currently themes and UI styles are independent orthogonal selections.

**Proposed Implementation:**
- Define a default theme mapping for each UI style in a constant:
  ```ts
  const STYLE_THEME_DEFAULTS: Record<string, string> = {
    'default': 'dark',
    'nothing': 'mono',
    'glass': 'dark',
    'material': 'midnight',
    'alivated': 'warm-light',
    'neon': 'neon',
  };
  ```
- In `SettingsModal.buildUiStyle()`, when user selects a UI style, if the current theme hasn't been manually overridden, auto-select the complementary theme
- Track whether theme was manually set (add `themeManuallySet: boolean` to settings state)
- If `themeManuallySet` is false, changing UI style also changes theme
- If `themeManuallySet` is true, only change UI style

---

### CORE ISSUE 3: UI/UX Bugs & Logical Issues

#### HIGH Priority
| # | Bug | File:Line | Fix |
|---|---|---|---|
| 3.1 | Textarea missing `appearance:none` — white bars on dark themes | `CalculatorInput.ts:26` | Add `appearance-none` class |
| 3.2 | Textarea missing `box-shadow:none` — inset shadow artifact | `CalculatorInput.ts:27` | Add `box-shadow:none` to style |
| 3.3 | No textarea UA reset in global CSS | `style.css:600-605` | Add `appearance:none; box-shadow:none` to `#input-area` |

#### MEDIUM Priority
| # | Bug | File:Line | Fix |
|---|---|---|---|
| 3.4 | Floating toolbar on image hover in WebView | `main.go:86-89` | Add `--disable-features=msEdgeImageHoverToolbar` to Windows webview args |
| 3.5 | Full-screen modals use `scale(0.95)` causing edge flash | `style.css:25-35` | Use separate animation classes for dialogs vs full-screen panels |
| 3.6 | DocsViewer/PluginPanel inside `overflow:hidden` body with `border-radius` | `App.ts:837-838` | Move to `document.body.appendChild` like SettingsModal |
| 3.7 | ContextMenu submenu <100ms gap prevents appearance | `ContextMenu.ts:211-229` | Reduce delay to 50ms, add mouse position tolerance zone |
| 3.8 | ContextMenu submenu opacity transition has no CSS transition | `ContextMenu.ts:223-228` | Add `transition: opacity 150ms ease` |
| 3.9 | ResultDisplay left padding (pl-3) misaligned with textarea (pl-2) | `ResultDisplay.ts:7` | Change to `pl-2` for alignment |
| 3.10 | AutocompletePopup selected text `color:#fff` invisible on mono theme | `AutocompletePopup.ts:177` | Compute text color from accent luminance |
| 3.11 | Active tab text hardcoded `#fff` invisible on mono theme | `DocsViewer.ts:326`, `SettingsModal.ts:251` | Compute from accent luminance |
| 3.12 | GraphPanel close button missing hover state | `GraphPanel.ts:33` | Add `mouseenter`/`mouseleave` hover feedback |
| 3.13 | SettingsModal font select leaks document click listener | `SettingsModal.ts:344-347` | Store reference and remove on rebuild |

#### LOW Priority
| # | Bug | File:Line | Fix |
|---|---|---|---|
| 3.14 | ContextMenu dead `position:relative` wrapper | `ContextMenu.ts:135` | Remove wrapper |
| 3.15 | Autocomplete scrollbar styling dead code (overridden by global hide) | `style.css:768-776` | Remove dead rules |
| 3.16 | PluginPanel confirmRemove z-index:2000 exceeds parent z-index:1000 | `PluginPanel.ts:953` | Use consistent z-index scale |
| 3.17 | Context menu, autocomplete, toast all at z-index:9999 | Various | Establish z-index hierarchy |
| 3.18 | `body` border-radius clips full-screen modals | `style.css:586` | Override `border-radius:0` on modal overlays |

---

### CORE ISSUE 4: State Persistence

#### HIGH Priority
| # | Issue | File:Line | Fix |
|---|---|---|---|
| 4.1 | `update()` doesn't auto-save; caller must remember `scheduleSave()` | `settings.ts:104-107` | Auto-call `scheduleSave()` inside `update()` |
| 4.2 | Config has dead `notes.last_active` and `notes.sort_by` fields | `config.go:15-18` | Wire up or remove dead fields |
| 4.3 | Sort preference not persisted anywhere | `notes.ts:3-4,10-11` | Add `sort_by` to settings config and wire through |

#### MEDIUM Priority
| # | Issue | File:Line | Fix |
|---|---|---|---|
| 4.4 | No config mutex — concurrent read-write race condition | `config.go:57-96` | Add `sync.Mutex` to storage or in-memory config cache |
| 4.5 | Config reloaded from disk on every call, no in-memory cache | `app.go:232,240,464,483` | Load once at startup, keep in memory, write on save |
| 4.6 | No `OnShutdown`/`OnBeforeClose` — unsaved changes lost on exit | `main.go:63-90` | Add `OnShutdown` handler to flush pending saves |
| 4.7 | Theme flash on startup (async load after DOM render) | `App.ts:1049-1069` | Load settings before first render, or use Wails startup event |
| 4.8 | Settings modal re-fetches from backend, can show stale data | `SettingsModal.ts:1140-1143` | Read from `SettingsStore` instead of backend |
| 4.9 | Settings load failure silently falls to defaults | `settings.ts:93-101` | Show toast on failure |
| 4.10 | Save failure silently ignored | `settings.ts:111-118` | Show toast on failure |

#### LOW Priority
| # | Issue | File:Line | Fix |
|---|---|---|---|
| 4.11 | Active note via localStorage while backend has unused `last_active` | `App.ts:317` | Use backend config or remove dead field |
| 4.12 | Hand-rolled TOML parser fragile | `config.go:98-168` | Consider proper TOML library or add validation |
| 4.13 | All config values stored as strings (bools as "true"/"false") | `config.go:19-32` | Use proper TOML types |
| 4.14 | SettingsData defined in both types.ts and wailsjs/models.ts | `types.ts:37-48` | Use single source |
| 4.15 | Config file not created on first run | `config.go:57-68` | Create defaults in OnStartup |
| 4.16 | `SetDeleteWithoutConfirm` silently swallows errors | `app.go:239-250` | Return error or log it |

---

### CORE ISSUE 5: Performance

#### HIGH Priority
| # | Issue | File:Line | Impact | Fix |
|---|---|---|---|---|
| 5.1 | 12 Google Fonts loaded eagerly (40+ HTTP requests) | `index.html:10` | Initial load delay, FOUT | Load only active font family, add `font-display:swap` |
| 5.2 | ResultDisplay `innerHTML` full rebuild on every eval | `ResultDisplay.ts:14` | DOM thrash on every keystroke | Use diffing or targeted updates |
| 5.3 | NotesPanel `innerHTML` + listener re-attach on every render | `NotesPanel.ts:197-218` | GC pressure, listener churn | Use event delegation on parent |

#### MEDIUM Priority
| # | Issue | File:Line | Impact | Fix |
|---|---|---|---|---|
| 5.4 | No `will-change` hints on transitioning elements | `style.css` (whole file) | No GPU promotion | Add `will-change:transform,opacity` to panels/modals |
| 5.5 | `backdrop-filter:blur()` in glass style on 8+ elements | `style.css:402-428` | GPU pressure, frame drops | Limit to visible panels only |
| 5.6 | Chart.js full bundle (~200KB) when only line charts used | `package.json:29` | Unnecessary download | Tree-shake to line controller + linear scale only |
| 5.7 | HistoryPanel search not debounced — full innerHTML rebuild per keystroke | `HistoryPanel.ts:34,97-105` | DOM thrash with many entries | Add 100-150ms debounce |
| 5.8 | `getComputedStyle()` called in hot paths (autocomplete, gutter) | `CalculatorInput.ts:52-53,227-229` | Forced layout recalc | Cache computed styles, invalidate on resize |
| 5.9 | Sidebar `width` transitions trigger layout (not GPU-compositable) | `style.css:20-22` | Janky sidebar animations | Use `transform:translateX()` instead |
| 5.10 | Theme switching transitions `background-color`/`color`/`border-color` on 6 elements | `style.css:16-19` | Paint on every frame | Acceptable (0.2s) but could use `will-change` |
| 5.11 | HistoryPanel store subscriber runs on every state change, not just history changes | `App.ts:1036-1041` | Unnecessary renders | Gate with reference check |
| 5.12 | CalculatorStore notifies ALL listeners on every state change | `stores/calculator.ts:53-56` | Over-notification | Use targeted subscriptions |
| 5.13 | NotesPanel search not debounced | `NotesPanel.ts:57-61` | Full rebuild per keystroke | Add 100ms debounce |
| 5.14 | PluginPanel global `keydown` listener never removed | `PluginPanel.ts:302` | Memory leak | Clean up in `close()` |

#### LOW Priority
| # | Issue | File:Line | Fix |
|---|---|---|---|
| 5.15 | Window resize not debounced | `App.ts:849-854` | Add RAF guard |
| 5.16 | Autocomplete update runs on every input without throttle | `App.ts:549-558` | Add 50ms throttle |
| 5.17 | Neon style `box-shadow` transitions paint-heavy | `style.css:528-554` | Acceptable, document |
| 5.18 | Universal `*` selector for scrollbar hiding | `style.css:592-598` | Use specific container selectors |
| 5.19 | Settings modal opacity slider triggers `applySurfaceOpacity()` chain per drag frame | `SettingsModal.ts:620-626` | Throttle to RAF |

---

## Development Roadmap

### Phase 1: Foundation — Theme System Correctness
**Objective:** Fix all theme/style application issues so themes render pixel-perfectly.

- [x] Sync `THEME_ORIGINS` with CSS values (or remove map entirely, read from DOM)
- [x] Fix `applySurfaceOpacity` to clear inline styles when opacity is 1.0
- [x] Add `:root.theme-dark` explicit CSS rule
- [x] Remove 7 dead CSS variables or wire them up
- [x] Fix glass style to target textarea (`#input-area`)
- [x] Fix white bars: add `appearance:none; box-shadow:none` to textarea
- [x] Replace all hardcoded component colors with CSS variable references
- [x] Add `--success` variable to all 15 themes
- [x] Run `npm run build` to verify no CSS/TS errors

### Phase 2: UI Style → Theme Auto-Selection
**Objective:** Complementary theme auto-selected when user changes UI style.

- [x] Add `STYLE_THEME_DEFAULTS` mapping constant
- [x] Add `theme_manually_set` flag to settings state (frontend + Go config + TOML)
- [x] Implement auto-theme logic in `SettingsModal.buildUiStyle()`
- [x] Update `resetToDefaults()` to clear `theme_manually_set`
- [x] Test all 6 UI style → theme pairings

### Phase 3: UI/UX Bug Fixes
**Objective:** Fix all visual glitches, interaction bugs, and logical errors.

- [x] Fix floating toolbar: add WebView2 disable flag in `main.go`
- [x] Fix modal animations: separate dialog vs full-screen panel animation classes
- [x] Fix DocsViewer/PluginPanel DOM placement (move to `document.body`)
- [x] Fix ContextMenu submenu timing (reduce delay, add tolerance zone)
- [x] Fix ContextMenu submenu opacity transition
- [x] Fix ResultDisplay left padding alignment
- [x] Fix autocomplete/tab text color for mono theme (luminance check)
- [x] Add GraphPanel close button hover state
- [x] Fix SettingsModal font select listener leak
- [x] Fix body border-radius clipping on modal overlays
- [x] Clean up z-index hierarchy across all overlays
- [x] Remove dead ContextMenu wrapper, dead autocomplete scrollbar CSS

### Phase 4: State Persistence
**Objective:** All user selections persisted and restored across sessions.

- [x] Add `sync.Mutex` to config storage (or in-memory config cache)
- [x] Add `OnShutdown` handler to flush pending saves
- [x] Load config once at startup, keep in memory
- [x] Wire `update()` to auto-call `scheduleSave()`
- [x] Persist sort preference in settings config
- [x] Wire up or remove dead `last_active`/`sort_by` fields
- [x] Fix settings modal to read from store instead of re-fetching backend
- [x] Show toast on settings load/save failure
- [x] Fix startup theme flash (load before first render)
- [x] Create config file on first run

### Phase 5: Performance Optimization
**Objective:** Eliminate laggy feel, reduce DOM thrashing, optimize resource loading.

- [x] Defer Google Fonts — load only active font family, add `font-display:swap`
- [x] Add event delegation to NotesPanel (eliminate per-item listener attachment)
- [x] Debounce HistoryPanel search (150ms)
- [x] Debounce NotesPanel search (100ms)
- [x] Gate history store subscriber with reference check
- [x] Cache `getComputedStyle` results in CalculatorInput
- [x] Add `will-change:transform,opacity` to animated panels
- [x] Tree-shake Chart.js to line chart only
- [x] Clean up PluginPanel global keydown listener on close
- [x] Throttle autocomplete update (50ms)
- [x] Add RAF guard to window resize handler

### Phase 6: Testing & Verification
**Objective:** Verify all changes work correctly across all themes and UI styles.

- [x] Run build and verify no TypeScript errors
- [x] Audit all 15 themes × 6 UI styles for variable completeness
- [x] Audit theme application chain (applyTheme → applySurfaceOpacity → applyUiStyle)
- [x] Audit state persistence chain (store → Go config → TOML)
- [x] Audit modal animations and listener lifecycle
- [x] Audit all Phase 5 performance optimizations
- [x] Fix PluginPanel double keydown registration
- [x] Fix CalculatorInput incomplete font cache invalidation
- [x] Fix hardcoded colors (material-fab, save-flash)
- [x] Add Escape key handler to ShortcutModal
- [x] Fix resetToDefaults() missing style card highlight update
- [ ] Test on Windows, macOS, Linux (if possible)
- [ ] Verify no memory leaks in long session

---

## Prioritization

| Phase | Priority | User Value | Est. Complexity | Dependencies |
|---|---|---|---|---|
| Phase 1: Theme Correctness | Critical | High | Medium | None |
| Phase 2: Auto-Selection | High | High | Low | Phase 1 |
| Phase 3: UI/UX Bugs | High | Medium-High | Medium | Phase 1 |
| Phase 4: State Persistence | High | High | Medium | Phase 1 |
| Phase 5: Performance | Medium | High | Medium | None (parallel) |
| Phase 6: Testing | Critical | High | Low | Phases 1-5 |

---

## Risks

1. **Glass style `!important` overrides:** The glass translucent background fights inline styles and CSS variables. Fix requires careful specificity management.
2. **`applySurfaceOpacity` refactor:** Changing from inline styles to CSS-variable-only approach may affect the window translucency feature on Linux/Windows.
3. **Config mutex addition:** Adding locking to the config layer could introduce deadlocks if not careful with the existing `AppService.mu` RWMutex.
4. **Font loading change:** Deferring fonts may cause visible layout shifts (FOUT) on first load.
5. **Chart.js tree-shaking:** May break if Chart.js API usage patterns depend on registered plugins.

---

*Last updated: 2026-07-14*
