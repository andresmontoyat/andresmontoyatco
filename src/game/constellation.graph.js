import { SKILL_CATEGORIES, resolveCanonical } from '../data/skills.js'

// Fixed constant for "Present" — deterministic, no new Date() call.
// TODO(WR-02): bump CURRENT_YEAR at the start of each calendar year.
// Synchronized assertions live in:
//   - src/data/skills.test.js (Coderio period.start expectation)
//   - src/game/constellation.graph.test.js (java.years[1] assertion)
// Update all three together to keep the displayed [min, max] range honest.
export const CURRENT_YEAR = 2026

// D-20-PLANETS-TIER — top-K skills by count render as "planets" (larger size +
// always-on halo) in both renderers, evoking the Destiny-2 Director inner-
// planets visual hierarchy. K is UAT-tunable; consult v3.10-UAT.md before
// adjusting after milestone close. Deterministic tiebreak by id ascending so
// node order stays stable across builds.
export const PLANETS_K = 6

/**
 * Build the constellation skill graph from experience + skills data.
 *
 * @param {Array} experience - EXPERIENCE array from src/data/experience.js
 * @param {Object} skills - SKILLS catalog from src/data/skills.js
 * @returns {{ nodes: Node[], edges: Edge[] }}
 *
 * Node: { id, label, category, color, count, years: [min, max], experienceIdx: [] }
 * Edge: { source, target, weight }  (source/target are canonical skill labels)
 */
export function buildConstellationGraph(experience, skills) {
  // Step 1: resolve each entry's tech[] to canonical skill ids, collect per-skill metadata
  const nodeMap = {} // canonical label → accumulator

  for (const [idx, entry] of experience.entries()) {
    const canonical = entry.tech.map((t) => resolveCanonical(t)).filter(Boolean)
    // Deduplicate within one entry (shouldn't happen, but defensive)
    const unique = [...new Set(canonical)]

    for (const label of unique) {
      if (!nodeMap[label]) {
        const skillEntry = skills[label]
        if (!skillEntry) continue
        nodeMap[label] = {
          id: label,
          label,
          category: skillEntry.category,
          color: SKILL_CATEGORIES[skillEntry.category].color,
          count: 0,
          _minYear: Infinity,
          _maxYear: -Infinity,
          experienceIdx: [],
        }
      }
      const node = nodeMap[label]
      node.count += 1
      node.experienceIdx.push(idx)

      const start = entry.period.start
      const end = entry.period.end === null ? CURRENT_YEAR : entry.period.end
      if (start < node._minYear) node._minYear = start
      if (end > node._maxYear) node._maxYear = end
    }
  }

  // Finalise nodes: convert _minYear/_maxYear → years tuple, remove temp fields
  const rawNodes = Object.values(nodeMap).map(({ _minYear, _maxYear, ...rest }) => ({
    ...rest,
    years: [_minYear, _maxYear],
  }))

  // D-20-PLANETS-TIER — derive isPlanet flag on top-K by count.
  // Deterministic tiebreak: id ascending so the same set of skills always
  // resolves to the same planet bucket across builds.
  const sortedByCount = [...rawNodes].sort(
    (a, b) => b.count - a.count || (a.id < b.id ? -1 : 1),
  )
  const planetIds = new Set(sortedByCount.slice(0, PLANETS_K).map((n) => n.id))
  const nodes = rawNodes.map((n) => ({ ...n, isPlanet: planetIds.has(n.id) }))

  // Step 2: derive co-occurrence edges
  // WR-03: key the edge map with JSON.stringify([a,b]) (collision-proof) instead
  // of `${a}|${b}` (would break if a skill label ever contained '|', e.g. the
  // existing translations.js label "REST / gRPC" — same risk class).
  const edgeMap = new Map() // JSON.stringify([a,b]) → weight, with a < b lexicographically

  for (const entry of experience) {
    const canonical = [...new Set(entry.tech.map((t) => resolveCanonical(t)).filter(Boolean))]
    // All unordered pairs within this entry
    for (let i = 0; i < canonical.length; i++) {
      for (let j = i + 1; j < canonical.length; j++) {
        const a = canonical[i] < canonical[j] ? canonical[i] : canonical[j]
        const b = canonical[i] < canonical[j] ? canonical[j] : canonical[i]
        const key = JSON.stringify([a, b])
        edgeMap.set(key, (edgeMap.get(key) || 0) + 1)
      }
    }
  }

  const edges = [...edgeMap.entries()].map(([key, weight]) => {
    const [source, target] = JSON.parse(key)
    return { source, target, weight }
  })

  return { nodes, edges }
}
