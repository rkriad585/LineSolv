package storage

import (
	"encoding/json"
	"strings"
	"testing"
)

var testNote = Note{
	ID:        "test-uuid",
	Name:      "Test Note",
	Content:   "1+1\n2+2\n3+3",
	CreatedAt: 1700000000000,
	UpdatedAt: 1700000001000,
}

func TestExportLV(t *testing.T) {
	result := ExportNote(testNote, "lv")
	if result != testNote.Content {
		t.Errorf("lv export expected content, got %q", result)
	}
}

func TestExportLVDefault(t *testing.T) {
	result := ExportNote(testNote, "unknown")
	if result != testNote.Content {
		t.Errorf("default export expected content, got %q", result)
	}
}

func TestExportTXT(t *testing.T) {
	result := ExportNote(testNote, "txt")
	if !strings.Contains(result, "Title: Test Note") {
		t.Error("txt export missing title")
	}
	if !strings.Contains(result, testNote.Content) {
		t.Error("txt export missing content")
	}
}

func TestExportMD(t *testing.T) {
	result := ExportNote(testNote, "md")
	if !strings.Contains(result, "# Test Note") {
		t.Error("md export missing heading")
	}
	if !strings.Contains(result, testNote.Content) {
		t.Error("md export missing content")
	}
}

func TestExportJSON(t *testing.T) {
	result := ExportNote(testNote, "json")
	var parsed map[string]interface{}
	if err := json.Unmarshal([]byte(result), &parsed); err != nil {
		t.Fatal(err)
	}
	if parsed["name"] != "Test Note" {
		t.Errorf("expected name 'Test Note', got %v", parsed["name"])
	}
	if parsed["content"] != testNote.Content {
		t.Errorf("expected content %q, got %v", testNote.Content, parsed["content"])
	}
}

func TestExportTOML(t *testing.T) {
	result := ExportNote(testNote, "toml")
	if !strings.Contains(result, `name = "Test Note"`) {
		t.Error("toml export missing name")
	}
	if !strings.Contains(result, "1+1") {
		t.Error("toml export missing content")
	}
}

func TestExportEmptyNote(t *testing.T) {
	empty := Note{ID: "empty", Name: "Empty", Content: ""}
	result := ExportNote(empty, "txt")
	if !strings.Contains(result, "Title: Empty") {
		t.Error("txt export of empty note missing title")
	}
}

func TestExportJSONRoundTrip(t *testing.T) {
	result := ExportNote(testNote, "json")
	var parsed struct {
		Name    string `json:"name"`
		Content string `json:"content"`
	}
	if err := json.Unmarshal([]byte(result), &parsed); err != nil {
		t.Fatal(err)
	}
	if parsed.Name != testNote.Name {
		t.Errorf("round-trip name mismatch: %q vs %q", parsed.Name, testNote.Name)
	}
	if parsed.Content != testNote.Content {
		t.Errorf("round-trip content mismatch: %q vs %q", parsed.Content, testNote.Content)
	}
}
