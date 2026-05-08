---
phase: 05-theme-tech-debt
plan: 01
subsystem: i18n, og-image, html
tags: [tech-debt, cleanup, translations, og-image, ga]
dependency_graph:
  requires: []
  provides: [clean-translations, self-hosted-fonts, valid-ga-placement]
  affects: [src/i18n/translations.js, scripts/og-template.html, public/og-image.png, index.html]
tech_stack:
  added: []
  patterns: [self-hosted @font-face via @fontsource]
key_files:
  modified:
    - src/i18n/translations.js
    - scripts/og-template.html
    - public/og-image.png
    - index.html
decisions:
  - Use relative path ../node_modules/@fontsource/inter/files/ for woff2 in og-template (Puppeteer resolves correctly without --allow-file-access-from-files)
metrics:
  duration: ~8 minutes
  completed: 2026-05-05
  tasks_completed: 3
  files_modified: 4
---

# Phase 05 Plan 01: Tech Debt Cleanup (DEBT-01/02/03) Summary

Remove orphaned translation keys, eliminate Google Fonts CDN dependency from OG image generator, and move GA script into valid HTML head position.

## Tasks Completed

### Task 1: Remove orphaned hero.cta2 and contact.loc translation keys (DEBT-01)

**Commit:** 00cfe81

Lines removed from `src/i18n/translations.js`:
- Line 23 (en.hero.cta2): `cta2: 'Download CV'`
- Line 120 (en.contact.loc): `loc: 'Location'`
- Line 149 (es.hero.cta2): `cta2: 'Descargar CV'`
- Line 246 (es.contact.loc): `loc: 'Ubicación'`

Preserved: `en.about.loc` (line 37) and `es.about.loc` (line 161) — still used by About.js.

Verification:
- `grep -c "cta2" translations.js` → 0
- `grep -n "loc:" translations.js` → 2 lines, both in about namespace

### Task 2: Migrate og-template.html to self-hosted @fontsource/inter (DEBT-02)

**Commit:** c0f32f5

Replaced Google Fonts CDN block (3 lines) with `<style>` block containing 5 `@font-face` declarations for weights 400/500/600/700/800, referencing `../node_modules/@fontsource/inter/files/inter-latin-{weight}-normal.woff2`.

OG image size: 194315 bytes (before) → 194934 bytes (after) — delta +619 bytes (0.3%), within tolerance.

Verification:
- `grep -c "fonts.googleapis.com" scripts/og-template.html` → 0
- `grep -c "@font-face" scripts/og-template.html` → 5
- `npm run og:gen` → exits 0, writes public/og-image.png

### Task 3: Move Google Analytics script into head (DEBT-03)

**Commit:** be0143e

Moved GA comment + 2 script tags from after `</body>` (invalid HTML per spec) to inside `<head>` before `</head>`. React entry script `<script type="module" src="/src/index.js">` preserved at end of body.

Verification:
- `awk '/<\/head>/{exit} {print}' index.html | grep -c "G-4TZJGR3MXR"` → 2
- `awk '/<\/body>/{found=1; next} found' index.html | grep -c "googletagmanager"` → 0

## Final Verification

- `npm run build` → exits 0 (built in 1.06s)
- `grep -rn "cta2" src/i18n/translations.js` → no output
- `grep -c "fonts.googleapis.com" scripts/og-template.html` → 0
- GA tags confirmed inside head, nothing after body close

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- src/i18n/translations.js — modified, cta2=0, contact.loc=0, about.loc=2
- scripts/og-template.html — modified, googleapis=0, @font-face=5
- public/og-image.png — regenerated 194934 bytes
- index.html — GA in head, clean body close
- Commits: 00cfe81, c0f32f5, be0143e — all present
</content>
</invoke>