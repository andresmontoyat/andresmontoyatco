# Hero Redesign — Design Spec

**Date:** 2026-07-01
**Status:** Approved (brainstorm)
**Scope:** Single-section redesign of the portfolio Hero. Evolves the current layout (does not restructure it).

## Goal

Sharpen the Hero's first impression so a recruiter scanning the page immediately reads **who Carlos is → the value he delivers → how to act**, without degrading the v4.1 LCP performance win. Improvements span four dimensions the user selected: message/copy, CTAs/conversion, visual impact (photo), and typographic hierarchy/motion.

**Core value (project constant):** the Hero must stop recruiters mid-scroll and convert visits into engineering conversations.

## Decisions (locked)

| # | Area | Decision |
|---|------|----------|
| 1 | Layout | **Evolve current (Option A).** Full-bleed background photo (static LCP layer in `index.html`), left-aligned text stack, same element order. No structural change. LCP architecture preserved. |
| 2 | H1 | **Role-forward.** "Solutions Architect & Senior Backend Engineer." Consistent with `<title>`, OG tags, and JSON-LD `jobTitle`. Middle line keeps the gradient + char-reveal typing signature. |
| 3 | Lead | **Punchy value-prop.** Replaces the dense career-history paragraph. The career history is NOT lost — it already lives verbatim in the About section (`src/data/about.json`). |
| 4 | CTAs | **Clean set.** Primary "Get in touch" (→ `#contact`) + single "Download CV" (PDF, resolves by active language) + LinkedIn/GitHub icon links. Replaces the two `.docx` download buttons. |
| 5 | Photo | **Brand duotone.** Photo visible (not near-black), teal/blue brand tint, dark gradient at bottom for text legibility. **No signature background element** (no grid, no glow). |
| 6 | Motion + hierarchy | Keep char-reveal + slide-up entrance; unify easing, tighten stagger. Increase H1 scale/contrast, refine spacing, make stats slightly more present. |

## Content

### Copy — `src/i18n/translations.js` (`hero` key)

**status** (unchanged):
- en: "Available for new opportunities"
- es: "Disponible para nuevas oportunidades"

**H1** — three spans; middle span (`h1b`) renders with `bg-brand-gradient` + char-reveal:
- en: `h1a`="Solutions Architect &", `h1b`="Senior Backend", `h1c`="Engineer."
- es: `h1a`="Arquitecto de Soluciones", `h1b`="e Ingeniero", `h1c`="Backend Senior."

**lead**:
- en: "I design and ship backend platforms that scale — clean hexagonal architecture, cloud-native, 18+ years, zero shortcuts."
- es: "Diseño y entrego plataformas backend que escalan — arquitectura hexagonal limpia, cloud-native, +18 años, cero atajos."

**cta1** (unchanged): "Get in touch" / "Contáctame"

**stats** (unchanged): 18+ Years / 45+ Team led / 15+ Companies / 8 Industries.

### CTAs — `src/components/Hero.jsx`

Three items in the CTA row:
1. **Primary** — "Get in touch →", anchor to `#contact`, existing `bg-brand-gradient` pill style.
2. **Download CV** — single secondary button. `href` resolves by active `lang`: `/CarlosMontoya_CV_EN.pdf` (en) or `/CarlosMontoya_CV_ES.pdf` (es), `download` attribute. Label "Download CV" / "Descargar CV".
3. **Social icons** — LinkedIn + GitHub, rendered as inline SVG brand glyphs (no new dependency — FontAwesome was removed at v4.0; Footer uses text labels). URLs from `src/data/contact.json` (github: `https://github.com/andresmontoyat`, linkedin: `https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033`). `target="_blank"`, `rel="noopener noreferrer"`, `aria-label` ("LinkedIn profile" / "GitHub profile", bilingual). Min 44×44 touch target.

### Photo treatment — `index.html` (inline `<style>`, static LCP layer)

Update the existing CSS custom properties (keep everything static so the hero `<img>` still paints with FCP and qualifies as LCP):
- `--hero-photo-filter`: from `grayscale(0.2) brightness(0.35)` → `grayscale(0.35) brightness(0.62) contrast(1.06)`.
- `--hero-overlay`: brand duotone — a teal/blue gradient (multiply) layered with a bottom-weighted dark gradient for legibility. Concretely: keep the `#hero-static .hero-static-ovl` element for the legibility gradient, and add the brand tint either as a second gradient in the same overlay or a stacked `background`. Exact color stops tuned during implementation against WCAG AA.

**Constraint:** text over the photo (H1, lead, status, stats) must hold WCAG 2.1 AA contrast. Verify after tuning.

### Assets — `public/`

Copy the generated ATS PDFs into the served static dir:
- `cv/CarlosMontoya_CV_EN.pdf` → `public/CarlosMontoya_CV_EN.pdf`
- `cv/CarlosMontoya_CV_ES.pdf` → `public/CarlosMontoya_CV_ES.pdf`

The existing `public/CV_Carlos_Montoya_{EN,ES}.docx` become unreferenced by the Hero. Leave them in place (cleanup is optional, out of scope).

## Components / units touched

| File | Change |
|------|--------|
| `src/i18n/translations.js` | H1 spans restructured (role-forward), lead rewritten, both languages. |
| `index.html` | Photo CSS vars → brand duotone. Static, no JS. |
| `src/components/Hero.jsx` | CTA row: single lang-aware CV button + inline-SVG LinkedIn/GitHub links; H1 unchanged in mechanics (still 3 spans, char-reveal on `h1b`); easing/stagger + hierarchy refinements. |
| `src/components/Hero.test.jsx` | Update assertions (role-forward H1 text, CV button href by lang, social links present + accessible). |
| `public/CarlosMontoya_CV_{EN,ES}.pdf` | New served assets (copied from `cv/`). |

## Error handling / edge cases

- **Reduced motion:** existing `prefers-reduced-motion` guard in `useCharReveal` and the `motion-safe:` Tailwind variants stay — full text shown immediately, no entrance animation. Unchanged behavior.
- **Language switch:** CV button `href` recomputes from `lang` on re-render; no stale link.
- **Missing PDF:** if an asset is absent the browser download fails gracefully (standard 404); mitigated by the copy step being part of the plan and asserted in build.

## Testing strategy

- Unit (`Hero.test.jsx`, vitest + RTL): H1 renders role-forward text (aria-label covers all three spans); lead renders new copy; primary CTA links `#contact`; CV button `href` equals the PDF for the active language and toggles when language changes; LinkedIn + GitHub links present with correct `href` + `aria-label` + `rel`.
- Keep both EN/ES paths covered.
- Full suite stays GREEN (`npx vitest run`).
- **LCP / Lighthouse:** photo remains a static `index.html` layer. After the change, mobile Lighthouse gate (Perf ≥95 / A11y 100 / BP 100 / SEO 100) must still pass; AA contrast of text over the new photo treatment verified.

## Non-goals (YAGNI)

- No layout restructure (no split/editorial). Option A only.
- No signature background element (grid/glow) — explicitly dropped by the user.
- No "schedule a call" / Calendly CTA.
- No migration of career-history copy (already in About).
- No `.docx` removal (optional cleanup, separate).
- No `hero.json` extraction (Hero content stays in `translations.js`, matching current code; out of scope for this pass).
