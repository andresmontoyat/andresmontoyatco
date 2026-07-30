# Career World — Game Feel + Juice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the Career World canvas platformer from a functional prototype to an authentic-feeling Mario-quality platformer via tighter controls and richer feedback — engine-only, no new art.

**Architecture:** Add pure, unit-tested helpers to `engine/physics.js` (jump-cut, corner-correction) and a new self-contained `render/popups.js` pool module + a pure `comboScore` helper; then wire them, plus jump-stretch / skid / pickup-punch, into the existing `careerGame.js` update loop. Nothing new hydrates or loads on the page — the game is behind `CareerGame.jsx`'s click-to-load cover.

**Tech Stack:** Vanilla JS ES modules, Canvas 2D, Vitest (unit). Test runner: `npx vitest run <path>`.

## Global Constraints

- **Original IP only** — Mario *feel*, never Mario assets. Biomes unchanged.
- **Zero initial-page bytes** — all changes live under `src/game/**`, loaded only after the visitor clicks Play. No edits to `CareerGame.jsx`, no new eager imports.
- **No new art** — juice is primitive-drawn (canvas shapes/text) + numeric tuning only.
- **Reduced-motion gated** — every motion effect checks the existing `state.reduced` flag (or a `reduced` param); under reduced motion, effects render statically or are skipped, never move.
- **Feel constants live in `engine/tuning.js`** — no magic numbers scattered in the loop.
- **Existing suite stays green** — the game's current per-module tests + `careerGame.test.js` must pass unchanged.

---

### Task 1: Smooth variable jump height (jump-cut)

Replace the crude hard cap (`careerGame.js:108` — `if (!keys.J && p.vy < -5) p.vy = -5`) with a proportional cut so tap = short hop, hold = full jump.

**Files:**
- Modify: `src/game/engine/tuning.js` (add `JUMP_CUT`)
- Modify: `src/game/engine/physics.js` (add `applyJumpCut`)
- Modify: `src/game/careerGame.js:108` (call the helper)
- Test: `src/game/engine/physics.test.js`

**Interfaces:**
- Produces: `applyJumpCut(p, jHeld, t)` — mutates `p.vy`; returns the new `p.vy`. `p` = player-like `{ vy }`; `jHeld` = truthy if jump key held; `t` = TUNING.

- [ ] **Step 1: Write the failing test** — append to `src/game/engine/physics.test.js`:

```js
import { applyJumpCut } from './physics.js'
import { TUNING } from './tuning.js'

describe('applyJumpCut', () => {
  it('scales upward velocity down when jump released while rising', () => {
    const p = { vy: -13.2 }
    applyJumpCut(p, 0, TUNING)
    expect(p.vy).toBeCloseTo(-13.2 * TUNING.JUMP_CUT)
  })
  it('does nothing while the jump key is held', () => {
    const p = { vy: -13.2 }
    applyJumpCut(p, 1, TUNING)
    expect(p.vy).toBe(-13.2)
  })
  it('does nothing while falling (vy >= 0)', () => {
    const p = { vy: 3 }
    applyJumpCut(p, 0, TUNING)
    expect(p.vy).toBe(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/engine/physics.test.js`
Expected: FAIL — `applyJumpCut is not a function` and `TUNING.JUMP_CUT` undefined.

- [ ] **Step 3: Add the tuning constant** — in `src/game/engine/tuning.js`, add `JUMP_CUT: 0.45,` to the `TUNING` object (after `APEX_MULT`).

- [ ] **Step 4: Implement the helper** — append to `src/game/engine/physics.js`:

```js
export function applyJumpCut(p, jHeld, t) {
  if (!jHeld && p.vy < 0) p.vy *= t.JUMP_CUT
  return p.vy
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/game/engine/physics.test.js`
Expected: PASS.

- [ ] **Step 6: Wire into the loop** — in `src/game/careerGame.js`, import `applyJumpCut` (add to the existing `physics.js` import on line 8) and replace line 108 (`if (!keys.J && p.vy < -5) p.vy = -5`) with:

```js
  applyJumpCut(p, keys.J, t)
```

- [ ] **Step 7: Run the full game suite**

Run: `npx vitest run src/game`
Expected: PASS (no regressions).

- [ ] **Step 8: Commit**

```bash
git add src/game/engine/tuning.js src/game/engine/physics.js src/game/careerGame.js src/game/engine/physics.test.js
git commit -m "feat(game): smooth variable jump height (proportional jump-cut)"
```

---

### Task 2: Corner correction (ceiling forgiveness)

When rising and the head clips a solid by a small sliver, nudge the player horizontally to slip past instead of dead-stopping the jump.

**Files:**
- Modify: `src/game/engine/tuning.js` (add `CORNER_PX`)
- Modify: `src/game/engine/physics.js` (add `cornerCorrect`, reuse `aabb`)
- Modify: `src/game/careerGame.js` (call before vertical resolution)
- Test: `src/game/engine/physics.test.js`

**Interfaces:**
- Consumes: `aabb(a, b)` (already in physics.js).
- Produces: `cornerCorrect(p, solids, t)` — when `p` is rising (`vy < 0`) and overlaps a solid by ≤ `t.CORNER_PX` on exactly one horizontal edge, sets `p.x` clear of that edge and returns `true`; otherwise returns `false`. `p` = `{ x, y, w, h, vy }`; `solids` = array of `{ x, y, w, h }`.

- [ ] **Step 1: Write the failing test** — append to `src/game/engine/physics.test.js`:

```js
import { cornerCorrect } from './physics.js'

describe('cornerCorrect', () => {
  const t = { CORNER_PX: 6 }
  const solid = { x: 100, y: 0, w: 40, h: 20 } // ceiling block, bottom at y=20
  it('nudges the player out when only a small sliver overlaps the left edge', () => {
    // player right edge pokes 4px into the solid's left, head at y=18 (inside)
    const p = { x: 100 - 26 + 4, y: 10, w: 26, h: 36, vy: -8 }
    expect(cornerCorrect(p, [solid], t)).toBe(true)
    expect(p.x).toBe(solid.x - p.w) // pushed fully left of the block
  })
  it('does NOT nudge when the overlap is a real ceiling (deep)', () => {
    const p = { x: 110, y: 10, w: 26, h: 36, vy: -8 } // deep under the block
    expect(cornerCorrect(p, [solid], t)).toBe(false)
  })
  it('does nothing while falling', () => {
    const p = { x: 100 - 26 + 4, y: 10, w: 26, h: 36, vy: 5 }
    expect(cornerCorrect(p, [solid], t)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/engine/physics.test.js`
Expected: FAIL — `cornerCorrect is not a function`.

- [ ] **Step 3: Add the tuning constant** — in `src/game/engine/tuning.js`, add `CORNER_PX: 6,` to `TUNING`.

- [ ] **Step 4: Implement the helper** — append to `src/game/engine/physics.js`:

```js
export function cornerCorrect(p, solids, t) {
  if (p.vy >= 0) return false
  for (const s of solids) {
    if (!aabb(p, s)) continue
    const overLeft = (p.x + p.w) - s.x      // how far player's right pokes past solid's left
    const overRight = (s.x + s.w) - p.x      // how far player's left pokes past solid's right
    if (overLeft > 0 && overLeft <= t.CORNER_PX && overLeft <= overRight) {
      p.x = s.x - p.w
      return true
    }
    if (overRight > 0 && overRight <= t.CORNER_PX && overRight < overLeft) {
      p.x = s.x + s.w
      return true
    }
  }
  return false
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/game/engine/physics.test.js`
Expected: PASS.

- [ ] **Step 6: Wire into the loop** — in `src/game/careerGame.js`, add `cornerCorrect` to the `physics.js` import, and call it immediately BEFORE the vertical-resolution block. Find the line `p.y += p.vy` (careerGame.js:153) and insert right after it, before `resolveVertical`:

```js
  cornerCorrect(p, solids, t)
```

- [ ] **Step 7: Run the full game suite**

Run: `npx vitest run src/game`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/game/engine/tuning.js src/game/engine/physics.js src/game/careerGame.js src/game/engine/physics.test.js
git commit -m "feat(game): corner correction on ceiling clips"
```

---

### Task 3: Floating score popups module

New self-contained pool module mirroring `render/particles.js`'s create/update/draw shape.

**Files:**
- Create: `src/game/render/popups.js`
- Test: `src/game/render/popups.test.js`

**Interfaces:**
- Produces:
  - `createPopups()` → `[]`
  - `addPopup(pool, x, y, text)` → pushes `{ x, y, text, life: 1, vy: -1.1 }`
  - `updatePopups(pool, reduced)` → advances each popup: `life -= 0.025`; if `!reduced`, `y += vy`; splices when `life <= 0`
  - `drawPopups(ctx, pool)` → renders each with `globalAlpha = life`

- [ ] **Step 1: Write the failing test** — create `src/game/render/popups.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { createPopups, addPopup, updatePopups } from './popups.js'

describe('popups', () => {
  it('starts empty and adds a popup with the given text', () => {
    const pool = createPopups()
    addPopup(pool, 50, 80, '+100')
    expect(pool).toHaveLength(1)
    expect(pool[0].text).toBe('+100')
    expect(pool[0].life).toBe(1)
  })
  it('rises (y decreases) and fades on update when not reduced', () => {
    const pool = createPopups()
    addPopup(pool, 50, 80, '+100')
    const y0 = pool[0].y
    updatePopups(pool, false)
    expect(pool[0].y).toBeLessThan(y0)
    expect(pool[0].life).toBeLessThan(1)
  })
  it('does NOT move under reduced motion but still fades', () => {
    const pool = createPopups()
    addPopup(pool, 50, 80, '+100')
    const y0 = pool[0].y
    updatePopups(pool, true)
    expect(pool[0].y).toBe(y0)
    expect(pool[0].life).toBeLessThan(1)
  })
  it('culls the popup once its life runs out', () => {
    const pool = createPopups()
    addPopup(pool, 50, 80, '+100')
    for (let i = 0; i < 50; i++) updatePopups(pool, false)
    expect(pool).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/render/popups.test.js`
Expected: FAIL — cannot find module `./popups.js`.

- [ ] **Step 3: Implement the module** — create `src/game/render/popups.js`:

```js
export function createPopups() {
  return []
}

export function addPopup(pool, x, y, text) {
  pool.push({ x, y, text, life: 1, vy: -1.1 })
}

export function updatePopups(pool, reduced) {
  for (let i = pool.length - 1; i >= 0; i--) {
    const q = pool[i]
    if (!reduced) q.y += q.vy
    q.life -= 0.025
    if (q.life <= 0) pool.splice(i, 1)
  }
}

export function drawPopups(ctx, pool) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.font = 'bold 14px monospace'
  for (const q of pool) {
    ctx.globalAlpha = Math.max(0, q.life)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(q.text, q.x, q.y)
  }
  ctx.restore()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/render/popups.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/game/render/popups.js src/game/render/popups.test.js
git commit -m "feat(game): floating score popup pool module"
```

---

### Task 4: Stomp combo scoring helper

Pure helper for the escalating score of chained mid-air stomps.

**Files:**
- Modify: `src/game/engine/tuning.js` (add `SKID` here too, used in Task 5 — group the two new constants)
- Create: `src/game/entities/combo.js`
- Test: `src/game/entities/combo.test.js`

**Interfaces:**
- Produces: `comboScore(chain)` → `100 * 2^(chain-1)` for `chain >= 1` (100, 200, 400, 800…), and `100` for `chain <= 1`.

- [ ] **Step 1: Write the failing test** — create `src/game/entities/combo.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { comboScore } from './combo.js'

describe('comboScore', () => {
  it('awards 100 for the first stomp in a chain', () => {
    expect(comboScore(1)).toBe(100)
  })
  it('doubles per chained stomp', () => {
    expect(comboScore(2)).toBe(200)
    expect(comboScore(3)).toBe(400)
    expect(comboScore(4)).toBe(800)
  })
  it('never drops below 100 for non-positive chains', () => {
    expect(comboScore(0)).toBe(100)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/entities/combo.test.js`
Expected: FAIL — cannot find module `./combo.js`.

- [ ] **Step 3: Add `SKID` tuning + implement helper** — in `src/game/engine/tuning.js` add `SKID: 0.68,` to `TUNING`. Then create `src/game/entities/combo.js`:

```js
export function comboScore(chain) {
  const n = Math.max(1, chain)
  return 100 * Math.pow(2, n - 1)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/entities/combo.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/tuning.js src/game/entities/combo.js src/game/entities/combo.test.js
git commit -m "feat(game): stomp combo scoring helper + skid tuning constant"
```

---

### Task 5: Wire juice into the loop (popups, jump-stretch, combo, skid, pickup-punch)

Integrate the Task 3/4 helpers plus the inline juice effects into `careerGame.js`. This is loop wiring; coverage is the existing `careerGame.test.js` (stays green) plus manual playtest.

**Files:**
- Modify: `src/game/careerGame.js`
- Verify: `src/game/careerGame.test.js` (unchanged, must stay green)

**Interfaces:**
- Consumes: `createPopups`, `addPopup`, `updatePopups`, `drawPopups` (Task 3); `comboScore` (Task 4); `TUNING.SKID` (Task 4).

- [ ] **Step 1: Import + init state** — in `src/game/careerGame.js`:
  - Add imports near the existing render imports (line ~15): `import { createPopups, addPopup, updatePopups, drawPopups } from './render/popups.js'` and `import { comboScore } from './entities/combo.js'`.
  - In the `state` object (near `particles: createParticles()`, line ~41) add: `popups: createPopups(), combo: 0,`.

- [ ] **Step 2: Popups + combo at enemy stomp** — locate the stomp-resolution block (careerGame.js ~line 219-226, where `state.hitstop`/`state.shake` are set and `state.coinCount += 1`). Replace the single `state.coinCount += 1` reward with combo-aware scoring:

```js
  state.combo += 1
  const gained = comboScore(state.combo)
  state.coinCount += Math.round(gained / 100)
  addPopup(state.popups, en.x + en.w / 2, en.y - 8, '+' + gained)
```

- [ ] **Step 3: Reset combo on landing** — in the landing block (careerGame.js ~line 160, inside the `if (landedOn ...)` where `landReset(p, !state.reduced)` is called), add after `landReset`:

```js
    state.combo = 0
```

- [ ] **Step 4: Popup at coin collect** — in BOTH coin-collect spots (the `collectCoin`-style block ~line 175 and the coin-loop block ~line 196, each has `burst(... '#ffd94a' ...)` + `sfx(..., 'coin')`), add after the `sfx` call:

```js
    addPopup(state.popups, /* coin x */, /* coin y */ - 6, '+100')
```
Use the coin's own coordinates already in scope at each site (`q.x + q.w/2, q.y` at the first; `c.x, c.y` at the second).

- [ ] **Step 5: Jump-takeoff stretch** — in the jump-apply block (careerGame.js ~line 119, where `p.vy = v; p.onGround = false` after a ground/coyote jump), add (gated):

```js
    if (!state.reduced) { p.sx = 0.8; p.sy = 1.3 }
```

- [ ] **Step 6: Pickup punch** — in the power-up pickup block (careerGame.js ~line 211, where the `burst(... isShield ...)` fires), add before/after the burst (gated):

```js
    if (!state.reduced) state.hitstop = Math.max(state.hitstop, 2)
```

- [ ] **Step 7: Skid friction** — in the horizontal-movement block (where `p.vx *= t.FRICT` is applied on the ground), apply the stronger `SKID` friction for a frame when the input direction opposes current `vx`. Find the friction application and make it conditional:

```js
  const reversing = (keys.L && p.vx > 0) || (keys.R && p.vx < 0)
  p.vx *= (p.onGround && reversing) ? t.SKID : t.FRICT
  if (p.onGround && reversing && Math.abs(p.vx) > 1 && !state.reduced) {
    burst(state.particles, p.x + p.w / 2, p.y + p.h, 3, { c: '#e8dcc0', spread: 1.2, up: 0.3, grav: 0.2, r: 2 })
  }
```
(If the current code sets `p.vx *= t.FRICT` unconditionally, replace that single line with the block above. `keys`, `t`, `state` are already in scope.)

- [ ] **Step 8: Update + draw popups in the loop** — find where `updateParticles(state.particles)` is called (update phase) and add beside it: `updatePopups(state.popups, state.reduced)`. Find where `drawParticles(ctx, state.particles)` is called (draw phase) and add after it: `drawPopups(ctx, state.popups)`.

- [ ] **Step 9: Run the full game suite**

Run: `npx vitest run src/game`
Expected: PASS — `careerGame.test.js` and all module tests green (149-suite total unaffected outside the game).

- [ ] **Step 10: Full suite + build**

Run: `npx vitest run` then `npm run build`
Expected: all tests PASS; build succeeds.

- [ ] **Step 11: Commit**

```bash
git add src/game/careerGame.js
git commit -m "feat(game): wire juice — popups, jump stretch, stomp combo, skid, pickup punch"
```

---

### Task 6: Manual playtest + tuning pass

Feel is subjective — verify by playing, then adjust constants only.

**Files:**
- Possibly modify: `src/game/engine/tuning.js` (constant values only)

- [ ] **Step 1: Build + serve**

Run: `npm run build && npx astro preview --port=4321`

- [ ] **Step 2: Drive the game** — with Playwright (reuse the `tests/e2e/career-world.spec.mjs` pattern): load `/en/`, scroll to Experience, click Play, focus the canvas, and exercise: tap-vs-hold jump (variable height visible), a ceiling-corner jump (slips past), a direction reversal (skid dust), coin pickup (+100 popup rises), a chained double-stomp (combo +200 popup, escalating). Capture a screenshot at the coin-popup and combo moments.

- [ ] **Step 3: Look at the captures** — confirm popups render legibly, jump arc feels graduated, skid dust appears. Note anything that feels off.

- [ ] **Step 4: Tune if needed** — adjust only `JUMP_CUT` (higher = floatier tap), `SKID` (lower = harder skid stop), `CORNER_PX` (higher = more forgiving) in `tuning.js`. Re-run `npx vitest run src/game` after any change (the `applyJumpCut`/`cornerCorrect` tests use `TUNING` values, so keep them consistent).

- [ ] **Step 5: Commit any tuning**

```bash
git add src/game/engine/tuning.js
git commit -m "tune(game): feel constants after playtest"
```

---

## Self-Review

- **Spec coverage:** Phase 1 — variable jump (T1), corner correction (T2), skid (T5 step 7), tuning pass (T6). Phase 2 — popups (T3 + wired T5), jump-stretch (T5 step 5), stomp combo (T4 + wired T5), pickup punch (T5 step 6). All spec items mapped. ✓
- **Placeholders:** the coin-popup coordinates in T5 step 4 reference in-scope variables described explicitly (`q.x+q.w/2,q.y` and `c.x,c.y`) rather than a literal — acceptable because the exact site variables are named. Skid step notes the fallback if friction is a single line. No TBD/TODO. ✓
- **Type consistency:** `applyJumpCut(p, jHeld, t)`, `cornerCorrect(p, solids, t)`, `createPopups/addPopup(pool,x,y,text)/updatePopups(pool,reduced)/drawPopups(ctx,pool)`, `comboScore(chain)` — names/params match between definition tasks and the T5 wiring. ✓
- **Reduced-motion:** jump-stretch, pickup-punch, skid dust, and popup rise are all gated on `state.reduced` / the `reduced` param. ✓
