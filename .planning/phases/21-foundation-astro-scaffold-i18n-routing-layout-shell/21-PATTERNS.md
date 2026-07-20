# Phase 21: Foundation — Astro scaffold, i18n routing & layout shell - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 10
**Analogs found:** 7 / 10 (3 have no direct codebase analog — first-of-kind for this repo; RESEARCH.md syntax is primary source for those)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|----------------|
| `astro.config.mjs` | config | build-time transform | `vite.config.js` | role-match (build-config file, ESM `defineConfig` pattern) |
| `middleware.ts` (repo root) | middleware | request-response | `src/i18n/LanguageContext.jsx` (`readInitialLang`) | partial (locale-detection algorithm only — no server/edge middleware exists in repo) |
| `src/layouts/BaseLayout.astro` | component (layout) | request-response (build-time render) | `index.html` + `src/i18n/translations.js` + `src/i18n/ThemeContext.jsx` | role-match (head/meta content + theme-flip logic being replaced) |
| `src/pages/404.astro` | route | request-response | `index.html` (doc shell) + `src/components/Footer.jsx` (dark-palette tokens) | partial (no existing 404/error page) |
| `src/pages/index.astro` | route | request-response | `index.html` (current SPA entry doc) | partial (thin static page, no client logic) |
| `src/pages/en/index.astro`, `src/pages/es/index.astro` | route | request-response | `src/App.jsx` (current page composition entry) | partial (structural placeholder only — content migration is Phase 22+) |
| `vercel.json` | config | request-response (edge routing) | `vercel.json` (itself, modify in place) | exact |
| `package.json` | config | — | `package.json` (itself, modify in place) | exact |
| `vitest.config.ts` (new, replaces `test` block currently in `vite.config.js`) | config | — | `vite.config.js` `test` block | role-match |
| `src/pages/404.test.ts` (Container API proof-of-life) | test | request-response | `src/seo/jsonld.test.js` + `src/App.test.jsx` | role-match (static-content assertion style + render-and-assert style) |

## Pattern Assignments

### `astro.config.mjs` (config, build-time transform)

**Analog:** `vite.config.js` (full file, 39 lines — already read in full)

**Full current file** (`vite.config.js:1-39`):
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      template: 'treemap',
      emitFile: false,
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost/' },
    },
    globals: true,
    setupFiles: ['./src/test/setup.jsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/test/**', 'src/index.jsx'],
    },
  },
})
```

**What to copy:** the `defineConfig(...)` ESM export shape, no-semicolon style, and the `resolve.alias` `@` → `src` convention (repo's existing path-alias habit, matches `jsconfig.json`'s `@/*` mapping) — carry the `@` alias into `astro.config.mjs`'s underlying Vite config passthrough (`vite: { resolve: { alias: {...} } }`) if any new `.jsx` islands need it in a later phase. The `test` block itself must move to a **new** `vitest.config.ts` per RESEARCH.md's `getViteConfig()` requirement (Astro's config and Vitest's config diverge once Astro is introduced — Vite's `test` key inside `astro.config.mjs` is not honored the same way).

**Exact target syntax:** use RESEARCH.md's `astro.config.mjs` block verbatim (`i18n.locales`, `i18n.defaultLocale`, `routing.prefixDefaultLocale: true`, `routing.redirectToDefaultLocale: false`, `integrations: [react()]`) — no codebase analog exists for `astro:i18n` config since this is the first Astro file in the repo.

---

### `middleware.ts` (repo root) (middleware, request-response)

**Analog:** `src/i18n/LanguageContext.jsx` lines 10-16 (`readInitialLang`) — **algorithm only**, not a structural analog (no edge/server middleware exists anywhere in this repo; `src/`, `scripts/`, and root have zero prior request-handling code).

**Locale-detection heuristic to mirror** (`src/i18n/LanguageContext.jsx:10-16`):
```javascript
function readInitialLang() {
  if (typeof window === 'undefined') return 'en'
  const saved = window.localStorage.getItem('cam-lang')
  if (saved === 'es' || saved === 'en') return saved
  const nav = (window.navigator && window.navigator.language) || 'en'
  return nav.toLowerCase().startsWith('es') ? 'es' : 'en'
}
```
D-02 explicitly requires the *same simple heuristic* server-side: `header contains 'es' → 'es', else → 'en'`. The client version checks `localStorage` first, then `navigator.language.startsWith('es')` (prefix match); the server version checks a `cam-lang` **cookie** first (D-01), then `Accept-Language` via `.includes('es')` (RESEARCH.md's `resolveLocaleFromAcceptLanguage`, a looser substring match than the client's `.startsWith`, per D-02's explicit call-out — do not "fix" this into a `.startsWith` to force parity, the divergence is intentional since `Accept-Language` headers are structured differently than `navigator.language`).

**Storage-key naming convention to preserve:** `'cam-lang'` (`LanguageContext.jsx:12`, `:45`) — D-01 locks this exact string as the new cookie name too.

**No analog exists for:** the `Set-Cookie` response construction, the `matcher`/`config` export shape, or the `isKnownLocale()` allowlist-validation guard — these have zero precedent in this codebase. Use RESEARCH.md's `middleware.ts` code block verbatim (lines 170-232 of RESEARCH.md) as the primary source, not a codebase analog. Flag for planner: RESEARCH.md's Open Question 1 (bare-200-passthrough vs. `next()` from `@vercel/functions`) must be spiked against a real Vercel preview before this file is considered done — no local test can validate it.

**Security pattern to carry over** — `isKnownLocale()` allowlist check (RESEARCH.md lines 196-199) has no codebase precedent but mirrors the same defensive-validation habit already used in `LanguageContext.jsx:42` (`setLang` rejects any value that isn't exactly `'en'`/`'es'` before committing state):
```javascript
// LanguageContext.jsx:41-47 — same allowlist-before-commit shape to mirror in middleware.ts
const setLang = useCallback((next) => {
  if (next !== 'en' && next !== 'es') return
  setLangState(next)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('cam-lang', next)
  }
}, [])
```

---

### `src/layouts/BaseLayout.astro` (component/layout, request-response build-time render)

**Analog 1 — `<head>` content to port near-verbatim:** `index.html` lines 1-87 (full file already read).

**Favicon/viewport/theme-color block** (`index.html:1-16`):
```html
<meta charset="utf-8" />
<link rel="icon" href="/favicon.ico" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link
  rel="preload"
  as="image"
  type="image/webp"
  href="/me-800.webp"
  imagesrcset="/me-400.webp 400w, /me-800.webp 800w, /me-1600.webp 1600w"
  imagesizes="100vw"
  fetchpriority="high"
/>
<meta name="theme-color" content="#0B1020" />
```

**OG/Twitter static fallback block** (`index.html:21-36`) — port as-is, but D-07 replaces the *dynamic* override half (currently done at runtime by `LanguageContext.jsx`'s `useEffect`, see Analog 3 below) with build-time per-route resolution from `translations.js`'s `meta.title`/`meta.description`:
```html
<meta property="og:type" content="website" />
<meta property="og:url" content="https://andresmontoyat.co/" />
<meta property="og:image" content="https://andresmontoyat.co/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://andresmontoyat.co/og-image.png" />
```

**JSON-LD Person schema** (`index.html:41-64`) — copy verbatim per D-08 (stays English-only, untranslated, in both locale trees):
```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Carlos Andrés Montoya Tobón",
    "jobTitle": "Solutions Architect & Senior Backend Engineer",
    "url": "https://andresmontoyat.co/",
    "image": "https://andresmontoyat.co/og-image.png",
    "email": "mailto:andresmontoyat@gmail.com",
    "telephone": "+573244422196",
    "address": { "@type": "PostalAddress", "addressLocality": "Medellín", "addressCountry": "CO" },
    "sameAs": ["https://github.com/andresmontoyat", "https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033"],
    "knowsAbout": ["Java", "Spring", "Microservices", "Cloud", "Hexagonal Architecture"],
    "description": "..."
  }
</script>
```
**Note:** `src/seo/jsonld.test.js` (see test section below) currently asserts against this exact block's shape by reading `index.html` off disk — that test will need a follow-up update once this JSON-LD moves into `BaseLayout.astro` (flag for planner; out of this phase's Container-API-proof-of-life scope per CONTEXT.md, but the existing test will break/need redirecting once `index.html` stops existing as the SPA entry).

**GA script** (`index.html:79-86`) — copy verbatim per D-09 (no env-var move this phase):
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-4TZJGR3MXR"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-4TZJGR3MXR');
</script>
```

**Analog 2 — meta shape to consume at build time:** `src/i18n/translations.js` lines 29-32 (`en`) and 82-85 (`es`):
```javascript
meta: {
  title: 'Carlos Andrés Montoya Tobón · Solutions Architect & Senior Backend Engineer',
  description: 'Carlos Andrés Montoya Tobón — Solutions Architect and Senior Backend Engineer with 18+ years of experience in Java, Spring, microservices and cloud.',
},
```
`BaseLayout.astro` frontmatter should import `translations` directly and index by `Astro.currentLocale` (mirrors how `LanguageContext.jsx:24` does `translations[lang] && translations[lang].meta` at runtime today — same lookup shape, moved to build time).

**Analog 3 — the runtime pattern being replaced (D-07):** `src/i18n/LanguageContext.jsx` lines 21-39 — this `useEffect` currently does at runtime (on every `lang` change) exactly what `BaseLayout.astro`'s frontmatter will now do once at build time per route:
```javascript
useEffect(() => {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  const meta = translations[lang] && translations[lang].meta
  if (!meta) return

  if (meta.title) document.title = meta.title
  const descTag = document.querySelector('meta[name="description"]')
  if (descTag && meta.description) descTag.setAttribute('content', meta.description)

  const setMeta = (selector, content) => {
    const el = document.querySelector(selector)
    if (el && content) el.setAttribute('content', content)
  }
  setMeta('meta[property="og:title"]', meta.title)
  setMeta('meta[property="og:description"]', meta.description)
  setMeta('meta[name="twitter:title"]', meta.title)
  setMeta('meta[name="twitter:description"]', meta.description)
}, [lang])
```
**What to carry over:** the exact set of tags touched (`document.title`, `meta[name="description"]`, `og:title`, `og:description`, `twitter:title`, `twitter:description`) — `BaseLayout.astro` must resolve all six of these at build time from the same `meta.title`/`meta.description` pair (there is no separate og/twitter-specific translation key today; the runtime code reuses `meta.title`/`meta.description` for all four OG/Twitter fields too — replicate that reuse, don't invent new translation keys). `document.documentElement.lang = lang` becomes `<html lang={Astro.currentLocale}>` (ROUTE-04, static attribute, no runtime mutation needed — confirmed by RESEARCH.md).

**Analog 4 — theme-flip logic being replaced by a blocking script (ISLAND-04):** `src/i18n/ThemeContext.jsx` lines 1-56 (full file, already read) — **this is the FOUC gap Phase 21 fixes**. Current pattern:
```javascript
// ThemeContext.jsx:7-16 — client-side read, happens after JS parses (too late, causes FOUC)
function readInitialTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && VALID_THEMES.includes(stored)) return stored
  } catch (e) { /* localStorage blocked — fall through */ }
  return DEFAULT_THEME
}

// ThemeContext.jsx:27-35 — runtime useEffect DOM mutation, runs post-hydration
useEffect(() => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  try { window.localStorage.setItem(STORAGE_KEY, theme) } catch (e) { /* ignore */ }
}, [theme])
```
**Key conventions to preserve in the new blocking `<script is:inline>`:** storage key `'cam-theme'` (`STORAGE_KEY`, not `'theme'` as RESEARCH.md's generic example assumes — **correction to RESEARCH.md**: RESEARCH.md's code block uses `localStorage.getItem('theme')`, but this repo's actual key is `cam-theme`; planner must use `cam-theme` not `theme`), the `document.documentElement.dataset.theme = theme` mutation target (exact same DOM API as today, just moved to before-paint), and the `try/catch` guard around `localStorage` access (private-mode safety — `ThemeContext.jsx:9-14`, `:30-34`). `VALID_THEMES = ['dark', 'light']` and `DEFAULT_THEME = 'dark'` (note: default is `'dark'`, not light — matches `prefers-color-scheme` fallback logic RESEARCH.md's script already has correct, just confirm the two-way `matchMedia` check maps to `'dark'`/`'light'`, same as `VALID_THEMES`).

**Note for planner (ISLAND-04 scope boundary):** the *ThemeToggle island itself* (the UI control that calls `setTheme`/`toggleTheme`) is explicitly out of scope for Phase 21 (deferred to Phase 22 per CONTEXT.md's Phase Boundary) — only the blocking inline flip-before-paint script belongs in `BaseLayout.astro` this phase. `ThemeContext.jsx` itself is not deleted this phase; it likely gets consumed by the Phase 22 island.

---

### `src/pages/404.astro` (route, request-response)

**Analog 1 — doc shell:** `index.html` lines 1-6, 73, 88-103 (minimal skeleton, not the full head).

**Analog 2 — dark-palette Tailwind tokens actually in use today** (correction to CONTEXT.md D-11's token names — `bg-ink-900`/`text-neon` are described generically in D-11 and the stale project `CLAUDE.md`, but the *actual* tokens currently rendered in components are, per live grep):
```javascript
// src/components/Nav.jsx:25 — bg-ink-900 IS real and in active use
<header data-game-interactive className="sticky top-0 z-50 backdrop-blur-md bg-ink-900/70 border-b border-ink-600">
```
```javascript
// src/components/Footer.jsx:13-41 — actual token set used for a minimal, centered, dark section
<footer className="border-t border-ink-400 py-10 mt-10">
  <div className="max-w-6xl mx-auto px-6 text-center">
    ...
    <a href="#hero" className="... text-text-primary hover:text-brand transition-colors duration-200 ...">
    <p className="... text-text-secondary ...">{t.footer.tagline}</p>
    <a className="... border-ink-400 text-text-secondary ... hover:text-brand hover:border-brand hover:shadow-brand ...">
```
**Correction to flag for planner:** `text-neon`, `bg-grad-neon`, `shadow-neon`, `animate-pulse2` (named in project `CLAUDE.md`'s stale "Styling" section and echoed in D-11) return **zero matches** in any current `.jsx` component (`rg` search across `src/components/*.jsx` for `text-neon|bg-grad-neon|animate-fadein|shadow-neon` = no hits). The live, actually-styled dark-palette tokens are `bg-ink-900`, `border-ink-400`/`border-ink-600`, `text-text-primary`, `text-text-secondary`, `text-brand`, `shadow-brand` (all confirmed defined in `tailwind.config.js` — `ink.900` at line 12, `brand` block at line 20). **Use these real tokens for `404.astro`, not the D-11-referenced `text-neon`/`bg-ink-900` combo verbatim** — `bg-ink-900` itself is fine (confirmed real), but pair it with `text-brand`/`text-text-primary`/`text-text-secondary`, not `text-neon`.

**No analog exists for:** an actual 404/error-page layout (first one in the repo) — use RESEARCH.md's minimal `404.astro` convention (lines 292-307) as the structural base, styled with the real tokens above, wrapped in `BaseLayout.astro` once that exists (RESEARCH.md's raw example doesn't use the shared layout — planner should decide whether `404.astro` wraps `<BaseLayout>` or stays a standalone minimal doc per D-11's "no animation/personality work" minimalism call).

---

### `src/pages/index.astro`, `src/pages/en/index.astro`, `src/pages/es/index.astro` (route, request-response)

**Analog:** `index.html` (current single SPA entry, lines 88-103 body) + `src/App.jsx` (current top-level composition, full file already read) — **structural precedent only**. Per CONTEXT.md's Phase Boundary, no content-section components (`Hero`, `About`, `Skill`, etc.) migrate this phase — these three `.astro` files are thin placeholders (proof that the route tree resolves, per ROUTE-01), not full page ports.

`src/App.jsx` full composition order to preserve conceptually for the *future* Phase 22+ port (not built this phase, but the route files should not contradict this order):
```javascript
// App.jsx:16-37
<ThemeProvider>
  <LanguageProvider>
    <div className="min-h-screen bg-bg text-text font-sans antialiased">
      <Nav />
      <main>
        <Hero /><About /><Skill /><Experience /><Projects /><Claude /><Contact />
      </main>
      <Footer />
      <SectionPager />
    </div>
  </LanguageProvider>
</ThemeProvider>
```
`src/pages/index.astro` (the bare `/` route) is **not** the redirect mechanism (RESEARCH.md is explicit: `middleware.ts` owns `/`) — it's a build-required fallback file only reached if middleware fails to short-circuit; keep it minimal, do not attempt content parity with `App.jsx` this phase.

---

### `vercel.json` (config, request-response edge routing)

**Analog:** the file itself, modified in place (current full 36-line file already read above).

**Current state** (to be replaced, not merged):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/index.html", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] },
    { "source": "/", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] },
    { "source": "/(.*\\.(?:png|jpg|jpeg|webp|svg|ico|woff2|woff))", "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400, must-revalidate" }] }
  ]
}
```
**What changes (per DEPLOY-02 + RESEARCH.md):** `"framework"` → `"astro"`; entire `"rewrites"` block removed (not just the SPA fallback — Vercel's own Astro docs call this unsupported); `"headers"` source rescoped from `/assets/(.*)` to `/_astro/(.*)` (Astro's actual hashed-asset directory, replacing the Vite/CRA-era `/assets/` convention); the `/index.html` and `/` cache-control rules are dropped (no longer meaningful once `index.html` isn't the SPA entry Vercel serves for every route). `"outputDirectory": "dist"` and `"buildCommand"` stay unchanged (Astro's default output dir matches Vite's).

---

### `package.json` (config)

**Analog:** the file itself, modified in place (full 66-line file already read above).

**Fields to change:**
- `dependencies` — remove `"three": "^0.169.0"` (line 11, confirmed unused in `src/` per RESEARCH.md's DEPLOY-01), add `astro`, `@astrojs/react`.
- `devDependencies` — add `@types/react`, `@types/react-dom`.
- New top-level `"engines": { "node": ">=22.12.0" }` block — **no existing `engines` field to pattern-match against** (repo has none today); insert as a new top-level sibling to `"dependencies"`/`"devDependencies"`, matching the file's existing 2-space-indent JSON style (confirmed throughout the file).
- `scripts.dev`/`scripts.build`/`scripts.preview` (lines 14-16, 22) currently invoke `vite`/`vite build`/`vite preview` directly — these become `astro dev`/`astro build`/`astro preview` (Astro wraps Vite internally per RESEARCH.md; exact script-body swap, same key names, same no-semicolon-irrelevant JSON format).
- `scripts.test`/`scripts.coverage` (lines 23, 25) stay `vitest`/`vitest run --coverage` — Vitest itself is unaffected, only its config file moves (`vite.config.js`'s `test` block → new `vitest.config.ts` using `getViteConfig()`, per Architecture Patterns above).

---

### `vitest.config.ts` (config)

**Analog:** `vite.config.js` lines 23-38 (the `test` block being extracted, already shown above in the `astro.config.mjs` section).

**Target shape** (from RESEARCH.md, no codebase precedent for `getViteConfig()` since Astro is new):
```typescript
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
  test: {
    // merge vite.config.js's existing test block options here verbatim:
    // environment: 'jsdom', environmentOptions.jsdom.url, globals: true,
    // setupFiles: ['./src/test/setup.jsx'], coverage: {...}
  },
})
```
**What must carry over unchanged:** `setupFiles: ['./src/test/setup.jsx']` — this file (already read, full 49 lines) contains load-bearing Node-22 `localStorage`/`sessionStorage` jsdom bridging (explicitly flagged "LOAD-BEARING" in its own comment, lines 20-25) and a `HTMLCanvasElement.getContext` stub for WebGL-probing components. Do not drop this setup file when moving to `vitest.config.ts` — every existing component test (`About.test.jsx`, `Hero.test.jsx`, etc.) depends on it.

---

### `src/pages/404.test.ts` (Astro Container API proof-of-life) (test, request-response)

**Analog 1 — static-content assertion style:** `src/seo/jsonld.test.js` (full 44-line file, already read) — reads a build artifact off disk and asserts on parsed structure, no component rendering:
```javascript
import fs from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'

const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8')
const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)

describe('index.html Person JSON-LD (ASEO-01)', () => {
  it('embeds a static application/ld+json block in the head', () => {
    expect(match).toBeTruthy()
  })
  // ...further `it()` blocks assert on parsed JSON fields
})
```
**What to copy:** the `describe`/`it` naming convention referencing a requirement ID in the `describe` title (`(ASEO-01)` → new test should reference `TEST-01`), and the "read the real artifact, assert on real structure" philosophy — but swap the `fs.readFileSync` + regex approach for the Container API's `renderToString()` (RESEARCH.md lines 313-323), since `404.astro` is a compiled Astro component, not a static disk file like `index.html` was.

**Analog 2 — render-and-assert style:** `src/App.test.jsx` lines 1-27 (full file, already read):
```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App (v4.0 Slice 1 — purge)', () => {
  it('renders Nav, Hero, and Footer without throwing', () => {
    expect(() => render(<App />)).not.toThrow()
  })
  it('mounts the canonical regions for an accessible scroll layout', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    // ...
  })
})
```
**What to copy:** the "renders without throwing" smoke-test-first pattern (first `it()` in the analog) and the `describe()` block naming a phase/requirement context in a parenthetical suffix — mirror this exactly for the Container API test's first assertion (`expect(() => container.renderToString(NotFoundPage)).not.toThrow()` conceptually, though Container API is async so it'll be `await expect(...).resolves.not.toThrow()` or a try/catch, not the same sync `expect(() => ...).not.toThrow()` shape).

**No analog exists for:** `experimental_AstroContainer` itself, or any `.astro`-file test — this is the first Astro component test in the repo. Use RESEARCH.md's exact import/usage (lines 312-323) as the primary source.

## Shared Patterns

### Locale/lang value validation (allowlist-before-use)
**Source:** `src/i18n/LanguageContext.jsx:41-47` (`setLang`'s `if (next !== 'en' && next !== 'es') return` guard)
**Apply to:** `middleware.ts`'s `isKnownLocale()` check before constructing the `Location` redirect header (Security Domain in RESEARCH.md explicitly calls out open-redirect risk here) — this repo already has a precedent for "never trust an unvalidated locale value," just client-side; the middleware is the first server-side instance of the same rule.

### Storage-key string constants
**Source:** `src/i18n/LanguageContext.jsx:12,45` (`'cam-lang'`), `src/i18n/ThemeContext.jsx:3` (`const STORAGE_KEY = 'cam-theme'`)
**Apply to:** `middleware.ts` (cookie name, D-01 locks `'cam-lang'` exactly) and `BaseLayout.astro`'s inline theme script (must read `'cam-theme'`, not the generic `'theme'` key RESEARCH.md's own example uses — flagged as a correction above). Both existing files name their storage key as a literal/const at the top of the file rather than inlining the string at each call site — mirror that habit in the new files for consistency, even though `ThemeContext.jsx` uses a named const and `LanguageContext.jsx` inlines the literal (repo is inconsistent between the two — prefer the named-const style for new code, matching `ThemeContext.jsx`).

### No-semicolon, single-quote JS/JSX style
**Source:** every `.js`/`.jsx` file read in this pass (`LanguageContext.jsx`, `ThemeContext.jsx`, `translations.js`, `App.jsx`, `vite.config.js`, `App.test.jsx`)
**Apply to:** `astro.config.mjs`, `vitest.config.ts`'s non-type-annotation lines, and any `.mjs`/`.js` config files touched this phase — per RESEARCH.md's own note, `.ts` files (`middleware.ts`) conventionally use semicolons in Astro/TS tooling and the research explicitly flags this as "author's discretion," not a hard requirement; `.astro` frontmatter (which is TS-flavored) may reasonably follow either convention, but `.mjs`/`.js` files should stay semicolon-free to match `vite.config.js`.

### `try/catch` guard around `localStorage`/`sessionStorage` access
**Source:** `src/i18n/ThemeContext.jsx:9-14, 30-34` (private-mode safety)
**Apply to:** the blocking inline theme script in `BaseLayout.astro` — RESEARCH.md's own example (lines 272-277) does **not** wrap its `localStorage.getItem('theme')` call in try/catch, unlike the existing `ThemeContext.jsx` convention. Flag for planner: add the try/catch guard to match the established repo convention, since a blocking `<head>` script throwing in private-mode Safari would break the entire page render before paint (worse than the current runtime-`useEffect` failure mode, which at least fails silently post-mount).

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `middleware.ts` (structural shape: `config`/`matcher` export, `Response` construction, `Set-Cookie` header) | middleware | request-response | Zero server/edge request-handling code exists anywhere in this repo today — SPA is 100% client-rendered with no backend tier. Only the *locale-detection algorithm* (not the middleware shape) has a client-side analog (`LanguageContext.jsx`). |
| `astro.config.mjs`'s `i18n` block, `getAbsoluteLocaleUrl`/`getRelativeLocaleUrl` calls in `BaseLayout.astro` | config / layout | build-time transform | First Astro file in the repo — no prior `astro:i18n` usage to pattern-match. |
| `src/pages/404.test.ts`'s Container API mechanics (`experimental_AstroContainer`, `renderToString`) | test | request-response | First `.astro` component test in the repo — existing tests are all React (`@testing-library/react`) or plain Node `fs`-read assertions (`jsonld.test.js`), neither of which compiles/renders an `.astro` file. |

## Metadata

**Analog search scope:** repo root (`vercel.json`, `package.json`, `vite.config.js`, `index.html`), `src/i18n/` (all 3 files, full reads), `src/App.jsx` + `src/App.test.jsx` (full reads), `src/components/Footer.jsx` + `Nav.jsx` (targeted grep + partial read), `src/seo/jsonld.test.js` (full read), `src/test/setup.jsx` (full read), `tailwind.config.js` (targeted grep for `ink`/`brand` tokens)
**Files scanned:** ~18 (all small enough for single-pass full reads; no file in this repo exceeded the 2,000-line large-file threshold)
**Pattern extraction date:** 2026-07-19

---
*Phase-level pattern map for: 21-foundation-astro-scaffold-i18n-routing-layout-shell*
*Consumes: 21-CONTEXT.md, 21-RESEARCH.md*
