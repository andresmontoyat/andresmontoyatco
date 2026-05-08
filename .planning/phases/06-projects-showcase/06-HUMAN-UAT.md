---
status: complete
phase: 06-projects-showcase
source: [06-VERIFICATION.md]
started: 2026-05-08T00:00:00Z
updated: 2026-05-08T22:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Projects nav link + scroll-spy
expected: Nav shows "Projects"/"Proyectos" link between Experience and Contact (desktop + mobile menu). Click → smooth-scrolls to #projects section. Scroll past projects manually → nav link highlights with text-brand + bottom border.
result: pass

### 2. Responsive grid 1→2→3 cols
expected: 390px (iPhone 14): 1 column. 768px (iPad): 2 columns. 1440px+: 3 columns. No horizontal overflow at any breakpoint. Card aspect-video screenshot wrapper holds shape.
result: pass

### 3. Brand-gradient placeholder + no CLS
expected: All 4 cards render with brand-gradient placeholder (no real screenshots in public/projects/). Project title centered in placeholder. Aspect-video reserves space — no layout shift on entrance animation. Lighthouse CLS = 0.
result: pass

### 4. Theme support (dark + light)
expected: Toggle theme. Both modes legible: card surface bg-ink-500 + border ink-400 + text contrast WCAG AA. Brand-gradient placeholder unchanged (theme-invariant). Tech chips visible.
result: pass

### 5. Card hover + animation
expected: Hover card → lift (-translate-y-1) + border-brand color. Scroll into Projects section first time → cards stagger in 100ms each via useInView. Reduce-motion ON → no animation.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
