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
		position INTEGER NOT NULL DEFAULT 0,
		folder_id TEXT DEFAULT NULL
	)`); err != nil {
		t.Fatal(err)
	}
	if _, err := conn.Exec(`CREATE TABLE IF NOT EXISTS folders (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		parent_id TEXT DEFAULT NULL,
		icon TEXT DEFAULT 'folder',
		position INTEGER NOT NULL DEFAULT 0,
		created_at INTEGER NOT NULL DEFAULT (unixepoch()),
		updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
		FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
	)`); err != nil {
		t.Fatal(err)
	}
	if _, err := conn.Exec(`CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id, position)`); err != nil {
		t.Fatal(err)
	}
	if _, err := conn.Exec(`CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id, position)`); err != nil {
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

func TestDBCreateAndGetFolder(t *testing.T) {
	db := newTestDB(t)

	folder, err := db.CreateFolder("My Folder", "")
	if err != nil {
		t.Fatal(err)
	}
	if folder.ID == "" {
		t.Error("expected non-empty id")
	}
	if folder.Name != "My Folder" {
		t.Errorf("expected name 'My Folder', got %q", folder.Name)
	}
	if folder.ParentID != "" {
		t.Errorf("expected empty parent_id, got %q", folder.ParentID)
	}
	if folder.Icon != "folder" {
		t.Errorf("expected icon 'folder', got %q", folder.Icon)
	}

	folders, err := db.GetAllFolders()
	if err != nil {
		t.Fatal(err)
	}
	if len(folders) != 1 {
		t.Fatalf("expected 1 folder, got %d", len(folders))
	}
	if folders[0].Name != "My Folder" {
		t.Errorf("expected folder name 'My Folder', got %q", folders[0].Name)
	}
}

func TestDBCreateSubfolder(t *testing.T) {
	db := newTestDB(t)

	parent, _ := db.CreateFolder("Parent", "")
	child, err := db.CreateFolder("Child", parent.ID)
	if err != nil {
		t.Fatal(err)
	}
	if child.ParentID != parent.ID {
		t.Errorf("expected parent_id %q, got %q", parent.ID, child.ParentID)
	}

	folders, _ := db.GetAllFolders()
	if len(folders) != 2 {
		t.Fatalf("expected 2 folders, got %d", len(folders))
	}
}

func TestDBRenameFolder(t *testing.T) {
	db := newTestDB(t)

	folder, _ := db.CreateFolder("Old Name", "")
	if err := db.RenameFolder(folder.ID, "New Name"); err != nil {
		t.Fatal(err)
	}

	folders, _ := db.GetAllFolders()
	if folders[0].Name != "New Name" {
		t.Errorf("expected name 'New Name', got %q", folders[0].Name)
	}
}

func TestDBDeleteFolderCascade(t *testing.T) {
	db := newTestDB(t)

	folder, _ := db.CreateFolder("To Delete", "")
	_, _ = db.CreateNoteInFolder("Note in folder", folder.ID)

	if err := db.DeleteFolder(folder.ID); err != nil {
		t.Fatal(err)
	}

	folders, _ := db.GetAllFolders()
	if len(folders) != 0 {
		t.Errorf("expected 0 folders after delete, got %d", len(folders))
	}

	notes, _ := db.GetAllNotes()
	if len(notes) != 0 {
		t.Errorf("expected 0 notes after folder delete, got %d", len(notes))
	}
}

func TestDBDeleteFolderCascadeDeletesDescendants(t *testing.T) {
	db := newTestDB(t)

	grandparent, _ := db.CreateFolder("Grandparent", "")
	parent, _ := db.CreateFolder("Parent", grandparent.ID)
	child, _ := db.CreateFolder("Child", parent.ID)

	_, _ = db.CreateNoteInFolder("Note in parent", parent.ID)
	_, _ = db.CreateNoteInFolder("Note in child", child.ID)

	if err := db.DeleteFolder(parent.ID); err != nil {
		t.Fatal(err)
	}

	folders, _ := db.GetAllFolders()
	if len(folders) != 1 {
		t.Fatalf("expected 1 folder (grandparent only), got %d", len(folders))
	}
	if folders[0].ID != grandparent.ID {
		t.Errorf("expected remaining folder to be grandparent, got %q", folders[0].Name)
	}

	notes, _ := db.GetAllNotes()
	if len(notes) != 0 {
		t.Errorf("expected 0 notes after cascade delete, got %d", len(notes))
	}
}

func TestDBMoveFolder(t *testing.T) {
	db := newTestDB(t)

	folderA, _ := db.CreateFolder("A", "")
	folderB, _ := db.CreateFolder("B", "")

	if err := db.MoveFolder(folderA.ID, folderB.ID); err != nil {
		t.Fatal(err)
	}

	folders, _ := db.GetAllFolders()
	for _, f := range folders {
		if f.ID == folderA.ID && f.ParentID != folderB.ID {
			t.Errorf("expected folder A parent_id %q, got %q", folderB.ID, f.ParentID)
		}
	}
}

func TestDBUpdateFolderIcon(t *testing.T) {
	db := newTestDB(t)

	folder, _ := db.CreateFolder("Test", "")
	if err := db.UpdateFolderIcon(folder.ID, "folder-star"); err != nil {
		t.Fatal(err)
	}

	folders, _ := db.GetAllFolders()
	if folders[0].Icon != "folder-star" {
		t.Errorf("expected icon 'folder-star', got %q", folders[0].Icon)
	}
}

func TestDBReorderFolders(t *testing.T) {
	db := newTestDB(t)

	f1, _ := db.CreateFolder("First", "")
	f2, _ := db.CreateFolder("Second", "")
	f3, _ := db.CreateFolder("Third", "")

	if err := db.ReorderFolders([]string{f3.ID, f1.ID, f2.ID}); err != nil {
		t.Fatal(err)
	}

	folders, _ := db.GetAllFolders()
	if folders[0].ID != f3.ID || folders[1].ID != f1.ID || folders[2].ID != f2.ID {
		t.Errorf("expected reorder [3,1,2], got [%s,%s,%s]", folders[0].ID, folders[1].ID, folders[2].ID)
	}
}

func TestDBMoveNoteToFolder(t *testing.T) {
	db := newTestDB(t)

	folder, _ := db.CreateFolder("Target", "")
	note, _ := db.CreateNote("Note")

	if err := db.MoveNoteToFolder(note.ID, folder.ID); err != nil {
		t.Fatal(err)
	}

	got, _ := db.GetNote(note.ID)
	if got.FolderID != folder.ID {
		t.Errorf("expected folder_id %q, got %q", folder.ID, got.FolderID)
	}
}

func TestDBMoveNoteToRoot(t *testing.T) {
	db := newTestDB(t)

	folder, _ := db.CreateFolder("Target", "")
	note, _ := db.CreateNoteInFolder("Note", folder.ID)

	if err := db.MoveNoteToFolder(note.ID, ""); err != nil {
		t.Fatal(err)
	}

	got, _ := db.GetNote(note.ID)
	if got.FolderID != "" {
		t.Errorf("expected empty folder_id (root), got %q", got.FolderID)
	}
}

func TestDBCreateNoteInFolder(t *testing.T) {
	db := newTestDB(t)

	folder, _ := db.CreateFolder("Target", "")
	note, err := db.CreateNoteInFolder("In Folder", folder.ID)
	if err != nil {
		t.Fatal(err)
	}
	if note.FolderID != folder.ID {
		t.Errorf("expected folder_id %q, got %q", folder.ID, note.FolderID)
	}

	notes, _ := db.GetAllNotes()
	if len(notes) != 1 {
		t.Fatalf("expected 1 note, got %d", len(notes))
	}
	if notes[0].FolderID != folder.ID {
		t.Errorf("expected note in folder, got folder_id %q", notes[0].FolderID)
	}
}

func TestDBGetAllNotesIncludesFolderID(t *testing.T) {
	db := newTestDB(t)

	folder, _ := db.CreateFolder("F", "")
	_, _ = db.CreateNoteInFolder("In Folder", folder.ID)
	_, _ = db.CreateNote("At Root")

	notes, _ := db.GetAllNotes()
	if len(notes) != 2 {
		t.Fatalf("expected 2 notes, got %d", len(notes))
	}

	for _, n := range notes {
		if n.Name == "In Folder" && n.FolderID != folder.ID {
			t.Errorf("expected 'In Folder' to have folder_id %q, got %q", folder.ID, n.FolderID)
		}
		if n.Name == "At Root" && n.FolderID != "" {
			t.Errorf("expected 'At Root' to have empty folder_id, got %q", n.FolderID)
		}
	}
}

func TestDBCreateNoteInFolderPosition(t *testing.T) {
	db := newTestDB(t)

	folder, _ := db.CreateFolder("F", "")
	n1, _ := db.CreateNoteInFolder("First", folder.ID)
	n2, _ := db.CreateNoteInFolder("Second", folder.ID)

	if n2.Position <= n1.Position {
		t.Errorf("expected second note position (%d) > first (%d)", n2.Position, n1.Position)
	}
}

func TestDBGenerateFancyNameNoEmoji(t *testing.T) {
	for i := 0; i < 20; i++ {
		name := GenerateFancyName()
		// Should be exactly "Adjective Noun" with no emoji
		parts := []byte(name)
		for _, b := range parts {
			if b > 127 {
				t.Errorf("expected ASCII-only fancy name, got %q (contains non-ASCII byte %d)", name, b)
				return
			}
		}
	}
}
