// src/marioWorld/WorldMap.js
//
// Capability wrapper around the renderer pair (Phase 22 Task 22.9):
//   - WebGL tier (lazy-loaded WebGLWorldMap) when effectiveCapability === 'webgl'
//     AND prefers-reduced-motion === false AND no context-loss has forced fallback
//   - SVG tier (SvgWorldMap) otherwise — also the Suspense + ErrorBoundary fallback
//
// Phase 23 Task 23.5 — owns the navigation + zoom state. Avatar position and
// camera drag-offset come from useWorldNav; selecting a world (canvas pick
// OR SvgWorldMap button) routes through useCinematicZoom.start(), which
// flips the WebGL renderer into a 600ms zoom-in animation. The overlay
// mounts only once zoom.state === 'inWorld'. Closing the overlay calls
// zoom.stop(), which plays the 400ms zoom-out before returning to the map
// at the avatar's last position (avatar position is preserved across the
// zoom — never reset).

import React, { useState, lazy, Suspense } from 'react'
import WorldErrorBoundary from './WorldErrorBoundary.js'
import SvgWorldMap from './renderers/SvgWorldMap.js'
import WorldDetailOverlay from './overlays/WorldDetailOverlay.js'
import useRendererCapability from '../game/useRendererCapability.js'
import useWorldNav from './hooks/useWorldNav.js'
import useCinematicZoom from './hooks/useCinematicZoom.js'

const WebGLWorldMap = lazy(() => import('./renderers/WebGLWorldMap.js'))

const WORLD_BBOX = { minX: -1000, maxX: 1000, minY: -800, maxY: 800 }

export default function WorldMap({ worldsData }) {
  const capability = useRendererCapability()
  const [forceSvg, setForceSvg] = useState(false)
  const [unlockedSecrets] = useState([])
  const nav = useWorldNav({ bbox: WORLD_BBOX })
  const zoom = useCinematicZoom()

  const useGl = capability === 'webgl' && !forceSvg

  const handleWorldSelect = (id) => zoom.start(id)
  const handleOverlayClose = () => zoom.stop()

  const openWorld = zoom.state === 'inWorld' && zoom.activeWorldId
    ? (worldsData?.worlds ?? []).find((w) => w.id === zoom.activeWorldId)
    : null

  const svgFallback = (
    <SvgWorldMap
      worldsData={worldsData}
      unlockedSecrets={unlockedSecrets}
      onWorldSelect={handleWorldSelect}
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
              onWorldSelect={handleWorldSelect}
              onContextLost={() => setForceSvg(true)}
              avatarPosition={nav.position}
              cameraOffset={nav.cameraOffset}
              isWalking={nav.isWalking}
              onPointerDownDrag={nav.onPointerDown}
              onPointerMoveDrag={nav.onPointerMove}
              onPointerUpDrag={nav.onPointerUp}
              zoomState={zoom.state}
              zoomTargetWorldId={zoom.activeWorldId}
            />
          </Suspense>
        ) : svgFallback}
      </WorldErrorBoundary>
      {openWorld && (
        <WorldDetailOverlay world={openWorld} onClose={handleOverlayClose} />
      )}
    </>
  )
}
