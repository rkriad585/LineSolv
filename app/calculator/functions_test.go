package calculator

import (
	"testing"
)

func TestBuiltinFunctions(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"sin(0)", "0"},
		{"cos(0)", "1"},
		{"tan(0)", "0"},
		{"sqrt(4)", "2"},
		{"sqrt(2)", "1.4142135623730951"},
		{"abs(-5)", "5"},
		{"round(3.7)", "4"},
		{"floor(3.7)", "3"},
		{"ceil(3.2)", "4"},
		{"log(1)", "0"},
		{"ln(1)", "0"},
		{"log10(100)", "2"},
		{"exp(0)", "1"},
		{"exp(1)", "2.718281828459045"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("EvaluateLine(%q) unexpected error: %v", tt.input, err)
		}
		if got != tt.expected {
			t.Errorf("EvaluateLine(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestNewFunctions(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"asin(0)", "0"},
		{"asin(1)", "1.5707963267948966"},
		{"acos(1)", "0"},
		{"atan(0)", "0"},
		{"atan2(1, 1)", "0.7853981633974483"},
		{"sinh(0)", "0"},
		{"cosh(0)", "1"},
		{"tanh(0)", "0"},
		{"log2(8)", "3"},
		{"pow(2, 3)", "8"},
		{"sign(5)", "1"},
		{"sign(-3)", "-1"},
		{"sign(0)", "0"},
		{"trunc(3.7)", "3"},
		{"trunc(-3.7)", "-3"},
		{"deg(3.141592653589793)", "180"},
		{"rad(180)", "3.141592653589793"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("EvaluateLine(%q) unexpected error: %v", tt.input, err)
		}
		if got != tt.expected {
			t.Errorf("EvaluateLine(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestVariadicFunctions(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"min(1, 2, 3)", "1"},
		{"max(1, 2, 3)", "3"},
		{"sum(1, 2, 3)", "6"},
		{"avg(1, 2, 3)", "2"},
		{"min(-5, 0, 5)", "-5"},
		{"max(-5, 0, 5)", "5"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("EvaluateLine(%q) unexpected error: %v", tt.input, err)
		}
		if got != tt.expected {
			t.Errorf("EvaluateLine(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestFactorial(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"fact(0)", "1"},
		{"factorial(1)", "1"},
		{"fact(5)", "120"},
		{"factorial(10)", "3628800"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("EvaluateLine(%q) unexpected error: %v", tt.input, err)
		}
		if got != tt.expected {
			t.Errorf("EvaluateLine(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestGCDLCM(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"gcd(12, 8)", "4"},
		{"gcd(7, 13)", "1"},
		{"lcm(4, 6)", "12"},
		{"lcm(6, 8)", "24"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("EvaluateLine(%q) unexpected error: %v", tt.input, err)
		}
		if got != tt.expected {
			t.Errorf("EvaluateLine(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestRandom(t *testing.T) {
	e := NewEngine()
	got, err := e.EvaluateLine("rand()")
	if err != nil {
		t.Errorf("EvaluateLine('rand()') unexpected error: %v", err)
	}
	if got == "" {
		t.Error("rand() returned empty string")
	}

	got2, err2 := e.EvaluateLine("random(10)")
	if err2 != nil {
		t.Errorf("EvaluateLine('random(10)') unexpected error: %v", err2)
	}
	if got2 == "" {
		t.Error("random(10) returned empty string")
	}
}

func TestFunction_ArgumentErrors(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input   string
		wantErr bool
	}{
		{"sin()", true},
		{"sin(1, 2)", true},
		{"pow(2)", true},
		{"unknownFunc(5)", true},
		{"fact(-1)", true},
		{"factorial(1.5)", true},
		{"factorial(100)", true},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if tt.wantErr && got != "" {
			t.Errorf("EvaluateLine(%q) expected empty result, got %q", tt.input, got)
		}
		if !tt.wantErr && err != nil {
			t.Errorf("EvaluateLine(%q) unexpected error: %v", tt.input, err)
		}
	}
}

func TestFract(t *testing.T) {
	e := NewEngine()
	got, err := e.EvaluateLine("fract(3.7)")
	if err != nil {
		t.Errorf("EvaluateLine('fract(3.7)') unexpected error: %v", err)
	}
	if got == "" {
		t.Error("fract(3.7) returned empty string")
	}

	got2, err2 := e.EvaluateLine("fract(5)")
	if err2 != nil {
		t.Errorf("EvaluateLine('fract(5)') unexpected error: %v", err2)
	}
	if got2 != "0" {
		t.Errorf("fract(5) = %q, want '0'", got2)
	}
}
