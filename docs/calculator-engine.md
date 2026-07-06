# Calculator Engine

The calculator engine (`app/calculator/engine.go`) is a complete natural-language arithmetic evaluator built in Go.

## Overview

```
Input → Naturalize → Pattern Matching → Recursive Descent Parser → Result
```

## Natural Language Pipeline (`naturalize`)

Before arithmetic parsing, the input is preprocessed through a multi-step pipeline:

| Step | What it does | Example |
|---|---|---|
| 1. Prefix stripping | Removes query prefixes | `what is 2+2` → `2+2` |
| 2. Leading commands | Strips `add`, `sum of` | `add 2 plus 2` → `2 plus 2` |
| 3. Leading articles | Strips `the`, `a`, `an` | `the just plus five` → `just plus five` |
| 4. Trailing fluff | Removes `please`, `thanks` | `2+2 please` → `2+2` |
| 5. Word-to-number | Converts word numbers to digits | `twenty five` → `25` |
| 6. Context references | Replaces `that`, `then`, `result` | `then * 2` → `42 * 2` |
| 7. Word operators | Replaces English operators with symbols | `plus` → `+`, `divided by` → `/` |
| 8. Percent word | Converts `percent` → `%` | `10 percent of 200` → `10% of 200` |
| 9. Comma cleanup | Removes commas from numbers | `1,000` → `1000` |
| 10. Trailing punctuation | Strips `?` and `.` | `42?` → `42` |

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
| `sqrt(x)` | Square root |
| `abs(x)` | Absolute value |
| `round(x)` | Nearest integer |
| `floor(x)` | Round down |
| `ceil(x)` | Round up |
| `log(x)` / `ln(x)` | Natural logarithm |
| `log10(x)` | Base-10 logarithm |
| `exp(x)` | e^x |

Plugin-registered functions (e.g., `choose`, `permute`) are dispatched through the same `callBuiltinOrPlugin` path.

### Constants

- `pi` / `π` — π (3.14159...)
- `e` — Euler's number (2.71828...)

### Variables

- Assignment: `x = 42`
- Reference: `x * 2` → `84`
- Variables persist across lines until cleared (`⌘K`)
- Case-insensitive names

## Unit Database

Built-in conversion for:
- **Length**: meter, kilometer, centimeter, millimeter, inch, foot, yard, mile
- **Mass**: gram, kilogram, pound, ounce
- **Volume**: liter, milliliter, gallon, quart, cup
- **Temperature**: Celsius, Fahrenheit
- **Currency**: USD, EUR, GBP, JPY, CNY, INR, CAD, AUD, CHF

Plugin-registered units extend this database at runtime.

## Error Handling

All evaluation errors return an empty string — no error messages are shown to the user. Division and modulo by zero are silently dropped.
