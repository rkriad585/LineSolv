package plugin

import (
	"math"
	"testing"
)

func TestEvalExprArithmetic(t *testing.T) {
	tests := []struct {
		expr string
		args []float64
		want float64
	}{
		{"a + b", []float64{2, 3}, 5},
		{"a - b", []float64{10, 3}, 7},
		{"a * b", []float64{4, 5}, 20},
		{"a / b", []float64{10, 2}, 5},
		{"a ^ b", []float64{2, 3}, 8},
		{"a % b", []float64{10, 3}, 1},
		{"a + b * c", []float64{1, 2, 3}, 7},
		{"(a + b) * c", []float64{1, 2, 3}, 9},
		{"-a", []float64{5}, -5},
		{"+a", []float64{5}, 5},
		{"a * (b + c) / d", []float64{2, 3, 4, 5}, 2.8},
	}
	for _, tt := range tests {
		got, err := EvalExpr(tt.expr, tt.args)
		if err != nil {
			t.Errorf("EvalExpr(%q, %v) error: %v", tt.expr, tt.args, err)
			continue
		}
		if math.Abs(got-tt.want) > 1e-10 {
			t.Errorf("EvalExpr(%q, %v) = %v, want %v", tt.expr, tt.args, got, tt.want)
		}
	}
}

func TestEvalExprNumbers(t *testing.T) {
	tests := []struct {
		expr string
		args []float64
		want float64
	}{
		{"42", nil, 42},
		{"3.14", nil, 3.14},
		{"1.5e2", nil, 150},
		{"0.5", nil, 0.5},
	}
	for _, tt := range tests {
		got, err := EvalExpr(tt.expr, tt.args)
		if err != nil {
			t.Errorf("EvalExpr(%q, %v) error: %v", tt.expr, tt.args, err)
			continue
		}
		if math.Abs(got-tt.want) > 1e-10 {
			t.Errorf("EvalExpr(%q, %v) = %v, want %v", tt.expr, tt.args, got, tt.want)
		}
	}
}

func TestEvalExprFunctions(t *testing.T) {
	tests := []struct {
		expr string
		args []float64
		want float64
	}{
		{"min(a, b)", []float64{3, 5}, 3},
		{"max(a, b)", []float64{3, 5}, 5},
		{"abs(a)", []float64{-5}, 5},
		{"sqrt(a)", []float64{9}, 3},
		{"sin(a)", []float64{0}, 0},
		{"cos(a)", []float64{0}, 1},
		{"log(a)", []float64{100}, 2},
		{"ln(a)", []float64{math.E}, 1},
		{"exp(a)", []float64{1}, math.E},
		{"pow(a, b)", []float64{2, 3}, 8},
		{"floor(a)", []float64{3.7}, 3},
		{"ceil(a)", []float64{3.2}, 4},
		{"round(a)", []float64{3.5}, 4},
	}
	for _, tt := range tests {
		got, err := EvalExpr(tt.expr, tt.args)
		if err != nil {
			t.Errorf("EvalExpr(%q, %v) error: %v", tt.expr, tt.args, err)
			continue
		}
		if math.Abs(got-tt.want) > 1e-10 {
			t.Errorf("EvalExpr(%q, %v) = %v, want %v", tt.expr, tt.args, got, tt.want)
		}
	}
}

func TestEvalExprConstants(t *testing.T) {
	got, err := EvalExpr("pi()", nil)
	if err != nil {
		t.Fatalf("EvalExpr pi() error: %v", err)
	}
	if math.Abs(got-math.Pi) > 1e-10 {
		t.Errorf("pi() = %v, want %v", got, math.Pi)
	}

	got, err = EvalExpr("e()", nil)
	if err != nil {
		t.Fatalf("EvalExpr e() error: %v", err)
	}
	if math.Abs(got-math.E) > 1e-10 {
		t.Errorf("e() = %v, want %v", got, math.E)
	}
}

func TestEvalExprComplexExpressions(t *testing.T) {
	// clamp expression: max(b, min(c, a))
	got, err := EvalExpr("max(b, min(c, a))", []float64{15, 0, 10})
	if err != nil {
		t.Fatalf("clamp expr error: %v", err)
	}
	if got != 10 {
		t.Errorf("max(b, min(c, a)) with [15,0,10] = %v, want 10", got)
	}

	// lerp expression: a + (b - a) * t
	got, err = EvalExpr("a + (b - a) * c", []float64{0, 100, 0.5})
	if err != nil {
		t.Fatalf("lerp expr error: %v", err)
	}
	if got != 50 {
		t.Errorf("lerp expr = %v, want 50", got)
	}

	// Pythagorean: sqrt(a^2 + b^2)
	got, err = EvalExpr("sqrt(a^2 + b^2)", []float64{3, 4})
	if err != nil {
		t.Fatalf("pythagorean expr error: %v", err)
	}
	if got != 5 {
		t.Errorf("pythagorean = %v, want 5", got)
	}
}

func TestEvalExprErrors(t *testing.T) {
	_, err := EvalExpr("a +", []float64{1})
	if err == nil {
		t.Error("expected error for trailing operator")
	}

	_, err = EvalExpr("unknown_func(a)", []float64{1})
	if err == nil {
		t.Error("expected error for unknown function")
	}

	_, err = EvalExpr("unknown_var", nil)
	if err == nil {
		t.Error("expected error for unknown variable")
	}

	_, err = EvalExpr("(a + b", []float64{1, 2})
	if err == nil {
		t.Error("expected error for unmatched paren")
	}

	_, err = EvalExpr("10 / 0", nil)
	if err == nil {
		t.Error("expected error for division by zero")
	}

	_, err = EvalExpr("", nil)
	if err == nil {
		t.Error("expected error for empty expression")
	}
}

func TestEvalExprPrecedence(t *testing.T) {
	// a + b * c should be 1 + 2 * 3 = 7, not (1 + 2) * 3 = 9
	got, err := EvalExpr("a + b * c", []float64{1, 2, 3})
	if err != nil {
		t.Fatalf("error: %v", err)
	}
	if got != 7 {
		t.Errorf("precedence test: got %v, want 7", got)
	}

	// a ^ b * c should be (a^b) * c = 8 * 3 = 24 (^ is right-assoc, higher than *)
	got, err = EvalExpr("a ^ b * c", []float64{2, 3, 3})
	if err != nil {
		t.Fatalf("error: %v", err)
	}
	if got != 24 {
		t.Errorf("power precedence test: got %v, want 24", got)
	}
}
