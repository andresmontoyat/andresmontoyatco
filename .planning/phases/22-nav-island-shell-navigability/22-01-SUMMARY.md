---
phase: 22-nav-island-shell-navigability
plan: 01
subsystem: frontend
tags: [astro, react-island, i18n, navigation, theme]

# Dependency graph
requires: ["21-02"]
provides:
  - "src/components/react/Nav.jsx — single client:load React island (sticky header, scroll-spy, mobile menu portal, hash-preserving LangPill)"
  - "src/components/react/ThemeToggle.jsx — nested theme toggle, local state, no ThemeContext"
  - "Nav island mounted on /en and /es with locale/hrefEn/hrefEs props"
affects: ["22-02 (tests against Nav's props contract)", "Phase 23+ (content sections render alongside this Nav shell)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Astro-to-React island boundary: props-only data flow (locale, hrefEn, hrefEs) — no React Context crosses the island boundary, first use of client:load in this repo"
    - "translations[locale] direct-import + prop-indexing replaces useLanguage()/LanguageContext — same object-indexing idiom already established in BaseLayout.astro (Phase 21)"
    - "Client-side locale-swap href: page frontmatter resolves getRelativeLocaleUrl(locale, path) server-side, passes both hrefEn/hrefEs as props; island appends window.location.hash client-side via useState+hashchange listener (astro:i18n helpers are server-only, not importable in island code)"

key-files:
  created: [src/components/react/ThemeToggle.jsx, src/components/react/Nav.jsx]
  modified: [src/pages/en/index.astro, src/pages/es/index.astro]

key-decisions:
  - "LangPill hrefs seed useState from the hrefEn/hrefEs props (SSR/first-client-render match), then a useEffect (window.location.hash + hashchange listener) keeps them current as in-page scroll-spy navigation updates the hash"
  - "cam-lang cookie write happens in LangPill's onClick handler (persists choice for next '/' visit via middleware.ts's cookie-refresh), while the <a href> performs the actual navigation — both stay symmetric with middleware.ts's own cookie-refresh behavior from Phase 21"
  - "Target locale in cookie write is always a hardcoded literal ('en'/'es'), never derived from any input — mirrors middleware.ts's isKnownLocale allowlist guard (T-22-02 mitigation)"

requirements-completed: [ISLAND-01, ROUTE-05]

# Metrics
duration: ~12min
completed: 2026-07-19
---

# Phase 22 Plan 1: Nav island — shell navigability Summary

**Nav.jsx (with nested ThemeToggle) ported into a single `client:load` React island on `/en` and `/es`, replacing LanguageContext/ThemeContext with props + local state, and LangPill's `setLang()` state mutation with real hash-preserving, cookie-writing `<a>` navigation.**

## Performance

- **Duration:** ~12 min
- **Tasks:** 3
- **Files created:** 2 (ThemeToggle.jsx, Nav.jsx)
- **Files modified:** 2 (en/index.astro, es/index.astro)

## Accomplishments

- `src/components/react/ThemeToggle.jsx` — nested-child component (not a top-level island, per D-01). Local `useState` seeded from `document.documentElement.dataset.theme` (already set pre-paint by Phase 21's `BaseLayout.astro` blocking script — zero flicker). `toggleTheme` flips `dark`/`light`, writes both `document.documentElement.dataset.theme` and `localStorage.setItem('cam-theme', ...)` inside a `try/catch` (private-mode safety). Takes `t` as a prop instead of reading `useLanguage()`. Visual markup (SunIcon/MoonIcon/button className) ported verbatim.
- `src/components/react/Nav.jsx` — ports `src/components/Nav.jsx` near-verbatim. `NAV_ITEMS`/`SECTION_IDS` stay module-level unchanged (D-07). Signature `Nav({ locale, hrefEn, hrefEs })`; `lang`/`t` derived by indexing `translations[locale]` directly — no `LanguageContext` survives. `ProgressBar`, `MobileMenu` (with its `createPortal(overlay, document.body)`), and `useActiveSection` scroll-spy carried over with zero logic changes (D-06).
- `LangPill` rewritten per D-04/D-05: EN/ES buttons are now `<a>` elements. `href` state initializes from the `hrefEn`/`hrefEs` props (SSR/first-render match) and a `useEffect` (guarded `typeof window === 'undefined'`) appends `window.location.hash`, resubscribing on `hashchange` so it tracks in-page scroll-spy navigation. `onClick` writes the `cam-lang` cookie (`path=/; max-age=31536000`) for the clicked target — a hardcoded literal, never derived from input (open-redirect guard, T-22-02). The `<a href>` itself performs navigation; the cookie write is a side effect.
- `src/pages/en/index.astro` and `src/pages/es/index.astro` — both import `Nav.jsx` + `getRelativeLocaleUrl` from `astro:i18n`, compute `locale`/`path`/`hrefEn`/`hrefEs` in frontmatter (mirroring `BaseLayout.astro`'s own path-stripping pattern), and mount `<Nav client:load locale={locale} hrefEn={hrefEn} hrefEs={hrefEs} />` before `<main>`.
- `astro build` verified: `dist/en/index.html` and `dist/es/index.html` both carry server-rendered Nav markup (Logomark `camt` glyph, `Language`/`Idioma` group labels respectively) plus an `astro-island` element with `client="load"` — confirming the `client:load` directive compiled correctly and locale threads through the island's SSR pass.
- Full existing suite re-verified GREEN: **104/104 tests passing**, zero regressions.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ThemeToggle island (local state, no ThemeContext)** — `b84996f` (feat)
2. **Task 2: Create Nav island (Context → props, LangPill → hash-preserving links)** — `c496a48` (feat)
3. **Task 3: Mount the Nav island on /en and /es pages** — `2ca4182` (feat)

## Files Created/Modified

- `src/components/react/ThemeToggle.jsx` - new: nested theme toggle, local `useState` seeded from `dataset.theme`, persists to `cam-theme`
- `src/components/react/Nav.jsx` - new: `client:load` Nav island, props-based locale/hrefs, hash-preserving cookie-writing LangPill
- `src/pages/en/index.astro` - modified: mounts `<Nav client:load>` with `en` locale + resolved hrefs
- `src/pages/es/index.astro` - modified: mounts `<Nav client:load>` with `es` locale + resolved hrefs

## Decisions Made

- Kept `ThemeToggle` as a separate file (Claude's Discretion per 22-CONTEXT.md) rather than inlining into `Nav.jsx`, for parity with the existing `src/components/_shared/ThemeToggle.jsx` file structure and to keep `Nav.jsx` focused.
- Placed both island files under `src/components/react/` (Claude's Discretion) — establishes a clear directory boundary between legacy CSR components (`src/components/`) and new Astro-era islands, useful when Phase 27 removes the legacy CSR entry.
- `LangPill`'s hash-tracking `useEffect` subscribes to `hashchange` rather than re-reading `window.location.hash` on every render, since scroll-spy-driven hash updates (via `<a href="#section">` clicks) fire the native `hashchange` event — no polling needed.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written for all functional/behavioral requirements.

### Verification Note (non-blocking)

**1. Plan's literal `getRelativeLocaleUrl` grep count in Task 3 acceptance criteria understated actual occurrences**
- **Found during:** Task 3 verification
- **Issue:** The plan's acceptance criteria state `grep -c "getRelativeLocaleUrl" src/pages/en/index.astro` returns `1`. The actual, correctly-implemented code has 3 occurrences per page (the `import { getRelativeLocaleUrl }` statement plus the two `hrefEn`/`hrefEs` computation lines) — exactly matching the plan's own `<action>` instructions, which explicitly require both `const hrefEn = getRelativeLocaleUrl('en', path)` and `const hrefEs = getRelativeLocaleUrl('es', path)` plus the import. There is no way to satisfy both the action text and the literal `1` grep count simultaneously.
- **Resolution:** No code change — the implementation follows the plan's `<action>` block exactly. Treated as a plan-authoring undercount in the verification command, not a defect. All *behavioral* acceptance criteria for Task 3 (both pages pass `hrefEn`/`hrefEs`/`locale` to `<Nav>`, build exits 0, `dist/en/index.html`/`dist/es/index.html` contain locale-correct Nav markup) verified and pass.
- **Files affected:** none (documentation-only discrepancy)

## Issues Encountered

None beyond the verification-command note above.

## Known Stubs

None — Nav renders its full interactive contract (progress bar, desktop nav, theme toggle, lang pill, mobile menu) with real data; no placeholder/empty states introduced.

## Threat Flags

None beyond the plan's own `<threat_model>` (T-22-01/02/03), which were implemented exactly as specified: React auto-escaped `href` attributes, hardcoded locale-literal cookie writes, `cam-lang`/`cam-theme` treated as low-value preference data.

## Next Phase Readiness

- `Nav.jsx`'s props contract (`{ locale, hrefEn, hrefEs }`) is locked and ready for Plan 22-02's tests to render against directly (no `LanguageProvider` wrapper needed).
- `ThemeToggle`'s `{ t }` prop contract is stable for any future nested-consumer tests.
- Both `/en` and `/es` now render a fully interactive sticky Nav shell above the still-placeholder `<main><h1>` — Phase 23+ content sections mount inside the same `<BaseLayout>` body, after `<Nav>`.
- Legacy `src/components/Nav.jsx` and `src/components/_shared/ThemeToggle.jsx` were intentionally left untouched (still referenced by the not-yet-removed CSR entry point) — cleanup deferred to Phase 27 per the plan's explicit instruction.

---
*Phase: 22-nav-island-shell-navigability*
*Completed: 2026-07-19*

## Self-Check: PASSED
