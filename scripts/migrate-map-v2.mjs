// One-time migration of src/game/world/authored/career.map.json from export v1 to v2 shape.
//
//   node scripts/migrate-map-v2.mjs        (npm run map:migrate)
//
// Needs no pack and no network, unlike map:import — it only rewrites identity. Idempotent: run it
// twice and the second run reports nothing to do.
//
// The logic lives in src/game/world/authored/migrate.js, under test. This file is the thin CLI.

import path from 'node:path'
import fs from 'node:fs/promises'
import { migrateMapToV2, TARGET_VERSION } from '../src/game/world/authored/migrate.js'

const IN_MAP = path.join(process.cwd(), 'src', 'game', 'world', 'authored', 'career.map.json')

const map = JSON.parse(await fs.readFile(IN_MAP, 'utf8'))
const out = migrateMapToV2(map)

if (out.minted === 0 && map.version >= TARGET_VERSION) {
  console.log(`already v${map.version}: ${out.objects} objects, all with a uid — nothing to do`)
  process.exit(0)
}

await fs.writeFile(IN_MAP, `${JSON.stringify(out.map, null, 2)}\n`)
console.log(`migrated v${out.from} -> v${TARGET_VERSION}: ${out.minted} uid(s) minted across ${out.objects} object(s)`)
console.log('next: npm run map:import, then npm run assets:pack, then commit the generated files together')
