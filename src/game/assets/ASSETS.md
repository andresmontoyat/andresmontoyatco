# Game Art Credits

Attribution and license terms for the pixel-art assets used by `src/game/`. The source pack lives
under `public/game/cute-fantasy/` and is served at `/game/cute-fantasy/...`. Exact wording below is
taken verbatim from the pack's bundled `read_me.txt`, which doesn't include a marketplace URL, so
the itch.io page is the pack's well-known public source and is provided for reference.

| Pack | Author | Source | License (verbatim from `read_me.txt`) |
|---|---|---|---|
| Cute Fantasy (full/premium) | Kenmi | https://kenmi-art.itch.io/cute-fantasy-rpg | "License - Premium Version — You can use these assets in any commercial or non-commercial projects. You can modify the assets. You can not redistribute or resale, even if modified." |

Read the full terms in `public/game/cute-fantasy/read_me.txt` before any commercial use.

**This is a PAID/premium asset pack.** Use within this product (the built site) is covered by the
license above. Do NOT redistribute the raw pack files (e.g. don't publish `public/game/cute-fantasy/`
as a downloadable/browsable asset zip, don't commit it to a public template repo, etc.). A follow-up
milestone will bake the frames actually used into a single generated atlas image and gitignore the
raw pack directory, so the repo itself stops shipping the full unmodified asset tree.

Sprout Lands (Cup Nooble) has been fully removed — every frame now sources from this one pack, for a
single cohesive license story.

## Files used (see `src/game/assets/manifest.js` for exact frame rects)

- `Tiles/Grass/Grass_1_Middle.png`, `Grass_2_Middle.png`, `Grass_3_Middle.png`, `Grass_4_Middle.png`
  — `ground_farm/_2/_3`, `ground_pradera/_2/_3`, `ground_selva/_2/_3` (four solid-color grass
  shades shared and re-weighted across the three grassland biomes)
- `Tiles/Beach/Beach_Tiles.png` — `ground_desierto`
- `Tiles/FarmLand/FarmLand_Tile.png` — `ground_desierto_2`, `ground_desierto_3` (sandy-speckle accent)
- `Tiles/Cliff/Stone_Cliff_1_Tile.png` — `ground_cyber`, `ground_cyber_2` (brick-striped stone)
- `Tiles/Cliff/Stone_Cliff_3_Tile.png` — `ground_castillo`, `ground_castillo_2` (cobble-pile stone)
- `Tiles/Cobble_Road/Cobble_Road_1.png` — `path_center/_n/_s/_w/_e/_nw/_ne/_sw/_se`
- `Tiles/Water/Water_Middle.png` — `water`
- `Buildings/Buildings/Houses/Wood/House_1_Wood_Base_Blue.png` — `house`, `castle` (placeholder, see TODO below)
- `Trees/Big_Oak_Tree.png` — `tree`
- `Trees/Medium_Oak_Tree.png` — `tree_small`
- `Outdoor decoration/Fences.png` — `fence`
- `Outdoor decoration/Outdoor_Decor.png` — `bush`, `rock`
- `Outdoor decoration/Flowers.png` — `flower`
- `Player/Player_Base/Player_Base_animations.png` — `carlos_down_*`, `carlos_up_*`, `carlos_right_*`, `carlos_left_*`
- `Animals/Chicken/Chicken_01.png` — `chicken_0`, `chicken_1`

## TODOs / known placeholders

- `castle` currently reuses the `house` sprite (`House_1_Wood_Base_Blue.png`) — swap this for one of
  the pack's `Buildings/Buildings/Houses/Stone/` or `Limestone/` variants (or a dedicated castle
  asset) once featured companies get unique buildings (M2).
- `carlos_left_0/1/2` point at the same rects as `carlos_right_0/1/2`. `Player_Base_animations.png`
  only stores 3 directions per animation (down, right, up); there is no dedicated left-facing row.
  The renderer's `drawFlipped()` mirrors the right-facing frames horizontally to render the
  left-facing walk (and in fact `scene2d.js`'s `drawAvatar` already substitutes `'right'` into the
  frame-name lookup whenever `player.dir === 'left'`, so these rects exist for manifest/API
  completeness rather than ever being read directly).
- `Player_Base_animations.png` is the base (skin-only) body layer of a modular character system —
  the pack ships separate clothing/hair/shoe PNGs (`Player/Chest`, `Player/Legs`, `Player/Head`,
  `Player/Feet`) meant to be composited on top per-frame. This milestone does not composite them;
  the avatar currently renders as the bare base body. A future milestone can layer clothing in.
  All frames are static (no animation) this milestone, per M1 scope.
- No dedicated castle/cyberpunk ground tile exists in this pack; `ground_cyber`/`ground_castillo`
  use two different real-stone tiles (see above) so they at least read as genuinely different
  materials — `scene2d.js` still applies a light per-biome tint on top of both.
