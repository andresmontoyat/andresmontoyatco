# World Editor — Persistence + Export + Object Layers Design Spec (Milestone 3)

**Date:** 2026-08-02
**Status:** Approved (design), pending implementation
**Parent specs:** `2026-07-31-world-editor-design.md`, `2026-07-31-world-editor-map-engine-design.md`
**Repo:** `world-editor` (standalone; `.../codehunters/tools/world-editor`, branch `master`, origin on GitHub)

## Summary

The closing milestone that makes the editor actually usable: a painted map can be
**saved, reloaded, and exported** to an engine-neutral file, and maps can carry
**freely-placed objects** (trees, buildings) on object-type layers alongside tile
layers. After this, the editor fulfills its purpose — design a map, get a file a
game can load.

## Scope This Milestone

**In:**
- **Object layers** — a new `'objects'` layer type holding freely-placed sprites
  (pixel position, bottom-anchored, not grid-snapped), coexisting in the same
  reorderable/hideable layer stack as tile layers.
- **Object placement UX** — place the active sprite on an active object layer,
  select + drag to move, delete.
- **Persistence** — save/load a project `.json` (map + layers + refs, NOT images)
  plus localStorage autosave; reload re-links to the bundle by re-importing the ZIP.
- **Export** — a generic, engine-neutral map JSON writer (the parent spec's format).
- Pure, unit-tested model + export logic; UI verified by Playwright E2E.

**Deferred (NOT this milestone, do not implement):**
- Remaining tile tools: rectangle fill, bucket/flood, eyedropper, multi-select.
- Map resize.
- Base64 image packing into the project file.
- Multiple saved projects / project browser (single current project only).

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| "Finished" definition | MVP usable = persistence + export + object layers |
| Bundle in project file | Referenced by id/path; re-import ZIP on load (Tiled-style) |
| Object placement | Free pixel position, bottom-anchored, not grid-snapped |
| Object/tile layers | Both live in one reorderable stack; type discriminator on `Layer` |
| Top-level `objects[]` | Retired — objects live on object-type layers |
| Project scope | Single current project (localStorage autosave + file save/load) |

## Model Changes (`map/model.js`)

Extend `Layer` with a type discriminator. Tile layers keep `cells`; object layers
carry `items`.

```js
Layer(tiles)   = { id, name, type: 'tiles',   visible: true, cells: Map<"x,y", TileRef> }
Layer(objects) = { id, name, type: 'objects', visible: true, items: [ObjectItem] }
TileRef        = { path, col, row }
ObjectItem     = { id, ref: TileRef, x, y }   // x,y = world pixels, bottom-anchored, free
```

- `createMap` still seeds one default **tiles** layer named `Capa 1`.
- The reserved top-level `map.objects = []` is removed; nothing referenced it.
- Object ids come from the same per-map `_nextId` counter (deterministic, no
  `Math.random`/`Date.now`).

New pure operations (deterministic, unit-tested), alongside the existing layer/cell ops:

```
addObjectLayer(map, name) -> Layer            // appends a type:'objects' layer, returns it
addObject(map, layerId, ref, x, y) -> ObjectItem   // appends item with a fresh id, returns it
moveObject(map, layerId, objectId, x, y) -> void   // updates item x,y in place
removeObject(map, layerId, objectId) -> void
```

Existing ops (`addLayer`, `removeLayer`, `moveLayer`, `renameLayer`,
`setLayerVisible`, `setCell`, `clearCell`, `getCell`) are unchanged. `addLayer`
still creates a tiles layer (back-compat).

## Object Placement (`tools/place.js` + wiring)

- Pure logic `objectAt(map, layerId, cam, screenX, screenY)` → the cell math's
  free-pixel analog: converts screen→world and returns `{x, y}` in world pixels
  (clamped to map bounds). Used by both place and hit-test.
- Pure `hitObject(layer, cam, screenX, screenY)` → the topmost `ObjectItem` whose
  bottom-anchored sprite rect contains the point, or null. (Sprite size = the
  ref's frame size = `tileSize` for a sheet frame; single sprites use their
  natural size — the render already resolves this.)
- Interaction (in `main.js`), only when the **active layer is type `objects`**:
  - pointer-down on empty space with an active sprite → `addObject` at the pixel,
    select it.
  - pointer-down on an existing object → select it; drag → `moveObject`.
  - `Delete`/`Backspace` on a selected object → `removeObject`.
  - Tile layers keep brush/eraser exactly as today. The active-layer type decides
    which interaction is live.

## Rendering (`render/canvas.js`)

- For each visible layer bottom→top: tile layers render `cells` as today; object
  layers render each `item` — resolve `item.ref` to a source rect, draw at
  `worldToScreen(item.x, item.y)` **bottom-anchored** (dest y minus sprite height),
  matching the placer/scene convention.
- Selected object gets a highlight rect.

## Persistence (`persist/project.js` + wiring)

Project file (`.json`) — the editor's own save format (superset of the export; keeps
the live document losslessly):

```json
{
  "kind": "world-editor-project",
  "version": 1,
  "bundleId": "cute-fantasy",
  "map": {
    "tileSize": 16, "cols": 60, "rows": 45,
    "layers": [
      { "name": "suelo", "type": "tiles", "visible": true,
        "cells": [{ "x": 0, "y": 0, "ref": { "path": "Grass.png", "col": 1, "row": 0 } }] },
      { "name": "props", "type": "objects", "visible": true,
        "items": [{ "ref": { "path": "Oak.png", "col": 0, "row": 0 }, "x": 340, "y": 210 }] }
    ]
  }
}
```

- `serializeProject(map, bundleId)` → the object above (pure; cells Map → sparse array; ids dropped, regenerated on load).
- `deserializeProject(json)` → `{ bundleId, map }` rebuilding layers (cells array → Map, items get fresh `_nextId` ids). Pure.
- **Save:** button → `serializeProject` → download `.json` **and** write to
  localStorage under `we:project:<bundleId>`.
- **Autosave:** debounced write to the same localStorage key on any map change.
- **Load:** button → pick `.json` → `deserializeProject`. If its `bundleId`
  matches the currently loaded bundle, relink immediately; otherwise prompt the
  user to drop the matching ZIP, then relink by `path` and render. On boot, if a
  bundle is loaded and `we:project:<bundleId>` exists, offer to restore it.
- Refs resolve against `state.imagesByPath` by `path`; a missing path renders
  nothing (logged), never throws.

## Export (`persist/export.js`)

`exportMap(map, bundleId)` → the engine-neutral format (pure, unit-tested):

```json
{
  "version": 1,
  "tileSize": 16,
  "world": { "w": 960, "h": 720 },
  "bundles": [{ "id": "cute-fantasy" }],
  "layers": [
    { "name": "suelo", "type": "tiles",
      "cells": [{ "x": 0, "y": 0, "frame": "Grass.png#1,0" }] },
    { "name": "props", "type": "objects",
      "objects": [{ "frame": "Oak.png#0,0", "x": 340, "y": 210 }] }
  ]
}
```

- `TileRef{path,col,row}` serializes to a stable `frame` string `` `${path}#${col},${row}` ``.
- `world.w/h` = `cols*tileSize × rows*tileSize`.
- Export button → download `.json`. This is the game-facing artifact; each game
  writes its own loader.

## UI additions

- Toolbar: **Guardar**, **Cargar**, **Export** buttons; a file input for loading a
  project / dropping a bundle on relink.
- Layers panel: two add buttons — **+ tiles** and **+ obj** — for the two layer
  types. Object layer rows show an "obj" tag; tile rows unchanged.

## Testing

- `map/model.js` object ops: pure unit tests (add object layer; add/move/remove
  object; deterministic ids; back-compat of existing ops).
- `tools/place.js`: pure unit tests (`objectAt` pixel math + bounds clamp;
  `hitObject` bottom-anchored hit-test, topmost-wins).
- `persist/project.js`: pure round-trip test (`serializeProject` →
  `deserializeProject` reproduces the map: layers, types, cells, items).
- `persist/export.js`: pure test (frame-string encoding; world dims; tile vs
  object layer shape).
- Canvas / placement / save-load / export: Playwright E2E — create map, paint a
  tile, add an object layer, place an object, Save (assert file + localStorage),
  reload page + re-import ZIP → project restores with the object present; Export →
  assert the generic JSON shape. No committed Playwright spec (ad hoc, as prior
  milestones).

## Open Questions (resolve during implementation)

- Frame-string separator (`path#col,row`) vs a structured `frame` object — chosen
  string for compactness; revisit only if a path can contain `#` (unlikely for
  PNG asset paths).
- Autosave debounce interval (propose 800 ms).
- Whether the boot restore is automatic or a prompt (propose a prompt to avoid
  surprising overwrites).
