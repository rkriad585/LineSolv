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
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/ledongthuc/pdf"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const evalTimeout = 5 * time.Second

var (
	globalCtx context.Context
	ctxMu     sync.Mutex
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

type AppService struct {
	engine       *calculator.Engine
	storage      *storage.DB
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
	s.docsContent = docs
}

func (s *AppService) GetDocList() []string {
	names := make([]string, 0, len(s.docsContent))
	for name := range s.docsContent {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}

func (s *AppService) GetDocContent(name string) string {
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
	storage.SaveConfig(cfg)
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
	filePath, err := runtime.SaveFileDialog(getCtx(), runtime.SaveDialogOptions{
		DefaultFilename: safeName + "." + ext,
		Filters: []runtime.FileFilter{
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

	if err := os.WriteFile(filePath, contentBytes, 0644); err != nil {
		return "", err
	}
	return filePath, nil
}

func (s *AppService) ImportNoteFromFile() (*storage.Note, error) {
	filePath, err := runtime.OpenFileDialog(getCtx(), runtime.OpenDialogOptions{
		Filters: []runtime.FileFilter{
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

const appVersion = "0.9.0"

type CurrencyCacheInfo struct {
	Cached     bool   `json:"cached"`
	UpdatedAt  int64  `json:"updatedAt"`
	Source     string `json:"source"`
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
	resp, err := http.Get("https://api.exchangerate-api.com/v4/latest/USD")
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
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if err := s.storage.SaveCurrencyRates(result.Rates); err != nil {
		return nil, err
	}
	calculator.SetCurrencyRates(result.Rates)
	return &CurrencyCacheInfo{Cached: true, UpdatedAt: time.Now().UnixMilli(), Source: "live"}, nil
}

type SettingsData struct {
	Theme             string `json:"theme"`
	FontSize          string `json:"font_size"`
	FontFamily        string `json:"font_family"`
	ShortcutOverrides string `json:"shortcut_overrides"`
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
		Theme:             cfg.App.Theme,
		FontSize:          cfg.Settings.FontSize,
		FontFamily:        cfg.Settings.FontFamily,
		ShortcutOverrides: cfg.Settings.ShortcutOverrides,
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
	return storage.SaveConfig(cfg)
}

func (s *AppService) GetAppVersion() string {
	return appVersion
}

func (s *AppService) CheckForUpdate() (*UpdateInfo, error) {
	resp, err := http.Get("https://raw.githubusercontent.com/rkriad585/LineSolv/refs/heads/main/.version")
	if err != nil {
		return &UpdateInfo{UpdateAvailable: false, CurrentVersion: appVersion}, nil
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil || len(data) == 0 {
		return &UpdateInfo{UpdateAvailable: false, CurrentVersion: appVersion}, nil
	}
	latest := strings.TrimSpace(string(data))
	if latest == "" {
		return &UpdateInfo{UpdateAvailable: false, CurrentVersion: appVersion}, nil
	}
	return &UpdateInfo{
		UpdateAvailable: latest != appVersion,
		CurrentVersion:  appVersion,
		LatestVersion:   latest,
		DownloadURL:     "https://github.com/rkriad585/LineSolv/releases/latest",
	}, nil
}

// --- Plugin Management ---

// registerPluginFunctions registers all enabled plugin functions and variables with the engine.
func (s *AppService) registerPluginFunctions() {
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
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create plugin directory: %w", err)
	}

	manifestPath := filepath.Join(dir, "plugin.json")
	if err := os.WriteFile(manifestPath, []byte(manifestJSON), 0644); err != nil {
		return fmt.Errorf("failed to write manifest: %w", err)
	}

	if s.pluginMgr != nil {
		s.pluginMgr.Reload()
		s.registerPluginFunctions()
	}

	return nil
}

// RemovePlugin removes a plugin directory, then triggers a rescan.
func (s *AppService) RemovePlugin(pluginsDir, pluginDir string) error {
	dir := filepath.Join(pluginsDir, pluginDir)
	if err := os.RemoveAll(dir); err != nil {
		return fmt.Errorf("failed to remove plugin: %w", err)
	}

	if s.pluginMgr != nil {
		s.pluginMgr.Reload()
		s.registerPluginFunctions()
	}

	return nil
}
