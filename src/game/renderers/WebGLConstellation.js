import React, { useRef, useEffect } from 'react'
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  LineBasicMaterial,
  Points,
  LineSegments,
  Color,
} from 'three'

// Phase 17 WebGLConstellation — Slice 2 full graph parity.
// Honors the Phase 15 SvgConstellation props contract verbatim. Renders 26
// nodes as a single Points draw + ~50 edges as a single LineSegments draw with
// RGBA per-vertex color (itemSize=4) so the alpha channel carries edge opacity
// independently of RGB (WARNING 5 — no pre-multiplied RGB hacks). Theme
// dark↔light toggle re-reads CSS vars via getComputedStyle and re-uploads
// uHaloColor uniform + per-vertex strokeColor + per-vertex edge RGBA color
// within one rAF (no wrong-theme flash).
//
// hoveredSkillId is consumed as a PROP per BLOCKER 2 (no internal hover state).
// Slice 4 will wire it to the weight-1 edge reveal + hover halo uniform.
//
// HELPERS — module-scope, ported VERBATIM from SvgConstellation.js (lines 7-30,
// 73-95). Pattern J: each renderer owns its layout math; cross-renderer import
// would couple them via test brittleness.

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

// eslint-disable-next-line no-unused-vars
function edgeStrokeWidth(weight) {
  return weight === 1 ? 1.0 : Math.min(1.0 + (weight - 1) * 1.0, 4.0)
}

function nodeMatchesYearRange(node, yearRange) {
  if (!yearRange) return true
  if (!node.years) return false
  const [from, to] = yearRange
  return node.years[0] <= to && node.years[1] >= from
}

function shouldDimNode(node, { selectedSkillId, highlightedSkillIds, yearRange }) {
  const filtersActive = (highlightedSkillIds && highlightedSkillIds.length > 0) || yearRange != null
  if (filtersActive) {
    const inHighlight = highlightedSkillIds && highlightedSkillIds.length > 0
      ? highlightedSkillIds.includes(node.id)
      : true
    const inYear = nodeMatchesYearRange(node, yearRange)
    return !(inHighlight && inYear)
  }
  return selectedSkillId !== null && node.id !== selectedSkillId
}

// CSS-var → THREE.Color parser. RESEARCH §9 — handles hex, modern
// rgb(r g b / a) (alpha stripped per Pitfall 14), and legacy rgb(r, g, b).
// Alpha is carried separately via parseCSSAlpha for RGBA edge attribute
// (WARNING 5) and uHaloAlpha uniform.
export function parseCSSColor(str) {
  if (str == null) return new Color(0xffffff)
  const s = String(str).trim()
  if (s.startsWith('#')) return new Color(s)
  const m = s.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/)
  if (m) {
    const [, r, g, b] = m
    return new Color(Number(r) / 255, Number(g) / 255, Number(b) / 255)
  }
  return new Color(0xffffff)
}

// Extract alpha component from a CSS color string. Returns 1.0 when no alpha
// specified (hex or comma-rgb). Modern `rgb(r g b / a)` slash syntax carries
// alpha — required for RGBA edge BufferAttribute 4th component (WARNING 5).
export function parseCSSAlpha(str) {
  if (str == null) return 1
  const s = String(str).trim()
  const slashMatch = s.match(/\/\s*([\d.]+)\s*\)/)
  if (slashMatch) return Number(slashMatch[1])
  const rgbaMatch = s.match(/^rgba\([^)]*,\s*([\d.]+)\s*\)/)
  if (rgbaMatch) return Number(rgbaMatch[1])
  return 1
}

// Deterministic 32-bit string hash — Slice 3 ambient drift seed. Same input
// always produces same output so per-node phase/period values are stable
// across renders (test-friendly + visually consistent across reloads).
// Simple polynomial rolling hash; sufficient for ~26 nodes × 4 seeds.
export function hashNodeId(str) {
  const s = String(str)
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h
}

// Slice 3 vertex shader — per-vertex size/color/halo/dim with DPR-aware
// gl_PointSize PLUS ambient drift via per-vertex phaseX/phaseY/periodX/periodY
// driven by uTime + uDriftAmp (UI-SPEC §Animation Contract #1: amplitude
// 0.2 SVG units, period 4-6s, deterministic per-node phase from hashNodeId).
// uHaloPulse is animated by the rAF loop in Slice 3 (no longer constant).
const VERTEX_SHADER = `
  attribute float size;
  attribute float halo;
  attribute float dim;
  attribute vec3 strokeColor;
  attribute float phaseX;
  attribute float phaseY;
  attribute float periodX;
  attribute float periodY;
  attribute float isHighlighted;
  varying vec3 vColor;
  varying float vHalo;
  varying float vDim;
  varying vec3 vStrokeColor;
  varying float vIsHighlighted;
  uniform float uDpr;
  uniform float uHaloPulse;
  uniform float uTime;
  uniform float uDriftAmp;
  void main() {
    vColor = color;
    vHalo = halo;
    vDim = dim;
    vStrokeColor = strokeColor;
    vIsHighlighted = isHighlighted;
    vec3 drifted = position + vec3(
      uDriftAmp * sin(6.2831853 * uTime / periodX + phaseX),
      uDriftAmp * sin(6.2831853 * uTime / periodY + phaseY),
      0.0
    );
    gl_PointSize = size * uDpr * (1.0 + (uHaloPulse - 1.0) * halo);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(drifted, 1.0);
  }
`

// Slice 3 fragment shader — circular sprite + stroke band + selected halo
// (modulated by uHaloPulse for 2s 1.0→1.15 cosine pulse — UI-SPEC #2) +
// highlighted halo ring (modulated by uHighlightAlpha for 3s 0.4→0.8 cosine
// brighten on non-selected highlighted nodes — UI-SPEC #3).
const FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vHalo;
  varying float vDim;
  varying vec3 vStrokeColor;
  varying float vIsHighlighted;
  uniform vec3 uHaloColor;
  uniform float uHaloAlpha;
  uniform float uStrokeMix;
  uniform float uHaloPulse;
  uniform float uHighlightAlpha;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float r = length(uv);
    float core = 1.0 - smoothstep(0.45, 0.5, r);
    float strokeBand = smoothstep(0.40, 0.45, r) - smoothstep(0.45, 0.5, r);
    float haloRing = smoothstep(0.45, 0.5, r) - smoothstep(0.5, 0.7, r);
    float highlightRing = smoothstep(0.50, 0.55, r) - smoothstep(0.55, 0.65, r);
    vec3 col = mix(vColor, vStrokeColor, strokeBand * uStrokeMix);
    col = mix(col, uHaloColor, vHalo * haloRing);
    float selectedHaloAlpha = haloRing * vHalo * uHaloAlpha * uHaloPulse * 0.6;
    float highlightedHaloAlpha = highlightRing * vIsHighlighted * (1.0 - vHalo) * uHaloAlpha * uHighlightAlpha;
    float alpha = (core + strokeBand * uStrokeMix + selectedHaloAlpha + highlightedHaloAlpha) * vDim;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(col, alpha);
  }
`

export default function WebGLConstellation({
  nodes,
  edges,
  layout,
  highlightedSkillIds,
  selectedSkillId,
  hoveredSkillId, // eslint-disable-line no-unused-vars
  yearRange,
  justFilteredId, // eslint-disable-line no-unused-vars
  theme,
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
  const edgeGeometryRef = useRef(null)
  const edgeMaterialRef = useRef(null)

  // Main scene setup: 26 Points + 50 LineSegments, attributes built once per
  // (nodes, edges, layout) tuple. Dim/halo/strokeColor/edge-RGBA are
  // re-uploaded by dedicated effects below when their inputs change.
  useEffect(() => {
    if (!canvasRef.current || !nodes || nodes.length === 0) return undefined

    const scene = new Scene()
    sceneRef.current = scene
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

    // ── Node geometry ── single draw, 26 Points
    const N = nodes.length
    const maxCount = Math.max(...nodes.map((n) => n.count))
    const positions = new Float32Array(N * 3)
    const colors = new Float32Array(N * 3)
    const sizes = new Float32Array(N)
    const dims = new Float32Array(N)
    const halos = new Float32Array(N)
    const strokeColors = new Float32Array(N * 3)
    // Slice 3 — per-vertex ambient drift seed (deterministic hash) + per-vertex
    // highlight flag for the uHighlightAlpha modulation. Period range [4.0, 6.0]s
    // per UI-SPEC #1; phase ∈ [0, 2π) so each node starts at a unique offset.
    const phaseXs = new Float32Array(N)
    const phaseYs = new Float32Array(N)
    const periodXs = new Float32Array(N)
    const periodYs = new Float32Array(N)
    const isHighlighteds = new Float32Array(N)
    const highlightSet = highlightedSkillIds && highlightedSkillIds.length > 0
      ? new Set(highlightedSkillIds)
      : null

    nodes.forEach((node, i) => {
      const pos = layout[node.id] || { x: 0, y: 0 }
      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = 0
      const fill = parseCSSColor(node.color)
      colors[i * 3] = fill.r
      colors[i * 3 + 1] = fill.g
      colors[i * 3 + 2] = fill.b
      sizes[i] = computeRadius(node.count, maxCount, 'desktop')
      const dimmed = shouldDimNode(node, { selectedSkillId, highlightedSkillIds, yearRange })
      dims[i] = dimmed ? 0.35 : 1.0
      halos[i] = node.id === selectedSkillId ? 1.0 : 0.0
      const strokeRaw = theme === 'light' ? LIGHT_THEME_STROKES[node.category] : null
      const stroke = strokeRaw ? parseCSSColor(strokeRaw) : new Color(0, 0, 0)
      strokeColors[i * 3] = stroke.r
      strokeColors[i * 3 + 1] = stroke.g
      strokeColors[i * 3 + 2] = stroke.b
      // Deterministic per-node drift seeds (4 independent hashes via id salting).
      phaseXs[i] = ((hashNodeId(node.id) % 1000) / 1000) * 6.2831853
      phaseYs[i] = ((hashNodeId(`${node.id}y`) % 1000) / 1000) * 6.2831853
      // periodX/Y range [4.0, 6.0] seconds — (hash % 1000) / 500 yields [0, 2).
      periodXs[i] = 4.0 + ((hashNodeId(`${node.id}px`) % 1000) / 500)
      periodYs[i] = 4.0 + ((hashNodeId(`${node.id}py`) % 1000) / 500)
      isHighlighteds[i] = highlightSet && highlightSet.has(node.id) ? 1.0 : 0.0
    })

    const geometry = new BufferGeometry()
    geometryRef.current = geometry
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('color', new BufferAttribute(colors, 3))
    geometry.setAttribute('size', new BufferAttribute(sizes, 1))
    geometry.setAttribute('dim', new BufferAttribute(dims, 1))
    geometry.setAttribute('halo', new BufferAttribute(halos, 1))
    geometry.setAttribute('strokeColor', new BufferAttribute(strokeColors, 3))
    geometry.setAttribute('phaseX', new BufferAttribute(phaseXs, 1))
    geometry.setAttribute('phaseY', new BufferAttribute(phaseYs, 1))
    geometry.setAttribute('periodX', new BufferAttribute(periodXs, 1))
    geometry.setAttribute('periodY', new BufferAttribute(periodYs, 1))
    geometry.setAttribute('isHighlighted', new BufferAttribute(isHighlighteds, 1))

    const material = new ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uDpr: { value: dpr },
        uHaloColor: { value: new Color(0xffffff) },
        uHaloAlpha: { value: 0.18 },
        uStrokeMix: { value: theme === 'light' ? 1.0 : 0.0 },
        uHaloPulse: { value: 1.0 },
        // Slice 3 — driven by the rAF loop below.
        uTime: { value: 0.0 },
        uDriftAmp: { value: 0.2 },
        uHighlightAlpha: { value: 0.4 },
        // Slice 4 placeholders so the material constructor is touched once.
        uFlashNodeId: { value: -1 },
        uFlashStartTime: { value: -Infinity },
        uActiveNodeId: { value: -1 },
      },
    })
    materialRef.current = material
    const points = new Points(geometry, material)
    scene.add(points)

    // ── Edge geometry ── single draw, ~50 LineSegments with RGBA per-vertex color
    const E = edges ? edges.length : 0
    const edgePositions = new Float32Array(E * 2 * 3)
    const edgeColors = new Float32Array(E * 2 * 4) // RGBA — WARNING 5
    const cs = typeof window !== 'undefined'
      ? getComputedStyle(document.documentElement)
      : null
    const edgeLight = cs ? cs.getPropertyValue('--color-constellation-edge') : ''
    const edgeHeavy = cs ? cs.getPropertyValue('--color-constellation-edge-heavy') : ''
    const lightCol = parseCSSColor(edgeLight)
    const lightAlpha = parseCSSAlpha(edgeLight)
    const heavyCol = parseCSSColor(edgeHeavy)
    const heavyAlpha = parseCSSAlpha(edgeHeavy)

    if (edges) {
      edges.forEach((edge, i) => {
        const src = layout[edge.source]
        const tgt = layout[edge.target]
        if (!src || !tgt) return
        edgePositions[i * 6] = src.x
        edgePositions[i * 6 + 1] = src.y
        edgePositions[i * 6 + 2] = 0
        edgePositions[i * 6 + 3] = tgt.x
        edgePositions[i * 6 + 4] = tgt.y
        edgePositions[i * 6 + 5] = 0
        const heavy = edge.weight >= 2
        const col = heavy ? heavyCol : lightCol
        // Weight-1 edges start hidden (alpha=0) — Slice 4 reveals them on hover/select
        const a = heavy ? heavyAlpha : 0
        const base = i * 8
        edgeColors[base] = col.r
        edgeColors[base + 1] = col.g
        edgeColors[base + 2] = col.b
        edgeColors[base + 3] = a
        edgeColors[base + 4] = col.r
        edgeColors[base + 5] = col.g
        edgeColors[base + 6] = col.b
        edgeColors[base + 7] = a
      })
    }

    const edgeGeometry = new BufferGeometry()
    edgeGeometryRef.current = edgeGeometry
    edgeGeometry.setAttribute('position', new BufferAttribute(edgePositions, 3))
    edgeGeometry.setAttribute('color', new BufferAttribute(edgeColors, 4))
    const edgeMaterial = new LineBasicMaterial({
      vertexColors: true,
      transparent: true,
    })
    edgeMaterialRef.current = edgeMaterial
    const lineSegments = new LineSegments(edgeGeometry, edgeMaterial)
    scene.add(lineSegments)

    renderer.render(scene, camera)

    return () => {
      // Pitfall 8: dispose GPU resources to prevent leak on renderer swap.
      geometry.dispose()
      material.dispose()
      edgeGeometry.dispose()
      edgeMaterial.dispose()
      renderer.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, layout])

  // ── Theme reactivity ── re-read CSS vars + sync halo uniform + per-vertex
  // strokeColor attribute + per-vertex edge RGBA color (WARNING 5). Explicit
  // renderer.render() call lands the change within one rAF (no wrong-theme
  // flash — UI-SPEC §Theme Reactivity contract).
  useEffect(() => {
    if (!materialRef.current || !geometryRef.current || !edgeGeometryRef.current) return
    const root = document.documentElement
    const cs = getComputedStyle(root)
    const haloRaw = cs.getPropertyValue('--color-constellation-halo')
    materialRef.current.uniforms.uHaloColor.value = parseCSSColor(haloRaw)
    materialRef.current.uniforms.uHaloAlpha.value = parseCSSAlpha(haloRaw)
    materialRef.current.uniforms.uStrokeMix.value = theme === 'light' ? 1.0 : 0.0

    const strokeAttr = geometryRef.current.getAttribute('strokeColor')
    if (strokeAttr) {
      nodes.forEach((node, i) => {
        const raw = theme === 'light' ? (LIGHT_THEME_STROKES[node.category] || null) : null
        const c = raw ? parseCSSColor(raw) : new Color(0, 0, 0)
        strokeAttr.setXYZ(i, c.r, c.g, c.b)
      })
      strokeAttr.needsUpdate = true
    }

    const edgeColorAttr = edgeGeometryRef.current.getAttribute('color')
    if (edgeColorAttr && edges) {
      const edgeLight = cs.getPropertyValue('--color-constellation-edge')
      const edgeHeavy = cs.getPropertyValue('--color-constellation-edge-heavy')
      const lightCol = parseCSSColor(edgeLight)
      const lightAlpha = parseCSSAlpha(edgeLight)
      const heavyCol = parseCSSColor(edgeHeavy)
      const heavyAlpha = parseCSSAlpha(edgeHeavy)
      edges.forEach((edge, i) => {
        const heavy = edge.weight >= 2
        const c = heavy ? heavyCol : lightCol
        const a = heavy ? heavyAlpha : 0
        edgeColorAttr.setXYZW(i * 2, c.r, c.g, c.b, a)
        edgeColorAttr.setXYZW(i * 2 + 1, c.r, c.g, c.b, a)
      })
      edgeColorAttr.needsUpdate = true
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }, [theme, nodes, edges])

  // ── Selection halo ── single-attribute update on selectedSkillId change.
  useEffect(() => {
    if (!geometryRef.current) return
    const haloAttr = geometryRef.current.getAttribute('halo')
    if (!haloAttr) return
    nodes.forEach((node, i) => haloAttr.setX(i, node.id === selectedSkillId ? 1.0 : 0.0))
    haloAttr.needsUpdate = true
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }, [selectedSkillId, nodes])

  // ── Dim + isHighlighted attribute rebuild ── on any filter input change.
  // Slice 3 extends Slice 2 with the isHighlighted per-vertex attribute that
  // drives the fragment shader's halo-brighten ring on non-selected nodes.
  useEffect(() => {
    if (!geometryRef.current) return
    const dimAttr = geometryRef.current.getAttribute('dim')
    const isHAttr = geometryRef.current.getAttribute('isHighlighted')
    if (!dimAttr) return
    const highlightSet = highlightedSkillIds && highlightedSkillIds.length > 0
      ? new Set(highlightedSkillIds)
      : null
    nodes.forEach((node, i) => {
      const dimmed = shouldDimNode(node, { selectedSkillId, highlightedSkillIds, yearRange })
      dimAttr.setX(i, dimmed ? 0.35 : 1.0)
      if (isHAttr) {
        isHAttr.setX(i, highlightSet && highlightSet.has(node.id) ? 1.0 : 0.0)
      }
    })
    dimAttr.needsUpdate = true
    if (isHAttr) isHAttr.needsUpdate = true
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }, [highlightedSkillIds, yearRange, selectedSkillId, nodes])

  // ── Slice 3 rAF loop + visibilitychange pause ── always-running animation
  // loop per D-17-FRAMELOOP. Drives uTime accumulation + uHaloPulse cos curve
  // (2s period, 1.0→1.15 per UI-SPEC #2) + uHighlightAlpha cos curve (3s
  // period, 0.4→0.8 per UI-SPEC #3). Per-vertex sin drift happens entirely in
  // the vertex shader (uTime + phaseX/Y + periodX/Y attributes).
  //
  // Pitfall 15: rafId=null sentinel prevents double-cancel on tab-switch race.
  // Pitfall 16: lastT = performance.now() on resume avoids massive dt-jump
  //   after a long hidden duration (could be minutes → seconds of uTime jump).
  useEffect(() => {
    let rafId = null
    let lastT = performance.now()

    function tick(t) {
      const dt = (t - lastT) / 1000
      lastT = t
      const material = materialRef.current
      if (material) {
        material.uniforms.uTime.value += dt
        const tNow = material.uniforms.uTime.value
        const pulsePhase = (tNow % 2.0) / 2.0
        material.uniforms.uHaloPulse.value = 1.0 + 0.075 * (1.0 - Math.cos(2.0 * Math.PI * pulsePhase))
        const brightPhase = (tNow % 3.0) / 3.0
        material.uniforms.uHighlightAlpha.value = 0.4 + 0.2 * (1.0 - Math.cos(2.0 * Math.PI * brightPhase))
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
      rafId = requestAnimationFrame(tick)
    }

    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        if (rafId !== null) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
      } else if (rafId === null) {
        lastT = performance.now()
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

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
