// src/marioWorld/renderers/IllustratedWorldMap.js
//
// Primary game-view renderer (v3.11 post-launch upgrade). Pure SVG (no
// three.js, no canvas). Renders the full Mario-Bros-overworld-inspired map
// as a single <svg> document with:
//   - 5 biome backdrop bands per BIOMES era (tiled SVG gradient + texture)
//   - Dotted era-ordered path connecting all visible worlds
//   - Pictograph badge per world (castle / pyramid / tree / skyline /
//     crystal tower / house / chest / gear / robot / envelope / star)
//   - Numbered W{n} badge mirroring SMW overworld
//   - Generic humanoid avatar at props.avatarPosition (cyan body)
//
// Drives onWorldSelect on world-button click, exposes drag handlers so the
// parent's useWorldNav drives camera pan via cameraOffset (translate on the
// inner <g>). zoomState + zoomTargetWorldId animate a CSS scale + translate
// transform on a wrapper <g> for the 600 ms cinematic-zoom enter / 400 ms
// exit (overlay still mounts at zoom.state === 'inWorld' via parent).
//
// Bundle-wise this replaces the WebGLWorldMap as the default path —
// WebGL stays available via ?renderer=webgl override. Net effect:
// three.js drops out of the critical path for 99% of users.

import React, { useMemo } from 'react'
import { useLanguage } from '../../i18n/LanguageContext.js'
import { BIOMES } from '../data/biomes.js'

const PAD = 120
const BIOME_BAND_HEIGHT = 360
const WORLD_RADIUS = 34
const PATH_DASH = '10 8'
const PATH_STROKE = 4

// ─── Pictograph library ─────────────────────────────────────────────────
// All paths drawn inside a 0..1 normalized box; the World component scales
// to (WORLD_RADIUS * 1.4) so the icon sits inside the circle.

const PICTOGRAPHS = {
  castle:   'M0.12 0.85 L0.12 0.55 L0.22 0.55 L0.22 0.4 L0.32 0.4 L0.32 0.55 L0.42 0.55 L0.42 0.3 L0.52 0.3 L0.52 0.55 L0.62 0.55 L0.62 0.4 L0.72 0.4 L0.72 0.55 L0.82 0.55 L0.82 0.85 Z M0.42 0.85 L0.42 0.65 L0.58 0.65 L0.58 0.85 Z',
  pyramid:  'M0.5 0.18 L0.88 0.85 L0.12 0.85 Z M0.5 0.18 L0.5 0.85 M0.34 0.61 L0.66 0.61',
  tree:     'M0.5 0.15 C0.74 0.15 0.85 0.4 0.74 0.55 C0.88 0.55 0.85 0.74 0.66 0.74 L0.34 0.74 C0.15 0.74 0.12 0.55 0.26 0.55 C0.15 0.4 0.26 0.15 0.5 0.15 Z M0.46 0.74 L0.46 0.9 L0.54 0.9 L0.54 0.74 Z',
  skyline:  'M0.1 0.85 L0.1 0.45 L0.22 0.45 L0.22 0.85 Z M0.26 0.85 L0.26 0.25 L0.38 0.25 L0.38 0.85 Z M0.42 0.85 L0.42 0.55 L0.5 0.55 L0.5 0.85 Z M0.54 0.85 L0.54 0.15 L0.7 0.15 L0.7 0.85 Z M0.74 0.85 L0.74 0.4 L0.86 0.4 L0.86 0.85 Z M0.32 0.4 L0.32 0.34 L0.34 0.34 L0.34 0.4 M0.6 0.25 L0.6 0.18 L0.64 0.18 L0.64 0.25',
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
  const m = {
    pradera: 'castle', desierto: 'pyramid', selva: 'tree', cyber: 'skyline', castillo: 'crystal',
  }
  return m[world.biome] || 'castle'
}

function labelOf(world, lang) {
  if (typeof world.label === 'string') return world.label
  return world.label?.[lang] || world.id
}

function eraOrderKey(world) {
  if (world.type === 'company') return world.levels?.[0]?.period?.start ?? 9999
  if (world.type === 'section') return ({ about: 0.1, skills: 0.2, projects: 0.3, claude: 0.4, contact: 0.5 })[world.id.split(':')[1]] ?? 9999
  return 9999  // secrets always last
}

function visibleWorlds(worldsData, unlockedSecrets) {
  const unlocked = new Set(unlockedSecrets || [])
  return (worldsData?.worlds || []).filter((w) => {
    if (!w.hidden) return true
    const bare = w.id.replace(/^secret:/, '')
    return unlocked.has(bare)
  })
}

function computeBbox(worlds) {
  if (!worlds.length) return { minX: 0, maxX: 1000, minY: 0, maxY: 400 }
  const xs = worlds.map((w) => w.position?.x ?? 0)
  const ys = worlds.map((w) => w.position?.y ?? 0)
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
  }
}

// ─── Sub-components ─────────────────────────────────────────────────────

function BiomeBackdrops({ worlds, bbox }) {
  // Group worlds by biome → render a band per biome from minX-to-maxX of its
  // worlds. Bands stack vertically? No — Mario overworld is horizontal. We
  // render bands SIDE-BY-SIDE along x, each band the full vertical strip.
  const byBiome = new Map()
  worlds.forEach((w) => {
    if (!byBiome.has(w.biome)) byBiome.set(w.biome, [])
    byBiome.get(w.biome).push(w)
  })
  const bands = []
  ;['pradera', 'desierto', 'selva', 'cyber', 'castillo'].forEach((biomeId) => {
    const items = byBiome.get(biomeId)
    if (!items?.length) return
    const xs = items.map((w) => w.position.x)
    const xMin = Math.min(...xs) - 80
    const xMax = Math.max(...xs) + 80
    bands.push({ biome: BIOMES[biomeId], xMin, xMax })
  })
  return (
    <g aria-hidden="true">
      {bands.map((band) => (
        <g key={band.biome.id}>
          <rect
            x={band.xMin}
            y={bbox.minY - PAD}
            width={band.xMax - band.xMin}
            height={BIOME_BAND_HEIGHT}
            fill={`url(#biome-grad-${band.biome.id})`}
            opacity="0.55"
          />
          {/* hill silhouettes — three rolling humps per band */}
          <path
            d={(() => {
              const w = band.xMax - band.xMin
              const y = bbox.minY + 60
              const h = 40
              return `M${band.xMin} ${y + h}
                Q${band.xMin + w * 0.15} ${y - h * 0.6} ${band.xMin + w * 0.3} ${y + h}
                Q${band.xMin + w * 0.5} ${y - h} ${band.xMin + w * 0.7} ${y + h}
                Q${band.xMin + w * 0.85} ${y - h * 0.4} ${band.xMax} ${y + h}
                L${band.xMax} ${bbox.minY + BIOME_BAND_HEIGHT - PAD} L${band.xMin} ${bbox.minY + BIOME_BAND_HEIGHT - PAD} Z`
            })()}
            fill={band.biome.color}
            opacity="0.22"
          />
          {/* biome label, top-left of band */}
          <text
            x={band.xMin + 16}
            y={bbox.minY - PAD + 30}
            fontSize="16"
            fontFamily="monospace"
            fill={band.biome.color}
            opacity="0.85"
            fontWeight="700"
          >
            {band.biome.id.toUpperCase()} · {band.biome.era[0]}–{band.biome.era[1]}
          </text>
        </g>
      ))}
    </g>
  )
}

function ConnectionPath({ orderedWorlds }) {
  if (orderedWorlds.length < 2) return null
  const d = orderedWorlds
    .map((w, i) => `${i === 0 ? 'M' : 'L'}${w.position.x} ${w.position.y}`)
    .join(' ')
  return (
    <path
      d={d}
      stroke="#fef3c7"
      strokeWidth={PATH_STROKE}
      strokeDasharray={PATH_DASH}
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
      aria-hidden="true"
    />
  )
}

function WorldNode({ world, idx, lang, onSelect, isTarget }) {
  const x = world.position.x
  const y = world.position.y
  const biome = BIOMES[world.biome] || { color: '#888' }
  const iconKey = pictographKey(world)
  const iconPath = PICTOGRAPHS[iconKey]
  const iconSize = WORLD_RADIUS * 1.4
  const label = labelOf(world, lang)

  return (
    <g
      transform={`translate(${x} ${y})`}
      role="button"
      tabIndex={0}
      aria-label={`${idx + 1}. ${label}`}
      onClick={() => onSelect(world.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(world.id) } }}
      style={{ cursor: 'pointer', outline: 'none' }}
      className="world-node focus:outline-none"
    >
      <title>{label}</title>
      {/* halo glow if zoom target */}
      {isTarget && (
        <circle r={WORLD_RADIUS + 14} fill={biome.color} opacity="0.35">
          <animate attributeName="r" values={`${WORLD_RADIUS + 8};${WORLD_RADIUS + 18};${WORLD_RADIUS + 8}`} dur="1.4s" repeatCount="indefinite" />
        </circle>
      )}
      {/* base disc */}
      <circle r={WORLD_RADIUS} fill={biome.color} stroke="#fef3c7" strokeWidth="3" />
      {/* pictograph */}
      <g transform={`translate(${-iconSize / 2} ${-iconSize / 2}) scale(${iconSize})`}>
        <path d={iconPath} fill="#1f2937" stroke="#fef3c7" strokeWidth="0.012" strokeLinejoin="round" />
      </g>
      {/* numbered badge top-right */}
      <g transform={`translate(${WORLD_RADIUS - 6} ${-WORLD_RADIUS + 6})`}>
        <circle r="13" fill="#fef3c7" stroke="#1f2937" strokeWidth="2" />
        <text textAnchor="middle" dominantBaseline="central" fontSize="13" fontFamily="monospace" fontWeight="700" fill="#1f2937">
          {idx + 1}
        </text>
      </g>
      {/* under-label */}
      <text
        y={WORLD_RADIUS + 22}
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
  const x = position?.x ?? 0
  const y = position?.y ?? 0
  return (
    <g transform={`translate(${x} ${y})`} aria-label="Carlos avatar">
      {/* shadow */}
      <ellipse cx="0" cy="22" rx="14" ry="4" fill="#000" opacity="0.3" />
      {/* legs */}
      <rect x="-7" y="6" width="6" height="14" rx="2" fill="#1e3a8a" />
      <rect x="1" y="6" width="6" height="14" rx="2" fill="#1e3a8a" />
      {/* body */}
      <path d="M-12 -6 Q-12 -16 0 -16 Q12 -16 12 -6 L10 8 L-10 8 Z" fill="#06b6d4" stroke="#0f172a" strokeWidth="2" />
      {/* head */}
      <circle cx="0" cy="-22" r="10" fill="#fcd34d" stroke="#0f172a" strokeWidth="2" />
      {/* eyes */}
      <circle cx="-3" cy="-23" r="1.4" fill="#0f172a" />
      <circle cx="3" cy="-23" r="1.4" fill="#0f172a" />
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
  const ordered = useMemo(
    () => [...visible].sort((a, b) => eraOrderKey(a) - eraOrderKey(b)),
    [visible],
  )
  const bbox = useMemo(() => computeBbox(visible), [visible])

  if (visible.length === 0) {
    return (
      <main data-testid="illustrated-world-map" className="container mx-auto p-12 text-center">
        <p>Portfolio temporarily unavailable</p>
      </main>
    )
  }

  const vbX = bbox.minX - PAD
  const vbY = bbox.minY - PAD
  const vbW = bbox.maxX - bbox.minX + 2 * PAD
  const vbH = Math.max(bbox.maxY - bbox.minY + 2 * PAD, BIOME_BAND_HEIGHT)

  const target = zoomTargetWorldId ? visible.find((w) => w.id === zoomTargetWorldId) : null
  const isZooming = zoomState === 'zoomingIn' || zoomState === 'inWorld'

  // Camera transform: pan via cameraOffset; zoom-in scales toward target.
  const baseTranslate = `translate(${-cameraOffset.x} ${-cameraOffset.y})`
  const zoomTransform = isZooming && target
    ? `translate(${vbX + vbW / 2} ${vbY + vbH / 2}) scale(2.4) translate(${-target.position.x} ${-target.position.y})`
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
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-full w-full"
        role="img"
        aria-label="Carlos Mario World Map"
      >
        <defs>
          {Object.values(BIOMES).map((b) => (
            <linearGradient key={b.id} id={`biome-grad-${b.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={b.color} stopOpacity="0.0" />
              <stop offset="60%" stopColor={b.color} stopOpacity="0.45" />
              <stop offset="100%" stopColor={b.color} stopOpacity="0.85" />
            </linearGradient>
          ))}
        </defs>
        <g
          transform={zoomTransform}
          style={{ transition: 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          <BiomeBackdrops worlds={visible} bbox={bbox} />
          <ConnectionPath orderedWorlds={ordered} />
          {ordered.map((w, i) => (
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
