package plugin

import (
	"fmt"
	"math"
	"strconv"
	"strings"
	"unicode"
)

// EvalExpr evaluates a math expression with variable substitutions.
// Variables are mapped by single letters: a->args[0], b->args[1], etc.
func EvalExpr(expr string, args []float64) (float64, error) {
	p := &exprParser{
		expr:  strings.TrimSpace(expr),
		args:  args,
		vars:  make(map[string]float64),
		pos:   0,
	funcs: map[string]func([]float64) float64{
			"abs":   func(a []float64) float64 { return math.Abs(a[0]) },
			"sin":   func(a []float64) float64 { return math.Sin(a[0]) },
			"cos":   func(a []float64) float64 { return math.Cos(a[0]) },
			"tan":   func(a []float64) float64 { return math.Tan(a[0]) },
			"asin":  func(a []float64) float64 { return math.Asin(a[0]) },
			"acos":  func(a []float64) float64 { return math.Acos(a[0]) },
			"atan":  func(a []float64) float64 { return math.Atan(a[0]) },
			"sqrt":  func(a []float64) float64 { return math.Sqrt(a[0]) },
			"cbrt":  func(a []float64) float64 { return math.Cbrt(a[0]) },
			"log":   func(a []float64) float64 { return math.Log10(a[0]) },
			"ln":    func(a []float64) float64 { return math.Log(a[0]) },
			"log2":  func(a []float64) float64 { return math.Log2(a[0]) },
			"exp":   func(a []float64) float64 { return math.Exp(a[0]) },
			"pow":   func(a []float64) float64 { return math.Pow(a[0], a[1]) },
			"floor": func(a []float64) float64 { return math.Floor(a[0]) },
			"ceil":  func(a []float64) float64 { return math.Ceil(a[0]) },
			"round": func(a []float64) float64 { return math.Round(a[0]) },
			"sign":  func(a []float64) float64 { return math.Copysign(1, a[0]) },
			"min":   func(a []float64) float64 { return math.Min(a[0], a[1]) },
			"max":   func(a []float64) float64 { return math.Max(a[0], a[1]) },
			"mod":   func(a []float64) float64 { return math.Mod(a[0], a[1]) },
			"atan2": func(a []float64) float64 { return math.Atan2(a[0], a[1]) },
			"pi":    func(a []float64) float64 { return math.Pi },
			"e":     func(a []float64) float64 { return math.E },
			"tau":   func(a []float64) float64 { return math.Pi * 2 },
			"phi":   func(a []float64) float64 { return (1 + math.Sqrt(5)) / 2 },
		},
	}

	// map a-z to args
	for i, v := range args {
		if i >= 26 {
			break
		}
		p.vars[string(rune('a'+i))] = v
	}

	result, err := p.parseExpr()
	if err != nil {
		return 0, err
	}
	if p.pos < len(p.expr) {
		return 0, fmt.Errorf("unexpected character at position %d: %c", p.pos, p.expr[p.pos])
	}
	return result, nil
}

type exprParser struct {
	expr  string
	args  []float64
	vars  map[string]float64
	pos   int
	funcs map[string]func([]float64) float64
}

func (p *exprParser) skipSpaces() {
	for p.pos < len(p.expr) && p.expr[p.pos] == ' ' {
		p.pos++
	}
}

func (p *exprParser) peek() byte {
	p.skipSpaces()
	if p.pos >= len(p.expr) {
		return 0
	}
	return p.expr[p.pos]
}

func (p *exprParser) parseExpr() (float64, error) {
	return p.parseAddSub()
}

// + and -
func (p *exprParser) parseAddSub() (float64, error) {
	left, err := p.parseMulDiv()
	if err != nil {
		return 0, err
	}
	for {
		p.skipSpaces()
		if p.pos >= len(p.expr) {
			break
		}
		ch := p.expr[p.pos]
		if ch == '+' || ch == '-' {
			p.pos++
			right, err := p.parseMulDiv()
			if err != nil {
				return 0, err
			}
			if ch == '+' {
				left += right
			} else {
				left -= right
			}
		} else {
			break
		}
	}
	return left, nil
}

// *, /, and %
func (p *exprParser) parseMulDiv() (float64, error) {
	left, err := p.parsePower()
	if err != nil {
		return 0, err
	}
	for {
		p.skipSpaces()
		if p.pos >= len(p.expr) {
			break
		}
		ch := p.expr[p.pos]
		if ch == '*' || ch == '/' || ch == '%' {
			p.pos++
			right, err := p.parsePower()
			if err != nil {
				return 0, err
			}
			switch ch {
			case '*':
				left *= right
			case '/':
				if right == 0 {
					return 0, fmt.Errorf("division by zero")
				}
				left /= right
			case '%':
				if right == 0 {
					return 0, fmt.Errorf("modulo by zero")
				}
				left = math.Mod(left, right)
			}
		} else {
			break
		}
	}
	return left, nil
}

// ^ (right associative)
func (p *exprParser) parsePower() (float64, error) {
	base, err := p.parseUnary()
	if err != nil {
		return 0, err
	}
	p.skipSpaces()
	if p.pos < len(p.expr) && p.expr[p.pos] == '^' {
		p.pos++
		exp, err := p.parseUnary()
		if err != nil {
			return 0, err
		}
		return math.Pow(base, exp), nil
	}
	return base, nil
}

// unary +, -
func (p *exprParser) parseUnary() (float64, error) {
	p.skipSpaces()
	if p.pos >= len(p.expr) {
		return 0, fmt.Errorf("unexpected end of expression")
	}
	ch := p.expr[p.pos]
	if ch == '-' {
		p.pos++
		val, err := p.parseAtom()
		if err != nil {
			return 0, err
		}
		return -val, nil
	}
	if ch == '+' {
		p.pos++
	}
	return p.parseAtom()
}

// atoms: number, variable, function call, parenthesized expression
func (p *exprParser) parseAtom() (float64, error) {
	p.skipSpaces()
	if p.pos >= len(p.expr) {
		return 0, fmt.Errorf("unexpected end of expression")
	}
	ch := p.expr[p.pos]

	// parenthesized expression
	if ch == '(' {
		p.pos++
		val, err := p.parseExpr()
		if err != nil {
			return 0, err
		}
		p.skipSpaces()
		if p.pos >= len(p.expr) || p.expr[p.pos] != ')' {
			return 0, fmt.Errorf("missing closing parenthesis")
		}
		p.pos++
		return val, nil
	}

	// number
	if ch >= '0' && ch <= '9' || ch == '.' {
		return p.parseNumber()
	}

	// identifier: variable or function
	if unicode.IsLetter(rune(ch)) || ch == '_' {
		return p.parseIdent()
	}

	return 0, fmt.Errorf("unexpected character: %c", ch)
}

func (p *exprParser) parseNumber() (float64, error) {
	start := p.pos
	for p.pos < len(p.expr) && (p.expr[p.pos] >= '0' && p.expr[p.pos] <= '9' || p.expr[p.pos] == '.' || p.expr[p.pos] == 'e' || p.expr[p.pos] == 'E') {
		if (p.expr[p.pos] == 'e' || p.expr[p.pos] == 'E') && p.pos+1 < len(p.expr) && (p.expr[p.pos+1] == '+' || p.expr[p.pos+1] == '-') {
			p.pos += 2
		} else {
			p.pos++
		}
	}
	s := p.expr[start:p.pos]
	val, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid number: %s", s)
	}
	return val, nil
}

func (p *exprParser) parseIdent() (float64, error) {
	start := p.pos
	for p.pos < len(p.expr) && (unicode.IsLetter(rune(p.expr[p.pos])) || p.expr[p.pos] >= '0' && p.expr[p.pos] <= '9' || p.expr[p.pos] == '_') {
		p.pos++
	}
	name := strings.ToLower(p.expr[start:p.pos])

	p.skipSpaces()

	// check if it's a function call
	if p.pos < len(p.expr) && p.expr[p.pos] == '(' {
		p.pos++ // skip '('
		fn, ok := p.funcs[name]
		if !ok {
			return 0, fmt.Errorf("unknown function: %s", name)
		}
		// parse arguments
		var args []float64
		p.skipSpaces()
		if p.pos < len(p.expr) && p.expr[p.pos] != ')' {
			for {
				arg, err := p.parseExpr()
				if err != nil {
					return 0, err
				}
				args = append(args, arg)
				p.skipSpaces()
				if p.pos >= len(p.expr) || p.expr[p.pos] != ',' {
					break
				}
				p.pos++ // skip ','
			}
		}
		p.skipSpaces()
		if p.pos >= len(p.expr) || p.expr[p.pos] != ')' {
			return 0, fmt.Errorf("missing closing parenthesis in function call: %s", name)
		}
		p.pos++ // skip ')'
		return fn(args), nil
	}

	// it's a variable
	val, ok := p.vars[name]
	if !ok {
		return 0, fmt.Errorf("unknown variable: %s", name)
	}
	return val, nil
}
