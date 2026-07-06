package plugin

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func LoadPluginDirs(rt *PluginRuntime, dirs []string) (int, error) {
	loaded := 0
	for _, dir := range dirs {
		n, err := loadDir(rt, dir)
		if err != nil {
			return loaded, fmt.Errorf("loading %s: %w", dir, err)
		}
		loaded += n
	}
	return loaded, nil
}

func loadDir(rt *PluginRuntime, dir string) (int, error) {
	info, err := os.Stat(dir)
	if err != nil || !info.IsDir() {
		return 0, nil
	}

	loaded := 0
	entries, err := os.ReadDir(dir)
	if err != nil {
		return 0, err
	}

	for _, entry := range entries {
		path := filepath.Join(dir, entry.Name())
		if entry.IsDir() {
			n, err := loadDir(rt, path)
			if err != nil {
				return loaded, err
			}
			loaded += n
		} else if strings.HasSuffix(strings.ToLower(entry.Name()), ".js") {
			src, err := os.ReadFile(path)
			if err != nil {
				return loaded, fmt.Errorf("reading %s: %w", path, err)
			}
			if err := rt.RunScript(string(src)); err != nil {
				return loaded, fmt.Errorf("executing %s: %w", path, err)
			}
			loaded++
		}
	}
	return loaded, nil
}
