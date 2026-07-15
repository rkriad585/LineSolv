# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in LineSolv, please report it by emailing the maintainer at **rkriad585@gmail.com**.

Please do **not** open a public GitHub issue for security-related concerns.

### What to include

- A brief description of the vulnerability
- Steps to reproduce (if applicable)
- Any relevant logs, screenshots, or proof of concept

### Response timeline

You will receive an acknowledgement within 48 hours. Once the issue is triaged, we will provide an estimated timeline for a fix and disclosure.

---

## Security Architecture

LineSolv is a desktop-only application with no exposed network server. All data is stored locally on the user's device.

### Data Protection

| Control | Implementation |
|---------|---------------|
| **File permissions** | Config and state files use `0600` (owner read/write only). Directories use `0700`. |
| **Atomic writes** | Config uses write-to-temp-then-rename to prevent corruption on power loss. |
| **Database** | SQLite with WAL journal mode. Single-connection serialization via mutex. |
| **Data location** | `~/.config/neostore/linesolv/` on Linux/macOS, `%APPDATA%/neostore/linesolv` on Windows. |
| **Fallback** | If `os.UserConfigDir()` fails, data falls back to `os.TempDir()` (less secure — documented limitation). |

### Input Validation and Resource Limits

| Control | Limit |
|---------|-------|
| Max expression length | 10,000 characters |
| Evaluation timeout | 5 seconds per evaluation |
| HTTP response body limit | 1MB (currency rate API) |
| HTTP client timeout | 10 seconds |

### SQL Injection Prevention

All database queries use parameterized queries exclusively. No string interpolation is used in any SQL statement.

### XSS Prevention

- `escapeHtml()` utility escapes `& < > " '` characters
- Used in 6+ components before any `innerHTML` assignment
- Frontend uses no `eval()`, `new Function()`, or `document.write()`
- **Known invariant**: `ConfirmDialog.show()` parameters must remain caller-controlled constants, not user-supplied data

### Path Traversal Prevention

- Plugin install/remove validates paths against the plugins directory prefix
- Export filenames are sanitized (replacing `/`, `\`, `:`, collapsing `..`)

### Plugin Security Model

- Plugins are local JSON manifests declaring math expressions and builtins only
- No file system or network access from plugin functions
- Manifests are validated for required fields and uniqueness
- Plugins can be enabled/disabled by the user
- **Known limitation**: No cryptographic signing or checksum verification of plugin manifests

### Self-Update Security

- Updates fetched from `github.com/rkriad585/LineSolv` via `go-github-selfupdate`
- Semantic version comparison prevents downgrades
- Updated binary written to temp file then atomically replaces the executable
- On Linux, elevated privileges may be requested via `pkexec`

### Thread Safety

All shared mutable state is protected by `sync.Mutex` or `sync.RWMutex`:
- Config cache, AppService, Plugin manager, Engine, App version, Global context

## Known Limitations

- SQLite database is not encrypted at rest
- No Content-Security-Policy (desktop app, lower risk than web)
- Plugin manifests are not cryptographically signed
- Data falls back to `os.TempDir()` if `UserConfigDir()` is unavailable
