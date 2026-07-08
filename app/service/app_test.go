package service

import (
	"testing"

	"LineSolv/app/storage"
)

func newTestService(t *testing.T) *AppService {
	t.Helper()
	db := storage.NewTestDB()
	storage.DataDir = t.TempDir()
	return NewAppService(db)
}

func TestEvaluateLine(t *testing.T) {
	s := newTestService(t)

	tests := []struct {
		input    string
		expected string
	}{
		{"1+1", "2"},
		{"2*3", "6"},
		{"10/2", "5"},
		{"2+3*4", "14"},
	}
	for _, tt := range tests {
		got, err := s.EvaluateLine(tt.input)
		if err != nil {
			t.Errorf("EvaluateLine(%q) unexpected error: %v", tt.input, err)
		}
		if got != tt.expected {
			t.Errorf("EvaluateLine(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestEvaluateLineEmpty(t *testing.T) {
	s := newTestService(t)

	got, err := s.EvaluateLine("")
	if err != nil {
		t.Fatal(err)
	}
	if got != "" {
		t.Errorf("expected empty result for empty input, got %q", got)
	}
}

func TestEvaluateAll(t *testing.T) {
	s := newTestService(t)

	results := s.EvaluateAll("1+1\n2+3")
	if len(results) != 2 {
		t.Fatalf("expected 2 results, got %d", len(results))
	}
	if results[0] != "2" {
		t.Errorf("expected '2', got %q", results[0])
	}
	if results[1] != "5" {
		t.Errorf("expected '5', got %q", results[1])
	}
}

func TestVariables(t *testing.T) {
	s := newTestService(t)

	vars := s.GetVariables()
	if vars == nil {
		t.Error("expected non-nil variables map")
	}

	s.engine.EvaluateLine("x = 42")
	vars = s.GetVariables()
	if vars["x"] != 42 {
		t.Errorf("expected x=42, got %v", vars["x"])
	}

	s.ClearVariables()
	vars = s.GetVariables()
	if _, ok := vars["x"]; ok {
		t.Error("expected x to be cleared")
	}
}

func TestHistory(t *testing.T) {
	s := newTestService(t)

	hist := s.GetHistory()
	if hist == nil {
		t.Error("expected non-nil history")
	}

	s.EvaluateLine("1+1")
	hist = s.GetHistory()
	if len(hist) == 0 {
		t.Error("expected non-empty history after eval")
	}

	s.ClearHistory()
	hist = s.GetHistory()
	if len(hist) != 0 {
		t.Errorf("expected empty history, got %d", len(hist))
	}
}

func TestGetDocList(t *testing.T) {
	s := newTestService(t)

	list := s.GetDocList()
	if len(list) != 0 {
		t.Errorf("expected empty doc list, got %d", len(list))
	}

	s.SetDocs(map[string]string{
		"guide.md": "# Guide",
		"api.md":   "# API",
	})
	list = s.GetDocList()
	if len(list) != 2 {
		t.Fatalf("expected 2 docs, got %d", len(list))
	}
	if list[0] != "api.md" && list[0] != "guide.md" {
		t.Errorf("unexpected doc list order: %v", list)
	}
}

func TestGetDocContent(t *testing.T) {
	s := newTestService(t)
	s.SetDocs(map[string]string{"test.md": "hello"})

	content := s.GetDocContent("test.md")
	if content != "hello" {
		t.Errorf("expected 'hello', got %q", content)
	}

	content = s.GetDocContent("missing.md")
	if content != "" {
		t.Errorf("expected empty for missing doc, got %q", content)
	}
}

func TestGetAppVersion(t *testing.T) {
	s := newTestService(t)

	version := s.GetAppVersion()
	if version == "" {
		t.Error("expected non-empty version")
	}
}

func TestNotesCRUD(t *testing.T) {
	s := newTestService(t)

	// Create
	note, err := s.CreateNote()
	if err != nil {
		t.Fatal(err)
	}
	if note.ID == "" {
		t.Error("expected non-empty id")
	}

	// Get all
	notes, err := s.GetAllNotes()
	if err != nil {
		t.Fatal(err)
	}
	if len(notes) != 1 {
		t.Fatalf("expected 1 note, got %d", len(notes))
	}

	// Rename
	if err := s.RenameNote(note.ID, "Renamed"); err != nil {
		t.Fatal(err)
	}
	got, _ := s.GetNote(note.ID)
	if got.Name != "Renamed" {
		t.Errorf("expected 'Renamed', got %q", got.Name)
	}

	// Save content
	if err := s.SaveNoteContent(note.ID, "new content"); err != nil {
		t.Fatal(err)
	}
	got, _ = s.GetNote(note.ID)
	if got.Content != "new content" {
		t.Errorf("expected 'new content', got %q", got.Content)
	}

	// Delete
	if err := s.DeleteNote(note.ID); err != nil {
		t.Fatal(err)
	}
	notes, _ = s.GetAllNotes()
	if len(notes) != 0 {
		t.Errorf("expected 0 notes after delete, got %d", len(notes))
	}
}

func TestExportNote(t *testing.T) {
	s := newTestService(t)

	note, _ := s.CreateNote()
	s.SaveNoteContent(note.ID, "test content")

	exported, err := s.ExportNote(note.ID, "txt")
	if err != nil {
		t.Fatal(err)
	}
	if exported == "" {
		t.Error("expected non-empty export")
	}
}

func TestGetDataDir(t *testing.T) {
	s := newTestService(t)

	dir := s.GetDataDir()
	if dir == "" {
		t.Error("expected non-empty data dir")
	}
}

func TestSettingsRoundTrip(t *testing.T) {
	s := newTestService(t)

	settings, err := s.GetSettings()
	if err != nil {
		t.Fatal(err)
	}
	if settings.Theme != "dark" {
		t.Errorf("expected default theme 'dark', got %q", settings.Theme)
	}

	settings.Theme = "neon"
	settings.FontSize = "20"
	if err := s.SaveSettings(settings); err != nil {
		t.Fatal(err)
	}

	loaded, _ := s.GetSettings()
	if loaded.Theme != "neon" {
		t.Errorf("expected theme 'neon', got %q", loaded.Theme)
	}
	if loaded.FontSize != "20" {
		t.Errorf("expected font_size '20', got %q", loaded.FontSize)
	}
}

func TestDeleteWithoutConfirm(t *testing.T) {
	s := newTestService(t)

	if s.GetDeleteWithoutConfirm() {
		t.Error("expected false by default")
	}

	s.SetDeleteWithoutConfirm(true)
	if !s.GetDeleteWithoutConfirm() {
		t.Error("expected true after setting")
	}

	s.SetDeleteWithoutConfirm(false)
	if s.GetDeleteWithoutConfirm() {
		t.Error("expected false after unsetting")
	}
}
