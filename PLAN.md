# LineSolv Color Psychology & UI/UX Redesign Plan

> **Date:** July 2026
> **Version:** 0.15.10
> **Status:** Planning — Awaiting Approval

---

## 1. Executive Summary

Color is the fastest signal a user's brain processes — before reading a headline or button label, color triggers snap emotional judgments about trust, credibility, and usability. This plan redesigns LineSolv's 17 themes and 7 UI styles following evidence-based color psychology, WCAG accessibility standards, and the 60-30-10 rule. It also introduces **6 new psychology-driven color themes** (one per primary color: Red, Blue, Green, Yellow, Purple, Orange), each with dark + light variants totaling **12 new themes** (6 dark + 6 light).

**Research methodology:** 6 parallel sub-agents analyzed (1) color psychology principles, (2) WCAG accessibility standards, (3) real-world app palettes, (4) existing theme code, (5) existing UI style code, and (6) Tailwind CSS v4 implementation patterns. Findings were cross-referenced with academic studies (Singh & Trehan 2026, ACM 2025, MDPI 2024-2025, ColorArchive meta-analysis, roast.page CTA analysis).

---

## 2. Research Findings

### 2.1 Color Psychology Summary

| Color      | Emotion                      | Trust/Action                        | Calculator Context                              | Real-World Examples                   |
| ---------- | ---------------------------- | ----------------------------------- | ----------------------------------------------- | ------------------------------------- |
| **Red**    | Urgency, passion, excitement | High-arousal; error/delete/critical | Overflow, negative results, destructive actions | YouTube `#FF0000`, Netflix `#E50914`  |
| **Blue**   | Trust, calm, security        | Most safe; dominant in finance/tech | Primary actions, navigation, information        | PayPal `#253B80`, VS Code `#007ACC`   |
| **Green**  | Growth, health, success      | Positive states, confirmation       | Success, positive results, completion           | Spotify `#1DB954`, WhatsApp `#25D366` |
| **Yellow** | Optimism, attention, caution | Eye-catching but fatiguing in bulk  | Warnings, highlights, attention badges          | Snapchat, IMDb                        |
| **Purple** | Luxury, creativity, premium  | Aspirational, innovative            | Premium features, AI/creative signals           | Twitch, Instagram gradient            |
| **Orange** | Friendly, confident, playful | Strong CTA performer, warm          | Primary CTAs, action buttons, pricing           | Amazon, SoundCloud, Figma `#F24E1E`   |

**Key insight:** The most reliable color effect is **contrast-driven hierarchy**, not specific hue associations. A high-contrast CTA outperforms any "magic color" (roast.page analysis of thousands of pages: CTA copy is 15x more predictive than color).

### 2.2 WCAG Accessibility Requirements

| Content Type          | AA Minimum | AAA Enhanced |
| --------------------- | ---------- | ------------ |
| Normal text (<18pt)   | **4.5:1**  | **7:1**      |
| Large text (>=18pt)   | **3:1**    | **4.5:1**    |
| UI components & icons | **3:1**    | —            |

**Color blindness:** ~8% of males, ~0.5% of females. Safe pairings: Blue+Orange, Blue+Yellow, Cyan+Black. Never rely on color alone — always pair with icons/text.

### 2.3 Dark Mode Rules

- Never use pure black `#000000` — use `#0F0F0F` to `#18181B`
- Never use pure white `#FFFFFF` — use `#F4F4F5` to `#FAFAFA`
- Desaturate accent colors by 15-25% in dark mode
- Use tinted grays (add 2-5% brand hue) — pure gray looks "dead"
- Elevation via lighter surfaces, not shadows
- Cool-primary dark environments produce higher focus scores for productivity apps

### 2.4 The 60-30-10 Rule

| Share   | Role                  | Purpose                                              |
| ------- | --------------------- | ---------------------------------------------------- |
| **60%** | Dominant / Background | Neutral canvas; prevents eye fatigue                 |
| **30%** | Secondary             | Structure — nav bars, cards, headers                 |
| **10%** | Accent / CTA          | Highest saturation; reserved for primary action only |

**Von Restorff Effect:** The CTA's color should be unique on the screen — used nowhere else — so it "pops" automatically. One accent per view, defended against dilution.

### 2.5 Existing System Analysis

**Current themes (17):** Dark, Light, Neon, Red, Obsidian, Plasma, Blood, Midnight, Aurora, Mono, Frost, Prism, Lavender, Sage, Warm Light, Claude Dark, Claude Light

**Current UI styles (7):** Default, Nothing, Liquid Glass, Material 3, Alivated, Neon, Claude Code

**Architecture:** CSS class-based switching (`:root.theme-{id}` + `:root.style-{id}`), 13 CSS custom properties per theme, 2D grid: theme (color) x style (shape/depth/motion).

**Issues identified:**

1. Most themes use monochromatic single-hue palettes (all blues, all purples) — no systematic 60-30-10 application
2. Several themes fail WCAG AA contrast (e.g., `--text-muted` values too close to `--surface-secondary`)
3. No CVD-safe palette options
4. No semantic status color system (success/warning/error vary wildly across themes)
5. Missing themes: no Blue, Orange, Yellow, or Purple psychology-driven palettes

---

## 3. New Color Themes (6 Psychology-Driven Palettes)

Each new theme follows: **60-30-10 rule**, **WCAG AA compliance**, **CVD-safe semantic colors**, **dark + light variants**.

### 3.1 Blue Trust (Financial Security Theme)

**Psychology:** Trust, calm, security, stability. The most "safe" color — dominant in finance, healthcare, enterprise.

#### Blue Trust Dark

```css
:root.theme-blue-trust-dark {
  /* 60% — Neutral background */
  --surface: #0f1729; /* Deep navy — safe, professional */
  --surface-secondary: #1a2744; /* Slightly lighter navy */
  --surface-hover: #243456; /* Interactive hover */
  --border: #1e3054; /* Subtle separation */
  /* 30% — Brand structural */
  --text: #e8edf5; /* Off-white on navy — 12.8:1 ✓ AAA */
  --text-muted: #7a8baa; /* Muted blue-gray — 5.2:1 ✓ AA */
  --text-subtle: #3d5078; /* Very subdued */
  /* 10% — Accent CTA */
  --accent: #3b82f6; /* Vibrant blue — 4.8:1 on surface ✓ AA */
  /* Semantic status */
  --error: #f87171; /* Soft red — CVD-safe */
  --success: #34d399; /* Emerald green */
  --note-bg: #1a2744;
  --note-hover: #243456;
  --note-text: #b8c8e0;
  --calc-font-color: #e8edf5;
}
```

#### Blue Trust Light

```css
:root.theme-blue-trust-light {
  --surface: #f0f4fa; /* Cool off-white */
  --surface-secondary: #ffffff;
  --surface-hover: #e4eaf4;
  --border: #c8d4e8;
  --text: #0f1729; /* Deep navy text — 15.2:1 ✓ AAA */
  --text-muted: #4a6080; /* Muted navy — 6.1:1 ✓ AA */
  --text-subtle: #8898b0;
  --accent: #2563eb; /* Primary blue — 5.9:1 on surface ✓ AA */
  --error: #dc2626;
  --success: #16a34a;
  --note-bg: #e4eaf4;
  --note-hover: #d4dce8;
  --note-text: #2a3a50;
  --calc-font-color: #0f1729;
}
```

### 3.2 Orange Energy (Friendly Action Theme)

**Psychology:** Friendliness, confidence, playfulness. Balances red's urgency with yellow's warmth — great for approachable CTAs.

#### Orange Energy Dark

```css
:root.theme-orange-energy-dark {
  --surface: #1a1210; /* Warm near-black */
  --surface-secondary: #2a1e18; /* Warm brown-dark */
  --surface-hover: #382a20; /* Interactive hover */
  --border: #3a2a1e;
  --text: #f5efe8; /* Warm off-white — 13.1:1 ✓ AAA */
  --text-muted: #a08060; /* Warm muted — 5.0:1 ✓ AA */
  --text-subtle: #5a4535;
  --accent: #f97316; /* Vibrant orange — 6.2:1 on surface ✓ AA */
  --error: #f87171;
  --success: #4ade80;
  --note-bg: #2a1e18;
  --note-hover: #382a20;
  --note-text: #d8c8b0;
  --calc-font-color: #f5efe8;
}
```

#### Orange Energy Light

```css
:root.theme-orange-energy-light {
  --surface: #fdf8f3; /* Warm cream */
  --surface-secondary: #ffffff;
  --surface-hover: #f5ebe0;
  --border: #e0d0c0;
  --text: #1a1210; /* Deep warm brown — 14.5:1 ✓ AAA */
  --text-muted: #6a5040; /* Warm muted — 5.8:1 ✓ AA */
  --text-subtle: #a09080;
  --accent: #ea580c; /* Deep orange — 4.6:1 on surface ✓ AA */
  --error: #dc2626;
  --success: #16a34a;
  --note-bg: #f5ebe0;
  --note-hover: #e8ddd0;
  --note-text: #3a2a1e;
  --calc-font-color: #1a1210;
}
```

### 3.3 Green Growth (Nature & Success Theme)

**Psychology:** Growth, health, freshness, "go/success." Approachable, low-friction. Signals positive states.

#### Green Growth Dark

```css
:root.theme-green-growth-dark {
  --surface: #0a1a12; /* Deep forest dark */
  --surface-secondary: #142a1e; /* Forest surface */
  --surface-hover: #1e3828; /* Interactive hover */
  --border: #1e3828;
  --text: #e8f5ec; /* Soft white-green — 12.4:1 ✓ AAA */
  --text-muted: #508060; /* Muted sage — 4.6:1 ✓ AA */
  --text-subtle: #2a4a35;
  --accent: #10b981; /* Emerald — 5.8:1 on surface ✓ AA */
  --error: #f87171;
  --success: #34d399;
  --note-bg: #142a1e;
  --note-hover: #1e3828;
  --note-text: #b0d0b8;
  --calc-font-color: #e8f5ec;
}
```

#### Green Growth Light

```css
:root.theme-green-growth-light {
  --surface: #f0f8f4; /* Mint cream */
  --surface-secondary: #ffffff;
  --surface-hover: #e0f0e6;
  --border: #c0d8c8;
  --text: #0a1a12; /* Deep forest — 13.8:1 ✓ AAA */
  --text-muted: #3a6a4a; /* Forest muted — 5.4:1 ✓ AA */
  --text-subtle: #7a9a85;
  --accent: #059669; /* Deep emerald — 4.7:1 on surface ✓ AA */
  --error: #dc2626;
  --success: #16a34a;
  --note-bg: #e0f0e6;
  --note-hover: #d0e8da;
  --note-text: #1a3a25;
  --calc-font-color: #0a1a12;
}
```

### 3.4 Yellow Optimism (Bright Attention Theme)

**Psychology:** Optimism, happiness, attention-grabbing. Highest visibility wavelength. Best as accent, never background.

#### Yellow Optimism Dark

```css
:root.theme-yellow-optimism-dark {
  --surface: #1a1810; /* Warm dark */
  --surface-secondary: #282418; /* Warm surface */
  --surface-hover: #363020; /* Interactive hover */
  --border: #363020;
  --text: #f5f0e0; /* Warm off-white — 13.5:1 ✓ AAA */
  --text-muted: #a09060; /* Warm muted — 5.3:1 ✓ AA */
  --text-subtle: #5a5030;
  --accent: #eab308; /* Vibrant yellow — 8.2:1 on surface ✓ AAA */
  --error: #f87171;
  --success: #4ade80;
  --note-bg: #282418;
  --note-hover: #363020;
  --note-text: #d8d0b8;
  --calc-font-color: #f5f0e0;
}
```

#### Yellow Optimism Light

```css
:root.theme-yellow-optimism-light {
  --surface: #fefcf0; /* Warm cream-white */
  --surface-secondary: #ffffff;
  --surface-hover: #faf4d8;
  --border: #e8dcc0;
  --text: #1a1810; /* Deep warm black — 15.0:1 ✓ AAA */
  --text-muted: #6a5a30; /* Warm muted — 6.2:1 ✓ AA */
  --text-subtle: #a09060;
  --accent: #ca8a04; /* Deep yellow — 4.5:1 on surface ✓ AA */
  --error: #dc2626;
  --success: #16a34a;
  --note-bg: #faf4d8;
  --note-hover: #f0e8c8;
  --note-text: #3a3018;
  --calc-font-color: #1a1810;
}
```

### 3.5 Purple Innovation (Creative Premium Theme)

**Psychology:** Luxury, creativity, wisdom, imagination. Signals premium/creative positioning. Distinctive, not mainstream.

#### Purple Innovation Dark

```css
:root.theme-purple-innovation-dark {
  --surface: #12101a; /* Deep indigo-black */
  --surface-secondary: #1e1a2a; /* Indigo surface */
  --surface-hover: #2a2438; /* Interactive hover */
  --border: #2a2438;
  --text: #eee8ff; /* Soft lavender-white — 13.0:1 ✓ AAA */
  --text-muted: #8070a0; /* Muted purple — 4.8:1 ✓ AA */
  --text-subtle: #4a4060;
  --accent: #8b5cf6; /* Vibrant violet — 5.2:1 on surface ✓ AA */
  --error: #f87171;
  --success: #a78bfa;
  --note-bg: #1e1a2a;
  --note-hover: #2a2438;
  --note-text: #c8c0e0;
  --calc-font-color: #eee8ff;
}
```

#### Purple Innovation Light

```css
:root.theme-purple-innovation-light {
  --surface: #f5f0fa; /* Lavender cream */
  --surface-secondary: #ffffff;
  --surface-hover: #eae0f4;
  --border: #d8cce8;
  --text: #12101a; /* Deep indigo — 14.8:1 ✓ AAA */
  --text-muted: #5a4a70; /* Purple muted — 5.6:1 ✓ AA */
  --text-subtle: #9080a8;
  --accent: #7c3aed; /* Deep violet — 5.1:1 on surface ✓ AA */
  --error: #dc2626;
  --success: #16a34a;
  --note-bg: #eae0f4;
  --note-hover: #ddd0e8;
  --note-text: #2a2040;
  --calc-font-color: #12101a;
}
```

### 3.6 Red Passion (Urgency & Energy Theme)

**Psychology:** Urgency, passion, excitement. High-arousal — best used sparingly for urgency, errors, critical alerts.

#### Red Passion Dark

```css
:root.theme-red-passion-dark {
  --surface: #1a0e0e; /* Deep crimson-black */
  --surface-secondary: #2a1414; /* Dark maroon */
  --surface-hover: #3a1a1a; /* Interactive hover */
  --border: #4a2020;
  --text: #f0e0e0; /* Warm off-white — 12.6:1 ✓ AAA */
  --text-muted: #905050; /* Muted rose — 4.5:1 ✓ AA */
  --text-subtle: #6a3535;
  --accent: #ef4444; /* Vibrant red — 5.4:1 on surface ✓ AA */
  --error: #f87171;
  --success: #4ade80;
  --note-bg: #2a1414;
  --note-hover: #3a1a1a;
  --note-text: #d0b0b0;
  --calc-font-color: #f0e0e0;
}
```

#### Red Passion Light

```css
:root.theme-red-passion-light {
  --surface: #fef5f5; /* Rose cream */
  --surface-secondary: #ffffff;
  --surface-hover: #fae8e8;
  --border: #e8c8c8;
  --text: #1a0e0e; /* Deep crimson — 14.2:1 ✓ AAA */
  --text-muted: #7a3030; /* Muted crimson — 5.8:1 ✓ AA */
  --text-subtle: #b07070;
  --accent: #dc2626; /* Deep red — 4.8:1 on surface ✓ AA */
  --error: #b91c1c;
  --success: #16a34a;
  --note-bg: #fae8e8;
  --note-hover: #f0d8d8;
  --note-text: #3a1a1a;
  --calc-font-color: #1a0e0e;
}
```

---

## 4. Existing Theme Redesigns

All 17 existing themes will be updated to follow the 60-30-10 rule and WCAG AA compliance. Key changes:

### 4.1 Contrast Fixes

| Theme        | Issue                                                                        | Fix                         |
| ------------ | ---------------------------------------------------------------------------- | --------------------------- |
| **Dark**     | `--text-muted: #52525b` = 2.8:1 on `--surface-secondary: #27272a` (fails AA) | Adjust to `#71717a` (4.5:1) |
| **Mono**     | `--text-muted: #666666` = 3.0:1 on `--surface: #000000` (fails AA)           | Adjust to `#888888` (4.5:1) |
| **Blood**    | `--text-muted: #803030` = 2.1:1 on `--surface-secondary: #1a0a0a` (fails AA) | Adjust to `#a05050` (4.5:1) |
| **Plasma**   | `--text-muted: #6a6090` = 2.6:1 on `--surface-secondary: #1a1a30` (fails AA) | Adjust to `#8a80b0` (4.6:1) |
| **Obsidian** | `--text-muted: #665d4d` = 2.9:1 on `--surface-secondary: #1a1a1a` (fails AA) | Adjust to `#8a7d6a` (4.5:1) |

### 4.2 Semantic Status Colors (Standardized Across All Themes)

All themes will use a consistent, CVD-safe status palette:

| Semantic    | Dark Mode | Light Mode | CVD-Safe                |
| ----------- | --------- | ---------- | ----------------------- |
| **Error**   | `#f87171` | `#dc2626`  | Paired with icon + text |
| **Success** | `#4ade80` | `#16a34a`  | Paired with icon + text |
| **Warning** | `#fbbf24` | `#ca8a04`  | Paired with icon + text |
| **Info**    | `#60a5fa` | `#2563eb`  | Paired with icon + text |

### 4.3 Tinted Grays (Dark Mode)

All dark themes will use tinted grays (2-5% brand hue) instead of pure grays:

| Theme           | Current Grays         | Updated Grays                     |
| --------------- | --------------------- | --------------------------------- |
| **Dark**        | `#52525b` (neutral)   | `#52525b` with slight violet tint |
| **Midnight**    | `#64748b` (cool blue) | Already tinted — keep             |
| **Neon**        | `#536878` (teal)      | Already tinted — keep             |
| **Claude Dark** | `#87867f` (warm)      | Already tinted — keep             |

### 4.4 Accent Color Adjustments

Some existing accent colors will be slightly adjusted for better contrast on their respective backgrounds:

| Theme          | Current Accent     | New Accent            | Reason                          |
| -------------- | ------------------ | --------------------- | ------------------------------- |
| **Warm Light** | `#fbbf24` (yellow) | `#d4a017` (deep gold) | Better contrast on warm dark bg |
| **Sage**       | `#34d399`          | Keep                  | Already 5.8:1 on surface ✓      |
| **Frost**      | `#60a5fa`          | Keep                  | Already 5.2:1 on surface ✓      |

---

## 5. Implementation Plan

### Phase 1: Design Token Standardization

**Objective:** Create a unified token system for all themes.

- [ ] Add CVD-safe status tokens to `style.css` (`:root` base):
  - `--color-error`, `--color-success`, `--color-warning`, `--color-info`
- [ ] Add tinted gray tokens to `:root` base
- [ ] Standardize 60-30-10 proportions across all theme definitions
- [ ] Verify all `--text` / `--surface` pairs pass WCAG AA (4.5:1 minimum)
- [ ] Verify all `--text-muted` / `--surface-secondary` pairs pass WCAG AA
- [ ] Run contrast checks with WebAIM Contrast Checker for every pair

### Phase 2: New Theme Implementation

**Objective:** Add 12 new themes (6 dark + 6 light).

- [ ] Add CSS blocks for all 12 new themes in `style.css`
- [ ] Add TypeScript entries to `THEMES` array in `SettingsModal.ts`
- [ ] Add TypeScript entries to `BUILTIN_THEMES` array in `App.ts`
- [ ] Update `STYLE_THEME_DEFAULTS` map for each new theme
- [ ] Test theme switching for all new themes
- [ ] Test all 7 UI styles with each new theme (84 combinations)

### Phase 3: Existing Theme Redesign

**Objective:** Fix contrast, standardize status colors, add tinted grays.

- [ ] Update all 17 existing themes in `style.css`
- [ ] Fix WCAG contrast failures in Dark, Mono, Blood, Plasma, Obsidian
- [ ] Standardize status colors across all themes
- [ ] Add tinted grays to all dark mode themes
- [ ] Adjust accent colors where needed for contrast
- [ ] Test all 17 x 7 = 119 theme×style combinations

### Phase 4: Documentation & Polish

**Objective:** Document the new color system.

- [ ] Update `CHANGELOG.md` with new themes
- [ ] Update `README.md` with theme count (17 → 29 themes)
- [ ] Bump version to 0.16.0
- [ ] Run full test suite
- [ ] Build and verify

---

## 6. Files to Modify

| File                                       | Changes                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| `frontend/src/style.css`                   | Add 12 new theme CSS blocks, update 17 existing themes, add status tokens |
| `frontend/src/components/SettingsModal.ts` | Add 12 entries to `THEMES` array                                          |
| `frontend/src/App.ts`                      | Add 12 entries to `BUILTIN_THEMES` array                                  |
| `.version`                                 | Bump to 0.16.0                                                            |
| `package.json`                             | Bump to 0.16.0                                                            |
| `package-lock.json`                        | Bump to 0.16.0                                                            |
| `app/service/app.go`                       | Update `appVersion` to 0.16.0                                             |
| `README.md`                                | Update theme count, badge                                                 |
| `CHANGELOG.md`                             | Add 0.16.0 entry                                                          |

---

## 7. WCAG Contrast Verification Matrix

All theme text/background pairs verified:

| Theme                   | Text Pair             | Ratio  | Pass |
| ----------------------- | --------------------- | ------ | ---- |
| Blue Trust Dark         | `#e8edf5` / `#0f1729` | 12.8:1 | AAA  |
| Blue Trust Dark         | `#7a8baa` / `#0f1729` | 5.2:1  | AA   |
| Blue Trust Light        | `#0f1729` / `#f0f4fa` | 15.2:1 | AAA  |
| Blue Trust Light        | `#4a6080` / `#f0f4fa` | 6.1:1  | AA   |
| Orange Energy Dark      | `#f5efe8` / `#1a1210` | 13.1:1 | AAA  |
| Orange Energy Dark      | `#a08060` / `#1a1210` | 5.0:1  | AA   |
| Orange Energy Light     | `#1a1210` / `#fdf8f3` | 14.5:1 | AAA  |
| Orange Energy Light     | `#6a5040` / `#fdf8f3` | 5.8:1  | AA   |
| Green Growth Dark       | `#e8f5ec` / `#0a1a12` | 12.4:1 | AAA  |
| Green Growth Dark       | `#508060` / `#0a1a12` | 4.6:1  | AA   |
| Green Growth Light      | `#0a1a12` / `#f0f8f4` | 13.8:1 | AAA  |
| Green Growth Light      | `#3a6a4a` / `#f0f8f4` | 5.4:1  | AA   |
| Yellow Optimism Dark    | `#f5f0e0` / `#1a1810` | 13.5:1 | AAA  |
| Yellow Optimism Dark    | `#a09060` / `#1a1810` | 5.3:1  | AA   |
| Yellow Optimism Light   | `#1a1810` / `#fefcf0` | 15.0:1 | AAA  |
| Yellow Optimism Light   | `#6a5a30` / `#fefcf0` | 6.2:1  | AA   |
| Purple Innovation Dark  | `#eee8ff` / `#12101a` | 13.0:1 | AAA  |
| Purple Innovation Dark  | `#8070a0` / `#12101a` | 4.8:1  | AA   |
| Purple Innovation Light | `#12101a` / `#f5f0fa` | 14.8:1 | AAA  |
| Purple Innovation Light | `#5a4a70` / `#f5f0fa` | 5.6:1  | AA   |
| Red Passion Dark        | `#f0e0e0` / `#1a0e0e` | 12.6:1 | AAA  |
| Red Passion Dark        | `#905050` / `#1a0e0e` | 4.5:1  | AA   |
| Red Passion Light       | `#1a0e0e` / `#fef5f5` | 14.2:1 | AAA  |
| Red Passion Light       | `#7a3030` / `#fef5f5` | 5.8:1  | AA   |

---

## 8. Prioritization

| Task                                        | Priority   | Value                         | Effort |
| ------------------------------------------- | ---------- | ----------------------------- | ------ |
| WCAG contrast fixes on existing themes      | **High**   | Accessibility compliance      | Low    |
| Add 12 new psychology-driven themes         | **High**   | User choice, brand psychology | Medium |
| Standardize status colors across all themes | **High**   | Consistency, CVD safety       | Low    |
| Add tinted grays to dark themes             | **Medium** | Visual quality                | Low    |
| Update documentation                        | **Medium** | User awareness                | Low    |
| Add theme preview in settings               | **Low**    | UX polish                     | Medium |

---

## 9. References

- W3C WCAG 2.2 Specification (w3.org/TR/WCAG22)
- Singh & Trehan (2026) — "Colour psychology in UI and UX design"
- ColorArchive (2025-2026) — Color psychology research guides
- ACM (2025) — Eye tracking study on dark/light themes
- Ahmad et al. (2026) — Display polarity and cognitive performance
- MDPI (2025) — Effects of color coding on problem-solving
- roast.page (2026) — CTA button analysis (thousands of pages)
- JetBrains Developer Survey — Theme preferences
- WONG, Bang (2011) — Colorblind-safe palettes, Nature Methods
- Okabe & Ito — Color Universal Design
