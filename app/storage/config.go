package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Config struct {
	App struct {
		Theme   string `toml:"theme"`
		Version string `toml:"version"`
	} `toml:"app"`
	Notes struct {
		LastActive string `toml:"last_active"`
		SortBy     string `toml:"sort_by"`
	} `toml:"notes"`
	Behavior struct {
		DeleteWithoutConfirm string `toml:"delete_without_confirm"`
	} `toml:"behavior"`
	Settings struct {
		FontSize            string `toml:"font_size"`
		FontFamily          string `toml:"font_family"`
		ShortcutOverrides   string `toml:"shortcut_overrides"`
		AutocompleteEnabled string `toml:"autocomplete_enabled"`
		AnimationsEnabled   string `toml:"animations_enabled"`
		ToastEnabled        string `toml:"toast_enabled"`
		Opacity             string `toml:"opacity"`
		LineNumbersEnabled  string `toml:"line_numbers_enabled"`
	} `toml:"settings"`
}

func DefaultConfig() *Config {
	c := &Config{}
	c.App.Theme = "dark"
	c.App.Version = "0.1.45"
	c.Notes.SortBy = "updated"
	c.Behavior.DeleteWithoutConfirm = "false"
	c.Settings.FontSize = "16"
	c.Settings.FontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
	c.Settings.ShortcutOverrides = "{}"
	c.Settings.AutocompleteEnabled = "true"
	c.Settings.AnimationsEnabled = "true"
	c.Settings.ToastEnabled = "true"
	c.Settings.Opacity = "0.95"
	c.Settings.LineNumbersEnabled = "true"
	return c
}

func configPath() string {
	return filepath.Join(DataDir, "config.toml")
}

func LoadConfig() (*Config, error) {
	cfg := DefaultConfig()
	data, err := os.ReadFile(configPath())
	if err != nil {
		if os.IsNotExist(err) {
			return cfg, nil
		}
		return nil, err
	}
	parseConfigTOML(string(data), cfg)
	return cfg, nil
}

func SaveConfig(cfg *Config) error {
	dir := configPath()
	if err := os.MkdirAll(filepath.Dir(dir), 0700); err != nil {
		return err
	}
	var buf strings.Builder
	buf.WriteString("# LineSolv Configuration\n\n")
	buf.WriteString("[app]\n")
	buf.WriteString(fmt.Sprintf("theme = %q\n", cfg.App.Theme))
	buf.WriteString(fmt.Sprintf("version = %q\n", cfg.App.Version))
	buf.WriteString("\n[notes]\n")
	buf.WriteString(fmt.Sprintf("last_active = %q\n", cfg.Notes.LastActive))
	buf.WriteString(fmt.Sprintf("sort_by = %q\n", cfg.Notes.SortBy))
	buf.WriteString("\n[behavior]\n")
	buf.WriteString(fmt.Sprintf("delete_without_confirm = %q\n", cfg.Behavior.DeleteWithoutConfirm))
	buf.WriteString("\n[settings]\n")
	buf.WriteString(fmt.Sprintf("font_size = %q\n", cfg.Settings.FontSize))
	buf.WriteString(fmt.Sprintf("font_family = %q\n", cfg.Settings.FontFamily))
	buf.WriteString(fmt.Sprintf("shortcut_overrides = %q\n", cfg.Settings.ShortcutOverrides))
	buf.WriteString(fmt.Sprintf("autocomplete_enabled = %q\n", cfg.Settings.AutocompleteEnabled))
	buf.WriteString(fmt.Sprintf("animations_enabled = %q\n", cfg.Settings.AnimationsEnabled))
	buf.WriteString(fmt.Sprintf("toast_enabled = %q\n", cfg.Settings.ToastEnabled))
	buf.WriteString(fmt.Sprintf("opacity = %q\n", cfg.Settings.Opacity))
	buf.WriteString(fmt.Sprintf("line_numbers_enabled = %q\n", cfg.Settings.LineNumbersEnabled))
	return os.WriteFile(dir, []byte(buf.String()), 0600)
}

func parseConfigTOML(data string, cfg *Config) {
	lines := strings.Split(data, "\n")
	var section string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if strings.HasPrefix(line, "[") && strings.HasSuffix(line, "]") {
			section = strings.TrimSpace(line[1 : len(line)-1])
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		val = strings.Trim(val, "\"'")
		val = strings.ReplaceAll(val, "\\\"", "\"")
		switch section {
		case "app":
			switch key {
			case "theme":
				cfg.App.Theme = val
			case "version":
				cfg.App.Version = val
			}
		case "notes":
			switch key {
			case "last_active":
				cfg.Notes.LastActive = val
			case "sort_by":
				cfg.Notes.SortBy = val
			}
		case "behavior":
			switch key {
			case "delete_without_confirm":
				cfg.Behavior.DeleteWithoutConfirm = val
			}
		case "settings":
			switch key {
			case "font_size":
				cfg.Settings.FontSize = val
			case "font_family":
				cfg.Settings.FontFamily = val
			case "shortcut_overrides":
				cfg.Settings.ShortcutOverrides = val
			case "autocomplete_enabled":
				cfg.Settings.AutocompleteEnabled = val
			case "animations_enabled":
				cfg.Settings.AnimationsEnabled = val
			case "toast_enabled":
				cfg.Settings.ToastEnabled = val
		case "opacity":
			cfg.Settings.Opacity = val
		case "line_numbers_enabled":
			cfg.Settings.LineNumbersEnabled = val
			}
		default:
			switch key {
			case "theme":
				cfg.App.Theme = val
			case "version":
				cfg.App.Version = val
			}
		}
	}
}
