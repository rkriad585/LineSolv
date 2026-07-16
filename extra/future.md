# Future Features — Wails 3 Self-Updater

> **Target:** Wails 3 stable release (estimated 2027)
> **Status:** Planned — blocked on Wails 3

---

## Self-Updater — Re-implementation Plan

### Why It Was Removed

The in-app self-update feature was removed in v0.15.25 (July 2026) because Wails v2's
runtime shutdown lifecycle makes reliable binary replacement difficult:

- The old process's goroutines (including `wailsruntime.Quit` handlers) can kill the new
  binary before it fully starts
- `os.Exit(0)` bypasses shutdown hooks, causing data loss
- The restart mechanism fails silently on some platforms

### Why Wails 3 Fixes This

Wails 3 introduces a proper app lifecycle API with:

- **Explicit shutdown phases** — the app can finish cleanup before the process exits
- **`app.Quit()` that waits** — no more race conditions between old and new processes
- **Graceful restart support** — first-class `app.Restart()` method
- **Plugin lifecycle hooks** — pre/post shutdown callbacks for safe cleanup

This makes in-app binary replacement trivially safe without workarounds.

### Architecture (from v0.15.20 design, to be reused)

```
internal/
    updater/
        updater.go        # Main orchestrator — Check → Download → Verify → Install → Restart
        github.go         # GitHub Release API client, version comparison
        downloader.go     # HTTP download with progress, resume, retry, cancellation
        version.go        # Semver parsing, comparison, channel filtering
        checksum.go       # SHA256 verification
        signature.go      # Ed25519 signature verification (embedded public key)
        events.go         # Wails event emission helpers
        platform/
            windows.go    # Windows rename-to-old + retry cleanup
            linux.go      # Linux atomic rename + permission preserve
            darwin.go     # macOS .app bundle replacement + codesign
```

### Key Features to Re-implement

1. **GitHub Release API** — fetch latest release, select platform asset
2. **SHA256 checksum verification** — verify downloaded binary against SHA256SUMS
3. **Ed25519 signature verification** — verify SHA256SUMS is signed by trusted key
4. **Real-time download progress** — percentage, speed, ETA via Wails events
5. **HTTP resume** — interrupted downloads resume via Range headers
6. **Retry with backoff** — failed downloads retry up to 3 times
7. **Cancellation** — in-progress downloads can be cancelled
8. **Platform-specific install** — atomic replacement on all platforms
9. **Update channels** — stable, beta, nightly filtering via semver pre-release tags
10. **Release notes display** — show changelog before downloading

### Integration Points

#### Backend (`app/service/app.go`)

```go
func (s *AppService) CheckForUpdate() (*UpdateInfo, error) {
    u := updater.New(
        updater.WithVersion(appVersion),
        updater.WithChannel(updater.ChannelStable),
    )
    info, err := u.CheckForUpdates(ctx)
    // ... map to service.UpdateInfo
}

func (s *AppService) PerformUpdate() (*UpdateInfo, error) {
    u := updater.New(
        updater.WithVersion(appVersion),
        updater.WithChannel(updater.ChannelStable),
        updater.WithEventHandler(func(name string, data ...interface{}) {
            wailsruntime.EventsEmit(ctx, name, data...)
        }),
    )
    // check → download → verify → install → restart
    // Use wailsruntime.AppRestart() instead of os.Exit(0)
}
```

#### Frontend (`SettingsModal.ts`)

- "Check for Updates" button → `CheckForUpdate()` → show result
- "Download & Install" button → `PerformUpdate()` → progress bar
- Event listeners for real-time progress
- Cancel button → context cancellation
- Release notes display before download

#### Release Workflow (`.github/workflows/release.yml`)

- Generate `SHA256SUMS` in finalize job (already implemented)
- Sign `SHA256SUMS` with Ed25519 private key (already implemented)
- Upload `SHA256SUMS` and `SHA256SUMS.sig` as release assets (already implemented)

### Implementation Phases

#### Phase 1: Core Modules

- [ ] Re-create `internal/updater/` directory structure
- [ ] Port `version.go` — semver parser with GT/EQ/channel support
- [ ] Port `github.go` — GitHub Release API client
- [ ] Unit tests for version and github modules

#### Phase 2: Download & Checksum

- [ ] Port `downloader.go` — HTTP download with progress, retry, resume
- [ ] Port `checksum.go` — SHA256 verification + SHA256SUMS parsing
- [ ] Unit tests for download and checksum modules

#### Phase 3: Signature Verification

- [ ] Port `signature.go` — Ed25519 verification with embedded public key
- [ ] Re-generate Ed25519 key pair if needed
- [ ] Unit tests for signature verification

#### Phase 4: Main Orchestrator

- [ ] Port `updater.go` — Main Updater struct with options pattern
- [ ] Port event emission for Wails frontend
- [ ] Use `wailsruntime.AppRestart()` instead of `os.Exit(0)`

#### Phase 5: Platform Install

- [ ] Port `platform/windows.go` — Windows binary replacement
- [ ] Port `platform/linux.go` — Linux atomic rename + exec
- [ ] Port `platform/darwin.go` — macOS binary replacement

#### Phase 6: Integration

- [ ] Add `CheckForUpdate`/`PerformUpdate`/`CancelUpdate` to `app/service/app.go`
- [ ] Add update UI to frontend `SettingsModal.ts`
- [ ] Unit tests for full lifecycle

### Testing Strategy

| Module               | Tests                                           | Coverage                         |
| -------------------- | ----------------------------------------------- | -------------------------------- |
| `version_test.go`    | ParseVersion, GT, EQ, IsCompatibleChannel       | All version formats              |
| `checksum_test.go`   | VerifySHA256, ParseSHA256SUMS, FindHashForAsset | Valid + invalid inputs           |
| `signature_test.go`  | VerifyEd25519, VerifyEd25519Bytes               | Known-good + tampered signatures |
| `downloader_test.go` | DownloadFile with mock HTTP server              | Progress, retry, resume, cancel  |
| `github_test.go`     | SelectAsset, SelectChecksumAsset                | Various release configurations   |
| `updater_test.go`    | Full lifecycle with mocked dependencies         | End-to-end flow                  |

### Dependencies

- No external dependencies — uses only Go standard library
- `crypto/ed25519` for signature verification
- `crypto/sha256` for checksum verification
- `net/http` for GitHub API and downloads
- `github.com/coreos/go-semver/semver` (already in go.mod)

### Security Considerations

- Public key embedded via `//go:embed` — cannot be tampered with at runtime
- Private key stored in GitHub Actions secret only
- SHA256 checksums prevent accidental corruption
- Ed25519 signatures prevent supply chain attacks
- HTTP Range headers prevent replay attacks (partial downloads)

### Rollback Plan

If the Wails 3 self-update implementation introduces issues:

1. Remove `CheckForUpdate`/`PerformUpdate`/`CancelUpdate` from `app/service/app.go`
2. Remove update UI from frontend
3. Remove `internal/updater/` package
4. Document removal in CHANGELOG.md
5. Users can still download updates manually from GitHub Releases

---

_Last updated: July 2026_
