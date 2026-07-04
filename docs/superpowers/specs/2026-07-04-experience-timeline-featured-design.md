# Experience Timeline — Featured Cards + Compact Rows

**Date:** 2026-07-04
**Milestone:** v4.2 (content polish)
**Component:** `src/components/Experience.jsx` · `src/data/experience.json` · `src/components/Experience.test.jsx`

## Problem

The Experience timeline renders 12 uniform cards, all fully visible. Three issues:

- **No impact** — uniform cards do not stop a recruiter mid-scroll.
- **Legibility** — every role looks equally weighted; senior highlights (Solutions Architect, 45+ dev lead) read the same as any row.
- **Scroll** — 12 full cards is a long, flat scroll.

## Goal

Higher default density with detail on demand. A curated set of highlight roles rendered as premium cards with a hero metric; the rest collapse to compact single-line rows that expand on demand. Chronology preserved.

## Decisions

- **D1 — In-place chronological layout.** Timeline stays strict by date. Featured entries render as premium cards in their real chronological slot; non-featured render as compact rows. Highlights punctuate the line; real chronology is preserved (serves legibility). *(Rejected: featured-first, which breaks chronology.)*
- **D2 — Manual `featured` flag in JSON.** Curation is author-controlled, not purely chronological. Featured set: **Coderio, KLEVER, TCS**. *(Rejected: strict-chronological top-5, which buries the Architect + leadership highlights.)*
- **D3 — Premium card + hero metric.** Impact comes from both visual weight and a scannable number, not paragraphs. *(Rejected: filter-by-tech interactivity, and premium-only-without-metric.)*
- **D4 — No scroll-reveal.** Respect `D-v4.0-NO-SCROLL-REVEAL`. No `useInView` reintroduction. Only existing transitions (hover, chevron rotate, `motion-safe:animate-ping` glow).
- **D5 — Compact-row chips hidden until expand.** Cleanest; tech chips appear alongside bullets on expand.

## Data shape (`experience.json`)

Add to the 3 featured entries only; the other 9 are untouched. Absent `featured` = compact (safe default, mirrors existing `visible` flag convention).

```json
{
  "id": "coderio-2026",
  "featured": true,
  "metric": {
    "value": "~40%",
    "label": { "en": "Person API latency ↓", "es": "latencia Person API ↓" }
  }
}
```

| Entry | `metric.value` | `metric.label` (en / es) |
|-------|----------------|--------------------------|
| `coderio-2026` | `~40%` | `Person API latency ↓` / `latencia Person API ↓` |
| `klever-2020` | *(omitted)* | `PaaS Architect · health` / `Arquitecto PaaS · salud` |
| `tcs-2013` | `45+` | `developers led` / `devs liderados` |

- `metric.value` optional. When absent (KLEVER), the render omits the large number and shows the label only.
- Metric copy is provisional ("luego mejoramos") — refine values/labels in a later pass.
- Text only, no HTML (`D-v4.0-NO-HTML-IN-DATA`). Bilingual `{en, es}` shape (`D-v4.0-JSON-PER-SECTION`).

## Render (`Experience.jsx`)

Split the current `TimelineCard` into two variants, selected by `entry.featured`. The `.filter(entry.visible !== false)` stays; the `.map` branches on `featured`.

### `FeaturedCard` (premium — evolves current `TimelineCard`)
- Timeline dot with glow halo (reuse `accent` + `motion-safe:animate-ping` pattern from `ActiveBadge`).
- Left gradient accent, shadow, larger padding.
- **Hero-metric block:** large number (`text-4xl font-extrabold text-accent`) + mono label below. Number omitted when `metric.value` is absent → label only.
- Title, company pill, location, tech chips, expand → bullets (unchanged from today).

### `CompactRow` (new, dense)
- Single line: `year · title · company` + chevron.
- Small timeline dot (variant of current).
- Click → expands bullets inline via the same `openCards` state.
- Tech chips hidden until expanded (D5); shown with bullets on expand.
- Mobile: collapses to 2 lines (title + company top, mono year below) when width wraps.

### Shared
`pick()`, `isActiveRole()`, `ActiveBadge`, `ChevronIcon`, the `openCards` state, and the gradient rail are shared across both variants. `ActiveBadge` still applies to any active role regardless of variant.

## Interaction & motion

- Interaction model unchanged: one `openCards` object, per-id toggle. Featured and compact expand bullets identically.
- No tech filter (rejected in D3).
- All motion under `motion-safe`. No `useInView`.

## Accessibility

- `aria-expanded` on the toggle in both variants (already present).
- Hero-metric number paired with its label (label describes the number).
- Glow/decorative elements `aria-hidden="true"`.

## Testing (`Experience.test.jsx` — keep green)

- Featured renders hero metric when `metric.value` present.
- Featured with no `metric.value` (KLEVER) → no crash, label-only.
- Compact row collapsed hides bullets; expand shows them.
- `featured` absent → renders as compact (default).
- Bilingual: metric label swaps EN/ES on language toggle.
- Regression: all 12 visible roles still render.

## v2 — Modern + interactive (C + D)

Iteration on top of the shipped featured/compact timeline. Chosen via visual companion: **C (vertical hover-lift)** + **D (curated tech filter)**. Layer A (featured/compact) stays; v2 adds interaction, does not replace structure.

### D6 — Curated tech filter (highlight + dim, multi-select OR)

A chip bar above the timeline with ~8 signature techs. Selecting chips highlights matching roles and dims the rest to ~28% opacity. Chronological order and all 12 roles stay visible (no filter-out). *(Rejected: filter-out/collapse — breaks chronology, can leave a single result.)*

- **Chips (curated, adjustable):** `Java` · `Spring Boot` · `Microservices` · `AWS` · `Hexagonal Architecture` · `Keycloak` · `Kubernetes` · `PostgreSQL`. Each chip is an exact string matched against `entry.tech`.
- **Multi-select, OR semantics:** a role matches if its `tech` includes *any* selected chip. Clicking a chip toggles it.
- **No selection = neutral:** zero chips active → nothing dimmed, all roles normal.
- **Match styling:** matching cards keep full opacity + accent ring/left-bar emphasis; non-matching drop to `opacity-28` with `motion-safe` transition. Both featured and compact variants dim identically.
- **Placement:** chip bar between the intro paragraph and the timeline rail. Includes a live match count (e.g. "5 roles · Java, AWS") and a "Clear" affordance when any chip is active.
- **State:** new `activeTech` state (a `Set`/array of chip strings) in `Experience`, independent from `openCards`.
- **Chips are bilingual-neutral** (tech names are language-agnostic); the count label + "Clear" are bilingual via `pick()`/new JSON keys.

### D7 — Hover micro-interactions (no scroll-reveal)

- Card hover: lift (`-translate-y`) + accent glow (already partly present on featured). Extend consistent hover to compact rows.
- Timeline dot: subtle glow/scale on row hover.
- **No scroll-triggered animation.** Respect `D-v4.0-NO-SCROLL-REVEAL` — no `useInView`, no draw-in-on-scroll. All motion is hover/toggle/filter-driven and `motion-safe`.

### Accessibility (v2)

- Filter chips are `<button>` with `aria-pressed` reflecting active state.
- An `aria-live="polite"` region announces the match count when filters change.
- Dimmed non-matching cards stay in the DOM and keyboard-focusable (dim is visual only, not `aria-hidden`).
- Respect `prefers-reduced-motion`: opacity/dim still applies (state clarity), but transforms/transitions gate on `motion-safe`.

### Testing (v2, additive)

- Chip bar renders the curated chips.
- Clicking a chip sets `aria-pressed=true` and marks matching roles (e.g. `Kubernetes` → Blerify highlighted, others carry the dim class).
- Multi-select: two chips active → union of matches highlighted (OR).
- Clear/deselect → no roles dimmed.
- Match-count live region updates with selection.
- Regression: all prior featured/compact + expand tests stay green.

## Out of scope

- Refining metric values/copy (deferred — "luego mejoramos las experiencias").
- Horizontal scrub (direction A) and sticky scroll-progress (direction B) — not chosen.
- Filter-out/collapse behaviour, category/era filters — rejected in favour of tech highlight+dim.
- Era grouping / pagination.
- Reordering entries (chronology stays as-is in JSON).
