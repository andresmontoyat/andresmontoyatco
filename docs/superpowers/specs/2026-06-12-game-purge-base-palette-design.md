# Slice 1 — Game Purge + Base Palette

**Date:** 2026-06-12
**Status:** DRAFT — awaiting user review
**Author:** Carlos Andrés Montoya (drafted with Claude)
**Milestone:** v4.0 — Portfolio MVP redesign (section-by-section)

---

## 1. Context & Motivation

The v3.8 → v3.11 line of work (`GameMode` → `MarioWorld`) was a failed direction. The visual result does not match what the owner wants for a recruiter-facing portfolio. Continuing to iterate on top of that code adds drag without solving the underlying mismatch.

The new direction (v4.0):

- **Section-by-section MVP redesign** instead of a single big-bang refactor.
- **Visual reference:** `website-new/index.html` (dark `#0B1020` base, neon `#00e5a8` / `#00c2ff` accents, subtle 44 px grid, Inter + JetBrains Mono).
- **Updates without a CMS:** content lives as JSON/JS files in the repo; updates ship by editing the file and pushing to `main` (Vercel auto-deploys).
- **Hide game mode entirely.** The dev/CV-scroll view is the only view.

This document scopes the **first** slice of v4.0: a clean cut of all game-related code plus the global base palette that future section slices will inherit. No section is redesigned in this slice. About, Nav, Hero, Skills, Experience, Contact, and Footer each get their own subsequent slice.

## 2. Goals

- **G1.** Remove every artifact tied to the failed game-mode work — components, hooks, renderers, data, sprites, tests, bundle-gate config, i18n keys.
- **G2.** Adopt the target color/typography tokens at the global layer so that future section slices can use them without re-establishing the palette.
- **G3.** Keep the site building, testing GREEN, and shipping (Vercel preview must work). The page can be visually thin during this slice; it must not be broken.
- **G4.** Re-baseline the bundle-gate thresholds for the post-purge entry bundle (three.js gone → bundle should shrink dramatically).

## 3. Non-Goals (explicit out-of-scope)

- Refactoring `Nav.js`, `Hero.js`, or `Footer.js` visually to the target mockup. Those happen in dedicated later slices.
- Rendering About / Skills / Experience / Contact / Claude. Those are deferred to per-section slices.
- Converting any `src/data/*.js` to JSON. Per-section slices do that when they refactor their section.
- Adding new i18n strings, new sections, new components.
- Adding a formal design system / Storybook / shadcn install.
- Touching the architecture-doc / specs folders beyond writing this spec.

## 4. Approach Selected

From three options (purge-only / purge+About combined / mega-purge incl. legacy Nav-Hero), the user chose **purge-only** so the slice stays small and About becomes its own slice. The page renders **Nav + Hero + Footer** only after this slice ships; Experience and the other sections re-enter the layout when their slices land.

## 5. Detailed Design

### 5.1 Deletions (entire folders)

- `src/marioWorld/` — all of it: orchestrator, `HeroGameGate`, `DevView`, `MarioWorld`, `WorldErrorBoundary`, `WorldMap`, hooks (`useCinematicZoom`, `useClickVsDrag`, `useRendererCapability`, `useSecretCommand`, `useWorldNav`), renderers (`IllustratedWorldMap`, `SvgWorldMap`, `WebGLWorldMap`), overlays (`WorldDetailOverlay`, `SecretCommandHint`), data (`biomes`, `worlds.derive`, `secret-worlds`) and every `.test.js` next to them.
- `public/sprites/` — every Mario sprite asset (avatar + biomes).

### 5.2 Deletions (single files)

- `src/context/ViewModeContext.js` + `ViewModeContext.test.js` — viewport switching was a game-mode concern.
- `src/components/_shared/ViewModeToggle.js` + `ViewModeToggle.test.js` — same.
- `src/data/sections.js` — was the renderer config consumed only by `DevView`.
- `src/data/skills.test.js` — paired with the data file that will be rebuilt during the Skills slice.

### 5.3 Files kept but not imported ("parking lot")

The following stay on disk so the Experience / Skills / Projects / Claude slices have a starting point when they land. They are NOT wired into `App.js` after this slice.

- `src/components/Experience.js`
- `src/components/_shared/SectionLabel.js`
- `src/components/_shared/ThemeToggle.js`
- `src/data/claude.js`
- `src/data/experience.js`
- `src/data/projects.js`
- `src/data/skills.js`

### 5.4 Files modified

#### `src/App.js`

Strip the `ViewModeProvider`, drop the `MarioWorld` mount, render `<Nav /> <main><Hero /></main> <Footer />` inside the existing `ThemeProvider` → `LanguageProvider` chain. Base body classes become `min-h-screen bg-bg text-text font-sans antialiased`.

```jsx
import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './i18n/ThemeContext'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Footer from './components/Footer'

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-bg text-text font-sans antialiased">
          <Nav />
          <main className="container mx-auto px-4"><Hero /></main>
          <Footer />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}
```

#### `src/i18n/translations.js`

Remove every key associated with game / mario / world / biome / secret / sprite / overlay. Keep keys still used by `Nav`, `Hero`, `Footer`. Document any orphan removals in the slice commit message.

#### `src/i18n/ThemeContext.js`

Audit for game-mode references; expected to be palette-only. Leave untouched if no refs found.

#### `tailwind.config.js`

Add CSS-var-backed tokens (kept narrow — only what is needed globally now; section slices can extend):

```js
theme: {
  extend: {
    colors: {
      bg:        'var(--bg)',
      'bg-2':    'var(--bg-2)',
      'bg-3':    'var(--bg-3)',
      surface:   'var(--surface)',
      border:    'var(--border)',
      text:      'var(--text)',
      muted:     'var(--muted)',
      accent:    'var(--accent)',
      'accent-2':'var(--accent-2)',
    },
    fontFamily: {
      sans: ['Inter', 'SF Pro Display', 'Segoe UI', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
    },
    backgroundImage: {
      'grad-accent': 'linear-gradient(135deg,#00e5a8 0%,#00c2ff 100%)',
    },
  },
},
```

#### `src/index.css`

Add the base layer:

```css
:root {
  --bg:#0B1020; --bg-2:#0f1530; --bg-3:#131a3a;
  --surface:#151c3d; --border:#1f2a55;
  --text:#e6ecff; --muted:#8892b8;
  --accent:#00e5a8; --accent-2:#00c2ff;
  --radius:14px;
  --shadow:0 20px 40px -20px rgba(0,229,168,.25);
}

html { scroll-behavior: smooth; }
body {
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  line-height: 1.65;
  overflow-x: hidden;
}
body::before {
  content: ""; position: fixed; inset: 0; z-index: -2; pointer-events: none;
  background:
    radial-gradient(600px circle at 10% 0%, rgba(0,229,168,.08), transparent 50%),
    radial-gradient(800px circle at 90% 20%, rgba(0,194,255,.06), transparent 55%),
    linear-gradient(180deg, #0B1020 0%, #0a0f1e 100%);
}
body::after {
  content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background-image:
    linear-gradient(rgba(0,229,168,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,229,168,.03) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
}
```

#### `scripts/check-bundle-gate.mjs`

- Remove `WEBGL_CHUNK_PATTERN` and every code path that checks for `WebGLWorldMap-*.js`.
- Keep `MOBILE_CHUNK_PATTERN = /^index-.*\.js$/`.
- Re-baseline the warn/hard thresholds for the main entry bundle. Provisional values for the design (final measured post-purge):
  - WARN at 30 kB gz
  - HARD at 50 kB gz
- The bundle-gate companion test (`scripts/check-bundle-gate.test.mjs`) is updated to drop the WebGL branch.

### 5.5 Post-state `src/` tree

```
src/
├── App.js
├── index.css
├── index.js
├── reportWebVitals.js
├── logo.svg
├── components/
│   ├── Hero.js
│   ├── Nav.js
│   ├── Footer.js
│   ├── Experience.js                ← parking, not imported
│   └── _shared/
│       ├── SectionLabel.js
│       └── ThemeToggle.js
├── data/                            ← parking, not imported
│   ├── claude.js
│   ├── experience.js
│   ├── projects.js
│   └── skills.js
├── hooks/
│   ├── useActiveSection.js
│   └── useInView.js
├── i18n/
│   ├── LanguageContext.js
│   ├── ThemeContext.js
│   └── translations.js              ← game keys stripped
└── test/
    ├── setup.js
    └── setup.test.js
```

## 6. Tests

### 6.1 Removed

- Every `*.test.*` file under `src/marioWorld/`.
- `src/context/ViewModeContext.test.js`.
- `src/components/_shared/ViewModeToggle.test.js`.
- `src/data/skills.test.js`.

### 6.2 Audited (drop if game-only)

- `src/test/setup.test.js` — if its assertions exist only for game-mode side-effects, remove; otherwise keep.

### 6.3 Added

- `src/App.test.js` — smoke test: renders without throwing, mounts `Nav` + `Hero` + `Footer`, no console errors. Language toggle still flips text. No assertion on visual styling.
- `scripts/check-bundle-gate.test.mjs` — updated to assert: no `WEBGL_CHUNK_PATTERN` reference, hard threshold ≤ 50 kB on `index-*.js`, missing chunk is a HARD fail.

### 6.4 Mandatory exit gates for the slice

- `npm test -- --run` — all GREEN.
- `npm run build` — clean.
- `node scripts/check-bundle-gate.mjs` — exit 0.
- `npm run lighthouse:mobile` — Performance ≥ 0.97, Accessibility = 1.00, Best Practices = 1.00, SEO = 1.00.

## 7. Error Handling

The `WorldErrorBoundary` is gone with the rest of `src/marioWorld/`. This slice does not add a new error boundary; React defaults apply. If a later slice introduces async loading or third-party widgets, that slice owns the boundary decision.

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `Nav.js` / `Hero.js` / `Footer.js` reference removed translation keys | medium | broken render | grep each component for `t.` / `translations.` keys before stripping `translations.js`; only remove keys not referenced anywhere |
| Bundle re-baseline too tight; first edit blows it up | low | gate fails on next slice | set provisional 50 kB HARD then measure; commit the *measured* number as the new baseline in the same slice |
| Lighthouse mobile gate regression | low | gate fails | the only change is *removing* code; performance should improve, but run the mobile audit before opening the PR |
| Visual jarring on the live preview while page is bare | high | optics during review | acceptable — Slice 1 ships as a "construction site" snapshot; About slice fills the page within the same session if needed |
| Hidden coupling between `ThemeContext` and game mode | low | runtime crash | audit `ThemeContext.js` content before delete decisions |

## 9. Migration & Rollback

- New branch `v4.0-slice-1-purge` cut from current `v3.11-mario-world` (or from `main` if a clean revert of v3.11 is preferred — owner decision at execute time).
- Atomic commits per logical unit: `chore: delete src/marioWorld`, `chore: delete sprites`, `chore: drop ViewMode context+toggle`, `feat: add base palette tokens`, `refactor: simplify App.js`, `chore: re-baseline bundle gate`, `test: add App smoke test`.
- Rollback = revert the merge commit; no data migration, no persisted state, nothing in localStorage relied on by other code (`cam-viewmode` key becomes orphan and the absence is silently tolerated by surviving code).

## 10. Open Questions

None outstanding for the design. Execution will measure the new bundle ceiling and commit it as the gate.

## 11. Next Slice Preview

- **Slice 2 — About** (separate spec): introduces `src/data/about.json`, `src/components/About.js` using the target visual (`.about-grid` 1.2fr / .8fr + `Quick facts` card), wires it into `App.js` between `Hero` and `Footer`, adds `about.test.js` and a JSON-schema smoke check. No further palette work expected (already established here).

---

*End of design.*
