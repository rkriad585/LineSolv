# FAQ & Troubleshooting

## General

### What is LineSolv?
LineSolv is a cross-platform desktop natural-language calculator. You type expressions like `$20 in euro - 5% discount` or `what is the just plus five` and it shows live results as you type.

### How do I use it?
Just start typing any math expression or question. Results appear to the right of each line as you type. No need to press Enter — evaluation happens live with a 150ms debounce.

### What platforms are supported?
Linux (.deb), macOS (.dmg), and Windows (.exe with NSIS installer). Any platform with WebKit2GTK 4.1+ (Linux) or a modern Chromium-based WebView (macOS/Windows) works.

### How do I update LineSolv?
Open **Settings > About** and click "Check for Updates". If a new version is available, a download link will appear. Alternatively, check the [releases page](https://github.com/rkriad585/LineSolv/releases).

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
Uninstall via Settings > Apps, then delete `%APPDATA%/neostore/linesolv` to remove user data.

## Input & Expressions

### What kind of input does LineSolv understand?
LineSolv handles:
- Basic arithmetic: `1 + 2`, `3 * 4`, `10 / 2`
- Natural language: `what is twenty five plus three`, `$20 in euro`
- Unit conversion: `10 inches in cm`, `100 USD in EUR`, `212 f to c`
- Percentages: `10% of 200`, `100 + 15%`
- Variables: `x = 42`, `x * 2`
- Math functions: `sqrt(144)`, `sin(pi/2)`, `log(100)`, `round(3.7)`
- Constants: `pi`, `e`
- Fraction words: `one half`, `two thirds`, `three quarters`
- Scale words: `double 5`, `half of 20`, `triple 3`
- Power words: `5 squared`, `3 cubed`
- Comparison: `10 increased by 5`, `5 more than 10`, `difference between 10 and 3`
- Division phrases: `10 over 2`, `ratio of 10 to 2`
- Natural functions: `square root of 144`, `cube root of 27`, `absolute value of -5`
- Convert prefix: `convert 10 inches to cm`, `change 100 c to f`

### Why is nothing showing up for my input?
LineSolv behaves like a notepad — invalid expressions silently show no result. Check for:
- Typos in function names
- Mismatched parentheses
- Unknown units in conversion
- Missing operands near operators

If you see an error line in red, read the message for guidance.

### How do I clear all variables and start fresh?
Press `Ctrl/Cmd+K` to clear all input, variables, and history.

### Can I use previous results in new calculations?
Yes. LineSolv understands context references:
- `of that` / `of it` / `of the result` — uses the previous line's result
- `then + 5` — adds 5 to the previous result
- Just `that` or `it` on a line — returns the previous result

## Units & Conversion

### What units are supported?
- **Length**: meter, kilometer, centimeter, millimeter, inch, foot, yard, mile
- **Mass**: gram, kilogram, pound, ounce
- **Volume**: liter, milliliter, gallon, quart, cup
- **Temperature**: Celsius, Fahrenheit
- **Currency**: USD, EUR, GBP, JPY, CNY, INR, CAD, AUD, CHF

### Are currency rates live?
No. Currency rates are hardcoded and will drift over time. They serve as approximate conversions only. Live API integration is planned for a future release.

### How do I convert units?
Type `X fromUnit in toUnit`. Examples:
- `10 inches in cm`
- `100 c to f`
- `50 kg in pounds`

## Notes

### How do I create a new note?
Press `Ctrl/Cmd+N` or click the + button in the notes sidebar. Each note gets an auto-generated fancy name.

### How do I rename a note?
Right-click a note in the sidebar and select **Rename**. Type the new name and press Enter.

### How do I delete a note?
Right-click a note and select **Delete**. A confirmation dialog appears. You can check "Don't ask again" to skip confirmation in the future.

### How do I export a note?
Right-click a note, go to **Export**, and choose a format. A native Save As dialog will appear. Supported formats:
- `.lv` — LineSolv native format
- `.txt` — Plain text
- `.md` — Markdown
- `.json` — JSON
- `.toml` — TOML

### How do I import a note?
Right-click any note in the sidebar and select **Import**. A native Open file dialog will appear. Supported format: `.json` (with `name` and `content` fields).

## Themes

### What themes are available?
LineSolv comes with 7 color themes: Dark, Light, Neon, Red, Obsidian, Plasma, and Blood. Open **Settings > Theme** to browse and apply them.

### How do I change the theme?
Press `Ctrl/Cmd+,` or click the gear icon in the title bar, then go to the **Theme** tab. Click a theme thumbnail and press Save.

### My theme preference isn't persisting across restarts
The theme is stored in `~/.config/neostore/linesolv/config.toml` under `[app] -> theme`. If the config file is deleted or corrupted, the app falls back to the Dark theme.

## Fullscreen

### How do I enter/exit fullscreen?
Press `F11` or double-click the title bar to toggle fullscreen mode.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + B` | Toggle notes sidebar |
| `Ctrl/Cmd + I` | Toggle variables panel |
| `Ctrl/Cmd + H` | Toggle history panel |
| `Ctrl/Cmd + K` | Clear all (input, history, variables) |
| `Ctrl/Cmd + N` | Create new note |
| `Ctrl/Cmd + D` | Duplicate line or selection |
| `Ctrl/Cmd + L` | Select current line |
| `Ctrl/Cmd + Shift + K` | Delete current line |
| `Alt + Shift` | Toggle case (lower → UPPER → Title) |
| `Alt + ↑ / ↓` | Move line up/down |
| `Ctrl/Cmd + ↑` | History: restore previous input |
| `Ctrl/Cmd + ↓` | History: restore next input |
| `Ctrl/Cmd + /` | Show keyboard shortcuts |
| `Ctrl/Cmd + ,` | Open settings |
| `Shift + Enter` | Force evaluate immediately |
| `Escape` | Close modal / clear input / close panel |
| `F11` | Toggle fullscreen |
| `Tab` | Insert 2 spaces |

Press `Ctrl/Cmd+/` at any time to view the shortcut reference modal. You can rebind any shortcut in **Settings > Keyboard Shortcuts**.

## Settings

### How do I open Settings?
Press `Ctrl/Cmd+,` or click the gear icon in the title bar.

### What settings can I change?
- **General**: Font family, font size
- **Theme**: Choose from 7 color themes
- **Keyboard Shortcuts**: View and rebind all shortcuts
- **About**: Version info, check for updates

### Where are settings stored?
All settings are stored in `~/.config/neostore/linesolv/config.toml`. This includes theme, font settings, and shortcut overrides.

### Can I reset settings to defaults?
Delete `~/.config/neostore/linesolv/config.toml` and restart the app. A new default config will be created.

## Troubleshooting

### The app shows a blank white screen on startup
The Wails runtime may not have initialized. Close and reopen the app. If the issue persists, check for WebKit2GTK version compatibility on Linux (requires 4.1+).

### Evaluations seem slow or unresponsive
- Check if you have an extremely long expression (>10,000 characters). LineSolv enforces a 10,000 character limit.
- Very deep nested parentheses (100+ levels) are rejected with an error.
- If a single expression takes more than 5 seconds, evaluation times out.

### My export/import file dialogs don't open
File dialogs require the Wails runtime to be fully initialized. If dialogs fail silently, try restarting the app.

### The "Don't ask again" preference for delete confirmation isn't working
This preference is stored in `~/.config/neostore/linesolv/config.toml`. If you delete this config file, the preference resets to the default (show confirmation).

### Where is my data stored?
- **Notes database**: `~/.config/neostore/linesolv/linesolv.db` (SQLite)
- **App preferences**: `~/.config/neostore/linesolv/config.toml`
  - `[app]` section: theme, version
  - `[notes]` section: last_active, sort_by
  - `[behavior]` section: delete_without_confirm
  - `[settings]` section: font_size, font_family, shortcut_overrides

## Support

### How do I report a bug?
Open an issue at https://github.com/anomalyco/neostore/issues with:
- A clear description of the problem
- Steps to reproduce
- Your OS and app version
- Any relevant console errors

### How do I contribute?
See `CONTRIBUTING.md` in the project root for guidelines on development setup, code standards, and pull request workflow.
