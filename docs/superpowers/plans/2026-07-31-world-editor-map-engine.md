# World Editor — Map Engine Implementation Plan (Milestone 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a map engine to the World Editor: create a fixed-size map, pan/zoom a gridded canvas, manage free layers, pick a tile frame from a sheet, and paint/erase tiles on the active layer with live rendering.

**Architecture:** Pure, unit-tested logic (`map/model.js`, `map/camera.js`, `tools/paint.js`) is separated from canvas rendering (`render/canvas.js`) and UI/orchestration (`ui/*`, `main.js`). The map document uses a mutable sparse `cells` Map for paint performance; the camera is pure transforms.

**Tech Stack:** Existing Vite 5 + vanilla JS + Canvas + Vitest. No new dependencies.

## Global Constraints

- Repo: `/Users/andres/Development/repositories.nosync/codehunters/tools/world-editor` (branch `master`, remote `origin` on GitHub). All commits land here.
- Node >= 20; if the shell node is too old use `/opt/homebrew/bin/node` or prefix `PATH=/opt/homebrew/bin:$PATH`.
- Vanilla JS ES modules only. No framework, no TypeScript. Run tests with `npm test`.
- **`Math.random()` and `Date.now()`/`new Date()` are forbidden** — layer ids come from a per-map monotonic counter (`map._nextId`) so tests are deterministic.
- Data model shapes (from the approved spec — use verbatim):
  - `Map = { tileSize, cols, rows, layers: [Layer], objects: [], _nextId }`
  - `Layer = { id, name, type: 'tiles', visible: true, cells: Map<"x,y", TileRef> }`
  - `TileRef = { path, col, row }`
- `cells` is mutated in place by `setCell`/`clearCell` (approved perf exception). Cell key is `` `${x},${y}` ``.
- Camera convention: `worldToScreen(cam,wx,wy) = {x:(wx-cam.x)*cam.zoom, y:(wy-cam.y)*cam.zoom}`. `Camera = {x, y, zoom}`.
- Tiles are `tileSize` square; a `TileRef`'s source rect on its sheet is `(col*tileSize, row*tileSize, tileSize, tileSize)`. The map's `tileSize` equals the bundle's `tileBase`.
- Preserve the existing loader (`bundle/`, `catalog/palette.js`, zip import) — the map engine is added alongside it, not a rewrite of the loader logic. `main.js` is re-orchestrated to host both.

---

### Task 1: Map document model (pure, TDD)

**Files:**
- Create: `src/map/model.js`
- Test: `src/map/model.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `createMap({tileSize,cols,rows})`, `addLayer(map,name)`, `removeLayer(map,layerId)`, `moveLayer(map,layerId,dir)`, `renameLayer(map,layerId,name)`, `setLayerVisible(map,layerId,visible)`, `setCell(map,layerId,x,y,tileRef)`, `clearCell(map,layerId,x,y)`, `getCell(map,layerId,x,y)`. Consumed by `paint.js` (Task 3), `render/canvas.js` (Task 4), panels + main (later).

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import {
  createMap, addLayer, removeLayer, moveLayer, renameLayer,
  setLayerVisible, setCell, clearCell, getCell
} from './model.js'

describe('map model', () => {
  it('creates a map with one default layer and derived fields', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 3 })
    expect(m.tileSize).toBe(16)
    expect(m.cols).toBe(4)
    expect(m.rows).toBe(3)
    expect(m.objects).toEqual([])
    expect(m.layers.length).toBe(1)
    expect(m.layers[0].name).toBe('Capa 1')
    expect(m.layers[0].type).toBe('tiles')
    expect(m.layers[0].visible).toBe(true)
    expect(m.layers[0].cells instanceof Map).toBe(true)
  })

  it('generates deterministic, unique layer ids from a per-map counter', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 3 })
    const a = addLayer(m, 'A')
    const b = addLayer(m, 'B')
    expect(m.layers[0].id).toBe('L0')
    expect(a.id).toBe('L1')
    expect(b.id).toBe('L2')
  })

  it('removes a layer by id', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 3 })
    const a = addLayer(m, 'A')
    removeLayer(m, a.id)
    expect(m.layers.map(l => l.name)).toEqual(['Capa 1'])
  })

  it('moves a layer up and down within bounds', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 3 })
    addLayer(m, 'A'); addLayer(m, 'B')
    const names = () => m.layers.map(l => l.name)
    moveLayer(m, m.layers[2].id, -1)          // B up
    expect(names()).toEqual(['Capa 1', 'B', 'A'])
    moveLayer(m, m.layers[0].id, -1)          // already top: no-op
    expect(names()).toEqual(['Capa 1', 'B', 'A'])
    moveLayer(m, m.layers[2].id, +1)          // already bottom: no-op
    expect(names()).toEqual(['Capa 1', 'B', 'A'])
  })

  it('renames and toggles visibility', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 3 })
    const id = m.layers[0].id
    renameLayer(m, id, 'Suelo')
    setLayerVisible(m, id, false)
    expect(m.layers[0].name).toBe('Suelo')
    expect(m.layers[0].visible).toBe(false)
  })

  it('sets, gets, and clears cells sparsely', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 3 })
    const id = m.layers[0].id
    const ref = { path: 'Trees/Oak.png', col: 2, row: 1 }
    setCell(m, id, 3, 2, ref)
    expect(getCell(m, id, 3, 2)).toEqual(ref)
    expect(m.layers[0].cells.size).toBe(1)     // sparse: only painted cells
    clearCell(m, id, 3, 2)
    expect(getCell(m, id, 3, 2)).toBeUndefined()
    expect(m.layers[0].cells.size).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- model`
Expected: FAIL ("Failed to resolve import './model.js'").

- [ ] **Step 3: Write minimal implementation**

```js
// Map document model. cells are mutated in place for paint performance (approved
// exception); layer-list ops mutate the shared document. Ids come from a per-map
// counter so behaviour is deterministic (no Math.random / Date.now).

const key = (x, y) => `${x},${y}`
const layerById = (map, id) => map.layers.find(l => l.id === id)

export function createMap({ tileSize, cols, rows }) {
  const map = { tileSize, cols, rows, layers: [], objects: [], _nextId: 0 }
  addLayer(map, 'Capa 1')
  return map
}

export function addLayer(map, name) {
  const layer = { id: `L${map._nextId++}`, name, type: 'tiles', visible: true, cells: new Map() }
  map.layers.push(layer)
  return layer
}

export function removeLayer(map, layerId) {
  const i = map.layers.findIndex(l => l.id === layerId)
  if (i >= 0) map.layers.splice(i, 1)
}

export function moveLayer(map, layerId, dir) {
  const i = map.layers.findIndex(l => l.id === layerId)
  if (i < 0) return
  const j = i + dir
  if (j < 0 || j >= map.layers.length) return
  const [l] = map.layers.splice(i, 1)
  map.layers.splice(j, 0, l)
}

export function renameLayer(map, layerId, name) {
  const l = layerById(map, layerId)
  if (l) l.name = name
}

export function setLayerVisible(map, layerId, visible) {
  const l = layerById(map, layerId)
  if (l) l.visible = visible
}

export function setCell(map, layerId, x, y, tileRef) {
  const l = layerById(map, layerId)
  if (l) l.cells.set(key(x, y), tileRef)
}

export function clearCell(map, layerId, x, y) {
  const l = layerById(map, layerId)
  if (l) l.cells.delete(key(x, y))
}

export function getCell(map, layerId, x, y) {
  const l = layerById(map, layerId)
  return l ? l.cells.get(key(x, y)) : undefined
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- model`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/map/model.js src/map/model.test.js
git commit -m "feat(map): map document model with free layers and sparse cells"
```

---

### Task 2: Camera transforms (pure, TDD)

**Files:**
- Create: `src/map/camera.js`
- Test: `src/map/camera.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `worldToScreen(cam,wx,wy)`, `screenToWorld(cam,sx,sy)`, `pan(cam,dxScreen,dyScreen)`, `zoomAt(cam,screenX,screenY,factor)`. Consumed by `paint.js` (Task 3), `render/canvas.js` (Task 4), camera wiring (Task 5).

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { worldToScreen, screenToWorld, pan, zoomAt } from './camera.js'

describe('camera', () => {
  it('round-trips world<->screen', () => {
    const cam = { x: 10, y: 20, zoom: 2 }
    const s = worldToScreen(cam, 50, 60)
    expect(s).toEqual({ x: (50 - 10) * 2, y: (60 - 20) * 2 })
    const w = screenToWorld(cam, s.x, s.y)
    expect(w.x).toBeCloseTo(50)
    expect(w.y).toBeCloseTo(60)
  })

  it('pans by screen delta in world units', () => {
    const cam = { x: 0, y: 0, zoom: 2 }
    // dragging content right by 20 screen px moves the camera left by 10 world px
    expect(pan(cam, 20, 0)).toEqual({ x: -10, y: 0, zoom: 2 })
  })

  it('zoomAt keeps the cursor world-point fixed', () => {
    const cam = { x: 5, y: 5, zoom: 1 }
    const before = screenToWorld(cam, 100, 80)
    const zoomed = zoomAt(cam, 100, 80, 2)
    expect(zoomed.zoom).toBe(2)
    const after = screenToWorld(zoomed, 100, 80)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- camera`
Expected: FAIL ("Failed to resolve import './camera.js'").

- [ ] **Step 3: Write minimal implementation**

```js
// Camera: pure screen<->world transforms. Camera = { x, y, zoom } where
// screen = (world - {x,y}) * zoom.

export function worldToScreen(cam, wx, wy) {
  return { x: (wx - cam.x) * cam.zoom, y: (wy - cam.y) * cam.zoom }
}

export function screenToWorld(cam, sx, sy) {
  return { x: sx / cam.zoom + cam.x, y: sy / cam.zoom + cam.y }
}

export function pan(cam, dxScreen, dyScreen) {
  return { ...cam, x: cam.x - dxScreen / cam.zoom, y: cam.y - dyScreen / cam.zoom }
}

export function zoomAt(cam, screenX, screenY, factor) {
  const before = screenToWorld(cam, screenX, screenY)
  const zoomed = { ...cam, zoom: cam.zoom * factor }
  const after = screenToWorld(zoomed, screenX, screenY)
  return { zoom: zoomed.zoom, x: zoomed.x + (before.x - after.x), y: zoomed.y + (before.y - after.y) }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- camera`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/map/camera.js src/map/camera.test.js
git commit -m "feat(map): pure camera pan/zoom transforms"
```

---

### Task 3: Paint tool logic (pure, TDD)

**Files:**
- Create: `src/tools/paint.js`
- Test: `src/tools/paint.test.js`

**Interfaces:**
- Consumes: `screenToWorld` (Task 2); `setCell`, `clearCell` (Task 1).
- Produces: `paintAt(map, layerId, cam, screenX, screenY, tool, activeTile) -> boolean` (true if the map changed). `tool` is `'brush' | 'eraser'`. Consumed by the pointer wiring in Task 7.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { paintAt } from './paint.js'
import { createMap, getCell } from '../map/model.js'

const cam = { x: 0, y: 0, zoom: 1 }   // screen px == world px

describe('paintAt', () => {
  it('brush sets the active tile at the pointed cell', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 4 })
    const id = m.layers[0].id
    const tile = { path: 'g.png', col: 0, row: 0 }
    // screen (20,35) -> world (20,35) -> cell (1,2)
    const changed = paintAt(m, id, cam, 20, 35, 'brush', tile)
    expect(changed).toBe(true)
    expect(getCell(m, id, 1, 2)).toEqual(tile)
  })

  it('eraser clears the pointed cell', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 4 })
    const id = m.layers[0].id
    paintAt(m, id, cam, 20, 35, 'brush', { path: 'g.png', col: 0, row: 0 })
    const changed = paintAt(m, id, cam, 20, 35, 'eraser', null)
    expect(changed).toBe(true)
    expect(getCell(m, id, 1, 2)).toBeUndefined()
  })

  it('does nothing outside the map bounds', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 4 })
    const id = m.layers[0].id
    expect(paintAt(m, id, cam, -5, 10, 'brush', { path: 'g.png', col: 0, row: 0 })).toBe(false)
    expect(paintAt(m, id, cam, 999, 10, 'brush', { path: 'g.png', col: 0, row: 0 })).toBe(false)
  })

  it('brush with no active tile does nothing', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 4 })
    const id = m.layers[0].id
    expect(paintAt(m, id, cam, 20, 35, 'brush', null)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- paint`
Expected: FAIL ("Failed to resolve import './paint.js'").

- [ ] **Step 3: Write minimal implementation**

```js
import { screenToWorld } from '../map/camera.js'
import { setCell, clearCell } from '../map/model.js'

// paintAt: map a screen pointer position to a cell and apply the active tool.
// Returns true if the map changed.
export function paintAt(map, layerId, cam, screenX, screenY, tool, activeTile) {
  const w = screenToWorld(cam, screenX, screenY)
  const cx = Math.floor(w.x / map.tileSize)
  const cy = Math.floor(w.y / map.tileSize)
  if (cx < 0 || cy < 0 || cx >= map.cols || cy >= map.rows) return false
  if (tool === 'eraser') { clearCell(map, layerId, cx, cy); return true }
  if (tool === 'brush' && activeTile) { setCell(map, layerId, cx, cy, activeTile); return true }
  return false
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- paint`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/tools/paint.js src/tools/paint.test.js
git commit -m "feat(tools): brush/eraser cell painting logic"
```

---

### Task 4: Editor layout + canvas render + new-map dialog

**Files:**
- Modify: `index.html` (restructure to an editor layout; keep the bundle loader controls)
- Create: `src/render/canvas.js`
- Create: `src/ui/new-map.js`
- Modify: `src/main.js` (add editor state + orchestration; keep the existing loader wiring)

**Interfaces:**
- Consumes: `createMap` (Task 1); `worldToScreen` (Task 2); the loader's `importZip`/`buildManifest`/`renderPalette`.
- Produces: `renderMap(canvas, map, cam, imagesByPath)` (canvas.js); `openNewMapDialog(host, tileSize, onCreate)` (new-map.js) where `onCreate({cols, rows})` fires on submit. Editor state on `main.js`: `state.map`, `state.cam`, `state.imagesByPath`, `state.activeLayerId`, plus `scheduleRender()` and `fitCamera()`. Consumed by Tasks 5-8.

- [ ] **Step 1: Rewrite `index.html` to the editor layout**

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>World Editor</title>
  <style>
    :root { --bg:#0b1020; --panel:#131a30; --line:#2a3350; --accent:#00e5a8; --text:#dfeaff; --muted:#7f8db0; }
    * { box-sizing:border-box; }
    body { margin:0; font:13px/1.4 ui-monospace,Menlo,monospace; background:var(--bg); color:var(--text); height:100vh; display:flex; flex-direction:column; }
    header { padding:8px 12px; border-bottom:1px solid var(--line); display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    h1 { font-size:13px; letter-spacing:1px; text-transform:uppercase; color:var(--accent); margin:0; }
    #status { color:var(--muted); }
    button { background:var(--accent); color:#04121a; border:0; padding:5px 10px; border-radius:6px; font-weight:700; cursor:pointer; font-family:inherit; }
    button.ghost { background:transparent; color:var(--text); border:1px solid var(--line); }
    button.on { outline:2px solid var(--accent); }
    main { flex:1; display:grid; grid-template-columns:280px 1fr 220px; min-height:0; }
    #left { border-right:1px solid var(--line); overflow-y:auto; padding:10px; }
    #right { border-left:1px solid var(--line); background:var(--panel); overflow-y:auto; padding:10px; }
    #stagewrap { position:relative; overflow:hidden; background:#070b16; }
    #stage { display:block; width:100%; height:100%; image-rendering:pixelated; cursor:crosshair; }
    h2 { font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--accent); margin:12px 0 6px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,60px); gap:6px; }
    .cell { background:#0b1020; border:1px solid var(--line); border-radius:6px; padding:3px; text-align:center; cursor:pointer; }
    .cell:hover { border-color:var(--accent); }
    .cell canvas { image-rendering:pixelated; width:48px; height:48px; display:block; margin:0 auto; }
    .cell .badge { font-size:9px; color:var(--accent); }
    .cell .lbl { font-size:9px; color:var(--muted); word-break:break-all; }
    #tiles .tpgrid { display:grid; grid-template-columns:repeat(auto-fill,34px); gap:3px; }
    #tiles .tpcell { width:34px; height:34px; border:1px solid var(--line); border-radius:4px; cursor:pointer; }
    #tiles .tpcell:hover { border-color:var(--accent); }
    #tiles .tpcell canvas { display:block; }
    #layers .lrow { display:flex; align-items:center; gap:4px; padding:4px; border:1px solid var(--line); border-radius:5px; margin-bottom:4px; cursor:pointer; }
    #layers .lrow.active { border-color:var(--accent); background:#0b1020; }
    #layers .lname { flex:1; word-break:break-all; }
    #layers .lrow button { padding:2px 5px; font-size:11px; }
    dialog { background:var(--panel); color:var(--text); border:1px solid var(--line); border-radius:8px; padding:16px; font-family:inherit; }
    dialog input { background:#0b1020; border:1px solid var(--line); color:var(--text); border-radius:5px; padding:5px; width:80px; }
    dialog label { display:block; margin:8px 0; color:var(--muted); }
  </style>
</head>
<body>
  <header>
    <h1>World Editor</h1>
    <input id="file" type="file" accept=".zip" />
    <button id="newmap" class="ghost" disabled>Nuevo mapa</button>
    <span style="width:1px;height:18px;background:var(--line)"></span>
    <button id="tool-brush" class="ghost">Pincel</button>
    <button id="tool-eraser" class="ghost">Borrador</button>
    <span id="status">elige un bundle .zip</span>
  </header>
  <main>
    <div id="left">
      <h2>Bundle</h2>
      <div id="palette"></div>
      <h2>Tiles</h2>
      <div id="tiles"><span class="lbl" style="color:var(--muted)">click una imagen del bundle</span></div>
    </div>
    <div id="stagewrap"><canvas id="stage"></canvas></div>
    <div id="right">
      <h2>Capas</h2>
      <button id="addlayer" class="ghost" disabled>+ capa</button>
      <div id="layers"></div>
    </div>
  </main>
  <dialog id="newmap-dialog">
    <h2>Nuevo mapa</h2>
    <label>Columnas <input id="nm-cols" type="number" value="60" min="1" /></label>
    <label>Filas <input id="nm-rows" type="number" value="45" min="1" /></label>
    <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end">
      <button id="nm-cancel" class="ghost">Cancelar</button>
      <button id="nm-create">Crear</button>
    </div>
  </dialog>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `src/render/canvas.js`**

```js
import { worldToScreen } from '../map/camera.js'

// renderMap: draw the world background, each visible layer's cells, and the grid.
// imagesByPath: { [path]: HTMLImageElement } (bundle images, already loading).
export function renderMap(canvas, map, cam, imagesByPath) {
  const g = canvas.getContext('2d')
  g.imageSmoothingEnabled = false
  g.clearRect(0, 0, canvas.width, canvas.height)
  if (!map) return
  const ts = map.tileSize
  const origin = worldToScreen(cam, 0, 0)
  const wpx = map.cols * ts * cam.zoom
  const hpx = map.rows * ts * cam.zoom

  g.fillStyle = '#1a2036'
  g.fillRect(origin.x, origin.y, wpx, hpx)

  const dz = ts * cam.zoom
  for (const layer of map.layers) {
    if (!layer.visible) continue
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

  drawGrid(g, map, cam, origin, wpx, hpx)
}

function drawGrid(g, map, cam, origin, wpx, hpx) {
  const step = map.tileSize * cam.zoom
  if (step < 4) return // too dense to be useful
  g.strokeStyle = 'rgba(127,141,176,0.25)'
  g.lineWidth = 1
  g.beginPath()
  for (let x = 0; x <= map.cols; x++) {
    const sx = origin.x + x * step
    g.moveTo(sx, origin.y); g.lineTo(sx, origin.y + hpx)
  }
  for (let y = 0; y <= map.rows; y++) {
    const sy = origin.y + y * step
    g.moveTo(origin.x, sy); g.lineTo(origin.x + wpx, sy)
  }
  g.stroke()
}
```

- [ ] **Step 3: Write `src/ui/new-map.js`**

```js
// openNewMapDialog: show the <dialog> and call onCreate({cols, rows}) on submit.
export function openNewMapDialog(dialog, onCreate) {
  const cols = dialog.querySelector('#nm-cols')
  const rows = dialog.querySelector('#nm-rows')
  const create = dialog.querySelector('#nm-create')
  const cancel = dialog.querySelector('#nm-cancel')
  const submit = () => {
    const c = Math.max(1, parseInt(cols.value, 10) || 1)
    const r = Math.max(1, parseInt(rows.value, 10) || 1)
    dialog.close()
    onCreate({ cols: c, rows: r })
  }
  create.onclick = submit
  cancel.onclick = () => dialog.close()
  dialog.showModal()
}
```

- [ ] **Step 4: Rewrite `src/main.js` to orchestrate loader + editor (static render)**

```js
import { importZip } from './bundle/import.js'
import { buildManifest } from './bundle/manifest.js'
import { renderPalette } from './catalog/palette.js'
import { createMap } from './map/model.js'
import { renderMap } from './render/canvas.js'
import { openNewMapDialog } from './ui/new-map.js'

const DEFAULT_TILE_BASE = 16
const status = document.querySelector('#status')
const stage = document.querySelector('#stage')

const state = {
  bundle: null,          // { id, images, manifest }
  imagesByPath: {},      // path -> HTMLImageElement
  map: null,
  cam: { x: 0, y: 0, zoom: 1 },
  activeLayerId: null,
  activeTile: null,      // TileRef
  tool: 'brush',
}

// ---- render scheduling ----
let raf = 0
function scheduleRender() {
  if (raf) return
  raf = requestAnimationFrame(() => { raf = 0; renderMap(stage, state.map, state.cam, state.imagesByPath) })
}
function resizeStage() {
  const wrap = stage.parentElement
  stage.width = wrap.clientWidth
  stage.height = wrap.clientHeight
  scheduleRender()
}
window.addEventListener('resize', resizeStage)

function fitCamera() {
  if (!state.map) return
  const m = state.map
  const wpx = m.cols * m.tileSize, hpx = m.rows * m.tileSize
  const z = Math.min(stage.width / wpx, stage.height / hpx) * 0.9
  state.cam = { zoom: z, x: (wpx - stage.width / z) / 2, y: (hpx - stage.height / z) / 2 }
}

// ---- bundle loading (loader milestone, preserved) ----
document.querySelector('#file').addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (!file) return
  status.textContent = 'descomprimiendo…'
  try {
    const { id, images } = await importZip(file)
    for (const prev of Object.values(state.imagesByPath)) prev.src = ''
    const manifest = buildManifest(id, DEFAULT_TILE_BASE, images)
    state.bundle = { id, images, manifest }
    state.imagesByPath = {}
    for (const im of images) {
      const img = new Image(); img.src = im.url
      img.onload = scheduleRender
      state.imagesByPath[im.path] = img
    }
    renderPalette(document.querySelector('#palette'), images, manifest)
    document.querySelector('#newmap').disabled = false
    status.textContent = `${id} · ${images.length} imágenes · crea un mapa`
  } catch (err) {
    status.textContent = 'error: ' + err.message
    console.error(err)
  }
})

// ---- new map ----
document.querySelector('#newmap').addEventListener('click', () => {
  openNewMapDialog(document.querySelector('#newmap-dialog'), ({ cols, rows }) => {
    state.map = createMap({ tileSize: DEFAULT_TILE_BASE, cols, rows })
    state.activeLayerId = state.map.layers[0].id
    document.querySelector('#addlayer').disabled = false
    resizeStage()
    fitCamera()
    scheduleRender()
    status.textContent = `mapa ${cols}×${rows}`
  })
})

resizeStage()
```

- [ ] **Step 5: Build to verify no syntax/import errors**

Run: `PATH=/opt/homebrew/bin:$PATH npx vite build`
Expected: build succeeds, no errors.

- [ ] **Step 6: Verify tests still pass (loader + new pure modules unaffected)**

Run: `npm test`
Expected: PASS (all model/camera/paint/slice/manifest tests green).

- [ ] **Step 7: Commit**

```bash
git add index.html src/render/canvas.js src/ui/new-map.js src/main.js
git commit -m "feat(editor): editor layout, canvas render, new-map dialog"
```

---

### Task 5: Camera interaction (pan + wheel zoom)

**Files:**
- Modify: `src/main.js` (add pointer/wheel handlers on the stage; use `pan`/`zoomAt`)

**Interfaces:**
- Consumes: `pan`, `zoomAt` (Task 2); `state.cam`, `scheduleRender` (Task 4).
- Produces: camera interaction; sets `state.panning` while space or middle-button is held (Task 7 checks it to suppress painting).

- [ ] **Step 1: Add the import**

At the top of `src/main.js`, extend the camera import line to:

```js
import { pan, zoomAt } from './map/camera.js'
```

- [ ] **Step 2: Add camera interaction near the bottom of `src/main.js` (before the final `resizeStage()`)**

```js
// ---- camera interaction ----
let spaceDown = false
window.addEventListener('keydown', e => { if (e.code === 'Space') { spaceDown = true } })
window.addEventListener('keyup', e => { if (e.code === 'Space') { spaceDown = false } })

state.panning = false
let lastX = 0, lastY = 0

stage.addEventListener('mousedown', e => {
  if (spaceDown || e.button === 1) {
    state.panning = true
    lastX = e.clientX; lastY = e.clientY
    e.preventDefault()
  }
})
window.addEventListener('mousemove', e => {
  if (!state.panning) return
  state.cam = pan(state.cam, e.clientX - lastX, e.clientY - lastY)
  lastX = e.clientX; lastY = e.clientY
  scheduleRender()
})
window.addEventListener('mouseup', () => { state.panning = false })

stage.addEventListener('wheel', e => {
  e.preventDefault()
  const r = stage.getBoundingClientRect()
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
  state.cam = zoomAt(state.cam, e.clientX - r.left, e.clientY - r.top, factor)
  scheduleRender()
}, { passive: false })
```

- [ ] **Step 3: Build**

Run: `PATH=/opt/homebrew/bin:$PATH npx vite build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/main.js
git commit -m "feat(editor): camera pan (space/middle-drag) and wheel zoom"
```

---

### Task 6: Tile picker (per-frame selection)

**Files:**
- Create: `src/ui/tile-picker.js`
- Modify: `src/catalog/palette.js` (add an `onPick(image)` click callback param)
- Modify: `src/main.js` (wire palette click → open tile picker → set active tile)

**Interfaces:**
- Consumes: the manifest entry for an image (`{type,fw,fh,cols,rows}` or `{type:'single',w,h}`); `state.bundle`, `state.activeTile`.
- Produces: `openTilePicker(host, image, entry, onPick)` where `onPick({path,col,row})` fires on frame click. `renderPalette(host, images, manifest, onPick)` gains a 4th arg (`onPick(image)`), backward-compatible when omitted.

- [ ] **Step 1: Write `src/ui/tile-picker.js`**

```js
// openTilePicker: expand a sheet image into its frame grid; call onPick({path,col,row}).
export function openTilePicker(host, image, entry, onPick) {
  host.innerHTML = ''
  const sheet = entry.type === 'sheet'
  const cols = sheet ? entry.cols : 1
  const rows = sheet ? entry.rows : 1
  const fw = sheet ? entry.fw : image.w
  const fh = sheet ? entry.fh : image.h
  const img = new Image()
  const draws = []
  const grid = document.createElement('div')
  grid.className = 'tpgrid'
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cv = document.createElement('canvas')
      cv.width = 32; cv.height = 32
      const draw = () => {
        const g = cv.getContext('2d')
        g.imageSmoothingEnabled = false
        const s = Math.min(32 / fw, 32 / fh)
        g.clearRect(0, 0, 32, 32)
        g.drawImage(img, c * fw, r * fh, fw, fh, (32 - fw * s) / 2, (32 - fh * s) / 2, fw * s, fh * s)
      }
      draws.push(draw)
      const cell = document.createElement('div')
      cell.className = 'tpcell'
      cell.title = `${image.path} [${c},${r}]`
      cell.appendChild(cv)
      cell.onclick = () => onPick({ path: image.path, col: c, row: r })
      grid.appendChild(cell)
    }
  }
  img.onload = () => draws.forEach(d => d())
  img.src = image.url
  host.appendChild(grid)
}
```

- [ ] **Step 2: Add the `onPick(image)` callback to `renderPalette`**

In `src/catalog/palette.js`, change the signature and the cell click. Update the export line and the `cell(...)` helper:

```js
export function renderPalette(host, images, manifest, onPick) {
  host.innerHTML = ''
  const grid = document.createElement('div')
  grid.className = 'grid'
  for (const im of images) {
    const desc = manifest.images[im.path]
    grid.appendChild(cell(im, desc, onPick))
  }
  host.appendChild(grid)
}
```

And in the `cell` helper, add the click handler (keep the existing thumbnail + badge + label code exactly as-is, just add the `onPick` param and the `el.onclick`):

```js
function cell(im, desc, onPick) {
  const el = document.createElement('div')
  el.className = 'cell'
  el.title = im.path
  const c = document.createElement('canvas')
  c.width = 56
  c.height = 56
  drawThumb(c, im, desc)
  el.appendChild(c)
  const name = im.path.split('/').pop()
  const badge = desc.type === 'sheet' ? `sheet ${desc.cols}x${desc.rows}` : 'single'
  const badgeEl = document.createElement('div')
  badgeEl.className = 'badge'
  badgeEl.textContent = badge
  const lblEl = document.createElement('div')
  lblEl.className = 'lbl'
  lblEl.textContent = name
  el.append(badgeEl, lblEl)
  if (onPick) el.onclick = () => onPick(im)
  return el
}
```

- [ ] **Step 3: Wire it in `src/main.js`**

Add the import:

```js
import { openTilePicker } from './ui/tile-picker.js'
```

In the bundle `change` handler, replace the `renderPalette(...)` call with a version that passes an `onPick`:

```js
    renderPalette(document.querySelector('#palette'), images, manifest, (image) => {
      const entry = state.bundle.manifest.images[image.path]
      openTilePicker(document.querySelector('#tiles'), image, entry, (tileRef) => {
        state.activeTile = tileRef
        status.textContent = `tile: ${tileRef.path} [${tileRef.col},${tileRef.row}]`
      })
    })
```

- [ ] **Step 4: Build**

Run: `PATH=/opt/homebrew/bin:$PATH npx vite build`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add src/ui/tile-picker.js src/catalog/palette.js src/main.js
git commit -m "feat(editor): per-frame tile picker and active-tile selection"
```

---

### Task 7: Brush/eraser painting on the canvas

**Files:**
- Modify: `src/main.js` (pointer handlers on the stage → `paintAt`; tool toggle buttons)

**Interfaces:**
- Consumes: `paintAt` (Task 3); `state.map`, `state.activeLayerId`, `state.activeTile`, `state.tool`, `state.panning`, `scheduleRender`.
- Produces: live painting; tool buttons set `state.tool` and their `.on` class.

- [ ] **Step 1: Add the import**

```js
import { paintAt } from './tools/paint.js'
```

- [ ] **Step 2: Add tool buttons + painting handlers near the bottom of `src/main.js` (after camera interaction)**

```js
// ---- tools ----
const brushBtn = document.querySelector('#tool-brush')
const eraserBtn = document.querySelector('#tool-eraser')
function setTool(t) {
  state.tool = t
  brushBtn.classList.toggle('on', t === 'brush')
  eraserBtn.classList.toggle('on', t === 'eraser')
}
brushBtn.onclick = () => setTool('brush')
eraserBtn.onclick = () => setTool('eraser')
setTool('brush')

let painting = false
function paintEvent(e) {
  if (!state.map || state.panning) return
  const r = stage.getBoundingClientRect()
  const changed = paintAt(
    state.map, state.activeLayerId, state.cam,
    e.clientX - r.left, e.clientY - r.top, state.tool, state.activeTile
  )
  if (changed) scheduleRender()
}
stage.addEventListener('mousedown', e => {
  if (spaceDown || e.button === 1) return // camera pan owns this gesture
  painting = true
  paintEvent(e)
})
window.addEventListener('mousemove', e => { if (painting) paintEvent(e) })
window.addEventListener('mouseup', () => { painting = false })
```

- [ ] **Step 3: Build**

Run: `PATH=/opt/homebrew/bin:$PATH npx vite build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/main.js
git commit -m "feat(editor): brush/eraser painting wired to the canvas"
```

---

### Task 8: Layers panel

**Files:**
- Create: `src/ui/layers-panel.js`
- Modify: `src/main.js` (render the panel; wire add/select/delete/move/rename/toggle; re-render panel + canvas on change)

**Interfaces:**
- Consumes: `addLayer`, `removeLayer`, `moveLayer`, `renameLayer`, `setLayerVisible` (Task 1); `state.map`, `state.activeLayerId`, `scheduleRender`.
- Produces: `renderLayers(host, map, activeLayerId, handlers)` where `handlers = { onSelect, onAdd, onDelete, onMove, onRename, onToggle }`.

- [ ] **Step 1: Write `src/ui/layers-panel.js`**

```js
// renderLayers: draw the layer stack top-of-panel = top-of-stack (last drawn).
// Layers are rendered in reverse so the visually-topmost layer sits at the top.
export function renderLayers(host, map, activeLayerId, h) {
  host.innerHTML = ''
  const ordered = [...map.layers].reverse()
  for (const layer of ordered) {
    const row = document.createElement('div')
    row.className = 'lrow' + (layer.id === activeLayerId ? ' active' : '')
    row.onclick = (e) => { if (e.target === row || e.target.classList.contains('lname')) h.onSelect(layer.id) }

    const vis = document.createElement('button')
    vis.className = 'ghost'
    vis.textContent = layer.visible ? '👁' : '—'
    vis.title = 'visibilidad'
    vis.onclick = (e) => { e.stopPropagation(); h.onToggle(layer.id, !layer.visible) }

    const name = document.createElement('span')
    name.className = 'lname'
    name.textContent = layer.name
    name.title = 'doble-click para renombrar'
    name.ondblclick = (e) => {
      e.stopPropagation()
      const next = prompt('Nombre de la capa', layer.name)
      if (next != null && next.trim()) h.onRename(layer.id, next.trim())
    }

    const up = document.createElement('button'); up.className = 'ghost'; up.textContent = '↑'
    up.onclick = (e) => { e.stopPropagation(); h.onMove(layer.id, -1) }
    const down = document.createElement('button'); down.className = 'ghost'; down.textContent = '↓'
    down.onclick = (e) => { e.stopPropagation(); h.onMove(layer.id, +1) }
    const del = document.createElement('button'); del.className = 'ghost'; del.textContent = '✕'
    del.onclick = (e) => { e.stopPropagation(); h.onDelete(layer.id) }

    row.append(vis, name, up, down, del)
    host.appendChild(row)
  }
}
```

- [ ] **Step 2: Wire it in `src/main.js`**

Add the imports:

```js
import { addLayer, removeLayer, moveLayer, renameLayer, setLayerVisible } from './map/model.js'
import { renderLayers } from './ui/layers-panel.js'
```

(Note: `createMap` is already imported from `./map/model.js` — combine them into one import line.)

Add a panel-refresh helper and handlers near the bottom of `src/main.js`:

```js
// ---- layers panel ----
const layersHost = document.querySelector('#layers')
function refreshLayers() {
  if (!state.map) return
  renderLayers(layersHost, state.map, state.activeLayerId, {
    onSelect: (id) => { state.activeLayerId = id; refreshLayers() },
    onAdd: () => {},
    onDelete: (id) => {
      if (state.map.layers.length <= 1) return // keep at least one layer
      removeLayer(state.map, id)
      if (state.activeLayerId === id) state.activeLayerId = state.map.layers[state.map.layers.length - 1].id
      refreshLayers(); scheduleRender()
    },
    onMove: (id, dir) => { moveLayer(state.map, id, dir); refreshLayers(); scheduleRender() },
    onRename: (id, name) => { renameLayer(state.map, id, name); refreshLayers() },
    onToggle: (id, v) => { setLayerVisible(state.map, id, v); refreshLayers(); scheduleRender() },
  })
}

document.querySelector('#addlayer').addEventListener('click', () => {
  if (!state.map) return
  const l = addLayer(state.map, `Capa ${state.map.layers.length + 1}`)
  state.activeLayerId = l.id
  refreshLayers(); scheduleRender()
})
```

- [ ] **Step 3: Call `refreshLayers()` when a map is created**

In the `#newmap` click handler (Task 4), add `refreshLayers()` right after `scheduleRender()`:

```js
    resizeStage()
    fitCamera()
    scheduleRender()
    refreshLayers()
    status.textContent = `mapa ${cols}×${rows}`
```

- [ ] **Step 4: Build + full test run**

Run: `PATH=/opt/homebrew/bin:$PATH npx vite build && npm test`
Expected: build succeeds; all unit tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/ui/layers-panel.js src/main.js
git commit -m "feat(editor): free-layer panel (add/select/delete/reorder/rename/hide)"
```

---

## Self-Review

**Spec coverage (this milestone's scope):**
- New-map dialog (cols×rows, tileSize from bundle) → Task 4 (new-map.js) + Task 4 wiring. ✓
- Camera pan/zoom + grid overlay → Task 4 (grid in canvas.js) + Task 5 (interaction). ✓
- Free layers panel (add/delete/reorder/rename/hide, active highlight) → Task 8 + Task 1 model ops. ✓
- Tile picker (expand sheet → frame grid → active tile) → Task 6. ✓
- Brush + eraser painting, live render → Task 3 (logic) + Task 7 (wiring) + Task 4 (render). ✓
- Pure unit-tested model + camera → Tasks 1, 2; paint logic also unit-tested → Task 3. ✓
- Deferred items (rect/bucket/eyedropper/select, object layers, save/load, export, resize) intentionally absent. ✓

**Type consistency:** `Camera {x,y,zoom}` and `worldToScreen`/`screenToWorld`/`pan`/`zoomAt` are used identically in canvas.js, paint.js, and main.js. `TileRef {path,col,row}` is produced by tile-picker's `onPick`, stored by `setCell`, read by `renderMap` (`ref.col*ts`). `state.activeLayerId` feeds `paintAt` and the panel handlers. `renderPalette`'s 4th arg `onPick` is optional (loader-milestone calls without it still work; here it's supplied). Model op names (`addLayer`/`removeLayer`/`moveLayer`/`renameLayer`/`setLayerVisible`/`setCell`/`clearCell`) match between Task 1, Task 3, and Task 8.

**Placeholder scan:** No TBD/TODO; every code step is complete. `onAdd` in the panel handlers is intentionally a no-op (the add button is wired separately on `#addlayer`), not a placeholder.

**Manual E2E (controller, after Task 8):** dev server + Playwright — load `fixtures/trees.zip`, click "Nuevo mapa" → create, click a palette image → pick a frame, paint several cells with the brush, add a layer, toggle visibility, screenshot. Verify cells render and a hidden layer's cells disappear; zero page errors.
