package calculator

// Step represents one intermediate computation step for the step-by-step display.
type Step struct {
	Operation  string `json:"operation"`
	Expression string `json:"expression"`
	Result     string `json:"result"`
}

// EvalDetail holds the evaluation result and its intermediate steps.
type EvalDetail struct {
	Result string `json:"result"`
	Steps  []Step `json:"steps"`
}

func (p *parser) recordStep(op, expr, result string) {
	if p.steps == nil {
		return
	}
	*p.steps = append(*p.steps, Step{
		Operation:  op,
		Expression: expr,
		Result:     result,
	})
}

func fmtVal(v float64) string {
	if v == 0 {
		return "0"
	}
	return formatNumber(v)
}

func operatorSym(kind tokenKind) string {
	switch kind {
	case tokPlus:
		return "+"
	case tokMinus:
		return "-"
	case tokMul:
		return "×"
	case tokDiv:
		return "÷"
	case tokMod:
		return "mod"
	case tokPow:
		return "^"
	default:
		return "?"
	}
}
