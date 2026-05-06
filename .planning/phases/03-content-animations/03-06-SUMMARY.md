---
phase: 03-content-animations
plan: "06"
subsystem: seo
tags: [open-graph, twitter-card, social-sharing, i18n, language-context]
dependency_graph:
  requires: []
  provides: [SEO-01, SEO-02-verified]
  affects: [index.html, src/i18n/LanguageContext.js]
tech_stack:
  added: []
  patterns: [og-meta-tags, twitter-card, setMeta-helper, early-return-guard]
key_files:
  created: []
  modified:
    - index.html
    - src/i18n/LanguageContext.js
decisions:
  - "Static OG fallbacks in index.html default to EN copy so non-JS crawlers see correct content before JS hydration"
  - "setMeta helper is scoped inside the useEffect (not module-level) to keep API surface clean and avoid unnecessary exports"
  - "Early-return guard pattern (if (!meta) return) replaces if (meta) {...} block — equivalent behavior, cleaner nesting"
  - "GA G-4TZJGR3MXR script verified intact at lines 21/26 in index.html — no edit required (D-18 confirmed)"
  - "og-image.png URL referenced in index.html but file produced by Plan 03-07 (parallel) — absence does not break build"
metrics:
  duration_minutes: 5
  completed_date: "2026-05-06"
  tasks_completed: 2
  files_modified: 2
---

# Phase 03 Plan 06: Open Graph + Twitter Card Meta Tags Summary

**One-liner:** Static OG/Twitter meta tags in index.html with bilingual runtime sync via LanguageContext setMeta helper.

## What Was Built

### Task 1: Open Graph + Twitter card meta tags in index.html (commit ff9377b)

Added 11 meta tags to the `<head>` of `index.html` immediately before `<link rel="apple-touch-icon">`:

**Static (crawler-facing, never change at runtime):**
- `og:type` = `website`
- `og:url` = `https://andresmontoyatco.com/`
- `og:image` = `https://andresmontoyatco.com/og-image.png`
- `og:image:width` = `1200`
- `og:image:height` = `630`
- `twitter:card` = `summary_large_image`
- `twitter:image` = `https://andresmontoyatco.com/og-image.png`

**Dynamic (JS updates on language change):**
- `og:title` — defaults to EN title
- `og:description` — defaults to EN description
- `twitter:title` — defaults to EN title
- `twitter:description` — defaults to EN description

**GA verification (D-18):** `grep -c "G-4TZJGR3MXR" index.html` returns 2 — unchanged.

### Task 2: LanguageContext.js useEffect extended to sync OG/Twitter meta (commit f5d9eb9)

Extended the existing `[lang]` `useEffect` in `src/i18n/LanguageContext.js` to include a `setMeta` helper that updates the 4 dynamic meta tags on every language change:

```js
const setMeta = (selector, content) => {
  const el = document.querySelector(selector)
  if (el && content) el.setAttribute('content', content)
}
setMeta('meta[property="og:title"]', meta.title)
setMeta('meta[property="og:description"]', meta.description)
setMeta('meta[name="twitter:title"]', meta.title)
setMeta('meta[name="twitter:description"]', meta.description)
```

- Reuses `translations[lang].meta.title` and `translations[lang].meta.description` — no new translation keys added.
- `setMeta` is idempotent: silently no-ops if the tag is absent from the DOM.
- All existing behavior preserved: `document.documentElement.lang`, `document.title`, `meta[name="description"]`.
- Effect still keyed on `[lang]` only — no new dependencies.

## Deviations from Plan

None — plan executed exactly as written.

## Relationship to Plan 03-07

`index.html` now references `/og-image.png` (served from `https://andresmontoyatco.com/og-image.png`) in both `og:image` and `twitter:image`. This file is produced by Plan 03-07 running in parallel. Its absence does not break the build — only the actual social card preview image will be missing until 03-07 completes.

## Known Stubs

None — all meta tags wire to real production URL and real translation strings.

## Self-Check: PASSED

- FOUND: index.html
- FOUND: src/i18n/LanguageContext.js
- FOUND: .planning/phases/03-content-animations/03-06-SUMMARY.md
- FOUND commit: ff9377b (Task 1 — index.html OG tags)
- FOUND commit: f5d9eb9 (Task 2 — LanguageContext setMeta)
