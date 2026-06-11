// src/marioWorld/renderers/IllustratedWorldMap.js
//
// Primary game-view renderer. Pure SVG (no three.js, no canvas).
//
// v2 design: re-layouts the visible worlds into a snake/zigzag across the
// viewport so the map fills the screen the way an SMB3 / SMW overworld
// does — not a thin horizontal line. Each biome gets its own multi-layer
// parallax backdrop (sky gradient + far hills + mid hills + ground line +
// floating clouds). Worlds render as Mario-style "level signs": rounded
// square plates with biome-colored border, pictograph, numbered badge,
// and a small flag-on-a-pole accent for completed / featured worlds.
// Path between worlds = cubic-Bezier curves following the snake.
//
// All authoring stays renderer-local — `worlds.derive.js` output is
// preserved unchanged (tests don't move). The snake re-layout is a pure
// function of the world id + index, so the visual order is deterministic.

import React, { useMemo } from 'react'
import { useLanguage } from '../../i18n/LanguageContext.js'
import { BIOMES } from '../data/biomes.js'

// ─── Viewport constants ─────────────────────────────────────────────────
const VB_W = 1600
const VB_H = 900
const MARGIN_X = 80
const TOP_LABEL_BAND = 56
const HORIZON_Y = 700
const PATH_DASH = '14 10'
const PATH_STROKE = 5

// World plate size + badge
const PLATE_W = 110
const PLATE_H = 80
const PLATE_R = 16
const ICON_BOX = 56
const BADGE_R = 16

// Snake layout: 5 columns per biome, 3 rows wave
const ROW_Y = [240, 380, 520]   // alternating heights for snake feel

// ─── Pictograph library (normalized 0..1) ───────────────────────────────
const PICTOGRAPHS = {
  castle:   'M0.12 0.85 L0.12 0.55 L0.22 0.55 L0.22 0.4 L0.32 0.4 L0.32 0.55 L0.42 0.55 L0.42 0.3 L0.52 0.3 L0.52 0.55 L0.62 0.55 L0.62 0.4 L0.72 0.4 L0.72 0.55 L0.82 0.55 L0.82 0.85 Z M0.42 0.85 L0.42 0.65 L0.58 0.65 L0.58 0.85 Z',
  pyramid:  'M0.5 0.18 L0.88 0.85 L0.12 0.85 Z M0.5 0.18 L0.5 0.85 M0.34 0.61 L0.66 0.61',
  tree:     'M0.5 0.15 C0.74 0.15 0.85 0.4 0.74 0.55 C0.88 0.55 0.85 0.74 0.66 0.74 L0.34 0.74 C0.15 0.74 0.12 0.55 0.26 0.55 C0.15 0.4 0.26 0.15 0.5 0.15 Z M0.46 0.74 L0.46 0.9 L0.54 0.9 L0.54 0.74 Z',
  skyline:  'M0.1 0.85 L0.1 0.45 L0.22 0.45 L0.22 0.85 Z M0.26 0.85 L0.26 0.25 L0.38 0.25 L0.38 0.85 Z M0.42 0.85 L0.42 0.55 L0.5 0.55 L0.5 0.85 Z M0.54 0.85 L0.54 0.15 L0.7 0.15 L0.7 0.85 Z M0.74 0.85 L0.74 0.4 L0.86 0.4 L0.86 0.85 Z',
  crystal:  'M0.5 0.1 L0.78 0.4 L0.72 0.86 L0.28 0.86 L0.22 0.4 Z M0.5 0.1 L0.5 0.86 M0.22 0.4 L0.78 0.4 M0.36 0.4 L0.45 0.86 M0.64 0.4 L0.55 0.86',
  house:    'M0.5 0.18 L0.88 0.5 L0.78 0.5 L0.78 0.85 L0.58 0.85 L0.58 0.6 L0.42 0.6 L0.42 0.85 L0.22 0.85 L0.22 0.5 L0.12 0.5 Z',
  chest:    'M0.15 0.42 L0.15 0.85 L0.85 0.85 L0.85 0.42 Z M0.15 0.42 Q0.5 0.18 0.85 0.42 M0.45 0.55 L0.55 0.55 L0.55 0.7 L0.45 0.7 Z',
  gear:     'M0.5 0.2 L0.55 0.28 L0.65 0.25 L0.66 0.35 L0.74 0.4 L0.7 0.48 L0.74 0.56 L0.66 0.6 L0.65 0.7 L0.55 0.67 L0.5 0.75 L0.45 0.67 L0.35 0.7 L0.34 0.6 L0.26 0.56 L0.3 0.48 L0.26 0.4 L0.34 0.35 L0.35 0.25 L0.45 0.28 Z M0.5 0.38 A0.1 0.1 0 1 0 0.5 0.58 A0.1 0.1 0 1 0 0.5 0.38',
  robot:    'M0.3 0.28 L0.7 0.28 L0.7 0.6 L0.3 0.6 Z M0.4 0.4 A0.04 0.04 0 1 0 0.4 0.42 M0.6 0.4 A0.04 0.04 0 1 0 0.6 0.42 M0.42 0.52 L0.58 0.52 M0.5 0.18 L0.5 0.28 M0.46 0.16 L0.54 0.16 M0.25 0.6 L0.2 0.78 L0.35 0.78 M0.75 0.6 L0.8 0.78 L0.65 0.78 M0.42 0.6 L0.42 0.85 L0.58 0.85 L0.58 0.6',
  envelope: 'M0.12 0.32 L0.88 0.32 L0.88 0.78 L0.12 0.78 Z M0.12 0.32 L0.5 0.6 L0.88 0.32',
  star:     'M0.5 0.15 L0.59 0.42 L0.88 0.42 L0.65 0.59 L0.74 0.86 L0.5 0.7 L0.26 0.86 L0.35 0.59 L0.12 0.42 L0.41 0.42 Z',
}

function pictographKey(world) {
  if (world.type === 'section') {
    const m = { home: 'house', chest: 'chest', gear: 'gear', robot: 'robot', envelope: 'envelope' }
    return m[world.icon] || 'house'
  }
  if (world.type === 'secret') return 'star'
  const m = { pradera: 'castle', desierto: 'pyramid', selva: 'tree', cyber: 'skyline', castillo: 'crystal' }
  return m[world.biome] || 'castle'
}

function labelOf(world, lang) {
  if (typeof world.label === 'string') return world.label
  return world.label?.[lang] || world.id
}

function eraStart(world) {
  if (world.type === 'company') return world.levels?.[0]?.period?.start ?? 9999
  if (world.type === 'section') {
    return ({ about: 0, skills: 1, projects: 2, claude: 3, contact: 4 })[world.id.split(':')[1]] ?? 9999
  }
  return 99999
}

function visibleWorlds(worldsData, unlockedSecrets) {
  const unlocked = new Set(unlockedSecrets || [])
  return (worldsData?.worlds || []).filter((w) => {
    if (!w.hidden) return true
    return unlocked.has(w.id.replace(/^secret:/, ''))
  })
}

// Snake-layout: distribute visible worlds across the viewport in a wavy
// left→right pattern, grouped by biome. Each biome owns an x-segment;
// within the segment we stack worlds on alternating y rows so the path
// curves up + down like an SMB3 overworld.
function layoutWorlds(visible) {
  const groups = new Map()
  visible.forEach((w) => {
    if (!groups.has(w.biome)) groups.set(w.biome, [])
    groups.get(w.biome).push(w)
  })
  ;['pradera', 'desierto', 'selva', 'cyber', 'castillo'].forEach((b) => {
    if (groups.has(b)) {
      groups.get(b).sort((a, c) => eraStart(a) - eraStart(c))
    }
  })

  const orderedBiomes = ['pradera', 'desierto', 'selva', 'cyber', 'castillo']
    .filter((b) => groups.has(b))
  const biomeWidth = (VB_W - 2 * MARGIN_X) / Math.max(orderedBiomes.length, 1)
  const positioned = []
  orderedBiomes.forEach((biomeId, biomeIdx) => {
    const items = groups.get(biomeId)
    const xStart = MARGIN_X + biomeIdx * biomeWidth
    const slot = biomeWidth / (items.length + 1)
    items.forEach((w, i) => {
      const x = xStart + slot * (i + 1)
      // alternating row pattern: 0,1,2,1,0,1,2... so path snakes
      const rowIdx = (i + biomeIdx) % ROW_Y.length
      const y = ROW_Y[rowIdx]
      positioned.push({ ...w, sceneX: x, sceneY: y, biomeIdx })
    })
  })
  return { positioned, orderedBiomes, biomeWidth }
}

// ─── Sub-components ─────────────────────────────────────────────────────

function SkyAndGround({ orderedBiomes, biomeWidth }) {
  return (
    <g aria-hidden="true">
      {/* full sky gradient */}
      <rect x="0" y="0" width={VB_W} height={HORIZON_Y} fill="url(#sky-grad)" />
      {/* ground band */}
      <rect x="0" y={HORIZON_Y} width={VB_W} height={VB_H - HORIZON_Y} fill="#1f2937" />

      {orderedBiomes.map((biomeId, idx) => {
        const biome = BIOMES[biomeId]
        const x = MARGIN_X + idx * biomeWidth
        // far hills (back layer, faded)
        const farHills = `
          M${x} ${HORIZON_Y}
          Q${x + biomeWidth * 0.2} ${HORIZON_Y - 120} ${x + biomeWidth * 0.4} ${HORIZON_Y - 40}
          Q${x + biomeWidth * 0.6} ${HORIZON_Y - 160} ${x + biomeWidth * 0.8} ${HORIZON_Y - 60}
          Q${x + biomeWidth * 0.95} ${HORIZON_Y - 100} ${x + biomeWidth} ${HORIZON_Y}
          Z`
        // mid hills (front layer)
        const midHills = `
          M${x} ${HORIZON_Y}
          Q${x + biomeWidth * 0.15} ${HORIZON_Y - 60} ${x + biomeWidth * 0.35} ${HORIZON_Y - 20}
          Q${x + biomeWidth * 0.5} ${HORIZON_Y - 80} ${x + biomeWidth * 0.65} ${HORIZON_Y - 20}
          Q${x + biomeWidth * 0.85} ${HORIZON_Y - 70} ${x + biomeWidth} ${HORIZON_Y}
          Z`
        return (
          <g key={biome.id}>
            <path d={farHills} fill={biome.color} opacity="0.25" />
            <path d={midHills} fill={biome.color} opacity="0.5" />
            {/* horizon line accent */}
            <line x1={x} y1={HORIZON_Y} x2={x + biomeWidth} y2={HORIZON_Y} stroke={biome.color} strokeWidth="3" opacity="0.8" />
            {/* biome label panel top */}
            <g transform={`translate(${x + 18} 28)`}>
              <rect x="0" y="0" rx="6" ry="6" width="220" height="30" fill="#0f172a" opacity="0.7" />
              <text x="12" y="20" fontSize="14" fontFamily="monospace" fontWeight="700" fill={biome.color}>
                {biome.id.toUpperCase()} · {biome.era[0]}–{biome.era[1]}
              </text>
            </g>
            {/* biome divider vertical line */}
            {idx > 0 && (
              <line x1={x} y1={TOP_LABEL_BAND} x2={x} y2={HORIZON_Y} stroke="#64748b" strokeDasharray="4 8" opacity="0.3" />
            )}
          </g>
        )
      })}
    </g>
  )
}

function Clouds() {
  // 5 fluffy SVG clouds, varied sizes + opacity, no animation (perf)
  const clouds = [
    { x: 200, y: 140, s: 1 },
    { x: 520, y: 90, s: 0.7 },
    { x: 820, y: 160, s: 1.2 },
    { x: 1140, y: 100, s: 0.85 },
    { x: 1440, y: 180, s: 1 },
  ]
  return (
    <g aria-hidden="true">
      {clouds.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`} opacity="0.85">
          <ellipse cx="0" cy="0" rx="34" ry="18" fill="#f1f5f9" />
          <ellipse cx="-22" cy="6" rx="20" ry="14" fill="#f1f5f9" />
          <ellipse cx="24" cy="4" rx="22" ry="15" fill="#f1f5f9" />
        </g>
      ))}
    </g>
  )
}

function ConnectionPath({ ordered }) {
  if (ordered.length < 2) return null
  let d = `M${ordered[0].sceneX} ${ordered[0].sceneY}`
  for (let i = 1; i < ordered.length; i += 1) {
    const prev = ordered[i - 1]
    const cur = ordered[i]
    const midX = (prev.sceneX + cur.sceneX) / 2
    d += ` C${midX} ${prev.sceneY}, ${midX} ${cur.sceneY}, ${cur.sceneX} ${cur.sceneY}`
  }
  return (
    <path
      d={d}
      stroke="#fef3c7"
      strokeWidth={PATH_STROKE}
      strokeDasharray={PATH_DASH}
      strokeLinecap="round"
      fill="none"
      opacity="0.85"
      aria-hidden="true"
    />
  )
}

function WorldNode({ world, idx, lang, onSelect, isTarget }) {
  const biome = BIOMES[world.biome] || { color: '#888' }
  const iconPath = PICTOGRAPHS[pictographKey(world)]
  const label = labelOf(world, lang)
  const isSection = world.type === 'section'
  const isSecret = world.type === 'secret'

  return (
    <g
      transform={`translate(${world.sceneX} ${world.sceneY})`}
      role="button"
      tabIndex={0}
      aria-label={`${idx + 1}. ${label}`}
      onClick={() => onSelect(world.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(world.id) } }}
      style={{ cursor: 'pointer', outline: 'none' }}
      className="world-node"
    >
      <title>{label}</title>

      {/* pulsing halo if zoom target */}
      {isTarget && (
        <circle r={PLATE_W * 0.75} fill={biome.color} opacity="0.35">
          <animate attributeName="r" values={`${PLATE_W * 0.55};${PLATE_W * 0.85};${PLATE_W * 0.55}`} dur="1.4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* drop shadow under plate */}
      <ellipse cx="0" cy={PLATE_H / 2 + 10} rx={PLATE_W / 2} ry="6" fill="#000" opacity="0.4" />

      {/* level-sign plate */}
      <rect
        x={-PLATE_W / 2} y={-PLATE_H / 2}
        rx={PLATE_R} ry={PLATE_R}
        width={PLATE_W} height={PLATE_H}
        fill={isSecret ? '#3b0764' : '#fef3c7'}
        stroke={biome.color}
        strokeWidth="5"
      />

      {/* pictograph */}
      <g transform={`translate(${-ICON_BOX / 2} ${-ICON_BOX / 2 - 4}) scale(${ICON_BOX})`}>
        <path d={iconPath} fill={biome.color} stroke="#1f2937" strokeWidth="0.015" strokeLinejoin="round" />
      </g>

      {/* numbered badge */}
      <g transform={`translate(${PLATE_W / 2 - 8} ${-PLATE_H / 2 + 8})`}>
        <circle r={BADGE_R} fill={biome.color} stroke="#1f2937" strokeWidth="2" />
        <text textAnchor="middle" dominantBaseline="central" fontSize="14" fontFamily="monospace" fontWeight="700" fill="#fef3c7">
          {idx + 1}
        </text>
      </g>

      {/* flag pole accent for company-tier worlds */}
      {!isSection && !isSecret && (
        <g transform={`translate(${PLATE_W / 2 - 4} ${-PLATE_H / 2 - 30})`}>
          <line x1="0" y1="0" x2="0" y2="30" stroke="#1f2937" strokeWidth="2" />
          <polygon points="0,0 18,6 0,12" fill={biome.color} />
        </g>
      )}

      {/* under-label */}
      <text
        y={PLATE_H / 2 + 28}
        textAnchor="middle"
        fontSize="14"
        fontFamily="ui-sans-serif, system-ui"
        fontWeight="600"
        fill="#fef3c7"
        stroke="#0f172a"
        strokeWidth="3"
        paintOrder="stroke"
      >
        {label}
      </text>
    </g>
  )
}

function Avatar({ position }) {
  const x = (position?.x ?? 0)
  const y = (position?.y ?? 0)
  // Plant the avatar near the first row by default; useWorldNav supplies
  // x/y deltas as the user walks.
  return (
    <g transform={`translate(${MARGIN_X + 40 + x} ${ROW_Y[0] - 80 + y})`} aria-label="Carlos avatar">
      {/* shadow */}
      <ellipse cx="0" cy="34" rx="18" ry="5" fill="#000" opacity="0.4" />
      {/* legs */}
      <rect x="-9" y="10" width="8" height="22" rx="3" fill="#1e3a8a" />
      <rect x="1" y="10" width="8" height="22" rx="3" fill="#1e3a8a" />
      {/* body */}
      <path d="M-16 -8 Q-16 -22 0 -22 Q16 -22 16 -8 L14 12 L-14 12 Z" fill="#06b6d4" stroke="#0f172a" strokeWidth="2.5" />
      {/* head */}
      <circle cx="0" cy="-32" r="14" fill="#fcd34d" stroke="#0f172a" strokeWidth="2.5" />
      {/* hat (generic platformer cap silhouette, NOT mario IP — green to differentiate) */}
      <path d="M-15 -36 Q-15 -50 0 -50 Q15 -50 15 -36 L18 -32 L-18 -32 Z" fill="#16a34a" stroke="#0f172a" strokeWidth="2" />
      <ellipse cx="6" cy="-37" rx="6" ry="4" fill="#86efac" opacity="0.7" />
      {/* eyes */}
      <circle cx="-4" cy="-32" r="1.8" fill="#0f172a" />
      <circle cx="4" cy="-32" r="1.8" fill="#0f172a" />
    </g>
  )
}

// ─── Main component ─────────────────────────────────────────────────────

export default function IllustratedWorldMap({
  worldsData,
  unlockedSecrets = [],
  onWorldSelect = () => {},
  avatarPosition = { x: 0, y: 0 },
  cameraOffset = { x: 0, y: 0 },
  onPointerDownDrag,
  onPointerMoveDrag,
  onPointerUpDrag,
  zoomState = 'idle',
  zoomTargetWorldId = null,
}) {
  const { lang } = useLanguage()

  const visible = useMemo(
    () => visibleWorlds(worldsData, unlockedSecrets),
    [worldsData, unlockedSecrets],
  )
  const { positioned, orderedBiomes, biomeWidth } = useMemo(
    () => layoutWorlds(visible),
    [visible],
  )

  if (positioned.length === 0) {
    return (
      <main data-testid="illustrated-world-map" className="container mx-auto p-12 text-center">
        <p>Portfolio temporarily unavailable</p>
      </main>
    )
  }

  const target = zoomTargetWorldId ? positioned.find((w) => w.id === zoomTargetWorldId) : null
  const isZooming = zoomState === 'zoomingIn' || zoomState === 'inWorld'

  const baseTranslate = `translate(${-cameraOffset.x} ${-cameraOffset.y})`
  const zoomTransform = isZooming && target
    ? `translate(${VB_W / 2} ${VB_H / 2}) scale(2.4) translate(${-target.sceneX} ${-target.sceneY})`
    : baseTranslate

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-ink-900"
      onPointerDown={onPointerDownDrag}
      onPointerMove={onPointerMoveDrag}
      onPointerUp={onPointerUpDrag}
      onPointerLeave={onPointerUpDrag}
      style={{ touchAction: 'none' }}
    >
      <svg
        data-testid="illustrated-world-svg"
        data-renderer="illustrated"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="block h-full w-full"
        role="img"
        aria-label="Carlos Mario World Map"
      >
        <defs>
          <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c4a6e" />
            <stop offset="55%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#fef3c7" />
          </linearGradient>
        </defs>
        <g
          transform={zoomTransform}
          style={{ transition: 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          <SkyAndGround orderedBiomes={orderedBiomes} biomeWidth={biomeWidth} />
          <Clouds />
          <ConnectionPath ordered={positioned} />
          {positioned.map((w, i) => (
            <WorldNode
              key={w.id}
              world={w}
              idx={i}
              lang={lang}
              onSelect={onWorldSelect}
              isTarget={target?.id === w.id}
            />
          ))}
          <Avatar position={avatarPosition} />
        </g>
      </svg>
    </div>
  )
}
