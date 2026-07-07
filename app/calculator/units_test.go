package calculator

import (
	"testing"
)

func TestConvertUnit_Length(t *testing.T) {
	tests := []struct {
		val      float64
		from     string
		to       string
		expected string
	}{
		{1, "m", "cm", "100 cm"},
		{10, "inches", "cm", "25.4 cm"},
		{1, "km", "m", "1000 m"},
		{1, "mile", "km", "1.609 km"},
		{1, "ft", "inch", "12 inch"},
		{0, "m", "cm", "0 cm"},
	}
	for _, tt := range tests {
		got := convertUnit(tt.val, tt.from, tt.to)
		if got != tt.expected {
			t.Errorf("convertUnit(%v, %q, %q) = %q, want %q", tt.val, tt.from, tt.to, got, tt.expected)
		}
	}
}

func TestConvertUnit_Mass(t *testing.T) {
	tests := []struct {
		val      float64
		from     string
		to       string
		expected string
	}{
		{1, "kg", "lb", "2.205 lb"},
		{453.592, "g", "lb", "1 lb"},
		{1, "oz", "g", "28.35 g"},
	}
	for _, tt := range tests {
		got := convertUnit(tt.val, tt.from, tt.to)
		if got != tt.expected {
			t.Errorf("convertUnit(%v, %q, %q) = %q, want %q", tt.val, tt.from, tt.to, got, tt.expected)
		}
	}
}

func TestConvertUnit_Temperature(t *testing.T) {
	tests := []struct {
		val      float64
		from     string
		to       string
		expected string
	}{
		{0, "c", "f", "32.0 °F"},
		{100, "celsius", "fahrenheit", "212.0 °F"},
		{32, "f", "celsius", "0.0 °C"},
		{212, "f", "c", "100.0 °C"},
	}
	for _, tt := range tests {
		got := convertUnit(tt.val, tt.from, tt.to)
		if got != tt.expected {
			t.Errorf("convertUnit(%v, %q, %q) = %q, want %q", tt.val, tt.from, tt.to, got, tt.expected)
		}
	}
}

func TestConvertUnit_Currency(t *testing.T) {
	tests := []struct {
		val      float64
		from     string
		to       string
		expected string
	}{
	{100, "USD", "EUR", "87.72 EUR"},
	{100, "EUR", "USD", "114.00 USD"},
	{100, "GBP", "USD", "133.00 USD"},
	}
	for _, tt := range tests {
		got := convertUnit(tt.val, tt.from, tt.to)
		if got != tt.expected {
			t.Errorf("convertUnit(%v, %q, %q) = %q, want %q", tt.val, tt.from, tt.to, got, tt.expected)
		}
	}
}

func TestConvertUnit_Volume(t *testing.T) {
	tests := []struct {
		val      float64
		from     string
		to       string
		expected string
	}{
		{1, "l", "ml", "1000 ml"},
		{1, "gal", "l", "3.785 l"},
		{1, "cup", "ml", "236.6 ml"},
	}
	for _, tt := range tests {
		got := convertUnit(tt.val, tt.from, tt.to)
		if got != tt.expected {
			t.Errorf("convertUnit(%v, %q, %q) = %q, want %q", tt.val, tt.from, tt.to, got, tt.expected)
		}
	}
}

func TestConvertUnit_UnknownUnits(t *testing.T) {
	got := convertUnit(10, "unknown", "cm")
	if got != "10 unknown → cm" {
		t.Errorf("expected fallback format, got %q", got)
	}
}

func TestRegisterUnit(t *testing.T) {
	e := NewEngine()
	e.RegisterUnit("furlong", "furlongs", "", 201.168)
	got := convertUnit(1, "furlong", "m")
	if got != "201.2 m" {
		t.Errorf("RegisterUnit test: got %q, want %q", got, "201.2 m")
	}
}

func TestConvertUnit_EdgeCases(t *testing.T) {
	tests := []struct {
		name string
		val  float64
		from string
		to   string
	}{
		{"negative length", -10, "m", "cm"},
		{"same unit", 5, "m", "m"},
		{"zero", 0, "km", "m"},
	}
	for _, tt := range tests {
		got := convertUnit(tt.val, tt.from, tt.to)
		if got == "" {
			t.Errorf("convertUnit(%v, %q, %q) returned empty for case %q", tt.val, tt.from, tt.to, tt.name)
		}
	}
}
