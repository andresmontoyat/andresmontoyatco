# Lighthouse Audit Report — Phase 4

## Run 1 — Baseline (post Plans 04-01..04-05)

Date: 2026-05-08T02:44:26Z
Command: `npx lighthouse http://localhost:4173 --form-factor=mobile --throttling-method=simulate --output=json --output=html --output-path=./lighthouse-report-mobile`

> Note: Lighthouse 12 changed `--preset=mobile` to `--form-factor=mobile`. The `tap-targets` audit was renamed `target-size` in LH 12. Scripts updated accordingly.

| Category | Score | Threshold | Pass? |
|----------|-------|-----------|-------|
| Performance | 0.98 (98) | 0.90 | YES |
| Accessibility | 1.00 (100) | 0.90 | YES |
| Best Practices | 1.00 (100) | informational | — |
| SEO | 1.00 (100) | informational | — |

## Audit Highlights (Run 1)

| Audit | Score | Value | Status |
|-------|-------|-------|--------|
| target-size (tap-targets) | 1.0 | pass | GREEN |
| largest-contentful-paint | 0.97 | 2.0 s | GREEN |
| total-blocking-time | 0.98 | 100 ms | GREEN |
| cumulative-layout-shift | 1.0 | 0.014 | GREEN |
| first-contentful-paint | 0.89 | 1.8 s | GREEN |
| speed-index | — | 1.8 s | GREEN |

## Informational Opportunities (not blocking score)

| Audit | Display | Note |
|-------|---------|------|
| render-blocking-resources | Est savings 600 ms | Vite main CSS bundle — expected; inline CSS would require significant Vite config change, not worth it at score 98 |
| unused-javascript | Est savings 64 KiB | Legacy JS + unused chunks — informational, score 0.50 but does not affect category score |
| legacy-javascript | 0.50 | Some transforms for older browsers in browserslist |

## Gate Results

- Performance >= 0.90: **PASS** (0.98)
- Accessibility >= 0.90: **PASS** (1.00)
- target-size = 1: **PASS**

## Iterations

None required — all thresholds passed on first run.

## Auto-decisions (Auto-mode active)

- Auto-approved Task 3 checkpoint:human-verify — all thresholds exceeded on run 1 (Performance 98, A11y 100, target-size pass). No plateau, no human review needed.
