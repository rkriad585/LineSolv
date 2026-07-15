# PLAN: UI Style Authenticity Overhaul

## Summary

Each of the 6 UI styles in LineSolv claims to represent a real-world design system but
currently delivers a generic approximation. This plan fixes every style to match its
authentic counterpart — real colors, real typography, real shadows, real motion, and
real unique visual signatures. It also adds a 7th style: **Anthropic Claude Code**.

---

## Audit Results (Before → After)

| Style                  | Current Authenticity | Key Problem                                                                          |
| ---------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| Nothing OS             | ~20%                 | No color overrides at all; inherits purple accent instead of Nothing Red             |
| Liquid Glass           | ~35%                 | Single fixed blur; no saturate(); specular too weak; no SVG lensing                  |
| Material 3             | ~30%                 | No type scale; no color roles; uses M2 shadow paradigm, not tonal elevation          |
| Alivated (Neumorphism) | ~15%                 | Shadow colors are generic rgba, not bg-derived; surface colors at lightness extremes |
| Neon (Cyberpunk)       | ~25%                 | Glow too subtle; scanlines invisible; no cut-corners; no text glow                   |
| **Claude Code**        | **NEW**              | Does not exist yet — to be added                                                     |

---

## Phase 1: Nothing OS (authentic Nothing design language)

### Files to modify

- `frontend/src/style.css` — `.style-nothing` section (lines 346–377)

### Changes

**1. Color overrides (CRITICAL — currently zero)**
Add Nothing's monochrome palette directly in `.style-nothing`:

```css
.style-nothing {
  --surface: #000000;
  --surface-secondary: #111111;
  --surface-hover: #1a1a1a;
  --border: #222222;
  --text: #e8e8e8;
  --text-muted: #999999;
  --accent: #d71921; /* Nothing Red — the signature */
}
.theme-light.style-nothing {
  --surface: #f5f5f5;
  --surface-secondary: #ffffff;
  --surface-hover: #f0f0f0;
  --border: #e8e8e8;
  --text: #1a1a1a;
  --text-muted: #666666;
  --accent: #d71921;
}
```

**2. Border radii — increase for cards/containers**

```css
.style-nothing {
  --ui-radius-sm: 2px; /* keep — correct for small elements */
  --ui-radius-md: 8px; /* was 4px → buttons need 6-8dp */
  --ui-radius-lg: 16px; /* was 6px → cards/dialogs use 16-20dp */
}
```

**3. Easing curve fix**

```css
--ui-transition: cubic-bezier(0.25, 0.1, 0.25, 1); /* was (0.2,0,0,1) */
```

**4. Border visibility — stronger ring-shadow**

```css
.style-nothing {
  --ui-shadow-lg: 0 0 0 1px rgba(255, 255, 255, 0.12); /* was 0.06 */
}
.theme-light.style-nothing {
  --ui-shadow-lg: 0 0 0 1px rgba(0, 0, 0, 0.15); /* was 0.1 */
}
```

**5. Dot-grid background pattern (signature element)**

```css
.style-nothing body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 16px 16px;
}
.theme-light.style-nothing body::before {
  background: radial-gradient(circle, rgba(0, 0, 0, 0.06) 1px, transparent 1px);
  background-size: 16px 16px;
}
```

**6. Segmented control radius fix**

```css
.style-nothing .nothing-segmented {
  border-radius: var(--ui-radius-sm); /* keep 2px — correct */
}
.style-nothing .nothing-segmented > * {
  font-family: 'Space Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 10px;
}
```

**7. Button radius override**

```css
.style-nothing button {
  border-radius: var(--ui-radius-sm);
}
```

---

## Phase 2: Liquid Glass (Apple's WWDC 2025 design)

### Files to modify

- `frontend/src/style.css` — `.style-glass` section (lines 383–441)

### Changes

**1. Translucent background values — increase opacity (too faint at 0.06)**

```css
.style-glass input[type='text'],
.style-glass input[type='search'],
.style-glass textarea,
.style-glass #input-area,
.style-glass #notepad,
.style-glass #results-column {
  background: rgba(255, 255, 255, 0.12) !important; /* was 0.06 */
  backdrop-filter: blur(10px) saturate(150%); /* add saturate */
  -webkit-backdrop-filter: blur(10px) saturate(150%);
}
.theme-light.style-glass input[type='text'],
.theme-light.style-glass input[type='search'],
.theme-light.style-glass textarea,
.theme-light.style-glass #input-area,
.theme-light.style-glass #notepad,
.theme-light.style-glass #results-column {
  background: rgba(0, 0, 0, 0.08) !important; /* was 0.04 */
}
```

**2. Add saturate() to all blur elements**

```css
.style-glass #settings-modal,
.style-glass #shortcut-modal,
.style-glass .lsv-modal-overlay,
.style-glass .context-menu-item,
.style-glass .autocomplete-popup {
  backdrop-filter: blur(var(--ui-blur)) saturate(150%);
  -webkit-backdrop-filter: blur(var(--ui-blur)) saturate(150%);
}
.style-glass aside,
.style-glass #notes-sidebar,
.style-glass #vars-panel,
.style-glass #steps-panel,
.style-glass #history-panel,
.style-glass #graph-panel {
  backdrop-filter: blur(var(--ui-blur)) saturate(150%);
  -webkit-backdrop-filter: blur(var(--ui-blur)) saturate(150%);
}
```

**3. Specular highlight — stronger, add inset box-shadow**

```css
.style-glass .glass-specular {
  position: relative;
  overflow: hidden;
}
.style-glass .glass-specular::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, transparent 50%);
  /* was 0.08 → Apple uses 0.15-0.32 */
  border-radius: inherit;
  z-index: 1;
}
/* Add inset edge lighting */
.style-glass .glass-specular {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
  /* Apple's inner highlight: inset 0 1px 0 rgba(255,255,255,0.15-0.25) */
}
.theme-light.style-glass .glass-specular::before {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.08) 0%, transparent 50%);
  /* was 0.05 */
}
```

**4. Shadow inner highlight — stronger**

```css
.style-glass {
  --ui-shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  /* was inset ... 0.1 → Apple uses 0.15-0.25 */
}
```

**5. Border radius — increase for modals/sheets**

```css
.style-glass {
  --ui-radius-lg: 24px; /* was 20px → Apple uses 28-40px for sheets */
}
```

**6. Font stack — complete SF Pro fallback chain**

```css
.style-glass {
  --ui-font-display:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica,
    Arial, sans-serif;
}
```

**7. Letter-spacing for headings**

```css
.style-glass #settings-modal h2,
.style-glass #settings-modal h3 {
  letter-spacing: -0.015em;
}
```

---

## Phase 3: Material Design 3 (Google's M3)

### Files to modify

- `frontend/src/style.css` — `.style-material` section (lines 447–485)

### Changes

**1. Add M3 color tokens as CSS custom properties**

```css
.style-material {
  /* M3 Baseline Dark palette */
  --md-primary: #d0bcff;
  --md-on-primary: #381e72;
  --md-primary-container: #4f378b;
  --md-on-primary-container: #eaddff;
  --md-secondary: #ccc2dc;
  --md-on-secondary: #332d41;
  --md-secondary-container: #4a4458;
  --md-tertiary: #efb8c8;
  --md-surface: #141218;
  --md-surface-dim: #141218;
  --md-surface-container: #211f26;
  --md-surface-container-high: #2b2930;
  --md-surface-container-highest: #36343b;
  --md-on-surface: #e6e1e5;
  --md-on-surface-variant: #cac4d0;
  --md-outline: #938f99;
  --md-outline-variant: #49454f;
  --md-error: #f2b8b5;

  /* Apply M3 tokens to app variables */
  --surface: var(--md-surface);
  --surface-secondary: var(--md-surface-container);
  --surface-hover: var(--md-surface-container-high);
  --border: var(--md-outline-variant);
  --text: var(--md-on-surface);
  --text-muted: var(--md-on-surface-variant);
  --accent: var(--md-primary);
}
```

**2. Tonal elevation — primary tint overlay on surfaces**

```css
.style-material aside,
.style-material #vars-panel,
.style-material #steps-panel,
.style-material #history-panel,
.style-material #graph-panel {
  box-shadow: none;
  /* M3 uses tonal elevation, not shadows */
  position: relative;
}
.style-material aside::before,
.style-material #vars-panel::before,
.style-material #steps-panel::before,
.style-material #history-panel::before,
.style-material #graph-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: color-mix(in srgb, var(--md-primary) 5%, transparent);
  /* 5% primary tint = elevation level +1 */
  z-index: 0;
}
```

**3. Fix FAB — wrong size, shape, color**

```css
.style-material .material-fab {
  width: 56px; /* was 40px */
  height: 56px; /* was 40px */
  border-radius: 16px; /* was 12px → M3 FAB uses 16dp */
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  box-shadow:
    0 6px 10px rgba(0, 0, 0, 0.15),
    0 2px 3px rgba(0, 0, 0, 0.1);
  /* level +3 elevation */
}
```

**4. Chips — correct height and colors**

```css
.style-material .material-chip {
  height: 32px; /* M3 chip is 32dp */
  padding: 0 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
  border: none;
}
.style-material .material-chip:hover {
  background: color-mix(
    in srgb,
    var(--md-secondary-container) 92%,
    var(--md-on-secondary-container)
  );
}
```

**5. State layers — hover/focus/press opacity**

```css
.style-material button:hover,
.style-material .note-item:hover {
  background: color-mix(in srgb, var(--md-on-surface) 8%, var(--surface));
  /* 8% state layer */
}
.style-material button:focus-visible {
  background: color-mix(in srgb, var(--md-on-surface) 10%, var(--surface));
  /* 10% focus layer */
}
.style-material button:active {
  background: color-mix(in srgb, var(--md-on-surface) 10%, var(--surface));
  /* 10% press layer */
}
```

**6. M3 border radius tokens**

```css
.style-material {
  --ui-radius-sm: 8px; /* small — buttons */
  --ui-radius-md: 12px; /* medium — cards, chips */
  --ui-radius-lg: 28px; /* large — dialogs, sheets */
  /* missing extra-small (4dp) and full (50%) — add as extras */
  --ui-radius-xs: 4px;
  --ui-radius-full: 9999px;
}
```

**7. Font fallback — add Roboto**

```css
.style-material {
  --ui-font-display: 'Google Sans', 'Roboto', 'Inter', sans-serif;
}
```

---

## Phase 4: Alivated (Neumorphism / Soft UI)

### Files to modify

- `frontend/src/style.css` — `.style-alivated` section (lines 502–556)

### Critical finding

Real neumorphism requires **mid-tone backgrounds** (HSL lightness 70-90%). The app's
generic `--surface: #18181b` (dark) and `--surface: #fafafa` (light) are at the
extremes of the lightness scale, where neumorphism structurally cannot work.
The Alivated style must override `--surface` with appropriate neumorphic backgrounds.

### Changes

**1. Override surface colors with mid-tone neumorphic backgrounds**

```css
.style-alivated {
  --surface: #2d3239; /* dark neumorphic mid-tone (HSL ~216,27%,20%) */
  --surface-secondary: #353a42;
  --surface-hover: #3a3f48;
  --border: #3a3f48;
}
.theme-light.style-alivated {
  --surface: #e0e5ec; /* light neumorphic mid-tone (HSL ~216,27%,90%) */
  --surface-secondary: #e8ecf1;
  --surface-hover: #d5dbe3;
  --border: #d5dbe3;
}
```

**2. Fix shadow colors — derive from background, not generic rgba**

Dark mode shadows (bg = `#2d3239`):

```css
.style-alivated {
  --ui-shadow-sm: -2px -2px 6px rgba(52, 57, 63, 0.5), 2px 2px 6px rgba(16, 18, 20, 0.6);
  /* light shadow: lighter variant of bg; dark shadow: darker variant of bg */
  --ui-shadow-md: -4px -4px 12px rgba(52, 57, 63, 0.5), 4px 4px 12px rgba(16, 18, 20, 0.6);
  --ui-shadow-lg: -6px -6px 20px rgba(52, 57, 63, 0.5), 6px 6px 20px rgba(16, 18, 20, 0.6);
}
```

Light mode shadows (bg = `#e0e5ec`):

```css
.theme-light.style-alivated {
  --ui-shadow-sm: -2px -2px 6px #ffffff, 2px 2px 6px #a3b1c6;
  --ui-shadow-md: -4px -4px 12px #ffffff, 4px 4px 12px #a3b1c6;
  --ui-shadow-lg: -6px -6px 20px #ffffff, 6px 6px 20px #a3b1c6;
}
```

**3. Fix pressed/active state — inset shadows with correct colors**

```css
.style-alivated button:active,
.style-alivated .note-item:active {
  box-shadow:
    inset 2px 2px 5px rgba(16, 18, 20, 0.6),
    inset -2px -2px 5px rgba(52, 57, 63, 0.5);
}
.theme-light.style-alivated button:active,
.theme-light.style-alivated .note-item:active {
  box-shadow:
    inset 2px 2px 5px #a3b1c6,
    inset -2px -2px 5px #ffffff;
}
```

**4. Fix panel shadows for new background**

```css
.style-alivated aside,
.style-alivated #notes-sidebar,
.style-alivated #vars-panel,
.style-alivated #steps-panel,
.style-alivated #history-panel,
.style-alivated #graph-panel {
  box-shadow: var(--ui-shadow-md);
}
.theme-light.style-alivated aside,
.theme-light.style-alivated #notes-sidebar,
.theme-light.style-alivated #vars-panel,
.theme-light.style-alivated #steps-panel,
.theme-light.style-alivated #history-panel,
.theme-light.style-alivated #graph-panel {
  box-shadow: var(--ui-shadow-md);
}
```

**5. Remove dead `--ui-blur` variable**
The `--ui-blur: 0px` is never referenced — remove it.

**6. Border radius — keep as-is**
`--ui-radius-md: 16px`, `--ui-radius-lg: 20px` are correct for neumorphism.

---

## Phase 5: Neon (Cyberpunk / Sci-Fi)

### Files to modify

- `frontend/src/style.css` — `.style-neon` section (lines 562–632)

### Changes

**1. Intensify glow — multi-layer neon bloom**

```css
.style-neon {
  --ui-shadow-md:
    0 0 5px var(--accent), 0 0 10px var(--accent), 0 0 20px var(--accent),
    0 0 40px color-mix(in srgb, var(--accent) 30%, transparent);
  /* was 2 layers → now 4 layers with white hot-core */
  --ui-shadow-lg:
    0 0 5px #fff, 0 0 10px #fff, 0 0 20px var(--accent), 0 0 40px var(--accent),
    0 0 80px color-mix(in srgb, var(--accent) 25%, transparent);
}
```

**2. Panel glow — stronger with white core**

```css
.style-neon aside,
.style-neon #notes-sidebar,
.style-neon #vars-panel,
.style-neon #steps-panel,
.style-neon #history-panel,
.style-neon #graph-panel {
  box-shadow:
    0 0 5px rgba(255, 255, 255, 0.1),
    0 0 10px var(--accent),
    0 0 20px color-mix(in srgb, var(--accent) 20%, transparent),
    inset 0 0 8px color-mix(in srgb, var(--accent) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
}
```

**3. Button hover glow — more layers**

```css
.style-neon button:hover,
.style-neon .note-item:hover {
  box-shadow:
    0 0 5px #fff,
    0 0 10px var(--accent),
    0 0 20px var(--accent),
    0 0 40px color-mix(in srgb, var(--accent) 20%, transparent);
}
```

**4. Fix scanlines — change blend mode, increase opacity**

```css
.style-neon::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 99998;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 1px,
    rgba(0, 0, 0, 0.15) 1px,
    rgba(0, 0, 0, 0.15) 2px
  );
  mix-blend-mode: multiply; /* was overlay — multiply works on dark bg */
}
.theme-light.style-neon::before {
  mix-blend-mode: multiply;
}
```

**5. Add text glow — the signature neon text effect**

```css
.style-neon h1,
.style-neon h2,
.style-neon h3,
.style-neon .calc-result {
  text-shadow:
    0 0 7px var(--accent),
    0 0 20px color-mix(in srgb, var(--accent) 30%, transparent);
}
```

**6. Add cut-corners on panels — the Cyberpunk 2077 signature**

```css
.style-neon aside,
.style-neon #vars-panel,
.style-neon #steps-panel,
.style-neon #history-panel,
.style-neon #graph-panel {
  clip-path: polygon(
    0 0,
    calc(100% - 12px) 0,
    100% 12px,
    100% 100%,
    12px 100%,
    0 calc(100% - 12px)
  );
}
```

**7. Add subtle grid background**

```css
.style-neon body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    linear-gradient(color-mix(in srgb, var(--accent) 3%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--accent) 3%, transparent) 1px, transparent 1px);
  background-size: 50px 50px;
}
```

**8. Add letter-spacing and uppercase for labels**

```css
.style-neon label,
.style-neon .section-title {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
}
```

**9. Modal glow — stronger**

```css
.style-neon #settings-modal,
.style-neon #shortcut-modal,
.style-neon .lsv-modal-overlay {
  box-shadow:
    0 0 5px #fff,
    0 0 10px var(--accent),
    0 0 30px var(--accent),
    0 0 60px color-mix(in srgb, var(--accent) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
}
```

---

## Phase 6: Anthropic Claude Code (NEW style)

### Files to modify

- `frontend/src/style.css` — add new `.style-claude` section
- `frontend/src/types.ts` — add `'claude'` to any style type
- `frontend/src/stores/settings.ts` — add default pairing
- `frontend/src/App.ts` — add to STYLES array and style class list
- `frontend/src/components/SettingsModal.ts` — add to STYLES array and STYLE_THEME_DEFAULTS

### CSS implementation

```css
:root.style-claude {
  --ui-radius-sm: 6px;
  --ui-radius-md: 8px;
  --ui-radius-lg: 12px;
  --ui-shadow-sm: none;
  --ui-shadow-md: 0 0 0 1px rgba(255, 255, 255, 0.06);
  --ui-shadow-lg: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 4px 24px rgba(0, 0, 0, 0.12);
  --ui-blur: 0px;
  --ui-transition: cubic-bezier(0.2, 0, 0, 1);
  --ui-font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

/* Ring-shadow depth (Claude's signature) */
.style-claude aside,
.style-claude #vars-panel,
.style-claude #steps-panel,
.style-claude #history-panel,
.style-claude #graph-panel {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06);
}
.style-claude #settings-modal,
.style-claude #shortcut-modal,
.style-claude .lsv-modal-overlay {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 4px 24px rgba(0, 0, 0, 0.12);
  border-radius: var(--ui-radius-lg);
}
.style-claude .autocomplete-popup,
.style-claude .context-menu-item {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06);
  border-radius: var(--ui-radius-md);
}

/* Hover lift */
.style-claude aside:hover,
.style-claude #vars-panel:hover,
.style-claude #history-panel:hover {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 4px 24px rgba(0, 0, 0, 0.05);
}

/* Button warmth */
.style-claude button {
  border-radius: var(--ui-radius-sm);
  transition:
    background 0.15s var(--ui-transition),
    box-shadow 0.15s var(--ui-transition);
}

/* Focus ring in terracotta */
.style-claude button:focus-visible,
.style-claude select:focus-visible,
.style-claude input:focus-visible,
.style-claude textarea:focus-visible {
  outline: 2px solid var(--accent) !important;
  outline-offset: 2px !important;
}

/* Light mode overrides */
.theme-claude-light.style-claude aside,
.theme-claude-light.style-claude #vars-panel,
.theme-claude-light.style-claude #history-panel {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
}
.theme-claude-light.style-claude #settings-modal,
.theme-claude-light.style-claude .lsv-modal-overlay {
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.08),
    0 4px 24px rgba(0, 0, 0, 0.08);
}
```

### Theme pairing

Default: `claude` style → `claude-dark` theme (if it exists) or the existing dark theme.

### TypeScript changes

- Add `'claude'` to the styles list in `App.ts` (line ~34) and `SettingsModal.ts` (line ~37)
- Add `claude: 'claude-dark'` (or appropriate) to `STYLE_THEME_DEFAULTS`

---

## Implementation Order

1. **Phase 1: Nothing OS** — color overrides, radii, easing, dot-grid, mono labels
2. **Phase 2: Liquid Glass** — saturate(), specular boost, blur improvements, font stack
3. **Phase 3: Material 3** — M3 color tokens, tonal elevation, FAB fix, state layers
4. **Phase 4: Alivated** — mid-tone backgrounds, bg-derived shadows, pressed state fix
5. **Phase 5: Neon** — glow intensification, scanline fix, text glow, cut-corners, grid
6. **Phase 6: Claude Code** — new style + theme (if adding Claude themes) or pair with existing dark

## Risk Assessment

- **Medium risk**: Alivated surface color override changes the app's visual baseline for that style. Users who liked the current dark/light appearance may notice the shift.
- **Low risk**: All other phases only modify CSS within their respective `.style-*` blocks.
- **No breaking changes**: No TypeScript logic changes except adding Claude to style arrays.

## Verification

After each phase:

1. `npm run build` in frontend/ to verify no CSS errors
2. Visual inspection in browser: toggle each theme × style combination
3. Verify no regressions in other styles (CSS is scoped to `.style-*` selectors)
