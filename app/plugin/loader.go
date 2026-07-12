package plugin

import (
	"LineSolv/app/calculator"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// Manager handles plugin loading, validation, and lifecycle.
type Manager struct {
	pluginsDir string
	plugins    map[string]*Plugin
}

// NewManager creates a new plugin manager.
func NewManager(pluginsDir string) *Manager {
	return &Manager{
		pluginsDir: pluginsDir,
		plugins:    make(map[string]*Plugin),
	}
}

// Scan discovers and loads all plugins from the plugins directory.
func (m *Manager) Scan() error {
	if err := os.MkdirAll(m.pluginsDir, 0755); err != nil {
		return fmt.Errorf("failed to create plugins directory: %w", err)
	}

	entries, err := os.ReadDir(m.pluginsDir)
	if err != nil {
		return fmt.Errorf("failed to read plugins directory: %w", err)
	}

	m.plugins = make(map[string]*Plugin)

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		pluginDir := filepath.Join(m.pluginsDir, entry.Name())
		manifestPath := filepath.Join(pluginDir, "plugin.json")

		if _, err := os.Stat(manifestPath); os.IsNotExist(err) {
			continue
		}

		plugin, err := m.loadPlugin(pluginDir)
		if err != nil {
			plugin = &Plugin{
				Dir:   pluginDir,
				Error: err.Error(),
			}
		}

		m.plugins[entry.Name()] = plugin
	}

	m.loadState()

	return nil
}

// loadPlugin reads and validates a single plugin's manifest.
func (m *Manager) loadPlugin(dir string) (*Plugin, error) {
	manifestPath := filepath.Join(dir, "plugin.json")

	data, err := os.ReadFile(manifestPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read manifest: %w", err)
	}

	var manifest Manifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		return nil, fmt.Errorf("failed to parse manifest: %w", err)
	}

	if err := validateManifest(&manifest); err != nil {
		return nil, fmt.Errorf("invalid manifest: %w", err)
	}

	plugin := &Plugin{
		Manifest:     &manifest,
		Dir:          dir,
		Enabled:      true,
		functionMap:  make(map[string]calculator.PluginFunction),
		themeMap:     make(map[string]ThemeDef),
		varMap:       make(map[string]float64),
	}

	for _, fn := range manifest.Functions {
		plugin.functionMap[strings.ToLower(fn.Name)] = m.buildFunction(fn)
	}

	for _, theme := range manifest.Themes {
		plugin.themeMap[theme.ID] = theme
	}

	for _, v := range manifest.Variables {
		plugin.varMap[strings.ToLower(v.Name)] = v.Value
	}

	return plugin, nil
}

// buildFunction creates a PluginFunction from a FunctionDef.
// Supports expression evaluation (math expressions with a,b,c... as args)
// and pre-defined builtin operations (clamp, lerp, smoothstep, etc.).
func (m *Manager) buildFunction(def FunctionDef) calculator.PluginFunction {
	return func(args []float64) (float64, error) {
		if len(args) < def.MinArgs {
			return 0, fmt.Errorf("%s requires at least %d arguments, got %d", def.Name, def.MinArgs, len(args))
		}
		if def.MaxArgs >= 0 && len(args) > def.MaxArgs {
			return 0, fmt.Errorf("%s requires at most %d arguments, got %d", def.Name, def.MaxArgs, len(args))
		}

		if def.Builtin != "" {
			fn, ok := BuiltinFuncs[def.Builtin]
			if !ok {
				return 0, fmt.Errorf("unknown builtin: %s", def.Builtin)
			}
			return fn(args)
		}

		if def.Expression != "" {
			return EvalExpr(def.Expression, args)
		}

		return 0, fmt.Errorf("function %s: must declare either 'expression' or 'builtin'", def.Name)
	}
}

// validateManifest checks that a manifest has required fields.
func validateManifest(m *Manifest) error {
	if m.Name == "" {
		return fmt.Errorf("plugin name is required")
	}
	if m.Version == "" {
		return fmt.Errorf("plugin version is required")
	}
	if len(m.Functions) == 0 && len(m.Themes) == 0 && len(m.Variables) == 0 {
		return fmt.Errorf("plugin must declare at least one function, theme, or variable")
	}

	seen := make(map[string]bool)
	for _, fn := range m.Functions {
		name := strings.ToLower(fn.Name)
		if seen[name] {
			return fmt.Errorf("duplicate function name: %s", fn.Name)
		}
		seen[name] = true
	}

	seenThemes := make(map[string]bool)
	for _, theme := range m.Themes {
		if seenThemes[theme.ID] {
			return fmt.Errorf("duplicate theme ID: %s", theme.ID)
		}
		seenThemes[theme.ID] = true
	}

	return nil
}

// Get returns a plugin by name.
func (m *Manager) Get(name string) (*Plugin, bool) {
	p, ok := m.plugins[name]
	return p, ok
}

// All returns all loaded plugins sorted by name.
func (m *Manager) All() []*Plugin {
	var result []*Plugin
	for _, p := range m.plugins {
		result = append(result, p)
	}
	sort.Slice(result, func(i, j int) bool {
		nameI, nameJ := "", ""
		if result[i].Manifest != nil {
			nameI = result[i].Manifest.Name
		}
		if result[j].Manifest != nil {
			nameJ = result[j].Manifest.Name
		}
		return nameI < nameJ
	})
	return result
}

// Enabled returns only enabled plugins.
func (m *Manager) Enabled() []*Plugin {
	var result []*Plugin
	for _, p := range m.plugins {
		if p.Enabled && p.Error == "" {
			result = append(result, p)
		}
	}
	return result
}

// SetEnabled enables or disables a plugin and persists the state.
func (m *Manager) SetEnabled(name string, enabled bool) error {
	p, ok := m.plugins[name]
	if !ok {
		return fmt.Errorf("plugin not found: %s", name)
	}
	p.Enabled = enabled
	m.saveState()
	return nil
}

// Reload rescans the plugins directory.
func (m *Manager) Reload() error {
	return m.Scan()
}

// GetPluginsDir returns the plugins directory path.
func (m *Manager) GetPluginsDir() string {
	return m.pluginsDir
}

// stateFile returns the path to the state persistence file.
func (m *Manager) stateFile() string {
	return filepath.Join(m.pluginsDir, "state.json")
}

// loadState reads persisted enabled/disabled state from state.json.
func (m *Manager) loadState() {
	data, err := os.ReadFile(m.stateFile())
	if err != nil {
		return
	}
	var state map[string]bool
	if err := json.Unmarshal(data, &state); err != nil {
		return
	}
	for name, enabled := range state {
		if p, ok := m.plugins[name]; ok {
			p.Enabled = enabled
		}
	}
}

// saveState writes current enabled/disabled state to state.json.
func (m *Manager) saveState() {
	state := make(map[string]bool)
	for name, p := range m.plugins {
		state[name] = p.Enabled
	}
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return
	}
	os.WriteFile(m.stateFile(), data, 0644)
}

// PluginInfo is a JSON-serializable representation of a plugin for the frontend.
type PluginInfo struct {
	Name        string       `json:"name"`
	Version     string       `json:"version"`
	Description string       `json:"description"`
	Author      string       `json:"author"`
	Homepage    string       `json:"homepage,omitempty"`
	Dir         string       `json:"dir"`
	Enabled     bool         `json:"enabled"`
	Error       string       `json:"error,omitempty"`
	Functions   []FunctionDef `json:"functions,omitempty"`
	Themes      []ThemeDef   `json:"themes,omitempty"`
	Variables   []VariableDef `json:"variables,omitempty"`
}

// Info returns a plugin's info for the frontend.
func (p *Plugin) Info() *PluginInfo {
	if p.Manifest == nil {
		return &PluginInfo{
			Dir:     p.Dir,
			Enabled: p.Enabled,
			Error:   p.Error,
		}
	}
	return &PluginInfo{
		Name:        p.Manifest.Name,
		Version:     p.Manifest.Version,
		Description: p.Manifest.Description,
		Author:      p.Manifest.Author,
		Homepage:    p.Manifest.Homepage,
		Dir:         p.Dir,
		Enabled:     p.Enabled,
		Error:       p.Error,
		Functions:   p.Manifest.Functions,
		Themes:      p.Manifest.Themes,
		Variables:   p.Manifest.Variables,
	}
}
