# Game Art Credits

Attribution and license terms for the pixel-art assets used by `src/game/`. Source packs live
under `public/game/` and are served at `/game/...`. Exact wording below is taken verbatim from
each pack's bundled `read_me.txt`; neither `read_me.txt` includes a marketplace URL, so the
itch.io pages are the packs' well-known public source and are provided for reference.

| Pack | Author | Source | License (verbatim from `read_me.txt`) |
|---|---|---|---|
| Cute Fantasy RPG | Kenmi | https://kenmi-art.itch.io/cute-fantasy-rpg | "License - Free Version — You can use these assets in non-commercial projects. You can modify the assets. You can not redistribute or resale, even if modified." |
| Sprout Lands (Basic Pack) | Cup Nooble | https://cupnooble.itch.io/sprout-lands-asset-pack | "License - Basic Pack — You can modify the assets. You can use these assets in any kind of non-commercial projects (except anything to do with NFTs or AI training). You can not redistribute the asset pack itself or resell it on other platforms, even if it is slightly modified. Credit is required: (Cup Nooble)." Suggested credit line: "Assets -From : Sprout Lands -By : Cup Nooble". |

Read the full terms in `public/game/cute-fantasy/read_me.txt` and
`public/game/sprout-lands-sprites/read_me.txt` before any commercial use.

## Files used (see `src/game/assets/manifest.js` for exact frame rects)

### Cute Fantasy RPG (Kenmi)
- `Tiles/Grass_Middle.png` — `ground_pradera`, `ground_cyber`, `ground_castillo` (neutral placeholder, see TODO below)
- `Tiles/Path_Middle.png` — `path`
- `Tiles/Water_Middle.png` — `water`
- `Tiles/FarmLand_Tile.png` — `ground_farm`
- `Tiles/Beach_Tile.png` — `ground_desierto`
- `Outdoor decoration/House_1_Wood_Base_Blue.png` — `house`, `castle` (placeholder, see TODO below)
- `Outdoor decoration/Oak_Tree.png` — `tree`
- `Outdoor decoration/Oak_Tree_Small.png` — `tree_small`
- `Outdoor decoration/Fences.png` — `fence`
- `Player/Player.png` — `carlos_down_*`, `carlos_up_*`, `carlos_right_*`, `carlos_left_*`
- `Animals/Chicken/Chicken.png` — `chicken_0`, `chicken_1`

### Sprout Lands (Cup Nooble)
- `Tilesets/Grass.png` — `ground_selva` (a visually distinct green from Cute Fantasy's grass)

## TODOs / known placeholders
- `castle` currently reuses the `house` sprite (`House_1_Wood_Base_Blue.png`) — neither Cute
  Fantasy nor Sprout Lands ships a castle asset. Swap this for a real castle sprite once the
  **Tiny Swords** pack (or similar) is added to `public/game/`.
- `ground_cyber` and `ground_castillo` reuse the plain `Grass_Middle.png` tile as a neutral base —
  neither pack has cyberpunk or castle-themed ground tiles. The renderer is expected to tint
  these two biomes by their biome color rather than relying on a distinct source tile.
- `carlos_left_0/1/2` point at the same rects as `carlos_right_0/1/2`. There is no dedicated
  left-facing row in `Player.png`; the loader's `drawFlipped()` mirrors the right-facing frames
  horizontally to render the left-facing walk.
