---
phase: 11-vercel-deploy-uat-gate
plan: 01
subsystem: deploy-config
tags: [vercel, deploy, spa-fallback, cache-headers, og-meta, security]
requirements: [DEPLOY-01]
dependency_graph:
  requires: []
  provides:
    - "vercel.json source-of-truth (framework=vite, SPA rewrites, cache headers)"
    - ".vercel/ gitignored before `vercel link` runs (Plan 11-04)"
    - "OG meta tags reference canonical domain andresmontoyat.co"
  affects:
    - "Plan 11-02 (UAT pre-deploy gate) — depends on `npm run build` producing dist/index.html with corrected OG"
    - "Plan 11-04 (vercel link + deploy) — depends on vercel.json + .gitignore in place"
    - "Phase 12 (custom domain) — OG meta already points at canonical, no further OG changes needed"
tech_stack:
  added:
    - "vercel.json (Vercel project configuration schema)"
  patterns:
    - "SPA fallback rewrite via `/(.*)` → `/index.html` (D-05)"
    - "Cache-Control split: immutable for hashed assets, no-cache for index.html (D-06)"
    - "Gitignore-first for CLI metadata (auth-token leak prevention)"
key_files:
  created:
    - "vercel.json"
    - ".planning/phases/11-vercel-deploy-uat-gate/deferred-items.md"
  modified:
    - ".gitignore"
    - "index.html"
decisions:
  - "D-04 honored: framework=vite, buildCommand=npm run build, outputDirectory=dist (explicit, not auto-detect)"
  - "D-05 honored: SPA rewrite /(.*) → /index.html for hash-anchor navigation"
  - "D-06 honored: /assets/(.*) long-cache immutable; /index.html + / no-cache; static images/fonts 1-day cache"
  - "D-11 honored: 3 occurrences of `andresmontoyatco.com` corrected to `andresmontoyat.co`"
  - "D-12 honored: OG meta points at canonical (no dynamic JS rewrite — bots are server-side)"
metrics:
  duration: "2m 14s"
  completed: "2026-05-25T14:19:07Z"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 4
  commits: 3
---

# Phase 11 Plan 01: Vercel Deploy Config + OG Meta Patch Summary

Lands the deploy-config source-of-truth: `vercel.json` (Vite framework lock, SPA rewrites, split cache strategy), `.gitignore` shielding the Vercel CLI auth-token directory, and a 3-line OG meta domain-typo correction so share cards work the moment the `*.vercel.app` URL goes live.

## What Shipped

Three atomic commits, each addressing one task with one concern. No deviations, no auto-fixes, no checkpoints.

### Task 1 — `vercel.json` at repo root (`feat(11-01): 68babb4`)

Created `vercel.json` (35 lines, LF endings, 2-space indent matching `.editorconfig`). Top-level keys: `$schema`, `framework`, `buildCommand`, `outputDirectory`, `rewrites`, `headers` — exactly the spec from D-03/D-04/D-05/D-06, no extras.

- **Framework lock (D-04):** `"framework": "vite"`, `"buildCommand": "npm run build"`, `"outputDirectory": "dist"` — defensive against future Vercel preset drift.
- **SPA fallback (D-05):** `{ "source": "/(.*)", "destination": "/index.html" }` — every path serves the SPA shell so hash-anchor deep links (`/#contact`, `/#projects`) don't 404 on Vercel edge.
- **Cache headers (D-06):**
  - `/assets/(.*)` → `public, max-age=31536000, immutable` (Vite hashes filenames per content, safe forever)
  - `/index.html` + `/` → `public, max-age=0, must-revalidate` (deploys propagate immediately)
  - `/(.*\.(png|jpg|jpeg|webp|svg|ico|woff2|woff))` → `public, max-age=86400, must-revalidate` (moderate 1-day cache for static media/fonts)

JSON validates: `node -e "require('./vercel.json')"` exits 0. Verifier script confirms all 4 required invariants (framework, buildCommand, outputDirectory, SPA rewrite, assets immutable header, index.html no-cache header).

### Task 2 — `.gitignore` adds `.vercel/` (`chore(11-01): 7ea9140`)

Appended a 2-line block at end of `.gitignore` after the existing hero-photo source block:

```
# Vercel CLI local metadata (project ID + auth token) — never commit
.vercel/
```

Verifier: `grep -v '^#' .gitignore | grep -c '^\.vercel/$'` returns `1`. Existing entries preserved (`/node_modules`, `dist/`, `lighthouse-report*`, `me.jpg`, `me.png`).

T-11-01-01 (info disclosure) mitigated — Plan 11-04 will run `vercel link`, which writes project ID + auth token into `.vercel/`. Without this ignore in place first, those credentials would land in the next commit.

### Task 3 — `index.html` OG/Twitter meta domain typo fix (`fix(11-01): bdc3b17`)

Three substitutions in `index.html` (`replace_all` of the substring `andresmontoyatco.com` → `andresmontoyat.co`):

| Line | Before | After |
|------|--------|-------|
| 23 | `<meta property="og:url" content="https://andresmontoyatco.com/" />` | `<meta property="og:url" content="https://andresmontoyat.co/" />` |
| 24 | `<meta property="og:image" content="https://andresmontoyatco.com/og-image.png" />` | `<meta property="og:image" content="https://andresmontoyat.co/og-image.png" />` |
| 30 | `<meta name="twitter:image" content="https://andresmontoyatco.com/og-image.png" />` | `<meta name="twitter:image" content="https://andresmontoyat.co/og-image.png" />` |

Verifier:
- `grep -c 'andresmontoyatco\.com' index.html` → `0`
- `grep -c 'andresmontoyat\.co' index.html` → `3`

No other markup, scripts, or meta tags touched. Per D-12, no dynamic JS was added to rewrite `og:url` at runtime — OG meta is read by server-side share-bots, JS won't help.

## Verification Status

| Check | Result | Notes |
|-------|--------|-------|
| `vercel.json` exists | PASS | `test -f vercel.json` exits 0 |
| `vercel.json` JSON valid | PASS | `node -e "require('./vercel.json')"` exits 0 |
| `framework === "vite"`, `buildCommand === "npm run build"`, `outputDirectory === "dist"` | PASS | Verifier asserts all three |
| SPA rewrite `/(.*)` → `/index.html` present | PASS | Verifier asserts |
| `/assets/(.*)` immutable header present | PASS | Verifier asserts `max-age=31536000.*immutable` |
| `/index.html` no-cache header present | PASS | Verifier asserts `max-age=0` |
| `.gitignore` contains `.vercel/` exactly once (non-comment) | PASS | grep count = 1 |
| `index.html` typo eradicated | PASS | `grep -c 'andresmontoyatco\.com' index.html` = 0 |
| `index.html` 3 corrected references | PASS | `grep -c 'andresmontoyat\.co' index.html` = 3 |
| `npm run build` smoke test | DEFERRED | Pre-existing rollup native-module env error — see Deferred Issues |

## Threat Surface Status

All three Phase 11 plan-level `mitigate`-disposition threats are addressed by this plan:

| Threat | Disposition | Status |
|--------|-------------|--------|
| T-11-01-01 (`.vercel/` info disclosure) | mitigate | Task 2 — `.vercel/` ignored before Plan 11-04 runs `vercel link` |
| T-11-01-02 (`/index.html` stale-cache tampering) | mitigate | Task 1 — explicit `max-age=0, must-revalidate` on `/index.html` and `/` |
| T-11-01-03 (OG-meta domain spoofing) | mitigate | Task 3 — domain typo eradicated; share-bots see consistent canonical |

No new threat surface introduced.

## Deviations from Plan

None — plan executed exactly as written. No Rules 1/2/3 auto-fixes were needed. No Rule 4 architectural decisions raised. No `tdd="true"` tasks in this plan.

## Deferred Issues

### Pre-existing env failure: `npm run build` cannot run

The plan's `<verification>` block calls `npm run build` as a final smoke check (proving `vercel.json` doesn't break Vite — which it shouldn't, since Vite has zero knowledge of `vercel.json`). The build currently fails with:

```
Error: Cannot find module @rollup/rollup-darwin-arm64.
npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828).
```

**Diagnosis:** Parent repo's `node_modules/@rollup/` contains `rollup-darwin-x64` but not `rollup-darwin-arm64`. The repo lives on iCloud Drive and was previously installed on x86_64 while currently running on arm64. **This is a pre-existing environment issue completely unrelated to Plan 11-01's changes** — `vercel.json` is a Vercel platform config, never read by Vite/Rollup.

**Why deferred, not fixed inline:**
- Out-of-scope per executor scope-boundary rule (pre-existing failure in unrelated infrastructure).
- Fix is `rm -rf node_modules package-lock.json && npm install` — a separate concern from this plan's deploy-config tasks. Touching `package-lock.json` would be a hidden side effect.
- Task acceptance criteria for all 3 tasks verified by direct file inspection independent of build pipeline.

**Logged at:** `.planning/phases/11-vercel-deploy-uat-gate/deferred-items.md` (DEFERRED-11-A)

**Action item for Plan 11-02:** Plan 11-02 runs UAT against `npx serve dist`, which requires a working build. Before 11-02 executes, run the documented npm reinstall, then re-confirm `grep -c 'andresmontoyat\.co' dist/index.html` returns `3` (proving Vite passes our index.html OG fixes through to the built output).

## Commits

| Hash | Type | Message |
|------|------|---------|
| `68babb4` | feat | `feat(11-01): add vercel.json with explicit vite config, SPA rewrites, cache headers` |
| `7ea9140` | chore | `chore(11-01): ignore .vercel/ to prevent CLI auth token leak` |
| `bdc3b17` | fix | `fix(11-01): correct og:url/og:image/twitter:image domain typo` |

## Files Created / Modified

**Created:**
- `vercel.json` — 35 lines, Vercel project config source-of-truth
- `.planning/phases/11-vercel-deploy-uat-gate/deferred-items.md` — DEFERRED-11-A pre-existing env failure

**Modified:**
- `.gitignore` — `+3` lines (comment + `.vercel/` + trailing newline preserved)
- `index.html` — `+3 / -3` (3 substitutions of `andresmontoyatco.com` → `andresmontoyat.co` on lines 23/24/30)

## Self-Check: PASSED

- `vercel.json` exists → FOUND
- `.planning/phases/11-vercel-deploy-uat-gate/deferred-items.md` exists → FOUND
- Commit `68babb4` exists → FOUND
- Commit `7ea9140` exists → FOUND
- Commit `bdc3b17` exists → FOUND
