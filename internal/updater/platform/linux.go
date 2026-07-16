//go:build linux

package platform

import (
	"fmt"
	"os"
	"syscall"
)

// ReplaceBinary replaces the current binary with the new one on Linux.
// Uses atomic inode replacement — the running process keeps the old inode.
func ReplaceBinary(currentPath, newPath string) error {
	// Preserve permissions from current binary
	info, err := os.Stat(currentPath)
	if err != nil {
		return fmt.Errorf("stat current binary: %w", err)
	}

	// Atomic rename — POSIX guarantees the running process keeps the old inode
	if err := os.Rename(newPath, currentPath); err != nil {
		return fmt.Errorf("rename new binary: %w", err)
	}

	// Preserve permissions
	if err := os.Chmod(currentPath, info.Mode()); err != nil {
		return fmt.Errorf("set permissions: %w", err)
	}

	return nil
}

// StartProcess replaces the current process with the new binary using exec.
// This is the most reliable restart method on Linux — same PID, clean transition.
func StartProcess(path string) error {
	argv := os.Args
	envv := os.Environ()

	// Use syscall.Exec to replace the current process
	return syscall.Exec(path, argv, envv) //nolint:errcheck,gosec
}
