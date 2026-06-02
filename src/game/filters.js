// Phase 16 Wave 1: pure-selector module — zero React/DOM imports.
// Mirrors src/game/spatialNav.js convention: named exports only, pure functions,
// module-scope constants. Synchronized with constellation.graph.js CURRENT_YEAR
// (D-16-YEAR-BOUNDS honesty rule: never use new Date() — deterministic year.)
// Update both files together at the start of each calendar year.
const CURRENT_YEAR = 2026

/**
 * Returns experiences whose period [start, end ?? CURRENT_YEAR] intersects [from, to].
 * Pass-through when either bound is nullish.
 */
export function filterByYearRange(experiences, [from, to] = []) {
  if (from == null || to == null) return experiences
  return experiences.filter((e) => {
    const start = e.period.start
    const end = e.period.end ?? CURRENT_YEAR
    return start <= to && end >= from
  })
}

/**
 * AND intersection (D-16-INTERSECT-AND): returns experiences whose tech[] contains
 * EVERY skill in skillIds. Empty/nullish skillIds = pass-through (no filtering).
 */
export function filterBySkillIntersection(experiences, skillIds) {
  if (!skillIds || skillIds.length === 0) return experiences
  return experiences.filter((e) => skillIds.every((s) => e.tech.includes(s)))
}

/**
 * Returns experiences using at least one skill in the given category.
 * Requires the skills catalog (SKILLS) to map tech → category.
 * Pass-through when category is nullish.
 */
export function filterByCategory(experiences, category, skills) {
  if (!category) return experiences
  return experiences.filter((e) => e.tech.some((t) => skills[t]?.category === category))
}

/**
 * Compose filters: skill intersection ∩ year range ∩ category.
 * Order: skill (most-selective) → year → category. Returns matching experiences.
 */
export function composeFilters(experiences, { skillIds, yearRange, category }, skills) {
  let result = experiences
  result = filterBySkillIntersection(result, skillIds)
  if (yearRange) result = filterByYearRange(result, yearRange)
  if (category) result = filterByCategory(result, category, skills)
  return result
}

/**
 * Returns the deduplicated set of skill ids that appear in at least one
 * matching experience. Used to compute highlightedSkillIds[] for the constellation.
 */
export function visibleSkillIds(matchingExperiences) {
  const set = new Set()
  for (const e of matchingExperiences) {
    for (const t of e.tech) set.add(t)
  }
  return Array.from(set)
}

/**
 * Returns [min(period.start), max(period.end ?? CURRENT_YEAR)] from live data.
 * Used to derive the year-range slider bounds — never hardcode [2007, 2026].
 */
export function yearBounds(experiences) {
  const min = Math.min(...experiences.map((e) => e.period.start))
  const max = Math.max(...experiences.map((e) => e.period.end ?? CURRENT_YEAR))
  return [min, max]
}
