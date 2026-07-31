# Plan — Graphics upgrade with the full Cute Fantasy gallery

**Feature:** Leverage the newly purchased full Cute Fantasy pack to improve the World RPG graphics.
**Status:** PLAN ONLY — no coding yet.
**Context:** The full pack (718 files, 6.0MB) replaced the free pack and REORGANIZED every folder. Result: **the game is broken right now — 13 of 14 manifest-referenced files are missing.** So M1 (re-map) is mandatory before anything renders again.

---

## Affected modules (the game's "layers")

| Layer | Files |
|-------|-------|
| **Assets / data** | `public/game/cute-fantasy/**` (raw pack), `src/game/assets/manifest.js` (frame map), `src/game/assets/ASSETS.md` (credits/license), `src/game/assets/loader.js` + `atlas.js` (image + frame loading), optional new `scripts/pack-atlas.mjs` |
| **World model** | `src/game/world/overworld.js` (building-type per company), `src/game/world/decor.js` (decor kinds + placement) |
| **Render** | `src/game/render/scene2d.js` (draw buildings/tiles/avatar/HUD), `src/game/render/tiles.js` (tile-name mapping incl. road/stone), `src/game/render/ambient.js` (animated decor + windmill), `src/game/render/juice.js` (particles — optional leaf particles) |
| **Entities** | `src/game/entities/critters.js` (animal types), `src/game/entities/site.js` (building footprint sizes) |
| **Tests** | `*.test.js` for each touched pure module |
| **Docs** | `.gitignore` (protect raw pack), ASSETS.md |

---

## Milestone M1 — Re-map to the new pack (REQUIRED — game is broken)

Goal: game renders again with the full pack's file layout. No new features yet, just make the existing frames resolve.

- [ ] **Measure the new sheets** — for every frame the manifest needs, find its new path + `sips` dims + frame grid. New locations discovered:
  - Ground: `Tiles/Grass/`, `Tiles/Beach/`, `Tiles/FarmLand/` (now folders / autotile sets — pick the plain center cell).
  - Road: `Tiles/Cobble_Road/` (NEW — real road tileset, replaces the dirt Path).
  - Water: `Tiles/Water/`, `Tiles/Waterfall/`.
  - Stone/modern: `Tiles/Cliff/`, `Tiles/Cave/`, `Pavement_Tiles.png` (NEW — for cyber/castillo).
  - Buildings: `Buildings/Buildings/Houses/Wood/House_1_Wood_Base_Blue.png` (+ many color variants), `Unique_Buildings/*`.
  - Trees: `Trees/Big_Oak_Tree.png`, `Medium_Oak_Tree.png`, Birch/Spruce/Fruit variants.
  - Avatar: `Player/Player_Base/` (now MODULAR — see Concern 1).
  - Chicken: `Animals/Chicken/`.
- [ ] **Rewrite `manifest.js`** — repoint every existing frame name (`ground_*`, `path`, `water`, `house`, `castle`, `tree`, `tree_small`, `fence`, `carlos_*`, `chicken_*`, road autotile cells) to the new paths + corrected `{x,y,w,h}` rects. Update `REAL_IMAGE_SIZE` guard map to new dims.
- [ ] **Update `manifest.test.js`** — new required-frame paths in-bounds; keep the integrity assertions.
- [ ] **Verify** — `npx vitest run` green + live screenshot: world renders (no 404s, no placeholder rects).
- [ ] **Update `ASSETS.md`** — full-pack credit + license note (paid pack: use-in-product OK, redistribution NOT — see M4).

**Deliverable:** the game looks like before but sourced from the full pack, nothing broken.

---

## Milestone M2 — Buildings & world upgrade (the visible win)

Goal: replace placeholders with the pack's real variety; kill known debts (castle=house placeholder, cyber/castillo flat, hard biome seam).

- [ ] **`overworld.js` — distinct building per company.** Assign each site a building sprite by role/era instead of one `house`/`castle`:
  - Featured/flagship companies → **Unique_Buildings** (Church / Inn / Silo / Blacksmith) as landmark "castles."
  - Regular companies → **House Wood color variants** (deterministic pick by index so each reads distinct).
  - Farm spawn → **Barn + Windmill + Coop** cluster (real farm).
  - Add a `building` frame-name field to each Site; keep `type` for size class.
- [ ] **`manifest.js` — add the new building + tile frames** (house variants, unique buildings, cobble road cells, cliff/pavement for modern eras, tree variants).
- [ ] **`tiles.js` — richer biome tiles.** Map cyber/castillo to **Cliff/Cave/Pavement** stone tiles (fixes the "no stone asset" debt — no tint hack needed); desierto → Beach; farm/pradera/selva → Grass variants. Real **Cobble_Road** cells for the road network (replaces dirt Path autotile).
- [ ] **`scene2d.js` — draw per-site building sprite** (from the new `building` field) at correct footprint; draw new road/stone tiles; keep depth-sort + HUD + eraLabel farm guard.
- [ ] **`site.js` — footprint sizes** per building type (unique buildings are larger than houses) so collision + door spurs still line up.
- [ ] **`decor.js` + trees** — use the pack's multiple tree types (Oak/Birch/Spruce/Fruit, Big/Medium) for variety; keep deterministic placement.
- [ ] Tests: `overworld.test.js` (building assignment deterministic + every site has a building frame), `tiles.test.js` (new biome→tile map), `decor.test.js` (tree variety).
- [ ] Verify: screenshots per region — distinct buildings, stone modern eras, cobble roads.

**Deliverable:** every company is a recognizable, distinct building along cobble roads; modern eras read as stone/tech; the farm is a real farm.

---

## Milestone M3 — Animation & life (fixes jitter at the source)

Goal: use the pack's built-in animations instead of hand-rolled effects.

- [ ] **`loader.js`/`atlas.js` — multi-frame animation support.** Add a way to define an animated frame (a strip with N frames + fps) and draw the current frame by clock. (Some sprites are `*_Anim.png` strips.)
- [ ] **`ambient.js` — replace manual sway with real animations:**
  - Flowers/grass → `Outdoor_Decor_Animations/Flower_Grass_*_Anim` strips (built-in wind animation → removes the sub-pixel skew that caused tremble).
  - Farm **Windmill** → `Windmill_Sail_Anim` (animated sails).
  - Keep chimney smoke / fireflies as-is or swap for pack equivalents if present.
- [ ] **`critters.js` — animated animals** (Chicken already; optionally add Butterfly/Duck/Cow near farm) using the pack's walk strips.
- [ ] **`juice.js` (optional)** — leaf particles (`Oak_Leaf_Particle` / `Birch_Leaf_Particle`) drifting from trees.
- [ ] Tests: animation-frame math (deterministic frame index from clock), critter determinism.
- [ ] Verify: trees/flowers animate smoothly (no tremble), windmill turns, critters walk.

**Deliverable:** the world is alive with the pack's native animations; the tree-tremble class is gone (real frame animation, not offset hacks).

---

## Milestone M4 — Protection & footprint (paid-pack hygiene)

Goal: don't publicly redistribute the raw paid pack; shrink the 6MB deploy. (Reality: assets the game renders are always browser-fetchable — this minimizes exposure + satisfies the "use in product, not redistribute" license.)

- [ ] **`scripts/pack-atlas.mjs` (NEW)** — a prep script that reads the raw pack + the manifest's used-frame list and bakes ONLY those frames into a single `public/game/atlas.png` + `atlas.json`. Deterministic.
- [ ] **`manifest.js`/`loader.js` — switch to the single baked atlas** (Task-9 `loadAtlas` already supports single-image atlas) instead of 700 loose files.
- [ ] **`.gitignore`** — ignore the raw pack (`public/game/cute-fantasy/**`, `public/game/sprout-lands-sprites/**`); keep only `public/game/atlas.png` + `atlas.json` in the repo/deploy. Store the raw pack locally / in a private `assets-src/` (gitignored).
- [ ] Remove editable/source files from what ships (`.aseprite`, palette, `read_me.txt`, unused sheets) — the atlas contains only used frames.
- [ ] Update `ASSETS.md` — note raw pack is not redistributed; only baked frames ship.
- [ ] Verify: deploy shrinks 6MB → tens of KB; game still renders from the atlas; `git status` shows the raw pack untracked/ignored.

**Deliverable:** repo/deploy ships one small atlas of used frames; the paid pack's raw source is never committed or publicly served.

---

## Architectural concerns (flagged)

1. **Player is now MODULAR** (`Player_Base` + Head/Legs/Hands/Tools/Mounts). Decision needed: (a) use a single `Player_Base` walk sheet as-is (simplest, matches current single-sprite avatar) vs (b) compose a custom "Carlos" from parts (richer, more work). **Recommend (a) for M1**, revisit composition later.
2. **Animated sprites need loader support** — `*_Anim` strips have N frames; current loader draws a static rect. M3 adds frame-cycling; until then M1/M2 use static frames only.
3. **Tile autotiling** — new tilesets are proper autotile sets (subfolders w/ edges/corners). M2 can do a light center+edge pick (like the current road) or full 16-tile autotiling (bigger). **Recommend light autotiling** to start.
4. **6MB / 718 files** — must not all ship (bloat + Lighthouse + license). M4 pipeline is the real fix; if M4 is deferred, at minimum prune unused files + gitignore before deploy.
5. **Frame dims changed** — every used sheet must be re-measured (`sips`); the `REAL_IMAGE_SIZE` guard test protects against bad rects.
6. **Sprout Lands** — its files are also currently missing from the manifest resolve; decide whether to keep Sprout Lands at all now that Cute Fantasy full covers farm/tiles, or re-map it too. **Recommend dropping Sprout Lands** if Cute Fantasy full covers everything → one cohesive pack, simpler license.
7. **Scope** — this is large. **Recommend phasing: M1 (fix, ship) → M2 (buildings/tiles) → M3 (animation) → M4 (protection).** M1 alone un-breaks the live site and should ship first.

---

## Suggested order

1. **M1** — re-map (un-break the game). Ship.
2. **M2** — buildings + biome tiles + roads. Ship.
3. **M3** — animations (fix tremble properly). Ship.
4. **M4** — atlas pipeline + gitignore (protection + shrink). Ship.

Each milestone is independently shippable and leaves the game in a working, reviewed state.
