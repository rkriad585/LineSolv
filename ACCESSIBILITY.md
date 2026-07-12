# Accessibility Statement — LineSolv

LineSolv is committed to making its calculator accessible to all users, including those who rely on assistive technologies.

## Standards Conformance

- **Target**: WCAG 2.1 Level AA
- **Framework**: WAI-ARIA 1.2 Authoring Practices
- **Principles**: Perceivable, Operable, Understandable, Robust

## Keyboard Accessibility

### Global Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next interactive element |
| `Shift+Tab` | Move focus to previous element |
| `Enter` | Activate buttons, submit calculation |
| `Space` | Toggle checkboxes and switches |
| `Escape` | Close sidebar panels, dismiss errors |
| `Arrow keys` | Navigate within sidebar tabs and history list |

### Navigation Order

Default tab order flows as: title bar controls → calculation textarea → results panel → sidebar tabs → sidebar panel content.

### Component Keyboard Patterns

- **Sidebar tabs**: Arrow keys move between tabs, Enter/Space activates, Tab moves into active panel content
- **Textarea**: Standard textarea keyboard behavior with line-based navigation
- **Window controls**: Tab to reach, Enter to activate
- **Theme selector**: Arrow keys within radio group
- **Settings toggles**: Enter or Space to toggle

## Screen Reader Support

### Tested Assistive Technologies

- NVDA + Chrome/Edge (Windows)
- VoiceOver + Safari (macOS)
- Narrator + Edge (Windows)
- Orca + Firefox (Linux)

### ARIA Implementation

- Live regions for results and errors
- Landmark roles for page structure
- Tab pattern for sidebar navigation
- Label associations for all inputs

## Color and Contrast

### Theme Contrast Ratios

Each of the 7 built-in themes is designed to meet WCAG 2.1 AA contrast requirements:

| Content Type | Minimum Ratio |
|-------------|---------------|
| Normal text (< 18pt) | 4.5:1 |
| Large text (18pt+ or 14pt+ bold) | 3:1 |
| UI components and borders | 3:1 |
| Focus indicators | 3:1 against adjacent colors |

### Color as Information

Color is never the sole means of conveying information. Error states include text labels and icons alongside color changes.

## Visual Accommodations

### Text Scaling

The interface supports text scaling up to 200% without loss of functionality. Layout uses flexible sizing that adapts to enlarged text.

### Reduced Motion

Respects the `prefers-reduced-motion` media query. Animations are disabled when the user's operating system requests reduced motion.

### High Contrast Mode

Supports the `forced-colors` media query for Windows High Contrast Mode. UI components remain visible and functional.

## Current Known Limitations

| Issue | Status |
|-------|--------|
| Frameless window may not receive focus on initial activation (Wails limitation #3783) | Under investigation |
| Some dynamically generated elements lack explicit ARIA labels | Planned for next release |
| Graph panel chart is not fully accessible to screen readers | Planned for next release |
| Theme contrast ratios not yet formally audited with automated tools | Planned for v1.0 |

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

| Date | Version | Changes |
|------|---------|---------|
| 2026-07-12 | 1.0 | Initial accessibility statement |
