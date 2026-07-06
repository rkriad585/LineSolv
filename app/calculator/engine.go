package calculator

import (
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
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
	s := e.naturalize(strings.TrimSpace(input))

	// "X in Y" unit conversion
	if match := unitConvPattern.FindStringSubmatch(s); match != nil {
		val, err := strconv.ParseFloat(match[1], 64)
		if err != nil {
			return "", fmt.Errorf("invalid number: %s", match[1])
		}
		return convertUnit(val, match[2], match[3]), nil
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

func (e *Engine) naturalize(s string) string {
	// 1. Strip leading query prefixes (run multiple times for compound prefixes)
	for {
		prev := s
		s = greetingPattern.ReplaceAllString(s, "")
		s = prefixPattern.ReplaceAllString(s, "")
		s = leadingArticlePattern.ReplaceAllString(s, "")
		s = leadingAddSumPattern.ReplaceAllString(s, "")
		if s == prev {
			break
		}
	}
	// 2. Strip trailing fluff
	s = trailingFluffPattern.ReplaceAllString(s, "")
	// 3. Replace word numbers with digits
	s = wordsToNumbers(s)
	// 4. Replace "that" / "then" / "result" context references
	s = e.substituteContext(s)
	// 5. Replace word operators
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
	// 6. "percent" word
	s = percentWordPattern.ReplaceAllString(s, "$1% ")
	// 7. Commas in numbers
	s = commaPattern.ReplaceAllString(s, "$1$2")
	// 8. Clean trailing punctuation
	s = trailingQMPattern.ReplaceAllString(s, "")
	s = trailingPeriodPattern.ReplaceAllString(s, "")
	// 9. Collapse multiple spaces
	s = spacesPattern.ReplaceAllString(s, " ")
	return strings.TrimSpace(s)
}

func (e *Engine) substituteContext(s string) string {
	if e.lastResult == 0 {
		return s
	}
	lastStr := formatNumber(e.lastResult)

	// Entire line is just "that", "it", "of that" → returns lastResult
	trimmed := strings.TrimSpace(s)
	if matched, _ := regexp.MatchString(`(?i)^(?:of\s+)?(?:that|it)$`, trimmed); matched {
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
	for _, w := range words {
		w = strings.ToLower(strings.TrimRight(w, ","))
		if w == "and" || w == "" {
			continue
		}
		if w == "a" {
			current = 1
			continue
		}
		val, ok := wordNumMap[w]
		if !ok {
			continue
		}
		if val >= 100 {
			if current == 0 {
				current = 1
			}
			if val >= 1000 {
				current *= val
				total += current
				current = 0
			} else {
				current *= val
			}
		} else {
			current += val
		}
	}
	total += current
	return total
}

// --- Regex patterns ---

var prefixPattern = regexp.MustCompile(`(?i)^(?:what\s+(?:is|'s|are)|calculate|compute|find|solve|value\s+of|eval(?:uate)?|result\s+of|how\s+much\s+is|how\s+many\s+is)\s+`)
var greetingPattern = regexp.MustCompile(`(?i)^(?:hi|hello|hey)(?:\s+there)?\s+`)
var leadingAddSumPattern = regexp.MustCompile(`(?i)^(?:add\b|sum\b(?:\s+of\b)?)\s+`)
var leadingArticlePattern = regexp.MustCompile(`(?i)^(?:the|a|an)\s+`)
var trailingFluffPattern = regexp.MustCompile(`(?i)\s+(?:please|thanks|thank you|pls)$`)

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

// Percent — matches "10 percent" anywhere, with word boundary to avoid "percentage"
var percentWordPattern = regexp.MustCompile(`(?i)(\d+)\s+percent\b`)

// Commas and trailing noise
var commaPattern = regexp.MustCompile(`(\d),(\d)`)
var trailingQMPattern = regexp.MustCompile(`\?\s*$`)
var trailingPeriodPattern = regexp.MustCompile(`\.\s*$`)
var spacesPattern = regexp.MustCompile(`\s{2,}`)

// Pattern matching for unit conversion and percentages
var unitConvPattern = regexp.MustCompile(`(?i)^([\d.,]+)\s*(.+?)\s+(?:in|to|as)\s+(.+)$`)
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

func (p *parser) peek() token       { return p.tokens[p.pos] }
func (p *parser) advance() token     { t := p.tokens[p.pos]; p.pos++; return t }

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
		return strconv.ParseFloat(t.val, 64)
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
