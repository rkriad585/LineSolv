# Changelog

## [Released]

## [0.15.10] — 2026-07-16

### Added

- **12 New Psychology-Driven Themes** — Blue Trust (security/trust), Orange Energy (friendly CTA), Green Growth (nature/success), Yellow Optimism (attention), Purple Innovation (luxury/creative), Red Passion (urgency/energy), each with dark + light variants.
- **CVD-Safe Status Tokens** — standardized `--color-error`, `--color-success`, `--color-warning`, `--color-info` CSS variables across all themes for color-vision-deficiency safety.
- **Tinted Gray Scale** — 11-step gray scale (`--gray-50` to `--gray-950`) with warm violet tint for consistent neutral colors.
- **WCAG AA Compliance** — all 29 themes now pass WCAG AA contrast ratios (4.5:1 minimum) for text-muted on surface-secondary.

### Changed

- **WCAG AA Contrast Fixes** — corrected `text-muted` values in 15 existing themes that failed accessibility standards (Dark, Light, Neon, Red, Obsidian, Plasma, Blood, Midnight, Aurora, Mono, Frost, Prism, Lavender, Sage, Warm Light).
- **Theme Count** — expanded from 17 to 29 themes.
- **Glass Style Default Theme** — changed from Dark to Blue Trust Dark.

### Fixed

- **Release Workflow macOS Job** — fixed GitHub API 404 errors when deleting/updating release assets by switching to `gh release upload --clobber` for more reliable asset management.

## [0.15.0] — 2026-07-16

### Added

- **Result Panel Toggle** — new setting in Settings → General → "Result Panel" (default: on). Toggles the results column visibility on the right side. Persists to `config.toml` as `result_panel_enabled`.
- **Line Wrap Toggle** — new setting in Settings → General → "Line Wrap" (default: on). Toggles word wrapping in the editor textarea. When off, horizontal scroll is used. Persists as `line_wrap_enabled`.
- **Splash Loading Screen** — app now shows a splash screen with the LineSolv logo and animated loading bar during startup instead of hiding the UI. Fades out when loading completes.
- **`Ctrl+J` keyboard shortcut** — toggles the Documentation panel.
- **`Ctrl+`` (backtick) keyboard shortcut** — toggles the Settings panel (additional shortcut alongside `Ctrl+,`).
- **Context Menu Active Note Indicator** — the main app context menu's "Switch Note" submenu now shows a checkmark icon next to the currently active note, matching the Docs/Plugins context menus.
- **Claude Code UI Style** — 7th UI style based on Anthropic's design language with ring-shadow depth, terracotta (#c96442) accent, warm editorial feel, Inter font, and 6/8/12px radii. Includes two new themes: `claude-dark` (#141413 warm charcoal) and `claude-light` (#f5f4ed parchment).
- **Toast Error Notifications** — Go-side errors and note save failures now display user-facing toast notifications instead of silent console logging.
- **Standard Project Tooling** — added `.editorconfig`, `.prettierrc`, `.prettierignore`, ESLint 9 flat config, `.nvmrc`, `.env.example`, `.vscode/`, `commitlint.config.js`, `lint-staged.config.js`, `renovate.json`, `CODEOWNERS`, root `package.json` with husky + lint-staged + commitlint, and `.husky/` pre-commit/commit-msg hooks.

### Changed

- **Title Bar Menu Consolidation** — Documentation, Print, Plugins, and Settings buttons are now grouped into a single "..." (vertical ellipsis) menu button in the title bar. Clicking it opens a dropdown with all four items plus their shortcut labels. The title bar now shows: New Note, Notes, Variables, History, Steps, and the "..." menu.
- **Panel Cross-Closing** — switching between Notes, Docs, and Plugins now automatically closes the other panel. Opening Docs closes the Notes panel, and switching notes closes Docs/Plugins. This also applies when using the context menu to switch notes.
- **UI Style Authenticity Overhaul** — All 6 existing UI styles completely rewritten to match their real-world design systems:
  - **Nothing OS**: real color overrides (#000 OLED black, #D71921 Nothing Red accent), 16dp card radii, fixed easing curve, dot-grid background pattern, ALL CAPS mono labels on segmented controls, full light/dark palettes
  - **Liquid Glass**: `saturate(150%)` on all blur elements, boosted specular highlights (0.08→0.18 opacity), inset box-shadow edge lighting, increased translucent bg (0.06→0.12), SF Pro font fallback chain, letter-spacing on headings
  - **Material 3**: full M3 color tokens (20+ roles for dark + light), tonal elevation replacing shadow paradigm (5% primary tint overlay), fixed FAB (40→56dp, 12→16dp radius, primary-container color), fixed chips (32dp height, secondary-container color), state layers (8%/10% hover/press)
  - **Alivated (Neumorphism)**: mid-tone neumorphic surface colors (#2d3239 dark / #e0e5ec light), shadow colors derived from background, fixed light mode inverted shadows, fixed pressed state
  - **Neon (Cyberpunk)**: 5-layer bloom glow with white hot-core, fixed scanlines (multiply blend, 15% opacity), text-shadow glow, clip-path cut-corners on panels, subtle grid background, uppercase labels
- **CSS Variable Consistency** — replaced 26 hardcoded `border-radius`, `box-shadow`, and `font-family` values across 11 component files with CSS custom properties (`--ui-radius-*`, `--ui-shadow-*`, `--ui-font-display`) to ensure all UI styles apply correctly.
- **Style-Specific Component Rules** — added CSS rules for toast notifications, plugin panel cards, confirm dialog, and toggle switches for all 7 UI styles.
- **Golangci-lint compliance** — replaced `WriteString(fmt.Sprintf(...))` with `fmt.Fprintf(...)` in `config.go` and `exporter.go`, added error handling in `FlushPendingSave`.

### Fixed

- **CI `npm install` failure** — removed broken `prepare` script from `frontend/package.json` that called `husky` (not available in frontend scope).

## [0.14.1] — 2026-07-15

### Fixed

- **Settings persistence** — TOML parser corrupted quoted strings; debounced saves were lost on close.
- **Theme switching** — only text color changed, background stayed the same due to inline style shadowing.
- **UI styles** — partial application across app components.
- **Theme×Style conflicts** — 24 affected combinations across 90 total resolved.
- **Active indicators** — theme, style, font, and size checkmarks no longer reflected current selection.
- **Autocomplete popup** — not hiding after Enter/Tab selection for constants.
- **App crash on close** — deadlock in `FlushPendingSave` calling `SaveConfig` while holding mutex.
- **Flash of default theme on startup** — eliminated brief flash before user theme loaded.

## [0.14.0] — 2026-07-14

### Added

- **Full-window opacity/transparency** — window opacity now applies to the entire app window including body, panels, and all surfaces. Default opacity changed to 95%.
- **Real-time settings** — all settings (theme, font, opacity, toggles) apply instantly on change. No Save button required. Changes auto-persist to `config.toml` with debounced writes.
- **Line numbers toggle** — new setting in General > Behavior to show/hide line number gutter (default: on).
- **Reset to Defaults** — new button in settings header replaces the old Save button. Resets all settings to factory defaults with one click.
- **Opacity slider** — adjustable window transparency from 30% to 100% in General > Appearance section.
- **Autocomplete toggle** — enable/disable keyword autocomplete popup from General > Calculator section.
- **Animations toggle** — enable/disable CSS animations and transitions from General > Appearance section.
- **Toast toggle** — enable/disable toast notifications from General > Behavior section.

### Changed

- **SettingsModal** — removed Save button; all controls now call `settingsStore.update()` + `settingsStore.scheduleSave()` on every change for instant apply.
- **SettingsStore** — added `scheduleSave()` method with 300ms debounce for automatic persistence.
- **applySurfaceOpacity()** — now sets `document.body.style.background` directly with rgba for full-window translucency, in addition to CSS variable overrides.
- **Default opacity** — changed from 1.0 (fully opaque) to 0.95 (95% translucent).
- **CalculatorInput** — added `setLineNumbersVisible()` method to show/hide gutter dynamically.
- **SettingsData** — expanded with `opacity`, `line_numbers_enabled`, `autocomplete_enabled`, `animations_enabled`, `toast_enabled` fields.
- **CSS** — `body { background: transparent }` moved from `var(--surface)` to support JS-controlled translucent backgrounds.

## [0.13.0] — 2026-07-14

### Added

- **Keyword autocompletion** — autocomplete popup appears as you type in the calculator input, showing all 236+ builtin functions, constants, and units with prefix matching, category badges, and descriptions.
- **Keyboard navigation** — Arrow Up/Down to navigate, Enter/Tab to select, Escape to dismiss.
- **Dynamic keyword sync** — user-defined variables and plugin functions are included in autocomplete results and refresh automatically after evaluation or plugin changes.
- **Backend keyword endpoint** — `GetAutocompleteKeywords()` Wails binding returns all autocomplete candidates from the engine.

### Changed

- **CalculatorInput** — added `getCursorWord()`, `getCursorPixelPos()`, `replaceWord()` methods for autocomplete integration.
- **AutocompletePopup component** — new overlay popup positioned at cursor with themed styling, category badges, and match highlighting.
- **PluginPanel** — added `onPluginsChanged` callback to trigger keyword refresh after plugin operations.

## [0.12.96] — 2026-07-13

### Fixed

- **Go lint compliance** — resolved all golangci-lint issues (errcheck, gosec, staticcheck).
- **Unused code removed** — `operatorSym`, `aCouplePattern/aDozenPattern/aScorePattern`, `peek()`.
- **File permissions hardened** — `0644`→`0600` for config/state files, `0755`→`0700` for directories.
- **Weak PRNG migration** — `math/rand` → `math/rand/v2` in `fancyname.go`.
- **Lint config** — added `frontend/node_modules` exclude to `.golangci.yml`.
- **Notes panel search input** — search input now shows when panel opens with 1+ notes (was requiring >1).
- **ESLint config** — created flat config for ESLint v9, fixed all lint warnings.

## [0.12.13] — 2026-07-12

### Fixed

- **Self-update v-prefix** — `SetVersion()` now strips the `v` prefix from ldflags input, fixing "Invalid character(s) found in major number" error.
- **Submenu positioning** — Switch Note and Export submenus now measure layout after a `requestAnimationFrame`, preventing off-screen rendering.
- **Export cancel toast** — cancelling save dialog no longer shows false "Note exported" success toast.

### Changed

- **Context menu Panels submenu** — Open Docs, Open Plugins, Open Settings collapsed into a single "Panels" submenu.

## [0.11.17] — 2026-07-11

### Added

- **Docs search** — search input in Documentation sidebar filters tabs by name in real time.
- **Privacy Policy** — new `docs/privacy-policy.md` covering data collection, local storage, network activity, and user rights. Linked from Settings → About tab.

### Fixed

- **Context menu submenus clipped** — Switch Note and Export submenus were invisible due to `overflow-y: auto` on the main menu implicitly setting `overflow-x: auto` (CSS spec), clipping absolutely-positioned submenus. Submenus now render directly on `document.body` with `position: fixed`.
- **Export false success toast** — cancelling the save dialog showed "Note exported". Now checks the backend return value before showing the toast.
- **Docs text selection** — added `user-select: text` directly to content element inline style to override parent's `select-none` class.
- **Context menu positioning** — rewrote `show()` to measure menu first, then calculate optimal position with viewport clamping. Only flips upward when there's truly no room below.
- **Context menu responsive** — added `max-height: calc(100vh - 16px)` with `overflow-y: auto` on both main menu and submenus.
- **Submenu positioning** — submenus now use viewport-relative coordinates calculated from trigger element's bounding rect, with proper boundary clamping.
- **Cut/Copy/Paste** — replaced deprecated `document.execCommand()` with `navigator.clipboard` API and `setRangeText()` for reliable clipboard operations in Wails WebView.
- **About LineSolv tab** — now opens Settings directly to the About tab instead of General.
- **NSIS installer** — added NSIS to PATH after choco install; conditional checksum generation for missing installer.
- **CI Node compatibility** — added `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION: true` env var.
- **CI Go version** — bumped release workflow Go from 1.23 to 1.24.

### Changed

- **Context menu icons** — replaced all emoji icons with Lucide-style inline SVGs matching the project's design system.
- **Context menu hover** — removed redundant JS hover handlers, relying on CSS `:hover` rule.

## [0.10.16] — 2026-07-11

### Added

- **Auto-update** — app now queries GitHub Releases, downloads the matching platform binary, and restarts with the new version. Settings modal shows live progress bar.
- **Right-click context menu** — textarea context menu with Cut/Copy/Paste/Select All, separator support, and keyboard shortcuts displayed per-platform.
- **Plus button in title bar** — "+" icon button for quick new note creation.
- **Test coverage reporting** — `npm run test:coverage` + Go `coverprofile` in CI, artifacts uploaded for 14 days.
- **CI coverage artifacts** — frontend lcov/json-summary and backend coverage.out uploaded per-platform.
- **Dockerfile** — Ubuntu 24.04 containerized build with Go 1.24, Node 20, Wails v2.12.0, WebKit/GTK deps.
- **.dockerignore** — excludes build artifacts, node_modules, .git, coverage.
- **CODE_OF_CONDUCT.md** — Contributor Covenant v2.1, linked from README and CONTRIBUTING.
- **ACCESSIBILITY.md** — WCAG 2.1 AA target, keyboard nav, screen reader matrix, known limitations.
- **pprof profiling** — `app/pprof_dev.go` auto-starts on `localhost:6060` in dev builds; no-op in production.
- **Release workflow raw binaries** — each platform now uploads raw binary + SHA256SUMS for self-update verification.

### Changed

- **Self-update rewritten** — replaced browser "Check for Updates" link with real in-app auto-update using `rhysd/go-github-selfupdate`.
- **CI Go version bumped** to 1.24.
- **`appVersion` changed from `const` to `var`** — set via `SetVersion()` at startup, still overridable via ldflags.

### Fixed

- **Context menu disappearing immediately** — added `e.stopPropagation()` to textarea's `contextmenu` handler to prevent the global close listener from firing.

## [0.9.0] — 2026-07-10

### Added

- **Comprehensive doc examples test** — `TestDocExamples_UserReportedPatterns` covers 13 real-world query patterns (comparisons, purchase math, geometry, freelance, discount)
- **`docs/examples.txt`** — exhaustive list of all supported query examples organized by category

### Fixed

- **Undo/Redo redo stack corruption** — `pushSnapshot()` was clearing the redo stack during programmatic `input` events triggered by `undo()`/`redo()`, making Ctrl+Y silently fail. Added `programmaticChange` flag to preserve the redo stack.
- **File drop UI crash** — dropping a file onto the window caused the WebView to navigate away from the app (black screen). Set `DisableWebViewDrop: true` in Wails config.
- **`discountOnItemPattern`** — added `.*?` to skip intervening words between item name and percentage (e.g. `That $200 jacket I've been eyeing is 25% off`)
- **`purchasePattern`** — made `added on top` optional after `sales tax` (e.g. `6% sales tax. What's the final price?`)
- **`salesTaxIncomePattern`** — changed `[Ww]hat` prefix to `(?i)what` for case-insensitive matching in phrases like `What did I earn?`
- **Date extraction with "for now"** — `timeframePattern` changed from `\s+for\s+now` to `\s+for\b` to prevent greedy match eating trailing text (e.g. `no discounts or tax for now`)

### Removed

- **Drag-and-drop note reordering** — HTML5 Drag-and-Drop API is broken in Wails v2 WebView (`dragover` never fires). Mouse-based replacement could not match the expected UX. Removed entirely. Notes can still be managed via sort button (name/created/updated), rename, create, and delete.

## [0.8.0] — 2026-07-10

### Added

- **Purchase math patterns** — `5 items at $20 each`, `3 items at $10 each with a 15% discount and 8% sales tax`
- **`prefers-reduced-motion` support** — disables all animations for accessibility
- **Focus-visible ring styles** — keyboard navigation outlines all interactive elements in theme accent color
- **Input size limit** — 10,000 character `maxLength` enforced on the textarea (defense in depth alongside Go backend limit)
- **Frontend unit tests** — 13 tests for `CalculatorStore`, 12 tests for `format` utility (29 total across 3 test files)
- **Documentation updates** — architecture.md, frontend.md, api-reference.md, user-guide, README updated to reflect all Phase 2/3/4 features

### Fixed

- **Currency cross-rate conversion** — `$100 + €20` now returns `120` (strips symbols) when no `in`/`to`/`as` keyword is present, instead of converting EUR→USD

### Changed

- Documentation in PLAN.md reconciled — gutter DOM thrashing item (already fixed in Phase 4) marked completed
- All docs now accurately reflect the actual state of all implemented features

## [0.7.0] — 2026-07-08

### Added

- **Step-by-step evaluation** — view intermediate computation steps (naturalize, parse-tree reductions) via StepsPanel toggle (⌘S)
- **Function graphing** — auto-detect `plot`, `graph`, `y =` expressions, renders Chart.js line chart in a resizable bottom panel
- **History search/filter** — filter history entries by input or output text in real-time
- **Drag-and-drop note reordering** — rearrange notes in the sidebar via HTML5 drag-and-drop; position persisted to SQLite
- **PDF note export** — export notes as proper A4 PDF with title, metadata, wrapped content, and page numbering (via gofpdf)

### Changed

- Parser instrumented to collect evaluation steps at every operation level
- Notes DB schema: added `position INTEGER` column with `ALTER TABLE` migration; `GetAllNotes` orders by position
- Backend dependencies: added `github.com/jung-kurt/gofpdf/v2` for PDF generation
- Frontend dependencies: added `chart.js` for function plotting

## [0.6.1] — 2026-07-08

### Fixed

- Window dragging in title bar: moved `--wails-draggable:drag` from inner `dragRegion` to the `<header>` element and added `--wails-draggable:no-drag` to all buttons and their container divs, matching the Wails v2 official pattern for frameless windows

## [0.6.0] — 2026-07-07

### Added

- Print button in title bar (printer SVG icon, tooltip "Print (⌘P)")
- `Ctrl/Cmd+P` keyboard shortcut to print the current note
- Print output with A4 formatting, note name header, input/results table, LineSolv watermark (logo + name) and date footer on every page
- Printing via hidden iframe for reliable `position: fixed` watermark repetition across all pages

## [0.5.0] — 2026-07-07

### Added

- Phase 0 `normalize()` preprocessing: Unicode quotes/dashes/brackets → ASCII, `×` → `*`, `÷` → `/`, noise word stripping (`exactly`, `roughly`, `about`, `say`), whitespace normalisation
- Expanded conversational prefixes: `can you`, `could you`, `would you`, `i need`, `i'd like`, `let's`, `determine`, `i think`, `maybe`, `so`, `okay`, `like`, `what does X equal`
- Expanded trailing patterns: `for me`, `if you don't mind`, `quickly`, `yrs old`, `yr old`
- Expanded word operators: `combined with`, `together with`, `subtract` (infix), `without`, `fewer`, `lots of`, `sets of`, `split between/among`, `shared between/among`, `divide` (infix), `exponent`, `to the N` (power)
- Expanded natural functions: `the square/cube/absolute root of`, `sine/cosine/tangent of X`, `log of X`, `ln of X`, `square X` (verb), `cube X` (verb)
- Expanded context references: `previous`, `last`, `prior`, `prev` (standalone and with `result`/`answer`)
- Expanded comparison phrases: `half as much as`, `quarter as much as`, `how many X in Y`
- Expanded percentage patterns: `pct` / `p.c.` abbreviations, `what percent of Y is X`, `X out of Y as a percentage`, `X plus Y% tip/tax`, `X minus/after Y% discount`
- Expanded date patterns: `in N days/weeks`, `what is the date in N days`, `N days before/after today`, `next/last/this Mon/Tue/Wed...`
- 33 new test cases across all new pattern categories (82 total, up from 49)

## [0.4.1] — 2026-07-07

### Fixed

- Trailing `?` breaking word-to-number conversion (`"what is one plus one?"` → `2`)
- "What is my age?" not resolving from context (now returns last computed age)
- Date math patterns not matching when embedded in surrounding text

### Added

- Embedded date math extraction: `today + 14 days` computed even with extra words around it
- "my age" / "my current age" as context references (return last result)
- `extractDateMath` fallback using unanchored patterns for post-naturalize matching
- Refactored `computeDateOffset` to eliminate duplicate date offset logic
- Test coverage for embedded date expressions and "what is my age" sequence

## [0.4.0] — 2026-07-07

### Added

- Currency conversion with 21 fiat currencies (USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, BRL, MXN, KRW, SEK, NOK, DKK, NZD, BDT, PKR, LKR, NPR, MYR, IDR, TWD, SAR, AED, KWD, EGP, NGN, COP, CLP, ARS, PEN, MAD) and 2 precious metals (XAU, XAG)
- Currency code prefix support (`BTC5k` → `5k btc`)
- 13 currency symbols (`$`, `€`, `£`, `¥`, `₹`, `₽`, `₩`, `R$`, `₿`, `৳`, `₮`, `៛`, `₪`)
- Live cross-rate currency conversion via `in`/`to`/`as` keyword
- Date arithmetic (`today + 3 weeks`, `mar 15 - jan 1`, `25th dec + 2 weeks`)
- Time/duration conversion (`90 minutes in hours`, `2h30m`)
- Mixed number support (`3 1/2 + 1 3/4`)
- Natural language patterns: fractions (`½`, `¾`), comparisons (`>`, `<`, `=`), cube root (`cbrt`)
- Embedded docs viewer with offline support
- Multi-theme system with theme tab in settings
- SQLite storage backend for config, export/import, note management
- Settings UI for font family/size overrides and keyboard shortcut customization
- App icon with rounded corners
- F11 fullscreen toggle
- Quick start documentation

### Fixed

- Currency `$`/`€`/`£` now parse correctly both as prefix and standalone
- SI notation expansion for unit conversion (`5k in EUR`)
- `R$` multi-character currency symbol matching
- Month name parsing handles both short (`Mar`) and long (`March`) forms
- Compact time patterns (`2h30m`) parse correctly
- macOS builds: use `macos-latest` with arch matrix, fix Wails `.app` bundle path

### Changed

- Engine restructured: `engine.go` split from Numi/Alfred remnants into standalone package
- Natural language pipeline now runs date math before naturalization to preserve date keywords
- Theme colors auto-cascade when font_color is not specified
- Documentation expanded to 7 docs files (user guide, FAQ, calculator engine internals)

## [0.3.0] — 2026-07-07

### Added

- Natural language patterns: fraction input (`½` → `1/2`), comparison operators (`>`, `<`, `=`), cube root (`cbrt`)
- Embedded documentation viewer with offline support
- Quick start documentation guide

### Changed

- Natural language preprocessing expanded to 3 additional steps (fractions, comparisons, cbrt)

## [0.2.0] — 2026-07-07

### Added

- SQLite persistent storage for configuration, settings, and notes
- Config export/import functionality
- Note management improvements
- Multi-theme system with dedicated theme tab in settings panel
- Font family and size override in settings
- Keyboard shortcut customization (10 shortcuts)
- App icon with rounded corners
- F11 fullscreen toggle support

### Changed

- Dark mode rendering fixes across UI components
- Removed unused `app/icon/` directory
- Engine extracted from Numi/Alfred codebase into clean, standalone Go package
- Remaining PLAN.md items stripped to current work only
- CI and Release workflows split and simplified

### Fixed

- macOS builds now correctly produce `.dmg` artifacts across both x86_64 and arm64 arches

## [0.1.45] — 2026-07-06

### Added

- Initial release as LineSolv (forked/rebranded from Numi)
- Cross-platform desktop app with Wails v2 (Go + WebView)
- Natural language calculator engine with 10-step preprocessing pipeline
- PEMDAS recursive descent parser with lexer/tokenizer
- Unit conversion (length, mass, volume, temperature, currency)
- Variable assignment and cross-line reference
- 11 built-in math functions (sin, cos, tan, sqrt, abs, round, floor, ceil, log/ln, log10, exp)
- Constants (pi/π, e)
- Percentage math (% of, % add/subtract)
- Context awareness (of that, then, result)
- Computation history with keyboard navigation
- Dark/light theme toggle
- Multi-note support
- 10 keyboard shortcuts
- Notepad-style UI with line numbers and results column
- Debounced live evaluation (150ms)
- CI/CD with cross-platform release builds (Linux .deb, macOS .dmg, Windows .exe)
- Comprehensive documentation (5 docs files)

### Fixed

- Floating-point modulo now uses `math.Mod` instead of int64 truncation
- Comment lines (`#`, `//`) handled correctly in backend
- Natural language pipeline strips articles before add/sum for better parsing
- Context references (`of that`) produce correct results

### Changed

- Error handling now returns descriptive `"Error: ..."` strings instead of silent empty strings
- `println` replaced with `log.Println` for structured logging

[0.15.10]: https://github.com/rkriad585/LineSolv/releases/tag/v0.15.10
[0.15.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.15.0
[0.14.1]: https://github.com/rkriad585/LineSolv/releases/tag/v0.14.1
[0.14.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.14.0
[0.13.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.13.0
[0.12.96]: https://github.com/rkriad585/LineSolv/releases/tag/v0.12.96
[0.12.13]: https://github.com/rkriad585/LineSolv/releases/tag/v0.12.13
[0.11.17]: https://github.com/rkriad585/LineSolv/releases/tag/v0.11.17
[0.10.16]: https://github.com/rkriad585/LineSolv/releases/tag/v0.10.16
[0.9.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.9.0
[0.8.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.8.0
[0.7.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.7.0
[0.6.1]: https://github.com/rkriad585/LineSolv/releases/tag/v0.6.1
[0.6.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.6.0
[0.5.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.5.0
[0.4.1]: https://github.com/rkriad585/LineSolv/releases/tag/v0.4.1
[0.4.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.4.0
[0.3.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.3.0
[0.2.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.2.0
[0.1.45]: https://github.com/rkriad585/LineSolv/releases/tag/v0.1.45
