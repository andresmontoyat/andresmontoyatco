---
phase: 22-nav-island-shell-navigability
plan: 02
subsystem: test-infra
tags: [vitest, react-testing-library, jsdom, react-island, scroll-spy]

# Dependency graph
requires: ["22-01"]
provides:
  - "src/test/setup.jsx — no-op IntersectionObserver stub, guarded assignment on globalThis"
  - "src/components/react/Nav.test.jsx — RTL coverage for the Nav island's props contract"
affects: ["Phase 23+ (any future scroll-spy island reuses the IO stub; Nav.test.jsx is the reference pattern for testing client:load islands with mocked hooks)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "jsdom IntersectionObserver stub — guarded `typeof globalThis.IntersectionObserver === 'undefined'` no-op class, mirrors the existing HTMLCanvasElement stub style in setup.jsx"
    - "Testing client:load islands directly with props (no Context wrapper) — renderNav(locale) calls render(<Nav locale hrefEn hrefEs />) with zero provider wrapping, since the island's data flow is props-only (established in 22-01)"
    - "vi.mock a hook for deterministic assertions instead of driving real browser APIs — useActiveSection mocked to a fixed return value rather than attempting to simulate real IntersectionObserver intersection entries under jsdom"

key-files:
  created: [src/components/react/Nav.test.jsx]
  modified: [src/test/setup.jsx]

key-decisions:
  - "IntersectionObserver stub scoped to jsdom setup file only, guarded behind a typeof check — never bundled into production output, no runtime attack surface (T-22-04, accepted)"
  - "Active-section highlight tested via a mocked useActiveSection hook, not a real IntersectionObserver — resolves 22-PATTERNS.md's open question about scroll-spy testability in favor of stub + hook mock"
  - "getAllByText/getAllByRole used throughout (not getByText/getByRole) since Nav renders each interactive element twice — once in DesktopNav/header, once inside the always-mounted MobileMenu portal"

requirements-completed: [TEST-02]

# Metrics
duration: ~10min
completed: 2026-07-19
---

# Phase 22 Plan 2: Nav island test coverage Summary

**Added a guarded jsdom IntersectionObserver stub to the shared test setup and a 6-spec React Testing Library suite for the Nav island, covering bilingual content, LangPill hrefs/aria-pressed, active-section highlight, theme toggle, and cam-lang cookie persistence — full suite 110/110 GREEN.**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2
- **Files created:** 1 (Nav.test.jsx)
- **Files modified:** 1 (setup.jsx)

## Accomplishments

- `src/test/setup.jsx` — appended a no-op `IntersectionObserverStub` class (constructor stores `callback`/`options`; no-op `observe`/`unobserve`/`disconnect`; `takeRecords()` returns `[]`), assigned to `globalThis.IntersectionObserver` guarded by `typeof globalThis.IntersectionObserver === 'undefined'`. Mirrors the existing `HTMLCanvasElement.getContext` guarded-stub style already in the file. Existing canvas/localStorage stubs untouched.
- `src/components/react/Nav.test.jsx` — new suite, 6 tests, all passing:
  1. EN render — `About`/`Experience`/`Projects`/`Contact` present (via `getAllByText`, since each label renders in both DesktopNav and the always-mounted MobileMenu portal).
  2. ES render — `Sobre mí`/`Experiencia`/`Proyectos`/`Contacto` present.
  3. LangPill anchors — EN/ES anchors resolve inside the `role="group"` `aria-label="Language"` container; ES anchor `href` matches `/^\/es\//`; `aria-pressed` is `"true"` on the EN anchor (active locale) and `"false"` on ES.
  4. Active-section highlight — with `useActiveSection` mocked to return `'about'`, the first `About` link's `className` matches `/border-brand/`.
  5. Theme toggle — clicking the button with accessible name `Switch to light mode` flips `document.documentElement.dataset.theme` from `'dark'` to `'light'`.
  6. LangPill cookie write — clicking the ES anchor (accessible name `Switch to Spanish`) causes `document.cookie` to contain `cam-lang=es`; the jsdom "Not implemented: navigation" stderr noise from the anchor's real `href` is expected and non-blocking (anticipated by the plan — the `onClick` cookie write is what's asserted, not real navigation).
- `useActiveSection` mocked via `vi.mock('../../hooks/useActiveSection', () => ({ default: () => 'about' }))` — deterministic, no real IntersectionObserver driving needed for the highlight assertion.
- `renderNav(locale = 'en')` helper renders `<Nav locale hrefEn="/en/" hrefEs="/es/" />` directly — zero `LanguageProvider` wrapper, confirming the island's props-only contract from 22-01.
- Full suite verified GREEN twice: isolated (`npx vitest run src/components/react/Nav.test.jsx` — 6/6) and whole-repo (`npm run test:run` — 110/110, up from the 104/104 baseline).

## Task Commits

Each task was committed atomically:

1. **Task 1: Add a jsdom IntersectionObserver stub to test setup** — `66c7e9a` (feat)
2. **Task 2: Write the Nav island RTL suite** — `634c3f8` (test)

## Files Created/Modified

- `src/test/setup.jsx` - modified: appended guarded no-op `IntersectionObserver` stub
- `src/components/react/Nav.test.jsx` - new: 6-spec RTL suite for the Nav island

## Decisions Made

- Used `getAllByText`/`getAllByRole` instead of singular `getByText`/`getByRole` throughout, since `MobileMenu` is always mounted in the DOM (visibility toggled via CSS opacity, not conditional render) — every interactive nav element exists twice in the tree.
- Cleared the `cam-lang` cookie in `beforeEach` via `max-age=0` (best-effort; jsdom's `document.cookie` setter supports this) to keep the cookie-write assertion in test 6 independent of test-execution order.
- Did not attempt to assert on the ES anchor's exact `href` value beyond a `/^\/es\//` prefix match, since the LangPill's `useEffect` appends `window.location.hash` client-side and jsdom's default hash is empty — asserting the prefix is the stable, behavior-relevant contract per the plan's interface spec.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written for all functional/behavioral requirements.

### Verification Note (non-blocking)

**1. jsdom "Not implemented: navigation" stderr noise on LangPill anchor clicks**
- **Found during:** Task 2 verification (`npx vitest run src/components/react/Nav.test.jsx`)
- **Issue:** `fireEvent.click` on the ES `<a href="/es/...">` anchor triggers jsdom's real anchor-navigation code path, which logs `Error: Not implemented: navigation (except hash changes)` to stderr. This is jsdom's standard behavior for any anchor click where `href` is not a same-page hash change — not a test failure.
- **Resolution:** No code change. The plan's own Task 2 `<action>` text anticipated this exact scenario ("if the anchor navigation is a jsdom no-op that is fine — the onClick cookie write is what is asserted"). All 6 tests pass; the stderr line is cosmetic jsdom console noise, not a test assertion failure.
- **Files affected:** none

## Issues Encountered

None beyond the anticipated jsdom navigation-noise note above.

## Known Stubs

None — all 6 tests assert against real rendered Nav island output (no mocked/empty data paths beyond the intentional `useActiveSection` hook mock, which is the plan-specified testing strategy, not a stub of production behavior).

## Threat Flags

None beyond the plan's own `<threat_model>` (T-22-04), implemented exactly as specified: the IntersectionObserver stub is a test-only global, guarded behind a `typeof` check, confined to the vitest/jsdom setup file, and never bundled into production output.

## Next Phase Readiness

- TEST-02 fully satisfied — the Nav island (Phase 22's only interactive island so far) has behavior-equivalent RTL coverage matching the pre-migration test depth.
- The IntersectionObserver stub in `src/test/setup.jsx` is now available for any future scroll-spy or observer-based island (Phase 25 SectionPager, Phase 26 Experience) without further setup work.
- `Nav.test.jsx`'s pattern — props-only render, `vi.mock` for hook determinism, `getAllByText`/`getAllByRole` for dual-rendered (desktop + mobile) elements — is the reference test shape for future `client:load` island suites.
- Phase 22 is now fully closed: both 22-01 (island build) and 22-02 (island tests) complete, 110/110 tests GREEN, zero regressions.

---
*Phase: 22-nav-island-shell-navigability*
*Completed: 2026-07-19*

## Self-Check: PASSED
