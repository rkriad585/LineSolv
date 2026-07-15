package service

import (
	"LineSolv/app/calculator"
	"LineSolv/app/plugin"
	"LineSolv/app/storage"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/blang/semver"
	"github.com/ledongthuc/pdf"
	"github.com/rhysd/go-github-selfupdate/selfupdate"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const evalTimeout = 5 * time.Second

var (
	globalCtx  context.Context
	ctxMu      sync.Mutex
	appVersion = "0.13.0"
	versionMu  sync.RWMutex
)

func SetAppContext(ctx context.Context) {
	ctxMu.Lock()
	globalCtx = ctx
	ctxMu.Unlock()
}

func getCtx() context.Context {
	ctxMu.Lock()
	defer ctxMu.Unlock()
	return globalCtx
}

// AutocompleteItem represents a single autocomplete candidate.
type AutocompleteItem struct {
	Name        string `json:"name"`
	Category    string `json:"category"`
	Description string `json:"description"`
}

type AppService struct {
	engine       *calculator.Engine
	storage      *storage.DB
	mu           sync.RWMutex
	docsContent  map[string]string
	pluginMgr    *plugin.Manager
	pluginThemes []plugin.ThemeDef
}

func NewAppService(db *storage.DB) *AppService {
	s := &AppService{
		engine:  calculator.NewEngine(),
		storage: db,
	}
	cached, err := db.GetCachedCurrencyRates()
	if err == nil && cached != nil {
		calculator.SetCurrencyRates(cached.Rates)
	}
	return s
}

// InitPlugins initializes the plugin system with the given plugins directory.
func (s *AppService) InitPlugins(pluginsDir string) {
	s.pluginMgr = plugin.NewManager(pluginsDir)
	if err := s.pluginMgr.Scan(); err != nil {
		fmt.Printf("plugin scan error: %v\n", err)
	}
	s.registerPluginFunctions()
}

func (s *AppService) SetDocs(docs map[string]string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.docsContent = docs
}

func (s *AppService) GetDocList() []string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	names := make([]string, 0, len(s.docsContent))
	for name := range s.docsContent {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}

func (s *AppService) GetDocContent(name string) string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.docsContent[name]
}

func (s *AppService) EvaluateGraph(input string) *calculator.GraphResult {
	type result struct {
		res *calculator.GraphResult
	}
	ch := make(chan result, 1)
	go func() {
		ch <- result{s.engine.EvaluateGraph(input)}
	}()
	select {
	case r := <-ch:
		return r.res
	case <-time.After(evalTimeout):
		return nil
	}
}

func (s *AppService) EvaluateLine(input string) (string, error) {
	type result struct {
		res string
		err error
	}
	ch := make(chan result, 1)
	go func() {
		r, e := s.engine.EvaluateLine(input)
		ch <- result{r, e}
	}()
	select {
	case r := <-ch:
		return r.res, r.err
	case <-time.After(evalTimeout):
		return "Error: evaluation timed out", nil
	}
}

func (s *AppService) GetSteps(input string) *calculator.EvalDetail {
	type result struct {
		res *calculator.EvalDetail
	}
	ch := make(chan result, 1)
	go func() {
		ch <- result{s.engine.GetSteps(input)}
	}()
	select {
	case r := <-ch:
		return r.res
	case <-time.After(evalTimeout):
		return &calculator.EvalDetail{Result: "Error: evaluation timed out"}
	}
}

func (s *AppService) EvaluateAll(input string) []string {
	type result struct {
		res []string
	}
	ch := make(chan result, 1)
	go func() {
		ch <- result{s.engine.EvaluateAll(input)}
	}()
	select {
	case r := <-ch:
		return r.res
	case <-time.After(evalTimeout):
		return []string{"Error: evaluation timed out"}
	}
}

func (s *AppService) GetVariables() map[string]float64 {
	return s.engine.GetVariables()
}

func (s *AppService) ClearVariables() {
	s.engine.ClearVariables()
}

func (s *AppService) GetHistory() []calculator.HistoryEntry {
	return s.engine.GetHistory()
}

func (s *AppService) ClearHistory() {
	s.engine.ClearHistory()
}

func (s *AppService) GetAllNotes() ([]storage.Note, error) {
	return s.storage.GetAllNotes()
}

func (s *AppService) CreateNote() (*storage.Note, error) {
	name := storage.GenerateFancyName()
	return s.storage.CreateNote(name)
}

func (s *AppService) ReorderNotes(noteIDs []string) error {
	return s.storage.ReorderNotes(noteIDs)
}

func (s *AppService) RenameNote(id, name string) error {
	return s.storage.RenameNote(id, name)
}

func (s *AppService) DeleteNote(id string) error {
	return s.storage.DeleteNote(id)
}

func (s *AppService) SaveNoteContent(id, content string) error {
	return s.storage.SaveNoteContent(id, content)
}

func (s *AppService) GetNote(id string) (*storage.Note, error) {
	return s.storage.GetNote(id)
}

func (s *AppService) ExportNote(id, format string) (string, error) {
	note, err := s.storage.GetNote(id)
	if err != nil {
		return "", err
	}
	return storage.ExportNote(*note, format), nil
}

func (s *AppService) GetDataDir() string {
	return storage.DataDir
}

func (s *AppService) GetDeleteWithoutConfirm() bool {
	cfg, err := storage.LoadConfig()
	if err != nil {
		return false
	}
	return cfg.Behavior.DeleteWithoutConfirm == "true"
}

func (s *AppService) SetDeleteWithoutConfirm(v bool) {
	cfg, err := storage.LoadConfig()
	if err != nil {
		return
	}
	if v {
		cfg.Behavior.DeleteWithoutConfirm = "true"
	} else {
		cfg.Behavior.DeleteWithoutConfirm = "false"
	}
	storage.SaveConfig(cfg) //nolint:errcheck
}

func (s *AppService) ExportNoteToFile(id, format string) (string, error) {
	note, err := s.storage.GetNote(id)
	if err != nil {
		return "", err
	}

	// Use ExportNoteBytes for binary-safe export (PDF), string-based for text
	contentBytes := storage.ExportNoteBytes(*note, format)
	if contentBytes == nil {
		return "", fmt.Errorf("failed to generate %s export", format)
	}

	safeName := strings.Map(func(r rune) rune {
		if r == '/' || r == '\\' || r == ':' {
			return '_'
		}
		return r
	}, note.Name)
	safeName = strings.ReplaceAll(safeName, "..", "_")

	ext := format
	filePath, err := wailsruntime.SaveFileDialog(getCtx(), wailsruntime.SaveDialogOptions{
		DefaultFilename: safeName + "." + ext,
		Filters: []wailsruntime.FileFilter{
			{DisplayName: "LineSolv Files", Pattern: "*." + ext},
			{DisplayName: "All Files", Pattern: "*"},
		},
	})
	if err != nil {
		return "", err
	}
	if filePath == "" {
		return "", nil
	}

	if err := os.WriteFile(filePath, contentBytes, 0600); err != nil {
		return "", err
	}
	return filePath, nil
}

func (s *AppService) ImportNoteFromFile() (*storage.Note, error) {
	filePath, err := wailsruntime.OpenFileDialog(getCtx(), wailsruntime.OpenDialogOptions{
		Filters: []wailsruntime.FileFilter{
			{DisplayName: "Supported Files", Pattern: "*.lv;*.txt;*.md;*.json;*.toml;*.pdf"},
			{DisplayName: "All Files", Pattern: "*"},
		},
	})
	if err != nil {
		return nil, err
	}
	if filePath == "" {
		return nil, nil
	}

	base := filepath.Base(filePath)
	name := strings.TrimSuffix(base, filepath.Ext(base))
	ext := strings.ToLower(filepath.Ext(base))

	// PDF import: extract text content
	if ext == ".pdf" {
		return s.importPDF(filePath, name)
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	content := string(data)

	if ext == ".json" {
		var parsed struct {
			Name      string `json:"name"`
			Content   string `json:"content"`
			CreatedAt int64  `json:"createdAt"`
			UpdatedAt int64  `json:"updatedAt"`
		}
		if err := json.Unmarshal(data, &parsed); err == nil && parsed.Name != "" {
			name = parsed.Name
			if parsed.Content != "" {
				content = parsed.Content
			}
			// Preserve timestamps when available
			if parsed.CreatedAt > 0 || parsed.UpdatedAt > 0 {
				return s.storage.CreateNoteWithContentAndDates(name, content, parsed.CreatedAt, parsed.UpdatedAt)
			}
		}
	}

	if ext == ".toml" {
		// Use simple string parsing for TOML name extraction (no toml library dependency)
		for _, line := range strings.Split(content, "\n") {
			line = strings.TrimSpace(line)
			if strings.HasPrefix(line, "name = ") {
				val := strings.Trim(strings.TrimPrefix(line, "name = "), "\"")
				if val != "" {
					name = val
				}
			}
			if strings.HasPrefix(line, "content = ") {
				val := strings.Trim(strings.TrimPrefix(line, "content = "), "\"")
				if val != "" {
					content = val
				}
			}
		}
	}

	return s.storage.CreateNoteWithContent(name, content)
}

func (s *AppService) importPDF(filePath, name string) (*storage.Note, error) {
	f, r, err := pdf.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("cannot open PDF: %w", err)
	}
	defer f.Close()

	var textBuilder strings.Builder
	totalPage := r.NumPage()
	for pageNum := 1; pageNum <= totalPage; pageNum++ {
		p := r.Page(pageNum)
		text, err := p.GetPlainText(nil)
		if err != nil {
			continue
		}
		textBuilder.WriteString(text)
		if pageNum < totalPage {
			textBuilder.WriteString("\n\n")
		}
	}

	content := textBuilder.String()
	return s.storage.CreateNoteWithContent(name, content)
}

// SetVersion sets the application version (called from main.go with ldflags value).
func SetVersion(v string) {
	if v != "" && v != "dev" {
		versionMu.Lock()
		defer versionMu.Unlock()
		appVersion = strings.TrimPrefix(v, "v")
	}
}

type CurrencyCacheInfo struct {
	Cached    bool   `json:"cached"`
	UpdatedAt int64  `json:"updatedAt"`
	Source    string `json:"source"`
}

func (s *AppService) GetCurrencyCacheInfo() *CurrencyCacheInfo {
	cached, err := s.storage.GetCachedCurrencyRates()
	if err != nil || cached == nil {
		return &CurrencyCacheInfo{Cached: false, Source: "hardcoded"}
	}
	return &CurrencyCacheInfo{
		Cached:    true,
		UpdatedAt: cached.UpdatedAt,
		Source:    "cache",
	}
}

func (s *AppService) UpdateCurrencyRates() (*CurrencyCacheInfo, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get("https://api.exchangerate-api.com/v4/latest/USD")
	if err != nil {
		cached, cerr := s.storage.GetCachedCurrencyRates()
		if cerr == nil && cached != nil {
			calculator.SetCurrencyRates(cached.Rates)
			return &CurrencyCacheInfo{Cached: true, UpdatedAt: cached.UpdatedAt, Source: "cache"}, nil
		}
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Rates map[string]float64 `json:"rates"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&result); err != nil {
		return nil, err
	}

	if err := s.storage.SaveCurrencyRates(result.Rates); err != nil {
		return nil, err
	}
	calculator.SetCurrencyRates(result.Rates)
	return &CurrencyCacheInfo{Cached: true, UpdatedAt: time.Now().UnixMilli(), Source: "live"}, nil
}

type SettingsData struct {
	Theme               string `json:"theme"`
	FontSize            string `json:"font_size"`
	FontFamily          string `json:"font_family"`
	ShortcutOverrides   string `json:"shortcut_overrides"`
	AutocompleteEnabled string `json:"autocomplete_enabled"`
	AnimationsEnabled   string `json:"animations_enabled"`
	ToastEnabled        string `json:"toast_enabled"`
	Opacity             string `json:"opacity"`
	LineNumbersEnabled  string `json:"line_numbers_enabled"`
	UIStyle             string `json:"ui_style"`
}

type UpdateInfo struct {
	UpdateAvailable bool   `json:"update_available"`
	CurrentVersion  string `json:"current_version"`
	LatestVersion   string `json:"latest_version"`
	DownloadURL     string `json:"download_url"`
}

func (s *AppService) GetSettings() (*SettingsData, error) {
	cfg, err := storage.LoadConfig()
	if err != nil {
		return nil, err
	}
	return &SettingsData{
		Theme:               cfg.App.Theme,
		FontSize:            cfg.Settings.FontSize,
		FontFamily:          cfg.Settings.FontFamily,
		ShortcutOverrides:   cfg.Settings.ShortcutOverrides,
		AutocompleteEnabled: cfg.Settings.AutocompleteEnabled,
		AnimationsEnabled:   cfg.Settings.AnimationsEnabled,
		ToastEnabled:        cfg.Settings.ToastEnabled,
		Opacity:             cfg.Settings.Opacity,
		LineNumbersEnabled:  cfg.Settings.LineNumbersEnabled,
		UIStyle:             cfg.Settings.UIStyle,
	}, nil
}

func (s *AppService) SaveSettings(settings *SettingsData) error {
	cfg, err := storage.LoadConfig()
	if err != nil {
		return err
	}
	cfg.App.Theme = settings.Theme
	cfg.Settings.FontSize = settings.FontSize
	cfg.Settings.FontFamily = settings.FontFamily
	cfg.Settings.ShortcutOverrides = settings.ShortcutOverrides
	cfg.Settings.AutocompleteEnabled = settings.AutocompleteEnabled
	cfg.Settings.AnimationsEnabled = settings.AnimationsEnabled
	cfg.Settings.ToastEnabled = settings.ToastEnabled
	cfg.Settings.Opacity = settings.Opacity
	cfg.Settings.LineNumbersEnabled = settings.LineNumbersEnabled
	cfg.Settings.UIStyle = settings.UIStyle
	return storage.SaveConfig(cfg)
}

func (s *AppService) GetAppVersion() string {
	versionMu.RLock()
	defer versionMu.RUnlock()
	return appVersion
}

func (s *AppService) CheckForUpdate() (*UpdateInfo, error) {
	versionMu.RLock()
	currentVersion := appVersion
	versionMu.RUnlock()

	latest, found, err := selfupdate.DetectLatest("rkriad585/LineSolv")
	if err != nil {
		return &UpdateInfo{UpdateAvailable: false, CurrentVersion: currentVersion}, fmt.Errorf("failed to check for updates: %w", err)
	}
	if !found {
		return &UpdateInfo{UpdateAvailable: false, CurrentVersion: currentVersion}, nil
	}

	current, err := semver.Make(currentVersion)
	if err != nil {
		return &UpdateInfo{UpdateAvailable: false, CurrentVersion: currentVersion}, fmt.Errorf("invalid current version: %w", err)
	}

	return &UpdateInfo{
		UpdateAvailable: latest.Version.GT(current),
		CurrentVersion:  currentVersion,
		LatestVersion:   latest.Version.String(),
		DownloadURL:     "https://github.com/rkriad585/LineSolv/releases/latest",
	}, nil
}

func (s *AppService) PerformUpdate() (*UpdateInfo, error) {
	ctx := getCtx()

	versionMu.RLock()
	currentVersion := appVersion
	versionMu.RUnlock()

	wailsruntime.EventsEmit(ctx, "update-progress", map[string]interface{}{
		"status":  "checking",
		"message": "Checking for updates...",
	})

	latest, found, err := selfupdate.DetectLatest("rkriad585/LineSolv")
	if err != nil {
		return &UpdateInfo{UpdateAvailable: false, CurrentVersion: currentVersion}, fmt.Errorf("failed to check for updates: %w", err)
	}
	if !found {
		return &UpdateInfo{UpdateAvailable: false, CurrentVersion: currentVersion}, nil
	}

	current, err := semver.Make(currentVersion)
	if err != nil {
		return &UpdateInfo{UpdateAvailable: false, CurrentVersion: currentVersion}, fmt.Errorf("invalid current version: %w", err)
	}

	if !latest.Version.GT(current) {
		return &UpdateInfo{
			UpdateAvailable: false,
			CurrentVersion:  currentVersion,
			LatestVersion:   latest.Version.String(),
		}, nil
	}

	wailsruntime.EventsEmit(ctx, "update-progress", map[string]interface{}{
		"status":  "downloading",
		"message": "Downloading v" + latest.Version.String() + "...",
	})

	exePath, err := os.Executable()
	if err != nil {
		return nil, fmt.Errorf("failed to get executable path: %w", err)
	}
	exePath, err = filepath.EvalSymlinks(exePath)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve executable path: %w", err)
	}

	tmpFile, err := os.CreateTemp("", "linesolv_update_*"+filepath.Ext(exePath))
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file: %w", err)
	}
	tmpFile.Close()
	os.Remove(tmpFile.Name()) // CreateTemp creates the file; selfupdate.UpdateTo will recreate it

	if err := selfupdate.UpdateTo(latest.AssetURL, tmpFile.Name()); err != nil {
		os.Remove(tmpFile.Name())
		return nil, fmt.Errorf("failed to download update: %w", err)
	}

	wailsruntime.EventsEmit(ctx, "update-progress", map[string]interface{}{
		"status":  "restarting",
		"message": "Update downloaded. Restarting...",
	})

	go func() {
		time.Sleep(500 * time.Millisecond)
		s.replaceAndRestart(exePath, tmpFile.Name())
		wailsruntime.Quit(ctx)
	}()

	return &UpdateInfo{
		UpdateAvailable: true,
		CurrentVersion:  currentVersion,
		LatestVersion:   latest.Version.String(),
	}, nil
}

func (s *AppService) replaceAndRestart(exePath, tmpFile string) {
	switch runtime.GOOS {
	case "windows":
		bat := filepath.Join(os.TempDir(), "linesolv_update.bat")
		exeDir := filepath.Dir(exePath)
		exeName := filepath.Base(exePath)
		if err := os.WriteFile(bat, []byte(fmt.Sprintf(
			"@echo off\r\n"+
				"timeout /t 2 /nobreak >nul\r\n"+
				"cd /d \"%s\"\r\n"+
				"del \"%s\"\r\n"+
				"move \"%s\" \"%s\"\r\n"+
				"start \"\" \"%s\"\r\n"+
				"del \"%s\"\r\n",
			exeDir, exeName, tmpFile, exeName, exePath, bat,
		)), 0600); err != nil {
			return
		}
		_ = exec.Command("cmd.exe", "/c", bat).Start() //nolint:errcheck
	case "darwin":
		script := fmt.Sprintf(
			`#!/bin/bash
sleep 2
osascript -e 'do shell script "mv \"%s\" \"%s\" && \"%s\" &" with administrator privileges' 2>/dev/null
rm -f "%s"`,
			tmpFile, exePath, exePath, tmpFile,
		)
		f := filepath.Join(os.TempDir(), "linesolv_update.sh")
		if err := os.WriteFile(f, []byte(script), 0600); err != nil { //nolint:gosec
			return
		}
		_ = exec.Command("/bin/bash", f).Start() //nolint:errcheck
	default: // linux
		if err := os.Rename(tmpFile, exePath); err == nil {
			_ = exec.Command(exePath).Start() //nolint:errcheck
			return
		}
		script := fmt.Sprintf(
			`#!/bin/bash
sleep 2
mv "%s" "%s"
"%s" &
rm -f "$0"`,
			tmpFile, exePath, exePath,
		)
		f := filepath.Join(os.TempDir(), "linesolv_update.sh")
		if err := os.WriteFile(f, []byte(script), 0600); err != nil { //nolint:gosec
			return
		}
		_ = exec.Command("pkexec", "/bin/bash", f).Start() //nolint:errcheck
	}
}

// --- Plugin Management ---

// registerPluginFunctions registers all enabled plugin functions and variables with the engine.
func (s *AppService) registerPluginFunctions() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.pluginMgr == nil {
		return
	}
	s.engine.ClearPluginFunctions()
	s.pluginThemes = nil
	for _, p := range s.pluginMgr.Enabled() {
		for name, fn := range p.GetFunctionMap() {
			s.engine.RegisterPluginFunction(name, fn)
		}
		for name, value := range p.GetVarMap() {
			s.engine.RegisterPluginVariable(name, value)
		}
		s.pluginThemes = append(s.pluginThemes, p.GetThemes()...)
	}
}

// GetPlugins returns all loaded plugins.
func (s *AppService) GetPlugins() []*plugin.PluginInfo {
	if s.pluginMgr == nil {
		return nil
	}
	var result []*plugin.PluginInfo
	for _, p := range s.pluginMgr.All() {
		result = append(result, p.Info())
	}
	return result
}

// SetPluginEnabled enables or disables a plugin.
func (s *AppService) SetPluginEnabled(name string, enabled bool) error {
	if s.pluginMgr == nil {
		return fmt.Errorf("plugin system not initialized")
	}
	if err := s.pluginMgr.SetEnabled(name, enabled); err != nil {
		return err
	}
	s.registerPluginFunctions()
	return nil
}

// ReloadPlugins rescans the plugins directory.
func (s *AppService) ReloadPlugins() error {
	if s.pluginMgr == nil {
		return fmt.Errorf("plugin system not initialized")
	}
	if err := s.pluginMgr.Reload(); err != nil {
		return err
	}
	s.registerPluginFunctions()
	return nil
}

// GetPluginThemes returns all themes from enabled plugins.
func (s *AppService) GetPluginThemes() []plugin.ThemeDef {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.pluginThemes
}

// GetPluginsDir returns the plugins directory path.
func (s *AppService) GetPluginsDir() string {
	if s.pluginMgr == nil {
		return ""
	}
	return s.pluginMgr.GetPluginsDir()
}

// InstallPlugin installs a plugin by writing its manifest to the plugins directory,
// then triggers a rescan to activate it.
func (s *AppService) InstallPlugin(pluginsDir, pluginDir, manifestJSON string) error {
	dir := filepath.Join(pluginsDir, pluginDir)
	// Prevent path traversal
	cleanDir := filepath.Clean(dir)
	cleanPluginsDir := filepath.Clean(pluginsDir) + string(os.PathSeparator)
	if !strings.HasPrefix(cleanDir, cleanPluginsDir) {
		return fmt.Errorf("invalid plugin directory: path traversal detected")
	}

	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create plugin directory: %w", err)
	}

	manifestPath := filepath.Join(dir, "plugin.json")
	if err := os.WriteFile(manifestPath, []byte(manifestJSON), 0600); err != nil {
		return fmt.Errorf("failed to write manifest: %w", err)
	}

	if s.pluginMgr != nil {
		if err := s.pluginMgr.Reload(); err != nil {
			return fmt.Errorf("failed to reload plugins: %w", err)
		}
		s.registerPluginFunctions()
	}

	return nil
}

// RemovePlugin removes a plugin directory, then triggers a rescan.
func (s *AppService) RemovePlugin(pluginsDir, pluginDir string) error {
	dir := filepath.Join(pluginsDir, pluginDir)
	// Prevent path traversal
	cleanDir := filepath.Clean(dir)
	cleanPluginsDir := filepath.Clean(pluginsDir) + string(os.PathSeparator)
	if !strings.HasPrefix(cleanDir, cleanPluginsDir) {
		return fmt.Errorf("invalid plugin directory: path traversal detected")
	}

	if err := os.RemoveAll(dir); err != nil {
		return fmt.Errorf("failed to remove plugin: %w", err)
	}

	if s.pluginMgr != nil {
		if err := s.pluginMgr.Reload(); err != nil {
			return fmt.Errorf("failed to reload plugins: %w", err)
		}
		s.registerPluginFunctions()
	}

	return nil
}

// GetAutocompleteKeywords returns all available autocomplete candidates
// (functions, constants, units, user variables, plugin functions).
func (s *AppService) GetAutocompleteKeywords() []AutocompleteItem {
	seen := make(map[string]bool)
	var items []AutocompleteItem

	add := func(name, category, desc string) {
		if seen[name] {
			return
		}
		seen[name] = true
		items = append(items, AutocompleteItem{Name: name, Category: category, Description: desc})
	}

	// Builtin functions (primary names only, no aliases — aliases added separately)
	functions := []struct {
		name string
		desc string
	}{
		{"sin", "Sine of angle (radians)"},
		{"cos", "Cosine of angle (radians)"},
		{"tan", "Tangent of angle (radians)"},
		{"asin", "Inverse sine (returns radians)"},
		{"acos", "Inverse cosine (returns radians)"},
		{"atan", "Inverse tangent (returns radians)"},
		{"atan2", "Inverse tangent of y/x (2 args)"},
		{"sinh", "Hyperbolic sine"},
		{"cosh", "Hyperbolic cosine"},
		{"tanh", "Hyperbolic tangent"},
		{"sqrt", "Square root"},
		{"cbrt", "Cube root"},
		{"abs", "Absolute value"},
		{"round", "Round to nearest integer"},
		{"floor", "Round down to integer"},
		{"ceil", "Round up to integer"},
		{"log", "Natural logarithm (alias: ln)"},
		{"ln", "Natural logarithm (alias: log)"},
		{"log2", "Base-2 logarithm"},
		{"log10", "Base-10 logarithm"},
		{"exp", "Exponential (e^x)"},
		{"pow", "Power (base, exponent)"},
		{"fact", "Factorial (alias: factorial)"},
		{"factorial", "Factorial (alias: fact)"},
		{"gcd", "Greatest common divisor (2 args)"},
		{"lcm", "Least common multiple (2 args)"},
		{"rand", "Random number 0-1 (alias: random)"},
		{"random", "Random number 0-1 (alias: rand)"},
		{"sign", "Sign of number: -1, 0, or 1 (alias: sgn)"},
		{"sgn", "Sign of number: -1, 0, or 1 (alias: sign)"},
		{"ncr", "Binomial coefficient (2 args, alias: choose)"},
		{"choose", "Binomial coefficient (2 args, alias: ncr)"},
		{"trunc", "Truncate decimal part"},
		{"fract", "Fractional part"},
		{"deg", "Radians to degrees"},
		{"rad", "Degrees to radians"},
		{"min", "Minimum of arguments"},
		{"max", "Maximum of arguments"},
		{"sum", "Sum of arguments"},
		{"avg", "Average of arguments"},
		{"hypot", "Hypotenuse (2 args, alias: pythag)"},
		{"pythag", "Hypotenuse (2 args, alias: hypot)"},
		{"median", "Median of arguments"},
		{"mode", "Mode of arguments"},
		{"stdev", "Standard deviation (alias: stddev)"},
		{"stddev", "Standard deviation (alias: stdev)"},
		{"variance", "Population variance (alias: var)"},
		{"var", "Population variance (alias: variance)"},
		{"range", "Max minus min of arguments"},
		{"isprime", "Check if prime (alias: is_prime)"},
		{"is_prime", "Check if prime (alias: isprime)"},
	}
	for _, f := range functions {
		add(f.name, "function", f.desc)
	}

	// Constants
	constants := []struct {
		name string
		desc string
	}{
		{"pi", "Pi (3.14159...)"},
		{"π", "Pi (3.14159...)"},
		{"e", "Euler's number (2.71828...)"},
		{"speed_of_light", "Speed of light (alias: lightspeed, c_light)"},
		{"lightspeed", "Speed of light (alias: speed_of_light)"},
		{"c_light", "Speed of light (alias: speed_of_light)"},
		{"gravity", "Standard gravity (alias: g_force)"},
		{"g_force", "Standard gravity (alias: gravity)"},
		{"planck", "Planck constant (alias: planck_constant)"},
		{"planck_constant", "Planck constant (alias: planck)"},
		{"boltzmann", "Boltzmann constant (alias: boltzmann_constant)"},
		{"boltzmann_constant", "Boltzmann constant (alias: boltzmann)"},
		{"gas_constant", "Ideal gas constant (alias: gasconstant)"},
		{"gasconstant", "Ideal gas constant (alias: gas_constant)"},
		{"avogadro", "Avogadro's number (alias: avogadro_constant)"},
		{"avogadro_constant", "Avogadro's number (alias: avogadro)"},
		{"stefan_boltzmann", "Stefan-Boltzmann constant (alias: stefanboltzmann)"},
		{"stefanboltzmann", "Stefan-Boltzmann constant (alias: stefan_boltzmann)"},
		{"electron_mass", "Electron mass (alias: me)"},
		{"me", "Electron mass (alias: electron_mass)"},
		{"proton_mass", "Proton mass (alias: mp)"},
		{"mp", "Proton mass (alias: proton_mass)"},
		{"neutron_mass", "Neutron mass (alias: mn)"},
		{"mn", "Neutron mass (alias: neutron_mass)"},
		{"electron_charge", "Electron charge (alias: e_charge)"},
		{"e_charge", "Electron charge (alias: electron_charge)"},
		{"bohr_radius", "Bohr radius (alias: bohrradius)"},
		{"bohrradius", "Bohr radius (alias: bohr_radius)"},
		{"rydberg", "Rydberg constant (alias: rydberg_constant)"},
		{"rydberg_constant", "Rydberg constant (alias: rydberg)"},
	}
	for _, c := range constants {
		add(c.name, "constant", c.desc)
	}

	// Units — group by canonical name, show short description
	unitGroups := map[string]struct {
		desc string
		keys []string
	}{
		"meter":      {"Length — meter", []string{"m", "meter", "meters"}},
		"kilometer":  {"Length — kilometer", []string{"km", "kilometer", "kilometers"}},
		"centimeter": {"Length — centimeter", []string{"cm", "centimeter", "centimeters"}},
		"millimeter": {"Length — millimeter", []string{"mm", "millimeter", "millimeters"}},
		"inch":       {"Length — inch", []string{"inch", "inches", "in"}},
		"foot":       {"Length — foot", []string{"ft", "foot", "feet"}},
		"yard":       {"Length — yard", []string{"yard", "yards", "yd"}},
		"mile":       {"Length — mile", []string{"mile", "miles"}},
		"gram":       {"Mass — gram", []string{"g", "gram", "grams"}},
		"kilogram":   {"Mass — kilogram", []string{"kg", "kilogram", "kilograms"}},
		"pound":      {"Mass — pound", []string{"lb", "lbs", "pound", "pounds"}},
		"ounce":      {"Mass — ounce", []string{"oz", "ounce", "ounces"}},
		"liter":      {"Volume — liter", []string{"l", "liter", "liters"}},
		"milliliter": {"Volume — milliliter", []string{"ml", "milliliter", "milliliters"}},
		"gallon":     {"Volume — gallon", []string{"gal", "gallon", "gallons"}},
		"quart":      {"Volume — quart", []string{"qt", "quart", "quarts"}},
		"cup":        {"Volume — cup", []string{"cup", "cups"}},
		"celsius":    {"Temperature — celsius", []string{"c", "celsius"}},
		"fahrenheit": {"Temperature — fahrenheit", []string{"f", "fahrenheit"}},
		"second":     {"Time — second", []string{"second", "seconds"}},
		"minute":     {"Time — minute", []string{"minute", "minutes"}},
		"hour":       {"Time — hour", []string{"hour", "hours"}},
		"day":        {"Time — day", []string{"day", "days"}},
		"USD":        {"Currency — US dollar", []string{"usd"}},
		"EUR":        {"Currency — euro", []string{"eur", "euro", "euros"}},
		"GBP":        {"Currency — pound sterling", []string{"gbp", "sterling"}},
		"JPY":        {"Currency — yen", []string{"jpy", "yen"}},
		"CNY":        {"Currency — yuan", []string{"cny", "yuan"}},
		"INR":        {"Currency — rupee", []string{"inr", "rupee", "rupees"}},
		"CAD":        {"Currency — Canadian dollar", []string{"cad"}},
		"AUD":        {"Currency — Australian dollar", []string{"aud"}},
		"CHF":        {"Currency — Swiss franc", []string{"chf"}},
		"KRW":        {"Currency — won", []string{"krw", "won"}},
		"RUB":        {"Currency — ruble", []string{"rub", "ruble", "rubles"}},
		"ILS":        {"Currency — shekel", []string{"ils", "shekel", "shekels"}},
		"VND":        {"Currency — dong", []string{"vnd", "dong"}},
		"PHP":        {"Currency — peso", []string{"php", "peso", "pesos"}},
		"UAH":        {"Currency — hryvnia", []string{"uah", "hryvnia"}},
		"KZT":        {"Currency — tenge", []string{"kzt", "tenge"}},
		"PYG":        {"Currency — guarani", []string{"pyg", "guarani"}},
		"GHS":        {"Currency — cedi", []string{"ghs", "cedi"}},
		"TRY":        {"Currency — lira", []string{"try", "lira"}},
		"AZN":        {"Currency — manat", []string{"azn", "manat"}},
		"GEL":        {"Currency — lari", []string{"gel", "lari"}},
		"BTC":        {"Currency — bitcoin", []string{"btc", "bitcoin"}},
		"THB":        {"Currency — baht", []string{"thb", "baht"}},
		"HKD":        {"Currency — Hong Kong dollar", []string{"hkd"}},
		"SGD":        {"Currency — Singapore dollar", []string{"sgd"}},
		"MXN":        {"Currency — Mexican peso", []string{"mxn"}},
		"ZAR":        {"Currency — rand", []string{"zar", "rand"}},
		"NZD":        {"Currency — New Zealand dollar", []string{"nzd"}},
		"SEK":        {"Currency — krona", []string{"sek", "krona"}},
		"NOK":        {"Currency — Norwegian krone", []string{"nok"}},
		"PLN":        {"Currency — zloty", []string{"pln", "zloty"}},
		"BRL":        {"Currency — Brazilian real", []string{"brl"}},
		"BDT":        {"Currency — taka", []string{"bdt", "taka"}},
		"PKR":        {"Currency — Pakistani rupee", []string{"pkr", "pakistani"}},
		"LKR":        {"Currency — Sri Lankan rupee", []string{"lkr", "sri-lankan"}},
		"NPR":        {"Currency — Nepalese rupee", []string{"npr", "nepalese"}},
		"MYR":        {"Currency — ringgit", []string{"myr", "ringgit"}},
		"IDR":        {"Currency — rupiah", []string{"idr", "rupiah"}},
		"TWD":        {"Currency — New Taiwan dollar", []string{"twd", "ntd"}},
		"SAR":        {"Currency — riyal", []string{"sar", "riyal"}},
		"AED":        {"Currency — dirham", []string{"aed", "dirham"}},
		"KWD":        {"Currency — dinar", []string{"kwd", "dinar"}},
		"EGP":        {"Currency — Egyptian pound", []string{"egp"}},
		"NGN":        {"Currency — naira", []string{"ngn", "naira"}},
		"COP":        {"Currency — Colombian peso", []string{"cop"}},
		"CLP":        {"Currency — Chilean peso", []string{"clp"}},
		"ARS":        {"Currency — Argentine peso", []string{"ars"}},
		"PEN":        {"Currency — sol", []string{"pen", "sol"}},
		"MAD":        {"Currency — Moroccan dirham", []string{"mad"}},
		"XAU":        {"Precious metal — gold (troy oz)", []string{"xau", "gold"}},
		"XAG":        {"Precious metal — silver (troy oz)", []string{"xag", "silver"}},
	}
	for _, ug := range unitGroups {
		for _, key := range ug.keys {
			add(key, "unit", ug.desc)
		}
	}

	// Natural language keywords from examples
	nlKeywords := []struct {
		name string
		desc string
	}{
		// Graph commands
		{"plot", "Graph command — plot expression"},
		{"graph", "Graph command — graph expression"},
		// Scale words
		{"double", "Multiply by 2"},
		{"twice", "Multiply by 2"},
		{"triple", "Multiply by 3"},
		{"half", "Divide by 2"},
		{"quarter", "Divide by 4"},
		// Power words
		{"squared", "Raise to power 2"},
		{"cubed", "Raise to power 3"},
		// English math verbs
		{"calculate", "Evaluate expression"},
		{"compute", "Evaluate expression"},
		{"determine", "Evaluate expression"},
		{"solve", "Evaluate expression"},
		{"find", "Evaluate expression"},
		// Comparison
		{"bigger", "Compare — which is bigger"},
		{"smaller", "Compare — which is smaller"},
		{"larger", "Compare — which is larger"},
		// Trig English
		{"sine", "Sine of angle (English form)"},
		{"cosine", "Cosine of angle (English form)"},
		{"tangent", "Tangent of angle (English form)"},
		// Log English
		{"natural log", "Natural logarithm (English form)"},
		// Geometry
		{"area", "Geometry — area of shape"},
		{"volume", "Geometry — volume of shape"},
		{"circumference", "Geometry — circumference of circle"},
		{"perimeter", "Geometry — perimeter of shape"},
		{"triangle", "Geometry — triangle calculations"},
		{"circle", "Geometry — circle calculations"},
		{"sphere", "Geometry — sphere calculations"},
		{"cone", "Geometry — cone calculations"},
		{"rectangle", "Geometry — rectangle calculations"},
		// Context references
		{"last", "Reference last result"},
		{"previous", "Reference previous result"},
		{"prior", "Reference prior result"},
		{"result", "Reference last result"},
		{"answer", "Reference last answer"},
		// Date/time
		{"today", "Current date"},
		{"yesterday", "Yesterday's date"},
		{"tomorrow", "Tomorrow's date"},
		// Number words
		{"one", "Number word — 1"},
		{"two", "Number word — 2"},
		{"three", "Number word — 3"},
		{"four", "Number word — 4"},
		{"five", "Number word — 5"},
		{"six", "Number word — 6"},
		{"seven", "Number word — 7"},
		{"eight", "Number word — 8"},
		{"nine", "Number word — 9"},
		{"ten", "Number word — 10"},
		{"hundred", "Number word — 100"},
		{"thousand", "Number word — 1000"},
		{"million", "Number word — 1,000,000"},
		{"billion", "Number word — 1,000,000,000"},
		// Collective nouns
		{"couple", "Collective — 2"},
		{"dozen", "Collective — 12"},
		{"score", "Collective — 20"},
		// English operators
		{"plus", "Addition operator"},
		{"minus", "Subtraction operator"},
		{"times", "Multiplication operator"},
		{"divided", "Division — 'divided by'"},
		{"over", "Division — '10 over 2'"},
		{"percent", "Percentage operator"},
		{"of", "Percentage — '10% of 200'"},
		// Unit words
		{"inch", "Length — inch"},
		{"feet", "Length — feet"},
		{"mile", "Length — mile"},
		{"kilometer", "Length — kilometer"},
		{"meter", "Length — meter"},
		{"centimeter", "Length — centimeter"},
		{"gram", "Mass — gram"},
		{"kilogram", "Mass — kilogram"},
		{"pound", "Mass — pound"},
		{"ounce", "Mass — ounce"},
		{"liter", "Volume — liter"},
		{"gallon", "Volume — gallon"},
		{"cup", "Volume — cup"},
		{"celsius", "Temperature — celsius"},
		{"fahrenheit", "Temperature — fahrenheit"},
		{"second", "Time — second"},
		{"minute", "Time — minute"},
		{"hour", "Time — hour"},
		{"day", "Time — day"},
		{"week", "Time — week"},
		{"month", "Time — month"},
		{"year", "Time — year"},
		// Currency words
		{"dollar", "Currency — dollar"},
		{"euro", "Currency — euro"},
		{"pound sterling", "Currency — pound sterling"},
		{"yen", "Currency — yen"},
		{"yuan", "Currency — yuan"},
		{"rupee", "Currency — rupee"},
		{"bitcoin", "Currency — bitcoin"},
		// Abbreviations
		{"mph", "Speed — miles per hour"},
		{"kph", "Speed — kilometers per hour"},
		{"kg", "Mass — kilogram"},
		{"lbs", "Mass — pounds"},
		{"oz", "Mass — ounces"},
		{"km", "Length — kilometers"},
		{"cm", "Length — centimeters"},
		{"mm", "Length — millimeters"},
		{"ft", "Length — feet"},
		{"in", "Length — inches"},
		{"m", "Length — meters"},
		{"l", "Volume — liters"},
		{"ml", "Volume — milliliters"},
		{"gal", "Volume — gallons"},
		{"hrs", "Time — hours"},
		{"mins", "Time — minutes"},
		{"secs", "Time — seconds"},
	}
	for _, kw := range nlKeywords {
		add(kw.name, "keyword", kw.desc)
	}

	// User-defined variables
	for name := range s.engine.GetVariables() {
		add(name, "variable", "User-defined variable")
	}

	// Plugin-provided functions
	if s.pluginMgr != nil {
		for _, p := range s.pluginMgr.Enabled() {
			for name := range p.GetFunctionMap() {
				add(name, "plugin", "Plugin function")
			}
			for name := range p.GetVarMap() {
				add(name, "plugin", "Plugin variable")
			}
		}
	}

	return items
}
