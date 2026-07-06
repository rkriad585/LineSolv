package calculator

import "strings"

func (e *Engine) GetVariables() map[string]float64 {
	r := make(map[string]float64, len(e.variables))
	for k, v := range e.variables {
		r[k] = v
	}
	return r
}

func (e *Engine) SetVariable(name string, val float64) {
	e.variables[strings.ToLower(name)] = val
}

func (e *Engine) ClearVariables() {
	e.variables = make(map[string]float64)
	e.lastResult = 0
}
