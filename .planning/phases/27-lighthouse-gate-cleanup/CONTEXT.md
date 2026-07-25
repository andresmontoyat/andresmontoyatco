# Phase 27 — Lighthouse gate + cleanup — CONTEXT

**Requirements:** DEPLOY-04 (Lighthouse mobile hard gate on `/`, `/en`, `/es` before merge to `main`)
**Also resolves at milestone end:** 21-05 (live Vercel middleware validation), 24-05 (CV dropdown cross-browser QA), STATIC-02 Experience-half verdict (D-26).

## Three-part phase, two of them operator-gated

| Part | Scope | Autonomy |
|------|-------|----------|
| 27-01 | Remove CRA/Vite-CSR leftovers (dead React CSR app, root `index.html`, Vite bundle-gate tooling) | **Autonomous** — done in-session |
| 27-02 | Lighthouse mobile HARD gate on `/`, `/en`, `/es` (Perf ≥0.95, A11y/BP/SEO = 1.0) | **BLOCKED** — needs a real Vercel deploy |
| 27-03 | Merge `v5-astro-migration` → `main` | **BLOCKED** — needs 27-02 green |

## Why 27-02 / 27-03 are blocked (operator actions required)

DEPLOY-04 is defined against the three live URLs. The gate cannot be run on
`astro dev`/`astro preview` alone because the root `/` redirect is owned by
Vercel-native Edge Middleware (`middleware.ts`), inert outside Vercel's runtime.
Before the gate can run:

1. **`PUBLIC_SITE_URL`** must be set in Vercel Project → Settings → Environment
   Variables (`https://andresmontoyat.co` or the preview URL) — BaseLayout reads
   it at build time for canonical/hreflang/og.
2. **Vercel preview deploy** of the `v5-astro-migration` branch must exist, with a
   **Protection Bypass secret** so external Lighthouse can reach it (21-05).
3. Then: `LIGHTHOUSE_TARGET_URL=<preview>/en npm run lighthouse:deployed && npm run lighthouse:check`
   for each of `/`, `/en`, `/es`.

These are user/operator steps. The session hard-stops after 27-01 and hands off.

## 27-01 cleanup inventory (verified dead — zero active imports)

Safety-checked: no `.astro` page, no `src/components/react/` island, no `src/layouts/`
file imports any of the below. Root `index.html` is unreferenced by `astro.config.mjs`
and `vercel.json` (Astro serves from `src/pages/`, ignoring root `index.html`).

**Legacy React CSR app:**
- `src/App.jsx`, `src/App.test.jsx`, `src/index.jsx`, `src/reportWebVitals.js`
  (`reportWebVitals` imports `web-vitals`, already ABSENT from `package.json` → dead)
- `src/components/{About,Claude,Contact,Experience,Footer,Nav,Projects,SectionPager,Skill}.jsx`
- `src/components/{Contact,Experience,SectionPager}.test.jsx`
- `src/components/_shared/{SectionLabel,ThemeToggle}.jsx`

**Dead Vite entry:**
- root `index.html` (references `/src/index.jsx`, the deleted CSR entry)

**Vite-CSR bundle-gate tooling** (matches `index-*.js` chunks Astro never emits):
- `scripts/check-bundle-gate.mjs`, `scripts/check-bundle-gate.test.mjs`
- `package.json` scripts `build:analyze`, `build:gate` (invoke `vite build` — no
  entry post-deletion) → removed
- `lighthouse:local` / `lighthouse:mobile` local-fallback `vite preview` → `astro preview`

## Decision — D-27-CLEANUP-SWEEP

Remove **all** CRA/Vite-CSR leftovers in one focused pass, not just the React app.
Every `vite build` / `vite preview` / `index-*.js`-gate reference is a migration
leftover per the ROADMAP mandate. Removing the bundle-gate drops its pure-logic
`.test.mjs` specs from the suite — acceptable: they cover deleted tooling. Net test
count falls; all remaining specs stay GREEN.

## Verification (27-01)

- `npm run build` succeeds (4 pages), no dangling import errors.
- `npx vitest run` GREEN (count drops by the removed bundle-gate specs; zero failures).
- `rg` confirms zero surviving references to deleted modules outside `docs/` history.

## Out of scope

Lighthouse run (27-02), merge (27-03) — operator-gated. Native `<details>` refactor
of Experience — conditional on the 27-02 verdict (D-26).
