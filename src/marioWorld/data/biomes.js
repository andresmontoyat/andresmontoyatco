// src/marioWorld/data/biomes.js
//
// 5 themed biomes (decision Q8-A): era + stack mapping.
// Operator may tune `tile` paths after sprite assets land in public/sprites/.

export const BIOMES = {
  pradera:  { id: 'pradera',  era: [2007, 2012], stack: 'Java / JEE Legacy',  color: '#5cb85c', tile: '/sprites/biome-pradera.webp' },
  desierto: { id: 'desierto', era: [2013, 2017], stack: 'SOA / Middleware',   color: '#d4a55b', tile: '/sprites/biome-desierto.webp' },
  selva:    { id: 'selva',    era: [2018, 2021], stack: 'Microservices',      color: '#2e6b3f', tile: '/sprites/biome-selva.webp' },
  cyber:    { id: 'cyber',    era: [2022, 2024], stack: 'Cloud / Kubernetes', color: '#3b82f6', tile: '/sprites/biome-cyber.webp' },
  castillo: { id: 'castillo', era: [2025, 2026], stack: 'Claude Code / AI',   color: '#a855f7', tile: '/sprites/biome-castillo.webp' },
}

/**
 * Map a year to its biome id. Earliest era's lower bound is the floor;
 * latest era's upper bound is the ceiling. Years outside either end
 * clamp to the closest biome.
 */
export function pickBiome(year) {
  for (const b of Object.values(BIOMES)) {
    if (year >= b.era[0] && year <= b.era[1]) return b.id
  }
  if (year < BIOMES.pradera.era[0]) return BIOMES.pradera.id
  return BIOMES.castillo.id
}
