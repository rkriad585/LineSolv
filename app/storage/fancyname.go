package storage

import (
	"fmt"
	"math/rand/v2"
)

var fancyAdjectives = []string{
	"Cosmic", "Ocean", "Stellar", "Verdant", "Blazing", "Bright",
	"Focused", "Prismatic", "Electric", "Lunar", "Solar", "Zen",
	"Geometric", "Artistic", "Scientific", "Harmonic", "Scribble",
	"Nebula", "Alpine", "Tropical", "Crystal", "Silent", "Wandering",
	"Ancient", "Modern", "Curious", "Brave", "Gentle", "Wild",
	"Calm", "Misty", "Golden", "Silver", "Crimson", "Azure",
	"Emerald", "Amber", "Pearl", "Iron", "Copper", "Shadow",
}

var fancyNouns = []string{
	"Dreams", "Thoughts", "Notes", "Ideas", "Plans", "Visions",
	"Whispers", "Echoes", "Reflections", "Patterns", "Sketches",
	"Fragments", "Horizons", "Mysteries", "Adventures", "Wonders",
	"Memories", "Discoveries", "Creations", "Journeys",
	"Experiments", "Formulas", "Theorems", "Hypotheses",
}

func GenerateFancyName() string {
	adj := fancyAdjectives[rand.IntN(len(fancyAdjectives))] //nolint:gosec // intentionally weak PRNG for name generation
	noun := fancyNouns[rand.IntN(len(fancyNouns))]          //nolint:gosec
	return fmt.Sprintf("%s %s", adj, noun)
}
