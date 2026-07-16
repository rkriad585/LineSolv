package updater

import (
	"context"
)

// EventHandler is a function type for emitting update events.
// It matches the Wails runtime.EventsEmit signature.
type EventHandler func(eventName string, data ...interface{})

// Event names emitted by the updater.
const (
	EventChecking    = "update:checking"
	EventAvailable   = "update:available"
	EventUpToDate    = "update:up-to-date"
	EventDownloading = "update:downloading"
	EventDownloaded  = "update:downloaded"
	EventVerifying   = "update:verifying"
	EventInstalling  = "update:installing"
	EventRestarting  = "update:restarting"
	EventFailed      = "update:failed"
)

// EventPayload is the base payload for update events.
type EventPayload struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// UpdateAvailablePayload is emitted when an update is found.
type UpdateAvailablePayload struct {
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	ReleaseNotes   string `json:"releaseNotes"`
	AssetName      string `json:"assetName"`
	AssetSize      int64  `json:"assetSize"`
	DownloadURL    string `json:"downloadURL"`
	ChecksumURL    string `json:"checksumURL"`
	SignatureURL   string `json:"signatureURL"`
	PublishedAt    string `json:"publishedAt"`
}

// DownloadProgressPayload is emitted during download.
type DownloadProgressPayload struct {
	BytesDownloaded int64   `json:"bytesDownloaded"`
	BytesTotal      int64   `json:"bytesTotal"`
	Percent         float64 `json:"percent"`
	Speed           float64 `json:"speed"`
	ETA             float64 `json:"eta"`
	Status          string  `json:"status"`
}

// FailedPayload is emitted on failure.
type FailedPayload struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

// emitEvent is a helper that calls the event handler with the payload.
// This ensures consistent event format across the updater.
func emitEvent(ctx context.Context, handler EventHandler, eventName string, payload interface{}) {
	if handler == nil {
		return
	}
	// Pass the payload directly — Wails handles serialization
	handler(eventName, payload)
}
