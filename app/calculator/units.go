package calculator

import (
	"fmt"
	"strings"
)

type unitInfo struct {
	name string
	toSI float64
}

var unitDB = map[string]unitInfo{
	"m":            {"meter", 1},
	"meter":        {"meter", 1},
	"meters":       {"meter", 1},
	"km":           {"kilometer", 1000},
	"kilometer":    {"kilometer", 1000},
	"kilometers":   {"kilometer", 1000},
	"cm":           {"centimeter", 0.01},
	"centimeter":   {"centimeter", 0.01},
	"centimeters":  {"centimeter", 0.01},
	"mm":           {"millimeter", 0.001},
	"millimeter":   {"millimeter", 0.001},
	"millimeters":  {"millimeter", 0.001},
	"inch":         {"inch", 0.0254},
	"inches":       {"inch", 0.0254},
	"in":           {"inch", 0.0254},
	"ft":           {"foot", 0.3048},
	"foot":         {"foot", 0.3048},
	"feet":         {"foot", 0.3048},
	"yard":         {"yard", 0.9144},
	"yards":        {"yard", 0.9144},
	"yd":           {"yard", 0.9144},
	"mile":         {"mile", 1609.344},
	"miles":        {"mile", 1609.344},
	"g":            {"gram", 1},
	"gram":         {"gram", 1},
	"grams":        {"gram", 1},
	"kg":           {"kilogram", 1000},
	"kilogram":     {"kilogram", 1000},
	"kilograms":    {"kilogram", 1000},
	"lb":           {"pound", 453.592},
	"lbs":          {"pound", 453.592},
	"pound":        {"pound", 453.592},
	"pounds":       {"pound", 453.592},
	"oz":           {"ounce", 28.3495},
	"ounce":        {"ounce", 28.3495},
	"ounces":       {"ounce", 28.3495},
	"l":            {"liter", 1},
	"liter":        {"liter", 1},
	"liters":       {"liter", 1},
	"ml":           {"milliliter", 0.001},
	"milliliter":   {"milliliter", 0.001},
	"milliliters":  {"milliliter", 0.001},
	"gal":          {"gallon", 3.78541},
	"gallon":       {"gallon", 3.78541},
	"gallons":      {"gallon", 3.78541},
	"qt":           {"quart", 0.946353},
	"quart":        {"quart", 0.946353},
	"quarts":       {"quart", 0.946353},
	"cup":          {"cup", 0.236588},
	"cups":         {"cup", 0.236588},
	"c":            {"celsius", 0},
	"celsius":      {"celsius", 0},
	"f":            {"fahrenheit", 0},
	"fahrenheit":   {"fahrenheit", 0},
	"usd":          {"USD", 1},
	"eur":          {"EUR", 1.08},
	"euro":         {"EUR", 1.08},
	"euros":        {"EUR", 1.08},
	"gbp":          {"GBP", 1.26},
	"jpy":          {"JPY", 0.0067},
	"cny":          {"CNY", 0.14},
	"inr":          {"INR", 0.012},
	"cad":          {"CAD", 0.73},
	"aud":          {"AUD", 0.65},
	"chf":          {"CHF", 1.11},
}

func convertUnit(val float64, from, to string) string {
	f := strings.TrimSpace(strings.ToLower(from))
	t := strings.TrimSpace(strings.ToLower(to))
	fInfo, fOk := unitDB[f]
	tInfo, tOk := unitDB[t]
	if !fOk || !tOk {
		return fmt.Sprintf("%g %s \u2192 %s", val, from, to)
	}
	if f == "c" || f == "celsius" || t == "c" || t == "celsius" ||
		f == "f" || f == "fahrenheit" || t == "f" || t == "fahrenheit" {
		if f == "c" || f == "celsius" {
			if t == "f" || t == "fahrenheit" {
				return fmt.Sprintf("%.1f \u00b0F", val*9/5+32)
			}
		}
		if f == "f" || f == "fahrenheit" {
			if t == "c" || t == "celsius" {
				return fmt.Sprintf("%.1f \u00b0C", (val-32)*5/9)
			}
		}
	}
	if fInfo.name == "USD" || tInfo.name == "USD" ||
		fInfo.name == "EUR" || tInfo.name == "EUR" {
		var inUSD float64
		if fInfo.name == "USD" {
			inUSD = val
		} else {
			inUSD = val * fInfo.toSI
		}
		var result float64
		if tInfo.name == "USD" {
			result = inUSD
		} else {
			result = inUSD / tInfo.toSI
		}
		return fmt.Sprintf("%.2f %s", result, strings.ToUpper(t))
	}
	result := val * fInfo.toSI / tInfo.toSI
	return fmt.Sprintf("%.4g %s", result, to)
}

func (e *Engine) RegisterUnit(name string, phrases string, format string, ratio float64) {
	lower := strings.ToLower(name)
	unitDB[lower] = unitInfo{name: name, toSI: ratio}
	for _, p := range strings.Split(phrases, ",") {
		p = strings.TrimSpace(p)
		if p != "" {
			unitDB[strings.ToLower(p)] = unitInfo{name: name, toSI: ratio}
		}
	}
}
