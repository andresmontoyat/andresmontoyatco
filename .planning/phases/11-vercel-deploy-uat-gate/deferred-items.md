# Phase 11 — Deferred Items

Pre-existing infrastructure issues discovered during execution that are out of scope for the current plan. Tracked here per executor scope-boundary rules; not auto-fixed.

## DEFERRED-11-A — `npm run build` fails with rollup native module error (environment, not code)

**Discovered during:** Plan 11-01 verification (smoke build)
**Date:** 2026-05-25

**Error:**
```
Error: Cannot find module @rollup/rollup-darwin-arm64.
npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828).
Please try `npm i` again after removing both package-lock.json and node_modules directory.
```

**Root cause:** Parent repo's `node_modules/@rollup/` contains `rollup-darwin-x64` but not `rollup-darwin-arm64`. The repo lives on iCloud Drive and was previously installed on x86_64; current machine is arm64. This is the well-known npm optional-dependencies bug, NOT a code issue.

**Impact on plan 11-01:** None. The 3 plan tasks (vercel.json, .gitignore, index.html OG typo) do not touch the build pipeline. `vercel.json` is read by Vercel's edge platform, never by Vite/Rollup. All 3 task acceptance criteria verified by direct file inspection (JSON parse, grep counts).

**Resolution path (NOT in this plan's scope):**
```bash
rm -rf node_modules package-lock.json
npm install
```
Should be done before Plan 11-02 (UAT pre-deploy gate against `npx serve dist`) which actually depends on a working build.

**Why deferred, not fixed inline:**
- Out-of-scope per executor rule (pre-existing failure in unrelated infrastructure)
- A full reinstall touches `package-lock.json` — a separate concern from the deploy-config tasks of 11-01
- 11-01 only changes vercel.json + .gitignore + 3 lines of index.html
- Confirming `vercel.json` does not break the build is a Vite-orthogonal concern (Vite has zero knowledge of vercel.json schema; it sits at repo root for Vercel's build pipeline)

**Verifier note:** When this resolves (during 11-02 prep), re-run `npm run build` to confirm `dist/index.html` contains the 3 corrected OG references (`grep -c 'andresmontoyat\.co' dist/index.html` → 3).
