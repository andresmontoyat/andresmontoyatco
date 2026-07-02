# Hero Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the portfolio Hero — role-forward H1, punchy value-prop lead, brand-duotone background photo, and a clean CTA set (Get in touch + lang-aware CV PDF + LinkedIn/GitHub) — without regressing the v4.1 LCP win.

**Architecture:** The Hero is a single React section (`src/components/Hero.jsx`) driven by `translations.js`. The background photo is a *static* layer in `index.html` (paints with FCP, is the LCP element) styled by inline CSS custom properties. Copy changes go in `translations.js`; photo tint is a CSS-var change in `index.html`; CTA structure changes in `Hero.jsx`. No layout restructure, no new dependency.

**Tech Stack:** React 18, Vite 8, Vitest 4 + React Testing Library, Tailwind (CSS-var tokens). No FontAwesome (removed at v4.0) — social icons are inline SVG.

## Global Constraints

- **Language:** JS/JSX, 2-space indent, **no semicolons**, no comma-dangle enforcement (airbnb + `plugin:react/recommended`, `max-len` off).
- **Bilingual:** every user-facing string exists in both `en` and `es` under `translations.js`.
- **LCP:** the hero photo stays a static `<img>` in `index.html` (no move to JS, no new render-blocking resource). Mobile Lighthouse gate must hold: Perf ≥95 / A11y 100 / BP 100 / SEO 100.
- **Accessibility:** text over the photo holds WCAG 2.1 AA contrast; interactive targets ≥44×44px; external links use `target="_blank"` + `rel="noopener noreferrer"` + `aria-label`.
- **Tests:** `npx vitest run` stays fully GREEN. TDD: failing test first.
- **Commits:** conventional commits, atomic per task. End every commit message with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **Canonical strings** (copy verbatim):
  - H1 en: `Solutions Architect &` / `Senior Backend` / `Engineer.`
  - H1 es: `Arquitecto de Soluciones` / `e Ingeniero` / `Backend Senior.`
  - lead en: `I design and ship backend platforms that scale — clean hexagonal architecture, cloud-native, 18+ years, zero shortcuts.`
  - lead es: `Diseño y entrego plataformas backend que escalan — arquitectura hexagonal limpia, cloud-native, +18 años, cero atajos.`
  - CV label en: `Download CV` / es: `Descargar CV`
  - CV hrefs: `/CarlosMontoya_CV_EN.pdf`, `/CarlosMontoya_CV_ES.pdf`
  - GitHub URL: `https://github.com/andresmontoyat`
  - LinkedIn URL: `https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033`

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `public/CarlosMontoya_CV_EN.pdf`, `public/CarlosMontoya_CV_ES.pdf` | Served CV assets | Create (copy from `cv/`) |
| `src/i18n/translations.js` | Hero copy (both langs) | Modify `hero` key: H1 spans, lead, add `cv` label |
| `index.html` | Static hero photo layer | Modify 2 CSS vars (`--hero-photo-filter`, `--hero-overlay`) |
| `src/components/Hero.jsx` | Hero render + CTAs + motion | Modify CTA row (lang-aware CV + social SVG), motion/hierarchy polish |
| `src/components/Hero.test.jsx` | Hero unit tests | Create |
| `src/seo/hero-photo.test.js` | index.html photo-var regression | Create |

---

## Task 1: Serve CV PDFs from `public/`

**Files:**
- Create: `public/CarlosMontoya_CV_EN.pdf` (copy of `cv/CarlosMontoya_CV_EN.pdf`)
- Create: `public/CarlosMontoya_CV_ES.pdf` (copy of `cv/CarlosMontoya_CV_ES.pdf`)

**Interfaces:**
- Consumes: nothing.
- Produces: two static assets served at `/CarlosMontoya_CV_EN.pdf` and `/CarlosMontoya_CV_ES.pdf` (Vite serves `public/` at web root). Task 4's CV button links these.

- [ ] **Step 1: Copy the generated PDFs into `public/`**

```bash
cp cv/CarlosMontoya_CV_EN.pdf public/CarlosMontoya_CV_EN.pdf
cp cv/CarlosMontoya_CV_ES.pdf public/CarlosMontoya_CV_ES.pdf
```

- [ ] **Step 2: Verify both files exist and are non-empty**

Run: `ls -l public/CarlosMontoya_CV_EN.pdf public/CarlosMontoya_CV_ES.pdf`
Expected: both listed, size > 0 bytes.

- [ ] **Step 3: Commit**

```bash
git add public/CarlosMontoya_CV_EN.pdf public/CarlosMontoya_CV_ES.pdf
git commit -m "feat(hero): serve ATS CV PDFs from public/ (EN/ES)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Role-forward H1 + punchy lead + CV label (`translations.js`)

**Files:**
- Modify: `src/i18n/translations.js` (the `hero` object under both `en` and `es`)
- Create: `src/components/Hero.test.jsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `t.hero.h1a/h1b/h1c` (role-forward, per lang), `t.hero.lead` (punchy, per lang), new `t.hero.cv` (`{en:"Download CV", es:"Descargar CV"}`). `t.hero.status`, `t.hero.cta1`, `t.stats.*` unchanged. Task 4 consumes `t.hero.cv`.

Current `hero` (en) is: `{ status, h1a:"Building scalable", h1b:"backend systems", h1c:"that matter.", lead:"Started in 2007…", cta1:"Get in touch" }` and (es) mirrors it.

- [ ] **Step 1: Write the failing test** — create `src/components/Hero.test.jsx`

```jsx
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext'
import Hero from './Hero'

function setLangBeforeRender(lang) {
  try {
    window.localStorage.setItem('cam-lang', lang)
  } catch (e) {
    // ignore
  }
}

function renderWithLang(lang = 'en') {
  setLangBeforeRender(lang)
  return render(
    <LanguageProvider>
      <Hero />
    </LanguageProvider>,
  )
}

describe('Hero copy (redesign)', () => {
  it('renders role-forward H1 via aria-label (EN)', () => {
    const { container } = renderWithLang('en')
    const h1 = container.querySelector('h1')
    expect(h1).toHaveAttribute('aria-label', 'Solutions Architect & Senior Backend Engineer.')
  })

  it('renders role-forward H1 via aria-label (ES)', () => {
    const { container } = renderWithLang('es')
    const h1 = container.querySelector('h1')
    expect(h1).toHaveAttribute('aria-label', 'Arquitecto de Soluciones e Ingeniero Backend Senior.')
  })

  it('renders the punchy lead (EN)', () => {
    renderWithLang('en')
    expect(screen.getByText(/clean hexagonal architecture, cloud-native/)).toBeInTheDocument()
  })

  it('renders the punchy lead (ES)', () => {
    renderWithLang('es')
    expect(screen.getByText(/arquitectura hexagonal limpia, cloud-native/)).toBeInTheDocument()
  })
})
```

Note: `useCharReveal` uses `setTimeout`; under `prefers-reduced-motion` (jsdom default reports no match, so reveal runs). The `h1b` visible text is animated, so assertions target the `aria-label` (full, static) and the lead paragraph, not the animated span. `toHaveAttribute`/`toBeInTheDocument` come from `@testing-library/jest-dom` (already in `src/test/setup.jsx`).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Hero.test.jsx`
Expected: FAIL — aria-label is currently `Building scalable backend systems that matter.`; lead text not found.

- [ ] **Step 3: Update the `hero` copy in `translations.js`**

In the `en` tree, replace the `hero` fields:

```js
    hero: {
      status: 'Available for new opportunities',
      h1a: 'Solutions Architect &',
      h1b: 'Senior Backend',
      h1c: 'Engineer.',
      lead: 'I design and ship backend platforms that scale — clean hexagonal architecture, cloud-native, 18+ years, zero shortcuts.',
      cta1: 'Get in touch',
      cv: 'Download CV',
    },
```

In the `es` tree, replace the `hero` fields:

```js
    hero: {
      status: 'Disponible para nuevas oportunidades',
      h1a: 'Arquitecto de Soluciones',
      h1b: 'e Ingeniero',
      h1c: 'Backend Senior.',
      lead: 'Diseño y entrego plataformas backend que escalan — arquitectura hexagonal limpia, cloud-native, +18 años, cero atajos.',
      cta1: 'Contáctame',
      cv: 'Descargar CV',
    },
```

(Preserve the existing key order/style of the file; only these values change plus the new `cv` key. Leave `stats` untouched.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Hero.test.jsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/i18n/translations.js src/components/Hero.test.jsx
git commit -m "feat(hero): role-forward H1 + punchy value-prop lead (EN/ES)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Brand-duotone background photo (`index.html`)

**Files:**
- Modify: `index.html` (inline `<style>`, the `:root` custom properties at lines ~68-69)
- Create: `src/seo/hero-photo.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: updated `--hero-photo-filter` and `--hero-overlay` values (static). No JS. The `#hero-static img` filter and `.hero-static-ovl` background consume these vars (already wired).

Current values:
```css
--hero-photo-filter: grayscale(0.2) brightness(0.35);
--hero-overlay: linear-gradient(180deg, rgba(13, 13, 26, 0.4) 0%, rgba(13, 13, 26, 0.95) 75%);
```

- [ ] **Step 1: Write the failing test** — create `src/seo/hero-photo.test.js`

```js
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')

describe('hero photo treatment (brand duotone, static LCP layer)', () => {
  it('brightens the photo above the old near-black value', () => {
    const m = html.match(/--hero-photo-filter:\s*([^;]+);/)
    expect(m).not.toBeNull()
    expect(m[1]).toMatch(/brightness\(0?\.6\d?\)/)
  })

  it('keeps the photo as a static img (LCP element preserved)', () => {
    expect(html).toMatch(/<div id="hero-static">/)
    expect(html).toMatch(/<img[^>]+src="\/me-800\.webp"/)
  })

  it('applies a brand-tinted overlay (teal/blue), not only flat dark', () => {
    const m = html.match(/--hero-overlay:\s*([^;]+);/)
    expect(m).not.toBeNull()
    // brand teal #00E5A8 = rgb(0,229,168) / brand blue #00C2FF = rgb(0,194,255)
    expect(m[1]).toMatch(/rgba\(0,\s*229,\s*168/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/seo/hero-photo.test.js`
Expected: FAIL — brightness is `0.35`; overlay has no brand rgb.

- [ ] **Step 3: Update the two CSS vars in `index.html`**

Replace the two `:root` lines with:

```css
        --hero-photo-filter: grayscale(0.35) brightness(0.62) contrast(1.06);
        --hero-overlay:
          linear-gradient(150deg, rgba(0, 229, 168, 0.16) 0%, rgba(0, 194, 255, 0.12) 45%, rgba(13, 13, 26, 0) 70%),
          linear-gradient(180deg, rgba(13, 13, 26, 0.25) 0%, rgba(13, 13, 26, 0.92) 78%);
```

Rationale: first gradient = brand teal→blue tint (top-weighted, fades out); second = bottom-weighted dark for text legibility. Both stack in the single `.hero-static-ovl` background (comma-separated). Filter brightens the photo (0.35→0.62) so Carlos is visible, slight grayscale + contrast for a cohesive tone.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/seo/hero-photo.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Manual contrast check (AA)**

Run: `npm run dev` and open the hero. Confirm the status pill, H1, lead, CTAs, and stats remain clearly readable over the photo. If any text dips below AA, deepen the second (dark) gradient's lower stop toward `0.95` and re-run Step 4's test (the brand-rgb assertion still holds).

- [ ] **Step 6: Commit**

```bash
git add index.html src/seo/hero-photo.test.js
git commit -m "feat(hero): brand-duotone background photo treatment

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Clean CTA set — lang-aware CV + LinkedIn/GitHub (`Hero.jsx`)

**Files:**
- Modify: `src/components/Hero.jsx` (the CTA `<div>` block, currently lines ~107-131)
- Modify: `src/components/Hero.test.jsx` (add CTA assertions)

**Interfaces:**
- Consumes: `useLanguage()` → `{ lang, t }`; `t.hero.cta1`, `t.hero.cv` (from Task 2).
- Produces: CTA row with primary contact link, one lang-aware CV download, and two social links. Replaces the two `.docx` buttons.

- [ ] **Step 1: Write the failing tests** — append to `src/components/Hero.test.jsx`

```jsx
describe('Hero CTAs (redesign)', () => {
  it('primary CTA links to #contact', () => {
    const { container } = renderWithLang('en')
    const primary = container.querySelector('a[href="#contact"]')
    expect(primary).toBeInTheDocument()
  })

  it('CV button downloads the EN PDF in English', () => {
    const { container } = renderWithLang('en')
    const cv = container.querySelector('a[href="/CarlosMontoya_CV_EN.pdf"]')
    expect(cv).toBeInTheDocument()
    expect(cv).toHaveAttribute('download')
    expect(container.querySelector('a[href="/CarlosMontoya_CV_ES.pdf"]')).toBeNull()
  })

  it('CV button downloads the ES PDF in Spanish', () => {
    const { container } = renderWithLang('es')
    const cv = container.querySelector('a[href="/CarlosMontoya_CV_ES.pdf"]')
    expect(cv).toBeInTheDocument()
    expect(container.querySelector('a[href="/CarlosMontoya_CV_EN.pdf"]')).toBeNull()
  })

  it('renders accessible LinkedIn + GitHub links', () => {
    const { container } = renderWithLang('en')
    const li = container.querySelector('a[href="https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033"]')
    const gh = container.querySelector('a[href="https://github.com/andresmontoyat"]')
    expect(li).toHaveAttribute('aria-label')
    expect(gh).toHaveAttribute('aria-label')
    expect(li).toHaveAttribute('rel', 'noopener noreferrer')
    expect(gh).toHaveAttribute('target', '_blank')
  })

  it('no longer renders the old .docx download links', () => {
    const { container } = renderWithLang('en')
    expect(container.querySelector('a[href$=".docx"]')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Hero.test.jsx`
Expected: the new CTA tests FAIL (`/CarlosMontoya_CV_EN.pdf` link absent; `.docx` links still present).

- [ ] **Step 3: Update `Hero.jsx`**

Change the hook destructure to include `lang`:

```jsx
  const { lang, t } = useLanguage()
```

Add a lang-aware CV href just before the `return` (after the `isComplete` line):

```jsx
  const cvHref = lang === 'es' ? '/CarlosMontoya_CV_ES.pdf' : '/CarlosMontoya_CV_EN.pdf'
  const liAria = lang === 'es' ? 'Perfil de LinkedIn' : 'LinkedIn profile'
  const ghAria = lang === 'es' ? 'Perfil de GitHub' : 'GitHub profile'
```

Replace the entire CTA `<div>` (the block containing the `#contact` anchor and the two `.docx` download anchors) with:

```jsx
        <div
          className="flex items-center gap-3 flex-wrap motion-safe:opacity-0 motion-safe:animate-slide-up"
          style={{ animationDelay: '800ms', animationFillMode: 'forwards', animationDuration: '600ms' }}
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-full font-extrabold text-xs font-mono bg-brand-gradient text-ink-900 shadow-brand hover:shadow-brand-lg transform hover:-translate-y-0.5 transition-all"
          >
            {t.hero.cta1} →
          </a>
          <a
            href={cvHref}
            download
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-3 rounded-full font-extrabold text-xs font-mono bg-transparent text-text-primary border border-ink-400 hover:border-brand hover:text-brand transition-colors"
          >
            ⬇ {t.hero.cv}
          </a>
          <div className="flex items-center gap-2 ml-1">
            <a
              href="https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={liAria}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-ink-400 text-text-secondary hover:border-brand hover:text-brand transition-colors"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://github.com/andresmontoyat"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={ghAria}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-ink-400 text-text-secondary hover:border-brand hover:text-brand transition-colors"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
          </div>
        </div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/Hero.test.jsx`
Expected: PASS (all copy + CTA tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.jsx src/components/Hero.test.jsx
git commit -m "feat(hero): clean CTA set — lang-aware CV PDF + LinkedIn/GitHub icons

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Motion + typographic hierarchy polish (`Hero.jsx`)

**Files:**
- Modify: `src/components/Hero.jsx` (H1 classes + stats grid + entrance animation delays)

**Interfaces:**
- Consumes: existing structure from Task 4.
- Produces: refined visual hierarchy. No new DOM contract — existing tests must stay GREEN.

Refinements (visual only; keep all `motion-safe:` guards and the char-reveal so reduced-motion behavior is unchanged):

- [ ] **Step 1: Tighten the H1 scale + tracking**

In the `<h1>` className, bump the top end and keep tracking tight:
change `text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-none mb-5`
to `text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[0.95] mb-5`.

- [ ] **Step 2: Make the stats grid slightly more present**

In the stats grid `<div>` className, change `mt-14` to `mt-12` and add `shadow-brand/10` after `backdrop-blur-sm` (subtle lift). Leave the animation-delay style attribute unchanged.

- [ ] **Step 3: Unify the entrance stagger**

The entrance delays currently step 150 / 300 / 500 / 650 / 800 / 950 ms across status/H1 lines/lead/CTA/stats. Tighten the tail so the section settles sooner: change the lead's `animationDelay` from `'650ms'` to `'600ms'` and the stats' from `'950ms'` to `'850ms'`. (Status pill stays `0ms`, H1 spans `150/300/500`, CTA `800`.) Leave all `animationDuration` values as-is.

- [ ] **Step 4: Run the full Hero test file to confirm no regression**

Run: `npx vitest run src/components/Hero.test.jsx`
Expected: PASS (unchanged count — these are class/style-only tweaks).

- [ ] **Step 5: Visual confirm**

Run: `npm run dev`. Confirm: H1 reads large and tight; entrance feels cohesive (settles ~1s); stats card has a subtle lift; reduced-motion (OS setting) still shows everything immediately.

- [ ] **Step 6: Commit**

```bash
git add src/components/Hero.jsx
git commit -m "feat(hero): tighten H1 scale, stagger, and stats hierarchy

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Full verification + LCP/Lighthouse gate

**Files:** none (verification only).

**Interfaces:**
- Consumes: all prior tasks.
- Produces: green suite + passing build + confirmed Lighthouse gate.

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all tests PASS (prior 63 + new Hero.test.jsx + hero-photo.test.js). Report the new count.

- [ ] **Step 2: Production build**

Run: `npm run build:gate`
Expected: build succeeds; bundle gate WARN or below (no HARD fail). Note the index chunk gz size.

- [ ] **Step 3: Lighthouse mobile gate**

Run: `npm run lighthouse:mobile && npm run lighthouse:check`
Expected: HARD gate PASS — Performance ≥95 / Accessibility 100 / Best Practices 100 / SEO 100. If Accessibility drops, it is almost certainly the photo/text contrast (Task 3) — deepen the dark overlay stop and re-run.

- [ ] **Step 4: Final confirm**

Confirm working tree is clean and all six task commits are present:
Run: `git log --oneline -7`
Expected: Tasks 1-5 commits (Task 6 adds no commit unless a contrast fix was needed).

---

## Self-Review

- **Spec coverage:** layout A (no restructure — no task changes structure ✓); H1 role-forward (Task 2 ✓); punchy lead (Task 2 ✓); CV PDF lang-aware + served (Tasks 1, 4 ✓); LinkedIn/GitHub icons (Task 4 ✓); brand duotone photo, no signature element (Task 3 ✓); motion + hierarchy (Task 5 ✓); tests + LCP/AA gate (Tasks 2-6 ✓); career history not migrated — already in About (non-goal, respected ✓); `.docx` left in place (non-goal ✓).
- **Placeholder scan:** all code steps show full code; SVG paths, CSS values, and copy are literal. No TBD/TODO.
- **Type/name consistency:** `t.hero.cv`, `cvHref`, `/CarlosMontoya_CV_{EN,ES}.pdf`, the two social URLs, and the H1 aria-label string are identical across Tasks 2, 4, and the tests.
