# 1. The authored map owns the world; procedural placement is a fallback

- Status: accepted
- Date: 2026-09-29
- Deciders: Carlos Andres Montoya

## Context

The World RPG's geography is computed. `buildOverworld` (`src/game/world/overworld.js`) reads
`experience.json`, buckets the 11 visible entries into six biomes by start year, places each one on a
ring around its biome anchor, and picks a building sprite by hashing the entry id. The authored map
contributes tiles, thirteen decorative objects and — optionally — the biome anchor positions.

That was the right shape while the world was a backdrop. It stops working the moment a building has
to mean something. The goal is an open world where each job is a house you can enter and hold a
conversation in, with points of interest, animals, people and objects to interact with. All of that
needs per-building identity: *this* house is *that* job, with *that* interior and *that* dialogue.

Identity needs an authored thing to hang off. There is nothing in the map to tag, because the houses
do not exist there — the generator invents them at runtime. The world-editor now writes a stable
`uid` and free-form `tags` on every placed object, and this side reads them
(`interactablesFrom` in `src/game/world/authored/convert.js`), but the file it produces is empty:
nothing is tagged, because nothing is placed.

A second symptom of the same gap: nobody owns the world's size. The code says 2140x1360, the map says
1920x1440 in game pixels. 220px on the right carry no authored tiles, and 80px of the authored carpet
fall outside the world.

## Decision drivers

- A house must be addressable by something durable, so an interior and a dialogue tree can point at it.
- Adding a job to the CV should not silently produce a nameless house in a random spot.
- Authoring must be incremental. A decision that requires one long session before anything works will
  not survive contact with a weekend.
- Art per company is currently a hash over six house sprites, and `castle` is still a documented
  placeholder reusing `house`.

## Considered options

1. **Code keeps owning layout.** The map stays scenery; dialogue and interiors are keyed by experience
   id in `src/data/`. Cheapest, and the world stays in sync with the CV for free — but no curated
   placement ever exists, "that spot" is unnameable, and the editor's tags stay unused for buildings.
2. **The map owns everything, immediately.** Every house is placed and tagged before anything ships.
   Correct destination, but it blocks every downstream feature behind one authoring session.
3. **Hybrid: code places by default, an authored building wins.** Incremental, at the cost of two
   placement paths to reason about.

## Decision

**The map is the source of truth for the world. Procedural placement survives only as a fallback
during migration, and is removed when every visible experience has an authored house.**

Option 3 is the mechanism; option 2 is the destination. Concretely:

- An authored building is an object in the map carrying `door:<experienceId>`. Its position, its
  sprite and its footprint come from the map.
- An experience with no authored house keeps being placed by `buildOverworld` exactly as today.
- When coverage reaches every visible experience, `ringPos`, `buildingFor` and `BUILDING_DIMS` are
  deleted rather than left dormant.

### What this pins

**Roads stay derived.** `buildRoads` reads site positions — a spine through each biome plus a spur to
each door — so it works unchanged against authored positions. Roads are not authored, and this
decision does not make them authorable.

**An authored house is drawn by the placement pipeline, not by the building renderer.** The sprite is
whatever was chosen in the editor, drawn from `placements.json`, with its footprint taken from the
frame's own geometry. `buildingFor`'s hash and the `BUILDING_DIMS` table apply only to the procedural
fallback. This is also how unique art per company arrives, and how the `castle` placeholder stops
being one — by being drawn rather than being a case in a table.

**Collision and the door point come from the sprite plus its tags.** `solid` makes a placement block
movement; the door point is derived from the sprite's bottom edge the way `doorPoint` already derives
it, so the road visibly meets the spot where the player presses E.

**Coverage is validated at import, not discovered at runtime.** Every `door:<id>` must name a visible
experience, and the import reports how many experiences are authored against the total. A dead id
fails the import; an unauthored experience is a number in the report, not an error, until the
fallback is removed — at which point it becomes one.

**The map owns the world's size.** `WORLD_W`/`WORLD_H` stop being constants in `overworld.js` and are
derived from the map's own `world` block. Until the map is re-authored to cover the world, the 220px
strip is a known gap rather than an accident.

## Consequences

Good:

- A house can be pointed at. Interiors, dialogue trees, POIs, animals and objects all hang off one
  mechanism — a tag on a placed object — rather than five parallel ones.
- Authoring is incremental and visible: tag one company, see it land, leave the rest procedural.
- The world stops reshuffling itself when the CV changes, for anything authored.
- The editor's work (uid, tags, inspector, badges, entity list) starts paying rent.

Bad, and accepted:

- Two placement paths coexist for as long as migration lasts, and both need tests. "Why is this house
  here?" has two possible answers until the fallback dies.
- Adding a CV entry no longer produces a house on its own once the fallback is gone. That is the
  point — it is a prompt to place one — but it is a real loss of automation.
- Map and CV can drift. The import's coverage check is what keeps the drift loud.

## Exit criterion

The fallback is deleted in the same commit that makes coverage complete: every visible entry in
`experience.json` has exactly one `door:` in the map, the import reports 11 of 11, and
`ringPos`/`buildingFor`/`BUILDING_DIMS`/`BUILT_IN_ANCHORS` leave the codebase with it.
