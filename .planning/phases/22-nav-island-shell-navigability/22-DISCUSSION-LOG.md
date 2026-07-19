# Phase 22: Nav island — shell navigability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-19
**Phase:** 22-nav-island-shell-navigability
**Mode:** `--auto` — all decisions auto-selected (recommended default), single pass, no interactive questions.

---

## Auto-resolved decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D-01 | Nav = one `client:load` island, ThemeToggle nested inside (not separate island) | Matches milestone research correction to original design spec's island table |
| D-02 | `locale` prop replaces `LanguageContext`; `translations.js` imported directly, indexed by prop | Islands can't share React Context across boundaries |
| D-03 | ThemeToggle uses local state + `data-theme`/`cam-theme`, no Context | Same storage contract as today, no Context needed for a single island |
| D-04 | LangPill becomes real `<a>` links via `getRelativeLocaleUrl`, preserving hash | ROUTE-05 requirement; matches Phase 21's `BaseLayout.astro` pattern |
| D-05 | LangPill click also writes `cam-lang` cookie client-side | Symmetric with `middleware.ts`'s cookie-refresh behavior (Phase 21 D-04) |
| D-06 | `useActiveSection`, `ProgressBar`, `MobileMenu` — zero logic changes | Pure client-side code, no SSR touchpoints |
| D-07 | `NAV_ITEMS`/`SECTION_IDS` stays as-is | Single source of truth, unchanged |

## Claude's Discretion

- Island file location/organization
- Whether ThemeToggle is inlined or a separate imported file

## Deferred Ideas

None — single-pass auto mode, stayed within phase scope.
