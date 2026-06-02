import React, { useState, useMemo } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { useTheme } from '../i18n/ThemeContext'
import { useViewMode } from '../context/ViewModeContext'
import EXPERIENCE from '../data/experience'
import { SKILLS } from '../data/skills'
import { buildConstellationGraph, CURRENT_YEAR } from './constellation.graph'
import { computeLayout } from './constellation.layout'
import useConstellation from './useConstellation'
import SvgConstellation from './renderers/SvgConstellation'
import ConstellationFallback from './ConstellationFallback'
import SkillFilters from './SkillFilters'
import ExperienceCard from './ExperienceCard'
import { composeFilters } from './filters'

// D-15-LAND-COPY: derive at module load from live data — never hardcode
const maxYear = Math.max(...EXPERIENCE.map((e) => e.period.end ?? CURRENT_YEAR))
const minYear = Math.min(...EXPERIENCE.map((e) => e.period.start))
export const yearsActive = maxYear - minYear

// Build graph once at module load — shared between skillCount and renderer props
const { nodes: GRAPH_NODES, edges: GRAPH_EDGES } = buildConstellationGraph(EXPERIENCE, SKILLS)
const LAYOUT = computeLayout(GRAPH_NODES)

// D-15-LAND-COPY: graph node count (alias-normalized canonical count)
export const skillCount = GRAPH_NODES.length

// Capability detection — Phase 17: branch on capabilities for WebGL adapter; Phase 15 always SVG.
function detectCapabilities() {
  if (typeof window === 'undefined') {
    return { prefersReducedMotion: true, saveData: false, isMobile: true, hasWebGL: false }
  }
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const saveData = (typeof navigator !== 'undefined' && navigator.connection && navigator.connection.saveData) || false
  const isMobile = window.innerWidth < 768
  let hasWebGL = false
  try {
    const c = document.createElement('canvas')
    hasWebGL = !!(c.getContext('webgl') || c.getContext('experimental-webgl'))
  } catch (e) {
    hasWebGL = false
  }
  return { prefersReducedMotion, saveData, isMobile, hasWebGL }
}

class ConstellationErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Constellation error:', error, info)
  }

  render() {
    const { hasError } = this.state
    const { fallback, children } = this.props
    if (hasError) return fallback
    return children
  }
}

export default function GameMode() {
  const { lang, t } = useLanguage()
  const { theme } = useTheme()
  const { setViewMode } = useViewMode()

  const [capabilities] = useState(() => detectCapabilities())
  const cons = useConstellation(GRAPH_NODES)

  const h1Text = `${yearsActive} ${t.game.h1Years}. ${skillCount} ${t.game.h1Skills}. ${t.game.h1Tagline}`

  // D-16-INTERSECT-AND (Pitfall 7 — memoize so card render doesn't recompute on every parent render).
  // Composed jobs = experiences intersecting [selectedSkillId, ...selectedSkills] ∩ yearRange ∩ category.
  // selectedSkills is filtered to avoid duplicating the locked selectedSkillId in the intersection.
  const cardJobs = useMemo(() => {
    if (cons.selectedSkillId === null) return []
    const composedSkillIds = [
      cons.selectedSkillId,
      ...cons.selectedSkills.filter((s) => s !== cons.selectedSkillId),
    ]
    return composeFilters(
      EXPERIENCE,
      { skillIds: composedSkillIds, yearRange: cons.yearRange, category: cons.category },
      SKILLS,
    )
  }, [cons.selectedSkillId, cons.selectedSkills, cons.yearRange, cons.category])

  const selectedNode = cons.selectedSkillId !== null
    ? GRAPH_NODES.find((n) => n.id === cons.selectedSkillId)
    : null

  const errorFallback = (
    <p className="text-text-secondary text-base text-center py-8">
      {t.game.error}{' '}
      <button
        onClick={() => setViewMode('dev')}
        className="text-brand underline"
        type="button"
      >
        {t.nav.modeDev}
      </button>
    </p>
  )

  return (
    <section id="game-mode" className="min-h-screen flex flex-col items-center px-6 pt-12 pb-8">
      <div className="text-center mb-8 md:mb-12 max-w-2xl">
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary leading-tight mb-3">
          {h1Text}
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">{t.game.subCopy}</p>
      </div>

      <SkillFilters
        nodes={GRAPH_NODES}
        selectedSkills={cons.selectedSkills}
        yearRange={cons.yearRange}
        yearBounds={cons.yearBounds}
        category={cons.category}
        isFilterActive={cons.isFilterActive}
        onToggleSkill={cons.toggleSkill}
        onYearRangeChange={cons.setYearRange}
        onCategoryChange={cons.setCategory}
        onReset={cons.resetFilters}
        lang={lang}
        t={t}
      />

      <ConstellationErrorBoundary fallback={errorFallback}>
        <div
          data-game-interactive
          className="w-full max-w-3xl relative"
          data-testid="renderer-slot"
          data-theme={theme}
          data-prefers-reduced-motion={capabilities.prefersReducedMotion ? 'true' : 'false'}
        >
          <SvgConstellation
            nodes={GRAPH_NODES}
            edges={GRAPH_EDGES}
            layout={LAYOUT}
            highlightedSkillIds={cons.highlightedSkillIds}
            selectedSkillId={cons.selectedSkillId}
            yearRange={cons.yearRange}
            justFilteredId={cons.justFilteredId}
            theme={theme}
            lang={lang}
            t={t}
            onSelectSkill={cons.onSelectSkill}
            onHoverSkill={cons.onHoverSkill}
          />
        </div>
      </ConstellationErrorBoundary>

      {cons.selectedSkillId !== null && selectedNode && (
        <ExperienceCard
          selectedNode={selectedNode}
          jobs={cardJobs}
          selectedSkills={[cons.selectedSkillId, ...cons.selectedSkills]}
          lang={lang}
          t={t}
          onClose={() => cons.onSelectSkill(cons.selectedSkillId)}
          onToggleSkill={cons.toggleSkill}
          position={LAYOUT[cons.selectedSkillId] ?? null}
        />
      )}

      <ConstellationFallback experiences={EXPERIENCE} lang={lang} t={t} />
    </section>
  )
}
