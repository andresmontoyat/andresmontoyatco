# Game Purge + Base Palette — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** [`docs/superpowers/specs/2026-06-12-game-purge-base-palette-design.md`](../specs/2026-06-12-game-purge-base-palette-design.md)

**Goal:** Delete every game-mode artifact (src/marioWorld/, sprites, ViewMode context+toggle, sections.js, related tests + i18n keys), land the target dark palette globally (CSS vars + Tailwind tokens), and simplify App.js to render Nav + Hero + Footer only. Tests GREEN, build clean, bundle-gate exit 0, Lighthouse mobile PASS.

**Architecture:** Single slice on a fresh branch `v4.0-slice-1-purge` cut from `main`. Atomic commits per logical unit (delete folder, delete files, recolor tokens, recolor base CSS, simplify App, update bundle gate, add smoke test). No new runtime features; no JSON conversion; no visual refactor of Nav/Hero/Footer (they absorb new palette via parking on existing `ink-*` token names that get repointed to the target hex values).

**Tech Stack:** Vite 6, React 18, Tailwind 3.4, Vitest, React Testing Library. Node 20+. Lighthouse CI via `lighthouse:mobile` script.

**Important deviations from spec (during planning):**

1. **Palette landing strategy.** Spec proposes new token names (`bg`, `surface`, `accent`, `accent-2`, …). The current codebase already has an established CSS-var-backed token system (`--color-ink-*`, `--color-brand*`, `--color-accent*`, `--color-text-primary`). To avoid orphan tokens and to recolor Nav/Hero/Footer for free (they reference the existing classes like `bg-ink-900 text-text-primary`), this plan **repoints the existing dark-mode CSS vars to the target palette hex values** instead of adding parallel tokens. The new tokens from the spec (`bg`, `surface`, `accent`, `accent-2`, `text`, `muted`, `border`) are ALSO added as new alias entries in Tailwind so future section slices can use the spec names directly. End state: both naming systems resolve to the same target colors.

2. **i18n strip scope.** Spec called for stripping "game / mario / world / biome / secret / sprite / overlay" keys. Inspection shows the only top-level trees matching that intent are `game` and `world` (plus their nested subtrees). Section content trees (`about`, `skills`, `exp`, `projects`, `claude`, `contact`) are *kept* — they will be the source material for the JSON conversion in their respective future section slices.

3. **Bundle-gate duplication.** There are two `check-bundle-gate` files: `scripts/check-bundle-gate.mjs` (canonical, referenced by `package.json`) and `src/scripts/check-bundle-gate.test.mjs` (test only). The companion `scripts/check-bundle-gate.test.mjs` also exists and differs from `src/scripts/check-bundle-gate.test.mjs`. Task 10 audits both test files and unifies if redundant.

---

## File Structure (post-slice)

**Deleted folders:**
- `src/marioWorld/` (31 files: orchestrator + hooks + renderers + overlays + data + tests)
- `public/sprites/`

**Deleted files:**
- `src/context/ViewModeContext.js` + `.test.js`
- `src/components/_shared/ViewModeToggle.js` + `.test.js`
- `src/data/sections.js`
- `src/data/skills.test.js`

**Modified files:**
- `src/App.js` — strip ViewModeProvider + MarioWorld; render Nav + Hero + Footer
- `src/index.css` — repoint dark vars to target palette; add body bg gradients + grid pattern
- `tailwind.config.js` — add new spec-aligned token aliases (`bg`, `surface`, `accent`, `accent-2`, `text`, `muted`, `border`, `grad-accent`, `font-mono`/`font-sans` mapped to Inter / JetBrains Mono)
- `src/i18n/translations.js` — strip `game` and `world` top-level subtrees (both `en` and `es`)
- `scripts/check-bundle-gate.mjs` — drop `WEBGL_CHUNK_PATTERN` + re-baseline thresholds for `index-*.js`
- `scripts/check-bundle-gate.test.mjs` and/or `src/scripts/check-bundle-gate.test.mjs` — drop WebGL-branch assertions; assert new thresholds

**Created files:**
- `src/App.test.js` — smoke test

**Audited (potentially modified):**
- `src/i18n/ThemeContext.js` — expected clean; leave untouched unless grep finds game refs

---

## Task 1: Setup branch + record baseline

**Files:**
- No code changes — branch + measurements only

- [ ] **Step 1: Confirm working tree clean enough to branch**

Run:
```bash
git status -s
```
Expected: untracked files only (`CV_*.docx`, `website-new/`, etc). No staged/uncommitted modified files in tracked paths.

- [ ] **Step 2: Cut new branch from `main`**

Run:
```bash
git fetch origin
git checkout -b v4.0-slice-1-purge origin/main
```
Expected: `Switched to a new branch 'v4.0-slice-1-purge'`.

- [ ] **Step 3: Record baseline bundle size**

Run:
```bash
npm ci
npm run build 2>&1 | tee /tmp/baseline-build.log
node -e "
const fs = require('fs');
const path = require('path');
const dist = 'dist/assets';
const files = fs.readdirSync(dist).filter(f => f.endsWith('.js'));
for (const f of files) {
  const buf = fs.readFileSync(path.join(dist, f));
  const gz = require('zlib').gzipSync(buf);
  console.log(f, '→', (gz.length / 1024).toFixed(2), 'kB gz');
}
" | tee /tmp/baseline-sizes.txt
```
Expected: log lists `index-*.js` and `WebGLWorldMap-*.js` with their gz sizes. Save the numbers — they go into the bundle-gate re-baseline in Task 10.

- [ ] **Step 4: Record baseline test count**

Run:
```bash
npm test -- --run 2>&1 | tail -20 | tee /tmp/baseline-tests.txt
```
Expected: `Tests <N> passed` line. Note the count.

- [ ] **Step 5: Commit nothing yet** — Task 1 is reconnaissance only. Branch is staged for the rest.

---

## Task 2: Delete `src/marioWorld/`

**Files:**
- Delete: `src/marioWorld/` (entire folder, 31 files)

- [ ] **Step 1: Confirm folder contents before delete**

Run:
```bash
find src/marioWorld -type f | wc -l
```
Expected: `31` (matches baseline reconnaissance).

- [ ] **Step 2: Verify nothing outside `src/marioWorld/` imports from it (apart from App.js)**

Run:
```bash
rg "from ['\"].*marioWorld" src --type js | rg -v "src/marioWorld" | rg -v "src/App.js"
```
Expected: no output. App.js is the only external importer; it will be cleaned in Task 8.

- [ ] **Step 3: Delete the folder**

Run:
```bash
git rm -r src/marioWorld
```
Expected: 31 files staged for deletion.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(v4.0-slice-1): delete src/marioWorld — failed game-mode work"
```
Expected: commit succeeds. `npm run build` (or vitest) will be broken until Task 8 fixes App.js — that is expected.

---

## Task 3: Delete `public/sprites/`

**Files:**
- Delete: `public/sprites/` (Mario sprite WebP assets)

- [ ] **Step 1: Confirm sprite folder exists**

Run:
```bash
ls public/sprites
```
Expected: list of `.webp` (avatar + biomes).

- [ ] **Step 2: Verify no surviving code references `/sprites/`**

Run:
```bash
rg "/sprites/" src public/index.html 2>/dev/null
```
Expected: no output (all references were inside `src/marioWorld/`, deleted in Task 2).

- [ ] **Step 3: Delete the folder**

Run:
```bash
git rm -r public/sprites
```

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(v4.0-slice-1): delete public/sprites — game asset cleanup"
```

---

## Task 4: Delete ViewMode context + toggle (+ tests)

**Files:**
- Delete: `src/context/ViewModeContext.js`
- Delete: `src/context/ViewModeContext.test.js`
- Delete: `src/components/_shared/ViewModeToggle.js`
- Delete: `src/components/_shared/ViewModeToggle.test.js`

- [ ] **Step 1: Verify no surviving import refs**

Run:
```bash
rg "ViewModeContext|ViewModeToggle|ViewModeProvider|useViewMode" src 2>/dev/null
```
Expected: hits only in `src/App.js` (handled Task 8) and inside the files being deleted. If hits appear elsewhere, STOP and investigate — it means a parked file leaked references and needs surgical cleanup.

- [ ] **Step 2: Check if `src/context/` becomes empty after delete**

Run:
```bash
ls src/context | wc -l
```
Expected: `2` (the two files about to be deleted). After deletion `src/context/` will be empty; remove it too.

- [ ] **Step 3: Delete files**

Run:
```bash
git rm src/context/ViewModeContext.js src/context/ViewModeContext.test.js
git rm src/components/_shared/ViewModeToggle.js src/components/_shared/ViewModeToggle.test.js
rmdir src/context 2>/dev/null || true
```

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(v4.0-slice-1): drop ViewMode context + toggle (+ tests)"
```

---

## Task 5: Delete `src/data/sections.js` + `src/data/skills.test.js`

**Files:**
- Delete: `src/data/sections.js`
- Delete: `src/data/skills.test.js`

- [ ] **Step 1: Verify `sections.js` only consumed by deleted DevView**

Run:
```bash
rg "from ['\"].*data/sections" src 2>/dev/null
```
Expected: no output (DevView importer was deleted in Task 2).

- [ ] **Step 2: Verify `skills.test.js` is self-contained**

Run:
```bash
rg "from ['\"].*skills\.test" src 2>/dev/null
```
Expected: no output.

- [ ] **Step 3: Delete files**

Run:
```bash
git rm src/data/sections.js src/data/skills.test.js
```

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(v4.0-slice-1): drop sections.js (DevView-only) + skills test"
```

---

## Task 6: Strip `game` and `world` subtrees from `src/i18n/translations.js`

**Files:**
- Modify: `src/i18n/translations.js`

- [ ] **Step 1: Confirm the only consumers of `t.game` / `t.world` were in marioWorld**

Run:
```bash
rg "t\.(game|world)\.|translations\.\w+\.(game|world)\." src 2>/dev/null
```
Expected: no output (all consumers deleted in Task 2). If any hit remains, STOP and investigate — a parked file may still reference them.

- [ ] **Step 2: Identify the exact line ranges of the `game` and `world` subtrees in BOTH `en:` and `es:` blocks**

Run:
```bash
rg -n "^\s+(game|world):\s*\{" src/i18n/translations.js
```
Expected: 4 matches — 2 keys × 2 language blocks.

- [ ] **Step 3: Remove the four subtrees with `Edit`**

Use the Edit tool to remove each `game: { ... }` and `world: { ... }` block in turn (one Edit call per block to keep diffs reviewable). For each block:
- Locate the `game: {` (or `world: {`) line.
- Walk to its matching closing `},`.
- Delete those lines inclusive.

Do not touch `nav.about`, `nav.skills`, `nav.experience`, `nav.projects`, `nav.claudeCode`, `nav.contact` — those are Nav labels and stay.

Do not touch top-level `about`, `skills`, `exp`, `projects`, `claude`, `contact` content trees — those will feed future section slices.

- [ ] **Step 4: Verify the file still parses (run the test suite — translations is imported by `LanguageContext`)**

Run:
```bash
npm test -- --run --reporter=basic 2>&1 | tail -10
```
Expected: tests still running cleanly (some may fail due to App.js not yet updated — that is fine; just confirm translations.js itself parses).

- [ ] **Step 5: Confirm no orphan key references remain anywhere**

Run:
```bash
rg "t\.(game|world)" src 2>/dev/null
```
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/translations.js
git commit -m "refactor(v4.0-slice-1): strip game + world subtrees from translations"
```

---

## Task 7: Repoint dark palette to target hex + add spec-aligned token aliases

**Files:**
- Modify: `src/index.css` (top of `:root` block + body base layer + body::before/::after)
- Modify: `tailwind.config.js` (add aliases without touching existing token names)

- [ ] **Step 1: Edit `src/index.css` — repoint existing CSS vars to target hexes inside the `:root` block**

Open `src/index.css` and update the dark-default `:root` values to:

```css
:root {
  /* === v4.0 base palette (target: website-new/index.html) === */
  /* Spec token names (canonical) */
  --bg:        #0B1020;
  --bg-2:      #0F1530;
  --bg-3:      #131A3A;
  --surface:   #151C3D;
  --border:    #1F2A55;
  --text:      #E6ECFF;
  --muted:     #8892B8;
  --accent:    #00E5A8;
  --accent-2:  #00C2FF;
  --grad-accent: linear-gradient(135deg, #00E5A8 0%, #00C2FF 100%);
  --radius:    14px;
  --shadow-accent: 0 20px 40px -20px rgba(0, 229, 168, 0.25);

  /* Legacy token mirrors — point existing ink/brand/accent names to the new palette
     so parked components (Nav/Hero/Footer) absorb the new look without a refactor.
     Section slices will re-pick the canonical tokens above when each section is rebuilt. */
  --color-ink-950: #07091A;
  --color-ink-900: #0B1020;   /* = --bg */
  --color-ink-800: #0F1530;   /* = --bg-2 */
  --color-ink-700: #131A3A;   /* = --bg-3 */
  --color-ink-600: #151C3D;   /* = --surface */
  --color-ink-500: #1F2A55;   /* = --border */
  --color-ink-400: #2A3870;
  --color-ink-500-60: rgba(31, 42, 85, 0.6);

  --color-surface-deepest: var(--color-ink-950);
  --color-surface-deep:    var(--color-ink-900);
  --color-surface-mid:     var(--color-ink-800);
  --color-surface-raised:  var(--color-ink-700);

  --color-brand:        #00E5A8;            /* = --accent */
  --color-brand-light:  #33EBBC;
  --color-brand-dark:   #00B886;
  --color-brand-muted:  rgba(0, 229, 168, 0.12);

  --color-accent:        #00C2FF;           /* = --accent-2 */
  --color-accent-light:  #33CEFF;
  --color-accent-dark:   #009BCC;
  --color-accent-muted:  rgba(0, 194, 255, 0.12);

  --color-text-primary:   #E6ECFF;          /* = --text */
```

Leave the rest of the existing `:root` block untouched. Other lines below (light theme overrides, etc.) stay.

- [ ] **Step 2: Edit `src/index.css` — add body base + background layers**

Append to the end of the file (after the closing of any existing `@layer base`):

```css
@layer base {
  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    line-height: 1.65;
    overflow-x: hidden;
  }
  body::before {
    content: ""; position: fixed; inset: 0; z-index: -2; pointer-events: none;
    background:
      radial-gradient(600px circle at 10% 0%, rgba(0, 229, 168, 0.08), transparent 50%),
      radial-gradient(800px circle at 90% 20%, rgba(0, 194, 255, 0.06), transparent 55%),
      linear-gradient(180deg, #0B1020 0%, #0A0F1E 100%);
  }
  body::after {
    content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background-image:
      linear-gradient(rgba(0, 229, 168, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 229, 168, 0.03) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
  }
}
```

- [ ] **Step 3: Edit `tailwind.config.js` — add new aliases inside `theme.extend.colors`**

Inside the existing `theme.extend.colors` object, add (without removing existing entries):

```js
// v4.0 canonical spec aliases — bound to :root CSS vars
bg:        'var(--bg)',
'bg-2':    'var(--bg-2)',
'bg-3':    'var(--bg-3)',
surface:   'var(--surface)',
border:    'var(--border)',
text:      'var(--text)',
muted:     'var(--muted)',
'accent-2':'var(--accent-2)',
```

Note: do NOT add a top-level `accent:` here — Tailwind would collide with the existing `accent: { DEFAULT: 'var(--color-accent)', ... }` object form. The canonical spec accent is reachable via `--accent` CSS var directly, and via `bg-brand` / `text-brand` Tailwind classes (since `--color-brand` was repointed in Step 1).

Inside `theme.extend.fontFamily` (add if not present), set:

```js
fontFamily: {
  sans: ['Inter', 'SF Pro Display', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
},
```

Inside `theme.extend.backgroundImage` (add the entry; create the key if absent):

```js
backgroundImage: {
  'grad-accent': 'linear-gradient(135deg, #00E5A8 0%, #00C2FF 100%)',
},
```

- [ ] **Step 4: Verify Tailwind compiles**

Run:
```bash
npm run build 2>&1 | tail -20
```
Expected: build will FAIL at App.js (still imports MarioWorld). That is fine — we only care that Tailwind+PostCSS does not error. Look for: no `Error: ENOENT` or `unknown utility` lines emitted before the React import error.

- [ ] **Step 5: Commit**

```bash
git add src/index.css tailwind.config.js
git commit -m "feat(v4.0-slice-1): base palette tokens + body bg + grid pattern"
```

---

## Task 8: Simplify `src/App.js`

**Files:**
- Modify: `src/App.js`

- [ ] **Step 1: Replace `src/App.js` with the post-purge layout**

Overwrite contents of `src/App.js` with:

```jsx
import React from 'react'

import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './i18n/ThemeContext'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Footer from './components/Footer'

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-bg text-text font-sans antialiased">
          <Nav />
          <main className="container mx-auto px-4">
            <Hero />
          </main>
          <Footer />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}
```

- [ ] **Step 2: Verify build now succeeds**

Run:
```bash
npm run build 2>&1 | tail -30
```
Expected: build SUCCEEDS. Output should show `dist/index.html` + `dist/assets/index-*.js` + CSS. No `WebGLWorldMap-*.js` should appear.

- [ ] **Step 3: Confirm the new chunk file matches expected pattern + record post-purge size**

Run:
```bash
ls -la dist/assets/*.js
node -e "
const fs = require('fs'); const path = require('path'); const zlib = require('zlib');
const dir = 'dist/assets';
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
  const buf = fs.readFileSync(path.join(dir, f));
  console.log(f, (zlib.gzipSync(buf).length / 1024).toFixed(2), 'kB gz');
}
" | tee /tmp/postpurge-sizes.txt
```
Expected: one (or two) JS files, all matching `index-*.js`. Record the gz size of `index-*.js` — it will be used in Task 10 for the new bundle-gate baseline.

- [ ] **Step 4: Commit**

```bash
git add src/App.js
git commit -m "refactor(v4.0-slice-1): simplify App.js — Nav + Hero + Footer only"
```

---

## Task 9: Add `src/App.test.js` smoke test

**Files:**
- Create: `src/App.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/App.test.js`:

```jsx
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App (v4.0 Slice 1 — purge)', () => {
  it('renders Nav, Hero, and Footer without throwing', () => {
    expect(() => render(<App />)).not.toThrow()
  })

  it('mounts the canonical regions for an accessible scroll layout', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('banner') || screen.getByRole('navigation')).toBeTruthy()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('uses the v4.0 base palette utility classes on its outer shell', () => {
    const { container } = render(<App />)
    const shell = container.firstChild
    expect(shell.className).toContain('bg-bg')
    expect(shell.className).toContain('text-text')
    expect(shell.className).toContain('min-h-screen')
  })
})
```

- [ ] **Step 2: Run the new test in isolation**

Run:
```bash
npx vitest run src/App.test.js --reporter=verbose
```
Expected: all 3 tests PASS. If a test fails on `role="main"` / `role="banner"` etc., inspect Nav/Hero/Footer — they may emit different landmarks. Adjust assertions to match the *actually rendered* landmarks (e.g., use `getByRole('navigation')` if Nav doesn't render a `<header>`).

- [ ] **Step 3: Run the entire suite**

Run:
```bash
npm test -- --run --reporter=basic 2>&1 | tail -15
```
Expected: every remaining test passes. There should be ZERO failures referencing `marioWorld`, `ViewMode`, `sections`, or `WebGLWorldMap`. If any failure remains, it indicates a missed reference — investigate and fix before committing.

- [ ] **Step 4: Commit**

```bash
git add src/App.test.js
git commit -m "test(v4.0-slice-1): App smoke test — Nav + Hero + Footer + v4.0 palette"
```

---

## Task 10: Update bundle gate + tests

**Files:**
- Modify: `scripts/check-bundle-gate.mjs`
- Audit + (likely) modify: `scripts/check-bundle-gate.test.mjs`
- Audit + (likely) modify or delete: `src/scripts/check-bundle-gate.test.mjs`

- [ ] **Step 1: Decide canonical home for the test**

Run:
```bash
ls scripts/check-bundle-gate.test.mjs src/scripts/check-bundle-gate.test.mjs 2>/dev/null
diff scripts/check-bundle-gate.test.mjs src/scripts/check-bundle-gate.test.mjs | head -40
```
Expected: both exist and differ. Pick **`scripts/check-bundle-gate.test.mjs`** as canonical (lives next to the script it tests). Plan: update it; delete `src/scripts/check-bundle-gate.test.mjs` if the diff shows it is a stale duplicate, OR move its unique assertions into the canonical file if it has them.

- [ ] **Step 2: Rewrite `scripts/check-bundle-gate.mjs`**

Open the file and:
- Remove the `WEBGL_CHUNK_PATTERN` constant.
- Remove the entire branch that resolves the WebGL chunk + asserts its size + asserts `three.js` containment.
- Keep `MOBILE_CHUNK_PATTERN = /^index-.*\.js$/`.
- Update the WARN / HARD thresholds for the mobile chunk using the size measured in Task 8 Step 3. Rule:
  - HARD = ceil(measured × 1.25) (25% headroom for growth)
  - WARN = ceil(measured × 1.10) (10% headroom triggers warning band)
- Adjust the `console.log` summary to mention only the mobile chunk.

Example final structure (adjust threshold numbers to measured values):

```javascript
import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '..', 'dist', 'assets')

const MOBILE_CHUNK_PATTERN = /^index-.*\.js$/

// v4.0 Slice 1 re-baseline (game-mode purge): three.js + marioWorld removed.
// Measured POST-PURGE: <FILL_IN_MEASURED_KB> kB gz. Headroom: 10 % WARN / 25 % HARD.
const MOBILE_WARN_KB = <FILL_IN>
const MOBILE_HARD_KB = <FILL_IN>

function gzKb(file) {
  const buf = fs.readFileSync(file)
  return gzipSync(buf).length / 1024
}

const files = fs.readdirSync(DIST).filter(f => f.endsWith('.js'))
const mobile = files.find(f => MOBILE_CHUNK_PATTERN.test(f))
if (!mobile) {
  console.error(`HARD FAIL: no chunk matching ${MOBILE_CHUNK_PATTERN} in ${DIST}`)
  process.exit(2)
}
const sizeKb = gzKb(path.join(DIST, mobile))
const label = `${mobile} = ${sizeKb.toFixed(2)} kB gz`
if (sizeKb > MOBILE_HARD_KB) {
  console.error(`HARD FAIL: ${label} > HARD ${MOBILE_HARD_KB} kB`)
  process.exit(2)
}
if (sizeKb > MOBILE_WARN_KB) {
  console.warn(`WARN: ${label} > WARN ${MOBILE_WARN_KB} kB (HARD ${MOBILE_HARD_KB})`)
}
console.log(`bundle-gate OK — ${label} (WARN ${MOBILE_WARN_KB}, HARD ${MOBILE_HARD_KB})`)
process.exit(0)
```

Replace `<FILL_IN_MEASURED_KB>`, `<FILL_IN>` placeholders with measured numbers from `/tmp/postpurge-sizes.txt`.

- [ ] **Step 3: Update `scripts/check-bundle-gate.test.mjs`**

Open the file and:
- Drop assertions referencing `WEBGL_CHUNK_PATTERN`, `WebGLWorldMap`, or `three.js` containment.
- Add an assertion that the script exits 0 against the freshly built `dist/assets/`.
- Add an assertion that an artificially oversized fake `dist/assets/index-XXXX.js` triggers HARD FAIL (mock the gz size by writing a large temp file into a tmp dist dir).

Pattern for the fake-build test (adapt to whatever runner the file uses — node's `node:test`, vitest, or plain assertions):

```javascript
import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

test('bundle-gate exits 0 on a real dist build', () => {
  // assumes `npm run build` has been run before this test
  const out = execFileSync('node', ['scripts/check-bundle-gate.mjs'], { encoding: 'utf8' })
  assert.match(out, /bundle-gate OK/)
})

test('bundle-gate HARD FAILs when chunk exceeds threshold', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-'))
  const distDir = path.join(tmp, 'dist', 'assets')
  fs.mkdirSync(distDir, { recursive: true })
  // 200 kB of incompressible random bytes ≈ ~200 kB gz
  fs.writeFileSync(path.join(distDir, 'index-FAKE.js'), Buffer.alloc(200_000, 'x'))
  // run the gate from `tmp` so its DIST path resolves there
  try {
    execFileSync('node', ['scripts/check-bundle-gate.mjs'], { cwd: tmp, stdio: 'pipe' })
    assert.fail('expected HARD FAIL')
  } catch (e) {
    assert.match(String(e.stdout || e.stderr || ''), /HARD FAIL/)
    assert.equal(e.status, 2)
  }
})
```

Note: the second test depends on the script resolving `dist/` relative to its own location, not `cwd`. Inspect the actual `__dirname` logic and tweak the test accordingly — if it always resolves relative to script location, the test must copy/symlink the script into the tmp tree.

- [ ] **Step 4: Reconcile or delete `src/scripts/check-bundle-gate.test.mjs`**

Run:
```bash
diff scripts/check-bundle-gate.test.mjs src/scripts/check-bundle-gate.test.mjs
```
If the `src/scripts/` copy has no unique assertions worth keeping, delete it:
```bash
git rm src/scripts/check-bundle-gate.test.mjs
rmdir src/scripts 2>/dev/null || true
```
If it has unique assertions, port them into `scripts/check-bundle-gate.test.mjs` and then delete the duplicate.

- [ ] **Step 5: Run the gate + the gate's tests**

Run:
```bash
npm run build 2>&1 | tail -5
node scripts/check-bundle-gate.mjs
npm test -- --run 2>&1 | tail -10
```
Expected: build OK, gate prints `bundle-gate OK — index-*.js = N.NN kB gz`, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/check-bundle-gate.mjs scripts/check-bundle-gate.test.mjs
git add -A src/scripts 2>/dev/null   # picks up deletion of the duplicate, if any
git commit -m "build(v4.0-slice-1): bundle-gate — drop WebGL chunk + rebaseline index chunk"
```

---

## Task 11: Audit `ThemeContext.js` and `src/test/setup.test.js`

**Files:**
- Audit (maybe modify): `src/i18n/ThemeContext.js`
- Audit (likely no-op): `src/test/setup.test.js`

- [ ] **Step 1: Grep `ThemeContext.js` for game/mario/world/biome/secret refs**

Run:
```bash
rg -i "game|mario|world|biome|secret|viewmode" src/i18n/ThemeContext.js
```
Expected: no output. If hits found, remove the offending lines surgically and note them in the commit message.

- [ ] **Step 2: Confirm `src/test/setup.test.js` is harmless**

Already verified: it only asserts `expect(true).toBe(true)` and `typeof document === 'object'`. Leave it.

- [ ] **Step 3: If Step 1 produced no changes, skip this commit; otherwise:**

```bash
git add src/i18n/ThemeContext.js
git commit -m "chore(v4.0-slice-1): drop residual game refs from ThemeContext"
```

---

## Task 12: Final gates — tests, build, bundle-gate, Lighthouse mobile

**Files:**
- No code changes — verification only

- [ ] **Step 1: Run the full test suite**

Run:
```bash
npm test -- --run 2>&1 | tail -20
```
Expected: ALL tests GREEN. Confirm the count is exactly `(baseline_count) − (tests deleted with marioWorld + ViewMode + skills.test) + 3 (new App.test.js cases) ± changes from bundle-gate test rewrite`.

- [ ] **Step 2: Clean build**

Run:
```bash
rm -rf dist node_modules/.vite
npm run build 2>&1 | tail -10
```
Expected: build SUCCEEDS, no warnings about missing modules.

- [ ] **Step 3: Bundle gate exit 0**

Run:
```bash
node scripts/check-bundle-gate.mjs
echo "exit: $?"
```
Expected: `bundle-gate OK — …` line, `exit: 0`.

- [ ] **Step 4: Lighthouse mobile**

Run:
```bash
npm run lighthouse:mobile 2>&1 | tail -40
```
Expected: report generated at `lighthouse-report-mobile.{html,json}`. Open the JSON and verify:
- `categories.performance.score >= 0.97`
- `categories.accessibility.score === 1.00`
- `categories.best-practices.score === 1.00`
- `categories.seo.score === 1.00`

Quick check:
```bash
node -e "
const r = require('./lighthouse-report-mobile.report.json');
const c = r.categories;
console.log('perf:', c.performance.score, 'a11y:', c.accessibility.score, 'bp:', c['best-practices'].score, 'seo:', c.seo.score);
"
```
Adjust the filename if the script writes a different one.

If a category regresses, investigate before continuing. The most likely culprits: missing alt text added by stripping a translation key, font-family fallback failures, or the new body::after grid being flagged as a large layout shift. Fix in place.

- [ ] **Step 5: No commit yet** — this is a verification task. If everything passed, proceed to Task 13.

---

## Task 13: Wrap-up — push branch + open PR

**Files:**
- No code changes — branch publication.

- [ ] **Step 1: Confirm the working tree is clean**

Run:
```bash
git status -s
```
Expected: empty (or only the untracked `CV_*.docx`, `website-new/`, `.planning/phases/14-.../14-PATTERNS.md` files that were untracked before the slice started).

- [ ] **Step 2: Review the commit log for this slice**

Run:
```bash
git log --oneline origin/main..HEAD
```
Expected: a tidy sequence of ~10 atomic commits prefixed `chore(v4.0-slice-1):` / `refactor(v4.0-slice-1):` / `feat(v4.0-slice-1):` / `test(v4.0-slice-1):` / `build(v4.0-slice-1):` / `docs(spec):`.

- [ ] **Step 3: Push branch**

Run:
```bash
git push -u origin v4.0-slice-1-purge
```

- [ ] **Step 4: Open PR via `gh`**

Run:
```bash
gh pr create --title "v4.0 Slice 1 — Game Purge + Base Palette" --body "$(cat <<'EOF'
## Summary
- Delete every game-mode artifact: `src/marioWorld/`, `public/sprites/`, ViewMode context+toggle, `src/data/sections.js`, related tests + `t.game` / `t.world` i18n subtrees.
- Land the v4.0 dark palette (`#0B1020` / `#00E5A8` / `#00C2FF`) globally via repointed `:root` CSS vars + new spec-aligned Tailwind token aliases (`bg`, `surface`, `accent-2`, …). Nav / Hero / Footer absorb the recolor by virtue of the existing token names being repointed.
- Simplify `App.js` to render Nav + Hero + Footer only. Experience, About, Skills, Projects, Claude, Contact re-enter in their own future section slices.
- Re-baseline `scripts/check-bundle-gate.mjs` (no more WebGL chunk) using the measured post-purge `index-*.js` size with 10 % WARN / 25 % HARD headroom.

Visual reference: `website-new/index.html`. Spec: `docs/superpowers/specs/2026-06-12-game-purge-base-palette-design.md`. Plan: `docs/superpowers/plans/2026-06-12-game-purge-base-palette.md`.

## Test plan
- [x] `npm test -- --run` — ALL GREEN
- [x] `npm run build` — clean
- [x] `node scripts/check-bundle-gate.mjs` — exit 0
- [x] `npm run lighthouse:mobile` — Perf ≥ 0.97 / A11y 1.00 / BP 1.00 / SEO 1.00
- [ ] Visual smoke on Vercel preview — Nav + Hero + Footer render against new dark palette; no console errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Verify PR URL returned + paste it into the slice closure note.**

---

## Self-Review (filled in after writing the plan above)

**Spec coverage:**
- Goal G1 (remove game artifacts) → Tasks 2, 3, 4, 5, 6, 11
- Goal G2 (palette tokens at global layer) → Task 7
- Goal G3 (build / test / ship not broken) → Tasks 8, 9, 12, 13
- Goal G4 (bundle-gate re-baseline) → Tasks 1 (measure), 8 (measure post), 10 (apply), 12 (verify)
- Spec §5.1 deletions → Task 2
- Spec §5.2 deletions → Tasks 3, 4, 5
- Spec §5.3 parking list → enforced by *not* deleting those paths anywhere in the plan
- Spec §5.4 modifications → Tasks 6, 7, 8, 10, 11
- Spec §5.5 post-state tree → final shape produced by combination of Tasks 2–11
- Spec §6 test changes → Tasks 2 (test deletions follow folder deletion), 4, 5, 9, 10
- Spec §6.4 exit gates → Task 12
- Spec §8 Risk: orphan translation keys → Task 6 Step 1 grep verification
- Spec §8 Risk: bundle re-baseline overshoot → Task 10 Step 2 explicit headroom rule
- Spec §8 Risk: Lighthouse regression → Task 12 Step 4 explicit check + remediation pointer
- Spec §9 Migration & Rollback (atomic commits) → enforced commit-by-commit through every task

**Placeholder scan:** Bundle-gate threshold values (`<FILL_IN_MEASURED_KB>`, `<FILL_IN>`) are intentional and explicitly tied to measurements taken in Task 1 Step 3 and Task 8 Step 3 — engineers fill these by substituting the measured kB. Lighthouse JSON filename is noted as "adjust the filename if the script writes a different one" because the project script may post-process. No "TBD" / "handle edge cases" / "similar to Task N" placeholders.

**Type consistency:** `MOBILE_CHUNK_PATTERN` name is preserved end-to-end (script + test). `MOBILE_WARN_KB` / `MOBILE_HARD_KB` constant names are used consistently in Task 10. JSX layout class names `bg-bg text-text font-sans antialiased` in App.js (Task 8) match the assertion in App.test.js (Task 9 Step 1). The token names introduced in `index.css` Task 7 Step 1 (`--bg`, `--accent`, etc.) match the aliases declared in `tailwind.config.js` Task 7 Step 3.

---

*End of plan.*
