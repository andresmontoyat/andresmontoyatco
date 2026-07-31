// Sprite manifest for the top-down RPG renderer.
// images: distinct source PNGs, keyed by a short handle, URL-encoded for public/ hosting.
// frames: named sub-rects the renderer looks up by name. Every frame.img must exist in images,
// and every {x,y,w,h} must fall within that image's real pixel dimensions (verified by viewing
// the sheets with the Read tool + `sips -g pixelWidth -g pixelHeight` before writing coordinates).
//
// M1 (Cute Fantasy full-pack re-map): the free "Cute Fantasy RPG" + Sprout Lands duo was replaced
// by the paid, full "Cute Fantasy" pack (all assets now live under public/game/cute-fantasy/, in
// its own reorganized folder tree). Every frame name below is unchanged from before this re-map —
// only img/{x,y,w,h} moved — so scene2d.js/tiles.js/ambient.js keep working untouched.

export const MANIFEST = {
  images: {
    cfGrass1: '/game/cute-fantasy/Tiles/Grass/Grass_1_Middle.png',
    cfGrass2: '/game/cute-fantasy/Tiles/Grass/Grass_2_Middle.png',
    cfGrass3: '/game/cute-fantasy/Tiles/Grass/Grass_3_Middle.png',
    cfGrass4: '/game/cute-fantasy/Tiles/Grass/Grass_4_Middle.png',
    cfBeach: '/game/cute-fantasy/Tiles/Beach/Beach_Tiles.png',
    cfFarmland: '/game/cute-fantasy/Tiles/FarmLand/FarmLand_Tile.png',
    cfStoneCliff1: '/game/cute-fantasy/Tiles/Cliff/Stone_Cliff_1_Tile.png',
    cfStoneCliff3: '/game/cute-fantasy/Tiles/Cliff/Stone_Cliff_3_Tile.png',
    cfCobbleRoad: '/game/cute-fantasy/Tiles/Cobble_Road/Cobble_Road_1.png',
    cfWater: '/game/cute-fantasy/Tiles/Water/Water_Middle.png',
    cfHouse: '/game/cute-fantasy/Buildings/Buildings/Houses/Wood/House_1_Wood_Base_Blue.png',
    // Regular-company house variants — all House_1_* are the same 96x128 single-building footprint
    // across three wall materials × two roof colors, so they're drop-in distinct sprites for the
    // deterministic per-company pick (overworld.js HOUSES) with no footprint change.
    cfHouseWoodRed: '/game/cute-fantasy/Buildings/Buildings/Houses/Wood/House_1_Wood_Base_Red.png',
    cfHouseStoneBlue: '/game/cute-fantasy/Buildings/Buildings/Houses/Stone/House_1_Stone_Base_Blue.png',
    cfHouseStoneRed: '/game/cute-fantasy/Buildings/Buildings/Houses/Stone/House_1_Stone_Base_Red.png',
    cfHouseLimeBlue: '/game/cute-fantasy/Buildings/Buildings/Houses/Limestone/House_1_Limestone_Base_Blue.png',
    cfHouseLimeRed: '/game/cute-fantasy/Buildings/Buildings/Houses/Limestone/House_1_Limestone_Base_Red.png',
    // Featured-company landmarks + the farm barn (Unique_Buildings). Church_Blue is a 4-frame
    // door/window-lit strip (448x144 → 112px frames); frame 0 is the closed, unlit church. Inn and
    // Blacksmith are single buildings; Barn marks the farm spawn.
    cfChurch: '/game/cute-fantasy/Buildings/Buildings/Unique_Buildings/Church/Church_Blue.png',
    cfInn: '/game/cute-fantasy/Buildings/Buildings/Unique_Buildings/Inn/Inn_Red.png',
    cfBlacksmith: '/game/cute-fantasy/Buildings/Buildings/Unique_Buildings/Blacksmith_House/Blacksmith_House_Blue.png',
    cfBarn: '/game/cute-fantasy/Buildings/Buildings/Unique_Buildings/Barn/Barn_Base_Red.png',
    cfBigOak: '/game/cute-fantasy/Trees/Big_Oak_Tree.png',
    cfMedOak: '/game/cute-fantasy/Trees/Medium_Oak_Tree.png',
    cfFences: '/game/cute-fantasy/Outdoor%20decoration/Fences.png',
    cfOutdoorDecor: '/game/cute-fantasy/Outdoor%20decoration/Outdoor_Decor.png',
    // Flower_Grass_1_Anim.png (128x16) is an 8-frame horizontal wind-sway strip (16px cells) of a
    // flower on a grass tuft — the pack's built-in wind loop. Replaces the old static flower with
    // real frame animation (see render/anim.js), so decor flowers breathe instead of sitting frozen.
    cfFlowerWind: '/game/cute-fantasy/Outdoor%20decoration/Outdoor_Decor_Animations/Grass_Animations/Flower_Grass_1_Anim.png',
    cfPlayer: '/game/cute-fantasy/Player/Player_Base/Player_Base_animations.png',
    // Modular armor layers — same 576x3584 grid as the base body (verified: every layer PNG in the
    // Player/ modular system shares the base's cell layout), so a layer's walk cells sit at the
    // exact same {x,y,w,h} as the base's carlos_* frames and composite pixel-perfect when stacked
    // in drawAvatar. Iron palette = neutral steel grey (fits the brand's cool cyber/AI eras).
    cfHelm: '/game/cute-fantasy/Player/Head/Plate_Helmet_1/Plate_Helmet_1_Iron.png',
    cfChest: '/game/cute-fantasy/Player/Chest/Plate_Chest/Plate_Chest_Iron.png',
    cfLegs: '/game/cute-fantasy/Player/Legs/Plate_Legs/Plate_Legs_Iron.png',
    cfChicken: '/game/cute-fantasy/Animals/Chicken/Chicken_01.png',
  },
  frames: {
    // Ground per biome. Grass_1..4_Middle.png are each a single fully-opaque 16x16 tile (no
    // autotile border to dodge), verified by per-pixel alpha scan — so every rect below is just
    // (0,0,16,16) on a different source file. _2/_3 suffixed frames are texture variants scattered
    // in via a per-tile-coord hash (see render/tiles.js tileNameFor) so ground doesn't read as one
    // flat color block. farm/pradera/selva are three shades of the same 4-tile grass family
    // (Grass_1=dark green, _2=mid green, _3=olive, _4=teal), each biome leaning on a different
    // tile as its dominant (weight-6) base per GROUND_WEIGHTS in tiles.js.
    ground_farm: { img: 'cfGrass1', x: 0, y: 0, w: 16, h: 16 },
    ground_farm_2: { img: 'cfGrass2', x: 0, y: 0, w: 16, h: 16 },
    ground_farm_3: { img: 'cfGrass3', x: 0, y: 0, w: 16, h: 16 },
    ground_pradera: { img: 'cfGrass3', x: 0, y: 0, w: 16, h: 16 },
    ground_pradera_2: { img: 'cfGrass2', x: 0, y: 0, w: 16, h: 16 },
    ground_pradera_3: { img: 'cfGrass1', x: 0, y: 0, w: 16, h: 16 },
    ground_selva: { img: 'cfGrass4', x: 0, y: 0, w: 16, h: 16 },
    ground_selva_2: { img: 'cfGrass1', x: 0, y: 0, w: 16, h: 16 },
    ground_selva_3: { img: 'cfGrass2', x: 0, y: 0, w: 16, h: 16 },
    // Beach_Tiles.png (480x48) is a rounded-island autotile strip, 10 islands of 48x48 each (one
    // per sand/water ratio); (16,16) of the first island is verified fully opaque solid sand
    // (228,166,114) — no water bleed. desierto_2/_3 borrow two FarmLand_Tile.png cells that happen
    // to share that exact (228,166,114) fleck color (verified by exact RGBA match), so the accent
    // reads as sandy speckle rather than a mismatched dirt patch; both cells confirmed fully opaque.
    ground_desierto: { img: 'cfBeach', x: 16, y: 16, w: 16, h: 16 },
    ground_desierto_2: { img: 'cfFarmland', x: 64, y: 16, w: 16, h: 16 },
    ground_desierto_3: { img: 'cfFarmland', x: 64, y: 48, w: 16, h: 16 },
    // cyber/castillo previously reused a flat grass tile under a color tint (no real stone asset
    // existed). The full pack ships real Stone_Cliff_N_Tile.png sheets (224x96): each contains a
    // rounded cobble-pile pillar (x16-63) and a separate horizontal brick-striped wall block
    // (x128-175) — same grey-blue stone palette, two distinct patterns. cyber gets the striped
    // block (Stone_Cliff_1, reads as a paved/plated surface — fits the "cyber" era read); castillo
    // gets the cobble-pile pillar (Stone_Cliff_3, reads as rough fortress stone). Different source
    // files AND different patterns, so the two biomes are visually distinct from each other even
    // before the renderer's existing per-biome tint is applied. All 4 rects verified fully opaque.
    ground_cyber: { img: 'cfStoneCliff1', x: 136, y: 44, w: 16, h: 16 },
    ground_cyber_2: { img: 'cfStoneCliff1', x: 152, y: 44, w: 16, h: 16 },
    ground_castillo: { img: 'cfStoneCliff3', x: 20, y: 52, w: 16, h: 16 },
    ground_castillo_2: { img: 'cfStoneCliff3', x: 36, y: 52, w: 16, h: 16 },
    // Cobble_Road_1.png (48x80) is the same rounded-island autotile family as Beach_Tiles.png
    // above: a 3x3 grid of 16px corner/edge/center cells at its top-left 48x48 (verified by
    // sampling stone-vs-sand pixel ratios per cell — center is 100% stone, the 4 straight edges
    // are ~50/50 stone/sand, the 4 corners are mostly sand with a small stone wedge — exactly the
    // shape a rounded island autotile produces). Replaces the old flat dirt path with real
    // cobblestone; tiles.js's pathTileName() picks among these 9 by checking which of a road
    // tile's 4 grid-neighbors are also on-path, same as before this re-map.
    path_center: { img: 'cfCobbleRoad', x: 16, y: 16, w: 16, h: 16 },
    path_n: { img: 'cfCobbleRoad', x: 16, y: 0, w: 16, h: 16 },
    path_s: { img: 'cfCobbleRoad', x: 16, y: 32, w: 16, h: 16 },
    path_w: { img: 'cfCobbleRoad', x: 0, y: 16, w: 16, h: 16 },
    path_e: { img: 'cfCobbleRoad', x: 32, y: 16, w: 16, h: 16 },
    path_nw: { img: 'cfCobbleRoad', x: 0, y: 0, w: 16, h: 16 },
    path_ne: { img: 'cfCobbleRoad', x: 32, y: 0, w: 16, h: 16 },
    path_sw: { img: 'cfCobbleRoad', x: 0, y: 32, w: 16, h: 16 },
    path_se: { img: 'cfCobbleRoad', x: 32, y: 32, w: 16, h: 16 },
    water: { img: 'cfWater', x: 0, y: 0, w: 16, h: 16 },

    // Buildings. Every regular company draws one of these six single-house sprites (whole PNG is
    // one 96x128 building); every featured company draws a landmark (church frame 0 / inn /
    // blacksmith); the farm spawn draws the barn. overworld.js assigns the frame per site.
    house: { img: 'cfHouse', x: 0, y: 0, w: 96, h: 128 },
    house_wood_red: { img: 'cfHouseWoodRed', x: 0, y: 0, w: 96, h: 128 },
    house_stone_blue: { img: 'cfHouseStoneBlue', x: 0, y: 0, w: 96, h: 128 },
    house_stone_red: { img: 'cfHouseStoneRed', x: 0, y: 0, w: 96, h: 128 },
    house_lime_blue: { img: 'cfHouseLimeBlue', x: 0, y: 0, w: 96, h: 128 },
    house_lime_red: { img: 'cfHouseLimeRed', x: 0, y: 0, w: 96, h: 128 },
    church: { img: 'cfChurch', x: 0, y: 0, w: 112, h: 144 },
    inn: { img: 'cfInn', x: 0, y: 0, w: 240, h: 192 },
    blacksmith: { img: 'cfBlacksmith', x: 0, y: 0, w: 160, h: 128 },
    barn: { img: 'cfBarn', x: 0, y: 0, w: 128, h: 144 },

    // Decor. Big_Oak_Tree.png (192x80) and Medium_Oak_Tree.png (96x48) are each a 3-cell strip —
    // stump / grown-tree-with-ground-shadow / grown-tree-no-shadow — so the middle (shadowed)
    // cell is used for both, matching the old single-tree assets' footprint exactly.
    tree: { img: 'cfBigOak', x: 64, y: 0, w: 64, h: 80 },
    tree_small: { img: 'cfMedOak', x: 32, y: 0, w: 32, h: 48 },
    fence: { img: 'cfFences', x: 0, y: 0, w: 16, h: 32 },
    // Outdoor_Decor.png (144x416) is a 9-col x 26-row catalog of 16px decor icons (verified by
    // grid overlay + crop). bush = a clean round green bush ball (row5,col5); rock = a plain grey
    // boulder with a grass tuft (row5,col0) — chosen over several blue-outlined "shore rock"
    // variants in the same sheet, which read as water-adjacent rather than generic ground decor.
    bush: { img: 'cfOutdoorDecor', x: 80, y: 80, w: 16, h: 16 },
    rock: { img: 'cfOutdoorDecor', x: 0, y: 80, w: 16, h: 16 },
    // Animated flower — the 8 wind-sway frames of cfFlowerWind (16x16 each, left to right).
    // render/anim.js's animFrame('flowerwind', clock, …) picks the live frame; the old static
    // cfFlowers red-flower cell is retired in favor of this breathing one.
    flowerwind_0: { img: 'cfFlowerWind', x: 0, y: 0, w: 16, h: 16 },
    flowerwind_1: { img: 'cfFlowerWind', x: 16, y: 0, w: 16, h: 16 },
    flowerwind_2: { img: 'cfFlowerWind', x: 32, y: 0, w: 16, h: 16 },
    flowerwind_3: { img: 'cfFlowerWind', x: 48, y: 0, w: 16, h: 16 },
    flowerwind_4: { img: 'cfFlowerWind', x: 64, y: 0, w: 16, h: 16 },
    flowerwind_5: { img: 'cfFlowerWind', x: 80, y: 0, w: 16, h: 16 },
    flowerwind_6: { img: 'cfFlowerWind', x: 96, y: 0, w: 16, h: 16 },
    flowerwind_7: { img: 'cfFlowerWind', x: 112, y: 0, w: 16, h: 16 },

    // Avatar walk cycle. Player_Base_animations.png (576x3584) is the new MODULAR base-body sheet
    // (skin only — clothing/hair are separate layered PNGs the renderer doesn't composite yet).
    // Grid: 64x64 cells, 9 cols. Content-mapped by per-cell alpha scan + zoomed visual read: every
    // animation occupies 3 consecutive rows in the fixed order [down, right, up] (confirmed by
    // silhouette — row0-family shows front-facing eyes, row1-family shows a single side-profile
    // eye facing right, row2-family shows a featureless back-of-head) — there is no dedicated left
    // row anywhere in the sheet. Rows 0-2 are "Idle" (near-static across all 6 frames — used
    // nowhere here). Rows 3-5 are "Walk" (visible per-frame leg-cross motion) — that's what's
    // mapped below. Columns 0/2/4 of the 6-frame walk cycle give a contact/passing/contact stride,
    // matching the previous sheet's 3-pose approach. carlos_left reuses the right-row rects, same
    // as before this re-map — the renderer's drawFlipped() mirrors them horizontally (in fact
    // scene2d.js's drawAvatar already substitutes 'right' for the frame lookup whenever
    // player.dir === 'left', so these rects are never read standalone at runtime — kept only so
    // the manifest/tiles.js walkFrame() contract stays complete).
    carlos_down_0: { img: 'cfPlayer', x: 0, y: 192, w: 64, h: 64 },
    carlos_down_1: { img: 'cfPlayer', x: 128, y: 192, w: 64, h: 64 },
    carlos_down_2: { img: 'cfPlayer', x: 256, y: 192, w: 64, h: 64 },
    carlos_up_0: { img: 'cfPlayer', x: 0, y: 320, w: 64, h: 64 },
    carlos_up_1: { img: 'cfPlayer', x: 128, y: 320, w: 64, h: 64 },
    carlos_up_2: { img: 'cfPlayer', x: 256, y: 320, w: 64, h: 64 },
    carlos_right_0: { img: 'cfPlayer', x: 0, y: 256, w: 64, h: 64 },
    carlos_right_1: { img: 'cfPlayer', x: 128, y: 256, w: 64, h: 64 },
    carlos_right_2: { img: 'cfPlayer', x: 256, y: 256, w: 64, h: 64 },
    carlos_left_0: { img: 'cfPlayer', x: 0, y: 256, w: 64, h: 64 },
    carlos_left_1: { img: 'cfPlayer', x: 128, y: 256, w: 64, h: 64 },
    carlos_left_2: { img: 'cfPlayer', x: 256, y: 256, w: 64, h: 64 },

    // Armor overlay frames — identical rects to the carlos_* base frames above, one set per layer
    // (legs → chest → helm draw order). drawAvatar (scene2d.js) stacks base + these three at the
    // same dx,dy so the modular parts land exactly over the body. Left reuses the right-facing rects
    // (drawAvatar mirrors 'left' to 'right' before lookup, same as the base), so no _left set here.
    legs_down_0: { img: 'cfLegs', x: 0, y: 192, w: 64, h: 64 },
    legs_down_1: { img: 'cfLegs', x: 128, y: 192, w: 64, h: 64 },
    legs_down_2: { img: 'cfLegs', x: 256, y: 192, w: 64, h: 64 },
    legs_up_0: { img: 'cfLegs', x: 0, y: 320, w: 64, h: 64 },
    legs_up_1: { img: 'cfLegs', x: 128, y: 320, w: 64, h: 64 },
    legs_up_2: { img: 'cfLegs', x: 256, y: 320, w: 64, h: 64 },
    legs_right_0: { img: 'cfLegs', x: 0, y: 256, w: 64, h: 64 },
    legs_right_1: { img: 'cfLegs', x: 128, y: 256, w: 64, h: 64 },
    legs_right_2: { img: 'cfLegs', x: 256, y: 256, w: 64, h: 64 },
    chest_down_0: { img: 'cfChest', x: 0, y: 192, w: 64, h: 64 },
    chest_down_1: { img: 'cfChest', x: 128, y: 192, w: 64, h: 64 },
    chest_down_2: { img: 'cfChest', x: 256, y: 192, w: 64, h: 64 },
    chest_up_0: { img: 'cfChest', x: 0, y: 320, w: 64, h: 64 },
    chest_up_1: { img: 'cfChest', x: 128, y: 320, w: 64, h: 64 },
    chest_up_2: { img: 'cfChest', x: 256, y: 320, w: 64, h: 64 },
    chest_right_0: { img: 'cfChest', x: 0, y: 256, w: 64, h: 64 },
    chest_right_1: { img: 'cfChest', x: 128, y: 256, w: 64, h: 64 },
    chest_right_2: { img: 'cfChest', x: 256, y: 256, w: 64, h: 64 },
    helm_down_0: { img: 'cfHelm', x: 0, y: 192, w: 64, h: 64 },
    helm_down_1: { img: 'cfHelm', x: 128, y: 192, w: 64, h: 64 },
    helm_down_2: { img: 'cfHelm', x: 256, y: 192, w: 64, h: 64 },
    helm_up_0: { img: 'cfHelm', x: 0, y: 320, w: 64, h: 64 },
    helm_up_1: { img: 'cfHelm', x: 128, y: 320, w: 64, h: 64 },
    helm_up_2: { img: 'cfHelm', x: 256, y: 320, w: 64, h: 64 },
    helm_right_0: { img: 'cfHelm', x: 0, y: 256, w: 64, h: 64 },
    helm_right_1: { img: 'cfHelm', x: 128, y: 256, w: 64, h: 64 },
    helm_right_2: { img: 'cfHelm', x: 256, y: 256, w: 64, h: 64 },

    // Farm animal. Chicken_01.png (256x512) is a 32px-cell, 8-col x 16-row modular sheet (this
    // pack ships 18 chicken color recolors as separate files; _01 is the default white). Row 2
    // (y=64) is an 8-frame side-view walk cycle facing right (confirmed by viewing the row —
    // clear alternating leg positions frame to frame); columns 0 and 4 are opposite phases of
    // that cycle, giving 2 visually distinct walk poses.
    chicken_0: { img: 'cfChicken', x: 0, y: 64, w: 32, h: 32 },
    chicken_1: { img: 'cfChicken', x: 128, y: 64, w: 32, h: 32 },
  },
}

export default MANIFEST
