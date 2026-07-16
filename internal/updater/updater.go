package updater

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"LineSolv/internal/updater/platform"
)

// Updater orchestrates the full update lifecycle: check → download → verify → install → restart.
type Updater struct {
	owner       string
	repo        string
	currentVer  string
	channel     UpdateChannel
	installPath string
	httpClient  *HTTPClient
	eventFn     EventHandler
	logger      *slog.Logger
	dataDir     string
}

// HTTPClient wraps http.Client with configurable timeout.
type HTTPClient struct {
	Timeout time.Duration
}

// Option configures the Updater.
type Option func(*Updater)

// WithOwner sets the GitHub repository owner.
func WithOwner(owner string) Option {
	return func(u *Updater) { u.owner = owner }
}

// WithRepo sets the GitHub repository name.
func WithRepo(repo string) Option {
	return func(u *Updater) { u.repo = repo }
}

// WithVersion sets the current application version.
func WithVersion(version string) Option {
	return func(u *Updater) { u.currentVer = version }
}

// WithChannel sets the update channel (stable, beta, nightly).
func WithChannel(channel UpdateChannel) Option {
	return func(u *Updater) { u.channel = channel }
}

// WithInstallPath sets the path to the current executable.
func WithInstallPath(path string) Option {
	return func(u *Updater) { u.installPath = path }
}

// WithEventHandler sets the function called for progress events.
func WithEventHandler(fn EventHandler) Option {
	return func(u *Updater) { u.eventFn = fn }
}

// WithLogger sets the structured logger.
func WithLogger(logger *slog.Logger) Option {
	return func(u *Updater) { u.logger = logger }
}

// WithDataDir sets the directory for temp files and caches.
func WithDataDir(dir string) Option {
	return func(u *Updater) { u.dataDir = dir }
}

// WithHTTPTimeout sets the HTTP client timeout.
func WithHTTPTimeout(d time.Duration) Option {
	return func(u *Updater) { u.httpClient = &HTTPClient{Timeout: d} }
}

// New creates a new Updater with the given options.
func New(opts ...Option) *Updater {
	u := &Updater{
		owner:   "rkriad585",
		repo:    "LineSolv",
		channel: ChannelStable,
		logger:  slog.Default(),
		httpClient: &HTTPClient{
			Timeout: 10 * time.Minute,
		},
	}

	for _, opt := range opts {
		opt(u)
	}

	if u.installPath == "" {
		if path, err := os.Executable(); err == nil {
			u.installPath = path
		}
	}

	if u.dataDir == "" {
		if dir, err := os.UserCacheDir(); err == nil {
			u.dataDir = filepath.Join(dir, "linesolv", "updater")
		} else {
			u.dataDir = filepath.Join(os.TempDir(), "linesolv-updater")
		}
	}

	_ = os.MkdirAll(u.dataDir, 0700) //nolint:errcheck

	return u
}

// UpdateInfo contains all information about an available update.
type UpdateInfo struct {
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	ReleaseNotes   string `json:"releaseNotes"`
	DownloadURL    string `json:"downloadURL"`
	ChecksumURL    string `json:"checksumURL"`
	SignatureURL   string `json:"signatureURL"`
	AssetName      string `json:"assetName"`
	AssetSize      int64  `json:"assetSize"`
	PublishedAt    string `json:"publishedAt"`
}

// CheckForUpdates checks GitHub for the latest release and returns update info.
func (u *Updater) CheckForUpdates(ctx context.Context) (*UpdateInfo, error) {
	u.emit(EventChecking, EventPayload{Status: "checking", Message: "Checking for updates..."})

	// Parse current version
	current, err := ParseVersion(u.currentVer)
	if err != nil {
		return nil, fmt.Errorf("parse current version: %w", err)
	}

	// Fetch latest release
	release, err := FetchLatestRelease(ctx, u.owner, u.repo)
	if err != nil {
		return nil, fmt.Errorf("fetch release: %w", err)
	}

	// Parse release version
	latest, err := ParseVersion(release.TagName)
	if err != nil {
		return nil, fmt.Errorf("parse release version: %w", err)
	}

	// Check channel compatibility
	if !IsCompatibleChannel(latest, u.channel) {
		return nil, ErrUpToDate
	}

	// Check if update is available
	if !latest.GT(current) {
		return nil, ErrUpToDate
	}

	// Find platform asset
	asset := SelectAssetForCurrentPlatform(release)
	if asset == nil {
		return nil, ErrNoAsset
	}

	// Find checksum and signature assets
	checksumAsset := SelectChecksumAsset(release)
	signatureAsset := SelectSignatureAsset(release)

	checksumURL := ""
	if checksumAsset != nil {
		checksumURL = checksumAsset.BrowserDownloadURL
	}
	signatureURL := ""
	if signatureAsset != nil {
		signatureURL = signatureAsset.BrowserDownloadURL
	}

	info := &UpdateInfo{
		CurrentVersion: current.String(),
		LatestVersion:  latest.String(),
		ReleaseNotes:   release.Body,
		DownloadURL:    asset.BrowserDownloadURL,
		ChecksumURL:    checksumURL,
		SignatureURL:   signatureURL,
		AssetName:      asset.Name,
		AssetSize:      asset.Size,
		PublishedAt:    release.PublishedAt.Format(time.RFC3339),
	}

	u.emit(EventAvailable, UpdateAvailablePayload{
		CurrentVersion: info.CurrentVersion,
		LatestVersion:  info.LatestVersion,
		ReleaseNotes:   info.ReleaseNotes,
		AssetName:      info.AssetName,
		AssetSize:      info.AssetSize,
		DownloadURL:    info.DownloadURL,
		ChecksumURL:    info.ChecksumURL,
		SignatureURL:   info.SignatureURL,
		PublishedAt:    info.PublishedAt,
	})

	return info, nil
}

// DownloadUpdate downloads the update binary to a temp file.
func (u *Updater) DownloadUpdate(ctx context.Context, info *UpdateInfo) (string, error) {
	dest := filepath.Join(u.dataDir, info.AssetName)

	progressFn := func(p Progress) {
		u.emit(EventDownloading, DownloadProgressPayload{
			BytesDownloaded: p.BytesDownloaded,
			BytesTotal:      p.BytesTotal,
			Percent:         p.Percent,
			Speed:           p.Speed,
			ETA:             p.ETA,
			Status:          p.Status,
		})
	}

	err := DownloadFile(ctx, info.DownloadURL, dest, DownloadOpts{
		MaxRetries: 3,
		RetryDelay: 2 * time.Second,
		Timeout:    u.httpClient.Timeout,
		OnProgress: progressFn,
	})
	if err != nil {
		return "", err
	}

	u.emit(EventDownloaded, EventPayload{
		Status:  "downloaded",
		Message: fmt.Sprintf("Downloaded %s", info.AssetName),
	})

	return dest, nil
}

// VerifyUpdate verifies the downloaded binary using SHA256 and optionally Ed25519 signature.
func (u *Updater) VerifyUpdate(ctx context.Context, binaryPath string, info *UpdateInfo) error {
	u.emit(EventVerifying, EventPayload{Status: "verifying", Message: "Verifying integrity..."})

	// Verify checksum if SHA256SUMS is available
	if info.ChecksumURL != "" {
		u.logger.Info("downloading checksums", "url", info.ChecksumURL)
		checksumData, err := DownloadBytes(ctx, info.ChecksumURL)
		if err != nil {
			return fmt.Errorf("download checksums: %w", err)
		}

		sums := ParseSHA256SUMS(checksumData)
		expectedHash, err := FindHashForAsset(sums, info.AssetName)
		if err != nil {
			return fmt.Errorf("find hash: %w", err)
		}

		if err := VerifySHA256(binaryPath, expectedHash); err != nil {
			return err
		}
		u.logger.Info("checksum verified", "file", info.AssetName)
	}

	// Verify signature if SHA256SUMS.sig is available
	if info.SignatureURL != "" {
		u.logger.Info("downloading signature", "url", info.SignatureURL)
		sigPath := filepath.Join(u.dataDir, "SHA256SUMS.sig")
		sigData, err := DownloadBytes(ctx, info.SignatureURL)
		if err != nil {
			return fmt.Errorf("download signature: %w", err)
		}
		if err := os.WriteFile(sigPath, sigData, 0600); err != nil { //nolint:gosec
			return fmt.Errorf("write signature: %w", err)
		}

		// Download SHA256SUMS to file for verification
		checksumPath := filepath.Join(u.dataDir, "SHA256SUMS")
		checksumData, err := DownloadBytes(ctx, info.ChecksumURL)
		if err != nil {
			return fmt.Errorf("download checksums for signature: %w", err)
		}
		if err := os.WriteFile(checksumPath, checksumData, 0600); err != nil { //nolint:gosec
			return fmt.Errorf("write checksums: %w", err)
		}

		if err := VerifyEd25519(sigPath, checksumPath); err != nil {
			return err
		}
		u.logger.Info("signature verified")
	}

	return nil
}

// InstallUpdate replaces the current binary and restarts the application.
func (u *Updater) InstallUpdate(ctx context.Context, binaryPath string) error {
	u.emit(EventInstalling, EventPayload{Status: "installing", Message: "Installing update..."})

	if err := platform.ReplaceBinary(u.installPath, binaryPath); err != nil {
		return fmt.Errorf("%w: %v", ErrInstallFail, err)
	}

	u.emit(EventRestarting, EventPayload{Status: "restarting", Message: "Restarting application..."})

	if err := platform.StartProcess(u.installPath); err != nil {
		return fmt.Errorf("start new process: %w", err)
	}

	return nil
}

// PerformFullUpdate runs the complete update cycle: check → download → verify → install → restart.
func (u *Updater) PerformFullUpdate(ctx context.Context) error {
	info, err := u.CheckForUpdates(ctx)
	if err != nil {
		return err
	}

	binaryPath, err := u.DownloadUpdate(ctx, info)
	if err != nil {
		return err
	}

	if err := u.VerifyUpdate(ctx, binaryPath, info); err != nil {
		return err
	}

	return u.InstallUpdate(ctx, binaryPath)
}

// emit sends an event through the configured handler.
func (u *Updater) emit(eventName string, payload interface{}) {
	emitEvent(context.Background(), u.eventFn, eventName, payload)
}
