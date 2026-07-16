package updater

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"strings"
)

// VerifySHA256 verifies that the file at binaryPath matches the expected SHA256 hash.
// The expectedHash should be a hex-encoded SHA256 hash (64 characters).
func VerifySHA256(binaryPath, expectedHash string) error {
	f, err := os.Open(binaryPath)
	if err != nil {
		return fmt.Errorf("open file: %w", err)
	}
	defer f.Close()

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return fmt.Errorf("hash file: %w", err)
	}

	actual := hex.EncodeToString(h.Sum(nil))
	expectedHash = strings.TrimSpace(expectedHash)

	if actual != expectedHash {
		return fmt.Errorf("%w: expected %s, got %s", ErrChecksumMatch, expectedHash, actual)
	}
	return nil
}

// ComputeSHA256 computes the SHA256 hash of a file and returns it as a hex string.
func ComputeSHA256(filePath string) (string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("open file: %w", err)
	}
	defer f.Close()

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", fmt.Errorf("hash file: %w", err)
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// ParseSHA256SUMS parses a SHA256SUMS file and returns a map of filename -> hash.
// The format is: <hash>  <filename> (two spaces between hash and filename).
func ParseSHA256SUMS(data []byte) map[string]string {
	result := make(map[string]string)
	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		// Split on two or more spaces, or one space + asterisk (binary mode)
		parts := strings.SplitN(line, "  ", 2)
		if len(parts) == 2 {
			result[strings.TrimSpace(parts[1])] = strings.TrimSpace(parts[0])
		}
	}
	return result
}

// FindHashForAsset looks up the hash for a given asset name in a parsed SHA256SUMS map.
// It tries exact match first, then falls back to partial matching.
func FindHashForAsset(sums map[string]string, assetName string) (string, error) {
	// Exact match
	if hash, ok := sums[assetName]; ok {
		return hash, nil
	}

	// Try with common prefixes stripped
	for name, hash := range sums {
		if strings.Contains(assetName, name) || strings.Contains(name, assetName) {
			return hash, nil
		}
	}

	return "", fmt.Errorf("asset %q not found in SHA256SUMS", assetName)
}
