package storage

import (
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

func newTestDB(t *testing.T) *DB {
	t.Helper()
	dir := t.TempDir()
	oldDataDir := DataDir
	DataDir = dir
	t.Cleanup(func() { DataDir = oldDataDir })

	conn, err := sql.Open("sqlite3", filepath.Join(dir, "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	conn.SetMaxOpenConns(1)
	if _, err := conn.Exec(`PRAGMA journal_mode=WAL`); err != nil {
		t.Fatal(err)
	}
	if _, err := conn.Exec(`CREATE TABLE IF NOT EXISTS notes (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		content TEXT NOT NULL DEFAULT '',
		created_at INTEGER NOT NULL,
		updated_at INTEGER NOT NULL,
		position INTEGER NOT NULL DEFAULT 0
	)`); err != nil {
		t.Fatal(err)
	}
	return &DB{conn: conn}
}

func TestNewDB_CreatesDataDir(t *testing.T) {
	dir := t.TempDir()
	old := DataDir
	DataDir = dir
	t.Cleanup(func() { DataDir = old })

	db, err := NewDB()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	if _, err := os.Stat(dir); os.IsNotExist(err) {
		t.Error("data directory was not created")
	}

	count, err := db.NoteCount()
	if err != nil {
		t.Fatal(err)
	}
	if count != 0 {
		t.Errorf("expected 0 notes, got %d", count)
	}
}

func TestDBCreateAndGetNote(t *testing.T) {
	db := newTestDB(t)

	note, err := db.CreateNote("Test Note")
	if err != nil {
		t.Fatal(err)
	}
	if note.ID == "" {
		t.Error("expected non-empty id")
	}
	if note.Name != "Test Note" {
		t.Errorf("expected name 'Test Note', got %q", note.Name)
	}
	if note.Content != "" {
		t.Errorf("expected empty content, got %q", note.Content)
	}
	if note.CreatedAt == 0 {
		t.Error("expected non-zero created_at")
	}

	got, err := db.GetNote(note.ID)
	if err != nil {
		t.Fatal(err)
	}
	if got.Name != note.Name || got.Content != note.Content {
		t.Errorf("GetNote returned %+v, want %+v", got, note)
	}
}

func TestDBCreateNoteWithContent(t *testing.T) {
	db := newTestDB(t)

	note, err := db.CreateNoteWithContent("Test", "hello world")
	if err != nil {
		t.Fatal(err)
	}
	if note.Content != "hello world" {
		t.Errorf("expected content 'hello world', got %q", note.Content)
	}
}

func TestDBGetAllNotes(t *testing.T) {
	db := newTestDB(t)

	n1, _ := db.CreateNote("Alpha")
	n2, _ := db.CreateNote("Beta")

	notes, err := db.GetAllNotes()
	if err != nil {
		t.Fatal(err)
	}
	if len(notes) != 2 {
		t.Fatalf("expected 2 notes, got %d", len(notes))
	}

	ids := map[string]bool{notes[0].ID: true, notes[1].ID: true}
	if !ids[n1.ID] || !ids[n2.ID] {
		t.Error("GetAllNotes did not return created notes")
	}
}

func TestDBRenameNote(t *testing.T) {
	db := newTestDB(t)

	note, _ := db.CreateNote("Original")
	if err := db.RenameNote(note.ID, "Renamed"); err != nil {
		t.Fatal(err)
	}

	got, _ := db.GetNote(note.ID)
	if got.Name != "Renamed" {
		t.Errorf("expected name 'Renamed', got %q", got.Name)
	}
}

func TestDBDeleteNote(t *testing.T) {
	db := newTestDB(t)

	note, _ := db.CreateNote("Delete Me")
	if err := db.DeleteNote(note.ID); err != nil {
		t.Fatal(err)
	}

	if _, err := db.GetNote(note.ID); err == nil {
		t.Error("expected error getting deleted note")
	}

	count, _ := db.NoteCount()
	if count != 0 {
		t.Errorf("expected 0 notes after delete, got %d", count)
	}
}

func TestDBSaveNoteContent(t *testing.T) {
	db := newTestDB(t)

	note, _ := db.CreateNote("Test")
	if err := db.SaveNoteContent(note.ID, "updated content"); err != nil {
		t.Fatal(err)
	}

	got, _ := db.GetNote(note.ID)
	if got.Content != "updated content" {
		t.Errorf("expected content 'updated content', got %q", got.Content)
	}
}

func TestDBNoteCount(t *testing.T) {
	db := newTestDB(t)

	count, _ := db.NoteCount()
	if count != 0 {
		t.Errorf("expected 0, got %d", count)
	}

	db.CreateNote("A")
	db.CreateNote("B")

	count, _ = db.NoteCount()
	if count != 2 {
		t.Errorf("expected 2, got %d", count)
	}
}

func TestDBGetNoteNotFound(t *testing.T) {
	db := newTestDB(t)

	_, err := db.GetNote("nonexistent")
	if err == nil {
		t.Error("expected error for nonexistent note")
	}
}

func TestDBDeleteNonexistent(t *testing.T) {
	db := newTestDB(t)

	if err := db.DeleteNote("nonexistent"); err != nil {
		t.Errorf("expected no error deleting nonexistent, got %v", err)
	}
}
