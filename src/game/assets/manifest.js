// Sprite manifest for the top-down RPG renderer.
// images: distinct source PNGs, keyed by a short handle, URL-encoded for public/ hosting.
// frames: named sub-rects the renderer looks up by name. Every frame.img must exist in images,
// and every {x,y,w,h} must fall within that image's real pixel dimensions (verified by viewing
// the sheets with the Read tool + `sips -g pixelWidth -g pixelHeight` before writing coordinates).

export const MANIFEST = {
  images: {
    cfGrass: '/game/cute-fantasy/Tiles/Grass_Middle.png',
    cfPath: '/game/cute-fantasy/Tiles/Path_Middle.png',
    cfWater: '/game/cute-fantasy/Tiles/Water_Middle.png',
    cfFarmland: '/game/cute-fantasy/Tiles/FarmLand_Tile.png',
    cfBeach: '/game/cute-fantasy/Tiles/Beach_Tile.png',
    cfHouse: '/game/cute-fantasy/Outdoor%20decoration/House_1_Wood_Base_Blue.png',
    cfOakTree: '/game/cute-fantasy/Outdoor%20decoration/Oak_Tree.png',
    cfOakTreeSmall: '/game/cute-fantasy/Outdoor%20decoration/Oak_Tree_Small.png',
    cfFences: '/game/cute-fantasy/Outdoor%20decoration/Fences.png',
    cfPlayer: '/game/cute-fantasy/Player/Player.png',
    cfChicken: '/game/cute-fantasy/Animals/Chicken/Chicken.png',
    slGrass: '/game/sprout-lands-sprites/Tilesets/Grass.png',
  },
  frames: {
    // Ground per biome. 16x16 source tiles, reused across biomes where the packs have no
    // native match. ground_cyber/ground_castillo intentionally reuse the neutral grass tile
    // (see manifest header note above and ASSETS.md) — the renderer tints them per biome color.
    ground_farm: { img: 'cfFarmland', x: 16, y: 16, w: 16, h: 16 },
    ground_pradera: { img: 'cfGrass', x: 0, y: 0, w: 16, h: 16 },
    ground_desierto: { img: 'cfBeach', x: 48, y: 0, w: 16, h: 16 },
    ground_selva: { img: 'slGrass', x: 0, y: 64, w: 16, h: 16 },
    ground_cyber: { img: 'cfGrass', x: 0, y: 0, w: 16, h: 16 },
    ground_castillo: { img: 'cfGrass', x: 0, y: 0, w: 16, h: 16 },
    path: { img: 'cfPath', x: 0, y: 0, w: 16, h: 16 },
    water: { img: 'cfWater', x: 0, y: 0, w: 16, h: 16 },

    // Buildings. castle reuses the house sprite (no castle asset in these two packs).
    house: { img: 'cfHouse', x: 0, y: 0, w: 96, h: 128 },
    castle: { img: 'cfHouse', x: 0, y: 0, w: 96, h: 128 },

    // Decor.
    tree: { img: 'cfOakTree', x: 0, y: 0, w: 64, h: 80 },
    tree_small: { img: 'cfOakTreeSmall', x: 32, y: 0, w: 32, h: 48 },
    fence: { img: 'cfFences', x: 0, y: 0, w: 16, h: 32 },

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
