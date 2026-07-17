# Accessibility Statement — LineSolv

LineSolv is committed to making its calculator accessible to all users, including those who rely on assistive technologies.

## Standards Conformance

- **Target**: WCAG 2.1 Level AA (partial conformance; see Known Limitations)
- **Framework**: WAI-ARIA 1.2 Authoring Practices
- **Principles**: Perceivable, Operable, Understandable, Robust

## Keyboard Accessibility

### Global Shortcuts

| Key                                     | Action                                             |
| --------------------------------------- | -------------------------------------------------- |
| `Tab`                                   | Insert 2 spaces in textarea (see Limitations)      |
| `Shift+Tab`                             | Insert 2 spaces in textarea (see Limitations)      |
| `Enter`                                 | Activate buttons, submit calculation               |
| `Space`                                 | Toggle checkboxes and switches                     |
| `Escape`                                | Close sidebar panels, dismiss errors, close modals |
| `Arrow keys`                            | Navigate within sidebar tabs and history list      |
| `Ctrl/Cmd + Z`                          | Undo                                               |
| `Ctrl/Cmd + Shift + Z` / `Ctrl/Cmd + Y` | Redo                                               |
| `Ctrl/Cmd + D`                          | Duplicate line                                     |
| `Ctrl/Cmd + L`                          | Select current line                                |
| `Ctrl/Cmd + Shift + K`                  | Delete current line                                |
| `Alt + Shift`                           | Toggle case                                        |
| `Alt + Arrow Up/Down`                   | Move line up/down                                  |
| `F11`                                   | Toggle fullscreen                                  |
| `Ctrl/Cmd + F`                          | Search notes                                       |
| `Ctrl/Cmd + P`                          | Print                                              |
| `Ctrl/Cmd + J`                          | Open docs panel                                    |
| `Ctrl/Cmd + /`                          | Show shortcuts reference                           |
| `Ctrl/Cmd + ,`                          | Open settings                                      |
| `Ctrl/Cmd + `` `                        | Open settings (alternate)                          |

### Component Keyboard Patterns

- **Sidebar toggles**: Tab to reach title bar buttons, Enter/Space activates
- **Title bar "..." menu**: Tab to reach, Enter/Space opens dropdown; Escape closes
- **Splash screen**: Displayed on startup; contains no interactive elements
- **Textarea**: Standard textarea keyboard behavior with line-based navigation
- **Window controls**: Tab to reach, Enter to activate
- **Theme/Style cards**: Tab to focus, Enter/Space to select
- **Settings tabs**: Click to switch (no arrow key navigation between tabs yet)
- **Autocomplete popup**: Arrow Up/Down to navigate, Enter/Tab to select, Escape to dismiss

## Screen Reader Support

### ARIA Implementation

- `aria-label` attributes on title bar buttons (9 buttons), graph close button, sidebar search inputs
- `role="menu"` on context menu container and title bar "..." dropdown menu
- `aria-haspopup="menu"` on title bar "..." button
- `<aside>` elements for sidebar panels (implicit `complementary` role)
- `<header>` element for title bar (implicit `banner` role)

### Known Gaps

- No `aria-live` regions for results, errors, or toast notifications
- No `role="dialog"` or `aria-modal="true"` on modal dialogs
- No ARIA tab pattern (`role="tablist"`, `role="tab"`, `aria-selected`) on settings tabs
- Toggle switches use hidden checkboxes (`display:none`) — not keyboard accessible
- Autocomplete popup lacks `role="listbox"` and `role="option"` patterns
- Context menu items lack `role="menuitem"` and arrow key navigation
- Calculator textarea lacks `aria-label`

## Color and Contrast

### Theme Contrast Ratios

LineSolv offers 5 UI styles and 27 built-in themes. The Material 3 style implements proper state layers with hover, focus, and press opacity feedback.

Each of the 27 built-in themes is designed to meet WCAG 2.1 AA contrast requirements:

| Content Type                     | Minimum Ratio               |
| -------------------------------- | --------------------------- |
| Normal text (< 18pt)             | 4.5:1                       |
| Large text (18pt+ or 14pt+ bold) | 3:1                         |
| UI components and borders        | 3:1                         |
| Focus indicators                 | 3:1 against adjacent colors |

### Color as Information

Color is never the sole means of conveying information. Error states include text labels alongside color changes.

### CVD-Safe Status Tokens

All 27 built-in themes include standardized CVD-safe (color-vision-deficiency safe) status tokens — `--color-error`, `--color-success`, `--color-warning`, `--color-info` — that use luminance-safe color pairs with sufficient contrast against both dark and light surfaces. These ensure status indicators are distinguishable by users with protanopia, deuteranopia, and tritanopia.

## Visual Accommodations

### Text Scaling

The calculator textarea supports configurable font size (10–32px) via the settings slider. The overall application UI uses fixed pixel dimensions and does not currently support OS-level text scaling.

### Reduced Motion

Respects the `prefers-reduced-motion` media query. Animations are disabled when the user's operating system requests reduced motion. An explicit toggle is also available in Settings > General > Appearance.

### High Contrast Mode

The `forced-colors` media query is not yet implemented. Custom toggle switches, theme cards, and other styled elements may become invisible in Windows High Contrast Mode.

## Current Known Limitations

| Issue                                                                                                                                                   | Status              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Tab key inserts spaces in textarea, preventing standard focus navigation out of the editor                                                              | Known limitation    |
| Custom toggle switches (Autocomplete, Animations, Toast, Line Numbers, Result Panel, Line Wrap) use `display:none` checkboxes — not keyboard accessible | Planned             |
| No `role="dialog"` or focus trapping in Settings, Shortcuts, or Confirm modals                                                                          | Planned             |
| No ARIA tab pattern on settings modal tabs                                                                                                              | Planned             |
| Autocomplete popup lacks ARIA combobox pattern (`role="listbox"`, `role="option"`)                                                                      | Planned             |
| Context menu items lack `role="menuitem"` and arrow key navigation                                                                                      | Planned             |
| Toast notifications not announced to screen readers (no `aria-live`)                                                                                    | Planned             |
| Graph panel chart has no text alternative for screen readers                                                                                            | Planned             |
| Font select dropdown lacks keyboard navigation and ARIA attributes                                                                                      | Planned             |
| No `forced-colors` CSS for Windows High Contrast Mode                                                                                                   | Planned             |
| Frameless window may not receive focus on initial activation (Wails limitation #3783)                                                                   | Under investigation |
| Theme contrast ratios not yet formally audited with automated tools                                                                                     | Planned for v1.0    |

## Feedback

Accessibility issues can be reported via:

- [GitHub Issues](https://github.com/rkriad585/LineSolv/issues) — tag with `accessibility` label
- Email: rkriad585

We aim to respond to accessibility reports within 5 business days.

## Testing Methodology

- **Automated**: axe-core, Lighthouse accessibility audit
- **Manual**: keyboard-only testing, screen reader walkthroughs
- **Cadence**: each major release

## Revision History

| Date       | Version | Changes                                                                                                 |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------- |
| 2026-07-16 | 1.3     | Added CVD-safe status tokens, tinted gray scale; updated to 27 themes and 5 UI styles                   |
| 2026-07-15 | 1.2     | Added Ctrl+J, Ctrl+` shortcuts; documented "..." dropdown menu ARIA, splash screen, new toggle switches |
| 2026-07-15 | 1.1     | Updated to match actual implementation; added known limitations                                         |
| 2026-07-12 | 1.0     | Initial accessibility statement                                                                         |
