# LineSolv User Guide

A comprehensive guide to using LineSolv, the natural-language desktop calculator.

---

## 1. Getting Started

### First Open

When you launch LineSolv for the first time, you'll see a clean, dark-themed window with a single input area. There is no sign-up, no telemetry, and no internet connection required. Everything runs locally on your machine.

### Typing Your First Expression

Click the input area and start typing. Results appear in real-time as you type -- there is no "equals" button. Type anything from simple arithmetic to natural-language phrases:

| Input | Result |
|-------|--------|
| `2 + 2` | `4` |
| `twenty five times 4` | `100` |
| `what is pi` | `3.14159` |

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

| Panel | Toggle | Description |
|-------|--------|-------------|
| Notes Sidebar | `Ctrl/Cmd + B` | Manage multiple calculation notebooks |
| Variables Explorer | `Ctrl/Cmd + I` | View and manage assigned variables |
| History | `Ctrl/Cmd + H` | Searchable list of past calculations |
| Steps | `Ctrl/Cmd + S` | Step-by-step evaluation breakdown |
| Documentation | Docs button in title bar | Built-in docs viewer |
| Plugin Marketplace | Plugin button in title bar | Browse and install plugins |
| Settings | `Ctrl/Cmd + ,` | General, Theme, Shortcuts, About |
| Graph | Auto-activates on plot expressions | Chart.js function plotting |

---

## 3. Title Bar

The title bar is the top strip of the window. It contains:

### Window Controls (Left)

Three buttons on the far left:

| Button | Action |
|--------|--------|
| Minimize (`-`) | Minimize the window to the taskbar |
| Maximize (`square`) | Toggle between maximized and windowed |
| Close (`X`) | Quit the application (turns red on hover) |

### Drag Region (Center)

The center area with the LineSolv logo is the drag region. Click and hold to move the window anywhere on screen.

**Double-click** the title bar (not on a button) to toggle fullscreen/maximize.

### Panel Buttons (Right)

A row of icon buttons on the right side of the title bar:

| Button | Icon | Action | Shortcut |
|--------|------|--------|----------|
| Notes | Clipboard | Toggle notes sidebar | `Ctrl/Cmd + B` |
| Variables | Crosshair arrows | Toggle variable explorer | `Ctrl/Cmd + I` |
| History | Clock | Toggle history panel | `Ctrl/Cmd + H` |
| Steps | Pulse line | Toggle step-by-step panel | `Ctrl/Cmd + S` |
| Documentation | Document | Open documentation viewer | -- |
| Print | Printer | Print current note | `Ctrl/Cmd + P` |
| Plugins | Puzzle piece | Open plugin marketplace | -- |
| Settings | Gear | Open settings | `Ctrl/Cmd + ,` |

All buttons have `aria-label` attributes for screen reader accessibility and respond to hover with a subtle background highlight.

---

## 4. Documentation Viewer

The built-in documentation viewer opens as a full-screen overlay with a sidebar and content area.

### Opening

- Click the **Documentation** button (document icon) in the title bar.
- The viewer opens with the User Guide selected by default.

### Layout

```
+--[ Documentation ]----------------------------------[ X ]--+
|  +-- Sidebar Tabs --+  +-- Rendered Content ----------+   |
|  | User Guide       |  |                               |   |
|  | FAQ              |  |  # Heading                    |   |
|  | Architecture     |  |  Body text with **bold** and  |   |
|  | Frontend         |  |  *italic* formatting.         |   |
|  | Plugin Dev       |  |                               |   |
|  | API Reference    |  |  ``` code blocks ```           |   |
|  | ...              |  |                               |   |
|  +------------------+  +-------------------------------+   |
+------------------------------------------------------------+
```

### Sidebar Tabs

Each tab represents a `.md` file from the `docs/` folder. Tab names are auto-generated from filenames:

- `user-guide.md` becomes **User Guide**
- `api-reference.md` becomes **Api Reference**
- `faq.md` becomes **Faq**

### Rendered Markdown

The viewer includes a custom Markdown renderer supporting:

- **Headings** (`# H1` through `###### H6`)
- **Bold** (`**text**`) and *italic* (`*text*`)
- `Inline code` (backtick-wrapped)
- **Code blocks** (triple-backtick fenced, with Copy button)
- **Tables** (pipe-delimited rows)
- **Lists** (unordered with `-`, ordered with `1.`)
- **Blockquotes** (`> text`)
- **Horizontal rules** (`---`)
- **Links** (`[text](url)`) -- open in external browser
- **Images** (`![alt](url)`)

### Offline and Caching

- All documentation is loaded from the local `docs/` folder bundled with the app.
- Once a document is loaded, it is cached in memory for the session.
- No internet connection is needed to browse docs.
- Closing and reopening the viewer re-fetches from disk (fresh content if files changed).

### Closing

- Press **Escape** or click the **X** button in the header.
- Double-click the header to toggle window maximize.

---

## 5. Plugin Marketplace

The Plugin Marketplace lets you browse, install, enable, disable, and remove plugins -- all from within the app.

### Opening

- Click the **Plugins** button (puzzle piece icon) in the title bar.
- The marketplace opens as a full-screen overlay.

### Browsing Plugins

The marketplace fetches a plugin index from the remote repository (`linesolv-plugins` on GitHub) and displays them as a searchable card grid.

```
+--[ Plugins ]--------[ Search... ]--[ Refresh ]--[ X ]--+
|                                                         |
|  +-- Plugin Card 1 ---+  +-- Plugin Card 2 ---------+ |
|  | Finance Plugin     |  | Statistics Plugin        | |
|  | v1.0 by author    |  | v1.2 by author           | |
|  | description...     |  | description...           | |
|  | [ Install ]        |  | [ Installed ] [ Remove ] | |
|  +--------------------+  +--------------------------+ |
|                                                         |
|  +-- Plugin Card 3 ---------+  +-- Plugin Card 4 ---+ |
|  | Geometry Plugin          |  | Physics Plugin     | |
|  | v1.1 by author          |  | v1.0 by author     | |
|  | 4 functions  2 variables |  | 6 functions        | |
|  | [=== Toggle ===]        |  | [=== Toggle ===]   | |
|  +-------------------------+  +--------------------+ |
+--------------------------------------------------------+
```

### Search

Type in the search bar to filter plugins by name, description, author, or tags. Results update in real-time as you type.

### Plugin Actions

| Action | Button | Description |
|--------|--------|-------------|
| **Install** | Blue "Install" button | Downloads and installs the plugin from the repository |
| **Update** | Blue "Update" button | Replaces the installed version with the latest (shown when remote version > local) |
| **Remove** | Red-outlined "Remove" button | Deletes the plugin from your system (with confirmation dialog) |
| **Enable/Disable** | Toggle switch | Turns plugin on/off without removing it (persisted to `state.json`) |

### Plugin Details

Click any plugin card to open its detail view, which shows:

- **Hero section**: Name, version, author, description, homepage link, tags
- **Functions table**: Each function's name, description, argument count, and type (expression or builtin)
- **Examples**: Copyable example expressions for each function
- **Variables table**: Custom constants provided by the plugin
- **Themes**: Theme cards with color swatches
- **README**: Rendered Markdown documentation (with code blocks that have a Copy button)

Press **Escape** or the **Back** arrow to return to the grid view.

---

## 6. Writing Expressions

LineSolv evaluates each line in the input area independently. You can mix numbers, operators, words, functions, units, and variables freely.

### Basic Arithmetic

Standard PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction) with six operators:

| Operator | Meaning | Example | Result |
|----------|---------|---------|--------|
| `+` | Addition | `5 + 3` | `8` |
| `-` | Subtraction | `10 - 4` | `6` |
| `*` | Multiplication | `7 * 3` | `21` |
| `/` | Division | `20 / 4` | `5` |
| `^` | Exponentiation | `2 ^ 10` | `1024` |
| `%` | Modulo (remainder) | `17 % 5` | `2` |
| `×` | Multiplication (symbol) | `5 × 3` | `15` |
| `÷` | Division (symbol) | `10 ÷ 2` | `5` |

Operator precedence: `^` > `*` `/` `%` > `+` `-`. Use parentheses to override.

| Input | Result | Note |
|-------|--------|------|
| `2 + 3 * 4` | `14` | Multiplication first |
| `(2 + 3) * 4` | `20` | Parentheses override |
| `2^3^2` | `512` | Right-associative: 2^(3^2) |

### Natural Language

LineSolv understands conversational English. You can prefix expressions with question words, imperative verbs, or conversational fillers -- they are all stripped before evaluation.

#### Word Numbers

Spell out numbers up to the millions:

| Input | Result |
|-------|--------|
| `one plus one` | `2` |
| `twenty five plus 3` | `28` |
| `one hundred` | `100` |
| `twenty five hundred` | `25000` |
| `twenty five times pi` | `78.5398` |

#### Query Prefixes

These leading phrases are ignored:

| Prefix | Example |
|--------|---------|
| `what is` | `what is 2+2` |
| `what does` | `what does 10*5 equal` |
| `calculate` | `calculate 15% of 200` |
| `can you calculate` | `can you calculate 2+2` |
| `could you find` | `could you find 5*3` |
| `determine` | `determine 2^10` |
| `do you know` | `do you know 5+3` |
| `figure out` | `figure out 10 * 5` |
| `find the value of` | `find the value of 2 times 3 plus 4` |
| `give me` | `give me 3 + 7` |
| `show me` | `show me 5 + 3` |
| `tell me` | `tell me 10 + 20` |
| `work out` | `work out 2 + 3` |
| `would you solve` | `would you solve 10+5` |

#### Conversational Fillers

These leading words/phrases are also stripped:

`hello`, `hey`, `hi`, `alright`, `approximately`, `about`, `exactly`, `i guess`, `i think`, `i want`, `i would like`, `i'd like`, `i need to add`, `let's calculate`, `lets`, `like`, `maybe`, `now`, `ok`, `okay`, `perhaps`, `probably`, `right`, `roughly`, `say`, `so`, `well`, `we need`, `we want`, `will you compute`

Examples:

| Input | Result |
|-------|--------|
| `hello how much is 5 + 3` | `8` |
| `hey there calculate 6 times 7` | `42` |
| `ok 5+3` | `8` |
| `well 2+2` | `4` |

#### Fraction Words

| Input | Result |
|-------|--------|
| `one half` | `0.5` |
| `one third` | `0.3333` |
| `two thirds` | `0.6667` |
| `one quarter` | `0.25` |
| `three quarters` | `0.75` |

#### Scale / Multiplicative Words

| Input | Result | Meaning |
|-------|--------|---------|
| `double 5` | `10` | 5 * 2 |
| `twice 10` | `20` | 10 * 2 |
| `triple 3` | `9` | 3 * 3 |
| `half of 20` | `10` | 20 / 2 |
| `quarter of 100` | `25` | 100 / 4 |
| `half a dozen` | `6` | 12 / 2 |
| `half a couple` | `1` | 2 / 2 |
| `half a million` | `500000` | 1000000 / 2 |
| `half as many as 20` | `10` | 20 / 2 |
| `half as much as 100` | `50` | 100 / 2 |
| `quarter as many as 40` | `10` | 40 / 4 |
| `quarter as much as 20` | `5` | 20 / 4 |

#### Power Words

| Input | Result | Meaning |
|-------|--------|---------|
| `5 squared` | `25` | 5^2 |
| `3 cubed` | `27` | 3^3 |
| `cube 3` | `27` | 3^3 |
| `square 5` | `25` | 5^2 |
| `square root of 144` | `12` | sqrt(144) |
| `cube root of 27` | `3` | cbrt(27) |
| `the square root of 144` | `12` | sqrt(144) |
| `the cube root of 27` | `3` | cbrt(27) |
| `2 to the power of 3` | `8` | 2^3 |
| `5 exponent 3` | `125` | 5^3 |
| `5 to the 3` | `125` | 5^3 |

#### Comparison Phrases

| Input | Result | Meaning |
|-------|--------|---------|
| `which is bigger 5 or 6` | `6` | max(5, 6) |
| `which is smaller 10 or 8` | `8` | min(10, 8) |
| `which is larger pi or 5` | `5` | max(pi, 5) |
| `10 increased by 5` | `15` | 10 + 5 |
| `20 decreased by 7` | `13` | 20 - 7 |
| `5 more than 10` | `15` | 10 + 5 |
| `3 less than 8` | `5` | 8 - 3 |
| `difference between 10 and 3` | `7` | 10 - 3 |
| `5 added to 10` | `15` | 10 + 5 |
| `8 fewer 3` | `5` | 8 - 3 |
| `5 subtract 3` | `2` | 5 - 3 |
| `10 minus 3` | `7` | 10 - 3 |

#### Division Phrases

| Input | Result | Meaning |
|-------|--------|---------|
| `10 over 2` | `5` | 10 / 2 |
| `9 out of 3` | `3` | 9 / 3 |
| `ratio of 10 to 2` | `5` | 10 / 2 |
| `10 divided by 5` | `2` | 10 / 5 |
| `3 into 15` | `5` | 15 / 3 |
| `10 split among 2` | `5` | 10 / 2 |
| `10 split between 2` | `5` | 10 / 2 |
| `12 shared among 3` | `4` | 12 / 3 |
| `12 shared between 3` | `4` | 12 / 3 |

#### Multiplication Phrases

| Input | Result | Meaning |
|-------|--------|---------|
| `product of 4 and 3` | `12` | 4 * 3 |
| `sum of 10 and 5` | `15` | 10 + 5 |
| `5 lots of 3` | `15` | 5 * 3 |
| `5 times 4` | `20` | 5 * 4 |
| `3 times as much as 5` | `15` | 3 * 5 |
| `3 times more than 5` | `20` | 5 + 3*5 |
| `2 times as many as 10` | `20` | 2 * 10 |
| `2 times more than 10` | `30` | 10 + 2*10 |
| `10 times more than 3` | `33` | 3 + 10*3 |
| `5 along with 3` | `8` | 5 + 3 |
| `5 combined with 3` | `8` | 5 + 3 |
| `5 together with 3` | `8` | 5 + 3 |
| `5 without 3` | `2` | 5 - 3 |

#### Natural Function Calls

You can call functions using natural language:

| Input | Result |
|-------|--------|
| `sine of 0` | `0` |
| `cosine of 0` | `1` |
| `tangent of 0` | `0` |
| `absolute value of -5` | `5` |
| `the absolute value of -5` | `5` |
| `natural log of 100` | `4.6052` |
| `ln of 100` | `4.6052` |
| `log of 100` | `2` |

#### Currency Conversion

LineSolv supports 50+ currencies with live exchange rates. Use currency symbols or ISO codes:

| Symbol/Code | Currency | Symbol/Code | Currency |
|-------------|----------|-------------|----------|
| `$` / `USD` | US Dollar | `EUR` / `euro` / `euros` | Euro |
| `GBP` / `sterling` | British Pound | `JPY` / `yen` | Japanese Yen |
| `CNY` / `yuan` | Chinese Yuan | `INR` / `rupee` / `rupees` | Indian Rupee |
| `CAD` | Canadian Dollar | `AUD` | Australian Dollar |
| `CHF` | Swiss Franc | `KRW` / `won` | South Korean Won |
| `RUB` / `ruble` / `rubles` | Russian Ruble | `ILS` / `shekel` / `shekels` | Israeli Shekel |
| `VND` / `dong` | Vietnamese Dong | `PHP` / `peso` / `pesos` | Philippine Peso |
| `UAH` / `hryvnia` | Ukrainian Hryvnia | `KZT` / `tenge` | Kazakh Tenge |
| `PYG` / `guarani` | Paraguayan Guarani | `GHS` / `cedi` | Ghanaian Cedi |
| `TRY` / `lira` | Turkish Lira | `AZN` / `manat` | Azerbaijani Manat |
| `GEL` / `lari` | Georgian Lari | `BTC` / `bitcoin` | Bitcoin |
| `THB` / `baht` | Thai Baht | `HKD` | Hong Kong Dollar |
| `SGD` | Singapore Dollar | `MXN` | Mexican Peso |
| `ZAR` / `rand` | South African Rand | `NZD` | New Zealand Dollar |
| `SEK` / `krona` | Swedish Krona | `NOK` | Norwegian Krone |
| `PLN` / `zloty` | Polish Zloty | `BRL` | Brazilian Real |
| `BDT` / `taka` | Bangladeshi Taka | `PKR` | Pakistani Rupee |
| `LKR` | Sri Lankan Rupee | `NPR` | Nepalese Rupee |
| `MYR` / `ringgit` | Malaysian Ringgit | `IDR` / `rupiah` | Indonesian Rupiah |
| `TWD` / `ntd` | Taiwan Dollar | `SAR` / `riyal` | Saudi Riyal |
| `AED` / `dirham` | UAE Dirham | `KWD` / `dinar` | Kuwaiti Dinar |
| `EGP` | Egyptian Pound | `NGN` / `naira` | Nigerian Naira |
| `COP` | Colombian Peso | `CLP` | Chilean Peso |
| `ARS` | Argentine Peso | `PEN` / `sol` | Peruvian Sol |
| `MAD` | Moroccan Dirham | `XAU` / `gold` | Gold (troy oz) |
| `XAG` / `silver` | Silver (troy oz) | | |

Currency examples:

| Input | Result |
|-------|--------|
| `$100 + €20` | `$122.80` |
| `$20 in euro - 5% discount` | `€18.26` |
| `€5` | `$5.70` |
| `£20 in usd` | `$26.60` |
| `$1.5` | `$1.50` |

#### Ordinal Suffixes

Ordinal suffixes are stripped to the base number:

| Input | Result |
|-------|--------|
| `1st` | `1` |
| `2nd` | `2` |
| `3rd` | `3` |
| `4th` | `4` |
| `1st + 2` | `3` |

#### SI Notation

Suffixes `k` (thousand), `M` (million), and `B` (billion):

| Input | Result |
|-------|--------|
| `5k` | `5000` |
| `1.5K` | `1500` |
| `3M` | `3000000` |
| `2B` | `2000000000` |
| `2B / 5k` | `400000` |

#### Date Math

| Input | Result |
|-------|--------|
| `today + 14 days` | Date 14 days from now |
| `today - 7 days` | Date 7 days ago |
| `March 1 + 30 days` | March 31 |
| `last month` | Previous month |
| `next week` | Next week |
| `2 weeks from now` | Date 14 days from now |
| `3 months ago` | Date 3 months ago |

Trailing text after the date expression is ignored:

| Input | Result |
|-------|--------|
| `I completing a book at today + 14 days some story` | Date 14 days from now |

#### Time / Duration

Use compact time notation with `h`, `m`, `s` suffixes:

| Input | Result |
|-------|--------|
| `2h30m` | `9000` (seconds) |
| `2h30m in minutes` | `150 minutes` |
| `2h + 1h15m` | `12600` (seconds) |

#### Mixed Numbers

Combine whole numbers and fractions:

| Input | Result |
|-------|--------|
| `2 1/2` | `2.5` |
| `3 3/4` | `3.75` |
| `2 1/2 + 1.5` | `4` |
| `3/4` | `0.75` |
| `3/4 + 1/4` | `1` |

#### Possessive Plurals

Multiply a number by a collective noun value:

| Input | Result | Meaning |
|-------|--------|---------|
| `3 tens` | `30` | 3 * 10 |
| `2 hundreds` | `200` | 2 * 100 |
| `5 thousands` | `5000` | 5 * 1000 |
| `2 dozens` | `24` | 2 * 12 |
| `3 scores` | `60` | 3 * 20 |

#### Collective Nouns

| Input | Result | Value |
|-------|--------|-------|
| `a couple` | `2` | 2 |
| `a dozen` | `12` | 12 |
| `a score` | `20` | 20 |

Combined with scale words:

| Input | Result |
|-------|--------|
| `half a dozen` | `6` |
| `half a couple` | `1` |
| `double a dozen` | `24` |

#### Subtraction with "from"

| Input | Result | Meaning |
|-------|--------|---------|
| `10 from 100` | `90` | 100 - 10 |
| `5 from 20` | `15` | 20 - 5 |

#### Percentage Relationship Questions

| Input | Result |
|-------|--------|
| `10 is what percent of 50` | `20%` |
| `10 is what % of 50` | `20%` |
| `what percent of 50 is 10` | `20%` |
| `what percentage of 80 is 20` | `25%` |
| `10 as a percentage of 50` | `20%` |
| `50% of what is 25` | `50` |
| `50 percent of what is 25` | `50` |
| `10 out of 50 as a percent` | `20%` |
| `10 out of 50 as a percentage` | `20%` |

#### Factorial Operator

| Input | Result |
|-------|--------|
| `5!` | `120` |
| `0!` | `1` |
| `3! + 2` | `8` |

#### Log Base

| Input | Result |
|-------|--------|
| `log base 2 of 8` | `3` |
| `log base 10 of 100` | `2` |
| `log base 10 of 100 + 3 squared` | `11` |

#### Combinations

| Input | Result |
|-------|--------|
| `5 choose 3` | `10` |
| `10 choose 2` | `45` |
| `5 choose 2 + 3!` | `16` |

#### How Many Times

Asks how many times one number fits into another:

| Input | Result |
|-------|--------|
| `how many times does 5 go into 20` | `4` |
| `how many times does 3 go in 15` | `5` |
| `how many times does 25 go into 5k` | `200` |
| `how many times does 2 go into 1M` | `500000` |
| `how many 3 are in 15` | `5` |
| `how many 5 in 20` | `4` |

### Geometry

| Input | Result |
|-------|--------|
| `area of triangle with base 5 and height 10` | `25` |
| `volume of cone radius 3 and height 5` | `47.1239` |

### Age Calculation

| Input | Result |
|-------|--------|
| `born in 2007` | Age since 2007 |
| `born 1990` | Age since 1990 |
| `what is my age` | Current age |
| `what is my current age` | Current age |
| `i am 25 years old` | `25` |
| `i am twenty five years old` | `25` |
| `i am born in 2007 show me my current age` | Current age |
| `my age is 30` | `30` |
| `25 yrs of age` | `25` |
| `40 years old` | `40` |

### Purchase Math

LineSolv handles shopping calculations with items, discounts, and tax.

#### Basic

| Input | Result |
|-------|--------|
| `5 items at $20 each` | `$100.00` |

#### With Discount

| Input | Result |
|-------|--------|
| `5 items at $20 each with a 15% discount` | `$85.00` |

#### With Discount and Tax

| Input | Result |
|-------|--------|
| `5 items at $20 each with a 15% discount and 8% sales tax` | `$91.80` |

#### Natural Language

| Input | Result |
|-------|--------|
| `what is the total cost of 5 items at $20 each with a 15% discount and 8% sales tax added on top` | Calculation result |
| `I bought 8 items at $5 each with a 10% discount and 6% sales tax. What's the final price?` | `$40.76` |
| `I got 25 hours of freelance work at $37 per hour. What did I earn?` | `$925.00` |
| `That $200 jacket I've been eyeing is 25% off. What's the sale price?` | `$150.00` |

### Putting It All Together

Mix multiple patterns in a single expression:

| Input | Result |
|-------|--------|
| `$100 + €20` | `$122.80` |
| `2B / 5k` | `400000` |
| `a dozen + 3 scores` | `72` |
| `how many times does 25 go into 5k` | `200` |
| `5 choose 2 + 3!` | `16` |
| `log base 10 of 100 + 3 squared` | `11` |
| `double a dozen` | `24` |
| `3 tens from 5 hundreds` | `470` |
| `2h30m in minutes` | `150 minutes` |
| `10 inches in cm` | `25.4 cm` |

### Unit Conversion

Convert between units using `in` or `to`:

| Input | Result |
|-------|--------|
| `10 inches in cm` | `25.4 cm` |
| `1 kg in lb` | `2.205 lb` |
| `100 c to f` | `212.0 °F` |
| `1 gal in l` | `3.785 l` |
| `convert 10 inches to cm` | `25.4 cm` |
| `convert 100 km to miles` | `62.14 mi` |
| `change 100 c to f` | `212.0 °F` |

#### Complete Unit Table

| Category | Units | Aliases |
|----------|-------|---------|
| **Length** | mm, cm, m, km, in, ft, yd, mi | millimeter(s), centimeter(s), meter(s), kilometer(s), inch(es), foot/feet, yard(s), mile(s) |
| **Mass** | g, kg, lb, oz | gram(s), kilogram(s), pound(s), ounce(s) |
| **Volume** | ml, l, gal, qt, cup | milliliter(s), liter(s), gallon(s), quart(s), cups |
| **Temperature** | c, f | celsius, fahrenheit |
| **Time** | s, min, h, day | second(s), minute(s), hour(s), day(s) |

### Percentages

| Input | Result | Meaning |
|-------|--------|---------|
| `50%` | `0.5` | Percentage as decimal |
| `10% of 200` | `20` | 10% * 200 |
| `100 + 15%` | `115` | 100 + 15% of 100 |
| `200 - 10%` | `180` | 200 - 10% of 200 |
| `10% less than 200` | `180` | 200 - 10% of 200 |
| `20% more than 100` | `120` | 100 + 20% of 100 |
| `100 with 8% tax` | `108` | 100 + 8% of 100 |
| `200 after 10% discount` | `180` | 200 - 10% of 200 |
| `200 minus 10% discount` | `180` | 200 - 10% of 200 |
| `40 plus 15% tip` | `46` | 40 + 15% of 40 |
| `how much is one hundred plus fifty percent` | `150` | 100 + 50% of 100 |
| `10 per cent of 200` | `20` | Alternative phrasing |
| `10 pct of 200` | `20` | Abbreviated phrasing |
| `50 p.c. of 80` | `40` | Dotted abbreviation |

### Variables

Assign variables and reference them in later expressions:

| Input | Result |
|-------|--------|
| `x = 42` | `x = 42` |
| `x * 2` | `84` |
| `y = x + 8` | `y = 50` |
| `y / 2` | `25` |
| `x * pi` | `131.947` |

Variable names are case-insensitive. You can use any alphanumeric name (no spaces, must start with a letter).

### Context References

After evaluating an expression, you can reference the result:

| Input | Result |
|-------|--------|
| `42` | `42` |
| `of that * 2` | `84` |
| `then + 10` | `94` |
| `result / 2` | `47` |

Special context keywords:

| Keyword | Meaning |
|---------|---------|
| `of that` | Previous result |
| `then` | Previous result |
| `result` | Previous result |
| `that` | Previous result |
| `last` | Previous result |
| `last result` | Previous result |
| `previous` | Previous result |
| `previous result` | Previous result |
| `prior` | Previous result |
| `prior result` | Previous result |
| `last answer` | Previous result |

### Math Functions

All 40+ built-in functions:

| Category | Function | Args | Description | Example | Result |
|----------|----------|------|-------------|---------|--------|
| **Trigonometry** | `sin(x)` | 1 | Sine (radians) | `sin(pi/4)` | `0.7071` |
| | `cos(x)` | 1 | Cosine (radians) | `cos(0)` | `1` |
| | `tan(x)` | 1 | Tangent (radians) | `tan(0)` | `0` |
| | `asin(x)` | 1 | Arcsine (radians) | `asin(1)` | `1.5708` |
| | `acos(x)` | 1 | Arccosine (radians) | `acos(1)` | `0` |
| | `atan(x)` | 1 | Arctangent (radians) | `atan(0)` | `0` |
| | `atan2(y, x)` | 2 | 2-argument arctangent | `atan2(1, 1)` | `0.7854` |
| **Hyperbolic** | `sinh(x)` | 1 | Hyperbolic sine | `sinh(0)` | `0` |
| | `cosh(x)` | 1 | Hyperbolic cosine | `cosh(0)` | `1` |
| | `tanh(x)` | 1 | Hyperbolic tangent | `tanh(0)` | `0` |
| **Logarithmic** | `log(x)` / `ln(x)` | 1 | Natural logarithm | `ln(100)` | `4.6052` |
| | `log2(x)` | 1 | Base-2 logarithm | `log2(8)` | `3` |
| | `log10(x)` | 1 | Base-10 logarithm | `log10(100)` | `2` |
| | `exp(x)` | 1 | e^x | `exp(1)` | `2.7183` |
| **Roots & Power** | `sqrt(x)` | 1 | Square root | `sqrt(144)` | `12` |
| | `cbrt(x)` | 1 | Cube root | `cbrt(27)` | `3` |
| | `pow(a, b)` | 2 | a raised to b | `pow(2, 3)` | `8` |
| **Rounding** | `round(x)` | 1 | Round to nearest integer | `round(3.7)` | `4` |
| | `ceil(x)` | 1 | Round up | `ceil(3.2)` | `4` |
| | `floor(x)` | 1 | Round down | `floor(3.7)` | `3` |
| | `trunc(x)` | 1 | Truncate decimal | `trunc(3.7)` | `3` |
| | `sign(x)` / `sgn(x)` | 1 | Sign: -1, 0, or 1 | `sign(-3)` | `-1` |
| **Absolute** | `abs(x)` | 1 | Absolute value | `abs(-5)` | `5` |
| **Statistics** | `avg(n, ...)` | 1+ | Arithmetic mean | `avg(1, 2, 3)` | `2` |
| | `median(n, ...)` | 1+ | Median value | `median(1, 2, 3)` | `2` |
| | `mode(n, ...)` | 1+ | Most frequent value | `mode(1, 1, 2)` | `1` |
| | `stdev(n, ...)` / `stddev(n, ...)` | 2+ | Population standard deviation | `stdev(10, 20, 30)` | `8.1650` |
| | `variance(n, ...)` / `var(n, ...)` | 2+ | Population variance | `variance(10, 20, 30)` | `66.6667` |
| | `range(n, ...)` | 1+ | max minus min | `range(1, 5, 3)` | `4` |
| **Aggregation** | `sum(n, ...)` | 1+ | Sum of all arguments | `sum(1, 2, 3)` | `6` |
| | `min(n, ...)` | 1+ | Smallest value | `min(1, 2, 3)` | `1` |
| | `max(n, ...)` | 1+ | Largest value | `max(1, 2, 3)` | `3` |
| **Combinatorics** | `fact(x)` / `factorial(x)` | 1 | Factorial (max 20) | `fact(5)` | `120` |
| | `gcd(a, b)` | 2 | Greatest common divisor | `gcd(12, 8)` | `4` |
| | `lcm(a, b)` | 2 | Least common multiple | `lcm(4, 6)` | `12` |
| | `ncr(n, r)` / `choose(n, r)` | 2 | Combinations (n choose r) | `ncr(5, 3)` | `10` |
| **Random** | `rand()` | 0-2 | Random number (0-1, 0-max, or min-max) | `rand()` | `0.7234` |
| | `random(x)` | 0-2 | Alias for rand | `random(10)` | `7.2341` |
| **Geometry** | `hypot(a, b)` / `pythag(a, b)` / `hypotenuse(a, b)` | 2 | sqrt(a^2 + b^2) | `hypot(3, 4)` | `5` |
| **Utility** | `fract(x)` | 1 | Fractional part | `fract(3.7)` | `0.7` |
| | `deg(x)` | 1 | Radians to degrees | `deg(pi)` | `180` |
| | `rad(x)` | 1 | Degrees to radians | `rad(180)` | `3.1416` |
| **Number Theory** | `isprime(x)` / `is_prime(x)` | 1 | 1 if prime, 0 otherwise | `isprime(7)` | `1` |

### Constants

| Constant | Aliases | Value |
|----------|---------|-------|
| `pi` | `π` | 3.141592653589793 |
| `e` | | 2.718281828459045 |
| `speed_of_light` | `lightspeed`, `c_light` | 299792458 |
| `gravity` | `g_force` | 9.80665 |
| `planck` | `planck_constant` | 6.62607015e-34 |
| `boltzmann` | `boltzmann_constant` | 1.380649e-23 |
| `gas_constant` | `gasconstant` | 8.314462618 |
| `avogadro` | `avogadro_constant` | 6.02214076e23 |
| `stefan_boltzmann` | `stefanboltzmann` | 5.670367e-8 |
| `electron_mass` | `me` | 9.10938356e-31 |
| `proton_mass` | `mp` | 1.67262192369e-27 |
| `neutron_mass` | `mn` | 1.67492749804e-27 |
| `electron_charge` | `e_charge` | 1.602176634e-19 |
| `bohr_radius` | `bohrradius` | 5.29177210903e-11 |
| `rydberg` | `rydberg_constant` | 10973731.568160 |

---

## 7. Managing Notes

Notes are persistent calculation notebooks stored in a local SQLite database.

### Create a New Note

- Press `Ctrl/Cmd + N` or click the **+** button at the bottom of the notes sidebar.
- A new note with a randomly generated name is created and activated.
- The input area is cleared for the new note.

### Switch Notes

- Click any note name in the notes sidebar to switch to it.
- The input area and results update to show that note's content.
- A dirty-state indicator (accent-colored dot) appears next to the note name if there are unsaved changes.

### Rename a Note

- Right-click a note in the sidebar and select **Rename**.
- Type the new name and press Enter.

### Delete a Note

- Right-click a note and select **Delete**.
- A confirmation dialog appears (unless "Don't ask again" is enabled in Settings).
- Deleted notes cannot be recovered.

### Export a Note

Right-click a note and choose an export format. Six formats are available:

| Format | Extension | Description |
|--------|-----------|-------------|
| **LineSolv** | `.lv` | Raw input content only (default) |
| **Text** | `.txt` | Title, creation date, and content |
| **Markdown** | `.md` | Formatted with heading and metadata |
| **JSON** | `.json` | Structured data with id, name, timestamps, content |
| **TOML** | `.toml` | TOML-formatted metadata and content |
| **PDF** | `.pdf` | A4-formatted PDF with title, dates, content, and footer |

The PDF export uses A4 page size with 20mm margins, auto page breaks, and a "Generated by LineSolv" footer with page numbers.

### Import a Note

- Click the import button in the notes sidebar.
- Select a `.json` file exported from LineSolv.
- The note is added to your notes list with its original name and content.

### Share Notes

Export a note as `.json`, `.md`, or `.txt` and share the file with others. The `.json` format preserves all metadata and can be re-imported into any LineSolv installation.

### Drag-and-Drop Reorder

Click and drag any note in the sidebar to reorder them. The new order is persisted to the database.

### Search Notes

- Press `Ctrl/Cmd + F` to focus the search input in the notes sidebar.
- Type to filter notes by name in real time.
- Click a note in the filtered results to switch to it.

---

## 8. Keyboard Shortcuts

### Navigation

| Shortcut | Action |
|----------|--------|
| `Arrow Keys` | Move cursor |
| `Ctrl/Cmd + Left/Right` | Jump word left/right |
| `Home / End` | Start/end of line |
| `Ctrl/Cmd + Home/End` | Start/end of text |
| `Page Up / Page Down` | Scroll page up/down |

### Text Editing

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + X` | Cut |
| `Ctrl/Cmd + C` | Copy |
| `Ctrl/Cmd + V` | Paste |
| `Ctrl/Cmd + A` | Select all |
| `Ctrl/Cmd + D` | Duplicate line or selection |
| `Ctrl/Cmd + L` | Select current line |
| `Ctrl/Cmd + Shift + K` | Delete current line |
| `Alt + Shift` | Toggle case (lower -> UPPER -> Title) |
| `Alt + Up` | Move current line up |
| `Alt + Down` | Move current line down |
| `Tab` | Insert 2 spaces |

### App Actions

| Shortcut | Action |
|----------|--------|
| `Shift + Enter` | Force evaluate now |
| `Escape` | Close modal / clear input / close panel |
| `Ctrl/Cmd + B` | Toggle notes sidebar |
| `Ctrl/Cmd + I` | Toggle variables panel |
| `Ctrl/Cmd + H` | Toggle history panel |
| `Ctrl/Cmd + S` | Toggle step-by-step panel |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + K` | Clear all (input, history, variables) |
| `Ctrl/Cmd + N` | Create new note |
| `?` or `Cmd + /` | Show shortcuts reference |
| `Ctrl/Cmd + Up` | History: previous input |
| `Ctrl/Cmd + Down` | History: next input |
| `Ctrl/Cmd + F` | Search notes |
| `Ctrl/Cmd + P` | Print current note |
| `Double-click title bar` | Toggle fullscreen/maximize |

All shortcuts are customizable in **Settings > Keyboard Shortcuts**. Click a key binding or its edit button, then press your desired key combination.

---

## 9. Printing

### A4 Formatting

The print function generates A4-formatted output with:

- **20mm margins** on all sides
- **Auto page breaks** with 25mm bottom margin
- **Title** in 18pt bold Helvetica
- **Creation date** in 9pt gray
- **Horizontal separator** between header and content
- **Body content** in 10pt Helvetica with 5.5mm line spacing
- **Footer** on every page: "Generated by LineSolv -- Page X/Y"

### How to Print

- Press `Ctrl/Cmd + P` or click the **Print** button (printer icon) in the title bar.
- The system print dialog opens with the A4-formatted PDF.

### Watermark

Each printed page includes a subtle footer watermark:

```
Generated by LineSolv — Page 1/3
```

### Date

The printout includes the note's creation date and, if applicable, the last updated timestamp.

---

## 10. Graphing Functions

LineSolv can plot mathematical functions using Chart.js.

### Plotting a Function

Type a graph expression and the Graph panel auto-activates:

| Input | Description |
|-------|-------------|
| `plot x^2` | Plot a parabola |
| `graph sin(x)` | Plot a sine wave |
| `y = 2*x + 3` | Plot a linear equation |

### Custom Ranges

Specify a range with `from N to N`:

| Input | Range |
|-------|-------|
| `plot x^2 from -5 to 5` | x from -5 to 5 |
| `graph sin(x) from 0 to 6.2832` | x from 0 to 2pi |
| `plot x^3 from -2 to 2` | x from -2 to 2 |

### Default Range

If no range is specified, the default range is `x` from `-10` to `10`.

### How It Works

- The expression is evaluated for 200 evenly spaced `x` values in the range.
- Points with `Infinity` or `NaN` results are skipped (asymptotes, domain errors).
- The graph renders as a line chart in the Graph panel.
- The variable `x` is used as the independent variable.

### Expressions in Graph Mode

Any valid expression can be plotted, including:

| Input | Result |
|-------|--------|
| `plot x^2 + 2*x + 1` | Parabola shifted left |
| `graph cos(x) from -6.2832 to 6.2832` | Full cosine period |
| `plot sqrt(x) from 0 to 10` | Square root curve |
| `y = sin(x) + cos(x)` | Combined trig |
| `plot abs(x) from -5 to 5` | Absolute value V-shape |

---

## 11. Settings

Open Settings with `Ctrl/Cmd + ,` or the gear icon in the title bar. Settings has four tabs:

### General Tab

| Setting | Description | Range |
|---------|-------------|-------|
| **Font Family** | Select from: system default, monospace, serif, sans-serif, Georgia, Courier New | 6 options |
| **Font Size** | Adjust between 10px and 32px with +/- buttons or direct input | 10--32 |
| **Preview** | Live preview showing "AaBbCc 123 -- The quick brown fox jumps over the lazy dog." | -- |

### Theme Tab

Select from 7 built-in themes plus any plugin-provided themes:

| Theme | Background | Accent | Text |
|-------|-----------|--------|------|
| **Dark** | `#18181b` | `#a78bfa` (violet) | `#f4f4f5` |
| **Light** | `#fafafa` | `#7c3aed` (purple) | `#18181b` |
| **Neon** | `#0a0a0a` | `#00ff41` (green) | `#e0e0e0` |
| **Red** | `#1a0a0a` | `#e53935` (red) | `#f0e0e0` |
| **Obsidian** | `#0d0d0d` | `#d4a043` (gold) | `#d4c5a9` |
| **Plasma** | `#0d0d1a` | `#bb86fc` (lavender) | `#e0dff0` |
| **Blood** | `#0a0505` | `#b71c1c` (crimson) | `#e8d0d0` |

Plugin themes appear below the built-in themes, labeled with a "Plugin" badge.

Each theme card shows a color swatch with "Aa" in the accent color and "123" in the text color. Click a card to select it, then click **Save**.

### Keyboard Shortcuts Tab

Lists all customizable shortcuts. Each row shows:

- **Description**: What the shortcut does
- **Key binding**: Current key combination (click to reassign)
- **Edit button**: Pencil icon to start recording a new binding

To customize:

1. Click the key binding or the pencil icon.
2. A "Press keys..." input appears.
3. Press your desired key combination.
4. The binding updates immediately.
5. Click **Save** to persist.

Overrides are stored in `config.toml` as a JSON string in `settings.shortcut_overrides`.

### About Tab

Shows:

- LineSolv logo and name
- Current version number
- Author link (opens search in browser)
- Email: rkriad585@gmail.com
- Repository link (opens GitHub in browser)
- **Check for Updates** button: queries GitHub releases for a newer version and provides a platform-specific download link

---

## 12. Customization

### Theme

Switch themes in **Settings > Theme**. The theme change applies instantly across the entire app via CSS custom properties. All 7 built-in themes and any plugin themes are available.

### Font

Adjust in **Settings > General**:

- **Font Family**: Choose from 6 options (system, monospace, serif, sans-serif, Georgia, Courier New)
- **Font Size**: 10px to 32px with live preview

### Shortcut Overrides

Customize any shortcut in **Settings > Keyboard Shortcuts**. Overrides are saved as a JSON map and restored on app startup. If you want to reset, clear the `shortcut_overrides` field in `config.toml`.

---

## 13. Data Storage

### File Paths

| Platform | Data Directory |
|----------|----------------|
| Linux | `~/.config/neostore/linesolv/` |
| macOS | `~/Library/Application Support/neostore/linesolv/` |
| Windows | `%APPDATA%/neostore/linesolv/` |

### Files

| File | Purpose |
|------|---------|
| `linesolv.db` | SQLite database (WAL mode) storing notes, history, and state |
| `config.toml` | TOML configuration file |
| `plugins/` | Installed plugins directory |
| `plugins/state.json` | Plugin enable/disable state |

### config.toml Sections

```toml
[app]
theme = "dark"
version = "0.13.0"

[notes]
last_active = "note-uuid-here"
sort_by = "updated"

[behavior]
delete_without_confirm = "false"

[settings]
font_size = "16"
font_family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
shortcut_overrides = "{}"
```

| Section | Key | Description |
|---------|-----|-------------|
| `[app]` | `theme` | Active theme ID |
| `[app]` | `version` | App version for migration |
| `[notes]` | `last_active` | UUID of the last active note |
| `[notes]` | `sort_by` | Note sort order |
| `[behavior]` | `delete_without_confirm` | `"true"` to skip delete confirmation |
| `[settings]` | `font_size` | Font size in pixels |
| `[settings]` | `font_family` | CSS font-family string |
| `[settings]` | `shortcut_overrides` | JSON string of shortcut overrides |

---

## 14. Troubleshooting

See the [FAQ & Troubleshooting Guide](faq.md) for common issues including:

- App won't start on Linux (missing WebKit2GTK)
- Gatekeeper warning on macOS
- Currency rates not updating
- Graph not appearing
- Plugins not loading
- Notes not saving

For bug reports, visit the [GitHub Issues](https://github.com/rkriad585/LineSolv/issues) page.
