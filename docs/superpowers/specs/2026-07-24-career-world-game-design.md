# Career World — Playable Career Platformer

**Date:** 2026-07-24
**Status:** Design approved (brainstorming) — pending implementation plan
**Type:** Feature inside the v5 Astro portfolio (NOT a new project)
**Supersedes / revives:** `2026-05-29-game-mode-design.md` (skill-constellation, abandoned) and the purged `mario-world` overworld (v3.11, reflog `54308c8`)
**Playable prototype (reference):** `career-world.html` artifact — validated look, feel, mechanics, a11y model

---

## Context & Problem

The v5 portfolio (Astro static + React islands, bilingual EN/ES, dark theme, Lighthouse 90+ hard gate on mobile) presents Carlos's 18-year backend career as scrolling sections. The core value is to stop recruiters mid-scroll.

Two prior game attempts stalled: a WebGL skill-constellation (too heavy, failed the Lighthouse gate) and a WebGL Mario-style overworld map (never finished, same performance risk). This spec replaces both with a **playable 2D platformer** built on plain Canvas 2D — light, smooth on mobile, and framework-free.

The game's purpose is **proof-of-craft**: a senior backend engineer who ships a polished, performant, accessible browser game demonstrates engineering skill directly. The metaphor matters less than flawless execution.

## Goal

A recruiter can **play** Carlos's career: run and jump through one continuous world from 2007 to 2026, across five biomes that encode his technical evolution (Java Legacy → SOA → Microservices → Cloud → AI). Each company is a milestone reached in-level; reaching it surfaces the role detail (reusing the existing Experience data). The game feels as tight as a classic platformer, looks entirely original, runs at 60fps on mobile, and never compromises the site's accessibility or Lighthouse budget.

## Non-Goals (v1)

- **No Nintendo IP.** No Mario/Nintendo sprites, characters, enemies, power-ups, music, level layouts, or the name "Mario." All art, characters, and audio are original. (See Legal note.)
- No overworld map + separate levels (rejected: less cohesive than one continuous world).
- No online features, save state, leaderboards, or accounts.
- No level editor.
- The game does not replace the accessible Experience timeline — it augments it as an opt-in "play" mode.

## Legal / IP note (a hard constraint)

This is a **named professional portfolio**. Shipping high-fidelity Nintendo-derivative assets is trademark/copyright exposure and a poor professional signal. The reconciliation, validated in the prototype:

- **Gameplay mechanics are not copyrightable** — tight variable-height jumping, run momentum, stomping enemies, collectibles, ?-blocks-as-item-sources, flag/castle goals. We replicate the *feel* freely.
- **Expressive assets are** — so all sprites, characters, enemy designs, palette, and sound are original (procedural Canvas art + synthesized WebAudio). No third-party assets. If richer art is ever wanted, use **CC0 packs (Kenney.nl)**, never Nintendo-derivative stock.

## Locked Decisions

| # | Decision | Choice |
|---|----------|--------|
| D1 | Game genre | Playable 2D side-scrolling platformer, one continuous world |
| D2 | Purpose | Proof-of-craft — execution quality over metaphor |
| D3 | Renderer | Plain **Canvas 2D** + custom game loop (no engine, no framework, ~0 kb deps) |
| D4 | Art / audio | **100% original** — procedural Canvas pixel/cartoon art + WebAudio synth. No Nintendo IP. |
| D5 | Visual style | Soft, friendly, rounded cartoon (not hard 8-bit). Brand green mascot, biome palettes |
| D6 | Career theming | Every element carries career meaning (see Mechanics) |
| D7 | Content | 5 biome-eras, 11 companies as in-level milestones, chronological 2007→2026 |
| D8 | Site integration | Opt-in **"play" mode**; the accessible Experience timeline stays the default + SEO/a11y fallback |
| D9 | Performance | Lazy-load game JS only on entering play mode; keeps the home Lighthouse budget intact |
| D10 | Data | Reuse `src/data/experience.json` for company milestones |
| D11 | i18n | Bilingual EN/ES via locale prop, same pattern as other v5 sections |

## Game-Feel Spec (the heart — all original mechanics)

Tuned in the prototype; these are the targets:

- **Run**: acceleration + friction with momentum; skid deceleration when reversing; max speed ~4.4 px/frame.
- **Jump**: variable height (release cuts rise), **coyote time** ~6 frames, **jump buffer** ~8 frames, **apex-hang** (gravity ×0.55 near the apex for float).
- **Stomp**: land on an enemy's head → defeat it, bounce off; brief invulnerability window.
- **Forgiving**: no death/lives. Falling nudges you back; taking a side hit is knockback + brief i-frames (loses a power-up if held). This suits a portfolio — frustration-free.
- **Juice**: squash-stretch on jump/land, dust particles on land/skid, coin/crate spark bursts, enemy poof, **hit-stop** micro-freeze on stomp, subtle screen-shake. All disabled/reduced under `prefers-reduced-motion`.
- **Audio**: WebAudio-synthesized SFX (jump, double-jump, coin, stomp, power-up, hurt, victory). Mute toggle. No audio files, no external audio. Initialized on first user gesture.

## Themed Mechanics (original characters/names)

| Classic role | Career version | Meaning |
|--------------|----------------|---------|
| Collectible | **Commits** (coin orbs) | deliveries / achievements |
| Item block | **Skill crate** (`?`) | drops a power-up or commits |
| Walking enemy | **Bugs** — Null-Pointer (`∅`), era-tinted by biome | defects you resolve by stomping |
| Power-up A | **Spring Boots** (Spring Boot pun) | double-jump |
| Power-up B | **Hexagonal Shield** (hexagonal architecture) | absorbs one hit (armor) |
| Power-up C (future) | **Coffee Rush** | temporary speed boost |
| Moving platform | **CI Pipeline** | carries the player |
| Flag / castle | **Company** | career milestone → role detail overlay |
| Final boss | **Legacy Boss** at Soldife (2026) | 3 stomps → "Career Cleared" victory |

## Content Structure

One continuous level, ~10k px wide. Companies at fixed x-positions in chronological order; biome zones switch at the midpoint between companies where the era changes. Biome background (sky + parallax hills + ground tint) cross-fades by zone. Featured roles render as numbered castles, others as domed huts with flags. Enemies, moving platforms, skill crates, and commit arcs populate the approach to each company. The Legacy Boss guards the final castle (Soldife). Reaching a company shows a non-blocking toast (role + year + metric); pressing Enter / tapping the castle opens the full detail panel (role, stack, bullets) — same content as the timeline cards.

## Architecture

Framework-free ES modules, each with one clear responsibility, testable in isolation. Rendered inside the Astro site as a client-only island or a dedicated route, hydrated only when the user chooses to play.

```
src/game/                          (new — replaces the abandoned src/game/ constellation)
├── engine/
│   ├── loop.js          rAF loop, fixed-step update + hit-stop gate
│   ├── input.js         keyboard + touch d-pad → intent flags (no DOM in physics)
│   ├── physics.js       player integration, AABB collision, coyote/buffer/apex   ← pure, unit-tested
│   └── camera.js        follow + clamp, screen-shake offset
├── entities/
│   ├── player.js        state + stomp/hurt/power-up transitions               ← pure
│   ├── enemy.js         patrol AI, stomp resolution, boss hp                   ← pure
│   ├── powerup.js       Spring Boots / Hexagonal Shield pickup effects
│   └── mover.js         moving-platform position + rider carry
├── world/
│   ├── level.js         builds solids/coins/crates/enemies/movers from data    ← pure, unit-tested
│   ├── biomes.js        year→biome mapping + palette (revive from reflog 54308c8)
│   └── level.data.js    hand-tuned placements per company
├── render/
│   ├── scene.js         orchestrates draw order
│   ├── sprites.js       procedural mascot / bug / castle / props (Canvas)
│   ├── particles.js     burst pool + update/draw
│   └── hud.js           commits, era banner, progress, power-up badges, toast
├── audio/
│   └── sfx.js           WebAudio synth blips + mute
├── ui/
│   ├── panel.js         role-detail overlay (reuses Experience content + i18n)
│   └── CareerGame.astro / mount island   entry, lazy-load, reduced-motion handling
```

- **Data flow:** `experience.json` → `level.js` builds immutable level model → `loop` steps `physics`/`entities` against it → `scene` renders → `hud`/`panel` present. Input is captured to intent flags; physics never touches the DOM.
- **Boundaries:** `engine/*` and `entities/*` and `world/level.js` are pure (no Canvas, no DOM) → fully unit-testable. `render/*`, `audio/*`, `ui/*` are the impure edges.

## Site Integration

- The Experience section keeps its accessible timeline (already restored). It gains a **"Play my career"** entry that lazy-imports the game module and mounts the Canvas island. This keeps the game's JS out of the initial page load.
- Locale arrives via prop (EN/ES), matching the v5 island pattern (Nav, SectionPager, Experience).
- On `prefers-reduced-motion`, the play entry still works but juice/parallax/shake are disabled; the timeline remains the primary, fully-accessible path.

## Accessibility & Performance

- **a11y:** a real-time platformer is inherently not keyboard-a11y-complete; therefore the **timeline is the accessible default** and the game is explicitly optional. The play entry is labeled and skippable; the game is never the only way to read the career.
- **Perf / Lighthouse:** game code is lazy-loaded (dynamic import on play), so the home/Experience initial bundle and Lighthouse mobile score are unaffected. Canvas 2D + procedural art means no image/audio asset downloads. Target 60fps mobile (validated in prototype).
- **Motion:** all juice gated behind `prefers-reduced-motion`. Audio defaults on but mutable and gesture-initialized.

## Testing (TDD)

- **Unit (Vitest, pure modules):** physics (jump height, coyote, buffer, apex, collision resolution), enemy stomp vs hurt decision, boss hp countdown, power-up state transitions, `level.js` builds correct counts/positions from data, `biomes.js` year→biome mapping.
- **Integration (Playwright):** playthrough smoke — run right, collect commits, stomp a bug, grab a power-up, ride a mover, defeat the boss, reach victory; EN/ES toggle; reduced-motion disables juice; mute toggles audio.
- Coverage target per project rule (domain/logic ~100%; render/audio excluded).

## Scope

**v1 (this plan):** Mario-tier feel (run/momentum/variable-jump/coyote/buffer/apex) · commits + skill crates · era-tinted Bug enemies · Spring Boots + Hexagonal Shield · CI-pipeline movers · Legacy Boss + Career-Cleared victory · 5 biomes + 11 company milestones · full juice + synth SFX + mute · bilingual + touch · lazy-loaded island · Vitest + Playwright suites.

**Future:** Coffee Rush (3rd power-up), more bug types + behaviors per era, title/intro screen, per-run collectible tracking, richer boss patterns, optional CC0 sprite pass.

## Open Questions

None blocking. Placement/difficulty numbers are tunable during implementation against the prototype as the reference.
