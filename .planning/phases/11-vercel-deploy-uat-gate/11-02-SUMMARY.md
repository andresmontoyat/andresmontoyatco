---
phase: 11-vercel-deploy-uat-gate
plan: 02
subsystem: build-tooling
tags: [lighthouse, npm-scripts, ci-gate, deploy-uat]
requires:
  - "package.json scripts.lighthouse:mobile (existing)"
  - "package.json scripts.lighthouse:check (existing)"
  - "lighthouse npm package (devDependency, already installed)"
provides:
  - "scripts.lighthouse:deployed — deployed-URL Lighthouse mobile audit (asserts $LIGHTHOUSE_TARGET_URL)"
  - "scripts.lighthouse:mobile — env-var-aware: deployed if $LIGHTHOUSE_TARGET_URL set, else localhost preview (backward compat)"
  - "scripts.lighthouse:check — Phase 11 HARD gate validator (Perf ≥ 0.95 / A11y 1.0 / BP 1.0 / SEO 1.0 / target-size 1) with PASS/FAIL per row + final LIGHTHOUSE GATE PASSED/FAILED line"
affects:
  - "Plan 11-05 (Lighthouse HARD gate execution) — will consume lighthouse:deployed + lighthouse:check"
tech-stack:
  added: []
  patterns: ["sh-conditional npm scripts ($LIGHTHOUSE_TARGET_URL branching)", "inline-node CI gate validator"]
key-files:
  created: []
  modified: ["package.json"]
decisions:
  - "Adapted existing lighthouse:mobile (no duplication) per D-09 — env-var-aware sh conditional preserves localhost behavior when LIGHTHOUSE_TARGET_URL unset"
  - "Added explicit lighthouse:deployed convenience script that asserts env var with clear error message — makes HARD-gate invocation discoverable in Phase 11-05"
  - "lighthouse:check now validates 4 Lighthouse categories (added BP + SEO) at tightened thresholds (Perf 0.9 → 0.95, A11y 0.9 → 1.0) — matches ROADMAP Phase 11 SC #3"
  - "Output format reworked: per-row 'PASS|FAIL Category: score (threshold X)' + summary line — readable in CI logs without parsing JSON"
metrics:
  duration_seconds: 121
  tasks: 2
  files_modified: 1
  completed: "2026-05-25T14:18:59Z"
requirements: [DEPLOY-01]
---

# Phase 11 Plan 02: Lighthouse Script Adaptation Summary

Adapted `package.json` Lighthouse scripts so Phase 11 can run Lighthouse mobile against the deployed Vercel URL with HARD-gate thresholds (Perf ≥ 95 / A11y 100 / BP 100 / SEO 100). `lighthouse:mobile` now branches on `$LIGHTHOUSE_TARGET_URL` for backward compat; new `lighthouse:deployed` is the explicit deployed-URL entry point; `lighthouse:check` validates 4 categories with clear pass/fail output and non-zero exit on any miss.

## Tasks Completed

| Task | Name                                                              | Commit    | Files          |
| ---- | ----------------------------------------------------------------- | --------- | -------------- |
| 1    | Adapt lighthouse:mobile + add lighthouse:deployed (deployed mode) | `c532a4e` | `package.json` |
| 2    | Tighten lighthouse:check thresholds for Phase 11 HARD gate        | `33633ef` | `package.json` |

## Final Script Values

### `scripts.lighthouse:mobile` (env-var-aware)

```
if [ -n "$LIGHTHOUSE_TARGET_URL" ]; then npx lighthouse "$LIGHTHOUSE_TARGET_URL" --form-factor=mobile --throttling-method=simulate --output=json --output=html --output-path=./lighthouse-report-mobile --quiet --chrome-flags="--headless --no-sandbox --disable-gpu"; else npm run build && (npx vite preview --port=4173 &) && sleep 3 && npx lighthouse http://localhost:4173 --form-factor=mobile --throttling-method=simulate --output=json --output=html --output-path=./lighthouse-report-mobile --quiet --chrome-flags="--headless --no-sandbox --disable-gpu" && pkill -f 'vite preview' || true; fi
```

Backward compat: no env var = original behavior (build + vite preview + audit localhost:4173).
Deployed-URL mode: env var set = skip preview, audit deployed URL directly.

### `scripts.lighthouse:deployed` (new — explicit deployed-URL entry point)

```
if [ -z "$LIGHTHOUSE_TARGET_URL" ]; then echo 'ERROR: LIGHTHOUSE_TARGET_URL not set. Usage: LIGHTHOUSE_TARGET_URL=https://your-app.vercel.app npm run lighthouse:deployed' >&2; exit 1; fi && npx lighthouse "$LIGHTHOUSE_TARGET_URL" --form-factor=mobile --throttling-method=simulate --output=json --output=html --output-path=./lighthouse-report-mobile --quiet --chrome-flags="--headless --no-sandbox --disable-gpu"
```

Asserts env-var presence with clear usage hint. Writes to the same report file path as `lighthouse:mobile` so `lighthouse:check` consumes the same artifact regardless of which script produced it.

### `scripts.lighthouse:check` (Phase 11 HARD gate validator)

```
node -e "const r = require('./lighthouse-report-mobile.report.json'); const p = r.categories.performance.score; const a = r.categories.accessibility.score; const b = r.categories['best-practices'].score; const s = r.categories.seo.score; const t = r.audits['target-size'].score; const rows = [['Performance', p, 0.95, p >= 0.95], ['Accessibility', a, 1.0, a >= 1.0], ['Best Practices', b, 1.0, b >= 1.0], ['SEO', s, 1.0, s >= 1.0], ['Target-size audit', t, 1, t === 1]]; console.log('Phase 11 HARD gate check (mobile):'); rows.forEach(([n,v,th,ok]) => console.log((ok?'PASS':'FAIL') + ' ' + n + ': ' + v + ' (threshold ' + th + ')')); if (rows.some(r => !r[3])) { console.error('LIGHTHOUSE GATE FAILED'); process.exit(1); } console.log('LIGHTHOUSE GATE PASSED');"
```

Threshold map:

| Category          | Was         | Now         | Source                                |
| ----------------- | ----------- | ----------- | ------------------------------------- |
| Performance       | `>= 0.9`    | `>= 0.95`   | D-09 + ROADMAP Phase 11 SC #3         |
| Accessibility     | `>= 0.9`    | `>= 1.0`    | D-09 + ROADMAP Phase 11 SC #3         |
| Best Practices    | unchecked   | `>= 1.0`    | D-09 + ROADMAP Phase 11 SC #3 (added) |
| SEO               | unchecked   | `>= 1.0`    | D-09 + ROADMAP Phase 11 SC #3 (added) |
| Target-size audit | `=== 1`     | `=== 1`     | preserved                             |

## Smoke Test Output

### Smoke 1 — `lighthouse:deployed` clean error when env var unset

```
$ unset LIGHTHOUSE_TARGET_URL && npm run lighthouse:deployed
> andresmontoyatco@0.1.0 lighthouse:deployed
> if [ -z "$LIGHTHOUSE_TARGET_URL" ]; then echo 'ERROR: ...' >&2; exit 1; ...

ERROR: LIGHTHOUSE_TARGET_URL not set. Usage: LIGHTHOUSE_TARGET_URL=https://your-app.vercel.app npm run lighthouse:deployed
$ echo $?
1
```

Result: PASS — fails fast, exits 1, clear usage instruction.

### Smoke 2 — `lighthouse:check` PASS at gate thresholds

Synthetic report: `{ perf: 0.95, a11y: 1, bp: 1, seo: 1, target-size: 1 }`.

```
Phase 11 HARD gate check (mobile):
PASS Performance: 0.95 (threshold 0.95)
PASS Accessibility: 1 (threshold 1)
PASS Best Practices: 1 (threshold 1)
PASS SEO: 1 (threshold 1)
PASS Target-size audit: 1 (threshold 1)
LIGHTHOUSE GATE PASSED
```

Exit: 0. Result: PASS.

### Smoke 3 — `lighthouse:check` FAIL when any category misses

Synthetic report: `{ perf: 0.94, a11y: 1, bp: 1, seo: 0.98, target-size: 1 }`.

```
Phase 11 HARD gate check (mobile):
FAIL Performance: 0.94 (threshold 0.95)
PASS Accessibility: 1 (threshold 1)
PASS Best Practices: 1 (threshold 1)
FAIL SEO: 0.98 (threshold 1)
PASS Target-size audit: 1 (threshold 1)
LIGHTHOUSE GATE FAILED
```

Exit: 1. Result: PASS — CI fail-fast behavior preserved; every failing category surfaces with its actual score.

## Acceptance Criteria — All Met

### Task 1

- [x] `package.json` is valid JSON (`node -e "require('./package.json')"` exits 0)
- [x] `scripts.lighthouse:mobile` contains `LIGHTHOUSE_TARGET_URL` (env-var branch added)
- [x] `scripts.lighthouse:mobile` still contains `npm run build` (localhost fallback preserved)
- [x] `scripts.lighthouse:deployed` exists
- [x] `scripts.lighthouse:deployed` contains `LIGHTHOUSE_TARGET_URL`
- [x] `scripts.lighthouse:deployed` contains `form-factor=mobile` and `output-path=./lighthouse-report-mobile`
- [x] All other scripts present and unchanged: `dev, build, build:analyze, lighthouse:local, lighthouse:check, preview, lint, og:gen, hero:process`
- [x] `dependencies`, `devDependencies`, `browserslist` byte-identical (diff scope verified)

### Task 2

- [x] `scripts.lighthouse:check` exists
- [x] Contains `0.95` (Performance threshold)
- [x] Contains `best-practices` (BP category validated)
- [x] Contains `categories.seo` (SEO category validated)
- [x] Contains `LIGHTHOUSE GATE PASSED` (success marker)
- [x] Contains `LIGHTHOUSE GATE FAILED` (failure marker)
- [x] Exits non-zero on any single category miss (Smoke 3 confirms)
- [x] `package.json` remains valid JSON

## Diff Scope

Two atomic commits, each touching only the relevant `scripts.*` entries:

- `c532a4e`: `+2 -1` (mobile rewritten, deployed added)
- `33633ef`: `+1 -1` (check rewritten)

**Confirmed unchanged:** `dependencies`, `devDependencies`, `browserslist`, `name`, `version`, `private`, and all other scripts (`dev`, `build`, `build:analyze`, `lighthouse:local`, `preview`, `lint`, `og:gen`, `hero:process`).

Final `scripts` keyset (in order):
```
dev, build, build:analyze, lighthouse:local, lighthouse:mobile, lighthouse:deployed, lighthouse:check, preview, lint, og:gen, hero:process
```

## Deviations from Plan

None — plan executed exactly as written. Both task action blocks specified the exact string values to write; no Rule 1/2/3 fixes triggered.

## Threat Mitigation Recap

| Threat ID    | Mitigation status                                                                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-11-02-01   | Mitigated — `"$LIGHTHOUSE_TARGET_URL"` is double-quoted in both `lighthouse:mobile` and `lighthouse:deployed`. Shell metacharacter injection blocked at the npm-script boundary.        |
| T-11-02-02   | Accepted (per plan) — local filesystem trust boundary; out of scope.                                                                                                                    |
| T-11-02-03   | Accepted (per plan) — `--headless --no-sandbox --disable-gpu` flags preserved.                                                                                                          |
| T-11-02-04   | Accepted (per plan) — public `*.vercel.app` URL audited; report contains no secrets.                                                                                                    |

No threat-model flags raised. No new attack surface added; changes are confined to developer-controlled build tooling.

## Self-Check: PASSED

- `package.json` modified — verified `git diff --stat` shows only `package.json` changed across both commits
- Commit `c532a4e` exists — `git log` confirmed
- Commit `33633ef` exists — `git log` confirmed
- `scripts.lighthouse:deployed` reachable via `npm run lighthouse:deployed` — Smoke 1 ran the script and emitted the expected error
- `scripts.lighthouse:check` validates synthetic PASS + synthetic FAIL — Smokes 2 & 3 ran the script with both outcomes
- No working-tree leftovers — `git status --short` clean after synthetic report cleanup
