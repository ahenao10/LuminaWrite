---
name: Lumina Write
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464554'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#006c49'
  on-tertiary: '#ffffff'
  tertiary-container: '#00885d'
  on-tertiary-container: '#000703'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 3rem
    fontWeight: '400'
    lineHeight: 3.5rem
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Newsreader
    fontSize: 2.25rem
    fontWeight: '400'
    lineHeight: 2.75rem
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 2.25rem
    fontWeight: '500'
    lineHeight: 2.75rem
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 1.75rem
    fontWeight: '500'
    lineHeight: 2.25rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 1.5rem
    fontWeight: '500'
    lineHeight: 2rem
  headline-sm:
    fontFamily: Newsreader
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
  body-xl:
    fontFamily: Newsreader
    fontSize: 1.25rem
    fontWeight: '400'
    lineHeight: 2.125rem
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.025em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-lg: 2rem
  margin: 1.5rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system crafts an authoritative, calm, and intellectually rigorous environment tailored for focused prose composition and linguistic refinement. It positions the interface not as an intrusive automated editor, but as a scholarly peer and discerning writing mentor.

The aesthetic philosophy balances **Editorial Elegance** with **Functional Minimalism**:
- **Clarity Over Clutter:** Interfaces prioritize vast negative space, deliberate typographic hierarchy, and minimal visual noise to honor the writer’s cognitive flow.
- **Academic Warmth:** A literary display serif pairs with an engineered, geometric sans-serif to bridge classical editorial craftsmanship with modern computational precision.
- **Calm Feedback:** Corrections and suggestions avoid punitive or alarming indicators; instead, they integrate gracefully as inline marginalia, subtle underlines, and focused floating annotations.

## Colors

The palette delivers a calm, cerebral tone anchored by focused indigos and cool slates, supported by purposeful functional accents:

- **Primary (`#6366F1`) & Secondary (`#4F46E5`):** Serves as the intellectual signature of the system. Used for focused active states, AI synthesis actions, high-level structural guidance, and subtle branding anchors.
- **Tertiary / Success (`#10B981`):** Applied exclusively for verified linguistic accuracy, approved stylistic clarity, vocabulary mastery streaks, and constructive validation.
- **Warning & Suggestion (`#F59E0B`):** Reserved for tonal nuances, stylistic alternatives, passive voice alerts, and pacing suggestions.
- **Critical / Error (`#EF4444`):** Employed selectively for objective grammatical flaws, syntax errors, and structural dissonance.
- **Neutral Canvas (`#0F172A` to `#FFFFFF`):** A high-contrast scale featuring pristine paper grounds (`#FFFFFF`, `#F8FAFC`), structural borders (`#E2E8F0`), muted meta labels (`#64748B`), and dense slate ink (`#0F172A`, `#1E293B`) for maximum readability.

## Typography

The typographic hierarchy intentionally contrasts literary prose and functional UI:

- **Editorial Presence (`Newsreader`):** Applied to headlines, section prompts, and rich document writing contexts (`body-xl`). Features optical sizing considerations and generous line-heights mimicking traditional book design to reduce eye fatigue during long-form composition.
- **Productivity & Interface Engine (`Plus Jakarta Sans`):** Applied to UI navigation, cards, sidebar analytics, metadata labels, and suggestion chips. Its modern geometric profile ensures legibility across dense metrics and compact tooltips.
- **Tracking & Proportion:** Headings employ slightly tighter tracking (`-0.01em` to `-0.02em`) to maintain compositional density, while small UI labels utilize expanded tracking (`0.025em` to `0.05em`) in all-caps or title-case to maintain instant clarity.

## Layout & Spacing

The layout is built upon an asymmetric dual-pane and triple-pane architecture designed for uninterrupted composition alongside assistive intelligence:

- **Workspace Grid:** A 12-column fluid grid system with controlled maximum widths. The primary writing canvas adheres to an optimal line-length container (maximum 720px width), flanked by collapsible sidebars for outline structuring and real-time linguistic feedback.
- **Rhythm & Proportions:** Spacing relies on an 8px base rhythm (`0.5rem`, `1rem`, `1.5rem`, `2rem`), reserving tight spacing (`space-xs`, `space-sm`) for compact inline metadata and badge groupings.
- **Responsive Adaptation:**
  - **Desktop (≥ 1280px):** 3-column setup featuring navigation/outline (240px fixed), primary writing canvas (fluid, max 720px centered), and suggestion rail (360px fixed).
  - **Tablet (768px - 1279px):** 2-column layout; outline converts to a drawer; suggestion rail docks into an expandable right-hand inspector.
  - **Mobile (< 768px):** Single-column focus canvas with a bottom floating toolbar and swipe-up sheet for contextual AI recommendations. Margins reduce to `1rem` and gutters to `1rem`.

## Elevation & Depth

Visual hierarchy combines understated tonal surfaces with finely calibrated ambient shadows to evoke the feel of crisp vellum and editorial stationery:

- **Surface Layering:** The primary canvas rests on `#FFFFFF` against an off-white workspace background (`#F8FAFC`). Utility sidebars and inspectors adopt a neutral `#F1F5F9` background, creating natural spatial division without relying on harsh divider rules.
- **Soft Ambient Shadows:** Shadows emulate low-diffusion ambient daylight. Floating critique palettes and suggestion popovers use dual-stop shadows with subtle indigo/slate tinting (`0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(99, 102, 241, 0.04)`).
- **Hairline Outlines:** All elevated panels, modals, and tooltips pair diffuse elevation with a 1px crisp outline (`rgba(226, 232, 240, 0.8)`) to preserve clean silhouettes against the paper canvas.

## Shapes

The geometric language establishes a tailored, architectural softness:

- **Base Curvature:** Base elements (input fields, action chips, inline alerts) use `0.25rem` (soft) corner radii. Structural containers, panels, and document review cards scale up to `rounded-lg` (`0.5rem`) and `rounded-xl` (`0.75rem`).
- **Precision Boundaries:** Sharp corners are avoided to keep the interface warm and inviting, while high-radii pill shapes are strictly restricted to status badges and active streak pills to maintain an academic visual tone.

## Components

### Buttons
- **Primary:** Solid `#6366F1` background, `#FFFFFF` text, `0.25rem` border radius, subtle hover transition to `#4F46E5`. Includes focused state with a `2px` offset ring in `#6366F1`.
- **Secondary / Ghost:** Transparent background with subtle slate border (`#E2E8F0`), text in `#1E293B`, shifting to `#F1F5F9` on hover.
- **Scholarly Inline Action:** Text-only button styled in semibold sans-serif with a persistent or animated underline indicator for one-click grammar resolutions.

### Suggestion Chips & Badges
- **Linguistic Markers:** Compact chips with `0.25rem` radius, light tint backgrounds, and dark textual anchors:
  - *Grammar Issue:* `#EF4444` at 10% opacity, text in `#B91C1C`.
  - *Style Suggestion:* `#F59E0B` at 10% opacity, text in `#B45309`.
  - *Vocabulary Enrichment:* `#6366F1` at 10% opacity, text in `#4338CA`.
  - *Clarity Approved:* `#10B981` at 10% opacity, text in `#047857`.

### Document Cards & Annotation Blocks
- **Editorial Card:** `#FFFFFF` background, `0.5rem` (`rounded-lg`) radius, 1px border in `#E2E8F0`, minimal padding (`space-md` to `space-lg`).
- **Marginalia Card:** Attached directly to text selections. Outlined in the respective feedback color with an active left edge border accent of `3px`.

### Input Fields & Editor Surface
- **Distraction-Free Editor:** Minimal borderless document container with high typographic legibility, smooth selection tinting (`rgba(99, 102, 241, 0.15)`), and smooth caret transitions.
- **Form Inputs:** Border in `#CBD5E1`, surface `#FFFFFF`, transition to `#6366F1` outline on focus with 0-spread ambient glow.

### Checkboxes & Radios
- **Selection Controls:** `0.25rem` radius for checkboxes, full circular radius for radios. Border in `#94A3B8`, active state solid `#6366F1` displaying crisp white check glyphs.

### Specialized System Components
- **Vocabulary Diff Viewer:** Split inline replacement widget showing stricken red text alongside accepted green suggestions.
- **Readability & Tone Gauge:** A clean horizontal meter displaying score percentiles, reading grade levels, and formal/academic tone spectrums without distracting gauges or gamified assets.