---
phase: 20-3d-constellation
plan: 02b
type: execute
wave: 3
depends_on: [20-02a]
files_modified:
  - src/game/OnboardingHint.js
  - src/game/OnboardingHint.test.js
  - src/game/GameMode.js
  - src/i18n/translations.js
autonomous: false
requirements: [DEPTH-01]
tags: [onboarding-hint, i18n, bilingual, a11y]

must_haves:
  truths:
    - "Bilingual onboarding hint pill renders 800ms after WebGL canvas appears (motion-safe fade-in)"
    - "Pill dismisses on auto-timeout 5s after fade-in, on click of the pill, or on first drag (via Plan 20-02a's onFirstDrag callback writing cam-3d-hint-seen)"
    - "Pill is suppressed on subsequent visits when localStorage cam-3d-hint-seen='true'"
    - "Pill returns null under prefers-reduced-motion: reduce (defensive — useRendererCapability already routes RM users to SVG before WebGL mounts)"
    - "Pill is a <button type='button'> with 44x44 min touch target + aria-label (WCAG 2.5.5 + Phase 4 RESP-03)"
    - "Nested i18n key t.game.hint.drag (EN: 'drag to rotate' / ES: 'arrastra para rotar') — NOT flat hintDrag per Alert A13"
    - "tailwind.config.js diff is empty — animate-fade-in (line 94) and animate-hint-fade-out (line 100) are CONSUMED, NOT redefined per Alert A7"
    - "GameMode renders <OnboardingHint t={t} /> conditionally when effectiveCapability === 'webgl' (forceSvgFallback from 20-02a defers)"
    - "All 271+ existing tests stay GREEN; ≥5 new OnboardingHint tests added; bundle-gate exits 0"
  artifacts:
    - path: "src/game/OnboardingHint.js"
      provides: "Bilingual <button> hint pill with fade-in delay + 5s auto-dismiss + click dismiss + localStorage cam-3d-hint-seen flag + RM defensive gate + 44x44 touch target"
      contains: "cam-3d-hint-seen"
    - path: "src/game/OnboardingHint.test.js"
      provides: "Vitest + RTL tests: not visible before fade-in delay, visible after 800ms, suppressed when flag set, dismiss-on-click, auto-dismiss after 5s, RM path no pill"
      contains: "cam-3d-hint-seen"
    - path: "src/game/GameMode.js"
      provides: "OnboardingHint import + JSX slot inside renderer-slot wrapper, conditional on effectiveCapability === 'webgl'"
      contains: "OnboardingHint"
    - path: "src/i18n/translations.js"
      provides: "Nested t.game.hint.drag EN and ES keys (NOT flat — Alert A13)"
      contains: "hint:"
  key_links:
    - from: "OnboardingHint pill"
      to: "t.game.hint.drag i18n key (nested namespace per Alert A13)"
      via: "useLanguage() hook in GameMode → t prop passed to OnboardingHint"
      pattern: "hint\\.drag|hint: \\{"
    - from: "Plan 20-02a onFirstDrag callback (writes cam-3d-hint-seen)"
      to: "OnboardingHint readSeenFlag() at mount"
      via: "localStorage flag is the cross-render dismiss signal — first drag writes, next mount reads, pill suppresses"
      pattern: "cam-3d-hint-seen"
    - from: "Plan 20-02a GameMode forceSvgFallback state"
      to: "OnboardingHint render conditional"
      via: "effectiveCapability !== 'webgl' → no pill (context-loss path also suppresses pill correctly)"
      pattern: "effectiveCapability === ['\"]webgl['\"]|forceSvgFallback"
---

<objective>
Land the bilingual onboarding hint pill (D-20-CONTEXT-HINT, Alerts A8 + A13) on top of the renderer scaffolding shipped in Plan 20-02a: NEW `src/game/OnboardingHint.js` (~50 LOC `<button>` component with motion-safe fade-in + 5s auto-dismiss + click-to-dismiss + dismiss-on-first-drag + localStorage suppression + defensive RM gate); NEW `src/game/OnboardingHint.test.js` (≥5 Vitest + RTL tests using `vi.useFakeTimers()`); nested `t.game.hint.drag.{en,es}` i18n keys (EN: "drag to rotate" / ES: "arrastra para rotar") added to `src/i18n/translations.js`; `src/game/GameMode.js` imports + renders the pill conditionally on `effectiveCapability === 'webgl'`.

This plan was split out of the original Plan 20-02 (per checker Blocker #2) to keep each plan within the 2-3 task / ~50% context budget. Plan 20-02a delivered the renderer core (PerspectiveCamera + OrbitControls + shader + pick + context-loss + GameMode `forceSvgFallback` state + `onFirstDrag` callback writing the localStorage flag). This plan completes the user-facing hint affordance.

Purpose:
- Lands D-20-CONTEXT-HINT (locked decision: ship bilingual pill in v3.10.0, NOT defer — recruiter-conversion lever).
- Honors Alert A7 (DO NOT redefine `animate-fade-in` or `animate-hint-fade-out` keyframes; they exist at `tailwind.config.js:94` + `:100` and are consumed via `motion-safe:` prefix).
- Honors Alert A8 (`OnboardingHint` lives in `GameMode.js` slot, NOT inside `WebGLConstellation.js` — leaves room for v3.10.1 SVG-path reuse).
- Honors Alert A13 (i18n key shape NESTED `t.game.hint.drag`, NOT flat `t.game.hintDrag`).
- Defensively guards against RM users seeing the pill via `usePrefersReducedMotion()` copy-VERBATIM from `useConstellation.js:25-49` (Pattern S1 — belt-and-braces; `useRendererCapability` already routes RM to SVG).
- Reads the `cam-3d-hint-seen` flag at mount via lazy `useState(readSeenFlag)` initializer (Pattern S2 — try/catch guarded against Safari private-mode SecurityError).
- WCAG 2.5.5 + Phase 4 RESP-03 compliance: pill is `<button type="button">` with `min-h-[44px]`, native focus ring, keyboard activation (Enter/Space), aria-label dynamically built from i18n.

Output: First-visit recruiter on capable-desktop browser sees the constellation appear → 800ms later, the bilingual hint pill fades in below the canvas + above the SkillFilters bar reading "drag to rotate" (EN) or "arrastra para rotar" (ES). 5 seconds later, the pill fades out and writes `cam-3d-hint-seen = 'true'`. Or: recruiter clicks the pill → instant dismiss + flag write. Or: recruiter drags the canvas → Plan 20-02a's `onFirstDrag` callback wrote the flag → pill (already mounted) reads stale local state but ALSO unmounts on next reconciliation because the parent's `cam-3d-hint-seen` write doesn't trigger a re-render directly. (See "Dismiss-on-first-drag wiring" below for the explicit edge case.) RM users see NO pill. Second visit: NO pill. Context-loss survival: forceSvgFallback flips → effectiveCapability becomes 'svg' → pill unmounts cleanly. Tests cover all six gating paths.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md
@.planning/phases/20-3d-constellation/20-CONTEXT.md
@.planning/phases/20-3d-constellation/20-UI-SPEC.md
@.planning/phases/20-3d-constellation/20-PATTERNS.md
@.planning/phases/20-3d-constellation/20-01-SUMMARY.md
@.planning/phases/20-3d-constellation/20-02a-SUMMARY.md
@.planning/research/SUMMARY.md
@.planning/research/PITFALLS.md
@src/game/renderers/SvgConstellation.js
@src/game/useConstellation.js
@src/context/ViewModeContext.js
@src/game/GameMode.js
@src/i18n/translations.js
@src/i18n/LanguageContext.js
@tailwind.config.js

<interfaces>
<!-- LOCKED contracts the executor must implement EXACTLY. No invention. -->

## OnboardingHint component (D-20-CONTEXT-HINT, Alert A8)

NEW file `src/game/OnboardingHint.js` — ~50 LOC. Full shape per PATTERNS.md §"src/game/OnboardingHint.js":

- Default export `OnboardingHint({ t, onDismiss })` — accepts an optional `onDismiss` callback that the parent can use to react to dismiss events (defaults to no-op if absent).
- Module constants:
  ```
  const STORAGE_KEY = 'cam-3d-hint-seen'
  const AUTO_DISMISS_MS = 5000
  const FADE_IN_DELAY_MS = 800
  ```
- `usePrefersReducedMotion()` — copy-VERBATIM from `useConstellation.js:25-49` (Pattern S1; handles SSR + jsdom-without-matchMedia + Safari 13 `addListener` compat shim).
- `readSeenFlag()` / `writeSeenFlag()` — Pattern S2 try/catch-guarded localStorage helpers:
  ```
  function readSeenFlag() {
    if (typeof window === 'undefined') return false
    try { return window.localStorage.getItem(STORAGE_KEY) === 'true' }
    catch (e) { return false }
  }
  function writeSeenFlag() {
    if (typeof window === 'undefined') return
    try { window.localStorage.setItem(STORAGE_KEY, 'true') }
    catch (e) { /* blocked — Safari private mode */ }
  }
  ```
- `const [seen] = useState(readSeenFlag)` lazy initializer reads localStorage once at mount.
- `const [visible, setVisible] = useState(false)` controls render gating after fade-in delay.
- `useEffect` with deps `[prefersReducedMotion, seen]`:
  - if `prefersReducedMotion || seen` → return undefined (no timers scheduled).
  - else schedule `setTimeout(showTimer, 800)` then `setTimeout(dismissTimer, 800+5000)`.
  - cleanup clears both timers.
- Returns `null` when `prefersReducedMotion || seen || !visible`.
- Renders:
  ```
  <button
    type="button"
    onClick={handleDismiss}
    aria-label={`${t.game.hint.drag} — dismiss`}
    className="absolute left-1/2 -translate-x-1/2 bottom-[88px] z-20 text-xs font-mono text-hintPill-text bg-hintPill-bg rounded-full px-4 py-2 min-h-[44px] motion-safe:animate-fade-in"
  >
    {t.game.hint.drag}
  </button>
  ```
- `handleDismiss = () => { setVisible(false); writeSeenFlag(); if (onDismiss) onDismiss() }`.

## OnboardingHint tests (NEW file)

NEW file `src/game/OnboardingHint.test.js` — Vitest + RTL, ≥5 tests using `vi.useFakeTimers()`. Pattern per PATTERNS §"src/game/OnboardingHint.test.js":

Setup:
```
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import OnboardingHint from './OnboardingHint.js'
import translations from '../i18n/translations.js'

const t = translations.en

function makeMockMatchMedia(prefersReducedMotion = false) {
  return vi.fn().mockImplementation((q) => ({
    matches: q === '(prefers-reduced-motion: no-preference)' ? !prefersReducedMotion : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  window.matchMedia = makeMockMatchMedia(false)
  window.localStorage.clear()
  vi.useFakeTimers()
})
```

Tests (≥5; target 6):

1. **Test 1 (not visible before fade-in delay):** Mount, advance timers 700ms → `<button>` is NOT in DOM.
2. **Test 2 (visible after 800ms):** Mount, advance 800ms → `<button>` exists with text content `t.game.hint.drag` ("drag to rotate" in EN).
3. **Test 3 (suppressed when flag set):** `window.localStorage.setItem('cam-3d-hint-seen', 'true')` BEFORE render, then mount → advance 900ms → `<button>` is NOT in DOM.
4. **Test 4 (RM path no pill):** `window.matchMedia = makeMockMatchMedia(true)` BEFORE render, then mount → advance 900ms → `<button>` is NOT in DOM.
5. **Test 5 (dismiss-on-click writes flag):** Mount, advance 800ms, `fireEvent.click(getByRole('button'))` → `localStorage.getItem('cam-3d-hint-seen') === 'true'`.
6. **Test 6 (auto-dismiss after 5s writes flag):** Mount, advance 800+5000=5800ms → `localStorage.getItem('cam-3d-hint-seen') === 'true'`.

Optional but recommended:
- **Test 7 (no throw on disabled localStorage):** `vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => { throw new Error('blocked') })` → mount → no throw.

## i18n keys (Alert A13)

Add to `src/i18n/translations.js` — NESTED `hint.drag` namespace (NOT flat `hintDrag`):

EN branch (inside the existing `game: { ... }` object — append AFTER existing `hintPill` key):
```
hint: {
  drag: 'drag to rotate',
},
```

ES branch (mirror in the existing `game: { ... }` ES object):
```
hint: {
  drag: 'arrastra para rotar',
},
```

Lowercase, no trailing period, no concatenation — matches Phase 15 `hintPill` voice per UI-SPEC §Copywriting Contract.

Why nested? UI-SPEC line 135-147: "leaves room for `hint.zoom`, `hint.reset` in v3.10.1+ without polluting `t.game.*` with N flat keys."

## GameMode.js integration (Alert A8)

Plan 20-02a already wired:
- `const [forceSvgFallback, setForceSvgFallback] = useState(false)` useState.
- `const effectiveCapability = forceSvgFallback ? 'svg' : capability` derived value.
- `<WebGLConstellation onFirstDrag={...} onContextLost={...} />` props.

This plan adds:
1. `import OnboardingHint from './OnboardingHint'` after the existing line-14 imports.
2. Inside the renderer-slot wrapper (the same JSX block 20-02a edited), AFTER the `<WebGLConstellation />` / `<SvgConstellation />` conditional but INSIDE the wrapper `<div>`, slot:
   ```
   {effectiveCapability === 'webgl' && <OnboardingHint t={t} />}
   ```

Why gate on `effectiveCapability`? When `forceSvgFallback === true` (context-loss path from 20-02a), the user sees the SVG path — pill must unmount with the WebGL canvas. The SVG path has Phase 15's own `hintPill` ("Click a star · Toca una estrella"); the Phase 20 drag-to-rotate pill does NOT apply to SVG users.

## Dismiss-on-first-drag wiring (read carefully)

Plan 20-02a's `onFirstDrag` callback in GameMode writes `localStorage.setItem('cam-3d-hint-seen', 'true')` immediately. The OnboardingHint reads `readSeenFlag()` ONCE at mount via `useState(readSeenFlag)`. So if the user drags after the pill is already visible, the OnboardingHint's local `seen` state is `false` and the pill stays visible until either the click-dismiss or the 5s auto-timeout fires.

This is acceptable behavior — the localStorage write is for the NEXT page mount. The 5s auto-dismiss covers the current-session dismiss-after-drag case (recruiter dragged, ignored the pill for 5s, pill fades out cleanly).

Optional enhancement (defer to v3.10.1 if UAT signals demand): hoist `seen` state to `GameMode`, pass as prop, and bump it on `onFirstDrag` so the pill unmounts instantly on first drag. NOT required for v3.10.0. Document the rationale in the SUMMARY.

## Tailwind keyframes — verify-only (Alert A7)

`tailwind.config.js` already defines `animate-fade-in` (line 94) and `animate-hint-fade-out` (line 100). DO NOT redefine. DO NOT add new keyframes. Apply only with `motion-safe:` prefix on the className.

If you want a fade-out animation on dismiss (recommended for polish), wire the `motion-safe:animate-hint-fade-out` class via a `dismissing` state (CSS class toggle) instead of unmounting immediately. The existing keyframe sets `pointerEvents: 'none'` at end — perfect for the auto-dismiss flow.

Simpler alternative (acceptable for v3.10.0): unmount immediately on dismiss via `setVisible(false) → return null`. No fade-out animation. Visual cleanliness vs implementation simplicity — pick simplicity for the MVP and revisit in v3.10.1 if UAT flags it.

## Forbidden anti-patterns (re-read before commit)

- Defining `t.game.hintDrag` as a flat key — FORBIDDEN (Alert A13, must be nested `t.game.hint.drag`).
- Concatenating EN + ES in a single pill (`"drag to rotate · arrastra para rotar"`) — FORBIDDEN. Phase 15 `hintPill` is concatenated because it shows indefinitely under RM+`!hasInteracted`; Phase 20 pill auto-dismisses + reads `cam-lang` already. Single-language is correct per UI-SPEC §Copywriting line 131-134.
- Adding a new `tailwind.config.js` keyframe — FORBIDDEN (Alert A7).
- Rendering the pill inside `WebGLConstellation.js` — FORBIDDEN (Alert A8 — must live in `GameMode.js` slot).
- Rendering the pill when `prefers-reduced-motion: reduce` — FORBIDDEN (defensive RM gate inside component returns null).
- Rendering the pill on SVG path (mobile or RM-fallback) — FORBIDDEN. Phase 20 pill is for the WebGL-capable desktop path only. SVG path has Phase 15 `hintPill`.
- Lifting `seen` state to `useConstellation` — FORBIDDEN. Local component state suffices (Plan 20-02a's localStorage write covers cross-session); lifting would add a re-render cost to all consumers of `useConstellation` for a frame-zero one-shot signal.
- Modifying the `<WebGLConstellation />` JSX from 20-02a (e.g., adding new props) — out of scope. This plan only ADDS the `<OnboardingHint />` sibling slot.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: OnboardingHint component + tests + i18n keys + GameMode pill slot</name>
  <files>src/game/OnboardingHint.js, src/game/OnboardingHint.test.js, src/i18n/translations.js, src/game/GameMode.js</files>
  <read_first>
    - src/game/renderers/SvgConstellation.js (lines 385-389 — Phase 15 hint-pill JSX precedent for visual continuity)
    - src/game/useConstellation.js (lines 21-49 — usePrefersReducedMotion adapted for jsdom; copy VERBATIM into OnboardingHint)
    - src/context/ViewModeContext.js (lines 7-19, 27-45 — localStorage try/catch + useCallback pattern; Pattern S2 reference)
    - src/i18n/translations.js (current — EN `game: {...}` at line ~24 and ES `game: {...}` at line ~248; `hintPill` precedent at line ~32 EN / ~248 ES — DO NOT remove or alter)
    - src/i18n/LanguageContext.js (useLanguage hook contract — `const { t } = useLanguage()`)
    - src/game/GameMode.js (post-Plan-20-02a — `forceSvgFallback` useState + `effectiveCapability` derivation should already exist; this task ADDS the OnboardingHint slot)
    - .planning/phases/20-3d-constellation/20-PATTERNS.md §"src/game/OnboardingHint.js" + §"src/game/OnboardingHint.test.js" + §Pattern S1 + §Pattern S2 + §Pattern S3
    - .planning/phases/20-3d-constellation/20-UI-SPEC.md §"Onboarding Hint Pill (D-20-CONTEXT-HINT)" (full — Placement / Appearance / Bilingual copy / Motion / RM path / Suppression decision flow / Accessibility)
    - tailwind.config.js (verify animate-fade-in at line 94, animate-hint-fade-out at line 100 — DO NOT redefine; Alert A7)
  </read_first>
  <behavior>
    - Test 1: Component returns null before FADE_IN_DELAY_MS (800ms) elapses (no <button> in DOM at 700ms).
    - Test 2: Component renders a `<button role="button">` with text content equal to `t.game.hint.drag` after `vi.advanceTimersByTime(800)`.
    - Test 3: Component returns null when `localStorage.getItem('cam-3d-hint-seen') === 'true'` at mount.
    - Test 4: Component returns null when `prefers-reduced-motion: reduce` matchMedia returns matches=true.
    - Test 5: Clicking the rendered button calls `window.localStorage.setItem('cam-3d-hint-seen', 'true')` and unmounts the pill.
    - Test 6: After 800ms + 5000ms (total 5800ms via fake timers), auto-dismiss fires and `cam-3d-hint-seen` is written.
  </behavior>
  <action>
    Order: (1) i18n keys → (2) RED test file → (3) GREEN component → (4) GameMode slot.

    **Step 1: i18n keys.** Edit `src/i18n/translations.js`. Locate the EN `game: { ... }` object (~line 24). Append nested key (NESTED, not flat — Alert A13):

    ```
    hint: {
      drag: 'drag to rotate',
    },
    ```

    Place it AFTER the existing `hintPill` key (preserves alphabetical/grouped ordering with other hint-family keys). Mirror in the ES `game: { ... }` object (~line 248):

    ```
    hint: {
      drag: 'arrastra para rotar',
    },
    ```

    Both lowercase, no trailing period, no concatenation. Run `npm test` (full suite) to confirm no existing test breaks on the new nested key — existing `t.game.hintPill` lookup is unaffected.

    Acceptance gate before proceeding: `rg "hintDrag" src/i18n/translations.js` returns 0 (must be nested); `rg "drag to rotate" src/i18n/translations.js` returns 1; `rg "arrastra para rotar" src/i18n/translations.js` returns 1.

    **Step 2: RED tests.** Create `src/game/OnboardingHint.test.js` per PATTERNS §"OnboardingHint.test.js" — import the component (not yet created), use `vi.useFakeTimers()` in `beforeEach`, `window.matchMedia` mock that defaults to `prefers-reduced-motion: no-preference` matches=true (i.e., NOT reduced-motion). Implement all 6 cases per the behavior block. Run `npm test -- OnboardingHint` and confirm all 6 FAIL (module not found).

    **Step 3: GREEN component.** Create `src/game/OnboardingHint.js` per PATTERNS §"OnboardingHint.js" — full shape ~50 LOC per the `<interfaces>` OnboardingHint component section:
    - Default-export `OnboardingHint({ t, onDismiss })`.
    - Module constants `STORAGE_KEY = 'cam-3d-hint-seen'`, `AUTO_DISMISS_MS = 5000`, `FADE_IN_DELAY_MS = 800`.
    - `usePrefersReducedMotion()` — copy VERBATIM from `useConstellation.js` lines 25-49.
    - `readSeenFlag()` + `writeSeenFlag()` — try/catch guarded per Pattern S2.
    - `useState(readSeenFlag)` lazy initializer.
    - `useState(false)` for visible.
    - `useEffect`: if `prefersReducedMotion || seen` → return `undefined`. Else schedule two `setTimeout`s (showTimer at 800ms sets visible=true, dismissTimer at 5800ms sets visible=false + writes flag); cleanup clears both.
    - Returns `null` when `prefersReducedMotion || seen || !visible`.
    - Renders `<button type="button" onClick={handleDismiss} aria-label={`${t.game.hint.drag} — dismiss`}>` with the full className per `<interfaces>`.
    - `handleDismiss` sets visible=false + writeSeenFlag() + invokes optional `onDismiss` callback.

    Run `npm test -- OnboardingHint` and confirm all 6 cases pass. Run `npm test` (full suite) and confirm net positive over Plan 20-02a baseline (≥277 GREEN if Plan 20-01 net was +10 and this adds +6).

    **Step 4: GameMode pill slot (Alert A8).**

    Edit `src/game/GameMode.js`:
    - Add `import OnboardingHint from './OnboardingHint'` after the existing line-14 imports.
    - Inside the renderer-slot wrapper `<div>` (the same block Plan 20-02a edited), AFTER the `<WebGLConstellation />` / `<SvgConstellation />` conditional but BEFORE the closing `</div>` of the wrapper, slot:
      ```
      {effectiveCapability === 'webgl' && <OnboardingHint t={t} />}
      ```

    `effectiveCapability` was added by Plan 20-02a (`forceSvgFallback ? 'svg' : capability`). When forceSvgFallback flips true (context-loss), the OnboardingHint unmounts cleanly because the conditional flips to false. The SVG path's Phase 15 `hintPill` continues unchanged.

    Run `npm test`. The GameMode test (if it mounts the component) must still pass — OnboardingHint requires `window.matchMedia` and `window.localStorage`, which jsdom provides; if the GameMode test mocks `useRendererCapability` to return `'svg'`, OnboardingHint won't render (conditional gates it out). Verify no regression.

    Run `npm run build && node scripts/check-bundle-gate.mjs`. Mobile chunk MUST stay ≤38.82 kB gz (OnboardingHint is in the eager bundle alongside GameMode but adds <500 bytes — well under the HARD ceiling). WebGL chunk unchanged from Plan 20-02a.

    **Step 5: tailwind.config.js verify-only.** `git diff tailwind.config.js` MUST be empty after this plan (Alert A7). If the diff shows any edit, REVERT — the keyframes must be consumed via `motion-safe:` prefix on existing classes, NOT redefined.
  </action>
  <verify>
    <automated>npm test -- OnboardingHint</automated>
  </verify>
  <acceptance_criteria>
    - `src/game/OnboardingHint.js` exists with default export `OnboardingHint`.
    - `rg "cam-3d-hint-seen" src/game/OnboardingHint.js` returns ≥1 hit (STORAGE_KEY constant).
    - `rg "motion-safe:animate-fade-in" src/game/OnboardingHint.js` returns ≥1 hit (Pattern S3).
    - `rg "min-h-\\[44px\\]" src/game/OnboardingHint.js` returns ≥1 hit (WCAG 2.5.5 touch target).
    - `rg "type=\\\"button\\\"" src/game/OnboardingHint.js` returns ≥1 hit (semantic `<button>`, NOT `<div>`).
    - `rg "aria-label" src/game/OnboardingHint.js` returns ≥1 hit.
    - `src/game/OnboardingHint.test.js` exists with ≥5 test cases.
    - `rg "hint:" src/i18n/translations.js` returns ≥2 hits (one for EN, one for ES branch).
    - `rg "hintDrag" src/i18n/translations.js` returns 0 hits (must be nested, not flat — Alert A13).
    - `rg "drag to rotate" src/i18n/translations.js` returns ≥1 hit (EN copy verbatim per UI-SPEC).
    - `rg "arrastra para rotar" src/i18n/translations.js` returns ≥1 hit (ES copy verbatim).
    - `rg "OnboardingHint" src/game/GameMode.js` returns ≥2 hits (import + JSX use).
    - `rg "effectiveCapability === ['\\\"]webgl['\\\"]" src/game/GameMode.js` returns ≥1 hit (pill render conditional).
    - `git diff tailwind.config.js` is empty (Alert A7 — keyframes consumed, NOT redefined).
    - `npm test -- OnboardingHint` exits 0 with all 6 cases passing.
    - `npm test` exits 0; total GREEN at Plan 20-02a baseline + 6 = ≥277 GREEN (assuming Plan 20-01 net was +10).
    - `npm run build && node scripts/check-bundle-gate.mjs` exits 0. Mobile chunk ≤38.82 kB gz.
    - `git log --oneline -1` shows `feat(20-02b): OnboardingHint bilingual pill + tests + nested t.game.hint.drag + GameMode slot (D-20-CONTEXT-HINT, Alerts A7+A8+A13)`.
  </acceptance_criteria>
  <done>
    OnboardingHint component + tests + i18n keys + GameMode slot all committed in a single atomic commit. Pill renders correctly under fake-timer simulation; localStorage suppression works; RM gate works; bilingual copy verified in both EN and ES branches; pill unmounts cleanly when `forceSvgFallback` flips (context-loss survives without zombie pill). tailwind.config.js untouched per Alert A7.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Manual UAT — bilingual pill renders, dismisses correctly, suppressed on second visit, RM path no pill</name>
  <what-built>
    Plan 20-02b Task 1 just landed:
    - `src/game/OnboardingHint.js` — `<button>` pill with 800ms fade-in delay, 5s auto-dismiss, click-to-dismiss, localStorage `cam-3d-hint-seen` flag, defensive RM gate.
    - `src/game/OnboardingHint.test.js` — 6 Vitest + RTL tests using `vi.useFakeTimers()`.
    - `src/i18n/translations.js` — nested `t.game.hint.drag` keys: EN "drag to rotate", ES "arrastra para rotar".
    - `src/game/GameMode.js` — import + JSX slot `{effectiveCapability === 'webgl' && <OnboardingHint t={t} />}` inside the renderer-slot wrapper.

    Plan 20-02a's `forceSvgFallback` state + `onFirstDrag` callback (writes `cam-3d-hint-seen`) are already in place. This checkpoint validates the user-facing behavior of the pill against a real browser.
  </what-built>
  <how-to-verify>
    Run the dev server (or production preview) and execute the visual + interaction checklist below on a real capable-desktop browser. jsdom unit tests already validated the gating logic; this checkpoint validates Tailwind class rendering, motion-safe animation, real localStorage persistence across reloads, and DevTools RM emulation.

    **Setup:**
    1. `npm run build && npx serve dist` (or `npm run dev`).
    2. Open Chrome stable on macOS at viewport ≥ 1024px.
    3. DevTools → Application → Local Storage → clear ALL `cam-*` keys (start fresh).

    **Visual checks (record PASS/FAIL per item):**

    1. **First visit — pill fades in 800ms after canvas** — Load page. Canvas appears with auto-rotating 3D constellation (from 20-02a). ~800ms after canvas mount, hint pill fades in below the canvas, centered horizontally, ~88px from bottom (above the SkillFilters bar). Reads "drag to rotate" in EN default (or "arrastra para rotar" if `cam-lang=es`).

    2. **Pill appearance** — Pill is a rounded-full button with:
       - `text-xs font-mono` typography (matches Phase 15 SVG hint pill voice).
       - `bg-hintPill-bg` background (existing token; theme-aware dark/light).
       - `text-hintPill-text` color (AA contrast verified per UI-SPEC).
       - No icon, no border, no drop shadow (ambient affordance).
       - Visible 44x44 click target (`min-h-[44px]`).

    3. **Pill is accessible** — Tab from canvas wrapper → pill receives focus → visible focus ring (default browser or `focus-visible:ring-*`). Press Enter or Space → pill dismisses + writes flag. Screen reader announces "drag to rotate, dismiss button" (or ES equivalent).

    4. **Click-to-dismiss** — Reload (clear localStorage first). After fade-in, click the pill → pill disappears immediately + DevTools shows `cam-3d-hint-seen = "true"`.

    5. **Auto-dismiss after 5s** — Reload (clear localStorage). After fade-in completes (~800ms), wait 5 seconds without interacting with anything → pill fades/disappears + DevTools shows `cam-3d-hint-seen = "true"`.

    6. **Suppressed on second visit** — Reload (DO NOT clear localStorage from step 5). After canvas mounts, wait 1-2 seconds → NO pill appears. DevTools confirms `cam-3d-hint-seen = "true"` still set.

    7. **Dismiss-on-first-drag (cross-session)** — Reload + clear localStorage. After fade-in, drag the canvas (rotate it). DevTools shows `cam-3d-hint-seen = "true"` (Plan 20-02a's `onFirstDrag` wrote it). NOTE: the pill remains visible until the 5s auto-dismiss fires OR you click it — this is acceptable v3.10.0 behavior (in-session pill stays until 5s timeout). Reload → pill is now suppressed.

    8. **Bilingual EN/ES** — Reload + clear localStorage. Toggle language to ES (LangPill in nav). Reload. Pill reads "arrastra para rotar" (not concatenated, not EN). Toggle back to EN. Reload. Pill reads "drag to rotate".

    9. **RM path — NO pill** — DevTools → Rendering → Emulate CSS media feature → prefers-reduced-motion: reduce → reload. SVG path renders (Plan 20-02a verified WebGL doesn't mount under RM). NO OnboardingHint pill visible. Phase 15 `hintPill` ("Click a star · Toca una estrella") under SVG continues to render per existing contract. Disable RM emulation, reload → WebGL + pill returns.

    10. **Context-loss path — pill unmounts cleanly** — Reload + clear localStorage. Wait for pill fade-in. Trigger context loss: DevTools console run `document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`. Plan 20-02a's `onContextLost` callback flips `forceSvgFallback` → effectiveCapability becomes `svg` → OnboardingHint's render conditional fails → pill unmounts without warning/error. SVG path now renders in the canvas slot. No zombie pill over SVG.

    Document any deviations. Screenshots optional but helpful for items 2, 8, 9.
  </how-to-verify>
  <resume-signal>Type "approved" if 10/10 visual checks pass. Otherwise list FAIL items with browser version + screenshot path so the next iteration can address them.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Project i18n dict → DOM via OnboardingHint | Static `t.game.hint.drag` flows into `<button>` text and aria-label; values are project-controlled (no user input) |
| localStorage `cam-3d-hint-seen` flag → render gating | Cross-session state; try/catch guarded against blocked storage (Safari private mode) |
| Browser matchMedia → render gating | `prefers-reduced-motion: reduce` is browser-controlled; defensive gate returns null inside component |
| GameMode forceSvgFallback state (from 20-02a) → pill render conditional | Local React state controls pill mount lifecycle; context-loss propagation tested |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-20-02b-Info | Information Disclosure | OnboardingHint copy + aria-label | N/A | `t.game.hint.drag` is project-controlled bilingual literal ("drag to rotate" / "arrastra para rotar"). No user input flows into copy. aria-label concatenation is static template literal. |
| T-20-02b-XSS | XSS via i18n dict | translations.js dict | N/A | Static string literals; not user-supplied; React escapes text content by default. No `dangerouslySetInnerHTML` use. |
| T-20-02b-Spoofing | Spoofing | localStorage `cam-3d-hint-seen` | accept | Recruiter clearing localStorage just re-shows the pill once — no security impact. Pattern S2 try/catch guards against private-mode SecurityError. |
| T-20-02b-A11y | A11y regression | OnboardingHint under prefers-reduced-motion | mitigate | Defensive `usePrefersReducedMotion()` copy-VERBATIM from `useConstellation.js`; returns null under RM. Belt-and-braces — `useRendererCapability` already routes RM users to SVG before WebGL mounts (so the pill's `effectiveCapability === 'webgl'` gate also blocks pill render under RM). Two-layer defense. |
| T-20-02b-A11y-2 | A11y regression | Touch target size | mitigate | `<button>` has `min-h-[44px]` (WCAG 2.5.5 + Phase 4 RESP-03 carry-over). Pill content can stay compact (`px-4 py-2`); the click handler region meets 44x44px via min-height. |
| T-20-02b-Repud | Repudiation | dismiss action attribution | accept | Three dismiss paths (auto-timeout / click / first-drag via 20-02a callback) all write the same flag. No need to distinguish which path triggered dismiss — flag is binary "seen". |
| T-20-02b-DoS | Denial of Service | setTimeout leak on unmount | mitigate | `useEffect` cleanup clears both `showTimer` and `dismissTimer`. Tested by Test 1 (advance 700ms then unmount; no fired callbacks). |

**No package install tasks in this plan** — uses already-installed React + Vitest + RTL. No `[ASSUMED]`/`[SUS]` package gates.
</threat_model>

<verification>
1. `npm test` exits 0; total GREEN net +6 over Plan 20-02a baseline.
2. `npm run build` succeeds.
3. `node scripts/check-bundle-gate.mjs` exits 0; mobile chunk ≤38.82 kB gz (OnboardingHint adds <500 bytes to the eager bundle); WebGL chunk unchanged from Plan 20-02a.
4. Grep matrix from acceptance criteria — every regex must produce the expected hit counts.
5. `git diff tailwind.config.js` empty (Alert A7).
6. Manual UAT checkpoint (Task 2) confirms 10/10 visual + interaction items.
7. `git log --oneline -1` shows the Task 1 commit.
</verification>

<success_criteria>
- [ ] `src/game/OnboardingHint.js` exists with default export `OnboardingHint`; lazy `useState(readSeenFlag)` initializer; `usePrefersReducedMotion()` copy from `useConstellation.js`; try/catch-guarded localStorage helpers (Pattern S2); semantic `<button>` with `min-h-[44px]` and `motion-safe:animate-fade-in`; nested i18n key consumed via `t.game.hint.drag`.
- [ ] `src/game/OnboardingHint.test.js` exists with ≥5 (target 6) Vitest + RTL tests using `vi.useFakeTimers()`: not visible before 800ms, visible after 800ms, suppressed when flag set, RM path no pill, click dismiss writes flag, auto-dismiss after 5s writes flag.
- [ ] `src/i18n/translations.js` has nested `game.hint.drag` in both EN ("drag to rotate") and ES ("arrastra para rotar") branches; no flat `hintDrag` key (Alert A13).
- [ ] `src/game/GameMode.js` imports `OnboardingHint` and renders `{effectiveCapability === 'webgl' && <OnboardingHint t={t} />}` inside the renderer-slot wrapper.
- [ ] `tailwind.config.js` diff is empty (Alert A7).
- [ ] `npm test -- OnboardingHint` exits 0 with all 6 cases passing.
- [ ] `npm test` exits 0; ≥277 GREEN.
- [ ] `npm run build && node scripts/check-bundle-gate.mjs` exits 0; mobile chunk unchanged.
- [ ] Manual UAT checkpoint (Task 2) confirms 10/10 visual + interaction items pass on a real browser.
- [ ] One atomic commit lands: `feat(20-02b): OnboardingHint bilingual pill + tests + nested t.game.hint.drag + GameMode slot (D-20-CONTEXT-HINT, Alerts A7+A8+A13)`.
</success_criteria>

<output>
Create `.planning/phases/20-3d-constellation/20-02b-SUMMARY.md` when done. SUMMARY must report:
- Final test count (target ≥277 GREEN; was 271 at Plan 20-01 end + 6 OnboardingHint tests).
- Bundle-gate exit status (must be 0) + mobile chunk size (target ≤8.91 kB gz unchanged + ≤500 bytes for OnboardingHint inclusion in eager bundle).
- Confirmation that D-20-CONTEXT-HINT is now backed by code + tests + manual UAT.
- Confirmation that nested `t.game.hint.drag` namespace shape lands (NOT flat — Alert A13).
- Confirmation that `tailwind.config.js` was NOT modified (Alert A7).
- Manual UAT result (Task 2) — list 10/10 PASS or document specific FAIL items.
- Open items handed to Plan 20-03: useClickVsDrag hook + renderer integration + 3-tier bundle-gate ladder + UAT execution + Lighthouse mobile re-verify.
- Note: instant dismiss-on-first-drag in-session is acceptable v3.10.0 behavior (5s auto-timeout covers; lifting `seen` state to GameMode is a deferred v3.10.1 enhancement if UAT signals demand).
</output>
</content>
</invoke>