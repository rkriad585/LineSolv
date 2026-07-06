package storage

import (
	"database/sql"
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
	return &DB{conn: conn}, nil
}

func (d *DB) Close() error {
	return d.conn.Close()
}

func (d *DB) GetAllNotes() ([]Note, error) {
	rows, err := d.conn.Query(`SELECT id, name, content, created_at, updated_at FROM notes ORDER BY updated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var notes []Note
	for rows.Next() {
		var n Note
		if err := rows.Scan(&n.ID, &n.Name, &n.Content, &n.CreatedAt, &n.UpdatedAt); err != nil {
			return nil, err
		}
		notes = append(notes, n)
	}
	return notes, rows.Err()
}

func (d *DB) GetNote(id string) (*Note, error) {
	var n Note
	err := d.conn.QueryRow(`SELECT id, name, content, created_at, updated_at FROM notes WHERE id = ?`, id).
		Scan(&n.ID, &n.Name, &n.Content, &n.CreatedAt, &n.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (d *DB) CreateNote(name string) (*Note, error) {
	now := time.Now().UnixMilli()
	id := uuid.NewString()
	_, err := d.conn.Exec(`INSERT INTO notes (id, name, content, created_at, updated_at) VALUES (?, ?, '', ?, ?)`,
		id, name, now, now)
	if err != nil {
		return nil, err
	}
	return &Note{ID: id, Name: name, Content: "", CreatedAt: now, UpdatedAt: now}, nil
}

func (d *DB) CreateNoteWithContent(name, content string) (*Note, error) {
	now := time.Now().UnixMilli()
	id := uuid.NewString()
	_, err := d.conn.Exec(`INSERT INTO notes (id, name, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
		id, name, content, now, now)
	if err != nil {
		return nil, err
	}
	return &Note{ID: id, Name: name, Content: content, CreatedAt: now, UpdatedAt: now}, nil
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
