import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

// Named constants (acceptance: rg must find ≥4 matches)
const MOBILE_CHUNK_PATTERN = /^GameMode-.*\.js$/
const WEBGL_CHUNK_PATTERN = /^WebGLConstellation-.*\.js$/
// Pitfall CRIT-03 mitigation: widened to catch three/addons/* and three/examples/jsm/* leaks. Phase 20 Plan 01.
// Matches `THREE.` namespace access AND `from 'three'` / `from 'three/addons/...'` / `from 'three/examples/jsm/...'`
// (optional `(\/[^'"]+)?` capture group after literal `three`).
export const THREE_JS_PATTERN = /THREE\.|from\s*['"]three(\/[^'"]+)?['"]/
const HARD_FAIL_KB = 38.82
const WARN_LOWER_KB = 14
const WEBGL_TTI_WARN_KB = 60

// Pitfall 23: refactor into callable default export so tests can `await checkBundleGate()`
// while CLI invocation still runs via the `import.meta.url === file://...argv[1]` gate below.
export default async function checkBundleGate(distDir = 'dist/assets') {
  const absDir = path.resolve(distDir)
  const files = fs.readdirSync(absDir)
  const mobileChunk = files.find((f) => MOBILE_CHUNK_PATTERN.test(f))
  const webglChunk = files.find((f) => WEBGL_CHUNK_PATTERN.test(f))

  if (!mobileChunk) {
    throw new Error(`HARD FAIL: GameMode chunk not found in ${absDir}`)
  }
  if (!webglChunk) {
    console.warn('WARN: WebGLConstellation chunk not found — three.js may be in mobile bundle')
  }

  const mobileBuf = fs.readFileSync(path.join(absDir, mobileChunk))
  if (THREE_JS_PATTERN.test(mobileBuf.toString())) {
    throw new Error(`HARD FAIL: ${mobileChunk} contains three.js — Lighthouse mobile gate at risk`)
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
    if (webglKB > WEBGL_TTI_WARN_KB) {
      console.warn(`WARN: ${webglLabel} > ${WEBGL_TTI_WARN_KB} kB (TTI concern on slow desktop)`)
    } else {
      console.log(`INFO: ${webglLabel}`)
    }
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
