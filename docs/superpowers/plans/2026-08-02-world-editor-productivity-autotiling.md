# World Editor — Productivity + Autotiling Implementation Plan (Milestone 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add eyedropper, rectangle fill, undo/redo, whole-sprite (sheet→single) objects, and terrain autotiling to the editor.

**Architecture:** Pure, unit-tested logic (`pick.js`, `rect.js`, `history.js`, `autotile.js`, model terrain ops) separated from canvas render + main.js wiring. Autotiling generalizes a tiles-layer cell value to `TileRef | {terrain:id}`, resolved to a concrete frame at render/export from 4-neighbor masks (ports the game's `edgeTileName`).

**Tech Stack:** Existing Vite 5 + vanilla JS + Canvas + Vitest. No new dependencies.

## Global Constraints

- Repo: `/Users/andres/Development/repositories.nosync/codehunters/tools/world-editor` (branch `master`, remote `origin`). All commits land here.
- Node >= 20; if too old use `/opt/homebrew/bin/node` or prefix `PATH=/opt/homebrew/bin:$PATH`.
- Vanilla JS ES modules only. No framework/TypeScript. `npm test` runs vitest.
- **No `Math.random()` / `Date.now()` / `new Date()`** — ids from the per-map `_nextId` counter (`L` layers, `O` objects, `T` terrains).
- A tiles-layer cell value is `CellVal = TileRef {path,col,row}` **or** `{ terrain: id }`. Paint/fill/rect/eyedropper treat the active value generically (`state.activeTile` holds either). Objects only accept a plain `TileRef`.
- Autotile 9-cell role layout (ports `src/game/render/tiles.js` `edgeTileName`): center + 4 straight edges + 4 outer corners, 3×3 block `(0,0)=nw (1,0)=n (2,0)=ne / (0,1)=w (1,1)=center (2,1)=e / (0,2)=sw (1,2)=s (2,2)=se`.
- `renderMap` is currently `(canvas, map, cam, imagesByPath, manifest, selected)`. Tasks that add params append them at the end and update the single call site in `scheduleRender`.
- Preserve everything shipped (loader, palette, camera, tiles/objects, save/load/export, bucket). Only the additive edits named per task.
- `state.manifest` (added in Task 4) becomes the **effective** manifest (raw bundle manifest + single-overrides); once it exists, `sizeOf`/`frameSrc`/tile-picker read it instead of `state.bundle.manifest`.

---

### Task 1: Eyedropper tool (pure `pick.js` + wiring)

**Files:**
- Create: `src/tools/pick.js`
- Test: `src/tools/pick.test.js`
- Modify: `index.html` (add `#tool-eyedropper` button)
- Modify: `src/main.js` (setTool + editEvent branch)

**Interfaces:**
- Consumes: `screenToWorld`, `getCell` (model), `hitObject` (place).
- Produces: `pickAt(map, layerId, cam, screenX, screenY, sizeOf) -> CellVal | null` — on a tiles layer returns the cell value under the cursor; on an objects layer returns the topmost object's `ref`; null if empty/out of bounds.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { pickAt } from './pick.js'
import { createMap, setCell, addObjectLayer, addObject } from '../map/model.js'

const cam = { x: 0, y: 0, zoom: 1 }
const size16 = () => ({ w: 16, h: 16 })

describe('pickAt', () => {
  it('picks a tiles cell value under the cursor', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 4 })
    const id = m.layers[0].id
    const ref = { path: 'Grass.png', col: 1, row: 0 }
    setCell(m, id, 1, 2, ref)              // world (16..32, 32..48)
    expect(pickAt(m, id, cam, 20, 35, size16)).toEqual(ref)
  })

  it('returns null over an empty tiles cell', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 4 })
    expect(pickAt(m, m.layers[0].id, cam, 20, 35, size16)).toBeNull()
  })

  it('picks an object ref on an objects layer', () => {
    const m = createMap({ tileSize: 16, cols: 4, rows: 4 })
    const l = addObjectLayer(m, 'Props')
    const ref = { path: 'Oak.png', col: 0, row: 0 }
    addObject(m, l.id, ref, 50, 50)        // bottom-center box x[42..58] y[34..50]
    expect(pickAt(m, l.id, cam, 50, 45, size16)).toEqual(ref)
    expect(pickAt(m, l.id, cam, 200, 200, size16)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- pick`
Expected: FAIL ("pickAt is not a function").

- [ ] **Step 3: Write minimal implementation**

```js
import { screenToWorld } from '../map/camera.js'
import { getCell } from '../map/model.js'
import { hitObject } from './place.js'

// pickAt: the cell value (tiles) or object ref (objects) under the cursor, or null.
export function pickAt(map, layerId, cam, screenX, screenY, sizeOf) {
  const layer = map.layers.find(l => l.id === layerId)
  if (!layer) return null
  if (layer.type === 'objects') {
    const hit = hitObject(layer, cam, screenX, screenY, sizeOf)
    return hit ? hit.ref : null
  }
  const w = screenToWorld(cam, screenX, screenY)
  const cx = Math.floor(w.x / map.tileSize)
  const cy = Math.floor(w.y / map.tileSize)
  if (cx < 0 || cy < 0 || cx >= map.cols || cy >= map.rows) return null
  return getCell(map, layerId, cx, cy) ?? null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- pick`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the toolbar button** — in `index.html`, after the `#tool-fill` button:

```html
    <button id="tool-eyedropper" class="ghost" title="Cuentagotas: toma un tile del mapa">Cuentagotas</button>
```

- [ ] **Step 6: Wire it in `src/main.js`**

Add the import near the other tool imports:

```js
import { pickAt } from './tools/pick.js'
```

Extend `setTool` to toggle the new button and add its element (mirror `fillBtn`):

```js
const eyedropperBtn = document.querySelector('#tool-eyedropper')
```
Add inside `setTool`: `eyedropperBtn.classList.toggle('on', t === 'eyedropper')`
Add after the other `.onclick` lines: `eyedropperBtn.onclick = () => setTool('eyedropper')`

In `editEvent`, at the very top of the function body (after the `if (!state.map || state.panning) return` guard and the `sx/sy/layer` setup, before the objects/tiles branches), add:

```js
  if (state.tool === 'eyedropper') {
    if (!isDown) return
    const picked = pickAt(state.map, state.activeLayerId, state.cam, sx, sy, sizeOf)
    if (picked) { state.activeTile = picked; state.activeTerrain = null; status.textContent = 'tile tomado' }
    else status.textContent = 'celda vacía'
    return
  }
```

(`state.activeTerrain` is introduced in Task 5; declaring it here as a write is harmless — add `activeTerrain: null` to the `state` object literal now so it exists.)

- [ ] **Step 7: Build + tests**

Run: `PATH=/opt/homebrew/bin:$PATH npx vite build && npm test`
Expected: build ok; all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/tools/pick.js src/tools/pick.test.js index.html src/main.js
git commit -m "feat(tools): eyedropper — pick a tile/object from the map"
```

---

### Task 2: Rectangle fill (pure `rect.js` + wiring + preview)

**Files:**
- Create: `src/tools/rect.js`
- Test: `src/tools/rect.test.js`
- Modify: `index.html` (add `#tool-rect` button)
- Modify: `src/render/canvas.js` (draw a rect preview)
- Modify: `src/main.js` (tool + drag lifecycle + preview state)

**Interfaces:**
- Consumes: `setCell` (model).
- Produces: `rectFill(map, layerId, x0, y0, x1, y1, val) -> count` — fills the inclusive, min/max-normalized, bounds-clamped rectangle with `val`; returns cells written. `renderMap` gains a trailing `rectPreview` param `{x0,y0,x1,y1}|null` drawn as a cell-aligned outline.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { rectFill } from './rect.js'
import { createMap, getCell } from '../map/model.js'

const V = { path: 'Grass.png', col: 0, row: 0 }

describe('rectFill', () => {
  it('fills an inclusive rectangle and counts cells', () => {
    const m = createMap({ tileSize: 16, cols: 5, rows: 5 })
    const id = m.layers[0].id
    expect(rectFill(m, id, 1, 1, 2, 3, V)).toBe(6)  // x1..2 (2) * y1..3 (3)
    expect(getCell(m, id, 1, 1)).toEqual(V)
    expect(getCell(m, id, 2, 3)).toEqual(V)
    expect(getCell(m, id, 0, 0)).toBeUndefined()
  })

  it('normalizes reversed corners', () => {
    const m = createMap({ tileSize: 16, cols: 5, rows: 5 })
    const id = m.layers[0].id
    expect(rectFill(m, id, 3, 3, 1, 1, V)).toBe(9)
    expect(getCell(m, id, 2, 2)).toEqual(V)
  })

  it('clamps to map bounds', () => {
    const m = createMap({ tileSize: 16, cols: 3, rows: 3 })
    const id = m.layers[0].id
    expect(rectFill(m, id, -2, -2, 10, 10, V)).toBe(9)  // whole 3x3
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rect`
Expected: FAIL ("rectFill is not a function").

- [ ] **Step 3: Write minimal implementation**

```js
import { setCell } from '../map/model.js'

// rectFill: fill the inclusive, normalized, clamped rectangle with val. Returns count.
export function rectFill(map, layerId, x0, y0, x1, y1, val) {
  const minX = Math.max(0, Math.min(x0, x1))
  const maxX = Math.min(map.cols - 1, Math.max(x0, x1))
  const minY = Math.max(0, Math.min(y0, y1))
  const maxY = Math.min(map.rows - 1, Math.max(y0, y1))
  let n = 0
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) { setCell(map, layerId, x, y, val); n++ }
  }
  return n
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rect`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the toolbar button** — in `index.html`, after `#tool-eyedropper`:

```html
    <button id="tool-rect" class="ghost" title="Rectángulo: arrastra para llenar un área">Rectángulo</button>
```

- [ ] **Step 6: Draw the preview in `src/render/canvas.js`**

Change the signature to `renderMap(canvas, map, cam, imagesByPath, manifest, selected, rectPreview)` and, after the grid is drawn (end of the function, before it returns), add:

```js
  if (rectPreview) {
    const ts = map.tileSize
    const minX = Math.min(rectPreview.x0, rectPreview.x1)
    const maxX = Math.max(rectPreview.x0, rectPreview.x1)
    const minY = Math.min(rectPreview.y0, rectPreview.y1)
    const maxY = Math.max(rectPreview.y0, rectPreview.y1)
    const a = worldToScreen(cam, minX * ts, minY * ts)
    const b = worldToScreen(cam, (maxX + 1) * ts, (maxY + 1) * ts)
    g.strokeStyle = '#00e5a8'; g.lineWidth = 1.5
    g.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y)
  }
```

- [ ] **Step 7: Wire the tool + drag lifecycle in `src/main.js`**

Add the import: `import { rectFill } from './tools/rect.js'`

Add `rectPreview: null` to the `state` object literal.

Update the `scheduleRender` call to pass it:
```js
    renderMap(stage, state.map, state.cam, state.imagesByPath, state.manifest || (state.bundle && state.bundle.manifest), state.selectedObject, state.rectPreview)
```
(`state.manifest` is set in Task 4; the `||` keeps this working until then.)

Add the rect button element + setTool toggle + onclick (mirror the others): element `const rectBtn = document.querySelector('#tool-rect')`, in setTool `rectBtn.classList.toggle('on', t === 'rect')`, and `rectBtn.onclick = () => setTool('rect')`.

Add a helper to convert a pointer to a cell (near `sizeOf`/`activeLayer`):
```js
function cellAt(sx, sy) {
  const w = screenToWorld(state.cam, sx, sy)
  return { cx: Math.floor(w.x / state.map.tileSize), cy: Math.floor(w.y / state.map.tileSize) }
}
```

In `editEvent`, add a rect branch in the tiles path (before the fill branch):
```js
  if (state.tool === 'rect') {
    if (!state.activeTile) { if (isDown) status.textContent = 'elige un frame en Tiles'; return }
    const { cx, cy } = cellAt(sx, sy)
    if (isDown) state.rectStart = { cx, cy }
    if (state.rectStart) { state.rectPreview = { x0: state.rectStart.cx, y0: state.rectStart.cy, x1: cx, y1: cy }; scheduleRender() }
    return
  }
```
Add `rectStart: null` to the `state` literal.

In the `window.mouseup` handler that resets painting (the one with `painting = false; draggingObject = false`), commit the rect:
```js
window.addEventListener('mouseup', () => {
  painting = false; draggingObject = false
  if (state.tool === 'rect' && state.rectStart && state.rectPreview) {
    const p = state.rectPreview
    if (rectFill(state.map, state.activeLayerId, p.x0, p.y0, p.x1, p.y1, state.activeTile) > 0) scheduleRender()
  }
  state.rectStart = null; state.rectPreview = null; scheduleRender()
})
```

- [ ] **Step 8: Build + tests**

Run: `PATH=/opt/homebrew/bin:$PATH npx vite build && npm test`
Expected: build ok; all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/tools/rect.js src/tools/rect.test.js index.html src/render/canvas.js src/main.js
git commit -m "feat(tools): rectangle fill with drag preview"
```

---

### Task 3: Undo / Redo (pure `history.js` + wiring)

**Files:**
- Create: `src/persist/history.js`
- Test: `src/persist/history.test.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `createHistory()`, `record(hist, snapshot)`, `undo(hist, current) -> snapshot|null`, `redo(hist, current) -> snapshot|null`. Snapshots are opaque values (project JSON). `main.js` captures `serializeProject(...)` before each action and restores via `deserializeProject`.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { createHistory, record, undo, redo } from './history.js'

describe('history', () => {
  it('undo returns the prior snapshot and redo replays it', () => {
    const h = createHistory()
    record(h, 'A')                 // before editing A -> B
    const u = undo(h, 'B')         // now at A
    expect(u).toBe('A')
    const r = redo(h, 'A')         // forward to B
    expect(r).toBe('B')
  })

  it('undo on empty history returns null', () => {
    expect(undo(createHistory(), 'X')).toBeNull()
    expect(redo(createHistory(), 'X')).toBeNull()
  })

  it('recording a new action clears the redo stack', () => {
    const h = createHistory()
    record(h, 'A'); undo(h, 'B')   // redo now has 'B'
    record(h, 'A2')               // new edit -> redo cleared
    expect(redo(h, 'A2')).toBeNull()
  })

  it('caps the undo stack at 50', () => {
    const h = createHistory()
    for (let i = 0; i < 60; i++) record(h, `s${i}`)
    expect(h.undo.length).toBe(50)
    expect(h.undo[0]).toBe('s10')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- history`
Expected: FAIL ("createHistory is not a function").

- [ ] **Step 3: Write minimal implementation**

```js
const CAP = 50

export function createHistory() { return { undo: [], redo: [] } }

// record: push the pre-action snapshot; a new action invalidates redo.
export function record(hist, snapshot) {
  hist.undo.push(snapshot)
  if (hist.undo.length > CAP) hist.undo.shift()
  hist.redo.length = 0
}

export function undo(hist, current) {
  if (!hist.undo.length) return null
  hist.redo.push(current)
  return hist.undo.pop()
}

export function redo(hist, current) {
  if (!hist.redo.length) return null
  hist.undo.push(current)
  return hist.redo.pop()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- history`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire into `src/main.js`**

Add the import: `import { createHistory, record, undo, redo } from './persist/history.js'`

Near the top (after `state`): `const history = createHistory()`.

Add two helpers (near `loadMapDocument`):
```js
function snapshot() { return state.map && state.bundle ? serializeProject(state.map, state.bundle.id) : null }
function beginAction() { const s = snapshot(); if (s) record(history, s) }
function restore(snap) { if (!snap) return; const { map } = deserializeProject(snap); loadMapDocument(map) }
```

Call `beginAction()` **before** each mutating action:
- In `editEvent`, at the start of a stroke/click that will mutate: at the top of `editEvent` when `isDown` is true AND the tool is a mutating one (`brush`/`eraser`/`fill`/`rect`) AND (for object layers) a place/move will occur. Simplest correct placement: in the `mousedown` listener that calls `editEvent(e, true)` (the paint/edit one, NOT the camera one), call `beginAction()` once before `editEvent(e, true)` when the active layer is editable and the tool mutates:
```js
stage.addEventListener('mousedown', e => {
  if (spaceDown || e.button !== 0) return
  if (state.tool !== 'eyedropper') beginAction()   // capture pre-state once per stroke/click
  painting = true
  editEvent(e, true)
})
```
- In the layer handlers (`refreshLayers` onDelete/onMove/onRename/onToggle and the `#addlayer`/`#addlayer-obj` clicks), call `beginAction()` at the start of each handler body (before the mutation).

Add the keyboard handler (near the other `keydown` listeners):
```js
window.addEventListener('keydown', e => {
  const t = e.target
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  const mod = e.ctrlKey || e.metaKey
  if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); restore(undo(history, snapshot())) }
  else if (mod && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); restore(redo(history, snapshot())) }
})
```

- [ ] **Step 6: Build + tests + manual note**

Run: `PATH=/opt/homebrew/bin:$PATH npx vite build && npm test`
Expected: build ok; all tests pass. (Undo/redo behavior verified in the final E2E.)

- [ ] **Step 7: Commit**

```bash
git add src/persist/history.js src/persist/history.test.js src/main.js
git commit -m "feat(editor): snapshot-based undo/redo (Ctrl+Z / Ctrl+Y)"
```

---

### Task 4: sheet→single override (whole-sprite objects)

**Files:**
- Modify: `src/main.js` (effective manifest + override toggle + persist)
- Modify: `src/ui/tile-picker.js` (a "imagen completa" toggle button)
- Modify: `src/persist/project.js` (persist `singleOverrides`)
- Test: `src/persist/project.test.js` (extend round-trip)

**Interfaces:**
- Consumes: the bundle manifest.
- Produces: `state.singleOverride` (a `Set` of paths) + `state.manifest` (effective manifest). `serializeProject`/`deserializeProject` carry `singleOverrides`. `openTilePicker` gains an `onToggleSingle(path, isSingle)` callback.

- [ ] **Step 1: Extend the project round-trip test** — in `src/persist/project.test.js`, add:

```js
it('carries singleOverrides through the round-trip', () => {
  const m = createMap({ tileSize: 16, cols: 3, rows: 3 })
  const out = serializeProject(m, 'cf', ['Buildings/Barn.png'])
  expect(out.singleOverrides).toEqual(['Buildings/Barn.png'])
  const back = deserializeProject(out)
  expect(back.singleOverrides).toEqual(['Buildings/Barn.png'])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- project`
Expected: FAIL (the new case; `singleOverrides` undefined).

- [ ] **Step 3: Add `singleOverrides` to `src/persist/project.js`**

Change `serializeProject(map, bundleId)` to `serializeProject(map, bundleId, singleOverrides = [])` and add `singleOverrides` to the returned object (top level, after `bundleId`):
```js
export function serializeProject(map, bundleId, singleOverrides = []) {
  return {
    kind: 'world-editor-project', version: 1, bundleId,
    singleOverrides,
    map: { tileSize: map.tileSize, cols: map.cols, rows: map.rows, layers: map.layers.map(serializeLayer) },
  }
}
```
In `deserializeProject`, add `singleOverrides` to the return:
```js
  return { bundleId: json.bundleId, singleOverrides: json.singleOverrides || [], map }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- project`
Expected: PASS (existing + new case).

- [ ] **Step 5: Effective manifest in `src/main.js`**

Add to the `state` literal: `singleOverride: new Set(),` and `manifest: null,`.

Add a builder + a getter for a single-aware entry (near `sizeOf`):
```js
function rebuildManifest() {
  if (!state.bundle) { state.manifest = null; return }
  const src = state.bundle.manifest
  const images = {}
  for (const [path, e] of Object.entries(src.images)) {
    if (state.singleOverride.has(path)) {
      const w = e.type === 'sheet' ? e.fw * e.cols : e.w
      const h = e.type === 'sheet' ? e.fh * e.rows : e.h
      images[path] = { type: 'single', w, h }
    } else images[path] = e
  }
  state.manifest = { ...src, images }
}
```
In the bundle `change` handler, after `state.bundle = { id, images, manifest }`, add `rebuildManifest()`. Change `sizeOf` to read `state.manifest` instead of `state.bundle.manifest`:
```js
function sizeOf(ref) {
  const e = state.manifest && state.manifest.images[ref.path]
  ...
}
```
Update the palette `onPick` wiring to pass the effective entry to `openTilePicker`:
```js
      const entry = state.manifest.images[image.path]
```
(and pass a single-toggle callback — Step 6).

- [ ] **Step 6: Add the "imagen completa" toggle to `src/ui/tile-picker.js`**

Add a 5th param `onToggleSingle` and render a small header button above the frame grid:
```js
export function openTilePicker(host, image, entry, onPick, onToggleSingle) {
  host.innerHTML = ''
  if (onToggleSingle) {
    const bar = document.createElement('div')
    bar.style.cssText = 'margin-bottom:6px'
    const btn = document.createElement('button')
    btn.className = 'ghost'
    btn.style.cssText = 'font-size:10px;padding:3px 6px'
    btn.textContent = entry.type === 'single' ? '✓ imagen completa' : 'usar imagen completa'
    btn.onclick = () => onToggleSingle(image.path, entry.type !== 'single')
    bar.appendChild(btn)
    host.appendChild(bar)
  }
  // ... existing frame-grid code unchanged ...
```
(Keep the rest — the `sheet ? ... : ...` logic already draws a single as one whole-image cell, so a toggled image shows one frame.)

Wire it in `main.js`'s palette `onPick`:
```js
      openTilePicker(document.querySelector('#tiles'), image, entry, (tileRef) => {
        state.activeTile = tileRef; state.activeTerrain = null
        status.textContent = `tile: ${tileRef.path} [${tileRef.col},${tileRef.row}]`
      }, (path, isSingle) => {
        if (isSingle) state.singleOverride.add(path); else state.singleOverride.delete(path)
        rebuildManifest()
        const im = state.bundle.images.find(i => i.path === path)
        openTilePicker(document.querySelector('#tiles'), im, state.manifest.images[path], /* re-open */ arguments.callee ? undefined : undefined)  // placeholder — see note
      })
```
NOTE for the implementer: factor the picker-open into a local `function openPicker(image) { openTilePicker(#tiles, image, state.manifest.images[image.path], onPickCb, onToggleSingleCb) }` and call `openPicker(image)` both from the palette click and after a toggle, to avoid the self-reference. Define `onPickCb`/`onToggleSingleCb` once. Keep behavior: pick sets activeTile; toggle updates the override set, `rebuildManifest()`, and re-opens the picker for the same image.

- [ ] **Step 7: Persist overrides in save/load (`src/main.js`)**

In `#save` and `autosave`, pass the overrides: `serializeProject(state.map, state.bundle.id, [...state.singleOverride])`. In `loadMapDocument` / the load + boot-restore paths, after obtaining the deserialized `{ singleOverrides }`, set `state.singleOverride = new Set(singleOverrides || [])` then `rebuildManifest()` before rendering. (Thread `singleOverrides` out of `deserializeProject` where those flows call it.)

- [ ] **Step 8: Build + tests**

Run: `PATH=/opt/homebrew/bin:$PATH npx vite build && npm test`
Expected: build ok; all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/main.js src/ui/tile-picker.js src/persist/project.js src/persist/project.test.js
git commit -m "feat(editor): sheet→single override — place whole sprites as objects"
```

---

### Task 5: Autotile core (model terrains + pure `autotile.js`)

**Files:**
- Modify: `src/map/model.js` (add `terrains: []` + `addTerrain`)
- Modify: `src/map/model.test.js` (terrain op test)
- Create: `src/tools/autotile.js`
- Test: `src/tools/autotile.test.js`

**Interfaces:**
- Consumes: `getCell` (model).
- Produces: `addTerrain(map, name, path, ox, oy) -> Terrain`; `roleFor(n,e,s,w) -> string`; `terrainRef(terrain, role) -> TileRef`; `resolveCell(map, layer, x, y, terrainsById) -> TileRef | null`.

- [ ] **Step 1: Add `terrains` + `addTerrain` to the model**

In `src/map/model.js`, add `terrains: []` to the `createMap` return object (after `layers: []`), and append:
```js
export function addTerrain(map, name, path, ox, oy) {
  const t = { id: `T${map._nextId++}`, name, path, ox, oy }
  map.terrains.push(t)
  return t
}
```

Add to `src/map/model.test.js`:
```js
it('adds an autotile terrain with a T-prefixed id', () => {
  const m = createMap({ tileSize: 16, cols: 3, rows: 3 })
  const t = addTerrain(m, 'Agua', 'Water_Tile_1.png', 0, 0)
  expect(t).toEqual({ id: 'T1', name: 'Agua', path: 'Water_Tile_1.png', ox: 0, oy: 0 })
  expect(m.terrains).toEqual([t])
})
```
(extend the model import with `addTerrain`.)

- [ ] **Step 2: Write the failing autotile test**

```js
import { describe, it, expect } from 'vitest'
import { roleFor, terrainRef, resolveCell } from './autotile.js'
import { createMap, setCell } from '../map/model.js'

const T = { id: 'T1', name: 'Agua', path: 'W.png', ox: 0, oy: 0 }

describe('roleFor (n,e,s,w on = same terrain neighbor present)', () => {
  it('all sides on → center', () => expect(roleFor(true, true, true, true)).toBe('center'))
  it('top open → n', () => expect(roleFor(false, true, true, true)).toBe('n'))
  it('top-left open → nw', () => expect(roleFor(false, true, true, false)).toBe('nw'))
  it('isolated → center (fallback)', () => expect(roleFor(false, false, false, false)).toBe('center'))
})

describe('terrainRef maps role → 3×3 cell', () => {
  it('center is the middle cell', () => expect(terrainRef(T, 'center')).toEqual({ path: 'W.png', col: 1, row: 1 }))
  it('nw is the top-left cell', () => expect(terrainRef(T, 'nw')).toEqual({ path: 'W.png', col: 0, row: 0 }))
  it('se is the bottom-right cell', () => expect(terrainRef(T, 'se')).toEqual({ path: 'W.png', col: 2, row: 2 }))
})

describe('resolveCell', () => {
  const terrainsById = { T1: T }
  it('resolves a terrain cell to an edge frame from neighbors', () => {
    const m = createMap({ tileSize: 16, cols: 3, rows: 1 })
    const id = m.layers[0].id
    setCell(m, id, 0, 0, { terrain: 'T1' })
    setCell(m, id, 1, 0, { terrain: 'T1' })   // (0,0): E on, N/S/W off → role for (n=F,e=T,s=F,w=F)
    expect(resolveCell(m, m.layers[0], 0, 0, terrainsById)).toEqual(terrainRef(T, roleFor(false, true, false, false)))
  })
  it('passes a plain TileRef through unchanged', () => {
    const m = createMap({ tileSize: 16, cols: 2, rows: 1 })
    const id = m.layers[0].id
    const ref = { path: 'g.png', col: 1, row: 0 }
    setCell(m, id, 0, 0, ref)
    expect(resolveCell(m, m.layers[0], 0, 0, {})).toEqual(ref)
  })
  it('returns null for an empty cell', () => {
    const m = createMap({ tileSize: 16, cols: 2, rows: 1 })
    expect(resolveCell(m, m.layers[0], 0, 0, {})).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- autotile`
Expected: FAIL ("roleFor is not a function").

- [ ] **Step 4: Write minimal implementation**

```js
import { getCell } from '../map/model.js'

// roleFor: ports the game's edgeTileName 9-cell picker. n/e/s/w = same-terrain
// neighbor present. Returns center / n/s/e/w / nw/ne/sw/se.
export function roleFor(n, e, s, w) {
  const offN = !n, offE = !e, offS = !s, offW = !w
  if (!offN && !offE && !offS && !offW) return 'center'
  if (offN && offW && !offE && !offS) return 'nw'
  if (offN && offE && !offW && !offS) return 'ne'
  if (offS && offW && !offE && !offN) return 'sw'
  if (offS && offE && !offW && !offN) return 'se'
  if (offN && !offE && !offS && !offW) return 'n'
  if (offS && !offE && !offN && !offW) return 's'
  if (offW && !offN && !offE && !offS) return 'w'
  if (offE && !offN && !offS && !offW) return 'e'
  return 'center'
}

const ROLE_XY = {
  nw: [0, 0], n: [1, 0], ne: [2, 0],
  w: [0, 1], center: [1, 1], e: [2, 1],
  sw: [0, 2], s: [1, 2], se: [2, 2],
}

// terrainRef: role → the concrete TileRef in the terrain's 3×3 block.
export function terrainRef(terrain, role) {
  const [dc, dr] = ROLE_XY[role]
  return { path: terrain.path, col: terrain.ox + dc, row: terrain.oy + dr }
}

const isTerrain = (v, id) => !!v && v.terrain === id

// resolveCell: a {terrain:id} cell → its edge frame from 4 same-terrain neighbors;
// a plain TileRef → itself; empty → null.
export function resolveCell(map, layer, x, y, terrainsById) {
  const v = layer.cells.get(`${x},${y}`)
  if (!v) return null
  if (!v.terrain) return v
  const t = terrainsById[v.terrain]
  if (!t) return null
  const on = (dx, dy) => isTerrain(layer.cells.get(`${x + dx},${y + dy}`), v.terrain)
  return terrainRef(t, roleFor(on(0, -1), on(1, 0), on(0, 1), on(-1, 0)))
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- autotile model`
Expected: PASS (autotile cases + model terrain case).

- [ ] **Step 6: Commit**

```bash
git add src/map/model.js src/map/model.test.js src/tools/autotile.js src/tools/autotile.test.js
git commit -m "feat(map): autotile core — terrains + 9-cell resolveCell (ports edgeTileName)"
```

---

### Task 6: Autotile render + painting integration

**Files:**
- Modify: `src/render/canvas.js` (resolve tiles cells through `resolveCell`)
- Modify: `src/tools/fill.js` (`sameRef` handles terrain markers)
- Modify: `src/main.js` (pass terrains to render; painting writes terrain markers when a terrain is active)

**Interfaces:**
- Consumes: `resolveCell` (Task 5).
- Produces: rendering that draws terrain cells as their resolved edge frames; brush/fill/rect writing `{terrain:id}` when `state.activeTile` is a terrain marker.

- [ ] **Step 1: Render tiles cells via `resolveCell`** — in `src/render/canvas.js`, import `resolveCell`, change `renderMap` to accept a trailing `terrainsById = {}` param, and in the tiles-layer draw loop replace the per-cell `ref` read with a resolved ref:

```js
import { resolveCell } from '../tools/autotile.js'
// signature: renderMap(canvas, map, cam, imagesByPath, manifest, selected, rectPreview, terrainsById = {})
```
In the tiles branch, instead of iterating `layer.cells` for a raw `ref`, iterate keys and resolve:
```js
    for (const k of layer.cells.keys()) {
      const c = k.indexOf(',')
      const cx = +k.slice(0, c), cy = +k.slice(c + 1)
      const ref = resolveCell(map, layer, cx, cy, terrainsById)
      if (!ref) continue
      const img = imagesByPath[ref.path]
      if (!img || !img.complete || !img.naturalWidth) continue
      const s = worldToScreen(cam, cx * ts, cy * ts)
      g.drawImage(img, ref.col * ts, ref.row * ts, ts, ts, s.x, s.y, dz, dz)
    }
```

- [ ] **Step 2: `sameRef` handles terrain markers in `src/tools/fill.js`**

Replace `sameRef` so terrain markers compare by id:
```js
function sameRef(a, b) {
  if (!a && !b) return true
  if (!a || !b) return false
  if (a.terrain || b.terrain) return a.terrain === b.terrain
  return a.path === b.path && a.col === b.col && a.row === b.row
}
```

- [ ] **Step 3: Wire terrains into render + painting in `src/main.js`**

Build a `terrainsById` and pass it to render. Add a helper:
```js
function terrainsById() {
  const by = {}
  if (state.map) for (const t of state.map.terrains) by[t.id] = t
  return by
}
```
Update the `scheduleRender` call to append it:
```js
    renderMap(stage, state.map, state.cam, state.imagesByPath, state.manifest || (state.bundle && state.bundle.manifest), state.selectedObject, state.rectPreview, terrainsById())
```

Painting already writes `state.activeTile` via `paintAt`/`floodFill`/`rectFill`; those `setCell` whatever value they're given. So when `state.activeTile` is a terrain marker `{terrain:id}`, cells receive the marker — no change needed in the paint functions beyond Step 2's `sameRef`. Ensure the **objects** branch rejects a terrain marker (a terrain can't be an object): in `editEvent`'s objects branch, guard the place path:
```js
      else if (state.activeTile && !state.activeTile.terrain) {
        // ... existing addObject ...
      } else { state.selectedObject = null; if (state.activeTile && state.activeTile.terrain) status.textContent = 'los terrenos autotile solo van en capas de tiles' }
```

- [ ] **Step 4: Build + tests**

Run: `PATH=/opt/homebrew/bin:$PATH npx vite build && npm test`
Expected: build ok; all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/render/canvas.js src/tools/fill.js src/main.js
git commit -m "feat(editor): render autotile terrain cells + paint terrain markers"
```

---

### Task 7: Autotile export/project + terrain-define UI

**Files:**
- Modify: `src/persist/export.js` (resolve terrain cells to concrete frames + emit terrains)
- Test: `src/persist/export.test.js` (extend)
- Modify: `src/persist/project.js` (persist `terrains`; cells pass through the `{terrain}` union)
- Test: `src/persist/project.test.js` (extend)
- Modify: `index.html` (a "+ terreno" control + Terrenos palette section styling)
- Modify: `src/main.js` (define a terrain from the open image; a Terrenos list to select `state.activeTile = {terrain:id}`)

**Interfaces:**
- Consumes: `resolveCell`, `terrainRef` (Task 5).
- Produces: export that emits `terrains` and resolved `frame` (+ a `terrain` id) per autotile cell; project round-trip carrying `terrains` and `{terrain}` cells; a terrain-definition + selection UI.

- [ ] **Step 1: Extend export + project tests**

In `src/persist/export.test.js`, add a case: a map with a terrain + two adjacent terrain cells exports `terrains: [{id,name,path,ox,oy}]` and each tile cell has a resolved `frame` string (via `terrainRef(roleFor(...))`) plus a `terrain` id field. In `src/persist/project.test.js`, add a case: `serializeProject`→`deserializeProject` preserves `map.terrains` and a `{terrain:'T1'}` cell (as `{x,y,ref:{terrain:'T1'}}`).

(Write concrete `toEqual` assertions mirroring the Task-5 `resolveCell` result for a known 2-cell layout.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- export project`
Expected: FAIL (terrains/terrain-cell handling missing).

- [ ] **Step 3: Implement export handling** — in `src/persist/export.js`, import `resolveCell` + add `terrains` to the output and resolve each tile cell:

```js
import { resolveCell } from '../tools/autotile.js'

export function exportMap(map, bundleId) {
  const terrainsById = {}
  for (const t of map.terrains || []) terrainsById[t.id] = t
  return {
    version: 1, tileSize: map.tileSize,
    world: { w: map.cols * map.tileSize, h: map.rows * map.tileSize },
    bundles: [{ id: bundleId }],
    terrains: (map.terrains || []).map(t => ({ id: t.id, name: t.name, path: t.path, ox: t.ox, oy: t.oy })),
    layers: map.layers.map(l => l.type === 'objects' ? exportObjectLayer(l) : exportTileLayer(l, map, terrainsById)),
  }
}

function exportTileLayer(l, map, terrainsById) {
  const cells = []
  for (const k of l.cells.keys()) {
    const c = k.indexOf(',')
    const x = +k.slice(0, c), y = +k.slice(c + 1)
    const ref = resolveCell(map, l, x, y, terrainsById)
    if (!ref) continue
    const v = l.cells.get(k)
    const cell = { x, y, frame: `${ref.path}#${ref.col},${ref.row}` }
    if (v.terrain) cell.terrain = v.terrain
    cells.push(cell)
  }
  return { name: l.name, type: 'tiles', cells }
}
```
Keep `frameStr`/`exportObjectLayer` as-is.

- [ ] **Step 4: Implement project handling** — in `src/persist/project.js`, add `terrains` to serialize/deserialize, and let tile cells carry either union member (the existing code stores `ref` verbatim, so a `{terrain:id}` value already round-trips — just confirm `serializeLayer`/deserialize copy `c.ref` unchanged). Add:
```js
// serialize: include terrains
map: { tileSize: map.tileSize, cols: map.cols, rows: map.rows, terrains: map.terrains || [], layers: map.layers.map(serializeLayer) },
// deserialize: rebuild terrains + _nextId high-water
const map = { tileSize: m.tileSize, cols: m.cols, rows: m.rows, layers: [], terrains: (m.terrains || []).map(t => ({ ...t })), _nextId: 0 }
```
After building layers, bump `_nextId` past any existing `T`/`L`/`O` numeric suffix so new ids don't collide:
```js
  const maxId = Math.max(0, ...map.terrains.map(t => +String(t.id).slice(1) || 0), ...map.layers.map(l => +String(l.id).slice(1) || 0))
  map._nextId = maxId + 1
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- export project`
Expected: PASS.

- [ ] **Step 6: Terrain UI in `index.html`**

In the Tiles-picker area or the Bundle panel, the terrain controls are rendered by main.js into a container. Add a container after `#tiles`:
```html
      <h2>Terrenos (autotile)</h2>
      <div id="terrains"><span class="lbl" style="color:var(--muted)">abre una imagen 3×3 (agua/camino) y pulsa "+ terreno"</span></div>
```
And in the Tiles-picker header (added in Task 4's toggle bar), the implementer adds a second button `+ terreno` alongside `imagen completa`.

- [ ] **Step 7: Terrain define + select in `src/main.js`**

Add a `+ terreno` action to the picker header (Task 4's bar): when clicked with an image open, `const t = addTerrain(state.map, prompt('Nombre del terreno','Agua') || 'Terreno', image.path, 0, 0); refreshTerrains()`. (Uses the image's top-left 3×3 at origin 0,0 — the cute-fantasy water/path default; the origin can be tuned by editing later.)

Add `refreshTerrains()` that renders `state.map.terrains` into `#terrains` as clickable chips; clicking one sets `state.activeTerrain = t.id; state.activeTile = { terrain: t.id }; status.textContent = 'terreno: ' + t.name`. Call `refreshTerrains()` on map create/load and after `addTerrain`.

Import `addTerrain` from the model. Ensure `beginAction()` (Task 3) is called before `addTerrain` so it's undoable.

- [ ] **Step 8: Build + full tests**

Run: `PATH=/opt/homebrew/bin:$PATH npx vite build && npm test`
Expected: build ok; all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/persist/export.js src/persist/export.test.js src/persist/project.js src/persist/project.test.js index.html src/main.js
git commit -m "feat(editor): autotile export/persist + terrain define/select UI"
```

---

## Self-Review

**Spec coverage:**
- Eyedropper → Task 1. Rectangle → Task 2. Undo/redo → Task 3. sheet→single → Task 4. Autotile core → Task 5; render+paint → Task 6; export/project/UI → Task 7. ✓
- Deferred items (stamps, rotate/flip, minimap, resize, favorites, grid toggle) absent. ✓

**Type consistency:** `CellVal = TileRef | {terrain:id}` written by paint/fill/rect/eyedropper (via generic `state.activeTile`), stored by `setCell`, matched by `fill.js` `sameRef` (Task 6), resolved by `resolveCell` (Task 5) in render (Task 6) and export (Task 7), passed through by `project.js` (Task 7). `Terrain {id,name,path,ox,oy}` from `addTerrain`, indexed by `terrainsById()` (main) / built inline (export). `state.manifest` (effective) read by `sizeOf`/`frameSrc`/picker after Task 4; `renderMap` receives it via the `||` fallback until then. `renderMap` grows to `(canvas,map,cam,imagesByPath,manifest,selected,rectPreview,terrainsById)` — the single call site in `scheduleRender` is updated in Tasks 2 and 6.

**Placeholder scan:** Task 4 Step 6 contains a NOTE directing the implementer to factor a local `openPicker(image)` helper (the inline `arguments.callee` line is illustrative, not literal) — the note gives the exact required behavior. All other steps carry complete code.

**Manual E2E (controller, after Task 7):** dev server + Playwright — rectangle-fill grass; eyedrop a tile and paint elsewhere; undo (Ctrl+Z) a stroke and redo (Ctrl+Y); mark a building "imagen completa" and place it whole on an objects layer; define a water terrain from a 3×3 water sheet, paint a lake, and assert edge cells resolve to different frames than the interior (export JSON shows distinct `frame` strings per edge); 0 page errors.
