package calculator

import (
	"testing"
)

func TestGetVariables_Empty(t *testing.T) {
	e := NewEngine()
	v := e.GetVariables()
	if len(v) != 0 {
		t.Errorf("expected empty variables, got %d entries", len(v))
	}
}

func TestGetVariables_DefensiveCopy(t *testing.T) {
	e := NewEngine()
	e.SetVariable("x", 42)
	v := e.GetVariables()
	v["x"] = 100 // modify the returned map

	orig := e.GetVariables()
	if orig["x"] != 42 {
		t.Errorf("variables map was mutated via returned copy, got %v", orig["x"])
	}
}

func TestSetVariable(t *testing.T) {
	e := NewEngine()
	e.SetVariable("testVar", 3.14)
	v := e.GetVariables()
	if v["testvar"] != 3.14 {
		t.Errorf("SetVariable: got %v, want 3.14", v["testvar"])
	}
}

func TestClearVariables(t *testing.T) {
	e := NewEngine()
	e.SetVariable("x", 10)
	e.ClearVariables()
	v := e.GetVariables()
	if len(v) != 0 {
		t.Errorf("expected 0 variables after ClearVariables, got %d", len(v))
	}
}

func TestVariable_Overwrite(t *testing.T) {
	e := NewEngine()
	e.SetVariable("x", 10)
	e.SetVariable("x", 20)
	v := e.GetVariables()
	if v["x"] != 20 {
		t.Errorf("variable overwrite: got %v, want 20", v["x"])
	}
}

func TestVariable_CaseInsensitivity(t *testing.T) {
	e := NewEngine()
	e.SetVariable("MyVar", 100)
	e.EvaluateLine("myvar + 1")
	got, _ := e.EvaluateLine("MYVAR")
	if got != "100" && got != "101" {
		t.Errorf("case insensitivity: got %q, want 100 or 101", got)
	}
}

func TestSetVariable_ThroughEvaluateLine(t *testing.T) {
	e := NewEngine()
	e.EvaluateLine("x = 42")
	e.EvaluateLine("y = x * 2")
	v := e.GetVariables()
	if v["x"] != 42 {
		t.Errorf("x = %v, want 42", v["x"])
	}
	if v["y"] != 84 {
		t.Errorf("y = %v, want 84", v["y"])
	}
}
