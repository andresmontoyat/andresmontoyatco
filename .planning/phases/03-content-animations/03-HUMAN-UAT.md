---
status: partial
phase: 03-content-animations
source: [03-VERIFICATION.md]
started: 2026-05-06T00:00:00Z
updated: 2026-05-06T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Scroll entrance animations fire on scroll
expected: Each section (About, Skills, Experience, Contact) fades + slides up as user scrolls past 25% threshold via useInView + .animate-on-scroll/.is-visible CSS. Footer does not animate (per UI-SPEC). Reduce-motion users see content immediately without animation.
result: [pending]

### 2. Experience timeline + tech chips + per-card expand/collapse
expected: All 12 EXPERIENCE entries visible from first load on /experience section, collapsed (date / company / title / location / tech chips visible; bullets hidden). Vertical brand-color rail on left with 10px brand dots per entry. Per-card chevron toggles bullets independently — multiple cards open at same time. tech chips render from job.tech array.
result: [pending]

### 3. Contact email-hero + copy-to-clipboard + label swap
expected: Contact section shows email as dominant element (large text-3xl/sm:text-4xl, full-width card). Click "Copy email" button → clipboard receives andresmontoyat@gmail.com → button label swaps to "Copied!" for 1.5s → reverts to "Copy email". Click anywhere else on card → mailto: opens. 3 secondary cards visible: phone, LinkedIn, GitHub.
result: [pending]

### 4. Open Graph rich link preview
expected: Paste site URL into Slack / LinkedIn / iMessage / Twitter. Preview card renders with: og-image.png (1200x630, dark bg + photo + brand headline), title "Carlos Andrés Montoya — Senior Backend Engineer" (or similar), description matching translations.meta.description. Test EN and ES variants if site URL serves both languages.
result: [pending]

### 5. Google Analytics page-view fires
expected: Open site in browser → DevTools → Network tab → filter "google-analytics.com/g/collect" or use GA DebugView. Within 1-2s of page load, page_view beacon hits with tid=G-4TZJGR3MXR. Confirms SEO-02 active.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
