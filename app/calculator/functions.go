package calculator

import (
	"fmt"
	"math"
)

func (p *parser) callBuiltinOrPlugin(name string, args []float64) (float64, error) {
	switch name {
	case "sin":
		return math.Sin(args[0]), nil
	case "cos":
		return math.Cos(args[0]), nil
	case "tan":
		return math.Tan(args[0]), nil
	case "sqrt":
		return math.Sqrt(args[0]), nil
	case "abs":
		return math.Abs(args[0]), nil
	case "round":
		return math.Round(args[0]), nil
	case "floor":
		return math.Floor(args[0]), nil
	case "ceil":
		return math.Ceil(args[0]), nil
	case "log", "ln":
		return math.Log(args[0]), nil
	case "log10":
		return math.Log10(args[0]), nil
	case "exp":
		return math.Exp(args[0]), nil
	default:
		return 0, fmt.Errorf("unknown function: %s", name)
	}
}
