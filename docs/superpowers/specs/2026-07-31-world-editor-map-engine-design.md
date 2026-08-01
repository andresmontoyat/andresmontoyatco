# World Editor — Map Engine Design Spec (Milestone 2)

**Date:** 2026-07-31
**Status:** Approved (design), pending implementation
**Parent spec:** `2026-07-31-world-editor-design.md`
**Repo:** `world-editor` (standalone; `.../codehunters/tools/world-editor`)

## Summary

The map engine turns the World Editor from a bundle browser into an actual
map authoring tool. This milestone delivers the foundation plus a first
usable painting flow: create a fixed-size map, pan/zoom a gridded canvas,
manage a free stack of layers, pick a specific tile frame from a sheet, and
paint/erase tiles on the active layer with live rendering.

The data model is designed for the full vision (free layers, object layers,
the complete Tiled-style toolset). Only a slice is implemented this session;
the rest is explicitly deferred.

## Scope This Milestone

**In:**
- New-map dialog: choose `cols × rows`; `tileSize` comes from the active bundle.
- Camera: pan (space-drag or middle-button drag) and wheel zoom centered on cursor; grid overlay scaled to zoom.
- Free layers: a layers panel to add, delete, reorder, rename, and toggle visibility. Active-layer highlight. All layers are `tiles` type this slice.
- Tile picker: click a palette image (a sheet) to expand it into its frame grid; click a frame to set the active tile.
- Painting: brush (place active tile; drag to paint multiple cells) and eraser (clear a cell) on the active tile layer. Live canvas render.
- Pure, unit-tested `map/model.js` and `map/camera.js`.

**Deferred (NOT this milestone):**
- Remaining tools: rectangle fill, bucket/flood fill, eyedropper, selection/move.
- Object layers and free object placement.
- Project save/load.
- Generic export writer.
- Map resize.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Layer model | Free layers: add/delete/reorder/rename/hide, named |
| Toolset target | Full Tiled-style (brush/eraser/rect/bucket/eyedropper/select) — brush+eraser this slice |
| World size | Fixed `cols × rows` at creation, resizable later (resize deferred) |
| Camera | Pan (space/middle-drag) + wheel zoom at cursor + grid overlay |
| `cells` mutability | Mutable Map for paint perf (see below) — approved exception |
| Tile selection | Per-frame tile picker expanding a sheet into its frame grid |

## Architecture

New modules alongside the existing `bundle/` and `catalog/`:

```
map/model.js        Map document + operations (create, layers, cells). Pure-ish, tested.
map/camera.js       Pan/zoom screen<->world transforms. Pure math, tested.
render/canvas.js    Draws grid + visible layers (sheet frames) under the camera transform.
tools/paint.js      Brush/eraser: pointer event -> setCell/clearCell on the active layer.
ui/layers-panel.js  Free-layer panel: add/delete/reorder/rename/toggle-visibility.
ui/tile-picker.js   Expands a palette sheet into its frame grid -> active TileRef.
ui/new-map.js       New-map dialog (cols x rows; tileSize from bundle).
main.js             Orchestrates editor state (active layer, active tile, active tool) + wiring.
```

The existing `catalog/palette.js` stays the bundle browser; `ui/tile-picker.js`
is the per-frame drill-down used for painting.

## Data Model (`map/model.js`)

```js
Map     = { tileSize, cols, rows, layers: [Layer], objects: [] }  // objects[] reserved, empty this slice
Layer   = { id, name, type: 'tiles', visible: true, cells: Map<"x,y", TileRef> }
TileRef = { path, col, row }   // which bundle image (sheet), which cell of that sheet
```

- `cells` is a `Map` keyed `"x,y"` → **sparse**: only painted cells are stored. Matches the parent spec's `cells[]` export shape.
- A `TileRef` resolves for rendering via the bundle manifest: `sx = col * fw`, `sy = row * fh`, drawn from that image's object URL.
- World pixel size = `cols * tileSize × rows * tileSize`.
- Layer `id` is a stable string generated at creation (a monotonic counter on the map document — no `Math.random`/`Date.now`, both unavailable and non-deterministic for tests).

### Operations (pure-ish, deterministic, tested)

```
createMap({ tileSize, cols, rows }) -> Map          // seeds one default layer "Capa 1"
addLayer(map, name) -> Layer                         // appends a tiles layer, returns it
removeLayer(map, layerId) -> void
moveLayer(map, layerId, dir) -> void                 // dir: -1 up / +1 down in the stack
renameLayer(map, layerId, name) -> void
setLayerVisible(map, layerId, visible) -> void
setCell(map, layerId, x, y, tileRef) -> void         // mutates that layer's cells Map (O(1))
clearCell(map, layerId, x, y) -> void
getCell(map, layerId, x, y) -> TileRef | undefined
```

### Mutability exception (approved)

The global coding rule is "domain models immutable, return new instances."
An interactive canvas editor with drag-painting mutates hundreds of cells per
stroke; cloning the document per cell would be unusably slow. Therefore:

- `cells` is **mutated in place** by `setCell`/`clearCell` (O(1) per cell).
- Layer-list structural ops (`addLayer`/`removeLayer`/`moveLayer`) may return
  new arrays, but operate on the same map document.

These operations remain deterministic and unit-testable (given a map + args,
the resulting state is fixed). This is a deliberate, scoped exception for
perf-critical editor state — not a pattern for backend domain models.

## Camera (`map/camera.js`)

```js
Camera = { x, y, zoom }   // x,y = world coords at the screen origin; zoom = px per world px
screenToWorld(cam, sx, sy) -> { x, y }
worldToScreen(cam, wx, wy) -> { x, y }
zoomAt(cam, screenX, screenY, factor) -> Camera   // keeps the point under the cursor fixed
pan(cam, dxScreen, dyScreen) -> Camera
```

Pure math, fully unit-tested (round-trip `screenToWorld`/`worldToScreen`,
zoom keeps the cursor-anchored world point fixed).

## Rendering (`render/canvas.js`)

- Applies the camera transform, then draws:
  1. the map background (world bounds rect),
  2. each **visible** layer bottom→top: iterate its `cells`, resolve each
     `TileRef` to a source rect on the sheet image, draw at the cell's world
     position (`x * tileSize`, `y * tileSize`), pixel-perfect
     (`imageSmoothingEnabled = false`),
  3. a grid overlay sized to `tileSize` scaled by zoom.
- Redraws on any model/camera/tool change (a single `requestAnimationFrame`
  scheduler; no per-cell full-map React-style diffing).

## Interaction

- **Active state** (in `main.js`): active layer id, active `TileRef`, active
  tool (`brush` | `eraser`).
- **Brush:** pointer-down/drag on the canvas → convert screen→world→cell →
  `setCell(activeLayer, cell, activeTile)` if a tile is selected and the
  layer is visible.
- **Eraser:** same path → `clearCell`.
- **Pan/zoom** take priority over painting while space/middle-button is held.
- **Layers panel:** reorder (buttons or drag), rename (inline), visibility
  toggle, add/delete; clicking a row sets the active layer.
- **Tile picker:** clicking a palette image opens its frame grid (cols×rows
  from the manifest); clicking a frame sets the active `TileRef`
  (`{ path, col, row }`).

## Testing

- `map/model.js`: pure unit tests — create seeds one layer; add/remove/move/
  rename/toggle; set/clear/get cell; sparse storage (only painted cells
  present); layer id determinism.
- `map/camera.js`: pure unit tests — screen↔world round-trip; `zoomAt` keeps
  the cursor world-point fixed; `pan` offsets correctly.
- Canvas / tools / panels: Playwright E2E (create map → pick a tile → paint a
  few cells → screenshot; toggle a layer's visibility → cells hide), mirroring
  the loader milestone's E2E approach. No committed Playwright spec yet
  (deferred to a later milestone — run ad hoc as in loader).

## Open Questions (resolve during implementation)

- Grid overlay visibility toggle + when to fade it at low zoom (default: always on this slice).
- Exact layer-reorder affordance (up/down buttons vs drag) — buttons are simpler; pick during UI task.
- Default new-map dimensions in the dialog (propose 60 × 45).
