# LineSolv Settings Overhaul & Live Reload — PLAN.md

## Project Summary

LineSolv is a cross-platform desktop natural-language calculator built with Go 1.24.1 + Wails v2.12.0 + vanilla TypeScript. This plan covers expanding the settings system with new General tab options, adding font variety, implementing proper CSS animations, and fixing the live-reload problem so settings/plugin changes take effect without app restart.

---

## Research Findings

### Current Settings State
- **Storage**: TOML config at `~/.config/neostore/linesolv/config.toml`, custom hand-rolled parser
- **Current fields**: `theme`, `font_size`, `font_family`, `shortcut_overrides` (4 fields in `SettingsData`)
- **Config struct** (`app/storage/config.go:10-27`): has `[app]`, `[notes]`, `[behavior]`, `[settings]` sections
- **Frontend type** (`frontend/src/types.ts:37-42`): `SettingsData` with 4 fields
- **Modal** (`SettingsModal.ts`): 4 tabs — General, Theme, Keyboard Shortcuts, About; General has only font family + font size + preview
- **Apply mechanism**: `save()` calls `SaveSettings()` (persists to disk) then `onApply()` callback (applies in-memory). Theme and font apply live; everything else needs restart.
- **Startup init** (`App.ts:833-861`): loads settings from backend, calls `applyTheme()` + `applyFontSettings()`

### Current Animations State
- **Only 1 keyframe**: `@keyframes spin` for loading spinners
- **Global transition**: `button, .panel-toggle, .note-item, aside, ... { transition: background 0.15s ease, border-color 0.15s ease; }` — only 2 properties
- **Panel open/close**: Width-based slide via `transition-all duration-150 ease-out` (Tailwind class) — panels slide from width 0 to target width
- **Modal open/close**: Instant `display: none` <-> `display: flex` — **no animation at all**
- **Theme switching**: Instant class swap — subtle background crossfade from global transition only
- **Toast**: Slide-in from right + fade (0.25s) — already has proper animation

### Current Font State
- 5 font family options (monospace, serif, sans-serif, Georgia, Courier New)
- System UI font for chrome, `--calc-font-family` CSS var for calculator area
- No web font loading — all system fonts

### Current Autocomplete State
- Always active — no toggle exists
- `AutocompletePopup` class manages everything; `CalculatorStore` has unused autocomplete fields
- Triggered by `updateAutocomplete()` on every keystroke in `App.ts`
- Keywords fetched from backend `GetAutocompleteKeywords()`

### Current Plugin Live Reload State
- No filesystem hot-reload (no fsnotify/inotify)
- Plugins re-scanned only on: startup, explicit toggle, install/remove
- `onPluginsChanged` callback triggers `scheduleKeywordRefresh()` (500ms debounce)
- `registerPluginFunctions()` does full clear + re-register — safe to call anytime
- Frontend refresh button only re-fetches remote index, does NOT trigger backend rescan

### Wails Window API
- `WindowSetBackgroundColour(ctx, R, G, B, A)` — changes window background RGBA (JS: `WindowSetBackgroundColour(R, G, B, A)`)
- Window already has `BackgroundColour: RGBA{0,0,0,0}` and `WindowIsTranslucent: true`
- No direct `SetOpacity` API — opacity control via CSS `opacity` on body element is the correct approach for webview content transparency

---

## Improvement Opportunities

### New Features
1. Autocomplete on/off toggle (settings + keyboard shortcut)
2. App opacity/transparency slider (General settings)
3. Animations on/off toggle (General settings)
4. Toast notifications on/off toggle (General settings)
5. Expanded font library (15+ fonts including developer-focused mono fonts)
6. Live reload for all settings changes (no restart needed)
7. Live reload for plugin changes (backend rescan from frontend)

### Feature Enhancements
8. Proper CSS animations for modals (fade + scale)
9. Proper CSS animations for settings save (checkmark animation)
10. Theme transition animation (smooth color crossfade)

### Code Quality
11. Consolidate settings into a single reactive store
12. Add settings change event system (pub/sub pattern)

---

## Development Roadmap

### Phase 1: Settings Infrastructure (Foundation)
**Objective**: Build a proper settings store with reactive change propagation

- [x] **1.1** Create `frontend/src/stores/settings.ts` — reactive settings store with all current + new fields
  - Fields: `theme`, `font_size`, `font_family`, `shortcut_overrides`, `autocomplete_enabled`, `animations_enabled`, `toast_enabled`, `opacity`, `line_numbers_enabled`
  - Methods: `load()`, `update(partial)`, `save()`, `scheduleSave()`, `onChanged(callback)`
- [x] **1.2** Update `frontend/src/types.ts` — expand `SettingsData` interface with new fields
- [x] **1.3** Update `app/service/app.go` — expand Go `SettingsData` struct with new fields, update `GetSettings()` and `SaveSettings()`
- [x] **1.4** Update `app/storage/config.go` — add new fields to `Config.Settings` struct, update `DefaultConfig()`, `parseConfigTOML()`, `SaveConfig()`
- [x] **1.5** Wire `App.ts` to use the new settings store — replace scattered `applyTheme`/`applyFontSettings` calls with store subscriptions

**Dependencies**: None
**Files touched**: `stores/settings.ts` (new), `types.ts`, `app.go`, `config.go`, `App.ts`

---

### Phase 2: Autocomplete Toggle
**Objective**: Let users turn autocomplete on/off from settings, default ON

- [x] **2.1** Add `autocomplete_enabled` to settings store (default: `true`)
- [x] **2.2** Guard `updateAutocomplete()` in `App.ts` — early return + hide popup if disabled
- [x] **2.3** Guard `scheduleKeywordRefresh()` — skip if autocomplete disabled
- [x] **2.4** Guard keydown handler (arrows/enter/tab) — skip if autocomplete disabled
- [x] **2.5** Hide popup immediately when toggled off mid-session

**Dependencies**: Phase 1
**Files touched**: `App.ts`, `stores/settings.ts`

---

### Phase 3: General Settings Tab Expansion
**Objective**: Add opacity, animations toggle, toast toggle, line numbers toggle, and more to General tab

- [x] **3.1** Opacity slider (0.3 — 1.0, default 0.95)
  - Add slider control to `SettingsModal.ts` General tab
  - Apply via `document.body.style.background = rgba(r,g,b,opacity)` on change (live preview)
  - Persist in config as `opacity` string (e.g. `"0.95"`)
  - On startup, apply in `App.ts` init
- [x] **3.2** Animations toggle (default: ON)
  - Add toggle switch to General tab
  - When OFF: add `animations-disabled` class to `<html>` element
  - CSS: `.animations-disabled * { transition-duration: 0ms !important; animation-duration: 0ms !important; }`
  - When ON: remove the class
  - Persist in config as `animations_enabled` string (`"true"`/`"false"`)
- [x] **3.3** Toast notifications toggle (default: ON)
  - Add toggle switch to General tab
  - When OFF: `toast.show()` becomes a no-op
  - Persist in config as `toast_enabled` string
- [x] **3.4** Autocomplete toggle in General tab UI
  - Add toggle switch for `autocomplete_enabled`
- [x] **3.5** Update `SettingsModal.ts` General tab layout — reorganize into sections: "Calculator", "Appearance", "Behavior"
- [x] **3.6** Line numbers toggle (default: ON)
  - Add toggle switch in General > Behavior section
  - Wire to `CalculatorInput.setLineNumbersVisible()` to show/hide gutter
  - Persist in config as `line_numbers_enabled` string

**Dependencies**: Phase 1, Phase 2
**Files touched**: `SettingsModal.ts`, `toast.ts`, `App.ts`, `style.css`

---

### Phase 4: Font Expansion
**Objective**: Add 15+ font options including developer-focused monospace fonts

- [x] **4.1** Add Google Fonts `<link>` preload to `index.html` for: JetBrains Mono, Fira Code, Source Code Pro, IBM Plex Mono, Cascadia Code, Ubuntu Mono, Hack, Victor Mono, Space Mono, Overpass, Inter, JetBrains Sans
- [x] **4.2** Update `SettingsModal.ts` font family dropdown — expand from 5 to 17 options organized by category:
  - **Sans-Serif**: System Default, Inter, Overpass, Ubuntu
  - **Serif**: Georgia, Times New Roman, Playfair Display
  - **Monospace**: System Mono, JetBrains Mono, Fira Code, Source Code Pro, IBM Plex Mono, Cascadia Code, Hack, Victor Mono, Space Mono, Courier New
- [x] **4.3** Update preview section to show the selected font live
- [x] **4.4** Ensure font loading doesn't block UI — use `font-display: swap` in the Google Fonts CSS import

**Dependencies**: None (can run parallel with Phase 1)
**Files touched**: `frontend/index.html`, `SettingsModal.ts`, `style.css`

---

### Phase 5: Proper CSS Animations
**Objective**: Implement smooth animations for modals, panels, theme switching, and settings save

- [ ] **5.1** Modal open/close animation
  - Replace `display: none/flex` toggle with CSS transition
  - Add opacity + scale(0.95) -> opacity:1 + scale(1) transition (150ms ease-out)
  - Add opacity + scale(1) -> opacity:0 + scale(0.95) transition on close (100ms ease-in)
  - Apply to: SettingsModal, ShortcutModal, ConfirmDialog, DocsViewer
- [ ] **5.2** Theme switch animation
  - Add CSS transition on `background-color`, `color`, `border-color` for `html`, `body`, `#notepad`, `#results-column`, and all panel elements
  - Duration: 300ms ease — noticeable but not sluggish
- [ ] **5.3** Settings save success animation
  - Add a subtle checkmark animation or button color flash on successful save
- [ ] **5.4** Panel open/close polish
  - Current `transition-all duration-150` is decent — add `opacity` to the transition for a fade+slide effect
  - Ensure `overflow: hidden` prevents content flash during animation
- [ ] **5.5** Global animation class system
  - CSS variables for animation durations: `--anim-duration-fast: 100ms`, `--anim-duration-normal: 200ms`, `--anim-duration-slow: 300ms`
  - `.animations-disabled` class overrides all to `0ms`

**Dependencies**: Phase 3 (animations toggle)
**Files touched**: `style.css`, `SettingsModal.ts`, `ShortcutModal.ts`, `ConfirmDialog.ts`, `DocsViewer.ts`, `NotesPanel.ts`, `HistoryPanel.ts`, `StepsPanel.ts`, `VariableExplorer.ts`

---

### Phase 6: Live Reload System
**Objective**: Settings and plugin changes apply immediately without app restart

- [x] **6.1** Settings live reload
  - Expand `onApply` callback in `App.ts` to handle ALL settings fields (not just theme + font)
  - Opacity: apply `document.body.style.background = rgba(r,g,b,opacity)` immediately for full-window translucency
  - Animations: toggle `.animations-disabled` class on `<html>` immediately
  - Toast: update toast module's enabled flag immediately
  - Autocomplete: update enabled flag, hide popup if disabled
  - Line numbers: toggle gutter visibility immediately
- [x] **6.2** Plugin live reload
  - Add `ReloadPlugins()` backend method that does: `Scan()` + `registerPluginFunctions()`
  - Frontend: PluginPanel refresh button calls backend rescan + re-injects plugin themes + refreshes keywords
- [x] **6.3** Startup settings application
  - On app init, load settings from backend and apply ALL fields through the same `applySettingsState()` function used for live reload
  - This ensures startup behavior matches runtime behavior

**Dependencies**: Phase 1, Phase 2, Phase 3
**Files touched**: `App.ts`, `app/service/app.go`, `PluginPanel.ts`

---

### Phase 7: Testing & Polish
**Objective**: Ensure all new features work, tests pass, and UX is consistent

- [x] **7.1** Add unit tests for `stores/settings.ts` — load, update, save, onChanged
- [x] **7.2** Update `result-display.test.ts` if border-left removal affected selectors
- [x] **7.3** Test autocomplete toggle — enable/disable, popup behavior, keyword refresh
- [x] **7.4** Test settings live reload — opacity, animations, toast, font, theme
- [x] **7.5** Test plugin live reload — install, toggle, remove, rescan
- [x] **7.6** Test modal animations — open/close on all modals
- [x] **7.7** Run `npm run lint` (ESLint v9 flat config) — fix any new warnings
- [x] **7.8** Run `npx vitest run` — all tests must pass (108+ tests)
- [x] **7.9** Run `wails build -tags "webkit2_41"` — verify build passes
- [x] **7.10** Real-time settings: removed Save button, all controls auto-save on change with 300ms debounce
- [x] **7.11** Line numbers toggle: added to General > Behavior, wired to CalculatorInput gutter
- [x] **7.12** Full-window opacity: body background set to rgba for true window translucency

**Dependencies**: All previous phases
**Files touched**: Various test files, lint config

---

## Implementation Priority

| Order | Phase | Value | Effort | Dependencies |
|-------|-------|-------|--------|--------------|
| 1 | Phase 1: Settings Infrastructure | High | Medium | None |
| 2 | Phase 2: Autocomplete Toggle | High | Low | Phase 1 |
| 3 | Phase 3: General Settings Expansion | High | Medium | Phase 1, 2 |
| 4 | Phase 4: Font Expansion | Medium | Low | None |
| 5 | Phase 5: Proper CSS Animations | Medium | Medium | Phase 3 |
| 6 | Phase 6: Live Reload System | High | Medium | Phase 1, 2, 3 |
| 7 | Phase 7: Testing & Polish | High | Medium | All |

---

## Risks & Considerations

1. **Font loading performance**: Google Fonts require network requests. Mitigate with `font-display: swap` and preload links. Consider offering a "Use system fonts only" option.
2. **Opacity on Windows**: Wails v2 `WindowSetBackgroundColour` on Windows only supports alpha 0 or 255. CSS-level `opacity` on body is the correct cross-platform approach.
3. **Config migration**: New fields use `DefaultConfig()` fallback — existing configs won't break. Missing keys get defaults on load.
4. **Animation performance**: Keep animations to `opacity` and `transform` only (GPU-composited). Avoid animating `width`, `height`, `background-color` where possible.
5. **Plugin rescan cost**: Full `Scan()` re-reads all plugin directories. For 12 plugins this is negligible. If plugin count grows, consider incremental rescan.

---

## Rollback Notes

- If settings infrastructure breaks: revert `stores/settings.ts`, restore scattered apply calls in `App.ts`
- If animations cause issues: add `animations-disabled` to `:root` class by default, or remove the `.animations-disabled` CSS block
- If font loading fails: remove Google Fonts `<link>` from `index.html`, keep system font options only
- If live reload causes state bugs: fall back to `WindowReloadApp()` as nuclear option for settings that can't apply live
