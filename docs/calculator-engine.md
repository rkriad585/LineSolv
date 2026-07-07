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
|---|---|---|---|
| 1. Prefix stripping | Removes query prefixes | `what is 2+2` → `2+2` |
| 2. Leading commands | Strips `add`, `sum of` | `add 2 plus 2` → `2 plus 2` |
| 3. Leading articles | Strips `the`, `a`, `an` | `the just plus five` → `just plus five` |
| 4. Trailing fluff | Removes `please`, `thanks` | `2+2 please` → `2+2` |
| 5. Fraction words | Converts fraction words to decimals | `one half` → `0.5` |
| 6. Word-to-number | Converts word numbers to digits | `twenty five` → `25` |
| 7. Context references | Replaces `that`, `then`, `result` | `then * 2` → `42 * 2` |
| 8. Multiplicative prefixes | Handles `double`, `twice`, `half of` | `double 5` → `2 * 5` |
| 9. Power words | Converts `squared`, `cubed` | `5 squared` → `5 ^ 2` |
| 10. Complex phrases | Comparison, division, multiplication phrases | `10 increased by 5` → `10 + 5` |
| 11. Natural functions | Converts `square root of X` to `sqrt(X)` | `square root of 144` → `sqrt(144)` |
| 12. Word operators | Replaces English operators with symbols | `plus` → `+`, `divided by` → `/` |
| 13. Percent word | Converts `percent` → `%` | `10 percent of 200` → `10% of 200` |
| 14. Comma cleanup | Removes commas from numbers | `1,000` → `1000` |
| 15. Trailing punctuation | Strips `?` and `.` | `42?` → `42` |

### Query Prefixes

Stripped prefixes include: `what is`, `what's`, `what are`, `calculate`, `compute`, `find`, `solve`, `the value of`, `evaluate`, `result of`, `how much is`, `how many is`.

### Word-to-Number

Supports numbers from zero through billions:
- Simple: `one` → `1`, `twenty` → `20`
- Compound: `twenty five` → `25`, `two hundred thirty` → `230`
- Large: `two million three hundred thousand` → `2300000`
- Hyphenated: `twenty-one` → `21`
- "And" is ignored: `one hundred and five` → `105`

### Context References

- `of that`, `of it`, `of the result` — replaces with previous line's result
- `then X` — prepends previous result: `then + 5` → `42 + 5`
- `result X` / `answer X` — same as `then`
- Entire line `that` or `it` — returns previous result

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

Tokens: `+`, `-`, `*`, `/`, `^`, `%`, `(`, `)`, `,`, numbers (`tokNum`), identifiers (`tokIdent`), EOF.

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
| `fact(x)` / `factorial(x)` | Factorial |
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
- **Currency**: USD, EUR, GBP, JPY, CNY, INR, CAD, AUD, CHF

## Error Handling

All evaluation errors return an empty string — no error messages are shown to the user. Division and modulo by zero are silently dropped.
