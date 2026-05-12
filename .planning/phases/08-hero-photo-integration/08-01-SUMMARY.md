---
phase: 08-hero-photo-integration
plan: 01
subsystem: ui
tags: [hero, photo, picture, webp, sharp, css-vars, preload, lcp]

# Dependency graph
requires:
  - phase: 07-01
    provides: "CSS-var indirection layer (:root + [data-theme=\"light\"] token system)"
  - phase: 07-02
    provides: "Blue+emerald brand palette already wired into the CSS-var pipeline"
provides:
  - "Full-bleed cinematic hero photo via <picture> with 800w mobile + 1600w desktop WebP sources"
  - "Theme-aware --hero-photo-filter / --hero-overlay / --hero-h1-shadow tokens in both :root and [data-theme=\"light\"]"
  - "EXIF-stripped optimized WebP pipeline (npm run hero:process) — re-runnable, deterministic"
  - "LCP preload via <link rel=preload imagesrcset=...> so mobile fetches 800w in parallel with JS bundle"
  - "Stat-grid backdrop-blur frosted-glass legibility over photo lower half"
  - "Zero-JS layered fallback: bg-hero-gradient renders through if photo 404s"
affects: [phase-09-ai-section, phase-10-uat-sweep, phase-11-diagrams]

# Tech tracking
tech-stack:
  added:
    - "sharp ^0.34.5 (devDependency) — Node native image processing for the hero pipeline"
  patterns:
    - "<picture> + <source media> mobile-first responsive image (no srcset on <img>)"
    - "Inline style={{ filter: 'var(--hero-photo-filter)' }} for theme-aware image filters that Tailwind cannot tokenize via JIT"
    - "drop-shadow CSS filter on <h1> as the only shadow style that paints over bg-clip-text + color: transparent gradient text"
    - "Layered z-0 photo + z-0 overlay + z-10 content stack with bg-hero-gradient as the unconditional fallback layer"

key-files:
  created:
    - scripts/process-hero-photo.js
    - public/me-1600.webp
    - public/me-800.webp
    - .planning/phases/08-hero-photo-integration/08-01-SUMMARY.md
  modified:
    - package.json
    - package-lock.json
    - .gitignore
    - src/index.css
    - src/components/Hero.js
    - index.html

key-decisions:
  - "Sharp 0.34 EXIF strip: omit .withMetadata() rather than call .withMetadata({exif:false}) — modern sharp strips by default; the plan-spec call throws"
  - "Preload link placement: between <meta name=viewport> and <meta name=theme-color> (plan-spec authoritative over prompt note)"
  - "Both me.jpg AND me.png added to .gitignore so any re-source format is hidden"

patterns-established:
  - "Hero photo pipeline as one-shot npm run hero:process — re-run after replacing me.jpg, commit regenerated WebPs"
  - "CSS-var inline-style indirection for image filters that Tailwind JIT cannot bind (filter values not in default Tailwind shape)"

requirements-completed: [HERO-01]

# Metrics
duration: 4m 3s
completed: 2026-05-12
---

# Phase 08 Plan 01: Hero Photo Overlay Full-Bleed Integration Summary

**Carlos's face now renders as a full-bleed cinematic background in the Hero section — sharp-piped EXIF-stripped WebPs (1600+800), three theme-aware CSS-var tokens for photo filter / gradient overlay / h1 drop-shadow, a `<picture>` element with mobile-first 640px breakpoint, LCP preload with imagesrcset for parallel fetch, plus backdrop-blur on the stat-grid for legibility over the photo's lower half.**

## Performance

- **Duration:** ~4 min (243 s)
- **Started:** 2026-05-12T20:29:32Z
- **Completed:** 2026-05-12T20:33:35Z
- **Tasks:** 7 executed (all completed in order, no skips)
- **Files modified:** 6
- **Files created:** 3 (script + 2 WebPs)

## Accomplishments

- **Sharp pipeline shipped** as `scripts/process-hero-photo.js` + `npm run hero:process`. Reads `./me.jpg` (1.2 MB raw, gitignored), writes `public/me-1600.webp` (143610 B, 1600×1202) + `public/me-800.webp` (50432 B, 800×601), EXIF stripped, idempotent.
- **3 new theme-aware CSS-var tokens** added to BOTH `:root` (dark) and `[data-theme="light"]` blocks: `--hero-photo-filter`, `--hero-overlay`, `--hero-h1-shadow`. Values match CONTEXT decision-l exactly (dark: `grayscale(0.2) brightness(0.35)`; light: `grayscale(0.15) brightness(0.85)`).
- **Hero.js structural swap:** `bg-grid-subtle` div removed; replaced with `<picture>` photo layer (mobile `<source media="(max-width:640px)">` + desktop default + fallback `<img>`) and a sibling overlay `<div>` driven by `var(--hero-overlay)`. Content wrapper `relative z-10` untouched. `bg-hero-gradient` on `<section>` retained as the zero-JS fallback layer (CONTEXT decision-j).
- **H1 legibility & stat-grid frosted glass:** h1 gains inline `filter: drop-shadow(var(--hero-h1-shadow))` (the only shadow form that paints over the char-reveal `bg-clip-text text-transparent` span); stat-grid className gains `backdrop-blur-sm`.
- **LCP preload wired** in `index.html` with `imagesrcset="/me-800.webp 800w, /me-1600.webp 1600w"` so mobile parallel-fetches the 800w file; `fetchpriority="high"` + `imagesizes` complete the spec.
- **Gitignore hygiene:** raw `me.jpg` + `me.png` now ignored (`git check-ignore -q me.jpg` exits 0). Optimized WebPs ARE committed (small, deterministic, no EXIF).
- **Build + lint clean.** `npm run build` succeeds in 1.01 s; `dist/me-{800,1600}.webp` + preload link + raw-jpg-absence all verified. ESLint reports 0 errors on `src/` (4 pre-existing warnings in `Experience.js` + `useActiveSection.js` — out of scope per scope-boundary rule).

## Task Commits

Each task committed atomically with Conventional Commit prefix per plan:

| # | Task | Commit | Message |
|---|------|--------|---------|
| 1 | A1 — Add sharp devDep | `6030823` | `chore(08-01): add sharp devDependency for hero image pipeline` |
| 2 | A2 — Create pipeline script + npm script | `431b107` | `feat(08-01): scripts/process-hero-photo.js — sharp pipeline for hero WebPs` |
| 3 | A3 — Run pipeline + gitignore + commit WebPs | `94432bc` | `chore(08-01): generate hero WebPs (1600 + 800) and gitignore raw me.jpg` |
| 4 | B1 — Add 3 hero CSS vars | `57e429e` | `feat(08-01): add hero theme-aware CSS variables (--hero-photo-filter, --hero-overlay, --hero-h1-shadow)` |
| 5 | C1 — `<picture>` + overlay in Hero.js | `1aa7ddd` | `feat(08-01): Hero adds full-bleed photo <picture> + theme-aware overlay layer` |
| 6 | C2 — h1 drop-shadow + stat-grid blur | `4d09ff0` | `feat(08-01): Hero h1 drop-shadow + stat-grid backdrop-blur for photo legibility` |
| 7 | C3 — index.html preload | `473b86b` | `chore(08-01): index.html preload LCP hero image with imagesrcset` |

Plan metadata commit will be added by orchestrator workflow.

## WebP Output Sizes

| File | Width | Height | Bytes | Human | Budget | Status |
|------|-------|--------|-------|-------|--------|--------|
| `public/me-1600.webp` | 1600 | 1202 | 143610 | 140.2 KB | <300 KB | ✓ 47% headroom |
| `public/me-800.webp` | 800 | 601 | 50432 | 49.3 KB | <100 KB | ✓ 50% headroom |

Both files reported by `file(1)` as `RIFF (little-endian) data, Web/P image, VP8 encoding`. No EXIF metadata (verified by sharp 0.33+ default strip behavior).

## Build Output Confirmation

```
dist/me-1600.webp                                    143610 B ✓
dist/me-800.webp                                      50432 B ✓
dist/index.html  rel="preload"                            1 ✓
dist/me.jpg                                               0 ✓ (absent)
npm run build                                       1.01 s ✓
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Sharp 0.34 API change broke plan-spec EXIF-strip call**
- **Found during:** Task A3 (first `npm run hero:process` execution)
- **Issue:** `.withMetadata({ exif: false })` (from the plan-spec literal script body) throws `Expected object for exif but received false of type boolean` in sharp 0.34.5 (the version npm resolved). The plan-writer used an older sharp API.
- **Fix:** Removed the `.withMetadata({ exif: false })` call entirely. In sharp 0.33+, EXIF (and all metadata) is **stripped by default** — preservation requires an explicit `.withMetadata()` call with no args. Omitting the call achieves the plan's intent (no EXIF in output WebPs per CONTEXT decision-m) more idiomatically.
- **Inline comment** added to `scripts/process-hero-photo.js` documenting why the older API form is not used, so future maintainers don't re-introduce it.
- **Files modified:** `scripts/process-hero-photo.js`
- **Commit:** bundled into `94432bc` (Task A3) because the pipeline must produce outputs to land the WebPs; rolling the fix into A3 keeps each commit functionally complete.

### Other notes (not deviations)

- **Preload placement choice:** The orchestrator-prompt note said "after `<meta name="theme-color">`"; the plan-spec text said "after viewport, before theme-color". Plan-spec is authoritative for executor decisions — I placed the `<link>` between `<meta name="viewport">` and `<meta name="theme-color">`. Net effect on browser fetch priority is identical; placement is purely a style call.
- **Verify command interpretation:** Plan verify blocks used `npm run lint -- src/components/Hero.js`, but `npm run lint` is defined as `eslint src --ext .js,.jsx` (whole src/ tree). I ran `npx eslint src/components/Hero.js` directly during per-task verify (functionally equivalent for "Hero.js is clean") and the full `npm run lint` once at end-of-plan sanity. Both clean on Hero.js.
- **Pre-existing warnings out of scope:** `npm run lint` reports 4 warnings in `Experience.js` (`react/no-array-index-key`, ×2) and `useActiveSection.js` (`react-hooks/exhaustive-deps`, ×2). Not introduced by this plan; not addressed per scope-boundary rule.

## Issues Encountered

- Sharp API mismatch documented above. No other issues.

## User Setup Required

None. Sharp installed cleanly on darwin-arm64 with prebuilt native binaries (no fallback path required). `me.jpg` was already present at repo root before the plan started.

## Handed to Phase 10 (UAT)

Two outcomes Plan 08-01 produces but **cannot self-verify** (out of scope per CONTEXT — full sweep deferred to Phase 10):

1. **Visual focal-point sanity:** Confirm `object-position: center 30%` keeps Carlos's face in frame at iPhone 14 (390×844 portrait), Pixel 7 (393×873), iPad (768×1024), and 1440px+ desktop. If face cuts off at any breakpoint, add `media (max-width: 640px) { object-position: center 22% }` to `:root` (or move to a per-breakpoint var).
2. **Lighthouse mobile audit:** Confirm Performance ≥ 95 with LCP ≤ 2.5 s on Slow-4G simulation. The preload + WebP sizes (140 KB desktop / 49 KB mobile) put us well within target, but only a real audit verifies. CLS should remain 0 (photo is `absolute inset-0`, pre-reserves no layout space).

Additional Phase-10 polish flags:
- **Light-mode photo legibility:** confirm `brightness(0.85)` doesn't wash Carlos's face into the light overlay. If so, tune to `0.75` (2-line CSS-var change).
- **drop-shadow + char-reveal animation paint cost:** if Phase 10 profiling shows GPU paint thrashing, fall back to `text-shadow` on h1a/h1c (skip h1b — gradient is already vibrant).

## Self-Check: PASSED

**Files verified present:**
- `scripts/process-hero-photo.js` ✓
- `public/me-1600.webp` ✓ (143610 B)
- `public/me-800.webp` ✓ (50432 B)
- `dist/me-1600.webp` ✓
- `dist/me-800.webp` ✓
- `.planning/phases/08-hero-photo-integration/08-01-SUMMARY.md` ✓ (this file)

**Commits verified in git log:**
- `6030823` (Task A1) ✓
- `431b107` (Task A2) ✓
- `94432bc` (Task A3) ✓
- `57e429e` (Task B1) ✓
- `1aa7ddd` (Task C1) ✓
- `4d09ff0` (Task C2) ✓
- `473b86b` (Task C3) ✓

**Key assertions verified:**
- `git check-ignore -q me.jpg` exits 0 — raw source ignored ✓
- `grep -c "bg-grid-subtle" src/components/Hero.js` = 0 — old overlay removed ✓
- `grep -c "<picture" src/components/Hero.js` = 1 — new photo element present ✓
- `grep -c 'rel="preload"' dist/index.html` = 1 — preload survived build ✓
- `find dist -name me.jpg` = empty — raw source NOT in build output ✓

All claims in this SUMMARY map to verifiable disk + git state. No drift.

---
*Phase: 08-hero-photo-integration*
*Completed: 2026-05-12*
