package storage

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
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
	_, _ = conn.Exec(`CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, name TEXT NOT NULL, content TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, position INTEGER NOT NULL DEFAULT 0)`) //nolint:errcheck
	_, _ = conn.Exec(`CREATE TABLE IF NOT EXISTS currency_cache (rates TEXT NOT NULL, updated_at INTEGER NOT NULL)`)                                                                                                                //nolint:errcheck
	_, _ = conn.Exec(`CREATE INDEX IF NOT EXISTS idx_notes_sort ON notes(position, updated_at)`)                                                                                                                                    //nolint:errcheck
	return &DB{conn: conn}
}

func (d *DB) Close() error {
	return d.conn.Close()
}

func (d *DB) GetAllNotes() ([]Note, error) {
	rows, err := d.conn.Query(`SELECT id, name, content, created_at, updated_at, position FROM notes ORDER BY position ASC, updated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var notes []Note
	for rows.Next() {
		var n Note
		if err := rows.Scan(&n.ID, &n.Name, &n.Content, &n.CreatedAt, &n.UpdatedAt, &n.Position); err != nil {
			return nil, err
		}
		notes = append(notes, n)
	}
	return notes, rows.Err()
}

func (d *DB) GetNote(id string) (*Note, error) {
	var n Note
	err := d.conn.QueryRow(`SELECT id, name, content, created_at, updated_at, position FROM notes WHERE id = ?`, id).
		Scan(&n.ID, &n.Name, &n.Content, &n.CreatedAt, &n.UpdatedAt, &n.Position)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (d *DB) CreateNote(name string) (*Note, error) {
	now := time.Now().UnixMilli()
	id := uuid.NewString()
	var pos int
	_ = d.conn.QueryRow(`SELECT COALESCE(MAX(position), -1) + 1 FROM notes`).Scan(&pos) //nolint:errcheck
	_, err := d.conn.Exec(`INSERT INTO notes (id, name, content, created_at, updated_at, position) VALUES (?, ?, '', ?, ?, ?)`,
		id, name, now, now, pos)
	if err != nil {
		return nil, err
	}
	return &Note{ID: id, Name: name, Content: "", CreatedAt: now, UpdatedAt: now, Position: pos}, nil
}

func (d *DB) CreateNoteWithContent(name, content string) (*Note, error) {
	now := time.Now().UnixMilli()
	id := uuid.NewString()
	var pos int
	_ = d.conn.QueryRow(`SELECT COALESCE(MAX(position), -1) + 1 FROM notes`).Scan(&pos) //nolint:errcheck
	_, err := d.conn.Exec(`INSERT INTO notes (id, name, content, created_at, updated_at, position) VALUES (?, ?, ?, ?, ?, ?)`,
		id, name, content, now, now, pos)
	if err != nil {
		return nil, err
	}
	return &Note{ID: id, Name: name, Content: content, CreatedAt: now, UpdatedAt: now, Position: pos}, nil
}

// CreateNoteWithContentAndDates creates a note preserving original timestamps.
// If createdAt or updatedAt is 0, current time is used.
func (d *DB) CreateNoteWithContentAndDates(name, content string, createdAt, updatedAt int64) (*Note, error) {
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
	_, err := d.conn.Exec(`INSERT INTO notes (id, name, content, created_at, updated_at, position) VALUES (?, ?, ?, ?, ?, ?)`,
		id, name, content, createdAt, updatedAt, pos)
	if err != nil {
		return nil, err
	}
	return &Note{ID: id, Name: name, Content: content, CreatedAt: createdAt, UpdatedAt: updatedAt, Position: pos}, nil
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

func (d *DB) NoteCount() (int, error) {
	var count int
	err := d.conn.QueryRow(`SELECT COUNT(*) FROM notes`).Scan(&count)
	return count, err
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
