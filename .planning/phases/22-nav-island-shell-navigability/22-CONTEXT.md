# Phase 22: Nav island — shell navigability - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning
**Mode:** [--auto] all gray areas auto-resolved with recommended defaults, single pass, logged below.

<domain>
## Phase Boundary

Migrate `Nav.jsx` (+ nested `ThemeToggle.jsx`) into a single `client:load` React island embedded on the `/en` and `/es` pages. Replace `LanguageContext`'s `useLanguage()` with a `locale` prop (no Context — islands can't share React Context across boundaries, and there's only one island here anyway). Replace `ThemeContext`'s `useTheme()` with local component state synced to the DOM `data-theme` attribute already set by Phase 21's blocking `<head>` script. Replace `setLang()` (in-place state mutation) with real navigation to `/en`/`/es` URLs, preserving the current section hash.

**In scope:** `Nav.jsx` → island (unchanged visual/behavioral contract: sticky header, scroll progress bar, desktop nav, mobile menu portal, scroll-spy via `useActiveSection`, lang pill, theme toggle). `useActiveSection.js` hook — unchanged, pure client-side logic, no SSR concerns.
**Out of scope:** `SectionPager.jsx` (Phase 25), any content section (Phase 23+), `translations.js` restructuring (still imported directly, just indexed by prop instead of Context).

</domain>

<decisions>
## Implementation Decisions

### Island boundary & data flow
- **D-01 [auto]:** Nav becomes ONE island (`client:load`), with `ThemeToggle` staying a nested child component within that same island — not promoted to a separate top-level island. Matches the milestone research's explicit correction to the original design spec's island table (ARCHITECTURE.md finding).
- **D-02 [auto]:** `locale` (`'en' | 'es'`) is passed as a prop from the Astro page (`Astro.currentLocale`) into `<Nav client:load locale={locale} />`. Inside the island, `translations.js` is imported directly and indexed by the `locale` prop (`translations[locale]`) — no `LanguageContext`/`useLanguage()` survives into this island. Same pattern applies to `ThemeToggle`, which currently reads `t.nav.themeLight/themeDark` via `useLanguage()` — it now receives the same resolved `t` (or `locale`) as a prop passed down from `Nav`.

### Theme toggle (no more ThemeContext)
- **D-03 [auto]:** `ThemeToggle` (nested in Nav) manages theme via local `useState`, initialized by reading `document.documentElement.dataset.theme` on mount (already set correctly pre-paint by Phase 21's blocking script — no flash). `toggleTheme` flips local state, sets `document.documentElement.dataset.theme`, and writes `localStorage.setItem('cam-theme', next)` — same storage key and behavior as today's `ThemeContext.jsx`, just without the Context wrapper. Wrap `localStorage` access in `try/catch` (matches existing `ThemeContext.jsx` private-mode safety, per Phase 21's PATTERNS.md correction).

### Language switcher (LangPill) — real navigation, not state mutation
- **D-04 [auto]:** `LangPill`'s EN/ES buttons become links (`<a>`) to `getRelativeLocaleUrl(targetLocale, path)` (same `astro:i18n` helper used in `BaseLayout.astro`), not `setLang()` calls. Current section hash is preserved by reading `window.location.hash` at render time (client-only, hydrated component) and appending it to the target href — matches ROUTE-05's requirement.
- **D-05 [auto]:** Clicking a `LangPill` link also updates the `cam-lang` cookie client-side (`document.cookie = 'cam-lang=' + targetLocale + '; path=/; max-age=...'`) so the choice persists for the next `/` visit, matching `middleware.ts`'s cookie-refresh behavior from Phase 21 (D-04) — keeps behavior symmetric whether the cookie gets set by middleware (page-route visits) or by an explicit user click.

### Scroll-spy, progress bar, mobile menu — unchanged
- **D-06 [auto]:** `useActiveSection.js`, `ProgressBar`, and `MobileMenu` (including its `createPortal` to `document.body`) carry over with zero logic changes — all are pure client-side DOM/IntersectionObserver/scroll-listener code with no SSR touchpoints, safe to hydrate as-is inside the island.
- **D-07 [auto]:** `NAV_ITEMS`/`SECTION_IDS` (the single source of truth for nav links + scroll-spy targets) stays a module-level constant inside the island file, unchanged from today's `Nav.jsx`.

### Claude's Discretion
- Exact file location for the island (`src/components/react/Nav.jsx` vs keeping `src/components/Nav.jsx` in place) — an implementation/organization detail, not a behavioral one.
- Whether `ThemeToggle` stays a separate file imported into `Nav.jsx`, or gets inlined — either is fine as long as it's not its own top-level Astro island (D-01).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & requirements
- `docs/superpowers/specs/2026-07-19-astro-migration-design.md` — original design spec
- `.planning/REQUIREMENTS.md` — ISLAND-01, ROUTE-05, TEST-02 (this phase's REQ-IDs)
- `.planning/ROADMAP.md` — Phase 22 goal, success criteria

### Research
- `.planning/research/SUMMARY.md`, `ARCHITECTURE.md`, `FEATURES.md` — island hydration directives, ThemeToggle-nested-in-Nav correction, `getRelativeLocaleUrl` usage pattern (already used in `BaseLayout.astro`, Phase 21)
- `.planning/phases/21-foundation-astro-scaffold-i18n-routing-layout-shell/21-PATTERNS.md` — `cam-theme` storage key correction, real Tailwind token set

### Prior phase artifacts (Phase 21, this island's foundation)
- `.planning/phases/21-foundation-astro-scaffold-i18n-routing-layout-shell/21-02-SUMMARY.md` — `BaseLayout.astro`'s theme-flip script (island's `ThemeToggle` must read the SAME `data-theme` attribute this script sets, not diverge)
- `.planning/phases/21-foundation-astro-scaffold-i18n-routing-layout-shell/21-03-SUMMARY.md` — `middleware.ts`'s `cam-lang` cookie contract (island's LangPill must write the same cookie name/shape)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/Nav.jsx` — full current implementation to port near-verbatim (`DesktopNav`, `LangPill`, `ProgressBar`, `MobileMenu`, `NAV_ITEMS`/`SECTION_IDS`)
- `src/components/_shared/ThemeToggle.jsx` — port near-verbatim, only the state source changes (local state vs Context)
- `src/hooks/useActiveSection.js` — unchanged, import as-is

### Established Patterns
- `getRelativeLocaleUrl(locale, path)` from `astro:i18n` — already used in `BaseLayout.astro` (Phase 21) for hreflang links; same helper for the LangPill's href targets
- `cam-theme` / `cam-lang` storage keys — locked naming from Phase 21, must match exactly (Phase 21's PATTERNS.md caught and fixed a `theme` vs `cam-theme` mismatch — don't reintroduce it here)

### Integration Points
- Island mounts inside `src/pages/en/index.astro` and `src/pages/es/index.astro` (created in Phase 21), passed `locale={Astro.currentLocale}`
- Must render inside `BaseLayout.astro`'s body region (BaseLayout currently only renders `<head>` — confirm during planning whether Nav is rendered by the page files directly or BaseLayout gains a slot)

</code_context>

<specifics>
## Specific Ideas

No specific visual requirements — this phase preserves Nav's existing look/behavior exactly, only the underlying data plumbing (Context → props) and lang-switch mechanism (state mutation → real navigation) change.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (single-pass auto mode).

</deferred>

---

*Phase: 22-nav-island-shell-navigability*
*Context gathered: 2026-07-19 (--auto)*
