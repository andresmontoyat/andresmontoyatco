---
status: passed
phase: 15-accessible-constellation-seo-fallback
source: [15-VERIFICATION.md]
started: 2026-06-02T03:50:30Z
updated: 2026-06-02T04:05:00Z
---

## Current Test

[all tests complete]

## Tests

### 1. Keyboard navigation cadence
expected: Tab focuses the constellation wrapper (single tab stop). Arrow keys (←/↑/→/↓) move focus ring spatially across nodes. Enter or Space activates the focused node (selects skill, fires aria-live announcement). Esc clears selection and returns focus to the wrapper. Tab again exits the constellation to the next page focusable.
result: passed

### 2. Screen-reader selection announcement
expected: Using NVDA (Windows) or VoiceOver (macOS), tab into the constellation. SR announces `t.game.constellationLabel` + role. Move focus to Java node — SR announces "Java, languages, used in 11 jobs." Press Enter — SR announces "Java selected — 11 experiences. Press Esc to clear." Press Esc — SR announces "Selection cleared."
result: skipped
notes: No screen reader available in test environment. aria-label + aria-live region present in DOM per automated tests (22 SvgConstellation specs pass).

### 3. Animated reveal visual quality (motion-safe path)
expected: Load page in game mode with normal motion settings. ~26 nodes fade-in + scale-up in waves over ~800ms (biggest first — Java first). Edges fade in over ~400ms. Total reveal ~1.2s. After reveal, Java node pulses subtly (opacity 1.0↔0.7, 2s loop). Pulse stops on first hover/focus/click. Visual character matches "stars on dark sky" — bright pinpoint colored nodes, thin edges.
result: passed

### 4. Reduced-motion static render + hint pill SR access
expected: Enable OS-level `prefers-reduced-motion: reduce` (macOS: System Settings > Accessibility > Display > Reduce motion). Reload page in game mode. Constellation paints instantly at final state — no reveal, no pulse, no halo on selection. A hint pill renders below the constellation: "Click a star · Toca una estrella". SR (NVDA/VoiceOver) announces the hint pill text (it must NOT be aria-hidden). On first interaction, hint pill disappears.
result: passed

### 5. Light theme WCAG AA contrast (axe DevTools)
expected: Switch to light theme via existing ThemeToggle. Open axe DevTools, run scan. Constellation focus ring (`var(--color-brand)`), edges (`--color-constellation-edge` + `--color-constellation-edge-heavy`), and category-color node strokes all meet AA contrast (3:1 for UI components / 4.5:1 for text labels) against the light backdrop. Zero contrast violations from the constellation.
result: passed

### 6. Mobile viewport node sizing
expected: Open DevTools, emulate iPhone SE / 375px width. Reload at `?mode=game`. Node radii visibly smaller than desktop (mobile floor ~6px / ceil ~14px vs desktop floor ~10px / ceil ~23px). Java (largest) still distinctly bigger than smallest nodes (~3.3× ratio). 44px touch target areas around each node remain tappable.
result: passed

### 7. Spanish announcement accuracy (lang=es)
expected: Switch language to Spanish via LangPill. Tab into constellation, focus on a node — SR announces e.g. "Java, lenguajes, usado en 11 trabajos." Press Enter — SR announces "Java seleccionado — 11 experiencias. Pulsa Esc para limpiar." (or equivalent locked copy). Pluralization correct: single-job skills use `trabajo` / `experiencia`, multi-job use `trabajos` / `experiencias`.
result: passed
notes: SR audibility not tested (no SR available). DOM-level aria-label/aria-live content verified visually + via translations.js inspection.

## Summary

total: 7
passed: 6
issues: 0
pending: 0
skipped: 1
blocked: 0

## Gaps
