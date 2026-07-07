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
	"m":           {"meter", 1},
	"meter":       {"meter", 1},
	"meters":      {"meter", 1},
	"km":          {"kilometer", 1000},
	"kilometer":   {"kilometer", 1000},
	"kilometers":  {"kilometer", 1000},
	"cm":          {"centimeter", 0.01},
	"centimeter":  {"centimeter", 0.01},
	"centimeters": {"centimeter", 0.01},
	"mm":          {"millimeter", 0.001},
	"millimeter":  {"millimeter", 0.001},
	"millimeters": {"millimeter", 0.001},
	"inch":        {"inch", 0.0254},
	"inches":      {"inch", 0.0254},
	"in":          {"inch", 0.0254},
	"ft":          {"foot", 0.3048},
	"foot":        {"foot", 0.3048},
	"feet":        {"foot", 0.3048},
	"yard":        {"yard", 0.9144},
	"yards":       {"yard", 0.9144},
	"yd":          {"yard", 0.9144},
	"mile":        {"mile", 1609.344},
	"miles":       {"mile", 1609.344},
	"g":           {"gram", 1},
	"gram":        {"gram", 1},
	"grams":       {"gram", 1},
	"kg":          {"kilogram", 1000},
	"kilogram":    {"kilogram", 1000},
	"kilograms":   {"kilogram", 1000},
	"lb":          {"pound", 453.592},
	"lbs":         {"pound", 453.592},
	"pound":       {"pound", 453.592},
	"pounds":      {"pound", 453.592},
	"oz":          {"ounce", 28.3495},
	"ounce":       {"ounce", 28.3495},
	"ounces":      {"ounce", 28.3495},
	"l":           {"liter", 1},
	"liter":       {"liter", 1},
	"liters":      {"liter", 1},
	"ml":          {"milliliter", 0.001},
	"milliliter":  {"milliliter", 0.001},
	"milliliters": {"milliliter", 0.001},
	"gal":         {"gallon", 3.78541},
	"gallon":      {"gallon", 3.78541},
	"gallons":     {"gallon", 3.78541},
	"qt":          {"quart", 0.946353},
	"quart":       {"quart", 0.946353},
	"quarts":      {"quart", 0.946353},
	"cup":         {"cup", 0.236588},
	"cups":        {"cup", 0.236588},
	"c":           {"celsius", 0},
	"celsius":     {"celsius", 0},
	"f":           {"fahrenheit", 0},
	"fahrenheit":  {"fahrenheit", 0},
	// Currency rates are approximate and hardcoded.
	// These values will drift over time and should be updated periodically.
	"usd":     {"USD", 1},
	"eur":     {"EUR", 1.14},
	"euro":    {"EUR", 1.14},
	"euros":   {"EUR", 1.14},
	"gbp":     {"GBP", 1.33},
	"sterling": {"GBP", 1.33},
	"jpy":     {"JPY", 0.00615},
	"yen":     {"JPY", 0.00615},
	"cny":     {"CNY", 0.1475},
	"yuan":    {"CNY", 0.1475},
	"inr":     {"INR", 0.0105},
	"rupee":   {"INR", 0.0105},
	"rupees":  {"INR", 0.0105},
	"cad":     {"CAD", 0.704},
	"aud":     {"AUD", 0.69},
	"chf":     {"CHF", 1.236},
	"krw":     {"KRW", 0.000645},
	"won":     {"KRW", 0.000645},
	"rub":     {"RUB", 0.0129},
	"ruble":   {"RUB", 0.0129},
	"rubles":  {"RUB", 0.0129},
	"ils":     {"ILS", 0.275},
	"shekel":  {"ILS", 0.275},
	"shekels": {"ILS", 0.275},
	"vnd":     {"VND", 0.000041},
	"dong":    {"VND", 0.000041},
	"php":     {"PHP", 0.0162},
	"peso":    {"PHP", 0.0162},
	"pesos":   {"PHP", 0.0162},
	"uah":     {"UAH", 0.027},
	"hryvnia": {"UAH", 0.027},
	"kzt":     {"KZT", 0.0021},
	"tenge":   {"KZT", 0.0021},
	"pyg":     {"PYG", 0.00013},
	"guarani": {"PYG", 0.00013},
	"ghs":     {"GHS", 0.0645},
	"cedi":    {"GHS", 0.0645},
	"try":     {"TRY", 0.0263},
	"lira":    {"TRY", 0.0263},
	"azn":     {"AZN", 0.588},
	"manat":   {"AZN", 0.588},
	"gel":     {"GEL", 0.37},
	"lari":    {"GEL", 0.37},
	"btc":     {"BTC", 64000},
	"bitcoin": {"BTC", 64000},
	"thb":     {"THB", 0.03},
	"baht":    {"THB", 0.03},
	"hkd":     {"HKD", 0.128},
	"sgd":     {"SGD", 0.77},
	"mxn":     {"MXN", 0.057},
	"zar":     {"ZAR", 0.061},
	"rand":    {"ZAR", 0.061},
	"nzd":     {"NZD", 0.57},
	"sek":     {"SEK", 0.096},
	"krona":   {"SEK", 0.096},
	"nok":     {"NOK", 0.094},
	"pln":     {"PLN", 0.25},
	"zloty":   {"PLN", 0.25},
	"brl":     {"BRL", 0.18},
	"bdt":     {"BDT", 0.0081},
	"taka":    {"BDT", 0.0081},
	"pkr":        {"PKR", 0.0035},
	"pakistani":  {"PKR", 0.0035},
	"lkr":        {"LKR", 0.0028},
	"sri-lankan": {"LKR", 0.0028},
	"npr":        {"NPR", 0.0066},
	"nepalese":   {"NPR", 0.0066},
	"myr":     {"MYR", 0.23},
	"ringgit": {"MYR", 0.23},
	"idr":     {"IDR", 0.000056},
	"rupiah":  {"IDR", 0.000056},
	"twd":     {"TWD", 0.032},
	"ntd":     {"TWD", 0.032},
	"sar":     {"SAR", 0.267},
	"riyal":   {"SAR", 0.267},
	"aed":     {"AED", 0.272},
	"dirham":  {"AED", 0.272},
	"kwd":     {"KWD", 3.28},
	"dinar":   {"KWD", 3.28},
	"egp":     {"EGP", 0.021},
	"ngn":     {"NGN", 0.00067},
	"naira":   {"NGN", 0.00067},
	"cop":     {"COP", 0.00030},
	"clp":     {"CLP", 0.0011},
	"ars":     {"ARS", 0.0012},
	"pen":     {"PEN", 0.26},
	"sol":     {"PEN", 0.26},
	"mad":     {"MAD", 0.097},
	"xau":     {"XAU", 4175},
	"gold":    {"XAU", 4175},
	"xag":     {"XAG", 48},
	"silver":  {"XAG", 48},
	// Time units (base unit: second)
	"second":  {"second", 1},
	"seconds": {"second", 1},
	"minute":  {"minute", 60},
	"minutes": {"minute", 60},
	"hour":    {"hour", 3600},
	"hours":   {"hour", 3600},
	"day":     {"day", 86400},
	"days":    {"day", 86400},
}

// convertUnit converts a value from one unit to another.
// Supports length, mass, volume, temperature (C/F), and currency conversions.
// Currency rates are approximate and hardcoded.
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

// RegisterUnit adds a custom unit to the conversion database.
// phrases is a comma-separated list of aliases; ratio is the conversion factor to SI.
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
