import { BIOMES } from './biomes.js'
function startYear(entry) {
  const s = (entry.date && entry.date.en) || ''
  const m = s.match(/\d{4}/)
  return m ? Number(m[0]) : 0
}
export function mapExperienceToCompanies(json, biomeForYear) {
  let num = 0
  return json.entries
    .filter(e => e.visible !== false)
    .map(e => ({ e, y: startYear(e) }))
    .sort((a, b) => a.y - b.y)
    .map(({ e, y }) => {
      const biome = biomeForYear(y)
      const c = { co: e.company, y, biome, featured: !!e.featured, boss: !!e.boss,
        metric: e.metric || null, role: e.title, date: e.date, tech: e.tech || [], bullets: e.bullets,
        color: BIOMES[biome].c }
      if (c.featured) c.num = ++num
      return c
    })
}
