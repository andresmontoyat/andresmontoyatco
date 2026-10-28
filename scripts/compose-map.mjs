// Composes the authored map through the world-editor's own model, so what it writes is exactly what
// the editor would: the career road (a path terrain the editor's export autotiles), and a decor layer
// of lamp posts, era signs, flowers and groves. Deterministic: the same input map always yields the
// same output, and running it again on its own output changes nothing — it lays the 'road' and
// 'decor' layers afresh each time.
//
// It is an authoring aid, not a generator the game runs: the result is an ordinary map the editor
// opens and the author keeps editing by hand (docs/adr/0001).
//
// Usage: npm run map:compose   (WORLD_EDITOR=<path to the editor repo>, default ../../tools/world-editor)
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EDITOR = path.resolve(ROOT, process.env.WORLD_EDITOR || '../../tools/world-editor')
const ED = pathToFileURL(path.join(EDITOR, 'src')).href
const PACK = path.join(EDITOR, 'public/packs/Cute_Fantasy') + '/'
const { detectFrames } = await import(ED + '/bundle/detect.js')

// How the editor cuts an atlas image: by the empty space between sprites, read off the pixels.
async function framesOf(rel) {
  const { data, info } = await sharp(PACK + rel).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return detectFrames({ data: new Uint8ClampedArray(data), w: info.width, h: info.height })
}
const { projectFromExport } = await import(ED + '/persist/import-map.js')
const { deserializeProject } = await import(ED + '/persist/project.js')
const { exportMap } = await import(ED + '/persist/export.js')
const { buildManifest } = await import(ED + '/bundle/manifest.js')
const M = await import(ED + '/map/model.js')
const { eachLayer } = await import(ED + '/map/layers.js')

const mapPath = path.join(ROOT, 'src/game/world/authored/career.map.json')
const exported = JSON.parse(fs.readFileSync(mapPath, 'utf8'))
const { map } = deserializeProject(projectFromExport(exported))
const T = map.tileSize
const COLS = map.cols, ROWS = map.rows

// ── manifest: pack index, then the map's own cuts, then the cuts this script needs ─────────────
const index = JSON.parse(fs.readFileSync(path.join(EDITOR, 'public/packs/index.json'), 'utf8'))
const images = index.images.filter(i => i.path.startsWith('Cute_Fantasy/')).map(i => ({ ...i, path: i.path.slice('Cute_Fantasy/'.length) }))
const manifest = buildManifest('Cute_Fantasy', 16, images)
Object.assign(manifest.images, exported.slices)
const sheet = (path, fw, fh) => { const im = images.find(i => i.path === path); manifest.images[path] = { type: 'sheet', fw, fh, cols: im.w / fw, rows: im.h / fh, animated: false } }
const atlas = async path => { manifest.images[path] = { type: 'atlas', frames: await framesOf(path) } }
sheet('Trees/Medium_Oak_Tree.png', 32, 48); sheet('Trees/Medium_Spruce_Tree.png', 32, 48)
sheet('Trees/Medium_Birch_Tree.png', 32, 48); sheet('Trees/Medium_Fruit_Tree.png', 32, 64)
sheet('Trees/Big_Spruce_tree.png', 64, 80)
for (const p of ['Signs', 'Lanter_Posts', 'barrels', 'Hay_Bales', 'Benches', 'Well', 'Flowers']) await atlas(`Outdoor decoration/${p}.png`)

// ── cleanup: stray tree-as-tile cells, the empty layer, needle particles ───────────────────────
const layers = [...eachLayer(map)].map(e => e.layer)
const byName = n => layers.find(l => l.name === n)
// A re-run hands the new decor the uids the last one minted, in order, so composing an unchanged map
// rewrites nothing instead of renumbering every object.
const prevUids = (byName('decor') || { items: [] }).items.map(o => o.uid)
for (const n of ['Capa 3', 'Capa 7', 'Capa 5', 'road', 'decor']) { const l = byName(n); if (l) M.removeLayer(map, l.id) }
const props = byName('props')
for (const o of [...props.items]) if (o.ref.path.includes('Particle')) M.removeObject(map, props.id, o.id)

// ── era anchors: the map names where each era's town stands (docs/adr/0001). The positions are the
// ones the game used to hard-code, in editor pixels; once laid, they are the author's to move. A
// marker sprite is required by the layer shape but never drawn — anchor layers are skipped by the
// placement pipeline.
const ERA_ANCHORS = { pradera: [190, 350], desierto: [410, 200], selva: [650, 280], cyber: [680, 520], castillo: [910, 380] }
for (const [era, [x, y]] of Object.entries(ERA_ANCHORS)) {
  if (byName(`anchor:${era}`)) continue
  const l = M.addObjectLayer(map, `anchor:${era}`)
  M.addObject(map, l.id, { path: 'Outdoor decoration/Signs.png', i: 5 }, x, y)
}

// ── seeded rng + value noise ───────────────────────────────────────────────────────────────────
let seed = 7
const rand = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const h2 = (x, y) => { let n = Math.imul(x, 374761393) + Math.imul(y, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296 }
const noise = (x, y, s) => { const gx = x / s, gy = y / s, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0
  const sm = t => t * t * (3 - 2 * t), a = h2(x0, y0), b = h2(x0 + 1, y0), c = h2(x0, y0 + 1), d = h2(x0 + 1, y0 + 1)
  return (a + (b - a) * sm(fx)) + ((c + (d - c) * sm(fx)) - (a + (b - a) * sm(fx))) * sm(fy) }

// ── obstacles (tile grid) ──────────────────────────────────────────────────────────────────────
const inter = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/interactables.json'), 'utf8'))
const houses = inter.filter(d => d.kind === 'door').map(d => ({ id: d.id, x: d.x / 2, y: d.y / 2, w: d.w / 2, h: d.h / 2 }))
const farmA = { x: 159, y: 160 }
const rects = houses.map(h => ({ x0: h.x - h.w / 2, y0: h.y - h.h, x1: h.x + h.w / 2, y1: h.y }))
rects.push({ x0: 83, y0: 105, x1: 135, y1: 163 }) // barn
rects.push({ x0: 196, y0: 125, x1: 252, y1: 174 }) // windmill
const ponds = [{ x: 120, y: 460, r: 48 }, { x: 590, y: 380, r: 44 }]
const blocked = new Set()
const key = (x, y) => `${x},${y}`
for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
  const x0 = tx * T, y0 = ty * T, x1 = x0 + T, y1 = y0 + T, cx = x0 + T / 2, cy = y0 + T / 2
  if (rects.some(r => x0 < r.x1 && x1 > r.x0 && y0 < r.y1 && y1 > r.y0)) blocked.add(key(tx, ty))
  if (ponds.some(p => Math.hypot(cx - p.x, cy - p.y) < p.r + T)) blocked.add(key(tx, ty))
}

// ── roads: A* over 2x2-brush nodes, chronological, reusing laid road ───────────────────────────
const road = new Set()
const nodeOk = (x, y) => x >= 1 && y >= 1 && x + 1 < COLS - 1 && y + 1 < ROWS - 1 &&
  ![[0, 0], [1, 0], [0, 1], [1, 1]].some(([dx, dy]) => blocked.has(key(x + dx, y + dy)))
const onRoad = (x, y) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dy]) => road.has(key(x + dx, y + dy)))
function astar(s, g) {
  const open = [{ x: s.x, y: s.y, d: -1, g: 0, f: 0, p: null }], best = new Map()
  while (open.length) {
    open.sort((a, b) => a.f - b.f); const n = open.shift()
    if (n.x === g.x && n.y === g.y) { const out = []; for (let c = n; c; c = c.p) out.push(c); return out.reverse() }
    const k = `${n.x},${n.y},${n.d}`; if (best.has(k) && best.get(k) <= n.g) continue; best.set(k, n.g)
    ;[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy], d) => {
      const x = n.x + dx, y = n.y + dy; if (!nodeOk(x, y)) return
      const cost = (onRoad(x, y) ? 0.35 : 1) + (n.d !== -1 && n.d !== d ? 2.5 : 0)
      const gg = n.g + cost; open.push({ x, y, d, g: gg, f: gg + (Math.abs(g.x - x) + Math.abs(g.y - y)) * 0.35, p: n })
    })
  }
  throw new Error(`no route ${JSON.stringify(s)} -> ${JSON.stringify(g)}`)
}
const nearestOk = (x, y) => { for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (nodeOk(x + dx, y + dy)) return { x: x + dx, y: y + dy }; throw new Error('stuck ' + x + ',' + y) }
const order = ['mercurio-2007', 'ceiba-2009', 'path-2010', 'tcs-2013', 'software-estrategico-2015', 'integral-2016', 'klever-2020', 'tul-2022', 'blerify-2023', 'f2x-2024', 'soldife-2026']
const doorNode = h => nearestOk(Math.round(h.x / T) - 1, Math.ceil(h.y / T))
let cur = nearestOk(9, 13)
const steps = []
for (const id of order) {
  const goal = doorNode(houses.find(h => h.id === id))
  const path = astar(cur, goal)
  for (const n of path) { for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) road.add(key(n.x + dx, n.y + dy)); steps.push(n) }
  cur = goal
}
const roadLayer = M.addLayer(map, 'road')
// Reused when a previous run left it, so a re-run keeps the id every road cell already names.
const terr = map.terrains.find(t => t.name === 'camino') || M.addTerrain(map, 'camino', 'Tiles/Grass/Grass_Tiles_1.png', 0, 5, 0, 8)
for (const k of road) { const [x, y] = k.split(',').map(Number); M.setCell(map, roadLayer.id, x, y, { terrain: terr.id }) }
// road sits right above the grass base
const base = byName('Capa 1')
const top = () => map.layers.findIndex(l => l.id === roadLayer.id)
while (top() > map.layers.findIndex(l => l.id === base.id) + 1) M.moveLayer(map, roadLayer.id, -1)
if (top() < map.layers.findIndex(l => l.id === base.id)) throw new Error('road below base')

// ── decor ──────────────────────────────────────────────────────────────────────────────────────
const decor = M.addObjectLayer(map, 'decor')
const taken = []
const free = (x, y, r) => {
  const tx = Math.floor(x / T), ty = Math.floor((y - 2) / T)
  if (x < 8 || y < 12 || x > COLS * T - 8 || y > ROWS * T - 4) return false
  if (road.has(key(tx, ty)) || blocked.has(key(tx, ty))) return false
  return !taken.some(t => Math.hypot(t.x - x, t.y - y) < r + t.r)
}
const put = (ref, x, y, scale, r = 6) => {
  if (!free(x, y, r)) return false
  const o = M.addObject(map, decor.id, ref, Math.round(x), Math.round(y))
  if (scale !== 1) M.transformObject(map, decor.id, o.id, { scale })
  taken.push({ x, y, r }); return true
}
const atlasRef = (p, i) => ({ path: `Outdoor decoration/${p}.png`, i })
const tree = (p, s) => ({ ref: { path: `Trees/${p}`, col: 1, row: 0 }, s })
houses.forEach(h => taken.push({ x: h.x, y: h.y - h.h / 2, r: Math.max(h.w, h.h) / 2 }))
taken.push({ x: 159, y: 195, r: 20 }) // spawn

// lamp posts every ~9 steps, alternating sides of the road
for (let i = 4; i < steps.length; i += 9) {
  const n = steps[i], side = (i / 9) % 2 < 1 ? -1 : 1
  for (const [dx, dy] of [[side * 1.2, 0], [0, side * 1.2], [-side * 1.2, 0], [0, -side * 1.2]]) {
    const x = (n.x + 1 + dx * 1.4) * T, y = (n.y + 1 + dy * 1.4) * T + 6
    if (put(atlasRef('Lanter_Posts', 0), x, y, 0.6, 10)) break
  }
}

// era sign at the first house of each era, beside its door
const eraOf = { 'mercurio-2007': 'pradera', 'tcs-2013': 'desierto', 'klever-2020': 'selva', 'tul-2022': 'cyber', 'soldife-2026': 'castillo' }
for (const id of Object.keys(eraOf)) {
  const h = houses.find(v => v.id === id)
  for (const dx of [-h.w / 2 - 10, h.w / 2 + 10, -h.w / 2 - 22, h.w / 2 + 22]) if (put(atlasRef('Signs', 5), h.x + dx, h.y + 14, 0.6, 8)) break
}

// flowers around every house, and one era piece next to it
const flowerIdx = [0, 2, 4, 5, 7, 9, 22, 24, 31, 33]
const eraPiece = {
  pradera: () => atlasRef('Well', 0), desierto: () => atlasRef('Benches', 1), selva: () => atlasRef('barrels', 0),
  cyber: () => atlasRef('Benches', 0), castillo: () => atlasRef('Hay_Bales', 1),
}
const eraForHouse = id => { const y = +id.split('-').pop(); return y <= 2012 ? 'pradera' : y <= 2017 ? 'desierto' : y <= 2021 ? 'selva' : y <= 2024 ? 'cyber' : 'castillo' }
for (const h of houses) {
  for (let k = 0; k < 6; k++) {
    const side = k % 2 ? 1 : -1, x = h.x + side * (h.w / 2 + 4 + rand() * 10), y = h.y - rand() * h.h * 0.4 + 4
    put(atlasRef('Flowers', flowerIdx[Math.floor(rand() * flowerIdx.length)]), x, y, 0.8, 4)
  }
  for (const dx of [h.w / 2 + 20, -h.w / 2 - 20, h.w / 2 + 34]) if (put(eraPiece[eraForHouse(h.id)](), h.x + dx, h.y - 2, 0.6, 10)) break
}

// groves: dense in noise patches and along the map border, species by era region
const anchors = { pradera: { x: 190, y: 350 }, desierto: { x: 410, y: 200 }, selva: { x: 650, y: 280 }, cyber: { x: 680, y: 520 }, castillo: { x: 910, y: 380 }, farm: farmA }
const near = (x, y) => Object.entries(anchors).sort((a, b) => Math.hypot(a[1].x - x, a[1].y - y) - Math.hypot(b[1].x - x, b[1].y - y))[0][0]
const species = {
  farm: [tree('Medium_Fruit_Tree.png', 0.75), tree('Medium_Oak_Tree.png', 0.8)],
  pradera: [tree('Medium_Oak_Tree.png', 0.8), tree('Big_Oak_Tree.png', 0.6), tree('Medium_Fruit_Tree.png', 0.75)],
  desierto: [tree('Medium_Birch_Tree.png', 0.8), tree('Big_Birch_Tree.png', 0.6)],
  selva: [tree('Big_Oak_Tree.png', 0.6), tree('Medium_Oak_Tree.png', 0.8), tree('Medium_Spruce_Tree.png', 0.8)],
  cyber: [tree('Medium_Spruce_Tree.png', 0.8), tree('Big_Spruce_tree.png', 0.55)],
  castillo: [tree('Big_Spruce_tree.png', 0.55), tree('Medium_Birch_Tree.png', 0.8)],
}
const roadDist = (x, y) => { let m = Infinity; for (const k of road) { const [rx, ry] = k.split(',').map(Number); m = Math.min(m, Math.hypot((rx + 0.5) * T - x, (ry + 0.5) * T - y)) } return m }
let trees = 0
for (let gy = 10; gy < ROWS * T; gy += 13) for (let gx = 6; gx < COLS * T; gx += 13) {
  const x = gx + (rand() - 0.5) * 10, y = gy + (rand() - 0.5) * 10
  const edge = Math.min(x, y, COLS * T - x, ROWS * T - y)
  const dense = noise(x, y, 120) > 0.62 || edge < 30
  if (!dense || rand() < 0.35) continue
  if (roadDist(x, y) < 26) continue
  if (Math.hypot(x - 159, y - 160) < 110) continue // farmyard stays open
  const sp = species[near(x, y)], t = sp[Math.floor(rand() * sp.length)]
  if (put(t.ref, x, y, t.s, 9)) trees++
}
// voids: wherever nothing stands within 70px and the road is far, a copse of 3-5 trees
for (let gy = 40; gy < ROWS * T - 20; gy += 24) for (let gx = 30; gx < COLS * T - 20; gx += 24) {
  const x = gx + (rand() - 0.5) * 12, y = gy + (rand() - 0.5) * 12
  if (roadDist(x, y) < 50 || Math.hypot(x - 159, y - 160) < 110) continue
  if (taken.some(t => Math.hypot(t.x - x, t.y - y) < 70)) continue
  const sp = species[near(x, y)]
  const n = 3 + Math.floor(rand() * 3)
  for (let k = 0; k < n; k++) {
    const t = sp[Math.floor(rand() * sp.length)], a = rand() * Math.PI * 2, r = k ? 12 + rand() * 10 : 0
    if (put(t.ref, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7, t.s, 8)) trees++
  }
}
// bushes of flowers sprinkled lightly in the open meadow, never on roads
for (let i = 0; i < 40; i++) { const x = rand() * COLS * T, y = rand() * ROWS * T; if (roadDist(x, y) > 20) put(atlasRef('Flowers', flowerIdx[Math.floor(rand() * flowerIdx.length)]), x, y, 0.8, 5) }

decor.items.forEach((o, i) => { if (prevUids[i]) o.uid = prevUids[i] })
const out = exportMap(map, 'Cute_Fantasy', manifest)
fs.writeFileSync(mapPath, JSON.stringify(out, null, 2) + '\n')
console.log({ roadCells: road.size, decor: decor.items.length, trees, layers: out.layers.map(l => `${l.name}:${(l.cells || l.objects).length}`) })
