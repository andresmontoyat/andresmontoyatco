---
status: testing
phase: 16-filters-floating-experiencecard
source: 16-01-SUMMARY.md, 16-02-SUMMARY.md, 16-03-SUMMARY.md, 16-04-SUMMARY.md, 16-05-SUMMARY.md, 16-06-SUMMARY.md
started: 2026-06-02T11:05:00Z
updated: 2026-06-02T11:05:00Z
---

## Current Test

number: 1
name: Filter chip → constellation dim-others visual flow
expected: |
  Click a skill chip → only matching nodes stay bright (opacity 1), all others dim to 0.35, edges incident to dimmed nodes also dim. No flicker or jank.
awaiting: user response

## Tests

### 1. Filter chip → constellation dim-others visual flow
expected: Click a skill chip → only matching nodes stay bright (opacity 1), all others dim to 0.35, edges incident to dimmed nodes also dim. No flicker or jank.
result: [pending]

### 2. Chip-flash animation when adding skill to filter (motion-safe)
expected: Click a tech chip in the card → matching constellation node briefly flashes (100ms ease-out). Under prefers-reduced-motion the flash is skipped.
result: [pending]

### 3. Dual-thumb year-range slider — keyboard a11y
expected: Tab focuses start thumb, arrow keys move ±1 year, Home/End jump to bounds, Shift+Tab to end thumb. Start thumb cannot exceed end-1. aria-valuetext announced by SR.
result: [pending]

### 4. ExperienceCard focus trap + Esc + return focus
expected: Open card via Enter on a node → focus on H2 heading → Tab cycles through chips/CTA/close → Esc closes → focus returns to originating constellation node.
result: [pending]

### 5. Mobile bottom-sheet vs desktop popover layout switch
expected: Viewport <768px renders fixed bottom-sheet with drag-handle bar + slide-up animation; ≥768px renders anchored popover (max-w 360px) at LAYOUT[selectedSkillId] + offset (24,-60) with fade-in. Both legible in dark + light themes.
result: [pending]

### 6. CV CTA download triggers .docx file (no preview modal)
expected: Click 'Download CV (English)' → browser downloads CV_Carlos_Montoya_EN.docx. ES context → CV_Carlos_Montoya_ES.docx. No PDF preview or in-app modal.
result: [pending]

### 7. Empty intersection state
expected: Select two skills with no co-occurrence → 'No matches — try fewer filters' inside the card (role=status), constellation dims all non-highlighted nodes, no crash.
result: [pending]

### 8. AA contrast in both themes for new chip/slider/card surfaces
expected: All chip-active, chip-outline, slider-thumb, card-bg, cvCta-bg combinations pass WCAG AA 4.5:1 against their backgrounds in dark AND light themes.
result: [pending]

### 9. Real-device touch on iPhone / Pixel / iPad
expected: 44×44px touch targets on all chips/thumbs/close buttons usable without mis-taps; bottom-sheet slide-up + close gestures responsive; no layout shift on filter open.
result: [pending]

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0
blocked: 0

## Gaps

<!-- APPENDED as user reports issues -->
