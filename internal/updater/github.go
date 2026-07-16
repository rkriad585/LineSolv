// Package updater provides a production-grade self-updating system for Wails v2 desktop applications.
//
// It supports GitHub Releases as the update source, SHA256 checksum verification,
// Ed25519 signature verification, real-time download progress via Wails events,
// and platform-specific binary replacement with rollback support.
package updater

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"strings"
	"time"
)

// Release represents a GitHub release.
type Release struct {
	TagName     string         `json:"tag_name"`
	Name        string         `json:"name"`
	Draft       bool           `json:"draft"`
	Prerelease  bool           `json:"prerelease"`
	Body        string         `json:"body"`
	PublishedAt time.Time      `json:"published_at"`
	Assets      []ReleaseAsset `json:"assets"`
}

// ReleaseAsset represents a file attached to a GitHub release.
type ReleaseAsset struct {
	Name               string `json:"name"`
	Size               int64  `json:"size"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

// FetchLatestRelease fetches the latest non-draft, non-prerelease release from GitHub.
func FetchLatestRelease(ctx context.Context, owner, repo string) (*Release, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", owner, repo)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "LineSolv-Updater")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch release: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrNoRelease
	}
	if resp.StatusCode == http.StatusForbidden {
		return nil, ErrRateLimited
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github API returned status %d", resp.StatusCode)
	}

	var release Release
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, fmt.Errorf("decode release: %w", err)
	}

	return &release, nil
}

// SelectAsset finds the asset matching the given OS and architecture.
// It looks for assets whose name contains both the GOOS and GOARCH values.
func SelectAsset(release *Release, goos, goarch string) *ReleaseAsset {
	goos = strings.ToLower(goos)
	goarch = strings.ToLower(goarch)

	for i := range release.Assets {
		name := strings.ToLower(release.Assets[i].Name)
		if strings.Contains(name, goos) && strings.Contains(name, goarch) {
			// Skip checksum and signature files
			if strings.HasSuffix(name, ".sig") || strings.Contains(name, "sha256") {
				continue
			}
			return &release.Assets[i]
		}
	}
	return nil
}

// SelectAssetForCurrentPlatform selects the asset for the current platform.
func SelectAssetForCurrentPlatform(release *Release) *ReleaseAsset {
	return SelectAsset(release, runtime.GOOS, runtime.GOARCH)
}

// SelectChecksumAsset finds the SHA256SUMS file in the release assets.
func SelectChecksumAsset(release *Release) *ReleaseAsset {
	for i := range release.Assets {
		name := strings.ToLower(release.Assets[i].Name)
		if name == "sha256sums" || strings.HasSuffix(name, "sha256sums") {
			return &release.Assets[i]
		}
	}
	return nil
}

// SelectSignatureAsset finds the SHA256SUMS.sig file in the release assets.
func SelectSignatureAsset(release *Release) *ReleaseAsset {
	for i := range release.Assets {
		name := strings.ToLower(release.Assets[i].Name)
		if strings.HasSuffix(name, ".sig") {
			return &release.Assets[i]
		}
	}
	return nil
}

// Sentinel errors for the updater package.
var (
	ErrNoRelease     = fmt.Errorf("no releases found")
	ErrRateLimited   = fmt.Errorf("github API rate limited")
	ErrNoAsset       = fmt.Errorf("no matching asset for current platform")
	ErrChecksumMatch = fmt.Errorf("checksum mismatch")
	ErrSignatureFail = fmt.Errorf("signature verification failed")
	ErrUpToDate      = fmt.Errorf("already up to date")
	ErrDownloadFail  = fmt.Errorf("download failed")
	ErrInstallFail   = fmt.Errorf("installation failed")
)
