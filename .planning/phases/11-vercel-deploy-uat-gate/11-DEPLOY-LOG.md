---
phase: 11-vercel-deploy-uat-gate
plan: 11-04
deployed_at: 2026-05-28T10:38:00-05:00
vercel_project_name: andresmontoyatco
vercel_org_scope: carlos-andrs-montoya-tobns-projects
production_url: https://andresmontoyatco.vercel.app
first_deploy_id: dpl_ES8AwCTPgyLeqR2ivsnk1jSscZe6
first_deploy_specific_url: https://andresmontoyatco-1krb8280k-carlos-andrs-montoya-tobns-projects.vercel.app
auto_deploy_verified: true
auto_deploy_test_commit_sha: 46c628d
---

# Phase 11-04 Vercel Deploy Log

## Project Link
- Project name: andresmontoyatco
- Scope: carlos-andrs-montoya-tobns-projects (team_eI7uDTRDxzJC4m5d2cKk3lSt)
- Project ID: prj_43KnY0... (from .vercel/repo.json — kept local, gitignored)
- Link format: repo-level (`.vercel/repo.json`, newer Vercel CLI) — projectId + orgId present, functionally equivalent to project.json

## First Production Deploy
- Deploy ID: dpl_ES8AwCTPgyLeqR2ivsnk1jSscZe6
- Production URL (aliased/canonical): https://andresmontoyatco.vercel.app
- Deploy-specific URL: https://andresmontoyatco-1krb8280k-carlos-andrs-montoya-tobns-projects.vercel.app
- Inspector: https://vercel.com/carlos-andrs-montoya-tobns-projects/andresmontoyatco/ES8AwCTPgyLeqR2ivsnk1jSscZe6
- readyState: READY · target: production
- Build: `npm run build` on Vercel infra — "Build Completed in /vercel/output [20s]", vite "built in 2.92s"

### Deploy hiccup (resolved)
First `vercel --prod` failed: `Header at index 3 has invalid source pattern "/(.*\.(png|jpg|jpeg|webp|svg|ico|woff2|woff))"`.
Root cause: Vercel path-to-regexp forbids a **nested capturing group** inside a header `source`. The inner `(png|...)` was a capturing group inside the outer custom param.
Fix (commit `bc2fe34`): changed inner group to non-capturing `(?:png|...)`. Re-deploy succeeded.

## Smoke-Test (Task 3) — visual, browser
- Hero photo loads (full-bleed, face visible): pass
- Theme toggle works (all sections flip): pass
- LangPill EN/ES: pass
- Claude section visible + CTAs scroll: pass
- Overall parity vs local UAT (11-03): pass — no regression vs local prod build (Carlos, Chrome, 2026-05-28)

## curl Header Verification (Task 4) — all PASS

### Root path (/) — expect no-cache
```
HTTP/2 200
cache-control: public, max-age=0, must-revalidate
content-type: text/html; charset=utf-8
```

### Deep-link path (/some-random-deep-path) — expect 200 + text/html (SPA fallback)
```
HTTP/2 200
content-type: text/html; charset=utf-8
```

### Hashed asset bundle — expect immutable long-cache
Sampled bundle: `/assets/index-BZsS1VBL.js`
```
HTTP/2 200
cache-control: public, max-age=31536000, immutable
```

### favicon.ico — expect 1-day cache (validates fixed index-3 header rule)
```
HTTP/2 200
cache-control: public, max-age=86400, must-revalidate
content-type: image/vnd.microsoft.icon
```

## Auto-Deploy on Push to Main
- Git integration enabled: yes — `andresmontoyat/andresmontoyatco` connected (verified via `vercel git connect`: "already connected to your project")
- Production branch: main
- Test commit SHA: 46c628d (deploy-log commit pushed to main)
- Auto-deploy deployment: https://andresmontoyatco-5vdvczctv-carlos-andrs-montoya-tobns-projects.vercel.app
- Vercel "Building" deployment seen within 30s: yes (appeared after push)
- Reached "Ready" state: yes — Production, 10s build, alias andresmontoyatco.vercel.app now points to it

## Closure
**Verdict:** [DEPLOY COMPLETE — Plan 11-05 (Lighthouse against deployed URL) unblocked]

Production live: https://andresmontoyatco.vercel.app
All Task acceptance criteria met: link (Task 2) · first deploy (Task 3) · curl SPA+cache (Task 4 all PASS) · visual smoke (Task 3, pass) · auto-deploy on push to main (Task 5, verified via deployment 5vdvczctv).
Note (D-12, accepted): og:url/og:image still point to andresmontoyat.co (not live until Phase 12) — share-card preview on the *.vercel.app URL will mismatch until custom domain lands.
