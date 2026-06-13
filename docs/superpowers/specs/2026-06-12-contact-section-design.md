# Slice 2 — Contact Section

**Date:** 2026-06-12
**Status:** DRAFT — awaiting user review
**Author:** Carlos Andrés Montoya (drafted with Claude)
**Milestone:** v4.0 — Portfolio MVP redesign (section-by-section)
**Predecessor:** Slice 1 — Game Purge + Base Palette (PR #26)

---

## 1. Context & Motivation

Slice 1 cleared the failed game-mode lineage and landed the dark palette. The page currently renders `Nav + Hero + Footer` with no body sections in between. Slice 2 introduces the first real section in the v4.0 design: **Contact** — a 5-card grid (Email / Phone / LinkedIn / GitHub / Location) matching `website-new/index.html`.

Contact is chosen first because it is the smallest, most self-contained section: pure static data, no narrative copy, no scroll animation, no JSON shape ambiguity. It also establishes the **JSON-per-section** pattern (`src/data/<section>.json`) that subsequent slices (About, Skills, Experience, Projects, Claude) will reuse.

The recruiter's likely path through the page right now is `Hero → Footer`. Slice 2 inserts `Hero → Contact → Footer`, giving them a clear "how to reach out" surface before the bottom of the page.

## 2. Goals

- **G1.** Render five contact cards (Email / Phone / LinkedIn / GitHub / Location) in a responsive auto-fit grid, matching the `website-new` visual contract.
- **G2.** Move all Contact data to `src/data/contact.json` — single source for the section, bilingual fields where applicable.
- **G3.** Establish the section component pattern (component + JSON + tests) that future slices reuse.
- **G4.** Keep the build green, the bundle gate clean, and Lighthouse mobile passing the existing thresholds.

## 3. Non-Goals (explicit out-of-scope)

- Contact form submission, captcha, or anti-spam handling. The email address is public on the resume; cards are static links.
- Email obfuscation (Cloudflare-style `[at]` replacement). Recruiter convenience > basic crawler protection.
- New scroll-reveal animation (`useInView`). Slice 2 ships static; a later "polish" slice may add reveal across all sections at once.
- Refactor of `Nav.js`, `Hero.js`, `Footer.js` visuals.
- Migration of any other section's data to JSON. Each section owns its slice.
- Removing the `react-hook-form` orphan dependency (no longer used after parked `Contact.js` is replaced) — defer to a deps-cleanup slice.

## 4. Approach Selected

From three options (new component + `contact.json` / refactor parked component + extend translations / hybrid), the user chose **new component + `contact.json`**. This deletes the parked 115-line `Contact.js` and writes a fresh ~70-line component reading from JSON, stripping `t.contact` from `translations.js`.

## 5. Detailed Design

### 5.1 File structure

```
src/
├── App.js                            ← +1 line: <Contact /> between <Hero /> and <Footer />
├── components/
│   ├── Contact.js                    ← REWRITE (parked 115 lines → fresh ~70 lines)
│   └── Contact.test.js               ← NEW (7 cases)
├── data/
│   └── contact.json                  ← NEW (single source for section data)
└── i18n/
    └── translations.js               ← strip t.contact subtree (both en: and es:)
```

### 5.2 `src/data/contact.json` (final, exact shape)

```json
{
  "label":  { "en": "Contact", "es": "Contacto" },
  "h2":     { "en": "Let's build something", "es": "Construyamos algo juntos" },
  "intro":  { "en": "Open to senior backend, architecture and technical leadership roles. Feel free to reach out.", "es": "Abierto a roles senior de backend, arquitectura y liderazgo técnico. Escríbeme sin pena." },
  "cards": [
    { "id": "email",    "icon": "✉",  "kLabel": { "en": "Email",    "es": "Correo" },    "value": "andresmontoyat@gmail.com",          "href": "mailto:andresmontoyat@gmail.com" },
    { "id": "phone",    "icon": "☎",  "kLabel": { "en": "Phone",    "es": "Teléfono" },  "value": "+57 324 442 2196",                  "href": "tel:+573244422196" },
    { "id": "linkedin", "icon": "in", "kLabel": { "en": "LinkedIn", "es": "LinkedIn" },  "value": "carlos-andres-montoya-tobon",       "href": "https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033", "external": true },
    { "id": "github",   "icon": "gh", "kLabel": { "en": "GitHub",   "es": "GitHub" },    "value": "andresmontoyat",                    "href": "https://github.com/andresmontoyat",                                  "external": true },
    { "id": "location", "icon": "◆",  "kLabel": { "en": "Location", "es": "Ubicación" }, "value": "Medellín, Colombia",                "href": null }
  ]
}
```

Conventions:
- `href: null` → render as `<div>` (non-actionable). Used for Location.
- `external: true` → render with `target="_blank" rel="noopener noreferrer"`. Used for LinkedIn and GitHub.
- Bilingual fields use the `{ "en": ..., "es": ... }` envelope. Non-bilingual fields (URLs, phone, email, icon glyph) are plain strings.

### 5.3 `src/components/Contact.js` (final, ~70 lines)

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
    'block bg-surface border border-border rounded-[14px] p-6 text-center ' +
    'transition-all duration-300 hover:border-accent hover:-translate-y-1 ' +
    'hover:shadow-[0_20px_30px_-20px_rgba(0,229,168,0.3)]'
  const inner = (
    <>
      <div className="text-3xl mb-3 text-accent" aria-hidden="true">{card.icon}</div>
      <div className="text-xs uppercase tracking-widest text-muted mb-1.5">{k}</div>
      <div className="text-sm font-semibold text-text break-all">{v}</div>
    </>
  )
  if (!card.href) {
    return <div className={classes} aria-label={`${k}: ${v}`}>{inner}</div>
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

### 5.4 Visual contract (matches `website-new/index.html` Contact section)

| Element | Treatment |
|---------|-----------|
| Section padding | `py-20` (80 px vertical) |
| Container max-width | `max-w-6xl` (1152 px), `px-6` |
| Section label | mono 12 px, uppercase, letter-spacing 3 px, accent color, 40×2 px line prefix |
| H2 | `text-3xl sm:text-4xl md:text-[42px]`, weight 800, tight tracking |
| Intro | `text-muted`, `max-w-[640px]`, `mb-12` |
| Card grid | `auto-fit minmax(220px, 1fr)`, gap 16 px |
| Card | `bg-surface border border-border rounded-[14px] p-6 text-center` |
| Card hover | `border-accent`, `-translate-y-1`, soft accent shadow |
| Card icon | `text-3xl text-accent mb-3`, `aria-hidden="true"` |
| Card k-label | `text-xs uppercase tracking-widest text-muted mb-1.5` |
| Card value | `text-sm font-semibold text-text break-all` |

### 5.5 `App.js` wire-in

Final layout becomes:

```jsx
<div className="min-h-screen bg-bg text-text font-sans antialiased">
  <Nav />
  <main>
    <Hero />
    <Contact />
  </main>
  <Footer />
</div>
```

Contact is inside `<main>` next to Hero. No outer `container` wrapper — Contact owns its own `max-w-6xl mx-auto px-6` inner container, identical to the pattern Hero already uses.

### 5.6 `translations.js` strip

Remove the `contact: { … }` subtree from both the `en:` and `es:` blocks. Two `Edit` calls, one per language. Other top-level keys (`nav`, `meta`, `hero`, `stats`, `about`, `skills`, `exp`, `projects`, `claude`, `footer`) are untouched.

Before the strip, grep verifies no surviving code references `t.contact.*` (the new `Contact.js` reads `contact.json`, not translations).

### 5.7 Tests (`src/components/Contact.test.js`, 7 cases)

Each test sets up `<LanguageProvider>` and renders `<Contact />` inside it.

1. **Smoke.** `<section id="contact">` is present.
2. **Card count.** Exactly 5 cards rendered (anchors + the Location `<div>`).
3. **Email card href.** Element whose value is `andresmontoyat@gmail.com` closest `<a>` has `href="mailto:andresmontoyat@gmail.com"`.
4. **External cards open in new tab.** LinkedIn and GitHub anchors both have `target="_blank"` and `rel="noopener noreferrer"`.
5. **Location is not a link.** Element whose value is `Medellín, Colombia` has no enclosing `<a>`.
6. **Language switch translates UI strings.** Rendering in `es` shows "Contacto", "Construyamos algo juntos", "Correo", "Teléfono", "Ubicación".
7. **JSON schema sanity.** `data.cards` has length 5; every card has the keys `id`, `icon`, `kLabel.en`, `kLabel.es`, `value`. Guards future JSON edits against accidental shape drift.

Tests use the existing `@testing-library/react` + `vitest` toolchain — no new test infrastructure.

## 6. Mandatory exit gates

- `npm test -- --run` — **all GREEN**. Expected post-slice: 13 (existing) + 7 (Contact) = 20 tests across 4 files.
- `npm run build` — clean, no warnings.
- `node scripts/check-bundle-gate.mjs` — exit 0. Adding `Contact.js` + `contact.json` is < 2 kB gz; new `index-*.js` size expected ≤ 55 kB gz (WARN 60, HARD 68 stay comfortable).
- `npm run lighthouse:mobile` — Perf ≥ 0.97 / A11y = 1.00 / BP = 1.00 / SEO = 1.00.

## 7. Error Handling

- `Contact.js` does not perform I/O; it imports JSON statically at build time. No runtime failure modes.
- Missing keys in `contact.json` resolve to `''` via the `pick` helper. Tests catch this via case 7.
- External links fail gracefully — browser native behavior if the URL is unreachable. No app-level handling needed.

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `t.contact.*` referenced outside `Contact.js` (e.g., Hero CTA "Get in touch" link target) | low | broken render or missing label | grep `t\.contact\.` before stripping; if hits exist, replace those references with literal strings or another translation key before strip |
| `react-hook-form` import survives in some other parked file | very low | linter complaint, no runtime issue | grep `react-hook-form` after parked Contact.js deletion |
| Long email overflows on narrow viewports (~320 px) | low | visual ugliness | `break-all` on value text + 220 px min column already accommodate; UAT covers 375 px |
| Card hover `translate-y` adds CLS | very low | Lighthouse perf hit | transform-only, GPU-composited, no reflow; Lighthouse mobile check confirms |
| Unicode card icons (`✉ ☎ ◆`) render inconsistently across platforms | medium | visual nit | accepted for Slice 2; later slice can swap to inline SVG if needed |

## 9. Migration & Rollback

- New branch `v4.0-slice-2-contact`. Cut from `main` once Slice 1 (PR #26) merges. If Slice 1 is still pending merge at exec time, cut from `v4.0-slice-1-purge` instead — owner decision at execute time.
- Atomic commits per logical unit, see commit plan §10.
- Rollback = revert merge commit. No data migration, no localStorage state, no schema versioning needed.

## 10. Commit Plan

1. `feat(v4.0-slice-2): add src/data/contact.json — 5-card bilingual data`
2. `refactor(v4.0-slice-2): replace parked Contact.js with v4.0 component`
3. `refactor(v4.0-slice-2): strip t.contact subtree from translations.js`
4. `feat(v4.0-slice-2): wire <Contact /> into App.js between Hero and Footer`
5. `test(v4.0-slice-2): Contact component + JSON schema sanity (7 cases)`

## 11. Open Questions

None. Implementation can proceed directly to writing-plans.

## 12. Next Slice Preview

Slice 3 candidate: **About**. Establishes the `.about-grid` (`1.2fr .8fr`) layout with bilingual narrative paragraphs + the Quick Facts side card from `website-new/index.html`. Data lives in `src/data/about.json`. Will reuse the JSON-per-section pattern this Slice introduces.

---

*End of design.*
