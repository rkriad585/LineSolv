# Changelog

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

[0.4.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.4.0
[0.3.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.3.0
[0.2.0]: https://github.com/rkriad585/LineSolv/releases/tag/v0.2.0
[0.1.45]: https://github.com/rkriad585/LineSolv/releases/tag/v0.1.45
