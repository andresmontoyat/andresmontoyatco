// Sprite manifest for the top-down RPG renderer.
// images: distinct source PNGs, keyed by a short handle, URL-encoded for public/ hosting.
// frames: named sub-rects the renderer looks up by name. Every frame.img must exist in images,
// and every {x,y,w,h} must fall within that image's real pixel dimensions (verified by viewing
// the sheets with the Read tool + `sips -g pixelWidth -g pixelHeight` before writing coordinates).

export const MANIFEST = {
  images: {
    cfGrass: '/game/cute-fantasy/Tiles/Grass_Middle.png',
    cfPathTile: '/game/cute-fantasy/Tiles/Path_Tile.png',
    cfWater: '/game/cute-fantasy/Tiles/Water_Middle.png',
    cfBeach: '/game/cute-fantasy/Tiles/Beach_Tile.png',
    cfHouse: '/game/cute-fantasy/Outdoor%20decoration/House_1_Wood_Base_Blue.png',
    cfOakTree: '/game/cute-fantasy/Outdoor%20decoration/Oak_Tree.png',
    cfOakTreeSmall: '/game/cute-fantasy/Outdoor%20decoration/Oak_Tree_Small.png',
    cfFences: '/game/cute-fantasy/Outdoor%20decoration/Fences.png',
    cfPlayer: '/game/cute-fantasy/Player/Player.png',
    cfChicken: '/game/cute-fantasy/Animals/Chicken/Chicken.png',
    slGrass: '/game/sprout-lands-sprites/Tilesets/Grass.png',
    slHills: '/game/sprout-lands-sprites/Tilesets/Hills.png',
    slTilledDirt: '/game/sprout-lands-sprites/Tilesets/Tilled_Dirt.png',
    slBiomThings: '/game/sprout-lands-sprites/Objects/Basic_Grass_Biom_things.png',
  },
  frames: {
    // Ground per biome. Every rect below was chosen by viewing the sheet with the Read tool
    // and cropping candidate cells — each lands on a fully-opaque, single-color-family 16x16
    // interior cell (never a multi-cell autotile border, and never a transparent/padded area).
    // _2/_3 suffixed frames are texture variants scattered in via a per-tile-coord hash
    // (see render/tiles.js tileNameFor) so ground doesn't read as one flat color block.
    // Farm ground is grass (same cells as pradera) — the avatar spawns here, and bare tilled
    // dirt read wrong for a spawn point. A tilled-earth look belongs in a future decor/farm-plot
    // layer, not the base ground tile.
    ground_farm: { img: 'cfGrass', x: 0, y: 0, w: 16, h: 16 },
    ground_farm_2: { img: 'slGrass', x: 0, y: 80, w: 16, h: 16 },
    ground_farm_3: { img: 'slGrass', x: 16, y: 80, w: 16, h: 16 },
    ground_pradera: { img: 'cfGrass', x: 0, y: 0, w: 16, h: 16 },
    ground_pradera_2: { img: 'slGrass', x: 0, y: 80, w: 16, h: 16 },
    ground_pradera_3: { img: 'slGrass', x: 16, y: 80, w: 16, h: 16 },
    // Beach_Tile.png is an 80x48 island autotile sheet (5x3 cells of 16px) — x=48,y=0 used to
    // sample the blue pond-ring border (the "blue arches" artifact). x=16,y=16 is the solid
    // sand fill at the center of the island's 3x3 autotile block. Beach_Tile has no further
    // texture cells (the rest of the sheet is saturated water blue), so the _2/_3 accents come
    // from Tilled_Dirt.png's speckled dirt-patch cells — a close, still-sandy tan family.
    ground_desierto: { img: 'cfBeach', x: 16, y: 16, w: 16, h: 16 },
    ground_desierto_2: { img: 'slTilledDirt', x: 0, y: 80, w: 16, h: 16 },
    ground_desierto_3: { img: 'slTilledDirt', x: 16, y: 96, w: 16, h: 16 },
    // Grass.png x=0,y=64 sampled a mostly-transparent grass-tuft decoration cell (the
    // "green/black checkered" artifact against the canvas background). x=16,y=16 is the
    // solid-fill interior cell of the sheet's rounded grass-plateau autotile block.
    ground_selva: { img: 'slGrass', x: 16, y: 16, w: 16, h: 16 },
    ground_selva_2: { img: 'slGrass', x: 32, y: 80, w: 16, h: 16 },
    ground_selva_3: { img: 'slHills', x: 112, y: 80, w: 16, h: 16 },
    // cyber/castillo previously reused the flat grass tile under a 35%-alpha color tint,
    // reading as one flat color block. Both now use the same Hills.png cliff-edge cell
    // (grass top / dirt-cliff bottom — the closest "stone/cliff" texture in either pack)
    // and are told apart at render time by a much lighter (~0.12 alpha) per-biome tint.
    ground_cyber: { img: 'slHills', x: 16, y: 32, w: 16, h: 16 },
    ground_cyber_2: { img: 'slHills', x: 16, y: 16, w: 16, h: 16 },
    ground_castillo: { img: 'slHills', x: 16, y: 32, w: 16, h: 16 },
    ground_castillo_2: { img: 'slHills', x: 16, y: 16, w: 16, h: 16 },
    // Path_Tile.png (48x96) is a rounded-island autotile block, same family as Beach_Tile.png's
    // island layout above: a 3x3 grid of corner/edge/center cells at its top-left (the rest of
    // the sheet is a second, unrelated "grass hole" shape and a row of pebble-decorated variants
    // — not used). Verified by viewing a scaled+gridded render of the sheet: (16,16) is the
    // solid tan interior; (16,0)/(16,32)/(0,16)/(32,16) are the N/S/W/E straight edges (grass
    // fringe on that side, tan on the rest); (0,0)/(32,0)/(0,32)/(32,32) are the four outer
    // corners (grass wraps two adjacent sides). tiles.js's pathTileName() picks among these 9
    // by checking which of a road tile's 4 grid-neighbors are also on-path, so the road gets a
    // grass-blended border instead of the old flat-rectangle 'path' cell (Path_Middle.png).
    path_center: { img: 'cfPathTile', x: 16, y: 16, w: 16, h: 16 },
    path_n: { img: 'cfPathTile', x: 16, y: 0, w: 16, h: 16 },
    path_s: { img: 'cfPathTile', x: 16, y: 32, w: 16, h: 16 },
    path_w: { img: 'cfPathTile', x: 0, y: 16, w: 16, h: 16 },
    path_e: { img: 'cfPathTile', x: 32, y: 16, w: 16, h: 16 },
    path_nw: { img: 'cfPathTile', x: 0, y: 0, w: 16, h: 16 },
    path_ne: { img: 'cfPathTile', x: 32, y: 0, w: 16, h: 16 },
    path_sw: { img: 'cfPathTile', x: 0, y: 32, w: 16, h: 16 },
    path_se: { img: 'cfPathTile', x: 32, y: 32, w: 16, h: 16 },
    water: { img: 'cfWater', x: 0, y: 0, w: 16, h: 16 },

    // Buildings. castle reuses the house sprite (no castle asset in these two packs).
    house: { img: 'cfHouse', x: 0, y: 0, w: 96, h: 128 },
    castle: { img: 'cfHouse', x: 0, y: 0, w: 96, h: 128 },

    // Decor.
    tree: { img: 'cfOakTree', x: 0, y: 0, w: 64, h: 80 },
    tree_small: { img: 'cfOakTreeSmall', x: 32, y: 0, w: 32, h: 48 },
    fence: { img: 'cfFences', x: 0, y: 0, w: 16, h: 32 },
    bush: { img: 'slBiomThings', x: 0, y: 48, w: 16, h: 16 },
    rock: { img: 'slBiomThings', x: 112, y: 16, w: 16, h: 16 },
    flower: { img: 'slBiomThings', x: 112, y: 48, w: 16, h: 16 },

    // Avatar walk cycle. Player.png is 192x320, a 6-col x 10-row grid of 32x32 frames.
    // Confirmed by viewing: row 0 = down (front, face visible), row 2 = up (back of head),
    // row 4 = right-facing side profile. Frame columns 0/2/4 give a clear 3-pose stride
    // (contact / passing / contact). carlos_left reuses the right-row rects — the renderer
    // is expected to mirror them horizontally via drawFlipped.
    carlos_down_0: { img: 'cfPlayer', x: 0, y: 0, w: 32, h: 32 },
    carlos_down_1: { img: 'cfPlayer', x: 64, y: 0, w: 32, h: 32 },
    carlos_down_2: { img: 'cfPlayer', x: 128, y: 0, w: 32, h: 32 },
    carlos_up_0: { img: 'cfPlayer', x: 0, y: 64, w: 32, h: 32 },
    carlos_up_1: { img: 'cfPlayer', x: 64, y: 64, w: 32, h: 32 },
    carlos_up_2: { img: 'cfPlayer', x: 128, y: 64, w: 32, h: 32 },
    carlos_right_0: { img: 'cfPlayer', x: 0, y: 128, w: 32, h: 32 },
    carlos_right_1: { img: 'cfPlayer', x: 64, y: 128, w: 32, h: 32 },
    carlos_right_2: { img: 'cfPlayer', x: 128, y: 128, w: 32, h: 32 },
    carlos_left_0: { img: 'cfPlayer', x: 0, y: 128, w: 32, h: 32 },
    carlos_left_1: { img: 'cfPlayer', x: 64, y: 128, w: 32, h: 32 },
    carlos_left_2: { img: 'cfPlayer', x: 128, y: 128, w: 32, h: 32 },

    // Farm animal. Chicken.png is 64x64, a 2x2 grid of 32x32 frames.
    chicken_0: { img: 'cfChicken', x: 0, y: 0, w: 32, h: 32 },
    chicken_1: { img: 'cfChicken', x: 32, y: 0, w: 32, h: 32 },
  },
}

export default MANIFEST
