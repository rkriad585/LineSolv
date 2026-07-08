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
		if len(parts) < 3 {
			t.Errorf("expected at least 3 parts (emoji + adj + noun), got %q (parts: %d)", name, len(parts))
		}
	}
}

func TestGenerateFancyNameContainsEmoji(t *testing.T) {
	for i := 0; i < 20; i++ {
		name := GenerateFancyName()
		hasEmoji := false
		for _, e := range fancyEmoji {
			if strings.Contains(name, e) {
				hasEmoji = true
				break
			}
		}
		if !hasEmoji {
			t.Errorf("expected fancy name to contain an emoji, got %q", name)
		}
	}
}

func TestGenerateFancyNameVariety(t *testing.T) {
	names := make(map[string]bool)
	for i := 0; i < 100; i++ {
		names[GenerateFancyName()] = true
	}
	// With 40 emojis × 42 adjectives × 23 nouns = 38,640 combinations,
	// 100 draws should give at least some variety
	if len(names) < 10 {
		t.Errorf("expected at least 10 unique names after 100 draws, got %d", len(names))
	}
}
