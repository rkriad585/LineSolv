package calculator

import (
	"testing"
)

var benchInputs = []string{
	"what is 5 + 3 * 2",
	"$20 in euro - 5% discount",
	"2h30m in minutes",
	"twenty five percent of 200",
	"half as much as 100",
	"sin(pi/4) + cos(pi/4)",
	"what is the square root of 144 plus 12",
	"convert 100 km to miles",
	"(2 + 3) * 4 - 6 / 2",
	"1+2+3+4+5+6+7+8+9+10",
}

func BenchmarkNaturalize(b *testing.B) {
	e := NewEngine()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		for _, input := range benchInputs {
			e.naturalize(input)
		}
	}
}

func BenchmarkEvaluateLine(b *testing.B) {
	e := NewEngine()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		for _, input := range benchInputs {
			e.EvaluateLine(input)
		}
	}
}

func BenchmarkNaturalizeLong(b *testing.B) {
	e := NewEngine()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		e.naturalize("what is the total cost of 5 items at $20 each with a 15% discount and 8% sales tax added on top")
	}
}

func BenchmarkEvaluateLineLong(b *testing.B) {
	e := NewEngine()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		e.EvaluateLine("what is the total cost of 5 items at $20 each with a 15% discount and 8% sales tax added on top")
	}
}

func BenchmarkEngineNew(b *testing.B) {
	for i := 0; i < b.N; i++ {
		NewEngine()
	}
}
