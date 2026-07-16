//go:build windows

package platform

import (
	"fmt"
	"os"
	"os/exec"
	"time"
)

// ReplaceBinary replaces the current binary with the new one on Windows.
// It uses the rename-to-old pattern since Windows locks running executables.
func ReplaceBinary(currentPath, newPath string) error {
	oldPath := currentPath + ".old"

	// Clean up any previous .old file
	_ = os.Remove(oldPath) //nolint:errcheck

	// Rename current binary to .old (Windows allows this even while running)
	if err := os.Rename(currentPath, oldPath); err != nil {
		return fmt.Errorf("rename current binary: %w", err)
	}

	// Place new binary
	if err := os.Rename(newPath, currentPath); err != nil {
		// Rollback: restore old binary
		_ = os.Rename(oldPath, currentPath) //nolint:errcheck
		return fmt.Errorf("place new binary: %w", err)
	}

	// Schedule cleanup of .old file with retries (antivirus may lock it)
	go cleanupWithRetries(oldPath, 25, 200*time.Millisecond)

	return nil
}

// StartProcess starts the binary as a detached process on Windows.
func StartProcess(path string) error {
	cmd := exec.Command(path) //nolint:gosec
	cmd.Stdout = nil
	cmd.Stderr = nil
	cmd.Stdin = nil
	return cmd.Start()
}

// cleanupWithRetries tries to remove a file with retries.
func cleanupWithRetries(path string, maxRetries int, delay time.Duration) {
	for i := 0; i < maxRetries; i++ {
		if os.Remove(path) == nil {
			return
		}
		time.Sleep(delay)
	}
}
