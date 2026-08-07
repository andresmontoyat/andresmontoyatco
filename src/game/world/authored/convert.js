// Converts the world-editor's engine-neutral map export into the three artifacts the game
// consumes: atlas manifest entries, a palette-encoded tile JSON, and placements.
// Pure — no fs, no network. The import script injects everything environmental.

const PACK_ROOT = 'Cute_Fantasy/'
const PUBLIC_BASE = '/game/cute-fantasy/'
const FRAME_PREFIX = 'am_'

// "path/to/img.png#3,2" -> { path, col, row }. The editor always writes this shape
// (see exportMap/frameStr in the editor's src/persist/export.js).
export function splitRef(ref) {
  const hash = ref.lastIndexOf('#')
  if (hash < 0) throw new Error(`malformed ref (no cell): ${ref}`)
  const [col, row] = ref.slice(hash + 1).split(',')
  if (col === undefined || row === undefined) throw new Error(`malformed ref (no cell): ${ref}`)
  return { path: ref.slice(0, hash), col: Number(col), row: Number(row) }
}

function stripRoot(path) {
  return path.startsWith(PACK_ROOT) ? path.slice(PACK_ROOT.length) : path
}

// A manifest image key: pack-relative path, extension dropped, every non-alphanumeric run
// collapsed to one underscore. The am_ prefix keeps the authored namespace disjoint from the
// 235 hand-curated frame names in manifest.js — collision is impossible by construction.
export function slugFor(path) {
  const rel = stripRoot(path).replace(/\.[^./]+$/, '')
  return FRAME_PREFIX + rel.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export function frameNameFor(ref) {
  const { path, col, row } = splitRef(ref)
  return `${slugFor(path)}_${col}_${row}`
}

// manifest.images values are URL-encoded (pack folders contain spaces and parentheses) and
// pack-atlas.mjs decodeURIComponent()s them back to read the file off disk.
export function publicUrlFor(path) {
  return PUBLIC_BASE + stripRoot(path).split('/').map(encodeURIComponent).join('/')
}
