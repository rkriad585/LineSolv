package storage

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"math/rand/v2"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

var DataDir string

func init() {
	dir, err := os.UserConfigDir()
	if err != nil {
		dir = os.TempDir()
	}
	DataDir = filepath.Join(dir, "neostore", "linesolv")
}

func dbPath() string {
	return filepath.Join(DataDir, "linesolv.db")
}

type Note struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Content   string `json:"content"`
	CreatedAt int64  `json:"createdAt"`
	UpdatedAt int64  `json:"updatedAt"`
	Position  int    `json:"position"`
	FolderID  string `json:"folderId"`
	Icon      string `json:"icon"`
}

type Folder struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	ParentID  string `json:"parentId"`
	Icon      string `json:"icon"`
	Position  int    `json:"position"`
	CreatedAt int64  `json:"createdAt"`
	UpdatedAt int64  `json:"updatedAt"`
}

type DB struct {
	conn *sql.DB
}

func NewDB() (*DB, error) {
	if err := os.MkdirAll(DataDir, 0755); err != nil {
		return nil, fmt.Errorf("create data dir: %w", err)
	}
	conn, err := sql.Open("sqlite3", dbPath())
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	conn.SetMaxOpenConns(1)
	if _, err := conn.Exec(`PRAGMA journal_mode=WAL`); err != nil {
		return nil, fmt.Errorf("enable wal: %w", err)
	}
	if _, err := conn.Exec(`PRAGMA foreign_keys = ON`); err != nil {
		return nil, fmt.Errorf("enable foreign keys: %w", err)
	}
	if _, err := conn.Exec(`CREATE TABLE IF NOT EXISTS notes (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		content TEXT NOT NULL DEFAULT '',
		created_at INTEGER NOT NULL,
		updated_at INTEGER NOT NULL
	)`); err != nil {
		return nil, fmt.Errorf("create notes table: %w", err)
	}
	if _, err := conn.Exec(`CREATE TABLE IF NOT EXISTS currency_cache (
		rates TEXT NOT NULL,
		updated_at INTEGER NOT NULL
	)`); err != nil {
		return nil, fmt.Errorf("create currency_cache table: %w", err)
	}
	if _, err := conn.Exec(`ALTER TABLE notes ADD COLUMN position INTEGER NOT NULL DEFAULT 0`); err == nil {
		_, _ = conn.Exec(`UPDATE notes SET position = rowid`) //nolint:errcheck
	}
	if _, err := conn.Exec(`ALTER TABLE notes ADD COLUMN folder_id TEXT DEFAULT NULL`); err == nil { //nolint:errcheck
	}
	if _, err := conn.Exec(`ALTER TABLE notes ADD COLUMN icon TEXT DEFAULT 'document'`); err == nil { //nolint:errcheck
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
		return nil, fmt.Errorf("create folders table: %w", err)
	}
	if _, err := conn.Exec(`CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id, position)`); err != nil {
		return nil, fmt.Errorf("create folders index: %w", err)
	}
	if _, err := conn.Exec(`CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id, position)`); err != nil {
		return nil, fmt.Errorf("create notes folder index: %w", err)
	}
	if _, err := conn.Exec(`CREATE INDEX IF NOT EXISTS idx_notes_sort ON notes(position, updated_at)`); err != nil {
		return nil, fmt.Errorf("create sort index: %w", err)
	}
	return &DB{conn: conn}, nil
}

// NewTestDB creates an in-memory SQLite database for testing.
func NewTestDB() *DB {
	conn, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		panic(err)
	}
	_, _ = conn.Exec(`CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, name TEXT NOT NULL, content TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, position INTEGER NOT NULL DEFAULT 0, folder_id TEXT DEFAULT NULL, icon TEXT DEFAULT 'document')`)                                 //nolint:errcheck
	_, _ = conn.Exec(`CREATE TABLE IF NOT EXISTS folders (id TEXT PRIMARY KEY, name TEXT NOT NULL, parent_id TEXT DEFAULT NULL, icon TEXT DEFAULT 'folder', position INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE)`) //nolint:errcheck
	_, _ = conn.Exec(`CREATE TABLE IF NOT EXISTS currency_cache (rates TEXT NOT NULL, updated_at INTEGER NOT NULL)`)                                                                                                                                                                                                           //nolint:errcheck
	_, _ = conn.Exec(`CREATE INDEX IF NOT EXISTS idx_notes_sort ON notes(position, updated_at)`)                                                                                                                                                                                                                               //nolint:errcheck
	_, _ = conn.Exec(`CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id, position)`)                                                                                                                                                                                                                          //nolint:errcheck
	_, _ = conn.Exec(`CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id, position)`)                                                                                                                                                                                                                              //nolint:errcheck
	return &DB{conn: conn}
}

func (d *DB) Close() error {
	return d.conn.Close()
}

func (d *DB) GetAllNotes() ([]Note, error) {
	rows, err := d.conn.Query(`SELECT id, name, content, created_at, updated_at, position, COALESCE(folder_id, ''), COALESCE(icon, 'document') FROM notes ORDER BY position ASC, updated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var notes []Note
	for rows.Next() {
		var n Note
		if err := rows.Scan(&n.ID, &n.Name, &n.Content, &n.CreatedAt, &n.UpdatedAt, &n.Position, &n.FolderID, &n.Icon); err != nil {
			return nil, err
		}
		notes = append(notes, n)
	}
	return notes, rows.Err()
}

func (d *DB) GetNote(id string) (*Note, error) {
	var n Note
	err := d.conn.QueryRow(`SELECT id, name, content, created_at, updated_at, position, COALESCE(folder_id, ''), COALESCE(icon, 'document') FROM notes WHERE id = ?`, id).
		Scan(&n.ID, &n.Name, &n.Content, &n.CreatedAt, &n.UpdatedAt, &n.Position, &n.FolderID, &n.Icon)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (d *DB) CreateNote(name string) (*Note, error) {
	return d.CreateNoteInFolder(name, "")
}

func (d *DB) CreateNoteInFolder(name, folderID string) (*Note, error) {
	now := time.Now().UnixMilli()
	id := uuid.NewString()
	var pos int
	_ = d.conn.QueryRow(`SELECT COALESCE(MAX(position), -1) + 1 FROM notes`).Scan(&pos) //nolint:errcheck
	var fid *string
	if folderID != "" {
		fid = &folderID
	}
	icon := randomNoteIcon()
	_, err := d.conn.Exec(`INSERT INTO notes (id, name, content, created_at, updated_at, position, folder_id, icon) VALUES (?, ?, '', ?, ?, ?, ?, ?)`,
		id, name, now, now, pos, fid, icon)
	if err != nil {
		return nil, err
	}
	return &Note{ID: id, Name: name, Content: "", CreatedAt: now, UpdatedAt: now, Position: pos, FolderID: folderID, Icon: icon}, nil
}

func (d *DB) CreateNoteWithContent(name, content string) (*Note, error) {
	return d.CreateNoteWithContentInFolder(name, content, "")
}

func (d *DB) CreateNoteWithContentInFolder(name, content, folderID string) (*Note, error) {
	now := time.Now().UnixMilli()
	id := uuid.NewString()
	var pos int
	_ = d.conn.QueryRow(`SELECT COALESCE(MAX(position), -1) + 1 FROM notes`).Scan(&pos) //nolint:errcheck
	var fid *string
	if folderID != "" {
		fid = &folderID
	}
	icon := randomNoteIcon()
	_, err := d.conn.Exec(`INSERT INTO notes (id, name, content, created_at, updated_at, position, folder_id, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		id, name, content, now, now, pos, fid, icon)
	if err != nil {
		return nil, err
	}
	return &Note{ID: id, Name: name, Content: content, CreatedAt: now, UpdatedAt: now, Position: pos, FolderID: folderID, Icon: icon}, nil
}

// CreateNoteWithContentAndDates creates a note preserving original timestamps.
// If createdAt or updatedAt is 0, current time is used.
func (d *DB) CreateNoteWithContentAndDates(name, content string, createdAt, updatedAt int64) (*Note, error) {
	return d.CreateNoteWithContentAndDatesInFolder(name, content, createdAt, updatedAt, "")
}

func (d *DB) CreateNoteWithContentAndDatesInFolder(name, content string, createdAt, updatedAt int64, folderID string) (*Note, error) {
	now := time.Now().UnixMilli()
	id := uuid.NewString()
	var pos int
	_ = d.conn.QueryRow(`SELECT COALESCE(MAX(position), -1) + 1 FROM notes`).Scan(&pos) //nolint:errcheck
	if createdAt == 0 {
		createdAt = now
	}
	if updatedAt == 0 {
		updatedAt = now
	}
	var fid *string
	if folderID != "" {
		fid = &folderID
	}
	icon := randomNoteIcon()
	_, err := d.conn.Exec(`INSERT INTO notes (id, name, content, created_at, updated_at, position, folder_id, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		id, name, content, createdAt, updatedAt, pos, fid, icon)
	if err != nil {
		return nil, err
	}
	return &Note{ID: id, Name: name, Content: content, CreatedAt: createdAt, UpdatedAt: updatedAt, Position: pos, FolderID: folderID, Icon: icon}, nil
}

func (d *DB) ReorderNotes(noteIDs []string) error {
	tx, err := d.conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck
	for i, id := range noteIDs {
		if _, err := tx.Exec(`UPDATE notes SET position = ? WHERE id = ?`, i, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (d *DB) RenameNote(id, name string) error {
	_, err := d.conn.Exec(`UPDATE notes SET name = ?, updated_at = ? WHERE id = ?`, name, time.Now().UnixMilli(), id)
	return err
}

func (d *DB) DeleteNote(id string) error {
	_, err := d.conn.Exec(`DELETE FROM notes WHERE id = ?`, id)
	return err
}

func (d *DB) SaveNoteContent(id, content string) error {
	_, err := d.conn.Exec(`UPDATE notes SET content = ?, updated_at = ? WHERE id = ?`, content, time.Now().UnixMilli(), id)
	return err
}

var noteIcons = []string{
	"document", "fileText", "code", "pencil", "star",
	"lightbulb", "bookmark", "tag", "clock", "heart",
	"mail", "message", "image", "music", "shield",
	"gift", "flame", "zap", "target", "compass",
	"globe", "lock", "eye", "bell", "flag",
	"terminal", "database", "layers", "leaf", "moon",
	"cloud", "cpu", "wifi", "checkCircle", "alertTriangle",
	"helpCircle", "inbox", "calendar", "fileCode2", "trendingUp",
	"award", "trophy", "gem", "sparkle", "crown",
	"wand", "puzzle", "blocks", "dice", "gamepad",
	"headphones", "volume2", "mic", "camera", "film",
	"bookOpen", "penTool", "scissors", "stamp", "ruler", "medal",
}

func randomNoteIcon() string {
	return noteIcons[rand.IntN(len(noteIcons))] //nolint:gosec
}

func (d *DB) UpdateNoteIcon(id, icon string) error {
	_, err := d.conn.Exec(`UPDATE notes SET icon = ?, updated_at = ? WHERE id = ?`, icon, time.Now().UnixMilli(), id)
	return err
}

func (d *DB) NoteCount() (int, error) {
	var count int
	err := d.conn.QueryRow(`SELECT COUNT(*) FROM notes`).Scan(&count)
	return count, err
}

func (d *DB) MoveNoteToFolder(noteID, folderID string) error {
	var fid *string
	if folderID != "" {
		fid = &folderID
	}
	var pos int
	_ = d.conn.QueryRow(`SELECT COALESCE(MAX(position), -1) + 1 FROM notes WHERE COALESCE(folder_id, '') = COALESCE(?, '')`, folderID).Scan(&pos) //nolint:errcheck
	_, err := d.conn.Exec(`UPDATE notes SET folder_id = ?, position = ?, updated_at = ? WHERE id = ?`, fid, pos, time.Now().UnixMilli(), noteID)
	return err
}

func (d *DB) UniqueFolderName(parentID string) string {
	base := "New Folder"
	var pid *string
	if parentID != "" {
		pid = &parentID
	}
	// Check if "New Folder" already exists
	var exists bool
	_ = d.conn.QueryRow(`SELECT EXISTS(SELECT 1 FROM folders WHERE name = ? AND COALESCE(parent_id, '') = COALESCE(?, ''))`, base, pid).Scan(&exists)
	if !exists {
		return base
	}
	// Find the next available number
	for i := 1; ; i++ {
		candidate := fmt.Sprintf("New Folder %d", i)
		_ = d.conn.QueryRow(`SELECT EXISTS(SELECT 1 FROM folders WHERE name = ? AND COALESCE(parent_id, '') = COALESCE(?, ''))`, candidate, pid).Scan(&exists)
		if !exists {
			return candidate
		}
	}
}

func (d *DB) CreateFolder(name, parentID string) (*Folder, error) {
	now := time.Now().UnixMilli()
	id := uuid.NewString()
	var pos int
	var pid *string
	if parentID != "" {
		pid = &parentID
	}
	_ = d.conn.QueryRow(`SELECT COALESCE(MAX(position), -1) + 1 FROM folders WHERE COALESCE(parent_id, '') = COALESCE(?, '')`, parentID).Scan(&pos) //nolint:errcheck
	_, err := d.conn.Exec(`INSERT INTO folders (id, name, parent_id, icon, position, created_at, updated_at) VALUES (?, ?, ?, 'folder', ?, ?, ?)`,
		id, name, pid, pos, now, now)
	if err != nil {
		return nil, err
	}
	return &Folder{ID: id, Name: name, ParentID: parentID, Icon: "folder", Position: pos, CreatedAt: now, UpdatedAt: now}, nil
}

func (d *DB) GetAllFolders() ([]Folder, error) {
	rows, err := d.conn.Query(`SELECT id, name, COALESCE(parent_id, ''), icon, position, created_at, updated_at FROM folders ORDER BY position ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var folders []Folder
	for rows.Next() {
		var f Folder
		if err := rows.Scan(&f.ID, &f.Name, &f.ParentID, &f.Icon, &f.Position, &f.CreatedAt, &f.UpdatedAt); err != nil {
			return nil, err
		}
		folders = append(folders, f)
	}
	return folders, rows.Err()
}

func (d *DB) RenameFolder(id, name string) error {
	_, err := d.conn.Exec(`UPDATE folders SET name = ?, updated_at = ? WHERE id = ?`, name, time.Now().UnixMilli(), id)
	return err
}

func (d *DB) DeleteFolder(id string) error {
	tx, err := d.conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck

	// Collect all descendant folder IDs (BFS)
	var allFolderIDs []string
	queue := []string{id}
	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		allFolderIDs = append(allFolderIDs, current)

		rows, err := tx.Query(`SELECT id FROM folders WHERE parent_id = ?`, current)
		if err != nil {
			return err
		}
		for rows.Next() {
			var cid string
			if err := rows.Scan(&cid); err != nil {
				rows.Close()
				return err
			}
			queue = append(queue, cid)
		}
		rows.Close()
	}

	// Delete all notes in the folder and its descendants
	placeholders := make([]string, len(allFolderIDs))
	args := make([]interface{}, len(allFolderIDs))
	for i, fid := range allFolderIDs {
		placeholders[i] = "?"
		args[i] = fid
	}
	if _, err := tx.Exec(`DELETE FROM notes WHERE folder_id IN (`+strings.Join(placeholders, ",")+`)`, args...); err != nil {
		return err
	}

	// Delete all descendant folders (deepest first is handled by FK or order doesn't matter since we have all IDs)
	if _, err := tx.Exec(`DELETE FROM folders WHERE id IN (`+strings.Join(placeholders, ",")+`)`, args...); err != nil {
		return err
	}

	return tx.Commit()
}

func (d *DB) MoveFolder(id, newParentID string) error {
	if newParentID != "" && newParentID != id {
		if d.isAncestor(id, newParentID) {
			return fmt.Errorf("cannot move folder into its own descendant")
		}
	}
	var pid *string
	if newParentID != "" {
		pid = &newParentID
	}
	_, err := d.conn.Exec(`UPDATE folders SET parent_id = ?, updated_at = ? WHERE id = ?`, pid, time.Now().UnixMilli(), id)
	return err
}

// isAncestor returns true if ancestorID is an ancestor of childID in the folder tree.
func (d *DB) isAncestor(ancestorID, childID string) bool {
	rows, err := d.conn.Query(`SELECT parent_id FROM folders WHERE id = ?`, childID)
	if err != nil {
		return false
	}
	defer rows.Close()
	for rows.Next() {
		var pid sql.NullString
		if err := rows.Scan(&pid); err != nil {
			return false
		}
		if !pid.Valid {
			return false
		}
		if pid.String == ancestorID {
			return true
		}
		// Walk up recursively
		if d.isAncestor(ancestorID, pid.String) {
			return true
		}
	}
	return false
}

func (d *DB) UpdateFolderIcon(id, icon string) error {
	_, err := d.conn.Exec(`UPDATE folders SET icon = ?, updated_at = ? WHERE id = ?`, icon, time.Now().UnixMilli(), id)
	return err
}

func (d *DB) ReorderFolders(folderIDs []string) error {
	tx, err := d.conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck
	for i, id := range folderIDs {
		if _, err := tx.Exec(`UPDATE folders SET position = ? WHERE id = ?`, i, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}

type CachedRates struct {
	Rates     map[string]float64 `json:"rates"`
	UpdatedAt int64              `json:"updatedAt"`
}

func (d *DB) SaveCurrencyRates(rates map[string]float64) error {
	data, err := json.Marshal(rates)
	if err != nil {
		return err
	}
	now := time.Now().UnixMilli()
	_, err = d.conn.Exec(`DELETE FROM currency_cache`)
	if err != nil {
		return err
	}
	_, err = d.conn.Exec(`INSERT INTO currency_cache (rates, updated_at) VALUES (?, ?)`, string(data), now)
	return err
}

func (d *DB) GetCachedCurrencyRates() (*CachedRates, error) {
	var ratesJSON string
	var updatedAt int64
	err := d.conn.QueryRow(`SELECT rates, updated_at FROM currency_cache LIMIT 1`).Scan(&ratesJSON, &updatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var rates map[string]float64
	if err := json.Unmarshal([]byte(ratesJSON), &rates); err != nil {
		return nil, err
	}
	return &CachedRates{Rates: rates, UpdatedAt: updatedAt}, nil
}
