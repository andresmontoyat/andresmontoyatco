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

- **Open 2D overworld** — free roam in all directions (Pokémon / Harvest Moon 64), NOT a linear left→right corridor. Camera follows the avatar on both axes and clamps to world bounds. (An early straight-band prototype was rejected as too flat.)
- **Organic era regions** — the map is partitioned into zones by proximity to region anchor points (Voronoi-style blobby borders), each zone painted with its biome tileset, so eras blend into one another instead of hard vertical stripes. A soft, winding path suggests the chronological route but the player may wander anywhere on walkable terrain.
- **Scenery & obstacles** — trees, rocks, ponds/water and flowers populate each region; trees/rocks/water are solid (block movement), flowers are decoration. Depth-sorting by base-Y makes the avatar pass behind taller objects (buildings, trees) for real overworld depth.
- **Start: the Farm** — Carlos's origin/home base (Harvest Moon 64 flavor), a fenced plot with tilled fields and a barn. Avatar spawns here. The winding path leads out toward the first era region. Conceptually the "year zero" of the career.
- **Era regions** derived from `world/biomes.js` ranges, anchored across the 2D map in chronological order toward the present:
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
   Depth-sorted draw: ground tiles (per-region tileset) → water → roads → shadows → flowers → **y-sorted layer** (buildings, trees, rocks, critters, avatar interleaved by base-Y so tall objects occlude the avatar) → particles → interaction prompt → lighting overlay → dialog overlay → HUD → minimap.

8. **`engine/camera.js` (reused, eased)**
   Follows avatar with smooth lerp easing on both axes, clamps to `worldBounds`. Supports scripted moves for the intro and the Konami reveal.

9. **`render/ambient.js` — living world**
   Wind-swayed trees/grass, water waves, chimney smoke, waving flags, windmill rotation, wandering critters (chickens/butterflies/birds), fireflies at night. Each element time-driven and seeded for determinism.

10. **`render/lighting.js` — day/night cycle**
    A slow time-of-day tint (warm day → dusk → night blue) as a multiply/overlay pass, long shadows, and lamps/windows that emit a glow after dusk. Purely cosmetic; never affects collision or readability of dialog.

11. **`render/juice.js` — feedback & particles**
    Proximity glow on the nearest site, dialog open/close pop (scale ease), discovery burst (✓ + particles) when a site is first read, subtle screen-shake on the Konami reveal, floating dust on footsteps. Pooled particles.

12. **`audio/music.js` + `audio/sfx.js` (extends existing `audio/sfx.js`)**
    Region-aware chiptune loop that crossfades when the biome under the avatar changes; SFX for footstep, confirm, discover, and Konami fanfare. Global mute toggle, off by default until first user gesture (autoplay policy).

13. **`intro.js` — 3-second opening**
    Camera descends from sky to the Farm, title card "World RPG" + "Carlos Montoya · Backend Engineer", then hands control to the player. Skippable with any key.

14. **`controls/touch.js` — mobile input**
    On touch devices, an on-screen D-pad + "A" (interact) button feed the same input state as the keyboard. Konami reveal reachable via the D-pad + A.

15. **`render/minimap.js` (optional)**
    Corner minimap showing region blobs, discovered sites, and the avatar. Cut candidate if it crowds mobile.

## Data Flow

```
experience.json + biomes.js
  → buildOverworld()  → world model { farm, regions, sites, roads, hiddenSites, bounds }
  → game state        { avatar pos/dir, dialog state, konamiRevealed, konamiBuffer, clock, timeOfDay, particles, muted }
  → per frame:  input(kbd|touch) → move → collide → camera(ease) → interaction check → (konami check) → ambient/particles/audio update
  → render:     tiles → water → roads → shadows → flowers → y-sorted[buildings·trees·critters·avatar] → particles → prompt → lighting → dialog → HUD → minimap
```

Bilingual text resolves at render time from `{en, es}` fields via the active language, matching the rest of the site.

## Journey / Goal

No win/lose. Start on the Farm, walk toward the present. Reading a site's dialog marks it discovered. Discovering all visible sites **and** unlocking the Konami side-project route = a "complete recorrido." Progress shown in the HUD (e.g. `sites 4/11`, plus a hidden-route indicator once unlocked). The player may leave at any time.

## Creative Direction & Juice

The bar is "eye-catching," not "functional." These are **required**, not nice-to-have — a static frame is a bug.

- **Cohesive pixel-art** — one tileset, one pixel size, one palette. The site's brand colors (`#00E5A8` / `#00C2FF` / `#0B1020`) bleed into UI chrome, lighting, glows, and the avatar accent.
- **Everything moves** — idle animations everywhere: wind on trees/grass, water waves, chimney smoke, flags, windmill, critters, fireflies. No element sits perfectly still.
- **Feedback on every action** — nearest-site glow, dialog open/close pop, discovery particle burst with ✓, subtle screen-shake on reveal, footstep dust, eased camera.
- **Day/night ambiance** — warm day → dusk → night tint, long shadows, lamps/windows light up after dark.
- **Memorable moments** — the 3s intro descent, and the Konami reveal as a set-piece (fanfare + flash + particles + camera pan to the newly opened route).
- **Avatar with character** — a recognizable "Carlos" with a 4-frame walk cycle, shadow, and a brand-colored accent.

## Art & Assets

- **Direction chosen: real CC0 pixel-art tilesets** (rejected: geometric/vector, own custom art for v1).
- **Base tiles / buildings / props:** Kenney packs (CC0, zero attribution) — e.g. "Tiny Town", "RPG Urban", "Roguelike/RPG". Cohesive, license-clean.
- **Avatar (4-dir walk):** LPC / Universal-LPC generator (OpenGameArt) to author a "Carlos" sprite. Note LPC licensing (CC-BY-SA / GPL) — keep an `ASSETS.md` crediting sources.
- **Cozy-farm flavor (optional accents):** Sprout Lands / Cute Fantasy for the Farm region, if license terms allow bundling.
- **Pipeline:** assets loaded as a small sprite atlas (single image + JSON frame map), decoded on demand when the game view opens; no impact on the main portfolio bundle. Deterministic frame animation driven by the game clock.
- **License hygiene:** every asset's source + license recorded in `src/game/assets/ASSETS.md`; only CC0 or share-alike-compatible assets bundled.

## Audio

- Region-aware chiptune loop that crossfades on biome change; SFX for footstep / confirm / discover / Konami fanfare (extends the existing `audio/sfx.js`).
- Muted until first user gesture (browser autoplay policy); visible mute toggle; respects `prefers-reduced-motion`/quiet contexts by defaulting conservatively.

## Controls

- **Desktop:** Arrows/WASD move, E/Space interact & advance dialog, L toggles language, Konami sequence reveals hidden routes, any key skips intro.
- **Mobile:** on-screen D-pad + "A" button (interact) feeding the same input state; the game view is fully playable on touch. Layout must not overlap dialog text.

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
- `lighting.test.js` — time-of-day phase math (day→dusk→night) is deterministic and cyclic.
- `juice.test.js` — particle pool spawn/expire, discovery burst fires once per site.
- `touch.test.js` — D-pad/A map to the same input state as keyboard.

Rendering/audio/intro are visual — covered by pure logic tests where extractable (clock, easing, pooling) plus a Playwright smoke pass; canvas pixels are not unit-asserted. Coverage target consistent with the current suite.

## YAGNI Cuts (explicitly out of scope for v1)

- Combat, enemies, bosses, score/combo, powerups.
- Stats, XP, leveling, skill trees, inventory.
- Interior scenes (the building's dialog *is* the content; no walk-in rooms).
- Standalone NPC characters (a static NPC sprite beside a building is optional decoration only).
- Save system — at most a minimal `localStorage` of discovery progress; may be deferred entirely.
- Custom-authored art beyond the LPC avatar — v1 uses CC0 tilesets as-is (recoloring only).
- Weather systems (rain/snow), quest log, multiple avatars, and the minimap are stretch/cut candidates — the minimap ships only if it doesn't crowd mobile.

## Assumptions (low-risk, easy to revise)

- The game runs as a **dedicated game view/route** launched from the portfolio, loaded on demand — not embedded in the main scroll. (Matches the existing standalone game module.)
- Konami sequence: `↑ ↑ ↓ ↓ ← → ← → B A` (final key mapping adjustable).

## Validation

A throwaway single-file prototype (`world-rpg-preview.html`) validated the *feel* through three iterations: rejected the linear era-corridor, confirmed the 2D open-world + organic (Voronoi) regions, and confirmed textured ground + animated ambient objects (water, wind, smoke, flags, windmill, critters, fireflies) read as "a game," not a diagram. The prototype fakes textures procedurally; the real build uses CC0 tilesets. It informs layout and juice targets, not final code.

## Open Items for the Plan

- Exact tile size / world dimensions and Farm layout.
- Which specific Kenney pack(s) + LPC avatar config; recolor to brand palette.
- Region-to-region visual seam (palette gradient band vs hard edge).
- Day/night cycle length and whether it auto-runs or is time-of-day-linked.
- Whether to persist discovery progress in `localStorage` for v1.
- Minimap in or out for mobile.
