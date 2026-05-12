---
phase: 07-tailwind-css-var-refactor
plan: 02
subsystem: ui
tags: [tailwind, css-vars, theming, branding, wcag-aa, og-image, playwright]

# Dependency graph
requires:
  - phase: 07-01
    provides: "CSS-var indirection layer (tailwind.config.js reads from var(--color-*); :root and [data-theme=\"light\"] hold values)"
provides:
  - "Blue-500 (#3B82F6) + emerald-500 (#10B981) brand identity in dark mode"
  - "Blue-600 (#2563EB) + emerald-700 (#047857) brand identity in light mode (WCAG AA-compliant on near-white surfaces)"
  - "Theme-aware Hero pulsing-dot shadow via var(--color-brand)"
  - "Theme-aware Experience timeline-dot ring+halo via var(--color-ink-950)+var(--color-brand-muted)"
  - "Regenerated og-image.png with blue brand for social previews"
  - "Zero legacy #6C63FF/#FF6B6B/#BB3A3A/rgba(108,99,255,*)/rgba(255,107,107,*) refs across src/, scripts/, tailwind.config.js, public/"
affects: [phase-08-hero-photo, phase-09-ai-section, phase-10-uat-sweep, phase-11-diagrams]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS-var arbitrary Tailwind classes for inline shadow theme-awareness: shadow-[0_0_8px_var(--color-brand)]"
    - "WCAG AA contrast-aware light-mode palette: brand=#2563EB (4.97:1), accent=#047857 (5.05:1) on #FFFFFF"
    - "Dual-mode darken: both brand and accent receive darker variants in light mode (extends Phase 5's accent-only pattern)"

key-files:
  created: []
  modified:
    - src/index.css
    - tailwind.config.js
    - src/components/Hero.js
    - src/components/Experience.js
    - scripts/og-template.html
    - public/og-image.png

key-decisions:
  - "Light-mode palette darkened to WCAG AA on white: brand #2563EB (4.97:1), accent #047857 (5.05:1)"
  - "Hero pulsing-dot shadow uses CSS var (theme-aware) rather than introducing a one-off boxShadow.brand-pulse token"
  - "Experience timeline-dot halo alpha shifts 0.4 -> 0.12 to align with canonical --color-brand-muted token (potential Phase 10 polish flag)"
  - "og-template.html keeps hex/rgba literals (not vars) — standalone HTML run through Playwright, outside the Tailwind/CSS-var pipeline"
  - "Phase 5 transitional accent #BB3A3A removed; replaced by #047857 in light mode"

patterns-established:
  - "shadow-[layer1,layer2] with CSS vars at each layer enables full theme-aware compound shadows"
  - "OG template stays out of CSS-var pipeline by design — regenerated PNG carries the chroma forward"

requirements-completed: [COLOR-01]

# Metrics
duration: 4min
completed: 2026-05-12
---

# Phase 07 Plan 02: Brand Palette Swap to Blue-500 + Emerald-500 Summary

**Brand identity swapped from indigo+coral to blue-500+emerald-500 (dark) and blue-600+emerald-700 (light, WCAG AA), with theme-aware inline shadows in Hero and Experience and a regenerated og-image.png.**

## Performance

- **Duration:** ~4 min (202 s)
- **Started:** 2026-05-12T18:35:17Z
- **Completed:** 2026-05-12T18:38:39Z
- **Tasks:** 8 executed (Task 9 skipped — sweep clean)
- **Files modified:** 6

## Accomplishments

- **Dark-mode palette swapped** in `:root`: brand `#6C63FF`/coral `#FF6B6B` → blue-500 `#3B82F6` + emerald-500 `#10B981`, with `*-light`/`*-dark`/`*-muted` variants and dot-grid overlay.
- **Light-mode palette swapped** in `[data-theme="light"]`: WCAG-AA-compliant blue-600 `#2563EB` (4.97:1) + emerald-700 `#047857` (5.05:1) on `#FFFFFF`. Phase 5's transitional `#BB3A3A` accent retired.
- **Tailwind gradients + shadows updated**: `hero-gradient`, `brand-gradient` (135deg), `card-gradient` (145deg), `boxShadow.brand` (0.35), `boxShadow.brand-lg` (0.55) — all directions and opacities preserved per CONTEXT decisions e + g.
- **Hero pulsing-dot inline shadow** now theme-aware via `shadow-[0_0_12px_var(--color-brand)]`.
- **Experience timeline-dot inline shadow** now theme-aware on BOTH layers — ring via `var(--color-ink-950)` (inverts for light mode), halo via `var(--color-brand-muted)` (carries new brand chroma).
- **OG template + og-image.png regenerated**: 4 hex + 3 rgba indigo refs swapped to blue-500; PNG re-rendered via `npm run og:gen` (Playwright). Output 1200×630, 194686 bytes (delta -248 B from prior indigo build — negligible).
- **Final grep sweep clean**: zero hits for `#6C63FF`, `#FF6B6B`, `#BB3A3A`, `rgba(108,99,255,*)`, `rgba(255,107,107,*)` across `src/`, `scripts/`, `tailwind.config.js`, and `public/` (excluding the og-image.png binary).

## Task Commits

Each task was committed atomically:

1. **Task 1: Swap `:root` brand+accent to dark-mode blue/emerald** — `9edbd3a` (feat)
2. **Task 2: Swap `[data-theme="light"]` brand+accent to WCAG-AA palette** — `e45b493` (feat)
3. **Task 3: Update tailwind.config.js gradients (hero/brand/card)** — `34365b2` (feat)
4. **Task 4: Update boxShadow.brand + brand-lg rgba to blue-500 RGB** — `55d839c` (feat)
5. **Task 5: Hero.js pulsing-dot shadow → `var(--color-brand)`** — `7084c59` (feat)
6. **Task 5b: Experience.js timeline-dot shadow → CSS vars (ring + halo)** — `507b6af` (feat)
7. **Task 6: og-template.html indigo → blue-500 (4 hex + 3 rgba)** — `c9a6000` (chore)
8. **Task 7: Regenerate public/og-image.png** — `70a123f` (chore)
9. **Task 8: Final grep sweep** — verification-only, 0 hits (no commit per plan)
10. **Task 9: Optional fix-up** — SKIPPED (sweep clean on first pass)

**Plan metadata commit:** will be added by orchestrator workflow.

## Palette Delta

### Dark mode (`:root`)

| Token | Before (indigo/coral) | After (blue/emerald) | Tailwind ref |
|-------|----------------------|---------------------|---------------|
| `--color-brand` | `#6C63FF` | `#3B82F6` | blue-500 |
| `--color-brand-light` | `#8B85FF` | `#60A5FA` | blue-400 |
| `--color-brand-dark` | `#4A42E8` | `#2563EB` | blue-600 |
| `--color-brand-muted` | `rgba(108,99,255,0.15)` | `rgba(59,130,246,0.12)` | blue-500 @ 0.12 |
| `--color-accent` | `#FF6B6B` | `#10B981` | emerald-500 |
| `--color-accent-light` | `#FF8E8E` | `#34D399` | emerald-400 |
| `--color-accent-dark` | `#E64444` | `#059669` | emerald-600 |
| `--color-accent-muted` | `rgba(255,107,107,0.15)` | `rgba(16,185,129,0.12)` | emerald-500 @ 0.12 |

### Light mode (`[data-theme="light"]`)

| Token | Before (Phase 5 transitional) | After (WCAG AA-darkened) | Contrast on `#FFFFFF` |
|-------|------------------------------|--------------------------|----------------------|
| `--color-brand` | `#6C63FF` (indigo, fail) | `#2563EB` (blue-600) | **4.97:1 ✓ AA** |
| `--color-brand-light` | `#8B85FF` | `#3B82F6` (blue-500) | — |
| `--color-brand-dark` | `#4A42E8` | `#1D4ED8` (blue-700) | — |
| `--color-brand-muted` | `rgba(108,99,255,0.12)` | `rgba(37,99,235,0.12)` | — |
| `--color-accent` | `#BB3A3A` (4.5:1 coral) | `#047857` (emerald-700) | **5.05:1 ✓ AA** |
| `--color-accent-light` | `#FF6B6B` | `#10B981` (emerald-500) | — |
| `--color-accent-dark` | `#8E2C2C` | `#065F46` (emerald-800) | — |
| `--color-accent-muted` | `rgba(187,58,58,0.12)` | `rgba(4,120,87,0.12)` | — |

Contrast ratios per CONTEXT decision-b. Both `#3B82F6` (4.01:1) and `#10B981` (2.54:1) would fail AA outright on `#FFFFFF`, justifying the dual-mode darken strategy.

## Files Created/Modified

| File | Change | Lines (insert/delete) |
|------|--------|----------------------|
| `src/index.css` | `:root` + `[data-theme="light"]` palettes swapped; `.bg-grid-subtle` rgba updated | 23 / 24 (two commits) |
| `tailwind.config.js` | 3 gradients + 2 shadows swapped | 5 / 5 (two commits) |
| `src/components/Hero.js` | line 67 inline shadow tokenized via `var(--color-brand)` | 1 / 1 |
| `src/components/Experience.js` | line 56 inline shadow tokenized via `var(--color-ink-950)` + `var(--color-brand-muted)` | 1 / 1 |
| `scripts/og-template.html` | 4 hex + 3 rgba indigo refs → blue-500 | 7 / 7 |
| `public/og-image.png` | Regenerated PNG, 194686 bytes (was 194934 B, Δ -248 B) | binary |

## OG Image Regeneration

- **Command:** `npm run og:gen` (Playwright via `scripts/generate-og-image.js`)
- **Result:** clean run, no Playwright install step needed on this machine (chromium already present from prior runs)
- **Output:** `public/og-image.png`, 1200×630 PNG, 194686 bytes
- **Delta vs previous (indigo) build:** -248 bytes (~0.13% smaller — negligible, expected given near-identical entropy between indigo and blue at the same coverage)
- **Visual verification deferred to Phase 10 sweep** per scope boundary — content surfaces verified by template hex/rgba count (4 + 3, matched).

## Grep Sweep Results (Task 8)

Three sweeps run, all returned **ZERO HITS**:

```bash
# Sweep 1 — full legacy palette (incl. Phase 5 transitional accent)
grep -rnE "(#6C63FF|#FF6B6B|#BB3A3A|rgba\(108,\s*99,\s*255|rgba\(255,\s*107,\s*107)" \
  src/ scripts/ tailwind.config.js

# Sweep 2 — prompt-specified compact patterns
grep -rnE "(#6C63FF|#FF6B6B|rgba\(108|rgba\(255,107|rgba\(255, 107)" \
  src/ scripts/ tailwind.config.js

# Sweep 3 — public/ excluding the binary PNG
grep -rnE "(#6C63FF|#FF6B6B|#BB3A3A|rgba\(108|rgba\(255,107|rgba\(255, 107)" \
  public/ --exclude='og-image.png'
```

All three sweeps clean on first pass — Task 9 (optional fix-up) skipped accordingly.

## Decisions Made

- **Halo alpha alignment in Experience timeline-dot:** the original hardcoded `rgba(108,99,255,0.4)` halo was retokenized to `var(--color-brand-muted)` which uses `0.12` alpha — a deliberate alignment with the canonical brand-muted system established in Plan 07-01. This makes the halo more subtle than the legacy version. If Phase 10 visual review finds it too subtle, the correct fix is to introduce a new `--color-brand-glow` token in `src/index.css` with higher alpha (e.g., 0.3), not to re-hardcode the rgba. **Flagged as potential Phase 10 polish item.**
- **og-template.html stays outside CSS-var pipeline:** the file is standalone HTML executed by Playwright via `scripts/generate-og-image.js`, not processed through PostCSS/Tailwind. Using `var(--color-*)` would require a runtime CSS layer that doesn't exist in that pipeline. Hex/rgba literals are the right interface; the regenerated PNG carries the chroma forward.

## Deviations from Plan

None - plan executed exactly as written.

- All 9 tasks were defined; 8 executed (Tasks 1-7 + Task 8). Task 9 was conditional ("execute only if Task 8 grep sweep surfaces hits") and is explicitly marked SKIPPED per the plan's own done-criterion ("If Task 8 was clean: this task is a no-op and SUMMARY.md notes 'Task 9 skipped — sweep was clean on first pass.'").
- Hex values, rgba opacities, gradient directions (135deg/145deg), shadow offsets, and Conventional Commit prefixes match the plan spec verbatim.
- No Rule 1/2/3 auto-fixes needed; no Rule 4 architectural escalations.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration. Playwright chromium was already installed on this machine from prior `npm run og:gen` runs; no install step required.

## Visual Check (sanity, not Phase 10 sweep)

Internal verification gate for Plan 07-02 is **not** a separate human-verify checkpoint — the plan ran end-to-end in `--auto` mode per execution rules. The site has not been opened in a browser as part of Plan 07-02; full multi-viewport visual + WCAG AA + Lighthouse sweep is owned by Phase 10 (UAT) per the scope boundary in 07-CONTEXT.md.

What IS verifiable now without a browser:
- Tailwind tokens compile (no syntax errors; gradient/shadow strings well-formed).
- `npm run og:gen` produces a valid PNG (1200×630, 194686 B) — Playwright successfully rendered the new template, confirming no CSS parse errors in og-template.html.
- Grep sweep confirms zero legacy color refs anywhere in the codebase surface.

Two surfaces flagged for Phase 10 explicit attention:
1. **Experience timeline-dot halo** — alpha-aligned to canonical 0.12; confirm it reads as a visible glow vs. invisible. If subtle, introduce `--color-brand-glow` token rather than re-hardcoding.
2. **OG image visual** — confirm the regenerated PNG shows blue on logomark slash, role line2, divider, URL footer, and photo border/box-shadow (not indigo).

## Next Phase Readiness

**Phase 7 complete (THEME-01 + COLOR-01).** Unblocks **Phase 8 (HERO-01 — Hero photo integration)**, which needs the new blue+emerald brand in place for the Hero photo overlay gradient and text-shadow to render in the v3.6 identity.

- THEME-01 (Plan 07-01): theme toggle flips all surfaces — verified end-to-end.
- COLOR-01 (Plan 07-02): brand identity shifted to blue+emerald, WCAG AA on light mode — verified by hex/rgba counts and grep sweep.

No blockers, no carry-over debt for v3.6.

## Self-Check: PASSED

**Files verified present:**
- `src/index.css` ✓
- `tailwind.config.js` ✓
- `src/components/Hero.js` ✓
- `src/components/Experience.js` ✓
- `scripts/og-template.html` ✓
- `public/og-image.png` ✓
- `.planning/phases/07-tailwind-css-var-refactor/07-02-SUMMARY.md` ✓

**Commits verified in git log:**
- `9edbd3a` (Task 1) ✓
- `e45b493` (Task 2) ✓
- `34365b2` (Task 3) ✓
- `55d839c` (Task 4) ✓
- `7084c59` (Task 5) ✓
- `507b6af` (Task 5b) ✓
- `c9a6000` (Task 6) ✓
- `70a123f` (Task 7) ✓

All claims in this SUMMARY map to verifiable disk + git state. No drift.

---
*Phase: 07-tailwind-css-var-refactor*
*Completed: 2026-05-12*
