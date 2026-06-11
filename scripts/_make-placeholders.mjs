// Phase 22 Task 22.6 — Sprite placeholder generator
// Generates solid-color WebP placeholders for biome tiles + avatar walk + world icons atlas.
// High-fidelity art deferred (see .planning/seeds/SEED-MARIO-WORLD-ART.md OPEN-ART-1).
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'public', 'sprites')

// Solid hex → {r,g,b}
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    alpha: 1,
  }
}

async function solid(file, width, height, hex) {
  const out = path.join(OUT, file)
  await sharp({
    create: { width, height, channels: 4, background: hexToRgb(hex) },
  })
    .webp({ quality: 80 })
    .toFile(out)
  return out
}

const biomes = [
  ['biome-pradera.webp', '#5cb85c'],
  ['biome-desierto.webp', '#d4a55b'],
  ['biome-selva.webp', '#2e6b3f'],
  ['biome-cyber.webp', '#3b82f6'],
  ['biome-castillo.webp', '#a855f7'],
]

for (const [file, color] of biomes) {
  const p = await solid(file, 256, 256, color)
  console.log('wrote', p)
}

// Avatar walk-cycle: 4 frames × 16×64 stacked horizontally → 64×64 atlas placeholder
// Use a neutral neon-ish color so it is visible against any biome.
const avatarPath = await solid('avatar-carlos-walk.webp', 64, 64, '#22d3ee')
console.log('wrote', avatarPath)

// World icons atlas placeholder — keep small, single solid swatch
const iconsPath = await solid('world-icons.webp', 64, 64, '#facc15')
console.log('wrote', iconsPath)
