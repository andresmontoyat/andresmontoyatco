# Career World — Phase 1+2: Game Feel + Juice

**Date:** 2026-07-25
**Status:** Design approved, pending implementation plan
**Milestone:** "Mario-quality" polish of the Career World platformer (Phase 1 of a 5-phase roadmap: Game Feel → Juice → Visual richness → Mechanics → UX surfaces).

## Goal

Make the existing Career World canvas platformer *feel* like an authentic, polished Mario-style game — tighter controls + more satisfying feedback — without copying any Nintendo IP (original biome/career art stays). Target: the "wow / first impression" that stops a recruiter.

## Constraints

- **Original IP only.** Mario-quality *feel*, not Mario assets. Biomes (Java → SOA → Microservices → Cloud → AI) unchanged.
- **Zero Perf-gate impact.** The whole game is behind a click-to-load cover (`CareerGame.jsx` lazy-imports `careerGame.js`), so nothing here loads on initial page paint. No new eager bytes.
- **No new art.** Phase 1+2 is code-level tuning + primitive-drawn juice; pixel-art additions are deferred to Phase 3.
- **Reduced-motion respected.** The engine already gates juice on `state.reduced` (from `prefers-reduced-motion`). All new juice must be gated the same way.
- **TDD.** Pure functions (physics, popup lifecycle) get unit tests first, matching the original 16-task build's discipline.

## Current state (grounded in code)

The prototype is already juicier than it looks. Confirmed present:

- **Game feel:** coyote time (`TUNING.COYOTE=6`), jump buffer (`BUFFER=8`), apex-gravity float (`APEX_VY/APEX_MULT`), a **crude** jump-cut (`careerGame.js:108` — `if (!keys.J && p.vy < -5) p.vy = -5`), double-jump via boots.
- **Juice:** hit-stop (`state.hitstop`, set 4/7 on stomp), screen-shake (`state.shake` + `camera.shakeOffset`), particle bursts (`render/particles.js`) for jump dust, land poof, running dust, coin/stomp/powerup, WebAudio SFX, land squash (`player.landReset` → `sx=1.25, sy=0.78`).

So this is **targeted refinement**, not a from-scratch juice pass.

## Scope — the real gaps

### Phase 1 — Game Feel

1. **Smooth variable jump height.** Replace the hard cap `p.vy = -5` (careerGame.js:108) with a proportional cut: on jump-release while rising, `p.vy *= TUNING.JUMP_CUT` (~0.45). Gives a true graduated tap-hop → full-jump curve. New `TUNING.JUMP_CUT`.
2. **Corner correction (ceiling forgiveness).** When the player's head clips a solid's corner while rising (`hitHead`) but is within `TUNING.CORNER_PX` (~6px) of clearing it horizontally, nudge `p.x` sideways to slip past instead of dead-stopping the jump. Implemented as a pure helper in `physics.js` (`cornerCorrect(p, solids, t) → nudged?`), called from the vertical-resolution step.
3. **Skid / turnaround.** When the player reverses horizontal direction on the ground (input opposite to `vx` sign), apply a stronger skid friction (`TUNING.SKID` < `FRICT`) for a few frames and emit a small skid-dust burst (reduced-gated). Adds momentum weight. Lives in the horizontal-update block of `careerGame.js` + a `TUNING.SKID`.
4. **Tuning pass.** Re-check `COYOTE`, `BUFFER`, `MOVE`, `FRICT`, `MAXV` against the new jump-cut in playtest; adjust constants only (no structural change).

### Phase 2 — Juice (layered on existing)

1. **Floating score popups.** New tiny module `render/popups.js` — `createPopups()`, `addPopup(pool, x, y, text)`, `updatePopups(pool)`, `drawPopups(ctx, pool)`. A popup rises + fades over ~40 frames. Hooked at coin-collect and enemy-stomp to show `+100` / combo values. Pure lifecycle → unit-tested. **Reduced-motion:** popup renders in place (no rise) and fades — the score feedback stays, the motion doesn't. `updatePopups` takes a `reduced` flag that zeroes the rise velocity.
2. **Jump-takeoff stretch.** On jump apply (careerGame.js jump block), set `p.sx=0.8, p.sy=1.3` (stretch) to complement the existing land squash. The existing per-frame `sx/sy → 1` easing already restores it. Gated on `!state.reduced`.
3. **Stomp combo.** Track consecutive airborne stomps (`state.combo`, reset on land). Each chained stomp awards a rising score (100 → 200 → 400…), shows the combo value via a popup, and raises the stomp SFX pitch. Combo state on `state`.
4. **Pickup punch.** Add a 2-frame hit-stop + brief flash on coin/powerup pickup (currently only bursts). Reuses `state.hitstop`. Gated on `!state.reduced`.

## Architecture / boundaries

- **`engine/tuning.js`** — add `JUMP_CUT`, `CORNER_PX`, `SKID`. Single source of feel constants.
- **`engine/physics.js`** — add pure `cornerCorrect(p, solids, t)`; keep it side-effect-limited to the nudge (returns whether it nudged). Unit-tested with synthetic solids.
- **`render/popups.js`** — NEW, self-contained pool module mirroring `particles.js`'s shape (create/add/update/draw). No engine deps. Unit-tested lifecycle.
- **`careerGame.js`** — composition root: wires jump-cut, skid, jump-stretch, combo, popups, pickup-punch into the existing update loop. The only file that grows; changes are localized to the jump, horizontal, stomp, and pickup blocks already identified by line.
- **`CareerGame.jsx`** — unchanged (Phase 1+2 is engine-only; UX surfaces are Phase 5).

## Data flow

Input (`keys.J` held/released) → `careerGame.js` update → physics (`jumpVelocity`, `cornerCorrect`, `gravityStep`) → player state (`vx/vy/sx/sy/combo`) → render (`particles`, `popups`, `hud`, sprites with squash) + `sfx`. Popups and combo are new state on the existing `state` object; no new systems, no new external interfaces.

## Testing

- **Unit (Vitest, pure):** `cornerCorrect` (nudges within CORNER_PX, doesn't past it, no false nudge on flat ceiling); jump-cut curve (release scales vy proportionally, no-op when falling); `popups` lifecycle (add → rises → fades → culled); combo scoring (100→200→400, resets on land).
- **Playtest (manual, feel is subjective):** before/after screenshots + a short capture of jump arc, skid, coin popup, stomp combo. Drive via Playwright against the running game (existing e2e harness pattern).
- **Regression:** the 149 existing tests stay green; reduced-motion path keeps juice gated.

## Out of scope (later phases)

Parallax/animated tiles/biome decoration (Phase 3), ? blocks / power-up variety / boss / secrets (Phase 4), cover / panel / celebration / onboarding UX (Phase 5), chiptune music (candidate for a Phase 2.5 or Phase 3 audio pass — not in this slice).
