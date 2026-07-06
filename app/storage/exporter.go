package storage

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

func ExportNote(note Note, format string) string {
	switch strings.ToLower(format) {
	case "txt":
		return exportTXT(note)
	case "md":
		return exportMD(note)
	case "json":
		return exportJSON(note)
	case "toml":
		return exportTOML(note)
	default:
		return exportLV(note)
	}
}

func exportLV(note Note) string {
	return note.Content
}

func exportTXT(note Note) string {
	dt := time.UnixMilli(note.CreatedAt).Format("2006-01-02 15:04:05")
	var buf strings.Builder
	buf.WriteString(fmt.Sprintf("Title: %s\n", note.Name))
	buf.WriteString(fmt.Sprintf("Created: %s\n", dt))
	buf.WriteString(fmt.Sprintf("---\n%s\n", note.Content))
	return buf.String()
}

func exportMD(note Note) string {
	dt := time.UnixMilli(note.CreatedAt).Format("2006-01-02 15:04:05")
	var buf strings.Builder
	buf.WriteString(fmt.Sprintf("# %s\n\n", note.Name))
	buf.WriteString(fmt.Sprintf("*Created: %s*\n\n", dt))
	buf.WriteString("---\n\n")
	buf.WriteString(note.Content)
	buf.WriteString("\n")
	return buf.String()
}

func exportJSON(note Note) string {
	m := map[string]interface{}{
		"id":        note.ID,
		"name":      note.Name,
		"content":   note.Content,
		"createdAt": note.CreatedAt,
		"updatedAt": note.UpdatedAt,
	}
	b, _ := json.MarshalIndent(m, "", "  ")
	return string(b)
}

func exportTOML(note Note) string {
	dt := time.UnixMilli(note.CreatedAt).Format("2006-01-02T15:04:05-07:00")
	ut := time.UnixMilli(note.UpdatedAt).Format("2006-01-02T15:04:05-07:00")
	var buf strings.Builder
	buf.WriteString(fmt.Sprintf("[note]\n"))
	buf.WriteString(fmt.Sprintf("id = %q\n", note.ID))
	buf.WriteString(fmt.Sprintf("name = %q\n", note.Name))
	buf.WriteString(fmt.Sprintf("created_at = %q\n", dt))
	buf.WriteString(fmt.Sprintf("updated_at = %q\n", ut))
	buf.WriteString(fmt.Sprintf("content = %q\n", note.Content))
	return buf.String()
}
