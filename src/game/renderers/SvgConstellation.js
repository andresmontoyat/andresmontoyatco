import React, { useState, useEffect, useRef, useMemo } from 'react'
import { findNextNode, ARROW_VECTORS } from '../spatialNav'
import { SKILL_CATEGORIES } from '../../data/skills'

// Light-theme strokes: one shade darker for WCAG AA on light backdrop (#F0F0F5)
// Applied as a 1.5px ring on each node circle when theme === 'light'
const LIGHT_THEME_STROKES = {
  lang: '#2563EB',
  ai: '#a855f7',
  arch: '#0891b2',
  cloud: '#059669',
  devops: '#d97706',
  security: '#ef4444',
  data: '#8b5cf6',
  hardware: '#db2777',
}

const SIZING = {
  mobile: { floor: 6, ceil: 14 },
  desktop: { floor: 10, ceil: 23 },
}

function computeRadius(count, maxCount, breakpoint) {
  const { floor, ceil } = SIZING[breakpoint]
  return floor + (Math.sqrt(count) / Math.sqrt(maxCount)) * (ceil - floor)
}

function edgeStrokeWidth(weight) {
  return weight === 1 ? 1.0 : Math.min(1.0 + (weight - 1) * 1.0, 4.0)
}

// Josh Comeau usePrefersReducedMotion hook — SSR-safe
// Source: joshwcomeau.com/snippets/react-hooks/use-prefers-reduced-motion
const QUERY = '(prefers-reduced-motion: no-preference)'
const isServer = typeof window === 'undefined'

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => (isServer ? true : !window.matchMedia(QUERY).matches)
  )
  useEffect(() => {
    if (isServer) return undefined
    const mql = window.matchMedia(QUERY)
    const handler = (e) => setPrefersReducedMotion(!e.matches)
    if (mql.addEventListener) {
      mql.addEventListener('change', handler)
    } else {
      mql.addListener(handler)
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler)
      } else {
        mql.removeListener(handler)
      }
    }
  }, [])
  return prefersReducedMotion
}

// Module-scope helper: builds bilingual aria-label for a skill node
function buildNodeLabel(node, lang, t) {
  const categoryLabel = SKILL_CATEGORIES[node.category][lang]
  const noun = node.count === 1 ? t.game.nodeJobSingular : t.game.nodeJobPlural
  return `${node.label}, ${categoryLabel}, ${t.game.nodeUsedIn} ${node.count} ${noun}.`
}

// D-16-YEAR-EFFECT: a node matches yearRange when null (pass-through) OR its
// .years tuple intersects [from, to]. Nodes without .years (test fixtures or
// pre-Phase-14 graph data) are treated as non-matching when a yearRange is set —
// safer default than silent pass-through, and aligns with the renderer-consumer
// contract from 16-PATTERNS.md.
function nodeMatchesYearRange(node, yearRange) {
  if (!yearRange) return true
  if (!node.years) return false
  const [from, to] = yearRange
  return node.years[0] <= to && node.years[1] >= from
}

// D-16-INTERSECT-HIGHLIGHT + D-16-YEAR-EFFECT: composite dim predicate.
// When any Phase 16 filter is active (highlightedSkillIds non-empty OR yearRange set):
//   dim when node is NOT in highlightedSkillIds OR fails yearRange intersection.
// Otherwise, fall back to Phase 15 single-select dim behavior.
function shouldDimNode(node, { selectedSkillId, highlightedSkillIds, yearRange }) {
  const filtersActive = (highlightedSkillIds && highlightedSkillIds.length > 0) || yearRange != null
  if (filtersActive) {
    const inHighlight = highlightedSkillIds && highlightedSkillIds.length > 0
      ? highlightedSkillIds.includes(node.id)
      : true
    const inYear = nodeMatchesYearRange(node, yearRange)
    return !(inHighlight && inYear)
  }
  // Phase 15 fallback: single-select halo dims everything except the selected node
  return selectedSkillId !== null && node.id !== selectedSkillId
}

export default function SvgConstellation({
  nodes,
  edges,
  layout,
  highlightedSkillIds,
  selectedSkillId,
  yearRange,
  justFilteredId = null,
  theme,
  lang,
  t,
  onSelectSkill,
  onHoverSkill,
}) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const [breakpoint] = useState(
    () => (typeof window !== 'undefined' && window.innerWidth >= 768 ? 'desktop' : 'mobile')
  )

  // Roving tabindex state — starts on the node with highest count (Java)
  const nodeRefs = useRef({})
  const rovingEntryRef = useRef(null)

  const [rovingNodeId, setRovingNodeId] = useState(() => {
    if (!nodes || nodes.length === 0) return null
    return nodes.reduce((max, n) => (!max || n.count > max.count ? n : max), null)?.id
  })

  const [focusedNodeId, setFocusedNodeId] = useState(null)
  const [hoveredNodeId, setHoveredNodeId] = useState(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  // The node with the highest count — drives the pulse indicator
  const biggestNodeId = useMemo(() => {
    if (!nodes || nodes.length === 0) return null
    return nodes.reduce((m, n) => (!m || n.count > m.count ? n : m), null)?.id
  }, [nodes])

  // Announce selection/deselection changes to screen readers
  useEffect(() => {
    if (selectedSkillId === null) {
      if (hasInteracted) setAnnouncement(t.game.selectionCleared)
      return
    }
    const node = nodes.find((n) => n.id === selectedSkillId)
    if (!node) return
    const text = t.game.skillSelected
      .replace('{name}', node.label)
      .replace('{n}', String(node.count))
      .replace('{s}', node.count === 1 ? '' : 's')
    setAnnouncement(text)
  }, [selectedSkillId, hasInteracted, lang, t, nodes]) // eslint-disable-line react-hooks/exhaustive-deps

  function moveFocus(nextId) {
    if (!nextId) return
    setRovingNodeId(nextId)
    setHasInteracted(true)
    setTimeout(() => nodeRefs.current[nextId]?.focus(), 0)
  }

  function handleKeyDown(e) {
    if (e.key in ARROW_VECTORS) {
      e.preventDefault()
      const next = findNextNode(rovingNodeId, e.key, nodes, layout)
      moveFocus(next)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (rovingNodeId) {
        setHasInteracted(true)
        onSelectSkill(rovingNodeId)
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      // Esc toggle-off: call onSelectSkill(selectedSkillId) so useConstellation toggles to null.
      // Avoids modifying Slice 2 hook contract (which toggles prev === id ? null : id).
      if (selectedSkillId !== null) onSelectSkill(selectedSkillId)
      rovingEntryRef.current?.focus()
    }
  }

  if (!nodes || nodes.length === 0) {
    return (
      <p className="text-text-secondary text-sm py-12 text-center">{t.game.empty}</p>
    )
  }

  const maxCount = Math.max(...nodes.map((n) => n.count))
  const nodesByCount = [...nodes].sort((a, b) => b.count - a.count)

  // WAI-ARIA APG: role="application" is a keyboard-widget container.
  // jsx-a11y doesn't recognize it as interactive; disable the false-positive rules.
  /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
  return (
    <div
      ref={rovingEntryRef}
      role="application"
      aria-label={t.game.constellationLabel}
      aria-roledescription={t.game.constellationRoleDesc}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm min-h-[44px]"
    >
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        style={{ minHeight: 240, maxHeight: 600 }}
        aria-hidden="true"
      >
        <g className="edges">
          {edges.map((e) => {
            const sourcePos = layout[e.source]
            const targetPos = layout[e.target]
            if (!sourcePos || !targetPos) return null
            // D-15-VIS-EDGE: weight ≥2 always visible; weight-1 fades in only when
            // incident to the active node (selected → focused → hovered fallback).
            const activeId = selectedSkillId || focusedNodeId || hoveredNodeId
            const incidentToActive = activeId !== null && (e.source === activeId || e.target === activeId)
            const isHeavy = e.weight >= 2
            let edgeOpacity = 0
            if (isHeavy) edgeOpacity = 1
            else if (incidentToActive) edgeOpacity = 1
            // D-16-YEAR-EFFECT + D-16-INTERSECT-HIGHLIGHT: when Phase 16 filters are
            // active, edges incident to dimmed nodes also dim (multiplied by 0.35).
            const filtersActive = (highlightedSkillIds && highlightedSkillIds.length > 0) || yearRange != null
            if (filtersActive) {
              const sourceNode = nodes.find((n) => n.id === e.source)
              const targetNode = nodes.find((n) => n.id === e.target)
              const sourceDim = sourceNode && shouldDimNode(sourceNode, { selectedSkillId, highlightedSkillIds, yearRange })
              const targetDim = targetNode && shouldDimNode(targetNode, { selectedSkillId, highlightedSkillIds, yearRange })
              if (sourceDim || targetDim) edgeOpacity *= 0.35
            }
            return (
              <line
                key={`${e.source}-${e.target}`}
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke={e.weight >= 2 ? 'var(--color-constellation-edge-heavy)' : 'var(--color-constellation-edge)'}
                strokeWidth={edgeStrokeWidth(e.weight)}
                style={{
                  opacity: edgeOpacity,
                  transition: prefersReducedMotion ? 'none' : 'opacity 200ms ease-out',
                  pointerEvents: 'none',
                }}
                className={prefersReducedMotion ? '' : 'motion-safe:animate-edge-reveal'}
              />
            )
          })}
        </g>

        <g className="nodes">
          {nodesByCount.map((node, sortIndex) => {
            const pos = layout[node.id]
            if (!pos) return null

            const r = computeRadius(node.count, maxCount, breakpoint)
            const isSelected = node.id === selectedSkillId

            // D-16-INTERSECT-HIGHLIGHT / D-16-YEAR-EFFECT: composite dim — falls back
            // to Phase 15 single-select behavior when no Phase 16 filter is active.
            const fillOpacity = shouldDimNode(node, {
              selectedSkillId,
              highlightedSkillIds,
              yearRange,
            }) ? 0.35 : 1

            const lightStroke = theme === 'light' ? LIGHT_THEME_STROKES[node.category] : 'none'
            const lightStrokeWidth = theme === 'light' ? 1.5 : 0

            // Halo filter: applied on selected node (skip under reduced-motion)
            const haloFilter = isSelected && !prefersReducedMotion
              ? 'drop-shadow(0 0 8px var(--color-constellation-halo)) drop-shadow(0 0 16px rgba(255,255,255,0.08))'
              : 'none'

            const isFocused = focusedNodeId === node.id

            // D-16-CHIP-FLASH (RESEARCH §7): apply motion-safe:animate-chip-flash on
            // the just-toggled node. CSS motion-safe variant already gates reduced-motion,
            // but the explicit JS guard belts-and-suspenders for environments where the
            // utility is stripped or motion-safe variant is unavailable.
            const flashClass = node.id === justFilteredId && !prefersReducedMotion
              ? 'motion-safe:animate-chip-flash'
              : ''
            const baseAnim = prefersReducedMotion ? '' : 'motion-safe:animate-node-reveal'
            const groupClassName = [baseAnim, flashClass].filter(Boolean).join(' ')

            return (
              <g
                key={node.id}
                ref={(el) => { nodeRefs.current[node.id] = el }}
                role="button"
                tabIndex={node.id === rovingNodeId ? 0 : -1}
                aria-label={buildNodeLabel(node, lang, t)}
                aria-pressed={node.id === selectedSkillId}
                data-node-id={node.id}
                data-category={node.category}
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  animationDelay: prefersReducedMotion ? '0ms' : `${sortIndex * 30}ms`,
                  animationName: prefersReducedMotion ? 'none' : undefined,
                  cursor: 'pointer',
                }}
                className={groupClassName}
                onClick={() => { setHasInteracted(true); onSelectSkill(node.id) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setHasInteracted(true)
                    onSelectSkill(node.id)
                  }
                }}
                onMouseEnter={() => {
                  setHasInteracted(true)
                  setHoveredNodeId(node.id)
                  onHoverSkill(node.id)
                }}
                onMouseLeave={() => {
                  setHoveredNodeId(null)
                  onHoverSkill(null)
                }}
                onFocus={() => { setHasInteracted(true); setFocusedNodeId(node.id) }}
                onBlur={() => setFocusedNodeId(null)}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={node.color}
                  fillOpacity={fillOpacity}
                  stroke={lightStroke}
                  strokeWidth={lightStrokeWidth}
                  style={{
                    filter: haloFilter,
                    transition: prefersReducedMotion ? 'none' : 'fill-opacity 200ms ease-out',
                  }}
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={22}
                  fill="transparent"
                  data-touch-target
                />
                {isFocused && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 4}
                    fill="none"
                    stroke="var(--color-brand)"
                    strokeWidth="2"
                    className="pointer-events-none"
                    aria-hidden="true"
                  />
                )}
                {node.id === biggestNodeId && !hasInteracted && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 2}
                    fill="none"
                    stroke={node.color}
                    strokeOpacity="0.5"
                    strokeWidth="2"
                    className="motion-safe:animate-pulse2"
                    aria-hidden="true"
                  />
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {prefersReducedMotion && !hasInteracted && (
        <p className="text-center mt-4 text-xs font-mono text-hintPill-text bg-hintPill-bg rounded-full px-3 py-2 inline-block">
          {t.game.hintPill}
        </p>
      )}

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  )
  /* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
}
