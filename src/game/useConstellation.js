import {
  useState, useCallback, useMemo, useRef, useEffect,
} from 'react'
import EXPERIENCE from '../data/experience.js'
import { SKILLS } from '../data/skills.js'
import { composeFilters, visibleSkillIds, yearBounds } from './filters.js'

// D-16-YEAR-BOUNDS honesty rule: derive once at module load from live data.
// Mirrors src/game/GameMode.js lines 14-16 pattern. Never hardcode [2007, 2026].
const YEAR_BOUNDS = yearBounds(EXPERIENCE)

// D-16-CHIP-FLASH (RESEARCH §7): tech-chip flash window on the constellation node
// when a skill enters the active filter set. 100ms motion-safe; 0ms under reduced-motion.
const FLASH_DURATION_MS = 100

// Josh Comeau usePrefersReducedMotion — SSR-safe + jsdom-safe.
// Mirrors SvgConstellation lines 32-59 but also guards against environments
// where window.matchMedia is not installed (jsdom default; some tests do not
// mock matchMedia). In that case treat as "no-preference" so motion-safe is
// the default — same behavior as production browsers without RM preference.
const RM_QUERY = '(prefers-reduced-motion: no-preference)'
const isServer = typeof window === 'undefined'
const hasMatchMedia = !isServer && typeof window.matchMedia === 'function'

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (isServer) return true
    if (!hasMatchMedia) return false
    return !window.matchMedia(RM_QUERY).matches
  })
  useEffect(() => {
    if (isServer || !hasMatchMedia) return undefined
    const mql = window.matchMedia(RM_QUERY)
    const handler = (e) => setPrefersReducedMotion(!e.matches)
    if (mql.addEventListener) {
      mql.addEventListener('change', handler)
    } else if (mql.addListener) {
      mql.addListener(handler)
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler)
      } else if (mql.removeListener) {
        mql.removeListener(handler)
      }
    }
  }, [])
  return prefersReducedMotion
}

// eslint-disable-next-line no-unused-vars
export default function useConstellation(nodes) {
  // Phase 15 single-select state (unchanged)
  const [selectedSkillId, setSelectedSkillId] = useState(null)
  const [hoveredSkillId, setHoveredSkillId] = useState(null)

  // Phase 16 filter state — owned in-memory only (D-16-PERSIST-MEMORY; no persistent storage writes).
  const [selectedSkills, setSelectedSkills] = useState([])
  const [yearRange, setYearRangeState] = useState(null)
  const [category, setCategoryState] = useState(null)
  const [justFilteredId, setJustFilteredId] = useState(null)

  // Tracks the latest flash setTimeout so back-to-back toggleSkill calls clear
  // the prior timer before scheduling a new one (RESEARCH §7 anti-pattern: no stacked timeouts).
  const flashTimerRef = useRef(null)

  const prefersReducedMotion = usePrefersReducedMotion()

  const onSelectSkill = useCallback((id) => {
    setSelectedSkillId((prev) => (prev === id ? null : id))
  }, [])

  const onHoverSkill = useCallback((id) => {
    setHoveredSkillId(id)
  }, [])

  const toggleSkill = useCallback((id) => {
    setSelectedSkills((prev) => {
      const willAdd = !prev.includes(id)
      if (willAdd) {
        // Clear any pending flash timer before scheduling a new one
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
        setJustFilteredId(id)
        flashTimerRef.current = setTimeout(
          () => setJustFilteredId(null),
          prefersReducedMotion ? 0 : FLASH_DURATION_MS,
        )
        return [...prev, id]
      }
      // REMOVE path — leave justFilteredId untouched; flash signals NEW filter intent
      return prev.filter((s) => s !== id)
    })
  }, [prefersReducedMotion])

  const setYearRange = useCallback((range) => {
    setYearRangeState(range)
  }, [])

  const setCategory = useCallback((cat) => {
    setCategoryState(cat)
  }, [])

  const resetFilters = useCallback(() => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    setJustFilteredId(null)
    setSelectedSkills([])
    setYearRangeState(null)
    setCategoryState(null)
  }, [])

  // Cleanup any pending flash timer on unmount (prevents setState-after-unmount).
  useEffect(() => () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
  }, [])

  // Derived highlight set (Pitfall 7 — deps include ALL three filter dimensions).
  const highlightedSkillIds = useMemo(() => {
    if (selectedSkills.length === 0 && !yearRange && !category) return []
    const matching = composeFilters(
      EXPERIENCE,
      { skillIds: selectedSkills, yearRange, category },
      SKILLS,
    )
    return visibleSkillIds(matching)
  }, [selectedSkills, yearRange, category])

  const isFilterActive = selectedSkills.length > 0 || yearRange !== null || category !== null

  return useMemo(() => ({
    // Phase 15 — unchanged
    selectedSkillId,
    hoveredSkillId,
    onSelectSkill,
    onHoverSkill,
    // Phase 16 — filter state + derived + setters
    selectedSkills,
    yearRange,
    category,
    yearBounds: YEAR_BOUNDS,
    highlightedSkillIds,
    isFilterActive,
    justFilteredId,
    toggleSkill,
    setYearRange,
    setCategory,
    resetFilters,
  }), [
    selectedSkillId,
    hoveredSkillId,
    onSelectSkill,
    onHoverSkill,
    selectedSkills,
    yearRange,
    category,
    highlightedSkillIds,
    isFilterActive,
    justFilteredId,
    toggleSkill,
    setYearRange,
    setCategory,
    resetFilters,
  ])
}
