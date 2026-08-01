# World Editor — Bundle Loader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a new Vite web app that imports an asset pack `.zip`, auto-generates a bundle manifest by slicing images on a tile grid, and renders a sprite palette plus the generated manifest JSON.

**Architecture:** Pure slicing/manifest logic (unit-tested, no DOM) is separated from the browser I/O (JSZip decompression, image decoding) and the UI (palette render, JSON view). `main.js` wires a file input through `importZip → buildManifest → renderPalette`.

**Tech Stack:** Vite 5, vanilla JS + Canvas, JSZip (in-browser unzip), Vitest (unit tests).

## Global Constraints

- Project lives in a NEW git repo at `/Users/andres/Development/repositories.nosync/codehunters/tools/world-editor` (outside iCloud). All commits in this plan happen in THAT repo, not the portfolio repo.
- Node >= 20. If Vite/Vitest misbehave on the shell node, use `/opt/homebrew/bin/node` (v26) or prefix `PATH=/opt/homebrew/bin:$PATH`.
- Vanilla JS ES modules only. No framework (no React/Vue). No TypeScript.
- Slicing rule (from spec): given a per-bundle `tileBase`, an image whose width AND height are exact multiples of `tileBase` is a `sheet` sliced into `cols × rows` frames of `tileBase`; otherwise it is a `single`. Buildings (e.g. 96×96 at tileBase 16) intentionally over-slice under this default — the manifest-editing UI that reclassifies them is deferred to a later session.
- Assets are referenced by `bundle + frame`, never by disk path, in any exported data (not exercised today but keep the manifest path-keyed).

---

### Task 1: Scaffold the Vite project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `.gitignore`

**Interfaces:**
- Consumes: nothing (greenfield).
- Produces: a runnable dev server (`npm run dev`) and a test runner (`npm test`) later tasks build on.

- [ ] **Step 1: Create the project directory and init git**

```bash
mkdir -p /Users/andres/Development/repositories.nosync/codehunters/tools/world-editor
cd /Users/andres/Development/repositories.nosync/codehunters/tools/world-editor
git init
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "world-editor",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "jszip": "^3.10.1"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: Write `.gitignore`**

```
node_modules
dist
.DS_Store
```

- [ ] **Step 4: Write `vite.config.js`**

```js
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js']
  }
})
```

- [ ] **Step 5: Write `index.html`**

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>World Editor</title>
  <style>
    :root { --bg:#0b1020; --panel:#131a30; --line:#2a3350; --accent:#00e5a8; --text:#dfeaff; --muted:#7f8db0; }
    * { box-sizing:border-box; }
    body { margin:0; font:13px/1.4 ui-monospace,Menlo,monospace; background:var(--bg); color:var(--text); }
    header { padding:12px 16px; border-bottom:1px solid var(--line); display:flex; gap:12px; align-items:center; }
    h1 { font-size:13px; letter-spacing:1px; text-transform:uppercase; color:var(--accent); margin:0; }
    #status { color:var(--muted); }
    main { display:grid; grid-template-columns:1fr 360px; gap:0; height:calc(100vh - 49px); }
    #palette { overflow-y:auto; padding:12px; }
    #side { border-left:1px solid var(--line); background:var(--panel); overflow-y:auto; padding:12px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,72px); gap:8px; }
    .cell { background:#0b1020; border:1px solid var(--line); border-radius:6px; padding:4px; text-align:center; }
    .cell canvas { image-rendering:pixelated; width:56px; height:56px; display:block; margin:0 auto; }
    .cell .lbl { font-size:9px; color:var(--muted); word-break:break-all; margin-top:2px; }
    .cell .badge { font-size:9px; color:var(--accent); }
    #manifest { white-space:pre; font:11px/1.35 ui-monospace,monospace; color:var(--text); }
    input[type=file] { color:var(--muted); }
  </style>
</head>
<body>
  <header>
    <h1>World Editor</h1>
    <input id="file" type="file" accept=".zip" />
    <span id="status">elige un bundle .zip</span>
  </header>
  <main>
    <div id="palette"></div>
    <div id="side"><h1>manifest</h1><div id="manifest"></div></div>
  </main>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 6: Write a placeholder `src/main.js`**

```js
document.querySelector('#status').textContent = 'listo'
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: `node_modules/` populated, no errors.

- [ ] **Step 8: Verify the dev server boots**

Run: `npm run dev` (then Ctrl-C after it prints the local URL)
Expected: Vite prints `Local: http://localhost:5173/` with no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite world-editor project"
```

---

### Task 2: Image slicing logic (pure, TDD)

**Files:**
- Create: `src/bundle/slice.js`
- Test: `src/bundle/slice.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `slice(imgW, imgH, tileBase)` → for multiples, `{ type: 'sheet', fw, fh, cols, rows }`; otherwise `{ type: 'single', w, h }`. Used by `buildManifest` (Task 3).

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { slice } from './slice.js'

describe('slice', () => {
  it('slices a multiple-of-tileBase image into a sheet', () => {
    expect(slice(64, 32, 16)).toEqual({ type: 'sheet', fw: 16, fh: 16, cols: 4, rows: 2 })
  })

  it('treats a 16x16 image as a single-frame sheet', () => {
    expect(slice(16, 16, 16)).toEqual({ type: 'sheet', fw: 16, fh: 16, cols: 1, rows: 1 })
  })

  it('classifies a non-multiple image as single', () => {
    expect(slice(20, 16, 16)).toEqual({ type: 'single', w: 20, h: 16 })
  })

  it('over-slices a building under the default rule (reclassified in UI later)', () => {
    expect(slice(96, 96, 16)).toEqual({ type: 'sheet', fw: 16, fh: 16, cols: 6, rows: 6 })
  })

  it('guards against a zero or invalid tileBase', () => {
    expect(slice(96, 96, 0)).toEqual({ type: 'single', w: 96, h: 96 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- slice`
Expected: FAIL with "Failed to resolve import './slice.js'" or "slice is not a function".

- [ ] **Step 3: Write minimal implementation**

```js
// slice(imgW, imgH, tileBase): classify an image as a tile sheet or a single sprite.
export function slice(imgW, imgH, tileBase) {
  if (tileBase > 0 && imgW % tileBase === 0 && imgH % tileBase === 0) {
    return { type: 'sheet', fw: tileBase, fh: tileBase, cols: imgW / tileBase, rows: imgH / tileBase }
  }
  return { type: 'single', w: imgW, h: imgH }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- slice`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/bundle/slice.js src/bundle/slice.test.js
git commit -m "feat(bundle): tile-grid image slicing logic"
```

---

### Task 3: Manifest builder (pure, TDD)

**Files:**
- Create: `src/bundle/manifest.js`
- Test: `src/bundle/manifest.test.js`

**Interfaces:**
- Consumes: `slice` from Task 2.
- Produces: `buildManifest(id, tileBase, images)` where `images` is `[{ path, w, h }]` → `{ id, tileBase, images: { [path]: sliceDescriptor } }`. Consumed by `main.js` (Task 5) and rendered in the side panel.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { buildManifest } from './manifest.js'

describe('buildManifest', () => {
  it('keys each image path to its slice descriptor', () => {
    const images = [
      { path: 'Trees/Oak.png', w: 64, h: 32 },
      { path: 'Buildings/Barn.png', w: 96, h: 96 }
    ]
    expect(buildManifest('cute-fantasy', 16, images)).toEqual({
      id: 'cute-fantasy',
      tileBase: 16,
      images: {
        'Trees/Oak.png': { type: 'sheet', fw: 16, fh: 16, cols: 4, rows: 2 },
        'Buildings/Barn.png': { type: 'sheet', fw: 16, fh: 16, cols: 6, rows: 6 }
      }
    })
  })

  it('returns an empty images map for an empty bundle', () => {
    expect(buildManifest('empty', 16, [])).toEqual({ id: 'empty', tileBase: 16, images: {} })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- manifest`
Expected: FAIL with "buildManifest is not a function".

- [ ] **Step 3: Write minimal implementation**

```js
import { slice } from './slice.js'

// buildManifest(id, tileBase, images): map every image path to its slice descriptor.
// images: [{ path, w, h }]
export function buildManifest(id, tileBase, images) {
  const out = { id, tileBase, images: {} }
  for (const im of images) {
    out.images[im.path] = slice(im.w, im.h, tileBase)
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- manifest`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/bundle/manifest.js src/bundle/manifest.test.js
git commit -m "feat(bundle): build manifest from image dimensions"
```

---

### Task 4: ZIP import + image decode (browser I/O)

**Files:**
- Create: `src/bundle/import.js`

**Interfaces:**
- Consumes: `JSZip` (dependency).
- Produces: `importZip(file)` → `Promise<{ id, images: [{ path, url, w, h }] }>`. `id` is the zip filename without extension; `url` is an object URL for the decoded PNG (used by the palette). Consumed by `main.js` (Task 5). This task is browser-only (image decoding + object URLs); verify manually via the running app in Task 5 — no unit test.

- [ ] **Step 1: Write the implementation**

```js
import JSZip from 'jszip'

// importZip(file): unzip in memory, decode every PNG's pixel dimensions,
// and return an object-URL per image for rendering.
export async function importZip(file) {
  const zip = await JSZip.loadAsync(file)
  const pngs = Object.values(zip.files).filter(f => !f.dir && /\.png$/i.test(f.name))
  const images = []
  for (const f of pngs) {
    const blob = await f.async('blob')
    const url = URL.createObjectURL(blob)
    const { w, h } = await imageDims(url)
    images.push({ path: f.name, url, w, h })
  }
  const id = file.name.replace(/\.zip$/i, '')
  return { id, images }
}

function imageDims(url) {
  return new Promise((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve({ w: im.naturalWidth, h: im.naturalHeight })
    im.onerror = reject
    im.src = url
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/bundle/import.js
git commit -m "feat(bundle): import zip and decode image dimensions"
```

---

### Task 5: Palette render + app wiring (manual E2E)

**Files:**
- Create: `src/catalog/palette.js`
- Modify: `src/main.js` (replace placeholder from Task 1)

**Interfaces:**
- Consumes: `importZip` (Task 4), `buildManifest` (Task 3). `manifest.images[path]` descriptors (Task 2 shape).
- Produces: `renderPalette(host, images, manifest)` — draws one thumbnail per image (first frame for sheets) into `host`. `main.js` wires the file input to the full pipeline and prints the manifest JSON.

- [ ] **Step 1: Write `src/catalog/palette.js`**

```js
// renderPalette(host, images, manifest): one thumbnail per image.
// For a sheet, draw only the first frame (top-left cell); for a single, draw whole.
// images: [{ path, url, w, h }] from importZip.
export function renderPalette(host, images, manifest) {
  host.innerHTML = ''
  const grid = document.createElement('div')
  grid.className = 'grid'
  for (const im of images) {
    const desc = manifest.images[im.path]
    grid.appendChild(cell(im, desc))
  }
  host.appendChild(grid)
}

function cell(im, desc) {
  const el = document.createElement('div')
  el.className = 'cell'
  el.title = im.path
  const c = document.createElement('canvas')
  c.width = 56
  c.height = 56
  drawThumb(c, im, desc)
  el.appendChild(c)
  const name = im.path.split('/').pop()
  const badge = desc.type === 'sheet' ? `sheet ${desc.cols}x${desc.rows}` : 'single'
  el.insertAdjacentHTML('beforeend', `<div class="badge">${badge}</div><div class="lbl">${name}</div>`)
  return el
}

function drawThumb(canvas, im, desc) {
  const g = canvas.getContext('2d')
  g.imageSmoothingEnabled = false
  const image = new Image()
  image.onload = () => {
    const sw = desc.type === 'sheet' ? desc.fw : im.w
    const sh = desc.type === 'sheet' ? desc.fh : im.h
    const s = Math.min(56 / sw, 56 / sh)
    g.clearRect(0, 0, 56, 56)
    g.drawImage(image, 0, 0, sw, sh, (56 - sw * s) / 2, (56 - sh * s) / 2, sw * s, sh * s)
  }
  image.src = im.url
}
```

- [ ] **Step 2: Replace `src/main.js` with the full wiring**

```js
import { importZip } from './bundle/import.js'
import { buildManifest } from './bundle/manifest.js'
import { renderPalette } from './catalog/palette.js'

const DEFAULT_TILE_BASE = 16
const status = document.querySelector('#status')

document.querySelector('#file').addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (!file) return
  status.textContent = 'descomprimiendo…'
  try {
    const { id, images } = await importZip(file)
    const manifest = buildManifest(id, DEFAULT_TILE_BASE, images)
    renderPalette(document.querySelector('#palette'), images, manifest)
    document.querySelector('#manifest').textContent = JSON.stringify(manifest, null, 2)
    status.textContent = `${id} · ${images.length} imágenes`
  } catch (err) {
    status.textContent = 'error: ' + err.message
    console.error(err)
  }
})
```

- [ ] **Step 3: Run the app and verify end-to-end**

Run: `npm run dev`, open the printed URL, pick a `.zip` of PNGs (zip one of the Cute Fantasy subfolders, e.g. `public/game/cute-fantasy/Trees`, from the portfolio repo to test).
Expected:
- Status shows `<bundle> · N imágenes`.
- Palette shows one thumbnail per PNG with a `sheet CxR` or `single` badge.
- Side panel shows the generated manifest JSON with each path keyed to a slice descriptor.

- [ ] **Step 4: Commit**

```bash
git add src/catalog/palette.js src/main.js
git commit -m "feat(catalog): render sprite palette and manifest from imported zip"
```

---

## Self-Review

**Spec coverage (today's scope):**
- Scaffold Vite (`npm run dev`) → Task 1. ✓
- Import `.zip` → JSZip decompress → scan PNGs → Task 4. ✓
- Auto-generate manifest (tile base + multiples slicing) → Tasks 2 + 3. ✓
- Render sprite palette from manifest → Task 5. ✓
- Show generated manifest JSON in UI → Task 5 (side panel). ✓
- Deferred items (map model, canvas painting, export, manifest-edit UI, adapter) are intentionally NOT in this plan.

**Type consistency:** `slice(imgW, imgH, tileBase)` returns the same `{ type:'sheet', fw, fh, cols, rows }` / `{ type:'single', w, h }` shape used by `buildManifest` and read by `palette.js` (`desc.type`, `desc.fw`, `desc.cols`). `importZip` returns `{ id, images:[{path,url,w,h}] }` consumed unchanged by `main.js` and `renderPalette`. `buildManifest(id, tileBase, images)` matches its call site in `main.js`. Consistent.

**Placeholder scan:** No TBD/TODO; every code step is complete.
