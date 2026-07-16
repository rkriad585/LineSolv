package updater

import (
	"crypto/ed25519"
	_ "embed"
	"encoding/pem"
	"fmt"
	"os"
)

// Embedded Ed25519 public key for release signature verification.
// The private key is kept in CI/CD only (GitHub Actions secret).
//
// To generate a new key pair:
//   ed25519-keygen -sk private.pem -pk public.pem
//
// To sign a file:
//   ed25519-sign -sk private.pem -in SHA256SUMS -out SHA256SUMS.sig
//
// To verify:
//   ed25519-verify -pk public.pem -in SHA256SUMS -sig SHA256SUMS.sig

//go:embed ed25519_public.pem
var embeddedPublicKeyPEM []byte

// VerifyEd25519 verifies that the signature file was created by the embedded private key
// over the contents of the data file.
func VerifyEd25519(signaturePath, dataPath string) error {
	pubKey, err := parseEd25519PublicKey(embeddedPublicKeyPEM)
	if err != nil {
		return fmt.Errorf("parse public key: %w", err)
	}

	signature, err := os.ReadFile(signaturePath)
	if err != nil {
		return fmt.Errorf("read signature: %w", err)
	}

	data, err := os.ReadFile(dataPath)
	if err != nil {
		return fmt.Errorf("read data: %w", err)
	}

	if !ed25519.Verify(pubKey, data, signature) {
		return fmt.Errorf("%w: signature does not match data", ErrSignatureFail)
	}

	return nil
}

// VerifyEd25519Bytes verifies a signature against data bytes using the embedded public key.
func VerifyEd25519Bytes(signature, data []byte) error {
	pubKey, err := parseEd25519PublicKey(embeddedPublicKeyPEM)
	if err != nil {
		return fmt.Errorf("parse public key: %w", err)
	}

	if !ed25519.Verify(pubKey, data, signature) {
		return fmt.Errorf("%w: signature does not match data", ErrSignatureFail)
	}

	return nil
}

// parseEd25519PublicKey parses a PEM-encoded Ed25519 public key.
func parseEd25519PublicKey(pemData []byte) (ed25519.PublicKey, error) {
	block, _ := pem.Decode(pemData)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block")
	}

	if len(block.Bytes) != ed25519.PublicKeySize {
		return nil, fmt.Errorf("invalid public key size: got %d, expected %d", len(block.Bytes), ed25519.PublicKeySize)
	}

	return ed25519.PublicKey(block.Bytes), nil
}

// GenerateKeyPair generates a new Ed25519 key pair.
// Used in testing and CI/CD setup.
func GenerateKeyPair() (ed25519.PublicKey, ed25519.PrivateKey) {
	pub, priv, _ := ed25519.GenerateKey(nil) //nolint:errcheck
	return pub, priv
}
