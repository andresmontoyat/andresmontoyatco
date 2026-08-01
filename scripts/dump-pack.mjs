// Lists every PNG in the raw Cute Fantasy pack (public/game/cute-fantasy/) with its dimensions and
// top-level folder, so the Asset Placer's "Pack completo" mode can browse ALL 700+ pack images —
// not just the ~235 baked into the atlas. Run: node scripts/dump-pack.mjs (npm run pack:index)
// Dimensions are read straight from the PNG IHDR header (bytes 16-23) — no image lib needed.
import path from 'node:path'
import fs from 'node:fs/promises'

const ROOT = process.cwd()
const PACK = path.join(ROOT, 'public', 'game', 'cute-fantasy')
const OUT = path.join(ROOT, 'public', 'game', 'pack-index.json')

async function pngSize(file) {
  const fh = await fs.open(file, 'r')
  try {
    const { buffer } = await fh.read(Buffer.alloc(24), 0, 24, 0)
    return { w: buffer.readUInt32BE(16), h: buffer.readUInt32BE(20) }
  } finally { await fh.close() }
}

async function walk(dir) {
  const out = []
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...await walk(full))
    else if (e.name.toLowerCase().endsWith('.png')) out.push(full)
  }
  return out
}

const files = (await walk(PACK)).sort()
const items = []
for (const f of files) {
  const rel = path.relative(PACK, f) // e.g. Animals/Bee/Bee_Flying_Animation.png
  const { w, h } = await pngSize(f)
  items.push({
    // URL-encode each segment so spaces/() survive; served from /game/cute-fantasy/…
    src: `/game/cute-fantasy/${rel.split(path.sep).map(encodeURIComponent).join('/')}`,
    name: path.basename(rel, '.png'),
    folder: rel.split(path.sep)[0],
    sub: rel.split(path.sep).slice(0, -1).join('/'),
    w,
    h,
  })
}
await fs.writeFile(OUT, `${JSON.stringify(items)}\n`)
console.log(`wrote ${path.relative(ROOT, OUT)} — ${items.length} PNGs across ${new Set(items.map(i => i.folder)).size} folders`)
