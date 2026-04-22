# Coding Conventions

**Analysis Date:** 2026-04-21

## Naming Patterns

**Files:**
- React components: PascalCase matching the exported function name — `Nav.js`, `Hero.js`, `About.js`, `Skill.js`, `Experience.js`, `Contact.js`, `Footer.js`
- Context files: PascalCase describing purpose — `LanguageContext.js`
- Data files: camelCase module name — `experience.js`, `translations.js`
- Entry point: lowercase — `index.js`, `index.css`

**Components (functions):**
- Default-exported page-section components use PascalCase: `export default function Hero()`, `export default function Nav()`
- Private sub-components defined in the same file use PascalCase: `function Stat()`, `function Row()`, `function Card()`, `function SectionLabel()`
- Custom hooks use camelCase with `use` prefix: `useLanguage()`

**Variables and constants:**
- Module-level data arrays use UPPER_SNAKE_CASE: `const EXPERIENCE = [...]` in `src/data/experience.js`
- Module-level static arrays use camelCase: `const social = [...]` in `src/components/Footer.js`
- State variables: camelCase — `const [lang, setLangState]`, `const [expanded, setExpanded]`
- Destructured hook values: short, intent-revealing names — `{ lang, setLang, t }`

**Props:**
- Single-letter or abbreviated prop names accepted for private sub-components: `k` (key label), `v` (value), `num`, `last`
- Public component props use descriptive names: `href`, `icon`, `external`, `children`

## Code Style

**Formatting:**
- EditorConfig enforced: 2-space indentation, LF line endings, UTF-8, trailing whitespace trimmed, final newline — see `.editorconfig`
- No Prettier config present — formatting relies on EditorConfig + ESLint

**Linting:**
- ESLint with `airbnb` + `plugin:react/recommended` — see `.eslintrc.js`
- No semicolons (`semi: 0`)
- No comma-dangle enforcement (`comma-dangle: 0`)
- `max-len` disabled — long Tailwind class strings are accepted
- `react/prop-types` disabled — no PropTypes enforcement
- `no-console` disabled — console allowed
- `react/no-array-index-key` disabled — `key={i}` in map is accepted

## Import Organization

**Order observed across components:**
1. `react` and named React hooks — `import React, { useState } from 'react'`
2. Third-party libraries — `import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'`
3. Internal context — `import { useLanguage } from '../i18n/LanguageContext'`
4. Internal data — `import EXPERIENCE from '../data/experience'`
5. CSS — `import './index.css'` (entry point only)

**Path Aliases:**
- `@` maps to `src/` — configured in `jsconfig.json` and `craco.config.js`
- In practice all internal imports use relative paths (`../i18n/`, `../data/`), not the `@` alias

**No barrel files** — each component imports directly from its source file

## Component Structure Pattern

Each component file follows this layout:

```javascript
import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'

// Private sub-components declared BEFORE the default export
function SectionLabel({ children }) { ... }

// Default export is the section component
export default function SectionName() {
  const { t } = useLanguage()
  return ( <section id="section-id"> ... </section> )
}

// Additional private sub-components declared AFTER the default export
function Card({ href, icon, k, v, external }) { ... }
```

Note: `SectionLabel` is duplicated across `About.js`, `Experience.js`, `Contact.js`, and `Skill.js` — it is not extracted into a shared module.

## State Management

**Pattern:** React Context for global state, `useState` for local component state

- Global language state lives in `src/i18n/LanguageContext.js`
- `LanguageProvider` uses `useMemo` to memoize context value, `useCallback` to memoize `setLang`
- Language persisted to `localStorage` under key `cam-lang`; initialized from `localStorage` then `navigator.language` on mount
- Local state (`useState`) used only in `Experience.js` for the expand/collapse toggle: `const [expanded, setExpanded] = useState(false)`

## Data Layer

**Pattern:** Static JS module exported as a default constant

- `src/data/experience.js` exports `EXPERIENCE` — an array of plain objects with bilingual fields (`{ en, es }` per text property)
- `src/i18n/translations.js` exports a `translations` object keyed by `'en'` and `'es'`
- No API calls, no async data fetching in the current codebase (axios is a listed dependency but unused in source)

## Error Handling

**Strategy:** None implemented

- No error boundaries present
- No try/catch blocks in any component
- No null checks on translation keys — assumes `translations[lang]` always resolves
- `dangerouslySetInnerHTML` used in `About.js` for HTML-rich translation strings (`t.about.p1`, `t.about.p2`, `t.about.p3`) — no sanitization

## CSS / Styling

**Pattern:** Tailwind CSS utility classes inline on every element

- No CSS Modules, no styled-components, no Emotion
- Custom Tailwind design tokens used throughout: `bg-ink-900`, `text-slate2-100`, `text-neon`, `bg-grad-neon`, `shadow-neon`, `animate-pulse2`, `animate-fadein`
- Custom tokens defined in `tailwind.config.js`
- Global base styles in `src/index.css`

## Comments

- No inline comments in component source files
- Entry point `src/index.js` retains the CRA-generated comment about `reportWebVitals`
- No JSDoc annotations anywhere in the codebase

## Module Design

**Exports:**
- All components use `export default function ComponentName()` — named exports used only for the `LanguageProvider` and `useLanguage` hook in `src/i18n/LanguageContext.js`
- Data modules use `export default CONSTANT`

---

*Convention analysis: 2026-04-21*
