package updater

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"
)

func TestDownloadFile_Basic(t *testing.T) {
	content := []byte("hello world, this is a test file for downloading")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write(content) //nolint:errcheck
	}))
	defer server.Close()

	dir := t.TempDir()
	dest := filepath.Join(dir, "downloaded.bin")

	var lastProgress Progress
	err := DownloadFile(context.Background(), server.URL, dest, DownloadOpts{
		MaxRetries: 1,
		OnProgress: func(p Progress) { lastProgress = p },
	})
	if err != nil {
		t.Fatal(err)
	}

	data, err := os.ReadFile(dest)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != string(content) {
		t.Errorf("downloaded content = %q, want %q", data, content)
	}

	if lastProgress.Percent != 100 {
		t.Errorf("final progress percent = %f, want 100", lastProgress.Percent)
	}
}

func TestDownloadFile_Retry(t *testing.T) {
	var attempts atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		n := attempts.Add(1)
		if n < 3 {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Write([]byte("success")) //nolint:errcheck
	}))
	defer server.Close()

	dir := t.TempDir()
	dest := filepath.Join(dir, "retry.bin")

	err := DownloadFile(context.Background(), server.URL, dest, DownloadOpts{
		MaxRetries: 3,
		RetryDelay: 10 * time.Millisecond,
	})
	if err != nil {
		t.Fatal(err)
	}

	data, err := os.ReadFile(dest)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "success" {
		t.Errorf("content = %q, want %q", data, "success")
	}

	if int(attempts.Load()) != 3 {
		t.Errorf("attempts = %d, want 3", attempts.Load())
	}
}

func TestDownloadFile_Resume(t *testing.T) {
	fullContent := []byte("hello world, this is the complete file content for resume testing")
	partialLen := 13
	totalLen := len(fullContent)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rangeHeader := r.Header.Get("Range")
		if rangeHeader != "" {
			cr := fmt.Sprintf("bytes %d-/%d", partialLen, totalLen)
			w.Header().Set("Content-Range", cr)
			w.WriteHeader(http.StatusPartialContent)
			w.Write(fullContent[partialLen:]) //nolint:errcheck
		} else {
			w.Write(fullContent) //nolint:errcheck
		}
	}))
	defer server.Close()

	dir := t.TempDir()
	dest := filepath.Join(dir, "resume.bin")

	// Create partial file
	if err := os.WriteFile(dest, fullContent[:partialLen], 0600); err != nil {
		t.Fatal(err)
	}

	err := DownloadFile(context.Background(), server.URL, dest, DownloadOpts{
		MaxRetries: 1,
	})
	if err != nil {
		t.Fatal(err)
	}

	data, err := os.ReadFile(dest)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != string(fullContent) {
		t.Errorf("content = %q, want %q", data, fullContent)
	}
}

func TestDownloadFile_Cancellation(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(5 * time.Second)
		w.Write([]byte("should not reach")) //nolint:errcheck
	}))
	defer server.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	dir := t.TempDir()
	dest := filepath.Join(dir, "cancelled.bin")

	err := DownloadFile(ctx, server.URL, dest, DownloadOpts{
		MaxRetries: 0,
	})
	if err == nil {
		t.Error("DownloadFile should fail when context is cancelled")
	}
}

func TestDownloadBytes(t *testing.T) {
	content := []byte("test checksum data")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write(content) //nolint:errcheck
	}))
	defer server.Close()

	data, err := DownloadBytes(context.Background(), server.URL)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != string(content) {
		t.Errorf("DownloadBytes = %q, want %q", data, content)
	}
}

func TestDownloadBytes_Error(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	_, err := DownloadBytes(context.Background(), server.URL)
	if err == nil {
		t.Error("DownloadBytes should fail on 404")
	}
}
