---
status: partial
phase: 02-shell-hero
source: [02-VERIFICATION.md]
started: 2026-05-05T00:00:00Z
updated: 2026-05-05T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Mobile hamburger overlay + body scroll-lock
expected: On phone/narrow viewport, tap the hamburger icon — full-screen overlay appears via createPortal; attempting to scroll the page background fails (document.body.style.overflow='hidden' active)
result: [pending]

### 2. ESC dismisses mobile menu
expected: While mobile menu is open, press ESC key — MobileMenu fades to opacity-0 + pointer-events-none; document.body overflow restored to ''
result: [pending]

### 3. Smooth-scroll + scroll-spy active link
expected: Clicking a nav link (e.g. About) smooth-scrolls to that section (CSS scroll-behavior:smooth); scrolling manually highlights the active link (text-brand + border-b-2 border-brand) as the section enters the -20%/+60% viewport band
result: [pending]

### 4. Bilingual instant switch + persist with no flash
expected: Switching EN↔ES via LangPill flips all text instantly; reload page — starts in chosen language with no English flash on first paint (sync useState(readInitialLang) reads localStorage before first render); document.title and html lang attribute reflect active language
result: [pending]

### 5. Hero entrance stagger + reduce-motion suppression
expected: Seven animation steps stagger 0–950ms (badge → h1a → h1b char-reveal → h1c → lead → CTAs → stats); enabling OS Reduce Motion shows content immediately with no animation
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
