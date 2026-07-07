package calculator

import (
	"fmt"
	"math"
	"math/rand"
)

func (p *parser) callBuiltinOrPlugin(name string, args []float64) (float64, error) {
	switch name {
	case "sin":
		if len(args) != 1 {
			return 0, fmt.Errorf("sin expects 1 argument, got %d", len(args))
		}
		return math.Sin(args[0]), nil
	case "cos":
		if len(args) != 1 {
			return 0, fmt.Errorf("cos expects 1 argument, got %d", len(args))
		}
		return math.Cos(args[0]), nil
	case "tan":
		if len(args) != 1 {
			return 0, fmt.Errorf("tan expects 1 argument, got %d", len(args))
		}
		return math.Tan(args[0]), nil
	case "asin":
		if len(args) != 1 {
			return 0, fmt.Errorf("asin expects 1 argument, got %d", len(args))
		}
		return math.Asin(args[0]), nil
	case "acos":
		if len(args) != 1 {
			return 0, fmt.Errorf("acos expects 1 argument, got %d", len(args))
		}
		return math.Acos(args[0]), nil
	case "atan":
		if len(args) != 1 {
			return 0, fmt.Errorf("atan expects 1 argument, got %d", len(args))
		}
		return math.Atan(args[0]), nil
	case "atan2":
		if len(args) != 2 {
			return 0, fmt.Errorf("atan2 expects 2 arguments, got %d", len(args))
		}
		return math.Atan2(args[0], args[1]), nil
	case "sinh":
		if len(args) != 1 {
			return 0, fmt.Errorf("sinh expects 1 argument, got %d", len(args))
		}
		return math.Sinh(args[0]), nil
	case "cosh":
		if len(args) != 1 {
			return 0, fmt.Errorf("cosh expects 1 argument, got %d", len(args))
		}
		return math.Cosh(args[0]), nil
	case "tanh":
		if len(args) != 1 {
			return 0, fmt.Errorf("tanh expects 1 argument, got %d", len(args))
		}
		return math.Tanh(args[0]), nil
	case "sqrt":
		if len(args) != 1 {
			return 0, fmt.Errorf("sqrt expects 1 argument, got %d", len(args))
		}
		return math.Sqrt(args[0]), nil
	case "cbrt":
		if len(args) != 1 {
			return 0, fmt.Errorf("cbrt expects 1 argument, got %d", len(args))
		}
		return math.Cbrt(args[0]), nil
	case "abs":
		if len(args) != 1 {
			return 0, fmt.Errorf("abs expects 1 argument, got %d", len(args))
		}
		return math.Abs(args[0]), nil
	case "round":
		if len(args) != 1 {
			return 0, fmt.Errorf("round expects 1 argument, got %d", len(args))
		}
		return math.Round(args[0]), nil
	case "floor":
		if len(args) != 1 {
			return 0, fmt.Errorf("floor expects 1 argument, got %d", len(args))
		}
		return math.Floor(args[0]), nil
	case "ceil":
		if len(args) != 1 {
			return 0, fmt.Errorf("ceil expects 1 argument, got %d", len(args))
		}
		return math.Ceil(args[0]), nil
	case "log", "ln":
		if len(args) != 1 {
			return 0, fmt.Errorf("log/ln expects 1 argument, got %d", len(args))
		}
		return math.Log(args[0]), nil
	case "log2":
		if len(args) != 1 {
			return 0, fmt.Errorf("log2 expects 1 argument, got %d", len(args))
		}
		return math.Log2(args[0]), nil
	case "log10":
		if len(args) != 1 {
			return 0, fmt.Errorf("log10 expects 1 argument, got %d", len(args))
		}
		return math.Log10(args[0]), nil
	case "exp":
		if len(args) != 1 {
			return 0, fmt.Errorf("exp expects 1 argument, got %d", len(args))
		}
		return math.Exp(args[0]), nil
	case "pow":
		if len(args) != 2 {
			return 0, fmt.Errorf("pow expects 2 arguments, got %d", len(args))
		}
		return math.Pow(args[0], args[1]), nil
	case "fact", "factorial":
		if len(args) != 1 {
			return 0, fmt.Errorf("factorial expects 1 argument, got %d", len(args))
		}
		return factorial(args[0])
	case "gcd":
		if len(args) != 2 {
			return 0, fmt.Errorf("gcd expects 2 arguments, got %d", len(args))
		}
		return float64(gcd(int64(args[0]), int64(args[1]))), nil
	case "lcm":
		if len(args) != 2 {
			return 0, fmt.Errorf("lcm expects 2 arguments, got %d", len(args))
		}
		return float64(lcm(int64(args[0]), int64(args[1]))), nil
	case "rand", "random":
		if len(args) == 0 {
			return rand.Float64(), nil
		}
		if len(args) == 1 {
			return rand.Float64() * args[0], nil
		}
		if len(args) == 2 {
			if args[1] <= args[0] {
				return 0, fmt.Errorf("rand max must be greater than min")
			}
			return args[0] + rand.Float64()*(args[1]-args[0]), nil
		}
		return 0, fmt.Errorf("rand expects 0-2 arguments, got %d", len(args))
	case "sign", "sgn":
		if len(args) != 1 {
			return 0, fmt.Errorf("sign expects 1 argument, got %d", len(args))
		}
		if args[0] > 0 {
			return 1, nil
		}
		if args[0] < 0 {
			return -1, nil
		}
		return 0, nil
	case "ncr", "choose":
		if len(args) != 2 {
			return 0, fmt.Errorf("nCr expects 2 arguments, got %d", len(args))
		}
		return nCr(int64(args[0]), int64(args[1])), nil
	case "trunc":
		if len(args) != 1 {
			return 0, fmt.Errorf("trunc expects 1 argument, got %d", len(args))
		}
		return math.Trunc(args[0]), nil
	case "fract":
		if len(args) != 1 {
			return 0, fmt.Errorf("fract expects 1 argument, got %d", len(args))
		}
		_, f := math.Modf(args[0])
		return f, nil
	case "deg":
		if len(args) != 1 {
			return 0, fmt.Errorf("deg expects 1 argument, got %d", len(args))
		}
		return args[0] * 180 / math.Pi, nil
	case "rad":
		if len(args) != 1 {
			return 0, fmt.Errorf("rad expects 1 argument, got %d", len(args))
		}
		return args[0] * math.Pi / 180, nil
	case "min":
		if len(args) < 1 {
			return 0, fmt.Errorf("min expects at least 1 argument")
		}
		v := args[0]
		for _, a := range args[1:] {
			if a < v {
				v = a
			}
		}
		return v, nil
	case "max":
		if len(args) < 1 {
			return 0, fmt.Errorf("max expects at least 1 argument")
		}
		v := args[0]
		for _, a := range args[1:] {
			if a > v {
				v = a
			}
		}
		return v, nil
	case "sum":
		if len(args) < 1 {
			return 0, fmt.Errorf("sum expects at least 1 argument")
		}
		v := 0.0
		for _, a := range args {
			v += a
		}
		return v, nil
	case "avg":
		if len(args) < 1 {
			return 0, fmt.Errorf("avg expects at least 1 argument")
		}
		v := 0.0
		for _, a := range args {
			v += a
		}
		return v / float64(len(args)), nil
	case "pi", "π":
		return math.Pi, nil
	case "e":
		return math.E, nil
	default:
		return 0, fmt.Errorf("unknown function: %s", name)
	}
}

func factorial(n float64) (float64, error) {
	if n < 0 || math.IsNaN(n) {
		return 0, fmt.Errorf("factorial of %g is undefined", n)
	}
	ni := int64(math.Round(n))
	if float64(ni) != n {
		return 0, fmt.Errorf("factorial requires an integer, got %g", n)
	}
	if ni > 20 {
		return 0, fmt.Errorf("factorial %d overflows", ni)
	}
	result := float64(1)
	for i := int64(2); i <= ni; i++ {
		result *= float64(i)
	}
	return result, nil
}

func gcd(a, b int64) int64 {
	if a < 0 {
		a = -a
	}
	if b < 0 {
		b = -b
	}
	for b != 0 {
		a, b = b, a%b
	}
	return a
}

func lcm(a, b int64) int64 {
	if a == 0 || b == 0 {
		return 0
	}
	return a / gcd(a, b) * b
}

func nCr(n, r int64) float64 {
	if r < 0 || r > n {
		return 0
	}
	if r == 0 || r == n {
		return 1
	}
	if r > n-r {
		r = n - r
	}
	result := float64(1)
	for i := int64(1); i <= r; i++ {
		result = result * float64(n-r+i) / float64(i)
	}
	return result
}
