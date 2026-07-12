package plugin

import (
	"os"
	"path/filepath"
	"testing"
)

func TestValidateManifest(t *testing.T) {
	tests := []struct {
		name    string
		manifest Manifest
		wantErr bool
	}{
		{
			name: "valid with function",
			manifest: Manifest{
				Name:    "test-plugin",
				Version: "1.0.0",
				Functions: []FunctionDef{
					{Name: "add", Description: "Add two numbers", MinArgs: 2, MaxArgs: 2},
				},
			},
			wantErr: false,
		},
		{
			name: "valid with theme",
			manifest: Manifest{
				Name:    "test-plugin",
				Version: "1.0.0",
				Themes: []ThemeDef{
					{ID: "custom", Label: "Custom", Colors: map[string]string{"--accent": "#ff0000"}},
				},
			},
			wantErr: false,
		},
		{
			name: "valid with variable",
			manifest: Manifest{
				Name:    "test-plugin",
				Version: "1.0.0",
				Variables: []VariableDef{
					{Name: "golden_ratio", Description: "The golden ratio", Value: 1.618},
				},
			},
			wantErr: false,
		},
		{
			name: "missing name",
			manifest: Manifest{
				Version: "1.0.0",
				Functions: []FunctionDef{
					{Name: "add"},
				},
			},
			wantErr: true,
		},
		{
			name: "missing version",
			manifest: Manifest{
				Name: "test-plugin",
				Functions: []FunctionDef{
					{Name: "add"},
				},
			},
			wantErr: true,
		},
		{
			name: "no capabilities",
			manifest: Manifest{
				Name:    "test-plugin",
				Version: "1.0.0",
			},
			wantErr: true,
		},
		{
			name: "duplicate function names",
			manifest: Manifest{
				Name:    "test-plugin",
				Version: "1.0.0",
				Functions: []FunctionDef{
					{Name: "add"},
					{Name: "ADD"},
				},
			},
			wantErr: true,
		},
		{
			name: "duplicate theme IDs",
			manifest: Manifest{
				Name:    "test-plugin",
				Version: "1.0.0",
				Themes: []ThemeDef{
					{ID: "custom"},
					{ID: "custom"},
				},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateManifest(&tt.manifest)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateManifest() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestManagerScan(t *testing.T) {
	dir := t.TempDir()

	// Create a valid plugin
	pluginDir := filepath.Join(dir, "my-plugin")
	os.MkdirAll(pluginDir, 0755)
	manifest := `{
		"name": "my-plugin",
		"version": "1.0.0",
		"description": "A test plugin",
		"author": "Test",
		"functions": [
			{
				"name": "double",
				"description": "Doubles a number",
				"args": 1,
				"min_args": 1,
				"max_args": 1
			}
		]
	}`
	os.WriteFile(filepath.Join(pluginDir, "plugin.json"), []byte(manifest), 0644)

	// Create a plugin without manifest (should be skipped)
	os.MkdirAll(filepath.Join(dir, "no-manifest"), 0755)

	// Create a non-directory entry (should be skipped)
	os.WriteFile(filepath.Join(dir, "file.txt"), []byte("test"), 0644)

	m := NewManager(dir)
	err := m.Scan()
	if err != nil {
		t.Fatalf("Scan() error = %v", err)
	}

	plugins := m.All()
	if len(plugins) != 1 {
		t.Fatalf("expected 1 plugin, got %d", len(plugins))
	}

	p := plugins[0]
	if p.Manifest.Name != "my-plugin" {
		t.Errorf("expected name 'my-plugin', got %q", p.Manifest.Name)
	}
	if p.Manifest.Version != "1.0.0" {
		t.Errorf("expected version '1.0.0', got %q", p.Manifest.Version)
	}
	if !p.Enabled {
		t.Error("expected plugin to be enabled by default")
	}
}

func TestManagerSetEnabled(t *testing.T) {
	dir := t.TempDir()
	pluginDir := filepath.Join(dir, "test-plugin")
	os.MkdirAll(pluginDir, 0755)
	manifest := `{
		"name": "test-plugin",
		"version": "1.0.0",
		"functions": [{"name": "fn1", "args": 0, "min_args": 0, "max_args": 0}]
	}`
	os.WriteFile(filepath.Join(pluginDir, "plugin.json"), []byte(manifest), 0644)

	m := NewManager(dir)
	m.Scan()

	err := m.SetEnabled("test-plugin", false)
	if err != nil {
		t.Fatalf("SetEnabled() error = %v", err)
	}

	p, ok := m.Get("test-plugin")
	if !ok {
		t.Fatal("plugin not found")
	}
	if p.Enabled {
		t.Error("expected plugin to be disabled")
	}

	// Test non-existent plugin
	err = m.SetEnabled("nonexistent", true)
	if err == nil {
		t.Error("expected error for non-existent plugin")
	}
}

func TestManagerEnabled(t *testing.T) {
	dir := t.TempDir()

	// Plugin 1 - enabled
	p1Dir := filepath.Join(dir, "plugin1")
	os.MkdirAll(p1Dir, 0755)
	os.WriteFile(filepath.Join(p1Dir, "plugin.json"), []byte(`{
		"name": "Plugin 1",
		"version": "1.0.0",
		"functions": [{"name": "fn1", "args": 0, "min_args": 0, "max_args": 0}]
	}`), 0644)

	// Plugin 2 - will be disabled
	p2Dir := filepath.Join(dir, "plugin2")
	os.MkdirAll(p2Dir, 0755)
	os.WriteFile(filepath.Join(p2Dir, "plugin.json"), []byte(`{
		"name": "Plugin 2",
		"version": "1.0.0",
		"functions": [{"name": "fn2", "args": 0, "min_args": 0, "max_args": 0}]
	}`), 0644)

	m := NewManager(dir)
	m.Scan()

	m.SetEnabled("plugin2", false)

	enabled := m.Enabled()
	if len(enabled) != 1 {
		t.Fatalf("expected 1 enabled plugin, got %d", len(enabled))
	}
	if enabled[0].Manifest.Name != "Plugin 1" {
		t.Errorf("expected 'Plugin 1', got %q", enabled[0].Manifest.Name)
	}
}

func TestManagerReload(t *testing.T) {
	dir := t.TempDir()

	// Initial scan - no plugins
	m := NewManager(dir)
	m.Scan()
	if len(m.All()) != 0 {
		t.Fatal("expected no plugins initially")
	}

	// Add a plugin
	pluginDir := filepath.Join(dir, "new-plugin")
	os.MkdirAll(pluginDir, 0755)
	os.WriteFile(filepath.Join(pluginDir, "plugin.json"), []byte(`{
		"name": "New Plugin",
		"version": "1.0.0",
		"themes": [{"id": "new-theme", "label": "New Theme", "colors": {}}]
	}`), 0644)

	// Reload
	err := m.Reload()
	if err != nil {
		t.Fatalf("Reload() error = %v", err)
	}
	if len(m.All()) != 1 {
		t.Fatal("expected 1 plugin after reload")
	}
}

func TestPluginInfo(t *testing.T) {
	p := &Plugin{
		Manifest: &Manifest{
			Name:        "test",
			Version:     "1.0.0",
			Description: "desc",
			Author:      "author",
			Homepage:    "http://example.com",
		},
		Dir:     "/tmp/test",
		Enabled: true,
	}

	info := p.Info()
	if info.Name != "test" {
		t.Errorf("expected name 'test', got %q", info.Name)
	}
	if info.Version != "1.0.0" {
		t.Errorf("expected version '1.0.0', got %q", info.Version)
	}
	if info.Author != "author" {
		t.Errorf("expected author 'author', got %q", info.Author)
	}
	if info.Homepage != "http://example.com" {
		t.Errorf("expected homepage, got %q", info.Homepage)
	}
	if !info.Enabled {
		t.Error("expected enabled")
	}
}

func TestPluginGetThemes(t *testing.T) {
	p := &Plugin{
		themeMap: map[string]ThemeDef{
			"theme1": {ID: "theme1", Label: "Theme 1"},
			"theme2": {ID: "theme2", Label: "Theme 2"},
		},
	}

	themes := p.GetThemes()
	if len(themes) != 2 {
		t.Fatalf("expected 2 themes, got %d", len(themes))
	}
}

func TestBuildFunctionExpression(t *testing.T) {
	m := NewManager(t.TempDir())
	fn := m.buildFunction(FunctionDef{
		Name:       "add",
		Expression: "a + b",
		MinArgs:    2,
		MaxArgs:    2,
	})
	result, err := fn([]float64{3, 4})
	if err != nil {
		t.Fatalf("expression function error: %v", err)
	}
	if result != 7 {
		t.Errorf("expression function = %v, want 7", result)
	}
}

func TestBuildFunctionBuiltin(t *testing.T) {
	m := NewManager(t.TempDir())
	fn := m.buildFunction(FunctionDef{
		Name:    "clamp",
		Builtin: "clamp",
		MinArgs: 3,
		MaxArgs: 3,
	})
	result, err := fn([]float64{15, 0, 10})
	if err != nil {
		t.Fatalf("builtin function error: %v", err)
	}
	if result != 10 {
		t.Errorf("builtin clamp = %v, want 10", result)
	}
}

func TestBuildFunctionNeither(t *testing.T) {
	m := NewManager(t.TempDir())
	fn := m.buildFunction(FunctionDef{
		Name:    "bad",
		MinArgs: 1,
		MaxArgs: 1,
	})
	_, err := fn([]float64{1})
	if err == nil {
		t.Error("expected error when neither expression nor builtin is set")
	}
}

func TestBuildFunctionUnknownBuiltin(t *testing.T) {
	m := NewManager(t.TempDir())
	fn := m.buildFunction(FunctionDef{
		Name:    "bad",
		Builtin: "nonexistent",
		MinArgs: 1,
		MaxArgs: 1,
	})
	_, err := fn([]float64{1})
	if err == nil {
		t.Error("expected error for unknown builtin")
	}
}

func TestBuildFunctionArgValidation(t *testing.T) {
	m := NewManager(t.TempDir())
	fn := m.buildFunction(FunctionDef{
		Name:       "add",
		Expression: "a + b",
		MinArgs:    2,
		MaxArgs:    2,
	})
	_, err := fn([]float64{1})
	if err == nil {
		t.Error("expected error for too few args")
	}
	_, err = fn([]float64{1, 2, 3})
	if err == nil {
		t.Error("expected error for too many args")
	}
}

func TestAllNilManifest(t *testing.T) {
	m := NewManager(t.TempDir())
	m.plugins["ok"] = &Plugin{
		Manifest: &Manifest{Name: "ok", Version: "1.0.0"},
		Enabled:  true,
	}
	m.plugins["broken"] = &Plugin{
		Dir:     "/tmp/broken",
		Error:   "load failed",
		Enabled: true,
	}

	result := m.All()
	if len(result) != 2 {
		t.Fatalf("expected 2 plugins, got %d", len(result))
	}
	// Should not panic on nil manifest when sorting
	names := make([]string, len(result))
	for i, p := range result {
		if p.Manifest != nil {
			names[i] = p.Manifest.Name
		}
	}
	if names[0] != "" || names[1] != "ok" {
		t.Errorf("unexpected sort order: %v", names)
	}
}

func TestStatePersistence(t *testing.T) {
	dir := t.TempDir()
	m := NewManager(dir)

	// Create a plugin
	pluginDir := filepath.Join(dir, "test-plugin")
	os.MkdirAll(pluginDir, 0755)
	os.WriteFile(filepath.Join(pluginDir, "plugin.json"), []byte(`{
		"name": "test-plugin",
		"version": "1.0.0",
		"functions": [{"name": "fn1", "description": "test", "min_args": 0, "max_args": 0, "expression": "1"}]
	}`), 0644)

	m.Scan()
	if !m.plugins["test-plugin"].Enabled {
		t.Error("plugin should be enabled by default")
	}

	// Disable it
	m.SetEnabled("test-plugin", false)

	// Create new manager and scan - should persist
	m2 := NewManager(dir)
	m2.Scan()
	if m2.plugins["test-plugin"].Enabled {
		t.Error("plugin should be disabled after persistence")
	}
}

func TestLoadPluginWithExpression(t *testing.T) {
	dir := t.TempDir()
	m := NewManager(dir)

	pluginDir := filepath.Join(dir, "expr-plugin")
	os.MkdirAll(pluginDir, 0755)
	os.WriteFile(filepath.Join(pluginDir, "plugin.json"), []byte(`{
		"name": "expr-plugin",
		"version": "1.0.0",
		"functions": [
			{"name": "double", "description": "double a number", "min_args": 1, "max_args": 1, "expression": "a * 2"},
			{"name": "add3", "description": "add three numbers", "min_args": 3, "max_args": 3, "expression": "a + b + c"}
		]
	}`), 0644)

	err := m.Scan()
	if err != nil {
		t.Fatalf("scan error: %v", err)
	}

	p, ok := m.Get("expr-plugin")
	if !ok {
		t.Fatal("plugin not found")
	}

	fn := p.functionMap["double"]
	if fn == nil {
		t.Fatal("double function not found")
	}
	r, err := fn([]float64{5})
	if err != nil {
		t.Fatalf("double error: %v", err)
	}
	if r != 10 {
		t.Errorf("double(5) = %v, want 10", r)
	}

	fn = p.functionMap["add3"]
	r, err = fn([]float64{1, 2, 3})
	if err != nil {
		t.Fatalf("add3 error: %v", err)
	}
	if r != 6 {
		t.Errorf("add3(1,2,3) = %v, want 6", r)
	}
}

func TestLoadPluginWithBuiltin(t *testing.T) {
	dir := t.TempDir()
	m := NewManager(dir)

	pluginDir := filepath.Join(dir, "builtin-plugin")
	os.MkdirAll(pluginDir, 0755)
	os.WriteFile(filepath.Join(pluginDir, "plugin.json"), []byte(`{
		"name": "builtin-plugin",
		"version": "1.0.0",
		"functions": [
			{"name": "myclamp", "description": "clamp", "min_args": 3, "max_args": 3, "builtin": "clamp"},
			{"name": "myavg", "description": "average", "min_args": 1, "max_args": -1, "builtin": "average"}
		]
	}`), 0644)

	err := m.Scan()
	if err != nil {
		t.Fatalf("scan error: %v", err)
	}

	p, ok := m.Get("builtin-plugin")
	if !ok {
		t.Fatal("plugin not found")
	}

	fn := p.functionMap["myclamp"]
	r, err := fn([]float64{20, 0, 10})
	if err != nil {
		t.Fatalf("myclamp error: %v", err)
	}
	if r != 10 {
		t.Errorf("myclamp(20,0,10) = %v, want 10", r)
	}

	fn = p.functionMap["myavg"]
	r, err = fn([]float64{10, 20, 30})
	if err != nil {
		t.Fatalf("myavg error: %v", err)
	}
	if r != 20 {
		t.Errorf("myavg(10,20,30) = %v, want 20", r)
	}
}
