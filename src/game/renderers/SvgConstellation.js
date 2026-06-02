import React, { useState, useEffect } from 'react'

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

export default function SvgConstellation({
  nodes,
  edges,
  layout,
  highlightedSkillIds, // eslint-disable-line no-unused-vars
  selectedSkillId,
  yearRange, // eslint-disable-line no-unused-vars
  theme,
  lang, // eslint-disable-line no-unused-vars
  t,
  onSelectSkill, // eslint-disable-line no-unused-vars
  onHoverSkill, // eslint-disable-line no-unused-vars
}) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const [breakpoint] = useState(
    () => (typeof window !== 'undefined' && window.innerWidth >= 768 ? 'desktop' : 'mobile')
  )

  if (!nodes || nodes.length === 0) {
    return (
      <p className="text-text-secondary text-sm py-12 text-center">{t.game.empty}</p>
    )
  }

  const maxCount = Math.max(...nodes.map((n) => n.count))
  const nodesByCount = [...nodes].sort((a, b) => b.count - a.count)

  return (
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
                opacity: e.weight >= 2 ? 1 : 0,
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

          // Pitfall 4: guard against premature dimming before any selection
          const fillOpacity = selectedSkillId !== null && !isSelected ? 0.35 : 1

          const lightStroke = theme === 'light' ? LIGHT_THEME_STROKES[node.category] : 'none'
          const lightStrokeWidth = theme === 'light' ? 1.5 : 0

          // Halo filter: applied on selected node (Pitfall 3: skip entirely under reduced-motion)
          const haloFilter = isSelected && !prefersReducedMotion
            ? 'drop-shadow(0 0 8px var(--color-constellation-halo)) drop-shadow(0 0 16px rgba(255,255,255,0.08))'
            : 'none'

          return (
            <g
              key={node.id}
              data-node-id={node.id}
              data-category={node.category}
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animationDelay: prefersReducedMotion ? '0ms' : `${sortIndex * 30}ms`,
                animationName: prefersReducedMotion ? 'none' : undefined,
              }}
              className={prefersReducedMotion ? '' : 'motion-safe:animate-node-reveal'}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill={node.color}
                fillOpacity={fillOpacity}
                stroke={lightStroke}
                strokeWidth={lightStrokeWidth}
                style={{ filter: haloFilter }}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={22}
                fill="transparent"
                data-touch-target
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}
