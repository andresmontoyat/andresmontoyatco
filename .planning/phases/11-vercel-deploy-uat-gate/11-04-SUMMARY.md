---
phase: 11-vercel-deploy-uat-gate
plan: 04
subsystem: deploy
tags: [vercel, production-deploy, spa-fallback, cache-headers, auto-deploy]
requires:
  - "Plan 11-01 (vercel.json + .vercel/ gitignored)"
  - "Plan 11-02 (lighthouse scripts)"
  - "Plan 11-03 (local UAT 8/8 PASS gate)"
  - "Vercel CLI authenticated (vercel login)"
provides:
  - "Production URL https://andresmontoyatco.vercel.app (input for Plan 11-05 Lighthouse HARD gate)"
  - ".planning/phases/11-vercel-deploy-uat-gate/11-DEPLOY-LOG.md — deploy audit trail"
  - "Vercel git integration enabled — push to main auto-deploys"
affects:
  - "Plan 11-05 (Lighthouse against deployed URL) — UNBLOCKED; target = https://andresmontoyatco.vercel.app"
  - "Phase 12 (custom domain) — Vercel project stable + linked; DNS cutover can target this project"
tech-stack:
  added: []
  patterns: ["vercel.json-driven config (D-02: dashboard not source of truth)", "path-to-regexp header source (non-capturing groups only)"]
key-files:
  created:
    - ".planning/phases/11-vercel-deploy-uat-gate/11-DEPLOY-LOG.md"
    - ".vercel/repo.json (local, gitignored)"
  modified:
    - "vercel.json (header source pattern fix)"
decisions:
  - "Vercel link created .vercel/repo.json (repo-level link, newer CLI) instead of project.json — projectId + orgId present, functionally equivalent; gitignored per 11-01"
  - "Project name andresmontoyatco under scope carlos-andrs-montoya-tobns-projects — slug visible in *.vercel.app URL until Phase 12 custom domain"
  - "Orchestrator ran vercel --prod and curl verification directly (non-interactive once linked) instead of full human-checkpoint flow — user did login, link, and visual smoke"
metrics:
  tasks: 5
  files_modified: 1
  files_created: 2
  completed: "2026-05-28T15:45:00Z"
requirements: [DEPLOY-01]
---

# Phase 11 Plan 04: Vercel Production Deploy Summary

Linked the working copy to a Vercel project and completed the first production deploy. Site is live at **https://andresmontoyatco.vercel.app**. SPA fallback and cache headers from `vercel.json` are enforced at the edge (curl-verified). Git integration is connected, and a push to `main` auto-deployed successfully. Plan 11-05 (Lighthouse HARD gate against the deployed URL) is unblocked.

## Tasks Completed

| Task | Name                                          | Result                                                     |
| ---- | --------------------------------------------- | ---------------------------------------------------------- |
| 1    | Authenticate Vercel CLI (`vercel login`)      | `vercel whoami` → andresmontoyat                           |
| 2    | Link working copy (`vercel link`)             | `.vercel/repo.json` written (prj_43KnY0…, team_eI7uDTRD…); gitignored |
| 3    | First production deploy (`vercel --prod`)     | Live after 1 fix; dpl_ES8AwCTP…; visual smoke PASS         |
| 4    | curl SPA + cache verification (automated)     | All 4 checks PASS                                          |
| 5    | Auto-deploy on push to main + audit log       | Verified — deployment 5vdvczctv Ready; 11-DEPLOY-LOG.md committed |

## Deploy Hiccup (resolved)

First `vercel --prod` failed:

```
Header at index 3 has invalid `source` pattern "/(.*\.(png|jpg|jpeg|webp|svg|ico|woff2|woff))".
```

Root cause: Vercel's path-to-regexp forbids a **nested capturing group** inside a header `source`. The inner `(png|…)` was capturing. Fix (commit `bc2fe34`): non-capturing `(?:png|…)`. Re-deploy succeeded; favicon.ico confirmed live with `Cache-Control: max-age=86400`.

## curl Verification (Task 4) — all PASS

| Check                      | Expected                                       | Result |
| -------------------------- | ---------------------------------------------- | ------ |
| `/` root                   | 200 · `max-age=0, must-revalidate` · text/html | PASS   |
| deep-link path (SPA)       | 200 · text/html (rewrite to index.html)        | PASS   |
| `/assets/*.js` hashed      | 200 · `max-age=31536000, immutable`            | PASS   |
| `/favicon.ico`             | 200 · `max-age=86400`                          | PASS   |

## Production Facts

- **Production URL:** https://andresmontoyatco.vercel.app
- First deploy ID: `dpl_ES8AwCTPgyLeqR2ivsnk1jSscZe6`
- Auto-deploy (push 46c628d): deployment `5vdvczctv` — Ready, 10s build
- Git integration: `andresmontoyat/andresmontoyatco`, production branch main

## Acceptance Criteria — All Met

- [x] Vercel CLI authenticated
- [x] `.vercel/` written + gitignored (`.gitignore:38`)
- [x] First production deploy at stable `*.vercel.app` URL
- [x] Visual smoke parity vs local UAT (11-03) confirmed
- [x] curl: SPA rewrite on deep links, `/assets/*` immutable, `/` no-cache
- [x] Git integration enabled; push to main auto-deploys (verified)
- [x] `11-DEPLOY-LOG.md` committed
- [x] Production URL captured for Plan 11-05

## Deviations from Plan

- Tasks 1-3 + 5 specified as `checkpoint:human-action`. In practice: user did login/link/smoke; orchestrator ran `vercel --prod`, `vercel git connect`, and curl checks directly (non-interactive once linked) — faster, same outcome.
- Plan expected `.vercel/project.json`; got `.vercel/repo.json` (newer repo-link format). Same IDs, no impact.
- One unplanned fix: vercel.json header pattern (`bc2fe34`) — required to deploy at all; in-scope per Task 4 "fix vercel.json + re-deploy" guidance.

## Followups

- **Phase 12 unblocked structurally** but needs DNS registrar credentials (STATE blocker).
- **D-12 accepted:** og:url/og:image point to andresmontoyat.co (not live) — share-card preview on *.vercel.app mismatches until Phase 12. Do not rely on LinkedIn/Twitter card preview for the Vercel URL.
- **Plan 11-05 next:** `LIGHTHOUSE_TARGET_URL=https://andresmontoyatco.vercel.app npm run lighthouse:deployed && npm run lighthouse:check` — HARD gate Perf≥95/A11y100/BP100/SEO100.

## Self-Check: PASSED

- Production URL returns HTTP 200 (curl Task 4)
- `11-DEPLOY-LOG.md` exists with production_url + auto_deploy_verified: true + DEPLOY COMPLETE verdict
- `.vercel/` gitignored (`git check-ignore` → `.gitignore:38`)
- Commits exist: `bc2fe34` (vercel.json fix), `46c628d` (deploy log)
