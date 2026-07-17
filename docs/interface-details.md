# Interface Details

Detailed descriptions of LineSolv's interface components, settings, and data storage.

---

## Title Bar

The title bar is the top strip of the window. It contains:

### Window Controls (Left)

Three buttons on the far left:

| Button              | Action                                    |
| ------------------- | ----------------------------------------- |
| Minimize (`-`)      | Minimize the window to the taskbar        |
| Maximize (`square`) | Toggle between maximized and windowed     |
| Close (`X`)         | Quit the application (turns red on hover) |

### Drag Region (Center)

The center area with the LineSolv logo is the drag region. Click and hold to move the window anywhere on screen.

**Double-click** the title bar (not on a button) to toggle fullscreen/maximize.

### Panel Buttons (Right)

A row of icon buttons on the right side of the title bar:

| Button       | Icon             | Action                                            | Shortcut       |
| ------------ | ---------------- | ------------------------------------------------- | -------------- |
| Notes        | Clipboard        | Toggle notes sidebar                              | `Ctrl/Cmd + B` |
| Variables    | Crosshair arrows | Toggle variable explorer                          | `Ctrl/Cmd + I` |
| History      | Clock            | Toggle history panel                              | `Ctrl/Cmd + H` |
| Steps        | Pulse line       | Toggle step-by-step panel                         | `Ctrl/Cmd + S` |
| More (`...`) | Ellipsis         | Dropdown: Documentation, Print, Plugins, Settings | --             |

The `...` dropdown menu consolidates less frequently used actions:

| Menu Item     | Action                    | Shortcut       |
| ------------- | ------------------------- | -------------- |
| Documentation | Open documentation viewer | `Ctrl/Cmd + J` |
| Print         | Print current note        | `Ctrl/Cmd + P` |
| Plugins       | Open plugin marketplace   | --             |
| Settings      | Open settings             | `Ctrl/Cmd + `` |

---

## Documentation Viewer

The built-in documentation viewer opens as a full-screen overlay with a sidebar and content area.

### Opening

- Press `Ctrl/Cmd + J` or select **Documentation** from the `...` dropdown menu in the title bar.
- The viewer opens with the User Guide selected by default.

### Layout

````
+--[ Documentation ]----------------------------------[ X ]--+
|  +-- Sidebar Tabs --+  +-- Rendered Content ----------+   |
|  | User Guide       |  |                               |   |
|  | FAQ              |  |  # Heading                    |   |
|  | Architecture     |  |  Body text with **bold** and  |   |
|  | Frontend         |  |  *italic* formatting.         |   |
|  | Plugin Dev       |  |                               |   |
|  | API Reference    |  |  ``` code blocks ```           |   |
|  | ...              |  |                               |   |
|  +------------------+  +-------------------------------+   |
+------------------------------------------------------------+
````

### Sidebar Tabs

Each tab represents a `.md` file from the `docs/` folder. Tab names are auto-generated from filenames:

- `user-guide.md` becomes **User Guide**
- `api-reference.md` becomes **Api Reference**
- `faq.md` becomes **Faq**

### Rendered Markdown

The viewer includes a custom Markdown renderer supporting:

- **Headings** (`# H1` through `###### H6`)
- **Bold** (`**text**`) and _italic_ (`*text*`)
- `Inline code` (backtick-wrapped)
- **Code blocks** (triple-backtick fenced, with Copy button)
- **Tables** (pipe-delimited rows)
- **Lists** (unordered with `-`, ordered with `1.`)
- **Blockquotes** (`> text`)
- **Horizontal rules** (`---`)
- **Links** (`[text](url)`) — open in external browser
- **Images** (`![alt](url)`)

### Offline and Caching

- All documentation is loaded from the local `docs/` folder bundled with the app.
- Once a document is loaded, it is cached in memory for the session.
- No internet connection is needed to browse docs.
- Closing and reopening the viewer re-fetches from disk (fresh content if files changed).

### Closing

- Press **Escape** or click the **X** button in the header.
- Double-click the header to toggle window maximize.

---

## Plugin Marketplace

The Plugin Marketplace lets you browse, install, enable, disable, and remove plugins — all from within the app.

### Opening

- Select **Plugins** from the `...` dropdown menu in the title bar.
- The marketplace opens as a full-screen overlay.

### Browsing Plugins

The marketplace fetches a plugin index from the remote repository (`linesolv-plugins` on GitHub) and displays them as a searchable card grid.

```
+--[ Plugins ]--------[ Search... ]--[ Refresh ]--[ X ]--+
|                                                         |
|  +-- Plugin Card 1 ---+  +-- Plugin Card 2 ---------+ |
|  | Finance Plugin     |  | Statistics Plugin        | |
|  | v1.0 by author    |  | v1.2 by author           | |
|  | description...     |  | description...           | |
|  | [ Install ]        |  | [ Installed ] [ Remove ] | |
|  +--------------------+  +--------------------------+ |
|                                                         |
|  +-- Plugin Card 3 ---------+  +-- Plugin Card 4 ---+ |
|  | Geometry Plugin          |  | Physics Plugin     | |
|  | v1.1 by author          |  | v1.0 by author     | |
|  | 4 functions  2 variables |  | 6 functions        | |
|  | [=== Toggle ===]        |  | [=== Toggle ===]   | |
|  +-------------------------+  +--------------------+ |
+--------------------------------------------------------+
```

### Search

Type in the search bar to filter plugins by name, description, author, or tags. Results update in real-time as you type.

### Plugin Actions

| Action             | Button                       | Description                                                                        |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------------------- |
| **Install**        | Blue "Install" button        | Downloads and installs the plugin from the repository                              |
| **Update**         | Blue "Update" button         | Replaces the installed version with the latest (shown when remote version > local) |
| **Remove**         | Red-outlined "Remove" button | Deletes the plugin from your system (with confirmation dialog)                     |
| **Enable/Disable** | Toggle switch                | Turns plugin on/off without removing it (persisted to `state.json`)                |

### Plugin Details

Click any plugin card to open its detail view, which shows:

- **Hero section**: Name, version, author, description, homepage link, tags
- **Functions table**: Each function's name, description, argument count, and type (expression or builtin)
- **Examples**: Copyable example expressions for each function
- **Variables table**: Custom constants provided by the plugin
- **Themes**: Theme cards with color swatches
- **README**: Rendered Markdown documentation (with code blocks that have a Copy button)

Press **Escape** or the **Back** arrow to return to the grid view.

---

## Settings

Open Settings with `Ctrl/Cmd + `` or the gear icon in the `...` dropdown menu in the title bar. Settings has six tabs:

### General Tab

| Setting                 | Description                                                                                                                                                                                                                                    | Range                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Font Family**         | Select from 17 options: System Default, Inter, Overpass, Ubuntu, Georgia, Times New Roman, Playfair Display, System Mono, JetBrains Mono, Fira Code, Source Code Pro, IBM Plex Mono, Cascadia Code, Hack, Victor Mono, Space Mono, Courier New | 17 options              |
| **Font Size**           | Adjust between 10px and 32px with +/- buttons or direct input                                                                                                                                                                                  | 10--32                  |
| **Opacity**             | Window opacity slider                                                                                                                                                                                                                          | 30%--100% (default 95%) |
| **Line Numbers**        | Toggle line numbers in the input area                                                                                                                                                                                                          | on/off                  |
| **Confirm Dialog**      | Toggle confirmation dialogs for destructive actions                                                                                                                                                                                            | on/off                  |
| **Autocomplete**        | Toggle autocomplete suggestions                                                                                                                                                                                                                | on/off                  |
| **Animations**          | Toggle UI animations (transitions, toast slide-ins)                                                                                                                                                                                            | on/off                  |
| **Toast Notifications** | Toggle toast notifications for actions and errors                                                                                                                                                                                              | on/off                  |
| **Result Panel**        | Show or hide the results column                                                                                                                                                                                                                | on/off (default: on)    |
| **Line Wrap**           | Toggle word wrapping in the editor                                                                                                                                                                                                             | on/off (default: on)    |
| **Preview**             | Live preview showing "AaBbCc 123 -- The quick brown fox jumps over the lazy dog."                                                                                                                                                              | --                      |

### Theme Tab

Select from 27 built-in themes plus any plugin-provided themes:

| Theme                       | Background | Accent               | Text      |
| --------------------------- | ---------- | -------------------- | --------- |
| **Dark**                    | `#18181b`  | `#a78bfa` (violet)   | `#f4f4f5` |
| **Light**                   | `#fafafa`  | `#7c3aed` (purple)   | `#18181b` |
| **Neon**                    | `#0a0a0a`  | `#00ff41` (green)    | `#e0e0e0` |
| **Red**                     | `#1a0a0a`  | `#e53935` (red)      | `#f0e0e0` |
| **Obsidian**                | `#0d0d0d`  | `#d4a043` (gold)     | `#d4c5a9` |
| **Plasma**                  | `#0d0d1a`  | `#bb86fc` (lavender) | `#e0dff0` |
| **Blood**                   | `#0a0505`  | `#b71c1c` (crimson)  | `#e8d0d0` |
| **Midnight**                | `#0f172a`  | `#38bdf8` (sky)      | `#e2e8f0` |
| **Aurora**                  | `#0d1117`  | `#22d3ee` (cyan)     | `#c9d1d9` |
| **Mono**                    | `#1a1a1a`  | `#a3a3a3` (gray)     | `#e5e5e5` |
| **Frost**                   | `#f0f4f8`  | `#0284c7` (sky blue) | `#1e293b` |
| **Prism**                   | `#111827`  | `#f59e0b` (amber)    | `#e5e7eb` |
| **Lavender**                | `#f5f0ff`  | `#8b5cf6` (violet)   | `#1e1b4b` |
| **Sage**                    | `#f0fdf4`  | `#16a34a` (green)    | `#14532d` |
| **Warm Light**              | `#fefce8`  | `#d97706` (amber)    | `#451a03` |
| **Blue Trust Dark**         | `#0f172a`  | `#3b82f6` (blue)     | `#e2e8f0` |
| **Blue Trust Light**        | `#eff6ff`  | `#2563eb` (blue)     | `#1e3a5f` |
| **Orange Energy Dark**      | `#1a0f00`  | `#f97316` (orange)   | `#fed7aa` |
| **Orange Energy Light**     | `#fff7ed`  | `#ea580c` (orange)   | `#431407` |
| **Green Growth Dark**       | `#052e16`  | `#22c55e` (green)    | `#bbf7d0` |
| **Green Growth Light**      | `#f0fdf4`  | `#16a34a` (green)    | `#14532d` |
| **Yellow Optimism Dark**    | `#1a1500`  | `#eab308` (yellow)   | `#fef9c3` |
| **Yellow Optimism Light**   | `#fefce8`  | `#ca8a04` (yellow)   | `#422006` |
| **Purple Innovation Dark**  | `#1a0533`  | `#a855f7` (purple)   | `#e9d5ff` |
| **Purple Innovation Light** | `#faf5ff`  | `#9333ea` (purple)   | `#3b0764` |
| **Red Passion Dark**        | `#1a0505`  | `#ef4444` (red)      | `#fecaca` |
| **Red Passion Light**       | `#fef2f2`  | `#dc2626` (red)      | `#450a0a` |

The default **Dark** theme is always available. The 14 original themes plus 12 psychology-themed variants cover a wide range of visual preferences.

Plugin themes appear below the built-in themes, labeled with a "Plugin" badge.

Each theme card shows a color swatch with "Aa" in the accent color and "123" in the text color. Click a card to select it; theme changes apply instantly (no Save button).

### UI Style Tab

Select from 5 built-in UI styles that control the overall visual language of the interface:

| Style            | Description                                                                           |
| ---------------- | ------------------------------------------------------------------------------------- |
| **Default**      | Clean, modern baseline with subtle borders and standard spacing                       |
| **Liquid Glass** | Frosted-glass translucency with layered blur effects and soft gradients               |
| **Material 3**   | Google's Material Design 3 — rounded containers, tonal surfaces, dynamic color        |
| **Alivated**     | Warm, neumorphic elevation-focused design with depth shadows and soft rounded corners |
| **Neon**         | Cyberpunk-inspired — glowing borders, saturated accent pops, dark depth               |

Click a style card to apply it. Style changes apply instantly alongside the current theme.

### Keyboard Shortcuts Tab

Lists all customizable shortcuts. Each row shows:

- **Description**: What the shortcut does
- **Key binding**: Current key combination (click to reassign)
- **Edit button**: Pencil icon to start recording a new binding

To customize:

1. Click the key binding or the pencil icon.
2. A "Press keys..." input appears.
3. Press your desired key combination.
4. The binding updates immediately and auto-saves.

Overrides are stored in `config.toml` as a JSON string in `settings.shortcut_overrides`.

### About Tab

Shows:

- LineSolv logo and name
- Current version number
- Author link (opens search in browser)
- Email: rkriad585@gmail.com
- Repository link (opens GitHub in browser)
- **Check for Updates** button: queries GitHub releases for a newer version and provides a platform-specific download link

---

## Design Tokens

### CVD-Safe Status Tokens

LineSolv uses colorblind-safe (CVD-safe) status tokens for error, success, warning, and info states. These ensure accessibility across all vision types.

| Token             | Usage          |
| ----------------- | -------------- |
| `--color-error`   | Error states   |
| `--color-success` | Success states |
| `--color-warning` | Warning states |
| `--color-info`    | Informational  |

### Tinted Gray Scale

A tinted gray scale provides neutral tones with subtle warm/cool undertones for UI surfaces and text.

| Token        | Description   |
| ------------ | ------------- |
| `--gray-50`  | Lightest gray |
| `--gray-100` |               |
| `--gray-200` |               |
| `--gray-300` |               |
| `--gray-400` |               |
| `--gray-500` | Mid gray      |
| `--gray-600` |               |
| `--gray-700` |               |
| `--gray-800` |               |
| `--gray-900` | Dark gray     |
| `--gray-950` | Darkest gray  |

Both token sets were introduced in v0.17.0 for improved accessibility and theming consistency.

---

## Data Storage

### File Paths

| Platform | Data Directory                                     |
| -------- | -------------------------------------------------- |
| Linux    | `~/.config/neostore/linesolv/`                     |
| macOS    | `~/Library/Application Support/neostore/linesolv/` |
| Windows  | `%APPDATA%/neostore/linesolv/`                     |

### Files

| File                 | Purpose                                                      |
| -------------------- | ------------------------------------------------------------ |
| `linesolv.db`        | SQLite database (WAL mode) storing notes, history, and state |
| `config.toml`        | TOML configuration file                                      |
| `plugins/`           | Installed plugins directory                                  |
| `plugins/state.json` | Plugin enable/disable state                                  |

### config.toml Sections

```toml
[app]
theme = "dark"
version = "0.17.0"

[notes]
last_active = "note-uuid-here"
sort_by = "updated"

[behavior]
delete_without_confirm = "false"

[settings]
font_size = "16"
font_family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
shortcut_overrides = "{}"
opacity = "95"
result_panel_enabled = "true"
line_wrap_enabled = "true"
ui_style = "default"
theme_manually_set = "false"
noise = "0"
context_menu_notes = "true"
context_menu_folders = "true"
drag_and_drop = "true"
confirm_dialog = "true"
autocomplete_enabled = "true"
animations_enabled = "true"
toast_enabled = "true"
```

| Section      | Key                      | Description                             |
| ------------ | ------------------------ | --------------------------------------- |
| `[app]`      | `theme`                  | Active theme ID                         |
| `[app]`      | `version`                | App version for migration               |
| `[notes]`    | `last_active`            | UUID of the last active note            |
| `[notes]`    | `sort_by`                | Note sort order                         |
| `[behavior]` | `delete_without_confirm` | `"true"` to skip delete confirmation    |
| `[settings]` | `font_size`              | Font size in pixels                     |
| `[settings]` | `font_family`            | CSS font-family string                  |
| `[settings]` | `shortcut_overrides`     | JSON string of shortcut overrides       |
| `[settings]` | `opacity`                | Window opacity (30--100%)               |
| `[settings]` | `result_panel_enabled`   | `"true"` to show the results column     |
| `[settings]` | `line_wrap_enabled`      | `"true"` to enable word wrapping        |
| `[settings]` | `ui_style`               | Active UI style ID                      |
| `[settings]` | `theme_manually_set`     | `"true"` if user explicitly chose theme |
| `[settings]` | `noise`                  | Background noise texture (0--100%)      |
| `[settings]` | `context_menu_notes`     | `"true"` to show note context menus     |
| `[settings]` | `context_menu_folders`   | `"true"` to show folder context menus   |
| `[settings]` | `drag_and_drop`          | `"true"` to enable drag-and-drop        |
| `[settings]` | `confirm_dialog`         | `"true"` to show confirmation dialogs   |
| `[settings]` | `autocomplete_enabled`   | `"true"` to enable autocomplete popup   |
| `[settings]` | `animations_enabled`     | `"true"` to enable UI animations        |
| `[settings]` | `toast_enabled`          | `"true"` to show toast notifications    |
