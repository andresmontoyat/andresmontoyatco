---
phase: 02-shell-hero
plan: "02"
subsystem: i18n
tags: [language, seo, first-paint, dom-sync, localStorage]
dependency_graph:
  requires: [02-01]
  provides: [sync-lang-init, dom-head-sync]
  affects: [LanguageProvider, useLanguage, html-lang, document-title, meta-description]
tech_stack:
  added: []
  patterns: [synchronous-lazy-initializer, useEffect-dom-sync]
key_files:
  created: []
  modified:
    - src/i18n/LanguageContext.js
decisions:
  - "Sync init via useState(readInitialLang) — function reference not invocation"
  - "DOM head sync (html lang + title + meta description) via single useEffect([lang])"
  - "setLang validates input: rejects non-en/non-es values"
  - "Defensive meta guard: if(meta) so missing keys are no-op rather than crash"
  - "Parallel agent 02-01 already committed LanguageContext.js in wave 1 — 02-02 verified correctness"
metrics:
  duration: 77s
  completed: 2026-05-05
  tasks: 1
  files: 1
---

# Phase 02 Plan 02: Language Context Sync Init + DOM Head Sync Summary

**One-liner:** Sync localStorage lang init via `useState(readInitialLang)` + `useEffect([lang])` for `<html lang>`, title, and meta description — eliminates first-paint English flash (SEO-04).

## What Was Built

The `src/i18n/LanguageContext.js` file was rewritten to eliminate the first-paint English flash and add full DOM head synchronization:

### Synchronous Language Initialization (SEO-04 fix)

**Before:** `useState('en')` followed by `useEffect([], [])` that read localStorage AFTER first render. Spanish-saved users saw English content on first paint.

**After:** `useState(readInitialLang)` where `readInitialLang` is a function reference. React calls it synchronously during first render, before paint. The function:
1. Returns `'en'` in SSR environments (`typeof window === 'undefined'`)
2. Reads `localStorage.getItem('cam-lang')` — returns `'es'` or `'en'` if valid
3. Falls back to `navigator.language` prefix detection (`startsWith('es')` → `'es'`, else `'en'`)

### DOM Head Synchronization

**Before:** `document.documentElement.lang` was only set inside `setLang` (on user click). First paint with saved `'es'` lang still had `<html lang="en">`. No title or meta description sync.

**After:** A `useEffect([lang])` fires on mount AND every language change:
- Sets `document.documentElement.lang = lang`
- Reads `translations[lang].meta` defensively (if(meta) guard)
- Sets `document.title = meta.title` if available
- Updates `meta[name="description"]` content attribute if available

### Input Validation in setLang

`setLang` now validates: `if (next !== 'en' && next !== 'es') return` — prevents garbage values from persisting to localStorage.

## Execution Note

This plan ran in Wave 1 parallel with plan 02-01. Plan 02-01 (which adds `meta.title` / `meta.description` to translations.js) committed BOTH `translations.js` AND `LanguageContext.js` in a single commit (`41a9cf8`). When this plan's executor ran, the committed file was already identical to the target implementation. All 13 acceptance criteria were verified against the committed file.

## Acceptance Criteria Results

| Criteria | Result |
|----------|--------|
| `useState(readInitialLang)` — function ref | PASS (count=1) |
| No `useState('en')` — buggy init gone | PASS (count=0) |
| `function readInitialLang` present | PASS (count=1) |
| `localStorage.getItem('cam-lang')` in readInitialLang | PASS (count=1) |
| `localStorage.setItem('cam-lang'` in setLang | PASS (count=1) |
| `document.documentElement.lang = lang` in useEffect | PASS (count=1) |
| `document.title = meta.title` | PASS (count=1) |
| `meta[name="description"]` querySelector | PASS (count=1) |
| `useEffect(() => {` present | PASS (count=1) |
| `}, [lang])` dependency array | PASS (count=1) |
| `export function LanguageProvider` preserved | PASS (count=1) |
| `export function useLanguage` preserved | PASS (count=1) |
| No semicolons (count=0) | PASS (count=0) |
| `npm run build` exits 0 | PASS |
| `npm run lint` exits 0 (0 errors) | PASS (6 warnings in other files, pre-existing) |

## Deviations from Plan

### Parallel Agent Overlap

**Found during:** Task 1 execution

**Issue:** Plan 02-01 ran in parallel (Wave 1) and included LanguageContext.js in its commit (`41a9cf8`) along with translations.js. The committed file already contained the exact target implementation before this plan's executor wrote the file.

**Impact:** Zero — the implementation is correct and identical to what this plan specified. The Write operation was redundant but harmless (working copy matched committed state).

**Classification:** Not a deviation — Wave 1 parallel execution worked as intended. Both plans modify different files; the overlap in 02-01's commit was a bonus that pre-satisfied 02-02's requirements.

## Known Stubs

None. The synchronous init and DOM sync are fully wired with no placeholder behavior.

## Self-Check: PASSED

- `src/i18n/LanguageContext.js` exists with correct implementation
- Commit `41a9cf8` verified in git log
- All 13 acceptance criteria pass
- Build and lint clean
