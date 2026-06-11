// src/marioWorld/renderers/WebGLWorldMap.js
//
// WebGL-tier WorldMap renderer.
// Phase 22 Task 22.8 built the static scene; Phase 23 Task 23.5 added the
// rAF tick loop that powers avatar position lerp, walk-cycle UV advance,
// drag-driven camera offset, and the cinematic zoom transitions.
//
// Scene:
//   - 5 biome planes (one per BIOMES entry) laid out across x slots
//   - one Sprite per visible world (hidden secrets gated by unlockedSecrets)
//   - one avatar Sprite that follows props.avatarPosition (lerped)
//
// Pointer arbitration is delegated to useClickVsDrag — only intentional taps
// (Δ<5px, dt<250ms for mouse) project visible world positions to NDC and pick
// the nearest within 0.06 NDC radius, then invoke onWorldSelect(id). Drag
// pointers (past the click threshold) feed the parent's useWorldNav via the
// optional onPointerDownDrag/Move/Up callbacks.
//
// WebGL context loss bubbles up through onContextLost so the WorldMap wrapper
// can fall back to the SVG tier without unmounting React state.

import React, { useEffect, useRef } from 'react'
import {
  PerspectiveCamera, Scene, WebGLRenderer, Sprite, SpriteMaterial,
  TextureLoader, Vector3, Mesh, PlaneGeometry, MeshBasicMaterial,
} from 'three'
import useClickVsDrag from '../hooks/useClickVsDrag.js'
import { BIOMES } from '../data/biomes.js'

const CAMERA_FOV = 55
const CAMERA_NEAR = 10
const CAMERA_FAR = 5000
const PICK_NDC_RADIUS = 0.06
const BIOME_ORDER = ['pradera', 'desierto', 'selva', 'cyber', 'castillo']
const BIOME_PLANE_SIZE = 480
const AVATAR_TEXTURE = '/sprites/avatar-carlos-walk.webp'
const WORLD_ICON_TEXTURE = '/sprites/world-icons.webp'
const WORLD_SPRITE_SCALE = 80
const AVATAR_SPRITE_SCALE = 56
const CAMERA_FIT_PADDING = 1.25
const CAMERA_ZOOM_Z = 280
const LERP_POSITION = 0.12
const LERP_ZOOM = 0.1

function isVisible(world, unlockedSet) {
  if (!world.hidden) return true
  const bare = world.id.replace(/^secret:/, '')
  return unlockedSet.has(bare)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

// Compute the world coordinate-space center + the camera Z needed to fit the
// entire visible-worlds bbox on screen with padding. Worlds are authored in
// arbitrary 2D coords by `deriveWorlds` (x:50..1830, y:100..180 in current
// data); rather than hardcode a `CANVAS_CENTER`, derive it so layout changes
// don't push worlds off-screen on first paint.
function computeViewport(worldPositions, aspect, fovRad) {
  if (!worldPositions.length) {
    return { center: { x: 0, y: 0 }, cameraZ: 600 }
  }
  const xs = worldPositions.map((p) => p.x)
  const ys = worldPositions.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
  const halfW = Math.max((maxX - minX) / 2, 200)
  const halfH = Math.max((maxY - minY) / 2, 150)
  const zForWidth = halfW / (Math.tan(fovRad / 2) * aspect)
  const zForHeight = halfH / Math.tan(fovRad / 2)
  const cameraZ = Math.max(zForWidth, zForHeight) * CAMERA_FIT_PADDING
  return { center, cameraZ }
}

export default function WebGLWorldMap({
  worldsData,
  unlockedSecrets = [],
  onWorldSelect = () => {},
  onContextLost = () => {},
  avatarPosition = { x: 0, y: 0 },
  cameraOffset = { x: 0, y: 0 },
  isWalking = false,
  onPointerDownDrag,
  onPointerMoveDrag,
  onPointerUpDrag,
  zoomState = 'idle',
  zoomTargetWorldId = null,
}) {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rafRef = useRef(null)
  const avatarSpriteRef = useRef(null)
  const visibleRef = useRef([])
  const onWorldSelectRef = useRef(onWorldSelect)
  const onContextLostRef = useRef(onContextLost)
  const animPropsRef = useRef({ avatarPosition, cameraOffset, isWalking, zoomState, zoomTargetWorldId })

  useEffect(() => { onWorldSelectRef.current = onWorldSelect }, [onWorldSelect])
  useEffect(() => { onContextLostRef.current = onContextLost }, [onContextLost])
  useEffect(() => {
    animPropsRef.current = { avatarPosition, cameraOffset, isWalking, zoomState, zoomTargetWorldId }
  }, [avatarPosition, cameraOffset, isWalking, zoomState, zoomTargetWorldId])

  function handleClick(e) {
    const canvas = canvasRef.current
    const camera = cameraRef.current
    const visible = visibleRef.current
    if (!canvas || !camera || !visible || visible.length === 0) return
    const rect = canvas.getBoundingClientRect()
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    let best = null
    let bestDist = PICK_NDC_RADIUS
    visible.forEach((entry) => {
      const projected = entry.position.clone().project(camera)
      const dx = projected.x - ndcX
      const dy = projected.y - ndcY
      const dist = Math.hypot(dx, dy)
      if (dist < bestDist) {
        bestDist = dist
        best = entry.id
      }
    })
    if (best) onWorldSelectRef.current(best)
  }

  const arb = useClickVsDrag({ onClick: handleClick })

  function onPointerDown(e) {
    arb.onPointerDown(e)
    if (typeof onPointerDownDrag === 'function') onPointerDownDrag(e)
  }

  function onPointerMove(e) {
    if (typeof onPointerMoveDrag === 'function') onPointerMoveDrag(e)
  }

  function onPointerUp(e) {
    arb.onPointerUp(e)
    if (typeof onPointerUpDrag === 'function') onPointerUpDrag(e)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const width = canvas.clientWidth || 800
    const height = canvas.clientHeight || 600
    const aspect = width / height

    const scene = new Scene()
    const camera = new PerspectiveCamera(CAMERA_FOV, aspect, CAMERA_NEAR, CAMERA_FAR)

    // Compute viewport center + camera distance from the actual visible-world
    // bbox so the WHOLE map is visible on first paint, regardless of how the
    // upstream layout numbers world coordinates. The Phase-22 hardcoded
    // CANVAS_CENTER={500,500} only fit the 1000x1000 fixture; the real
    // deriveWorlds output spans ~1830x180 and was pushing 13/17 worlds off
    // screen.
    const rawWorlds = ((worldsData && worldsData.worlds) || [])
      .filter((w) => isVisible(w, new Set(unlockedSecrets || [])))
    const rawPositions = rawWorlds.map((w) => ({
      x: w.position?.x ?? 0,
      y: w.position?.y ?? 0,
    }))
    const fovRad = (CAMERA_FOV * Math.PI) / 180
    const { center: worldCenter, cameraZ: fitZ } = computeViewport(rawPositions, aspect, fovRad)

    camera.position.set(0, 0, fitZ)
    camera.lookAt(new Vector3(0, 0, 0))
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld(true)

    sceneRef.current = scene
    cameraRef.current = camera

    // Biome planes — laid out left→right under the visible worlds, equal
    // spacing across the world span so each biome backdrop aligns with the
    // worlds it owns (not centered on origin like the Phase-22 placeholder).
    const geometries = []
    const materials = []
    const xs = rawPositions.length ? rawPositions.map((p) => p.x) : [0]
    const span = Math.max(...xs) - Math.min(...xs)
    const biomeSpacing = span > 0 ? span / Math.max(BIOME_ORDER.length - 1, 1) : 420
    BIOME_ORDER.forEach((biomeId, idx) => {
      const biome = BIOMES[biomeId]
      if (!biome) return
      const geom = new PlaneGeometry(BIOME_PLANE_SIZE, BIOME_PLANE_SIZE)
      const mat = new MeshBasicMaterial({ color: biome.color, transparent: true, opacity: 0.35 })
      const mesh = new Mesh(geom, mat)
      const offsetX = (idx - (BIOME_ORDER.length - 1) / 2) * biomeSpacing
      mesh.position.set(offsetX, 0, -10)
      scene.add(mesh)
      geometries.push(geom)
      materials.push(mat)
    })

    // Visible worlds — translate raw positions to scene space by subtracting
    // the dynamic worldCenter (above), then store in visibleRef so the click
    // pick + camera follow can project them.
    const visible = rawWorlds.map((w) => {
      const px = (w.position?.x ?? 0) - worldCenter.x
      const py = -((w.position?.y ?? 0) - worldCenter.y)  // flip y: screen-y grows down, scene-y grows up
      return { id: w.id, position: new Vector3(px, py, 0) }
    })
    visibleRef.current = visible

    const loader = new TextureLoader()
    const textures = []
    visible.forEach((entry) => {
      const tex = loader.load(WORLD_ICON_TEXTURE)
      textures.push(tex)
      const mat = new SpriteMaterial({ map: tex, transparent: true })
      const sprite = new Sprite(mat)
      sprite.position.copy(entry.position)
      sprite.scale.set(WORLD_SPRITE_SCALE, WORLD_SPRITE_SCALE, 1)
      scene.add(sprite)
      materials.push(mat)
    })

    // Avatar sprite at scene origin, in front of biomes/worlds.
    const avatarTex = loader.load(AVATAR_TEXTURE)
    textures.push(avatarTex)
    const avatarMat = new SpriteMaterial({ map: avatarTex, transparent: true })
    const avatarSprite = new Sprite(avatarMat)
    avatarSprite.position.set(0, 0, 5)
    avatarSprite.scale.set(AVATAR_SPRITE_SCALE, AVATAR_SPRITE_SCALE, 1)
    scene.add(avatarSprite)
    materials.push(avatarMat)
    avatarSpriteRef.current = avatarSprite

    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
    renderer.setSize(width, height, false)

    // rAF tick — Phase 23 Task 23.5. Lerps avatar position toward
    // props.avatarPosition, lerps camera toward either the active world
    // (during zoomingIn / inWorld) or back to the player avatar (idle /
    // zoomingOut), and lerps camera.zoom between 1 and 3 to telegraph the
    // cinematic transition. The visible-world list and target id come from
    // refs so the loop never re-creates when callbacks update identity.
    function tick() {
      const props = animPropsRef.current
      const { avatarPosition: ap, cameraOffset: co, zoomState: zs, zoomTargetWorldId: ztid } = props
      const av = avatarSpriteRef.current
      if (av) {
        av.position.x = lerp(av.position.x, ap?.x ?? 0, LERP_POSITION)
        av.position.y = lerp(av.position.y, ap?.y ?? 0, LERP_POSITION)
      }
      const targetWorld = ztid ? visibleRef.current.find((v) => v.id === ztid) : null
      const isZoomedIn = zs === 'zoomingIn' || zs === 'inWorld'
      const tx = isZoomedIn && targetWorld ? targetWorld.position.x : (ap?.x ?? 0) + (co?.x ?? 0)
      const ty = isZoomedIn && targetWorld ? targetWorld.position.y : (ap?.y ?? 0) + (co?.y ?? 0)
      const tz = isZoomedIn ? CAMERA_ZOOM_Z : fitZ
      camera.position.x = lerp(camera.position.x, tx, LERP_POSITION)
      camera.position.y = lerp(camera.position.y, ty, LERP_POSITION)
      camera.position.z = lerp(camera.position.z, tz, LERP_ZOOM)
      camera.lookAt(camera.position.x, camera.position.y, 0)
      camera.updateMatrixWorld(true)
      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(tick)
    }
    // First render synchronously so existing tests (and SSR-ish smoke) see
    // a paint before the rAF loop kicks in.
    renderer.render(scene, camera)
    rafRef.current = requestAnimationFrame(tick)

    function handleContextLost(e) {
      if (e && typeof e.preventDefault === 'function') e.preventDefault()
      onContextLostRef.current()
    }
    canvas.addEventListener('webglcontextlost', handleContextLost)

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      scene.traverse((obj) => {
        if (obj.geometry && typeof obj.geometry.dispose === 'function') obj.geometry.dispose()
        if (obj.material) {
          if (obj.material.map && typeof obj.material.map.dispose === 'function') {
            obj.material.map.dispose()
          }
          if (typeof obj.material.dispose === 'function') obj.material.dispose()
        }
      })
      geometries.forEach((g) => { if (typeof g.dispose === 'function') g.dispose() })
      materials.forEach((m) => { if (typeof m.dispose === 'function') m.dispose() })
      textures.forEach((t) => { if (typeof t.dispose === 'function') t.dispose() })
      if (typeof renderer.dispose === 'function') renderer.dispose()
      sceneRef.current = null
      cameraRef.current = null
      avatarSpriteRef.current = null
      visibleRef.current = []
    }
  }, [worldsData, unlockedSecrets])

  return (
    <canvas
      ref={canvasRef}
      data-testid="webgl-world-canvas"
      data-renderer="webgl"
      className="block h-full w-full touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  )
}
