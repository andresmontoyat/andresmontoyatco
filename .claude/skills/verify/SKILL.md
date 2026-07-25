---
name: verify
description: Verify portfolio changes end-to-end by driving the PRODUCTION Astro build under Playwright + Lighthouse. Use before committing nontrivial src changes or QA'ing the v5 Astro site.
---

# Verify — Carlos Montoya portfolio (Astro SSG + React islands)

Runtime observation recipe. Drive the **production build**, not `astro dev`.

## Critical gotcha — never QA on `astro dev`

`astro dev` crashes every React island with `TypeError: _jsxDEV is not a function`
(dev JSX-runtime config). The **production** build is clean. Always:

```bash
npm run build                                   # → dist/ (4 pages: /,/en,/es,404)
lsof -ti:4321 | xargs kill -9 2>/dev/null       # free the port first
npx astro preview --port=4321 &                 # serves dist/ (prod, hashed /_astro/*)
until curl -sf http://localhost:4321/en/ -o /dev/null; do sleep 1; done
```

Confirm you're on prod, not a stale dev server: `curl -s localhost:4321/en/ | rg -c '/src/|_jsxDEV'` must be 0.

## Drive it (Playwright, headless)

`playwright` won't resolve from `$CLAUDE_JOB_DIR/tmp` — import by absolute path,
and it's CJS so default-import then destructure:

```js
import pw from '/abs/path/to/repo/node_modules/playwright/index.js'
const { chromium } = pw
```

Load with `{ waitUntil: 'networkidle' }` then `waitForTimeout(1500)` — islands are
`client:load`/`client:visible` and settle after paint.

What to check (all should PASS on prod): 7 sections (`#hero #about #skills
#experience #projects #claude-code #contact` — note `#claude-code`, not `#claude`),
footer, head JSON-LD Person, nav 6 links, theme toggle flips `document.documentElement.dataset.theme`
(button aria-label `Switch to (light|dark) mode`), Hero CV dropdown `details.details-dismiss`
opens on summary + closes on Escape, Experience filter chip → `[data-dim="true"]`
count (use a PARTIAL chip like "Spring Boot" — "Java" is on all 11 roles → dims nothing),
CareerGame Play button, `/es` renders Spanish + `html lang=es`.

Capture `page.on('pageerror')` + console errors — **zero expected**. React #418/#423 =
a hydration mismatch regression (see commit 93450d3: SSR-safe portal + ref-`.inert`).

## Lighthouse (local proxy for the DEPLOY-04 gate)

```bash
npx lighthouse http://localhost:4321/en/ --form-factor=mobile --throttling-method=simulate \
  --output=json --output-path=/tmp/lh.json --quiet \
  --chrome-flags="--headless --no-sandbox --disable-gpu"
# gate thresholds: Perf ≥0.95, A11y/BP/SEO = 1.0
# inspect a failing category: r.categories[cat].auditRefs → r.audits[id].score<1
```

Local ≠ official gate: `/` redirect is Vercel Edge Middleware (inert locally), and the
real DEPLOY-04 runs on the deployed `/`,`/en`,`/es`. Local is a strong regression proxy.

Gotchas: macOS has no `timeout` (use `gtimeout` or none). `astro preview` default port is 4321.
