# M6 — World Editor → Career World adapter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make terrain and decoration authorable in the world-editor and render them in the Career World game, without touching the editor and without removing the procedurally generated world.

**Architecture:** A build-time script converts the editor's engine-neutral `map.json` into three committed artifacts — authored atlas frames merged into `MANIFEST`, a palette-encoded tile JSON, and `placements.json`. At runtime the game draws one extra tile pass on top of the procedural ground, and feeds authored marker positions into `buildOverworld` as `ANCHORS`. All conversion logic is pure and unit-tested; the script is an I/O shell.

**Tech Stack:** Node ≥22.12 (ESM `.mjs` scripts), Vitest, `sharp` (already a dependency, used by `scripts/pack-atlas.mjs`), Astro + React island for the game mount.

**Spec:** `docs/superpowers/specs/2026-08-05-editor-game-adapter-design.md`

## Global Constraints

- **Node ≥22.12** — Astro refuses to start below it. The shell default may be v20; use `~/.nvm/versions/node/v22.23.2/bin` or `nvm use 22`.
- **Tile size is 32** — `TILE = 32` in `src/game/render/scene2d.js`. A map with any other `tileSize` is a hard error.
- **Determinism** — no `Date.now()`, no `Math.random()`, no filesystem iteration order in any generated artifact. Same input → identical bytes. `scripts/pack-atlas.mjs` already holds this line.
- **Code style** — no semicolons, 2-space indent, max line 120, ESLint airbnb + react. Match the surrounding game code.
- **The paid pack is gitignored** — `public/game/cute-fantasy/` is not in git. The import script only runs on a machine that has it unpacked. Tests must never read it.
- **Frame namespace** — every authored frame name starts with `am_`. Never collide with the 235 hand-curated names.
- **Six known biomes** — `farm`, `pradera`, `desierto`, `selva`, `cyber`, `castillo`.
- **Non-regression** — a placement with no transform fields must draw byte-identically to today.

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `.nvmrc` | Declares Node 22 |
| `src/game/world/authored/career.map.json` | The raw editor export, committed verbatim |
| `src/game/world/authored/convert.js` | All pure conversion logic (ref parsing, layer classification, encoding, validation) |
| `src/game/world/authored/convert.test.js` | Unit tests for the above |
| `src/game/world/authored/index.js` | Runtime-side helpers: build the cell lookup index |
| `src/game/world/authored/index.test.js` | Unit tests for the index |
| `src/game/assets/manifest.authored.js` | **Generated.** Authored images + frames merged into `MANIFEST` |
| `src/game/world/authored/career.tiles.json` | **Generated.** Palette-encoded tile layers + anchors |
| `scripts/import-map.mjs` | I/O shell: read export, call `convert.js`, write the three artifacts |

**Modified:**

| File | Change |
|---|---|
| `src/game/assets/manifest.js` | Merge `AUTHORED_IMAGES` / `AUTHORED_FRAMES` into `MANIFEST` |
| `src/game/render/scene2d.js` | New `drawAuthoredTiles` pass; `drawTransformed` for placements |
| `src/game/world/overworld.js` | `buildOverworld` accepts authored anchors |
| `src/game/worldRpg.js` | Accept `authored` + pass anchors through |
| `src/components/react/WorldRpg.jsx` | Import the tiles JSON, pass it to `createWorldRpg` |
| `src/data/placements.json` | **Generated** from now on (currently `[]`) |
| `package.json` | `map:import` script |

---

### Task 1: Foundations — Node pin and a real seed export

This task verifies the spec's single load-bearing assumption **before** any conversion code exists: that bundle paths in a real export include the pack root (`Cute_Fantasy/...`). If they don't, Task 2's mapping rule changes, and finding that out after writing four tasks of code is expensive.

**Files:**
- Create: `.nvmrc`
- Create: `src/game/world/authored/career.map.json`
- Create: `src/game/world/authored/README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `career.map.json` — the fixture every later task reads. Its exact shape is the contract for `convert.js`.

- [ ] **Step 1: Pin Node**

Create `.nvmrc`:

```
22
```

- [ ] **Step 2: Produce a real export from the editor**

This step is manual and cannot be automated — it needs the editor UI and the paid pack.

1. `cd /Users/andres/Development/repositories.nosync/codehunters/tools/world-editor && npm run dev`
2. In the browser: import `~/Downloads/Cute_Fantasy.zip` as the bundle.
3. Create a new map, **tile size 16** (the pack's source granularity — the game upscales each
   cell to 32 world px), 67 cols × 43 rows.
4. Paint a small patch of ground — a dozen tiles is enough. Do not try to cover the world.
5. Add an objects layer named `props`, place 2-3 decorations. Give one of them a flip and a rotation so the transform path gets exercised.
6. Add an objects layer named **exactly** `anchor:farm`, and place **one** object anywhere near the bottom-left (the farm is at world `360,1120`).
7. Export the map. Save the downloaded JSON to `src/game/world/authored/career.map.json` in the portfolio repo.

- [ ] **Step 3: Verify the path-shape assumption**

Run:

```bash
cd "/Users/andres/Library/Mobile Documents/com~apple~CloudDocs/Development/repositories.nosync/codehunters/sites/andresmontoyatco"
node -e "
const m = require('./src/game/world/authored/career.map.json')
const first = m.layers.find(l => l.type === 'tiles')?.cells?.[0]
console.log('tileSize:', m.tileSize)
console.log('sample frame:', first && first.frame)
console.log('layer names:', m.layers.map(l => l.name + ':' + l.type).join(', '))
"
```

Expected: `tileSize: 32`, and a frame like `Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png#3,2`.

**If the `Cute_Fantasy/` root segment is missing**, stop and record the real shape in the README below. Task 2's `publicUrlFor` then prefixes `/game/cute-fantasy/` directly instead of stripping a segment first — everything else in the plan is unaffected.

- [ ] **Step 4: Document the workflow**

Create `src/game/world/authored/README.md`:

```markdown
# Authored map

`career.map.json` is the raw export from the world-editor
(`codehunters/tools/world-editor`), committed verbatim.

## Re-import after editing the map

1. Export the map from the editor, overwrite `career.map.json`.
2. `npm run map:import`  — regenerates manifest.authored.js, career.tiles.json, placements.json
3. `npm run assets:pack` — rebakes atlas.png / atlas.json
4. `npm test`
5. Commit all generated files together.

Requires the paid Cute Fantasy pack unpacked at `public/game/cute-fantasy/`
(gitignored). The import cannot run in CI.

## Verified path shape

Bundle refs look like: `Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png#3,2`
(pack root included). `publicUrlFor` strips the root and serves from
`/game/cute-fantasy/`.
```

- [ ] **Step 5: Commit**

```bash
git add .nvmrc src/game/world/authored/
git commit -m "chore(game): pin node 22 + seed authored map export"
```

---

### Task 2: Ref parsing — frame names, image keys, public URLs

**Files:**
- Create: `src/game/world/authored/convert.js`
- Test: `src/game/world/authored/convert.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `splitRef(ref: string) -> { path: string, col: number, row: number }`
  - `slugFor(path: string) -> string` — e.g. `am_Tiles_Grass_Grass_1_Middle`
  - `frameNameFor(ref: string) -> string` — e.g. `am_Tiles_Grass_Grass_1_Middle_3_2`
  - `publicUrlFor(path: string) -> string` — URL-encoded, e.g. `/game/cute-fantasy/Tiles/Grass/Grass_1_Middle.png`

- [ ] **Step 1: Write the failing test**

Create `src/game/world/authored/convert.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  splitRef, slugFor, frameNameFor, publicUrlFor,
} from './convert.js'

describe('splitRef', () => {
  it('splits a bundle ref into path and cell', () => {
    expect(splitRef('Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png#3,2'))
      .toEqual({ path: 'Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png', col: 3, row: 2 })
  })
  it('throws on a ref with no cell part', () => {
    expect(() => splitRef('Cute_Fantasy/Tiles/Grass.png')).toThrow(/malformed ref/)
  })
})

describe('slugFor', () => {
  it('strips the pack root and extension and prefixes am_', () => {
    expect(slugFor('Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png'))
      .toBe('am_Tiles_Grass_Grass_1_Middle')
  })
  it('collapses spaces and parentheses into single underscores', () => {
    expect(slugFor('Cute_Fantasy/NPCs (Premade)/Old Man.png'))
      .toBe('am_NPCs_Premade_Old_Man')
  })
  it('is idempotent for the same input', () => {
    const p = 'Cute_Fantasy/Trees/Tree.png'
    expect(slugFor(p)).toBe(slugFor(p))
  })
})

describe('frameNameFor', () => {
  it('appends the cell coordinates to the slug', () => {
    expect(frameNameFor('Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png#3,2'))
      .toBe('am_Tiles_Grass_Grass_1_Middle_3_2')
  })
  it('never collides with a hand-curated name', () => {
    expect(frameNameFor('Cute_Fantasy/x/house.png#0,0').startsWith('am_')).toBe(true)
  })
})

describe('publicUrlFor', () => {
  it('maps the pack root onto the public game path', () => {
    expect(publicUrlFor('Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png'))
      .toBe('/game/cute-fantasy/Tiles/Grass/Grass_1_Middle.png')
  })
  it('url-encodes spaces and parentheses so the browser can fetch it', () => {
    expect(publicUrlFor('Cute_Fantasy/NPCs (Premade)/Old Man.png'))
      .toBe('/game/cute-fantasy/NPCs%20(Premade)/Old%20Man.png')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/world/authored/convert.test.js`
Expected: FAIL — `Failed to resolve import "./convert.js"`.

- [ ] **Step 3: Write the implementation**

Create `src/game/world/authored/convert.js`:

```js
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
```

Note `encodeURIComponent` leaves `(` and `)` untouched, which matches the expected
`NPCs%20(Premade)` in the test.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/world/authored/convert.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/world/authored/convert.js src/game/world/authored/convert.test.js
git commit -m "feat(game): authored-map ref parsing — frame names, image keys, public urls"
```

---

### Task 3: Layer classification and anchor extraction

**Files:**
- Modify: `src/game/world/authored/convert.js`
- Test: `src/game/world/authored/convert.test.js` (append)

**Interfaces:**
- Consumes: Task 2's exports.
- Produces:
  - `BIOMES: string[]` — the six known biome ids
  - `classifyLayer(layer) -> { kind: 'anchor', biome: string } | { kind: 'objects' } | { kind: 'tiles' }`
  - `anchorsFrom(layers) -> { [biome]: { x: number, y: number } }`
  - `placementsFrom(layers) -> Array<{ frame, x, y, flipX?, flipY?, rot?, scale? }>`

- [ ] **Step 1: Add the failing tests**

Append to `src/game/world/authored/convert.test.js` (merge the new names into the existing
`./convert.js` import at the top of the file — do not add a second import statement):

```js
describe('classifyLayer', () => {
  it('reads the biome out of an anchor layer name', () => {
    expect(classifyLayer({ name: 'anchor:pradera', type: 'objects' }))
      .toEqual({ kind: 'anchor', biome: 'pradera' })
  })
  it('treats any other objects layer as placements', () => {
    expect(classifyLayer({ name: 'props', type: 'objects' })).toEqual({ kind: 'objects' })
  })
  it('treats tiles layers as terrain', () => {
    expect(classifyLayer({ name: 'suelo', type: 'tiles' })).toEqual({ kind: 'tiles' })
  })
  it('rejects an anchor layer naming an unknown biome', () => {
    expect(() => classifyLayer({ name: 'anchor:atlantis', type: 'objects' }))
      .toThrow(/unknown biome "atlantis"/)
  })
})

describe('anchorsFrom', () => {
  const anchorLayer = (biome, x, y) => ({
    name: `anchor:${biome}`, type: 'objects', objects: [{ frame: 'x.png#0,0', x, y }],
  })

  it('maps each anchor layer to its single object position', () => {
    expect(anchorsFrom([anchorLayer('farm', 360, 1120), anchorLayer('cyber', 1360, 1040)]))
      .toEqual({ farm: { x: 360, y: 1120 }, cyber: { x: 1360, y: 1040 } })
  })
  it('returns an empty object when no anchor layers exist', () => {
    expect(anchorsFrom([{ name: 'props', type: 'objects', objects: [] }])).toEqual({})
  })
  it('rejects an anchor layer with no object', () => {
    expect(() => anchorsFrom([{ name: 'anchor:farm', type: 'objects', objects: [] }]))
      .toThrow(/anchor:farm.*exactly one object.*got 0/)
  })
  it('rejects an anchor layer with more than one object', () => {
    const two = { name: 'anchor:farm', type: 'objects', objects: [{ x: 1, y: 1 }, { x: 2, y: 2 }] }
    expect(() => anchorsFrom([two])).toThrow(/anchor:farm.*exactly one object.*got 2/)
  })
})

describe('placementsFrom', () => {
  it('converts object refs to frame names and keeps the anchor position', () => {
    const layers = [{
      name: 'props',
      type: 'objects',
      objects: [{ frame: 'Cute_Fantasy/Trees/Tree.png#1,0', x: 100, y: 200 }],
    }]
    expect(placementsFrom(layers)).toEqual([{ frame: 'am_Trees_Tree_1_0', x: 100, y: 200 }])
  })
  it('carries transform fields through when present', () => {
    const layers = [{
      name: 'props',
      type: 'objects',
      objects: [{ frame: 'a/b.png#0,0', x: 1, y: 2, flipX: true, rot: 90, scale: 2 }],
    }]
    expect(placementsFrom(layers)[0]).toEqual({
      frame: 'am_a_b_0_0', x: 1, y: 2, flipX: true, rot: 90, scale: 2,
    })
  })
  it('omits absent transform fields entirely so untransformed output matches today', () => {
    const layers = [{ name: 'props', type: 'objects', objects: [{ frame: 'a/b.png#0,0', x: 1, y: 2 }] }]
    expect(Object.keys(placementsFrom(layers)[0])).toEqual(['frame', 'x', 'y'])
  })
  it('never emits anchor-layer objects as placements', () => {
    const layers = [
      { name: 'anchor:farm', type: 'objects', objects: [{ frame: 'a/b.png#0,0', x: 1, y: 2 }] },
      { name: 'props', type: 'objects', objects: [{ frame: 'c/d.png#0,0', x: 3, y: 4 }] },
    ]
    expect(placementsFrom(layers)).toEqual([{ frame: 'am_c_d_0_0', x: 3, y: 4 }])
  })
})
```

- [ ] **Step 2: Run tests to verify the new cases fail**

Run: `npx vitest run src/game/world/authored/convert.test.js`
Expected: FAIL — `classifyLayer is not a function` (and the other new names).

- [ ] **Step 3: Write the implementation**

Append to `src/game/world/authored/convert.js`:

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game/world/authored/convert.test.js`
Expected: PASS, 22 tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/world/authored/convert.js src/game/world/authored/convert.test.js
git commit -m "feat(game): authored-map layer classification, anchors and placements"
```

---

### Task 4: Tile encoding — palette, triples, and the top-level convert

**Files:**
- Modify: `src/game/world/authored/convert.js`
- Test: `src/game/world/authored/convert.test.js` (append)

**Interfaces:**
- Consumes: Tasks 2-3.
- Produces:
  - `tilesFrom(map) -> { version, tileSize, cols, rows, frames: string[], layers: Array<{name, cells: number[][]}>, anchors }`
  - `framesFrom(map, dimsOf) -> { images: {[key]: string}, frames: {[name]: {img, x, y, w, h}} }`
  - `convertMap(map, { dimsOf }) -> { manifest, tiles, placements }`

`dimsOf(path: string) -> { w: number, h: number }` is injected: production reads the PNG with
`sharp`, tests pass a literal. This is what keeps the suite independent of the paid pack.

- [ ] **Step 1: Add the failing tests**

Append to `src/game/world/authored/convert.test.js` (merge the new names into the existing import):

```js
const SAMPLE = {
  version: 1,
  tileSize: 32,
  cols: 4,
  rows: 3,
  world: { w: 128, h: 96 },
  layers: [
    {
      name: 'suelo',
      type: 'tiles',
      cells: [
        { x: 0, y: 0, frame: 'Cute_Fantasy/Tiles/Grass/G.png#0,0' },
        { x: 1, y: 0, frame: 'Cute_Fantasy/Tiles/Grass/G.png#0,0' },
        { x: 2, y: 1, frame: 'Cute_Fantasy/Tiles/Path/P.png#1,1' },
      ],
    },
    { name: 'props', type: 'objects', objects: [{ frame: 'Cute_Fantasy/Trees/T.png#0,0', x: 50, y: 60 }] },
    { name: 'anchor:farm', type: 'objects', objects: [{ frame: 'Cute_Fantasy/Trees/T.png#0,0', x: 8, y: 9 }] },
  ],
}

const DIMS = {
  'Cute_Fantasy/Tiles/Grass/G.png': { w: 64, h: 64 },
  'Cute_Fantasy/Tiles/Path/P.png': { w: 96, h: 96 },
  'Cute_Fantasy/Trees/T.png': { w: 32, h: 32 },
}
const dimsOf = p => DIMS[p]

describe('tilesFrom', () => {
  it('dedupes frames into a palette and encodes cells as [x, y, paletteIndex]', () => {
    const t = tilesFrom(SAMPLE)
    expect(t.frames).toEqual(['am_Tiles_Grass_G_0_0', 'am_Tiles_Path_P_1_1'])
    expect(t.layers).toEqual([{ name: 'suelo', cells: [[0, 0, 0], [1, 0, 0], [2, 1, 1]] }])
  })
  it('sorts the palette by name so indices are stable across re-imports', () => {
    const reversed = { ...SAMPLE, layers: [{ ...SAMPLE.layers[0], cells: [...SAMPLE.layers[0].cells].reverse() }] }
    expect(tilesFrom(reversed).frames).toEqual(tilesFrom(SAMPLE).frames)
  })
  it('carries dimensions and anchors', () => {
    const t = tilesFrom(SAMPLE)
    expect(t).toMatchObject({ version: 1, tileSize: 32, cols: 4, rows: 3 })
    expect(t.anchors).toEqual({ farm: { x: 8, y: 9 } })
  })
  it('keeps object layers out of the tile output', () => {
    expect(tilesFrom(SAMPLE).layers).toHaveLength(1)
  })
})

describe('framesFrom', () => {
  it('emits one image entry per distinct source path', () => {
    const { images } = framesFrom(SAMPLE, dimsOf)
    expect(images).toEqual({
      am_Tiles_Grass_G: '/game/cute-fantasy/Tiles/Grass/G.png',
      am_Tiles_Path_P: '/game/cute-fantasy/Tiles/Path/P.png',
      am_Trees_T: '/game/cute-fantasy/Trees/T.png',
    })
  })
  it('turns each cell into a manifest rect at tileSize granularity', () => {
    const { frames } = framesFrom(SAMPLE, dimsOf)
    expect(frames.am_Tiles_Path_P_1_1).toEqual({ img: 'am_Tiles_Path_P', x: 32, y: 32, w: 32, h: 32 })
  })
  it('includes frames referenced only by objects', () => {
    expect(framesFrom(SAMPLE, dimsOf).frames.am_Trees_T_0_0)
      .toEqual({ img: 'am_Trees_T', x: 0, y: 0, w: 32, h: 32 })
  })
})

describe('convertMap', () => {
  it('returns the three artifacts together', () => {
    const out = convertMap(SAMPLE, { dimsOf })
    expect(Object.keys(out).sort()).toEqual(['manifest', 'placements', 'tiles'])
    expect(out.placements).toEqual([{ frame: 'am_Trees_T_0_0', x: 50, y: 60 }])
    expect(out.tiles.anchors.farm).toEqual({ x: 8, y: 9 })
    expect(out.manifest.frames.am_Tiles_Grass_G_0_0).toBeDefined()
  })
  it('is deterministic — same input, identical json', () => {
    expect(JSON.stringify(convertMap(SAMPLE, { dimsOf })))
      .toBe(JSON.stringify(convertMap(SAMPLE, { dimsOf })))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game/world/authored/convert.test.js`
Expected: FAIL — `tilesFrom is not a function`.

- [ ] **Step 3: Write the implementation**

Append to `src/game/world/authored/convert.js`:

```js
const TILE_LAYERS = m => m.layers.filter(l => classifyLayer(l).kind === 'tiles')

// Every ref the map uses anywhere (tiles + objects), deduped, in a stable order.
function allRefs(map) {
  const refs = new Set()
  for (const l of map.layers) {
    if (l.type === 'objects') for (const o of l.objects || []) refs.add(o.frame)
    else for (const c of l.cells || []) refs.add(c.frame)
  }
  return [...refs].sort()
}

// Palette + triples, not { x, y, frame } objects: covering the 2140x1360 world is 67x43 = 2881
// cells, which is ~144 kB as objects and ~35 kB this way. The file ships to the client inside
// the lazily-imported game chunk, and the site is under a hard Lighthouse mobile gate.
export function tilesFrom(map) {
  const names = [...new Set(TILE_LAYERS(map).flatMap(l => (l.cells || []).map(c => frameNameFor(c.frame))))].sort()
  const index = new Map(names.map((n, i) => [n, i]))
  return {
    version: 1,
    tileSize: map.tileSize,
    cols: map.cols,
    rows: map.rows,
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

export function convertMap(map, { dimsOf }) {
  return {
    manifest: framesFrom(map, dimsOf),
    tiles: tilesFrom(map),
    placements: placementsFrom(map.layers),
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game/world/authored/convert.test.js`
Expected: PASS, 31 tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/world/authored/convert.js src/game/world/authored/convert.test.js
git commit -m "feat(game): authored-map tile encoding + convertMap"
```

---

### Task 5: Validation — fail loudly at build time

Failing at build time is cheap. A corrupt map at runtime is a broken screen with no clue
whether the export, the bake, or the render is at fault.

**Files:**
- Modify: `src/game/world/authored/convert.js`
- Test: `src/game/world/authored/convert.test.js` (append)

**Interfaces:**
- Consumes: Tasks 2-4.
- Produces: `validateMap(map, { dimsOf, exists })` — throws `Error` on the first problem.
  `exists(path: string) -> boolean` is injected: production stats the file, tests pass a literal.
  `convertMap` calls it before converting.

- [ ] **Step 1: Add the failing tests**

Append to `src/game/world/authored/convert.test.js` (merge `validateMap` into the existing import):

```js
const exists = () => true

describe('validateMap', () => {
  it('accepts the sample map', () => {
    expect(() => validateMap(SAMPLE, { dimsOf, exists })).not.toThrow()
  })
  it('rejects a tile size the renderer cannot draw', () => {
    expect(() => validateMap({ ...SAMPLE, tileSize: 16 }, { dimsOf, exists }))
      .toThrow(/tileSize 16.*renderer requires 32/)
  })
  it('rejects a ref whose png is missing from the pack', () => {
    expect(() => validateMap(SAMPLE, { dimsOf, exists: p => !p.includes('Path') }))
      .toThrow(/Tiles\/Path\/P\.png.*not found/)
  })
  it('rejects a cell outside the source image bounds', () => {
    const tiny = { ...DIMS, 'Cute_Fantasy/Tiles/Path/P.png': { w: 32, h: 32 } }
    expect(() => validateMap(SAMPLE, { dimsOf: p => tiny[p], exists }))
      .toThrow(/outside the source image/)
  })
  it('rejects an unknown biome via classifyLayer', () => {
    const bad = { ...SAMPLE, layers: [...SAMPLE.layers, { name: 'anchor:atlantis', type: 'objects', objects: [] }] }
    expect(() => validateMap(bad, { dimsOf, exists })).toThrow(/unknown biome/)
  })
})

describe('convertMap validation', () => {
  it('validates before converting', () => {
    expect(() => convertMap({ ...SAMPLE, tileSize: 16 }, { dimsOf, exists }))
      .toThrow(/tileSize 16/)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game/world/authored/convert.test.js`
Expected: FAIL — `validateMap is not a function`.

- [ ] **Step 3: Write the implementation**

Add to `src/game/world/authored/convert.js` (place `validateMap` above `convertMap`, then
change `convertMap` as shown):

```js
// TILE in src/game/render/scene2d.js is hardcoded; a map at any other tile size would render
// at the wrong scale everywhere rather than fail visibly, so it is rejected outright.
const RENDER_TILE = 32

export function validateMap(map, { dimsOf, exists }) {
  if (map.tileSize !== RENDER_TILE) {
    throw new Error(`map tileSize ${map.tileSize} — the renderer requires ${RENDER_TILE}`)
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
```

And replace the body of `convertMap`:

```js
export function convertMap(map, { dimsOf, exists = () => true }) {
  validateMap(map, { dimsOf, exists })
  return {
    manifest: framesFrom(map, dimsOf),
    tiles: tilesFrom(map),
    placements: placementsFrom(map.layers),
  }
}
```

- [ ] **Step 4: Run the full suite**

Run: `npm run test:run`
Expected: PASS — all existing tests plus 37 in `convert.test.js`.

- [ ] **Step 5: Commit**

```bash
git add src/game/world/authored/convert.js src/game/world/authored/convert.test.js
git commit -m "feat(game): authored-map validation — tile size, missing pngs, out-of-bounds cells"
```

---

### Task 5b: Correct the tile-size model and derive cols/rows

A real export (Task 1) proved two defects in Tasks 4-5, both introduced by this plan:

1. **`tileSize` is the pack's source granularity, not the world tile size.** The game's ground
   frames are 16×16 source pixels (`ground_farm`, `path_center` — all `{w:16,h:16}` in
   `atlas.json`) drawn into 32×32 world pixels. A correctly authored map for this pack exports
   `tileSize: 16`. `validateMap`'s `tileSize !== 32` check rejects every such map.
2. **`cols`/`rows` do not exist in the export.** `exportMap` emits
   `version, tileSize, world, bundles, terrains, animations, layers` — nothing else.
   `tilesFrom` copies `map.cols`/`map.rows` and would write `undefined` into the shipped JSON.

**Files:**
- Modify: `src/game/world/authored/convert.js`
- Test: `src/game/world/authored/convert.test.js`

**Interfaces:**
- Consumes: everything from Tasks 2-5.
- Produces: `gridOf(map) -> { cols: number, rows: number }`; `tilesFrom` output keeps the same
  shape, with `cols`/`rows` derived rather than copied.

- [ ] **Step 1: Add the failing tests**

Append to `src/game/world/authored/convert.test.js` (merge `gridOf` into the existing import).
`SAMPLE` already carries `cols: 4, rows: 3` and `world: { w: 128, h: 96 }` at `tileSize: 32`,
which stay consistent — so add a separate fixture shaped like a real export:

```js
const REAL = {
  version: 1,
  tileSize: 16,
  world: { w: 960, h: 720 },
  bundles: [{ id: 'Cute_Fantasy' }],
  terrains: [],
  animations: {},
  layers: [
    { name: 'Capa 1', type: 'tiles', cells: [{ x: 6, y: 12, frame: 'Cute_Fantasy/Tiles/Grass/G.png#0,0' }] },
  ],
}
const REAL_DIMS = { 'Cute_Fantasy/Tiles/Grass/G.png': { w: 64, h: 64 } }

describe('gridOf', () => {
  it('derives cols and rows from world size and tile size', () => {
    expect(gridOf(REAL)).toEqual({ cols: 60, rows: 45 })
  })
  it('does not read cols/rows off the map — the editor never emits them', () => {
    expect(gridOf({ ...REAL, cols: 999, rows: 999 })).toEqual({ cols: 60, rows: 45 })
  })
})

describe('tilesFrom with a real export', () => {
  it('emits derived cols/rows, never undefined', () => {
    const t = tilesFrom(REAL)
    expect(t.cols).toBe(60)
    expect(t.rows).toBe(45)
    expect(t.tileSize).toBe(16)
  })
})

describe('validateMap tile-size model', () => {
  it('accepts a 16px source map — the pack granularity, not the world tile size', () => {
    expect(() => validateMap(REAL, { dimsOf: p => REAL_DIMS[p], exists })).not.toThrow()
  })
  it('rejects a missing or non-positive tileSize', () => {
    expect(() => validateMap({ ...REAL, tileSize: 0 }, { dimsOf: p => REAL_DIMS[p], exists }))
      .toThrow(/tileSize/)
  })
  it('rejects a world size that is not a whole number of tiles', () => {
    expect(() => validateMap({ ...REAL, world: { w: 950, h: 720 } }, { dimsOf: p => REAL_DIMS[p], exists }))
      .toThrow(/world 950x720 is not a whole number of 16px tiles/)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH" && npx vitest run src/game/world/authored/convert.test.js`
Expected: FAIL — `gridOf is not a function`, and the 16px map rejected by the old check.

- [ ] **Step 3: Write the implementation**

In `src/game/world/authored/convert.js`, add `gridOf` next to `tilesFrom`:

```js
// The editor's exportMap emits world size, never cols/rows — deriving them is the only
// correct source. map.tileSize is the PACK's source granularity (16 for cute-fantasy); the
// renderer's TILE (32 world px) is a separate magnitude and deliberately not referenced here.
export function gridOf(map) {
  return { cols: map.world.w / map.tileSize, rows: map.world.h / map.tileSize }
}
```

In `tilesFrom`, replace the two copied fields:

```js
  const { cols, rows } = gridOf(map)
```

and use `cols,` / `rows,` in the returned object in place of `cols: map.cols` / `rows: map.rows`.

Then replace the tile-size branch of `validateMap`:

```js
  if (!Number.isInteger(map.tileSize) || map.tileSize < 1) {
    throw new Error(`map tileSize ${map.tileSize} — expected a positive integer (the pack's source granularity)`)
  }
  if (!map.world || map.world.w % map.tileSize || map.world.h % map.tileSize) {
    const { w, h } = map.world || {}
    throw new Error(`map world ${w}x${h} is not a whole number of ${map.tileSize}px tiles`)
  }
```

and delete the now-unused `RENDER_TILE` constant.

- [ ] **Step 4: Run the full suite**

Run: `export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH" && npm run test:run`
Expected: PASS — every earlier test still green (SAMPLE stays consistent at `tileSize: 32`
with `world: { w: 128, h: 96 }`, which derives to the same `cols: 4, rows: 3` it declared).

- [ ] **Step 5: Commit**

```bash
git add src/game/world/authored/convert.js src/game/world/authored/convert.test.js
git commit -m "fix(game): tileSize is pack granularity, and derive cols/rows from world size"
```

---

### Task 6: The import script and the generated artifacts

**Files:**
- Create: `scripts/import-map.mjs`
- Create (generated): `src/game/assets/manifest.authored.js`
- Create (generated): `src/game/world/authored/career.tiles.json`
- Modify (generated): `src/data/placements.json`
- Modify: `src/game/assets/manifest.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: `convertMap` from Task 5.
- Produces: `AUTHORED_IMAGES`, `AUTHORED_FRAMES` exported from `manifest.authored.js`, merged
  into `MANIFEST.images` / `MANIFEST.frames`.

- [ ] **Step 1: Write the script**

Create `scripts/import-map.mjs`:

```js
// Converts the world-editor export (src/game/world/authored/career.map.json) into the three
// artifacts the game consumes. Requires the paid Cute Fantasy pack unpacked at
// public/game/cute-fantasy/ (gitignored) — this cannot run in CI.
//
// Run: node scripts/import-map.mjs (npm run map:import), then npm run assets:pack.
//
// Deterministic: no Date.now/Math.random, and convert.js sorts every collection it emits.

import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import sharp from 'sharp'
import { convertMap } from '../src/game/world/authored/convert.js'

const ROOT = process.cwd()
const IN_MAP = path.join(ROOT, 'src', 'game', 'world', 'authored', 'career.map.json')
const OUT_MANIFEST = path.join(ROOT, 'src', 'game', 'assets', 'manifest.authored.js')
const OUT_TILES = path.join(ROOT, 'src', 'game', 'world', 'authored', 'career.tiles.json')
const OUT_PLACEMENTS = path.join(ROOT, 'src', 'data', 'placements.json')
const PACK = path.join(ROOT, 'public', 'game', 'cute-fantasy')

const PACK_ROOT = 'Cute_Fantasy/'
const diskPath = p => path.join(PACK, p.startsWith(PACK_ROOT) ? p.slice(PACK_ROOT.length) : p)

async function dimsCache(map) {
  const paths = new Set()
  for (const l of map.layers) {
    if (l.type === 'objects') for (const o of l.objects || []) paths.add(o.frame.slice(0, o.frame.lastIndexOf('#')))
    else for (const c of l.cells || []) paths.add(c.frame.slice(0, c.frame.lastIndexOf('#')))
  }
  const dims = {}
  for (const p of [...paths].sort()) {
    if (!existsSync(diskPath(p))) continue
    const meta = await sharp(diskPath(p)).metadata()
    dims[p] = { w: meta.width, h: meta.height }
  }
  return dims
}

function manifestModule(manifest) {
  const j = v => JSON.stringify(v, null, 2)
  return `// GENERATED by scripts/import-map.mjs — do not edit by hand.
// Frames sliced out of the authored map (src/game/world/authored/career.map.json).

export const AUTHORED_IMAGES = ${j(manifest.images)}

export const AUTHORED_FRAMES = ${j(manifest.frames)}
`
}

async function main() {
  const map = JSON.parse(await fs.readFile(IN_MAP, 'utf8'))
  const dims = await dimsCache(map)
  const out = convertMap(map, {
    dimsOf: p => dims[p] || { w: 0, h: 0 },
    exists: p => existsSync(diskPath(p)),
  })
  await fs.writeFile(OUT_MANIFEST, manifestModule(out.manifest))
  await fs.writeFile(OUT_TILES, `${JSON.stringify(out.tiles, null, 2)}\n`)
  await fs.writeFile(OUT_PLACEMENTS, `${JSON.stringify(out.placements, null, 2)}\n`)
  const cells = out.tiles.layers.reduce((n, l) => n + l.cells.length, 0)
  console.log(`imported: ${Object.keys(out.manifest.frames).length} frames, ${cells} cells, `
    + `${out.placements.length} placements, ${Object.keys(out.tiles.anchors).length} anchors`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
```

- [ ] **Step 2: Add the npm script**

In `package.json`, next to `"assets:pack"`:

```json
"map:import": "node scripts/import-map.mjs",
```

- [ ] **Step 3: Run the import and the bake**

Run:

```bash
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
npm run map:import && npm run assets:pack
```

Expected: a line like `imported: 14 frames, 12 cells, 3 placements, 1 anchors`, then the
pack-atlas output. If it reports `not found in the pack`, the pack is not unpacked at
`public/game/cute-fantasy/` — fix that before continuing.

- [ ] **Step 4: Merge the authored frames into the manifest**

In `src/game/assets/manifest.js`, add the import at the top (after the existing imports, if any):

```js
import { AUTHORED_IMAGES, AUTHORED_FRAMES } from './manifest.authored.js'
```

Then spread them into `MANIFEST`. `images` and `frames` are the two top-level keys; add the
spread as the **last** entry in each so a hand-curated name always wins a collision:

```js
  images: {
    // ... existing entries unchanged ...
    ...AUTHORED_IMAGES,
  },
  frames: {
    // ... existing entries unchanged ...
    ...AUTHORED_FRAMES,
  },
```

- [ ] **Step 5: Verify the atlas grew and nothing broke**

Run:

```bash
npm run assets:pack
npm run test:run
node -e "const a=require('./src/game/assets/atlas.json');const n=Object.keys(a.frames);console.log('frames:',n.length,'authored:',n.filter(k=>k.startsWith('am_')).length)"
```

Expected: tests PASS; the frame count is above 235 and the authored count matches the import's
report.

- [ ] **Step 6: Commit**

```bash
git add scripts/import-map.mjs package.json src/game/assets/manifest.js \
        src/game/assets/manifest.authored.js src/game/assets/atlas.json \
        public/game/atlas.json public/game/atlas.png \
        src/game/world/authored/career.tiles.json src/data/placements.json
git commit -m "feat(game): import-map script — authored frames, tiles and placements"
```

---

### Task 7: Render the authored tile pass

**Files:**
- Create: `src/game/world/authored/index.js`
- Test: `src/game/world/authored/index.test.js`
- Modify: `src/game/render/scene2d.js`
- Test: `src/game/render/scene2d.test.js` (append)

**Interfaces:**
- Consumes: `career.tiles.json` from Task 6.
- Produces:
  - `buildAuthoredIndex(tiles) -> Array<{ name: string, cells: Map<string, string> }>` — one
    entry per layer, cells keyed `"x,y"` → frame name.
  - `drawAuthoredTiles(ctx, state, cam, sprites)` — exported from `scene2d.js`, reads
    `state.authored`.

- [ ] **Step 1: Write the index test**

Create `src/game/world/authored/index.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { buildAuthoredIndex } from './index.js'

const tiles = {
  version: 1,
  tileSize: 32,
  cols: 4,
  rows: 3,
  frames: ['am_grass_0_0', 'am_path_1_1'],
  layers: [
    { name: 'suelo', cells: [[0, 0, 0], [2, 1, 1]] },
    { name: 'detalle', cells: [[2, 1, 0]] },
  ],
  anchors: {},
}

describe('buildAuthoredIndex', () => {
  it('keys each layer by "x,y" and resolves the palette index to a frame name', () => {
    const idx = buildAuthoredIndex(tiles)
    expect(idx).toHaveLength(2)
    expect(idx[0].name).toBe('suelo')
    expect(idx[0].cells.get('0,0')).toBe('am_grass_0_0')
    expect(idx[0].cells.get('2,1')).toBe('am_path_1_1')
  })
  it('keeps layer order so later layers can overdraw earlier ones', () => {
    const idx = buildAuthoredIndex(tiles)
    expect(idx[1].cells.get('2,1')).toBe('am_grass_0_0')
  })
  it('returns an empty array for a null map', () => {
    expect(buildAuthoredIndex(null)).toEqual([])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/game/world/authored/index.test.js`
Expected: FAIL — cannot resolve `./index.js`.

- [ ] **Step 3: Write the index**

Create `src/game/world/authored/index.js`:

```js
// Runtime side of the authored map. The tile JSON stores cells as [x, y, paletteIndex] to keep
// the shipped file small; the renderer needs O(1) "what is at this cell" during the visible-tile
// loop, so the triples are turned into one Map per layer, once, at world build time.
export function buildAuthoredIndex(tiles) {
  if (!tiles || !tiles.layers) return []
  return tiles.layers.map(l => ({
    name: l.name,
    cells: new Map(l.cells.map(([x, y, i]) => [`${x},${y}`, tiles.frames[i]])),
  }))
}

export default buildAuthoredIndex
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/game/world/authored/index.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write the render test**

Append to `src/game/render/scene2d.test.js` (merge `drawAuthoredTiles` into the existing
`./scene2d.js` import):

```js
describe('drawAuthoredTiles', () => {
  const fakeCtx = () => ({ canvas: { width: 64, height: 64 } })
  const fakeSprites = calls => ({
    draw: (ctx, name, x, y, w, h) => calls.push({ name, x, y, w, h }),
  })
  const authored = [
    { name: 'suelo', cells: new Map([['0,0', 'am_grass_0_0'], ['50,50', 'am_far_0_0']]) },
    { name: 'detalle', cells: new Map([['0,0', 'am_flower_0_0']]) },
  ]

  it('draws only cells inside the visible tile range', () => {
    const calls = []
    drawAuthoredTiles(fakeCtx(), { authored }, { x: 0, y: 0 }, fakeSprites(calls))
    expect(calls.map(c => c.name)).not.toContain('am_far_0_0')
  })
  it('draws layers in order so later layers land on top', () => {
    const calls = []
    drawAuthoredTiles(fakeCtx(), { authored }, { x: 0, y: 0 }, fakeSprites(calls))
    expect(calls.map(c => c.name)).toEqual(['am_grass_0_0', 'am_flower_0_0'])
  })
  it('positions a cell at tile coords minus the camera', () => {
    const calls = []
    drawAuthoredTiles(fakeCtx(), { authored }, { x: 10, y: 4 }, fakeSprites(calls))
    expect(calls[0]).toMatchObject({ x: -10, y: -4, w: 32, h: 32 })
  })
  it('does nothing when there is no authored map', () => {
    const calls = []
    drawAuthoredTiles(fakeCtx(), {}, { x: 0, y: 0 }, fakeSprites(calls))
    expect(calls).toEqual([])
  })
  it('washes a painted cell once with the era tint, not once per layer', () => {
    const fills = []
    const ctx = {
      canvas: { width: 64, height: 64 },
      save: () => {}, restore: () => {},
      fillRect: (x, y) => fills.push([x, y]),
      set fillStyle(v) { this._f = v },
      set globalAlpha(v) { this._a = v },
    }
    const world = { regions: [{ bi: 'cyber', x: 0, y: 0 }], farm: { x: 0, y: 0 } }
    drawAuthoredTiles(ctx, { authored, world }, { x: 0, y: 0 }, fakeSprites([]))
    expect(fills.filter(([x, y]) => x === 0 && y === 0)).toHaveLength(1)
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run src/game/render/scene2d.test.js`
Expected: FAIL — `drawAuthoredTiles is not a function`.

- [ ] **Step 7: Implement the pass**

In `src/game/render/scene2d.js`, add after `drawGround` (around line 168):

```js
// Authored terrain drawn on top of the procedural ground. Same viewport culling drawGround uses,
// so cost tracks the screen, not how much of the world has been painted. Layers draw in order;
// a later layer overdraws an earlier one at the same cell.
//
// The era tint is applied to authored cells too, once per cell (not once per layer). Exempting
// them would turn the painted/generated seam into a visible colour border in cyber/castillo —
// exactly what the hybrid composition has to hide. The cost is that WYSIWYG breaks in those two
// biomes: the editor shows a clean tile, the game shows a washed one.
export function drawAuthoredTiles(ctx, state, cam, sprites) {
  const layers = state.authored
  if (!layers || !layers.length) return
  const { w: vw, h: vh } = viewportOf(ctx)
  const { x0, y0, x1, y1 } = visibleTileRange(cam, vw, vh, TILE)
  const anchors = state.world ? regionsWithFarm(state.world) : null
  for (let ty = y0; ty < y1; ty += 1) {
    for (let tx = x0; tx < x1; tx += 1) {
      const key = `${tx},${ty}`
      const sx = tx * TILE - cam.x
      const sy = ty * TILE - cam.y
      let painted = false
      for (const layer of layers) {
        const name = layer.cells.get(key)
        if (!name) continue
        sprites.draw(ctx, name, sx, sy, TILE, TILE)
        painted = true
      }
      if (!painted || !anchors) continue
      const tints = ERA_TINTS[nearestBiome(anchors, tx * TILE + TILE / 2, ty * TILE + TILE / 2)]
      if (!tints) continue
      ctx.save()
      ctx.globalAlpha = ERA_TINT_ALPHA
      ctx.fillStyle = tints[hashTile(tx, ty) % tints.length]
      ctx.fillRect(sx, sy, TILE, TILE)
      ctx.restore()
    }
  }
}
```

`ERA_TINTS`, `ERA_TINT_ALPHA`, `regionsWithFarm`, `nearestBiome`, `hashTile`, `viewportOf`,
`visibleTileRange` and `TILE` are all already in scope in this module — no new imports.

Then call it in `render2d`, between the ground and the depth-sorted pass (line ~469):

```js
    drawGround(ctx, state, drawCam, sprites)
    drawAuthoredTiles(ctx, state, drawCam, sprites)
    depthSortedDrawables(state, drawCam, t).forEach(item => item.draw(ctx, sprites))
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm run test:run`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/game/world/authored/index.js src/game/world/authored/index.test.js \
        src/game/render/scene2d.js src/game/render/scene2d.test.js
git commit -m "feat(game): authored tile render pass with viewport culling"
```

---

### Task 8: Object transforms for placements

**Files:**
- Modify: `src/game/render/scene2d.js:302-309`
- Test: `src/game/render/scene2d.test.js` (append)

**Interfaces:**
- Consumes: placements carrying optional `flipX/flipY/rot/scale` (Task 3).
- Produces: `drawTransformed(ctx, sprites, pl, cam)` exported from `scene2d.js`, where `pl` is
  `{ frame, x, y, flipX?, flipY?, rot?, scale? }`.

The identity case is the contract: a placement with no transform fields must produce exactly the
same `drawImage` as today (native size, bottom-centre anchored at `x,y`), with no canvas state
changes around it.

- [ ] **Step 1: Add the failing tests**

Append to `src/game/render/scene2d.test.js` (merge `drawTransformed` into the existing import):

```js
describe('drawTransformed', () => {
  const recorder = () => {
    const ops = []
    const ctx = {
      canvas: { width: 64, height: 64 },
      save: () => ops.push(['save']),
      restore: () => ops.push(['restore']),
      translate: (x, y) => ops.push(['translate', x, y]),
      rotate: r => ops.push(['rotate', r]),
      scale: (x, y) => ops.push(['scale', x, y]),
    }
    return { ctx, ops }
  }
  const sprites = ops => ({
    frame: () => ({ w: 32, h: 48 }),
    draw: (ctx, name, x, y, w, h) => ops.push(['draw', name, x, y, w, h]),
  })

  it('draws an untransformed placement with no canvas state changes', () => {
    const { ctx, ops } = recorder()
    drawTransformed(ctx, sprites(ops), { frame: 'f', x: 100, y: 200 }, { x: 0, y: 0 })
    expect(ops).toEqual([['draw', 'f', 84, 152, 32, 48]])
  })
  it('offsets by the camera', () => {
    const { ctx, ops } = recorder()
    drawTransformed(ctx, sprites(ops), { frame: 'f', x: 100, y: 200 }, { x: 10, y: 20 })
    expect(ops).toEqual([['draw', 'f', 74, 132, 32, 48]])
  })
  it('mirrors horizontally around the bottom-centre anchor for flipX', () => {
    const { ctx, ops } = recorder()
    drawTransformed(ctx, sprites(ops), { frame: 'f', x: 100, y: 200, flipX: true }, { x: 0, y: 0 })
    expect(ops[0]).toEqual(['save'])
    expect(ops).toContainEqual(['translate', 100, 200])
    expect(ops).toContainEqual(['scale', -1, 1])
    expect(ops[ops.length - 1]).toEqual(['restore'])
  })
  it('rotates in degrees clockwise about the anchor', () => {
    const { ctx, ops } = recorder()
    drawTransformed(ctx, sprites(ops), { frame: 'f', x: 0, y: 0, rot: 90 }, { x: 0, y: 0 })
    expect(ops).toContainEqual(['rotate', Math.PI / 2])
  })
  it('applies uniform scale', () => {
    const { ctx, ops } = recorder()
    drawTransformed(ctx, sprites(ops), { frame: 'f', x: 0, y: 0, scale: 2 }, { x: 0, y: 0 })
    expect(ops).toContainEqual(['scale', 2, 2])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game/render/scene2d.test.js`
Expected: FAIL — `drawTransformed is not a function`.

- [ ] **Step 3: Write the implementation**

In `src/game/render/scene2d.js`, add above `depthSortedDrawables`:

```js
// Authored objects carry optional flipX/flipY/rot/scale (world-editor M5). Anchor is the same
// bottom-centre point the flat placements already used, so the no-transform path stays a single
// drawImage with no canvas state changes — that identity case is what guarantees M6 does not
// alter anything the Asset Placer produced.
export function drawTransformed(ctx, sprites, pl, cam) {
  const f = sprites.frame(pl.frame)
  const scale = pl.scale || 1
  const rot = pl.rot || 0
  if (!pl.flipX && !pl.flipY && !rot && scale === 1) {
    sprites.draw(ctx, pl.frame, pl.x - f.w / 2 - cam.x, pl.y - f.h - cam.y, f.w, f.h)
    return
  }
  ctx.save()
  ctx.translate(pl.x - cam.x, pl.y - cam.y)
  if (rot) ctx.rotate((rot * Math.PI) / 180)
  if (scale !== 1) ctx.scale(scale, scale)
  if (pl.flipX || pl.flipY) ctx.scale(pl.flipX ? -1 : 1, pl.flipY ? -1 : 1)
  sprites.draw(ctx, pl.frame, -f.w / 2, -f.h, f.w, f.h)
  ctx.restore()
}
```

Then replace the `placements` block inside `depthSortedDrawables` (lines ~302-309):

```js
  // Authored/hand-placed assets — native frame size, bottom-anchored at (x,y), optional transforms.
  const placements = (state.world.placements || []).map(pl => ({
    baseY: pl.y,
    draw: (ctx, sprites) => drawTransformed(ctx, sprites, pl, cam),
  }))
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/render/scene2d.js src/game/render/scene2d.test.js
git commit -m "feat(game): object transforms for placements (flip/rotate/scale)"
```

---

### Task 9: Authored anchors, island wiring, and end-to-end verification

**Files:**
- Modify: `src/game/world/overworld.js:135-168`
- Test: `src/game/world/overworld.test.js` (append)
- Modify: `src/game/worldRpg.js:96-105`
- Modify: `src/components/react/WorldRpg.jsx:143-160`

**Interfaces:**
- Consumes: `career.tiles.json` (`anchors`), `buildAuthoredIndex` (Task 7).
- Produces: `buildOverworld(json, biomeForYear, sideProjects, anchors)` — a fourth optional
  parameter; `null`/`{}` keeps today's hardcoded constants.

- [ ] **Step 1: Add the failing test**

Append to `src/game/world/overworld.test.js`:

```js
describe('buildOverworld with authored anchors', () => {
  const json = { entries: [{ id: 'a', company: 'A', date: { en: '2020' }, visible: true }] }
  const biomeForYear = () => 'pradera'

  it('keeps the built-in anchors when none are supplied', () => {
    const w = buildOverworld(json, biomeForYear, [])
    expect(w.farm).toEqual({ x: 360, y: 1120 })
  })
  it('overrides only the biomes present in the authored anchors', () => {
    const w = buildOverworld(json, biomeForYear, [], { farm: { x: 500, y: 900 } })
    expect(w.farm).toEqual({ x: 500, y: 900 })
    expect(w.regions.find(r => r.bi === 'cyber')).toMatchObject({ x: 1360, y: 1040 })
  })
  it('moves the site ring with its authored anchor', () => {
    const base = buildOverworld(json, biomeForYear, [])
    const moved = buildOverworld(json, biomeForYear, [], { pradera: { x: 1000, y: 1000 } })
    expect(moved.sites[0].cx).not.toBeCloseTo(base.sites[0].cx)
  })
  it('re-routes the road spine through the authored anchor', () => {
    const moved = buildOverworld(json, biomeForYear, [], { pradera: { x: 1000, y: 1000 } })
    expect(moved.path).toContainEqual({ x: 1000, y: 1000 })
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/game/world/overworld.test.js`
Expected: FAIL — the override tests get the built-in coordinates.

- [ ] **Step 3: Implement the override**

In `src/game/world/overworld.js`, rename the module constant to `BUILT_IN_ANCHORS` (the object
currently called `ANCHORS` at line 4) and change `buildOverworld`:

```js
export function buildOverworld(json, biomeForYear, sideProjects = [], authoredAnchors = null) {
  // Authored anchors (painted as `anchor:<biome>` layers in the world-editor) override the
  // built-in positions per biome; anything not painted keeps its constant. Everything downstream
  // — ringPos, nearestBiome, buildRoads — reads from here, so moving one marker moves that town,
  // its roads and its biome boundary together.
  const ANCHORS = { ...BUILT_IN_ANCHORS, ...(authoredAnchors || {}) }
```

The rest of the function body is unchanged — it already reads the local `ANCHORS`. Check that
`ringPos(ANCHORS[bi], …)`, the `regions` map, `path`, `farmBuilding` and `farmWindmill` all
resolve to the new local. `buildingFor`/`toSite` do not touch anchors.

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/game/world/overworld.test.js`
Expected: PASS.

- [ ] **Step 5: Wire the game entry point**

In `src/game/worldRpg.js`, change the `createWorldRpg` signature and the first lines of its body:

```js
export function createWorldRpg({
  canvas, experience, sideProjects = [], lang = 'es', onLangChange, placements = [], authoredTiles = null,
}) {
  const world = buildOverworld(experience, biomeForYear, sideProjects, authoredTiles && authoredTiles.anchors)
  // Assets placed in the world-editor (src/game/world/authored/career.map.json → npm run
  // map:import → src/data/placements.json): a flat list of { frame, x, y } plus optional
  // transforms, drawn as non-solid decor, bottom-anchored at (x,y).
  world.placements = placements
```

Add the import at the top of the file:

```js
import { buildAuthoredIndex } from './world/authored/index.js'
```

And add `authored` to the `state` object literal (next to `decor`):

```js
    authored: buildAuthoredIndex(authoredTiles),
```

- [ ] **Step 6: Wire the React island**

In `src/components/react/WorldRpg.jsx`, add the tiles JSON to the existing dynamic import block
(around line 143) and pass it through:

```jsx
      const [{ createWorldRpg, canControl }, { default: experience }, { default: placements },
        { default: authoredTiles }] = await Promise.all([
        import('../../game/worldRpg.js'),
        import('../../data/experience.json'),
        import('../../data/placements.json'),
        import('../../game/world/authored/career.tiles.json'),
      ])
```

and in the `createWorldRpg({ … })` call, next to `placements`:

```jsx
        authoredTiles,
```

Keep the existing array destructuring order — the first three entries must stay as they are.

- [ ] **Step 7: Full suite plus a production build**

Run:

```bash
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
npm run test:run && npm run lint && npm run build
```

Expected: tests PASS, lint clean, build succeeds.

- [ ] **Step 8: Verify in the real app**

Run the dev server and look at the game:

```bash
npm run dev -- --port 4321
```

Open `http://localhost:4321/en/game`. Confirm, by eye:
- the painted patch of terrain appears on top of the procedural ground, at the world position
  you painted it;
- the props are drawn, and the one you flipped/rotated is visibly flipped/rotated;
- the player still spawns at the farm and can walk;
- company buildings, roads and dialogs are unchanged.

- [ ] **Step 9: Run the production QA gate**

Use the repo's `/verify` skill (production Astro build under Playwright + Lighthouse). The map
ships to the client and the mobile gate is Performance ≥0.95 / Accessibility, Best Practices,
SEO = 1.0 — `astro dev` proves nothing about this.

Expected: gate PASSES. If Performance regressed, check the size of `career.tiles.json` first —
it is the only new payload.

- [ ] **Step 10: Commit**

```bash
git add src/game/world/overworld.js src/game/world/overworld.test.js \
        src/game/worldRpg.js src/components/react/WorldRpg.jsx
git commit -m "feat(game): authored anchors + wire the authored map into the island"
```

---

### Task 10: Scale object and anchor coordinates into game world pixels

Found by looking at the running game, which is the only place it was visible: the authored
terrain covered the world correctly, but every prop and the farm anchor sat in the top-left
quadrant at half scale. Tile cells are **indices** (multiplied by `TILE` = 32 by the renderer);
object and anchor coordinates are editor world **pixels** at `map.tileSize` (16). The adapter
copied the latter through unscaled. Both sides were internally consistent, so no unit test
could catch it.

**Files:**
- Modify: `src/game/world/authored/convert.js`
- Test: `src/game/world/authored/convert.test.js`
- Regenerate: `src/data/placements.json`, `src/game/world/authored/career.tiles.json`

**Interfaces:**
- Consumes: everything from Tasks 2-5b.
- Produces: `WORLD_TILE` (32) and `worldScaleOf(map) -> number`; `placementsFrom(layers, scale)`
  and `anchorsFrom(layers, scale)` gain a scale factor defaulting to 1.

- [ ] **Step 1: Add the failing tests**

Append to `src/game/world/authored/convert.test.js` (merge `worldScaleOf` and `WORLD_TILE` into
the existing import):

```js
describe('worldScaleOf', () => {
  it('is the ratio between the game world tile and the pack source tile', () => {
    expect(worldScaleOf({ tileSize: 16 })).toBe(2)
    expect(worldScaleOf({ tileSize: 32 })).toBe(1)
    expect(worldScaleOf({ tileSize: 8 })).toBe(4)
  })
  it('exposes the game world tile size it is derived from', () => {
    expect(WORLD_TILE).toBe(32)
  })
})

describe('coordinate scaling', () => {
  const layers = [
    { name: 'props', type: 'objects', objects: [{ frame: 'a/b.png#0,0', x: 159, y: 160 }] },
    { name: 'anchor:farm', type: 'objects', objects: [{ frame: 'a/b.png#0,0', x: 100, y: 200 }] },
  ]

  it('scales placement positions into game world pixels', () => {
    expect(placementsFrom(layers, 2)).toEqual([{ frame: 'am_a_b_0_0', x: 318, y: 320 }])
  })
  it('scales anchor positions into game world pixels', () => {
    expect(anchorsFrom(layers, 2)).toEqual({ farm: { x: 200, y: 400 } })
  })
  it('defaults to a scale of 1 so existing callers are unaffected', () => {
    expect(placementsFrom(layers)[0]).toMatchObject({ x: 159, y: 160 })
    expect(anchorsFrom(layers)).toEqual({ farm: { x: 100, y: 200 } })
  })
  it('leaves transform fields untouched while scaling position', () => {
    const withRot = [{ name: 'p', type: 'objects', objects: [{ frame: 'a/b.png#0,0', x: 10, y: 20, rot: 90, scale: 2 }] }]
    expect(placementsFrom(withRot, 2)).toEqual([{ frame: 'am_a_b_0_0', x: 20, y: 40, rot: 90, scale: 2 }])
  })
})

describe('convertMap applies the world scale', () => {
  it('emits placements and anchors already in game world pixels', () => {
    const out = convertMap(REAL_WITH_OBJECTS, { dimsOf: p => REAL_DIMS[p], exists })
    expect(out.placements[0]).toMatchObject({ x: 200, y: 300 })
    expect(out.tiles.anchors.farm).toEqual({ x: 400, y: 500 })
  })
})
```

Add this fixture next to `REAL` (it reuses `REAL`'s shape, with objects added):

```js
const REAL_WITH_OBJECTS = {
  ...REAL,
  layers: [
    ...REAL.layers,
    { name: 'props', type: 'objects', objects: [{ frame: 'Cute_Fantasy/Tiles/Grass/G.png#0,0', x: 100, y: 150 }] },
    { name: 'anchor:farm', type: 'objects', objects: [{ frame: 'Cute_Fantasy/Tiles/Grass/G.png#0,0', x: 200, y: 250 }] },
  ],
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH" && npx vitest run src/game/world/authored/convert.test.js`
Expected: FAIL — `worldScaleOf is not a function`, and the scaled expectations get unscaled values.

- [ ] **Step 3: Write the implementation**

In `src/game/world/authored/convert.js`, add near the top:

```js
// The game renderer places every authored cell at 32 world pixels (TILE in scene2d.js), while
// the export measures object positions in editor pixels at the pack's own tileSize. Tiles carry
// indices and scale implicitly; objects carry pixels and must be scaled here, in the adapter —
// scene2d's placement pass and buildOverworld both already work in game world pixels and must
// not learn about the editor's units.
export const WORLD_TILE = 32

export function worldScaleOf(map) {
  return WORLD_TILE / map.tileSize
}
```

Give `toPlacement` the scale, and thread it through both consumers:

```js
function toPlacement(o, scale) {
  const p = { frame: frameNameFor(o.frame), x: o.x * scale, y: o.y * scale }
  if (o.flipX) p.flipX = true
  if (o.flipY) p.flipY = true
  if (o.rot) p.rot = o.rot
  if (o.scale && o.scale !== 1) p.scale = o.scale
  return p
}

export function placementsFrom(layers, scale = 1) {
  return layers
    .filter(l => classifyLayer(l).kind === 'objects')
    .flatMap(l => (l.objects || []).map(o => toPlacement(o, scale)))
}
```

and in `anchorsFrom`, take `scale = 1` as a second parameter and emit
`out[c.biome] = { x: items[0].x * scale, y: items[0].y * scale }`.

Finally, in `convertMap`, compute the scale once and pass it to both. Note `tilesFrom` calls
`anchorsFrom` internally, so give `tilesFrom` the scale too and forward it:

```js
export function convertMap(map, { dimsOf, exists = () => true }) {
  validateMap(map, { dimsOf, exists })
  const scale = worldScaleOf(map)
  return {
    manifest: framesFrom(map, dimsOf),
    tiles: tilesFrom(map, scale),
    placements: placementsFrom(map.layers, scale),
  }
}
```

with `tilesFrom(map, scale = 1)` passing `scale` into its `anchorsFrom(map.layers, scale)` call.

- [ ] **Step 4: Run the full suite**

Run: `export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH" && npm run test:run`
Expected: PASS. The suite was 394 before this task.

- [ ] **Step 5: Regenerate the artifacts and confirm the shift**

```bash
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
npm run map:import
node -e "const p=require('./src/data/placements.json');const t=require('./src/game/world/authored/career.tiles.json');console.log('x',Math.min(...p.map(o=>o.x)),'-',Math.max(...p.map(o=>o.x)));console.log('anchor',JSON.stringify(t.anchors.farm))"
```

Expected: placement x now spans `0 - 246` (was `0 - 123`) and the farm anchor reads
`{"x":318,"y":320}` (was `{"x":159,"y":160}`). The atlas does not change — no frame data moved,
so do NOT re-run `assets:pack`; if `git status` shows atlas churn, stop and report it.

- [ ] **Step 6: Commit**

```bash
git add src/game/world/authored/convert.js src/game/world/authored/convert.test.js \
        src/data/placements.json src/game/world/authored/career.tiles.json
git commit -m "fix(game): scale authored object and anchor coords into game world pixels"
```

---

### Task 11: Read the export's slice geometry, and scale object sprites

The final whole-branch review found the third unit conflation, confirmed by measuring the
shipped atlas: three of the five authored frames are **100% transparent**.

`framesFrom` emitted `{x: col*tileSize, y: row*tileSize, w: tileSize, h: tileSize}` for every
ref. The editor does not cut every image that way — `buildManifest` classifies `Trees/`,
`Buildings/` and `Outdoor decoration/` as whole **single** sprites (where `col,row` is filler),
characters at 32px, and only the rest at the bundle tileBase. A 192×80 oak got a 16×16 corner
of transparent margin.

The editor now emits a `slices` block (commit `9b45a5d` in the world-editor repo), and
`career.map.json` has been backfilled with it. The adapter must read it instead of guessing.

Second defect, same review: object **positions** are scaled by `worldScaleOf` but object
**sizes** are not, so a 16×16 prop draws at half a tile.

**Files:**
- Modify: `src/game/world/authored/convert.js`
- Test: `src/game/world/authored/convert.test.js`
- Regenerate: `src/data/placements.json`, `src/game/world/authored/career.tiles.json`,
  `src/game/assets/manifest.authored.js`, `src/game/assets/atlas.json`, `public/game/atlas.*`

**Interfaces:**
- Produces: `rectFor(slice, col, row) -> { x, y, w, h }`; `framesFrom(map, dimsOf)` reads
  `map.slices`; `validateMap` requires a slice per referenced path.

- [ ] **Step 1: Add the failing tests**

Append to `src/game/world/authored/convert.test.js` (merge `rectFor` into the existing import).
Note the existing `SAMPLE` and `REAL` fixtures have no `slices`, so give them one — add
`slices` to BOTH, matching the paths they already reference, e.g. for `SAMPLE`:

```js
// add to SAMPLE:
  slices: {
    'Cute_Fantasy/Tiles/Grass/G.png': { type: 'sheet', fw: 32, fh: 32, cols: 2, rows: 2 },
    'Cute_Fantasy/Tiles/Path/P.png': { type: 'sheet', fw: 32, fh: 32, cols: 3, rows: 3 },
    'Cute_Fantasy/Trees/T.png': { type: 'sheet', fw: 32, fh: 32, cols: 1, rows: 1 },
  },
// add to REAL:
  slices: { 'Cute_Fantasy/Tiles/Grass/G.png': { type: 'sheet', fw: 16, fh: 16, cols: 4, rows: 4 } },
```

Then the new tests:

```js
describe('rectFor', () => {
  it('gives a sheet cell its col,row offset at frame size', () => {
    expect(rectFor({ type: 'sheet', fw: 16, fh: 16, cols: 4, rows: 4 }, 2, 3))
      .toEqual({ x: 32, y: 48, w: 16, h: 16 })
  })
  it('gives a single sprite the whole image, ignoring col,row filler', () => {
    expect(rectFor({ type: 'single', w: 192, h: 80 }, 0, 0)).toEqual({ x: 0, y: 0, w: 192, h: 80 })
    expect(rectFor({ type: 'single', w: 192, h: 80 }, 5, 7)).toEqual({ x: 0, y: 0, w: 192, h: 80 })
  })
})

describe('framesFrom with slice geometry', () => {
  const map = {
    tileSize: 16,
    world: { w: 64, h: 64 },
    layers: [{ name: 'p', type: 'objects', objects: [{ frame: 'Cute_Fantasy/Trees/Oak.png#0,0', x: 1, y: 1 }] }],
    slices: { 'Cute_Fantasy/Trees/Oak.png': { type: 'single', w: 192, h: 80 } },
  }
  const dims = { 'Cute_Fantasy/Trees/Oak.png': { w: 192, h: 80 } }

  it('emits the whole image for a single sprite, not a tileSize corner', () => {
    expect(framesFrom(map, p => dims[p]).frames.am_Trees_Oak_0_0)
      .toEqual({ img: 'am_Trees_Oak', x: 0, y: 0, w: 192, h: 80 })
  })
})

describe('validateMap requires slice geometry', () => {
  it('rejects a map with no slices block — it was exported before the editor emitted one', () => {
    const stale = { ...REAL, slices: undefined }
    expect(() => validateMap(stale, { dimsOf: p => REAL_DIMS[p], exists }))
      .toThrow(/no slices block.*re-export/)
  })
  it('rejects a referenced image missing from slices', () => {
    const gap = { ...REAL, slices: {} }
    expect(() => validateMap(gap, { dimsOf: p => REAL_DIMS[p], exists }))
      .toThrow(/G\.png.*missing from the map's slices/)
  })
})

describe('object sprites scale with the world', () => {
  it('folds the world scale into the placement scale so sprites match the terrain', () => {
    const layers = [{ name: 'p', type: 'objects', objects: [{ frame: 'a/b.png#0,0', x: 10, y: 20 }] }]
    expect(placementsFrom(layers, 2)[0]).toEqual({ frame: 'am_a_b_0_0', x: 20, y: 40, scale: 2 })
  })
  it('multiplies an authored scale by the world scale', () => {
    const layers = [{ name: 'p', type: 'objects', objects: [{ frame: 'a/b.png#0,0', x: 0, y: 0, scale: 3 }] }]
    expect(placementsFrom(layers, 2)[0].scale).toBe(6)
  })
  it('emits no scale at all when the world scale is 1 and the object has none', () => {
    const layers = [{ name: 'p', type: 'objects', objects: [{ frame: 'a/b.png#0,0', x: 0, y: 0 }] }]
    expect(Object.keys(placementsFrom(layers, 1)[0])).toEqual(['frame', 'x', 'y'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH" && npx vitest run src/game/world/authored/convert.test.js`

- [ ] **Step 3: Write the implementation**

Add to `convert.js`:

```js
// rectFor: the source rect a `path#col,row` ref denotes, given how the editor cut that image.
// A 'single' image is one whole sprite and its col,row are filler — slicing it at tileSize
// yields transparent margin, which is exactly the bug this replaces.
export function rectFor(slice, col, row) {
  if (slice.type === 'single') return { x: 0, y: 0, w: slice.w, h: slice.h }
  return { x: col * slice.fw, y: row * slice.fh, w: slice.fw, h: slice.fh }
}
```

Rewrite `framesFrom`'s body to use it:

```js
export function framesFrom(map, dimsOf) {
  const images = {}
  const frames = {}
  for (const ref of allRefs(map)) {
    const { path, col, row } = splitRef(ref)
    const key = slugFor(path)
    const { w, h } = dimsOf(path)
    const r = rectFor(map.slices[path], col, row)
    if (r.x + r.w > w || r.y + r.h > h) {
      throw new Error(`ref ${ref}: rect ${r.w}x${r.h} at ${r.x},${r.y} is outside the source image (${w}x${h})`)
    }
    images[key] = publicUrlFor(path)
    frames[frameNameFor(ref)] = { img: key, ...r }
  }
  return { images, frames }
}
```

In `validateMap`, replace the per-ref bounds block with one that checks slices first:

```js
  if (!map.slices) {
    throw new Error('map has no slices block — re-export it from a world-editor with slice geometry')
  }
  for (const ref of allRefs(map)) {
    const { path, col, row } = splitRef(ref)
    if (!exists(path)) throw new Error(`ref ${ref}: ${path} not found in the pack`)
    const slice = map.slices[path]
    if (!slice) throw new Error(`ref ${ref}: ${path} is missing from the map's slices block`)
    const { w, h } = dimsOf(path)
    const r = rectFor(slice, col, row)
    if (r.x + r.w > w || r.y + r.h > h) {
      throw new Error(`ref ${ref}: rect ${r.w}x${r.h} at ${r.x},${r.y} is outside the source image (${w}x${h})`)
    }
  }
```

And fold the world scale into the placement's own scale, so sprites grow with the terrain:

```js
function toPlacement(o, scale) {
  const p = { frame: frameNameFor(o.frame), x: o.x * scale, y: o.y * scale }
  if (o.flipX) p.flipX = true
  if (o.flipY) p.flipY = true
  if (o.rot) p.rot = o.rot
  const s = scale * (o.scale || 1)
  if (s !== 1) p.scale = s
  return p
}
```

- [ ] **Step 4: Run the full suite**

Run: `export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH" && npm run test:run`
Expected: PASS. It was 401 before this task.

- [ ] **Step 5: Regenerate and prove the frames are no longer empty**

```bash
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
npm run map:import && npm run assets:pack
```

Then verify every authored frame has opaque pixels:

```bash
node -e "
const sharp = require('sharp')
const atlas = require('./src/game/assets/atlas.json')
;(async () => {
  for (const n of Object.keys(atlas.frames).filter(k => k.startsWith('am_'))) {
    const f = atlas.frames[n]
    const b = await sharp('public/game/atlas.png').extract({ left: f.x, top: f.y, width: f.w, height: f.h }).raw().ensureAlpha().toBuffer()
    let o = 0; for (let i = 3; i < b.length; i += 4) if (b[i]) o++
    console.log(n.padEnd(36), f.w + 'x' + f.h, 'opaque', o + '/' + b.length / 4)
  }
})()
"
```

Expected: every `am_` frame reports a non-zero opaque count, and the tree frames now report
their real sizes (192×80, 96×80, 96×64) rather than 16×16.

- [ ] **Step 6: Commit**

```bash
git add src/game/world/authored/ src/data/placements.json src/game/assets/ public/game/atlas.json public/game/atlas.png
git commit -m "fix(game): read the export's slice geometry, and scale object sprites"
```

---

## Deferred (not this milestone)

Recorded so they are not silently lost:

- **Collision for authored objects.** Paint a house, walk through it. Needs per-object properties
  in the editor.
- **Animated authored tiles.** The export's `animations` block is ignored; an animated source
  renders as a still. The block survives in the committed `career.map.json`, so wiring it later
  needs no re-authoring.
- **Removing the procedural ground.** The end of the hybrid road. Once the world is fully painted,
  `tileNameFor`/`hashTile` are covered everywhere and can go in one commit.
- **Retiring `placer.html` + `dump-world.mjs` + `pack:index`.** Superseded by the editor. Mark
  deprecated once the seed map demonstrates parity; delete after.
