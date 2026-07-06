package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Config struct {
	Theme   string `toml:"theme"`
	Version string `toml:"version"`
	App     struct {
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
}

func DefaultConfig() *Config {
	c := &Config{}
	c.App.Theme = "dark"
	c.App.Version = "0.1.45"
	c.Notes.SortBy = "updated"
	c.Behavior.DeleteWithoutConfirm = "false"
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
	if err := os.MkdirAll(filepath.Dir(dir), 0755); err != nil {
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
	return os.WriteFile(dir, []byte(buf.String()), 0644)
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
		default:
			switch key {
			case "theme":
				cfg.Theme = val
			case "version":
				cfg.Version = val
			}
		}
	}
}
