# Spec — World Richness milestone (M5)

**Goal:** Make the career-RPG world feel alive and detailed. Decomposed into independently
shippable slices; each = manifest frames + a focused render/world change + tests + atlas rebake +
prod-build screenshot verify + one commit, pushed per slice.

**Status:** brainstormed + approved. Slices below; order is user-chosen (ponds first).

## Slices

| # | Slice | Summary | Assets |
|---|-------|---------|--------|
| S1 | **Ponds** (this spec) | 2 rounded water ponds with animated waves + aquatic decor + collision | Water_Tile_1, Water waves, Lillypad/Cattail anims, Kapybara |
| S2 | NPCs | Modular townsfolk wandering near buildings | Player modular base + clothing |
| S3 | Animals + decor | Pig/sheep/horse/frog by biome; barrels/signs/lamps; more tree types | Animals/*, Outdoor_Decor |
| S4 | Caves | New cave region: Cave tiles + animated Cave_Rock + entrance | Tiles/Cave, Cave_Rock_Anim |
| S5 | POIs | Themed focal points per era (AI altar in castillo, servers in cyber, …) | mix |
| H | **Hero redesign** (deferred, approved) | Lumberjack-red outfit + full 6-frame walk + subtle idle | Player Lumberjack_Shirt_Red + OG_Pants_Black + Shoes_Brown + Hair_2_Brown |

Hero fix is bounded (like M2a) and will follow the world slices per user's ordering.

## S1 — Ponds (approved design)

**Existing wiring (half-done):** `world.ponds = [{x,y,r}]` is already consumed by `decor.js`
(avoidance circles) and `ambient.js` `drawWater/drawPondWaves` (animated white wave rings). Missing:
real water tiles, shore, collision, aquatic decor.

**Placement:** 2 ponds in open areas clear of buildings/roads — one in the selva biome, one in
pradera. Coordinates chosen to avoid the road spine and site rings.

**Water render — rounded autotile (reuses the cobble-road pattern):**
- `Water_Tile_1.png` (48×80) is the same rounded-island 9-cell autotile family as the cobble road
  and beach (top-left 48×48 = 3×3 of 16px cells). Map `water_center/n/s/e/w/nw/ne/sw/se` to those
  cells, exactly as `path_*` maps the road.
- A tile is "water" when its center is inside a pond radius. Its frame is chosen by which of its 4
  grid-neighbors are also water — same `pathTileName()` neighbor logic, generalized. This gives a
  smooth grass→water shore for free.
- Water is static; life comes from the existing animated wave rings (ambient) + animated decor.
  (Full per-tile water animation = ~72 frames, rejected as too heavy for the payoff.)

**Aquatic decor (animated, via `anim.js`):**
- Lillypads (`Lillypad_Green_*_Anim`, 128×16 = 8 frames) + cattails (`Cattail_*_Anim`, 128×16 = 8)
  floating on the water — placed deterministically inside each pond.
- One Kapybara (`Kapybara_Idle.png`, 288×32 = 9 frames) resting at a pond edge.

**Collision:** ponds block the player (a circle test added to the movement solids, or a circle-aware
check), so the avatar can't walk onto water. Aquatic decor is non-solid (already on water).

**Rendering order:** water tiles in the ground pass (`drawGround`), aquatic decor in the
depth-sorted pass, wave rings in `drawAmbient` (already after the world layer). Depth-sort lillypads
by their y so the avatar/decor near the pond occlude correctly.

**Tests:** pond placement deterministic + clear of buildings; water-autotile neighbor mapping; pond
collision blocks movement into the radius; decor stays inside the pond.

**Verify:** prod build screenshot — rounded pond with grass shore, animated waves, lillypads/cattails,
a kapybara at the edge, player blocked at the water.
