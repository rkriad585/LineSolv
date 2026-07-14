package calculator

import (
	"strconv"
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
		{"what is one plus one", "2"},
		{"what is one plus one?", "2"},
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
		input   string
		wantErr bool
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

func TestEvaluateLine_Fractions(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"one half", "0.5"},
		{"one third", "0.3333333333333333"},
		{"two thirds", "0.6666666666666666"},
		{"one quarter", "0.25"},
		{"three quarters", "0.75"},
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

func TestEvaluateLine_MultiplicativePrefixes(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"double 5", "10"},
		{"twice 10", "20"},
		{"triple 3", "9"},
		{"half of 20", "10"},
		{"quarter of 100", "25"},
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

func TestEvaluateLine_PowerWords(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"5 squared", "25"},
		{"3 cubed", "27"},
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

func TestEvaluateLine_ComparisonPhrases(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"10 increased by 5", "15"},
		{"20 decreased by 7", "13"},
		{"5 more than 10", "15"},
		{"3 less than 8", "5"},
		{"difference between 10 and 3", "7"},
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

func TestEvaluateLine_DivisionPhrases(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"10 over 2", "5"},
		{"9 out of 3", "3"},
		{"ratio of 10 to 2", "5"},
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

func TestEvaluateLine_MultiplicationPhrases(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"product of 4 and 3", "12"},
		{"sum of 10 and 5", "15"},
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

func TestEvaluateLine_NaturalFunctions(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"square root of 144", "12"},
		{"cube root of 27", "3"},
		{"absolute value of -5", "5"},
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

func TestEvaluateLine_ConvertPrefix(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"convert 10 inches to cm", "25.4 cm"},
		{"change 100 c to f", "212.0 \u00b0F"},
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

func TestEvaluateLine_CurrencyPrefix(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"$10", "10"},
		{"€5", "5"},
		{"£20", "20"},
		{"$1.5", "1.5"},
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

func TestEvaluateLine_OrdinalSuffix(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"1st", "1"},
		{"2nd", "2"},
		{"3rd", "3"},
		{"4th", "4"},
		{"1st + 2", "3"},
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

func TestEvaluateLine_SINotation(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"5k", "5000"},
		{"3M", "3000000"},
		{"2B", "2000000000"},
		{"1.5K", "1500"},
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

func TestEvaluateLine_PossessivePlurals(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"3 tens", "30"},
		{"2 hundreds", "200"},
		{"5 thousands", "5000"},
		{"2 dozens", "24"},
		{"3 scores", "60"},
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

func TestEvaluateLine_CollectiveNouns(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"a couple", "2"},
		{"a dozen", "12"},
		{"a score", "20"},
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

func TestEvaluateLine_FromSubtract(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"10 from 100", "90"},
		{"5 from 20", "15"},
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

func TestEvaluateLine_PercentageRelations(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"10 is what percent of 50", "20"},
		{"10 is what % of 50", "20"},
		{"10 as a percentage of 50", "20"},
		{"50 percent of what is 25", "50"},
		{"50% of what is 25", "50"},
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

func TestEvaluateLine_LogBase(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"log base 2 of 8", "3"},
		{"log base 10 of 100", "2"},
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

func TestEvaluateLine_Choose(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"5 choose 3", "10"},
		{"10 choose 2", "45"},
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

func TestEvaluateLine_HowManyTimes(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"how many times does 5 go into 20", "4"},
		{"how many times does 3 go in 15", "5"},
		{"how many times does 25 go into 5k", "200"},
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

func TestEvaluateLine_FactorialOp(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"5!", "120"},
		{"0!", "1"},
		{"3! + 2", "8"},
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

func TestEvaluateLine_HalfNumeric(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"half a dozen", "6"},
		{"half a million", "500000"},
		{"half a couple", "1"},
		{"half a dozen plus 3", "9"},
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

func TestEvaluateLine_TimesMoreThan(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"3 times more than 5", "20"},
		{"2 times more than 10", "30"},
		{"10 times more than 3", "33"},
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

func TestEvaluateLine_TimesAsMuchAs(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"3 times as much as 5", "15"},
		{"2 times as many as 10", "20"},
		{"10 times as big as 3", "30"},
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

func TestEvaluateLine_PercentMoreLess(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"20% more than 100", "120"},
		{"10% less than 200", "180"},
		{"50% more than 10", "15"},
		{"25% less than 80", "60"},
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

func TestEvaluateLine_AddedTo(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"5 added to 10", "15"},
		{"3 added to 20", "23"},
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

func TestEvaluateLine_PerCent(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"10 per cent of 200", "20"},
		{"50 per cent of 80", "40"},
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

func TestEvaluateLine_AdditionalPrefixes(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"work out 2 + 3", "5"},
		{"figure out 10 * 5", "50"},
		{"give me 3 + 7", "10"},
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

func TestEvaluateLine_RelativeDates(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input   string
		desc    string
		checkFn func(string) bool
	}{
		{"next week", "next week returns a date 7 days from now", func(s string) bool { return len(s) == 10 && s[4] == '-' && s[7] == '-' }},
		{"last month", "last month returns a date string", func(s string) bool { return len(s) == 10 && s[4] == '-' && s[7] == '-' }},
		{"what is next week", "prefixed next week returns a date", func(s string) bool { return len(s) == 10 && s[4] == '-' && s[7] == '-' }},
		{"2 weeks from now", "weeks from now returns a date", func(s string) bool { return len(s) == 10 && s[4] == '-' && s[7] == '-' }},
		{"3 months ago", "months ago returns a date", func(s string) bool { return len(s) == 10 && s[4] == '-' && s[7] == '-' }},
		{"today + 14 days", "today + 14 days", func(s string) bool { return len(s) == 10 && s[4] == '-' && s[7] == '-' }},
		{"today - 7 days", "today - 7 days", func(s string) bool { return len(s) == 10 && s[4] == '-' && s[7] == '-' }},
		{"March 1 + 30 days", "March 1 + 30 days", func(s string) bool { return len(s) == 10 && s[4] == '-' && s[7] == '-' }},
		{"asjeh fjfugh today + 3 months etc", "embedded today + 3 months", func(s string) bool { return len(s) == 10 && s[4] == '-' && s[7] == '-' }},
		{"ssome text march 1 + 30 days rnbnoroihnotho", "embedded march 1 + 30 days", func(s string) bool { return len(s) == 10 && s[4] == '-' && s[7] == '-' }},
		{"I completing a book at today + 14 days some others story", "embedded today + 14 days in text", func(s string) bool { return len(s) == 10 && s[4] == '-' && s[7] == '-' }},
		{"I'm start a job on today - 7 days something more", "embedded today - 7 days in text", func(s string) bool { return len(s) == 10 && s[4] == '-' && s[7] == '-' }},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("EvaluateLine(%q) unexpected error: %v", tt.input, err)
		}
		if !tt.checkFn(got) {
			t.Errorf("EvaluateLine(%q) = %q, want YYYY-MM-DD (%s)", tt.input, got, tt.desc)
		}
	}
}

func TestEvaluateLine_AgeBirthYear(t *testing.T) {
	e := NewEngine()
	curYear := 2026 // Current year
	tests := []struct {
		input    string
		expected string
	}{
		{"born in 2007", strconv.Itoa(curYear - 2007)},
		{"born 2007", strconv.Itoa(curYear - 2007)},
		{"born in 1990", strconv.Itoa(curYear - 1990)},
		{"i am born in 2007 show me my current age", strconv.Itoa(curYear - 2007)},
		{"i was born in 2007", strconv.Itoa(curYear - 2007)},
		{"what is my age", strconv.Itoa(curYear - 2007)},
		{"what is my current age", strconv.Itoa(curYear - 2007)},
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

func TestEvaluateLine_ConversationalAge(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"i am 25", "25"},
		{"i am 25 years old", "25"},
		{"i am twenty five years old", "25"},
		{"my age is 30", "30"},
		{"my age is thirty", "30"},
		{"show me 5 + 3", "8"},
		{"tell me 10 + 20", "30"},
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

func TestNormalize_Unicode(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		// Unicode multiplication/division symbols
		{"5 × 3", "15"},
		{"5 ÷ 2", "2.5"},
		// Normalisation: × → *, ÷ → /
		{"10×5", "50"},
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

func TestNormalize_ConversationalPrefixes(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"can you calculate 2+2", "4"},
		{"could you find 5*3", "15"},
		{"would you solve 10+5", "15"},
		{"will you compute 2^3", "8"},
		{"do you know 5+3", "8"},
		{"does 2+2 equal 4", "4"},
		{"i need to add 2+2", "4"},
		{"i want 5+3", "8"},
		{"i would like 10+5", "15"},
		{"i'd like 2*3", "6"},
		{"we need 5*10", "50"},
		{"we want 3+7", "10"},
		{"let's calculate 5+3", "8"},
		{"lets 2+2", "4"},
		{"determine 2^10", "1024"},
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

func TestNormalize_ThinkGuessSoPrefixes(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"i think 5+3", "8"},
		{"i guess 10+5", "15"},
		{"maybe 2+2", "4"},
		{"perhaps 5*3", "15"},
		{"probably 10/2", "5"},
		{"so 5+3", "8"},
		{"well 2+2", "4"},
		{"ok 5+3", "8"},
		{"okay 10+5", "15"},
		{"alright 2+2", "4"},
		{"right 5*3", "15"},
		{"now 2+2", "4"},
		{"like 5 plus 3", "8"},
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

func TestNormalize_ExpandedFluff(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"2+2 for me", "4"},
		{"5+3 for us", "8"},
		{"2+2 if you don't mind", "4"},
		{"5+3 if possible", "8"},
		{"2+2 if you can", "4"},
		{"5+3 quickly", "8"},
		{"2+2 real quick", "4"},
		{"5+3 right now", "8"},
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

func TestNormalize_ExpandedAgeTrailing(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"25 yrs old", "25"},
		{"30 yr old", "30"},
		{"40 years old", "40"},
		{"25 yrs of age", "25"},
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

func TestNormalize_ExpandedWordOperators(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		// Addition
		{"5 combined with 3", "8"},
		{"5 together with 3", "8"},
		{"5 along with 3", "8"},
		// Subtraction
		{"5 subtract 3", "2"},
		{"5 without 3", "2"},
		{"8 fewer 3", "5"},
		// Division
		{"10 split between 2", "5"},
		{"10 split among 2", "5"},
		{"12 shared between 3", "4"},
		{"12 shared among 3", "4"},
		{"10 divide 5", "2"},
		// Multiplication
		{"3 lots of 5", "15"},
		{"3 sets of 5", "15"},
		// Power
		{"5 exponent 3", "125"},
		{"5 to the 3", "125"},
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

func TestNormalize_NaturalFunctions(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"the square root of 144", "12"},
		{"the cube root of 27", "3"},
		{"the absolute value of -5", "5"},
		{"sine of 0", "0"},
		{"cosine of 0", "1"},
		{"tangent of 0", "0"},
		{"log of 100", "4.605170185988092"},
		{"ln of 100", "4.605170185988092"},
		{"natural log of 100", "4.605170185988092"},
		{"square 5", "25"},
		{"cube 3", "27"},
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

func TestNormalize_ContextReferences(t *testing.T) {
	e := NewEngine()
	e.EvaluateLine("42")
	tests := []struct {
		input    string
		expected string
	}{
		{"previous", "42"},
		{"prev", "42"},
		{"last", "42"},
		{"prior", "42"},
		{"previous result", "42"},
		{"last result", "42"},
		{"last answer", "42"},
		{"prior result", "42"},
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

func TestNormalize_ComparisonPhrases(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"half as much as 10", "5"},
		{"half as many as 20", "10"},
		{"quarter as much as 20", "5"},
		{"quarter as many as 40", "10"},
		{"how many 5 in 20", "4"},
		{"how many 3 are in 15", "5"},
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

func TestNormalize_PercentageExpansion(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"10 pct of 200", "20"},
		{"50 p.c. of 80", "40"},
		{"what percent of 50 is 10", "20"},
		{"what percentage of 80 is 20", "25"},
		{"10 out of 50 as a percentage", "20"},
		{"10 out of 50 as a percent", "20"},
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

func TestNormalize_TipDiscount(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"40 plus 15% tip", "46"},
		{"100 with 8% tax", "108"},
		{"200 minus 10% discount", "180"},
		{"200 after 10% discount", "180"},
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

func TestNormalize_NoiseWords(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"exactly 5 plus 3", "8"},
		{"roughly 2+2", "4"},
		{"about 10+5", "15"},
		{"approximately 5*3", "15"},
		{"say 2+2", "4"},
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

func TestNormalize_WhatEquals(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
	}{
		{"what does 2+2 equal", "4"},
		{"what is 5+3 equal to", "8"},
		{"what does 10*5 equal", "50"},
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
