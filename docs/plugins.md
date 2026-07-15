# LineSolv Plugin Development Guide

A comprehensive guide to creating, installing, and managing LineSolv plugins.

---

## 1. Plugin Directory

Plugins are stored in a platform-specific directory:

| Platform | Plugin Directory |
|----------|-----------------|
| Linux | `~/.config/neostore/linesolv/plugins/` |
| macOS | `~/Library/Application Support/neostore/linesolv/plugins/` |
| Windows | `%APPDATA%/neostore/linesolv/plugins/` |

Each plugin lives in its own subdirectory within this plugins folder. The plugin manager scans all subdirectories for a valid `plugin.json` manifest on startup and on reload.

### State Persistence

Plugin enable/disable state is persisted in `plugins/state.json`:

```json
{
  "finance": true,
  "statistics": true,
  "geometry": false
}
```

---

## 2. Plugin Structure

Each plugin is a directory containing a `plugin.json` manifest and an optional `README.md`:

```
plugins/
  my-plugin/
    plugin.json       # Required: manifest with metadata, functions, themes, variables
    README.md         # Optional: rendered in the plugin detail view
```

The directory name is used as the internal identifier but the `name` field in `plugin.json` is the canonical display name. Directory names should be lowercase and hyphen-separated.

---

## 3. Plugin Marketplace

The Plugin Marketplace is accessible via the **"..." menu** in the title bar, or by pressing `Ctrl+U`. Note that opening Plugins closes the Docs panel and vice versa (panel cross-closing behavior).

### Browsing

The marketplace fetches a remote plugin index from the `linesolv-plugins` GitHub repository and displays plugins as a searchable card grid. Each card shows:

- Plugin name, version, author, and description
- Type badge (e.g., "function", "theme", "mixed")
- Tags for categorization
- Capability counts (functions, variables, themes) for installed plugins
- Install, Update, or Installed badge
- Enable/disable toggle for installed plugins
- Remove button for installed plugins

### Installing

1. Open the Plugin Marketplace.
2. Find the plugin you want (or search by name/tag).
3. Click the **Install** button on the card, or click the card to open the detail view and install from there.
4. The plugin is downloaded from the remote repository and installed to your local plugins directory.
5. Functions, themes, and variables become immediately available.

### Updating

When a remote plugin version is newer than your installed version:

1. An "Update Available" badge appears on the card.
2. Click **Update** to download and replace the installed version.
3. The update is applied in place -- no restart required.

### Removing

1. Click the **Remove** button (red outline) on an installed plugin card.
2. A confirmation dialog appears: "Are you sure you want to remove [name]?"
3. Click **Remove** to confirm or **Cancel** to abort.
4. The plugin directory is deleted from your system.

### Enabling/Disabling

Use the toggle switch on any installed plugin to enable or disable it:

- **Enabled**: Plugin functions, themes, and variables are active.
- **Disabled**: Plugin is loaded but its contributions are not registered.

Toggle state persists across restarts via `state.json`.

---

## 4. Manifest Format

The `plugin.json` file defines everything about a plugin. Here is the complete schema:

```json
{
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A description of what this plugin does",
  "author": "Your Name",
  "homepage": "https://github.com/yourname/plugin-name",
  "functions": [],
  "themes": [],
  "variables": []
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name of the plugin |
| `version` | string | Semantic version (e.g., `"1.0.0"`) |
| `description` | string | Short description of the plugin |
| `author` | string | Author name or handle |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `homepage` | string | URL to the plugin's homepage or repository |
| `functions` | array | Array of function definitions (see below) |
| `themes` | array | Array of theme definitions (see below) |
| `variables` | array | Array of variable definitions (see below) |

A plugin must declare at least one function, theme, or variable.

---

## 5. Custom Functions

Functions are defined in the `functions` array of `plugin.json`. Each function has two implementation modes: **expression** or **builtin**.

### Expression Functions

Expression functions use a math expression string with single-letter variables `a`, `b`, `c`, ... representing the arguments in order. The expression is evaluated by the plugin expression engine.

```json
{
  "name": "lerp",
  "description": "Linear interpolation between a and b by factor t",
  "args": 3,
  "min_args": 3,
  "max_args": 3,
  "expression": "a + (b - a) * t",
  "examples": ["lerp(0, 10, 0.5)", "lerp(2, 8, 0.25)"]
}
```

When `lerp(0, 10, 0.5)` is called, the engine substitutes `a=0`, `b=10`, `t=0.5` (note: the third variable is the third letter, so for `lerp` the expression should use `a`, `b`, `c` as the three args, not `t`).

#### Expression Engine Capabilities

The expression engine supports:

- **Operators**: `+`, `-`, `*`, `/`, `%` (modulo), `^` (power), unary `-`/`+`
- **Parentheses**: `(expr)`
- **Functions**: `abs`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `sqrt`, `cbrt`, `log`, `ln`, `log2`, `exp`, `pow`, `floor`, `ceil`, `round`, `sign`, `min`, `max`, `mod`
- **Constants**: `pi`, `e`, `tau` (2*pi), `phi` (golden ratio)
- **Variables**: `a`-`z` mapped to the function arguments

#### Examples of Expression Functions

**Pythagorean theorem:**

```json
{
  "name": "pythagorean",
  "description": "Hypotenuse of a right triangle",
  "args": 2,
  "min_args": 2,
  "max_args": 2,
  "expression": "sqrt(a^2 + b^2)",
  "examples": ["pythagorean(3, 4)", "pythagorean(5, 12)"]
}
```

**Clamp a value:**

```json
{
  "name": "clamp",
  "description": "Clamp value a between min b and max c",
  "args": 3,
  "min_args": 3,
  "max_args": 3,
  "expression": "min(max(a, b), c)",
  "examples": ["clamp(15, 0, 10)", "clamp(-5, 0, 100)"]
}
```

**Simple area calculation:**

```json
{
  "name": "rect_area",
  "description": "Area of a rectangle",
  "args": 2,
  "min_args": 2,
  "max_args": 2,
  "expression": "a * b",
  "examples": ["rect_area(5, 3)", "rect_area(10, 7)"]
}
```

### Builtin Functions

Instead of writing an expression, you can reference a pre-defined builtin operation by name. The argument count and validation are handled by the builtin implementation.

```json
{
  "name": "clamp",
  "description": "Clamp value between min and max",
  "args": 3,
  "min_args": 3,
  "max_args": 3,
  "builtin": "clamp",
  "examples": ["clamp(15, 0, 10)", "clamp(-5, 0, 100)"]
}
```

#### Complete Builtin Functions Table

| Builtin Name | Args | Description | Formula |
|-------------|------|-------------|---------|
| `clamp` | 3 | Clamp value between min and max | `max(min, min(max, value))` |
| `lerp` | 3 | Linear interpolation | `a + (b - a) * t` |
| `smoothstep` | 3 | Smooth Hermite interpolation | `t^2 * (3 - 2t)` where `t = clamp((x-e0)/(e1-e0))` |
| `wrap` | 3 | Wrap value within range [min, max) | `mod(value - min, max - min) + min` |
| `average` | 1+ | Arithmetic mean of all arguments | `sum(args) / count` |
| `median` | 1+ | Median value of arguments | Middle value of sorted list |
| `std_dev` | 2+ | Population standard deviation | `sqrt(variance(args))` |
| `variance` | 2+ | Population variance | `sum((x - mean)^2) / n` |
| `percentile` | 2+ | P-th percentile (first arg is p, 0-100) | Linear interpolation between sorted ranks |
| `sum` | 1+ | Sum of all arguments | `a + b + c + ...` |
| `product` | 1+ | Product of all arguments | `a * b * c * ...` |
| `gcd` | 2 | Greatest common divisor | Euclidean algorithm |
| `lcm` | 2 | Least common multiple | `(a / gcd(a,b)) * b` |
| `fact` | 1 | Factorial (max 170) | `n!` |
| `npr` | 2 | Permutations (nPr) | `n! / (n - r)!` |
| `ncr` | 2 | Combinations (nCr) | `n! / (r! * (n-r)!)` |
| `hypot` | 2 | Hypotenuse (Euclidean distance) | `sqrt(a^2 + b^2)` |
| `rad` | 1 | Degrees to radians | `degrees * pi / 180` |
| `deg` | 1 | Radians to degrees | `radians * 180 / pi` |

### Function Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Function name (case-insensitive when called) |
| `description` | string | Yes | Human-readable description |
| `args` | int | Yes | Expected argument count. Use `-1` for variadic. |
| `min_args` | int | Yes | Minimum number of arguments accepted |
| `max_args` | int | Yes | Maximum arguments. Use `-1` for unlimited. |
| `expression` | string | Conditional | Math expression using `a`-`z` as args. Required if `builtin` is omitted. |
| `builtin` | string | Conditional | Builtin function name. Required if `expression` is omitted. |
| `examples` | string[] | No | Array of example expressions shown in the marketplace detail view |

A function must declare either `expression` or `builtin`, not both.

### Usage Examples

Once installed, plugin functions are called like any built-in function:

| Input | Result |
|-------|--------|
| `lerp(0, 10, 0.5)` | `5` |
| `pythagorean(3, 4)` | `5` |
| `clamp(15, 0, 10)` | `10` |
| `clamp(-5, 0, 100)` | `0` |

Plugin functions work inside larger expressions:

| Input | Result |
|-------|--------|
| `lerp(0, 100, 0.25) + 10` | `35` |
| `pythagorean(5, 12) * 2` | `26` |
| `clamp(sum(1, 2, 3, 4, 5), 0, 10)` | `10` |

Plugin functions also appear in the **Steps** panel when step-by-step evaluation is active.

---

## 6. Custom Themes

Themes are defined in the `themes` array of `plugin.json`. Each theme provides CSS custom property values.

```json
{
  "themes": [
    {
      "id": "sunset",
      "label": "Sunset",
      "colors": {
        "--surface": "#1a1015",
        "--surface-secondary": "#24161e",
        "--surface-hover": "#2e1c26",
        "--border": "#3d2533",
        "--accent": "#ff6b6b",
        "--accent-hover": "#ff8585",
        "--text": "#f0e0e0",
        "--text-muted": "#b09090",
        "--text-subtle": "#806060",
        "--error": "#ff4444",
        "--success": "#44ff88",
        "--info": "#4488ff",
        "--shadow": "rgba(0,0,0,0.3)"
      }
    }
  ]
}
```

### Theme Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (used as the theme key) |
| `label` | string | Yes | Display name shown in Settings |
| `colors` | object | Yes | Map of CSS custom property names to color values |

### Complete Color Variables Table

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `--surface` | Main background color | `#18181b` |
| `--surface-secondary` | Sidebar/panel background | `#242428` |
| `--surface-hover` | Hover state for interactive elements | `#2e2e34` |
| `--border` | Border and divider color | `#3f3f46` |
| `--accent` | Primary accent (buttons, highlights, links) | `#a78bfa` |
| `--accent-hover` | Accent on hover | `#c4b5fd` |
| `--text` | Primary text color | `#f4f4f5` |
| `--text-muted` | Secondary/muted text | `#a1a1aa` |
| `--text-subtle` | Tertiary/subtle text | `#71717a` |
| `--error` | Error state color | `#ef4444` |
| `--success` | Success state color | `#22c55e` |
| `--info` | Informational color | `#3b82f6` |
| `--shadow` | Box shadow color | `rgba(0,0,0,0.3)` |

Plugin themes appear in **Settings > Theme** alongside the 15 built-in themes, labeled with a "Plugin" badge. The theme's `--surface`, `--accent`, and `--text` values are used for the preview swatch.

### Theme ID Rules

- Must be unique across all plugins and built-in themes.
- Built-in IDs: `dark`, `light`, `neon`, `red`, `obsidian`, `plasma`, `blood`.
- Use lowercase, hyphen-separated names for custom IDs.

---

## 7. Custom Variables

Variables are named constants provided by a plugin. They are available in all calculations when the plugin is enabled.

```json
{
  "variables": [
    {
      "name": "planck_ev",
      "description": "Planck constant in eV*s",
      "value": 4.135667696e-15
    },
    {
      "name": "boltzmann_ev",
      "description": "Boltzmann constant in eV/K",
      "value": 8.617333262e-5
    }
  ]
}
```

### Variable Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Variable name (case-insensitive when used) |
| `description` | string | Yes | Human-readable description |
| `value` | number | Yes | Numeric value (float64) |

### Usage Examples

Once installed, plugin variables can be used like any built-in constant:

| Input | Result |
|-------|--------|
| `planck_ev` | `4.1357e-15` |
| `planck_ev * 1000` | `4.1357e-12` |
| `boltzmann_ev * 300` | `0.025852` |

Plugin variables appear in the **Variables Explorer** panel alongside user-defined variables. They are read-only and persist for the session as long as the plugin is enabled.

---

## 8. Managing Plugins

### Keyboard Shortcuts

| Panel | Shortcut |
|-------|----------|
| Plugins | `Ctrl+U` |
| Docs | `Ctrl+J` |
| Settings | `Ctrl+` `` |

Opening any panel (Plugins, Docs) closes the other — only one side panel is open at a time.

### Via UI

The Plugin Marketplace provides a complete management interface:

| Action | How |
|--------|-----|
| **Browse** | Open marketplace, scroll or search |
| **Install** | Click "Install" on a plugin card |
| **Update** | Click "Update" when an update is available |
| **Remove** | Click "Remove" and confirm in the dialog |
| **Enable/Disable** | Toggle the switch on an installed plugin |
| **View Details** | Click a plugin card to see functions, themes, variables, and README |
| **Context Menu** | Right-click a plugin card to access "Switch Note" (with checkmark indicator for the active note) |
| **Refresh** | Click the refresh button in the marketplace header |

### Via Code

For developers building plugins programmatically or testing:

#### Plugin Manager API (Go)

```go
import "LineSolv/app/plugin"

// Create a manager
manager := plugin.NewManager(pluginsDir)

// Scan and load all plugins
manager.Scan()

// Get a specific plugin
p, ok := manager.Get("my-plugin")

// List all plugins
all := manager.All()  // []*Plugin, sorted by name

// List enabled plugins
enabled := manager.Enabled()

// Enable/disable a plugin
manager.SetEnabled("my-plugin", false)

// Reload all plugins
manager.Reload()
```

#### Plugin Info

Each loaded plugin exposes an `Info()` method returning a `PluginInfo` struct for the frontend:

```go
type PluginInfo struct {
    Name        string            `json:"name"`
    Version     string            `json:"version"`
    Description string            `json:"description"`
    Author      string            `json:"author"`
    Homepage    string            `json:"homepage,omitempty"`
    Dir         string            `json:"dir"`
    Enabled     bool              `json:"enabled"`
    Error       string            `json:"error,omitempty"`
    Functions   []FunctionDef     `json:"functions,omitempty"`
    Themes      []ThemeDef        `json:"themes,omitempty"`
    Variables   []VariableDef     `json:"variables,omitempty"`
}
```

---

## 9. Complete Example Plugin

Here is a full `plugin.json` that defines functions, a theme, and variables:

```json
{
  "name": "Physics Toolkit",
  "version": "1.0.0",
  "description": "Physics constants, unit conversions, and common formulas for physics calculations",
  "author": "LineSolv Community",
  "homepage": "https://github.com/rkriad585/linesolv-plugins",
  "functions": [
    {
      "name": "kinetic_energy",
      "description": "Kinetic energy: 0.5 * mass * velocity^2",
      "args": 2,
      "min_args": 2,
      "max_args": 2,
      "expression": "0.5 * a * b^2",
      "examples": ["kinetic_energy(10, 5)", "kinetic_energy(2, 3)"]
    },
    {
      "name": "potential_energy",
      "description": "Gravitational potential energy: mass * gravity * height",
      "args": 3,
      "min_args": 3,
      "max_args": 3,
      "expression": "a * b * c",
      "examples": ["potential_energy(5, 9.81, 10)", "potential_energy(10, 9.81, 2)"]
    },
    {
      "name": "ohms_law_v",
      "description": "Voltage from current and resistance: V = I * R",
      "args": 2,
      "min_args": 2,
      "max_args": 2,
      "expression": "a * b",
      "examples": ["ohms_law_v(2, 10)", "ohms_law_v(0.5, 100)"]
    },
    {
      "name": "ohms_law_i",
      "description": "Current from voltage and resistance: I = V / R",
      "args": 2,
      "min_args": 2,
      "max_args": 2,
      "expression": "a / b",
      "examples": ["ohms_law_i(12, 100)", "ohms_law_i(5, 10)"]
    },
    {
      "name": "speed",
      "description": "Speed from distance and time: v = d / t",
      "args": 2,
      "min_args": 2,
      "max_args": 2,
      "expression": "a / b",
      "examples": ["speed(100, 2)", "speed(259.5, 3600)"]
    },
    {
      "name": "doppler_shift",
      "description": "Simple Doppler shift: f' = f * (c / (c - v))",
      "args": 2,
      "min_args": 2,
      "max_args": 2,
      "expression": "a * (299792458 / (299792458 - b))",
      "examples": ["doppler_shift(1e9, 1000)", "doppler_shift(440, -340)"]
    },
    {
      "name": "clamp",
      "description": "Clamp value between min and max",
      "args": 3,
      "min_args": 3,
      "max_args": 3,
      "builtin": "clamp",
      "examples": ["clamp(15, 0, 10)"]
    },
    {
      "name": "lerp",
      "description": "Linear interpolation between a and b by factor c",
      "args": 3,
      "min_args": 3,
      "max_args": 3,
      "builtin": "lerp",
      "examples": ["lerp(0, 10, 0.5)"]
    }
  ],
  "themes": [
    {
      "id": "midnight-blue",
      "label": "Midnight Blue",
      "colors": {
        "--surface": "#0d1117",
        "--surface-secondary": "#161b22",
        "--surface-hover": "#21262d",
        "--border": "#30363d",
        "--accent": "#58a6ff",
        "--accent-hover": "#79c0ff",
        "--text": "#c9d1d9",
        "--text-muted": "#8b949e",
        "--text-subtle": "#6e7681",
        "--error": "#f85149",
        "--success": "#3fb950",
        "--info": "#58a6ff",
        "--shadow": "rgba(0,0,0,0.4)"
      }
    }
  ],
  "variables": [
    {
      "name": "c",
      "description": "Speed of light in m/s",
      "value": 299792458
    },
    {
      "name": "g",
      "description": "Standard gravity in m/s^2",
      "value": 9.80665
    },
    {
      "name": "h_planck",
      "description": "Planck constant in J*s",
      "value": 6.62607015e-34
    },
    {
      "name": "k_boltzmann",
      "description": "Boltzmann constant in J/K",
      "value": 1.380649e-23
    }
  ]
}
```

### What This Plugin Provides

- **6 expression functions**: `kinetic_energy`, `potential_energy`, `ohms_law_v`, `ohms_law_i`, `speed`, `doppler_shift`
- **2 builtin functions**: `clamp`, `lerp`
- **1 theme**: "Midnight Blue" with GitHub-inspired colors
- **4 variables**: `c`, `g`, `h_planck`, `k_boltzmann`

### Usage After Installation

| Input | Result |
|-------|--------|
| `kinetic_energy(10, 5)` | `125` |
| `potential_energy(5, 9.81, 10)` | `490.5` |
| `ohms_law_v(2, 10)` | `20` |
| `speed(100, 2)` | `50` |
| `c` | `299792458` |
| `g` | `9.80665` |
| `kinetic_energy(1, c)` | `4.4933e+16` |

---

## 10. Plugin README

Plugins can include a `README.md` file alongside `plugin.json`. This file is:

- Fetched from the remote repository when viewing plugin details in the marketplace.
- Rendered as Markdown with full formatting support (headings, code blocks, bold, italic, lists, tables, blockquotes, links, images).
- Code blocks include a **Copy** button for easy copying of examples.
- Displayed in a "Documentation" section below the function/variable/theme details.

### Writing a Good Plugin README

A plugin README should include:

```markdown
# Plugin Name

Brief description of what this plugin does.

## Installation

Click "Install" in the LineSolv Plugin Marketplace.

## Functions

### function_name(args)

Description of what the function does.

**Parameters:**
- `a` -- first parameter description
- `b` -- second parameter description

**Examples:**
- `function_name(1, 2)` returns `3`
- `function_name(5, 10)` returns `15`

## Usage Tips

Any additional guidance for using the plugin effectively.

## License

MIT License
```

The README is displayed as-is in the detail view. It supports all standard Markdown syntax including fenced code blocks, tables, and inline formatting.

---

## 11. Validation Rules

The plugin loader enforces these validation rules:

### Manifest Validation

| Rule | Error Message |
|------|---------------|
| `name` must be non-empty | `"plugin name is required"` |
| `version` must be non-empty | `"plugin version is required"` |
| Must have at least one function, theme, or variable | `"plugin must declare at least one function, theme, or variable"` |
| No duplicate function names within a plugin | `"duplicate function name: [name]"` |
| No duplicate theme IDs within a plugin | `"duplicate theme ID: [id]"` |

### File Validation

| Rule | Behavior |
|------|----------|
| Plugin directory must contain `plugin.json` | Directory is skipped if missing |
| `plugin.json` must be valid JSON | Plugin is loaded with error state |
| Manifest must pass all validation rules | Plugin is loaded with error state |

### Function Validation

| Rule | Error Message |
|------|---------------|
| Function must have `expression` or `builtin` | `"function [name]: must declare either 'expression' or 'builtin'"` |
| `min_args` must be <= `max_args` (or `max_args` is -1) | Handled at call time |
| `builtin` must reference a known builtin name | `"unknown builtin: [name]"` |
| Arguments must meet min/max requirements | `"[name] requires at least [N] arguments, got [M]"` |

### Runtime Validation

| Rule | Error Message |
|------|---------------|
| Argument count within bounds | `"[name] requires [N] arguments, got [M]"` |
| Expression variables map to valid args | `"unknown variable: [letter]"` |
| Expression functions are recognized | `"unknown function: [name]"` |
| Division by zero caught | `"division by zero"` |
| Missing closing parenthesis | `"missing closing parenthesis"` |

---

## 12. Limitations

### Expression Engine Limitations

- **No code execution**: Plugin functions can only use math expressions or reference builtins. There is no JavaScript, Go, or any general-purpose code execution.
- **Single-letter variables only**: Expression variables are `a` through `z`, mapped to the function arguments in order.
- **No loops or conditionals**: Expressions are pure math -- no `if`, `for`, `while`, or branching.
- **No string operations**: All values are `float64`. No string manipulation is possible.
- **Expression length**: Expressions are parsed in a single pass. Very complex expressions may hit internal parser limits.

### Function Limitations

- **Max 26 arguments**: Variables map to `a`-`z`, so functions are limited to 26 arguments maximum.
- **Factorial overflow**: Built-in `fact`/`factorial` is limited to `n <= 20` (main engine) or `n <= 170` (plugin builtin). Larger values return an error.
- **No recursion**: A plugin function cannot call another plugin function (only built-in engine functions).

### Theme Limitations

- **14 color variables**: Themes must define valid hex colors or rgba values for the 14 CSS custom properties.
- **No dynamic theming**: Themes are static color maps. No gradients, animations, or conditional styling.
- **Plugin themes cannot override built-in themes**: They are additive only.

### Variable Limitations

- **Numeric only**: Variables are `float64` values. No strings, arrays, or objects.
- **No expressions in values**: Variable values must be literal numbers, not expressions.
- **Plugin variables are read-only**: Users cannot modify plugin-provided variables.

### General Limitations

- **No network access**: Plugins cannot make HTTP requests or access the internet.
- **No file system access**: Plugins cannot read or write files.
- **No native code**: Plugins are pure data manifests -- no compiled code, no shared libraries.
- **No cross-plugin dependencies**: Plugins cannot depend on or reference other plugins.
- **Single-threaded evaluation**: All plugin functions run on the main evaluation goroutine.
- **Max 10,000 character input**: The engine rejects inputs longer than 10,000 characters.

---

## 13. Step-by-Step Development Walkthroughs

### Walkthrough 1: Creating a Geometry Plugin from Scratch

This walkthrough creates a plugin with area formulas for common shapes.

**Step 1: Create the plugin directory**

```bash
mkdir -p ~/.config/neostore/linesolv/plugins/geometry-formulas
```

**Step 2: Write the manifest**

Create `plugin.json`:

```json
{
  "name": "Geometry Formulas",
  "version": "1.0.0",
  "description": "Area and perimeter formulas for common geometric shapes",
  "author": "Your Name",
  "homepage": "https://github.com/yourname/geometry-formulas",
  "functions": [
    {
      "name": "circle_area",
      "description": "Area of a circle given radius",
      "args": 1,
      "min_args": 1,
      "max_args": 1,
      "expression": "pi * a^2",
      "examples": ["circle_area(5)", "circle_area(10)"]
    },
    {
      "name": "rectangle_area",
      "description": "Area of a rectangle",
      "args": 2,
      "min_args": 2,
      "max_args": 2,
      "expression": "a * b",
      "examples": ["rectangle_area(5, 3)", "rectangle_area(10, 7)"]
    },
    {
      "name": "triangle_area",
      "description": "Area of a triangle (base, height)",
      "args": 2,
      "min_args": 2,
      "max_args": 2,
      "expression": "0.5 * a * b",
      "examples": ["triangle_area(10, 5)", "triangle_area(7, 3)"]
    },
    {
      "name": "trapezoid_area",
      "description": "Area of a trapezoid (base1, base2, height)",
      "args": 3,
      "min_args": 3,
      "max_args": 3,
      "expression": "0.5 * (a + b) * c",
      "examples": ["trapezoid_area(5, 10, 4)", "trapezoid_area(3, 7, 2)"]
    },
    {
      "name": "ellipse_area",
      "description": "Area of an ellipse (semi-major, semi-minor)",
      "args": 2,
      "min_args": 2,
      "max_args": 2,
      "expression": "pi * a * b",
      "examples": ["ellipse_area(5, 3)", "ellipse_area(8, 4)"]
    }
  ]
}
```

**Step 3: Write a README**

Create `README.md`:

```markdown
# Geometry Formulas

Area calculation functions for common geometric shapes.

## Functions

### circle_area(radius)
Returns the area of a circle: π × r²

### rectangle_area(width, height)
Returns the area of a rectangle: w × h

### triangle_area(base, height)
Returns the area of a triangle: ½ × b × h

### trapezoid_area(base1, base2, height)
Returns the area of a trapezoid: ½ × (b₁ + b₂) × h

### ellipse_area(semi_major, semi_minor)
Returns the area of an ellipse: π × a × b
```

**Step 4: Test it**

1. Open LineSolv
2. Open the Plugin Marketplace (via the "..." menu or `Ctrl+U`)
3. The plugin should appear in your local plugins list
4. Try `circle_area(5)` — should return `78.5398`

### Walkthrough 2: Creating a Theme Plugin

**Step 1: Create the directory**

```bash
mkdir -p ~/.config/neostore/linesolv/plugins/retro-theme
```

**Step 2: Write the manifest**

```json
{
  "name": "Retro Theme",
  "version": "1.0.0",
  "description": "Warm retro color themes inspired by vintage terminals",
  "author": "Your Name",
  "themes": [
    {
      "id": "amber-terminal",
      "label": "Amber Terminal",
      "colors": {
        "--surface": "#1a1000",
        "--surface-secondary": "#241a00",
        "--surface-hover": "#2e2200",
        "--border": "#4a3800",
        "--accent": "#ffb000",
        "--accent-hover": "#ffc040",
        "--text": "#ffe080",
        "--text-muted": "#b09040",
        "--text-subtle": "#806020",
        "--error": "#ff4444",
        "--success": "#44ff88",
        "--info": "#ffb000",
        "--shadow": "rgba(0,0,0,0.4)"
      }
    },
    {
      "id": "green-phosphor",
      "label": "Green Phosphor",
      "colors": {
        "--surface": "#0a1400",
        "--surface-secondary": "#102000",
        "--surface-hover": "#182c00",
        "--border": "#2a4800",
        "--accent": "#33ff33",
        "--accent-hover": "#66ff66",
        "--text": "#88ff88",
        "--text-muted": "#44aa44",
        "--text-subtle": "#228822",
        "--error": "#ff4444",
        "--success": "#33ff33",
        "--info": "#33ff33",
        "--shadow": "rgba(0,0,0,0.4)"
      }
    }
  ]
}
```

**Step 3: Verify in Settings**

Open LineSolv → Settings → Theme. The "Amber Terminal" and "Green Phosphor" themes should appear with a "Plugin" badge.

### Walkthrough 3: Creating a Constants Plugin

**Step 1: Create the directory**

```bash
mkdir -p ~/.config/neostore/linesolv/plugins/astronomy-constants
```

**Step 2: Write the manifest**

```json
{
  "name": "Astronomy Constants",
  "version": "1.0.0",
  "description": "Common astronomical constants for space calculations",
  "author": "Your Name",
  "variables": [
    {
      "name": "au",
      "description": "Astronomical Unit (Earth-Sun distance) in meters",
      "value": 149597870700
    },
    {
      "name": "ly",
      "description": "Light-year in meters",
      "value": 9.461e15
    },
    {
      "name": "pc",
      "description": "Parsec in meters",
      "value": 3.0857e16
    },
    {
      "name": "moon_dist",
      "description": "Average Earth-Moon distance in meters",
      "value": 384400000
    },
    {
      "name": "sun_mass",
      "description": "Solar mass in kg",
      "value": 1.989e30
    },
    {
      "name": "earth_mass",
      "description": "Earth mass in kg",
      "value": 5.972e24
    },
    {
      "name": "jupiter_mass",
      "description": "Jupiter mass in kg",
      "value": 1.898e27
    }
  ]
}
```

**Step 3: Test it**

Try: `au`, `ly / (365.25 * 24 * 3600)`, `sun_mass / earth_mass`

---

## 14. Debugging and Troubleshooting

### Plugin Not Appearing in Marketplace

**Symptoms**: Plugin directory exists but doesn't show up.

**Checks**:
1. Verify `plugin.json` exists in the plugin directory
2. Validate JSON syntax: `python3 -c "import json; json.load(open('plugin.json'))"`
3. Check that `name`, `version`, `description`, and `author` are non-empty strings
4. Verify the plugin declares at least one function, theme, or variable

### Plugin Shows Error State

**Symptoms**: Plugin appears in the marketplace with a red error badge.

**Common causes**:
- Invalid JSON in `plugin.json`
- Duplicate function names within the plugin
- Duplicate theme IDs within the plugin
- Expression references undefined function or invalid syntax

**Fix**: Edit `plugin.json`, save, then click the refresh button in the marketplace.

### Function Returns Unexpected Result

**Debugging steps**:

1. **Check argument mapping**: Variables `a`, `b`, `c`, ... map to arguments in order
2. **Verify expression syntax**: Use only supported operators (`+`, `-`, `*`, `/`, `%`, `^`)
3. **Test with known values**: Use simple inputs to verify the formula
4. **Check for integer division**: `5/2` returns `2.5`, not `2` (no integer division)

**Example debugging session**:

```
# Problem: my_func(10, 3) returns 7 instead of 13
# Expression: "a + b"
# Debug: a=10, b=3 → 10 + 3 = 13 ✓
# But user reports 7...
# Check: Is the function actually being called? Or is a builtin shadowing it?
# Solution: Rename to avoid conflict with existing functions
```

### Theme Not Applying

**Symptoms**: Theme appears in Settings but colors don't change.

**Checks**:
1. Verify all 14 color variables are defined
2. Check hex color format: must be `#rrggbb` (6 hex digits)
3. Verify rgba format: `rgba(r,g,b,a)` with values 0-255 for rgb, 0-1 for a
4. Check for typos in variable names (case-sensitive: `--surface` not `--Surface`)

### Variable Not Available

**Symptoms**: Variable name returns "undefined variable" error.

**Checks**:
1. Verify the plugin is enabled (toggle in marketplace)
2. Check variable name spelling (case-insensitive, but no spaces)
3. Verify `value` is a valid number (not a string)
4. Check for name conflicts with built-in constants (`pi`, `e`, `tau`, `phi`)

### Expression Parsing Errors

**Common errors and fixes**:

| Error | Cause | Fix |
|-------|-------|-----|
| `missing closing parenthesis` | Unmatched `(` | Add closing `)` |
| `unexpected character` | Invalid symbol in expression | Use only `+`, `-`, `*`, `/`, `%`, `^`, `(`, `)` |
| `unknown function: [name]` | Typo in function name | Check spelling; use only supported functions |
| `unknown variable: [letter]` | Variable letter exceeds arg count | Reduce to variables `a`-`z` mapped to args |
| `division by zero` | Denominator evaluates to zero | Add validation in expression or use different formula |
| `argument count mismatch` | Wrong number of args passed | Check `min_args` and `max_args` |

---

## 15. Testing Plugins

### Manual Testing

1. **Install the plugin** in LineSolv
2. **Test each function** with:
   - Valid inputs within expected range
   - Boundary values (min args, max args)
   - Edge cases (zero, negative, very large numbers)
   - Invalid inputs (wrong arg count, wrong types)
3. **Test in context**: Use plugin functions inside larger expressions
4. **Test variable conflicts**: Ensure plugin variables don't shadow built-ins unintentionally
5. **Test enable/disable**: Toggle the plugin and verify functions/variables disappear/reappear

### Automated Testing (for CI/CD)

If you maintain a fork of the `linesolv-plugins` repository, you can add CI validation:

```yaml
# .github/workflows/validate.yml
name: Validate Plugins
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate plugin.json files
        run: |
          for f in plugins/*/plugin.json; do
            echo "Validating $f..."
            python3 -c "import json, sys; json.load(open('$f'))" || exit 1
          done
      - name: Check required fields
        run: |
          for f in plugins/*/plugin.json; do
            python3 -c "
          import json
          data = json.load(open('$f'))
          required = ['name', 'version', 'description', 'author']
          for field in required:
              if not data.get(field):
                  print(f'Missing required field: {field} in $f')
                  sys.exit(1)
          if not (data.get('functions') or data.get('themes') or data.get('variables')):
              print(f'Plugin must declare at least one function, theme, or variable: $f')
              sys.exit(1)
          " || exit 1
          done
```

### Test Checklist

Before submitting a plugin:

- [ ] `plugin.json` is valid JSON
- [ ] All required fields are present (`name`, `version`, `description`, `author`)
- [ ] Plugin declares at least one function, theme, or variable
- [ ] No duplicate function names within the plugin
- [ ] No duplicate theme IDs within the plugin
- [ ] All expression functions use valid syntax
- [ ] All builtin references use known builtin names
- [ ] `min_args` ≤ `max_args` for all functions
- [ ] `README.md` includes description and usage examples
- [ ] Plugin tested with valid and invalid inputs
- [ ] Plugin works when enabled and disabled
- [ ] No conflicts with built-in functions or constants

---

## 16. Advanced Patterns

### Pattern: Expressions Using Built-in Functions

Plugin expressions can call built-in math functions:

```json
{
  "name": "haversine",
  "description": "Haversine distance between two lat/lon points (in km)",
  "args": 4,
  "min_args": 4,
  "max_args": 4,
  "expression": "2 * 6371 * asin(sqrt(sin((b-a)*pi/360)^2 + cos(a*pi/180) * cos(b*pi/180) * sin((d-c)*pi/360)^2))",
  "examples": ["haversine(40.7128, 34.0522, -74.0060, -118.2437)"]
}
```

Variables map to: `a=lat1`, `b=lat2`, `c=lon1`, `d=lon2`.

### Pattern: Constants with Computed Values

While variable values must be literal numbers, you can use very precise values:

```json
{
  "variables": [
    {
      "name": "speed_of_sound",
      "description": "Speed of sound in air at 20°C in m/s",
      "value": 343.2
    },
    {
      "name": "mach_1_kmh",
      "description": "Mach 1 in km/h",
      "value": 1235.52
    }
  ]
}
```

### Pattern: Multiple Themes in One Plugin

A single plugin can provide multiple themes:

```json
{
  "themes": [
    {
      "id": "forest-dark",
      "label": "Forest Dark",
      "colors": { "..." : "..." }
    },
    {
      "id": "forest-light",
      "label": "Forest Light",
      "colors": { "..." : "..." }
    },
    {
      "id": "forest-midnight",
      "label": "Forest Midnight",
      "colors": { "..." : "..." }
    }
  ]
}
```

### Pattern: Variadic Functions

Use `max_args: -1` for functions that accept any number of arguments:

```json
{
  "name": "geometric_mean",
  "description": "Geometric mean of all arguments",
  "args": -1,
  "min_args": 1,
  "max_args": -1,
  "expression": "pow(product(a, b, c), 1/3)",
  "examples": ["geometric_mean(2, 8)", "geometric_mean(4, 9, 16)"]
}
```

Note: Variadic expressions must reference specific variable letters. The expression engine maps positional arguments to `a`, `b`, `c`, ... up to the number of arguments provided.

### Pattern: Combining Functions, Themes, and Variables

The most complete plugins provide all three types:

```json
{
  "name": "Engineering Toolkit",
  "version": "1.0.0",
  "description": "Engineering formulas, constants, and a professional theme",
  "author": "LineSolv Community",
  "functions": [
    { "name": "stress", "expression": "a / b", "..." : "..." },
    { "name": "strain", "expression": "a / b", "..." : "..." },
    { "name": "youngs_modulus", "expression": "a / b", "..." : "..." }
  ],
  "themes": [
    { "id": "engineering-blue", "label": "Engineering Blue", "colors": { "..." : "..." } }
  ],
  "variables": [
    { "name": "E_steel", "description": "Young's modulus of steel (Pa)", "value": 200e9 },
    { "name": "E_aluminum", "description": "Young's modulus of aluminum (Pa)", "value": 69e9 }
  ]
}
```

---

## 17. Best Practices

### Manifest

- **Use semantic versioning**: `MAJOR.MINOR.PATCH` — increment PATCH for bug fixes, MINOR for new functions, MAJOR for breaking changes
- **Write clear descriptions**: Users see this in the marketplace card
- **Include examples**: The `examples` array shows users how to call each function
- **Keep function names descriptive**: `circle_area` is better than `ca`

### Expressions

- **Prefer builtins when available**: Use `"builtin": "clamp"` instead of reimplementing `min(max(a, b), c)`
- **Use parentheses for clarity**: `(a + b) * c` is clearer than `a + b * c`
- **Test edge cases**: Verify behavior with zero, negative, and very large inputs
- **Document units**: In the description, specify expected units (e.g., "radius in meters")

### Themes

- **Test in both light and dark modes**: Some colors may not have sufficient contrast
- **Use consistent naming**: Theme `id` should be lowercase, hyphen-separated
- **Provide preview-worthy colors**: The marketplace uses `--surface`, `--accent`, and `--text` for the swatch

### Documentation

- **Include a README.md**: It's rendered in the plugin detail view
- **Document parameters**: Explain what each argument represents
- **Provide usage examples**: Show realistic use cases
- **List any limitations**: If the plugin has constraints, document them

---

## 18. Contributing to linesolv-plugins

### Repository Structure

```
linesolv-plugins/
├── plugins/
│   ├── math-extras/
│   │   ├── plugin.json
│   │   └── README.md
│   ├── statistics/
│   │   ├── plugin.json
│   │   └── README.md
│   ├── financial/
│   │   ├── plugin.json
│   │   └── README.md
│   ├── geometry/
│   │   ├── plugin.json
│   │   └── README.md
│   ├── conversions/
│   │   ├── plugin.json
│   │   └── README.md
│   ├── ocean-theme/
│   │   ├── plugin.json
│   │   └── README.md
│   ├── solarized/
│   │   ├── plugin.json
│   │   └── README.md
│   ├── dracula/
│   │   ├── plugin.json
│   │   └── README.md
│   ├── nord/
│   │   ├── plugin.json
│   │   └── README.md
│   ├── physics-constants/
│   │   ├── plugin.json
│   │   └── README.md
│   ├── chemistry-constants/
│   │   ├── plugin.json
│   │   └── README.md
│   └── math-constants/
│       ├── plugin.json
│       └── README.md
├── plugins.json          # Index file
├── LICENSE
└── README.md
```

### Submission Process

1. **Fork** the `linesolv-plugins` repository
2. **Create a branch**: `git checkout -b add-my-plugin`
3. **Add your plugin** directory under `plugins/`
4. **Update `plugins.json`** with your plugin entry:
   ```json
   {
     "name": "my-plugin",
     "version": "1.0.0",
     "description": "What my plugin does",
     "author": "Your Name",
     "homepage": "https://github.com/yourname/my-plugin",
     "type": "functions",
     "tags": ["relevant", "tags"],
     "directory": "my-plugin"
   }
   ```
5. **Test locally** in LineSolv
6. **Submit a Pull Request** with:
   - Description of what the plugin does
   - Example inputs and expected outputs
   - Screenshot if it's a theme plugin

### Plugin Review Criteria

Pull requests are reviewed for:

- Valid `plugin.json` manifest
- No duplicate names with existing plugins
- Clear, non-misleading descriptions
- Working expressions (no syntax errors)
- Reasonable function naming (no single-letter names, no abbreviations)
- Complete `README.md` with documentation
