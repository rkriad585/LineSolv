package calculator

import (
	"math"
	"regexp"
	"strconv"
	"strings"
)

// Point represents a single data point for graphing.
type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// GraphResult holds evaluation points and metadata for a plotted expression.
type GraphResult struct {
	Points     []Point `json:"points"`
	Expression string  `json:"expression"`
	From       float64 `json:"from"`
	To         float64 `json:"to"`
}

var graphPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)^(?:plot|graph)\s+(.+)$`),
	regexp.MustCompile(`(?i)^y\s*=\s*(.+)$`),
}

var rangePattern = regexp.MustCompile(`(?i)\s+from\s+(-?\d+\.?\d*)\s+to\s+(-?\d+\.?\d*)\s*$`)

func parseGraphInput(input string) (expr string, from, to float64, ok bool) {
	s := strings.TrimSpace(input)
	from = -10
	to = 10

	for _, pat := range graphPatterns {
		if m := pat.FindStringSubmatch(s); m != nil {
			expr = m[1]
			if rm := rangePattern.FindStringSubmatch(expr); rm != nil {
				from, _ = strconv.ParseFloat(rm[1], 64)
				to, _ = strconv.ParseFloat(rm[2], 64)
				if from >= to {
					from, to = -10, 10
				}
				expr = strings.TrimSpace(rangePattern.ReplaceAllString(expr, ""))
			}
			return expr, from, to, true
		}
	}
	return "", 0, 0, false
}

// EvaluateGraph evaluates a graph expression (e.g. "plot x^2") and returns points.
func (e *Engine) EvaluateGraph(input string) *GraphResult {
	expr, from, to, ok := parseGraphInput(input)
	if !ok {
		return nil
	}

	oldX, xExists := e.variables["x"]

	const numPoints = 200
	step := (to - from) / numPoints
	var pts []Point

	for i := 0; i <= numPoints; i++ {
		x := from + step*float64(i)
		e.variables["x"] = x

		res, err := e.evaluateExpr(expr)
		if err != nil {
			continue
		}
		val, parseErr := strconv.ParseFloat(res, 64)
		if parseErr != nil {
			continue
		}
		if math.IsInf(val, 0) || math.IsNaN(val) {
			continue
		}
		pts = append(pts, Point{X: x, Y: val})
	}

	if xExists {
		e.variables["x"] = oldX
	} else {
		delete(e.variables, "x")
	}

	if len(pts) == 0 {
		return nil
	}
	return &GraphResult{Points: pts, Expression: expr, From: from, To: to}
}
