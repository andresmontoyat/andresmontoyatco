import React, { useMemo, Suspense } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { useTheme } from '../i18n/ThemeContext'
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
import RendererErrorBoundary from './RendererErrorBoundary'
import useRendererCapability from './useRendererCapability'
import FpsCounter from './FpsCounter'

// D-15-LAND-COPY: derive at module load from live data — never hardcode
const maxYear = Math.max(...EXPERIENCE.map((e) => e.period.end ?? CURRENT_YEAR))
const minYear = Math.min(...EXPERIENCE.map((e) => e.period.start))
export const yearsActive = maxYear - minYear

// Build graph once at module load — shared between skillCount and renderer props
const { nodes: GRAPH_NODES, edges: GRAPH_EDGES } = buildConstellationGraph(EXPERIENCE, SKILLS)
const LAYOUT = computeLayout(GRAPH_NODES)

// D-15-LAND-COPY: graph node count (alias-normalized canonical count)
export const skillCount = GRAPH_NODES.length

// Pattern G: React.lazy() MUST live at module scope. If placed inside the
// component body, React would recreate the lazy boundary on every render
// → infinite re-fetch loop on the WebGL chunk.
const WebGLConstellation = React.lazy(() => import('./renderers/WebGLConstellation'))

export default function GameMode() {
  const { lang, t } = useLanguage()
  const { theme } = useTheme()

  // Phase 17: capability detection lifted into reactive hook returning 'webgl'|'svg'.
  // Replaces the inline detectCapabilities() + useState(...) pattern from Phase 16.
  const capability = useRendererCapability()
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

  // Phase 17 BLOCKER 2: shared rendererProps spread to BOTH renderer slots.
  // hoveredSkillId flows from useConstellation (which has owned hover state
  // since Phase 15) to the renderer; WebGLConstellation consumes it as a
  // prop, SvgConstellation receives it as an extra prop and continues to
  // use its internal hoveredNodeId state (Phase 15 contract unchanged).
  const rendererProps = {
    nodes: GRAPH_NODES,
    edges: GRAPH_EDGES,
    layout: LAYOUT,
    highlightedSkillIds: cons.highlightedSkillIds,
    selectedSkillId: cons.selectedSkillId,
    hoveredSkillId: cons.hoveredSkillId,
    yearRange: cons.yearRange,
    justFilteredId: cons.justFilteredId,
    theme,
    lang,
    t,
    onSelectSkill: cons.onSelectSkill,
    onHoverSkill: cons.onHoverSkill,
  }

  // Phase 17 D-17-SELECTION-MECH: when capability='webgl', wrap the lazy
  // WebGL renderer in Suspense+ErrorBoundary; both fallbacks render
  // SvgConstellation per UI-SPEC Pattern H ("SVG IS the loading state").
  // RendererErrorBoundary's outer fallback catches lazy chunk-fetch errors
  // AND shader-compile / WebGL-ctx-creation failures so the user never
  // sees a broken screen — SvgConstellation seamlessly takes over.
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

      <RendererErrorBoundary fallback={<SvgConstellation {...rendererProps} />}>
        <div
          data-game-interactive
          className="w-full max-w-3xl relative"
          data-testid="renderer-slot"
          data-theme={theme}
          data-renderer={capability}
        >
          {capability === 'webgl' ? (
            <Suspense fallback={<SvgConstellation {...rendererProps} />}>
              <WebGLConstellation {...rendererProps} />
            </Suspense>
          ) : (
            <SvgConstellation {...rendererProps} />
          )}
        </div>
      </RendererErrorBoundary>

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

      {/* Dev-only FPS counter overlays the canvas when WebGL renderer is active.
          Vite's import.meta.env.DEV is statically replaced as `false` in production,
          so the entire conditional + FpsCounter import tree-shakes from the prod bundle. */}
      {import.meta.env.DEV && capability === 'webgl' && <FpsCounter />}
    </section>
  )
}
