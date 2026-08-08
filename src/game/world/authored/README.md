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

## Seed map provenance

`career.map.json` is the operator's export, with one edit: the `anchor:farm` layer came out
with TWO objects and validation requires exactly one (an anchor defines a single point — the
town, the player spawn, the barn and the windmill all derive from it). The object at
(159,160) was kept; the one at (27,78) was dropped because it sat on the top-left edge, which
would have thrown half the building ring off the map.

Note also that none of the 12 objects in `props` carries a transform, so this seed does not
exercise flip/rotate/scale visually. The transform code paths are covered by unit tests.
