import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const MOBILE_CHUNK_PATTERN = /^index-.*\.js$/

// v4.0 Slice 1 re-baseline (game-mode purge: three.js + src/game/ removed).
// Measured POST-PURGE on 2026-06-12: 54.21 kB gz. Headroom: 10% WARN / 25% HARD.
export const MOBILE_WARN_KB = 60
export const MOBILE_HARD_KB = 68

function gzKb(file) {
  const buf = fs.readFileSync(file)
  return gzipSync(buf).length / 1024
}

// Pitfall 23: callable default export so tests can await checkBundleGate({ distDir })
// while CLI invocation runs via the isMain gate below.
export default async function checkBundleGate({
  distDir = path.join(__dirname, '..', 'dist', 'assets'),
  warnKb = MOBILE_WARN_KB,
  hardKb = MOBILE_HARD_KB,
} = {}) {
  const absDir = path.resolve(distDir)
  const files = fs.readdirSync(absDir).filter((f) => f.endsWith('.js'))
  const mobile = files.find((f) => MOBILE_CHUNK_PATTERN.test(f))

  if (!mobile) {
    throw new Error(`HARD FAIL: no chunk matching ${MOBILE_CHUNK_PATTERN} in ${absDir}`)
  }

  const sizeKb = gzKb(path.join(absDir, mobile))
  const label = `${mobile} = ${sizeKb.toFixed(2)} kB gz`

  if (sizeKb > hardKb) {
    throw new Error(`HARD FAIL: ${label} > HARD ${hardKb} kB`)
  }
  if (sizeKb > warnKb) {
    console.warn(`WARN: ${label} > WARN ${warnKb} kB (HARD ${hardKb})`)
  } else {
    console.log(`bundle-gate OK — ${label} (WARN ${warnKb}, HARD ${hardKb})`)
  }

  return { mobile: { name: mobile, gzKB: sizeKb } }
}

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
    process.exit(2)
  })
}
