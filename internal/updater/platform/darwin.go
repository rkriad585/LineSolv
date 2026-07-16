//go:build darwin

package platform

import (
	"fmt"
	"os"
	"os/exec"
)

// ReplaceBinary replaces the current binary with the new one on macOS.
// For standalone binaries, this is an atomic inode rename.
// For .app bundles, the binary is inside Contents/MacOS/.
func ReplaceBinary(currentPath, newPath string) error {
	// Preserve permissions from current binary
	info, err := os.Stat(currentPath)
	if err != nil {
		return fmt.Errorf("stat current binary: %w", err)
	}

	// Atomic rename
	if err := os.Rename(newPath, currentPath); err != nil {
		return fmt.Errorf("rename new binary: %w", err)
	}

	// Preserve permissions
	if err := os.Chmod(currentPath, info.Mode()); err != nil {
		return fmt.Errorf("set permissions: %w", err)
	}

	return nil
}

// StartProcess starts the binary as a detached process on macOS.
func StartProcess(path string) error {
	cmd := exec.Command(path) //nolint:gosec
	cmd.Stdout = nil
	cmd.Stderr = nil
	cmd.Stdin = nil
	return cmd.Start()
}
