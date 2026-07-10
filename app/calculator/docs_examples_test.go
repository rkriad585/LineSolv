package calculator

import (
	"testing"
)

// TestAllDocExamples extracts every single example from docs/user-guide.md
// and tests them systematically.
func TestDocExamples_BasicArithmetic(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		// --- Basic Arithmetic (line 69-75) ---
		{"1 + 2", "3", "basic addition"},
		{"10 - 3", "7", "basic subtraction"},
		{"4 * 5", "20", "basic multiplication"},
		{"20 / 4", "5", "basic division"},
		{"2 ^ 3", "8", "basic power"},
		{"17 % 5", "2", "modulo"},

		// --- Natural Language (line 81-85) ---
		{"what is twenty five plus three", "28", "what is twenty five plus three"},
		{"calculate 15% of 200", "30", "calculate 15% of 200"},
		{"twenty five hundred", "2500", "twenty five hundred"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_FractionWords(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"one half", "0.5", "one half"},
		{"one third", "0.3333333333333333", "one third"},
		{"two thirds", "0.6666666666666666", "two thirds"},
		{"one quarter", "0.25", "one quarter"},
		{"three quarters", "0.75", "three quarters"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_ScaleMultiplicativeWords(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"double 5", "10", "double 5"},
		{"twice 10", "20", "twice 10"},
		{"triple 3", "9", "triple 3"},
		{"half of 20", "10", "half of 20"},
		{"quarter of 100", "25", "quarter of 100"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_PowerWords(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"5 squared", "25", "5 squared"},
		{"3 cubed", "27", "3 cubed"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_ComparisonPhrases(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"10 increased by 5", "15", "10 increased by 5"},
		{"20 decreased by 7", "13", "20 decreased by 7"},
		{"5 more than 10", "15", "5 more than 10"},
		{"3 less than 8", "5", "3 less than 8"},
		{"difference between 10 and 3", "7", "difference between 10 and 3"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_DivisionPhrases(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"10 over 2", "5", "10 over 2"},
		{"9 out of 3", "3", "9 out of 3"},
		{"ratio of 10 to 2", "5", "ratio of 10 to 2"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_MultiplicationPhrases(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"product of 4 and 3", "12", "product of 4 and 3"},
		{"sum of 10 and 5", "15", "sum of 10 and 5"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_NaturalFunctions(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"square root of 144", "12", "square root of 144"},
		{"cube root of 27", "3", "cube root of 27"},
		{"absolute value of -5", "5", "absolute value of -5"},
		{"convert 10 inches to cm", "25.4 cm", "convert 10 inches to cm"},
		{"change 100 c to f", "212.0 °F", "change 100 c to f"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			// For convert/unit tests, allow "212 °F" vs "212.0 °F"
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_OrdinalSuffixes(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"1st", "1", "1st"},
		{"2nd", "2", "2nd"},
		{"3rd", "3", "3rd"},
		{"4th", "4", "4th"},
		{"1st + 2", "3", "1st + 2"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_SINotation(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"5k", "5000", "5k"},
		{"3M", "3000000", "3M"},
		{"2B", "2000000000", "2B"},
		{"1.5K", "1500", "1.5K"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_TimeDuration(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"2h30m", "2.5", "2h30m"},
		{"2h + 1h15m", "3.25", "2h + 1h15m"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_MixedNumbers(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"2 1/2", "2.5", "2 1/2"},
		{"3 3/4", "3.75", "3 3/4"},
		{"2 1/2 + 1.5", "4", "2 1/2 + 1.5"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_PossessivePlurals(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"3 tens", "30", "3 tens"},
		{"2 hundreds", "200", "2 hundreds"},
		{"5 thousands", "5000", "5 thousands"},
		{"2 dozens", "24", "2 dozens"},
		{"3 scores", "60", "3 scores"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_CollectiveNouns(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"a couple", "2", "a couple"},
		{"a dozen", "12", "a dozen"},
		{"a score", "20", "a score"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_FromSubtract(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"10 from 100", "90", "10 from 100"},
		{"5 from 20", "15", "5 from 20"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_PercentageRelations(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"10 is what percent of 50", "20", "10 is what percent of 50"},
		{"10 is what % of 50", "20", "10 is what % of 50"},
		{"10 as a percentage of 50", "20", "10 as a percentage of 50"},
		{"50 percent of what is 25", "50", "50 percent of what is 25"},
		{"50% of what is 25", "50", "50% of what is 25"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_Factorial(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"5!", "120", "5!"},
		{"0!", "1", "0!"},
		{"3! + 2", "8", "3! + 2"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_LogBase(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"log base 2 of 8", "3", "log base 2 of 8"},
		{"log base 10 of 100", "2", "log base 10 of 100"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_Choose(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"5 choose 3", "10", "5 choose 3"},
		{"10 choose 2", "45", "10 choose 2"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_HowManyTimes(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"how many times does 5 go into 20", "4", "how many times does 5 go into 20"},
		{"how many times does 3 go in 15", "5", "how many times does 3 go in 15"},
		{"how many times does 25 go into 5k", "200", "how many times does 25 go into 5k"},
		{"how many times does 2 go into 1M", "500000", "how many times does 2 go into 1M"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_AgeBirthYear(t *testing.T) {
	// Each sub-test needs a fresh engine since "born" sets lastResult
	e1 := NewEngine()
	if got, _ := e1.EvaluateLine("born in 2007"); got != "19" {
		t.Errorf("born in 2007 = %q, want %q", got, "19")
	}
	if got, _ := e1.EvaluateLine("what is my age"); got != "19" {
		t.Errorf("what is my age = %q, want %q", got, "19")
	}

	e2 := NewEngine()
	if got, _ := e2.EvaluateLine("born 1990"); got != "36" {
		t.Errorf("born 1990 = %q, want %q", got, "36")
	}
}

func TestDocExamples_PurchaseMath(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"5 items at $20 each", "100", "5 items at $20 each"},
		{"5 items at $20 each with a 15% discount", "85", "5 items at $20 each with 15% discount"},
		{"5 items at $20 each with a 15% discount and 8% sales tax added on top", "91.8", "5 items full"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_UnitConversion(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"10 inches in cm", "25.4 cm", "10 inches in cm"},		
		{"10 inches to cm", "25.4 cm", "10 inches to cm via unit converter"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_Percentages(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"10% of 200", "20", "10% of 200"},
		{"100 + 15%", "115", "100 + 15%"},
		{"200 - 10%", "180", "200 - 10%"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_Variables(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"x = 42", "x = 42", "x = 42"},
		{"x * 2", "84", "x * 2"},
		{"y = x + 8", "y = 50", "y = x + 8"},
		{"y / 2", "25", "y / 2"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_ContextReferences(t *testing.T) {
	e := NewEngine()
	// Set up context: 42
	if got, _ := e.EvaluateLine("42"); got != "42" {
		t.Fatalf("setup 42 = %q", got)
	}
	// Each step uses the previous line's result
	if got, _ := e.EvaluateLine("of that * 2"); got != "84" {
		t.Errorf("of that * 2 = %q, want %q", got, "84")
	}
	if got, _ := e.EvaluateLine("then + 10"); got != "94" {
		t.Errorf("then + 10 = %q, want %q", got, "94")
	}
	if got, _ := e.EvaluateLine("result / 2"); got != "47" {
		t.Errorf("result / 2 = %q, want %q", got, "47")
	}
}

func TestDocExamples_CombinedPatterns(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		{"$100 + €20", "120", "$100 + €20"},
		{"2B / 5k", "400000", "2B / 5k"},
		{"a dozen + 3 scores", "72", "a dozen + 3 scores"},
		{"how many times does 25 go into 5k", "200", "how many times does 25 go into 5k"},
		{"5 choose 2 + 3!", "16", "5 choose 2 + 3!"},
		{"log base 10 of 100 + 3 squared", "11", "log base 10 of 100 + 3 squared"},
		{"double a dozen", "24", "double a dozen"},
		{"3 tens from 5 hundreds", "470", "3 tens from 5 hundreds"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}

func TestDocExamples_UserReportedPatterns(t *testing.T) {
	e := NewEngine()
	tests := []struct {
		input    string
		expected string
		desc     string
	}{
		// Bare percentage
		{"50%", "0.5", "bare 50%"},
		// Comparisons
		{"which is bigger 5 or 6", "6", "which is bigger 5 or 6"},
		{"which is smaller 10 or 8", "8", "which is smaller 10 or 8"},
		{"which is larger pi or 5", "5", "which is larger pi or 5"},
		// Imperative decrease
		{"decrease 100 by 5", "95", "decrease 100 by 5"},
		// Triangle area
		{"area of triangle with base 5 and height 10", "25", "triangle area"},
		// Cone volume
		{"volume of cone radius 3 and height 5", "47.12388980384689", "cone volume"},
		// Purchase math with leading "bought" and trailing question
		{"I bought 8 items at $5 each with a 10% discount and 6% sales tax. What's the final price?", "38.16", "bought items with discount and tax"},
		// Sales tax on income
		{"I just made $200 from a side gig. I need to set aside 8% for sales tax. How much total with tax?", "216", "side gig with sales tax"},
		// Discount on item ("off" variant, not "discount")
		{"That $200 jacket I've been eyeing is 25% off. What's the sale price?", "150", "jacket 25% off"},
		// Hourly freelance work
		{"I got 25 hours of freelance work at $37 per hour. What did I earn?", "925", "hourly freelance work"},
		// Quantity × unit price (game night)
		{"Game night is coming up. I need 5 pizzas, and each one costs $12. Just the pizzas, no discounts or tax for now.", "60", "pizza quantity unit price"},
		// Standard purchase math with platform prefix
		{"what is the total cost of 5 items at $20 each with a 15% discount and 8% sales tax added on top", "91.8", "standard purchase with discount and tax"},
	}
	for _, tt := range tests {
		got, err := e.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("%s: EvaluateLine(%q) unexpected error: %v", tt.desc, tt.input, err)
			continue
		}
		if got != tt.expected {
			t.Errorf("%s: EvaluateLine(%q) = %q, want %q", tt.desc, tt.input, got, tt.expected)
		}
	}
}
