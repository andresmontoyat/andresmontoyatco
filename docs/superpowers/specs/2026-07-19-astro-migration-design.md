# Astro Migration — Design Spec

**Date:** 2026-07-19
**Status:** Approved (design phase) — pending implementation planning
**Milestone:** v5 (new, separate from v4.2 Content Polish)

## Context

Current stack: React 18.3.1 + Vite (CSR, `ReactDOM.render`), Tailwind, no router (anchor-hash scroll navigation), `LanguageContext`/`ThemeContext` (React Context + localStorage), 12 Vitest/RTL test files, hosted on Vercel as a static SPA build.

v4.2 (Content Polish) is in progress on `main` and is explicitly scoped as content-only ("no infra/perf scope" per `.planning/STATE.md`). v4.2 also has an unresolved hard Lighthouse gate (Phase 11-05): performance ≥0.95, accessibility/best-practices/SEO = 1.0 (mobile), currently blocking milestone closure.

**Motivation:** Astro ships zero JS by default for static content (islands architecture), which should make the existing Lighthouse hard gate achievable where the current CSR-everything approach struggles. This migration is scoped as its own milestone (v5) so it doesn't collide with v4.2 content work in progress.

## Goals

- Migrate from React CSR (Vite) to Astro SSG with React islands for interactive pieces only.
- Preserve current design, bilingual EN/ES support, rich animations, mobile performance, WCAG 2.1 AA.
- Clear the existing Lighthouse hard gate (perf ≥0.95, a11y/best-practices/SEO = 1.0 mobile) as part of this milestone's exit criteria.
- No regression in test coverage philosophy — every migrated component keeps a green test at its new layer.

## Non-Goals

- No visual/design changes — this is an architecture migration, not a redesign.
- No change of hosting provider (stays on Vercel).
- No CMS or dynamic backend introduction — content stays static/build-time.
- Not folded into v4.2 — that milestone's content work is untouched by this spec.

## Architecture

Astro in fully static output mode (`output: 'static'`) replaces Vite+React CSR as the build pipeline. React is retained only inside islands for components that need client-side interactivity or state. Vercel continues to serve the static build output; no adapter/server runtime needed.

```
src/
├── layouts/BaseLayout.astro       # <head>, theme inline-script, JSON-LD, OG tags
├── pages/
│   ├── index.astro                # redirect / -> /en or /es via middleware
│   ├── en/index.astro
│   └── es/index.astro
├── components/
│   ├── astro/                     # static, zero client JS: About, Skill, Footer, SectionLabel, Projects
│   └── react/                     # islands: Nav, SectionPager, Hero (interactive part), ThemeToggle, Experience expand/collapse
├── content/                       # experience.json, projects.json, about.json, etc. as Astro content collections
└── i18n/translations.ts           # consumed at build time inside .astro files, not a runtime Context
```

Dependencies point the same direction as today (data → components → pages) but static components no longer carry any client runtime — only files under `components/react/` ship JS, and only the JS for that specific island (Astro's per-component hydration, no single monolithic bundle).

## Routing & i18n

- `astro:i18n` native integration. `defaultLocale: 'en'`, locales `['en', 'es']`.
- Build produces two fully static trees, `/en/*` and `/es/*` — no client JS required to render the correct language; this eliminates the current flash-of-wrong-language on load.
- `LanguageContext` (global React Context) is removed for static content. Where an island needs the current locale (e.g., a form label), it receives it as a prop derived from `Astro.currentLocale` at render time — no client-side context provider needed for read-only display.
- The language switcher (inside the Nav island) navigates between `/en/...` and `/es/...`, preserving the current in-page section (hash fragment).
- Root `/` resolves via Astro middleware: check `cam-lang` cookie first, fall back to `Accept-Language` header, 302-redirect to `/en` or `/es`. This replaces the current client-side `localStorage`-read-on-mount approach.

## Island Boundary

| Component | Layer | Hydration | Rationale |
|---|---|---|---|
| Nav | React island | `client:load` | language/theme switcher, scroll-spy active-section state |
| Hero | Mixed | LCP image stays static HTML (already is, in `index.html`); interactive parts as island | preserves current LCP-bait pattern, only hydrates what needs it |
| About, Skill, Footer | Astro static | none | plain content, no state |
| Experience | Mixed | `client:visible` on the expand/collapse control only | only stateful piece is expand/collapse |
| Projects | Astro static | none | hover-cards are CSS-only, no JS needed |
| SectionPager | React island | `client:visible` | scroll-driven, depends on `useActiveSection` |
| Contact | Astro static (re-verify) | island only if validation logic is added | currently static content, no active form submission |
| ThemeToggle | React island (small) | `client:load` | actual theme flip happens via inline `<head>` script (see Theming), island only reflects/toggles state post-hydration |

`three` (0.169.0) is an unused dependency — no import found anywhere in `src/` except a test reference. Removed from `package.json` as part of this migration.

## Theming & Animations

- Theme (dark/light) continues to use the `data-theme` attribute pattern already in place (`src/index.css`). A blocking inline `<script>` in `BaseLayout.astro`'s `<head>` reads cookie/`localStorage`/`prefers-color-scheme` and sets `data-theme` before first paint — same mechanism as today, but no longer dependent on React hydration timing.
- Tailwind config, custom design tokens (`bg-ink-900`, `text-neon`, `animate-fadein`, `animate-pulse2`, etc.), Press Start 2P font, and the existing hero LCP-bait technique (`#hero-static` in current `index.html`) all carry over unchanged — these are already framework-agnostic HTML/CSS.

## Testing Strategy

- Migrated to `.astro` static: replace the RTL test with an **Astro Container API** test (renders the component, asserts on output HTML/content) — same TDD discipline, different rendering layer.
- Remaining React islands: existing Vitest + React Testing Library pattern, unchanged.
- Gate per phase — a GSD phase migrating 1-2 components does not close without build green + tests green, matching current project standard.

## Deployment & Rollout

- `vercel.json`: remove the SPA fallback rewrite (`"/(.*)" -> "/index.html"`) — Astro emits real files per route, the rewrite is unnecessary and would break multi-route static output.
- All migration work happens on a feature branch under the v5 milestone; nothing ships to `main`/production mid-migration.
- Milestone exit criteria: existing Lighthouse hard-gate script (`npm run lighthouse:mobile` / `lighthouse:check`, thresholds perf ≥0.95, a11y/best-practices/SEO = 1.0) passes against the Astro build before merge to `main`.

## Risks / Open Items

- Astro Container API is newer/less battle-tested than RTL for static component testing — verify it covers the assertions the current tests make (bilingual text presence, ARIA attributes) before relying on it as the sole gate.
- Contact section behavior (form vs static) needs re-verification during implementation — CLAUDE.md notes react-hook-form is a declared but unused dependency; confirm whether Contact stays fully static or needs an island.
- Cookie-based locale redirect at `/` adds one micro-hop (edge middleware) — acceptable per user decision, but should be measured against the Lighthouse TTFB/perf budget during the final gate check.
