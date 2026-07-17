<p align="center">
  <img src="../logo.svg" alt="LineSolv" width="96" height="96">
</p>

<h1 align="center">LineSolv User Guide</h1>

<p align="center">A beginner-friendly guide to using LineSolv, the natural-language desktop calculator.</p>

> **LineSolv** — Type math naturally, get instant results. No equals button needed.
>
> **Plugin Repository:** [github.com/rkriad585/linesolv-plugins](https://github.com/rkriad585/linesolv-plugins)
>
> **Future Features:** See [Future Roadmap](../extra/future.md) for planned features including AI integration, self-updater, image support, voice input, mobile support, and more.

---

## 1. Getting Started

### First Open

When you launch LineSolv for the first time, you'll see a splash screen with the LineSolv logo and a progress bar while the app loads. Once ready, a clean, dark-themed window with a single input area appears. There is no sign-up, no telemetry, and no internet connection required. Everything runs locally on your machine.

### Typing Your First Expression

Click the input area and start typing. Results appear in real-time as you type — there is no "equals" button. Type anything from simple arithmetic to natural-language phrases:

| Input                 | Result    |
| --------------------- | --------- |
| `2 + 2`               | `4`       |
| `twenty five times 4` | `100`     |
| `what is pi`          | `3.14159` |

### Understanding Results

- The **left column** shows your input lines.
- The **right column** shows computed results aligned to each line.
- If a line has no valid expression, no result appears for that line.
- Lines are evaluated independently; each line can be a completely separate calculation.

---

## 2. The Interface

LineSolv uses a frameless window with a custom title bar. The main layout is:

```
+--[ Window Controls ]--[ LineSolv Logo ]--[ Panel Buttons ]--+
|                                                              |
|  +-- Notes Sidebar --+  +-- Main Area --------------------+ |
|  |                   |  |  Line 1 Input     |  Result 1    | |
|  |  Note A           |  |  Line 2 Input     |  Result 2    | |
|  |  Note B (active)  |  |  Line 3 Input     |  Result 3    | |
|  |  Note C           |  |  Line 4 Input     |  Result 4    | |
|  |                   |  |  Line N Input     |  Result N    | |
|  |  [+ New Note]     |  |                   |              | |
|  +-------------------+  +-----------------------------------+ |
|                                                              |
|  +-- Bottom Panels (toggleable) ---------------------------+ |
|  |  History  |  Variables  |  Steps  |  Graph              | |
|  +---------------------------------------------------------+ |
+--------------------------------------------------------------+
```

### Panels

| Panel              | Toggle                             | Description                           |
| ------------------ | ---------------------------------- | ------------------------------------- |
| Notes Sidebar      | `Ctrl/Cmd + B`                     | Manage multiple calculation notebooks |
| Variables Explorer | `Ctrl/Cmd + I`                     | View and manage assigned variables    |
| History            | `Ctrl/Cmd + H`                     | Searchable list of past calculations  |
| Steps              | `Ctrl/Cmd + S`                     | Step-by-step evaluation breakdown     |
| Documentation      | `Ctrl/Cmd + J`                     | Built-in docs viewer                  |
| Plugin Marketplace | "..." menu in title bar            | Browse and install plugins            |
| Settings           | `Ctrl/Cmd + ``                     | General, Theme, Shortcuts, About      |
| Graph              | Auto-activates on plot expressions | Chart.js function plotting            |

> **Note:** Opening Docs or Plugins automatically closes the Notes panel, and vice versa (panel cross-closing).

---

## 3. Writing Expressions

LineSolv evaluates each line in the input area independently. You can mix numbers, operators, words, functions, units, and variables freely.

### Basic Arithmetic

Standard PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction):

| Operator | Meaning            | Example  | Result |
| -------- | ------------------ | -------- | ------ |
| `+`      | Addition           | `5 + 3`  | `8`    |
| `-`      | Subtraction        | `10 - 4` | `6`    |
| `*`      | Multiplication     | `7 * 3`  | `21`   |
| `/`      | Division           | `20 / 4` | `5`    |
| `^`      | Exponentiation     | `2 ^ 10` | `1024` |
| `%`      | Modulo (remainder) | `17 % 5` | `2`    |

Use parentheses to override precedence: `(2 + 3) * 4` = `20`.

### Natural Language

Type conversational phrases — they just work:

| Input                     | Result |
| ------------------------- | ------ |
| `one plus one`            | `2`    |
| `twenty five plus 3`      | `28`   |
| `what is 2+2`             | `4`    |
| `calculate 15% of 200`    | `30`   |
| `hello how much is 5 + 3` | `8`    |

You can use query prefixes (`what is`, `calculate`, `show me`, etc.) and conversational fillers (`hello`, `hey`, `ok`, `well`, etc.) — they are all ignored.

### Percentages

| Input                      | Result | Meaning               |
| -------------------------- | ------ | --------------------- |
| `50%`                      | `0.5`  | Percentage as decimal |
| `10% of 200`               | `20`   | 10% * 200             |
| `100 + 15%`                | `115`  | 100 + 15% of 100      |
| `200 - 10%`                | `180`  | 200 - 10% of 200      |
| `100 with 8% tax`          | `108`  | 100 + 8% of 100       |
| `200 after 10% discount`   | `180`  | 200 - 10% of 200      |
| `10 is what percent of 50` | `20%`  | Percentage question   |

### Unit Conversion

Convert between units using `in` or `to`:

| Input              | Result        |
| ------------------ | ------------- |
| `10 inches in cm`  | `25.4 cm`     |
| `1 kg in lb`       | `2.205 lb`    |
| `100 c to f`       | `212.0 °F`    |
| `1 gal in l`       | `3.785 l`     |
| `2h30m in minutes` | `150 minutes` |

### Currency

LineSolv supports 50+ currencies with live exchange rates:

| Input                       | Result    |
| --------------------------- | --------- |
| `$100 + €20`                | `$122.80` |
| `$20 in euro - 5% discount` | `€18.26`  |
| `£20 in usd`                | `$26.60`  |

Use currency symbols (`$`, `€`, `£`) or ISO codes (`USD`, `EUR`, `GBP`).

### Variables

Assign variables and reference them in later expressions:

| Input       | Result   |
| ----------- | -------- |
| `x = 42`    | `x = 42` |
| `x * 2`     | `84`     |
| `y = x + 8` | `y = 50` |

Variable names are case-insensitive. You can use any alphanumeric name (no spaces, must start with a letter).

### Context References

After evaluating an expression, reference the previous result:

| Input         | Result |
| ------------- | ------ |
| `42`          | `42`   |
| `of that * 2` | `84`   |
| `then + 10`   | `94`   |
| `result / 2`  | `47`   |

### Math Functions

All 40+ built-in functions:

| Category          | Functions                                             |
| ----------------- | ----------------------------------------------------- |
| **Trigonometry**  | `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`  |
| **Hyperbolic**    | `sinh`, `cosh`, `tanh`                                |
| **Logarithmic**   | `log`, `log2`, `log10`, `ln`, `exp`                   |
| **Roots & Power** | `sqrt`, `cbrt`, `pow`                                 |
| **Rounding**      | `round`, `ceil`, `floor`, `trunc`, `sign`             |
| **Absolute**      | `abs`                                                 |
| **Statistics**    | `avg`, `median`, `mode`, `stdev`, `variance`, `range` |
| **Aggregation**   | `sum`, `min`, `max`                                   |
| **Combinatorics** | `fact`/`factorial`, `gcd`, `lcm`, `ncr`/`choose`      |
| **Random**        | `rand`, `random`                                      |
| **Geometry**      | `hypot`/`pythag`/`hypotenuse`                         |
| **Utility**       | `fract`, `deg`, `rad`                                 |
| **Number Theory** | `isprime`/`is_prime`                                  |

### Constants

`pi` (π), `e`, `speed_of_light`, `gravity`, `planck`, `boltzmann`, `gas_constant`, `avogadro`, `stefan_boltzmann`, `electron_mass`, `proton_mass`, `neutron_mass`, `electron_charge`, `bohr_radius`, `rydberg`.

### Purchase Math

LineSolv handles shopping calculations with items, discounts, and tax:

| Input                                                              | Result    |
| ------------------------------------------------------------------ | --------- |
| `5 items at $20 each`                                              | `$100.00` |
| `5 items at $20 each with a 15% discount`                          | `$85.00`  |
| `5 items at $20 each with a 15% discount and 8% sales tax`         | `$91.80`  |
| `I bought 8 items at $5 each with a 10% discount and 6% sales tax` | `$40.76`  |

### Date Math

| Input               | Result                |
| ------------------- | --------------------- |
| `today + 14 days`   | Date 14 days from now |
| `today - 7 days`    | Date 7 days ago       |
| `March 1 + 30 days` | March 31              |
| `last month`        | Previous month        |
| `next week`         | Next week             |

### Age Calculation

| Input          | Result         |
| -------------- | -------------- |
| `born in 2007` | Age since 2007 |
| `born 1990`    | Age since 1990 |
| `40 years old` | `40`           |

### Graphing Functions

Type a graph expression and the Graph panel auto-activates:

| Input          | Description            |
| -------------- | ---------------------- |
| `plot x^2`     | Plot a parabola        |
| `graph sin(x)` | Plot a sine wave       |
| `y = 2*x + 3`  | Plot a linear equation |

Specify a range: `plot x^2 from -5 to 5`

---

## 4. Managing Notes

Notes are persistent calculation notebooks stored in a local SQLite database.

### Create a New Note

- Press `Ctrl/Cmd + N` or click the **+** button at the bottom of the notes sidebar.
- A new note with a randomly generated name is created and activated.

### Switch Notes

- Click any note name in the notes sidebar to switch to it.
- The input area and results update to show that note's content.

### Rename a Note

- Right-click a note in the sidebar and select **Rename**.
- Type the new name and press Enter.

### Delete a Note

- Right-click a note and select **Delete**.
- A confirmation dialog appears (unless "Don't ask again" is enabled in Settings).
- Deleted notes cannot be recovered.

### Export a Note

Right-click a note and choose an export format. Six formats are available:

| Format       | Extension | Description                                             |
| ------------ | --------- | ------------------------------------------------------- |
| **LineSolv** | `.lv`     | Raw input content only (default)                        |
| **Text**     | `.txt`    | Title, creation date, and content                       |
| **Markdown** | `.md`     | Formatted with heading and metadata                     |
| **JSON**     | `.json`   | Structured data with id, name, timestamps, content      |
| **TOML**     | `.toml`   | TOML-formatted metadata and content                     |
| **PDF**      | `.pdf`    | A4-formatted PDF with title, dates, content, and footer |

### Import a Note

- Click the import button in the notes sidebar.
- Select a `.json` file exported from LineSolv.

### Drag-and-Drop Reorder

Click and drag any note in the sidebar to reorder them. The new order is persisted to the database.

### Search Notes

- Press `Ctrl/Cmd + F` to focus the search input in the notes sidebar.
- Type to filter notes by name in real time.

### Folders

Notes can be organized into **hierarchical folders** using drag-and-drop.

- Right-click the notes sidebar to create a new folder.
- Folders use sequential naming: `New Folder`, `New Folder 2`, `New Folder 3`, etc.
- Drag notes into folders or reorder them within folders.
- Right-click a folder for options: New Note, New Subfolder, Rename, Change Icon, Move to..., Delete.

### Note Icons

Each note can have a custom icon (63 available). Right-click a note and select **Change Icon** to pick one. A random icon is assigned when a note is created.

---

## 5. Keyboard Shortcuts

### Navigation

| Shortcut                | Action               |
| ----------------------- | -------------------- |
| `Arrow Keys`            | Move cursor          |
| `Ctrl/Cmd + Left/Right` | Jump word left/right |
| `Home / End`            | Start/end of line    |
| `Ctrl/Cmd + Home/End`   | Start/end of text    |
| `Page Up / Page Down`   | Scroll page up/down  |

### Text Editing

| Shortcut                                 | Action                                |
| ---------------------------------------- | ------------------------------------- |
| `Ctrl/Cmd + Z`                           | Undo                                  |
| `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` | Redo                                  |
| `Ctrl/Cmd + X`                           | Cut                                   |
| `Ctrl/Cmd + C`                           | Copy                                  |
| `Ctrl/Cmd + V`                           | Paste                                 |
| `Ctrl/Cmd + A`                           | Select all                            |
| `Ctrl/Cmd + D`                           | Duplicate line or selection           |
| `Ctrl/Cmd + L`                           | Select current line                   |
| `Ctrl/Cmd + Shift + K`                   | Delete current line                   |
| `Alt + Shift`                            | Toggle case (lower -> UPPER -> Title) |
| `Alt + Up`                               | Move current line up                  |
| `Alt + Down`                             | Move current line down                |
| `Tab`                                    | Insert 2 spaces                       |

### App Actions

| Shortcut                 | Action                                  |
| ------------------------ | --------------------------------------- |
| `Shift + Enter`          | Force evaluate now                      |
| `Escape`                 | Close modal / clear input / close panel |
| `Ctrl/Cmd + B`           | Toggle notes sidebar                    |
| `Ctrl/Cmd + I`           | Toggle variables panel                  |
| `Ctrl/Cmd + H`           | Toggle history panel                    |
| `Ctrl/Cmd + S`           | Toggle step-by-step panel               |
| `Ctrl/Cmd + J`           | Open documentation                      |
| `Ctrl/Cmd + ``           | Open settings                           |
| `Ctrl/Cmd + K`           | Clear all (input, history, variables)   |
| `Ctrl/Cmd + N`           | Create new note                         |
| `?` or `Cmd + /`         | Show shortcuts reference                |
| `Ctrl/Cmd + Up`          | History: previous input                 |
| `Ctrl/Cmd + Down`        | History: next input                     |
| `Ctrl/Cmd + F`           | Search notes                            |
| `Ctrl/Cmd + P`           | Print current note                      |
| `Double-click title bar` | Toggle fullscreen/maximize              |

All shortcuts are customizable in **Settings > Keyboard Shortcuts**.

---

## 6. Printing

### How to Print

- Press `Ctrl/Cmd + P` or select **Print** from the `...` dropdown menu in the title bar.
- The system print dialog opens with the A4-formatted PDF.

### A4 Formatting

The print function generates A4-formatted output with:

- **20mm margins** on all sides
- **Auto page breaks** with 25mm bottom margin
- **Title** in 18pt bold Helvetica
- **Creation date** in 9pt gray
- **Body content** in 10pt Helvetica with 5.5mm line spacing
- **Footer** on every page: "Generated by LineSolv — Page X/Y"

---

## 7. Autocomplete

LineSolv includes a real-time autocomplete popup that suggests functions, constants, units, variables, plugins, and keywords as you type.

### How It Works

- The popup appears after typing 2+ characters and filters results in real time.
- **236+ keywords** across 6 categories: function, constant, unit, variable, plugin, keyword.
- Matching is prefix-based — type `sq` to see `sqrt`, `square`, `square root of`, etc.
- Navigate with `Arrow Up`/`Arrow Down`, select with `Enter`, dismiss with `Escape`.

### Toggling

Enable or disable autocomplete in **Settings > General > Autocomplete**.

---

## 8. Troubleshooting

See the [FAQ & Troubleshooting Guide](faq.md) for common issues including:

- App won't start on Linux (missing WebKit2GTK)
- Gatekeeper warning on macOS
- Currency rates not updating
- Graph not appearing
- Plugins not loading
- Notes not saving

For bug reports, visit the [GitHub Issues](https://github.com/rkriad585/LineSolv/issues) page.

---

## All Documentation

| Document                                          | Description                                                       |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| [User Guide](user-guide.md)                       | Beginner-friendly guide to using LineSolv                         |
| [Expression Reference](expression-reference.md)   | Complete expression syntax reference                              |
| [Interface Details](interface-details.md)         | Documentation viewer, plugin marketplace, settings, design tokens |
| [Screenshots](screenshots.md)                     | All screenshots of the LineSolv interface                         |
| [Getting Started](getting-started.md)             | Quick start for new users                                         |
| [Configuration](configuration.md)                 | Settings, config file options, and data storage                   |
| [FAQ & Troubleshooting](faq.md)                   | Frequently asked questions and common issues                      |
| [Architecture](architecture.md)                   | High-level architecture and component overview                    |
| [Frontend](frontend.md)                           | Frontend component structure and styling guide                    |
| [Plugin Development](plugins.md)                  | How to create and install plugins                                 |
| [Themes](themes.md)                               | Theme customization guide                                         |
| [Development](development.md)                     | Development setup, build, and code standards                      |
| [API Reference](api-reference.md)                 | Wails-bound Go method reference                                   |
| [Calculator Engine](calculator-engine.md)         | How the natural-language calculation engine works                 |
| [From Words to Numbers](from-words-to-numbers.md) | End-to-end pipeline walkthrough                                   |
| [Accessibility](../ACCESSIBILITY.md)              | WCAG 2.1 AA compliance and assistive technology support           |
| [Future Features](../extra/future.md)             | Planned features: AI, self-updater, image/voice, mobile           |
| [Examples](examples.txt)                          | Input examples                                                    |
| [Changelog](../CHANGELOG.md)                      | Version history                                                   |
| [Contributing](../CONTRIBUTING.md)                | Contribution guidelines                                           |
| [Security Policy](../SECURITY.md)                 | Security policy and vulnerability reporting                       |
| [Code of Conduct](../CODE_OF_CONDUCT.md)          | Community standards                                               |
| [License](../LICENSE)                             | MIT License                                                       |
