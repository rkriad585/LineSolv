package storage

import (
	"fmt"
	"math/rand"
)

var fancyEmoji = []string{
	"🚀", "🌊", "🌟", "🌿", "🔥", "💡", "🎯", "🌈", "⚡", "🌙",
	"☀️", "🍃", "📐", "🎨", "🔬", "🎵", "📝", "🌌", "🏔️", "🌴",
	"🐚", "🦋", "🍀", "✨", "🎭", "🎪", "🎠", "🎡", "🏗️", "🧩",
	"💎", "🔮", "🎆", "🌺", "🪐", "🌋", "🏝️", "🎄", "🍁", "🌸",
}

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
	emoji := fancyEmoji[rand.Intn(len(fancyEmoji))]
	adj := fancyAdjectives[rand.Intn(len(fancyAdjectives))]
	noun := fancyNouns[rand.Intn(len(fancyNouns))]
	return fmt.Sprintf("%s %s %s", emoji, adj, noun)
}
