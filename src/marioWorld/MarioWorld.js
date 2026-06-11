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
import WorldMap from './WorldMap.js'

const SECRET_WORLDS = []

export default function MarioWorld() {
  const { viewMode, setViewMode } = useViewMode()
  const worldsData = useMemo(
    () => deriveWorlds(EXPERIENCE, SKILLS, SECTIONS, SECRET_WORLDS),
    [],
  )

  if (viewMode === null) return <HeroGameGate onPick={setViewMode} />
  if (viewMode === 'dev') return <DevView worldsData={worldsData} />
  return <WorldMap worldsData={worldsData} />
}
