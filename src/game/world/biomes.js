export const BIOMES = {
  pradera:  { c:'#5cb85c', sky:['#8ed0ff','#bfe8ff'], hill:'#57a83e', hill2:'#4a9235', ground:'#6ab04c', label:{ en:'Java / JEE Legacy', es:'Java / JEE Legacy' } },
  desierto: { c:'#d4a55b', sky:['#f3d9a0','#ffeec6'], hill:'#d0a85c', hill2:'#bb9147', ground:'#e0bd7a', label:{ en:'SOA / Middleware',   es:'SOA / Middleware' } },
  selva:    { c:'#2e8b57', sky:['#7fc7a0','#a8e0c0'], hill:'#2f7d47', hill2:'#256b3a', ground:'#3f9a5c', label:{ en:'Microservices',     es:'Microservicios' } },
  cyber:    { c:'#4b93e6', sky:['#8fb0f0','#c0d4ff'], hill:'#3f6fc0', hill2:'#33589c', ground:'#5a86d6', label:{ en:'Cloud / Kubernetes', es:'Cloud / Kubernetes' } },
  castillo: { c:'#a855f7', sky:['#7a5fb0','#a98fd8'], hill:'#5a4a8e', hill2:'#463670', ground:'#6a5a96', label:{ en:'Claude Code / AI',   es:'Claude Code / IA' } },
}
export const ORDER = ['pradera','desierto','selva','cyber','castillo']
const RANGES = [
  ['pradera', 2007, 2012], ['desierto', 2013, 2017], ['selva', 2018, 2021],
  ['cyber', 2022, 2024], ['castillo', 2025, 2026],
]
export function biomeForYear(year) {
  for (const [id, lo, hi] of RANGES) if (year >= lo && year <= hi) return id
  return year < RANGES[0][1] ? 'pradera' : 'castillo'
}
