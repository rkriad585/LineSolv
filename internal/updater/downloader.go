package updater

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// Progress represents download progress information.
type Progress struct {
	BytesDownloaded int64   `json:"bytesDownloaded"`
	BytesTotal      int64   `json:"bytesTotal"`
	Percent         float64 `json:"percent"`
	Speed           float64 `json:"speed"`  // bytes per second
	ETA             float64 `json:"eta"`    // seconds remaining
	Status          string  `json:"status"` // "downloading", "retrying", "completed", "failed"
	Message         string  `json:"message"`
}

// DownloadOpts configures the download behavior.
type DownloadOpts struct {
	MaxRetries int
	RetryDelay time.Duration
	Timeout    time.Duration
	OnProgress func(Progress)
}

// DefaultDownloadOpts returns sensible defaults for downloading.
func DefaultDownloadOpts() DownloadOpts {
	return DownloadOpts{
		MaxRetries: 3,
		RetryDelay: 2 * time.Second,
		Timeout:    10 * time.Minute,
	}
}

// DownloadFile downloads a URL to a local file with progress tracking, retry, and cancellation.
// It supports HTTP Range headers for resume. The temp file is created with restrictive permissions.
func DownloadFile(ctx context.Context, url, dest string, opts DownloadOpts) error {
	if opts.MaxRetries <= 0 {
		opts.MaxRetries = 3
	}
	if opts.RetryDelay <= 0 {
		opts.RetryDelay = 2 * time.Second
	}
	if opts.Timeout <= 0 {
		opts.Timeout = 10 * time.Minute
	}

	var lastErr error
	for attempt := 0; attempt <= opts.MaxRetries; attempt++ {
		if attempt > 0 {
			if opts.OnProgress != nil {
				opts.OnProgress(Progress{
					Status:  "retrying",
					Message: fmt.Sprintf("Retry %d/%d...", attempt, opts.MaxRetries),
				})
			}
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(opts.RetryDelay * time.Duration(attempt)):
			}
		}

		lastErr = downloadOnce(ctx, url, dest, opts)
		if lastErr == nil {
			return nil
		}
	}

	return fmt.Errorf("%w: %v", ErrDownloadFail, lastErr)
}

func downloadOnce(ctx context.Context, url, dest string, opts DownloadOpts) error {
	// Check for partial download to support resume
	var offset int64
	if info, err := os.Stat(dest); err == nil {
		offset = info.Size()
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("User-Agent", "LineSolv-Updater")
	if offset > 0 {
		req.Header.Set("Range", fmt.Sprintf("bytes=%d-", offset))
	}

	client := &http.Client{Timeout: opts.Timeout}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("HTTP request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusPartialContent {
		return fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	// Determine total size
	totalSize := resp.ContentLength
	if resp.StatusCode == http.StatusPartialContent {
		// Content-Length is the remaining size, not total
		totalSize = offset + resp.ContentLength
	}

	// Open file for append if resuming, create otherwise
	var f *os.File
	if resp.StatusCode == http.StatusPartialContent {
		f, err = os.OpenFile(dest, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	} else {
		// Full download — truncate
		offset = 0
		f, err = os.Create(dest)
	}
	if err != nil {
		return fmt.Errorf("create file: %w", err)
	}
	defer f.Close()

	// Set restrictive permissions
	_ = os.Chmod(dest, 0600) //nolint:errcheck

	buf := make([]byte, 64*1024) // 64KB buffer
	var downloaded = offset
	startTime := time.Now()
	lastReport := startTime

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			if _, writeErr := f.Write(buf[:n]); writeErr != nil {
				return fmt.Errorf("write file: %w", writeErr)
			}
			downloaded += int64(n)

			// Report progress every 100ms to avoid flooding
			now := time.Now()
			if now.Sub(lastReport) >= 100*time.Millisecond && opts.OnProgress != nil {
				elapsed := now.Sub(startTime).Seconds()
				speed := float64(0)
				eta := float64(0)
				if elapsed > 0 {
					speed = float64(downloaded) / elapsed
				}
				if speed > 0 && totalSize > 0 {
					remaining := float64(totalSize-downloaded) / speed
					eta = remaining
				}
				percent := float64(0)
				if totalSize > 0 {
					percent = float64(downloaded) / float64(totalSize) * 100
				}

				opts.OnProgress(Progress{
					BytesDownloaded: downloaded,
					BytesTotal:      totalSize,
					Percent:         percent,
					Speed:           speed,
					ETA:             eta,
					Status:          "downloading",
				})
				lastReport = now
			}
		}
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			return fmt.Errorf("read body: %w", readErr)
		}
	}

	// Final progress report
	if opts.OnProgress != nil {
		opts.OnProgress(Progress{
			BytesDownloaded: downloaded,
			BytesTotal:      totalSize,
			Percent:         100,
			Status:          "completed",
			Message:         "Download complete",
		})
	}

	return nil
}

// DownloadBytes downloads a URL and returns the bytes in memory.
// Used for small files like SHA256SUMS and signatures.
func DownloadBytes(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("User-Agent", "LineSolv-Updater")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("download: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read body: %w", err)
	}
	return data, nil
}
