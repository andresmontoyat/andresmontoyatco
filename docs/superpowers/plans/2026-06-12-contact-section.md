# Contact Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** [`docs/superpowers/specs/2026-06-12-contact-section-design.md`](../specs/2026-06-12-contact-section-design.md)

**Goal:** Land the Contact section as a 5-card responsive grid sourced from a new `src/data/contact.json`, replacing the parked 115-line `Contact.js` with a ~70-line JSON-driven component, stripping the `t.contact` subtree from `translations.js`, and wiring `<Contact />` into `App.js` between `<Hero />` and `<Footer />`. Establishes the JSON-per-section pattern for future slices.

**Architecture:** Single slice on a fresh branch. Atomic commits per logical unit. TDD: tests for the v4 contract land first against the parked component (RED), then the parked component is replaced with the v4 implementation that satisfies them (GREEN). Translations strip happens *after* the parked component is gone so the strip cannot regress an in-flight render.

**Tech Stack:** Vite 6, React 18, Tailwind 3.4, Vitest, `@testing-library/react`. Vite imports JSON natively as the default export.

---

## File Structure (post-slice)

**New files:**
- `src/data/contact.json` — single source for label/h2/intro + 5 cards (Email, Phone, LinkedIn, GitHub, Location), bilingual fields in `{ en, es }` envelope.
- `src/components/Contact.test.js` — 7 test cases.

**Replaced files:**
- `src/components/Contact.js` — overwrite the parked 115-line component with a fresh ~70-line JSON-driven version.

**Modified files:**
- `src/i18n/translations.js` — strip `contact: { … }` subtree from both `en:` and `es:` blocks.
- `src/App.js` — render `<Contact />` between `<Hero />` and `<Footer />` inside `<main>`.

**Untouched (parked, deferred to their own slices):**
- `src/components/About.js`, `Skill.js`, `Experience.js`, `Projects.js`, `Claude.js`
- `src/components/_shared/SectionLabel.js`, `_shared/ThemeToggle.js`
- `src/hooks/useInView.js`
- `src/data/{about,skills,projects,claude,experience}.js`

---

## Task 1: Branch setup + baseline

**Files:** No code changes — branch and measurements only.

- [ ] **Step 1: Decide the base branch**

Run:
```bash
gh pr view 26 --json state,mergedAt 2>/dev/null
```
- If PR #26 is `MERGED`: cut new branch from `origin/main`.
- If PR #26 is still `OPEN`: cut new branch from `v4.0-slice-1-purge` HEAD so the Contact slice stacks on top of the Slice 1 work-in-progress. (Slice 1 docs commits and visual fixes are needed.)

- [ ] **Step 2: Cut branch**

If Slice 1 is merged:
```bash
git fetch origin
git checkout -b v4.0-slice-2-contact origin/main
```

If Slice 1 is still open:
```bash
git fetch origin
git checkout v4.0-slice-1-purge
git pull --ff-only
git checkout -b v4.0-slice-2-contact
```

Verify: `git rev-parse --abbrev-ref HEAD` → `v4.0-slice-2-contact`.

- [ ] **Step 3: Record baseline test count + chunk size**

```bash
npm ci
npm run build 2>&1 | tail -10
npm test -- --run 2>&1 | tail -15 | tee /tmp/slice2-baseline-tests.txt
node -e "
const fs = require('fs'); const path = require('path'); const zlib = require('zlib');
const dir = 'dist/assets';
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
  const buf = fs.readFileSync(path.join(dir, f));
  console.log(f, (zlib.gzipSync(buf).length / 1024).toFixed(2), 'kB gz');
}
" | tee /tmp/slice2-baseline-sizes.txt
```
Expected: 13 tests passing (the Slice 1 close state), single `index-*.js` chunk ~53 kB gz, bundle gate exit 0.

- [ ] **Step 4: No commit** — Task 1 is reconnaissance only.

---

## Task 2: Add `src/data/contact.json`

**Files:**
- Create: `src/data/contact.json`

- [ ] **Step 1: Write the file**

Create `src/data/contact.json` with EXACTLY this content:

```json
{
  "label": { "en": "Contact", "es": "Contacto" },
  "h2": { "en": "Let's build something", "es": "Construyamos algo juntos" },
  "intro": { "en": "Open to senior backend, architecture and technical leadership roles. Feel free to reach out.", "es": "Abierto a roles senior de backend, arquitectura y liderazgo técnico. Escríbeme sin pena." },
  "cards": [
    {
      "id": "email",
      "icon": "✉",
      "kLabel": { "en": "Email", "es": "Correo" },
      "value": "andresmontoyat@gmail.com",
      "href": "mailto:andresmontoyat@gmail.com"
    },
    {
      "id": "phone",
      "icon": "☎",
      "kLabel": { "en": "Phone", "es": "Teléfono" },
      "value": "+57 324 442 2196",
      "href": "tel:+573244422196"
    },
    {
      "id": "linkedin",
      "icon": "in",
      "kLabel": { "en": "LinkedIn", "es": "LinkedIn" },
      "value": "carlos-andres-montoya-tobon",
      "href": "https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033",
      "external": true
    },
    {
      "id": "github",
      "icon": "gh",
      "kLabel": { "en": "GitHub", "es": "GitHub" },
      "value": "andresmontoyat",
      "href": "https://github.com/andresmontoyat",
      "external": true
    },
    {
      "id": "location",
      "icon": "◆",
      "kLabel": { "en": "Location", "es": "Ubicación" },
      "value": "Medellín, Colombia",
      "href": null
    }
  ]
}
```

- [ ] **Step 2: Verify it parses as JSON**

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('src/data/contact.json','utf8')).cards.length)"
```
Expected: `5`.

- [ ] **Step 3: Commit**

```bash
git add src/data/contact.json
git commit -m "feat(v4.0-slice-2): add src/data/contact.json — 5-card bilingual data"
```

---

## Task 3: Write Contact tests (RED phase)

**Files:**
- Create: `src/components/Contact.test.js`

- [ ] **Step 1: Write the test file**

Create `src/components/Contact.test.js` with this content:

```jsx
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { LanguageProvider, useLanguage } from '../i18n/LanguageContext'
import Contact from './Contact'
import data from '../data/contact.json'

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
      <Contact />
    </LanguageProvider>,
  )
}

describe('Contact (v4.0 Slice 2)', () => {
  it('renders the section with id="contact"', () => {
    const { container } = renderWithLang('en')
    expect(container.querySelector('section#contact')).toBeInTheDocument()
  })

  it('renders exactly 5 contact cards', () => {
    renderWithLang('en')
    // 4 anchor cards + 1 non-link card; locate by data values
    expect(screen.getByText('andresmontoyat@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('+57 324 442 2196')).toBeInTheDocument()
    expect(screen.getByText('carlos-andres-montoya-tobon')).toBeInTheDocument()
    expect(screen.getByText('andresmontoyat')).toBeInTheDocument()
    expect(screen.getByText('Medellín, Colombia')).toBeInTheDocument()
  })

  it('Email card href is mailto:', () => {
    renderWithLang('en')
    const el = screen.getByText('andresmontoyat@gmail.com').closest('a')
    expect(el).not.toBeNull()
    expect(el.getAttribute('href')).toBe('mailto:andresmontoyat@gmail.com')
  })

  it('external cards (LinkedIn, GitHub) open in new tab with rel=noopener noreferrer', () => {
    renderWithLang('en')
    const linkedin = screen.getByText('carlos-andres-montoya-tobon').closest('a')
    const github = screen.getByText('andresmontoyat').closest('a')
    for (const a of [linkedin, github]) {
      expect(a).not.toBeNull()
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.getAttribute('rel')).toBe('noopener noreferrer')
    }
  })

  it('Location is NOT a link (no anchor wrapper)', () => {
    renderWithLang('en')
    const el = screen.getByText('Medellín, Colombia')
    expect(el.closest('a')).toBeNull()
  })

  it('translates label/h2/intro and kLabels when lang=es', () => {
    renderWithLang('es')
    expect(screen.getByText('Contacto')).toBeInTheDocument()
    expect(screen.getByText('Construyamos algo juntos')).toBeInTheDocument()
    expect(screen.getByText('Correo')).toBeInTheDocument()
    expect(screen.getByText('Teléfono')).toBeInTheDocument()
    expect(screen.getByText('Ubicación')).toBeInTheDocument()
  })

  it('contact.json schema sanity — 5 cards, each with required keys', () => {
    expect(Array.isArray(data.cards)).toBe(true)
    expect(data.cards).toHaveLength(5)
    for (const c of data.cards) {
      expect(typeof c.id).toBe('string')
      expect(typeof c.icon).toBe('string')
      expect(typeof c.value).toBe('string')
      expect(typeof c.kLabel.en).toBe('string')
      expect(typeof c.kLabel.es).toBe('string')
    }
  })
})
```

- [ ] **Step 2: Run the test in isolation — expect RED**

```bash
npx vitest run src/components/Contact.test.js --reporter=verbose 2>&1 | tail -40
```

Expected: **failures.** The parked `Contact.js` does NOT match the new contract — it renders an EmailHeroCard + 3 SecondaryCards (not 5 equal cards), no Location card, and reads from `t.contact.*` instead of `contact.json`. The most likely failures: "Medellín, Colombia" not found, "ubicación" label missing, possibly mailto check.

Cases 1 (smoke) and 7 (JSON schema) should PASS already — they don't depend on the new component. The remaining 5 cases should FAIL. This is the expected RED state.

If ALL tests fail, something is wrong with the render setup — investigate `LanguageProvider` import or `cam-lang` localStorage behavior before continuing.

- [ ] **Step 3: Commit the failing tests**

```bash
git add src/components/Contact.test.js
git commit -m "test(v4.0-slice-2): add Contact tests against v4 contract (RED)"
```

---

## Task 4: Replace `src/components/Contact.js` with v4 implementation (GREEN phase)

**Files:**
- Replace: `src/components/Contact.js`

- [ ] **Step 1: Overwrite `src/components/Contact.js`**

Overwrite the ENTIRE contents of `src/components/Contact.js` with:

```jsx
import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import data from '../data/contact.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}

function Card({ card, lang }) {
  const k = pick(card.kLabel, lang)
  const v = card.value
  const classes =
    'block bg-surface border border-border rounded-[14px] p-6 text-center '
    + 'transition-all duration-300 hover:border-accent hover:-translate-y-1 '
    + 'hover:shadow-[0_20px_30px_-20px_rgba(0,229,168,0.3)]'
  const inner = (
    <>
      <div className="text-3xl mb-3 text-accent" aria-hidden="true">{card.icon}</div>
      <div className="text-xs uppercase tracking-widest text-muted mb-1.5">{k}</div>
      <div className="text-sm font-semibold text-text break-all">{v}</div>
    </>
  )
  if (!card.href) {
    return (
      <div className={classes} aria-label={`${k}: ${v}`}>
        {inner}
      </div>
    )
  }
  return (
    <a
      href={card.href}
      title={k}
      {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={classes}
    >
      {inner}
    </a>
  )
}

export default function Contact() {
  const { lang } = useLanguage()
  return (
    <section id="contact" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="font-mono text-xs uppercase tracking-[3px] text-accent flex items-center gap-3 mb-4">
          <span className="block w-10 h-0.5 bg-accent" /> {pick(data.label, lang)}
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-text mb-4 leading-tight">
          {pick(data.h2, lang)}
        </h2>
        <p className="text-muted max-w-[640px] mb-12 text-base">{pick(data.intro, lang)}</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {data.cards.map((c) => <Card key={c.id} card={c} lang={lang} />)}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Run the Contact tests again — expect GREEN**

```bash
npx vitest run src/components/Contact.test.js --reporter=verbose 2>&1 | tail -20
```
Expected: **7 passed**, 0 failed.

If any test still fails:
- Test 4 (external `rel` attribute): React expands `target="_blank"` props to a single string. If the assertion sees `"noopener noreferrer "` (trailing space) or only `"noopener"`, double-check the JSX spread is exactly `{ target: '_blank', rel: 'noopener noreferrer' }`.
- Test 6 (language switch): if the wrong language shows, check `LanguageProvider` reads `localStorage.cam-lang` synchronously on first render. It does (we verified earlier), but a stale `cam-lang` from a previous test could leak — note that vitest uses jsdom which resets `localStorage` per test file but NOT per test case. If needed, set `localStorage.removeItem('cam-lang')` in a `beforeEach`.

- [ ] **Step 3: Run the entire suite**

```bash
npm test -- --run 2>&1 | tail -15
```
Expected: 13 (existing) + 7 (Contact) = 20 tests passing across 4 test files (Contact, App, setup, bundle-gate).

If `App.test.js` regresses, it's because `App.js` now does NOT yet render Contact — but the App smoke test does NOT assert on Contact, so it should still pass. Investigate if it doesn't.

- [ ] **Step 4: Commit**

```bash
git add src/components/Contact.js
git commit -m "refactor(v4.0-slice-2): replace parked Contact.js with v4 JSON-driven component"
```

---

## Task 5: Strip `t.contact` subtree from `src/i18n/translations.js`

**Files:**
- Modify: `src/i18n/translations.js`

- [ ] **Step 1: Confirm no surviving code references `t.contact.*`**

```bash
rg "t\.contact\.|translations\.\w+\.contact\." src --type js 2>/dev/null
```
Expected: no output. Task 4 replaced the only consumer (`Contact.js`) with one that reads `contact.json`. If hits remain, STOP and investigate.

- [ ] **Step 2: Locate the `contact:` start lines in both blocks**

```bash
rg -n "^\s+contact:\s*\{" src/i18n/translations.js
```
Expected: 2 matches — one in `en:`, one in `es:`.

- [ ] **Step 3: Remove BOTH `contact: { … }` subtrees with `Edit`**

Use `Read` to inspect each occurrence first, then a precise `Edit` per language block. The EN subtree looks roughly like:

```js
    contact: {
      label: 'Contact',
      h2: "Let's build something",
      intro: 'Open to senior backend, architecture and technical leadership roles. Feel free to reach out.',
      phone: 'Phone',
      email: 'Email',
    },
```

And the ES:

```js
    contact: {
      label: 'Contacto',
      h2: 'Construyamos algo juntos',
      intro: 'Abierto a roles senior de backend, arquitectura y liderazgo técnico. Escríbeme sin pena.',
      phone: 'Teléfono',
      email: 'Correo',
    },
```

Remove each block including the trailing comma so the surrounding parent object remains valid. Do NOT touch `nav.contact` (that's the Nav label, which stays).

- [ ] **Step 4: Verify it still parses**

```bash
node -e "import('./src/i18n/translations.js').then(m => console.log(Object.keys(m.translations.en).filter(k => k === 'contact').length === 0 ? 'STRIPPED' : 'STILL PRESENT'))"
```
Expected: `STRIPPED`.

- [ ] **Step 5: Re-grep for orphan references**

```bash
rg "t\.contact" src --type js 2>/dev/null
```
Expected: no output.

- [ ] **Step 6: Run the full suite**

```bash
npm test -- --run 2>&1 | tail -15
```
Expected: 20 tests passing.

- [ ] **Step 7: Commit**

```bash
git add src/i18n/translations.js
git commit -m "refactor(v4.0-slice-2): strip t.contact subtree from translations.js"
```

---

## Task 6: Wire `<Contact />` into `src/App.js`

**Files:**
- Modify: `src/App.js`

- [ ] **Step 1: Edit `src/App.js`**

Replace the current contents of `src/App.js` with:

```jsx
import React from 'react'

import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './i18n/ThemeContext'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-bg text-text font-sans antialiased">
          <Nav />
          <main>
            <Hero />
            <Contact />
          </main>
          <Footer />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}
```

- [ ] **Step 2: Run the full suite**

```bash
npm test -- --run 2>&1 | tail -15
```
Expected: 20 tests passing. App smoke test still asserts on Nav / Hero / Footer landmarks and the v4 shell classes — none of which change.

- [ ] **Step 3: Build clean**

```bash
npm run build 2>&1 | tail -10
```
Expected: `✓ built in …`, single `index-*.js` chunk emitted, no warnings.

- [ ] **Step 4: Bundle-gate**

```bash
node scripts/check-bundle-gate.mjs
echo "exit: $?"
```
Expected: `bundle-gate OK — index-*.js = NN.NN kB gz (WARN 60, HARD 68)`, exit 0. Adding Contact + json should add ~1–2 kB gz.

- [ ] **Step 5: Commit**

```bash
git add src/App.js
git commit -m "feat(v4.0-slice-2): wire <Contact /> into App.js between Hero and Footer"
```

---

## Task 7: Final gates — Lighthouse mobile

**Files:** No code changes — verification only.

- [ ] **Step 1: Run Lighthouse mobile**

```bash
npm run lighthouse:mobile 2>&1 | tail -40
```

- [ ] **Step 2: Verify the four category scores**

```bash
node -e "
const fs = require('fs');
const candidates = fs.readdirSync('.').filter(f => f.startsWith('lighthouse-report-mobile') && f.endsWith('.json'));
const file = candidates[0];
if (!file) { console.error('no lighthouse JSON found'); process.exit(1); }
const r = JSON.parse(fs.readFileSync(file, 'utf8'));
const c = r.categories;
console.log('file:', file);
console.log('perf:', c.performance.score);
console.log('a11y:', c.accessibility.score);
console.log('bp:  ', c['best-practices'].score);
console.log('seo: ', c.seo.score);
console.log('PASS:', (c.performance.score >= 0.97 && c.accessibility.score === 1 && c['best-practices'].score === 1 && c.seo.score === 1) ? 'YES' : 'NO');
"
```

Expected: `PASS: YES`. All four categories meet thresholds (Perf ≥ 0.97, A11y / BP / SEO = 1.00).

If a category regresses:
- A11y: most likely a missing label on a contact card. Check that the Location `<div>` has `aria-label` and that anchors have `title` (Lighthouse uses any of: text content, `aria-label`, `title`).
- BP: rare; if it surfaces, check for console errors in headless run.
- SEO: no copy was removed from Hero or `<head>`; should not regress.
- Perf: card icons are unicode; no image downloads added. Unlikely.

- [ ] **Step 3: No commit** — verification only.

---

## Task 8: Push branch + open PR

**Files:** No code changes — branch publication.

- [ ] **Step 1: Sanity check the log**

```bash
git log --oneline origin/main..HEAD 2>/dev/null || git log --oneline v4.0-slice-1-purge..HEAD
```
Expected: 5 atomic commits prefixed with `feat(v4.0-slice-2): …` / `refactor(v4.0-slice-2): …` / `test(v4.0-slice-2): …`, in this order:
1. `feat: add contact.json`
2. `test: Contact tests (RED)`
3. `refactor: replace Contact.js with v4 component`
4. `refactor: strip t.contact subtree`
5. `feat: wire <Contact /> into App.js`

- [ ] **Step 2: Push**

```bash
git push -u origin v4.0-slice-2-contact
```

- [ ] **Step 3: Open PR via `gh`**

```bash
gh pr create --title "v4.0 Slice 2 — Contact section" --body "$(cat <<'EOF'
## Summary

Second slice of v4.0 portfolio MVP redesign. Establishes the JSON-per-section pattern with a clean 5-card Contact grid (Email / Phone / LinkedIn / GitHub / Location).

- ➕ `src/data/contact.json` — single source for label/h2/intro + 5 cards, bilingual `{ en, es }` envelope.
- ♻️ `src/components/Contact.js` — replaced parked 115-line component with ~70-line JSON-driven version. Visual contract calques `website-new/index.html` `.contact-grid` + `.contact-card` (surface bg, border, hover translateY −4 px + accent border).
- ❌ `t.contact` subtree stripped from `src/i18n/translations.js` (both EN and ES blocks). No surviving consumers.
- 🔗 `<Contact />` wired into `App.js` between `<Hero />` and `<Footer />`.

Visual reference: `website-new/index.html`.
Spec: `docs/superpowers/specs/2026-06-12-contact-section-design.md`
Plan: `docs/superpowers/plans/2026-06-12-contact-section.md`

## Test plan

- [x] `npm test -- --run` — **20/20 GREEN** (existing 13 + Contact 7).
- [x] `npm run build` — clean, single `index-*.js` chunk.
- [x] `node scripts/check-bundle-gate.mjs` — exit 0 (HARD 68 stays comfortable).
- [x] `npm run lighthouse:mobile` — Perf ≥ 0.97 / A11y 1.00 / BP 1.00 / SEO 1.00.
- [ ] Visual smoke on Vercel preview — 5 cards render, hover translateY works, EN↔ES toggle translates labels, LinkedIn + GitHub open in new tab, Location does NOT navigate.

## Next slice

Slice 3 — **About**: `.about-grid` `1.2fr / .8fr` layout with bilingual narrative + Quick Facts side card. Reuses the JSON-per-section pattern landed here.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Verify PR URL returned + paste into the slice closure note.**

---

## Self-Review (filled in after writing the plan above)

**Spec coverage:**
- Spec §2 G1 (5-card grid) → Task 4 (component) + Task 3 (test cases 2 + 5)
- Spec §2 G2 (data in contact.json) → Task 2 + Task 5
- Spec §2 G3 (establish pattern) → produced as a side effect of Tasks 2, 3, 4
- Spec §2 G4 (gates) → Tasks 1, 6 step 4, 7
- Spec §3 non-goals — enforced by NOT having tasks for them (no form, no obfuscation, no animation, no deps cleanup)
- Spec §5.1 file structure → File Structure section + Tasks 2/3/4/5/6
- Spec §5.2 contact.json shape → Task 2 Step 1 (literal JSON)
- Spec §5.3 Contact.js (~70 lines) → Task 4 Step 1 (literal JSX)
- Spec §5.4 visual contract → embedded inside Task 4 className strings
- Spec §5.5 App.js wire → Task 6
- Spec §5.6 translations strip → Task 5
- Spec §5.7 7 test cases → Task 3 (all 7 cases verbatim)
- Spec §6 mandatory exit gates → Tasks 6 (build + bundle-gate), 7 (Lighthouse)
- Spec §8 risk: t.contact references → Task 5 Step 1 grep
- Spec §8 risk: long email overflow → addressed by `break-all` className in Task 4
- Spec §10 commit plan → Tasks 2, 3, 4, 5, 6 commit messages match (one extra commit — the RED-phase tests — is documented in the plan)

**Placeholder scan:** None. Every command and every code block is concrete.

**Type consistency:** Field names (`label`, `h2`, `intro`, `cards[]`, `id`, `icon`, `kLabel.en/es`, `value`, `href`, `external`) are identical across Task 2 (JSON), Task 3 (test assertions), Task 4 (component code), and the spec. The `pick` helper name is consistent. The `Contact` and `Card` component names are consistent. `bg-surface`, `text-accent`, `text-muted`, `text-text`, `border` Tailwind classes are consistent with the tokens added in Slice 1 (`tailwind.config.js` already maps them — verified during Slice 1 build).

---

*End of plan.*
