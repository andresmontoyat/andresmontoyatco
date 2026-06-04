import React, { useRef, useEffect } from 'react'
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  Color,
} from 'three'

// Phase 17 WebGLConstellation — Slice 1 minimal renderer (walking-thin).
// Honors the Phase 15 SvgConstellation props contract verbatim so GameMode
// can spread the shared rendererProps to both renderers (D-17-PRIMITIVES,
// BLOCKER 2). Slice 1 renders ONE Point at layout[nodes[0].id] to validate
// (a) capability gate routing, (b) lazy chunk split, (c) ErrorBoundary
// swallows three.js failures into SVG fallback.
//
// IMPORTANT: hoveredSkillId is consumed as a PROP (not internal useState) per
// BLOCKER 2 / D-17-HOVERED-PROP. Slice 1 accepts it for contract parity;
// Slices 2-4 will wire it to the shader uniform that drives weight-1 edge
// reveals and hover halo.
//
// LIFTED module-scope helpers from SvgConstellation.js (lines 7-30) — declared
// here for Slice 2 reuse so the file is not re-touched solely for these. Slice 1
// does not call them (eslint-disable: declared-but-unused is intentional WIP).

/* eslint-disable no-unused-vars */
const LIGHT_THEME_STROKES = {
  lang: '#2563EB',
  ai: '#a855f7',
  arch: '#0891b2',
  cloud: '#059669',
  devops: '#d97706',
  security: '#ef4444',
  data: '#8b5cf6',
  hardware: '#db2777',
}

const SIZING = {
  mobile: { floor: 6, ceil: 14 },
  desktop: { floor: 10, ceil: 23 },
}

function computeRadius(count, maxCount, breakpoint) {
  const { floor, ceil } = SIZING[breakpoint]
  return floor + (Math.sqrt(count) / Math.sqrt(maxCount)) * (ceil - floor)
}

function edgeStrokeWidth(weight) {
  return weight === 1 ? 1.0 : Math.min(1.0 + (weight - 1) * 1.0, 4.0)
}
/* eslint-enable no-unused-vars */

// Trivial Slice 1 GLSL: one 10-px white point at the supplied vertex.
// Slice 2 replaces with the per-vertex attribute shader from 17-RESEARCH §2.
const VERTEX_SHADER = `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 10.0;
  }
`

const FRAGMENT_SHADER = `
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`

export default function WebGLConstellation({
  nodes,
  edges, // eslint-disable-line no-unused-vars
  layout,
  highlightedSkillIds, // eslint-disable-line no-unused-vars
  selectedSkillId, // eslint-disable-line no-unused-vars
  hoveredSkillId, // eslint-disable-line no-unused-vars
  yearRange, // eslint-disable-line no-unused-vars
  justFilteredId, // eslint-disable-line no-unused-vars
  theme, // eslint-disable-line no-unused-vars
  lang, // eslint-disable-line no-unused-vars
  t, // eslint-disable-line no-unused-vars
  onSelectSkill, // eslint-disable-line no-unused-vars
  onHoverSkill, // eslint-disable-line no-unused-vars
}) {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const materialRef = useRef(null)
  const geometryRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return undefined
    const firstNode = nodes && nodes.length > 0 ? nodes[0] : null
    const pos = (firstNode && layout?.[firstNode.id]) || { x: 500, y: 500 }

    const scene = new Scene()
    sceneRef.current = scene
    // Ortho camera spans the 0-1000 baked layout space (matches Phase 15).
    const camera = new OrthographicCamera(0, 1000, 0, 1000, -1, 1)
    cameraRef.current = camera

    const renderer = new WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    })
    rendererRef.current = renderer
    const dpr = typeof window !== 'undefined'
      ? Math.min(window.devicePixelRatio || 1, 2)
      : 1
    renderer.setPixelRatio(dpr)
    renderer.setSize(800, 600, false)

    const geometry = new BufferGeometry()
    geometryRef.current = geometry
    const positions = new Float32Array([pos.x, pos.y, 0])
    geometry.setAttribute('position', new BufferAttribute(positions, 3))

    const material = new ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      uniforms: {
        // Slice 2 wires per-vertex attributes + uniforms (color/glow/halo/dim).
        // Slice 1 keeps a placeholder uHaloColor so theme effect plumbing has
        // a uniform to write into when Slice 2 ports the theme reactivity.
        uHaloColor: { value: new Color(0xffffff) },
      },
    })
    materialRef.current = material

    const points = new Points(geometry, material)
    scene.add(points)
    renderer.render(scene, camera)

    return () => {
      // Pitfall 8: dispose GPU resources to prevent leak on renderer swap.
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [nodes, layout])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      tabIndex={-1}
      data-testid="webgl-canvas"
      className="webgl-canvas block w-full"
    />
  )
}
