# Mario-World Experience Map — Design Spec

**Status:** Approved (brainstorming complete)
**Date:** 2026-06-10
**Supersedes:** `2026-05-29-game-mode-design.md` (v3.8 Game Mode constellation)
**Candidate milestone:** v3.11
**Author context:** Operator pivot during v3.10.1 hotfix iteration after operator feedback "se ve raro" + "constelacion como si fuese un pequeno mundo mario bros donde cada mundo es cada una de empresas o experiencias donde he trabajado"

## Summary

Replace the WebGL 3D skill-constellation (v3.8–v3.10.1) with a Mario-Bros-inspired world-map landing experience. Each "world" represents a company where Carlos has worked; multiple roles within the same company are levels inside the world. Non-experience sections (About, Skills, Projects, Claude Code, Contact) are special worlds with their own icons. The map is a free-roam 2D space organized into 5 themed biomes (era + stack). Avatar = pixel-art Carlos sprite. Hidden worlds unlock via terminal-style commands. Mobile uses drag+tap on the same WebGL renderer. Reduced-motion users get an accessible DOM list fallback. Recruiter chooses between Game (mario-world) and Dev (classic CV scroll) at first paint.

## Goal

Recruiter on first paint sees a distinctive, interactive map of Carlos's career as a navigable world. The metaphor encodes the chronological + technological progression (Java Legacy → SOA → Microservices → Cloud → AI) into visible spatial biomes. The Mario-language is recognizable but the visual identity is the portfolio's own (dark + neon + monospace + brand palette), portfolio-grade not infantile. Recruiter who prefers a sober resume picks "View as CV" — same data, classic scroll layout.

## Out of scope

- Real Mario IP (no Bowser, no Mushroom Kingdom, no 8-bit Mario sprite)
- Free-look camera or pinch-zoom on mobile
- Per-world ambient audio (defer to v3.12+)
- Save state across visits (`localStorage.cam-viewmode` is the only persistence; map state resets every visit)
- Multiplayer / leaderboards / scoring
- Skill constellation (deprecated; code removed in this milestone)

## Locked decisions (brainstorming Q1–Q19)

| # | Decision | Choice |
|---|---|---|
| 1 | Replace vs coexist | A — Total replacement of constellation |
| 2 | World granularity | C — Company = world, roles = levels |
| 3 | Map scope | C — Hero → Press Start → Map contains all sections as worlds |
| 4 | Visual direction | B — Mario-inspired with own identity (dark + neon + monospace) |
| 5 | Avatar | B — Pixel-art Carlos (16x16 sprite) |
| 6 | Navigation | C — Free roam 2D `←/→/↑/↓` |
| 7 | Map shape | D — Themed biomes |
| 8 | Biome cohorts | A — Era + stack: Pradera/Desierto/Selva/Cyber/Castillo |
| 9 | World reveal | C — Cinematic zoom (camera enters the world, blur backdrop, overlay) |
| 10 | Mobile interaction | A — Drag + tap on shared WebGL renderer |
| 11 | Non-experience sections | A — Special worlds with own icons distributed by narrative |
| 12 | a11y / reduced-motion | A — RM users fallback to DOM list (`SvgWorldMap`) |
| 13 | Hidden worlds unlock | B — Terminal-style command (`/secret-name`) |
| 14 | Hidden worlds quantity | D — Dynamic N (architecture supports any count) |
| 15 | Persistence | A — Nothing saved (fresh every visit, except viewMode pick) |
| 16 | Renderer tech | A — WebGL three.js (reuse v3.10.1 infra) |
| 17 | Dev view | D — Initial Game/Dev gate screen + localStorage pick |
| 18 | Hero strategy | B — Current Hero preserved + 2 new buttons (Enter / Skip to CV) |
| 19 | Bundle budget | A — Keep 130 kB gz gate, aggressive optimization |

## Architecture

```
src/
├── marioWorld/                          ← replaces src/game/
│   ├── MarioWorld.js                    Orchestrator
│   ├── HeroGameGate.js                  Hero + 2 buttons (Enter / Skip)
│   ├── WorldMap.js                      Capability wrapper (WebGL vs SVG fallback)
│   ├── DevView.js                       Classic scroll view (Hero → sections from sections.js)
│   ├── WorldErrorBoundary.js            (renamed from ConstellationErrorBoundary)
│   ├── renderers/
│   │   ├── WebGLWorldMap.js             Mapa principal three.js
│   │   ├── WebGLWorldMap.test.js
│   │   ├── SvgWorldMap.js               DOM fallback for RM + capability-low
│   │   └── SvgWorldMap.test.js
│   ├── hooks/
│   │   ├── useWorldNav.js               ←/→/↑/↓ + drag/tap avatar position
│   │   ├── useWorldNav.test.js
│   │   ├── useSecretCommand.js          Buffer of keystrokes → match → unlock
│   │   ├── useSecretCommand.test.js
│   │   ├── useCinematicZoom.js          Zoom in/out state machine
│   │   └── useCinematicZoom.test.js
│   ├── overlays/
│   │   ├── WorldDetailOverlay.js        role=dialog full-screen with focus trap
│   │   └── SecretCommandHint.js         Discreet caret hint bottom-right
│   └── data/
│       ├── worlds.derive.js             Pure derivation EXPERIENCE + SKILLS + SECTIONS + SECRET_WORLDS → worlds[]
│       ├── worlds.derive.test.js
│       ├── biomes.js                    BIOMES constants (era ranges + color + tile)
│       └── secret-worlds.js             Hidden worlds data (dynamic N)
│
├── data/
│   ├── experience.js                    + `company` field per entry
│   ├── skills.js                        unchanged (featured-tier from v3.10.1)
│   └── sections.js                      NEW — single source of truth for About/Skills/Projects/Claude/Contact content
│
└── context/
    └── ViewModeContext.js               extends to support 'game' | 'dev' | null
```

### Reuse from v3.10.1

- `useRendererCapability.js` — WebGL vs SVG capability gate, no changes
- `useClickVsDrag.js` — drag vs tap threshold arbitration (5px mouse / 8px touch / 250ms), reused inside `WorldMap`
- `OnboardingHint.js` — bilingual pill pattern, repurposed for first-visit "← → flechas para moverte" hint
- `WorldErrorBoundary` — renamed from `ConstellationErrorBoundary` with same recovery semantics
- `useThemeContext` / `useLanguage` — unchanged
- Bundle-gate 3-tier ladder (`scripts/check-bundle-gate.mjs`) — same 60/125/130 kB gz tiers

### Removed (deprecated by this milestone)

- `src/game/` complete directory
- `constellation.layout.js` + `constellation.graph.js`
- `WebGLConstellation.js` + `SvgConstellation.js`
- `SkillFilters.js` + filter logic (no filters in mario-world map)
- `useConstellation.js`
- `ExperienceCard.js` (legacy structure; semantic layer migrates into `WorldDetailOverlay`)
- `<About>`, `<Skills>`, `<Projects>`, `<Claude>`, `<Contact>` legacy components (content now lives in `sections.js`)

## Components

### `MarioWorld.js` (orchestrator)

Replaces `GameMode.js`. Top-level:
1. Reads `EXPERIENCE`, `SKILLS`, `SECTIONS`, `SECRET_WORLDS` once at module load
2. Calls `deriveWorlds()` to produce `WORLDS[]`
3. Reads `viewMode` from `ViewModeContext` (`'game' | 'dev' | null`)
4. Routes:
   - `viewMode === null` → `<HeroGameGate onPick={setViewMode} />`
   - `viewMode === 'dev'` → `<DevView worldsData={WORLDS} />`
   - `viewMode === 'game'` → `<WorldMap worldsData={WORLDS} />`

### `HeroGameGate.js`

Renders `<Hero />` (current Hero component intact: photo + char-reveal H1 + CTAs + 4-stat grid). Below stat-grid: 2 bold buttons:

```
[ ▶ Enter the World (Game) ]   [ 📄 View as CV (Dev) ]
```

Click sets `viewMode` via context + persists to `localStorage.cam-viewmode`. If localStorage already has `'game' | 'dev'` at mount, the gate is skipped (orchestrator routes directly).

### `WorldMap.js`

Capability wrapper. Reuses `useRendererCapability`. Decides:
- `effectiveCapability === 'webgl' && !prefersReducedMotion && !forceSvgFallback` → `<WebGLWorldMap />` (lazy chunk)
- Otherwise → `<SvgWorldMap />`

Wraps in `WorldErrorBoundary` for runtime error rescue → swap to `SvgWorldMap`.

### `WebGLWorldMap.js`

The main renderer. Scene:
- **Backdrop biomes:** 5 `THREE.Mesh` planes (PlaneGeometry + texture per biome), positioned on XY at z=−10. Each biome's plane covers its bbox.
- **Path:** `THREE.LineSegments` connecting neighbouring worlds (zigzag intra-biome + bridges inter-biome). Color dim (`#404040`).
- **Worlds:** `THREE.Sprite` per world, texture = pictogram for that world's type/icon. Position from `world.position {x, y}`. z=0.
- **Player avatar:** `THREE.Sprite` with sprite-sheet texture (Carlos pixel-art 16x16, 4-frame walk + idle). Position from `useWorldNav`. z=+5.
- **Camera:** `PerspectiveCamera(fov=55, near=10, far=2000)`, top-down, follows avatar with damping (lerp factor 0.08). During cinematic zoom, pans + zooms to target world.
- **Lights:** AmbientLight + directional; or unlit `MeshBasicMaterial` to save shader cost.

Inputs:
- `←/→/↑/↓` → `useWorldNav` updates avatar position
- Mouse drag on canvas → camera offset pan (separate from avatar)
- Hover world → highlight sprite + tooltip label
- Click / Enter on focused world → `useCinematicZoom.start(worldId)` → after animation completes, mount `<WorldDetailOverlay>`
- Mobile: 1-finger drag = pan camera; tap = arbitrated by `useClickVsDrag` then `useCinematicZoom`
- `webglcontextlost` → `onContextLost` callback to `MarioWorld` → set `forceSvgFallback` → re-mount

### `SvgWorldMap.js` (fallback)

DOM-only. Renders worlds as a vertical accessible list grouped by biome:

```html
<section aria-labelledby="biome-pradera">
  <h2 id="biome-pradera">Pradera (2007–2012) — Java / JEE Legacy</h2>
  <ol>
    <li><button onclick="openWorld('company:acme')">Acme Corp — Backend Engineer, 2007–2010</button></li>
    ...
  </ol>
</section>
```

A11y: roving tabindex per `<ol>`, `aria-expanded` on world buttons that open overlay, `Esc` closes overlay, focus trap inside overlay. Lighthouse a11y 100 expected.

### `WorldDetailOverlay.js`

Full-screen `role="dialog" aria-modal="true"` with focus trap. Reuses semantic layer from `ExperienceCard` (legacy → migrated here). Content rules:
- **Company world:** header = company name + biome badge; body = each `level` (role): title, period, location, bullets (bilingual), tech chips; CV CTA download (bilingual)
- **Section world (About/Skills/Projects/Claude/Contact):** body = `section.content[lang]` (richtext or component slot)
- **Secret world:** body = unlock context + `secret.content[lang]`

Close: `Esc`, click outside (backdrop click), close button (top-right). On close: `useCinematicZoom.stop()` → camera zooms back out → overlay unmounts.

### `DevView.js`

Classic scroll view. Renders Hero + each section from `SECTIONS` in order (About → Skills → Experience → Projects → Claude Code → Contact). Experience renders as a chronological list (no biomes, no map). Scroll-spy nav (existing) wires section IDs.

### `SecretCommandHint.js`

Discreet caret in bottom-right corner of viewport when `WorldMap` is mounted (game mode only). Visual: monospace `_` blinking. `aria-hidden="true"`. Click expands to a tooltip: "Try typing a command" (bilingual). Purely a hint; doesn't intercept keystrokes (that's `useSecretCommand`).

## Data flow

### Sources of truth

1. **`src/data/experience.js`** — `EXPERIENCE[]` with new `company` field per entry. Multiple entries with same `company` are roles within that company's world (levels).
2. **`src/data/skills.js`** — `SKILLS` map (unchanged from v3.10.1; featured-tier preserved for potential reuse in Skills section content).
3. **`src/data/sections.js`** — NEW. Catalog of non-experience sections with `id`, `biome`, `icon`, `label{en,es}`, `content{en,es}`. Replaces legacy `<About>`, `<Skills>`, etc. content as the single source.
4. **`src/marioWorld/data/secret-worlds.js`** — NEW. Hidden worlds array; each entry has `id`, `command` (e.g. `'/about-secret'`), `label{en,es}`, `biome`, `content{en,es}`. Dynamic N entries.

### Derivation (`worlds.derive.js`)

Pure function:

```js
deriveWorlds(experience, skills, sections, secretWorlds) → worlds[]
```

Steps:
1. **Group experience by `company`** → 1 `companyWorld` per company; `levels` array sorted chronologically (earliest first)
2. **Map sections** → 1 `sectionWorld` per section with `type: 'section'`
3. **Map secret worlds** → 1 `secretWorld` per entry with `type: 'secret'` + `hidden: true`
4. **Assign biome** via `pickBiome(period.start)` using `BIOMES.era` ranges (deterministic)
5. **Assign positions** via `assignPositions(worlds)` — deterministic XY per biome (similar to `constellation.layout.js` CATEGORY_Z pattern but 2D)

Output: `{ id, type, label, biome, levels?|content, icon?, hidden?, position: {x, y}, command? }[]`.

### Biomes

```js
const BIOMES = {
  pradera:  { era: [2007, 2012], stack: 'Java / JEE Legacy',  color: '#5cb85c', tile: '/sprites/biome-pradera.webp' },
  desierto: { era: [2013, 2017], stack: 'SOA / Middleware',   color: '#d4a55b', tile: '/sprites/biome-desierto.webp' },
  selva:    { era: [2018, 2021], stack: 'Microservices',      color: '#2e6b3f', tile: '/sprites/biome-selva.webp' },
  cyber:    { era: [2022, 2024], stack: 'Cloud / Kubernetes', color: '#3b82f6', tile: '/sprites/biome-cyber.webp' },
  castillo: { era: [2025, 2026], stack: 'Claude Code / AI',   color: '#a855f7', tile: '/sprites/biome-castillo.webp' },
}
```

Biome assignment: `entry.period.start` falls into a `BIOMES[*].era` range. Edge cases (gaps between eras, future years) → clamp to nearest biome.

### Runtime flow

```
At module load:
  EXPERIENCE + SKILLS + SECTIONS + SECRET_WORLDS
            ↓ deriveWorlds()
       WORLDS[] (with hidden=true entries unrendered)
            ↓
At mount:
  MarioWorld reads viewMode from context
            ↓
  WorldMap renders WORLDS where !hidden
            ↓
User types "/about-secret":
  useSecretCommand matches → setLocalState unlocked = ['about-secret']
            ↓
  WorldMap re-renders, includes worlds where !hidden OR unlocked.includes(id)
            ↓
User clicks/focuses world:
  useCinematicZoom.start(worldId) → camera animates ~600ms
            ↓
  WorldDetailOverlay mounts, focus trap engages
            ↓
User presses Esc:
  useCinematicZoom.stop() → camera animates back ~400ms → overlay unmounts
```

## Error handling

| Scenario | Behavior |
|---|---|
| WebGL not supported | `SvgWorldMap` mounted via capability gate |
| `prefers-reduced-motion: reduce` | `SvgWorldMap` mounted; no avatar walk anim, no cinematic zoom |
| iOS Safari capability-low | `useRendererCapability` user-agent rule → `SvgWorldMap` |
| `webglcontextlost` event | `onContextLost` → `MarioWorld.forceSvgFallback = true` → re-mount `SvgWorldMap` |
| Subtree throw inside `WebGLWorldMap` | `WorldErrorBoundary` catches → renders `SvgWorldMap` as rescue |
| `localStorage.cam-viewmode` corrupt (not 'game'/'dev') | Clear key + show gate fresh |
| `localStorage` unavailable (incognito strict) | Gate shows every visit; no crash |
| Keyboard `←/→/↑/↓` with focus inside `<input>` or `<textarea>` | `useWorldNav` checks `document.activeElement.tagName` → ignores, default browser behavior |
| Avatar moves out of biome bbox | Clamp position to bbox; no wraparound |
| Mouse drag delta > viewport | Clamp delta to viewport bounds |
| Multi-touch (2 fingers) on mobile | Ignore 2nd finger; no pinch-zoom (budget gate Q19) |
| Secret command typo (`/about-secrt`) | No match; no feedback (no command leak) |
| Click world during in-progress cinematic zoom | Ignored (state machine `zoomingIn` guard) |
| Click different world while overlay open | Overlay closes first → then zoom-out → then new zoom-in |
| `Esc` during zoom-in animation | Cancels animation; camera snaps to default position |
| World data missing fields (no bullets/content) | Render placeholder bilingual "No content available"; no crash |
| i18n key missing in `content[lang]` | Fallback to raw key path; defensive (no crash) |
| Tab cycle inside overlay | Focus trap retains; doesn't escape to map below |
| 0 worlds derived (corrupt sources) | Render `"Portfolio temporarily unavailable"` message; no crash |

## Testing strategy

Vitest + RTL + jsdom inherited from v3.10.1. Three.js mocked for `WebGLWorldMap` tests (no real GL).

### Unit tests (~95 new tests target)

| File | ~Test count | Focus |
|---|---|---|
| `worlds.derive.test.js` | 12 | grouping, biome assignment, position determinism, edge cases |
| `useWorldNav.test.js` | 10 | arrow keys, clamp, focus check, drag, multi-touch ignore |
| `useSecretCommand.test.js` | 8 | buffer match, timeout reset, focus check, no leak |
| `useCinematicZoom.test.js` | 6 | state machine, race guards, esc cancel |
| `WebGLWorldMap.test.js` | 12 | mount scene, sprites count, pointer routing, contextlost |
| `SvgWorldMap.test.js` | 8 | a11y structure, roving tabindex, unlock visibility |
| `MarioWorld.test.js` | 8 | viewMode routing, localStorage skip, fallback path |
| `DevView.test.js` | 6 | scroll-spy, bilingual sections from sections.js |
| `HeroGameGate.test.js` | 6 | Hero passthrough, button labels, a11y |
| `WorldDetailOverlay.test.js` | 10 | dialog role, focus trap, content per world type |
| **Heredados** | | |
| `useClickVsDrag.test.js` | unchanged | from v3.10 |
| `useRendererCapability.test.js` | unchanged | from v3.8 |
| `check-bundle-gate.test.mjs` | unchanged | from v3.10 |

### Removed tests

- `constellation.graph.test.js` — N tests
- `constellation.layout.test.js` — N tests
- `WebGLConstellation.test.js` — many tests
- `SvgConstellation.test.js` — many tests
- `GameMode.test.js` — partial (orchestrator now MarioWorld.test.js)
- `SkillFilters.test.js` — N tests

Net target: ~340 tests (vs 293 v3.10.1 baseline).

### Manual UAT

20-UAT.md template inherited. Real-browser sweep covers:
- Cinematic zoom in/out feel + timing
- Sprite walk animation smoothness
- Biome backdrop transitions
- Drag-to-pan responsiveness desktop + mobile
- Hidden world unlock command flow
- Lighthouse mobile HARD gate Perf ≥95 / A11y 100 / BP 100 / SEO 100

## Bundle budget

| Chunk | v3.10.1 actual | v3.11 target | Gate |
|---|---|---|---|
| Mobile (index) | 9.46 kB gz | ≤ 12 kB gz | HARD 38.82 |
| WebGL (lazy) | 122.63 kB gz | ≤ 125 kB gz | INFO ≤125 / WARN 125–130 / HARD >130 |

Bundle pressure points:
- Sprite atlas Carlos (16x16 walk-cycle): WebP compressed, ~5 kB
- Biome tile textures (5 × 256x256): WebP, ~30 kB total → preload only active biome viewport
- Pictogram sprites per world: SVG → texture atlas, ~10 kB
- New renderer logic: ~15 kB gz (sprite render, zoom anim, scene management)
- Three.js core: already paid (lazy chunk shared)

Net delta on WebGL chunk vs v3.10.1: estimated −5 kB (removed: `useConstellation`, `SkillFilters`, complex shader for size-attenuation, edge alpha falloff) + +20 kB (new sprites + zoom + scene) = +15 kB → projected ~138 kB gz **violates 130 HARD**.

**Mitigations** (Plan-level concerns; flag for plan-phase):
1. Use texture compression aggressively (`UASTC` / `KTX2`) if Three.js loader cost permits
2. Pictogram sprites as inline SVG renders, not bitmap textures
3. Defer biome tile downloads to per-biome lazy chunks (split bundle by biome)
4. Profile shader chunk after migration; remove unused custom shaders from v3.10

If unmovable, escalate to `--accept WEBGL_WARN_KB=145` ADR explicitly.

## Migration strategy

Plan-phase will decide whether this milestone runs as a single phase or splits across 4 phases. Suggested phase breakdown (recommended starting point):

1. **Phase 21 — Foundation: data + dev view** — derive worlds, sections.js single-source, DevView lista clásica, HeroGameGate with both routes. Constellation still ships behind feature flag. RM users + Dev view fully functional.
2. **Phase 22 — Map renderers** — `WebGLWorldMap` + `SvgWorldMap` + capability wrapper + `WorldErrorBoundary`. No cinematic zoom yet; click world = direct overlay.
3. **Phase 23 — Cinematic zoom + nav** — `useCinematicZoom` + `useWorldNav` + sprite walk animations. Real-browser UAT for feel.
4. **Phase 24 — Secret commands + finalize** — `useSecretCommand` + `SecretCommandHint`. Delete `src/game/` directory. Bundle gate re-verify. Lighthouse mobile re-verify.

Phasing keeps each plan within context budget and allows incremental review.

## Open items for plan-phase to lock

- Exact pixel-art style of Carlos avatar (commission art? generate via tool?)
- Pictogram set for each world (custom SVGs? Use icon library?)
- Animation easing curves (ease-in-out cubic? spring?)
- Cinematic zoom duration (~600ms in / ~400ms out — needs feel testing)
- Localized period labels in biomes (EN/ES translations.js entries)
- Where exactly each non-experience world lives geographically in its biome (centroid? edge? hub?)
- Bundle mitigation strategy ordering (pictogram inlining first; biome tiles lazy second)
- Whether to keep `OnboardingHint` as nav hint or replace with new `MapNavHint`

## Open items deferred (post-milestone)

- Per-bioma ambient audio (Q15 deferred)
- Save state across visits (Q15 explicitly chose A — fresh; revisit post-MVP if UAT shows demand)
- Touch gestures beyond drag+tap (pinch-zoom, two-finger rotate)
- Per-world unique transitions (each biome has its own zoom-in animation style)
- Cross-biome quick-warp (`Tab` cycles between biome hubs)
