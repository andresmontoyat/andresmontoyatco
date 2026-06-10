import React, { useRef, useEffect } from 'react'
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  LineSegments,
  Color,
  Vector3,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import useClickVsDrag from '../useClickVsDrag'

// Phase 17 WebGLConstellation — Slice 4 chip-flash + weight-1 edge reveal +
// pointer-pick onHoverSkill callback (BLOCKER 2 — hoveredSkillId is a PROP
// from useConstellation; WebGL owns ZERO hover state and emits hover
// changes through the props.onHoverSkill callback only).
//
// Honors the Phase 15 SvgConstellation props contract verbatim. Renders 26
// nodes as a single Points draw + ~50 edges as a single LineSegments draw with
// RGBA per-vertex color (itemSize=4) so the alpha channel carries edge opacity
// independently of RGB (WARNING 5 — no pre-multiplied RGB hacks). Theme
// dark↔light toggle re-reads CSS vars via getComputedStyle and re-uploads
// uHaloColor uniform + per-vertex strokeColor + per-vertex edge RGBA color
// within one rAF (no wrong-theme flash).
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
  // D-20-PLANETS-TIER — planet band (top-K skills by count). UAT-tunable;
  // matches SvgConstellation SIZING for GAME-01 props-contract parity.
  mobile_planet: { floor: 14, ceil: 22 },
  desktop_planet: { floor: 24, ceil: 40 },
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

// Slice 4 — nodeId → vertex-index lookup for shader uniforms (uFlashNodeId,
// uActiveNodeId). Returns -1 sentinel when nodeId is null OR not found,
// matching the shader convention used throughout the vertex/fragment program.
function nodeIdToIndex(nodeId, nodes) {
  if (nodeId == null || !nodes) return -1
  return nodes.findIndex((n) => n.id === nodeId)
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

// Slice 3+4 vertex shader — per-vertex size/color/halo/dim with DPR-aware
// gl_PointSize PLUS ambient drift (Slice 3) PLUS Slice 4 chip-flash scale
// modulation. vIsFlashing varying gates the scale curve so non-flashing
// vertices stay at scale 1.0. flashProgress = clamp((uTime - uFlashStartTime)
// / 0.1, 0.0, 1.0) — shader self-resets after 100ms (no JS cleanup).
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
  attribute float vertexIndex;
  varying vec3 vColor;
  varying float vHalo;
  varying float vDim;
  varying vec3 vStrokeColor;
  varying float vIsHighlighted;
  varying float vFlashProgress;
  varying float vIsFlashing;
  uniform float uDpr;
  uniform float uHaloPulse;
  uniform float uTime;
  uniform float uDriftAmp;
  uniform float uFlashNodeId;
  uniform float uFlashStartTime;
  uniform float uCanvasHeight;
  uniform float uFovRad;
  void main() {
    vColor = color;
    vHalo = halo;
    vDim = dim;
    vStrokeColor = strokeColor;
    vIsHighlighted = isHighlighted;
    vIsFlashing = (abs(vertexIndex - uFlashNodeId) < 0.5) ? 1.0 : 0.0;
    vFlashProgress = clamp((uTime - uFlashStartTime) / 0.1, 0.0, 1.0);
    float flashScale = (vIsFlashing > 0.5)
      ? (1.0 - 0.06 * sin(vFlashProgress * 3.14159))
      : 1.0;
    vec3 drifted = position + vec3(
      uDriftAmp * sin(6.2831853 * uTime / periodX + phaseX),
      uDriftAmp * sin(6.2831853 * uTime / periodY + phaseY),
      0.0
    );
    vec4 mvPosition = modelViewMatrix * vec4(drifted, 1.0);
    // CRIT-05 perspective size-attenuation. perspectiveScale ≈ canvas-height /
    // (2 tan(fov/2)) — divide by -mvPosition.z so near nodes grow, far nodes
    // shrink. clamp [1, 64] defends against canvas-sized blob fragments under
    // aggressive near-clip rotation (Alert A5).
    float perspectiveScale = uCanvasHeight / (2.0 * tan(uFovRad / 2.0));
    float depthFactor = perspectiveScale / max(-mvPosition.z, 0.001);
    gl_PointSize = clamp(
      size * uDpr * (1.0 + (uHaloPulse - 1.0) * halo) * flashScale * depthFactor,
      1.0,
      64.0
    );
    gl_Position = projectionMatrix * mvPosition;
  }
`

// Phase 20 edge shaders (MOD-04 Option A) — per-vertex view-space angle
// falloff fades edges that point into the screen. vColor is the per-vertex
// RGBA the JS layer writes (weight-based alpha already applied). vViewPosition
// passes mvPosition.xyz to the fragment shader so per-pixel viewDir.z drives
// the fade. ShaderMaterial replaces LineBasicMaterial — keeps edge cost low
// (no Line2 / LineGeometry — would push WebGL chunk over 130 kB gz ceiling).
const EDGE_VERTEX_SHADER = `
  attribute vec4 color;
  varying vec4 vColor;
  varying vec3 vViewPosition;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const EDGE_FRAGMENT_SHADER = `
  varying vec4 vColor;
  varying vec3 vViewPosition;
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fade = clamp(1.2 - abs(viewDir.z), 0.0, 1.0);
    gl_FragColor = vec4(vColor.rgb, vColor.a * fade);
  }
`

// Slice 3+4 fragment shader — circular sprite + stroke band + selected halo +
// highlighted halo + Slice 4 chip-flash alpha modulation. flashAlpha follows
// the same sin curve as the vertex flashScale so size + alpha pulse together
// (1.0 → 0.5 → 1.0 over 100ms, matching Phase 16 chipFlash keyframe).
const FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vHalo;
  varying float vDim;
  varying vec3 vStrokeColor;
  varying float vIsHighlighted;
  varying float vFlashProgress;
  varying float vIsFlashing;
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
    float flashAlpha = (vIsFlashing > 0.5)
      ? (1.0 - 0.5 * sin(vFlashProgress * 3.14159))
      : 1.0;
    float alpha = (core + strokeBand * uStrokeMix + selectedHaloAlpha + highlightedHaloAlpha) * vDim * flashAlpha;
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
  hoveredSkillId,
  yearRange,
  justFilteredId,
  theme,
  lang, // eslint-disable-line no-unused-vars
  t, // eslint-disable-line no-unused-vars
  onSelectSkill,
  onHoverSkill,
  onFirstDrag,
  onContextLost: onContextLostProp,
}) {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const materialRef = useRef(null)
  const geometryRef = useRef(null)
  const edgeGeometryRef = useRef(null)
  const edgeMaterialRef = useRef(null)
  // Slice 4 — refs for sizing data used by pointer-pick (avoids stale closures
  // when the pointermove listener is re-attached on every prop change).
  const maxCountRef = useRef(1)
  // Phase 20 — OrbitControls + first-drag latch (D-20-VISUAL-3D,
  // D-20-CONTEXT-AUTOROTATE-RESUME). dragHappenedRef is permanent for the
  // session; reload restores autoRotate = true.
  const controlsRef = useRef(null)
  const dragHappenedRef = useRef(false)
  // Plan 20-03 — pointer-pick ref populated by the pick-handler useEffect.
  // useClickVsDrag's onClick callback reads from this ref so the hook's
  // useCallback stays stable across pickAt re-creations (each effect re-run
  // re-assigns .current; no listener re-attach needed). CRIT-02 mitigation:
  // OrbitControls attaches its pointer listeners FIRST inside the scene setup
  // useEffect; useClickVsDrag arbitrates click vs drag SECOND inside the pick
  // useEffect; onSelectSkill fires only when threshold passes.
  const pickAtRef = useRef(null)
  const onSelectSkillRef = useRef(onSelectSkill)
  useEffect(() => {
    onSelectSkillRef.current = onSelectSkill
  }, [onSelectSkill])

  const {
    onPointerDown: hookOnPointerDown,
    onPointerUp: hookOnPointerUp,
  } = useClickVsDrag({
    onClick: (e) => {
      const fn = pickAtRef.current
      if (!fn) return
      const matched = fn(e.clientX, e.clientY)
      const handler = onSelectSkillRef.current
      if (matched != null && handler) handler(matched)
    },
  })

  // Main scene setup: 26 Points + 50 LineSegments, attributes built once per
  // (nodes, edges, layout) tuple. Dim/halo/strokeColor/edge-RGBA are
  // re-uploaded by dedicated effects below when their inputs change.
  useEffect(() => {
    if (!canvasRef.current || !nodes || nodes.length === 0) return undefined

    const scene = new Scene()
    sceneRef.current = scene
    const canvas = canvasRef.current
    // Fallback to renderer's intrinsic 800×600 when CSS layout hasn't run
    // (SSR / jsdom). ResizeObserver below resyncs on first paint.
    const initW = canvas.clientWidth || 800
    const initH = Math.max(canvas.clientHeight || 600, 1)
    const aspect = initW / initH
    const camera = new PerspectiveCamera(55, aspect, 10, 2000)
    // D-20-CONTEXT-INITIAL-ANGLE: tilted ~15° azimuth, ~10° polar so 3D depth
    // is obvious frame 0 without requiring drag. (UAT-tunable ±5° within
    // OrbitControls polar clamp.)
    const ORBIT_RADIUS = 500
    camera.position.set(
      Math.sin((15 * Math.PI) / 180) * ORBIT_RADIUS,
      Math.sin((10 * Math.PI) / 180) * ORBIT_RADIUS,
      Math.cos((15 * Math.PI) / 180) * ORBIT_RADIUS,
    )
    camera.lookAt(0, 0, 0)
    // PerspectiveCamera matrices only sync inside renderer.render(). Pointer-
    // pick uses Vector3.project(camera) BEFORE the first paint completes, so
    // force matrixWorldInverse + projectionMatrix to be valid up-front.
    camera.updateMatrixWorld(true)
    camera.updateProjectionMatrix()
    cameraRef.current = camera

    const renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    })
    rendererRef.current = renderer
    const dpr = typeof window !== 'undefined'
      ? Math.min(window.devicePixelRatio || 1, 2)
      : 1
    renderer.setPixelRatio(dpr)
    renderer.setSize(800, 600, false)

    // OrbitControls (D-20-VISUAL-3D). enableKeys=false preserves Phase 15
    // D-15-KB-ACTIVATE arrow-key node-focus walk (MIN-02). Defensive
    // prefers-reduced-motion gate inside renderer (CRIT-06 / Alert A9) —
    // useRendererCapability already routes RM to SVG, this is belt-and-braces.
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.rotateSpeed = 0.6
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableKeys = false
    controls.minPolarAngle = Math.PI * 0.15
    controls.maxPolarAngle = Math.PI * 0.85
    controls.autoRotateSpeed = 0.5
    controls.target.set(0, 0, 0)
    const prefersRM = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotate = !prefersRM
    controlsRef.current = controls

    // D-20-CONTEXT-AUTOROTATE-RESUME — first drag permanently disables
    // auto-rotate for the page session AND fires onFirstDrag (Plan 20-02b
    // OnboardingHint dismiss flow reads cam-3d-hint-seen written by GameMode).
    const onControlsStart = () => {
      controls.autoRotate = false
      dragHappenedRef.current = true
      if (typeof onFirstDrag === 'function') onFirstDrag()
    }
    controls.addEventListener('start', onControlsStart)

    // D-20-CONTEXT-LOSS — context-loss handlers (Alert A10). e.preventDefault()
    // signals "we will recover" to three.js, but we silently swap to SVG via
    // the onContextLost prop callback (GameMode flips forceSvgFallback state).
    // No error banner, no aria-live announcement.
    const onContextLost = (e) => {
      e.preventDefault()
      if (typeof onContextLostProp === 'function') onContextLostProp()
    }
    const onContextRestored = () => {
      // Defensive no-op — stay on SVG once swapped (MOD-06 prevention).
    }
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)

    // Phase 20 — ResizeObserver keeps PerspectiveCamera.aspect and the shader
    // uCanvasHeight uniform synced to the canvas DOM box on viewport resize.
    let resizeObserver = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        const w = canvas.clientWidth
        const h = Math.max(canvas.clientHeight, 1)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        if (materialRef.current) {
          materialRef.current.uniforms.uCanvasHeight.value = h
        }
      })
      resizeObserver.observe(canvas)
    }

    // Cursor states (UI-SPEC §Cursor state map) — touch-action: none (MIN-03)
    // is applied as Tailwind utility on the canvas; cursor 'grab' is the idle
    // default; pointermove flips to 'grabbing' during drag and 'pointer' on
    // hovered node via the existing pointer event handlers below.
    canvas.style.cursor = 'grab'

    // ── Node geometry ── single draw, 26 Points
    const N = nodes.length
    const maxCount = Math.max(...nodes.map((n) => n.count))
    maxCountRef.current = maxCount
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
    // Slice 4 — per-vertex index attribute for shader chip-flash gating.
    // The shader compares vertexIndex to uFlashNodeId; only the matching
    // vertex applies the flashScale + flashAlpha curves.
    const vertexIndices = new Float32Array(N)
    const highlightSet = highlightedSkillIds && highlightedSkillIds.length > 0
      ? new Set(highlightedSkillIds)
      : null

    nodes.forEach((node, i) => {
      const pos = layout[node.id] || { x: 0, y: 0, z: 0 }
      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z ?? 0
      const fill = parseCSSColor(node.color)
      colors[i * 3] = fill.r
      colors[i * 3 + 1] = fill.g
      colors[i * 3 + 2] = fill.b
      sizes[i] = computeRadius(node.count, maxCount, node.isPlanet ? 'desktop_planet' : 'desktop')
      const dimmed = shouldDimNode(node, { selectedSkillId, highlightedSkillIds, yearRange })
      dims[i] = dimmed ? 0.35 : 1.0
      // D-20-PLANETS-TIER — planet always-on halo; star halo only on select.
      halos[i] = (node.isPlanet || node.id === selectedSkillId) ? 1.0 : 0.0
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
      vertexIndices[i] = i
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
    geometry.setAttribute('vertexIndex', new BufferAttribute(vertexIndices, 1))

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
        // Slice 4 — chip-flash + edge-reveal uniforms (default values mean
        // "no flash" / "no active node"; updated by the dedicated useEffects
        // below when justFilteredId / selectedSkillId / hoveredSkillId change).
        uFlashNodeId: { value: -1 },
        uFlashStartTime: { value: -Infinity },
        uActiveNodeId: { value: -1 },
        // Phase 20 — perspective size-attenuation uniforms (CRIT-05).
        uCanvasHeight: { value: canvas.clientHeight || 600 },
        uFovRad: { value: (55 * Math.PI) / 180 },
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
        edgePositions[i * 6 + 2] = src.z ?? 0
        edgePositions[i * 6 + 3] = tgt.x
        edgePositions[i * 6 + 4] = tgt.y
        edgePositions[i * 6 + 5] = tgt.z ?? 0
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
    const edgeMaterial = new ShaderMaterial({
      vertexShader: EDGE_VERTEX_SHADER,
      fragmentShader: EDGE_FRAGMENT_SHADER,
      vertexColors: true,
      transparent: true,
      depthWrite: false, // MOD-02 — prevent z-fighting against Points
    })
    edgeMaterialRef.current = edgeMaterial
    const lineSegments = new LineSegments(edgeGeometry, edgeMaterial)
    scene.add(lineSegments)

    renderer.render(scene, camera)

    return () => {
      // Phase 20 Alert A4 / MOD-05 — controls dispose FIRST; otherwise
      // OrbitControls' internal pointer listeners outlive React StrictMode
      // double-mount and leak handlers on the canvas DOM node.
      if (controlsRef.current) {
        controlsRef.current.removeEventListener('start', onControlsStart)
        controlsRef.current.dispose()
        controlsRef.current = null
      }
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      if (resizeObserver) resizeObserver.disconnect()
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
    // D-20-PLANETS-TIER — planet always-on halo; star halo only on select.
    nodes.forEach((node, i) => haloAttr.setX(i, (node.isPlanet || node.id === selectedSkillId) ? 1.0 : 0.0))
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

  // ── Slice 4 — Chip-flash uniforms (justFilteredId → uFlashNodeId +
  // uFlashStartTime). When justFilteredId becomes a node id, capture the
  // CURRENT shader uTime as uFlashStartTime (Pitfall 18: NOT performance.now;
  // the 0.1s window in the vertex/fragment shader runs on the same uTime
  // axis). When justFilteredId is null, reset uFlashNodeId to -1 so the
  // shader gate (abs(vertexIndex - uFlashNodeId) < 0.5) misses on every
  // vertex. The shader self-resets after 100ms via flashProgress clamp.
  useEffect(() => {
    if (!materialRef.current) return
    if (justFilteredId == null) {
      materialRef.current.uniforms.uFlashNodeId.value = -1
      // Defensive reset of uFlashStartTime to -Infinity — the shader gate
      // already short-circuits when uFlashNodeId === -1, but resetting the
      // start time too keeps the reset path symmetric with the trigger path.
      materialRef.current.uniforms.uFlashStartTime.value = -Infinity
      return
    }
    materialRef.current.uniforms.uFlashNodeId.value = nodeIdToIndex(justFilteredId, nodes)
    materialRef.current.uniforms.uFlashStartTime.value = materialRef.current.uniforms.uTime.value
  }, [justFilteredId, nodes])

  // ── Slice 4 — Active-id uniform (uActiveNodeId) drives weight-1 edge
  // reveal in the next effect. BLOCKER 2: hoveredSkillId arrives as a PROP
  // from useConstellation (useConstellation.js:55,73,132). NO internal
  // useState for hover. activeId fall-through order matches Phase 15
  // D-15-VIS-EDGE: selectedSkillId wins, then hoveredSkillId, else -1.
  useEffect(() => {
    if (!materialRef.current) return
    const activeId = selectedSkillId != null ? selectedSkillId : hoveredSkillId
    materialRef.current.uniforms.uActiveNodeId.value = nodeIdToIndex(activeId, nodes)
  }, [selectedSkillId, hoveredSkillId, nodes])

  // ── Slice 4 — Edge RGBA alpha rebuild (WARNING 5: alpha goes in 4th
  // component, NOT pre-multiplied into RGB so light-theme blending stays
  // correct). Weight ≥2 edges always visible at their CSS-var alpha.
  // Weight-1 edges reveal to alpha 1.0 when their source or target equals
  // activeId (= selectedSkillId ?? hoveredSkillId). Filter-dim multiplier
  // (×0.35) composes via the alpha component when either endpoint is dimmed.
  useEffect(() => {
    if (!edgeGeometryRef.current || !edges) return
    const edgeColorAttr = edgeGeometryRef.current.getAttribute('color')
    if (!edgeColorAttr) return
    const cs = typeof window !== 'undefined'
      ? getComputedStyle(document.documentElement)
      : null
    const lightRaw = cs ? cs.getPropertyValue('--color-constellation-edge') : ''
    const heavyRaw = cs ? cs.getPropertyValue('--color-constellation-edge-heavy') : ''
    const lightCol = parseCSSColor(lightRaw)
    const lightAlpha = parseCSSAlpha(lightRaw)
    const heavyCol = parseCSSColor(heavyRaw)
    const heavyAlpha = parseCSSAlpha(heavyRaw)
    const activeId = selectedSkillId != null ? selectedSkillId : hoveredSkillId
    const filtersActive = (highlightedSkillIds && highlightedSkillIds.length > 0)
      || yearRange != null
    edges.forEach((edge, i) => {
      const isHeavy = edge.weight >= 2
      const incidentToActive = activeId != null
        && (edge.source === activeId || edge.target === activeId)
      let opacity = 0
      if (isHeavy) opacity = 1
      else if (incidentToActive) opacity = 1
      if (filtersActive) {
        const sourceNode = nodes.find((n) => n.id === edge.source)
        const targetNode = nodes.find((n) => n.id === edge.target)
        const sourceDim = sourceNode
          && shouldDimNode(sourceNode, { selectedSkillId, highlightedSkillIds, yearRange })
        const targetDim = targetNode
          && shouldDimNode(targetNode, { selectedSkillId, highlightedSkillIds, yearRange })
        if (sourceDim || targetDim) opacity *= 0.35
      }
      const c = isHeavy ? heavyCol : lightCol
      const cssAlpha = isHeavy ? heavyAlpha : lightAlpha
      const alpha = opacity * cssAlpha
      // WARNING 5: alpha goes in 4th component. RGB stays as-is (NOT
      // pre-multiplied by opacity — preserves correct light-theme blending).
      edgeColorAttr.setXYZW(i * 2, c.r, c.g, c.b, alpha)
      edgeColorAttr.setXYZW(i * 2 + 1, c.r, c.g, c.b, alpha)
    })
    edgeColorAttr.needsUpdate = true
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }, [selectedSkillId, hoveredSkillId, highlightedSkillIds, yearRange, edges, nodes, theme])

  // ── Phase 20 (MIN-01) — pause auto-rotate on hover OR select (re-enable on
  // release ONLY if no drag has happened yet; first drag is permanent per
  // D-20-CONTEXT-AUTOROTATE-RESUME). Defensive prefers-reduced-motion gate
  // re-applied here so SSR → CSR hydration races cannot un-pause RM users.
  useEffect(() => {
    const c = controlsRef.current
    if (!c) return
    if (dragHappenedRef.current) return
    const prefersRM = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    c.autoRotate = !prefersRM && hoveredSkillId == null && selectedSkillId == null
  }, [hoveredSkillId, selectedSkillId])

  // ── Slice 4 — Canvas pointer-pick (pointermove → onHoverSkill CALLBACK,
  // pointerleave → onHoverSkill(null), click → onSelectSkill). BLOCKER 2:
  // these are callback-OUT to props.onHoverSkill / props.onSelectSkill. The
  // hook updates state, the hook re-renders, hoveredSkillId flows back in
  // as a prop, and the uActiveNodeId useEffect updates the shader uniform.
  // WebGL has ZERO internal hover state.
  //
  // Pointer-pick math: project each node from layout space (0..1000 ortho)
  // to canvas pixel space via getBoundingClientRect, then test against
  // pickRadius = computeRadius(...) + 8 device px per UI-SPEC §Node Geometry.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !nodes || nodes.length === 0) return undefined

    function pickAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect()
      const px = clientX - rect.left
      const py = clientY - rect.top
      const maxCount = maxCountRef.current
      const camera = cameraRef.current
      if (!camera) return null
      let bestId = null
      let bestDist = Infinity
      const v = new Vector3()
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i]
        const pos = layout && layout[node.id]
        if (!pos) continue // eslint-disable-line no-continue
        // MOD-08 — perspective-aware pick. v.project(camera) → NDC [-1, +1].
        // depthScale floor 0.4 keeps far-clipped nodes pickable.
        v.set(pos.x, pos.y, pos.z ?? 0)
        v.project(camera)
        const projX = (v.x * 0.5 + 0.5) * rect.width
        const projY = (-v.y * 0.5 + 0.5) * rect.height
        const depthScale = Math.max(0.4, 1.0 - v.z * 0.3)
        const dist = Math.hypot(px - projX, py - projY)
        const radius = computeRadius(node.count, maxCount, 'desktop') * depthScale
        const pickRadius = radius + 8
        if (dist <= pickRadius && dist < bestDist) {
          bestId = node.id
          bestDist = dist
        }
      }
      return bestId
    }

    // Plan 20-03 — publish pickAt to the body-level ref so useClickVsDrag's
    // onClick callback (defined at component-body scope) can invoke it.
    // CRIT-02 mitigation: OrbitControls (instantiated FIRST in the scene-setup
    // effect) owns drag gesture; pointerup is arbitrated by useClickVsDrag
    // SECOND; onSelectSkill fires only when threshold passes.
    pickAtRef.current = pickAt

    let isDragging = false

    function onPointerMove(e) {
      const matched = pickAt(e.clientX, e.clientY)
      // BLOCKER 2: callback-out only. hoveredSkillId flows back via parent
      // re-render. We always emit so the hook is the single source of truth
      // for hover-clear timing (no risk of a stale compare against props).
      if (onHoverSkill) onHoverSkill(matched)
      // UI-SPEC §Cursor state map — pointer on node, grabbing during drag,
      // grab idle.
      if (isDragging) {
        canvas.style.cursor = 'grabbing'
      } else if (matched != null) {
        canvas.style.cursor = 'pointer'
      } else {
        canvas.style.cursor = 'grab'
      }
    }

    function onPointerLeave() {
      // Always emit null on leave so a hover state seeded by pointermove
      // gets cleared by the hook (BLOCKER 2 — no internal state to gate on).
      if (onHoverSkill) onHoverSkill(null)
      canvas.style.cursor = 'grab'
    }

    function onPointerDown(e) {
      isDragging = true
      canvas.style.cursor = 'grabbing'
      // useClickVsDrag arbitrates click vs drag (D-20-CLICK-DRAG-THRESHOLD).
      hookOnPointerDown(e)
    }

    function onPointerUp(e) {
      isDragging = false
      canvas.style.cursor = 'grab'
      // useClickVsDrag's onPointerUp fires onClick → pickAt → onSelectSkill
      // only when distance < 5px (mouse) / 8px (touch) AND dt < 250ms.
      // The legacy `'click'` listener was removed — pointerup-via-hook is now
      // the sole click path. CRIT-02 mitigation completion.
      hookOnPointerUp(e)
    }

    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      pickAtRef.current = null
    }
  }, [nodes, layout, onHoverSkill, hookOnPointerDown, hookOnPointerUp])

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
      // CRIT-01 / D-17-FRAMELOOP — controls.update() is the FIRST line of the
      // single rAF loop. Do NOT couple OrbitControls 'change' to renderer.render;
      // that would double-render and burn CPU.
      if (controlsRef.current) controlsRef.current.update()
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
      className="webgl-canvas block w-full touch-none"
    />
  )
}
