---
phase: 08-hero-photo-integration
created: 2026-05-12
milestone: v3.6 — AI Practice & Brand Refresh
requirements: [HERO-01]
discuss_mode: discuss
gray_areas_resolved: [a-image-optimization, e-object-position, f-h1-legibility, j-fallback-strategy, l-light-mode-behavior]
---

# Phase 8 Context — Hero Photo Integration (Variant C overlay full-bleed)

## Goal

A visitor opening the site immediately sees Carlos's face as a cinematic full-bleed Hero background, with the existing badge + char-reveal h1 + role line + CTAs + 4-stat grid layered cleanly on top in BOTH dark and light themes — without regressing Lighthouse Performance below 95 mobile.

## Requirements In Scope

- **HERO-01** — Integrate `me.jpg` into Hero using Variant C (overlay full-bleed): move `./me.jpg` → `public/me.jpg`, render as `<img>` background with theme-aware `filter` (grayscale + brightness), theme-aware gradient overlay, and theme-aware text-shadow on h1. Preserve all existing Hero elements (badge, char-reveal h1, role line, dual CV CTAs, 4-stat grid). Responsive at iPhone 14, Pixel 7, iPad, 1440px+. Maintain Lighthouse Performance ≥ 95 mobile.

## Scope Boundary

**In scope:**
- Image processing pipeline (sharp CLI npm script generating `public/me-{800,1600}.webp` from `./me.jpg` source; EXIF stripped)
- New `<picture>` markup in `src/components/Hero.js` with desktop + mobile WebP sources
- New CSS variables for theme-aware photo filter, gradient overlay, and h1 shadow (in `src/index.css` `:root` + `[data-theme="light"]`)
- Hero section structural changes (photo layer + overlay layer + content z-index reorder)
- Removal of `bg-grid-subtle` overlay (visual clutter when photo present)
- `<link rel="preload">` in `index.html` for the LCP image
- Update `.gitignore` if needed to NOT track raw `me.jpg` (large source) while tracking optimized WebPs

**Out of scope (this phase):**
- AI / Claude Code section → Phase 9 (AI-01 + AI-01-CICD)
- Real-browser UAT sweep (Lighthouse + cross-browser) → Phase 10
- Architecture diagrams → Phase 11 (DIAGRAMS-01)
- Color palette changes — already shipped in Phase 7

## Codebase Reuse Notes

- `Hero.js` is 146 lines; section root currently uses `bg-hero-gradient` + a `bg-grid-subtle` overlay div. The gradient stays as a **fallback layer** under the photo (no JS error handling needed if `me-1600.webp` fails to load — gradient shows through). The grid-subtle div is removed.
- Hero content already uses `relative z-10` wrapper — only the bg layer ordering changes. No re-layout of badge / h1 / lead / CTAs / stat grid.
- 8 existing animation stagger delays (150ms → 950ms) are preserved verbatim. Photo + overlay layers fade in via a single new animation (200ms ease-out, opacity 0 → 1) that respects `motion-safe:` and `prefers-reduced-motion`.
- `index.html` already declares the language + viewport + meta tags. Add a single `<link rel="preload" as="image" href="/me-1600.webp" imagesrcset="/me-800.webp 800w, /me-1600.webp 1600w" imagesizes="(max-width: 640px) 100vw, 100vw" fetchpriority="high">` for LCP.
- The Phase 7 CSS-var infrastructure (`:root` + `[data-theme="light"]`) is reused for the new tokens (`--hero-photo-filter`, `--hero-overlay`, `--hero-h1-shadow`). No tailwind.config changes required for this phase.

## Locked Gray-Area Decisions

### a — Image optimization (WebP via `<picture>`, sharp CLI pipeline)

**Source:** `./me.jpg` 3088×2320 JPEG 1.2 MB (kept in repo root, gitignored — raw asset).
**Output:** 2 WebP files written to `public/`:
- `public/me-1600.webp` — desktop, 1600px wide, quality 82, ~180-250 KB target
- `public/me-800.webp` — mobile, 800px wide, quality 82, ~70-100 KB target
**EXIF:** stripped via sharp `.withMetadata({ exif: false })` (privacy — original has iPhone 7 Plus EXIF possibly with GPS).
**Pipeline:** `scripts/process-hero-photo.js` Node script using `sharp` (already implicitly available via `vite-imagetools`/Playwright deps if not, add `sharp` as dev dependency). Wired as `npm run hero:process` in `package.json`. One-shot, re-runnable.
**No JPEG fallback emitted** — WebP browser support is 96%+; if a user is on a browser that doesn't support WebP (IE11 etc.), the `<img src>` is the 1600px WebP which their browser will fail to render gracefully and the underlying `bg-hero-gradient` layer fills the void. No double-encoding required.

**`<picture>` markup:**
```jsx
<picture className="absolute inset-0 z-0">
  <source media="(max-width: 640px)" srcSet="/me-800.webp" type="image/webp" />
  <source srcSet="/me-1600.webp" type="image/webp" />
  <img
    src="/me-1600.webp"
    alt="Carlos Andres Montoya"
    fetchpriority="high"
    loading="eager"
    decoding="async"
    className="absolute inset-0 w-full h-full object-cover"
    style={{ objectPosition: 'center 30%', filter: 'var(--hero-photo-filter)' }}
  />
</picture>
```

### e — Object-position focal point (uniform `center 30%`)

3088×2320 landscape source → `object-fit: cover` crops the sides at all viewports. The subject's face/upper-body is in the upper third of the frame, so `object-position: center 30%` keeps the face visible across all viewports.

**Locked:** `object-position: center 30%` uniform across iPhone 14, iPad, 1440px+. Phase 10 UAT will visually confirm; if the face cuts off at any viewport, fine-tune to `25%` or add a per-breakpoint media query (deferred decision).

### f — h1 legibility (drop-shadow filter, not text-shadow)

The h1 has 3 spans: h1a (white text), h1b (gradient-text-fill via `bg-clip-text text-transparent`), h1c (white text). On a partially transparent overlay (top 0–25% of viewport at `rgba(13,13,26,0.4)`), the h1 must remain readable.

**Critical detail:** `text-shadow` does NOT render on text with `color: transparent` + `background-clip: text` (h1b char-reveal gradient). `drop-shadow()` CSS filter DOES render — it applies to the painted box-content including gradient text.

**Locked:** Apply `filter: drop-shadow(var(--hero-h1-shadow))` on the entire `<h1>` element via Tailwind arbitrary `drop-shadow-[var(--hero-h1-shadow)]` or `style={{ filter: 'drop-shadow(var(--hero-h1-shadow))' }}` if Tailwind arbitrary breaks. The CSS variable `--hero-h1-shadow` is theme-adapted (see decision-l).

### j — Fallback strategy (layered, zero-JS)

**Locked:** Layered DOM. The `<section>` keeps `bg-hero-gradient` as the bottommost layer. The `<picture>` photo is `absolute inset-0` on top. The `<div>` overlay is on top of the photo. Content is `relative z-10` topmost. If `me-1600.webp` fails to load (404, CORS, decode error), the `<img>` element renders 0×0 (or browser-default broken icon, which most browsers hide for `loading="eager"` images that 404), and the `bg-hero-gradient` shows through the gap. No JavaScript error handler needed. The site degrades to the v3.5 visual treatment.

**No `noscript` fallback** required — the photo is decorative in the sense that the h1 announces "Carlos Andres Montoya". The hero remains semantically complete without it.

### l — Light mode theme-aware filter + overlay (CSS variables)

Photo with `grayscale(0.2) brightness(0.35)` in light mode looks awkwardly dark on a light background. Solution: declare 3 new theme-aware CSS variables, override in `[data-theme="light"]`.

**Locked vars (added to `src/index.css`):**

```css
:root {
  /* Hero photo — dark mode */
  --hero-photo-filter:  grayscale(0.2) brightness(0.35);
  --hero-overlay:       linear-gradient(180deg, rgba(13, 13, 26, 0.4) 0%, rgba(13, 13, 26, 0.95) 75%);
  --hero-h1-shadow:     0 2px 16px rgba(0, 0, 0, 0.55);
}

[data-theme="light"] {
  --hero-photo-filter:  grayscale(0.15) brightness(0.85);
  --hero-overlay:       linear-gradient(180deg, rgba(250, 250, 250, 0.3) 0%, rgba(250, 250, 250, 0.85) 75%);
  --hero-h1-shadow:     0 2px 8px rgba(0, 0, 0, 0.25);
}
```

Photo lightens (brightness 0.85 vs 0.35), overlay tinted light (rgba 250,250,250 vs 13,13,26), shadow softens (less needed on lighter overlay). All three vars flip atomically on theme toggle since they live alongside the rest of Phase 7's CSS-var token system.

## Auto-Decided Gray Areas (defaults applied, no user prompt)

- **b — Pipeline:** Node script `scripts/process-hero-photo.js` using `sharp` (add as devDependency if not present). Wired as `npm run hero:process` in `package.json`. One-shot, re-runnable. Idempotent: re-runs produce identical output (sharp is deterministic at fixed quality + width).

- **c — Responsive `<picture>`:** 2 WebP sources at breakpoint 640px. No retina-density variants (single 1600px serves up to ~2560px viewport effectively; @1x render at 1440px is fine). `<picture>` is automatically responsive — no `sizes` attribute needed on `<img>` since `<source media>` queries handle it.

- **d — Loading strategy:** `fetchpriority="high"` + `loading="eager"` on the `<img>` (LCP element). Add `<link rel="preload" as="image" href="/me-1600.webp" imagesrcset="/me-800.webp 800w, /me-1600.webp 1600w" imagesizes="(max-width: 640px) 100vw, 100vw" fetchpriority="high">` to `index.html` `<head>`. Note: `imagesrcset` + `imagesizes` are correct for `<link rel=preload>` (not `srcset`/`sizes`). `decoding="async"` on `<img>` so decode doesn't block render.

- **g — Old hero-gradient + bg-grid-subtle:**
  - KEEP `bg-hero-gradient` on `<section>` as the fallback layer (renders if photo fails — see decision-j).
  - REMOVE `bg-grid-subtle` overlay `<div>` — visual clutter when a photo is the dominant bg layer.
  - The `aria-hidden="true"` grid div on line 60 of current Hero.js is deleted in Plan 08-01.

- **h — Stat-grid + CTAs visibility:** Add `backdrop-blur-sm` to the stat-grid container for a subtle glass effect over the photo. CTAs (CV buttons with `bg-transparent`/`border-ink-400`) are already legible on the gradient overlay portion of the photo (bottom 75% renders rgba(13,13,26,0.95) ≈ near-opaque) — no change. The primary `bg-brand-gradient` CTA stays unchanged.

- **i — Mobile layout:** `object-fit: cover` + `object-position: center 30%` handle iPhone 14 (390×844 portrait) and iPad (768×1024) automatically. The mobile-specific `me-800.webp` (800px wide) is enough for both portrait and landscape mobile viewports. Photo aspect ratio (4:3) means at portrait 390px viewport the photo crops to ~390×~860 — face stays centered. Content stays inside the `min-h-screen` flex container.

- **k — Alt text:** `alt="Carlos Andres Montoya"` (semantic, screen-reader-meaningful). NOT `alt=""` + `aria-hidden="true"` — the photo carries identity context that screen readers should announce. The h1 announces "Senior backend engineer", so the photo `alt` complements with the name. Bilingual: `t.hero.photoAlt` if we add a translation key, OR just hardcode `"Carlos Andres Montoya"` (name is the same in both EN and ES). **Decision: hardcode** — name doesn't translate.

- **m — EXIF strip:** `sharp(...).withMetadata({ exif: false })` in the processing script. Output WebPs carry no EXIF. Raw `me.jpg` stays in repo root (gitignored per gitignore note below).

## Gitignore / repo hygiene

- Add `me.jpg` to `.gitignore` — raw source is 1.2 MB and shouldn't bloat git history. The optimized `public/me-{800,1600}.webp` IS committed (small enough, deterministic output, no privacy concerns since EXIF stripped).
- Alternatively: keep `me.jpg` tracked in git (it's already going to be moved to public/ accidentally per current untracked file state) — but if so, ensure `.gitignore` doesn't catch it and document in README that raw source is in repo root for re-processing.
- **Locked: gitignore raw `me.jpg`**, commit only optimized WebPs. Document re-processing in `scripts/process-hero-photo.js` header comment.

## Performance Budget (handed to Phase 10)

- Total photo payload: ≤ 300 KB at desktop (1600px WebP); ≤ 100 KB at mobile (800px WebP)
- LCP target: ≤ 2.5s on mobile (Lighthouse mobile preset, Slow 4G simulation)
- CLS: 0 (the `<picture>` has explicit `absolute inset-0 w-full h-full` — no layout shift since photo occupies pre-reserved space inside Hero section)
- TBT regression: < 50ms (Hero section adds zero JS — pure markup + CSS)

## Plan Structure (handed to gsd-planner)

**Locked: 1 plan with 3 task groups.** Phase 8 is simpler than Phase 7 — no need for 2 plans with verification gates.

- **Plan 08-01 — Hero photo integration (HERO-01)**
  - Task group A (image pipeline): Add `sharp` devDep if needed, write `scripts/process-hero-photo.js`, wire `npm run hero:process`, run script to generate `public/me-{800,1600}.webp` from raw `me.jpg`, gitignore raw, commit WebPs.
  - Task group B (CSS variables): Add `--hero-photo-filter`, `--hero-overlay`, `--hero-h1-shadow` to `:root` + `[data-theme="light"]` in `src/index.css`.
  - Task group C (Hero.js + index.html): Replace `bg-grid-subtle` div with `<picture>` photo layer + overlay div; add `drop-shadow` filter to h1; add `backdrop-blur-sm` to stat-grid; add `<link rel="preload">` to `index.html`.

Each task within these groups = 1 atomic commit. Estimated 6-8 tasks total.

## Verification Plan (handed to Phase 10)

Phase 8 does NOT have an internal verification gate (Phase 7 paid the Phase 5 debt; Phase 8 trusts the CSS-var foundation). Full sweep deferred to Phase 10:
- Visual at iPhone 14 / iPad / 1440px in dark + light modes
- LCP measurement (Lighthouse mobile)
- Face stays in frame at all viewports (object-position 30% sanity check)
- Photo lightens correctly on theme toggle (light mode behavior)
- `me-1600.webp` 404 fallback test (rename file temporarily, verify gradient shows through)

## Dependencies

- **Depends on:** Phase 7 (THEME-01 + COLOR-01) — Phase 8 uses the CSS-var infrastructure delivered in 07-01 and the new brand palette delivered in 07-02. The new hero-photo CSS vars are additions to the same theme system.
- **Unblocks:** Phase 9 (AI-01 + AI-01-CICD) — AI section uses the new theme tokens too.

## Risks & Mitigations

- **Risk:** `sharp` install fails on the dev machine (native binaries). **Mitigation:** Plan task explicitly runs `npm install sharp --save-dev` and catches failure with fallback path: use `sips` (macOS native) to resize + `cwebp` CLI to convert. Document both paths in `scripts/process-hero-photo.js`.
- **Risk:** WebP file sizes exceed 300 KB target after compression. **Mitigation:** Plan task A includes a size assertion (`if size > 300_000: warn and document`). Quality can be tuned 82 → 75 with minimal visual loss for first commit; Phase 10 evaluates final.
- **Risk:** Light-mode photo looks "washed out" or unbalanced. **Mitigation:** Phase 10 in-browser review can tune `brightness(0.85)` to `0.75` or shift `--hero-overlay` opacity. Token system makes this a 2-line CSS change.
- **Risk:** `drop-shadow` on h1 + char-reveal animation creates GPU paint thrashing. **Mitigation:** Already use `motion-safe:` prefix; if a regression surfaces in Phase 10 profiling, fall back to text-shadow on h1a/h1c only (skip h1b — gradient is already vibrant enough).
- **Risk:** Face cuts off in iPhone 14 portrait crop. **Mitigation:** Phase 10 visual sweep; if needed, add `media (max-width: 640px) { object-position: center 22% }` as a 2-line CSS adjustment.

## Open Questions (none)

All gray areas resolved. Planner can proceed with Plan 08-01 structure as locked above.
