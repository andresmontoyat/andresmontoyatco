---
phase: 03-content-animations
plan: "05"
subsystem: contact-footer
tags: [contact, footer, copy-to-clipboard, animation, social-links, typography]
dependency_graph:
  requires: [03-02]
  provides: [CONT-06, CONT-07, CONT-08]
  affects: [src/components/Contact.js, src/components/Footer.js]
tech_stack:
  added: []
  patterns: [useInView entrance animation, navigator.clipboard.writeText, aria-live polite]
key_files:
  modified:
    - src/components/Contact.js
    - src/components/Footer.js
decisions:
  - "Email is the hero element — full-width EmailHeroCard with text-3xl/4xl font-extrabold per D-09"
  - "No location card, no Docker, no YouTube — per D-10, D-11, D-12"
  - "Copy email / Copied! are hardcoded strings (not in translations) per UI-SPEC lines 178-183"
  - "Footer receives no scroll animation per UI-SPEC line 828"
  - "font-extrabold only across both components per Phase 3 weight contract"
metrics:
  duration_seconds: 102
  completed_date: "2026-05-06"
  tasks_completed: 2
  files_modified: 2
---

# Phase 03 Plan 05: Contact & Footer Redesign Summary

Contact.js rebuilt with email as the dominant visual element (EmailHeroCard full-width, copy-to-clipboard interaction, mailto fallback) plus three SecondaryCards for phone/LinkedIn/GitHub; Footer.js social array trimmed to GitHub + LinkedIn with typography normalized to font-extrabold throughout.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Rewrite Contact.js — EmailHeroCard + 3 SecondaryCards | 4c1af9d | src/components/Contact.js |
| 2 | Trim Footer.js social array, normalize font-extrabold | 20c12a2 | src/components/Footer.js |

## What Was Built

### Task 1: Contact.js Rewrite

**EmailHeroCard** renders as a full-width card (`sm:col-span-3`) with:
- Email address displayed at `text-3xl sm:text-4xl font-extrabold` — visually dominates the section per D-09
- `mailto:${EMAIL}` anchor wraps the entire card so clicking the body opens the mail client
- Copy email button calls `navigator.clipboard.writeText(EMAIL)` → switches label to `Copied!` for 1500ms → reverts to `Copy email`
- `e.preventDefault()` on the button click prevents the parent mailto: anchor from firing
- Defensive guard: `if (!navigator.clipboard || !navigator.clipboard.writeText) return` — silent fallback
- `aria-live="polite"` on the label span — screen readers announce state changes

**Three SecondaryCards** (phone / LinkedIn / GitHub):
- No location card (D-10: "useless location card removed")
- No Docker, no YouTube (D-11/D-12)

**Animation cadence** (useInView, threshold 0.25):
- Heading block: 0ms (wrapping div with animate-on-scroll)
- EmailHeroCard: transitionDelay 100ms
- Phone SecondaryCard: transitionDelay 200ms
- LinkedIn SecondaryCard: transitionDelay 300ms
- GitHub SecondaryCard: transitionDelay 400ms

Imports: shared `SectionLabel` from `./_shared/SectionLabel` (inline definition removed), `useInView` from `../hooks/useInView`.

### Task 2: Footer.js Trim

Social array reduced from 4 to 2 items — LinkedIn and GitHub only. Docker and YouTube entries permanently removed.

Typography changes per Phase 3 weight contract:
- Logomark: `font-semibold text-sm` → `font-extrabold text-xs`
- Tagline: `text-sm mb-5` → `text-base mb-6`
- Social row: `gap-5 mb-5` → `gap-6 mb-6`
- Copyright: `text-text-secondary` → `text-text-muted`

No scroll animation added — per UI-SPEC line 828 explicit directive.

## Hardcoded Strings (Not in Translations)

Per UI-SPEC lines 178–183, these strings are intentionally hardcoded in Contact.js:
- `'Copy email'` — button default label
- `'Copied!'` — button success label
- `'Copy email to clipboard'` — aria-label on button

LinkedIn and GitHub card labels are also hardcoded as they are tech-industry proper nouns.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is wired. EMAIL constant (`andresmontoyat@gmail.com`), phone number, LinkedIn/GitHub URLs are real values.

## Self-Check: PASSED

- [x] src/components/Contact.js exists with 89 insertions
- [x] src/components/Footer.js exists with 4 insertions / 6 deletions
- [x] Commit 4c1af9d exists (Contact.js)
- [x] Commit 20c12a2 exists (Footer.js)
- [x] `npm run build` exits 0 — ✓ built in 698ms
- [x] `npm run lint` exits 0 errors — 4 warnings (pre-existing, in other files)
- [x] All grep acceptance criteria pass
