package calculator

import (
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"
)

// Engine evaluates natural-language arithmetic expressions.
// It maintains a variable store, computation history, and last-result context.
type Engine struct {
	variables  map[string]float64
	lastResult float64
	history    []HistoryEntry
}

// HistoryEntry records a single evaluated input and its output.
type HistoryEntry struct {
	Input  string `json:"input"`
	Output string `json:"output"`
}

// NewEngine creates a new Engine with an empty variable store.
func NewEngine() *Engine {
	return &Engine{
		variables: make(map[string]float64),
	}
}

// GetHistory returns a copy of the computation history.
func (e *Engine) GetHistory() []HistoryEntry {
	r := make([]HistoryEntry, len(e.history))
	copy(r, e.history)
	return r
}

// ClearHistory clears all stored history entries.
func (e *Engine) ClearHistory() {
	e.history = nil
}

// --- Line evaluation ---

const maxInputLength = 10000

// EvaluateLine evaluates a single line of natural-language arithmetic.
// Returns the result string (or "" on failure) and an error.
// Empty lines, comment lines (#, //), and label lines (ending with :) return empty strings.
func (e *Engine) EvaluateLine(input string) (string, error) {
	s := strings.TrimSpace(input)
	if s == "" || strings.HasPrefix(s, "#") || strings.HasPrefix(s, "//") || strings.HasSuffix(s, ":") {
		return "", nil
	}
	if len(s) > maxInputLength {
		return "", fmt.Errorf("input too long (max %d characters)", maxInputLength)
	}

	// Variable assignment: x = 5
	if strings.Contains(s, "=") && !strings.Contains(s, "==") {
		parts := strings.SplitN(s, "=", 2)
		name := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		if isIdentifier(name) {
			r, err := e.evaluateExpr(val)
			if err != nil {
				return "", nil
			}
			n, err := strconv.ParseFloat(r, 64)
			if err == nil {
				e.variables[name] = n
				e.lastResult = n
			}
			return fmt.Sprintf("%s = %s", name, r), nil
		}
	}

	r, err := e.evaluateExpr(s)
	if err != nil {
		return "", nil
	}
	n, _ := strconv.ParseFloat(r, 64)
	e.lastResult = n
	e.history = append(e.history, HistoryEntry{Input: s, Output: r})
	return r, nil
}

// EvaluateAll evaluates each line of a multi-line input string.
// Returns one result string per line. Variables persist across lines.
func (e *Engine) EvaluateAll(input string) []string {
	lines := strings.Split(input, "\n")
	results := make([]string, len(lines))
	e.lastResult = 0
	for i, line := range lines {
		res, _ := e.EvaluateLine(line)
		results[i] = res
	}
	return results
}

func (e *Engine) evaluateExpr(input string) (string, error) {
	raw := strings.TrimSpace(input)

	// Date math (before naturalize to preserve date keywords)
	if result := computeDateMath(raw); result != raw {
		return result, nil
	}

	s := e.naturalize(raw)

	// Date math again after naturalize (handles "what is next week" → "next week")
	if result := computeDateMath(s); result != s {
		return result, nil
	}
	// Fallback: extract date patterns embedded anywhere in the string
	if result := extractDateMath(s); result != s {
		return result, nil
	}

	// Age computation ("born in YYYY", "born YYYY")
	if result := computeAge(s); result != s {
		return result, nil
	}

	// "convert X to Y" / "change X to Y" unit conversion
	{
		convertMatch := regexp.MustCompile(`(?i)^(?:convert|change)\s+(.+)\s+to\s+(.+)$`).FindStringSubmatch(s)
		if convertMatch != nil {
			// Re-parse as "X in Y"
			if m := unitConvPattern.FindStringSubmatch(convertMatch[1] + " in " + convertMatch[2]); m != nil {
				val, err := strconv.ParseFloat(m[1], 64)
				if err == nil {
					return convertUnit(val, m[2], m[3]), nil
				}
			}
		}
	}

	// "X in Y" unit conversion
	if match := unitConvPattern.FindStringSubmatch(s); match != nil {
		val, err := strconv.ParseFloat(match[1], 64)
		if err != nil {
			return "", fmt.Errorf("invalid number: %s", match[1])
		}
		from := strings.TrimSpace(match[2])
		to := strings.TrimSpace(match[3])
		// If from-unit is empty and to is a known currency, default from to USD
		if from == "" {
			if _, ok := unitDB[strings.ToLower(to)]; ok {
				from = "usd"
			}
		}
		return convertUnit(val, from, to), nil
	}

	// "X% of Y"
	if match := percentOfPattern.FindStringSubmatch(s); match != nil {
		pct, err := strconv.ParseFloat(match[1], 64)
		if err != nil {
			return "", fmt.Errorf("invalid percentage: %s", match[1])
		}
		val, err := strconv.ParseFloat(match[2], 64)
		if err != nil {
			return "", fmt.Errorf("invalid number: %s", match[2])
		}
		return formatNumber(pct / 100 * val), nil
	}

	// "X + Y%" or "X - Y%"
	if match := percentAddPattern.FindStringSubmatch(s); match != nil {
		base, err := strconv.ParseFloat(match[1], 64)
		if err != nil {
			return "", fmt.Errorf("invalid number: %s", match[1])
		}
		pct, err := strconv.ParseFloat(match[3], 64)
		if err != nil {
			return "", fmt.Errorf("invalid percentage: %s", match[3])
		}
		if match[2] == "+" {
			return formatNumber(base + base*pct/100), nil
		}
		return formatNumber(base - base*pct/100), nil
	}

	result, err := e.parseExpr(s)
	if err != nil {
		return "", err
	}
	return formatNumber(result), nil
}

// --- Natural language pipeline ---

func evalFraction(match string) string {
	parts := strings.Fields(match)
	if len(parts) < 2 {
		return match
	}
	nums := strings.ToLower(parts[0])
	denom := strings.ToLower(parts[len(parts)-1])
	val := 0.0
	switch nums {
	case "one", "a":
		val = 1
	case "two":
		val = 2
	case "three":
		val = 3
	}
	switch denom {
	case "half":
		val /= 2
	case "third", "thirds":
		val /= 3
	case "quarter", "quarters", "fourth", "fourths":
		val /= 4
	}
	return fmt.Sprintf("%g", val)
}

func (e *Engine) naturalize(s string) string {
	// 1. Strip leading query prefixes (run multiple times for compound prefixes)
	for {
		prev := s
		s = greetingPattern.ReplaceAllString(s, "")
		s = prefixPattern.ReplaceAllString(s, "")
		s = leadingArticlePattern.ReplaceAllString(s, "")
		s = leadingAddSumPattern.ReplaceAllString(s, "")
		s = iAmPattern.ReplaceAllString(s, "")
		s = showMePattern.ReplaceAllString(s, "")
		s = tellMePattern.ReplaceAllString(s, "")
		s = myAgeIsPattern.ReplaceAllString(s, "")
		s = goingPattern.ReplaceAllString(s, "")
		s = therePattern.ReplaceAllString(s, "")
		s = onAtInPattern.ReplaceAllString(s, "")
		s = areaVolumeOfPattern.ReplaceAllString(s, "")
		s = genericNounPattern.ReplaceAllString(s, "")
		if s == prev {
			break
		}
	}
	// 2. Strip trailing fluff
	s = trailingFluffPattern.ReplaceAllString(s, "")
	s = trailingMyAgePattern.ReplaceAllString(s, "")
	s = trailingYearsOldPattern.ReplaceAllString(s, "")
	s = trailingYearsOfAgePattern.ReplaceAllString(s, "")
	// 2b. Strip trailing punctuation early (before wordsToNumbers so "one?" → "one")
	s = trailingQMPattern.ReplaceAllString(s, "")
	s = trailingPeriodPattern.ReplaceAllString(s, "")
	// 3. Convert mixed currencies (or strip if single currency)
	s = convertCurrencies(s)
	// 3b. Compact time notation ("2h30m", "90m", "2h")
	s = timeCompactPattern.ReplaceAllStringFunc(s, func(m string) string {
		parts := timeCompactPattern.FindStringSubmatch(m)
		if len(parts) < 3 {
			return m
		}
		mins := parts[2]
		if mins == "" {
			return parts[1]
		}
		return fmt.Sprintf("(%s + %s/60.0)", parts[1], mins)
	})
	// 4. Replace fraction words with decimals
	s = fractionPattern.ReplaceAllStringFunc(s, evalFraction)
	// 5. Replace word numbers with digits
	s = wordsToNumbers(s)
	// 6. Strip ordinal suffixes ("1st", "2nd", "3rd", "4th" → "1", "2", "3", "4")
	s = ordinalPattern.ReplaceAllString(s, "$1")
	// 7. "how many times" (before SI expansion so "5k" works)
	s = howManyTimesPattern.ReplaceAllString(s, "$2 / $1")
	// 8. Expand SI notation ("5k", "3M", "2B" → "(5 * 1000)", "(3 * 1000000)", "(2 * 1000000000)")
	s = expandSINotation(s)
	// 8b. Mixed numbers ("2 1/2" → "2 + 1/2")
	s = mixedNumberPattern.ReplaceAllString(s, "$1 + ($2/$3)")
	// 9. Expand possessive plurals ("3 tens" → "(3 * 10)", "2 dozens" → "(2 * 12)")
	s = expandPossessivePlural(s)
	// 9b. "half NUMBER" → "0.5 * NUMBER" (from "half a million" → wordsToNumbers → "half 1000000")
	s = halfNumericPattern.ReplaceAllString(s, "0.5 * $1")
	// 10. Replace "that" / "then" / "result" context references
	s = e.substituteContext(s)
	// 11. Multiplicative prefixes
	s = doublePrefixPattern.ReplaceAllString(s, "2 * $1")
	s = triplePrefixPattern.ReplaceAllString(s, "3 * $1")
	s = halfOfPattern.ReplaceAllString(s, "0.5 * $1")
	s = quarterOfPattern.ReplaceAllString(s, "0.25 * $1")
	// 12. Power words
	s = squaredPattern.ReplaceAllString(s, "$1 ^ 2")
	s = cubedPattern.ReplaceAllString(s, "$1 ^ 3")
	// 12b. "X times more than Y" → "Y + Y * X"
	s = timesMoreThanPattern.ReplaceAllString(s, "$2 + $2 * $1")
	// 12c. "X times as much as Y" → "Y * X"
	s = timesAsMuchAsPattern.ReplaceAllString(s, "$2 * $1")
	// 12d. "X% more than Y" → "Y + Y * X / 100"
	s = percentMoreThanPattern.ReplaceAllString(s, "$2 + $2 * $1 / 100")
	s = percentLessThanPattern.ReplaceAllString(s, "$2 - $2 * $1 / 100")
	// 12e. "X added to Y" → "Y + X"
	s = addedToPattern.ReplaceAllString(s, "$2 + $1")
	// 13. Complex phrase patterns (before word operators)
	s = increasedByPattern.ReplaceAllString(s, "$1 + $2")
	s = decreasedByPattern.ReplaceAllString(s, "$1 - $2")
	s = moreThanPattern.ReplaceAllString(s, "$2 + $1")
	s = lessThanPattern.ReplaceAllString(s, "$2 - $1")
	s = differencePattern.ReplaceAllString(s, "abs($1 - $2)")
	s = overDivPattern.ReplaceAllString(s, "$1 / $2")
	s = outOfPattern.ReplaceAllString(s, "$1 / $2")
	s = outOfEveryPattern.ReplaceAllString(s, "$1 / $2")
	s = ratioOfPattern.ReplaceAllString(s, "$1 / $2")
	s = productOfPattern.ReplaceAllString(s, "$1 * $2")
	s = sumOfPattern.ReplaceAllString(s, "$1 + $2")
	// 13b. Shape area/volume/dimension patterns
	s = rectAreaPattern.ReplaceAllString(s, "$1 * $2")
	s = circleAreaPattern.ReplaceAllString(s, "pi * $1^2")
	s = circleCircumPattern.ReplaceAllString(s, "2 * pi * $1")
	s = cubeVolumePattern.ReplaceAllString(s, "$1^3")
	s = cylinderVolumePattern.ReplaceAllString(s, "pi * $1^2 * $2")
	s = sphereVolumePattern.ReplaceAllString(s, "(4/3) * pi * $1^3")
	s = byDimensionPattern.ReplaceAllString(s, "($1 * $2)")
	s = xMultiplyPattern.ReplaceAllString(s, "($1 * $2)")
	// 14. Natural function call patterns
	s = squareRootOfPattern.ReplaceAllString(s, "sqrt($1)")
	s = cubeRootOfPattern.ReplaceAllString(s, "cbrt($1)")
	s = absoluteValueOfPattern.ReplaceAllString(s, "abs($1)")
	// 14c. "per cent" → "percent" (must be before word operators where "per" → "/")
	s = perCentPattern.ReplaceAllString(s, "$1 percent ")
	// 15. Replace word operators
	s = additionOps.ReplaceAllString(s, " + ")
	s = additionOps2.ReplaceAllString(s, " + ")
	s = subtractionOps.ReplaceAllString(s, " - ")
	s = subtractionOps2.ReplaceAllString(s, " - ")
	s = subtractionOps3.ReplaceAllString(s, " - ")
	s = multiplyOps.ReplaceAllString(s, " * ")
	s = multiplyOps2.ReplaceAllString(s, " * ")
	s = divideOps.ReplaceAllString(s, " / ")
	s = divideOps2.ReplaceAllString(s, " / ")
	s = divideOps3.ReplaceAllString(s, " / ")
	s = powerOps.ReplaceAllString(s, " ^ ")
	s = modOps.ReplaceAllString(s, " % ")
	// 16. "X from Y" → "Y - X" (after word operators to avoid conflicting with subtract phrases)
	s = fromSubtractPattern.ReplaceAllString(s, "$2 - $1")
	// 17. Percentage relationship phrases (after word operators, before % word)
	s = isWhatPercentOfPattern.ReplaceAllString(s, "(($1 / $2) * 100)")
	s = asAPercentageOfPattern.ReplaceAllString(s, "(($1 / $2) * 100)")
	s = percentOfWhatIsPattern.ReplaceAllString(s, "(($2 / $1) * 100)")
	// 18. Advanced math phrases
	s = logBasePattern.ReplaceAllString(s, "(ln($2) / ln($1))")
	s = choosePattern.ReplaceAllString(s, "nCr($1, $2)")
	// 18b. Function with unparenthesized arg: "sin theta" → "sin(theta)"
	s = trigArgPattern.ReplaceAllString(s, "$1($2)")
	// 19. "percent" word
	s = percentWordPattern.ReplaceAllString(s, "$1% ")
	// 20. Commas in numbers
	s = commaPattern.ReplaceAllString(s, "$1$2")
	// 21. Collapse multiple spaces
	s = spacesPattern.ReplaceAllString(s, " ")
	return strings.TrimSpace(s)
}

func (e *Engine) substituteContext(s string) string {
	if e.lastResult == 0 {
		return s
	}
	lastStr := formatNumber(e.lastResult)

	// Entire line is "that", "it", "of that", "my age", "my current age" → lastResult
	trimmed := strings.TrimSpace(s)
	if matched, _ := regexp.MatchString(`(?i)^(?:of\s+)?(?:that|it|my\s+(?:current\s+)?age)$`, trimmed); matched {
		return lastStr
	}

	// "of that", "of it", "of the result" → replace with lastResult value
	s = thatOfPattern.ReplaceAllString(s, lastStr)
	// "then X" → "{lastResult} X"
	if thenPattern.MatchString(s) {
		s = thenPattern.ReplaceAllString(s, lastStr+" ")
	}
	// "result X" or "answer X" → "{lastResult} X"
	if resultPattern.MatchString(s) {
		s = resultPattern.ReplaceAllString(s, lastStr+" ")
	}
	return s
}

// --- Word-to-number conversion ---

var wordNumMap = map[string]float64{
	"zero":      0,
	"one":       1,
	"two":       2,
	"three":     3,
	"four":      4,
	"five":      5,
	"six":       6,
	"seven":     7,
	"eight":     8,
	"nine":      9,
	"ten":       10,
	"eleven":    11,
	"twelve":    12,
	"thirteen":  13,
	"fourteen":  14,
	"fifteen":   15,
	"sixteen":   16,
	"seventeen": 17,
	"eighteen":  18,
	"nineteen":  19,
	"twenty":    20,
	"thirty":    30,
	"forty":     40,
	"fifty":     50,
	"sixty":     60,
	"seventy":   70,
	"eighty":    80,
	"ninety":    90,
	"hundred":   100,
	"thousand":  1000,
	"million":   1000000,
	"billion":   1000000000,
	"couple":    2,
	"dozen":     12,
	"score":     20,
}

func expandPossessivePlural(s string) string {
	pluralVals := map[string]float64{
		"tens":      10,
		"hundreds":  100,
		"thousands": 1000,
		"millions":  1000000,
		"billions":  1000000000,
		"dozens":    12,
		"scores":    20,
	}
	return possessivePluralPattern.ReplaceAllStringFunc(s, func(m string) string {
		parts := possessivePluralPattern.FindStringSubmatch(m)
		if len(parts) < 3 {
			return m
		}
		val, ok := pluralVals[strings.ToLower(parts[2])]
		if !ok {
			return m
		}
		return fmt.Sprintf("(%s * %g)", parts[1], val)
	})
}

func expandSINotation(s string) string {
	return siPattern.ReplaceAllStringFunc(s, func(m string) string {
		parts := siPattern.FindStringSubmatch(m)
		if len(parts) < 3 {
			return m
		}
		num := parts[1]
		suffix := strings.ToUpper(parts[2])
		var mult float64
		switch suffix {
		case "K":
			mult = 1000
		case "M":
			mult = 1000000
		case "B":
			mult = 1000000000
		case "T":
			mult = 1000000000000
		default:
			return m
		}
		val, _ := strconv.ParseFloat(num, 64)
		return strconv.FormatFloat(val*mult, 'f', -1, 64)
	})
}

func wordsToNumbers(s string) string {
	// Expand hyphenated number words: "twenty-one" → ["twenty", "one"]
	raw := strings.Fields(s)
	fields := make([]string, 0, len(raw))
	for _, f := range raw {
		if strings.Contains(f, "-") {
			parts := strings.Split(f, "-")
			allNum := true
			for _, p := range parts {
				if _, ok := wordNumMap[strings.ToLower(strings.TrimRight(p, ","))]; !ok {
					allNum = false
					break
				}
			}
			if allNum {
				fields = append(fields, parts...)
			} else {
				fields = append(fields, f)
			}
		} else {
			fields = append(fields, f)
		}
	}
	if len(fields) == 0 {
		return s
	}

	var result []string
	i := 0
	for i < len(fields) {
		end := findNumberPhrase(fields, i)
		if end > i {
			val := evalNumberPhrase(fields[i:end])
			result = append(result, formatNumber(val))
			i = end
		} else {
			result = append(result, fields[i])
			i++
		}
	}
	return strings.Join(result, " ")
}

func findNumberPhrase(fields []string, start int) int {
	end := start
	for end < len(fields) {
		w := strings.ToLower(strings.TrimRight(fields[end], ","))
		if _, ok := wordNumMap[w]; ok || w == "and" || w == "a" {
			end++
		} else {
			break
		}
	}
	for j := start; j < end; j++ {
		w := strings.ToLower(strings.TrimRight(fields[j], ","))
		if w == "hundred" || w == "thousand" || w == "million" || w == "billion" {
			if j == start {
				return start + 1
			}
			return end
		}
		if _, ok := wordNumMap[w]; ok {
			return end
		}
	}
	return start
}

func evalNumberPhrase(words []string) float64 {
	total := 0.0
	current := 0.0
	aFlag := false
	for _, w := range words {
		w = strings.ToLower(strings.TrimRight(w, ","))
		if w == "and" || w == "" {
			continue
		}
		if w == "a" {
			current = 1
			aFlag = true
			continue
		}
		val, ok := wordNumMap[w]
		if !ok {
			continue
		}
		if aFlag {
			current *= val
			aFlag = false
		} else if val >= 100 {
			if current == 0 {
				current = 1
			}
			current *= val
		} else {
			current += val
		}
		if val >= 1000 {
			total += current
			current = 0
		}
	}
	total += current
	return total
}

// --- Regex patterns ---

var prefixPattern = regexp.MustCompile(`(?i)^(?:what\s+(?:is|'s|are)|calculate|compute|find|solve|value\s+of|eval(?:uate)?|result\s+of|how\s+much\s+is|how\s+many\s+is|work\s+out|figure\s+out|give\s+me)\s+`)
var greetingPattern = regexp.MustCompile(`(?i)^(?:hi|hello|hey)(?:\s+there)?\s+`)
var leadingAddSumPattern = regexp.MustCompile(`(?i)^(?:add\b|sum\b(?:\s+of\b)?)\s+`)
var leadingArticlePattern = regexp.MustCompile(`(?i)^(?:the|a|an)\s+`)

// Conversational prefixes for age/self-referencing expressions
var iAmPattern = regexp.MustCompile(`(?i)^(?:i\s+am|i'm|im)\s+`)

// Conversational filler that can wrap date/time expressions
var goingPattern = regexp.MustCompile(`(?i)^going\s+(?:to|on|there)?\s*`)
var therePattern = regexp.MustCompile(`(?i)^(?:there|their|here)\s+`)
var onAtInPattern = regexp.MustCompile(`(?i)^(?:on|at|in|by|from|for|during|this|the)\s+`)
var showMePattern = regexp.MustCompile(`(?i)^show\s+me\s+`)
var tellMePattern = regexp.MustCompile(`(?i)^tell\s+me\s+`)
var myAgeIsPattern = regexp.MustCompile(`(?i)^my\s+age\s+is\s+`)

var trailingFluffPattern = regexp.MustCompile(`(?i)\s+(?:please|thanks|thank you|pls)$`)
var trailingMyAgePattern = regexp.MustCompile(`(?i)\s+(?:my\s+(?:current\s+)?age|show\s+me\s+my\s+(?:current\s+)?age)$`)
var trailingYearsOldPattern = regexp.MustCompile(`(?i)\s+years?\s+old$`)
var trailingYearsOfAgePattern = regexp.MustCompile(`(?i)\s+years?\s+of\s+age$`)

// Context references
var thatOfPattern = regexp.MustCompile(`(?i)\bof\s+(?:that|it|the\s+(?:result|answer|value))\b`)
var thenPattern = regexp.MustCompile(`(?i)^then\s+`)
var resultPattern = regexp.MustCompile(`(?i)^(?:result|answer)\s+`)

// Word operators — ADDITION
var additionOps = regexp.MustCompile(`(?i)\s+plus\s+`)
var additionOps2 = regexp.MustCompile(`(?i)\s+and\s+`)

// Word operators — SUBTRACTION
var subtractionOps = regexp.MustCompile(`(?i)\s+minus\s+`)
var subtractionOps2 = regexp.MustCompile(`(?i)\s+(?:subtract(?:ed)?\s+from|less|reduced\s+by)\s+`)
var subtractionOps3 = regexp.MustCompile(`(?i)\s+take\s+away\s+`)

// Word operators — MULTIPLICATION
var multiplyOps = regexp.MustCompile(`(?i)\s+times\s+`)
var multiplyOps2 = regexp.MustCompile(`(?i)\s+(?:multiplied\s+by|multiply|groups?\s+of)\s+`)

// Word operators — DIVISION
var divideOps = regexp.MustCompile(`(?i)\s+divided\s+by\s+`)
var divideOps2 = regexp.MustCompile(`(?i)\s+split\s+into\s+`)
var divideOps3 = regexp.MustCompile(`(?i)\s+per\s+`)

// Word operators — POWER
var powerOps = regexp.MustCompile(`(?i)\s+(?:to\s+the\s+power\s+of|raised\s+to)\s+`)

// Word operators — MODULO
var modOps = regexp.MustCompile(`(?i)\s+mod(?:ulo)?\s+`)

// Currency symbol → ISO code mapping (used by convertCurrencies)
var currencySymbolToCode = map[string]string{
	"$":  "USD",
	"€":  "EUR",
	"£":  "GBP",
	"¥":  "JPY",
	"₹":  "INR",
	"₽":  "RUB",
	"₩":  "KRW",
	"₪":  "ILS",
	"₫":  "VND",
	"₱":  "PHP",
	"₴":  "UAH",
	"₸":  "KZT",
	"₲":  "PYG",
	"₵":  "GHS",
	"₺":  "TRY",
	"₼":  "AZN",
	"₾":  "GEL",
	"₿":  "BTC",
	"฿":  "THB",
	"₡":  "CRC",
	"₦":  "NGN",
	"₨":  "INR",
	"R$": "BRL",
	"৳":  "BDT",
	"₮":  "MNT",
	"៛":  "KHR",
}

// currencyAnyPattern matches any currency symbol followed by a number anywhere in the string
var currencyAnyPattern = regexp.MustCompile(`(?:R\$|[$€£¥₹₽₩₪₫₱₴₸₲₵₺₼₾₿฿₡₦₨৳₮៛₠])\s*([\d.]+(?:[kKMBT])?)`)

func getCrossRate(fromCode, toCode string) float64 {
	fInfo, fOk := unitDB[strings.ToLower(fromCode)]
	tInfo, tOk := unitDB[strings.ToLower(toCode)]
	if !fOk || !tOk {
		return 1
	}
	return fInfo.toSI / tInfo.toSI
}

func extractCurrencySymbol(full string) string {
	if strings.HasPrefix(full, "R$") {
		return "R$"
	}
	runes := []rune(full)
	return string(runes[0])
}

func convertCurrencies(s string) string {
	type matchInfo struct {
		full   string
		numStr string
		code   string
	}
	submatch := currencyAnyPattern.FindAllStringSubmatch(s, -1)
	if len(submatch) == 0 {
		// Fallback: match currency code prefixes like "BTC5k", "USD5k", "EUR5k"
		// Pattern: <2-5 alpha code><number with optional SI suffix>
		if strings.Contains(s, " in ") || strings.Contains(s, " to ") || strings.Contains(s, " as ") {
			return convertCurrencyCodePrefix(s)
		}
		return s
	}
	matches := make([]matchInfo, len(submatch))
	for i, m := range submatch {
		matches[i].full = m[0]
		matches[i].numStr = strings.TrimSpace(m[1])
		sym := extractCurrencySymbol(m[0])
		matches[i].code = currencySymbolToCode[sym]
		// Only use code if it exists in unitDB
		if _, ok := unitDB[strings.ToLower(matches[i].code)]; !ok {
			matches[i].code = ""
		}
	}

	// Single currency — check if followed by unit conversion
	if len(matches) == 1 {
		if strings.Contains(s, " in ") || strings.Contains(s, " to ") || strings.Contains(s, " as ") {
			// Replace SYM NUM with "NUM CODE" so unit conversion knows the from-unit
			if matches[0].code != "" {
				return strings.Replace(s, matches[0].full, matches[0].numStr+" "+strings.ToLower(matches[0].code), 1)
			}
		}
		// No conversion — just strip symbol
		return strings.Replace(s, matches[0].full, matches[0].numStr, 1)
	}

	// Multiple currencies — convert all to the first one's code
	targetCode := matches[0].code
	idx := 0
	return currencyAnyPattern.ReplaceAllStringFunc(s, func(full string) string {
		mi := matches[idx]
		idx++
		if mi.code == "" || mi.code == targetCode {
			return mi.numStr
		}
		return fmt.Sprintf("(%s * %s)", mi.numStr, formatNumber(getCrossRate(mi.code, targetCode)))
	})
}

// currencyCodePrefixPattern matches a known currency code directly followed by a number
var currencyCodePrefixPattern = regexp.MustCompile(`\b([A-Za-z]{2,5})(\d+(?:\.\d+)?(?:[kKMBT])?)\b`)

// knownCurrencyCodes is the set of currency ISO codes (uppercase 2-5 char names in unitDB)
var knownCurrencyCodes map[string]bool

func init() {
	knownCurrencyCodes = make(map[string]bool)
	for _, entry := range unitDB {
		name := entry.name
		if name != strings.ToUpper(name) {
			continue
		}
		code := strings.ToLower(name)
		if len(code) >= 2 && len(code) <= 5 {
			knownCurrencyCodes[code] = true
		}
	}
}

// Fallback: convert "BTC5k in USD" → "5k btc in USD"
func convertCurrencyCodePrefix(s string) string {
	return currencyCodePrefixPattern.ReplaceAllStringFunc(s, func(full string) string {
		parts := currencyCodePrefixPattern.FindStringSubmatch(full)
		if len(parts) < 3 {
			return full
		}
		code := strings.ToLower(parts[1])
		num := parts[2]
		if !knownCurrencyCodes[code] {
			return full
		}
		return num + " " + code
	})
}

// Ordinal suffix — strip "st", "nd", "rd", "th" after numbers
var ordinalPattern = regexp.MustCompile(`(?i)(\d+)(?:st|nd|rd|th)\b`)

// SI notation — k/K (thousand), M (million), B (billion), T (trillion)
// Case-sensitive: lowercase k is kilo, uppercase M/B/T only (m is not mega)
var siPattern = regexp.MustCompile(`(\d+(?:\.\d+)?)\s*([kK]|[MBT])\b`)

// Collective nouns: "a couple", "a dozen", "a score" → numbers
var aCouplePattern = regexp.MustCompile(`(?i)\bcouple\b`)
var aDozenPattern = regexp.MustCompile(`(?i)\bdozen\b`)
var aScorePattern = regexp.MustCompile(`(?i)\bscore\b`)

// Possessive plural: "3 tens", "2 hundreds", "5 thousands" → "3 * 10", "2 * 100", "5 * 1000"
var possessivePluralPattern = regexp.MustCompile(`(?i)(\d+)\s+(tens|hundreds|thousands|millions|billions|dozens|scores)\b`)

// Mixed number: "2 1/2" → "2 + 1/2"
var mixedNumberPattern = regexp.MustCompile(`\b(\d+)\s+(\d+)/(\d+)\b`)

// "X from Y" → "Y - X"
var fromSubtractPattern = regexp.MustCompile(`(?i)((?:[\d.]+|\([^)]+\)))\s+from\s+((?:[\d.]+|\([^)]+\)))`)

// "X out of every Y" → "X / Y"
var outOfEveryPattern = regexp.MustCompile(`(?i)([\d.]+)\s+out\s+of\s+every\s+([\d.]+)`)

// Phase 2 — Percentage relationship phrases
var isWhatPercentOfPattern = regexp.MustCompile(`(?i)([\d.]+)\s+is\s+what\s+(?:%|percent(?:age)?)\s+of\s+([\d.]+)`)
var asAPercentageOfPattern = regexp.MustCompile(`(?i)([\d.]+)\s+as\s+a\s+percent(?:age)?\s+of\s+([\d.]+)`)
var percentOfWhatIsPattern = regexp.MustCompile(`(?i)([\d.]+)\s*(?:%|percent(?:age)?)\s+of\s+what\s+is\s+([\d.]+)`)

// Phase 3 — Advanced math phrases
var logBasePattern = regexp.MustCompile(`(?i)log\s+base\s+([\d.]+)\s+of\s+([\d.]+)`)
var choosePattern = regexp.MustCompile(`(?i)([\d.]+)\s+choose\s+([\d.]+)`)
var howManyTimesPattern = regexp.MustCompile(`(?i)how\s+many\s+times\s+(?:does\s+)?([\d.]+(?:[kKMBT])?)\s+go\s+(?:into|in)\s+([\d.]+(?:[kKMBT])?)`)

// Compact time notation: "2h30m" → hours with optional minutes
var timeCompactPattern = regexp.MustCompile(`\b(\d+)h(\d*)m?\b`)

// Date math patterns
var monthNames = map[string]time.Month{
	"jan": time.January, "january": time.January,
	"feb": time.February, "february": time.February,
	"mar": time.March, "march": time.March,
	"apr": time.April, "april": time.April,
	"may": time.May,
	"jun": time.June, "june": time.June,
	"jul": time.July, "july": time.July,
	"aug": time.August, "august": time.August,
	"sep": time.September, "september": time.September,
	"oct": time.October, "october": time.October,
	"nov": time.November, "november": time.November,
	"dec": time.December, "december": time.December,
}

var dateMathPattern = regexp.MustCompile(`(?i)^(today|now)\s*([+-])\s*(\d+)\s+(day|days|week|weeks|month|months|year|years)$`)
var todayPattern = regexp.MustCompile(`(?i)^(today|now)$`)
var dateAddPattern = regexp.MustCompile(`(?i)^((?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:[,\s]+\d{4})?))\s*([+-])\s*(\d+)\s+(day|days|week|weeks|month|months|year|years)$`)

func parseDate(s string) (time.Time, bool) {
	s = strings.TrimSpace(s)
	low := strings.ToLower(s)
	switch low {
	case "today":
		now := time.Now()
		return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()), true
	case "now":
		return time.Now(), true
	}
	// Find the longest matching month name
	matchedName := ""
	var matchedMonth time.Month
	for name, m := range monthNames {
		if strings.HasPrefix(low, name) && len(name) > len(matchedName) {
			matchedName = name
			matchedMonth = m
		}
	}
	if matchedName == "" {
		return time.Time{}, false
	}
	rest := strings.TrimSpace(s[len(matchedName):])
	rest = strings.ReplaceAll(rest, ",", "")
	parts := strings.Fields(rest)
	if len(parts) == 0 {
		return time.Time{}, false
	}
	day, err := strconv.Atoi(parts[0])
	if err != nil || day < 1 || day > 31 {
		return time.Time{}, false
	}
	year := time.Now().Year()
	if len(parts) > 1 {
		y, err := strconv.Atoi(parts[1])
		if err == nil && y > 0 {
			year = y
		}
	}
	return time.Date(year, matchedMonth, day, 0, 0, 0, 0, time.Local), true
}

func computeRelativeDate(nStr, unit string) string {
	n, _ := strconv.Atoi(nStr)
	now := time.Now()
	base := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	var result time.Time
	unit = strings.ToLower(unit)
	switch {
	case unit == "week" || strings.HasPrefix(unit, "week"):
		result = base.AddDate(0, 0, n*7)
	case unit == "month" || strings.HasPrefix(unit, "month"):
		result = base.AddDate(0, n, 0)
	case unit == "year" || strings.HasPrefix(unit, "year"):
		result = base.AddDate(n, 0, 0)
	default:
		return ""
	}
	return result.Format("2006-01-02")
}

func computeDateMath(s string) string {
	if todayPattern.MatchString(s) {
		low := strings.ToLower(strings.TrimSpace(s))
		if low == "now" {
			return time.Now().Format("2006-01-02 15:04:05")
		}
		return time.Now().Format("2006-01-02")
	}
	// "next week/month/year"
	if m := nextDatePattern.FindStringSubmatch(s); m != nil {
		return computeRelativeDate("1", m[1])
	}
	// "last week/month/year"
	if m := lastDatePattern.FindStringSubmatch(s); m != nil {
		return computeRelativeDate("-1", m[1])
	}
	// "N weeks/months/years from now/today"
	if m := fromNowPattern.FindStringSubmatch(s); m != nil {
		return computeRelativeDate(m[1], m[2])
	}
	// "N weeks/months/years ago"
	if m := agoPattern.FindStringSubmatch(s); m != nil {
		return computeRelativeDate("-"+m[1], m[2])
	}
	if m := dateMathPattern.FindStringSubmatch(s); m != nil {
		base, ok := parseDate(m[1])
		if !ok {
			return s
		}
		return computeDateOffset(base, m[2], m[3], m[4])
	}
	if m := dateAddPattern.FindStringSubmatch(s); m != nil {
		base, ok := parseDate(m[1])
		if !ok {
			return s
		}
		return computeDateOffset(base, m[2], m[3], m[4])
	}
	return s
}

// Unanchored date patterns for embedded extraction (anywhere in string)
var embeddedTodayPattern = regexp.MustCompile(`(?i)\b(today|now)\b`)
var embeddedNextPattern = regexp.MustCompile(`(?i)\bnext\s+(week|month|year)\b`)
var embeddedLastPattern = regexp.MustCompile(`(?i)\blast\s+(week|month|year)\b`)
var embeddedFromNowPattern = regexp.MustCompile(`(?i)(\d+)\s+(weeks?|months?|years?)\s+from\s+(now|today)\b`)
var embeddedAgoPattern = regexp.MustCompile(`(?i)(\d+)\s+(weeks?|months?|years?)\s+ago\b`)
var embeddedDateMathPattern = regexp.MustCompile(`(?i)\b(today|now)\s*([+-])\s*(\d+)\s+(day|days|week|weeks|month|months|year|years)\b`)
var embeddedDateAddPattern = regexp.MustCompile(`(?i)((?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:[,\s]+\d{4})?))\s*([+-])\s*(\d+)\s+(day|days|week|weeks|month|months|year|years)\b`)

func extractDateMath(s string) string {
	// Check more specific offset patterns first (today + 14 days, etc.)
	if m := embeddedDateMathPattern.FindStringSubmatch(s); m != nil {
		base, ok := parseDate(m[1])
		if !ok {
			return s
		}
		return computeDateOffset(base, m[2], m[3], m[4])
	}
	if m := embeddedDateAddPattern.FindStringSubmatch(s); m != nil {
		base, ok := parseDate(m[1])
		if !ok {
			return s
		}
		return computeDateOffset(base, m[2], m[3], m[4])
	}
	if m := embeddedFromNowPattern.FindStringSubmatch(s); m != nil {
		return computeRelativeDate(m[1], m[2])
	}
	if m := embeddedAgoPattern.FindStringSubmatch(s); m != nil {
		return computeRelativeDate("-"+m[1], m[2])
	}
	if m := embeddedNextPattern.FindStringSubmatch(s); m != nil {
		return computeRelativeDate("1", m[1])
	}
	if m := embeddedLastPattern.FindStringSubmatch(s); m != nil {
		return computeRelativeDate("-1", m[1])
	}
	// Standalone today/now last (least specific)
	if m := embeddedTodayPattern.FindStringSubmatch(s); m != nil {
		low := strings.ToLower(m[1])
		if low == "now" {
			return time.Now().Format("2006-01-02 15:04:05")
		}
		return time.Now().Format("2006-01-02")
	}
	return s
}

func computeDateOffset(base time.Time, sign, nStr, unit string) string {
	n, _ := strconv.Atoi(nStr)
	if sign == "-" {
		n = -n
	}
	var result time.Time
	switch strings.ToLower(unit) {
	case "day", "days":
		result = base.AddDate(0, 0, n)
	case "week", "weeks":
		result = base.AddDate(0, 0, n*7)
	case "month", "months":
		result = base.AddDate(0, n, 0)
	case "year", "years":
		result = base.AddDate(n, 0, 0)
	}
	return result.Format("2006-01-02")
}

func computeAge(s string) string {
	if !strings.Contains(strings.ToLower(s), "born") {
		return s
	}
	yearPat := regexp.MustCompile(`\b(\d{4})\b`)
	for _, m := range yearPat.FindAllStringSubmatch(s, -1) {
		year, err := strconv.Atoi(m[1])
		if err == nil && year >= 1900 && year <= time.Now().Year() {
			return strconv.Itoa(time.Now().Year() - year)
		}
	}
	return s
}

// Percent — matches "10 percent" anywhere, with word boundary to avoid "percentage"
var percentWordPattern = regexp.MustCompile(`(?i)(\d+)\s+percent\b`)

// Fraction words (multi-word): "one half", "two thirds", "three quarters", etc.
var fractionPattern = regexp.MustCompile(`(?i)\b(one|a)\s+(half|third|quarter|fourth)\b|\b(two)\s+(thirds|quarters|fourths)\b|\b(three)\s+(quarters|fourths)\b`)

// Multiplicative prefixes: "double X", "twice X", "triple X", "half of X", "quarter of X"
var doublePrefixPattern = regexp.MustCompile(`(?i)^(?:double|twice)\s+(.+)`)
var triplePrefixPattern = regexp.MustCompile(`(?i)^triple\s+(.+)`)
var halfOfPattern = regexp.MustCompile(`(?i)^half\s+of\s+(.+)`)
var quarterOfPattern = regexp.MustCompile(`(?i)^quarter\s+of\s+(.+)`)

// Power words: "X squared", "X cubed"
var squaredPattern = regexp.MustCompile(`(?i)(\d+(?:\.\d+)?)\s+squared`)
var cubedPattern = regexp.MustCompile(`(?i)(\d+(?:\.\d+)?)\s+cubed`)

// Complex phrase patterns (applied after word→number, before word→operator)
var increasedByPattern = regexp.MustCompile(`(?i)([\d.]+)\s+increased\s+by\s+([\d.]+)`)
var decreasedByPattern = regexp.MustCompile(`(?i)([\d.]+)\s+decreased\s+by\s+([\d.]+)`)
var moreThanPattern = regexp.MustCompile(`(?i)([\d.]+)\s+more\s+than\s+([\d.]+)`)
var lessThanPattern = regexp.MustCompile(`(?i)([\d.]+)\s+less\s+than\s+([\d.]+)`)
var differencePattern = regexp.MustCompile(`(?i)difference\s+between\s+([\d.]+)\s+and\s+([\d.]+)`)
var overDivPattern = regexp.MustCompile(`(?i)([\d.]+)\s+over\s+([\d.]+)`)
var outOfPattern = regexp.MustCompile(`(?i)([\d.]+)\s+out\s+of\s+([\d.]+)`)
var ratioOfPattern = regexp.MustCompile(`(?i)ratio\s+of\s+([\d.]+)\s+to\s+([\d.]+)`)
var productOfPattern = regexp.MustCompile(`(?i)product\s+of\s+([\d.]+)\s+and\s+([\d.]+)`)
var sumOfPattern = regexp.MustCompile(`(?i)sum\s+of\s+([\d.]+)\s+and\s+([\d.]+)`)

// Natural function call patterns: "square root of X", "cube root of X", "absolute value of X"
var squareRootOfPattern = regexp.MustCompile(`(?i)square\s+root\s+of\s+(-?[\d.]+)`)
var cubeRootOfPattern = regexp.MustCompile(`(?i)cube\s+root\s+of\s+(-?[\d.]+)`)
var absoluteValueOfPattern = regexp.MustCompile(`(?i)absolute\s+value\s+of\s+(-?[\d.]+)`)

// "X times more than Y" → "Y + Y * X" (before word operator replacement of "times")
var timesMoreThanPattern = regexp.MustCompile(`(?i)([\d.]+)\s+times\s+more\s+than\s+([\d.]+)`)

// "X times as much/many/big/etc. as Y" → "Y * X"
var timesAsMuchAsPattern = regexp.MustCompile(`(?i)([\d.]+)\s+times\s+as\s+(?:much|many|big|large|little|small)\s+as\s+([\d.]+)`)

// "X% more than Y" → "Y + Y * X / 100"
var percentMoreThanPattern = regexp.MustCompile(`(?i)([\d.]+)\s*%\s+more\s+than\s+([\d.]+)`)

// "X% less than Y" → "Y - Y * X / 100"
var percentLessThanPattern = regexp.MustCompile(`(?i)([\d.]+)\s*%\s+less\s+than\s+([\d.]+)`)

// "X added to Y" → "Y + X"
var addedToPattern = regexp.MustCompile(`(?i)([\d.]+)\s+added\s+to\s+([\d.]+)`)

// "half NUMBER" → "0.5 * NUMBER" (after wordsToNumbers converts "half a million" → "half 1000000")
var halfNumericPattern = regexp.MustCompile(`(?i)\bhalf\s+(\d+(?:\.\d+)?)\b`)

// "per cent" → "%"
var perCentPattern = regexp.MustCompile(`(?i)(\d+)\s+per\s+cent\b`)

// Relative date shorthand
var nextDatePattern = regexp.MustCompile(`(?i)^next\s+(week|month|year)$`)
var lastDatePattern = regexp.MustCompile(`(?i)^last\s+(week|month|year)$`)
var fromNowPattern = regexp.MustCompile(`(?i)^(\d+)\s+(weeks?|months?|years?)\s+from\s+(now|today)$`)
var agoPattern = regexp.MustCompile(`(?i)^(\d+)\s+(weeks?|months?|years?)\s+ago$`)

// "X by Y" dimension → X * Y (e.g., "10 by 20")
var byDimensionPattern = regexp.MustCompile(`(?i)(\d+(?:\.\d+)?)\s+by\s+(\d+(?:\.\d+)?)\b`)

// "XxY" or "X×Y" multiplication (e.g., "5x10", "2×3")
var xMultiplyPattern = regexp.MustCompile(`(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)`)

// Shape area/volume patterns
var rectAreaPattern = regexp.MustCompile(`(?i)(?:rectangle|rect)\s+(\d+(?:\.\d+)?)\s+by\s+(\d+(?:\.\d+)?)`)
var circleAreaPattern = regexp.MustCompile(`(?i)circle\s+(?:with\s+)?(?:radius\s+)?(\d+(?:\.\d+)?)`)
var circleCircumPattern = regexp.MustCompile(`(?i)circumference\s+(?:of\s+)?(?:a|the)?\s*circle\s+(?:with\s+)?(?:radius\s+)?(\d+(?:\.\d+)?)`)
var cubeVolumePattern = regexp.MustCompile(`(?i)cube\s+(?:with\s+)?(?:side\s+)?(\d+(?:\.\d+)?)`)
var cylinderVolumePattern = regexp.MustCompile(`(?i)cylinder\s+(?:with\s+)?(?:radius\s+)?(\d+(?:\.\d+)?)\s+(?:and\s+)?(?:height\s+)?(\d+(?:\.\d+)?)`)
var sphereVolumePattern = regexp.MustCompile(`(?i)sphere\s+(?:with\s+)?(?:radius\s+)?(\d+(?:\.\d+)?)`)

// Function with unparenthesized argument: "sin theta" → "sin(theta)"
var trigArgPattern = regexp.MustCompile(`(?i)\b(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|log|ln|log2|log10|sqrt|cbrt|abs|round|floor|ceil|sign|trunc|exp|deg|rad)\s+(\d+(?:\.\d+)?|[a-zA-Z_]\w*)\b`)

// Strip area/volume/geometric prefixes and generic nouns
var areaVolumeOfPattern = regexp.MustCompile(`(?i)^(?:area|volume|perimeter)\s+of\s+(?:a|the|my|your|this|that)?\s*`)
var genericNounPattern = regexp.MustCompile(`(?i)^(?:land|house|room|floor|space|field|garden|yard|property|building|lot|garage|deck|patio|porch|driveway|shape)\s+`)

// Commas and trailing noise
var commaPattern = regexp.MustCompile(`(\d),(\d)`)
var trailingQMPattern = regexp.MustCompile(`\?\s*$`)
var trailingPeriodPattern = regexp.MustCompile(`\.\s*$`)
var spacesPattern = regexp.MustCompile(`\s{2,}`)

// Pattern matching for unit conversion and percentages
var unitConvPattern = regexp.MustCompile(`(?i)^([\d.,]+)\s*(.*?)\s+\b(?:in|to|as)\b\s+(.+)$`)
var percentOfPattern = regexp.MustCompile(`(?i)^([\d.,]+)\s*%\s*(?:of|on)\s+([\d.,]+)$`)
var percentAddPattern = regexp.MustCompile(`(?i)^([\d.,]+)\s*([+\-])\s*([\d.,]+)\s*%$`)

// --- PEMDAS Arithmetic Parser (recursive descent) ---

type parser struct {
	tokens []token
	pos    int
	vars   map[string]float64
	engine *Engine
}

type token struct {
	kind tokenKind
	val  string
}

type tokenKind int

const (
	tokNum tokenKind = iota
	tokPlus
	tokMinus
	tokMul
	tokDiv
	tokPow
	tokMod
	tokBang
	tokLParen
	tokRParen
	tokComma
	tokIdent
	tokEOF
)

func lex(s string) []token {
	var toks []token
	i := 0
	runes := []rune(s)
	for i < len(runes) {
		ch := runes[i]
		if unicode.IsSpace(ch) {
			i++
			continue
		}
		switch ch {
		case '+':
			toks = append(toks, token{tokPlus, "+"})
			i++
		case '-':
			toks = append(toks, token{tokMinus, "-"})
			i++
		case '*':
			toks = append(toks, token{tokMul, "*"})
			i++
		case '/':
			toks = append(toks, token{tokDiv, "/"})
			i++
		case '^':
			toks = append(toks, token{tokPow, "^"})
			i++
		case '%':
			toks = append(toks, token{tokMod, "%"})
			i++
		case '!':
			toks = append(toks, token{tokBang, "!"})
			i++
		case '(':
			toks = append(toks, token{tokLParen, "("})
			i++
		case ')':
			toks = append(toks, token{tokRParen, ")"})
			i++
		case ',':
			toks = append(toks, token{tokComma, ","})
			i++
		default:
			if unicode.IsDigit(ch) || ch == '.' {
				start := i
				for i < len(runes) && (unicode.IsDigit(runes[i]) || runes[i] == '.') {
					i++
				}
				toks = append(toks, token{tokNum, string(runes[start:i])})
			} else if unicode.IsLetter(ch) {
				start := i
				for i < len(runes) && (unicode.IsLetter(runes[i]) || unicode.IsDigit(runes[i])) {
					i++
				}
				toks = append(toks, token{tokIdent, string(runes[start:i])})
			} else {
				i++ // skip unknown
			}
		}
	}
	toks = append(toks, token{tokEOF, ""})
	return toks
}

func (e *Engine) parseExpr(s string) (float64, error) {
	toks := lex(s)
	p := &parser{tokens: toks, pos: 0, vars: e.variables, engine: e}
	return p.parseAddSub()
}

func (p *parser) peek() token    { return p.tokens[p.pos] }
func (p *parser) advance() token { t := p.tokens[p.pos]; p.pos++; return t }

func (p *parser) expect(kind tokenKind) (token, error) {
	t := p.advance()
	if t.kind != kind {
		return t, fmt.Errorf("expected %d, got %s", kind, t.val)
	}
	return t, nil
}

// parseAddSub  → parseMulDiv {(+|-) parseMulDiv}
func (p *parser) parseAddSub() (float64, error) {
	left, err := p.parseMulDiv()
	if err != nil {
		return 0, err
	}
	for p.peek().kind == tokPlus || p.peek().kind == tokMinus {
		op := p.advance()
		right, err := p.parseMulDiv()
		if err != nil {
			return 0, err
		}
		if op.kind == tokPlus {
			left += right
		} else {
			left -= right
		}
	}
	return left, nil
}

// parseMulDiv → parsePow {(*|/|%) parsePow}
func (p *parser) parseMulDiv() (float64, error) {
	left, err := p.parsePow()
	if err != nil {
		return 0, err
	}
	for p.peek().kind == tokMul || p.peek().kind == tokDiv || p.peek().kind == tokMod {
		op := p.advance()
		right, err := p.parsePow()
		if err != nil {
			return 0, err
		}
		switch op.kind {
		case tokMul:
			left *= right
		case tokDiv:
			if right == 0 {
				return 0, fmt.Errorf("division by zero")
			}
			left /= right
		case tokMod:
			if right == 0 {
				return 0, fmt.Errorf("modulo by zero")
			}
			left = math.Mod(left, right)
		}
	}
	return left, nil
}

// parsePow → parseUnary {^ parseUnary}
func (p *parser) parsePow() (float64, error) {
	left, err := p.parseUnary()
	if err != nil {
		return 0, err
	}
	for p.peek().kind == tokPow {
		p.advance()
		right, err := p.parseUnary()
		if err != nil {
			return 0, err
		}
		left = math.Pow(left, right)
	}
	return left, nil
}

// parseUnary → {-|+} parseAtom
func (p *parser) parseUnary() (float64, error) {
	if p.peek().kind == tokMinus {
		p.advance()
		val, err := p.parseAtom()
		if err != nil {
			return 0, err
		}
		return -val, nil
	}
	if p.peek().kind == tokPlus {
		p.advance()
		return p.parseAtom()
	}
	return p.parseAtom()
}

// parseAtom → number | (expr) | ident [(args)]
const maxExprDepth = 100

func (p *parser) parseAtom() (float64, error) {
	t := p.peek()
	if p.pos > maxExprDepth {
		return 0, fmt.Errorf("expression too deeply nested")
	}

	if t.kind == tokNum {
		p.advance()
		val, err := strconv.ParseFloat(t.val, 64)
		if err != nil {
			return 0, err
		}
		if p.peek().kind == tokBang {
			p.advance()
			return factorial(val)
		}
		return val, nil
	}

	if t.kind == tokLParen {
		p.advance()
		val, err := p.parseAddSub()
		if err != nil {
			return 0, err
		}
		_, err = p.expect(tokRParen)
		if err != nil {
			return 0, err
		}
		if p.peek().kind == tokBang {
			p.advance()
			return factorial(val)
		}
		return val, nil
	}

	if t.kind == tokIdent {
		p.advance()
		name := strings.ToLower(t.val)

		if p.peek().kind == tokLParen {
			p.advance()
			args, err := p.parseArgs()
			if err != nil {
				return 0, err
			}
			_, err = p.expect(tokRParen)
			if err != nil {
				return 0, err
			}
			return p.callBuiltinOrPlugin(name, args)
		}

		switch name {
		case "pi", "π":
			return math.Pi, nil
		case "e":
			return math.E, nil
		default:
			if v, ok := p.vars[name]; ok {
				return v, nil
			}
			return 0, fmt.Errorf("unknown identifier: %s", name)
		}
	}

	if t.kind == tokEOF {
		return 0, fmt.Errorf("unexpected end of expression")
	}

	return 0, fmt.Errorf("unexpected token: %s", t.val)
}

// parseArgs parses comma-separated arguments inside parens
func (p *parser) parseArgs() ([]float64, error) {
	var args []float64
	if p.peek().kind == tokRParen {
		return args, nil
	}
	for {
		val, err := p.parseAddSub()
		if err != nil {
			return nil, err
		}
		args = append(args, val)
		if p.peek().kind == tokRParen {
			break
		}
		if p.peek().kind == tokComma {
			p.advance()
			continue
		}
		return nil, fmt.Errorf("expected ',' or ')', got %s", p.peek().val)
	}
	return args, nil
}

// --- Helpers ---

func formatNumber(v float64) string {
	if v == math.Trunc(v) && !math.IsInf(v, 0) && math.Abs(v) < 1e15 {
		return strconv.FormatInt(int64(v), 10)
	}
	return fmt.Sprintf("%g", v)
}

var identifierPattern = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)

func isIdentifier(s string) bool {
	return identifierPattern.MatchString(s)
}
