# World Editor — Design Spec

**Date:** 2026-07-31
**Status:** Approved (design), pending implementation
**Author:** brainstorming session, Carlos Montoya

## Summary

A standalone local web app for authoring 2D game maps. You import asset packs
(as ZIP bundles), the app auto-generates a per-bundle manifest that slices
spritesheets into frames, and you compose **hybrid maps** — a tile-based terrain
painted in layers, plus freely-placed objects on top. Maps export to a
**generic, engine-neutral JSON format** that any game can load with its own
adapter. The tool is reusable across games/worlds, not tied to the portfolio.

The current in-repo `public/game/placer.html` is the seed/reference; this editor
supersedes it as a separate project.

## Goals

- Import any asset pack delivered as a `.zip` and browse its sprites.
- Auto-generate an editable bundle manifest (frame slicing) at import time.
- Paint terrain in layers (ground/path/water/...) on a tile grid.
- Place, move, and delete objects (trees, buildings, decor) freely on top.
- Save/load projects locally and export a generic map JSON.
- Stay engine-neutral: the export refers to assets by `bundle + frame`, never
  by disk path, so maps are portable.

## Non-Goals

- Not a game engine or runtime. It authors data; games consume it.
- No animation editing/timeline (beyond recording animation rows in the manifest).
- No online hosting, accounts, or collaboration. Runs locally.
- No auto-baking into the portfolio's atlas. A separate adapter (future,
  outside this project) translates the generic export into this game's runtime.

## Decisions (locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Map model | Hybrid: layered tilemap + free objects | Full terrain control plus quick decor placement |
| App type | Local web app, Vite (vanilla + canvas) | One interactive canvas SPA; Astro/routing add nothing |
| Bundle input | ZIP import → auto manifest (JSZip, in-browser) | User's packs arrive as zips; no hand-written config |
| Frame slicing | Tile base + multiples, editable in UI | Simple, works with Cute Fantasy 16px grid |
| Export format | Generic engine-neutral JSON (source of truth) | Reusable across games; adapter per engine |
| Location | Own git repo, outside iCloud | Avoid iCloud syncing node_modules |

## Location

New standalone git repository, **outside iCloud** to keep `node_modules` out of
sync:

```
/Users/andres/Development/repositories.nosync/codehunters/tools/world-editor
```

The portfolio repo does not depend on it. A future adapter (its own small piece,
outside this spec) will translate the generic export into the portfolio game's
runtime (`scene2d` placements + layered tiles).

## Architecture

Modules are isolated units, each with one purpose, communicating through plain
data. The `map/` model is pure (no DOM) so it is testable in isolation.

```
bundle/     Import ZIP -> manifest. JSZip decompresses in memory, scans PNGs,
            slices by tile base + multiples, marks each image sheet vs single.
            Produces an editable manifest object.
catalog/    Palette UI: browse a bundle's frames, categories, search, zoom.
map/        Data model: { tileSize, world, layers[], objects[] }. Pure, no DOM.
canvas/     Renders grid + layers + objects. Paint tiles; place/move/delete
            objects. Reads map/, writes back through its API.
project/    Save/load project (localStorage + export/import a .json project file).
export/     Serializes map/ to the generic map format.
```

### Data flow

```
.zip --> bundle/ (JSZip) --> manifest --> catalog/ (palette)
                                             |
                                   user picks frame
                                             v
canvas/ <---- map/ (model) <---- paint tile / place object
   |
project/ (save)   export/ (generic JSON)
```

## Data Formats

### Generic map format (source of truth)

Neutral. References assets by `bundle + frame`, not by disk path, so a map stays
portable across machines and games.

```json
{
  "version": 1,
  "tileSize": 16,
  "world": { "w": 3200, "h": 2400 },
  "bundles": [{ "id": "cute-fantasy", "manifest": "cute-fantasy.manifest.json" }],
  "layers": [
    {
      "name": "ground",
      "type": "tiles",
      "cells": [{ "x": 0, "y": 0, "frame": "grass_0" }]
    }
  ],
  "objects": [
    { "bundle": "cute-fantasy", "frame": "tree_oak", "x": 340, "y": 210 }
  ]
}
```

- `layers[].cells` are sparse (only painted cells listed), keyed by grid coords.
- `objects[]` use world pixel coords, bottom-anchored (matches placer convention).
- Object `frame` names resolve against the referenced bundle's manifest.

### Bundle manifest (auto-generated at import, editable)

```json
{
  "id": "cute-fantasy",
  "tileBase": 16,
  "images": {
    "Trees/Oak.png": { "type": "sheet", "fw": 16, "fh": 16, "cols": 4, "rows": 2 },
    "Buildings/Barn.png": { "type": "single", "w": 96, "h": 96 }
  }
}
```

**Slicing rule:** a `tileBase` is assumed per bundle (default 16, user-editable).
For each PNG, if both dimensions are exact multiples of `tileBase`, it is a
`sheet` sliced into `cols x rows` frames of `tileBase`; otherwise it is a
`single`. Every classification is overridable in the UI (per bundle or per
image). Frame names derive from the image path + grid index (exact naming scheme
to be finalized during implementation of the map engine, not needed for the
loader slice).

## Scope for the first implementation session

Deliver a working vertical loader, end to end. The map engine (layers, painting,
export) is deferred to later sessions but its data model is specified above.

1. Scaffold the Vite project at the location above (`npm run dev` runs).
2. Import a `.zip`: drop or file-pick → JSZip decompresses in memory → scan PNGs.
3. Auto-generate the bundle manifest (tile base + multiples slicing).
4. Render a sprite palette (catalog grid) from the manifest.
5. Show the generated manifest JSON in the UI for inspection.

### Deferred to later sessions

- `map/` model implementation + `canvas/` grid painting and object placement.
- Layer management UI.
- `project/` save/load; `export/` generic JSON writer.
- Manifest editing UI (override sheet/single, tile size per image).
- Portfolio adapter: generic export → this game's runtime.

## Testing

- `bundle/` slicing logic: pure unit tests over image-dimension inputs
  (multiples → sheet with correct cols/rows; non-multiples → single).
- `map/` model (later): pure unit tests for add/move/delete cell and object.
- Canvas/UI: manual verification during the session; no e2e harness initially.

## Open questions (resolve during implementation)

- Exact frame-naming scheme for sliced sheets (path + index vs semantic names).
- Whether the manifest is embedded in the project file or kept as a sibling.
- Default categories for the catalog palette (reuse placer's regex categories as
  a starting point).
