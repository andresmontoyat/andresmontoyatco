---
status: partial
phase: 04-polish-performance
source: [04-VERIFICATION.md, 04-07-PERF-PROFILE.md]
started: 2026-05-07T00:00:00Z
updated: 2026-05-07T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Chrome DevTools Performance profile (RESP-02)
expected: Run `npm run build && npx serve dist -p 4173` in one terminal. Open Chrome → http://localhost:4173 → DevTools → Performance tab → CPU 4x throttle + Network "Slow 4G" → record 5-10s of full-page scroll. Verify FPS stays 55-60, no long tasks > 50ms, no layout thrash on scroll. Lighthouse TBT 100ms is supporting pre-evidence.
result: [pending]

### 2. 4-breakpoint responsive sweep (RESP-01)
expected: DevTools responsive mode → cycle through iPhone 14 (390x844), Pixel 7 (412x915), iPad (768x1024), 4K desktop (2560x1440). Verify no horizontal overflow, no broken layouts, hero readable, mobile menu works on phone breakpoints, timeline rail aligned, contact email card scales properly.
result: [pending]

### 3. Skip-to-content link keyboard flow
expected: Hard-reload page. Press Tab once — SkipLink should appear (visible on focus only) as first focusable element with brand-color outline. Press Enter — focus jumps to <main id="main"> region. Verify in EN and ES (translation flips).
result: [pending]

### 4. prefers-reduced-motion still works post-Phase-4 changes
expected: Enable OS Reduce Motion. Hard reload. All entrance animations suppressed (Hero stagger, About/Skill/Experience/Contact useInView fade+slide, h1b char-reveal). Site fully usable, just no motion.
result: [pending]

### 5. GA still fires post-lazy-loading
expected: DevTools Network → filter google-analytics. Hard reload → page_view beacon hits with tid=G-4TZJGR3MXR within 1-2s. Confirms code splitting + font preload changes didn't break SEO-02 from Phase 3.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
