#!/usr/bin/env node
/**
 * scripts/process-hero-photo.js — Phase 8 / HERO-01 image pipeline.
 *
 * One-shot, re-runnable. Reads ./me.jpg (raw source, gitignored) and
 * writes ./public/me-1600.webp (desktop) + ./public/me-800.webp (mobile).
 *
 * EXIF is stripped (privacy — raw iPhone source may carry GPS).
 * Sharp is deterministic at fixed quality + width, so re-runs produce
 * byte-identical output for the same source.
 *
 * Usage:
 *   npm run hero:process
 *
 * Re-processing:
 *   1. Replace ./me.jpg with new source (keep filename).
 *   2. Run `npm run hero:process`.
 *   3. Commit the regenerated public/me-*.webp.
 *   4. Raw me.jpg stays gitignored.
 *
 * Budget: target <300 KB at 1600w, <100 KB at 800w. Warns (non-fatal)
 * if 1600w output exceeds 300 KB so Phase 10 can re-tune quality.
 */
/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const SRC = path.resolve(__dirname, '..', 'me.jpg')
const OUT_DIR = path.resolve(__dirname, '..', 'public')
const TARGETS = [
  { width: 1600, file: 'me-1600.webp' },
  { width: 800, file: 'me-800.webp' },
]
const SIZE_WARN_BYTES = 300_000

async function processOne({ width, file }) {
  const outPath = path.join(OUT_DIR, file)
  // Sharp 0.33+ strips ALL metadata (incl. EXIF) by default unless .withMetadata()
  // is called to preserve it. Omitting .withMetadata() is the canonical way to
  // strip EXIF in modern sharp — the older `.withMetadata({ exif: false })` API
  // throws ERR_INVALID_OPTION_VALUE in sharp 0.34.
  await sharp(SRC)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outPath)
  const { size } = fs.statSync(outPath)
  const human = `${(size / 1024).toFixed(1)} KB`
  console.log(`  ${file.padEnd(16)} ${width}w  ${human}`)
  if (size > SIZE_WARN_BYTES) {
    console.warn(`WARN: ${file} exceeds 300 KB budget (${size} B)`)
  }
  return { file, size }
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`ERROR: source not found at ${SRC}`)
    process.exit(1)
  }
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
  }
  console.log(`Processing ${SRC} -> ${OUT_DIR}`)
  for (const target of TARGETS) {
    // eslint-disable-next-line no-await-in-loop
    await processOne(target)
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error('ERROR:', err.message)
  process.exit(1)
})
