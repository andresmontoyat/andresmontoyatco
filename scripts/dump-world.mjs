// Dumps a static snapshot of the built overworld (sites, ponds, roads, bounds) to
// public/game/world-snapshot.json so the Asset Placer (public/game/placer.html) can draw the world
// as a placement backdrop without booting the whole game. Run: node scripts/dump-world.mjs
import path from 'node:path'
import fs from 'node:fs/promises'
import { buildOverworld } from '../src/game/world/overworld.js'
import { biomeForYear } from '../src/game/world/biomes.js'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'public', 'game', 'world-snapshot.json')

const experience = JSON.parse(await fs.readFile(path.join(ROOT, 'src', 'data', 'experience.json'), 'utf8'))
const w = buildOverworld(experience, biomeForYear, [])

const snapshot = {
  worldW: w.worldW,
  worldH: w.worldH,
  farm: w.farm,
  regions: w.regions,
  sites: w.sites.map(s => ({ id: s.id, co: s.co, cx: s.cx, cy: s.cy, w: s.w, h: s.h, bi: s.bi, building: s.building })),
  ponds: w.ponds,
  farmBuilding: w.farmBuilding,
  farmWindmill: w.farmWindmill,
  roads: w.roads.map(r => ({ a: r.a, b: r.b, hidden: !!r.hidden })),
}

await fs.writeFile(OUT, `${JSON.stringify(snapshot, null, 2)}\n`)
console.log(`wrote ${path.relative(ROOT, OUT)} — ${snapshot.sites.length} sites, ${snapshot.ponds.length} ponds`)
