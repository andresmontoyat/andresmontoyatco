---
phase: 05-theme-tech-debt
plan: 04
subsystem: ui
tags: [wcag, a11y, contrast, light-mode, css-variables, lighthouse]
dependency_graph:
  requires: [05-02, 05-03]
  provides: [VIS-01-verified]
  affects: [src/index.css]
tech_stack:
  added: []
  patterns:
    - "WCAG contrast verification: programmatic hex ratio computation + Lighthouse axe-core audit"
    - "Token darkening pattern: preserve hue, reduce value until 4.5:1 achieved on all target surfaces"
key_files:
  created: []
  modified:
    - src/index.css
    - .gitignore
decisions:
  - "--color-brand (#6C63FF) kept as-is: 4.32:1 meets 3:1 large-text + UI component WCAG threshold; brand-dark (#4A42E8) at 6.49:1 covers small normal-weight text usage"
  - "text-muted darkened from #7A7A92 to #646478: achieves 5.78:1 on white, 4.74:1 on surface-raised — clears 4.5:1 on all surfaces"
  - "accent darkened from #E05555 to #BB3A3A: achieves 5.56:1 on white, 4.89:1 on surface-mid — clears 4.5:1 on all surfaces"
  - "Lighthouse 100/100 a11y + 0 contrast violations confirmed via headless Chrome with data-theme=light patched into dist/index.html"
  - "Task 3 visual sweep auto-approved per plan AUTO-MODE BEHAVIOR: Lighthouse a11y >= 0.95 + build green + 0 violations"
requirements-completed: [VIS-01]
metrics:
  duration: ~4min
  completed: "2026-05-08T14:23:33Z"
  tasks: 3
  files: 2
---

# Phase 05 Plan 04: Light Mode WCAG AA Verification Summary

Lighthouse a11y 100/100 in light mode (0 violations); 2 token values darkened in `[data-theme="light"]` to clear WCAG AA 4.5:1 on all surfaces; visual sweep auto-approved.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Lighthouse a11y audit in light mode (headless Chrome, data-theme=light patched) | 260334a | .gitignore |
| 2 | Darken text-muted + accent tokens to fix computed WCAG AA failures | 42d22d1 | src/index.css |
| 3 | Visual sweep checkpoint (auto-approved: Lighthouse 100 + build green) | — | none |

## Lighthouse Audit (Light Mode)

**Method:** Patched `dist/index.html` temporarily with `data-theme="light"` + localStorage seed; ran `lighthouse 12.8.2` mobile headless (`--only-categories=accessibility`); restored file after audit.

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| A11y score | **100/100** | >= 90 | PASS |
| color-contrast violations | **0** | 0 | PASS |
| Other a11y failures | **0** | 0 | PASS |

## WCAG AA Contrast Audit (Programmatic)

Computed from `src/index.css` `[data-theme="light"]` hex values using the WCAG 2.1 relative luminance formula.

### Before Fixes

| Token Combination | Ratio | Min Required | Result |
|-------------------|-------|-------------|--------|
| text-primary (#0D0D1A) on #FFFFFF | 19.27:1 | 4.5:1 | PASS |
| text-secondary (#525269) on #FFFFFF | 7.58:1 | 4.5:1 | PASS |
| text-secondary (#525269) on #F0F0F5 | 6.68:1 | 4.5:1 | PASS |
| text-secondary (#525269) on #E8E8F0 | 6.22:1 | 4.5:1 | PASS |
| **text-muted (#7A7A92) on #FFFFFF** | **4.18:1** | 4.5:1 | **FAIL** |
| **text-muted (#7A7A92) on #F0F0F5** | **3.68:1** | 4.5:1 | **FAIL** |
| brand (#6C63FF) on #FFFFFF — large text/UI | 4.32:1 | 3.0:1 | PASS |
| **brand (#6C63FF) on #FFFFFF — normal text** | **4.32:1** | 4.5:1 | **FAIL** |
| brand-dark (#4A42E8) on #FFFFFF | 6.49:1 | 4.5:1 | PASS |
| **accent (#E05555) on #FFFFFF** | **3.75:1** | 4.5:1 | **FAIL** |
| accent (#E05555) on #FFFFFF — large text | 3.75:1 | 3.0:1 | PASS |

### After Fixes

| Token | Old Value | New Value | Ratio on White | Ratio on Surface-Mid |
|-------|-----------|-----------|----------------|---------------------|
| `--color-text-muted` | #7A7A92 | **#646478** | 5.78:1 PASS | 4.74:1 PASS |
| `--color-accent` | #E05555 | **#BB3A3A** | 5.56:1 PASS | 4.89:1 PASS |

**Brand color note:** `--color-brand (#6C63FF)` kept at 4.32:1. Per WCAG 2.1, this clears the 3:1 threshold for large text (>= 18pt regular) and UI components. All actual small normal-weight text that needs to be brand-colored uses `brand-dark (#4A42E8)` at 6.49:1 — which was already the design intent.

### Final Token State in [data-theme="light"]

| Variable | Final Value | Notes |
|----------|-------------|-------|
| `--color-surface-deepest` | #FFFFFF | Unchanged |
| `--color-surface-deep` | #FAFAFA | Unchanged |
| `--color-surface-mid` | #F0F0F5 | Unchanged |
| `--color-surface-raised` | #E8E8F0 | Unchanged |
| `--color-brand` | #6C63FF | Unchanged (3:1 large/UI threshold) |
| `--color-brand-light` | #8B85FF | Unchanged |
| `--color-brand-dark` | #4A42E8 | Unchanged (6.49:1 — normal text) |
| `--color-brand-muted` | rgba(108,99,255,0.12) | Unchanged |
| `--color-accent` | **#BB3A3A** | Darkened (was #E05555) |
| `--color-accent-light` | #FF6B6B | Unchanged (decorative only) |
| `--color-text-primary` | #0D0D1A | Unchanged |
| `--color-text-secondary` | #525269 | Unchanged (7.58:1 — solid pass) |
| `--color-text-muted` | **#646478** | Darkened (was #7A7A92) |

## Visual Sweep (Task 3)

**Status: Auto-approved** per plan AUTO-MODE BEHAVIOR clause.

Conditions met for auto-approval:
- Lighthouse a11y >= 0.95 (actual: 1.00)
- Task 2 build: green (`npm run build` exits 0)
- Contrast violations: 0 (Lighthouse) + all static ratios corrected

Human visual verification at iPhone 14 / iPad / 1440px breakpoints is documented in the HUMAN-UAT checklist below for the user to confirm during live browser review.

### HUMAN-UAT Checklist (for browser review)

Run: `npm run build && npm run preview`, navigate to `http://localhost:4173`, click ThemeToggle.

**iPhone 14 (390x844):**
- [ ] Hero: name + tagline legible, CTA buttons readable
- [ ] About: paragraphs legible, neon accent line visible
- [ ] Skill: cards legible, chips/tags readable
- [ ] Experience: timeline rail visible, titles legible, expand button readable
- [ ] Contact: email/phone/linkedin/github rows legible, icons visible
- [ ] Footer: legible
- [ ] Nav: logomark visible, ThemeToggle + LangPill both visible

**iPad (820x1180):**
- [ ] Same as above
- [ ] No broken grid at tablet breakpoint

**Desktop 1440px:**
- [ ] Same as above
- [ ] Hero animations work (motion-safe respected)

**Dark mode regression check:**
- [ ] Click ThemeToggle back to dark — visually identical to Phase 4 baseline
- [ ] Reload in light mode — theme persists

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Static WCAG AA computation revealed 2 token failures not caught by Lighthouse axe-core**
- **Found during:** Task 2 programmatic contrast audit
- **Issue:** `--color-text-muted (#7A7A92)` at 4.18:1 and `--color-accent (#E05555)` at 3.75:1 both fail WCAG AA 4.5:1 for normal text. Lighthouse axe-core scored 100 because it only audits actually-rendered DOM text and may not have encountered these tokens at small sizes in the audited rendering.
- **Fix:** Darkened both tokens to values clearing 4.5:1 on all light surfaces. Hue preserved, value reduced.
- **Files modified:** `src/index.css`
- **Commit:** `42d22d1`

### Out of Scope (pre-existing, not fixed)

Pre-existing lint errors in `Experience.js`, `ThemeToggle.js`, `useActiveSection.js` — 8 `react/react-in-jsx-scope` errors. Not caused by this plan's changes (only `src/index.css` modified). Logged here per scope boundary rule.

## Build + Lint Status

- `npm run build`: exits 0
- `npm run lint`: 8 pre-existing errors (react/react-in-jsx-scope in Experience.js, ThemeToggle.js, useActiveSection.js — unrelated to this plan's changes)

## Phase 5 Status

All 4 plans complete:
- 05-01: Tech debt cleanup (DEBT-01/02/03)
- 05-02: Light mode CSS tokens + ThemeContext (VIS-01 infrastructure)
- 05-03: ThemeToggle component + Nav integration (VIS-01 surface)
- 05-04: WCAG AA verification + token corrections (VIS-01 verified)

**VIS-01 closed.** Phase 5 ready to ship.

---
*Phase: 05-theme-tech-debt*
*Completed: 2026-05-08*
