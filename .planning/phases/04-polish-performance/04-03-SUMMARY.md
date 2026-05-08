---
phase: 04-polish-performance
plan: 03
subsystem: infra
tags: [vite, fontsource, font-preload, performance, lcp, cls, woff2]

requires:
  - phase: 04-polish-performance/04-02
    provides: stripped Inter to 2 weights (400/800) + JBM 400 only — exactly 3 fontsource imports in src/index.js

provides:
  - Vite ?url font preload injection: 3 woff2 URLs imported and pushed as <link rel=preload> before React mounts
  - font-display: swap verified in all 3 @fontsource CSS files (no override needed)
  - Image audit confirmed: zero <img> tags in production code (CLS = 0)
  - me.webp NOT deleted: file IS referenced by scripts/og-template.html (OG pipeline dependency)

affects: [04-06-lighthouse, 04-07-manual-sweep]

tech-stack:
  added: []
  patterns:
    - "Vite ?url import suffix to get content-hashed asset URL at build time — ensures preload URL == @fontsource CSS fetch URL"
    - "preloadWoff2() helper injects <link rel=preload as=font> via DOM before React.createRoot — fires before first paint"

key-files:
  created: []
  modified:
    - src/index.js

key-decisions:
  - "me.webp NOT deleted: pre-planning grep missed scripts/og-template.html which references ../public/images/me.webp for the og:gen pipeline. File is a build-time input to OG image generation. Deleting it would break npm run og:gen for future regenerations. Planner re-engagement required if 924KB footprint saving is still desired."
  - "font-display: swap confirmed in all 3 @fontsource CSS files (inter/400.css: 7, inter/800.css: 7, jetbrains-mono/400.css: 6 occurrences). No CSS override needed."
  - "preloadWoff2 function placed after React imports (below fontsource imports) — ESLint/formatter hoisted imports correctly; no leading-semicolon needed for array call."

requirements-completed: [SEO-03]

duration: 12min
completed: 2026-05-05
---

# Phase 4 Plan 03: Font Preload + Image Audit Summary

**Vite ?url font preload injection for Inter 400/800 + JetBrains Mono 400 woff2 files, with font-display:swap verified and zero-CLS confirmed from image audit**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-05T00:00:00Z
- **Completed:** 2026-05-05T00:12:00Z
- **Tasks:** 3 (Task 1 committed; Task 2 skipped per deviation; Task 3 verification-only)
- **Files modified:** 1 (src/index.js)

## Accomplishments

- Font preload injection via Vite `?url` imports: `inter-latin-400-normal.woff2`, `inter-latin-800-normal.woff2`, `jetbrains-mono-latin-400-normal.woff2` — preloaded at JS execution time before React mounts, URLs guaranteed to match @fontsource CSS fetch URLs (Vite content-hash deduplication)
- `font-display: swap` confirmed present in all 3 @fontsource CSS files (inter/400.css: 7 occurrences, inter/800.css: 7 occurrences, jetbrains-mono/400.css: 6 occurrences) — no CSS override needed, FOIT eliminated by default
- Image audit confirmed: **zero `<img>` tags** in src/ or index.html — Lighthouse "Image elements do not have explicit width and height" check will pass automatically; CLS from images is 0

## Font-Display: swap Verification

| File | grep -c "font-display: swap" | Status |
|------|------------------------------|--------|
| `node_modules/@fontsource/inter/400.css` | 7 | Confirmed |
| `node_modules/@fontsource/inter/800.css` | 7 | Confirmed |
| `node_modules/@fontsource/jetbrains-mono/400.css` | 6 | Confirmed |

No CSS override added. Plan 04-06 inherits this confirmation.

## Image Audit Result

`grep -rn "<img" src/ index.html` returned **0 matches**.

- No raster images rendered by the page
- `public/og-image.png` referenced only via `<meta property="og:image">` (crawlers only, not page-loaded)
- Phase 2 hero rebuild dropped profile photo in favor of stat grid + char-reveal headline
- Lighthouse "Image elements do not have explicit width and height" will pass automatically

## Task Commits

1. **Task 1: Font preload via Vite ?url + DOM injection** - `eb0c2df` (feat)
2. **Task 2: me.webp removal** - SKIPPED (deviation — see below)
3. **Task 3: Image audit** - No commit (verification-only, zero file changes)

**Plan metadata:** (to be added after final commit)

## Files Created/Modified

- `src/index.js` — Added 3 woff2 `?url` imports + `preloadWoff2()` helper + invocation array

## Decisions Made

1. `me.webp` NOT deleted: pre-planning grep was scoped to `src/ index.html` and missed `scripts/og-template.html`, which uses a relative path `../public/images/me.webp` as the profile photo input for the Playwright OG image generation pipeline (`npm run og:gen`). File IS referenced — not a true orphan. Planner re-engagement required if 924KB footprint saving is still desired. The `og-image.png` output is already committed as a static asset, so the 924KB is only paid at build/deploy time (public/ → dist/).
2. `font-display: swap` verified in all 3 files — no CSS override added per plan step 1 expectation.
3. ESLint's `no-extra-semi` rule flagged leading `;` on array call — restructured to `const fontUrls = [...]` pattern, then ESLint formatter auto-resolved the placement of the preload block after React imports.

## Deviations from Plan

### Skipped Task (Not an Orphan)

**[Plan Step 1 Stop Condition Triggered] me.webp is referenced by scripts/og-template.html**
- **Found during:** Task 2 (re-confirm orphan status step)
- **Issue:** Pre-planning grep was run against `src/ index.html` only, missing `scripts/og-template.html` which contains `<img src="../public/images/me.webp">` used by the Playwright OG image generation script (`npm run og:gen`)
- **Plan's explicit instruction:** "If ANY match returns, STOP — me.webp is in use somewhere this plan didn't anticipate. Document in SUMMARY and request planner re-engagement."
- **Action taken:** Skipped deletion. File preserved. No `git rm` executed.
- **Impact:** 924KB savings NOT achieved in this plan. me.webp continues to be copied to `dist/images/` on every build. Planner should decide: keep it (OG pipeline can regenerate), or update og-template.html to embed the image inline, then delete.

### Auto-fixed Issues

**[Rule 1 - Bug] ESLint no-extra-semi: leading semicolon on array call**
- **Found during:** Task 1 (lint verification)
- **Issue:** `;[inter400Url, inter800Url, jbmRegularUrl].forEach(preloadWoff2)` triggered `no-extra-semi` ESLint error (1 error, build would have failed in CI)
- **Fix:** ESLint formatter auto-restructured; final committed form uses standard array variable + forEach call without leading semicolon
- **Files modified:** src/index.js
- **Verification:** `npm run lint` exits with 0 errors (4 pre-existing warnings in unrelated files)
- **Committed in:** eb0c2df (Task 1 commit — auto-format applied before commit)

---

**Total deviations:** 1 skipped task (me.webp per plan's explicit stop condition), 1 auto-fixed (ESLint semicolon — Rule 1)
**Impact on plan:** Font preload and image audit goals achieved. 924KB footprint saving deferred pending planner decision on OG pipeline dependency.

## Issues Encountered

- ESLint `no-extra-semi` caught the leading `;` guard pattern for array-as-expression-statement — resolved via auto-format before commit
- me.webp pre-planning orphan assessment was incorrect (grep scope too narrow) — plan's stop condition correctly handled

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 04-06 (Lighthouse):** Inherits 3 font preloads (browser fetches fonts in parallel with HTML parse), confirmed font-display:swap (no FOIT), and 0 CLS contributors from images. Stronger baseline for first-paint score.
- **Plan 04-07 (Manual sweep):** DevTools Network tab should show 3 `(preload)` woff2 requests for `inter-latin-400`, `inter-latin-800`, `jetbrains-mono-latin-400`.
- **Planner action needed:** Decide fate of `public/images/me.webp` — keep (OG pipeline intact) or move photo inline in og-template.html and delete (924KB savings).

---
*Phase: 04-polish-performance*
*Completed: 2026-05-05*
