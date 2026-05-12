---
phase: 07-tailwind-css-var-refactor
plan: 01
completed: 2026-05-12
status: complete
requirements_completed: [THEME-01]
commits:
  - 6f64f1b (Task 1: :root expanded with full token set, dark defaults)
  - cbf03ee (Task 2: [data-theme="light"] mirrored with light hex values)
  - 87f35f2 (Task 3: tailwind.config.js colors.* now reference var(--color-*))
  - bbf8284 (Task 4: human verification gate passed — theme toggle flips all sections)
files_modified:
  - src/index.css
  - tailwind.config.js
verification_gate_passed: true
one_liner: "Tailwind config refactored to reference CSS variables via var(--color-*); full token set declared in :root (dark defaults) and [data-theme=\"light\"] (mirrored). Theme toggle now functionally flips every section — Phase 5 false-positive UAT debt closed."
---

# Phase 07 Plan 01: Tailwind CSS-Var Refactor Summary

## One-Liner

Tailwind config refactored to reference CSS variables via `var(--color-*)`; full token set declared in `:root` (dark defaults) and `[data-theme="light"]` (mirrored). Theme toggle now functionally flips every section — Phase 5 false-positive UAT debt closed.

## What Changed

The root cause of the Phase 5 THEME-01 false-positive was identified and fixed: `tailwind.config.js` had hardcoded the dark hex values directly into `theme.extend.colors.*`, so toggling `[data-theme="light"]` on `<html>` had no visual effect — Tailwind utility classes were resolving to fixed dark hex at build time, ignoring the CSS-variable layer entirely.

The fix is a structural CSS-var indirection. Two files changed:

- **`src/index.css`** — `:root` now declares the full design-token set (`--color-ink-900/800/700`, `--color-slate-100/300`, `--color-brand` + `-light/-dark/-muted`, `--color-line`, etc.) using the existing dark hex values as defaults. `[data-theme="light"]` mirrors the same token names with light-mode hex values, so toggling the attribute on `<html>` swaps every token simultaneously.
- **`tailwind.config.js`** — `theme.extend.colors` entries that previously held hardcoded hex (`'#0b0f17'`, `'#22d3ee'`, etc.) now reference the CSS variables (`'var(--color-ink-900)'`, `'var(--color-brand)'`, etc.). Tailwind classes like `bg-ink-900`, `text-brand`, `border-line` now resolve through the variable layer and therefore respond to `[data-theme]` at runtime.

The mechanism was end-to-end verified by Task 4 (human gate): theme toggle exercised in `npm run dev` across iPhone 14 (390px), iPad (768px), and 1440px desktop. All eight sections (Nav, Hero, About, Skill, Experience, Projects, Contact, Footer) flip cleanly between dark and light. No regressions, no flash-of-wrong-theme on toggle.

## Verification Outcome

Human verification gate passed (commit `bbf8284`). The specific missed-surface risk flagged by `gsd-plan-checker` during planning — that the Experience timeline-dot **ring (3px)** + **halo (8px)** might not flip because they're declared as inline `boxShadow` strings in `Experience.js` rather than as Tailwind utilities — was explicitly checked at all three viewports and **confirmed flipping correctly**.

Why didn't the missed-surface risk materialize? Because the inline shadow in `Experience.js` references `theme('colors.brand')` via Tailwind's resolved color, which now resolves to `var(--color-brand)` after Task 3's tailwind.config refactor. The variable indirection propagates through Tailwind's `theme()` function at build time, so even hardcoded-looking inline shadow strings inherit the var layer automatically.

Plan 07-01 deliberately scoped its file changes to `:root`, `[data-theme="light"]`, and `tailwind.config.js` only — it does **not** touch `Experience.js`. The inline shadow in `Experience.js` will be explicitly rewritten to use `var(--color-*)` directly (rather than `theme('colors.brand')` indirection) in **Plan 07-02 Task 5b**, which is a hardening step rather than a fix for a current bug.

## Deviations / Notes

- **`ugrep` vs `grep` regex incompatibility (Rule 1 - tooling fix):** The plan's `<verify><automated>` blocks contain regex like `--color-brand(|-light|-dark|-muted)` which uses GNU-grep's empty-alternative syntax. macOS default `ugrep` rejects empty alternatives and exits non-zero on syntactically valid GNU-style patterns. The verification intent was satisfied by running the equivalent explicit pattern (`--color-brand($|-light|-dark|-muted)` or four separate greps). **Action for future plan authors:** prefer explicit non-empty alternatives in `<verify>` blocks to remain portable across BSD/GNU/ugrep environments.

- **No file-content deviations.** Tasks 1, 2, 3 executed exactly as planned. Token names, hex values, and tailwind.config bindings match the plan spec verbatim.

- **Task 4 is checkpoint-only.** It carries no file changes — only a human-verification gate. Recorded as `--allow-empty` commit so the gate decision is auditable in git history.

## Files Modified

| File | Change |
|------|--------|
| `src/index.css` | Expanded `:root` with full dark token set; added `[data-theme="light"]` mirror block |
| `tailwind.config.js` | Replaced hardcoded hex in `theme.extend.colors.*` with `var(--color-*)` references |

## Commits

| Task | Hash | Message |
|------|------|---------|
| 1 | `6f64f1b` | `refactor(07-01): expand :root token set with current hex values` |
| 2 | `cbf03ee` | `refactor(07-01): expand [data-theme="light"] token set with current light hex values` |
| 3 | `87f35f2` | `refactor(07-01): tailwind colors.* now reference var(--color-*) tokens` |
| 4 | `bbf8284` | `docs(07-01): verify theme toggle flips all sections (Phase 5 false-positive payback)` |

## Requirements Completed

- **THEME-01** — Theme toggle must visually flip all sections at dark↔light, across iPhone 14 / iPad / 1440px. **Verified end-to-end by human gate.** Phase 5 UAT false-positive debt closed.

## Next

**Plan 07-02 (Wave 2) is now unblocked.** That plan swaps the brand palette to blue-500 + emerald-500 across the token layer and hardens the remaining inline-color surfaces (including `Experience.js` Task 5b — rewrite timeline-dot shadow from `theme('colors.brand')` indirection to direct `var(--color-brand)` reference, eliminating the latent missed-surface category permanently).

A fresh executor will be spawned by the orchestrator for Plan 07-02.

## Self-Check: PASSED

- All four task commits exist in `git log`: 6f64f1b, cbf03ee, 87f35f2, bbf8284 — verified
- `src/index.css` and `tailwind.config.js` modifications confirmed by `git log --stat`
- Human verification gate explicitly confirmed by user message ("gate passed")
- No outstanding deviations, no deferred items beyond the documented `ugrep` portability note
