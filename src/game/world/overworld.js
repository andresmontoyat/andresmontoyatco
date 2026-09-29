import { doorPoint } from '../entities/site.js'
import { CONFIG } from '../config.js'

const BUILT_IN_ANCHORS = {
  farm: { x: 360, y: 1120 },
  pradera: { x: 380, y: 700 },
  desierto: { x: 820, y: 400 },
  selva: { x: 1300, y: 560 },
  cyber: { x: 1360, y: 1040 },
  castillo: { x: 1820, y: 760 },
}
const HIDDEN_POS = [{ x: 1620, y: 1180 }, { x: 1830, y: 1200 }]
// Ponds are tuned in src/game/config.js (CONFIG.pond.ponds) — position + water radius.
const PONDS = CONFIG.pond.ponds
export const WORLD_W = 2140
export const WORLD_H = 1360

export function startYear(entry) {
  const s = (entry.date && entry.date.en) || ''
  const m = s.match(/\d{4}/)
  return m ? Number(m[0]) : 0
}

function ringPos(center, i, n) {
  if (n <= 1) return { cx: center.x, cy: center.y - 40 }
  const ang = (-0.5 + i / (n - 0.001)) * Math.PI * 1.1 - 0.6
  return { cx: center.x + Math.cos(ang) * 155 + (i - (n - 1) / 2) * 18, cy: center.y + Math.sin(ang) * 108 - 40 }
}

// Regular companies each get one of these six single-house sprites; featured companies get a
// landmark. The sprite is chosen by a stable hash of the entry's id (falling back to company name)
// so the same company always reads as the same building regardless of sort order or how many
// others share its biome — no positional index, so reordering the data never reshuffles the town.
const HOUSES = ['house', 'house_wood_red', 'house_stone_blue', 'house_stone_red', 'house_lime_blue', 'house_lime_red']
const LANDMARKS = ['church', 'inn', 'blacksmith']
// Draw footprint per building frame — each is the sprite's native aspect scaled to world size, so
// nothing stretches. Also the collision box + label anchor (buildingSolids / doorPoint read w,h).
const BUILDING_DIMS = {
  house: { w: 66, h: 88 }, house_wood_red: { w: 66, h: 88 }, house_stone_blue: { w: 66, h: 88 },
  house_stone_red: { w: 66, h: 88 }, house_lime_blue: { w: 66, h: 88 }, house_lime_red: { w: 66, h: 88 },
  church: { w: 98, h: 126 }, inn: { w: 150, h: 120 }, blacksmith: { w: 120, h: 96 }, barn: { w: 104, h: 117 },
}

function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return h >>> 0
}

export function buildingFor(e) {
  const set = e.featured ? LANDMARKS : HOUSES
  return set[hashStr(String(e.id || e.co || e.company || '')) % set.length]
}

function toSite(e, bi, pos, hidden) {
  const featured = !!e.featured
  const building = buildingFor(e)
  const dim = BUILDING_DIMS[building]
  return {
    id: e.id, co: e.company || e.co, title: e.title, date: e.date,
    metric: e.metric || null, tech: e.tech || [], bi,
    type: featured ? 'castle' : 'house', building,
    cx: pos.cx, cy: pos.cy, w: dim.w, h: dim.h,
    seen: false, hidden: !!hidden,
  }
}

// An authored house, per docs/adr/0001: the map owns where it stands, how big it is and what it
// looks like; everything else about the site still comes from the CV entry.
//
// `cy` is a site's TOP edge — the barn is placed that way and buildingDrawable draws downward from
// it — while the editor anchors an object by its BOTTOM. Converting here is not optional: without
// it every authored house floats one sprite-height above its own shadow, and its collision box and
// door point go with it.
//
// `building: null` is the load-bearing part. The sprite is already drawn by the placements pipeline,
// because it is a placed object like any other; drawing it again through the building renderer would
// stack a hashed house on top of the one the author chose.
function toAuthoredSite(e, bi, d) {
  return {
    id: e.id, co: e.company || e.co, title: e.title, date: e.date,
    metric: e.metric || null, tech: e.tech || [], bi,
    type: e.featured ? 'castle' : 'house', building: null,
    cx: d.x, cy: d.y - d.h, w: d.w, h: d.h,
    seen: false, hidden: false, authored: true, uid: d.uid,
  }
}

function distSq(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

// Nearest point on the spine polyline (world.path — farm through castillo) to an arbitrary world
// point, projecting onto each spine segment in turn and keeping the closest. Exported/tested in
// isolation since it's the "where does this spur/loop meet the road" decision buildRoads makes
// for every site and hidden POI below.
export function projectOntoSpine(point, spine) {
  let best = null
  for (let i = 0; i < spine.length - 1; i += 1) {
    const a = spine[i]
    const b = spine[i + 1]
    const abx = b.x - a.x
    const aby = b.y - a.y
    const lenSq = abx * abx + aby * aby
    const t = lenSq > 0
      ? Math.max(0, Math.min(1, ((point.x - a.x) * abx + (point.y - a.y) * aby) / lenSq))
      : 0
    const px = a.x + abx * t
    const py = a.y + aby * t
    const d = distSq(point, { x: px, y: py })
    if (!best || d < best.d) best = { x: px, y: py, d }
  }
  return { x: best.x, y: best.y }
}

// The two DISTINCT spine anchor vertices nearest a point — used to pick a hidden POI loop's two
// rejoin points. Sorting the 6 fixed, all-distinct ANCHORS by distance and taking the first two
// guarantees two different vertices (never the same point twice), so a POI loop always leaves
// the spine at one point and rejoins it at a genuinely different one, rather than dead-ending.
function nearestTwoSpinePoints(point, spine) {
  const sorted = [...spine].sort((a, b) => distSq(point, a) - distSq(point, b))
  return [sorted[0], sorted[1]]
}

// Builds the road GRAPH (segments), not just the single spine polyline: the spine itself, a
// spur from every visible site's door to the spine, and — for each hidden side-project (POI) —
// a two-segment loop that leaves the spine at its nearest point, reaches the POI's door, and
// rejoins the spine at a second, different point, so the detour visibly reconnects to the route
// instead of dead-ending. Spurs/loops route to doorPoint(site) (bottom-center of the building
// plus a small offset — already outside the building's own collision footprint), the same point
// the interact/collision logic already targets, so the rendered road visibly meets the door the
// player actually walks to and presses E at.
function buildRoads(path, sites, hiddenSites) {
  const spine = []
  for (let i = 0; i < path.length - 1; i += 1) spine.push({ a: path[i], b: path[i + 1] })

  const spurs = sites.map(s => {
    const door = doorPoint(s)
    return { a: door, b: projectOntoSpine(door, path) }
  })

  const loops = hiddenSites.flatMap(hs => {
    const door = doorPoint(hs)
    const [spineA, spineB] = nearestTwoSpinePoints(door, path)
    return [
      { a: spineA, b: door, hidden: true },
      { a: door, b: spineB, hidden: true },
    ]
  })

  return spine.concat(spurs, loops)
}

export function buildOverworld(json, biomeForYear, sideProjects = [], authoredAnchors = null, authoredDoors = null) {
  // Authored anchors (painted as `anchor:<biome>` layers in the world-editor) override the
  // built-in positions per biome; anything not painted keeps its constant. Everything downstream
  // — ringPos, nearestBiome, buildRoads — reads from here, so moving one marker moves that town,
  // its roads and its biome boundary together.
  const ANCHORS = { ...BUILT_IN_ANCHORS, ...(authoredAnchors || {}) }
  // Houses the map authored, keyed by the experience each one names. A door with no measured
  // footprint is ignored rather than honoured: with no w/h there is no collision box and no door
  // point, and the generator's known-good geometry beats a zero-sized building the player walks
  // through. A door naming an entry that is hidden or absent simply never matches.
  const doors = new Map()
  for (const d of authoredDoors || []) {
    if (d && d.kind === 'door' && d.id && d.w && d.h) doors.set(d.id, d)
  }
  const visible = json.entries.filter(e => e.visible !== false)
    .map(e => ({ e, y: startYear(e) })).sort((a, b) => a.y - b.y)
  // The ring spaces out the houses a biome still has to fit, so it counts only the ones the
  // generator is placing. An authored house that kept its slot would reserve a gap nobody stands in.
  const ringCount = {}
  for (const { e, y } of visible) {
    if (doors.has(e.id)) continue
    const bi = biomeForYear(y)
    ringCount[bi] = (ringCount[bi] || 0) + 1
  }
  const byBiome = {}
  const sites = visible.map(({ e, y }) => {
    const bi = biomeForYear(y)
    const authored = doors.get(e.id)
    if (authored) return toAuthoredSite(e, bi, authored)
    byBiome[bi] = (byBiome[bi] || 0)
    const pos = ringPos(ANCHORS[bi], byBiome[bi]++, ringCount[bi])
    return toSite(e, bi, pos, false)
  })
  const hiddenSites = sideProjects.map((sp, i) =>
    toSite(sp, 'cyber', { cx: HIDDEN_POS[i % HIDDEN_POS.length].x, cy: HIDDEN_POS[i % HIDDEN_POS.length].y }, true))
  const regions = Object.keys(ANCHORS).filter(k => k !== 'farm').map(k => ({ bi: k, ...ANCHORS[k] }))
  const path = [ANCHORS.farm, ANCHORS.pradera, ANCHORS.desierto, ANCHORS.selva, ANCHORS.cyber, ANCHORS.castillo]
  // `path` is kept as-is (the intro camera / other callers may still want the plain spine
  // polyline) — `roads` is the full graph (spine + door spurs + POI loops) scene2d.js renders.
  const roads = buildRoads(path, sites, hiddenSites)
  // The farm spawn gets a real Barn landmark (not a company — no dialog/label). Placed up-left with
  // its whole footprint clear of the player's spawn box (spawn is at farm.x, farm.y + 70): the
  // barn's right edge (cx + w/2) stays left of the spawn column so its collision solid never traps
  // the player on frame 1.
  const farmBuilding = {
    building: 'barn', cx: ANCHORS.farm.x - 100, cy: ANCHORS.farm.y - 110, ...BUILDING_DIMS.barn,
  }
  // Animated windmill on the other side of the spawn from the barn, footprint clear of both the
  // spawn box and the barn (drawn specially by scene2d — static tower + rotating sail overlay).
  const farmWindmill = {
    cx: ANCHORS.farm.x + 130, cy: ANCHORS.farm.y - 70, w: 112, h: 98,
  }
  return {
    farm: ANCHORS.farm, regions, sites, hiddenSites, farmBuilding, farmWindmill,
    ponds: PONDS, worldW: WORLD_W, worldH: WORLD_H, path, roads,
  }
}
