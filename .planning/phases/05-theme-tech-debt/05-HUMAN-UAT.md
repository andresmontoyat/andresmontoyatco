---
status: partial
phase: 05-theme-tech-debt
source: [05-VERIFICATION.md]
started: 2026-05-08T00:00:00Z
updated: 2026-05-08T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Theme toggle visual flip
expected: Click sun/moon icon in nav (next to LangPill) — full page flips between dark and light theme. Light mode shows white/near-white surfaces, dark text. Dark mode shows ink-950 background, light text. Brand color #6C63FF unchanged in both. Hero h1b gradient remains visible in both themes.
result: [pending]

### 2. Theme persistence across reload
expected: Toggle to light, close tab, reopen — page renders in light directly (no flash). DevTools Application → Local Storage → `cam-theme` = `"light"`. Toggle to dark, reload — `cam-theme` = `"dark"`, page renders in dark.
result: [pending]

### 3. Mobile menu ThemeToggle
expected: At 390px viewport, open hamburger menu — ThemeToggle visible inside menu next to LangPill. Tap toggles theme. 44px tap target verified via DevTools box model.
result: [pending]

### 4. DEBT-01: no runtime errors after key removal
expected: Hard reload page in EN and ES → no console errors about undefined translation keys. Hero CV buttons still render "Download CV (EN)" / "Descargar CV (ES)". Contact section renders without Location card.
result: [pending]

### 5. DEBT-03: GA still fires from <head>
expected: DevTools Network → filter `google-analytics`. Hard reload → page_view beacon hits with tid=G-4TZJGR3MXR. Confirms GA script move to <head> didn't break SEO-02.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
