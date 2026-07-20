# Phase 25: SectionPager - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning
**Mode:** [--auto] all gray areas auto-resolved with recommended defaults, single pass, logged below.

<domain>
## Phase Boundary

Port `SectionPager.jsx` to a `client:visible` React island (not `client:load` — it's below-the-fold, gated behind `window.scrollY > 320`, so no reason to hydrate before the user scrolls). Same Context→props pattern established in Phase 22 (Nav).

**In scope:** `SectionPager.jsx` → island. Uses `useActiveSection` (already proven in Phase 22, unchanged) against `SECTION_IDS` — these are DOM element IDs (`hero`, `about`, `skills`, `experience`, `projects`, `claude-code`, `contact`), which work regardless of whether the underlying section is currently an Astro static component or still-pending React (Experience/Contact aren't migrated yet, phases 26/unscheduled) — SectionPager doesn't care about implementation, only DOM presence.
**Out of scope:** Experience itself (Phase 26). Contact (not yet scheduled — flagged gap, out of this phase regardless).

</domain>

<decisions>
## Implementation Decisions

### Island hydration & data flow
- **D-01 [auto]:** `client:visible` (not `client:load`) — matches ROADMAP's explicit success criterion and the component's own existing behavior (`visible` state gated on scroll position, so nothing is lost by deferring hydration).
- **D-02 [auto]:** Same Context→props pattern as Nav (Phase 22, D-02): `locale` prop replaces `useLanguage()`; `translations.js` imported directly, indexed by `locale`. `t.nav.pagerGroup`/`pagerTop`/`pagerPrev`/`pagerNext`/`pagerEnd` keys read from the resolved `t` object — same subtree Nav already uses, no new translation keys needed.
- **D-03 [auto]:** `SECTION_IDS`, `SECTION_COLORS`, `useActiveSection`, `ProgressDial`, `PagerButton`, scroll/progress logic (`scrollToY`, `scrollToId`, the `requestAnimationFrame`-throttled scroll listener) — all port verbatim, zero logic changes. This is a pure Context-removal port, identical in spirit to Nav's port.

### Mounting
- **D-04 [auto]:** Mounts in `src/pages/en/index.astro` / `es/index.astro` alongside Nav — both are page-level chrome (fixed-position UI), not part of the `<main>` content flow. Exact position in the file (near Nav vs. end of body) is Claude's discretion since both render as `position: fixed`.

### Claude's Discretion
- Exact file location (`src/components/react/SectionPager.jsx`, matching Nav's location).
- Where in the `.astro` page file the `<SectionPager client:visible ... />` tag is placed (fixed-position element, order in source doesn't affect visual result).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & requirements
- `.planning/REQUIREMENTS.md` — ISLAND-02 (this phase's only REQ-ID)
- `.planning/ROADMAP.md` — Phase 25 goal/success criteria

### Prior phase pattern (this phase mirrors it directly)
- `.planning/phases/22-nav-island-shell-navigability/22-CONTEXT.md` — Context→props pattern (D-02 here mirrors Phase 22's D-02)
- `.planning/phases/22-nav-island-shell-navigability/22-01-SUMMARY.md` — exact island-authoring pattern already validated once

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/SectionPager.jsx` (139 lines) — port near-verbatim: `PagerButton`, `ProgressDial`, `ICONS`, `SECTION_COLORS`, `SECTION_IDS`, scroll logic
- `src/hooks/useActiveSection.js` — already proven working (Phase 22), import unchanged
- `src/components/react/Nav.jsx` (Phase 22) — direct structural precedent for the Context-removal + locale-prop pattern

### Established Patterns
- Same `translations[locale]` direct-import pattern as Nav — no new i18n mechanism needed

### Integration Points
- Mounts in `src/pages/en/index.astro` / `es/index.astro` alongside `<Nav client:load .../>`

</code_context>

<specifics>
## Specific Ideas

No new visual requirements — exact behavioral/visual port of the existing component, only hydration timing (`client:visible`) and data source (props vs Context) change.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 25-sectionpager*
*Context gathered: 2026-07-19 (--auto)*
