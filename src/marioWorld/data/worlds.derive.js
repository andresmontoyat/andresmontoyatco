// src/marioWorld/data/worlds.derive.js
import { BIOMES, pickBiome } from './biomes.js'

/**
 * Pure derivation from data sources into a flat worlds[] array.
 * Each world: { id, type, label, biome, position, ...typeSpecific }
 */
export function deriveWorlds(experience, skills, sections, secretWorlds) {
  const companyWorlds = buildCompanyWorlds(experience)
  const sectionWorlds = buildSectionWorlds(sections)
  const hiddenWorlds  = buildSecretWorlds(secretWorlds)
  const all = [...companyWorlds, ...sectionWorlds, ...hiddenWorlds]
  return { worlds: assignPositions(all) }
}

function buildCompanyWorlds(experience) {
  const byCompany = new Map()
  for (const entry of experience) {
    const company = entry.company
    if (!company) continue
    if (!byCompany.has(company)) byCompany.set(company, [])
    byCompany.get(company).push(entry)
  }
  const out = []
  for (const [company, entries] of byCompany) {
    const sorted = [...entries].sort((a, b) => a.period.start - b.period.start)
    const earliest = sorted[0].period.start
    out.push({
      id: `company:${slug(company)}`,
      type: 'company',
      label: company,
      biome: pickBiome(earliest),
      levels: sorted,
      position: null,
    })
  }
  return out
}

function buildSectionWorlds(sections) {
  return sections.map((s) => ({
    id: `section:${s.id}`,
    type: 'section',
    label: s.label,
    biome: s.biome,
    icon: s.icon,
    content: s.content,
    position: null,
  }))
}

function buildSecretWorlds(secretWorlds) {
  return secretWorlds.map((sw) => ({
    id: `secret:${sw.id}`,
    type: 'secret',
    label: sw.label,
    biome: sw.biome,
    command: sw.command,
    content: sw.content,
    hidden: true,
    position: null,
  }))
}

/**
 * Deterministic 2D position assignment per biome. Biome regions tile
 * horizontally; worlds within a biome distribute on a deterministic grid
 * indexed by sorted id (alphabetic).
 */
function assignPositions(worlds) {
  const BIOME_ORDER = ['pradera', 'desierto', 'selva', 'cyber', 'castillo']
  const BIOME_WIDTH = 400
  const ROW_HEIGHT = 80
  const COL_WIDTH  = 90

  const byBiome = new Map()
  for (const w of worlds) {
    const arr = byBiome.get(w.biome) ?? []
    arr.push(w)
    byBiome.set(w.biome, arr)
  }

  const out = []
  for (const biomeId of BIOME_ORDER) {
    const inBiome = (byBiome.get(biomeId) ?? []).sort((a, b) => (a.id < b.id ? -1 : 1))
    const biomeIdx = BIOME_ORDER.indexOf(biomeId)
    const x0 = biomeIdx * BIOME_WIDTH + 50
    inBiome.forEach((w, i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      out.push({ ...w, position: { x: x0 + col * COL_WIDTH, y: 100 + row * ROW_HEIGHT } })
    })
  }
  return out
}

function slug(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
