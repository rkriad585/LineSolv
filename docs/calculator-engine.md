# Calculator Engine

The calculator engine (`app/calculator/`) is a complete natural-language arithmetic evaluator built in Go, split across four files for maintainability.

| File | Responsibility |
|---|---|
| `engine.go` | Core Engine struct, PEMDAS recursive descent parser, lexer, naturalize pipeline, EvaluateLine/EvaluateAll, history tracking, helpers |
| `units.go` | Unit conversion database (`unitDB`), `convertUnit`, `RegisterUnit` |
| `functions.go` | Built-in math function dispatch (`sin`, `cos`, `sqrt`, etc.) |
| `variables.go` | `GetVariables`, `SetVariable`, `ClearVariables` |

## Overview

```
Input → Naturalize → Pattern Matching → Recursive Descent Parser → Result
```

## Natural Language Pipeline (`naturalize`)

Before arithmetic parsing, the input is preprocessed through a multi-step pipeline:

| Step | What it does | Example |
|---|---|---|---|---|
| 1. Prefix stripping | Removes query prefixes (loop) | `what is 2+2` → `2+2` |
| 2. Trailing fluff | Removes `please`, `thanks`, `my age`, `years old` | `2+2 please` → `2+2` |
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
| 10. Context references | Replaces `that`, `then`, `result`, `my age` | `then * 2` → `42 * 2` |
| 11. Multiplicative prefixes | Handles `double`, `twice`, `half of` | `double 5` → `2 * 5` |
| 12. Power words | Converts `squared`, `cubed` | `5 squared` → `5 ^ 2` |
| 12b–12e. Comparison/ratio | `times more/less`, `% more/less`, `added to` | `3 times more than 5` → `5 + 5 * 3` |
| 13. Complex phrases | Comparison, division, multiplication phrases | `10 increased by 5` → `10 + 5` |
| 13b. Shape patterns | Rectangle/circle area, cube/cylinder/sphere volume, `by`/`x` multiply | `area of rectangle 10 by 20` → `200` |
| 14. Natural functions | Converts `square root of X` to `sqrt(X)` | `square root of 144` → `sqrt(144)` |
| 14c. "per cent" | Converts `per cent` → `percent` (before word operator `per`) | `10 per cent of 200` → `10 percent of 200` |
| 15. Word operators | Replaces English operators with symbols | `plus` → `+`, `divided by` → `/` |
| 16. "X from Y" | Converts subtraction-by-from (after word operators) | `10 from 100` → `100 - 10` |
| 17. Percentage relations | `is what % of`, `as a percentage of`, `% of what is` | `10 is what % of 50` → `((10 / 50) * 100)` |
| 18. Advanced math | `log base`, `choose` | `log base 2 of 8` → `(ln(8) / ln(2))` |
| 18b. Trig shorthand | `sin 45` → `sin(45)`, `sin theta` → `sin(theta)` | `sin 45` → `0.8509` |
| 19. Percent word | Converts `percent` → `%` | `10 percent of 200` → `10% of 200` |
| 20. Comma cleanup | Removes commas from numbers | `1,000` → `1000` |
| 21. Collapse spaces | Normalises multiple spaces to one | `5  +   3` → `5 + 3` |

### Query Prefixes

Stripped prefixes include: `what is`, `what's`, `what are`, `calculate`, `compute`, `find`, `solve`, `the value of`, `evaluate`, `result of`, `how much is`, `how many is`.

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

### Phase 1 — Prefix / Suffix / Notation Patterns

These patterns clean up formatting and expand common shorthand before arithmetic parsing:

| Pattern | Step | Example |
|---|---|---|
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

### Phase 3 — Advanced Math Phrases

These patterns provide natural‑language access to advanced mathematical operations:

| Phrase | Transformation | Example |
|---|---|---|
| `X!` (postfix `!`) | `factorial(X)` | `5!` → `120` |
| `log base X of Y` | `ln(Y) / ln(X)` | `log base 2 of 8` → `3` |
| `X choose Y` | `nCr(X, Y)` | `5 choose 3` → `10` |
| `how many times does X go into Y` | `Y / X` | `how many times does 5 go into 20` → `4` |

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

- `of that`, `of it`, `of the result` — replaces with previous line's result
- `then X` — prepends previous result: `then + 5` → `42 + 5`
- `result X` / `answer X` — same as `then`
- `my age` / `my current age` — returns previous line's result (useful after a birth-year query)
- Entire line `that`, `it`, `my age`, or `my current age` — returns previous result

### Word Operators

| English | Symbol |
|---|---|
| `plus`, `and` | `+` |
| `minus`, `subtracted from`, `less`, `reduced by`, `take away` | `-` |
| `times`, `multiplied by`, `multiply`, `groups of` | `*` |
| `divided by`, `split into`, `per` | `/` |
| `to the power of`, `raised to` | `^` |
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
| `sign(x)` / `sgn(x)` | Sign (-1, 0, 1) |
| `deg(x)` | Radians to degrees |
| `rad(x)` | Degrees to radians |

### Constants

- `pi` / `π` — π (3.14159...)
- `e` — Euler's number (2.71828...)

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

## Error Handling

All evaluation errors return an empty string — no error messages are shown to the user. Division and modulo by zero are silently dropped.
