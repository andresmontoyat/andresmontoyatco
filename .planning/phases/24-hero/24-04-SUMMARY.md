---
phase: 24-hero
plan: 04
subsystem: ui
tags: [astro, react-migration, zero-js, lcp, static-build]

# Dependency graph
requires:
  - phase: 24-hero (24-02)
    provides: "src/components/astro/Hero.astro — zero-island static Hero section (photo LCP, CSS typewriter, native <details> CV dropdown, count-up stats)"
  - phase: 24-hero (24-03)
    provides: "About.astro count-up retrofit proving the shared count-up.js module works identically across independent .astro components"
provides:
  - "Hero.astro mounted as the first <main> child on both /en and /es (STATIC-02, Hero half, complete)"
  - "src/components/Hero.jsx + src/components/Hero.test.jsx deleted — no orphaned CSR entry point survives"
  - "Production build verified: dist/en+es ship the hero photo as static LCP img, zero astro-island for Hero, count-up.js/details-dismiss.js as deferred type=\"module\" scripts well after </head>"
affects: ["24-05 (manual cross-browser QA gate — Escape/outside-click dismiss, steps() glyph alignment)", "27 (Lighthouse gate + cleanup — remaining CRA/Vite-CSR leftovers in src/App.jsx/src/index.jsx/index.html)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Acceptance-criteria greps that check for 'no dangling import of X' must also account for prose comments containing the literal deleted-file path — reword comments to paraphrase rather than quote the literal path (same self-tripping-grep technique 24-01/24-02 used)"

key-files:
  created: []
  modified:
    - src/pages/en/index.astro
    - src/pages/es/index.astro
    - src/components/astro/Hero.astro
    - src/App.jsx
    - src/App.test.jsx
  deleted:
    - src/components/Hero.jsx
    - src/components/Hero.test.jsx

key-decisions:
  - "Removed the dangling `import Hero from './components/Hero'` + `<Hero />` usage from the legacy src/App.jsx (pre-Astro CRA/Vite-CSR entry point, whole-app removal deferred to Phase 27) — deleting Hero.jsx broke this unrelated-but-still-present import, which is not in this plan's files_modified list but is a direct, unavoidable consequence of the deletion the plan mandates"
  - "Updated App.test.jsx's stale 'renders Nav, Hero, and Footer' test description to 'renders Nav, About, and Footer' for accuracy after the import removal — no assertion logic changed"
  - "Reworded Hero.astro's header comment to drop the literal 'components/Hero.jsx' substring so it doesn't false-positive-trip the plan's own no-dangling-import grep against a documentation comment"

patterns-established: []

requirements-completed: [STATIC-02]

# Metrics
duration: 12min
completed: 2026-07-20
---

# Phase 24 Plan 04: Mount Hero + Delete Deprecated React Hero Summary

**Hero.astro is now live as the first section on both `/en` and `/es`; the deprecated React `Hero.jsx` is deleted, and a production build confirms the hero photo ships as a zero-island, server-rendered LCP element with both enhancer scripts loading as small deferred `type="module"` chunks.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-20T00:18:xx (approx, first task edit)
- **Completed:** 2026-07-20T00:30:57Z
- **Tasks:** 2
- **Files modified:** 7 (2 deleted, 5 modified)

## Accomplishments
- `src/pages/en/index.astro` and `src/pages/es/index.astro` import and mount `<Hero locale={locale} />` as the first child of `<main>`, immediately before `<About locale={locale} />` — both files kept byte-for-byte parallel except the locale fallback
- `src/components/Hero.jsx` and `src/components/Hero.test.jsx` deleted — fully superseded by `src/components/astro/Hero.astro` + `Hero.test.ts` (24-02)
- Legacy `src/App.jsx` (CRA/Vite-CSR entry, full removal deferred to Phase 27 per ROADMAP "CRA/Vite-CSR leftovers removed") still imported the now-deleted `./components/Hero` — import and `<Hero />` usage removed so the app doesn't reference a missing module; `src/App.test.jsx`'s stale description updated to match
- `npm run build` succeeds; `npx vitest run` 130/130 GREEN (140 baseline − 10 removed with the old RTL `Hero.test.jsx` suite)
- Production build verified: `dist/en/index.html` and `dist/es/index.html` each contain 2 occurrences of `me-800.webp` (img src + srcset), zero `astro-island` elements scoped to Hero (Nav's legitimate island unaffected, still present), and `count-up`/`details-dismiss` references present — both Hero scripts render as `<script type="module" src="...">` at byte offsets ~21K/~27K, well past `</head>` (byte 4268), confirming deferred, non-render-blocking, non-`is:inline` loading

## Task Commits

Each task was committed atomically:

1. **Task 1: Mount Hero.astro on /en and /es** — `97dd6dc` (feat)
2. **Task 2: Delete deprecated React Hero + build zero-JS/LCP verify** — `73bdcec` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/pages/en/index.astro` - Added `Hero` import + `<Hero locale={locale} />` as first `<main>` child
- `src/pages/es/index.astro` - Same edit, kept parallel with `/en`
- `src/components/astro/Hero.astro` - Header comment reworded to drop the literal deleted-file path substring
- `src/App.jsx` - Removed dangling `Hero` import + `<Hero />` usage (legacy CRA/Vite-CSR entry, unrelated app slated for full removal in Phase 27)
- `src/App.test.jsx` - Updated stale test description ("Hero" → "About") for accuracy
- `src/components/Hero.jsx` - Deleted (fully replaced by `Hero.astro`)
- `src/components/Hero.test.jsx` - Deleted (fully replaced by `Hero.test.ts`)

## Decisions Made
- Fixing `src/App.jsx`'s dangling import was a Rule 3 (auto-fix blocking issue) action: the plan's own acceptance criteria require zero dangling `components/Hero` references and a fully GREEN `npx vitest run`, and `App.test.jsx` exercises `App.jsx` directly — leaving the import in place would have broken the test suite as a direct, unavoidable side effect of the deletion this plan mandates. The fix was scoped narrowly (import + one JSX line removed, one stale test description corrected) rather than pulling the entire legacy CRA/Vite-CSR app (App.jsx/index.jsx/index.html) out — that fuller removal remains explicitly owned by Phase 27 per ROADMAP.md ("CRA/Vite-CSR leftovers removed").
- Reworded Hero.astro's header comment (previously quoted the literal path `src/components/Hero.jsx`) to avoid tripping the plan's own no-dangling-import grep, which does not distinguish between a real import and a documentation comment mentioning the deleted file's former path. Same technique 24-01/24-02 already established for other self-tripping literal substrings.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed dangling Hero import from legacy src/App.jsx**
- **Found during:** Task 2 (Delete deprecated React Hero + build zero-JS/LCP verify)
- **Issue:** The plan's `<read_first>`/`<action>` assumed `src/components/Hero.jsx` was orphaned once the pages were mounted, but `src/App.jsx` (the pre-Astro CRA/Vite-CSR entry point, still present and exercised by `src/App.test.jsx`) also imported and rendered it. Deleting `Hero.jsx` without fixing this reference would break `npx vitest run`, which the plan's own acceptance criteria require to be fully GREEN.
- **Fix:** Removed `import Hero from './components/Hero'` and the `<Hero />` element from `src/App.jsx`; updated `src/App.test.jsx`'s "renders Nav, Hero, and Footer" description to "renders Nav, About, and Footer" (assertions unchanged, description only).
- **Files modified:** `src/App.jsx`, `src/App.test.jsx`
- **Verification:** `npm run build` succeeds; `npx vitest run` 130/130 GREEN, no failures.
- **Committed in:** `73bdcec` (Task 2 commit)

**2. [Rule 3 - Blocking] Reworded Hero.astro comment to avoid self-tripping acceptance grep**
- **Found during:** Task 2, running the acceptance-criteria regex `rg "components/Hero(\.jsx|')" src/`
- **Issue:** `Hero.astro`'s own header comment (added in 24-02) quoted the literal string `src/components/Hero.jsx`, causing the plan's "no dangling imports" grep to report a false positive against a documentation comment, not an actual import.
- **Fix:** Reworded the comment to paraphrase ("the former React Hero component ... deleted 24-04") instead of quoting the literal path.
- **Files modified:** `src/components/astro/Hero.astro`
- **Verification:** `rg "components/Hero(\.jsx|')" src/` returns zero matches.
- **Committed in:** `73bdcec` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking issues directly caused by this plan's mandated deletion)
**Impact on plan:** Both fixes were necessary to satisfy the plan's own acceptance criteria and verification gates (GREEN test suite, zero dangling references). No scope creep — the broader legacy-app cleanup remains Phase 27's job.

## Issues Encountered
- `grep -c` on the built `dist/*/index.html` files reports line counts, not occurrence counts, because Astro emits near-single-line minified HTML per page — a `-c` of `1` for `count-up`/`details-dismiss`/`me-800.webp` was confirmed via `grep -o`/byte-offset spot checks to represent multiple real occurrences, not an undercounting bug. Matches the plan's stated ≥1 threshold either way.
- Pre-existing jsdom stderr warning ("Not implemented: navigation") still appears during the full suite run, in an unrelated existing test — matches 24-01/24-02-SUMMARY.md's prior notes of the same warning; not caused by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Hero is live and first on both `/en` and `/es`; STATIC-02 (Hero half) is now fully shippable — Experience's half (Phase 26) remains outstanding before STATIC-02 can be marked complete in REQUIREMENTS.md.
- Real cross-browser QA (Escape-key dismiss, outside-click dismiss, `steps()` glyph alignment on Press Start 2P) per 24-RESEARCH.md's Pitfalls 1-2 and Assumptions A1-A4 is still outstanding — this is explicitly Plan 24-05's scope.
- `src/App.jsx`/`src/index.jsx`/root `index.html` (the legacy CRA/Vite-CSR entry point) remain in the repo, now missing only the `Hero` reference; the rest of that lineage (`Nav.jsx`, `About.jsx`, `Skill.jsx`, `Experience.jsx`, `Projects.jsx`, `Claude.jsx`, `Contact.jsx`, `Footer.jsx`, `SectionPager.jsx` and their tests) is untouched and still builds/tests green — full removal is Phase 27's explicit scope ("CRA/Vite-CSR leftovers removed").
- No blockers for Plan 24-05.

---
*Phase: 24-hero*
*Completed: 2026-07-20*

## Self-Check: PASSED

All files verified: `src/pages/en/index.astro`, `src/pages/es/index.astro` found; `src/components/Hero.jsx`, `src/components/Hero.test.jsx` confirmed deleted. Both task commit hashes (`97dd6dc`, `73bdcec`) verified present in `git log --all`.
