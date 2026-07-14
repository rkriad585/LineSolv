# FAQ & Troubleshooting

## General

### What is LineSolv?
LineSolv is a cross-platform desktop natural-language calculator. You type expressions like `$20 in euro - 5% discount` or `what is the just plus five` and it shows live results as you type. Built with **Wails v2** (Go + WebView), **Vite**, **TypeScript**, and **CSS custom properties** for theming.

### What platforms are supported?
- **Linux** — `.deb` (Debian/Ubuntu) or standalone binary. Requires WebKit2GTK 4.1+ (Ubuntu 24.10+, Fedora 40+, Arch).
- **macOS** — `.dmg` (Intel & Apple Silicon). Requires macOS 12+.
- **Windows** — `.exe` (NSIS installer). Requires Windows 10+.

### How do I update LineSolv?
Open **Settings > About** and click "Check for Updates". If a new version is available, a download link will appear pointing to the [releases page](https://github.com/rkriad585/LineSolv/releases). The check compares the local version against the `.version` file on the `main` branch of the repository.

### How do I uninstall LineSolv?

**Linux (deb)**
```bash
sudo dpkg -r linesolv
rm -rf ~/.config/neostore/linesolv
```

**macOS**
```bash
rm -rf /Applications/LineSolv.app
rm -rf ~/.config/neostore/linesolv
```

**Windows**
Uninstall via **Settings > Apps**, then delete `%APPDATA%/neostore/linesolv` to remove all user data.

---

## Input & Expressions

### What kind of input does LineSolv understand?
LineSolv handles a wide range of input patterns:

- **Basic arithmetic**: `1 + 2`, `3 * 4`, `10 / 2`, `2^3`, `17 % 5`
- **Natural language**: `what is twenty five plus three`, `$20 in euro`
- **Unit conversion**: `10 inches in cm`, `100 USD in EUR`, `212 f to c`
- **Percentages**: `10% of 200`, `100 + 15%`, `200 after 10% discount`
- **Variables**: `x = 42`, `x * 2`
- **Math functions**: `sqrt(144)`, `sin(pi/2)`, `log(100)`, `round(3.7)`
- **Constants**: `pi`, `e`
- **Fraction words**: `one half`, `two thirds`, `three quarters`
- **Scale words**: `double 5`, `half of 20`, `triple 3`
- **Power words**: `5 squared`, `3 cubed`
- **Comparison**: `10 increased by 5`, `5 more than 10`, `difference between 10 and 3`
- **Division phrases**: `10 over 2`, `ratio of 10 to 2`
- **Natural functions**: `square root of 144`, `cube root of 27`, `absolute value of -5`
- **Convert prefix**: `convert 10 inches to cm`, `change 100 c to f`
- **Currency prefix**: `$10`, `€5`, `£20`, `₿5k`
- **Ordinal suffixes**: `1st`, `2nd`, `3rd`, `4th`
- **SI notation**: `5k`, `3M`, `2B`
- **Date math**: `today + 14 days`, `March 1 + 30 days`
- **Time/duration**: `2h30m`, `90 minutes in hours`
- **Mixed numbers**: `2 1/2` → `2.5`
- **Possessive plurals**: `3 tens`, `2 hundreds`, `2 dozens`
- **Collective nouns**: `a couple`, `a dozen`, `a score`
- **Subtraction from**: `10 from 100`
- **Percentage relations**: `10 is what percent of 50`, `50% of what is 25`
- **Factorial operator**: `5!`
- **Log base**: `log base 2 of 8`
- **Combinations**: `5 choose 3`
- **How many times**: `how many times does 5 go into 20`
- **Purchase math**: `5 items at $20 each with a 15% discount`
- **Age calculation**: `born in 2007`, `i am 25 years old`

### Can I combine patterns across phases in one line?
Yes. All natural language patterns work together on the same line:
```
$100 + €20                           →  120
2B / 5k                              →  400000
a dozen + 3 scores                    →  72
how many times does 25 go into 5k     →  200
5 choose 2 + 3!                       →  16
log base 10 of 100 + 3 squared        →  11
10 is what % of 50 + $20              →  40
double a dozen                        →  24
3 tens from 5 hundreds                →  470
```

### Why is nothing showing up for my input?
LineSolv behaves like a notepad — invalid expressions silently show no result. Check for:
- Typos in function names
- Mismatched parentheses
- Unknown units in conversion
- Missing operands near operators
- Input exceeding 10,000 characters (the engine enforces a 10,000 character limit)

If you see an error line in red, read the message for guidance. Common causes:
- `"input too long"` — your expression exceeds 10,000 characters
- `"evaluation timed out"` — a single expression took more than 5 seconds

### How do I clear all variables and start fresh?
Press `Ctrl/Cmd+K` to clear all input, variables, and history.

### Can I use previous results in new calculations?
Yes. LineSolv understands context references:
- `of that` / `of it` / `of the result` — uses the previous line's result
- `then + 5` — adds 5 to the previous result
- Just `that` or `it` on a line — returns the previous result
- `last`, `previous`, `prior`, `last answer` — recall the last computed value

### Can I use conversational prefixes?
Yes. LineSolv strips conversational noise before evaluating:
```
hello calculate 6 times 7            →  42
hey there what is 2 + 3              →  5
ok solve 100 / 4                     →  25
well 10 inches in cm                 →  25.4 cm
```

### How do comments work?
Lines starting with `#` or `//` are treated as comments and produce no result. Lines ending with `:` are treated as labels and also produce no result:
```
# This is a comment
// This is also a comment
My calculations:
2 + 2
```

---

## Units & Conversion

### What units are supported?

| Category | Units |
|----------|-------|
| **Length** | meter, kilometer, centimeter, millimeter, inch, foot, yard, mile |
| **Mass** | gram, kilogram, pound, ounce |
| **Volume** | liter, milliliter, gallon, quart, cup |
| **Temperature** | Celsius, Fahrenheit |
| **Time** | second, minute, hour, day |
| **Currency** | USD, EUR, GBP, JPY, CNY, INR, CAD, AUD, CHF, KRW, RUB, BRL, MXN, ZAR, NZD, SEK, NOK, PLN, HKD, SGD, THB, ILS, VND, PHP, UAH, KZT, PYG, GHS, TRY, AZN, GEL, BDT, PKR, LKR, NPR, MYR, IDR, TWD, SAR, AED, KWD, EGP, NGN, COP, CLP, ARS, PEN, MAD, BTC (Bitcoin), XAU (gold), XAG (silver) |

### Are currency rates live?
Currency rates are fetched live from [exchangerate-api.com](https://api.exchangerate-api.com) when available. Rates are cached in the SQLite database and fall back to cached values on network failure. You can manually refresh rates from the Settings **About** tab.

### How do I convert units?
Type `X fromUnit in toUnit` or `X fromUnit to toUnit`. Examples:
```
10 inches in cm         →  25.4 cm
100 c to f              →  212.0 °F
50 kg in pounds         →  110.231 lb
1 gal in l              →  3.78541 l
2h30m in minutes        →  150 minutes
```

You can also use the convert prefix:
```
convert 10 inches to cm →  25.4 cm
change 100 c to f       →  212.0 °F
```

### Can I use currency symbols or codes?
Yes. Both symbols and ISO codes work, and SI notation applies:
```
$10 in EUR              →  8.77 EUR
€5 in USD               →  5.70 USD
£20 in JPY              →  3992.26 JPY
$5k in EUR              →  4385.96 EUR
€5M in USD              →  5700000.00 USD
₿5k in USD              →  320000000.00 USD
```

---

## Notes

### How do I create a new note?
Press `Ctrl/Cmd+N` or click the **+** button in the notes sidebar. Each note gets an auto-generated fancy name (e.g. "Amber Fox").

### How do I switch between notes?
Click any note in the sidebar to switch to it. The sidebar also supports sorting by name, created date, or updated date via the sort button at the top.

### How do I rename a note?
Right-click a note in the sidebar and select **Rename**. Type the new name and press Enter.

### How do I delete a note?
Right-click a note and select **Delete**. A confirmation dialog appears. You can check **"Don't ask again"** to skip confirmation in the future. This preference is stored in `~/.config/neostore/linesolv/config.toml` under `[behavior] -> delete_without_confirm`.

### How do I export a note?
Right-click a note, go to **Export**, and choose a format. A native Save As dialog will appear. Supported formats:

| Format | Extension | Description |
|--------|-----------|-------------|
| LineSolv | `.lv` | Native format — raw content only |
| Plain text | `.txt` | Title, created date, separator, and content |
| Markdown | `.md` | Formatted Markdown with title and dates |
| JSON | `.json` | Structured JSON with `name`, `content`, `createdAt`, `updatedAt` |
| TOML | `.toml` | TOML format with name and content fields |
| PDF | `.pdf` | A4-formatted PDF with title, dates, content, and page numbering |

### How do I import a note?
Right-click any note in the sidebar and select **Import**. A native Open file dialog will appear. The following formats are supported for import:

| Format | Notes |
|--------|-------|
| `.json` | Parsed for `name` and `content` fields; timestamps are preserved when present |
| `.toml` | Parsed for `name` and `content` fields |
| `.lv` | Raw content imported as-is |
| `.txt` | Raw content imported as-is |
| `.md` | Raw content imported as-is |
| `.pdf` | Text content is extracted from all pages |

### How do I share a note?
Right-click a note and select **Share** to copy the note name and content to your clipboard.

### Can I reorder notes with drag and drop?
Yes. Drag and drop notes in the sidebar to reorder them. The order is persisted in the database.

---

## Printing

### How do I print my calculations?
Click the printer icon in the title bar or press `Ctrl/Cmd+P`. This opens your operating system's native print dialog with a formatted document.

### What is included in the print output?
- All input lines and their results as a clean A4-formatted table
- A **note name header** at the top of the document
- A semi-transparent **LineSolv logo + name watermark** on the bottom-left of every page
- The **current date** on the bottom-right of every page

The print output uses a monospaced font with the note name in a sans-serif header, input lines in dark gray, and results in the accent color.

### Can I choose what to print?
The print output includes all lines currently in the input area. Clear or comment out lines you don't want before printing.

---

## Themes

### What themes are available?
LineSolv comes with 7 color themes:

| Theme | Description |
|-------|-------------|
| **Dark** | Deep zinc-based dark theme (default) |
| **Light** | Clean light theme |
| **Neon** | Dark with vibrant green accents |
| **Red** | Dark with red accents |
| **Obsidian** | Near-black with warm amber/gold accents |
| **Plasma** | Dark purple with vibrant purple accents |
| **Blood** | Deep crimson with blood-red accents |

Plugins can add additional themes — see the [Plugin System](#plugin-system) section.

### How do I change the theme?
Press `Ctrl/Cmd+,` or click the gear icon in the title bar, then go to the **Theme** tab. Click a theme thumbnail to preview it, then press **Save** to apply.

### My theme preference isn't persisting across restarts
The theme is stored in `~/.config/neostore/linesolv/config.toml` under `[app] -> theme`. If the config file is deleted or corrupted, the app falls back to the Dark theme.

---

## Fullscreen

### How do I enter/exit fullscreen?
- Press `F11` to toggle fullscreen
- Double-click the title bar to toggle fullscreen

Both methods work identically.

---

## Plugin System

### What are plugins?
Plugins extend LineSolv with **custom functions**, **custom themes**, and **custom variables**. Plugins are declarative — they use JSON manifests and cannot execute arbitrary code. Functions are implemented as math expressions or pre-defined builtin operations.

### What built-in plugins are available?
LineSolv ships with 12 built-in plugins: Finance, Statistics, Geometry, Physics, Date/Time, Health, Arrays, Hex, Color, Base-N, Matrix, and Random.

### How do I install a plugin?
1. Open the **Plugins** panel from the title bar
2. Browse or search the marketplace (fetches from the [linesolv-plugins repository](https://github.com/rkriad585/linesolv-plugins))
3. Click **Install** on a plugin card, or open the detail view and click **Install**
4. The plugin is downloaded, written to the plugins directory, and activated

### How do I enable or disable a plugin?
Toggle the switch on any installed plugin card. Toggling takes effect immediately — no restart required. The enabled/disabled state is persisted in `state.json` within the plugins directory.

### How do I remove a plugin?
Click **Remove** on an installed plugin card. A confirmation dialog will appear. The plugin's directory is deleted from disk and a rescan is triggered.

### How do I view plugin details?
Click a plugin card to open its detail view, which shows:
- Plugin metadata (name, version, author, homepage)
- A list of functions with descriptions and argument counts
- Custom variables and themes provided by the plugin
- The plugin's README documentation (fetched from the repository)
- Example usage with copy buttons

### Where are plugins stored?
- **Linux/macOS**: `~/.config/neostore/linesolv/plugins/`
- **Windows**: `%APPDATA%/neostore/linesolv/plugins/`

Each plugin is a subdirectory containing a `plugin.json` manifest file.

### How do I create a plugin?
See the [Plugin Development Guide](plugins.md) for the full manifest format, function definitions, theme variables, and examples.

### What is the plugin marketplace?
The plugin marketplace fetches a plugin index from `https://raw.githubusercontent.com/rkriad585/linesolv-plugins/main/plugins.json`. It shows available plugins with their metadata, allows searching by name/description/author/tags, and provides install/update/remove actions.

---

## Documentation Viewer

### How do I open the documentation viewer?
Click the **book icon** in the title bar. The documentation viewer opens as a full-screen overlay.

### What docs are available?
All documentation files are embedded in the application binary at build time. Available docs include:
- User Guide
- Architecture
- Frontend
- Plugin Development
- Calculator Engine
- From Words to Numbers
- FAQ & Troubleshooting
- API Reference
- Development Guide

### Does it work offline?
Yes. All documentation is embedded in the app binary via Go's `embed` package. No internet connection is needed.

### How does caching work?
Documents are cached in memory after the first load. The viewer defaults to opening the User Guide. Subsequent tab switches for previously loaded docs render instantly from the in-memory cache.

---

## Keyboard Shortcuts

### Complete shortcut reference

| Shortcut | Action |
|----------|--------|
| `Arrow keys` | Move cursor |
| `Ctrl/Cmd + Left/Right` | Jump word left/right |
| `Home / End` | Start / end of line |
| `Ctrl/Cmd + Home / End` | Start / end of text |
| `Page Up / Page Down` | Scroll page up/down |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + X` | Cut |
| `Ctrl/Cmd + C` | Copy |
| `Ctrl/Cmd + V` | Paste |
| `Ctrl/Cmd + A` | Select all |
| `Ctrl/Cmd + D` | Duplicate line or selection |
| `Ctrl/Cmd + L` | Select current line |
| `Ctrl/Cmd + Shift + K` | Delete current line |
| `Alt + Shift` | Toggle case (lowercase → UPPERCASE → Title Case) |
| `Alt + Up / Down` | Move current line up/down |
| `Tab` | Insert 2 spaces |
| `Shift + Enter` | Force evaluate immediately |
| `Escape` | Close modal / clear input / close panel |
| `Ctrl/Cmd + B` | Toggle notes sidebar |
| `Ctrl/Cmd + I` | Toggle variables panel |
| `Ctrl/Cmd + H` | Toggle history panel |
| `Ctrl/Cmd + S` | Toggle step-by-step panel |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + K` | Clear all (input, history, variables) |
| `Ctrl/Cmd + N` | Create new note |
| `?` or `Cmd + /` | Show keyboard shortcuts reference |
| `Ctrl/Cmd + Up` | History: restore previous input |
| `Ctrl/Cmd + Down` | History: restore next input |
| `Ctrl/Cmd + F` | Search notes |
| `Ctrl/Cmd + P` | Print current note |
| `F11` | Toggle fullscreen |
| `Double-click title bar` | Toggle fullscreen |

### Can I rebind shortcuts?
Yes. Open **Settings > Keyboard Shortcuts** to view all shortcuts and customize key bindings. Click a binding or the edit icon to remap it. Custom overrides are stored in `~/.config/neostore/linesolv/config.toml` under `[settings] -> shortcut_overrides`.

---

## Settings

### How do I open Settings?
Press `Ctrl/Cmd+,` or click the gear icon in the title bar.

### What settings can I change?

| Tab | Settings |
|-----|----------|
| **General** | Font family (17 options), font size (10px–32px slider), autocomplete toggle, opacity slider (30%–100%, default 95%), animations toggle, line numbers toggle, toast toggle, live preview |
| **Theme** | Choose from 7 built-in color themes (+ plugin themes) — applies instantly |
| **Keyboard Shortcuts** | View and rebind all shortcuts — auto-saves on change |
| **About** | Version info, author links, check for updates |

All settings apply immediately and auto-save — no Save button required.

### Where are settings stored?
All settings are stored in `~/.config/neostore/linesolv/config.toml`. The file has four sections:

| Section | Keys | Description |
|---------|------|-------------|
| `[app]` | `theme`, `version` | Active theme and app version |
| `[notes]` | `last_active`, `sort_by` | Last active note ID and sort order |
| `[behavior]` | `delete_without_confirm` | Delete confirmation preference (`"true"` / `"false"`) |
| `[settings]` | `font_size`, `font_family`, `shortcut_overrides`, `opacity`, `line_numbers_enabled`, `autocomplete_enabled`, `animations_enabled`, `toast_enabled` | Font, shortcut, and display configuration |

### Can I reset settings to defaults?
Click **Reset** in the settings header bar to reset all settings to defaults. Alternatively, delete `~/.config/neostore/linesolv/config.toml` and restart the app. Defaults: Dark theme, 95% opacity, 16px system font, line numbers on, autocomplete on, animations on, toast on.

---

## Troubleshooting

### The app shows a blank white screen on startup
The Wails runtime may not have initialized. Close and reopen the app. If the issue persists:
- **Linux**: Check for WebKit2GTK version compatibility (requires 4.1+)
- **macOS**: Try right-click → Open to bypass Gatekeeper on first launch
- **Windows**: Ensure you're on Windows 10+

### Evaluations seem slow or unresponsive
- Check if you have an extremely long expression (>10,000 characters). LineSolv enforces a 10,000 character limit.
- Very deep nested parentheses (100+ levels) are rejected with an error.
- If a single expression takes more than 5 seconds, evaluation times out with `"Error: evaluation timed out"`.

### My export/import file dialogs don't open
File dialogs require the Wails runtime to be fully initialized. If dialogs fail silently, try restarting the app.

### The "Don't ask again" preference for delete confirmation isn't working
This preference is stored in `~/.config/neostore/linesolv/config.toml` under `[behavior] -> delete_without_confirm`. If you delete this config file, the preference resets to the default (show confirmation). Verify the value is `"true"` (with quotes) in the TOML file.

### Where is my data stored?

| Data | Location |
|------|----------|
| **Notes database** | `~/.config/neostore/linesolv/linesolv.db` (SQLite with WAL mode) |
| **App preferences** | `~/.config/neostore/linesolv/config.toml` |
| **Currency cache** | Stored in the `currency_cache` table inside `linesolv.db` |
| **Plugins directory** | `~/.config/neostore/linesolv/plugins/` |
| **Plugin state** | `~/.config/neostore/linesolv/plugins/state.json` |

On Windows, replace `~/.config` with `%APPDATA%`.

### How do I reset everything?
1. Close LineSolv
2. Delete `~/.config/neostore/linesolv/` entirely
3. Restart LineSolv — a fresh database and default config will be created

---

## Support

### How do I report a bug?
Open an issue at https://github.com/rkriad585/LineSolv/issues with:
- A clear description of the problem
- Steps to reproduce
- Your OS and app version (visible in **Settings > About**)
- Any relevant console errors

### How do I contribute?
See [CONTRIBUTING.md](../CONTRIBUTING.md) in the project root for guidelines on development setup, code standards, and pull request workflow.

### Where can I find security policy information?
See [SECURITY.md](../SECURITY.md) for details on reporting vulnerabilities.
