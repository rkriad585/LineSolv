package calculator

import "strings"

// GetVariables returns a defensive copy of all defined variables.
func (e *Engine) GetVariables() map[string]float64 {
	r := make(map[string]float64, len(e.variables))
	for k, v := range e.variables {
		r[k] = v
	}
	return r
}

// SetVariable stores a variable (names are case-insensitive, stored lowercase).
func (e *Engine) SetVariable(name string, val float64) {
	e.variables[strings.ToLower(name)] = val
}

// ClearVariables clears all stored variables and resets the last-result tracker.
func (e *Engine) ClearVariables() {
	e.variables = make(map[string]float64)
	e.lastResult = 0
}
