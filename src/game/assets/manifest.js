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

// Modular avatar layers → their source image. Draw order is bottom→top (see tiles.js
// AVATAR_LAYERS): base body, jeans, boots, shirt, hair.
const AVATAR_LAYER_IMG = {
  carlos: 'cfPlayer', legs: 'cfLegs', feet: 'cfFeet', chest: 'cfChest', hair: 'cfHair',
}
// Row y-offset of the idle vs walk block per facing direction (left mirrors right at draw time).
const AVATAR_ROWS = {
  down: { idle: 0, walk: 192 }, right: { idle: 64, walk: 256 }, up: { idle: 128, walk: 320 },
}
const AVATAR_WALK_FRAMES = 6 // full stride, cols 0-5
const AVATAR_IDLE_COLS = [0, 3] // two near-static poses → subtle breathing loop

// Every avatar frame, generated so a layer/direction/pose never drifts out of sync: for each layer
// and direction, 6 walk cells (`<layer>_<dir>_0..5`) and 2 idle cells (`<layer>_<dir>_idle0..1`).
// The tests regenerate these names the same way, so adding a layer changes both in one place.
export const AVATAR_FRAMES = (() => {
  const frames = {}
  for (const [layer, img] of Object.entries(AVATAR_LAYER_IMG)) {
    for (const [dir, rows] of Object.entries(AVATAR_ROWS)) {
      for (let i = 0; i < AVATAR_WALK_FRAMES; i += 1) {
        frames[`${layer}_${dir}_${i}`] = { img, x: i * 64, y: rows.walk, w: 64, h: 64 }
      }
      AVATAR_IDLE_COLS.forEach((col, i) => {
        frames[`${layer}_${dir}_idle${i}`] = { img, x: col * 64, y: rows.idle, w: 64, h: 64 }
      })
    }
  }
  return frames
})()

// Premade ambient NPCs (entities/npcs.js). Each sheet's row 0 is a front-facing walk; cols 0 and 3
// are two distinct stride poses, so every NPC gets a `npc_<type>_0/1` two-frame walk from one image.
const NPC_IMG = {
  farmer: 'cfNpcFarmer', miner: 'cfNpcMiner', chef: 'cfNpcChef', katy: 'cfNpcKaty', fin: 'cfNpcFin', jack: 'cfNpcJack',
}
export const NPC_FRAMES = (() => {
  const frames = {}
  for (const [type, img] of Object.entries(NPC_IMG)) {
    frames[`npc_${type}_0`] = { img, x: 0, y: 0, w: 64, h: 64 }
    frames[`npc_${type}_1`] = { img, x: 192, y: 0, w: 64, h: 64 }
  }
  return frames
})()

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
    // Pond water autotile — Water_Tile_1.png (48x80) is the same rounded-island 9-cell set as the
    // cobble road: water centre with a dirt-bank shore blending to grass. Its top-left 48x48 is the
    // 3x3 of 16px cells mapped below (identical coordinates to path_*).
    cfWaterTile: '/game/cute-fantasy/Tiles/Water/Water_Tile_1.png',
    // Animated aquatic decor (8/8/9-frame strips) that floats on / rests by the pond.
    cfLilypad: '/game/cute-fantasy/Outdoor%20decoration/Outdoor_Decor_Animations/Water_Decor_Animations/Water_Plants/Lillypad_Green_1_Anim.png',
    cfCattail: '/game/cute-fantasy/Outdoor%20decoration/Outdoor_Decor_Animations/Water_Decor_Animations/Water_Plants/Cattail_1_Anim.png',
    cfKapybara: '/game/cute-fantasy/Animals/Kapybara/Static/Kapybara_Idle.png',
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
    // Windmill = a static tower (128x112) with a sail wheel mounted upper-right, plus a separate
    // 4-frame rotating-sail strip (256x80 → 64px frames). The tower's own static sails occupy only
    // native x69..122 (alpha-measured), so cropping the tower frame to x0..69 yields a sail-free
    // base; the animated wheel is then drawn over the mount so no static sails peek behind it.
    cfWindmill: '/game/cute-fantasy/Buildings/Buildings/Unique_Buildings/Windmill/Windmill.png',
    cfWindmillSail: '/game/cute-fantasy/Buildings/Buildings/Unique_Buildings/Windmill/Windmill_Sail_Anim.png',
    cfBigOak: '/game/cute-fantasy/Trees/Big_Oak_Tree.png',
    cfMedOak: '/game/cute-fantasy/Trees/Medium_Oak_Tree.png',
    cfFences: '/game/cute-fantasy/Outdoor%20decoration/Fences.png',
    cfOutdoorDecor: '/game/cute-fantasy/Outdoor%20decoration/Outdoor_Decor.png',
    // Flower_Grass_1_Anim.png (128x16) is an 8-frame horizontal wind-sway strip (16px cells) of a
    // flower on a grass tuft — the pack's built-in wind loop. Replaces the old static flower with
    // real frame animation (see render/anim.js), so decor flowers breathe instead of sitting frozen.
    cfFlowerWind: '/game/cute-fantasy/Outdoor%20decoration/Outdoor_Decor_Animations/Grass_Animations/Flower_Grass_1_Anim.png',
    cfPlayer: '/game/cute-fantasy/Player/Player_Base/Player_Base_animations.png',
    // Modular clothing layers — same 576x3584 grid as the base body (verified: every layer PNG in
    // the Player/ modular system shares the base's cell layout), so a layer's cells sit at the exact
    // same {x,y,w,h} as the base's frames and composite pixel-perfect when stacked in drawAvatar.
    // Carlos = casual "lumberjack" dev: red plaid shirt (pops on grass) + black jeans + brown boots
    // + brown hair. No helmet — hair shows, and the red reads far better than the old grey plate.
    cfLegs: '/game/cute-fantasy/Player/Legs/OG_Pants/Pants_1_Black.png',
    cfFeet: '/game/cute-fantasy/Player/Feet/Shoes_1_Brown.png',
    cfChest: '/game/cute-fantasy/Player/Chest/Lumberjack_Shirt/Lumberjack_Shirt_1_Red.png',
    cfHair: '/game/cute-fantasy/Player/Head/Hair_2/Hair_2_Brown.png',
    cfChicken: '/game/cute-fantasy/Animals/Chicken/Chicken_01.png',
    // More farm critters. Same 32px-cell modular grid as the chicken; the right-facing walk row
    // differs per species (measured by viewing each sheet): duck walks in row 1 (y32), cow in
    // row 3 (y96).
    cfDuck: '/game/cute-fantasy/Animals/Duck/Duck_01.png',
    cfCow: '/game/cute-fantasy/Animals/Cow/Cow_01.png',
    // Premade ambient NPCs (see NPC_FRAMES). Each is one complete character sheet; only row 0
    // (front-facing walk, cols 0/3) is used. Space in the folder name is URL-encoded for public/.
    cfNpcFarmer: '/game/cute-fantasy/NPCs%20(Premade)/Farmer_Bob.png',
    cfNpcMiner: '/game/cute-fantasy/NPCs%20(Premade)/Miner_Mike.png',
    cfNpcChef: '/game/cute-fantasy/NPCs%20(Premade)/Chef_Chloe.png',
    cfNpcKaty: '/game/cute-fantasy/NPCs%20(Premade)/Bartender_Katy.png',
    cfNpcFin: '/game/cute-fantasy/NPCs%20(Premade)/Fisherman_Fin.png',
    cfNpcJack: '/game/cute-fantasy/NPCs%20(Premade)/Lumberjack_Jack.png',
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
    // Pond water 9-cell autotile (top-left 48x48 of cfWaterTile), same cell layout as path_*.
    water_center: { img: 'cfWaterTile', x: 16, y: 16, w: 16, h: 16 },
    water_n: { img: 'cfWaterTile', x: 16, y: 0, w: 16, h: 16 },
    water_s: { img: 'cfWaterTile', x: 16, y: 32, w: 16, h: 16 },
    water_w: { img: 'cfWaterTile', x: 0, y: 16, w: 16, h: 16 },
    water_e: { img: 'cfWaterTile', x: 32, y: 16, w: 16, h: 16 },
    water_nw: { img: 'cfWaterTile', x: 0, y: 0, w: 16, h: 16 },
    water_ne: { img: 'cfWaterTile', x: 32, y: 0, w: 16, h: 16 },
    water_sw: { img: 'cfWaterTile', x: 0, y: 32, w: 16, h: 16 },
    water_se: { img: 'cfWaterTile', x: 32, y: 32, w: 16, h: 16 },
    // Aquatic decor animations. Lilypad + cattail are 8-frame 16x16 strips; kapybara is a 9-frame
    // 32x32 idle. animFrame('lilypad'|'cattail'|'kapybara', clock, …) picks the live frame.
    lilypad_0: { img: 'cfLilypad', x: 0, y: 0, w: 16, h: 16 },
    lilypad_1: { img: 'cfLilypad', x: 16, y: 0, w: 16, h: 16 },
    lilypad_2: { img: 'cfLilypad', x: 32, y: 0, w: 16, h: 16 },
    lilypad_3: { img: 'cfLilypad', x: 48, y: 0, w: 16, h: 16 },
    lilypad_4: { img: 'cfLilypad', x: 64, y: 0, w: 16, h: 16 },
    lilypad_5: { img: 'cfLilypad', x: 80, y: 0, w: 16, h: 16 },
    lilypad_6: { img: 'cfLilypad', x: 96, y: 0, w: 16, h: 16 },
    lilypad_7: { img: 'cfLilypad', x: 112, y: 0, w: 16, h: 16 },
    cattail_0: { img: 'cfCattail', x: 0, y: 0, w: 16, h: 16 },
    cattail_1: { img: 'cfCattail', x: 16, y: 0, w: 16, h: 16 },
    cattail_2: { img: 'cfCattail', x: 32, y: 0, w: 16, h: 16 },
    cattail_3: { img: 'cfCattail', x: 48, y: 0, w: 16, h: 16 },
    cattail_4: { img: 'cfCattail', x: 64, y: 0, w: 16, h: 16 },
    cattail_5: { img: 'cfCattail', x: 80, y: 0, w: 16, h: 16 },
    cattail_6: { img: 'cfCattail', x: 96, y: 0, w: 16, h: 16 },
    cattail_7: { img: 'cfCattail', x: 112, y: 0, w: 16, h: 16 },
    kapybara_0: { img: 'cfKapybara', x: 0, y: 0, w: 32, h: 32 },
    kapybara_1: { img: 'cfKapybara', x: 32, y: 0, w: 32, h: 32 },
    kapybara_2: { img: 'cfKapybara', x: 64, y: 0, w: 32, h: 32 },
    kapybara_3: { img: 'cfKapybara', x: 96, y: 0, w: 32, h: 32 },
    kapybara_4: { img: 'cfKapybara', x: 128, y: 0, w: 32, h: 32 },
    kapybara_5: { img: 'cfKapybara', x: 160, y: 0, w: 32, h: 32 },
    kapybara_6: { img: 'cfKapybara', x: 192, y: 0, w: 32, h: 32 },
    kapybara_7: { img: 'cfKapybara', x: 224, y: 0, w: 32, h: 32 },
    kapybara_8: { img: 'cfKapybara', x: 256, y: 0, w: 32, h: 32 },

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
    // Windmill tower cropped sail-free (x0..69); animated sail wheel drawn over its mount by
    // scene2d's drawWindmill using animFrame('windmillsail', …). Frame 0 matches the tower's
    // original static-sail pose, so the loop starts seamless.
    windmill_tower: { img: 'cfWindmill', x: 0, y: 0, w: 69, h: 112 },
    windmillsail_0: { img: 'cfWindmillSail', x: 0, y: 0, w: 64, h: 80 },
    windmillsail_1: { img: 'cfWindmillSail', x: 64, y: 0, w: 64, h: 80 },
    windmillsail_2: { img: 'cfWindmillSail', x: 128, y: 0, w: 64, h: 80 },
    windmillsail_3: { img: 'cfWindmillSail', x: 192, y: 0, w: 64, h: 80 },

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

    // Avatar frames — generated by AVATAR_FRAMES (see below), one set per modular layer
    // (carlos base + legs/feet/chest/hair), each layer sharing the base's cell rects so they
    // composite pixel-perfect when drawAvatar stacks them. Player_Base_animations.png (576x3584,
    // 64x64 cells, 9 cols) lays out rows [down, right, up] for Idle (rows 0-2, y 0/64/128) then
    // Walk (rows 3-5, y 192/256/320); there is no dedicated left row (drawAvatar mirrors right).
    // Walk uses all 6 cols (full stride); idle uses 2 cols for a subtle breathing loop.
    ...AVATAR_FRAMES,

    // Farm animal. Chicken_01.png (256x512) is a 32px-cell, 8-col x 16-row modular sheet (this
    // pack ships 18 chicken color recolors as separate files; _01 is the default white). Row 2
    // (y=64) is an 8-frame side-view walk cycle facing right (confirmed by viewing the row —
    // clear alternating leg positions frame to frame); columns 0 and 4 are opposite phases of
    // that cycle, giving 2 visually distinct walk poses.
    chicken_0: { img: 'cfChicken', x: 0, y: 64, w: 32, h: 32 },
    chicken_1: { img: 'cfChicken', x: 128, y: 64, w: 32, h: 32 },
    // Ambient NPC front-walk frames (npc_<type>_0/1), generated by NPC_FRAMES.
    ...NPC_FRAMES,
    // Duck walk cycle, right-facing row 1 (y32); cols 0 and 3 are two distinct stride poses.
    duck_0: { img: 'cfDuck', x: 0, y: 32, w: 32, h: 32 },
    duck_1: { img: 'cfDuck', x: 96, y: 32, w: 32, h: 32 },
    // Cow walk cycle, right-facing side-view row 3 (y96); cols 0 and 4 are two stride poses.
    cow_0: { img: 'cfCow', x: 0, y: 96, w: 32, h: 32 },
    cow_1: { img: 'cfCow', x: 128, y: 96, w: 32, h: 32 },
  },
}

export default MANIFEST
