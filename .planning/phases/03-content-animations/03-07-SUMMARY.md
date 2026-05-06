---
phase: 03-content-animations
plan: "07"
subsystem: seo-assets
tags: [og-image, playwright, seo, social-preview, static-asset]
dependency_graph:
  requires: [03-06]
  provides: [public/og-image.png]
  affects: [index.html og:image meta, twitter:image meta, social link previews]
tech_stack:
  added: [playwright ^1.59.1 (devDependency)]
  patterns: [Playwright screenshot over file:// HTML template for deterministic PNG generation]
key_files:
  created:
    - scripts/og-template.html
    - scripts/generate-og-image.js
    - public/og-image.png
  modified:
    - package.json (added playwright devDep + og:gen npm script)
    - package-lock.json
decisions:
  - "Playwright used over Puppeteer — already in npm ecosystem, simpler API, chromium-only install saves bandwidth"
  - "Google Fonts CDN used in template — generation-time only, not production runtime; avoids bundling ~200KB of fonts for a one-shot tool"
  - "PNG committed to git — 190KB binary is acceptable; avoids requiring CI to run Playwright on every build"
  - "og:gen npm script added — single command for future regeneration without remembering node scripts/ path"
metrics:
  duration_minutes: 4
  completed_date: "2026-05-06"
  tasks_completed: 3
  files_modified: 5
---

# Phase 03 Plan 07: OG Image Generation Summary

**One-liner:** 1200x630 branded social preview card generated via Playwright screenshot of a self-contained HTML template, committed to `public/og-image.png`.

## What Was Built

### Toolchain

Three artifacts form the OG image pipeline:

1. **`scripts/og-template.html`** — A standalone 1200x630 HTML page (no external JS, no build step) that renders the brand card. Loaded by Playwright via `file://` URL at generation time. Uses Google Fonts CDN for Inter 400/800 and JetBrains Mono 400 — only needed during the one-shot rendering, not in production.

2. **`scripts/generate-og-image.js`** — A CommonJS Node script (CJS — not transpiled by Vite) that:
   - Launches Chromium headlessly via Playwright
   - Opens the template at `file://` URL with a 1200x630 viewport
   - Waits 500ms for Google Fonts to settle
   - Screenshots at exact `clip: { x:0, y:0, width:1200, height:630 }`
   - Writes `public/og-image.png`

3. **`public/og-image.png`** — The generated output: 1200x630 PNG, 190KB, 8-bit RGB.

### Visual Content (matches UI-SPEC lines 894–922)

- **Background:** `#0D0D1A` (ink-950) + dot-grid overlay (`radial-gradient` 32px tile, brand at 6% alpha)
- **Left column:** `</cam>` logomark (JetBrains Mono, 18px, `#A0A0C0`), "Carlos Andrés Montoya Tobón" (Inter 800, 52px, `#F0F0FF`), "Solutions Architect &" (Inter 400, 28px, `#A0A0C0`) + "Senior Backend Engineer" (Inter 800, 28px, `#6C63FF`), 80px brand divider, stats row (JetBrains Mono 400, 16px, `#606080`), URL in indigo at bottom-left
- **Right column:** Circular profile photo (`public/images/me.webp`), 320px diameter, brand-muted border + glow

### Runbook

```sh
# One-time setup (already done — playwright in devDependencies)
npm install

# Install Chromium browser (one-shot ~165MB, cached in ~/.cache/ms-playwright)
npx playwright install chromium

# Generate / regenerate the OG image
npm run og:gen
# or directly:
node scripts/generate-og-image.js
```

### Relationship to Plan 03-06

Plan 03-06 wired `index.html` with:
```html
<meta property="og:image" content="https://andresmontoyatco.com/og-image.png">
<meta name="twitter:image" content="https://andresmontoyatco.com/og-image.png">
```

Without `public/og-image.png`, social crawlers would show a broken-image placeholder. This plan closes that gap.

### Output Verification

```
$ file public/og-image.png
public/og-image.png: PNG image data, 1200 x 630, 8-bit/color RGB, non-interlaced

$ ls -lh public/og-image.png
-rw-r--r-- 1 usuario staff 190K May 5 23:12 public/og-image.png
```

File size: 194,315 bytes (190KB) — within the `< 200KB` spec constraint.

## Deviations from Plan

### Auto-approved Checkpoint

**checkpoint:human-verify — Task 3: Install Playwright and generate image**

Auto-mode was active (`AUTO_CFG=true`). The checkpoint was auto-approved because:
- Playwright is a well-known devDependency (no auth required)
- `npm install --save-dev playwright` is a non-destructive scripted operation
- Chromium binary download via `npx playwright install chromium` is deterministic
- Image generation succeeded on first run (190KB, 1200x630 confirmed)

The auto-approval is logged here in lieu of user confirmation.

### Network Retries During Chromium Download

During `npx playwright install chromium`, the download experienced 3 ETIMEDOUT retries before succeeding on the 4th attempt. This is a network condition (iCloud Drive path with spaces, VPN, or CDN intermittency) — not a code issue. The download completed successfully on retry.

## Known Stubs

None. The generated PNG is the final binary asset with real content (profile photo, real copy, real colors). No placeholder content.

## Self-Check: PASSED
