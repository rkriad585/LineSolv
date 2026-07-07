# LineSolv User Guide

LineSolv is a natural-language calculator that works like a notepad. Type anything that looks like a math question and get the answer instantly — no equals sign needed.

## Getting Started

When you first open LineSolv, you'll see a blank notepad with a blinking cursor. Just start typing.

```
twenty five plus 3        →  28
what is 42 * 2            →  84
10 inches in cm            →  25.4 cm
$100 in euro               →  92.59 EUR
```

Results appear to the right of each line. Empty lines and comment lines (starting with `#` or `//`) show no result.

## The Interface

```
┌─────────────────────────────────────────────────┐
│ ● ● ●  LineSolv                  [☰] [≡] [⏱] ☾ │  ← Title bar (drag to move)
├────────┬────────────────────────┬───────────────┤
│        │                        │               │
│ Notes  │  # Textarea            │  Results      │
│ Panel  │  (type here)           │  Column       │
│        │                        │               │
│        │  1 │ 25 + 17        ──│  42           │
│        │  2 │ 42 * 2         ──│  84           │
│        │                        │               │
├────────┴────────────────────────┴───────────────┤
│  History Panel (toggle with ⌘H)                  │
└─────────────────────────────────────────────────┘
```

### Title Bar
- **Window controls**: Close (red), Minimize, Maximize
- **Drag region**: Click and drag the title text to move the window; double-click to toggle fullscreen
- **Buttons**: Notes (⌘B), Variables (⌘I), History (⌘H), Settings (⌘,)

### Notes Panel (left)
Manage multiple calculation notebooks. Each note is independent with its own content and variables.

### History Panel (left, behind Notes)
Shows your recent evaluation history. Click any entry to restore its input.

### Variables Panel (right)
Shows all currently defined variables and their values.

## Writing Expressions

### Basic Arithmetic
```
1 + 2           →  3
10 - 3          →  7
4 * 5           →  20
20 / 4          →  5
2 ^ 3           →  8
17 % 5          →  2 (modulo)
```

Follows standard PEMDAS operator precedence: parentheses > exponents > multiplication/division/modulo > addition/subtraction.

### Natural Language
```
what is twenty five plus three      →  28
calculate 15% of 200                →  30
how much is 100 USD in EUR          →  92.59 EUR
twenty five hundred                 →  2500
```

LineSolv understands:
- Word numbers: `twenty five`, `one hundred`, `two million`
- Query prefixes: `what is`, `calculate`, `how much is`, `solve`
- Word operators: `plus`, `minus`, `times`, `divided by`, `power of`

### Unit Conversion
Use the pattern `X fromUnit toUnit` or `X fromUnit in toUnit`:

```
10 inches in cm         →  25.4 cm
100 USD in EUR          →  92.59 EUR
212 f to c              →  100 °C
1 kg to lb              →  2.20462 lb
3 liters in gallons     →  0.792516 gal
```

**Supported units:**

| Category | Units |
|---|---|
| Length | meter, kilometer, centimeter, millimeter, inch, foot, yard, mile |
| Mass | gram, kilogram, pound, ounce |
| Volume | liter, milliliter, gallon, quart, cup |
| Temperature | Celsius, Fahrenheit |
| Currency | USD, EUR, GBP, JPY, CNY, INR, CAD, AUD, CHF |

### Percentages
```
10% of 200              →  20
100 + 15%               →  115
200 - 10%               →  180
```

### Variables
Assign values and reuse them across lines:

```
x = 42                  →  x = 42
x * 2                   →  84
y = x + 8               →  y = 50
y / 2                   →  25
```

Variables are case-insensitive and persist until you clear them with `Ctrl/Cmd+K`.

### Context References
Use previous results without repeating yourself:

```
42                      →  42
of that * 2             →  84
then + 10               →  94
result / 2              →  47
```

- `of that`, `of it`, `of the result` — use the previous line's result
- `then X` — previous result followed by X
- Just `that` or `it` on a line — returns the previous result

### Math Functions

| Function | Description | Example |
|---|---|---|
| `sin(x)` | Sine (radians) | `sin(pi/2)` → 1 |
| `cos(x)` | Cosine (radians) | `cos(pi)` → -1 |
| `tan(x)` | Tangent (radians) | `tan(pi/4)` → 1 |
| `asin(x)` | Arc sine | `asin(1)` → 1.5708 |
| `acos(x)` | Arc cosine | `acos(0)` → 1.5708 |
| `atan(x)` | Arc tangent | `atan(1)` → 0.7854 |
| `atan2(y, x)` | Arc tangent of y/x | `atan2(1, 1)` → 0.7854 |
| `sinh(x)` | Hyperbolic sine | `sinh(0)` → 0 |
| `cosh(x)` | Hyperbolic cosine | `cosh(0)` → 1 |
| `tanh(x)` | Hyperbolic tangent | `tanh(0)` → 0 |
| `sqrt(x)` | Square root | `sqrt(144)` → 12 |
| `abs(x)` | Absolute value | `abs(-5)` → 5 |
| `round(x)` | Round to integer | `round(3.7)` → 4 |
| `floor(x)` | Round down | `floor(3.7)` → 3 |
| `ceil(x)` | Round up | `ceil(3.2)` → 4 |
| `trunc(x)` | Truncate decimals | `trunc(3.7)` → 3 |
| `fract(x)` | Fractional part | `fract(3.7)` → 0.7 |
| `log(x)` / `ln(x)` | Natural log | `log(e)` → 1 |
| `log10(x)` | Base-10 log | `log10(100)` → 2 |
| `log2(x)` | Base-2 log | `log2(8)` → 3 |
| `exp(x)` | e^x | `exp(1)` → 2.71828 |
| `pow(x, y)` | x^y | `pow(2, 10)` → 1024 |
| `fact(x)` / `factorial(x)` | Factorial | `fact(5)` → 120 |
| `gcd(a, b)` | Greatest common divisor | `gcd(12, 8)` → 4 |
| `lcm(a, b)` | Least common multiple | `lcm(12, 8)` → 24 |
| `rand()` | Random [0, 1) | `rand()` → 0.123... |
| `min(a, b, ...)` | Minimum | `min(3, 7, 1)` → 1 |
| `max(a, b, ...)` | Maximum | `max(3, 7, 1)` → 7 |
| `sum(a, b, ...)` | Sum | `sum(1, 2, 3)` → 6 |
| `avg(a, b, ...)` | Average | `avg(1, 2, 3)` → 2 |
| `sign(x)` / `sgn(x)` | Sign (-1, 0, 1) | `sign(-5)` → -1 |
| `deg(x)` | Radians to degrees | `deg(pi)` → 180 |
| `rad(x)` | Degrees to radians | `rad(180)` → 3.14159 |

### Constants
- `pi` or `π` — 3.14159...
- `e` — 2.71828...

## Managing Notes

### Creating Notes
Press `Ctrl/Cmd+N` or click the + button in the notes sidebar. Each new note gets a randomly generated fancy name.

### Switching Notes
Click any note in the sidebar to switch to it.

### Renaming Notes
Right-click a note → select **Rename** → type the new name → press Enter.

### Deleting Notes
Right-click a note → select **Delete**. A confirmation dialog appears. Check "Don't ask again" to skip this dialog in the future.

### Exporting Notes
Right-click a note → **Export** → choose a format:
- **.lv** — LineSolv native format
- **.txt** — Plain text
- **.md** — Markdown
- **.json** — Structured JSON (name + content)
- **.toml** — TOML format

A native Save As dialog will appear. Choose where to save.

### Importing Notes
Right-click any note → select **Import**. A native Open dialog appears. Select a `.json` file with `name` and `content` fields. The note is added to your note list and becomes active.

### Sharing Notes
Right-click a note → **Share** copies the note name and content to your clipboard.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Tab` | Insert 2 spaces |
| `Shift + Enter` | Force evaluate immediately |
| `Escape` | Close modal / clear input / close panel |
| `F11` | Toggle fullscreen |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + D` | Duplicate current line or selection |
| `Ctrl/Cmd + L` | Select current line |
| `Ctrl/Cmd + Shift + K` | Delete current line |
| `Alt + Shift` | Toggle case (lowercase → UPPERCASE → Title Case) |
| `Alt + ↑ / ↓` | Move current line up/down |
| `Ctrl/Cmd + B` | Toggle notes sidebar |
| `Ctrl/Cmd + I` | Toggle variables panel |
| `Ctrl/Cmd + H` | Toggle history panel |
| `Ctrl/Cmd + K` | Clear all (input, history, variables) |
| `Ctrl/Cmd + N` | Create new note |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + /` | Show keyboard shortcut reference |
| `Ctrl/Cmd + ↑` | Restore previous input from history |
| `Ctrl/Cmd + ↓` | Restore next input from history |

Press `Ctrl/Cmd+/` at any time to see the full shortcut list in a modal overlay.

## Settings

Open Settings with `Ctrl/Cmd+,` or click the gear icon in the title bar.

### General tab
- **Font Family** — choose from a list of system fonts
- **Font Size** — adjustable from 10px to 32px
- **Preview** — see font changes live before saving

### Theme tab
Choose from 7 color themes:
- **Dark** — deep zinc-based dark theme (default)
- **Light** — clean light theme
- **Neon** — dark with vibrant green accents
- **Red** — dark with red accents
- **Obsidian** — near-black with warm amber/gold accents
- **Plasma** — dark purple with vibrant purple accents
- **Blood** — deep crimson with blood-red accents

Each theme shows a color swatch preview. Click a theme and press Save to apply.

### Keyboard Shortcuts tab
View all shortcuts and customize key bindings. Click a binding or the edit icon to remap.

### About tab
- Version information
- Author and repository links
- Check for updates

## Customization

### Theme
Open **Settings > Theme** to choose from 7 color themes. Your preference is stored in `config.toml` and persists across sessions.

### Font
Open **Settings > General** to change the font family and size for the calculator input and results.

### Shortcut Overrides
Open **Settings > Keyboard Shortcuts** to rebind any keyboard shortcut. Click a key binding or the edit icon, then press your desired key combination.

## Data Storage

Your notes and preferences are stored locally:

- **Notes**: `~/.config/neostore/linesolv/linesolv.db` (SQLite database)
- **Preferences**: `~/.config/neostore/linesolv/config.toml`
  - `[app]` — theme, version
  - `[notes]` — last active note, sort order
  - `[behavior]` — delete confirmation preference
  - `[settings]` — font size, font family, shortcut overrides

Deleting the config directory (`~/.config/neostore/linesolv/`) will reset all preferences but keep your notes database. Deleting the database file will remove all notes.

## Troubleshooting

See the [FAQ](faq.md) for common issues and solutions.
