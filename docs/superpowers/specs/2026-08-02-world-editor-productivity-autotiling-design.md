# World Editor — Productivity + Autotiling Design Spec (Milestone 4)

**Date:** 2026-08-02
**Status:** Approved (design), pending implementation
**Parent specs:** the three prior world-editor specs (design, map-engine, persistence-objects)
**Repo:** `world-editor` (standalone; `.../codehunters/tools/world-editor`, branch `master`, origin on GitHub)

## Summary

Five additions that make building a world faster and nicer: an **eyedropper**
and **rectangle fill** tool, **undo/redo**, a **sheet→single override** so whole
sprites (buildings, trees) place as one object, and **autotiling** so water and
roads blend their edges automatically instead of reading as hard squares.

Ordered so value lands incrementally and the riskiest piece (autotiling) is last:
eyedropper → rectangle → undo/redo → sheet→single → autotiling.

## Scope This Milestone

All five, in that order. Deferred (still not this milestone): stamps/multi-tile
brushes, object rotate/flip/duplicate, minimap, map resize, tile favorites,
grid toggle, base64 packing, multiple projects.

## 1. Eyedropper (`Cuentagotas` tool)

- New toolbar tool. On a **tiles** layer: click a cell → `state.activeTile` becomes that cell's value (a `TileRef` or an autotile terrain ref — see §5). On an **objects** layer: click an object → `activeTile` becomes that object's `ref`.
- If the clicked cell/object is empty, no change (status hint).
- Pure helper `pickAt(map, layerId, cam, screenX, screenY)` → the ref under the cursor or null (reuses the cell math and `hitObject`).

## 2. Rectangle fill (`Rectángulo` tool)

- New toolbar tool for tiles layers. `mousedown` at cell A → drag → `mouseup` at cell B fills the inclusive rect `[minX..maxX] × [minY..maxY]` with `state.activeTile`.
- Live preview while dragging: render the pending rect outline (no commit until mouseup).
- Pure `rectFill(map, layerId, x0, y0, x1, y1, ref) -> count` (mutates cells; clamps to bounds; normalizes min/max).
- One drag = one undo entry (§3).

## 3. Undo / Redo (snapshot-based)

- A `history` module holds two stacks of **serialized project snapshots** (`serializeProject` output — no images, sparse cells, cheap).
- **Before** each committed mutating action, push the *current* snapshot to the undo stack and clear redo: paint stroke (once per stroke, captured at `mousedown` start), bucket fill, rectangle fill, object place / move / delete, layer add / remove / reorder / rename / visibility.
- `Ctrl+Z` (or `Cmd+Z`) → undo: push current to redo, pop undo, `deserializeProject` it, `loadMapDocument`. `Ctrl+Y` / `Ctrl+Shift+Z` → redo (symmetric).
- Cap each stack at 50; drop oldest.
- Undo/redo restore the map only (not the camera). Bundle stays loaded (snapshots reference it by id, already the case).
- Pure `history.js`: `createHistory()`, `record(hist, snapshot)`, `undo(hist, current) -> snapshot|null`, `redo(hist, current) -> snapshot|null`. `main.js` owns snapshot capture timing.

## 4. sheet→single override (whole-sprite objects)

- Problem: the manifest over-slices large sprites (a 96×96 building → a `sheet`), so buildings/trees can only be placed as 16px frames.
- Fix: a per-bundle **override set** `state.singleOverride` (a `Set` of image paths marked "whole image"). A button in the Tiles-picker header — **"imagen completa"** — toggles the currently-opened image.
- Resolution: `sizeOf`, `frameSrc` (render), and `openTilePicker` consult the override — if a path is overridden, treat its entry as `{ type: 'single', w, h }` (whole image; a single 1-cell picker frame at col0,row0 drawn/sized as the full image).
- Persistence: the override set is saved in the project file (`singleOverrides: [path,...]`) and restored on load. Export is unaffected (a single ref exports as `path#0,0`; the game's loader draws the whole image for a single — documented in the export note).
- Placing an overridden image on an objects layer yields a full-size, bottom-center object.

## 5. Autotiling (terrain edges)

Ports the game's proven 9-cell rounded-island picker (`edgeTileName(prefix, n, e, s, w)` in `src/game/render/tiles.js`): center + 4 straight edges + 4 outer corners, chosen from the 4-direction same-terrain neighbor mask.

### Terrain definition

- An **autotile terrain** is defined by the user from a bundle sheet that is a 3×3 rounded-tile block (e.g. cute-fantasy `Water_Tile_1`, `Path_Tile`). The user picks the sheet and its top-left 3×3 origin; the editor maps the 3×3 to the 9 roles in the standard layout:
  ```
  (0,0)=nw (1,0)=n (2,0)=ne
  (0,1)=w  (1,1)=center (2,1)=e
  (0,2)=sw (1,2)=s (2,2)=se
  ```
- A terrain = `{ id, name, path, ox, oy }` (sheet path + 3×3 origin col/row). Frame for role R = `{ path, col: ox + dc(R), row: oy + dr(R) }`.
- Terrains live in `map.terrains = [Terrain]` (ids from `_nextId`, `T` prefix), saved in the project + emitted in export.
- MVP definition UI: a **"+ terreno autotile"** control that, with an image open in the picker, asks for a name and uses the picker's current selection as the 3×3 top-left origin (defaults 0,0). (A guided 9-cell click flow is deferred; the 3×3-origin assumption covers the cute-fantasy water/path sheets.)

### Cell model change

- A tiles-layer cell value becomes **either** a plain `TileRef {path,col,row}` **or** an autotile marker `{ terrain: id }`.
- Painting/filling/rect with an **active terrain** (rather than an active frame) writes `{ terrain: id }` into cells.
- **Resolution** (`autotile.js`, pure): `resolveTerrainFrame(map, layer, x, y)` → for a `{terrain:id}` cell, read the 4 neighbors (same terrain id = "on"), call `edgeTileName`-equivalent to get the role, map role → `TileRef` via the terrain's origin. Plain `TileRef` cells resolve to themselves.
- Render (`canvas.js`) and export resolve every tiles cell through `resolveTerrainFrame`; painting a neighbor implicitly re-resolves edges (resolution reads live neighbors each render).

### Active-terrain selection

- The palette/picker gains a small **"Terrenos"** section listing defined autotile terrains; clicking one sets `state.activeTerrain` (and clears `activeTile`); clicking a normal frame sets `activeTile` (and clears `activeTerrain`). The brush/bucket/rect write terrain markers when a terrain is active, frames otherwise.

### Export

- Autotile cells export as their **resolved concrete frame** (`frame: "path#col,row"`), so a game with no autotile support still loads a correct-looking map. (Optionally also emit `terrains` + a `terrain` field per cell for engines that want to re-autotile; include both — resolved `frame` for compatibility, `terrain` id as extra.)

## Data-model summary (after this milestone)

```
Map     = { tileSize, cols, rows, layers:[Layer], terrains:[Terrain], _nextId }
Layer(tiles)   = { id, name, type:'tiles', visible, cells: Map<"x,y", CellVal> }
CellVal = TileRef | { terrain: id }
TileRef = { path, col, row }
Terrain = { id, name, path, ox, oy }
```

`createMap` seeds `terrains: []`. `serializeProject`/`deserializeProject`,
`exportMap`, and `render` all handle the `CellVal` union + `terrains` +
`singleOverrides`.

## Tools / UI additions

- Toolbar: **Cuentagotas**, **Rectángulo** (join Pincel/Borrador/Balde). Tool state extends to `'brush' | 'eraser' | 'fill' | 'eyedropper' | 'rect'`.
- Tiles-picker header: **"imagen completa"** toggle + **"+ terreno autotile"**.
- Palette: a **Terrenos** section for defined terrains.
- Keyboard: `Ctrl/Cmd+Z` undo, `Ctrl+Y` / `Ctrl+Shift+Z` redo (guarded against input focus).

## Testing

- Pure unit tests (Vitest, TDD): `rectFill` (bounds/normalize/count); `history` (record/undo/redo, cap, redo-cleared-on-record); `pickAt` (cell/object ref pick); `autotile` (`resolveTerrainFrame` role selection for center/edges/corners + neighbor masks, matching the game's `edgeTileName` cases); model terrain ops + `CellVal` handling; project round-trip with terrains + terrain cells + singleOverrides; export with resolved autotile frames.
- UI (eyedropper, rectangle preview, undo/redo, single toggle, terrain paint): Playwright E2E — define a water terrain, paint a lake, verify edge frames differ from center; rectangle-fill a grass area; eyedrop a tile; undo/redo a stroke; mark a building single and place it whole.

## Open questions (resolve during implementation)

- Exact 3×3 origin for the cute-fantasy `Water_Tile_1` / cobble-road sheets (inspect the sheet; default 0,0, adjust once).
- Whether undo also captures single-override / terrain-definition changes (propose: yes, they're map-affecting) — snapshot already includes them if stored on the map/project.
- Rectangle preview rendering path (a transient overlay vs a temp cell write) — propose a transient overlay drawn in `renderMap` from `state.rectPreview`.
