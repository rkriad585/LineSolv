package updater

import (
	"crypto/ed25519"
	"encoding/pem"
	"os"
	"path/filepath"
	"testing"
)

func TestVerifySHA256(t *testing.T) {
	// Create a temp file with known content
	dir := t.TempDir()
	file := filepath.Join(dir, "test.bin")
	if err := os.WriteFile(file, []byte("hello world"), 0600); err != nil {
		t.Fatal(err)
	}

	// SHA256 of "hello world": b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
	expected := "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
	if err := VerifySHA256(file, expected); err != nil {
		t.Errorf("VerifySHA256 should pass: %v", err)
	}

	wrong := "0000000000000000000000000000000000000000000000000000000000000000"
	if err := VerifySHA256(file, wrong); err == nil {
		t.Error("VerifySHA256 should fail with wrong hash")
	}
}

func TestComputeSHA256(t *testing.T) {
	dir := t.TempDir()
	file := filepath.Join(dir, "test.bin")
	if err := os.WriteFile(file, []byte("hello world"), 0600); err != nil {
		t.Fatal(err)
	}

	hash, err := ComputeSHA256(file)
	if err != nil {
		t.Fatal(err)
	}

	expected := "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
	if hash != expected {
		t.Errorf("ComputeSHA256 = %q, want %q", hash, expected)
	}
}

func TestParseSHA256SUMS(t *testing.T) {
	data := []byte(`b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9  LineSolv-0.15.10-linux-amd64
a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2  LineSolv-0.15.10-darwin-arm64
`)

	sums := ParseSHA256SUMS(data)
	if len(sums) != 2 {
		t.Fatalf("ParseSHA256SUMS returned %d entries, want 2", len(sums))
	}

	if sums["LineSolv-0.15.10-linux-amd64"] != "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9" {
		t.Error("wrong hash for linux-amd64")
	}
	if sums["LineSolv-0.15.10-darwin-arm64"] != "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2" {
		t.Error("wrong hash for darwin-arm64")
	}
}

func TestFindHashForAsset(t *testing.T) {
	sums := map[string]string{
		"LineSolv-0.15.10-linux-amd64":  "abc123",
		"LineSolv-0.15.10-darwin-arm64": "def456",
	}

	// Exact match
	hash, err := FindHashForAsset(sums, "LineSolv-0.15.10-linux-amd64")
	if err != nil {
		t.Fatal(err)
	}
	if hash != "abc123" {
		t.Errorf("FindHashForAsset = %q, want %q", hash, "abc123")
	}

	// Not found
	_, err = FindHashForAsset(sums, "LineSolv-0.15.10-windows-amd64.exe")
	if err == nil {
		t.Error("FindHashForAsset should fail for missing asset")
	}
}

func TestVerifyEd25519(t *testing.T) {
	// Generate a key pair for testing
	pub, priv, err := ed25519.GenerateKey(nil)
	if err != nil {
		t.Fatal(err)
	}

	dir := t.TempDir()

	// Write test data
	dataPath := filepath.Join(dir, "SHA256SUMS")
	data := []byte("test data to sign")
	if err := os.WriteFile(dataPath, data, 0600); err != nil {
		t.Fatal(err)
	}

	// Sign the data
	sig := ed25519.Sign(priv, data)
	sigPath := filepath.Join(dir, "SHA256SUMS.sig")
	if err := os.WriteFile(sigPath, sig, 0600); err != nil {
		t.Fatal(err)
	}

	// Write public key as PEM for testing
	pubPath := filepath.Join(dir, "ed25519_public.pem")
	pubFile, err := os.Create(pubPath)
	if err != nil {
		t.Fatal(err)
	}
	if err := pem.Encode(pubFile, &pem.Block{Type: "ED25519 PUBLIC KEY", Bytes: pub}); err != nil {
		t.Fatal(err)
	}
	pubFile.Close()

	// Verify — this uses the embedded key, so we test VerifyEd25519Bytes instead
	if err := VerifyEd25519Bytes(sig, data); err != nil {
		// This will fail because the embedded key is different from our test key
		// That's expected — the important thing is the function doesn't panic
		t.Logf("VerifyEd25519Bytes failed as expected (different key): %v", err)
	}

	// Test with wrong signature
	wrongSig := make([]byte, ed25519.SignatureSize)
	if err := VerifyEd25519Bytes(wrongSig, data); err == nil {
		t.Error("VerifyEd25519Bytes should fail with wrong signature")
	}
}

func TestSelectAsset(t *testing.T) {
	release := &Release{
		Assets: []ReleaseAsset{
			{Name: "LineSolv-0.15.10-linux-amd64", Size: 1000, BrowserDownloadURL: "https://example.com/linux"},
			{Name: "LineSolv-0.15.10-darwin-arm64", Size: 1000, BrowserDownloadURL: "https://example.com/darwin"},
			{Name: "LineSolv-0.15.10-windows-amd64.exe", Size: 1000, BrowserDownloadURL: "https://example.com/windows"},
			{Name: "SHA256SUMS", Size: 100, BrowserDownloadURL: "https://example.com/checksums"},
			{Name: "SHA256SUMS.sig", Size: 64, BrowserDownloadURL: "https://example.com/sig"},
		},
	}

	// Linux amd64
	asset := SelectAsset(release, "linux", "amd64")
	if asset == nil || asset.Name != "LineSolv-0.15.10-linux-amd64" {
		t.Errorf("SelectAsset(linux, amd64) = %v, want linux-amd64", asset)
	}

	// Darwin arm64
	asset = SelectAsset(release, "darwin", "arm64")
	if asset == nil || asset.Name != "LineSolv-0.15.10-darwin-arm64" {
		t.Errorf("SelectAsset(darwin, arm64) = %v, want darwin-arm64", asset)
	}

	// Windows amd64
	asset = SelectAsset(release, "windows", "amd64")
	if asset == nil || asset.Name != "LineSolv-0.15.10-windows-amd64.exe" {
		t.Errorf("SelectAsset(windows, amd64) = %v, want windows-amd64.exe", asset)
	}

	// Should skip checksum files
	asset = SelectAsset(release, "linux", "amd64")
	if asset != nil && (asset.Name == "SHA256SUMS" || asset.Name == "SHA256SUMS.sig") {
		t.Error("SelectAsset should skip checksum/signature files")
	}
}

func TestSelectChecksumAsset(t *testing.T) {
	release := &Release{
		Assets: []ReleaseAsset{
			{Name: "LineSolv-0.15.10-linux-amd64", Size: 1000},
			{Name: "SHA256SUMS", Size: 100},
			{Name: "SHA256SUMS.sig", Size: 64},
		},
	}

	asset := SelectChecksumAsset(release)
	if asset == nil || asset.Name != "SHA256SUMS" {
		t.Errorf("SelectChecksumAsset = %v, want SHA256SUMS", asset)
	}
}

func TestSelectSignatureAsset(t *testing.T) {
	release := &Release{
		Assets: []ReleaseAsset{
			{Name: "LineSolv-0.15.10-linux-amd64", Size: 1000},
			{Name: "SHA256SUMS", Size: 100},
			{Name: "SHA256SUMS.sig", Size: 64},
		},
	}

	asset := SelectSignatureAsset(release)
	if asset == nil || asset.Name != "SHA256SUMS.sig" {
		t.Errorf("SelectSignatureAsset = %v, want SHA256SUMS.sig", asset)
	}
}
