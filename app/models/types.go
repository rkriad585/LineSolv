package models

type Result struct {
	Value  float64 `json:"value"`
	Unit   string  `json:"unit,omitempty"`
	Formatted string `json:"formatted,omitempty"`
}

type PluginInfo struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Version string `json:"version"`
	Loaded  bool   `json:"loaded"`
}
