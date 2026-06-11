// src/marioWorld/MarioWorld.js
//
// Orchestrator for the Mario-world experience (Phase 21.12).
// Reads viewMode from ViewModeContext and routes between:
//   - HeroGameGate (when viewMode === null)
//   - DevView      (when viewMode === 'dev')
//   - WorldMap     (when viewMode === 'game') — placeholder in Phase 21,
//                  replaced by the real renderer wrapper in Phase 22.
//
// SECRET_WORLDS is an empty array here; Phase 24 swaps in the real catalog.

import React, { useMemo } from 'react'
import { useViewMode } from '../context/ViewModeContext.js'
import { deriveWorlds } from './data/worlds.derive.js'
import EXPERIENCE from '../data/experience.js'
import SKILLS from '../data/skills.js'
import SECTIONS from '../data/sections.js'
import HeroGameGate from './HeroGameGate.js'
import DevView from './DevView.js'

// Placeholder until Phase 22 lands. Renders a "world map loading" message;
// allows phase-21 ship without renderer dependency.
function WorldMapPlaceholder() {
  return (
    <main
      data-testid="world-map-placeholder"
      className="container mx-auto p-12 text-center"
    >
      <h1 className="text-3xl font-bold">World map loading…</h1>
      <p className="mt-4">
        Hero gate took you here. The renderer arrives in Phase 22.
      </p>
    </main>
  )
}

const SECRET_WORLDS = []

export default function MarioWorld() {
  const { viewMode, setViewMode } = useViewMode()
  const worldsData = useMemo(
    () => deriveWorlds(EXPERIENCE, SKILLS, SECTIONS, SECRET_WORLDS),
    [],
  )

  if (viewMode === null) return <HeroGameGate onPick={setViewMode} />
  if (viewMode === 'dev') return <DevView worldsData={worldsData} />
  return <WorldMapPlaceholder />
}
