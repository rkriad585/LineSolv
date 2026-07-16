package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
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
		ResultPanelEnabled  string `toml:"result_panel_enabled"`
		LineWrapEnabled     string `toml:"line_wrap_enabled"`
		UIStyle             string `toml:"ui_style"`
		ThemeManuallySet    string `toml:"theme_manually_set"`
		Noise               string `toml:"noise"`
	} `toml:"settings"`
}

var (
	cachedConfig *Config
	configMu     sync.Mutex
)

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
	c.Settings.ResultPanelEnabled = "true"
	c.Settings.LineWrapEnabled = "true"
	c.Settings.UIStyle = "default"
	c.Settings.ThemeManuallySet = "false"
	c.Settings.Noise = "0"
	return c
}

func configPath() string {
	return filepath.Join(DataDir, "config.toml")
}

// LoadConfig returns the cached config, loading from disk on first call.
func LoadConfig() (*Config, error) {
	configMu.Lock()
	defer configMu.Unlock()

	if cachedConfig != nil {
		return cachedConfig, nil
	}

	cfg := DefaultConfig()
	data, err := os.ReadFile(configPath())
	if err != nil {
		if os.IsNotExist(err) {
			cachedConfig = cfg
			return cfg, nil
		}
		return nil, err
	}
	parseConfigTOML(string(data), cfg)
	cachedConfig = cfg
	return cfg, nil
}

// SaveConfig persists the config to disk atomically (write-to-temp + rename).
func SaveConfig(cfg *Config) error {
	configMu.Lock()
	defer configMu.Unlock()

	dir := configPath()
	if err := os.MkdirAll(filepath.Dir(dir), 0700); err != nil {
		return err
	}

	var buf strings.Builder
	buf.WriteString("# LineSolv Configuration\n\n")
	buf.WriteString("[app]\n")
	fmt.Fprintf(&buf, "theme = %q\n", cfg.App.Theme)
	fmt.Fprintf(&buf, "version = %q\n", cfg.App.Version)
	buf.WriteString("\n[notes]\n")
	fmt.Fprintf(&buf, "last_active = %q\n", cfg.Notes.LastActive)
	fmt.Fprintf(&buf, "sort_by = %q\n", cfg.Notes.SortBy)
	buf.WriteString("\n[behavior]\n")
	fmt.Fprintf(&buf, "delete_without_confirm = %q\n", cfg.Behavior.DeleteWithoutConfirm)
	buf.WriteString("\n[settings]\n")
	fmt.Fprintf(&buf, "font_size = %q\n", cfg.Settings.FontSize)
	fmt.Fprintf(&buf, "font_family = %q\n", cfg.Settings.FontFamily)
	fmt.Fprintf(&buf, "shortcut_overrides = %q\n", cfg.Settings.ShortcutOverrides)
	fmt.Fprintf(&buf, "autocomplete_enabled = %q\n", cfg.Settings.AutocompleteEnabled)
	fmt.Fprintf(&buf, "animations_enabled = %q\n", cfg.Settings.AnimationsEnabled)
	fmt.Fprintf(&buf, "toast_enabled = %q\n", cfg.Settings.ToastEnabled)
	fmt.Fprintf(&buf, "opacity = %q\n", cfg.Settings.Opacity)
	fmt.Fprintf(&buf, "line_numbers_enabled = %q\n", cfg.Settings.LineNumbersEnabled)
	fmt.Fprintf(&buf, "result_panel_enabled = %q\n", cfg.Settings.ResultPanelEnabled)
	fmt.Fprintf(&buf, "line_wrap_enabled = %q\n", cfg.Settings.LineWrapEnabled)
	fmt.Fprintf(&buf, "ui_style = %q\n", cfg.Settings.UIStyle)
	fmt.Fprintf(&buf, "theme_manually_set = %q\n", cfg.Settings.ThemeManuallySet)
	fmt.Fprintf(&buf, "noise = %q\n", cfg.Settings.Noise)

	// Atomic write: write to temp file, then rename
	tmp := dir + ".tmp"
	if err := os.WriteFile(tmp, []byte(buf.String()), 0600); err != nil {
		return err
	}
	if err := os.Rename(tmp, dir); err != nil {
		os.Remove(tmp)
		return err
	}

	cachedConfig = cfg
	return nil
}

// ResetCache clears the in-memory config cache. For use in tests only.
func ResetCache() {
	configMu.Lock()
	defer configMu.Unlock()
	cachedConfig = nil
}

// FlushPendingSave forces an immediate write of the cached config to disk.
// Called on app shutdown to prevent losing debounced saves.
func FlushPendingSave() {
	configMu.Lock()
	cfg := cachedConfig
	configMu.Unlock()
	if cfg != nil {
		if err := SaveConfig(cfg); err != nil {
			fmt.Fprintf(os.Stderr, "flush pending save: %v\n", err)
		}
	}
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
		// Properly unquote TOML strings: strip matching outer quotes only
		if len(val) >= 2 && ((val[0] == '"' && val[len(val)-1] == '"') || (val[0] == '\'' && val[len(val)-1] == '\'')) {
			val = val[1 : len(val)-1]
		}
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
			case "result_panel_enabled":
				cfg.Settings.ResultPanelEnabled = val
			case "line_wrap_enabled":
				cfg.Settings.LineWrapEnabled = val
			case "ui_style":
				cfg.Settings.UIStyle = val
			case "theme_manually_set":
				cfg.Settings.ThemeManuallySet = val
			case "noise":
				cfg.Settings.Noise = val
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
