package plugin

import (
	"LineSolv/app/calculator"
	"fmt"
	"math"
)

// BuiltinFuncs maps builtin names to their plugin function implementations.
var BuiltinFuncs = map[string]calculator.PluginFunction{
	"clamp":      builtinClamp,
	"lerp":       builtinLerp,
	"smoothstep": builtinSmoothstep,
	"wrap":       builtinWrap,
	"average":    builtinAverage,
	"median":     builtinMedian,
	"std_dev":    builtinStdDev,
	"variance":   builtinVariance,
	"percentile": builtinPercentile,
	"sum":        builtinSum,
	"product":    builtinProduct,
	"gcd":        builtinGCD,
	"lcm":        builtinLCM,
	"fact":       builtinFact,
	"npr":        builtinNPR,
	"ncr":        builtinNCR,
	"hypot":      builtinHypot,
	"rad":        builtinRad,
	"deg":        builtinDeg,
}

// clamp(value, min, max) - clamp value between min and max
func builtinClamp(args []float64) (float64, error) {
	if len(args) != 3 {
		return 0, fmt.Errorf("clamp requires exactly 3 arguments: value, min, max")
	}
	return math.Max(args[1], math.Min(args[2], args[0])), nil
}

// lerp(a, b, t) - linear interpolation
func builtinLerp(args []float64) (float64, error) {
	if len(args) != 3 {
		return 0, fmt.Errorf("lerp requires exactly 3 arguments: a, b, t")
	}
	return args[0] + (args[1]-args[0])*args[2], nil
}

// smoothstep(edge0, edge1, x) - smooth Hermite interpolation
func builtinSmoothstep(args []float64) (float64, error) {
	if len(args) != 3 {
		return 0, fmt.Errorf("smoothstep requires exactly 3 arguments: edge0, edge1, x")
	}
	t := math.Max(0, math.Min(1, (args[2]-args[0])/(args[1]-args[0])))
	return t * t * (3 - 2*t), nil
}

// wrap(value, min, max) - wrap value within range [min, max)
func builtinWrap(args []float64) (float64, error) {
	if len(args) != 3 {
		return 0, fmt.Errorf("wrap requires exactly 3 arguments: value, min, max")
	}
	val, lo, hi := args[0], args[1], args[2]
	if hi <= lo {
		return 0, fmt.Errorf("wrap: max must be greater than min")
	}
	rangeSize := hi - lo
	return math.Mod(val-lo+rangeSize, rangeSize) + lo, nil
}

// average(...) - average of variadic args
func builtinAverage(args []float64) (float64, error) {
	if len(args) == 0 {
		return 0, fmt.Errorf("average requires at least 1 argument")
	}
	sum := 0.0
	for _, v := range args {
		sum += v
	}
	return sum / float64(len(args)), nil
}

// sum(...) - sum of variadic args
func builtinSum(args []float64) (float64, error) {
	if len(args) == 0 {
		return 0, fmt.Errorf("sum requires at least 1 argument")
	}
	sum := 0.0
	for _, v := range args {
		sum += v
	}
	return sum, nil
}

// product(...) - product of variadic args
func builtinProduct(args []float64) (float64, error) {
	if len(args) == 0 {
		return 0, fmt.Errorf("product requires at least 1 argument")
	}
	p := 1.0
	for _, v := range args {
		p *= v
	}
	return p, nil
}

// gcd(a, b) - greatest common divisor
func builtinGCD(args []float64) (float64, error) {
	if len(args) != 2 {
		return 0, fmt.Errorf("gcd requires exactly 2 arguments")
	}
	a := int64(math.Abs(args[0]))
	b := int64(math.Abs(args[1]))
	if a == 0 && b == 0 {
		return 0, nil
	}
	for b != 0 {
		a, b = b, a%b
	}
	return float64(a), nil
}

// lcm(a, b) - least common multiple
func builtinLCM(args []float64) (float64, error) {
	if len(args) != 2 {
		return 0, fmt.Errorf("lcm requires exactly 2 arguments")
	}
	a := int64(math.Abs(args[0]))
	b := int64(math.Abs(args[1]))
	if a == 0 || b == 0 {
		return 0, nil
	}
	return float64(a / gcd64(a, b) * b), nil
}

func gcd64(a, b int64) int64 {
	for b != 0 {
		a, b = b, a%b
	}
	return a
}

// fact(n) - factorial
func builtinFact(args []float64) (float64, error) {
	if len(args) != 1 {
		return 0, fmt.Errorf("fact requires exactly 1 argument")
	}
	n := int64(args[0])
	if n < 0 {
		return 0, fmt.Errorf("fact: negative input not allowed")
	}
	if n > 170 {
		return math.Inf(1), nil
	}
	result := int64(1)
	for i := int64(2); i <= n; i++ {
		result *= i
	}
	return float64(result), nil
}

// npr(n, r) - permutations
func builtinNPR(args []float64) (float64, error) {
	if len(args) != 2 {
		return 0, fmt.Errorf("npr requires exactly 2 arguments: n, r")
	}
	n, r := int64(args[0]), int64(args[1])
	if n < 0 || r < 0 || r > n {
		return 0, fmt.Errorf("npr: invalid arguments (need 0 <= r <= n)")
	}
	result := int64(1)
	for i := int64(0); i < r; i++ {
		result *= (n - i)
	}
	return float64(result), nil
}

// ncr(n, r) - combinations
func builtinNCR(args []float64) (float64, error) {
	if len(args) != 2 {
		return 0, fmt.Errorf("ncr requires exactly 2 arguments: n, r")
	}
	n, r := int64(args[0]), int64(args[1])
	if n < 0 || r < 0 || r > n {
		return 0, fmt.Errorf("ncr: invalid arguments (need 0 <= r <= n)")
	}
	if r > n-r {
		r = n - r
	}
	result := int64(1)
	for i := int64(0); i < r; i++ {
		result = result * (n - i) / (i + 1)
	}
	return float64(result), nil
}

// hypot(a, b) - sqrt(a^2 + b^2)
func builtinHypot(args []float64) (float64, error) {
	if len(args) != 2 {
		return 0, fmt.Errorf("hypot requires exactly 2 arguments")
	}
	return math.Hypot(args[0], args[1]), nil
}

// rad(degrees) - degrees to radians
func builtinRad(args []float64) (float64, error) {
	if len(args) != 1 {
		return 0, fmt.Errorf("rad requires exactly 1 argument")
	}
	return args[0] * math.Pi / 180, nil
}

// deg(radians) - radians to degrees
func builtinDeg(args []float64) (float64, error) {
	if len(args) != 1 {
		return 0, fmt.Errorf("deg requires exactly 1 argument")
	}
	return args[0] * 180 / math.Pi, nil
}

// median(...) - find the median value
func builtinMedian(args []float64) (float64, error) {
	if len(args) == 0 {
		return 0, fmt.Errorf("median requires at least 1 argument")
	}
	sorted := make([]float64, len(args))
	copy(sorted, args)
	for i := 0; i < len(sorted)-1; i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[i] > sorted[j] {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}
	n := len(sorted)
	if n%2 == 1 {
		return sorted[n/2], nil
	}
	return (sorted[n/2-1] + sorted[n/2]) / 2, nil
}

// std_dev(...) - standard deviation
func builtinStdDev(args []float64) (float64, error) {
	if len(args) < 2 {
		return 0, fmt.Errorf("std_dev requires at least 2 arguments")
	}
	v, err := builtinVariance(args)
	if err != nil {
		return 0, err
	}
	return math.Sqrt(v), nil
}

// variance(...) - population variance
func builtinVariance(args []float64) (float64, error) {
	if len(args) < 2 {
		return 0, fmt.Errorf("variance requires at least 2 arguments")
	}
	mean, _ := builtinAverage(args)
	sum := 0.0
	for _, v := range args {
		diff := v - mean
		sum += diff * diff
	}
	return sum / float64(len(args)), nil
}

// percentile(p, ...) - p-th percentile (p is 0-100)
func builtinPercentile(args []float64) (float64, error) {
	if len(args) < 2 {
		return 0, fmt.Errorf("percentile requires at least 2 arguments: p and values")
	}
	p := args[0]
	if p < 0 || p > 100 {
		return 0, fmt.Errorf("percentile: p must be between 0 and 100")
	}
	values := args[1:]
	sorted := make([]float64, len(values))
	copy(sorted, values)
	for i := 0; i < len(sorted)-1; i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[i] > sorted[j] {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}
	n := len(sorted)
	if n == 1 {
		return sorted[0], nil
	}
	idx := (p / 100) * float64(n-1)
	lower := int(idx)
	upper := lower + 1
	if upper >= n {
		return sorted[n-1], nil
	}
	frac := idx - float64(lower)
	return sorted[lower] + frac*(sorted[upper]-sorted[lower]), nil
}
