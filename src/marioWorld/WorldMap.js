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

import React, { useState, useMemo, lazy, Suspense } from 'react'
import WorldErrorBoundary from './WorldErrorBoundary.js'
import SvgWorldMap from './renderers/SvgWorldMap.js'
import IllustratedWorldMap from './renderers/IllustratedWorldMap.js'
import WorldDetailOverlay from './overlays/WorldDetailOverlay.js'
import SecretCommandHint from './overlays/SecretCommandHint.js'
import useRendererCapability from './hooks/useRendererCapability.js'
import useWorldNav from './hooks/useWorldNav.js'
import useCinematicZoom from './hooks/useCinematicZoom.js'
import useSecretCommand from './hooks/useSecretCommand.js'
import { SECRET_WORLDS } from './data/secret-worlds.js'

// WebGL renderer kept as opt-in via ?renderer=webgl — default game-view
// is now the IllustratedWorldMap (SVG-illustrated overworld, no three.js
// in the critical path).
const WebGLWorldMap = lazy(() => import('./renderers/WebGLWorldMap.js'))

function readRendererOverride() {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('renderer')
}

const WORLD_BBOX = { minX: -200, maxX: 2000, minY: -200, maxY: 600 }

export default function WorldMap({ worldsData }) {
  const capability = useRendererCapability()
  const [forceSvg, setForceSvg] = useState(false)
  const [unlockedSecrets, setUnlockedSecrets] = useState([])
  const nav = useWorldNav({ bbox: WORLD_BBOX })
  const zoom = useCinematicZoom()

  const commands = useMemo(() => SECRET_WORLDS.map((s) => s.command), [])
  useSecretCommand({
    commands,
    onUnlock: (cmd) => {
      const entry = SECRET_WORLDS.find((s) => s.command === cmd)
      if (!entry) return
      setUnlockedSecrets((prev) => (prev.includes(entry.id) ? prev : [...prev, entry.id]))
    },
  })

  const rendererOverride = readRendererOverride()
  const useGl = rendererOverride === 'webgl' && !forceSvg
  const useSvgList = rendererOverride === 'svg' || capability !== 'webgl'

  const handleWorldSelect = (id) => zoom.start(id)
  const handleOverlayClose = () => zoom.stop()

  const openWorld = zoom.state === 'inWorld' && zoom.activeWorldId
    ? (worldsData?.worlds ?? []).find((w) => w.id === zoom.activeWorldId)
    : null

  const svgListFallback = (
    <SvgWorldMap
      worldsData={worldsData}
      unlockedSecrets={unlockedSecrets}
      onWorldSelect={handleWorldSelect}
    />
  )

  const illustrated = (
    <IllustratedWorldMap
      worldsData={worldsData}
      unlockedSecrets={unlockedSecrets}
      onWorldSelect={handleWorldSelect}
      avatarPosition={nav.position}
      cameraOffset={nav.cameraOffset}
      onPointerDownDrag={nav.onPointerDown}
      onPointerMoveDrag={nav.onPointerMove}
      onPointerUpDrag={nav.onPointerUp}
      zoomState={zoom.state}
      zoomTargetWorldId={zoom.activeWorldId}
    />
  )

  let body
  if (useGl) {
    body = (
      <Suspense fallback={illustrated}>
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
    )
  } else if (useSvgList) {
    body = svgListFallback
  } else {
    body = illustrated
  }

  return (
    <>
      <WorldErrorBoundary fallback={svgListFallback}>
        {body}
      </WorldErrorBoundary>
      {openWorld && (
        <WorldDetailOverlay world={openWorld} onClose={handleOverlayClose} />
      )}
      <SecretCommandHint />
    </>
  )
}
