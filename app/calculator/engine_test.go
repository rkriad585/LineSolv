package calculator

import (
	"testing"
)

func TestNewEngine(t *testing.T) {
	e := NewEngine()
	if e == nil {
		t.Fatal("NewEngine returned nil")
	}
	if e.variables == nil {
		t.Fatal("engine variables map not initialized")
	}
}

func TestEvaluateLine_BasicArithmetic(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"1+1", "2"},
		{"2*3", "6"},
		{"10/2", "5"},
		{"2+3*4", "14"},
		{"(2+3)*4", "20"},
		{"2^3", "8"},
		{"2^3^2", "64"},
		{"-5", "-5"},
		{"+5", "5"},
		{"0", "0"},
		{"42", "42"},
		{"3.5+1.2", "4.7"},
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

func TestEvaluateLine_NaturalLanguage(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"twenty five plus 3", "28"},
		{"what is 2+2", "4"},
		{"calculate 10*10", "100"},
		{"2 plus 2", "4"},
		{"10 minus 3", "7"},
		{"5 times 4", "20"},
		{"20 divided by 5", "4"},
		{"2 to the power of 3", "8"},
		{"10 mod 3", "1"},
		{"twenty five", "25"},
		{"one hundred", "100"},
		{"two thousand", "2000"},
		{"hi what is one plus one", "2"},
		{"hello how much is 5 + 3", "8"},
		{"hey there calculate 6 times 7", "42"},
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

func TestEvaluateLine_Variables(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"x = 10", "x = 10"},
		{"x * 2", "20"},
		{"y = x + 5", "y = 15"},
		{"y", "15"},
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

func TestEvaluateLine_ContextReferences(t *testing.T) {
	e := NewEngine()
	e.EvaluateLine("10")
	tests := []struct {
		input    string
		expected string
	}{
		{"that", "10"},
		{"then * 2", "20"},
		{"result + 5", "25"},
		{"of that", "25"},
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

func TestEvaluateLine_Percentages(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"10% of 200", "20"},
		{"100 + 15%", "115"},
		{"200 - 10%", "180"},
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

func TestEvaluateLine_UnitConversion(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"10 inches in cm", "25.4 cm"},
		{"1 m in cm", "100 cm"},
		{"100 c to f", "212.0 \u00b0F"},
		{"1 kg in lb", "2.205 lb"},
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

func TestEvaluateLine_Constants(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"pi", "3.141592653589793"},
		{"\u03c0", "3.141592653589793"},
		{"e", "2.718281828459045"},
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

func TestEvaluateLine_Errors(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		wantErr  bool
	}{
		{"1/0", true},
		{"5 % 0", true},
		{"unknownVar", true},
		{"", false},
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

func TestEvaluateAll(t *testing.T) {
	e := NewEngine()
	input := "x = 10\nx * pi\ntwenty five + 3\n\n# comment"
	results := e.EvaluateAll(input)
	if len(results) != 5 {
		t.Fatalf("EvaluateAll returned %d results, want 5", len(results))
	}
	if results[0] != "x = 10" {
		t.Errorf("line 0 = %q, want %q", results[0], "x = 10")
	}
	if results[1] != "31.41592653589793" {
		t.Errorf("line 1 = %q, want %q", results[1], "31.41592653589793")
	}
	if results[2] != "28" {
		t.Errorf("line 2 = %q, want %q", results[2], "28")
	}
	if results[3] != "" {
		t.Errorf("line 3 (empty) = %q, want empty", results[3])
	}
	if results[4] != "" {
		t.Errorf("line 4 (comment) = %q, want empty string or error", results[4])
	}
}

func TestEvaluateLine_Modulo(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"10 % 3", "1"},
		{"7 % 2.5", "2"},
		{"5.7 % 2.3", "1.1000000000000005"},
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

func TestEvaluateLine_Whitespace(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"  1+1  ", "2"},
		{"\t2+2", "4"},
		{"  5   +   5  ", "10"},
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

func TestEvaluateLine_InputTooLong(t *testing.T) {
	e := NewEngine()
	longInput := string(make([]byte, maxInputLength+1))
	got, err := e.EvaluateLine(longInput)
	if err == nil {
		t.Error("expected error for input exceeding max length")
	}
	if got != "" {
		t.Errorf("expected empty result for input exceeding max length, got %q", got)
	}
}

func TestHistory(t *testing.T) {
	e := NewEngine()
	if len(e.GetHistory()) != 0 {
		t.Error("expected empty history initially")
	}
	e.EvaluateLine("42")
	e.EvaluateLine("2+2")
	hist := e.GetHistory()
	if len(hist) != 2 {
		t.Fatalf("expected 2 history entries, got %d", len(hist))
	}
	if hist[0].Input != "42" || hist[0].Output != "42" {
		t.Errorf("history[0] = %+v", hist[0])
	}
	if hist[1].Input != "2+2" || hist[1].Output != "4" {
		t.Errorf("history[1] = %+v", hist[1])
	}
	e.ClearHistory()
	if len(e.GetHistory()) != 0 {
		t.Error("expected empty history after ClearHistory")
	}
}

func TestEvaluateLine_NaturalizePipeline(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"what is the sum of twenty five and thirty", "55"},
		{"find the value of 2 times 3 plus 4", "10"},
		{"how much is one hundred plus fifty percent", "150"},
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

func TestEvaluateLine_PEMDAS(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"2+3*4-6/2", "11"},
		{"(2+3)*(4-1)", "15"},
		{"2^3+1", "9"},
		{"-(2^2)", "-4"},
		{"(-2)^2", "4"},
		{"2*3^2", "18"},
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
