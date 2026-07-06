# Contact redesign — Hero CTA + rail

**Date:** 2026-07-06
**Section:** Contact (`src/components/Contact.jsx`, `src/data/contact.json`)
**Goal:** Replace the flat 5-equal-card grid with a hierarchical layout that
makes the recruiter's primary action (email) dominant, coherent with the
`CoreTile`/`SmallTile` bento of Skills and the featured/compact split of
Experience.

## Scope

Visual redesign only. Links-based (no contact form, no backend, no 3rd-party
service). No availability badge. Static-host safe.

## Decisions

- **D1 — Hierarchy:** Email is the primary CTA; LinkedIn, Phone, GitHub,
  Location are secondary. (Recruiters reach out by email/LinkedIn.)
- **D2 — Layout:** "Hero CTA + rail". Desktop = 2-column grid: left is a large
  Email hero panel spanning full height; right is a vertical rail of the 4
  secondary channels. Mobile = single column, hero on top, rail below.
- **D3 — Data flag:** Add `"primary": true` to the email card (mirrors `core`
  in Skills, `featured` in Experience). Component derives
  `hero = cards.find((c) => c.primary)` and `rail = cards.filter((c) => !c.primary)`.
- **D4 — Rail order:** LinkedIn → Phone → GitHub → Location. Enforced by
  reordering the `cards` array in `contact.json` (email first, then linkedin,
  phone, github, location).
- **D5 — Visual language:** Hero panel = accent border + neon glow
  (`shadow-[0_0_30px_rgba(0,229,168,0.10)]`), large icon, large value, `→`
  affordance, hover-lift with intensified glow — same tokens as Skills
  `CoreTile`. Rail items = compact rows, `border-border` → `hover:border-accent`,
  translate on hover — same language as `SmallTile` / Experience `CompactRow`.
- **D6 — No scroll-reveal** (binding constraint D-v4.0-NO-SCROLL-REVEAL).

## Components (`Contact.jsx`)

- `pick(field, lang)` — unchanged inline i18n helper.
- `HeroContact({ card, lang })` — large `<a href={mailto}>` panel, `data-role="primary"`.
- `RailItem({ card, lang })` — compact `<a>` row, `data-role="rail"`; external
  links carry `target="_blank" rel="noopener noreferrer"`.
- `Contact` default — header (label/h2/intro) unchanged; 2-col grid wiring hero + rail.

## Accessibility

- Hero and rail items are anchors with `aria-label={`${label}: ${value}`}`.
- Icons `aria-hidden="true"`.
- External anchors use `rel="noopener noreferrer"`.

## Tests (`Contact.test.jsx`)

- Section renders `#contact` + label/h2/intro (EN).
- Exactly 1 `data-role="primary"` and it is the email card (mailto href).
- Exactly 4 `data-role="rail"` items; each has its `href`.
- Rail order is LinkedIn, Phone, GitHub, Location.
- ES translates label/h2/intro.
- Schema sanity: email card has `primary: true`.

## Out of scope

Contact form, availability badge, analytics, any backend integration.
