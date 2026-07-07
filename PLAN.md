# NL Parser Expansion Plan

## Architecture (as-is)

```
Input → naturalize() pipeline → special patterns → recursive descent parser → Result

naturalize() pipeline order (30 steps):
  1.  Prefix stripping (loop)
  2.  Trailing fluff
  2b. Trailing punctuation (? .)
  3.  Currency conversion
  3b. Compact time notation (2h30m)
  4.  Fraction words (one half → 0.5)
  5.  wordsToNumbers
  6.  Ordinal suffix stripping
  7.  How many times (before SI)
  8.  SI notation expansion (5k → 5000)
  8b. Mixed numbers (2 1/2 → 2 + (1/2))
  9.  Possessive plurals (3 tens → 30)
  9b. Half N (half 1000000 → 0.5 * 1000000)
  10. Context references (that/then/result/my age)
  11. Multiplicative prefixes (double/twice/half of/quarter of)
  12. Power words (squared/cubed)
  12b. X times more than Y
  12c. X times as much as Y
  12d. X% more/less than Y
  12e. X added to Y
  13. Complex phrases (increased/decreased/more/less/diff/over/out of/ratio/product/sum of)
  13b. Shape patterns (rect/circle/cube/cylinder/sphere)
  14. Natural functions (sqrt/cbrt/abs of)
  14c. per cent → percent
  15. Word operators (plus/and/minus/times/divided by/per/…)
  16. X from Y
  17. % relationship phrases (is what % of / as a % of / % of what is)
  18. Advanced math (log base / choose)
  18b. Trig shorthand (sin 45 → sin(45))
  19. percent word → %
  20. Comma cleanup
  21. Collapse spaces
```

## Objective

Make every category of expression more forgiving of natural writing variation — filler
words, reordered phrases, abbreviations, multiple phrasings, optional words, embedded
in sentences, punctuation differences, etc. — without changing the pipeline structure.

## Implementation Phases

---

### Phase 0 — Preprocessing (before pipeline)

Add a `normalize()` pass called at the very top of `naturalize()`, before any pattern
matching. This handles input variations that should never affect recognition:

| # | Normalization | Source | Target |
|---|--------------|--------|--------|
| 1 | Unicode quotes (smart/curly) | `\u2018\u2019` (') `\u201c\u201d` (") | ASCII `'` `"` |
| 2 | Unicode dashes | `\u2013` (en-dash) `\u2014` (em-dash) | `-` |
| 3 | Unicode minus | `\u2212` | `-` |
| 4 | Unicode multiplication | `\u00d7` (×) `\u00b7` (·) | `*` |
| 5 | Unicode division | `\u00f7` (÷) | `/` |
| 6 | Unicode brackets | `\u201c\u201d` `\u300c\u300d` `\u300e\u300f` etc. | `(` `)` |
| 7 | Thin spaces / non-breaking | `\u00a0` `\u2000`-`\u200a` `\u202f` | ` ` |
| 8 | Multiple punctuation | `??` `!!!` `?!` `!?` `?` `!` `...` | `?` `!` `.` |

**Verification**: existing tests pass unchanged. New test cases for Unicode normalization.

---

### Phase 1 — Prefix/Suffix expansion

#### 1a. Expanded greeting & conversational prefixes (step 1)

Add to the prefix-stripping loop:

| Pattern | Strips |
|---------|--------|
| `can you` / `could you` / `would you` | `can you calculate 2+2` → `calculate 2+2` |
| `will you` / `do you` / `does` | `will you find 5*3` → `find 5*3` |
| `what would be` / `what will be` / `what was` | `what would be 10+5` → `10+5` |
| `i need` / `i want` / `i'd like` / `i would like` | `i need to add 2+2` → `add 2+2` |
| `we need` / `we want` | `we need 5*10` → `5*10` |
| `lets` / `let's` / `let us` | `let's calculate 5+3` → `calculate 5+3` |
| `determine` | `determine 2^10` → `2^10` |
| `what does X equal` / `what is X equal to` | `what does 2+2 equal` → `2+2` |
| `i` (stray) | `i 5+3` → `5+3` |
| `we` (stray) | `we 5+3` → `5+3` |
| `you` (stray) | `you 5+3` → `5+3` |
| `my` (stray) | `my 5+3` → `5+3` |
| `your` (stray) | `your 5+3` → `5+3` |
| `the` (already present but strengthen) | |
| Capitalization normalization | Not needed — all prefixes use `(?i)` |

#### 1b. Expanded "trailing fluff" stripping (step 2)

| Pattern | Strips |
|---------|--------|
| `for me` / `for us` | `2+2 for me` → `2+2` |
| `if you don't mind` | `2+2 if you don't mind` → `2+2` |
| `if possible` / `if you can` | `2+2 if possible` → `2+2` |
| `quickly` / `real quick` | `2+2 quickly` → `2+2` |
| `right now` / `now` | `2+2 right now` → `2+2` |
| `today` | `2+2 today` → `2+2` (careful: conflicts with date) |
| `exactly` / `approximately` (precision modifiers) | `2+2 exactly` → `2+2` |

#### 1c. Expanded trailing "age" patterns (step 2, already partially done)

| Pattern | Strips |
|---------|--------|
| `years of age` (already) | `25 years of age` → `25` |
| `years old` (already) | `25 years old` → `25` |
| `yrs old` / `yr old` | `25 yrs old` → `25` |
| `year old` | `25 year old` → `25` |
| `of age` | `25 of age` → `25` |

---

### Phase 2 — Expanded word & operator patterns

#### 2a. Expanded word operators (step 15)

Add more natural phrasings for each operator:

**Addition** (new patterns):
| Pattern | Replaces |
|---------|----------|
| `added to` (already phrase-level, make word-level too) | `5 added to 10` is handled; add `add` as operator `5 add 3` |
| `sum` (as infix) | `5 sum 3` → `5 + 3` |
| `sum of` (already phrase-level) | |
| `total` | `5 total 3` → `5 + 3` |
| `combined with` | `5 combined with 3` → `5 + 3` |
| `together with` | `5 together with 3` → `5 + 3` |
| `along with` | `5 along with 3` → `5 + 3` |
| `in addition to` | `5 in addition to 3` → `5 + 3` |

**Subtraction** (new patterns):
| Pattern | Replaces |
|---------|----------|
| `subtract` (as infix) | `5 subtract 3` → `5 - 3` |
| `take` (short for take away) | `5 take 3` → `5 - 3` |
| `without` | `5 without 3` → `5 - 3` |
| `minus` (already) | |
| `less` (already) | |
| `decreased by` (already phrase-level before word ops) | |
| `reduced by` (already) | |

**Multiplication** (new patterns):
| Pattern | Replaces |
|---------|----------|
| `multiply` (as infix) | `5 multiply 3` → `5 * 3` |
| `times` (already) | |
| `multiplied by` (already) | |
| `product of` (already phrase-level) | |
| `of` (in certain contexts, like `3 of 5`) | handled elsewhere |
| `by` (in `5 by 10` — already as dimension) | |
| `lots of` | `3 lots of 5` → `3 * 5` |
| `sets of` | `3 sets of 5` → `3 * 5` |

**Division** (new patterns):
| Pattern | Replaces |
|---------|----------|
| `divide` (as infix) | `5 divide 3` → `5 / 3` |
| `divided by` (already) | |
| `split into` (already) | |
| `split between` / `split among` | `10 split between 2` → `10 / 2` |
| `shared between` / `shared among` | `10 shared between 2` → `10 / 2` |
| `per` (already) | |
| `over` (already phrase-level) | |
| `out of` (already phrase-level) | |

**Power** (new patterns):
| Pattern | Replaces |
|---------|----------|
| `to the power of` (already) | |
| `raised to` (already) | |
| `raised to the power of` | `5 raised to the power of 3` → `5 ^ 3` |
| `to the X` | `5 to the 3` → `5 ^ 3` |
| `to the Xth power` | `5 to the 3rd power` → `5 ^ 3` |
| `power X` | `5 power 3` → `5 ^ 3` |
| `exponent X` | `5 exponent 3` → `5 ^ 3` |
| `X to the Y` | `3 to the 4` → `3 ^ 4` |

#### 2b. Expanded comparison phrases (step 13)

| Pattern | Replaces | Example |
|---------|----------|---------|
| `half as much as` / `half as many as` | `$2 * 0.5` | `half as much as 10` → `5` |
| `quarter as much as` | `$2 * 0.25` | `quarter as much as 20` → `5` |
| `X as much as Y` | `Y` (identity) | `as much as 10` → `10` |
| `X times what Y` / `X times Y` (division) | `Y / X` | `3 times what 15` → `5` |
| `what times X equals Y` | `Y / X` | `what times 5 equals 20` → `4` |
| `how many X in Y` | `Y / X` | `how many 5 in 20` → `4` |

#### 2c. Expanded natural functions (step 14)

| Pattern | Replaces |
|---------|----------|
| `the square root of X` (with article) | `sqrt(X)` |
| `the cube root of X` | `cbrt(X)` |
| `the absolute value of X` | `abs(X)` |
| `sine of X` / `cosine of X` / `tangent of X` | `sin(X)` / `cos(X)` / `tan(X)` |
| `sin of X` / `cos of X` / `tan of X` | `sin(X)` / `cos(X)` / `tan(X)` (already via trigArgPattern) |
| `sin X` (already via trigArgPattern) | `sin(X)` |
| `arcsin of X` / `arccos of X` / `arctan of X` | `asin(X)` / `acos(X)` / `atan(X)` |
| `natural log of X` / `log of X` / `ln of X` | `ln(X)` |
| `log base 10 of X` (already via logBasePattern) | `log10(X)` |
| `log of X base Y` (reordered) | `(ln(X) / ln(Y))` |
| `square X` | `X ^ 2` |
| `cube X` | `X ^ 3` |
| `double X` (already via doublePrefixPattern) | `2 * X` |
| `triple X` (already via triplePrefixPattern) | `3 * X` |
| `half of X` (already via halfOfPattern) | `0.5 * X` |

#### 2d. Expanded context references (step 10)

| Pattern | Replaces with |
|---------|---------------|
| `previous` / `prev` / `previous result` | lastResult |
| `last` / `last result` / `last answer` | lastResult |
| `prior` / `prior result` / `prior answer` | lastResult |
| `it` (standalone, already done) | lastResult |
| `of it` (standalone, already done) | lastResult |
| `that` / `of that` (already) | |
| `the result` / `the answer` (already via resultPattern) | |
| `the previous value` / `the last value` | lastResult |

---

### Phase 3 — Expanded date & time patterns

#### 3a. Single-pass date extraction

Currently date math is done 2× before naturalize + 1× after. Consider consolidating
to avoid confusion. But keep for backward compat.

#### 3b. Expanded date phrasings (for extractDateMath)

| Pattern | Example |
|---------|---------|
| `in N days/weeks/months/years` | `in 2 weeks` → date |
| `what is the date in N days` | `what is the date in 2 weeks` → date |
| `what date is N days from now` | `what date is 2 weeks from now` → date |
| `N days from DATE` (reordered) | `14 days from March 1` → date |
| `N days before today` | `7 days before today` → date |
| `N days after today` | `3 days after today` → date |
| `next Mon/Tue/Wed/...` | `next Monday` → date |
| `this Mon/Tue/Wed/...` | `this Friday` → date |
| `last Mon/Tue/Wed/...` | `last Monday` → date |

#### 3c. Expanded relative date patterns (computeDateMath)

| Pattern | Example |
|---------|---------|
| `next week/month/year` (already) | |
| `last week/month/year` (already) | |
| `coming week/month/year` | `coming week` → `next week` |
| `this week/month/year` | `this week` → current week range |
| `previous week/month/year` | `previous month` → `last month` |
| `following week/month/year` | `following week` → `next week` |
| `in the next N days/weeks/months/years` | `in the next 2 weeks` → date |
| `in the past N days/weeks/months/years` | `in the past 3 months` → date |
| `over the next N days` | `over the next 7 days` → date |

---

### Phase 4 — Expanded percentage & finance patterns

#### 4a. Natural percentage phrases

| Pattern | Example | Translation |
|---------|---------|-------------|
| `X per cent` (already via perCentPattern) | `10 per cent of 200` → `20` | |
| `X pct` / `X p.c.` | `10 pct of 200` → `20` | strip `pct` → `%` |
| `X %` (already) | | |
| `X percent of` (already) | | |
| `what percentage of Y is X` | `what percentage of 50 is 10` → `20` | same as `X is what % of Y` |
| `what percent of Y is X` | `what percent of 50 is 10` → `20` | |
| `how many percent of Y is X` | `how many percent of 50 is 10` → `20` | |
| `X out of Y as percentage` | `10 out of 50 as percentage` → `20` | |
| `X/Y as percentage` | `10/50 as percentage` → `20` | |
| `X as % of Y` | `10 as % of 50` → `20` | |

#### 4b. Tip/discount phrasing

| Pattern | Example | Translation |
|---------|---------|-------------|
| `X plus Y% tip` | `40 plus 15% tip` → `46` | `40 + 40*15/100` |
| `X with Y% tip` | `40 with 15% tip` → `46` | |
| `X plus Y% tax` | `100 plus 8% tax` → `108` | |
| `X with Y% tax` | `100 with 8% tax` → `108` | |
| `X minus Y% discount` | `200 minus 10% discount` → `180` | |
| `X after Y% discount` | `200 after 10% discount` → `180` | |
| `X less Y%` (already via percentLessThanPattern but phrased differently) | | |

---

### Phase 5 — Expanded noise-word & filler handling

#### 5a. Mid-expression noise words (strip before or during pipeline)

These words, when found inside an expression, should be stripped:

| Noise words | Example |
|-------------|---------|
| `exactly` | `5 exactly plus 3` → `5 plus 3` |
| `roughly` / `about` / `around` / `approximately` | `about 5 plus 3` → `5 plus 3` |
| `equal` / `equals` / `equal to` | `5 equals 5` → `5 = 5` (or strip) |
| `the` (mid-sentence) | `5 times the 3` → `5 times 3` |
| `a` / `an` (mid-sentence) | `5 times a 3` → `5 times 3` |
| `like` | `5 like plus 3` → `5 plus 3` |
| `say` | `say 5 plus 3` → `5 plus 3` |
| `e.g.` / `eg` | `eg 5 plus 3` → `5 plus 3` |
| `i.e.` / `ie` | `ie 5 plus 3` → `5 plus 3` |
| `e.g.` with number | `e.g. 5` → `5` |

#### 5b. Sentence-frame noise stripping (before pipeline)

| Pattern | Example |
|---------|---------|
| `i think` | `i think 5 plus 3` → `5 plus 3` |
| `i guess` | `i guess 5 plus 3` → `5 plus 3` |
| `maybe` | `maybe 5 plus 3` → `5 plus 3` |
| `perhaps` | `perhaps 5 plus 3` → `5 plus 3` |
| `probably` | `probably 5 plus 3` → `5 plus 3` |
| `so` | `so 5 plus 3` → `5 plus 3` |
| `well` | `well 5 plus 3` → `5 plus 3` |
| `ok` / `okay` | `ok 5 plus 3` → `5 plus 3` |
| `alright` / `all right` | `alright 5 plus 3` → `5 plus 3` |
| `right` | `right 5 plus 3` → `5 plus 3` |
| `now` (conversational) | `now 5 plus 3` → `5 plus 3` |
| `so then` | `so then 5 plus 3` → `5 plus 3` |
| `ok so` | `ok so 5 plus 3` → `5 plus 3` |

---

### Phase 6 — Shared reference / line-label patterns

#### 6a. Line references ("line 3 from above")

Allow referring to previous line results by line number or label.

| Pattern | Example |
|---------|---------|
| `line N` | `line 3` → history entry 3's result |
| `line N result` | `line 3 result` → history entry 3's result |
| `result from line N` | `result from line 3` → history entry 3's result |
| `#N` | `#3` → history entry 3's result |
| `above` | `above` → history entry -2's result (if available) |
| `below` | `below` → ambiguous, skip |

#### 6b. Named result references

| Pattern | Example |
|---------|---------|
| `label: expression` (already support label lines, skip) | `total: 5+3` → result is labeled |
| `the label` | `the total` → find label "total" in history |
| `label result` | `total result` → same |

---

### Phase 7 — Pattern organization & test improvements

#### 7a. Organize patterns into logical groups

Currently all patterns are `var` declarations at package level. Keep them as `var` but
add section headers/comments to make the file more navigable. The current organization
is already decent.

#### 7b. Test organization

Add test functions following naming convention:
- `TestNaturalize<Feature>` for naturalize-specific tests
- `TestHandle<Feature>` for sub-functions
- `TestEvaluateLine_<Feature>` for end-to-end tests

Current test file has good coverage but many patterns are untested. Add tests for
every pattern.

---

## Implementation Order (execution)

```
Phase 0: normalize() preprocessing ───────────────────────── [✓ COMPLETE]
   0a  Unicode normalization (quotes, dashes, brackets, spaces)           ✓
   0b  Punctuation normalization (multiple punct, trailing)               ✓
   0c  Write normalize() and call at start of naturalize()                ✓
   0d  Tests for all normalization cases                                  ✓

Phase 1: Prefix/suffix expansion ──────────────────────────── [✓ COMPLETE]
   1a  Expanded conversational prefixes                                   ✓
   1b  Expanded trailing fluff                                            ✓
   1c  Expanded age trailing patterns                                     ✓
   1d  Tests for all new prefix/suffix patterns                           ✓

Phase 2: Word operator expansion ──────────────────────────── [✓ COMPLETE]
   2a  Additional addition word patterns                                  ✓
   2b  Additional subtraction word patterns                               ✓
   2c  Additional multiplication word patterns                            ✓
   2d  Additional division word patterns                                  ✓
   2e  Additional power word patterns                                     ✓
   2f  Expanded comparison phrases (half as many, times what, etc.)       ✓
   2g  Expanded natural functions (sine of, log of, square X, etc.)      ✓
   2h  Expanded context references (prev, last, prior)                    ✓
   2i  Tests for all new operator/function/context patterns               ✓

Phase 3: Date/time pattern expansion ──────────────────────── [✓ COMPLETE]
   3a  "in N days/weeks" pattern                                          ✓
   3b  "what is the date in N days" pattern                               ✓
   3c  "N days from DATE" reordered pattern                               ✓
   3d  "next/last Monday" patterns                                        ✓
   3e  Tests for all new date patterns                                    ✓

Phase 4: Percentage & finance patterns ────────────────────── [✓ COMPLETE]
   4a  pct/p.c. abbreviation, "what % of Y is X" rephrase                ✓
   4b  Tip/discount natural phrasing                                      ✓
   4c  Tests for all new percentage patterns                              ✓

Phase 5: Noise word filtering ─────────────────────────────── [✓ COMPLETE]
   5a  Mid-expression noise words (exactly, roughly, about)               ✓
   5b  Sentence-frame noise words (i think, maybe, perhaps)              ✓
   5c  Tests for noise word handling                                      ✓

Phase 6: Line reference patterns ──────────────────────────── [ ] NOT STARTED
   6a  Line number references (line 3, #3)                               
   6b  Named result references                                           
   6c  Tests for reference patterns                                      

Phase 7: Documentation updates ────────────────────────────── [✓ COMPLETE]
   7a  Update calculator-engine.md pipeline table                         ✓
   7b  Update user-guide.md with new features                             ✓
   7c  Update CHANGELOG.md                                                ✓
```

## Backward Compatibility Rules

1. Every existing test must pass unchanged
2. Every existing pattern must still match identically
3. New patterns must not conflict with existing ones (order in pipeline is critical)
4. New patterns must use `(?i)` for case insensitivity (matching existing convention)
5. Variables, constants, history, and error handling unchanged
6. Performance: no regex should backtrack catastrophically; test with pathological inputs

## Research Notes

Natural writing patterns observed in real usage:
- People type calculations as sentences: "what is 25 times 3 plus 10"
- People use filler words: "so like 5 plus 3 i guess" 
- People use abbreviations: "pct", "yrs", "hrs", "mins"
- People write dates vaguely: "2 weeks from now", "in 3 days", "next Monday"
- People use reordered words: "log of 8 base 2" vs "log base 2 of 8"
- People reference previous results: "that times 2", "double that"
- People use conversational openings: "can you calculate", "hey what's"
- People type amounts with words: "fifty thousand", "half a million"
- People mix digits and words: "5 thousand", "3 million"
- People use "of" for multiplication in context: "3 groups of 5"
- People use "per" for division: "100 km per hour" (but this conflicts with unit conversion)
