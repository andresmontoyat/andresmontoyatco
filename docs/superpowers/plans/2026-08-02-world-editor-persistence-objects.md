# World Editor — Persistence + Export + Object Layers Implementation Plan (Milestone 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the editor usable end-to-end: object layers with free sprite placement, save/load a project, and export an engine-neutral map JSON.

**Architecture:** Pure logic (`map/model.js` object ops, `tools/place.js`, `persist/project.js`, `persist/export.js`) is unit-tested; rendering and UI wiring (`render/canvas.js`, `ui/layers-panel.js`, `main.js`, `index.html`) is verified by build + Playwright E2E. Objects live on `type:'objects'` layers in the same stack as tile layers.

**Tech Stack:** Existing Vite 5 + vanilla JS + Canvas + Vitest. No new dependencies.

## Global Constraints

- Repo: `/Users/andres/Development/repositories.nosync/codehunters/tools/world-editor` (branch `master`, remote `origin`). All commits land here.
- Node >= 20; if the shell node is too old use `/opt/homebrew/bin/node` or prefix `PATH=/opt/homebrew/bin:$PATH`.
- Vanilla JS ES modules only. No framework, no TypeScript. `npm test` runs vitest.
- **No `Math.random()` / `Date.now()` / `new Date()`** — ids come from the per-map `_nextId` counter (deterministic).
- Data shapes (from the approved spec — verbatim):
  - `Layer(tiles) = { id, name, type:'tiles', visible, cells: Map<"x,y", TileRef> }`
  - `Layer(objects) = { id, name, type:'objects', visible, items: [ObjectItem] }`
  - `TileRef = { path, col, row }` · `ObjectItem = { id, ref: TileRef, x, y }` (x,y = world px)
  - Object layer item ids prefixed `O`, layer ids prefixed `L`, from the same `_nextId`.
- Objects are **bottom-center anchored**: an item at `(x,y)` with sprite size `w×h` occupies world box `[x-w/2, x+w/2] × [y-h, y]`.
- Frame string encoding for export: `` `${path}#${col},${row}` ``.
- Sprite size resolves via the bundle manifest: a `sheet` entry → `fw×fh`; a `single` entry → its `w×h`.
- Preserve everything shipped (loader, tile painting, camera, layers). This milestone adds alongside; the only edits to existing files are the additive ones named per task.

---

### Task 1: Object model operations (pure, TDD)

**Files:**
- Modify: `src/map/model.js` (add object ops; drop the reserved top-level `objects:[]`)
- Modify: `src/map/model.test.js` (add object-op tests; drop the stale `m.objects` assertion)

**Interfaces:**
- Consumes: the existing `layerById`/`key` helpers and `_nextId` counter.
- Produces: `addObjectLayer(map,name)`, `addObject(map,layerId,ref,x,y)`, `moveObject(map,layerId,objectId,x,y)`, `removeObject(map,layerId,objectId)`. Consumed by `place.js` (Task 2), persistence (Task 3), and wiring (Tasks 5-6).

- [ ] **Step 1: Update the failing test** — add these cases to `src/map/model.test.js`, and DELETE the existing line `expect(m.objects).toEqual([])` from the "creates a map with one default layer" test (the reserved array is retired).

```js
import {
  createMap, addLayer, addObjectLayer, addObject, moveObject, removeObject, getCell
} from './model.js'  // extend the existing import

describe('object layers', () => {
  it('adds an objects-type layer', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 4 })
    const l = addObjectLayer(m, 'Props')
    expect(l).toEqual(expect.objectContaining({ id: 'L1', name: 'Props', type: 'objects', visible: true }))
    expect(l.items).toEqual([])
    expect(m.layers.length).toBe(2)
  })

  it('adds, moves, and removes objects with deterministic ids', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 4 })
    const l = addObjectLayer(m, 'Props')
    const ref = { path: 'Oak.png', col: 0, row: 0 }
    const o = addObject(m, l.id, ref, 100, 120)
    expect(o).toEqual({ id: 'O2', ref, x: 100, y: 120 })   // L0 default, L1 layer, O2 object
    moveObject(m, l.id, o.id, 140, 160)
    expect(l.items[0]).toEqual({ id: 'O2', ref, x: 140, y: 160 })
    removeObject(m, l.id, o.id)
    expect(l.items).toEqual([])
  })

  it('refuses object ops on a tiles layer', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 4 })
    const tilesId = m.layers[0].id
    expect(addObject(m, tilesId, { path: 'x', col: 0, row: 0 }, 1, 1)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- model`
Expected: FAIL ("addObjectLayer is not a function").

- [ ] **Step 3: Implement** — in `src/map/model.js`, remove `objects: []` from the object literal in `createMap`, and append these exports:

```js
export function addObjectLayer(map, name) {
  const layer = { id: `L${map._nextId++}`, name, type: 'objects', visible: true, items: [] }
  map.layers.push(layer)
  return layer
}

export function addObject(map, layerId, ref, x, y) {
  const l = layerById(map, layerId)
  if (!l || l.type !== 'objects') return null
  const item = { id: `O${map._nextId++}`, ref, x, y }
  l.items.push(item)
  return item
}

export function moveObject(map, layerId, objectId, x, y) {
  const l = layerById(map, layerId)
  if (!l || l.type !== 'objects') return
  const it = l.items.find(o => o.id === objectId)
  if (it) { it.x = x; it.y = y }
}

export function removeObject(map, layerId, objectId) {
  const l = layerById(map, layerId)
  if (!l || l.type !== 'objects') return
  const i = l.items.findIndex(o => o.id === objectId)
  if (i >= 0) l.items.splice(i, 1)
}
```

Change the `createMap` return object from `{ tileSize, cols, rows, layers: [], objects: [], _nextId: 0 }` to `{ tileSize, cols, rows, layers: [], _nextId: 0 }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- model`
Expected: PASS (existing layer/cell tests + 3 new object tests).

- [ ] **Step 5: Commit**

```bash
git add src/map/model.js src/map/model.test.js
git commit -m "feat(map): object layers — addObjectLayer/addObject/moveObject/removeObject"
```

---

### Task 2: Object placement + hit-test logic (pure, TDD)

**Files:**
- Create: `src/tools/place.js`
- Test: `src/tools/place.test.js`

**Interfaces:**
- Consumes: `screenToWorld` (camera).
- Produces: `objectAt(map, cam, screenX, screenY) -> {x,y}` (world px, clamped to map bounds); `hitObject(layer, cam, screenX, screenY, sizeOf) -> ObjectItem | null` (topmost bottom-center-anchored item under the point). `sizeOf(ref) -> {w,h}`. Consumed by the placement wiring (Task 5).

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { objectAt, hitObject } from './place.js'

const cam = { x: 0, y: 0, zoom: 1 }   // screen px == world px
const size16 = () => ({ w: 16, h: 16 })

describe('objectAt', () => {
  it('returns the clamped world pixel under the cursor', () => {
    const map = { tileSize: 16, cols: 4, rows: 4 }
    expect(objectAt(map, cam, 40, 30)).toEqual({ x: 40, y: 30 })
  })
  it('clamps to map bounds', () => {
    const map = { tileSize: 16, cols: 4, rows: 4 }   // world 64x64
    expect(objectAt(map, cam, -10, 999)).toEqual({ x: 0, y: 64 })
  })
})

describe('hitObject', () => {
  const layer = { type: 'objects', items: [
    { id: 'O1', ref: { path: 'a', col: 0, row: 0 }, x: 50, y: 50 },
    { id: 'O2', ref: { path: 'b', col: 0, row: 0 }, x: 50, y: 50 },
  ] }
  it('hits the topmost object whose bottom-center box contains the point', () => {
    // box for (50,50) 16x16 = x[42..58], y[34..50]
    expect(hitObject(layer, cam, 50, 40, size16).id).toBe('O2')  // last drawn wins
  })
  it('returns null when the point is outside every object', () => {
    expect(hitObject(layer, cam, 200, 200, size16)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- place`
Expected: FAIL ("objectAt is not a function").

- [ ] **Step 3: Write minimal implementation**

```js
import { screenToWorld } from '../map/camera.js'

// objectAt: world-pixel placement point under the cursor, clamped to the map.
export function objectAt(map, cam, screenX, screenY) {
  const w = screenToWorld(cam, screenX, screenY)
  const x = Math.max(0, Math.min(map.cols * map.tileSize, Math.round(w.x)))
  const y = Math.max(0, Math.min(map.rows * map.tileSize, Math.round(w.y)))
  return { x, y }
}

// hitObject: topmost object (last in draw order) whose bottom-center sprite box
// contains the cursor point. sizeOf(ref) -> {w,h}.
export function hitObject(layer, cam, screenX, screenY, sizeOf) {
  const p = screenToWorld(cam, screenX, screenY)
  for (let i = layer.items.length - 1; i >= 0; i--) {
    const it = layer.items[i]
    const { w, h } = sizeOf(it.ref)
    if (p.x >= it.x - w / 2 && p.x <= it.x + w / 2 && p.y >= it.y - h && p.y <= it.y) return it
  }
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- place`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/tools/place.js src/tools/place.test.js
git commit -m "feat(tools): object placement + bottom-center hit-test logic"
```

---

### Task 3: Project serialize/deserialize (pure, TDD)

**Files:**
- Create: `src/persist/project.js`
- Test: `src/persist/project.test.js`

**Interfaces:**
- Consumes: nothing (operates on the map document shape).
- Produces: `serializeProject(map, bundleId) -> projectJson`; `deserializeProject(projectJson) -> { bundleId, map }`. Consumed by the save/load wiring (Task 6).

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { serializeProject, deserializeProject } from './project.js'
import { createMap, addObjectLayer, addObject, setCell, getCell } from '../map/model.js'

function sample() {
  const m = createMap({ tileSize: 16, cols: 5, rows: 4 })
  const tiles = m.layers[0].id
  setCell(m, tiles, 1, 2, { path: 'Grass.png', col: 1, row: 0 })
  const obj = addObjectLayer(m, 'Props')
  addObject(m, obj.id, { path: 'Oak.png', col: 0, row: 0 }, 100, 120)
  return m
}

describe('project round-trip', () => {
  it('serializes to a plain project object', () => {
    const out = serializeProject(sample(), 'cute-fantasy')
    expect(out.kind).toBe('world-editor-project')
    expect(out.bundleId).toBe('cute-fantasy')
    expect(out.map.tileSize).toBe(16)
    expect(out.map.layers[0]).toEqual({
      name: 'Capa 1', type: 'tiles', visible: true,
      cells: [{ x: 1, y: 2, ref: { path: 'Grass.png', col: 1, row: 0 } }],
    })
    expect(out.map.layers[1]).toEqual({
      name: 'Props', type: 'objects', visible: true,
      items: [{ ref: { path: 'Oak.png', col: 0, row: 0 }, x: 100, y: 120 }],
    })
  })

  it('deserializes back into a working map', () => {
    const { bundleId, map } = deserializeProject(serializeProject(sample(), 'cf'))
    expect(bundleId).toBe('cf')
    expect(map.cols).toBe(5)
    expect(map.layers[0].cells instanceof Map).toBe(true)
    expect(getCell(map, map.layers[0].id, 1, 2)).toEqual({ path: 'Grass.png', col: 1, row: 0 })
    expect(map.layers[1].type).toBe('objects')
    expect(map.layers[1].items[0]).toEqual(expect.objectContaining({ x: 100, y: 120 }))
    expect(map.layers[1].items[0].id).toMatch(/^O\d+$/)   // fresh id regenerated
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- project`
Expected: FAIL ("serializeProject is not a function").

- [ ] **Step 3: Write minimal implementation**

```js
// serializeProject: lossless project save format (map + bundle ref, NO images).
export function serializeProject(map, bundleId) {
  return {
    kind: 'world-editor-project',
    version: 1,
    bundleId,
    map: {
      tileSize: map.tileSize,
      cols: map.cols,
      rows: map.rows,
      layers: map.layers.map(serializeLayer),
    },
  }
}

function serializeLayer(l) {
  if (l.type === 'objects') {
    return { name: l.name, type: 'objects', visible: l.visible, items: l.items.map(o => ({ ref: o.ref, x: o.x, y: o.y })) }
  }
  const cells = []
  for (const [k, ref] of l.cells) {
    const c = k.indexOf(',')
    cells.push({ x: +k.slice(0, c), y: +k.slice(c + 1), ref })
  }
  return { name: l.name, type: 'tiles', visible: l.visible, cells }
}

// deserializeProject: rebuild the live map document (cells arrays -> Map, fresh ids).
export function deserializeProject(json) {
  const m = json.map
  const map = { tileSize: m.tileSize, cols: m.cols, rows: m.rows, layers: [], _nextId: 0 }
  for (const l of m.layers) {
    if (l.type === 'objects') {
      const layer = { id: `L${map._nextId++}`, name: l.name, type: 'objects', visible: l.visible, items: [] }
      for (const o of l.items) layer.items.push({ id: `O${map._nextId++}`, ref: o.ref, x: o.x, y: o.y })
      map.layers.push(layer)
    } else {
      const layer = { id: `L${map._nextId++}`, name: l.name, type: 'tiles', visible: l.visible, cells: new Map() }
      for (const c of l.cells) layer.cells.set(`${c.x},${c.y}`, c.ref)
      map.layers.push(layer)
    }
  }
  return { bundleId: json.bundleId, map }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- project`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/persist/project.js src/persist/project.test.js
git commit -m "feat(persist): project serialize/deserialize round-trip"
```

---

### Task 4: Generic export writer (pure, TDD)

**Files:**
- Create: `src/persist/export.js`
- Test: `src/persist/export.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `exportMap(map, bundleId) -> genericJson`. Consumed by the export button (Task 6).

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { exportMap } from './export.js'
import { createMap, addObjectLayer, addObject, setCell } from '../map/model.js'

describe('exportMap', () => {
  it('writes the engine-neutral format with frame strings and world dims', () => {
    const m = createMap({ tileSize: 16, cols: 5, rows: 4 })
    setCell(m, m.layers[0].id, 1, 2, { path: 'Grass.png', col: 1, row: 0 })
    const obj = addObjectLayer(m, 'Props')
    addObject(m, obj.id, { path: 'Oak.png', col: 2, row: 3 }, 100, 120)
    expect(exportMap(m, 'cute-fantasy')).toEqual({
      version: 1,
      tileSize: 16,
      world: { w: 80, h: 64 },
      bundles: [{ id: 'cute-fantasy' }],
      layers: [
        { name: 'Capa 1', type: 'tiles', cells: [{ x: 1, y: 2, frame: 'Grass.png#1,0' }] },
        { name: 'Props', type: 'objects', objects: [{ frame: 'Oak.png#2,3', x: 100, y: 120 }] },
      ],
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- export`
Expected: FAIL ("exportMap is not a function").

- [ ] **Step 3: Write minimal implementation**

```js
const frameStr = ref => `${ref.path}#${ref.col},${ref.row}`

// exportMap: engine-neutral map JSON. Assets referenced by frame string, not path/index.
export function exportMap(map, bundleId) {
  return {
    version: 1,
    tileSize: map.tileSize,
    world: { w: map.cols * map.tileSize, h: map.rows * map.tileSize },
    bundles: [{ id: bundleId }],
    layers: map.layers.map(l => l.type === 'objects' ? exportObjectLayer(l) : exportTileLayer(l)),
  }
}

function exportTileLayer(l) {
  const cells = []
  for (const [k, ref] of l.cells) {
    const c = k.indexOf(',')
    cells.push({ x: +k.slice(0, c), y: +k.slice(c + 1), frame: frameStr(ref) })
  }
  return { name: l.name, type: 'tiles', cells }
}

function exportObjectLayer(l) {
  return { name: l.name, type: 'objects', objects: l.items.map(o => ({ frame: frameStr(o.ref), x: o.x, y: o.y })) }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- export`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/persist/export.js src/persist/export.test.js
git commit -m "feat(persist): engine-neutral map export writer"
```

---

### Task 5: Render objects + placement interaction + object layers in the panel

**Files:**
- Modify: `index.html` (add `+ obj` button; Guardar/Cargar/Export buttons + hidden project file input — buttons wired in Task 6, added here)
- Modify: `src/render/canvas.js` (draw object layers; add `manifest` + `selected` params)
- Modify: `src/ui/layers-panel.js` (show an `obj` tag on object-layer rows)
- Modify: `src/main.js` (sizeOf resolver, object placement/select/move/delete, `+ obj` wiring, pass manifest+selected to render)

**Interfaces:**
- Consumes: `addObjectLayer`, `addObject`, `moveObject`, `removeObject` (Task 1); `objectAt`, `hitObject` (Task 2); the manifest on `state.bundle`.
- Produces: object rendering + interaction; `state.selectedObject = { layerId, id } | null`. Save/Load/Export buttons exist in the DOM (wired in Task 6).

- [ ] **Step 1: Add buttons + project file input to `index.html`**

In the `<header>`, after the existing `#tool-eraser` button and its separator area, add:

```html
    <span style="width:1px;height:18px;background:var(--line)"></span>
    <button id="save" class="ghost" disabled>Guardar</button>
    <button id="load" class="ghost">Cargar</button>
    <button id="export" class="ghost" disabled>Export</button>
    <input id="projfile" type="file" accept=".json" hidden />
```

In the layers panel `<div id="right">`, change the single add button line to two:

```html
      <button id="addlayer" class="ghost" disabled>+ tiles</button>
      <button id="addlayer-obj" class="ghost" disabled>+ obj</button>
```

- [ ] **Step 2: Render object layers in `src/render/canvas.js`**

Change the signature to `renderMap(canvas, map, cam, imagesByPath, manifest, selected)` and, inside the `for (const layer of map.layers)` loop, branch on layer type. Replace the current single cell-drawing inner block with:

```js
  for (const layer of map.layers) {
    if (!layer.visible) continue
    if (layer.type === 'objects') {
      for (const it of layer.items) {
        const img = imagesByPath[it.ref.path]
        if (!img || !img.complete || !img.naturalWidth) continue
        const [ssx, ssy, sw, sh] = frameSrc(manifest, it.ref, ts)
        const s = worldToScreen(cam, it.x - sw / 2, it.y - sh)
        g.drawImage(img, ssx, ssy, sw, sh, s.x, s.y, sw * cam.zoom, sh * cam.zoom)
        if (selected && selected.layerId === layer.id && selected.id === it.id) {
          g.strokeStyle = '#00e5a8'; g.lineWidth = 1.5
          g.strokeRect(s.x, s.y, sw * cam.zoom, sh * cam.zoom)
        }
      }
      continue
    }
    for (const [k, ref] of layer.cells) {
      const img = imagesByPath[ref.path]
      if (!img || !img.complete || !img.naturalWidth) continue
      const c = k.indexOf(',')
      const cx = +k.slice(0, c)
      const cy = +k.slice(c + 1)
      const s = worldToScreen(cam, cx * ts, cy * ts)
      g.drawImage(img, ref.col * ts, ref.row * ts, ts, ts, s.x, s.y, dz, dz)
    }
  }
```

Add this helper at the bottom of the file:

```js
// frameSrc: source rect for a ref — a sheet frame is tileBase-sized; a single is whole.
function frameSrc(manifest, ref, ts) {
  const e = manifest && manifest.images[ref.path]
  if (e && e.type === 'sheet') return [ref.col * e.fw, ref.row * e.fh, e.fw, e.fh]
  if (e && e.type === 'single') return [0, 0, e.w, e.h]
  return [ref.col * ts, ref.row * ts, ts, ts]
}
```

- [ ] **Step 3: Show an object-layer tag in `src/ui/layers-panel.js`**

In `renderLayers`, where the name span is built, append a small type tag for object layers. After `name.title = 'doble-click para renombrar'` and before appending, add:

```js
    if (layer.type === 'objects') {
      const tag = document.createElement('span')
      tag.textContent = 'obj'
      tag.style.cssText = 'font-size:9px;color:var(--accent);border:1px solid var(--line);border-radius:3px;padding:0 3px;margin-left:4px'
      name.appendChild(tag)
    }
```

- [ ] **Step 4: Wire objects in `src/main.js`**

Extend the model import to include the object ops, add the place import, add a `sizeOf` resolver + selection state, wire the `+ obj` button, add object interaction, and pass `manifest`+`selected` to render.

Add/extend imports:

```js
import { createMap, addLayer, addObjectLayer, addObject, moveObject, removeObject,
         removeLayer, moveLayer, renameLayer, setLayerVisible } from './map/model.js'
import { objectAt, hitObject } from './tools/place.js'
```

Add `selectedObject` to `state` (in the state object literal): `selectedObject: null,`.

Update `scheduleRender` to pass manifest + selection:

```js
function scheduleRender() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    renderMap(stage, state.map, state.cam, state.imagesByPath, state.bundle && state.bundle.manifest, state.selectedObject)
  })
}
```

Add a size resolver and the active-layer helper (near the other helpers):

```js
function sizeOf(ref) {
  const e = state.bundle && state.bundle.manifest.images[ref.path]
  if (e && e.type === 'sheet') return { w: e.fw, h: e.fh }
  if (e && e.type === 'single') return { w: e.w, h: e.h }
  return { w: state.map.tileSize, h: state.map.tileSize }
}
function activeLayer() {
  return state.map && state.map.layers.find(l => l.id === state.activeLayerId)
}
```

Wire the `+ obj` button (next to the existing `#addlayer` handler):

```js
document.querySelector('#addlayer-obj').addEventListener('click', () => {
  if (!state.map) return
  const l = addObjectLayer(state.map, `Objetos ${state.map.layers.length + 1}`)
  state.activeLayerId = l.id
  refreshLayers(); scheduleRender()
})
```

In the `#newmap` handler, enable the object-add button alongside `#addlayer`: after `document.querySelector('#addlayer').disabled = false` add `document.querySelector('#addlayer-obj').disabled = false` and `document.querySelector('#save').disabled = false` and `document.querySelector('#export').disabled = false`.

Replace the paint `mousedown`/`mousemove`/`mouseup` block (the Task-7 painting handlers) so it routes by active-layer type. The existing painting block becomes:

```js
let painting = false
let draggingObject = false
function editEvent(e, isDown) {
  if (!state.map || state.panning) return
  const r = stage.getBoundingClientRect()
  const sx = e.clientX - r.left, sy = e.clientY - r.top
  const layer = activeLayer()
  if (layer && layer.type === 'objects') {
    if (isDown) {
      const hit = hitObject(layer, state.cam, sx, sy, sizeOf)
      if (hit) { state.selectedObject = { layerId: layer.id, id: hit.id }; draggingObject = true }
      else if (state.activeTile) {
        const p = objectAt(state.map, state.cam, sx, sy)
        const o = addObject(state.map, layer.id, state.activeTile, p.x, p.y)
        state.selectedObject = { layerId: layer.id, id: o.id }; draggingObject = true
      } else { state.selectedObject = null }
    } else if (draggingObject && state.selectedObject) {
      const p = objectAt(state.map, state.cam, sx, sy)
      moveObject(state.map, state.selectedObject.layerId, state.selectedObject.id, p.x, p.y)
    }
    scheduleRender()
    return
  }
  // tiles layer: brush/eraser
  const changed = paintAt(state.map, state.activeLayerId, state.cam, sx, sy, state.tool, state.activeTile)
  if (changed) scheduleRender()
}
stage.addEventListener('mousedown', e => {
  if (spaceDown || e.button !== 0) return
  painting = true
  editEvent(e, true)
})
window.addEventListener('mousemove', e => { if (painting) editEvent(e, false) })
window.addEventListener('mouseup', () => { painting = false; draggingObject = false })
window.addEventListener('keydown', e => {
  if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedObject) {
    removeObject(state.map, state.selectedObject.layerId, state.selectedObject.id)
    state.selectedObject = null; scheduleRender()
  }
})
```

(Keep the existing tool-button `setTool` wiring — brush/eraser still apply on tile layers.)

- [ ] **Step 5: Build**

Run: `PATH=/opt/homebrew/bin:$PATH npx vite build`
Expected: success.

- [ ] **Step 6: Full test run**

Run: `PATH=/opt/homebrew/bin:$PATH npm test`
Expected: all unit tests pass (model/place/project/export/camera/paint/slice/manifest).

- [ ] **Step 7: Commit**

```bash
git add index.html src/render/canvas.js src/ui/layers-panel.js src/main.js
git commit -m "feat(editor): object layers — render, placement, select/move/delete"
```

---

### Task 6: Persistence + export UI (save / load / autosave / boot-restore / export)

**Files:**
- Modify: `src/main.js` (wire Guardar/Cargar/Export, autosave, boot restore, project-file input)

**Interfaces:**
- Consumes: `serializeProject`/`deserializeProject` (Task 3), `exportMap` (Task 4); `state`, `scheduleRender`, `fitCamera`, `refreshLayers`, the bundle-image builder.
- Produces: file save/load/export + localStorage autosave (`we:project:<bundleId>`).

- [ ] **Step 1: Add imports to `src/main.js`**

```js
import { serializeProject, deserializeProject } from './persist/project.js'
import { exportMap } from './persist/export.js'
```

- [ ] **Step 2: Add download + storage helpers (near the other helpers)**

```js
function download(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}
function storageKey() { return state.bundle ? `we:project:${state.bundle.id}` : null }
let autosaveTimer = 0
function autosave() {
  if (!state.map || !state.bundle) return
  clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    try { localStorage.setItem(storageKey(), JSON.stringify(serializeProject(state.map, state.bundle.id))) } catch (e) { console.warn('autosave failed', e) }
  }, 800)
}
```

Call `autosave()` at the end of `scheduleRender`'s callback (after `renderMap(...)`), so any change persists:

```js
  raf = requestAnimationFrame(() => {
    raf = 0
    renderMap(stage, state.map, state.cam, state.imagesByPath, state.bundle && state.bundle.manifest, state.selectedObject)
    autosave()
  })
```

- [ ] **Step 3: Add a map-loader helper that relinks a deserialized project**

```js
function loadMapDocument(map) {
  state.map = map
  state.activeLayerId = map.layers.length ? map.layers[0].id : null
  state.selectedObject = null
  document.querySelector('#addlayer').disabled = false
  document.querySelector('#addlayer-obj').disabled = false
  document.querySelector('#save').disabled = false
  document.querySelector('#export').disabled = false
  resizeStage(); fitCamera(); refreshLayers(); scheduleRender()
}
```

- [ ] **Step 4: Wire Guardar / Export**

```js
document.querySelector('#save').addEventListener('click', () => {
  if (!state.map || !state.bundle) return
  const proj = serializeProject(state.map, state.bundle.id)
  localStorage.setItem(storageKey(), JSON.stringify(proj))
  download(`${state.bundle.id}.project.json`, proj)
  status.textContent = 'proyecto guardado'
})
document.querySelector('#export').addEventListener('click', () => {
  if (!state.map || !state.bundle) return
  download(`${state.bundle.id}.map.json`, exportMap(state.map, state.bundle.id))
  status.textContent = 'mapa exportado'
})
```

- [ ] **Step 5: Wire Cargar (project file → deserialize → relink)**

```js
const projInput = document.querySelector('#projfile')
document.querySelector('#load').addEventListener('click', () => projInput.click())
projInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (!file) return
  try {
    const json = JSON.parse(await file.text())
    if (json.kind !== 'world-editor-project') { status.textContent = 'no es un proyecto válido'; return }
    const { bundleId, map } = deserializeProject(json)
    if (!state.bundle || state.bundle.id !== bundleId) {
      status.textContent = `carga el bundle "${bundleId}" (.zip) y vuelve a Cargar`
      state.pendingProject = json
      return
    }
    loadMapDocument(map)
    status.textContent = 'proyecto cargado'
  } catch (err) { status.textContent = 'error al cargar: ' + err.message; console.error(err) }
  finally { projInput.value = '' }
})
```

- [ ] **Step 6: Boot-restore + pending-project relink in the bundle change handler**

At the END of the bundle `change` handler's `try` block (after the palette renders and buttons enable), add:

```js
    // relink a project that was waiting for this bundle, or offer autosaved restore
    if (state.pendingProject && state.pendingProject.bundleId === id) {
      const { map } = deserializeProject(state.pendingProject)
      state.pendingProject = null
      loadMapDocument(map)
      status.textContent = 'proyecto vinculado al bundle'
    } else {
      const saved = localStorage.getItem(`we:project:${id}`)
      if (saved && confirm('Restaurar el proyecto autoguardado de este bundle?')) {
        loadMapDocument(deserializeProject(JSON.parse(saved)).map)
        status.textContent = 'proyecto restaurado'
      }
    }
```

Add `pendingProject: null,` to the `state` object literal.

- [ ] **Step 7: Build + full test run**

Run: `PATH=/opt/homebrew/bin:$PATH npx vite build && npm test`
Expected: build succeeds; all unit tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/main.js
git commit -m "feat(persist): save/load/export UI, autosave, boot restore"
```

---

## Self-Review

**Spec coverage (this milestone):**
- Object layers (type, items, coexist in stack) → Task 1 (model) + Task 5 (render/panel). ✓
- Object placement (free pixel, bottom-center, select/move/delete) → Task 2 (logic) + Task 5 (wiring). ✓
- Persistence (project save/load, references bundle, autosave, boot restore, re-import ZIP relink) → Task 3 (serialize) + Task 6 (UI). ✓
- Export (engine-neutral writer, frame strings, world dims) → Task 4 + Task 6 (button). ✓
- Pure unit tests for model/place/project/export → Tasks 1-4. ✓
- Deferred items (rect/bucket/eyedropper/multi-select, resize, base64 packing, multi-project) intentionally absent. ✓

**Type consistency:** `ObjectItem {id,ref,x,y}` produced by `addObject`, moved by `moveObject`, hit by `hitObject` (bottom-center box using `sizeOf`), rendered in `canvas.js` (`it.x - sw/2, it.y - sh`), serialized by `project.js` (drops `id`), exported by `export.js` (`frame` string). `sizeOf(ref)` and `frameSrc(manifest,ref,ts)` use the same sheet(`fw,fh`)/single(`w,h`) manifest resolution. `serializeProject`/`deserializeProject` are inverse (cells↔Map, items get fresh `O` ids). `renderMap` new signature `(canvas,map,cam,imagesByPath,manifest,selected)` is updated at its only call site (`scheduleRender`). Object ops names match across Tasks 1, 5, 6.

**Placeholder scan:** No TBD/TODO; every code step is complete. The controls added are `#addlayer-obj`, `#save`, `#load`, `#export`, `#projfile` — all referenced by the wiring in Tasks 5-6.

**Manual E2E (controller, after Task 6):** dev server + Playwright — load `fixtures/tiles.zip`, new map, paint a tile, `+ obj` layer, place an object (assert it renders), drag it, Guardar (assert download + `localStorage['we:project:...']` set), reload page + re-import the ZIP + accept restore → the object is present; Export → assert `{version,tileSize,world,bundles,layers}` shape with a `frame` string. Zero page errors.
