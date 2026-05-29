# Game Mode — Interactive Skill Constellation

**Date:** 2026-05-29
**Status:** Approved (design) — pending implementation plan
**Type:** Feature inside existing portfolio (NOT a new project)
**Target milestone:** v3.8 "Game Mode" (new milestone; v3.7 Production Deploy paused at Plan 11-05 Lighthouse gate)

## Context & Problem

The portfolio (React 18 + Vite 6 + Tailwind 3, bilingual EN/ES, dark/light theme) presents Carlos's
career as conventional scrolling sections. Core value: stop recruiters mid-scroll and convert visits into
engineering conversations.

This feature adds an alternate **"game mode"**: an interactive, explorable visualization of skills and
experience, set as the default landing, with a one-click toggle back to the current ("dev") view. It is a
**playable interactive visualization** — explorable and playful, but with **no objective and no win/lose**.

This is a new way to present the *same* content (the existing 12 experiences and their tech), not new
content and not a separate product.

## Locked Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | Feature in existing portfolio repo, new milestone **v3.8**. Not `new-project`, not a repo replace. | It reuses portfolio data + stack; standalone/replace would clobber the live deployed site. |
| D2 | Playable **interactive visualization**, no objective / no win-lose. | Bounds scope; keeps perf + a11y manageable. |
| D3 | Metaphor = **skill constellation** (stars + edges, pan/zoom, floating cards). | User choice over timeline-world / orbital / cards-canvas. |
| D4 | **Node = skill** (tech). Click a skill → its experiences shown as floating cards. Job is secondary to skill. | User choice; edges connect skills that co-occur in the same job. |
| D5 | **Game is the default landing**; visible toggle to dev view; choice persisted in localStorage; deep-link `?mode=`. | Bold first impression matches core value. Perf/SEO risk mitigated by adaptive strategy (D7). |
| D6 | v1 navigation axes: **multi-skill select + year/timeline + skill categories**. Text search deferred. | User selection of v1 axes. |
| D7 | **Adaptive render:** desktop = full WebGL; mobile = lightweight SVG/DOM static path. Same data, two intensities. | Resolves conflict between "game default" and the HARD Lighthouse **mobile** gate. WebGL wow where it shines; gate holds on mobile; DOM fallback doubles as SEO/a11y. |
| D8 | This milestone introduces **Vitest + React Testing Library** test infrastructure. | Pays down test-infra debt deferred across 9 milestones; pure graph/filter logic is highly testable. |

## Goals

- Default landing renders an interactive skill constellation; recruiters can explore Carlos's stack visually.
- Click a skill → see the experiences (jobs) where he used it, as floating bilingual cards with detail.
- Filter/navigate by multiple selected skills, by year/timeline (2007–2026), and by skill category.
- One-click, persisted toggle between game mode and the current dev view.
- Hold the existing quality bars: Lighthouse mobile Perf ≥95 / A11y 100 / Best Practices 100 / SEO 100; WCAG 2.1 AA; bilingual EN/ES; dark/light theme.

## Non-Goals (v1)

- Text search of skills/companies (deferred).
- Sound, tutorial/onboarding, achievement animations.
- Sharing filter state via URL (beyond the `?mode=` toggle).
- Changing the *content* of the dev view or experience copy.
- WebGL on mobile.

## Architecture

Follows existing conventions (`components/`, `data/`, `i18n/`, `hooks/`, Context API mirroring
`LanguageContext` / `ThemeContext`). Framed as ports/adapters: **pure data layer** + **interchangeable
renderers** behind a single props contract.

```
src/
  context/
    ViewModeContext.js        # 'game' | 'dev', persisted localStorage (key: cam-viewmode); mirrors ThemeContext
  data/
    experience.js             # SOURCE OF TRUTH (existing; add numeric `period` field — see Data Model)
    skills.js                 # NEW: curated skill catalog — skill -> category + color + aliases
  game/                       # NEW: co-located feature
    GameMode.jsx              # orchestrator: capability/viewport detection -> chooses renderer
    useConstellation.js       # hook: graph model + filter state (pure selectors)
    constellation.graph.js    # derives skill nodes / co-occurrence edges / year ranges from experience.js
    constellation.layout.js   # node positions via d3-force, precomputed at build time
    SkillFilters.jsx          # multi-skill + year timeline + category chips + reset
    ExperienceCard.jsx        # floating card (DOM overlay over any renderer; a11y dialog/popover)
    renderers/
      WebGLConstellation.jsx  # desktop, lazy-loaded (three / react-three-fiber)
      SvgConstellation.jsx    # mobile + fallback, accessible DOM/SVG
```

**Renderer contract (the "port"):** both renderers receive identical props:
`{ nodes, edges, highlightedSkillIds, selectedSkillId, yearRange, theme, lang, onSelectSkill, onHoverSkill }`.
WebGL and SVG are swappable adapters; only `GameMode` knows which one is mounted.

**Components:**
- `ViewModeProvider` — game/dev state + localStorage persistence + optional `?mode=game` deep-link.
- `GameMode` — detects desktop ≥ breakpoint, WebGL support, `prefers-reduced-motion`, `saveData`;
  mounts `WebGLConstellation` (React.lazy + Suspense, separate chunk) or `SvgConstellation`.
- `ExperienceCard` — DOM layer above the canvas; `role="dialog"`/popover, focus trap, Esc closes, returns focus.
- `SkillFilters` — category chips, multi-select, year timeline slider, reset.
- SEO/a11y fallback — visually-hidden but DOM-present semantic list of all experiences (full text) so
  crawlers/ATS/screen readers get content in both render paths.
- `App.jsx` — renders `<GameMode/>` or the current section components based on ViewMode.

**Data flow:**
1. `experience.js` → `constellation.graph.js` derives unique skills, experiences-per-skill, co-occurrence
   edges, year ranges, category (via `skills.js`).
2. `useConstellation` holds filter state (`selectedSkills[]`, `yearRange`, `category`); pure selectors
   compute the highlighted subset.
3. Renderer draws nodes/edges + highlight state. Clicking a skill sets `selectedSkillId` →
   `ExperienceCard(s)` for that skill's experiences.
4. ViewMode toggle swaps the whole subtree; choice persisted.

## Data Model

**Unique skills in `experience.js` `tech[]`: ~27.** Normalize duplicates: `GCP` + `Google Cloud` → one
canonical skill; `GKE` stays separate (k8s on GCP).

**`skills.js` (NEW, curated):** adds category + color + aliases. Does NOT duplicate edges (edges derive
from `tech[]`).

```js
export const SKILL_CATEGORIES = {
  lang:     { en: 'Languages & Frameworks',     es: 'Lenguajes & Frameworks',     color: '#3b82f6' },
  ai:       { en: 'AI Tooling',                 es: 'Herramientas IA',            color: '#a855f7' },
  arch:     { en: 'Architecture & Integration', es: 'Arquitectura & Integración', color: '#06b6d4' },
  cloud:    { en: 'Cloud',                      es: 'Cloud',                      color: '#10b981' },
  devops:   { en: 'DevOps & Infra',             es: 'DevOps & Infra',             color: '#f59e0b' },
  security: { en: 'Security',                   es: 'Seguridad',                  color: '#ef4444' },
  data:     { en: 'Data',                       es: 'Datos',                      color: '#8b5cf6' },
  hardware: { en: 'IoT & Hardware',             es: 'IoT & Hardware',             color: '#ec4899' },
}
```

**Skill → category mapping:**

| Category | Skills |
|----------|--------|
| lang | Java, Spring Boot, JEE 5 |
| ai | Claude Code, GitHub Copilot, JetBrains Junie |
| arch | Microservices, Oracle Service Bus, WebSphere, KrakenD |
| cloud | AWS, Google Cloud (+GCP alias), GKE |
| devops | Kubernetes, Docker, Jenkins, SonarQube, Nexus |
| security | Keycloak, Spring Security |
| data | Oracle SQL, SQL Server, MySQL |
| hardware | IoT, Asterisk, Raspberry Pi |

Spring Security is assigned to `security` (it appears in both lang and security conceptually; pick one to
keep each skill node single-category). Final call confirmed at implementation: **security**.

**Graph (`constellation.graph.js`, pure):**
- Node per skill: `{ id, label, category, color, count, years: [min, max], experienceIdx: [] }`
  (node size ∝ count; bigger = used in more jobs).
- Edge per pair of skills appearing in the same job: `{ source, target, weight }` (weight = shared jobs;
  thicker = more co-occurrence).

**Year / timeline:** Add a numeric field to each experience (display string `date` stays for rendering):
```js
period: { start: 2026, end: null }   // null = Present
```
Drives the timeline slider reliably without fragile regex parsing of the localized `date` string. 12 entries.

**Layout (`constellation.layout.js`):** d3-force **precomputed at build time** → baked positions, no jank,
deterministic, identical desktop/mobile. Category clustering via per-category centroid forces (`forceX/Y`)
→ visual grouping by color/zone. Desktop WebGL adds gentle physics/jitter around baked positions for a
"living" feel; mobile/SVG uses static baked positions (no d3-force in the client bundle).

**Filter selectors (pure, in `useConstellation`):**
- `selectedSkills[]` → highlight those nodes + their edges + their experiences.
- `yearRange[from, to]` → dim skills whose `period` does not intersect.
- `category` → highlight/cluster that zone, dim the rest.
- Combinable (intersection); reset clears all.

**`ExperienceCard` data (per experience):** title, company, `date` (display string), location, bullets,
tech chips (colored by category), CTA (CV download / contact) — all bilingual via `lang`.

## UX / Layout

**Desktop (WebGL):** full-screen constellation. Toggle (🎮 Juego | Dev) top-right; language/theme controls
top-left (reuse existing). Bottom control bar: category chips + year timeline slider. Clicking a skill
floats an `ExperienceCard` anchored near the node. Gentle physics/glow; ambient starfield (decorative,
`aria-hidden`, off under reduced-motion).

**Mobile (SVG / static):** static constellation (no physics). Toggle compact at top. `ExperienceCard`
presented as a bottom-sheet. Category chips horizontally scrollable. Tuned to hold the Lighthouse mobile gate.

## Adaptive Strategy

- `GameMode` detects: viewport (desktop ≥ breakpoint — exact value confirmed in plan), WebGL support,
  `prefers-reduced-motion`, `navigator.connection?.saveData`.
- Desktop + WebGL + no reduced-motion → `WebGLConstellation` (lazy chunk, NOT in initial bundle).
- Otherwise (mobile, no WebGL, reduced-motion, save-data) → `SvgConstellation` static.
- Toggle to Dev → unmount game, mount current sections.

## Performance Budget

Must hold the HARD Lighthouse **mobile** gate (Perf ≥95 / A11y 100 / BP 100 / SEO 100 — the v3.4 baseline).
- Mobile path = SVG/DOM, minimal JS, baked positions → no three.js, no d3-force on the client.
- three.js only in the lazy desktop chunk → excluded from the initial mobile load Lighthouse measures.
- No new heavy images (vector). Reuse existing fonts.
- Target: mobile path adds < ~30KB gz over the current baseline.

## Accessibility (WCAG 2.1 AA)

- SVG nodes: `role="button"`, `tabindex`, `aria-label` (skill + experience count); keyboard navigable
  (Tab / arrow keys), Enter selects.
- `ExperienceCard`: `role="dialog"`/popover, focus trap, Esc closes, focus returns to the node.
- sr-only semantic fallback: full experience list in DOM (crawlers / ATS / screen readers) in both paths.
- AA contrast for chips/cards in dark AND light themes. Toggle and filters keyboard-operable.
- `prefers-reduced-motion` → no physics/particles, instant transitions.

## Error Handling

- WebGL init failure / throw → ErrorBoundary around `WebGLConstellation` falls back to `SvgConstellation`
  (graceful degradation, never a broken screen).
- Skill with no experiences / empty data → empty state with message, never a crash.
- localStorage unavailable → default to game mode in memory (`typeof window` guard, as in LanguageContext).

## Testing

Introduce **Vitest + React Testing Library** (this milestone; pays down deferred test-infra debt).
- Pure logic first (highest value, no DOM): `constellation.graph.js` derivation (nodes/edges/year ranges)
  and `useConstellation` filter selectors → near-100% unit coverage.
- Component tests (RTL): ViewMode toggle + persistence, `ExperienceCard` open/close/focus, `SkillFilters`
  selection behavior, capability-based renderer selection.
- Lighthouse mobile remains the hard post-build gate.

## v1 Scope (YAGNI)

**In:**
- Skill-node constellation + co-occurrence edges + category clustering.
- Multi-skill select + year timeline + category chips + reset.
- Floating bilingual `ExperienceCard` + CV CTA.
- Persisted game/dev toggle + `?mode=` deep-link.
- Adaptive desktop/mobile + a11y + SEO fallback.
- Vitest + RTL test infrastructure.

**Deferred:** text search, sound, tutorial/onboarding, URL-encoded filter state, achievement animations,
WebGL on mobile.

## Constraints

- Stack stays React 18 + Vite 6 + Tailwind 3. No framework change.
- Bilingual EN/ES throughout; dark/light theme parity.
- Hold the Lighthouse mobile HARD gate and WCAG 2.1 AA.
- Reuse existing tokens/theme system and i18n context patterns.

## Open Questions (resolve during planning)

- Exact desktop breakpoint for WebGL activation.
- WebGL library: raw three.js vs react-three-fiber vs a thin force-graph wrapper (bundle vs ergonomics).
- CV CTA target inside the card (reuse existing `CV_Carlos_Montoya_{EN,ES}.docx` assets).
- Whether to run d3-force layout at build via a script or commit baked positions as data.

## Relationship to GSD Workflow

- This is GSD-managed. v3.7 (Production Deploy) is paused at Plan 11-05 (Lighthouse gate) and should be
  finished or explicitly deferred.
- Implementation proceeds as **new milestone v3.8** via `/gsd:new-milestone`, consuming this spec, rather
  than `/gsd:new-project` (which is blocked — project already exists).
