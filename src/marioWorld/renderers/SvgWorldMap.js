// src/marioWorld/renderers/SvgWorldMap.js
//
// SVG-tier WorldMap renderer (Phase 22.3). Groups worlds by biome and renders
// each biome as a labeled <section role="region"> containing an ordered list
// of world buttons. Hidden secrets are gated by `unlockedSecrets` (bare ids).
// Roving tabindex inside each biome supports arrow-key navigation.

import React, { useState, useRef, useCallback } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { BIOMES } from '../data/biomes'

function getLabel(world, lang) {
  if (typeof world.label === 'string') return world.label
  return world.label?.[lang] ?? world.label?.en ?? world.id
}

function describeWorld(world, lang) {
  if (world.type !== 'company' || !Array.isArray(world.levels) || world.levels.length === 0) return ''
  const titles = world.levels
    .map((l) => (typeof l.title === 'string' ? l.title : l.title?.[lang] ?? l.title?.en))
    .filter(Boolean)
    .join(', ')
  const starts = world.levels.map((l) => l.period?.start).filter((n) => typeof n === 'number')
  const ends = world.levels.map((l) => l.period?.end).filter((n) => typeof n === 'number')
  if (starts.length === 0) return titles
  const start = Math.min(...starts)
  const end = ends.length > 0 ? Math.max(...ends) : start
  return `${titles} ${start}–${end}`.trim()
}

function isVisible(world, unlockedSet) {
  if (!world.hidden) return true
  const bare = world.id.replace(/^secret:/, '')
  return unlockedSet.has(bare)
}

function BiomeRegion({ biome, items, lang, onWorldSelect }) {
  const [focusIdx, setFocusIdx] = useState(0)
  const btnRefs = useRef([])
  const headingId = `world-biome-${biome.id}`

  const onKeyDown = useCallback((e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1
    const next = (focusIdx + dir + items.length) % items.length
    setFocusIdx(next)
    const ref = btnRefs.current[next]
    if (ref && typeof ref.focus === 'function') ref.focus()
  }, [focusIdx, items.length])

  return (
    <section role="region" aria-labelledby={headingId} className="mb-8">
      <h2 id={headingId} className="mb-3 text-lg font-bold">
        {biome.id}
        {' ('}
        {biome.era[0]}
        {'–'}
        {biome.era[1]}
        {') — '}
        {biome.stack}
      </h2>
      <ol className="flex flex-wrap gap-3" onKeyDown={onKeyDown}>
        {items.map((w, i) => {
          const label = getLabel(w, lang)
          const desc = describeWorld(w, lang)
          const ariaLabel = desc ? `${label} — ${desc}` : label
          return (
            <li key={w.id}>
              <button
                ref={(el) => { btnRefs.current[i] = el }}
                type="button"
                aria-label={ariaLabel}
                tabIndex={i === focusIdx ? 0 : -1}
                onClick={() => onWorldSelect(w.id)}
                className="rounded-lg border border-ink-700 px-3 py-2 text-sm hover:bg-ink-800 focus:outline-none focus:ring-2 focus:ring-brand"
                style={{ borderColor: biome.color }}
              >
                {label}
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default function SvgWorldMap({
  worldsData,
  unlockedSecrets = [],
  onWorldSelect = () => {},
}) {
  const { lang } = useLanguage()
  const worlds = worldsData?.worlds ?? []

  if (worlds.length === 0) {
    return (
      <p className="p-8 text-center">Portfolio temporarily unavailable</p>
    )
  }

  const unlockedSet = new Set(unlockedSecrets)
  const visible = worlds.filter((w) => isVisible(w, unlockedSet))

  if (visible.length === 0) {
    return (
      <p className="p-8 text-center">Portfolio temporarily unavailable</p>
    )
  }

  const byBiome = new Map()
  for (const w of visible) {
    if (!byBiome.has(w.biome)) byBiome.set(w.biome, [])
    byBiome.get(w.biome).push(w)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {Object.values(BIOMES).map((biome) => {
        const items = byBiome.get(biome.id)
        if (!items || items.length === 0) return null
        return (
          <BiomeRegion
            key={biome.id}
            biome={biome}
            items={items}
            lang={lang}
            onWorldSelect={onWorldSelect}
          />
        )
      })}
    </div>
  )
}
