// src/marioWorld/renderers/WebGLWorldMap.js
//
// WebGL-tier WorldMap renderer (Phase 22 Task 22.8 GREEN). One-shot render —
// NO requestAnimationFrame loop in Phase 22. Builds a static scene with:
//   - 5 biome planes (one per BIOMES entry) laid out across x slots
//   - one Sprite per visible world (hidden secrets gated by unlockedSecrets)
//   - one avatar Sprite at scene origin
//
// Pointer arbitration is delegated to useClickVsDrag — only intentional taps
// (Δ<5px, dt<250ms for mouse) project visible world positions to NDC and pick
// the nearest within 0.06 NDC radius, then invoke onWorldSelect(id).
//
// WebGL context loss bubbles up through onContextLost so the WorldMap wrapper
// can fall back to the SVG tier without unmounting React state.

import React, { useEffect, useRef } from 'react'
import {
  PerspectiveCamera, Scene, WebGLRenderer, Sprite, SpriteMaterial,
  TextureLoader, Vector3, Mesh, PlaneGeometry, MeshBasicMaterial,
} from 'three'
import useClickVsDrag from '../../game/useClickVsDrag.js'
import { BIOMES } from '../data/biomes.js'

const CAMERA_FOV = 55
const CAMERA_NEAR = 10
const CAMERA_FAR = 2000
const CANVAS_CENTER = { x: 500, y: 500 }
const PICK_NDC_RADIUS = 0.06
const BIOME_ORDER = ['pradera', 'desierto', 'selva', 'cyber', 'castillo']
const BIOME_PLANE_SIZE = 400
const BIOME_SPACING = 420
const AVATAR_TEXTURE = '/sprites/avatar-carlos-walk.webp'
const WORLD_ICON_TEXTURE = '/sprites/world-icons.webp'

function isVisible(world, unlockedSet) {
  if (!world.hidden) return true
  const bare = world.id.replace(/^secret:/, '')
  return unlockedSet.has(bare)
}

export default function WebGLWorldMap({
  worldsData,
  unlockedSecrets = [],
  onWorldSelect = () => {},
  onContextLost = () => {},
}) {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const visibleRef = useRef([])
  const onWorldSelectRef = useRef(onWorldSelect)
  const onContextLostRef = useRef(onContextLost)

  useEffect(() => { onWorldSelectRef.current = onWorldSelect }, [onWorldSelect])
  useEffect(() => { onContextLostRef.current = onContextLost }, [onContextLost])

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

  const { onPointerDown, onPointerUp } = useClickVsDrag({ onClick: handleClick })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const width = canvas.clientWidth || 800
    const height = canvas.clientHeight || 600
    const aspect = width / height

    const scene = new Scene()
    const camera = new PerspectiveCamera(CAMERA_FOV, aspect, CAMERA_NEAR, CAMERA_FAR)
    camera.position.set(0, 0, 600)
    camera.lookAt(new Vector3(0, 0, 0))
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld(true)

    sceneRef.current = scene
    cameraRef.current = camera

    // Biome planes — 5 stacked across X, behind everything else (z=-10).
    const geometries = []
    const materials = []
    BIOME_ORDER.forEach((biomeId, idx) => {
      const biome = BIOMES[biomeId]
      if (!biome) return
      const geom = new PlaneGeometry(BIOME_PLANE_SIZE, BIOME_PLANE_SIZE)
      const mat = new MeshBasicMaterial({ color: biome.color, transparent: true, opacity: 0.35 })
      const mesh = new Mesh(geom, mat)
      const offsetX = (idx - (BIOME_ORDER.length - 1) / 2) * BIOME_SPACING
      mesh.position.set(offsetX, 0, -10)
      scene.add(mesh)
      geometries.push(geom)
      materials.push(mat)
    })

    // Visible worlds — hidden secrets gated by unlockedSecrets.
    const unlockedSet = new Set(unlockedSecrets || [])
    const worlds = (worldsData && worldsData.worlds) || []
    const visible = worlds
      .filter((w) => isVisible(w, unlockedSet))
      .map((w) => {
        const px = (w.position?.x ?? 0) - CANVAS_CENTER.x
        const py = (w.position?.y ?? 0) - CANVAS_CENTER.y
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
      sprite.scale.set(40, 40, 1)
      scene.add(sprite)
      materials.push(mat)
    })

    // Avatar sprite at scene origin, in front of biomes/worlds.
    const avatarTex = loader.load(AVATAR_TEXTURE)
    textures.push(avatarTex)
    const avatarMat = new SpriteMaterial({ map: avatarTex, transparent: true })
    const avatarSprite = new Sprite(avatarMat)
    avatarSprite.position.set(0, 0, 5)
    avatarSprite.scale.set(32, 32, 1)
    scene.add(avatarSprite)
    materials.push(avatarMat)

    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
    renderer.setSize(width, height, false)
    renderer.render(scene, camera)

    function handleContextLost(e) {
      if (e && typeof e.preventDefault === 'function') e.preventDefault()
      onContextLostRef.current()
    }
    canvas.addEventListener('webglcontextlost', handleContextLost)

    return () => {
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
      onPointerUp={onPointerUp}
    />
  )
}
