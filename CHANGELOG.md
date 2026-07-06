# Changelog

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

[0.1.45]: https://github.com/rkriad585/LineSolv/releases/tag/v0.1.45
