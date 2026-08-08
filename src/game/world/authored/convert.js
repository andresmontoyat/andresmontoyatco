// Converts the world-editor's engine-neutral map export into the three artifacts the game
// consumes: atlas manifest entries, a palette-encoded tile JSON, and placements.
// Pure — no fs, no network. The import script injects everything environmental.

const PACK_ROOT = 'Cute_Fantasy/'
const PUBLIC_BASE = '/game/cute-fantasy/'
const FRAME_PREFIX = 'am_'

// "path/to/img.png#3,2" -> { path, col, row }. The editor always writes this shape
// (see exportMap/frameStr in the editor's src/persist/export.js).
export function splitRef(ref) {
  const hash = ref.lastIndexOf('#')
  if (hash < 0) throw new Error(`malformed ref (no cell): ${ref}`)
  const [col, row] = ref.slice(hash + 1).split(',')
  if (col === undefined || row === undefined) throw new Error(`malformed ref (no cell): ${ref}`)
  return { path: ref.slice(0, hash), col: Number(col), row: Number(row) }
}

function stripRoot(path) {
  return path.startsWith(PACK_ROOT) ? path.slice(PACK_ROOT.length) : path
}

// A manifest image key: pack-relative path, extension dropped, every non-alphanumeric run
// collapsed to one underscore. The am_ prefix keeps the authored namespace disjoint from the
// 235 hand-curated frame names in manifest.js — collision is impossible by construction.
export function slugFor(path) {
  const rel = stripRoot(path).replace(/\.[^./]+$/, '')
  return FRAME_PREFIX + rel.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export function frameNameFor(ref) {
  const { path, col, row } = splitRef(ref)
  return `${slugFor(path)}_${col}_${row}`
}

// manifest.images values are URL-encoded (pack folders contain spaces and parentheses) and
// pack-atlas.mjs decodeURIComponent()s them back to read the file off disk.
export function publicUrlFor(path) {
  return PUBLIC_BASE + stripRoot(path).split('/').map(encodeURIComponent).join('/')
}

// The six biome ids buildOverworld knows (ANCHORS in src/game/world/overworld.js).
export const BIOMES = ['farm', 'pradera', 'desierto', 'selva', 'cyber', 'castillo']

const ANCHOR_PREFIX = 'anchor:'

// The editor has no per-object properties, so layer NAMES carry the semantics. This is the
// only convention the adapter invents, and it uses something the editor already gives away
// for free: free-form layer names.
export function classifyLayer(layer) {
  if (layer.type === 'tiles') return { kind: 'tiles' }
  if (!layer.name.startsWith(ANCHOR_PREFIX)) return { kind: 'objects' }
  const biome = layer.name.slice(ANCHOR_PREFIX.length)
  if (!BIOMES.includes(biome)) {
    throw new Error(`layer "${layer.name}": unknown biome "${biome}" (expected one of ${BIOMES.join(', ')})`)
  }
  return { kind: 'anchor', biome }
}

export function anchorsFrom(layers) {
  const out = {}
  for (const layer of layers) {
    const c = classifyLayer(layer)
    if (c.kind !== 'anchor') continue
    const items = layer.objects || []
    if (items.length !== 1) {
      throw new Error(`layer "${layer.name}": an anchor layer needs exactly one object, got ${items.length}`)
    }
    out[c.biome] = { x: items[0].x, y: items[0].y }
  }
  return out
}

// Transform fields are copied only when present, so an untransformed object serializes to
// exactly { frame, x, y } — byte-identical to what the Asset Placer wrote, which is what
// makes the render path's identity case verifiable.
function toPlacement(o) {
  const p = { frame: frameNameFor(o.frame), x: o.x, y: o.y }
  if (o.flipX) p.flipX = true
  if (o.flipY) p.flipY = true
  if (o.rot) p.rot = o.rot
  if (o.scale && o.scale !== 1) p.scale = o.scale
  return p
}

export function placementsFrom(layers) {
  return layers
    .filter(l => classifyLayer(l).kind === 'objects')
    .flatMap(l => (l.objects || []).map(toPlacement))
}

const TILE_LAYERS = m => m.layers.filter(l => classifyLayer(l).kind === 'tiles')

// Every ref the map uses anywhere (tiles + objects), deduped, in a stable order.
// Skips anchor layers — their marker frames are never drawn by the game.
function allRefs(map) {
  const refs = new Set()
  for (const l of map.layers) {
    if (classifyLayer(l).kind === 'anchor') continue
    if (l.type === 'objects') for (const o of l.objects || []) refs.add(o.frame)
    else for (const c of l.cells || []) refs.add(c.frame)
  }
  return [...refs].sort()
}

// The editor's exportMap emits world size, never cols/rows — deriving them is the only
// correct source. map.tileSize is the PACK's source granularity (16 for cute-fantasy); the
// renderer's TILE (32 world px) is a separate magnitude and deliberately not referenced here.
export function gridOf(map) {
  return { cols: map.world.w / map.tileSize, rows: map.world.h / map.tileSize }
}

// Palette + triples, not { x, y, frame } objects: covering the 2140x1360 world is 67x43 = 2881
// cells, which is ~144 kB as objects and ~35 kB this way. The file ships to the client inside
// the lazily-imported game chunk, and the site is under a hard Lighthouse mobile gate.
export function tilesFrom(map) {
  const names = [...new Set(TILE_LAYERS(map).flatMap(l => (l.cells || []).map(c => frameNameFor(c.frame))))].sort()
  const index = new Map(names.map((n, i) => [n, i]))
  const { cols, rows } = gridOf(map)
  return {
    version: 1,
    tileSize: map.tileSize,
    cols,
    rows,
    frames: names,
    layers: TILE_LAYERS(map).map(l => ({
      name: l.name,
      cells: (l.cells || []).map(c => [c.x, c.y, index.get(frameNameFor(c.frame))]),
    })),
    anchors: anchorsFrom(map.layers),
  }
}

// Manifest entries for every referenced cell. pack-atlas.mjs bakes exactly what MANIFEST
// references and dedupes by source rect, so authored frames that land on pixels already in the
// atlas cost nothing extra.
export function framesFrom(map, dimsOf) {
  const images = {}
  const frames = {}
  for (const ref of allRefs(map)) {
    const { path, col, row } = splitRef(ref)
    const key = slugFor(path)
    const { w, h } = dimsOf(path)
    const x = col * map.tileSize
    const y = row * map.tileSize
    if (x + map.tileSize > w || y + map.tileSize > h) {
      throw new Error(`ref ${ref}: cell is outside the source image (${w}x${h})`)
    }
    images[key] = publicUrlFor(path)
    frames[frameNameFor(ref)] = { img: key, x, y, w: map.tileSize, h: map.tileSize }
  }
  return { images, frames }
}

export function validateMap(map, { dimsOf, exists }) {
  if (!Number.isInteger(map.tileSize) || map.tileSize < 1) {
    throw new Error(`map tileSize ${map.tileSize} — expected a positive integer (the pack's source granularity)`)
  }
  if (!map.world || map.world.w % map.tileSize || map.world.h % map.tileSize) {
    const { w, h } = map.world || {}
    throw new Error(`map world ${w}x${h} is not a whole number of ${map.tileSize}px tiles`)
  }
  map.layers.forEach(classifyLayer)
  anchorsFrom(map.layers)
  for (const ref of allRefs(map)) {
    const { path, col, row } = splitRef(ref)
    if (!exists(path)) throw new Error(`ref ${ref}: ${path} not found in the pack`)
    const { w, h } = dimsOf(path)
    if (col * map.tileSize + map.tileSize > w || row * map.tileSize + map.tileSize > h) {
      throw new Error(`ref ${ref}: cell is outside the source image (${w}x${h})`)
    }
  }
}

export function convertMap(map, { dimsOf, exists = () => true }) {
  validateMap(map, { dimsOf, exists })
  return {
    manifest: framesFrom(map, dimsOf),
    tiles: tilesFrom(map),
    placements: placementsFrom(map.layers),
  }
}
