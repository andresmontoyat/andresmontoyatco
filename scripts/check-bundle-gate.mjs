import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

// v3.11 Phase 22 Task 22.9 — chunk-pattern rename:
//   • old MOBILE_CHUNK (`GameMode-*.js`) became the main entry bundle after
//     Phase 21 wired MarioWorld directly into App.js (no lazy GameMode).
//   • old WEBGL_CHUNK (`WebGLConstellation-*.js`) was replaced by the new
//     Phase 22 lazy boundary at `WebGLWorldMap-*.js`. SvgWorldMap stays in
//     the main bundle (small DOM-only fallback for the SVG / RM tier).
// Variable names preserved to minimize ripple; semantics shifted per above.
const MOBILE_CHUNK_PATTERN = /^index-.*\.js$/
const WEBGL_CHUNK_PATTERN = /^WebGLWorldMap-.*\.js$/
// Pitfall CRIT-03 mitigation: widened to catch three/addons/* and three/examples/jsm/* leaks. Phase 20 Plan 01.
// Matches `THREE.` namespace access AND `from 'three'` / `from 'three/addons/...'` / `from 'three/examples/jsm/...'`
// (optional `(\/[^'"]+)?` capture group after literal `three`).
export const THREE_JS_PATTERN = /THREE\.|from\s*['"]three(\/[^'"]+)?['"]/
// Main-bundle ceiling re-baselined for Phase 22 — was 38.82 kB for the old
// GameMode lazy chunk; the main entry bundle now carries App + Mario-world
// orchestrator + DevView + Hero gate + SvgWorldMap + overlay + i18n. Current
// post-Phase-22 baseline = ~67 kB gz; HARD ceiling at 90 kB leaves room for
// Phase 23 (zoom + nav + walk anim) without hiding regressions.
const HARD_FAIL_KB = 90
const WARN_LOWER_KB = 50
// v3.10 Plan 20-03 — 3-tier WebGL chunk ladder (checker Warning #4 fix).
// Tier 1: ≤60 kB → silent (no log emitted).
// Tier 2: 60 < x ≤ 125 → INFO log (Phase 17 baseline + below REQUIREMENTS soft ceiling).
// Tier 3: 125 < x ≤ 130 → WARN log (soft-ceiling exceeded; investigate). NO exit.
// Tier 4: x > 130 → HARD FAIL (CI-blocking via process.exit(1)). Narrows the
//   REQUIREMENTS §"Out of Scope" deferred HARD-ceiling decision to a 5 kB
//   empirical-data window around WARN.
const WEBGL_SOFT_CEIL_KB = 125  // REQUIREMENTS soft ceiling — INFO below / WARN above
const WEBGL_WARN_KB = 130       // WARN band ceiling — louder log; still does NOT exit non-zero
const WEBGL_HARD_KB = 130       // Above WARN is HARD FAIL (>130 kB gz → process.exit(1))
const WEBGL_TTI_WARN_KB = 60    // Phase 17 INFO baseline (kept for continuity log)

// Pitfall 23: refactor into callable default export so tests can `await checkBundleGate()`
// while CLI invocation still runs via the `import.meta.url === file://...argv[1]` gate below.
export default async function checkBundleGate(distDir = 'dist/assets') {
  const absDir = path.resolve(distDir)
  const files = fs.readdirSync(absDir)
  const mobileChunk = files.find((f) => MOBILE_CHUNK_PATTERN.test(f))
  const webglChunk = files.find((f) => WEBGL_CHUNK_PATTERN.test(f))

  if (!mobileChunk) {
    throw new Error(`HARD FAIL: main entry chunk (index-*.js) not found in ${absDir}`)
  }
  if (!webglChunk) {
    console.warn('WARN: WebGLWorldMap chunk not found — three.js may be in main bundle')
  }

  const mobileBuf = fs.readFileSync(path.join(absDir, mobileChunk))
  if (THREE_JS_PATTERN.test(mobileBuf.toString())) {
    throw new Error(`HARD FAIL: ${mobileChunk} contains three.js — Lighthouse mobile gate at risk (Phase 22: three.js must stay in WebGLWorldMap-*.js lazy chunk)`)
  }

  const mobileGz = gzipSync(mobileBuf).length
  const KB = mobileGz / 1024
  const label = `${mobileChunk} = ${KB.toFixed(2)} kB gz`
  if (KB > HARD_FAIL_KB) {
    throw new Error(`HARD FAIL: ${label} > ${HARD_FAIL_KB} kB ceiling`)
  } else if (KB > WARN_LOWER_KB) {
    console.warn(`WARN: ${label} (${WARN_LOWER_KB}-${HARD_FAIL_KB} kB band)`)
  } else {
    console.log(`PASS: ${label}`)
  }

  let webglInfo = null
  if (webglChunk) {
    const webglBuf = fs.readFileSync(path.join(absDir, webglChunk))
    const webglGz = gzipSync(webglBuf).length
    const webglKB = webglGz / 1024
    const webglLabel = `${webglChunk} = ${webglKB.toFixed(2)} kB gz`
    // Plan 20-03 3-tier ladder (checker Warning #4 — REQUIREMENTS soft contract).
    // The CLI gate at the bottom of this file converts thrown errors into
    // process.exit(1), so a throw here is the HARD FAIL CI-blocking path.
    if (webglKB > WEBGL_HARD_KB) {
      throw new Error(`HARD FAIL: ${webglLabel} > ${WEBGL_HARD_KB} kB gz (v3.10 HARD ceiling — Phase 20 Plan 20-03 / checker Warning #4)`)
    } else if (webglKB > WEBGL_SOFT_CEIL_KB) {
      console.warn(`WARN: ${webglLabel} > ${WEBGL_SOFT_CEIL_KB} kB gz (soft ceiling exceeded; investigate — REQUIREMENTS soft contract)`)
    } else if (webglKB > WEBGL_TTI_WARN_KB) {
      console.log(`INFO: ${webglLabel} > ${WEBGL_TTI_WARN_KB} kB gz baseline (expected post-Phase-17)`)
    }
    // else: ≤60 kB → silent INFO (no log) per checker Warning #4 tier 1.
    webglInfo = { name: webglChunk, gzKB: webglKB }
  }

  return {
    mobile: { name: mobileChunk, gzKB: KB },
    webgl: webglInfo,
  }
}

// CLI gate (Pitfall 23): only run when invoked directly, not when test-imported.
// Canonical Node ESM idiom: import.meta.url === `file://${process.argv[1]}` but
// that direct compare is fragile when process.argv[1] is relative, contains spaces,
// or runs on Windows. We normalize both sides via fileURLToPath + path.resolve instead.
const isMain = (() => {
  try {
    return fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')
  } catch {
    return false
  }
})()

if (isMain) {
  checkBundleGate().catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
}
