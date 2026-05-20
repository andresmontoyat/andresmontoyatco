---
phase: 10-real-browser-uat-a11y
session_started: 2026-05-13
session_closed: 2026-05-20
session_status: closed
mode: conversational
total_tests: 11
passed: 2
failed: 0
skipped: 9
pending: 0
skip_reason: "milestone closure decision — deploy priority shifted to v3.7; remaining tests deferred to v3.7 Phase 1 (pre-deploy gate)"
target_reqs: [THEME-01, COLOR-01, HERO-01, AI-01, AI-01-CICD]
---

# Phase 10 UAT — v3.6 Real-Browser Sweep

## Goal

Every v3.6 capability verified by human in live browser. Phase 5 false-positive UAT debt was paid in Phase 7 gate; Phase 10 is the formal milestone-wide sweep across all REQs + Lighthouse audit.

## Setup (run once before tests)

```bash
npm run dev
```

Open browser. Use DevTools responsive mode for viewport switches:
- iPhone 14: 390×844
- Pixel 7: 412×915
- iPad: 768×1024
- Desktop: 1440×900 (or larger)

Also have a production build ready:
```bash
npm run build && npx serve dist
```

## Test Grid (11 tests)

### Theme toggle (THEME-01 + COLOR-01)

| # | Test | Status |
|---|------|--------|
| 1 | **Dev mode + dark→light** — `npm run dev`, click sun/moon at 1440px. ALL sections flip dark→light (Nav · Hero · About · Skill · Experience [timeline-dot ring + halo!] · Projects · Claude Code · Contact · Footer). Click again, flip back to dark. | pass (2026-05-18) |
| 2 | **Theme at iPhone 14** — DevTools 390×844, toggle, observe all sections flip. Hamburger menu ThemeToggle visible. | pass (2026-05-20) |
| 3 | **Production build** — `npm run build && npx serve dist`, open dist URL, toggle theme. Should behave identical to dev mode. | skip (v3.7 pre-deploy) |
| 4 | **localStorage persistence** — Toggle to light, close tab, reopen. Page loads in light. DevTools Application → Local Storage shows `cam-theme: 'light'`. | skip (v3.7 pre-deploy) |

### Hero photo (HERO-01)

| # | Test | Status |
|---|------|--------|
| 5 | **Hero photo at all viewports** — Photo visible as full-bleed bg in dark mode. Face visible (object-position center 30%). Text legible (drop-shadow on h1 in both gradient + white spans). Check at iPhone 14, iPad, 1440px. | skip (v3.7 pre-deploy) |
| 6 | **Hero photo in light mode** — Toggle theme. Photo lightens (brightness 0.85), overlay tinted near-white, h1 still legible. Check all 3 viewports. | skip (v3.7 pre-deploy) |
| 7 | **Reduced-motion** — In DevTools → Rendering → emulate `prefers-reduced-motion: reduce`. Hero entrance animations suppressed but photo + content still present. | skip (v3.7 pre-deploy) |

### AI / Claude Code section (AI-01 + AI-01-CICD)

| # | Test | Status |
|---|------|--------|
| 8 | **Nav scroll-spy + click** — Scroll down to #claude-code, "Claude Code" nav link should highlight active. Click "Claude Code" in Desktop nav from top of page; smooth-scroll lands at section. Same in Mobile hamburger menu. | skip (v3.7 pre-deploy) |
| 9 | **Section content + CTAs** — At #claude-code: see pitch headline + 4 value cards + proof block (7 counters: 37/81/86/15/47/15/5) + 5 services + 3 app cards (ci-templates, GSD, spring-ai-qdrant-mcp) + 17-chip stack strip. Click primary CTA → smooth-scrolls to #contact. Click secondary CTA → smooth-scrolls to #projects. Test in both EN and ES (toggle LangPill). | skip (v3.7 pre-deploy) |
| 10 | **WCAG AA contrast — light mode** — Toggle light. Inspect Claude section text (h2, sub-lead, value desc, service desc, app desc, counter labels). Use DevTools Lighthouse a11y panel OR axe DevTools extension to flag any contrast failures. | skip (v3.7 pre-deploy) |

### Lighthouse audit (cross-cutting)

| # | Test | Status |
|---|------|--------|
| 11 | **Lighthouse mobile audit** — Production build (`dist/`). Run Lighthouse mobile preset. Confirm: Performance ≥ 95 / Accessibility 100 / Best Practices 100 / SEO 100. v3.4 baseline was 98/100/100/100. | skip (v3.7 pre-deploy gate) |

---

## Notes

- All tests are human-only — Claude cannot drive the browser
- For each test, reply with `pass`, `fail: <observation>`, or `skip: <reason>`
- If a test FAILS, surface the bug specifically (which section / viewport / what broke)
- Doc-drift patches will run AFTER UAT pass (REQUIREMENTS.md 5→3 apps, ROADMAP SC2 stale)

## Doc-drift patches (post-UAT, before phase completion)

After tests 1-11 pass:

1. **REQUIREMENTS.md AI-01** — patch "5 featured-app cards" → "3 featured-app cards"; move claude-kanban + caveman to Future Backlog
2. **ROADMAP.md Phase 9 SC2** — patch "5 counters, 4 service cards" → "7 counters, 5 service cards"
3. Commit: `docs: patch v3.6 doc-drift (REQUIREMENTS AI-01 + ROADMAP Phase 9 SC2)`

## Resume

Per CONTEXT for v3.6 closure: write `10-VERIFICATION.md` + `10-01-SUMMARY.md` if any fix plans needed. If all pass, mark UAT complete and move to milestone close (`/gsd-audit-milestone 3.6` then `/gsd-complete-milestone 3.6`).

## Closure Note (2026-05-20)

UAT closed early — 2 pass / 9 skip. **Skip rationale:** v3.7 deploy priority. Tests 3–11 deferred to v3.7 Phase 1 as **pre-deploy gate** (must pass before Vercel production deploy). This is a conscious milestone-closure decision, not test gap acceptance.

**Coverage delivered:**
- THEME-01 + COLOR-01: Test #1 (desktop 1440px) + Test #2 (iPhone 14 390×844) — both pass
- HERO-01: visually verified via Tests #1/#2 (hero photo present in both viewports)
- AI-01: visually verified via Tests #1/#2 (Claude Code section flips with theme)

**Coverage deferred to v3.7 Phase 1:**
- Production build parity (Test #3)
- localStorage persistence (Test #4)
- Hero photo strict checks: reduced-motion + light mode brightness (Tests #5–7)
- AI section CTAs + EN/ES + WCAG AA contrast (Tests #8–10)
- Lighthouse mobile audit (Test #11) — **MUST PASS before Vercel deploy**
