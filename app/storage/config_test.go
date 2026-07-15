package storage

import (
	"testing"
)

func TestDefaultConfig(t *testing.T) {
	c := DefaultConfig()
	if c.App.Theme != "dark" {
		t.Errorf("expected theme 'dark', got %q", c.App.Theme)
	}
	if c.App.Version != "0.1.45" {
		t.Errorf("expected version '0.1.45', got %q", c.App.Version)
	}
	if c.Notes.SortBy != "updated" {
		t.Errorf("expected sort_by 'updated', got %q", c.Notes.SortBy)
	}
	if c.Behavior.DeleteWithoutConfirm != "false" {
		t.Errorf("expected delete_without_confirm 'false', got %q", c.Behavior.DeleteWithoutConfirm)
	}
}

func TestConfigSaveAndLoad(t *testing.T) {
	dir := t.TempDir()
	old := DataDir
	DataDir = dir
	ResetCache()
	t.Cleanup(func() { DataDir = old })

	cfg := DefaultConfig()
	cfg.App.Theme = "neon"
	cfg.App.Version = "1.0.0"
	cfg.Notes.LastActive = "test-id"
	cfg.Notes.SortBy = "created"
	cfg.Behavior.DeleteWithoutConfirm = "true"
	cfg.Settings.FontSize = "18"
	cfg.Settings.FontFamily = "monospace"
	cfg.Settings.ShortcutOverrides = `{"toggle_notes": "Ctrl/Cmd+N"}`

	if err := SaveConfig(cfg); err != nil {
		t.Fatal(err)
	}

	loaded, err := LoadConfig()
	if err != nil {
		t.Fatal(err)
	}

	if loaded.App.Theme != "neon" {
		t.Errorf("expected theme 'neon', got %q", loaded.App.Theme)
	}
	if loaded.App.Version != "1.0.0" {
		t.Errorf("expected version '1.0.0', got %q", loaded.App.Version)
	}
	if loaded.Notes.LastActive != "test-id" {
		t.Errorf("expected last_active 'test-id', got %q", loaded.Notes.LastActive)
	}
	if loaded.Notes.SortBy != "created" {
		t.Errorf("expected sort_by 'created', got %q", loaded.Notes.SortBy)
	}
	if loaded.Behavior.DeleteWithoutConfirm != "true" {
		t.Errorf("expected delete_without_confirm 'true', got %q", loaded.Behavior.DeleteWithoutConfirm)
	}
	if loaded.Settings.FontSize != "18" {
		t.Errorf("expected font_size '18', got %q", loaded.Settings.FontSize)
	}
	if loaded.Settings.ShortcutOverrides != `{"toggle_notes": "Ctrl/Cmd+N"}` {
		t.Errorf("unexpected shortcut_overrides: %q", loaded.Settings.ShortcutOverrides)
	}
}

func TestConfigLoadNonexistentReturnsDefaults(t *testing.T) {
	dir := t.TempDir()
	old := DataDir
	DataDir = dir
	ResetCache()
	t.Cleanup(func() { DataDir = old })

	cfg, err := LoadConfig()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.App.Theme != "dark" {
		t.Errorf("expected default theme 'dark', got %q", cfg.App.Theme)
	}
}

func TestConfigParseTOML(t *testing.T) {
	toml := `# Comment
[app]
theme = "light"
version = "0.2.0"

[notes]
last_active = "abc123"
sort_by = "name"

[behavior]
delete_without_confirm = "true"

[settings]
font_size = "20"
font_family = "sans-serif"
shortcut_overrides = "{}"
`
	cfg := DefaultConfig()
	parseConfigTOML(toml, cfg)

	if cfg.App.Theme != "light" {
		t.Errorf("expected theme 'light', got %q", cfg.App.Theme)
	}
	if cfg.App.Version != "0.2.0" {
		t.Errorf("expected version '0.2.0', got %q", cfg.App.Version)
	}
	if cfg.Notes.LastActive != "abc123" {
		t.Errorf("expected last_active 'abc123', got %q", cfg.Notes.LastActive)
	}
	if cfg.Notes.SortBy != "name" {
		t.Errorf("expected sort_by 'name', got %q", cfg.Notes.SortBy)
	}
	if cfg.Behavior.DeleteWithoutConfirm != "true" {
		t.Errorf("expected delete_without_confirm 'true', got %q", cfg.Behavior.DeleteWithoutConfirm)
	}
	if cfg.Settings.FontSize != "20" {
		t.Errorf("expected font_size '20', got %q", cfg.Settings.FontSize)
	}
	if cfg.Settings.FontFamily != "sans-serif" {
		t.Errorf("expected font_family 'sans-serif', got %q", cfg.Settings.FontFamily)
	}
}
