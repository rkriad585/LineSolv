package storage

import (
	"strings"
	"testing"
)

func TestGenerateFancyNameNotEmpty(t *testing.T) {
	name := GenerateFancyName()
	if name == "" {
		t.Error("expected non-empty fancy name")
	}
}

func TestGenerateFancyNameFormat(t *testing.T) {
	for i := 0; i < 50; i++ {
		name := GenerateFancyName()
		parts := strings.Split(name, " ")
		if len(parts) != 2 {
			t.Errorf("expected 2 parts (adj + noun), got %q (parts: %d)", name, len(parts))
		}
	}
}

func TestGenerateFancyNameVariety(t *testing.T) {
	names := make(map[string]bool)
	for i := 0; i < 100; i++ {
		names[GenerateFancyName()] = true
	}
	// With 42 adjectives × 23 nouns = 966 combinations,
	// 100 draws should give at least some variety
	if len(names) < 10 {
		t.Errorf("expected at least 10 unique names after 100 draws, got %d", len(names))
	}
}
