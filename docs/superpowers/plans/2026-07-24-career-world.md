# Career World Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the validated single-file Career World platformer prototype into a modular, tested `src/game/` codebase, mounted as a lazy-loaded opt-in "play" island from the Experience section of the v5 Astro site.

**Architecture:** Framework-free ES modules split by responsibility — pure logic (`engine/`, `entities/`, `world/`) unit-tested with Vitest; impure edges (`render/`, `audio/`) ported from the reference prototype and smoke-tested. A thin React island (`CareerGame.jsx`) owns the canvas, lazy-imports the game on demand, and wires locale + `prefers-reduced-motion`. The accessible Experience timeline stays the default; the game never becomes the only path to the career content.

**Tech Stack:** Canvas 2D, vanilla ES modules, WebAudio (synth SFX), Astro + React 18 island (`client:visible`), Vitest (jsdom) for units, Playwright for playthrough.

**Reference implementation:** `docs/superpowers/prototypes/2026-07-24-career-world-prototype.html` — the validated prototype. Render/physics/entity code is *extracted verbatim* from it; this file is the source of truth for exact drawing routines and tuning numbers.

**Spec:** `docs/superpowers/specs/2026-07-24-career-world-game-design.md`

## Global Constraints

- **No Nintendo IP.** All art, characters, enemy designs, and audio are original (procedural Canvas + WebAudio synth). No third-party assets in v1.
- **Zero runtime dependencies** for the game modules — Canvas 2D + WebAudio only. No game engine, no framework inside `src/game/`.
- **Lazy-load:** game modules must not be in the initial page bundle. The island shell dynamically `import()`s the game only when the user clicks "Play my career."
- **Bilingual EN/ES** via `locale` prop, same pattern as `src/components/react/Experience.jsx` (`export default function C({ locale })`).
- **`prefers-reduced-motion`**: disables juice (particles, screen-shake, parallax, squash) — game still playable; the timeline stays the accessible default.
- **Data source:** `src/data/experience.json` — do not duplicate career copy into game code.
- **Tests:** Vitest via `npx vitest run`; jsdom env; setup `src/test/setup.jsx`; pure modules tested like `src/scripts/count-up.test.js` (no React). Coverage include is `src/**/*.{js,jsx}`.
- **Naming:** modules camelCase files; UPPER_SNAKE for module constant tables; functions lowerCamel verbs.

---

## File Structure

```
src/game/
├── world/
│   ├── biomes.js            BIOMES table + biomeForYear(year) + ORDER
│   ├── biomes.test.js
│   ├── level.js             buildLevel(experienceJson) → immutable level model
│   ├── level.test.js
│   └── companies.js         mapExperienceToCompanies(json, biomeForYear) → [{co,y,biome,featured,...}]
│   └── companies.test.js
├── engine/
│   ├── tuning.js            TUNING constants (gravity, jump, coyote, buffer, apex, speeds)
│   ├── physics.js           pure: jumpVelocity, gravityStep, aabb, resolveMove
│   ├── physics.test.js
│   ├── camera.js            follow + clamp + shake offset
│   ├── camera.test.js
│   ├── input.js             keyboard + touch → intent flags
│   └── loop.js              rAF loop, hit-stop gate, orchestrates update+render
├── entities/
│   ├── player.js            createPlayer, jump/land/stomp/hurt/powerup transitions
│   ├── player.test.js
│   ├── enemy.js             patrol step, resolveContact (stomp vs hurt), boss hp
│   ├── enemy.test.js
│   ├── powerup.js           applyPowerup(player, type)
│   ├── powerup.test.js
│   └── mover.js             moverStep(mover, tMs) → dx/dy; ridership handled in physics
│   └── mover.test.js
├── render/
│   ├── sprites.js           procedural mascot / bug / castle / hut / coin / crate / boot / shield / mover
│   ├── particles.js         burst pool, update, draw
│   ├── scene.js             draw order: sky→hills→clouds→terrain→movers→castles→powerups→enemies→player→particles
│   └── hud.js               commits, era banner, progress, power-up badges, toast
├── audio/
│   └── sfx.js               initAudio, beep, sfx(type), mute
└── careerGame.js            init(canvas, { locale, reduced, onOpenPanel }) → { start, stop, setLocale }

src/components/react/
├── CareerGame.jsx           island: cover → lazy import careerGame.js → canvas + panel + touch pad
├── CareerGame.test.jsx
```

The island mounts inside the Experience section. `careerGame.js` is the composition root that wires modules; the React layer only owns DOM/lifecycle.

---

## Phase 1 — Pure logic (unit-tested)

### Task 1: Biome table + year mapping

**Files:**
- Create: `src/game/world/biomes.js`
- Test: `src/game/world/biomes.test.js`

**Interfaces:**
- Produces: `BIOMES` (object keyed by id → `{ c, sky:[a,b], hill, hill2, ground, label:{en,es} }`), `ORDER` (id array in era order), `biomeForYear(year:number) → id:string`.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { BIOMES, ORDER, biomeForYear } from './biomes.js'

describe('biomes', () => {
  it('orders eras chronologically', () => {
    expect(ORDER).toEqual(['pradera','desierto','selva','cyber','castillo'])
  })
  it('maps years to the right era', () => {
    expect(biomeForYear(2007)).toBe('pradera')
    expect(biomeForYear(2012)).toBe('pradera')
    expect(biomeForYear(2013)).toBe('desierto')
    expect(biomeForYear(2021)).toBe('selva')
    expect(biomeForYear(2023)).toBe('cyber')
    expect(biomeForYear(2026)).toBe('castillo')
  })
  it('clamps out-of-range years to the nearest era', () => {
    expect(biomeForYear(2000)).toBe('pradera')
    expect(biomeForYear(2100)).toBe('castillo')
  })
  it('every biome carries a bilingual label and palette', () => {
    for (const id of ORDER) {
      expect(BIOMES[id].label.en).toBeTruthy()
      expect(BIOMES[id].label.es).toBeTruthy()
      expect(BIOMES[id].c).toMatch(/^#/)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/world/biomes.test.js`
Expected: FAIL — cannot resolve `./biomes.js`.

- [ ] **Step 3: Write minimal implementation**

Copy the `BIOMES` object verbatim from the prototype (`docs/superpowers/prototypes/2026-07-24-career-world-prototype.html`, the `const BIOMES={...}` block), add `ORDER` and the range table:

```js
export const BIOMES = {
  pradera:  { c:'#5cb85c', sky:['#8ed0ff','#bfe8ff'], hill:'#57a83e', hill2:'#4a9235', ground:'#6ab04c', label:{ en:'Java / JEE Legacy', es:'Java / JEE Legacy' } },
  desierto: { c:'#d4a55b', sky:['#f3d9a0','#ffeec6'], hill:'#d0a85c', hill2:'#bb9147', ground:'#e0bd7a', label:{ en:'SOA / Middleware',   es:'SOA / Middleware' } },
  selva:    { c:'#2e8b57', sky:['#7fc7a0','#a8e0c0'], hill:'#2f7d47', hill2:'#256b3a', ground:'#3f9a5c', label:{ en:'Microservices',     es:'Microservicios' } },
  cyber:    { c:'#4b93e6', sky:['#8fb0f0','#c0d4ff'], hill:'#3f6fc0', hill2:'#33589c', ground:'#5a86d6', label:{ en:'Cloud / Kubernetes', es:'Cloud / Kubernetes' } },
  castillo: { c:'#a855f7', sky:['#7a5fb0','#a98fd8'], hill:'#5a4a8e', hill2:'#463670', ground:'#6a5a96', label:{ en:'Claude Code / AI',   es:'Claude Code / IA' } },
}
export const ORDER = ['pradera','desierto','selva','cyber','castillo']
const RANGES = [
  ['pradera', 2007, 2012], ['desierto', 2013, 2017], ['selva', 2018, 2021],
  ['cyber', 2022, 2024], ['castillo', 2025, 2026],
]
export function biomeForYear(year) {
  for (const [id, lo, hi] of RANGES) if (year >= lo && year <= hi) return id
  return year < RANGES[0][1] ? 'pradera' : 'castillo'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/world/biomes.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/game/world/biomes.js src/game/world/biomes.test.js
git commit -m "feat(game): biome table and year→era mapping"
```

---

### Task 2: Physics primitives (jump, gravity, AABB)

**Files:**
- Create: `src/game/engine/tuning.js`, `src/game/engine/physics.js`
- Test: `src/game/engine/physics.test.js`

**Interfaces:**
- Produces:
  - `TUNING` — `{ GRAV, MOVE, MAXV, FRICT, JUMP, COYOTE, BUFFER, APEX_VY, APEX_MULT, MAX_FALL }`.
  - `jumpVelocity(p, t) → number|null` — the vy to apply, or null if the player cannot jump now. Reads `p.onGround`, `p.coyote`, `p.jumps`, `p.boots`.
  - `gravityStep(vy, t) → number` — next vy with apex-hang + fall clamp.
  - `aabb(a, b) → boolean` — overlap of `{x,y,w,h}`.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { TUNING } from './tuning.js'
import { jumpVelocity, gravityStep, aabb } from './physics.js'

const P = (o) => ({ onGround:false, coyote:0, jumps:0, boots:false, ...o })

describe('physics', () => {
  it('jumps from the ground', () => {
    expect(jumpVelocity(P({ onGround:true }), TUNING)).toBe(TUNING.JUMP)
  })
  it('jumps during coyote time', () => {
    expect(jumpVelocity(P({ coyote:3 }), TUNING)).toBe(TUNING.JUMP)
  })
  it('cannot jump midair without boots', () => {
    expect(jumpVelocity(P({ jumps:1 }), TUNING)).toBeNull()
  })
  it('allows a second (weaker) jump midair with boots', () => {
    const v = jumpVelocity(P({ jumps:1, boots:true }), TUNING)
    expect(v).toBeLessThan(0)
    expect(v).toBeGreaterThan(TUNING.JUMP) // weaker than a full jump
  })
  it('applies reduced gravity near the apex', () => {
    const nearApex = gravityStep(0.5, TUNING)
    const falling = gravityStep(10, TUNING)
    expect(nearApex - 0.5).toBeCloseTo(TUNING.GRAV * TUNING.APEX_MULT, 5)
    expect(falling - 10).toBeCloseTo(TUNING.GRAV, 5)
  })
  it('clamps fall speed', () => {
    expect(gravityStep(TUNING.MAX_FALL + 5, TUNING)).toBe(TUNING.MAX_FALL)
  })
  it('detects AABB overlap', () => {
    expect(aabb({x:0,y:0,w:10,h:10}, {x:5,y:5,w:10,h:10})).toBe(true)
    expect(aabb({x:0,y:0,w:10,h:10}, {x:20,y:0,w:10,h:10})).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/engine/physics.test.js`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write minimal implementation**

`src/game/engine/tuning.js` (numbers verbatim from the prototype `const GRAV=..., JUMP=...` and coyote/buffer literals):

```js
export const TUNING = {
  GRAV: 0.7, MOVE: 0.7, MAXV: 4.4, FRICT: 0.82, JUMP: -13.2,
  COYOTE: 6, BUFFER: 8, APEX_VY: 2.3, APEX_MULT: 0.55, MAX_FALL: 16,
}
```

`src/game/engine/physics.js`:

```js
export function jumpVelocity(p, t) {
  if (p.onGround || p.coyote > 0) return t.JUMP
  if (p.boots && p.jumps < 2) return t.JUMP * 0.92
  return null
}
export function gravityStep(vy, t) {
  const g = Math.abs(vy) < t.APEX_VY ? t.GRAV * t.APEX_MULT : t.GRAV
  const next = vy + g
  return next > t.MAX_FALL ? t.MAX_FALL : next
}
export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/engine/physics.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/tuning.js src/game/engine/physics.js src/game/engine/physics.test.js
git commit -m "feat(game): physics primitives — jump, apex-gravity, AABB"
```

---

### Task 3: Collision resolution

**Files:**
- Modify: `src/game/engine/physics.js`
- Test: `src/game/engine/physics.test.js` (extend)

**Interfaces:**
- Produces:
  - `resolveHorizontal(p, solids) → void` — mutates `p.x`, zeroes `p.vx` on contact. Call after `p.x += p.vx`.
  - `resolveVertical(p, solids) → { landedOn: solid|null, hitHead: solid|null }` — mutates `p.y`, sets `p.onGround`, zeroes `p.vy` on contact. Call after `p.y += p.vy`.

- [ ] **Step 1: Write the failing test**

```js
import { resolveHorizontal, resolveVertical } from './physics.js'

describe('collision', () => {
  const floor = { x:-100, y:100, w:400, h:50 }
  it('lands on a floor and flags onGround', () => {
    const p = { x:0, y:96, w:20, h:20, vx:0, vy:8, onGround:false }
    const r = resolveVertical(p, [floor])
    expect(p.y).toBe(floor.y - p.h) // 80
    expect(p.vy).toBe(0)
    expect(p.onGround).toBe(true)
    expect(r.landedOn).toBe(floor)
  })
  it('reports a head bump when moving up into a block', () => {
    const block = { x:0, y:0, w:40, h:20 }
    const p = { x:10, y:15, w:20, h:20, vx:0, vy:-6, onGround:false }
    const r = resolveVertical(p, [block])
    expect(p.y).toBe(block.y + block.h) // 20
    expect(r.hitHead).toBe(block)
  })
  it('stops horizontal movement against a wall', () => {
    const wall = { x:50, y:0, w:20, h:200 }
    const p = { x:35, y:50, w:20, h:20, vx:5 }
    resolveHorizontal(p, [wall])
    expect(p.x).toBe(wall.x - p.w) // 30
    expect(p.vx).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/engine/physics.test.js -t collision`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Write minimal implementation** (append to `physics.js`, logic extracted from prototype `physics()` collision loops)

```js
export function resolveHorizontal(p, solids) {
  for (const s of solids) {
    if (!aabb(p, s)) continue
    if (p.vx > 0) p.x = s.x - p.w
    else if (p.vx < 0) p.x = s.x + s.w
    p.vx = 0
  }
}
export function resolveVertical(p, solids) {
  let landedOn = null, hitHead = null
  p.onGround = false
  for (const s of solids) {
    if (!aabb(p, s)) continue
    if (p.vy > 0) { p.y = s.y - p.h; p.vy = 0; p.onGround = true; landedOn = s }
    else if (p.vy < 0) { p.y = s.y + s.h; p.vy = 0; hitHead = s }
  }
  return { landedOn, hitHead }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/engine/physics.test.js`
Expected: PASS (10 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/physics.js src/game/engine/physics.test.js
git commit -m "feat(game): AABB collision resolution (horizontal + vertical)"
```

---

### Task 4: Player entity state machine

**Files:**
- Create: `src/game/entities/player.js`
- Test: `src/game/entities/player.test.js`

**Interfaces:**
- Produces:
  - `createPlayer() → player` — `{ x,y,w:26,h:36, vx,vy, onGround, face, run, buffer, coyote, jumps, boots, shield, sx, sy, inv, rideM }`.
  - `hurt(player) → { lost:'shield'|'boots'|null }` — applies i-frames + knockback bookkeeping; consumes shield first, then boots, else plain knockback. Returns what was lost.
  - `landReset(player) → void` — on landing: `jumps=0`, squash (`sx=1.25, sy=0.78`).

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { createPlayer, hurt, landReset } from './player.js'

describe('player', () => {
  it('starts grounded-capable with no power-ups', () => {
    const p = createPlayer()
    expect(p.boots).toBe(false); expect(p.shield).toBe(false); expect(p.inv).toBe(0)
  })
  it('consumes shield first on hurt (no knockback velocity)', () => {
    const p = createPlayer(); p.shield = true
    const r = hurt(p)
    expect(r.lost).toBe('shield'); expect(p.shield).toBe(false); expect(p.inv).toBeGreaterThan(0)
  })
  it('loses boots on hurt when no shield', () => {
    const p = createPlayer(); p.boots = true; p.face = 1
    const r = hurt(p)
    expect(r.lost).toBe('boots'); expect(p.boots).toBe(false); expect(p.vx).toBeLessThan(0)
  })
  it('plain knockback when unpowered', () => {
    const p = createPlayer(); p.face = -1
    const r = hurt(p)
    expect(r.lost).toBeNull(); expect(p.vx).toBeGreaterThan(0); expect(p.inv).toBeGreaterThan(0)
  })
  it('resets jumps and squashes on land', () => {
    const p = createPlayer(); p.jumps = 2
    landReset(p)
    expect(p.jumps).toBe(0); expect(p.sy).toBeLessThan(1); expect(p.sx).toBeGreaterThan(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/entities/player.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation** (transitions extracted from the prototype `hurt`/land branches)

```js
export function createPlayer() {
  return { x:120, y:394, w:26, h:36, vx:0, vy:0, onGround:false, face:1, run:0,
    buffer:0, coyote:0, jumps:0, boots:false, shield:false, sx:1, sy:1, inv:0, rideM:null }
}
export function hurt(p) {
  if (p.shield) { p.shield = false; p.inv = 55; p.vy = -5; return { lost:'shield' } }
  p.inv = 70; p.vx = -p.face * 5; p.vy = -6
  if (p.boots) { p.boots = false; return { lost:'boots' } }
  return { lost:null }
}
export function landReset(p) { p.jumps = 0; p.sx = 1.25; p.sy = 0.78 }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/entities/player.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/game/entities/player.js src/game/entities/player.test.js
git commit -m "feat(game): player state — hurt/shield/boots/land transitions"
```

---

### Task 5: Enemy + boss contact resolution

**Files:**
- Create: `src/game/entities/enemy.js`
- Test: `src/game/entities/enemy.test.js`

**Interfaces:**
- Produces:
  - `patrolStep(en) → void` — moves `en.x` by `en.vx`, reverses at `en.x0/en.x1`, decrements `en.hit`.
  - `resolveContact(player, en) → 'stomp' | 'kill' | 'hurt' | 'none'` — decides outcome from player fall + relative position + `en.hit` cooldown; mutates `en` (`hp`, `hit`, `dead`) and returns the event. `'kill'` means a non-boss died or the boss reached 0 hp (caller triggers victory); `'stomp'` means a boss hit that did not kill.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { patrolStep, resolveContact } from './enemy.js'

const bug = (o={}) => ({ x:100, y:100, w:28, h:26, vx:1, x0:80, x1:160, dead:0, hit:0, ...o })
const faller = (o={}) => ({ x:100, y:64, w:26, h:36, vy:8, inv:0, ...o }) // above the bug

describe('enemy', () => {
  it('patrols and reverses at bounds', () => {
    const en = bug({ x:160, vx:1 }); patrolStep(en)
    expect(en.vx).toBeLessThan(0)
  })
  it('is stomped when the player falls onto its head', () => {
    const en = bug(); const p = faller()
    expect(resolveContact(p, en)).toBe('kill'); expect(en.dead).toBe(1); expect(p.vy).toBeLessThan(0)
  })
  it('hurts the player on a side hit', () => {
    const en = bug(); const p = { x:100, y:100, w:26, h:36, vy:0, inv:0 }
    expect(resolveContact(p, en)).toBe('hurt'); expect(en.dead).toBe(0)
  })
  it('a boss survives the first two stomps and dies on the third', () => {
    const en = bug({ boss:1, hp:3, w:56, h:52, y:100 })
    const seq = []
    for (let i = 0; i < 3; i++) { en.hit = 0; const p = faller({ y:52 }); seq.push(resolveContact(p, en)) }
    expect(seq).toEqual(['stomp','stomp','kill']); expect(en.dead).toBe(1)
  })
  it('ignores contact during hit cooldown', () => {
    const en = bug({ hit:10 }); const p = faller()
    expect(resolveContact(p, en)).toBe('none')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/entities/enemy.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation** (logic extracted from the prototype enemy loop)

```js
export function patrolStep(en) {
  if (en.hit > 0) en.hit--
  en.x += en.vx
  if (en.x < en.x0 || en.x > en.x1) en.vx *= -1
}
export function resolveContact(player, en) {
  if (en.dead || en.hit > 0) return 'none'
  const stomping = player.vy > 0 && (player.y + player.h - player.vy) <= en.y + (en.boss ? 14 : 8)
  if (stomping) {
    player.vy = en.boss ? -11 : -9.5
    if (en.boss) { en.hit = 28; en.hp -= 1; if (en.hp <= 0) { en.dead = 1; return 'kill' } return 'stomp' }
    en.dead = 1; return 'kill'
  }
  if (player.inv <= 0) return 'hurt'
  return 'none'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/entities/enemy.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/game/entities/enemy.js src/game/entities/enemy.test.js
git commit -m "feat(game): enemy patrol + stomp/hurt/boss contact resolution"
```

---

### Task 6: Power-up + mover units

**Files:**
- Create: `src/game/entities/powerup.js`, `src/game/entities/mover.js`
- Test: `src/game/entities/powerup.test.js`, `src/game/entities/mover.test.js`

**Interfaces:**
- Produces:
  - `applyPowerup(player, type:'boots'|'shield') → void` — sets `player.boots` or `player.shield`.
  - `moverDelta(mover, tMs) → { x, y, dx, dy }` — new position + per-call delta from a sine oscillation on `mover.ax` axis. Mutates `mover.x/y`, stores `mover.px/py`.

- [ ] **Step 1: Write the failing tests**

`powerup.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { applyPowerup } from './powerup.js'
describe('powerup', () => {
  it('grants boots', () => { const p = { boots:false, shield:false }; applyPowerup(p,'boots'); expect(p.boots).toBe(true) })
  it('grants shield', () => { const p = { boots:false, shield:false }; applyPowerup(p,'shield'); expect(p.shield).toBe(true) })
})
```

`mover.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { moverDelta } from './mover.js'
describe('mover', () => {
  it('oscillates on its axis and reports a delta', () => {
    const m = { x:0, y:0, ox:0, oy:0, ax:'y', rng:100, sp:1, ph:0, px:0, py:0 }
    const a = moverDelta(m, 0)
    const b = moverDelta(m, 250) // quarter period at sp=1 → sin advances
    expect(b.y).not.toBe(a.y)
    expect(b.dy).toBeCloseTo(b.y - a.y, 5)
    expect(b.dx).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game/entities/powerup.test.js src/game/entities/mover.test.js`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write minimal implementations** (from the prototype power-up pickup + mover update)

`powerup.js`:

```js
export function applyPowerup(player, type) {
  if (type === 'shield') player.shield = true
  else player.boots = true
}
```

`mover.js`:

```js
export function moverDelta(mover, tMs) {
  mover.px = mover.x; mover.py = mover.y
  const o = Math.sin(tMs / 1000 * mover.sp + mover.ph) * mover.rng
  if (mover.ax === 'x') mover.x = mover.ox + o; else mover.y = mover.oy + o
  return { x: mover.x, y: mover.y, dx: mover.x - mover.px, dy: mover.y - mover.py }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game/entities/powerup.test.js src/game/entities/mover.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/entities/powerup.js src/game/entities/mover.js src/game/entities/powerup.test.js src/game/entities/mover.test.js
git commit -m "feat(game): power-up grant + moving-platform oscillation"
```

---

### Task 7: Companies + level builder

**Files:**
- Create: `src/game/world/companies.js`, `src/game/world/level.js`
- Test: `src/game/world/companies.test.js`, `src/game/world/level.test.js`

**Interfaces:**
- Produces:
  - `mapExperienceToCompanies(json, biomeForYear) → company[]` — chronological (oldest→newest) `[{ co, y:number, biome, featured, boss, metric, role, date, tech, bullets }]` from `experience.json` entries (`entry.visible !== false`), assigning `biome` from the entry's start year and `num` to featured entries.
  - `buildLevel(companies) → { levelW, companies, solids, coins, qblocks, enemies, powerups, movers, bossIndex }` — deterministic placement (constants from the prototype: `GY=430, LEVEL_PAD=640, SPACING=880`). `cx` on each company; ground solid; per-company platforms/stairs/crates/coin-arcs; era-tinted bugs; Spring Boots + Hexagonal Shield pickups; CI movers; one boss guarding the last company.

- [ ] **Step 1: Write the failing test**

`companies.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { mapExperienceToCompanies } from './companies.js'
import { biomeForYear } from './biomes.js'
import raw from '../../data/experience.json'

describe('companies', () => {
  const c = mapExperienceToCompanies(raw, biomeForYear)
  it('keeps only visible entries, oldest first', () => {
    expect(c.length).toBe(raw.entries.filter(e => e.visible !== false).length)
    expect(c[0].y).toBeLessThan(c[c.length - 1].y)
  })
  it('assigns a biome per start year', () => {
    expect(c[0].biome).toBe('pradera')
    expect(c[c.length - 1].biome).toBe('castillo')
  })
  it('numbers featured companies', () => {
    const featured = c.filter(x => x.featured)
    expect(featured.length).toBeGreaterThan(0)
    expect(featured.every(x => typeof x.num === 'number')).toBe(true)
  })
})
```

`level.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { mapExperienceToCompanies } from './companies.js'
import { buildLevel } from './level.js'
import { biomeForYear } from './biomes.js'
import raw from '../../data/experience.json'

describe('level', () => {
  const lvl = buildLevel(mapExperienceToCompanies(raw, biomeForYear))
  it('spans all companies with a ground solid', () => {
    expect(lvl.companies.length).toBeGreaterThan(0)
    expect(lvl.solids.some(s => s.ground)).toBe(true)
    expect(lvl.levelW).toBeGreaterThan(lvl.companies.at(-1).cx)
  })
  it('places exactly one boss guarding the final company', () => {
    const bosses = lvl.enemies.filter(e => e.boss)
    expect(bosses.length).toBe(1)
    expect(bosses[0].x).toBeLessThan(lvl.companies.at(-1).cx)
  })
  it('provides both power-up types', () => {
    const types = new Set(lvl.powerups.map(p => p.type))
    expect(types.has('boots')).toBe(true)
    expect(types.has('shield')).toBe(true)
  })
  it('tints bugs by their biome', () => {
    expect(lvl.enemies.every(e => typeof e.col === 'string')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game/world/companies.test.js src/game/world/level.test.js`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write minimal implementations**

`companies.js` — parse `experience.json` (bilingual fields kept as `{en,es}` objects; start year from `entry.date.en` first token digits):

```js
import { BIOMES } from './biomes.js'
function startYear(entry) {
  const s = (entry.date && entry.date.en) || ''
  const m = s.match(/\d{4}/)
  return m ? Number(m[0]) : 0
}
export function mapExperienceToCompanies(json, biomeForYear) {
  let num = 0
  return json.entries
    .filter(e => e.visible !== false)
    .map(e => ({ e, y: startYear(e) }))
    .sort((a, b) => a.y - b.y)
    .map(({ e, y }) => {
      const biome = biomeForYear(y)
      const c = { co: e.company, y, biome, featured: !!e.featured, boss: !!e.boss,
        metric: e.metric || null, role: e.title, date: e.date, tech: e.tech || [], bullets: e.bullets,
        color: BIOMES[biome].c }
      if (c.featured) c.num = ++num
      return c
    })
}
```

`level.js` — port the prototype placement blocks (`EXP.forEach` level-gen, bug placement, power-up placement, movers, boss) into a pure builder that operates on the `companies` array and returns the model. Use the exact constants and offsets from `docs/superpowers/prototypes/2026-07-24-career-world-prototype.html`:

```js
const GY = 430, LEVEL_PAD = 640, SPACING = 880
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), cl = v => Math.max(0, Math.min(255, v))
  return `rgb(${cl((n>>16&255)+f)},${cl((n>>8&255)+f)},${cl((n&255)+f)})`
}
export function buildLevel(companies) {
  companies.forEach((c, i) => { c.cx = LEVEL_PAD + i * SPACING })
  const levelW = LEVEL_PAD * 2 + (companies.length - 1) * SPACING
  const solids = [{ x:-40, y:GY, w:levelW+80, h:400, ground:true }]
  const coins = [], qblocks = [], enemies = [], powerups = [], movers = []
  companies.forEach((c, i) => {
    const base = c.cx
    if (i > 0) {
      solids.push({ x:base-560, y:GY-150, w:120, h:24, plat:true })
      solids.push({ x:base-330, y:GY-240, w:120, h:24, plat:true })
      for (let k=0;k<3;k++) coins.push({ x:base-540+k*36, y:GY-190, got:false })
      for (let k=0;k<3;k++) coins.push({ x:base-310+k*36, y:GY-280, got:false })
      qblocks.push({ x:base-380, y:GY-170, w:38, h:38, used:false, coin:true })
      qblocks.push({ x:base-300, y:GY-170, w:38, h:38, used:false })
      for (let s=0;s<3;s++) solids.push({ x:base-150+s*40, y:GY-(s+1)*40, w:40, h:(s+1)*40, stair:true })
    }
    for (let k=0;k<5;k++) coins.push({ x:base-110+k*26, y:GY-90-Math.sin(k/4*Math.PI)*70, got:false })
  })
  companies.forEach((c, i) => {
    if (i === 0) return
    const n = i % 3 === 0 ? 2 : 1
    for (let k=0;k<n;k++) { const cx = c.cx-460+k*140
      enemies.push({ x:cx, y:GY-26, w:28, h:26, vx:0.9*(k%2?1:-1), x0:cx-90, x1:cx+90, dead:0, col:shade(c.color,-30), t:0 }) }
  })
  ;[{i:1},{i:5}].forEach(({i}) => powerups.push({ x:companies[i].cx-330, y:GY-300, w:26, h:26, taken:0, t:0, type:'boots' }))
  ;[{i:3},{i:8}].forEach(({i}) => powerups.push({ x:companies[i].cx-330, y:GY-300, w:26, h:26, taken:0, t:0, type:'shield' }))
  ;[{i:2,ax:'y',rng:90,sp:0.9},{i:6,ax:'x',rng:120,sp:0.8},{i:9,ax:'y',rng:110,sp:1.0}].forEach(m => {
    const x = companies[m.i].cx-440, y = GY-190
    movers.push({ x, y, w:110, h:22, ax:m.ax, rng:m.rng, sp:m.sp, ph:0, ox:x, oy:y, px:x, py:y, mover:1 })
  })
  const last = companies.length - 1
  enemies.push({ x:companies[last].cx-300, y:GY-52, w:56, h:52, vx:1.2, x0:companies[last].cx-380, x1:companies[last].cx-150, dead:0, col:'#7a3a8e', t:0, hp:3, hit:0, boss:1 })
  return { levelW, companies, solids, coins, qblocks, enemies, powerups, movers, bossIndex: enemies.length - 1 }
}
```

> Note: guard the `movers`/`powerups` indices if a future data change reduces company count below 10 — clamp `m.i`/pickup `i` to `companies.length - 1`. For the current 11-entry dataset all indices are valid.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game/world/companies.test.js src/game/world/level.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/world/companies.js src/game/world/level.js src/game/world/companies.test.js src/game/world/level.test.js
git commit -m "feat(game): experience→companies mapping + deterministic level builder"
```

---

## Phase 2 — Render + audio (ported, smoke-tested)

> These modules draw to a Canvas 2D context / use WebAudio and are ported verbatim from the reference prototype. They are excluded from coverage thresholds (Task 17) and verified by a mounted smoke test (Task 16) plus one jsdom smoke test each that asserts they run without throwing against a stub context.

### Task 8: Sprite + particle render modules

**Files:**
- Create: `src/game/render/sprites.js`, `src/game/render/particles.js`
- Test: `src/game/render/sprites.test.js`

**Interfaces:**
- Produces (all take `(ctx, ...)` and draw; no return):
  - `sprites.js`: `drawMascot(ctx, cx, gy, opts)`, `drawBug(ctx, en, lang)`, `drawCastle(ctx, company)`, `drawHut(ctx, company)`, `drawCoin(ctx, c, tMs)`, `drawCrate(ctx, q)`, `drawBoot(ctx, x, y)`, `drawShieldHex(ctx, x, y, r)`, `drawMover(ctx, m)`, `rr(ctx,x,y,w,h,r,c)`, `shade(hex,f)`, `hexA(hex,a)`.
  - `particles.js`: `createParticles() → pool`, `burst(pool, x, y, n, opts)`, `updateParticles(pool)`, `drawParticles(ctx, pool)`.

- [ ] **Step 1: Write the failing smoke test**

```js
import { describe, it, expect, vi } from 'vitest'
import { rr, shade, drawMascot, drawBug, drawCoin } from './sprites.js'
import { createParticles, burst, updateParticles, drawParticles } from './particles.js'

function stubCtx() {
  const noop = () => {}
  return new Proxy({}, { get: (_, k) =>
    k === 'createLinearGradient' ? () => ({ addColorStop: noop })
    : (typeof k === 'string' && k.startsWith('fill') || k === 'save' || k === 'restore') ? noop
    : noop })
}

describe('render smoke', () => {
  it('shade returns an rgb string', () => { expect(shade('#5cb85c', -30)).toMatch(/^rgb/) })
  it('draws sprites without throwing', () => {
    const ctx = stubCtx()
    expect(() => drawMascot(ctx, 100, 200, { face:1, run:0, air:false, sx:1, sy:1, inv:0, boots:false, shield:false })).not.toThrow()
    expect(() => drawBug(ctx, { x:0,y:0,w:28,h:26,vx:1,t:0,hit:0,col:'#5cb85c' }, 'en')).not.toThrow()
    expect(() => drawCoin(ctx, { x:0,y:0,got:false }, 0)).not.toThrow()
  })
  it('particle pool bursts, updates and draws', () => {
    const pool = createParticles()
    burst(pool, 0, 0, 8, { c:'#fff' })
    expect(pool.length).toBe(8)
    updateParticles(pool)
    expect(() => drawParticles(stubCtx(), pool)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/render/sprites.test.js`
Expected: FAIL — modules not found.

- [ ] **Step 3: Port the implementations**

Extract from `docs/superpowers/prototypes/2026-07-24-career-world-prototype.html`, converting each drawing function to take an explicit `ctx` as its first argument (the prototype uses a module-global `ctx`):
- `rr`, `shade`, `hexA`, `puffCloud`, `drawHills`, `drawCastle`, `drawPlayer`→`drawMascot`, `drawEnemies` body→`drawBug` (single enemy), `drawPowerups` body→`drawBoot`/`drawShieldHex`, `drawMovers` body→`drawMover`, `hexPath`, coin drawing→`drawCoin`, qblock drawing→`drawCrate` into `sprites.js`.
- `burst`, `updateParticles`, `drawParticles` into `particles.js` with the pool passed explicitly instead of the module-global `particles` array.

Keep the exact drawing math; only thread `ctx` and `pool` as parameters.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/render/sprites.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/game/render/sprites.js src/game/render/particles.js src/game/render/sprites.test.js
git commit -m "feat(game): port sprite + particle render modules from prototype"
```

---

### Task 9: HUD + audio modules

**Files:**
- Create: `src/game/render/hud.js`, `src/game/audio/sfx.js`
- Test: `src/game/audio/sfx.test.js`

**Interfaces:**
- Produces:
  - `hud.js`: `drawHud(ctx, { W, coinCount, player, biome, progress, lang })`, `drawToast(ctx, { W, toast, lang, nowMs })`.
  - `sfx.js`: `createAudio() → audio` (holds `{ ctx:null, muted:false }`), `initAudio(audio)`, `sfx(audio, type)`, `setMuted(audio, bool)`. `type ∈ 'jump'|'jump2'|'coin'|'stomp'|'power'|'hurt'`.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect, vi } from 'vitest'
import { createAudio, initAudio, sfx, setMuted } from './sfx.js'

describe('sfx', () => {
  it('is a no-op before init and when muted, and never throws', () => {
    const a = createAudio()
    expect(() => sfx(a, 'jump')).not.toThrow()   // no ctx yet
    setMuted(a, true)
    expect(a.muted).toBe(true)
    expect(() => sfx(a, 'coin')).not.toThrow()
  })
  it('creates an AudioContext on init when available', () => {
    const start = vi.fn(), stop = vi.fn()
    const osc = { type:'', frequency:{ value:0, exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), start, stop }
    const gain = { gain:{ value:0, exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() }
    global.AudioContext = vi.fn(() => ({ currentTime:0, destination:{}, createOscillator:()=>osc, createGain:()=>gain }))
    const a = createAudio(); initAudio(a); sfx(a, 'jump')
    expect(a.ctx).toBeTruthy(); expect(start).toHaveBeenCalled()
    delete global.AudioContext
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/audio/sfx.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Port implementations**

`sfx.js` — port the prototype `initAudio`/`beep`/`sfx` with an explicit `audio` holder instead of module-globals `actx`/`muted`:

```js
export function createAudio() { return { ctx: null, muted: false } }
export function initAudio(a) {
  if (a.ctx) return
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext
  if (AC) { try { a.ctx = new AC() } catch (e) { a.ctx = null } }
}
export function setMuted(a, m) { a.muted = m }
function beep(a, freq, dur, type, vol, slideTo) {
  if (a.muted || !a.ctx) return
  const o = a.ctx.createOscillator(), g = a.ctx.createGain()
  o.type = type || 'square'; o.frequency.value = freq
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.ctx.currentTime + dur)
  g.gain.value = vol || 0.05; g.gain.exponentialRampToValueAtTime(0.0001, a.ctx.currentTime + dur)
  o.connect(g); g.connect(a.ctx.destination); o.start(); o.stop(a.ctx.currentTime + dur)
}
export function sfx(a, t) {
  if (t === 'jump') beep(a, 320, 0.14, 'square', 0.05, 620)
  else if (t === 'jump2') beep(a, 500, 0.14, 'triangle', 0.05, 900)
  else if (t === 'coin') { beep(a, 880, 0.06, 'square', 0.045); setTimeout(() => beep(a, 1320, 0.09, 'square', 0.045), 60) }
  else if (t === 'stomp') beep(a, 200, 0.12, 'sawtooth', 0.06, 70)
  else if (t === 'power') [440,660,880,1180].forEach((f,i) => setTimeout(() => beep(a, f, 0.1, 'triangle', 0.05), i*55))
  else if (t === 'hurt') beep(a, 300, 0.22, 'sawtooth', 0.06, 90)
}
```

`hud.js` — port `drawHud`/`drawToast` from the prototype, taking `ctx` + a params object instead of module-globals.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/audio/sfx.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/game/render/hud.js src/game/audio/sfx.js src/game/audio/sfx.test.js
git commit -m "feat(game): port HUD renderer + WebAudio synth SFX"
```

---

## Phase 3 — Engine glue

### Task 10: Input + camera

**Files:**
- Create: `src/game/engine/input.js`, `src/game/engine/camera.js`
- Test: `src/game/engine/camera.test.js`

**Interfaces:**
- Produces:
  - `input.js`: `createInput() → { keys, attach(el, { onEnterCastle, onOpenNearest }), detach() }` where `keys` is a live `{ L, R, J }` flag object and `bufferJump()` sets a jump buffer via callback. Keyboard + a `bindTouch(button, kind)` helper for the d-pad.
  - `camera.js`: `followCamera(cam, targetX, W, levelW) → void` (mutates `cam.x` with smoothing + clamp), `shakeOffset(shake) → { x, y }`.

- [ ] **Step 1: Write the failing test** (camera is the pure part; input DOM wiring is covered by the island test in Task 15)

```js
import { describe, it, expect } from 'vitest'
import { followCamera, shakeOffset } from './camera.js'

describe('camera', () => {
  it('eases toward the target and clamps to level bounds', () => {
    const cam = { x: 0 }
    followCamera(cam, 5000, 1280, 10000)
    expect(cam.x).toBeGreaterThan(0)
    expect(cam.x).toBeLessThanOrEqual(10000 - 1280)
  })
  it('never scrolls past the left edge', () => {
    const cam = { x: 0 }
    followCamera(cam, 0, 1280, 10000)
    expect(cam.x).toBe(0)
  })
  it('returns zero shake when idle', () => {
    expect(shakeOffset(0)).toEqual({ x: 0, y: 0 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/engine/camera.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementations** (camera from prototype cam smoothing; input from prototype keydown/keyup/bind)

`camera.js`:

```js
export function followCamera(cam, targetX, W, levelW) {
  const target = targetX - W * 0.36
  cam.x += (target - cam.x) * 0.12
  cam.x = Math.max(0, Math.min(levelW - W, cam.x))
}
export function shakeOffset(shake) {
  if (!shake) return { x: 0, y: 0 }
  return { x: (Math.random() * 2 - 1) * shake, y: (Math.random() * 2 - 1) * shake }
}
```

`input.js` — port keydown/keyup flag setting + `bind()` touch handlers into a factory that attaches to `window`/buttons and exposes `keys`, a jump-buffer callback, and castle-open callbacks (Enter / tap). Follow the prototype's key mapping (Arrows/WASD, Space/Up jump, Enter/Down open, Escape close).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/engine/camera.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/input.js src/game/engine/camera.js src/game/engine/camera.test.js
git commit -m "feat(game): camera follow/shake + input factory"
```

---

### Task 11: Scene compositor + game loop (composition root)

**Files:**
- Create: `src/game/render/scene.js`, `src/game/engine/loop.js`, `src/game/careerGame.js`
- Test: `src/game/careerGame.test.js`

**Interfaces:**
- Produces:
  - `scene.js`: `drawScene(ctx, state)` — full frame draw in the documented order using Phase 2 modules; applies camera translate + shake.
  - `loop.js`: `createLoop(step, draw) → { start(), stop() }` — rAF wrapper with hit-stop gate (skips `step` while `state.hitstop > 0`).
  - `careerGame.js`: `init(canvas, { locale='en', reduced=false, onFrame } = {}) → game` where `game = { start(), stop(), setLocale(l), setMuted(b), getState() }`. Composition root: builds level from `experience.json`, wires input, physics, entities, render, audio; owns the mutable `state`.

- [ ] **Step 1: Write the failing test** (drive the composition root headlessly with a stub canvas)

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { init } from './careerGame.js'

function stubCanvas() {
  const noop = () => {}
  const ctx = new Proxy({}, { get: (_, k) =>
    k === 'createLinearGradient' ? () => ({ addColorStop: noop }) : noop })
  return { getContext: () => ctx, width:1280, height:720,
    getBoundingClientRect: () => ({ width:1280, height:720, left:0, top:0 }),
    addEventListener: noop, removeEventListener: noop }
}

describe('careerGame composition', () => {
  beforeEach(() => { global.requestAnimationFrame = () => 0; global.cancelAnimationFrame = () => {} })
  it('builds a playable state from experience data', () => {
    const game = init(stubCanvas(), { locale:'en', reduced:true })
    const s = game.getState()
    expect(s.player).toBeTruthy()
    expect(s.level.companies.length).toBeGreaterThan(0)
    expect(s.level.enemies.some(e => e.boss)).toBe(true)
    game.stop()
  })
  it('advances the player to the right when the run intent is held', () => {
    const game = init(stubCanvas(), { locale:'en', reduced:true })
    const s = game.getState()
    const x0 = s.player.x
    s.input.keys.R = 1
    for (let i = 0; i < 30; i++) game.tick(i * 16) // tick = one manual step, exposed for tests
    expect(game.getState().player.x).toBeGreaterThan(x0)
    game.stop()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/careerGame.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementations**

- `loop.js`: rAF loop calling `step(tsMs)` then `draw(tsMs)`; expose `start`/`stop`.
- `scene.js`: port the prototype `draw()` body, calling Phase-2 draw functions with the passed `ctx` and `state`.
- `careerGame.js`: assemble the mutable `state` (player, level, cam, coinCount, particles pool, audio, toast, hitstop, shake, lang, reduced), port the prototype `physics()` into a `step(tsMs)` that composes the Phase-1 pure functions (`jumpVelocity`, `gravityStep`, `resolveHorizontal/Vertical`, `patrolStep`, `resolveContact`, `applyPowerup`, `moverDelta`, `followCamera`) and the juice/side-effects (particles `burst`, `sfx`, hit-stop, shake, toasts, `win()`). Expose `tick(tsMs)` (single manual step, used by tests) and `start/stop` (via `createLoop`). `onFrame`/`onOpenPanel` callbacks surface panel-open requests to the React layer.

Keep behaviour identical to the prototype; this task is the port of its `physics()` + `draw()` + loop into the composed modules.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/careerGame.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/game/render/scene.js src/game/engine/loop.js src/game/careerGame.js src/game/careerGame.test.js
git commit -m "feat(game): scene compositor + loop + careerGame composition root"
```

---

## Phase 4 — Mount + site integration

### Task 12: CareerGame React island (canvas + lazy-load + panel)

**Files:**
- Create: `src/components/react/CareerGame.jsx`
- Test: `src/components/react/CareerGame.test.jsx`

**Interfaces:**
- Consumes: `init` from `../../game/careerGame.js` (dynamically imported).
- Produces: `export default function CareerGame({ locale })` — renders a "Play my career" cover button; on click, dynamically `import('../../game/careerGame.js')`, mounts the canvas, starts the game, renders the touch d-pad and the role-detail panel (reusing the same fields as the Experience card). Honors `matchMedia('(prefers-reduced-motion: reduce)')`.

- [ ] **Step 1: Write the failing test**

```jsx
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CareerGame from './CareerGame'

describe('CareerGame island', () => {
  it('shows a play cover and does not load the game until clicked', () => {
    render(<CareerGame locale="en" />)
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
    expect(document.querySelector('canvas')).toBeNull()
  })
  it('mounts a canvas after pressing play', async () => {
    render(<CareerGame locale="en" />)
    fireEvent.click(screen.getByRole('button', { name: /play/i }))
    // canvas appears once the dynamic import resolves
    await screen.findByTestId('career-canvas')
    expect(document.querySelector('canvas')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/react/CareerGame.test.jsx`
Expected: FAIL — component not found.

- [ ] **Step 3: Write the island**

`CareerGame.jsx`: `useState` for `started`; cover `<button>` (i18n label from a tiny inline `{ en:'▶ Play my career', es:'▶ Juega mi carrera' }`); on click set `started`, then in a `useEffect([started])` do `const { init } = await import('../../game/careerGame.js')`, call `init(canvasRef.current, { locale, reduced, onOpenPanel: setPanel })`, keep the `game` in a ref, `game.start()`, and `return () => game.stop()`. Render `<canvas data-testid="career-canvas">`, the touch d-pad buttons, a mute button, and the panel overlay (company role/metric/stack/bullets from `onOpenPanel` payload). Use `screen`-findable roles/labels.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/react/CareerGame.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/react/CareerGame.jsx src/components/react/CareerGame.test.jsx
git commit -m "feat(game): CareerGame island — play cover, lazy-load, canvas, panel"
```

---

### Task 13: Wire the play entry into the Experience section + pages

**Files:**
- Modify: `src/components/react/Experience.jsx` (add a "Play my career" affordance that renders `<CareerGame>` on demand, above or beside the timeline)
- Modify: `src/pages/en/index.astro`, `src/pages/es/index.astro` (no new import needed if the island is nested inside Experience; otherwise mount `<CareerGame client:visible locale={locale} />`)
- Test: extend `src/components/react/CareerGame.test.jsx` or add `Experience.test.jsx` assertion

**Interfaces:**
- Consumes: `CareerGame` from `./CareerGame.jsx`.
- Produces: the Experience section exposes the game without making it the default view; the timeline remains rendered and accessible.

- [ ] **Step 1: Write the failing test**

```jsx
// in CareerGame.test.jsx — assert the timeline still renders alongside the game entry
import Experience from './Experience'
it('keeps the accessible timeline as the default and offers the game', () => {
  render(<Experience locale="en" />)
  expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  // a known timeline company still present (accessible default)
  expect(screen.getByText(/Soldife/)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/react/CareerGame.test.jsx -t "accessible timeline"`
Expected: FAIL — Experience has no play button yet.

- [ ] **Step 3: Wire it in**

In `Experience.jsx`, import `CareerGame` and render it at the top of the section (`<CareerGame locale={locale} />`) above the existing filter + timeline. The timeline markup stays unchanged (accessible default + SEO). No page import changes needed because `CareerGame` is nested in the already-mounted `Experience` island.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/react/CareerGame.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/react/Experience.jsx src/components/react/CareerGame.test.jsx
git commit -m "feat(game): surface Play-my-career entry inside Experience, timeline stays default"
```

---

## Phase 5 — QA, perf, coverage

### Task 14: Playwright playthrough smoke test

**Files:**
- Create: `tests/e2e/career-world.spec.mjs` (Playwright, run against `npm run dev` or a built preview)
- Modify: `package.json` (add `"e2e": "playwright test"` if not present)

**Interfaces:**
- Consumes: the running site at `/en/` with the Experience play button.

- [ ] **Step 1: Write the failing test**

```js
import { test, expect } from '@playwright/test'
test('play → run → reach a company → panel', async ({ page }) => {
  await page.goto('/en/')
  await page.getByRole('button', { name: /play/i }).click()
  const canvas = page.getByTestId('career-canvas')
  await expect(canvas).toBeVisible()
  await canvas.focus()
  await page.keyboard.down('ArrowRight')
  for (let i = 0; i < 12; i++) { await page.keyboard.down('Space'); await page.waitForTimeout(70); await page.keyboard.up('Space'); await page.waitForTimeout(220) }
  await page.keyboard.up('ArrowRight')
  // the game exposes state on window for assertions in dev
  const coins = await page.evaluate(() => window.__career?.getState().coinCount ?? 0)
  expect(coins).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/career-world.spec.mjs`
Expected: FAIL — no `__career` handle / button not wired for e2e yet.

- [ ] **Step 3: Expose a dev-only handle + make it pass**

In `careerGame.js` `init`, when `import.meta.env.DEV`, set `window.__career = game`. Ensure the canvas has `data-testid="career-canvas"` and is focusable (`tabindex="0"`). Add a minimal `playwright.config.ts` with `webServer: { command: 'npm run dev', url: 'http://localhost:4321' }` and `use: { baseURL: 'http://localhost:4321' }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/career-world.spec.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/career-world.spec.mjs playwright.config.ts package.json src/game/careerGame.js
git commit -m "test(game): Playwright playthrough smoke — play, run, collect commits"
```

---

### Task 15: Coverage config + full suite green

**Files:**
- Modify: `vitest.config.ts` (exclude canvas/audio-heavy render modules from coverage)

**Interfaces:** none.

- [ ] **Step 1: Update coverage excludes**

In `vitest.config.ts` `test.coverage.exclude`, add: `'src/game/render/**'`, `'src/game/audio/**'`, `'src/game/engine/loop.js'`, `'src/game/engine/input.js'`, `'src/game/careerGame.js'` (impure composition/render/audio; logic is covered elsewhere).

- [ ] **Step 2: Run the full unit suite**

Run: `npx vitest run`
Expected: PASS — all existing 136 tests plus the new game unit tests green.

- [ ] **Step 3: Run coverage and confirm pure modules are well covered**

Run: `npx vitest run --coverage`
Expected: `src/game/{world,engine/physics,engine/camera,entities}` at/near 100% line coverage; no coverage failures.

- [ ] **Step 4: Production build sanity**

Run: `npm run build`
Expected: 4 pages built, zero errors. Confirm the game chunk is **code-split** (a separate JS chunk for `careerGame`, not in the page entry) by scanning the build output / `dist/_astro` for a `careerGame`-named chunk.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts
git commit -m "chore(game): exclude render/audio/composition from coverage thresholds"
```

---

### Task 16: Reduced-motion + i18n verification

**Files:**
- Test: extend `src/game/careerGame.test.js`

**Interfaces:** none new.

- [ ] **Step 1: Write the failing test**

```js
it('suppresses juice under reduced motion', () => {
  const game = init(stubCanvas(), { locale:'en', reduced:true })
  const s = game.getState()
  // force a stomp and assert no particles spawn under reduced motion
  const before = s.particles.length
  game.tick(16)
  expect(s.reduced).toBe(true)
  expect(s.particles.length).toBe(before) // no idle particle spawns when reduced
})
it('switches company labels with locale', () => {
  const game = init(stubCanvas(), { locale:'en', reduced:true })
  game.setLocale('es')
  expect(game.getState().lang).toBe('es')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/careerGame.test.js -t "reduced motion"`
Expected: FAIL until `reduced` gating + `setLocale` are wired.

- [ ] **Step 3: Wire reduced-motion gates**

In `careerGame.js` `step`, guard all `burst(...)`, `shake`, parallax, and squash writes behind `!state.reduced`. Implement `setLocale(l)` to set `state.lang` and re-render HUD/toast/panel text.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/careerGame.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/careerGame.js src/game/careerGame.test.js
git commit -m "feat(game): reduced-motion juice gating + locale switching"
```

---

## Self-Review (author checklist — completed)

- **Spec coverage:** genre/continuous-world (Tasks 7,11) · proof-of-craft via feel (Tasks 2–5,11) · Canvas 2D zero-dep (all) · original art/audio (Tasks 8,9) · soft cartoon (Task 8 port) · career theming — commits/crates/bugs/boots/shield/movers/boss (Tasks 5,6,7,8) · 5 biomes + 11 companies (Tasks 1,7) · opt-in play + timeline default (Tasks 12,13) · lazy-load (Tasks 12,15) · experience.json reuse (Task 7) · EN/ES (Tasks 12,16) · a11y/reduced-motion (Task 16) · TDD Vitest + Playwright (all + Task 14). All spec sections map to a task.
- **Placeholder scan:** render/audio/loop/composition tasks reference exact functions in the committed prototype file (`docs/superpowers/prototypes/2026-07-24-career-world-prototype.html`) — a concrete in-repo source, not a "TODO". Pure-logic tasks contain full real code.
- **Type consistency:** `player` shape identical across `createPlayer`/`hurt`/`resolveContact`/`jumpVelocity`; `company`/`level` fields consistent between `mapExperienceToCompanies`→`buildLevel`→`scene`; `audio` holder consistent across `createAudio`/`initAudio`/`sfx`.

## Notes for refining along the way

- Placement/difficulty numbers (`SPACING`, enemy counts, power-up positions) are centralized in `world/level.js` — tune there without touching logic.
- Tuning feel: everything lives in `engine/tuning.js`.
- Start minimal: Phases 1–3 give a headlessly-tested engine before any pixels ship; Phase 4 is the first on-page playable. Safe to pause after any task — each ends green and committed.
