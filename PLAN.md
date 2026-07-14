# PLAN.md — Keyword Autocompletion for LineSolv

## Project Summary
LineSolv is a cross-platform desktop natural-language calculator built with Go 1.24.1, Wails v2.12.0, and vanilla TypeScript. It has 52 builtin functions, 30 constants, 154 unit names, dynamic plugin-loaded functions, and user-defined variables — all of which users must type from memory. Adding an autocomplete popup as the user types will significantly improve discoverability and UX.

---

## Research Findings

### External (industry patterns)
- Most code editors and scientific calculators show autocomplete after 1–2 characters
- Prefix matching is standard; fuzzy matching adds complexity with marginal benefit for a ~250-item list
- Category labels (function/unit/constant) help users disambiguate similar names
- Keyboard-first navigation (↑/↓ Enter Esc) is expected in developer-oriented tools

### Internal (codebase analysis)
- **82 function/constant identifiers** in `app/calculator/functions.go` (switch `callBuiltinOrPlugin`)
- **154 unit keys** in `app/calculator/units.go` (map `unitDB`)
- **User-defined variables** stored in `Engine.variables` (dynamic, per-session)
- **Plugin-provided functions** loaded at runtime from `plugin.json` manifests
- `CalculatorInput.ts` — textarea-based input, no existing autocomplete UI
- `CalculatorStore` — reactive state store, no autocomplete state yet
- `App.ts` — main app, handles keyboard shortcuts and input submission
- Wails bindings expose Go methods to frontend via `window.runtime`

### Autocomplete Candidate Inventory
| Category | Count | Source |
|----------|-------|--------|
| Builtin functions (including aliases) | 52 | `functions.go` |
| Constants (including aliases) | 30 | `functions.go` |
| Unit names | 154 | `units.go` |
| User-defined variables | dynamic | `Engine.variables` |
| Plugin-loaded functions | dynamic | `PluginManager` |
| **Total (static)** | **236** | |
| **Total (with dynamic)** | **236 + V + P** | |

---

## Architecture Decision

**Option chosen: Backend-served dynamic keyword list via Wails binding**

A single Go method `GetAutocompleteKeywords()` on the `App` struct returns all available keywords. This is the right choice because:
- Plugin-loaded functions are included dynamically (no stale hardcoded list)
- User-defined variables are included per-session
- Single source of truth — no Go/TS duplication
- Wails binding overhead is negligible for a ~250-item list fetched once per session

**Frontend caches** the list on init and re-fetches only when plugins are loaded/unloaded or variables change (via existing store subscription).

---

## UI Design

### Behavior
1. **Trigger**: Show popup when user types 1+ characters and cursor is at a word boundary (start of line, after space, after `(`, after operator, after `,`)
2. **Filter**: Case-insensitive prefix match against keyword names
3. **Position**: Overlay `<div>` positioned below the textarea at the cursor's pixel location (using the existing `measureEl` technique from `CalculatorInput.ts`)
4. **Keyboard**: ↑/↓ navigate, Enter/Tab selects, Escape dismisses, any other key updates filter
5. **Selection**: 
   - Functions: replace typed prefix with `name()` and place cursor inside parens
   - Constants/units/variables: replace typed prefix with `name` and place cursor after
6. **Dismiss**: On blur, Escape, or after selection

### Visual
- Dark popup matching app theme (`var(--surface)` background, `var(--text)` text)
- Max 8 visible items, scrollable
- Each item shows: name (bold match portion highlighted), category badge, optional description
- Subtle border + shadow, rounded corners
- Currently highlighted item has `var(--accent)` background

---

## Phased Implementation

### Phase 1: Backend — Autocomplete Keyword Endpoint
**Objective**: Go method that returns all autocomplete candidates

**Files to modify:**
- `app/service/app.go` — add `AutocompleteItem` struct + `GetAutocompleteKeywords()` method

**Tasks:**
- [ ] Define `AutocompleteItem` struct: `{ Name string, Category string, Description string }`
- [ ] Implement `GetAutocompleteKeywords()` that:
  - Collects all 82 function/constant names from the engine's known list (hardcoded in Go, mirrors `functions.go` switch)
  - Collects all 154 unit names from `unitDB`
  - Collects user-defined variables from `Engine.variables`
  - Collects plugin-provided function names from `PluginManager`
  - Returns deduplicated `[]AutocompleteItem`
- [ ] Add descriptions for each function (e.g. `sin` → "Sine of angle (radians)", `km` → "Kilometer (length)")
- [ ] Run `go build -tags webkit2_41 ./...` to verify

**Dependencies:** None

---

### Phase 2: Frontend Types & Store
**Objective**: TypeScript types and store state for autocomplete

**Files to modify:**
- `frontend/src/types.ts` — add `AutocompleteItem` interface
- `frontend/src/stores/calculator.ts` — add autocomplete state
- `frontend/src/wails.d.ts` — add `GetAutocompleteKeywords` to WailsRuntime

**Tasks:**
- [ ] Add `AutocompleteItem` interface to `types.ts`
- [ ] Add to `CalculatorStore`:
  - `autocompleteItems: AutocompleteItem[]`
  - `autocompleteVisible: boolean`
  - `autocompleteIndex: number`
  - `autocompleteFilter: string`
  - `setAutocompleteItems(items)`, `setAutocompleteVisible(visible)`, `setAutocompleteIndex(index)`, `setAutocompleteFilter(filter)`
- [ ] Add `GetAutocompleteKeywords(): Promise<AutocompleteItem[]>` to `WailsRuntime` in `wails.d.ts`

**Dependencies:** Phase 1

---

### Phase 3: Autocomplete Popup Component
**Objective**: Render the dropdown overlay

**New file:**
- `frontend/src/components/AutocompletePopup.ts`

**Tasks:**
- [ ] Create `AutocompletePopup` class:
  - `el: HTMLDivElement` — the popup container
  - `items: AutocompleteItem[]` — current filtered results
  - `selectedIndex: number` — currently highlighted item
  - `show(anchorRect, items, selectedIndex)` — position and display
  - `hide()` — hide popup
  - `updateItems(items, selectedIndex)` — update list without repositioning
  - `onSelect: (item: AutocompleteItem) => void` — callback when item selected
- [ ] Render each item with:
  - Name (with match prefix bolded)
  - Category badge (function/constant/unit/variable/plugin) with distinct color
  - Description text (truncated)
- [ ] Handle click events on items
- [ ] Handle scroll within popup (max height 240px, overflow-y auto)
- [ ] Style to match app theme using CSS variables

**Dependencies:** Phase 2

---

### Phase 4: Input Integration
**Objective**: Wire autocomplete to the textarea input

**Files to modify:**
- `frontend/src/components/CalculatorInput.ts` — detect word boundaries, expose cursor position
- `frontend/src/App.ts` — orchestrate autocomplete lifecycle

**Tasks:**
- [ ] In `CalculatorInput.ts`:
  - Add `getCursorWord(): { word: string, start: number, end: number }` — extracts the word being typed at cursor position
  - Add `getCursorPixelPos(): { x: number, y: number }` — returns pixel position of cursor for popup placement (using existing `measureEl`)
  - Add `replaceWord(start, end, replacement: string)` — replaces the word and repositions cursor
  - Expose `textarea.addEventListener('input', ...)` for autocomplete trigger
- [ ] In `App.ts`:
  - On init: fetch keywords from backend via `GetAutocompleteKeywords()`, cache in store
  - On textarea input: if 1+ chars typed at word boundary, filter keywords, show popup
  - On textarea keydown: handle ArrowUp/ArrowDown/Enter/Tab for popup navigation/selection
  - On selection: replace word in textarea, hide popup, focus textarea
  - On Escape or blur: hide popup
  - Re-fetch keywords when plugins are loaded/unloaded

**Dependencies:** Phase 3

---

### Phase 5: Styling & Polish
**Objective**: Theme-consistent styling and edge cases

**Files to modify:**
- `frontend/src/style.css` — add autocomplete popup styles
- `frontend/src/components/AutocompletePopup.ts` — refinements

**Tasks:**
- [ ] Add CSS for `.autocomplete-popup`:
  - Position fixed/absolute, z-index above all panels
  - Background: `var(--surface)`, border: `1px solid var(--border)`, border-radius: 8px
  - Box-shadow for depth
  - Item hover: `var(--surface-hover)`, selected: `var(--accent)` with white text
  - Category badges: small pill with distinct colors per category
  - Scrollbar styling matching app theme
- [ ] Handle edge cases:
  - Popup flipped above textarea when near bottom of window
  - Popup hidden when textarea is empty or cursor is mid-expression (not at word boundary)
  - No popup when only 0 matches found
  - Single match: still show popup (user may want to see description)
  - Multiple aliases for same function: show primary name, mark alias
- [ ] Match font: monospace, same size as textarea

**Dependencies:** Phase 4

---

### Phase 6: Plugin & Variable Dynamic Updates
**Objective**: Keep autocomplete list in sync with runtime state

**Files to modify:**
- `frontend/src/App.ts` — re-fetch on plugin load/unload
- `frontend/src/stores/calculator.ts` — notify on variable changes

**Tasks:**
- [ ] After plugin load/unload in `App.ts`, re-fetch `GetAutocompleteKeywords()` and update store
- [ ] After variable assignment (e.g. `x = 5`), re-fetch or merge new variable into cached list
- [ ] Debounce re-fetches (max once per 500ms) to avoid spam during rapid plugin loads

**Dependencies:** Phase 5

---

### Phase 7: Tests
**Objective**: Unit tests for autocomplete logic

**New file:**
- `frontend/src/components/autocomplete.test.ts`

**Tasks:**
- [ ] Test `getCursorWord()` with various cursor positions and expressions
- [ ] Test filtering logic: prefix match, case insensitivity, empty filter
- [ ] Test selection behavior: function with parens, constant without, variable
- [ ] Test keyboard navigation: index wrapping, Enter/Tab/Escape
- [ ] Test popup positioning: flips above when near bottom
- [ ] Test dynamic updates: plugin load adds new items, variable assignment adds items

**Dependencies:** Phase 6

---

### Phase 8: Version Bump & Docs
**Objective**: Ship the feature with proper versioning

**Files to modify:**
- `.version`, `wails.json`, `app/service/app.go`, `frontend/package.json`, `frontend/package-lock.json`, `README.md`, `docs/*.md`, `CHANGELOG.md`

**Tasks:**
- [ ] Bump version to 0.13.0 (new feature)
- [ ] Update CHANGELOG.md
- [ ] Update README.md features section
- [ ] Update docs if applicable

**Dependencies:** Phase 7

---

## Prioritization

| Phase | Value | Effort | Priority |
|-------|-------|--------|----------|
| 1 — Backend endpoint | High | Low | Must-have |
| 2 — Frontend types/store | High | Low | Must-have |
| 3 — Popup component | High | Medium | Must-have |
| 4 — Input integration | High | High | Must-have |
| 5 — Styling/polish | Medium | Medium | Must-have |
| 6 — Dynamic updates | Medium | Low | Should-have |
| 7 — Tests | High | Medium | Must-have |
| 8 — Version/docs | Low | Low | Must-have |

---

## Risks & Mitigations
- **Popup positioning with word wrap**: Use existing `measureEl` technique from `CalculatorInput.ts` to compute cursor pixel position accurately
- **Performance with 250+ items**: Prefix filtering is O(n) with early exit — negligible. DOM rendering limited to max 8 visible items via virtual scrolling or simple slice
- **Plugin dynamic loading**: Re-fetch on plugin events with debounce to avoid stale data without spamming backend
- **Mobile/responsive**: Not applicable — this is a desktop Wails app

---

## Completion Criteria
- Typing in the textarea shows a filtered autocomplete popup after 1+ characters
- All 236+ keywords (functions, constants, units) are discoverable via autocomplete
- User-defined variables and plugin functions appear dynamically
- Keyboard navigation works (↑/↓ Enter Tab Escape)
- Selection inserts the keyword correctly (functions get `()`)
- Popup matches app theme
- All existing tests pass, new tests added
- Version bumped to 0.13.0
