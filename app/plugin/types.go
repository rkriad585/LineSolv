package plugin

import (
	"LineSolv/app/calculator"
	"path/filepath"
)

// Manifest represents a plugin's JSON manifest file.
type Manifest struct {
	Name        string            `json:"name"`
	Version     string            `json:"version"`
	Description string            `json:"description"`
	Author      string            `json:"author"`
	Homepage    string            `json:"homepage,omitempty"`
	Functions   []FunctionDef    `json:"functions,omitempty"`
	Themes      []ThemeDef       `json:"themes,omitempty"`
	Variables   []VariableDef    `json:"variables,omitempty"`
}

// FunctionDef defines a custom function provided by a plugin.
type FunctionDef struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Args        int      `json:"args"`        // -1 = variadic
	MinArgs     int      `json:"min_args"`
	MaxArgs     int      `json:"max_args"`    // -1 = unlimited
	Expression  string   `json:"expression,omitempty"`  // math expression using a,b,c... as args
	Builtin     string   `json:"builtin,omitempty"`     // pre-defined operation name
	Examples    []string `json:"examples,omitempty"`
}

// ThemeDef defines a custom theme provided by a plugin.
type ThemeDef struct {
	ID      string            `json:"id"`
	Label   string            `json:"label"`
	Colors  map[string]string `json:"colors"`
}

// VariableDef defines a custom constant provided by a plugin.
type VariableDef struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Value       float64 `json:"value"`
}

// Plugin represents a loaded plugin with its manifest and runtime state.
type Plugin struct {
	Manifest    *Manifest `json:"manifest"`
	Dir         string    `json:"dir"`
	Enabled     bool      `json:"enabled"`
	Error       string    `json:"error,omitempty"`
	functionMap map[string]calculator.PluginFunction
	themeMap    map[string]ThemeDef
	varMap      map[string]float64
}

// ManifestPath returns the path to the plugin's manifest file.
func (p *Plugin) ManifestPath() string {
	return filepath.Join(p.Dir, "plugin.json")
}

// PluginDir returns the plugin's own directory.
func (p *Plugin) PluginDir() string {
	return p.Dir
}

// GetFunctionMap returns the plugin's function map.
func (p *Plugin) GetFunctionMap() map[string]calculator.PluginFunction {
	return p.functionMap
}

// GetVarMap returns the plugin's variable map.
func (p *Plugin) GetVarMap() map[string]float64 {
	return p.varMap
}

// GetThemes returns the plugin's themes as a slice.
func (p *Plugin) GetThemes() []ThemeDef {
	var themes []ThemeDef
	for _, t := range p.themeMap {
		themes = append(themes, t)
	}
	return themes
}
