package service

import (
	"context"
	"LineSolv/app/calculator"
	"LineSolv/app/storage"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

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
	engine      *calculator.Engine
	storage     *storage.DB
	docsContent map[string]string
}

func NewAppService(db *storage.DB) *AppService {
	return &AppService{
		engine:  calculator.NewEngine(),
		storage: db,
	}
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
	content := storage.ExportNote(*note, format)

	safeName := strings.Map(func(r rune) rune {
		if r == '/' || r == '\\' || r == ':' {
			return '_'
		}
		return r
	}, note.Name)

	filePath, err := runtime.SaveFileDialog(getCtx(), runtime.SaveDialogOptions{
		DefaultFilename: safeName + "." + format,
		Filters: []runtime.FileFilter{
			{DisplayName: "LineSolv Files", Pattern: "*." + format},
			{DisplayName: "All Files", Pattern: "*"},
		},
	})
	if err != nil {
		return "", err
	}
	if filePath == "" {
		return "", nil
	}

	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		return "", err
	}
	return filePath, nil
}

func (s *AppService) ImportNoteFromFile() (*storage.Note, error) {
	filePath, err := runtime.OpenFileDialog(getCtx(), runtime.OpenDialogOptions{
		Filters: []runtime.FileFilter{
			{DisplayName: "Supported Files", Pattern: "*.lv;*.txt;*.md;*.json;*.toml"},
			{DisplayName: "All Files", Pattern: "*"},
		},
	})
	if err != nil {
		return nil, err
	}
	if filePath == "" {
		return nil, nil
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	content := string(data)
	base := filepath.Base(filePath)
	name := strings.TrimSuffix(base, filepath.Ext(base))

	ext := strings.ToLower(filepath.Ext(base))
	if ext == ".json" {
		var parsed struct {
			Name    string `json:"name"`
			Content string `json:"content"`
		}
		if err := json.Unmarshal(data, &parsed); err == nil && parsed.Name != "" {
			name = parsed.Name
			if parsed.Content != "" {
				content = parsed.Content
			}
		}
	}

	return s.storage.CreateNoteWithContent(name, content)
}

const appVersion = "0.1.45"

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
