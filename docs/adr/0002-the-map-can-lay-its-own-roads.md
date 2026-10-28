# 2. The map can lay its own roads

- Status: accepted
- Date: 2026-10-28
- Deciders: Carlos Andres Montoya
- Amends: [0001](0001-the-map-owns-the-world.md) — the pin "Roads stay derived"

## Context

ADR 0001 kept roads out of the map: `buildRoads` drew a spine through the town anchors plus a straight
spur to every door, and the decision said explicitly that roads were not authorable.

Two things broke that once every house was authored. The map's base layer paints grass over every
cell, and it was drawn over the procedural ground, so the generated roads vanished under it. Drawing
them back on top showed the second problem: the only road tile available to the generator is the
cobble sheet, whose edges carry a baked-in sand background, so a spur that runs diagonally became a
staircase of orange squares. A road that reads well has to bend around houses and ponds and blend into
the grass, and that is a composition decision, not a geometry one.

## Decision

**A map may lay its own roads on a tiles layer named `road`. When it does, the map owns the road
network and the land decor.**

- The generated spine and door spurs step aside (`proceduralRoads` in `render/scene2d.js`). The
  hidden POI loops stay: those detours are a Konami secret the map does not know about.
- The random decor scatter (`buildDecor`) is turned off, or it would drop trees on the painted roads.
  Pond life stays, because the ponds are still the game's.
- A map without a `road` layer behaves exactly as before.

The road is an ordinary terrain the editor autotiles (`Grass_Tiles_1.png`, dirt with grass edges). It
was first laid by `npm run map:compose`, which routes it door to door in career order through the
editor's own model; after that it is the author's to edit by hand.

## Consequences

Good:

- The road can bend around houses and ponds, and connect the houses in the order the career happened.
- One less thing drawn in code with a tile that was never meant for it.

Bad, and accepted:

- `world.roads` still exists and still feeds the hidden loops and the intro camera, so two road
  networks coexist in the code. Only one is ever drawn at a time.
- The layer name is the contract. Renaming `road` in the editor silently brings the generated roads
  and the scatter back.
