# Configuration

## Config File Location

LineSolv stores its configuration in a TOML file at:

| Platform | Path |
|----------|------|
| Linux | `~/.config/neostore/linesolv/config.toml` |
| macOS | `~/Library/Application Support/neostore/linesolv/config.toml` |
| Windows | `%APPDATA%/neostore/linesolv/config.toml` |

The config file is created automatically on first launch with default values.

## Config File Format

The configuration file uses TOML format. A typical `config.toml` looks like:

```toml
# LineSolv Configuration

[app]
theme = "dark"
version = "0.13.0"

[notes]
last_active = "abc123-def456"
sort_by = "updated"

[behavior]
delete_without_confirm = "false"

[settings]
font_size = "16"
font_family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
shortcut_overrides = "{}"
opacity = "0.95"
line_numbers_enabled = "true"
autocomplete_enabled = "true"
animations_enabled = "true"
toast_enabled = "true"
ui_style = "default"
theme_manually_set = "false"
```

## Sections

### `[app]`

Controls application-level preferences.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `theme` | string | `"dark"` | Active theme. Options: `dark`, `light`, `neon`, `red`, `obsidian`, `plasma`, `blood`, `midnight`, `aurora`, `mono`, `frost`, `prism`, `lavender`, `sage`, `warm-light`. Plugins may add more. |
| `version` | string | — | Last-run LineSolv version. Managed automatically. |

### `[notes]`

Controls notes panel behavior.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `last_active` | string | `""` | UUID of the last active note. Set automatically when switching notes. |
| `sort_by` | string | `"updated"` | Note sort order. Currently only `"updated"` is used (sorts by `position` then `updated_at`). |

### `[behavior]`

Controls interaction preferences.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `delete_without_confirm` | string | `"false"` | When `"true"`, the delete confirmation dialog is suppressed and notes are deleted immediately. |

### `[settings]`

Controls display and input preferences.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `font_size` | string | `"16"` | Calculator font size in pixels. Applied to the input area, gutter, and results column. |
| `font_family` | string | `"-apple-system, ..."` | CSS font-family stack for the calculator text. |
| `shortcut_overrides` | string | `"{}"` | JSON-encoded map of keyboard shortcut overrides. Example: `"{\"toggleNotes\":\"Ctrl+Shift+B\"}"`. |
| `opacity` | string | `"0.95"` | Window opacity (30%–100%). `"1.0"` is fully opaque. |
| `line_numbers_enabled` | string | `"true"` | Show line numbers in the input area. |
| `autocomplete_enabled` | string | `"true"` | Enable variable/function autocomplete suggestions. |
| `animations_enabled` | string | `"true"` | Enable UI animations (transitions, toast slide-ins). |
| `toast_enabled` | string | `"true"` | Show toast notifications for actions and errors. |
| `ui_style` | string | `"default"` | UI style. Options: `default`, `nothing`, `glass`, `material`, `alivated`, `neon`. |
| `theme_manually_set` | string | `"false"` | Whether the user manually selected a theme (vs. auto-selected by UI style). |

## Data Directory

All persistent data (database, config, plugin state) is stored in:

| Platform | Path |
|----------|------|
| Linux | `~/.config/neostore/linesolv/` |
| macOS | `~/Library/Application Support/neostore/linesolv/` |
| Windows | `%APPDATA%/neostore/linesolv/` |

Contents:

```
neostore/linesolv/
├── config.toml          # Configuration file
├── linesolv.db          # SQLite database (notes + currency cache)
└── plugins/             # Installed plugins (one subdirectory each)
    ├── finance/
    │   └── plugin.json
    └── statistics/
        └── plugin.json
```

## Database

LineSolv uses SQLite for persistence. The database file is `linesolv.db` in the data directory.

### `notes` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `name` | TEXT | Note display name |
| `content` | TEXT | Note content (one calculation per line) |
| `created_at` | INTEGER | Unix timestamp in milliseconds |
| `updated_at` | INTEGER | Unix timestamp in milliseconds |
| `position` | INTEGER | Sort order index (0-based) |

Index: `idx_notes_sort` on `(position, updated_at)`.

### `currency_cache` Table

| Column | Type | Description |
|--------|------|-------------|
| `rates` | TEXT | JSON-encoded `map[string]float64` of currency rates |
| `updated_at` | INTEGER | Unix timestamp in milliseconds of last fetch |

Currency rates are fetched from a live API and cached locally. The cache is updated when rates are older than a threshold.

## Plugin Directory

Installed plugins live under the `plugins/` subdirectory of the data directory. Each plugin is a subdirectory containing a `plugin.json` manifest.

| Platform | Path |
|----------|------|
| Linux | `~/.config/neostore/linesolv/plugins/` |
| macOS | `~/Library/Application Support/neostore/linesolv/plugins/` |
| Windows | `%APPDATA%/neostore/linesolv/plugins/` |

## Currency Cache

Currency exchange rates are cached in the `currency_cache` SQLite table. The cache stores a JSON map of rates (e.g., `{"USD": 1, "EUR": 0.92, "GBP": 0.79, ...}`) along with a timestamp of the last update.

The cache is checked before making an API request. If the cached rates are fresh enough, the cached data is used. On cache miss or expiry, fresh rates are fetched and saved.

## Resetting Configuration

To reset LineSolv to defaults:

1. Quit LineSolv
2. Delete (or rename) the config file:

```bash
rm ~/.config/neostore/linesolv/config.toml
```

3. Optionally, delete the entire data directory to also reset notes and cached data:

```bash
rm -rf ~/.config/neostore/linesolv
```

4. Launch LineSolv — it will recreate the config with defaults and create a fresh database

## Environment Variables

LineSolv does not currently use environment variables for configuration. All settings are managed through the `config.toml` file and the in-app Settings dialog.
