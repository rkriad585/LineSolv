# Changelog

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

[0.5.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.5.0
[0.4.1]: https://github.com/rkriad585/LineSolv/releases/tag/v0.4.1
[0.4.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.4.0
[0.3.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.3.0
[0.2.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.2.0
[0.1.45]: https://github.com/rkriad585/LineSolv/releases/tag/v0.1.45
