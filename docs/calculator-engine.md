# Calculator Engine

The calculator engine (`app/calculator/`) is a complete natural-language arithmetic evaluator built in Go, split across six files for maintainability.

| File | Responsibility |
|---|---|
| `engine.go` | Core Engine struct, PEMDAS recursive descent parser, lexer, naturalize pipeline, EvaluateLine/EvaluateAll, history tracking, helpers |
| `units.go` | Unit conversion database (`unitDB`), `convertUnit`, `RegisterUnit` |
| `functions.go` | Built-in math function dispatch (`sin`, `cos`, `sqrt`, etc.) |
| `variables.go` | `GetVariables`, `SetVariable`, `ClearVariables` |
| `steps.go` | `Step` and `EvalDetail` types, `GetSteps` method (read-only evaluation with intermediate steps) |
| `graph.go` | `Point`, `GraphResult` types, `EvaluateGraph` method (function plotting via sampled points) |

## Overview

```
Input → Naturalize → Pattern Matching → Recursive Descent Parser → Result
```

## Natural Language Pipeline (`naturalize`)

Before arithmetic parsing, the input is preprocessed through a multi-step pipeline.
A `normalize()` pass runs at the very top to handle Unicode normalisation and noise
words before any pattern matching.

| Step | What it does | Example |
|---|---|---|---|---|---|
| 0. normalize | Unicode normalisation, noise word stripping, whitespace normalisation | `5 × 3` → `5 * 3`, `5 ÷ 2` → `5 / 2`, `exactly 2+2` → `2+2` |
| 1. Prefix stripping | Removes query prefixes, conversation fillers, pronouns (loop) | `what is 2+2` → `2+2`, `can you calculate 5+3` → `5+3`, `maybe 2+2` → `2+2` |
| 2. Trailing fluff | Removes `please`, `thanks`, `for me`, `if possible`, `yrs old` | `2+2 for me` → `2+2`, `25 yrs old` → `25` |
| 2b. Trailing punctuation | Strips `?` and `.` early (before word-to-number) | `one plus one?` → `one plus one` |
| 3. Currency conversion | Strips symbols, handles cross-rates, code prefixes | `$5k in EUR` → `5000 usd in EUR` |
| 3b. Compact time | Expands `h`/`m` notation | `2h30m` → `(2 + 30/60.0)` |
| 4. Fraction words | Converts fraction words to decimals | `one half` → `0.5` |
| 5. Word-to-number | Converts word numbers to digits | `twenty five` → `25` |
| 6. Ordinal suffixes | Strips `st`, `nd`, `rd`, `th` | `1st` → `1` |
| 7. "how many times" | Division via how-many-times (before SI) | `how many times does 5 go into 20` → `20 / 5` |
| 8. SI notation | Expands `k`/`M`/`B`/`T` suffixes | `5k` → `5000` |
| 8b. Mixed numbers | Whole + fraction → addition | `2 1/2` → `2 + (1/2)` |
| 9. Possessive plurals | Expands plural number words | `3 tens` → `(3 * 10)` |
| 9b. "half N" pattern | `half N` → `0.5 * N` | `half 1000000` → `0.5 * 1000000` |
| 10. Context references | Replaces `that`, `then`, `result`, `prev`, `my age` | `then * 2` → `42 * 2`, `prev + 5` → `42 + 5` |
| 11. Multiplicative prefixes | Handles `double`, `twice`, `half of` | `double 5` → `2 * 5` |
| 12. Power words | Converts `squared`, `cubed` | `5 squared` → `5 ^ 2` |
| 12b–12e. Comparison/ratio | `times more/less`, `% more/less`, `added to` | `3 times more than 5` → `5 + 5 * 3` |
| 13. Complex phrases | Comparison, division, multiplication, `half as much as`, `how many X in Y` | `10 increased by 5` → `10 + 5`, `half as much as 10` → `5` |
| 13b. Shape patterns | Rectangle/circle area, cube/cylinder/sphere volume, `by`/`x` multiply | `area of rectangle 10 by 20` → `200` |
| 13c. Purchase math | `N items at $P each` → `(N * P)`, full expression with discount + tax | `5 items at $20 each` → `100`, `5 items at $20 each with a 15% discount and 8% sales tax added on top` → `91.8` |
| 14. Natural functions | `square root of`, `cube root of`, `absolute value of`, `sine of`, `log of` | `square root of 144` → `sqrt(144)`, `sine of 0` → `sin(0)` |
| 14b. Natural trig/log | `sine of X`, `cosine of X`, `log of X`, `ln of X` | `sine of 0` → `sin(0)`, `log of 100` → `ln(100)` |
| 14c. "per cent" / "pct" | Converts `per cent` / `pct` → `percent` | `10 per cent of 200` → `10 percent of 200`, `10 pct of 200` → `10 percent of 200` |
| 14d. Tip/discount | `X plus Y% tip`, `X minus Y% discount` | `40 plus 15% tip` → `(40 + 40 * 15 / 100)` |
| 15. Word operators | Replaces English operators with symbols (expanded) | `plus` → `+`, `combined with` → `+`, `subtract` → `-`, `lots of` → `*`, `split between` → `/`, `exponent` → `^`, `to the N` → `^ N` |
| 16. "X from Y" | Converts subtraction-by-from (after word operators) | `10 from 100` → `100 - 10` |
| 17. Percentage relations | `is what % of`, `as a % of`, `% of what is`, `what % of Y is X` | `10 is what % of 50` → `((10 / 50) * 100)` |
| 18. Advanced math | `log base`, `choose` | `log base 2 of 8` → `(ln(8) / ln(2))` |
| 18b. Trig shorthand | `sin 45` → `sin(45)`, `sin theta` → `sin(theta)` | `sin 45` → `0.8509` |
| 18c. "sin of X" | `sin of X` → `sin(X)`, `cos of X` → `cos(X)` | `sin of 0` → `sin(0)` |
| 18d. Verb-square/cube | `square X` → `X ^ 2`, `cube X` → `X ^ 3` | `square 5` → `25` |
| 19. Percent word | Converts `percent` → `%` | `10 percent of 200` → `10% of 200` |
| 20. Comma cleanup | Removes commas from numbers | `1,000` → `1000` |
| 21. Collapse spaces | Normalises multiple spaces to one | `5  +   3` → `5 + 3` |

### Query Prefixes

Stripped prefixes include:
- **Standard**: `what is`, `what's`, `what are`, `calculate`, `compute`, `find`, `solve`, `the value of`, `evaluate`, `result of`, `how much is`, `how many is`
- **Conversational**: `can you`, `could you`, `would you`, `will you`, `do you`, `does`
- **Request**: `i need to`, `i want`, `i would like`, `i'd like`, `we need`, `we want`
- **Filler**: `i think`, `i guess`, `maybe`, `perhaps`, `probably`, `so`, `well`, `ok`, `okay`, `alright`, `like`
- **Action**: `let's`, `lets`, `determine`, `work out`, `figure out`, `give me`
- **Greeting**: `hi`, `hello`, `hey` (optional `there`)
- **Pronouns**: `i`, `we`, `you`, `your` (stripped when leading; `my` guarded against age refs)

### Word-to-Number

Supports numbers from zero through billions:
- Simple: `one` → `1`, `twenty` → `20`
- Compound: `twenty five` → `25`, `two hundred thirty` → `230`
- Large: `two million three hundred thousand` → `2300000`
- Hyphenated: `twenty-one` → `21`
- "And" is ignored: `one hundred and five` → `105`

Collective nouns are mapped in `wordNumMap` and handled by the word-to-number step:
```
a couple  →  2
a dozen   →  12
a score   →  20
```

### Phase 0 — Input Normalisation

New `normalize()` pass at the top of the pipeline handles character-level issues before any pattern matching:

| Pattern | Transformation | Example |
|---|---|---|
| Unicode quotes | Smart/curly quotes → ASCII | `\u2018` `\u2019` → `'`, `\u201c` `\u201d` → `"` |
| Unicode dashes | En/em dash, minus → `-` | `5 \u2013 3` → `5 - 3` |
| Unicode multiply/divide | `×`/`·` → `*`, `÷` → `/` | `5 × 3` → `5 * 3`, `10 ÷ 2` → `10 / 2` |
| Unicode spaces | NBSP, thin spaces → regular space | |
| Multiple punctuation | `??`, `!!!`, `...` → stripped | |
| Noise words | `exactly`, `roughly`, `about`, `approximately`, `say` → stripped | |

### Phase 1 — Prefix / Suffix / Notation Patterns

These patterns clean up formatting and expand common shorthand before arithmetic parsing:

| Pattern | Step | Example |
|---|---|---|
| Unicode normalisation | 0 | `5 × 3` → `5 * 3`, `5 ÷ 2` → `5 / 2` |
| Expanded prefixes | 1 | `can you find 5+3` → `5+3`, `maybe 2+2` → `2+2`, `i'd like 2*3` → `2*3` |
| Expanded trailing fluff | 2 | `2+2 for me` → `2+2`, `25 yrs old` → `25` |
| Currency conversion | 3 | `$10` → `10`, `$5k in EUR` → `5000 usd in EUR`, `BTC5k in USD` → `5k btc in USD` |
| Compact time notation | 3b | `2h30m` → `(2 + 30/60.0)`, `2h` → `2` |
| Mixed numbers | 8b | `2 1/2` → `2 + (1/2)`, `3 3/4` → `3 + (3/4)` |
| Ordinal suffix stripping | 6 | `1st` → `1`, `2nd` → `2`, `3rd` → `3`, `4th` → `4` |
| SI notation expansion | 8 | `5k` → `5000`, `3M` → `3000000`, `2B` → `2000000000` |
| Possessive plurals | 9 | `3 tens` → `(3 * 10)`, `2 dozens` → `(2 * 12)`, `5 scores` → `(5 * 20)` |
| "X from Y" subtraction | 16 | `10 from 100` → `100 - 10` |

SI notation uses case‑sensitive matching: `k`/`K` = thousand, `M` = million, `B` = billion, `T` = trillion. Lowercase `m` is NOT treated as SI (it would conflict with meters in unit conversion). Unlike the old parenthesized form `(5 * 1000)`, SI now expands to the computed numeric value (`5000`) so that subsequent currency conversion can match the complete number.

The "how many times" pattern runs **before** SI expansion so that `5k`, `3M`, etc. are captured as a single token and expanded after substitution. The number capture groups accept an optional SI suffix (`[kKMBT]`).

### Phase 2 — Percentage Relationship Phrases

These patterns answer relational percentage questions without needing to set up the formula manually:

| Phrase | Transformation | Example |
|---|---|---|
| `X is what percent of Y` (or `%`) | `(X / Y) * 100` | `10 is what percent of 50` → `20` |
| `X as a percentage of Y` | `(X / Y) * 100` | `10 as a percentage of 50` → `20` |
| `X percent of what is Y` (or `%`) | `(Y / X) * 100` | `50 percent of what is 25` → `50` |
| `what percent of Y is X` (or `%`) | `(X / Y) * 100` | `what percent of 50 is 10` → `20` |
| `X out of Y as a percentage` | `(X / Y) * 100` | `10 out of 50 as a percentage` → `20` |
| `X pct` / `X p.c.` / `X pc` | `X percent` | `10 pct of 200` → `20` |
| `X plus Y% tip/tax` | `X + X * Y / 100` | `40 plus 15% tip` → `46` |
| `X minus/after Y% discount` | `X - X * Y / 100` | `200 minus 10% discount` → `180` |

### Phase 3 — Advanced Math / Natural Function Phrases

These patterns provide natural‑language access to advanced mathematical operations:

| Phrase | Transformation | Example |
|---|---|---|
| `X!` (postfix `!`) | `factorial(X)` | `5!` → `120` |
| `log base X of Y` | `ln(Y) / ln(X)` | `log base 2 of 8` → `3` |
| `X choose Y` | `nCr(X, Y)` | `5 choose 3` → `10` |
| `how many times does X go into Y` | `Y / X` | `how many times does 5 go into 20` → `4` |
| `the square root of X` | `sqrt(X)` | `the square root of 144` → `12` |
| `the cube root of X` | `cbrt(X)` | `the cube root of 27` → `3` |
| `the absolute value of X` | `abs(X)` | `the absolute value of -5` → `5` |
| `sine of X` / `cosine of X` / `tangent of X` | `sin(X)` / `cos(X)` / `tan(X)` | `sine of 0` → `0` |
| `log of X` / `ln of X` / `natural log of X` | `ln(X)` | `log of 100` → `4.605...` |
| `square X` / `cube X` (verb) | `X ^ 2` / `X ^ 3` | `square 5` → `25` |
| `half as much as X` | `X * 0.5` | `half as much as 10` → `5` |
| `quarter as much as X` | `X * 0.25` | `quarter as much as 20` → `5` |
| `how many X in Y` | `Y / X` | `how many 5 in 20` → `4` |

The factorial `!` operator is parsed at the lexer level as a `tokBang` token and applied in the parser's `parseAtom` — it binds tighter than all binary operators. The `nCr` function is registered in the built‑in function table. `log base` and `choose` are substituted before word operators so they don't conflict with other patterns. The "how many times" pattern runs before SI expansion (step 7) to handle SI suffixed numbers like `5k`.

### Date Math (before and after naturalize)

Date math runs **before** naturalize (to preserve date keywords like `today`, `now`, `next`) 
and again **after** naturalize (handling cleaned expressions like `what is next week` → `next week`).

An additional embedded extraction pass searches for date patterns anywhere in the
post-naturalize string, so expressions like `asjeh fjfugh today + 3 months etc` still
resolve to the correct date.

Supported patterns:
- `today` / `now` — returns current date/time
- `next week` / `last month` / `next year` — relative dates
- `today + 14 days` / `today - 3 months` / `now + 1 year`
- `March 1 + 30 days` / `Dec 25 2026 + 7 days`
- `N days from now` / `N months ago`
- Embedded in text: `I completing a book at today + 14 days some others story` → date

### Context References

- `of that`, `of it`, `of the result`, `of the answer`, `of the value` — replaces with previous line's result
- `then X`, `result X`, `answer X` — prepends previous result: `then + 5` → `42 + 5`
- `previous X`, `last X`, `prior X`, `prev X` — same as `then`
- `my age` / `my current age` — returns previous line's result (useful after a birth-year query)
- Entire line `that`, `it`, `my age`, `my current age`, `previous`, `last`, `prior`, `prev` — returns previous result

### Word Operators

| English | Symbol |
|---|---|
| `plus`, `and`, `combined with`, `together with`, `along with` | `+` |
| `minus`, `subtracted from`, `less`, `reduced by`, `take away`, `subtract`, `without`, `fewer` | `-` |
| `times`, `multiplied by`, `multiply`, `groups of`, `lots of`, `sets of` | `*` |
| `divided by`, `split into/between/among`, `per`, `divide`, `shared between/among` | `/` |
| `to the power of`, `raised to`, `raised to the power of`, `exponent`, `to the N` | `^` |
| `mod`, `modulo` | `%` |

> **Note:** The `per` → `/` conversion is aggressive. For unit conversion (e.g., `10 km per hour`), use the `X in Y` syntax instead.

## Pattern Matching (pre-parser)

Before falling through to the general parser, the engine checks for three special patterns:

### Unit Conversion: `X fromUnit in toUnit`

```
10 inches in cm     → 25.4 cm
100 USD in EUR      → 92.59 EUR
100 c to f          → 212 °F
```

### Percentage of: `X% of Y`

```
10% of 200          → 20
15% on 80           → 12
```

### Percentage add/subtract: `X ± Y%`

```
100 + 15%           → 115
200 - 10%           → 180
```

## Arithmetic Parser

Recursive descent parser implementing PEMDAS:

```
parseAddSub  → parseMulDiv {(+|-) parseMulDiv}
parseMulDiv  → parsePow {(*|/|%) parsePow}
parsePow     → parseUnary {^ parseUnary}
parseUnary   → {-|+} parseAtom
parseAtom    → number | (expr) | ident[(args...)]
```

### Lexer (tokenizer)

Tokens: `+`, `-`, `*`, `/`, `^`, `%`, `(`, `)`, `,`, `!`, numbers (`tokNum`), identifiers (`tokIdent`), EOF.

The postfix factorial operator `!` (tokBang) binds tighter than all binary operators and is handled during atom parsing.

### Built-in Functions

| Function | Description |
|---|---|
| `sin(x)` | Sine (radians) |
| `cos(x)` | Cosine (radians) |
| `tan(x)` | Tangent (radians) |
| `asin(x)` | Arc sine |
| `acos(x)` | Arc cosine |
| `atan(x)` | Arc tangent |
| `atan2(y, x)` | Arc tangent of y/x |
| `sinh(x)` | Hyperbolic sine |
| `cosh(x)` | Hyperbolic cosine |
| `tanh(x)` | Hyperbolic tangent |
| `sqrt(x)` | Square root |
| `cbrt(x)` | Cube root |
| `abs(x)` | Absolute value |
| `round(x)` | Nearest integer |
| `floor(x)` | Round down |
| `ceil(x)` | Round up |
| `trunc(x)` | Truncate decimals |
| `fract(x)` | Fractional part |
| `log(x)` / `ln(x)` | Natural logarithm |
| `log10(x)` | Base-10 logarithm |
| `log2(x)` | Base-2 logarithm |
| `exp(x)` | e^x |
| `pow(x, y)` | x^y |
| `fact(x)` / `factorial(x)` | Factorial | `fact(5)` → 120 |
| `nCr(n, r)` | Combinations (n choose r) | `nCr(5, 3)` → 10 |
| `gcd(a, b)` | Greatest common divisor |
| `lcm(a, b)` | Least common multiple |
| `rand()` | Random [0, 1) |
| `min(a, b, ...)` | Minimum |
| `max(a, b, ...)` | Maximum |
| `sum(a, b, ...)` | Sum |
| `avg(a, b, ...)` | Average |
| `median(a, b, ...)` | Median value |
| `mode(a, b, ...)` | Mode (most frequent) |
| `stdev(a, b, ...)` | Standard deviation |
| `variance(a, b, ...)` | Population variance |
| `range(a, b, ...)` | Range (max - min) |
| `sign(x)` / `sgn(x)` | Sign (-1, 0, 1) |
| `deg(x)` | Radians to degrees |
| `rad(x)` | Degrees to radians |
| `isprime(n)` | Primality test (returns 1 or 0) |

### Constants

- `pi` / `π` — π (3.14159...)
- `e` — Euler's number (2.71828...)
- `speed_of_light` / `lightspeed` / `c_light` — 299,792,458 m/s
- `gravity` / `g_force` — 9.80665 m/s²
- `planck` / `planck_constant` — 6.62607015×10⁻³⁴ J·s
- `boltzmann` / `boltzmann_constant` — 1.380649×10⁻²³ J/K
- `gas_constant` / `gasconstant` — 8.314462618 J/(mol·K)
- `avogadro` / `avogadro_constant` — 6.02214076×10²³ mol⁻¹
- `stefan_boltzmann` / `stefanboltzmann` — 5.670367×10⁻⁸ W/(m²·K⁴)
- `electron_mass` / `me` — 9.10938356×10⁻³¹ kg
- `proton_mass` / `mp` — 1.67262192369×10⁻²⁷ kg
- `neutron_mass` / `mn` — 1.67492749804×10⁻²⁷ kg
- `electron_charge` / `e_charge` — 1.602176634×10⁻¹⁹ C
- `bohr_radius` / `bohrradius` — 5.29177210903×10⁻¹¹ m
- `rydberg` / `rydberg_constant` — 10,973,731.568160 m⁻¹

### Variables

- Assignment: `x = 42`
- Reference: `x * 2` → `84`
- Variables persist across lines until cleared (`⌘K`)
- Case-insensitive names

## History

Each successful evaluation is recorded in the engine's history as a `HistoryEntry{Input, Output}`. Accessible via `GetHistory()` and `ClearHistory()` on the engine and service layer. The frontend provides `Cmd+↑` / `Cmd+↓` navigation through computed entries.

## Unit Database

Built-in conversion for:
- **Length**: meter, kilometer, centimeter, millimeter, inch, foot, yard, mile
- **Mass**: gram, kilogram, pound, ounce
- **Volume**: liter, milliliter, gallon, quart, cup
- **Temperature**: Celsius, Fahrenheit
- **Time**: second, minute, hour, day
- **Currency**: USD, EUR, GBP, JPY, CNY, INR, CAD, AUD, CHF, KRW, RUB, BRL, MXN, ZAR, NZD, SEK, NOK, PLN, HKD, SGD, THB, ILS, VND, PHP, UAH, KZT, PYG, GHS, TRY, AZN, GEL, BDT, PKR, LKR, NPR, MYR, IDR, TWD, SAR, AED, KWD, EGP, NGN, COP, CLP, ARS, PEN, MAD, BTC, XAU, XAG

## Step-by-Step Evaluation

The `GetSteps(input)` method evaluates an expression in read-only mode — it runs the full parser pipeline but does not modify engine state (no history recording, no variable mutations). Each parser level records `Step` entries showing the operation performed and the intermediate result:

| Parser Level | Example Step |
|---|---|
| Naturalize | `naturalize("what is 5 + 3 * 2")` → `"5 + 3 * 2"` |
| Add/Subtract | `5 + 6` → `11` |
| Multiply/Divide | `3 * 2` → `6` |
| Power | `2 ^ 3` → `8` |
| Negate | `-5` → `-5` |
| Modulo | `17 % 5` → `2` |
| Factorial | `5!` → `120` |
| Function | `sqrt(144)` → `12` |
| Constant | `pi` → `3.1416` |
| Variable | `x` → `42` |

Steps are returned as an `EvalDetail` struct containing the final result string and an ordered slice of `Step` objects.

## Function Graphing

The `EvaluateGraph(input)` method detects graphing commands and evaluates an expression across a range of x values:

```
plot x^2                 →  200 points from -10 to 10
graph sin(x)             →  200 points from -10 to 10
y = 2x + 1               →  200 points from -10 to 10
graph x^2 from -5 to 5   →  200 points from -5 to 5
```

The implementation:
1. Strips the leading `plot`/`graph`/`y =` prefix
2. Extracts optional `from N to N` range specifier (defaults to -10 to 10)
3. Saves the current `x` variable, evaluates the expression for 200 evenly spaced x values, and restores the original `x`
4. Returns a `GraphResult` with the sampled `Point` slice, cleaned expression, and range bounds

## Error Handling

All evaluation errors return an empty string — no error messages are shown to the user. Division and modulo by zero are silently dropped.

## Plugin System

The calculator engine integrates a plugin system that extends the function table at runtime.

### Plugin Manager (`app/plugin/`)

| File | Responsibility |
|---|---|
| `types.go` | `Manifest`, `Plugin`, `FunctionDef`, `ThemeDef`, `VariableDef` types |
| `loader.go` | `Manager` struct — scans plugin directory, loads manifests, registers functions |
| `builtins.go` | 20+ pre-defined builtin functions available to plugin expressions |
| `expr.go` | Safe expression evaluator for plugin function definitions |
| `state.go` | Plugin enabled/disabled state persistence |

### How Plugins Extend the Engine

1. On startup, `main.go` creates a `plugin.Manager` and calls `Scan()` to discover plugins in `~/.config/neostore/linesolv/plugins/`
2. Each plugin's `plugin.json` manifest declares functions, themes, and variables
3. Expression functions are compiled by the `expr.go` evaluator into callable `PluginFunction` closures
4. Builtin functions map to pre-defined operations in `builtins.go`
5. The engine's `callBuiltinOrPlugin()` function checks plugin functions after builtins
6. Plugin variables are merged into the engine's variable map
7. Plugin themes are injected into the frontend theme picker

### Expression Evaluator (`expr.go`)

Plugin expressions use a safe subset of math:
- **Operators**: `+`, `-`, `*`, `/`, `^`, `%`
- **Functions**: `min`, `max`, `abs`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sqrt`, `cbrt`, `log`, `ln`, `log2`, `exp`, `pow`, `floor`, `ceil`, `round`, `sign`, `mod`, `atan2`
- **Constants**: `pi()`, `e()`, `tau()`, `phi()`
- **Variables**: `a`, `b`, `c`... mapped to function arguments

No arbitrary code execution — expressions are parsed and evaluated in a sandboxed environment.

### Plugin State Persistence

Plugin enabled/disabled state is persisted in a `plugin_state.json` file in the data directory. State survives app restarts.
