# World RPG — Career Exploration Design

**Date:** 2026-07-29
**Branch:** `feat/game-feel-juice` (evolves the existing `src/game/` module)
**Status:** Approved design — ready for implementation plan

## Summary

Evolve the current side-scroll platformer (`src/game/`) into a **top-down, free-roam exploration RPG** in the spirit of Pokémon / Super Mario World / Harvest Moon 64. The player controls an avatar (Carlos) who walks a continuous overworld, starting at a **Farm** (origin/home base) and journeying chronologically through **era regions** (Java/JEE → SOA → Microservices → Cloud → Claude/AI). Each experience is a building (house / castle / point of interest); walking up to it opens a Pokémon-style dialog box with the role, dates, achievements, and tech. A **Konami code** reveals hidden roads to independent side-project sites.

**No combat. No stats/XP. No inventory. No lose condition.** The goal is a *recorrido* — a guided-yet-free discovery of Carlos's career.

## Purpose & Constraints

- **Audience:** recruiters/employers. The RPG must *deliver the career story*, not bury it. Story-forward, quick to read, never forces play.
- **Bilingual:** EN/ES throughout, using the existing `{en, es}` data shape and `t()` pattern.
- **Stack:** stays within the current game module (vanilla JS canvas engine under `src/game/`). No new heavy deps.
- **Performance:** must not regress the site's Lighthouse budget; the game view loads only when launched.
- **Reuse over rewrite:** keep the proven engine core and test infrastructure (59 existing game tests as the pattern).

## Approach (chosen)

**Evolve in place, reuse the core.** Keep `engine/loop.js`, `engine/input.js` (extended to 4-directional), `engine/camera.js`, `world/biomes.js`, and the career→data mapping in `world/companies.js`. Replace movement and level geometry. Remove all combat. Add dialog + interactable buildings + hidden discovery.

Rejected: a from-scratch rewrite (discards working loop/input/camera/data/test infra for no gain).

### Reuse / Replace / Remove / Add

| Action | Modules |
|--------|---------|
| **Reuse** | `engine/loop.js`, `engine/input.js` (+4-dir), `engine/camera.js`, `world/biomes.js`, `world/companies.js` mapping, `render/sprites.js` scaffolding, `*.test.js` conventions |
| **Replace** | `engine/physics.js` (gravity) → `engine/topdown.js` (AABB collision, no gravity); `world/level.js` (side-scroll level) → `world/overworld.js` (regions + sites + roads); `render/scene.js` → top-down renderer |
| **Remove** | `entities/enemy.js`, `entities/combo.js`, `entities/powerup.js`, boss logic, q-blocks, combat coins, `render/popups.js` (score popups) |
| **Add** | `world/overworld.js`, `engine/topdown.js`, `entities/site.js`, `render/dialog.js`, Konami discovery input handling |

## World Model

- **Continuous overworld**, free scroll, camera follows the avatar and clamps to world bounds.
- **Start: the Farm** — Carlos's origin/home base (Harvest Moon 64 flavor). Avatar spawns here. Roads lead out toward the first era region. Conceptually the "year zero" of the career.
- **Era regions** derived from `world/biomes.js` ranges, laid out chronologically toward the present:
  - `pradera` Java/JEE Legacy (2007–2012)
  - `desierto` SOA / Middleware (2013–2017)
  - `selva` Microservices (2018–2021)
  - `cyber` Cloud / Kubernetes (2022–2024)
  - `castillo` Claude Code / AI (2025–2026)
  - Ground palette shifts per region using each biome's colors.
- **Sites (buildings)** = experience entries from `src/data/experience.json` (11 entries, `visible !== false`). Site visual type is chosen by data:
  - `featured: true` → **castle** (the 5 flagship roles)
  - otherwise → **house / point-of-interest**
  - The most recent role (highest start year) reads as the climactic castle in the AI region.
  - No `boss` entries exist in the data; site typing is purely `featured` vs regular.
- **Roads** connect the Farm → sites → next region, forming the traversable path network. Off-road areas are blocked by simple collision.
- **Hidden side-project sites** are placed on branch roads, initially not rendered/collidable, flagged `hidden: true`. Revealed by the Konami code.

## Units (each independently testable)

1. **`world/overworld.js` — `buildOverworld(experienceJson, biomeForYear)`**
   Pure builder. Input: experience entries + biome resolver. Output: `{ farm, regions[], sites[], roads[], hiddenSites[], worldBounds }`. Positions sites/roads deterministically (no RNG, or seeded) into a tile grid ordered by start year. Marks featured→castle, others→house, side-projects→hidden.

2. **`engine/topdown.js` — movement + collision**
   4-directional avatar movement, AABB collision against building/road-edge/world-bound rectangles, no gravity. Avatar never overlaps a solid or leaves `worldBounds`. Movement is frozen while a dialog is open.

3. **`entities/site.js` — interactable building**
   Holds position, door rect, visual type, and the bound experience entry. Exposes a proximity test (`isPlayerAtDoor(player)`) used to raise the interaction prompt.

4. **`render/dialog.js` — dialog state machine**
   States: `closed → opening → typing (typewriter) → waiting → advancing → closed`. Renders a Pokémon-style box. Content pulled from the site's entry (`title`, `date`, `metric`, `bullets`, `tech`) in the active language. Advances page-by-page on key press. Missing fields (e.g. no `metric`) skip their line.

5. **Interaction glue**
   When the avatar is at a site door and no dialog is open, show a "▲" prompt. Confirm key opens that site's dialog and freezes movement; closing the dialog restores movement.

6. **Konami discovery**
   Buffer recent directional/AB inputs; on matching the Konami sequence, flip `hiddenSites`/hidden roads to revealed (rendered + collidable + interactable). Idempotent — re-entering the code does not duplicate or toggle back. Optional small on-screen confirmation.

7. **`render/scene.js` — top-down renderer**
   Draw order: ground tiles (per-region palette) → roads → buildings → avatar (4-dir sprite) → interaction prompt → dialog overlay → minimal HUD (current era label + discovery progress).

8. **`engine/camera.js` (reused)**
   Follows avatar, clamps to `worldBounds`.

## Data Flow

```
experience.json + biomes.js
  → buildOverworld()  → world model { farm, regions, sites, roads, hiddenSites, bounds }
  → game state        { avatar pos/dir, dialog state, konamiRevealed, konamiBuffer }
  → per frame:  input → move → collide → camera → interaction check → (konami check)
  → render:     tiles → roads → buildings → avatar → prompt → dialog → HUD
```

Bilingual text resolves at render time from `{en, es}` fields via the active language, matching the rest of the site.

## Journey / Goal

No win/lose. Start on the Farm, walk toward the present. Reading a site's dialog marks it discovered. Discovering all visible sites **and** unlocking the Konami side-project route = a "complete recorrido." Progress shown in the HUD (e.g. `sites 4/11`, plus a hidden-route indicator once unlocked). The player may leave at any time.

## Error Handling & Edge Cases

- Missing entry fields (no `metric`, empty `tech`) → dialog omits those lines cleanly.
- Collision guarantees the avatar never enters a building interior, crosses a road wall, or exits `worldBounds`.
- Dialog open ⇒ movement input ignored (no walking away mid-sentence; a page-advance/close key is the only accepted input).
- Konami reveal is idempotent and one-way for the session.
- Hidden sites are neither rendered nor collidable until revealed (no invisible walls).

## Testing (TDD, existing `*.test.js` convention)

Pure-unit tests, red→green→refactor:

- `overworld.test.js` — deterministic layout, chronological ordering, featured→castle typing, hidden flagging, bounds.
- `topdown.test.js` — 4-dir movement, blocked by solids, clamped to bounds, frozen during dialog.
- `site.test.js` — proximity/door detection.
- `dialog.test.js` — state machine transitions, page paging, missing-field skipping, language switch.
- `konami.test.js` — buffer matching, idempotent reveal, hidden→visible flip.

Coverage target consistent with the current suite.

## YAGNI Cuts (explicitly out of scope for v1)

- Combat, enemies, bosses, score/combo, powerups.
- Stats, XP, leveling, skill trees, inventory.
- Interior scenes (the building's dialog *is* the content; no walk-in rooms).
- Standalone NPC characters (a static NPC sprite beside a building is optional decoration only).
- Save system — at most a minimal `localStorage` of discovery progress; may be deferred entirely.
- Procedural/large tile art — reuse biome palette colors and simple pixel building sprites.

## Assumptions (low-risk, easy to revise)

- The game runs as a **dedicated game view/route** launched from the portfolio, loaded on demand — not embedded in the main scroll. (Matches the existing standalone game module.)
- Konami sequence: `↑ ↑ ↓ ↓ ← → ← → B A` (final key mapping adjustable).

## Open Items for the Plan

- Exact tile size / world dimensions and Farm layout.
- Building sprite set (castle vs house vs POI) and avatar 4-dir sprite frames.
- Region-to-region visual seam (palette gradient band vs hard edge).
- Whether to persist discovery progress in `localStorage` for v1.
