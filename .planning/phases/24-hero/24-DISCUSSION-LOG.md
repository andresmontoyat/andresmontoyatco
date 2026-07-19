# Phase 24: Hero - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-19
**Phase:** 24-hero
**Mode:** `--auto` — all decisions auto-selected (recommended default), single pass, preceded by phase-level research (24-RESEARCH.md) given flagged technical risk.

---

## Auto-resolved decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D-01 | Char-reveal → CSS `steps()` typewriter, zero JS | Research confirms feasible given monospace `.font-pixel`; stronger outcome than milestone SUMMARY anticipated |
| D-02 | Count-up → shared `src/scripts/count-up.js`, IntersectionObserver-driven | Consolidates Hero+About, avoids duplication, matches `client:visible`'s own underlying primitive |
| D-03 | About.astro gets a follow-up edit to re-add count-up via the shared script | Closes Phase 23's D-04 deferral explicitly |
| D-04 | IntersectionObserver timing tuned against Hero's 850ms entrance-animation delay | Avoid visual clash between fade-in and count-up start |
| D-05 | CV dropdown → native `<details>`/`<summary>`, drop `role="menu"` | Native disclosure semantics already correct; arrow-key nav was never implemented anyway |
| D-06 | Small additive `details-dismiss.js` for Escape/outside-click | Native `<details>` doesn't reliably do either (research flagged as assumption, not zero-risk) |
| D-07 | Real manual cross-browser QA required for Escape-key close, not just code review | Underlying browser behavior only assumed by research, needs verification |
| D-08 | Hero's own `<img>` becomes the real LCP element, no `#hero-static` duplication needed | Astro server-renders HTML directly, unlike CRA's hydration-delay workaround; confirmed BaseLayout only has the preload hint |

## Claude's Discretion

- CSS steps() exact timing values
- IntersectionObserver rootMargin/threshold exact tuning
- details-dismiss.js inline vs shared asset

## Deferred Ideas

None — count-up consolidation stays in this phase's scope.
