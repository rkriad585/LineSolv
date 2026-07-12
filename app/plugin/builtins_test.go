package plugin

import (
	"math"
	"testing"
)

func approxEqual(a, b, eps float64) bool {
	return math.Abs(a-b) < eps
}

func TestBuiltinClamp(t *testing.T) {
	r, err := builtinClamp([]float64{15, 0, 10})
	if err != nil || r != 10 {
		t.Errorf("clamp(15,0,10) = %v, %v; want 10, nil", r, err)
	}
	r, err = builtinClamp([]float64{-5, 0, 10})
	if err != nil || r != 0 {
		t.Errorf("clamp(-5,0,10) = %v, %v; want 0, nil", r, err)
	}
	r, err = builtinClamp([]float64{5, 0, 10})
	if err != nil || r != 5 {
		t.Errorf("clamp(5,0,10) = %v, %v; want 5, nil", r, err)
	}
	_, err = builtinClamp([]float64{1, 2})
	if err == nil {
		t.Error("clamp with 2 args should error")
	}
}

func TestBuiltinLerp(t *testing.T) {
	r, err := builtinLerp([]float64{0, 100, 0.5})
	if err != nil || r != 50 {
		t.Errorf("lerp(0,100,0.5) = %v; want 50", r)
	}
	r, _ = builtinLerp([]float64{10, 20, 0.25})
	if !approxEqual(r, 12.5, 1e-10) {
		t.Errorf("lerp(10,20,0.25) = %v; want 12.5", r)
	}
}

func TestBuiltinSmoothstep(t *testing.T) {
	r, err := builtinSmoothstep([]float64{0, 1, 0.5})
	if err != nil || !approxEqual(r, 0.5, 1e-10) {
		t.Errorf("smoothstep(0,1,0.5) = %v; want 0.5", r)
	}
	r, _ = builtinSmoothstep([]float64{0, 1, -1})
	if r != 0 {
		t.Errorf("smoothstep clamps below 0: got %v", r)
	}
	r, _ = builtinSmoothstep([]float64{0, 1, 2})
	if r != 1 {
		t.Errorf("smoothstep clamps above 1: got %v", r)
	}
}

func TestBuiltinWrap(t *testing.T) {
	r, err := builtinWrap([]float64{15, 0, 10})
	if err != nil || r != 5 {
		t.Errorf("wrap(15,0,10) = %v; want 5", r)
	}
	r, _ = builtinWrap([]float64{-2, 0, 10})
	if r != 8 {
		t.Errorf("wrap(-2,0,10) = %v; want 8", r)
	}
	_, err = builtinWrap([]float64{5, 10, 5})
	if err == nil {
		t.Error("wrap with min > max should error")
	}
}

func TestBuiltinAverage(t *testing.T) {
	r, err := builtinAverage([]float64{1, 2, 3})
	if err != nil || r != 2 {
		t.Errorf("average(1,2,3) = %v; want 2", r)
	}
	_, err = builtinAverage(nil)
	if err == nil {
		t.Error("average with no args should error")
	}
}

func TestBuiltinMedian(t *testing.T) {
	r, err := builtinMedian([]float64{1, 3, 5})
	if err != nil || r != 3 {
		t.Errorf("median(1,3,5) = %v; want 3", r)
	}
	r, _ = builtinMedian([]float64{1, 2, 3, 4})
	if r != 2.5 {
		t.Errorf("median(1,2,3,4) = %v; want 2.5", r)
	}
	r, _ = builtinMedian([]float64{5, 1, 3})
	if r != 3 {
		t.Errorf("median(5,1,3) = %v; want 3", r)
	}
}

func TestBuiltinStdDev(t *testing.T) {
	r, err := builtinStdDev([]float64{2, 4, 4, 4, 5, 5, 7, 9})
	if err != nil {
		t.Fatalf("std_dev error: %v", err)
	}
	if !approxEqual(r, 2.0, 0.1) {
		t.Errorf("std_dev = %v; want ~2.0", r)
	}
}

func TestBuiltinVariance(t *testing.T) {
	r, err := builtinVariance([]float64{2, 4, 4, 4, 5, 5, 7, 9})
	if err != nil {
		t.Fatalf("variance error: %v", err)
	}
	if !approxEqual(r, 4.0, 0.1) {
		t.Errorf("variance = %v; want ~4.0", r)
	}
}

func TestBuiltinPercentile(t *testing.T) {
	r, err := builtinPercentile([]float64{50, 1, 2, 3, 4, 5})
	if err != nil {
		t.Fatalf("percentile error: %v", err)
	}
	if !approxEqual(r, 3, 0.1) {
		t.Errorf("percentile(50,1,2,3,4,5) = %v; want 3", r)
	}
}

func TestBuiltinSum(t *testing.T) {
	r, err := builtinSum([]float64{1, 2, 3, 4})
	if err != nil || r != 10 {
		t.Errorf("sum(1,2,3,4) = %v; want 10", r)
	}
}

func TestBuiltinProduct(t *testing.T) {
	r, err := builtinProduct([]float64{2, 3, 4})
	if err != nil || r != 24 {
		t.Errorf("product(2,3,4) = %v; want 24", r)
	}
}

func TestBuiltinGCD(t *testing.T) {
	r, err := builtinGCD([]float64{12, 8})
	if err != nil || r != 4 {
		t.Errorf("gcd(12,8) = %v; want 4", r)
	}
	r, _ = builtinGCD([]float64{7, 5})
	if r != 1 {
		t.Errorf("gcd(7,5) = %v; want 1", r)
	}
}

func TestBuiltinLCM(t *testing.T) {
	r, err := builtinLCM([]float64{4, 6})
	if err != nil || r != 12 {
		t.Errorf("lcm(4,6) = %v; want 12", r)
	}
}

func TestBuiltinFact(t *testing.T) {
	r, err := builtinFact([]float64{5})
	if err != nil || r != 120 {
		t.Errorf("fact(5) = %v; want 120", r)
	}
	r, _ = builtinFact([]float64{0})
	if r != 1 {
		t.Errorf("fact(0) = %v; want 1", r)
	}
	_, err = builtinFact([]float64{-1})
	if err == nil {
		t.Error("fact(-1) should error")
	}
}

func TestBuiltinNCR(t *testing.T) {
	r, err := builtinNCR([]float64{5, 2})
	if err != nil || r != 10 {
		t.Errorf("ncr(5,2) = %v; want 10", r)
	}
	r, _ = builtinNCR([]float64{10, 0})
	if r != 1 {
		t.Errorf("ncr(10,0) = %v; want 1", r)
	}
}

func TestBuiltinNPR(t *testing.T) {
	r, err := builtinNPR([]float64{5, 3})
	if err != nil || r != 60 {
		t.Errorf("npr(5,3) = %v; want 60", r)
	}
}

func TestBuiltinRadDeg(t *testing.T) {
	r, err := builtinRad([]float64{180})
	if err != nil {
		t.Fatalf("rad error: %v", err)
	}
	if !approxEqual(r, math.Pi, 1e-10) {
		t.Errorf("rad(180) = %v; want pi", r)
	}
	r, _ = builtinDeg([]float64{math.Pi})
	if !approxEqual(r, 180, 1e-10) {
		t.Errorf("deg(pi) = %v; want 180", r)
	}
}

func TestBuiltinHypot(t *testing.T) {
	r, err := builtinHypot([]float64{3, 4})
	if err != nil || r != 5 {
		t.Errorf("hypot(3,4) = %v; want 5", r)
	}
}

func TestBuiltinFuncsMap(t *testing.T) {
	expected := []string{
		"clamp", "lerp", "smoothstep", "wrap", "average", "median",
		"std_dev", "variance", "percentile", "sum", "product",
		"gcd", "lcm", "fact", "npr", "ncr", "hypot", "rad", "deg",
	}
	for _, name := range expected {
		if _, ok := BuiltinFuncs[name]; !ok {
			t.Errorf("BuiltinFuncs missing %q", name)
		}
	}
}
