# Phase 4 Performance Profile + Responsive Sweep

Date: 2026-05-08T02:54:00Z
Build: dist/ from `npm run build` (post Plans 04-01..04-06)
Preview URL: http://localhost:4173
Lighthouse baseline (Plan 04-06): Performance 98, Accessibility 100, target-size 1.0

---

## How to Run the Preview Server

```sh
# From project root
npm run build
npx vite preview --port=4173
```

Then open http://localhost:4173 in **Chrome** (not Safari/Firefox — these tasks require Chrome DevTools features).

---

## Performance Profile (Task 2 — D-09)

**Status:** Deferred to manual UAT — executor cannot run Chrome DevTools in headless environment.

### Recording Procedure

1. Open http://localhost:4173 in Chrome
2. Open DevTools (Cmd+Option+I) → Performance tab
3. Click the gear icon → set **CPU: 4x slowdown** + **Network: Slow 4G**
4. Click the record (circle) button
5. Scroll continuously from Hero (top) to Footer (bottom) — ~5–10 seconds
6. Stop the recording

### What to Inspect

| Track | What to look for |
|-------|-----------------|
| **FPS bar** | Should be mostly green (55–60 FPS). Yellow < 1s is acceptable; red = problem. |
| **Long Tasks** | Any task > 50ms is yellow-flagged. Click to see call stack. |
| **Layout track** | Layout events OK at section boundaries (lazy chunk landing), NOT during sustained scroll. |
| **Scripting track** | Should be near-empty during scroll (IO callbacks + scroll-spy are passive). |

### Specific Interactions to Watch

- `useInView` observers (Plan 04-01 W-01 fix) — should fire **once per section then disconnect**, NOT on every frame
- `useActiveSection` scroll-spy — `IntersectionObserver` fires only at **section-edge crossings**, NOT continuously
- `ProgressBar` — writes `ref.current.style.width` directly (NOT `setState`) — should show NO React re-render during scroll
- Hero `h1` char-reveal — runs **only at mount**, should NOT re-trigger during scroll
- Lazy chunks (Plan 04-05): Experience / Contact / Footer chunks should load **on idle**, not blocking scroll

### Pre-Evidence

Lighthouse 12 mobile audit (Plan 04-06, 2026-05-08):
- **TBT: 100ms** (Total Blocking Time — primary scroll jank proxy) → strong signal scroll will be clean
- **CLS: 0.014** (Cumulative Layout Shift) → lazy chunk boundaries introduce no visible shift
- **LCP: 2.0s** → Hero loads fast; scroll starts in a clean state

### Findings (fill in after recording)

- Average FPS during scroll: ___
- Number of long tasks > 50ms: ___
- Location of long tasks (section / event): ___
- Layout thrash detected: yes / no
- Visible jank (subjective): yes / no
- Verdict: [ ] approved — perf profile clean  [ ] approved with notes  [ ] regression — re-engage planner

---

## Responsive Sweep (Task 3 — D-08)

**Status:** Deferred to manual UAT — executor cannot drive Chrome DevTools device toolbar.

### Setup

1. Open http://localhost:4173 in Chrome
2. Open DevTools → Toggle Device Toolbar (Cmd+Shift+M)
3. For each viewport below, set the exact dimensions and scroll the full page top-to-bottom

### Breakpoint Checklist

#### iPhone 14 — 390 × 844

- [ ] No horizontal overflow (no bottom scrollbar)
- [ ] Hamburger icon visible in nav (desktop links hidden)
- [ ] Hero h1 wraps cleanly (expected: 3 lines)
- [ ] Stats grid: 2 cols × 2 rows
- [ ] Skill chips wrap without overflow
- [ ] Experience timeline: rail + dots aligned, cards readable
- [ ] Contact email card: email text wraps via `break-all`, Copy button doesn't overlap
- [ ] Footer social links: visible, centered
- [ ] Copy email button tappable (44px min-h enforced by Plan 04-04)

#### Pixel 7 — 412 × 915

- [ ] Same checks as iPhone 14 (marginally more vertical space — should look identical)

#### iPad — 768 × 1024

- [ ] Desktop nav visible (no hamburger) — md: breakpoint at 768px
- [ ] Stats grid: 4 cols × 1 row
- [ ] About section: single-column layout at 768px (2-column splits at lg: 1024px — should NOT yet split here)
- [ ] Skill categories: stack vertically (single column)
- [ ] Experience timeline + Contact cards: comfortable margins

#### 4K Desktop — 2560 × 1440

- [ ] Page centered (max-w-6xl = 72rem max-width container — NOT edge-to-edge)
- [ ] No text wrap-distortion at extreme width
- [ ] Hero h1: not disproportionately huge (capped at lg:text-6xl = 60px)
- [ ] Stats grid: 4 cols, comfortable gap
- [ ] Contact email card: `break-all` handles email at extreme widths

### Cross-Cutting Regression Checks

- [ ] **Skip-link:** Tab from browser address bar → skip-link appears top-left → Enter → page jumps to `#main`, focus moves (Plan 04-04 regression)
- [ ] **EN/ES switch:** Click ES → all visible text changes to Spanish + `<html lang>` attribute updates in DevTools Elements panel + page title changes (Phase 2 SEO-04 regression)
- [ ] **GA:** Open Network tab, filter by `collect`, reload → at least one request to `googletagmanager.com` with `tid=G-4TZJGR3MXR` (Phase 3 SEO-02 regression)
- [ ] **Reduce-motion:** System Settings → Accessibility → Reduce Motion ON → reload → all entrance animations skipped (content visible immediately); scroll past sections — chips/cards appear without animation; Hero h1 text shows complete without char-reveal

> **Teardown:** Turn Reduce Motion OFF in System Settings after this check.

### Findings (fill in after sweep)

| Breakpoint | Result | Issues |
|-----------|--------|--------|
| iPhone 14 (390×844) | | |
| Pixel 7 (412×915) | | |
| iPad (768×1024) | | |
| 4K desktop (2560×1440) | | |

| Regression Check | Result | Notes |
|-----------------|--------|-------|
| Skip-link | | |
| EN/ES switch | | |
| GA collect request | | |
| Reduce-motion | | |

Verdict: [ ] approved — responsive sweep clean  [ ] approved with notes  [ ] regression — re-engage planner

---

## Final Sign-off

- Performance Profile: ___
- Responsive Sweep: ___
- RESP-01 (4 breakpoints without overflow/broken layout): ___
- RESP-02 (FPS 55-60 + no long tasks > 50ms): ___
- Phase 4 success criterion #3 (perceptual smoothness): ___
