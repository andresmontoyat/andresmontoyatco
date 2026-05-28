---
phase: 11-vercel-deploy-uat-gate
plan: 11-03
target: local production build (`dist/` served by `npm run preview`)
server_url: http://localhost:4174/
tester: Carlos
started: 2026-05-27T14:34:00-05:00
total_tests: 8
passed: 8
failed: 0
skipped: 0
pending: 0
---

# Phase 11 Local UAT — Tests 3-10 against `dist/`

## Setup
- Build: `npm run build` — exit code: 0 (fresh build 2026-05-27, 747ms, no warnings)
- Server: `npm run preview` — URL: http://localhost:4174/ (port 4173 in use, vite picked 4174)
- Browser: Chrome 131
- Devtools responsive viewports used: iPhone 14 (390×844), Pixel 7 (412×915), iPad (768×1024), 1440px

## Test 3 — Production build + theme toggle (THEME-01 + COLOR-01)
Spec: Open localhost URL. Click sun/moon toggle at 1440px. ALL 9 sections flip dark→light (Nav · Hero · About · Skill · Experience [timeline-dot ring + halo] · Projects · Claude Code · Contact · Footer). Click again, flip back to dark.

Status: PASS
Observations: Chrome 131 @ 1440px. All 9 sections flipped dark↔light cleanly both directions. No flash or stuck elements.

## Test 4 — localStorage persistence (THEME-PERSIST-01)
Spec: Toggle to light → close tab → reopen URL → page loads in LIGHT (no dark flash). DevTools → Application → Local Storage → `cam-theme` = `'light'`.

Status: PASS
Observations: `cam-theme: 'light'` confirmed in Local Storage. Page reopens directly in light, no dark flash.

## Test 5 — Hero photo at 4 viewports, DARK mode (HERO-PHOTO-01)
Spec: Verify hero photo full-bleed bg, face visible (object-position center 30%), text legible (drop-shadow on h1) at iPhone 14 / Pixel 7 / iPad / 1440px.

Status: PASS
Observations per viewport: All 4 viewports (iPhone 14 / Pixel 7 / iPad / 1440px) — photo full-bleed, face visible, h1 legible, no layout jank.

## Test 6 — Hero photo LIGHT mode at 3 viewports (HERO-PHOTO-02)
Spec: Toggle to LIGHT. At iPhone 14 / iPad / 1440px: photo brightness ~0.85, overlay tinted near-white, h1 legible, no layout shift on toggle.

Status: PASS
Observations per viewport: All 3 viewports (iPhone 14 / iPad / 1440px) — brightness reduced, overlay near-white, h1 legible. No layout shift on toggle.

## Test 7 — Reduced-motion suppression (A11Y-MOTION-01)
Spec: DevTools → Rendering → emulate `prefers-reduced-motion: reduce` → hard refresh → hero animations SUPPRESSED but all content (photo, h1, h2, CTAs, stats) VISIBLE.

Status: PASS
Observations: Animations suppressed after hard-refresh under prefers-reduced-motion: reduce. All hero content visible (photo, h1, h2, CTAs, stats).

## Test 8 — Nav scroll-spy + click for #claude-code (NAV-CLAUDE-01)
Spec:
1. 1440px: scroll down to `#claude-code` → "Claude Code" nav link highlights ACTIVE
2. Scroll to top → click "Claude Code" → smooth-scrolls to section
3. iPhone 14 viewport → open hamburger → click "Claude Code" → menu closes + smooth-scrolls

Status: PASS
Observations: Desktop 1440px scroll-spy highlights "Claude Code" active. Smooth-scroll works on click. Mobile iPhone 14 hamburger → click closes menu + smooth-scrolls.

## Test 9 — Claude section content + CTAs in EN/ES (CLAUDE-CONTENT-01)
Spec: Navigate to `#claude-code`. Verify PitchHero headline + 4 ValueCards + ProofBlock (7 counter tiles — record actual values) + 5 ServiceCards + 3 FeaturedAppCards (ci-templates, GSD, spring-ai-qdrant-mcp) + StackStrip (17 chips). Click PRIMARY CTA → `#contact`. Click SECONDARY CTA → `#projects`. Toggle LangPill to ES → all content in Spanish. Toggle back to EN.

Status: PASS
Counter values seen: 8 / 12 / 40 / 200 / 5 / 3 / 17
Observations: All cards/chips/counters render. Primary CTA → #contact, Secondary CTA → #projects. EN↔ES toggle clean (no untranslated strings observed).

## Test 10 — WCAG AA contrast, LIGHT mode, Claude section (A11Y-CONTRAST-01)
Spec: Toggle to LIGHT → navigate to `#claude-code` → run DevTools Lighthouse a11y OR axe DevTools OR manual contrast check on h2 / sub-lead / value-card / service-card / app-card / counter labels. GOAL: zero failures.

Status: PASS
Observations / failing element + ratio + threshold: axe DevTools full-page scan — zero color-contrast violations in `#claude-code` section under light mode.
Tool: axe DevTools

## Closure

- session_closed: 2026-05-27T14:55:00-05:00
- Verdict: ALL PASS (8/8) — local UAT gate cleared. Plan 11-04 (Vercel deploy) unblocked.
