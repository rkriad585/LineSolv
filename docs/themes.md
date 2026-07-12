# Themes

## Built-in Themes

LineSolv ships with 7 themes. All themes define the same 14 CSS custom properties, so plugins can contribute additional themes that integrate seamlessly.

### Dark (default)

The default theme. A deep, zinc-based dark palette with muted grays and a soft violet accent. Designed for extended use in low-light environments.

### Light

A clean, bright theme with white surfaces and subtle gray borders. Uses a deep violet accent. Ideal for well-lit workspaces or users who prefer a traditional light interface.

### Neon

A dark theme with deep navy surfaces and a vibrant green (`#00ff41`) accent. Inspired by terminal aesthetics. High contrast green-on-black for a hacker-vibe look.

### Red

A dark theme with warm, dark red surfaces and a bold red (`#e53935`) accent. Subtle crimson tones throughout. Aggressive and high-energy.

### Obsidian

A near-black theme with amber/gold accents (`#d4a043`). Warm, muted text tones (`#d4c5a9`) on very dark backgrounds. Luxurious and understated.

### Plasma

A dark theme with deep indigo-purple surfaces and a vibrant purple (`#bb86fc`) accent. Cool-toned with an ethereal feel. Inspired by Material Design's deep purple palette.

### Blood

A deep crimson theme with blood-red accents (`#b71c1c`). Near-black surfaces with warm red undertones. Dramatic and intense.

## Changing Themes

1. Open Settings with `Ctrl+,` (or `Cmd+,` on macOS)
2. Click the **Theme** tab
3. Select a theme from the dropdown
4. The change takes effect immediately — no restart required

The active theme is saved to `config.toml` under `[app] theme` and persists across sessions.

## CSS Custom Properties

Every theme defines these 14 CSS custom properties on `:root`:

| Variable | Description | Default (Dark) |
|----------|-------------|-----------------|
| `--surface` | Main background color | `#18181b` |
| `--surface-secondary` | Secondary background (panels, code blocks) | `#27272a` |
| `--surface-hover` | Hover state background for interactive elements | `#3f3f46` |
| `--border` | Border color for dividers, inputs, and panels | `#27272a` |
| `--text` | Primary text color | `#f4f4f5` |
| `--text-muted` | Secondary text (timestamps, labels) | `#52525b` |
| `--text-subtle` | Tertiary text (placeholder, very dim) | `#3f3f46` |
| `--accent` | Primary accent (links, highlights, focus rings) | `#a78bfa` |
| `--error` | Error states and destructive actions | `#ef4444` |
| `--btn-hover` | Button hover background | `#f4f4f5` |
| `--note-bg` | Note item background in sidebar | `#27272a` |
| `--note-hover` | Note item hover background | `#27272a` |
| `--note-text` | Note item text color | `#d4d4d8` |
| `--calc-font-color` | Calculator input and result text color | `#ffffff` |

Additional non-theme variables (set separately in `style.css`):

| Variable | Description | Default |
|----------|-------------|---------|
| `--calc-font-size` | Calculator font size | `16px` |
| `--calc-font-family` | Calculator font stack | `monospace` |

## Creating Custom Themes

Themes are contributed by plugins. Create a plugin with a `themes` array in its `plugin.json`:

```json
{
  "name": "my-themes",
  "version": "1.0.0",
  "description": "Custom color themes for LineSolv",
  "author": "you",
  "themes": [
    {
      "id": "ocean",
      "label": "Ocean",
      "colors": {
        "surface": "#0b1628",
        "surface-secondary": "#122240",
        "surface-hover": "#1a3358",
        "border": "#1e3a5f",
        "text": "#e0e8f0",
        "text-muted": "#5a7a9a",
        "text-subtle": "#2a3f5a",
        "accent": "#4fc3f7",
        "error": "#ef5350",
        "btn-hover": "#4fc3f7",
        "note-bg": "#122240",
        "note-hover": "#1a3358",
        "note-text": "#b0c4de",
        "calc-font-color": "#ffffff"
      }
    }
  ]
}
```

The `id` field becomes the CSS class name: `:root.theme-ocean { ... }`. Users select it from the Theme tab in Settings the same way they select built-in themes.

## Theme Persistence

The active theme is stored in `config.toml`:

```toml
[app]
theme = "dark"
```

When LineSolv starts, it reads this value and applies the corresponding CSS class (`.theme-dark`, `.theme-light`, etc.) to the `<html>` element. If the theme is not found (e.g., the plugin that provided it was uninstalled), the dark theme is used as a fallback.

## Plugin Themes

Plugins can contribute themes without any code. A plugin's `themes` array is scanned at load time and the themes are registered in the theme selector. Each theme must provide all 14 color variables.

When a plugin is disabled, its themes are removed from the selector. If the active theme belongs to a disabled plugin, LineSolv falls back to the dark theme.

To test a plugin theme during development:

1. Install the plugin to the plugins directory
2. Enable it in the Plugin Marketplace
3. Select the new theme in Settings > Theme

See [Plugins](plugins.md) for full details on the plugin manifest format and installation.
