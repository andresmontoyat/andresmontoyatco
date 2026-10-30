import { doorPoint } from '../entities/site.js'
import { CONFIG } from '../config.js'
import { waterBodies, waterSolids } from './water.js'
import { WORLD_TILE } from './authored/convert.js'

// Every one of these must be laid in the map as an `anchor:<name>` layer (docs/adr/0001). The
// spine runs through them in this order; every one but the farm is an era with its own region.
const ANCHOR_NAMES = ['farm', 'pradera', 'desierto', 'selva', 'cyber', 'castillo']
const HIDDEN_POS = [{ x: 1620, y: 1180 }, { x: 1830, y: 1200 }]
// Ponds are tuned in src/game/config.js (CONFIG.pond.ponds) — position + water radius — unless the
// map paints its own water (docs/adr/0003), and then they come from the painted cells.
const PONDS = CONFIG.pond.ponds
export const WORLD_W = 2140
export const WORLD_H = 1360

// The ponds and how they block: the map's painted water when it has some, else the configured
// circles (whose solids worldRpg derives itself, as it always has).
function pondsOf(water) {
  if (!water) return { ponds: PONDS, waterAuthored: false, waterSolids: null }
  const ponds = waterBodies(water, WORLD_TILE)
  return { ponds, waterAuthored: true, waterSolids: waterSolids(ponds, WORLD_TILE, CONFIG.pond.shoreInset) }
}

export function startYear(entry) {
  const s = (entry.date && entry.date.en) || ''
  const m = s.match(/\d{4}/)
  return m ? Number(m[0]) : 0
}

// The farm's barn and the hidden side-project POIs are the only buildings the game still draws
// itself: the barn is not a company, and the POIs are a Konami secret the map does not know about.
const BARN = { w: 104, h: 117 }
const POI_BUILDING = { name: 'house_lime_blue', w: 66, h: 88 }

function toHiddenSite(e, pos) {
  return {
    id: e.id, co: e.company || e.co, title: e.title, date: e.date,
    metric: e.metric || null, tech: e.tech || [], bi: 'cyber',
    type: 'house', building: POI_BUILDING.name,
    cx: pos.cx, cy: pos.cy, w: POI_BUILDING.w, h: POI_BUILDING.h,
    seen: false, hidden: true,
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

// Options rather than five positionals: the tail of this signature had become "what the map
// contributes", and every caller had to count commas to place a null.
export function buildOverworld(json, biomeForYear, opts = {}) {
  const { sideProjects = [], anchors = null, doors: authoredDoors = null, world = null, water = null } = opts
  // The map owns the world's extent when it has one; the constants are what is left for a caller
  // with no map — tests, and the game before an import has ever run. A half-measured world is
  // ignored rather than honoured: shrinking the world to nothing would strand every site outside it.
  // Both dimensions or neither: taking one from the map and the other from a constant would invent
  // a world that no one measured, and the seam would only show as a camera that stops early.
  const sized = world && world.w > 0 && world.h > 0 ? world : null
  const worldW = sized ? sized.w : WORLD_W
  const worldH = sized ? sized.h : WORLD_H
  // The map names where each town stands. Everything downstream — nearestBiome, buildRoads, the
  // spine — reads from here, so moving one marker in the editor moves that town, its roads and its
  // biome boundary together. There is no built-in fallback: a map missing one fails loudly here
  // rather than quietly putting an era back where the code once guessed.
  const ANCHORS = anchors || {}
  const absent = ANCHOR_NAMES.filter(k => !ANCHORS[k])
  if (absent.length) throw new Error(`the map lays no anchor for: ${absent.join(', ')} — add an anchor:<name> layer in the editor`)
  // Houses come from the map alone. A door without a measured footprint cannot give a collision box
  // or a door point, and an experience with no door has no house — the import refuses both, so here
  // they are simply not in the world.
  const doors = new Map()
  for (const d of authoredDoors || []) {
    if (d && d.kind === 'door' && d.id && d.w && d.h) doors.set(d.id, d)
  }
  const sites = json.entries.filter(e => e.visible !== false && doors.has(e.id))
    .map(e => ({ e, y: startYear(e) })).sort((a, b) => a.y - b.y)
    .map(({ e, y }) => toAuthoredSite(e, biomeForYear(y), doors.get(e.id)))
  const hiddenSites = sideProjects.map((sp, i) =>
    toHiddenSite(sp, { cx: HIDDEN_POS[i % HIDDEN_POS.length].x, cy: HIDDEN_POS[i % HIDDEN_POS.length].y }))
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
    building: 'barn', cx: ANCHORS.farm.x - 100, cy: ANCHORS.farm.y - 110, ...BARN,
  }
  // Animated windmill on the other side of the spawn from the barn, footprint clear of both the
  // spawn box and the barn (drawn specially by scene2d — static tower + rotating sail overlay).
  const farmWindmill = {
    cx: ANCHORS.farm.x + 130, cy: ANCHORS.farm.y - 70, w: 112, h: 98,
  }
  return {
    farm: ANCHORS.farm, regions, sites, hiddenSites, farmBuilding, farmWindmill,
    ...pondsOf(water), worldW, worldH, path, roads,
  }
}
