// src/marioWorld/WorldMap.js
//
// Capability wrapper around the renderer pair (Phase 22 Task 22.9):
//   - WebGL tier (lazy-loaded WebGLWorldMap) when effectiveCapability === 'webgl'
//     AND prefers-reduced-motion === false AND no context-loss has forced fallback
//   - SVG tier (SvgWorldMap) otherwise — also the Suspense + ErrorBoundary fallback
//
// Selecting a world (click on canvas / button) opens the WorldDetailOverlay
// for that world. Escape / backdrop / close-button dismisses.

import React, { useState, lazy, Suspense } from 'react'
import WorldErrorBoundary from './WorldErrorBoundary.js'
import SvgWorldMap from './renderers/SvgWorldMap.js'
import WorldDetailOverlay from './overlays/WorldDetailOverlay.js'
import useRendererCapability from '../game/useRendererCapability.js'

const WebGLWorldMap = lazy(() => import('./renderers/WebGLWorldMap.js'))

export default function WorldMap({ worldsData }) {
  const capability = useRendererCapability()
  const [forceSvg, setForceSvg] = useState(false)
  const [openWorldId, setOpenWorldId] = useState(null)
  const [unlockedSecrets] = useState([])

  const useGl = capability === 'webgl' && !forceSvg
  const openWorld = openWorldId
    ? (worldsData?.worlds ?? []).find((w) => w.id === openWorldId)
    : null

  const svgFallback = (
    <SvgWorldMap
      worldsData={worldsData}
      unlockedSecrets={unlockedSecrets}
      onWorldSelect={setOpenWorldId}
    />
  )

  return (
    <>
      <WorldErrorBoundary fallback={svgFallback}>
        {useGl ? (
          <Suspense fallback={svgFallback}>
            <WebGLWorldMap
              worldsData={worldsData}
              unlockedSecrets={unlockedSecrets}
              onWorldSelect={setOpenWorldId}
              onContextLost={() => setForceSvg(true)}
            />
          </Suspense>
        ) : svgFallback}
      </WorldErrorBoundary>
      {openWorld && (
        <WorldDetailOverlay world={openWorld} onClose={() => setOpenWorldId(null)} />
      )}
    </>
  )
}
