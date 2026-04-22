<!-- GSD:project-start source:PROJECT.md -->
## Project

**Carlos Montoya Portfolio — Redesign**

A bold, creative personal portfolio website for Carlos Andres Montoya, a senior backend engineer. The site targets recruiters and employers, designed to make a powerful first impression with rich animations, dynamic layouts, and a distinctive visual identity. Fully bilingual (English/Spanish) with flawless mobile experience.

**Core Value:** The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos.

### Constraints

- **Stack**: React + Tailwind CSS (keep existing stack, modernize usage)
- **Bilingual**: Must maintain EN/ES support with i18n
- **Performance**: Rich animations must not degrade mobile performance — target Lighthouse 90+
- **Accessibility**: Must meet WCAG 2.1 AA basics (contrast, keyboard nav, screen reader)
- **Hosting**: Static site — must build to static assets for deployment
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (ES2021) - All application source code in `src/`
- JSX - React component templates, co-located with JS files
- CSS - Global base styles in `src/index.css`
- HTML - Single entry template at `public/index.html`
## Runtime
- Node.js (no version pin; `.nvmrc` not present)
- Browser target: >0.2% marketshare, last 1 Chrome/Firefox/Safari in dev (see `package.json` `browserslist`)
- npm
- Lockfile: `package-lock.json` present
## Frameworks
- React 17.0.2 - UI rendering (`src/index.js` uses `ReactDOM.render`, not `createRoot`)
- react-dom 17.0.2 - DOM binding
- react-router-dom 5.2.0 - Declared as dependency but not actively used in current source; all navigation is anchor hash-links via `react-scroll`
- react-scripts 5.0.1 (Create React App) - Webpack, Babel, Jest bundled
- @craco/craco 7.1.0 - CRA config override; configured in `craco.config.js`
## Key Dependencies
- tailwindcss (via `npm:@tailwindcss/postcss7-compat@^2.2.17`) - Utility CSS; config at `tailwind.config.js`
- autoprefixer 10.4.27 - PostCSS vendor prefixing
- postcss 7.0.39 - PostCSS pipeline; config at `postcss.config.js`
- @headlessui/react 1.4.1 - Accessible UI primitives (imported as dependency, not currently used in components)
- @fortawesome/fontawesome-svg-core 1.2.35
- @fortawesome/react-fontawesome 0.1.14
- @fortawesome/free-solid-svg-icons 5.15.3 - Used: `faEnvelope`, `faPhone`, `faMapMarkerAlt`
- @fortawesome/free-brands-svg-icons 5.15.4 - Used: `faLinkedin`, `faGithub`, `faDocker`, `faYoutube`
- react-hook-form 7.6.4 - Declared as dependency; contact form is currently static (no form submission implemented)
- axios 1.15.0 - Declared as dependency; no active usage found in `src/`
- react-scroll 1.8.4 - Declared as dependency; navigation uses plain anchor `href="#section"` links currently
- web-vitals 1.1.2 - Wired in `src/reportWebVitals.js`; called in `src/index.js` without a reporting endpoint (no-op in production)
## Configuration
- `craco.config.js` - PostCSS plugins + Webpack `@` alias
- `tailwind.config.js` - Theme extension, purge paths, no plugins
- `postcss.config.js` - Minimal: only `tailwindcss`
- `jsconfig.json` - Path alias `@/*` → `src/*` for IDE resolution
- `.eslintrc.js` - Extends `plugin:react/recommended` + `airbnb`
## Platform Requirements
- Node.js + npm
- `npm start` → `craco start` (CRA dev server with hot reload)
- `npm run build` → `craco build` (production bundle to `build/`)
- `npm test` → `craco test` (Jest via CRA)
- Static file hosting (output is `build/` directory — pure SPA with no SSR)
- CV files served as static assets: `public/CV_Carlos_Montoya_EN.docx`, `public/CV_Carlos_Montoya_ES.docx`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase matching the exported function name — `Nav.js`, `Hero.js`, `About.js`, `Skill.js`, `Experience.js`, `Contact.js`, `Footer.js`
- Context files: PascalCase describing purpose — `LanguageContext.js`
- Data files: camelCase module name — `experience.js`, `translations.js`
- Entry point: lowercase — `index.js`, `index.css`
- Default-exported page-section components use PascalCase: `export default function Hero()`, `export default function Nav()`
- Private sub-components defined in the same file use PascalCase: `function Stat()`, `function Row()`, `function Card()`, `function SectionLabel()`
- Custom hooks use camelCase with `use` prefix: `useLanguage()`
- Module-level data arrays use UPPER_SNAKE_CASE: `const EXPERIENCE = [...]` in `src/data/experience.js`
- Module-level static arrays use camelCase: `const social = [...]` in `src/components/Footer.js`
- State variables: camelCase — `const [lang, setLangState]`, `const [expanded, setExpanded]`
- Destructured hook values: short, intent-revealing names — `{ lang, setLang, t }`
- Single-letter or abbreviated prop names accepted for private sub-components: `k` (key label), `v` (value), `num`, `last`
- Public component props use descriptive names: `href`, `icon`, `external`, `children`
## Code Style
- EditorConfig enforced: 2-space indentation, LF line endings, UTF-8, trailing whitespace trimmed, final newline — see `.editorconfig`
- No Prettier config present — formatting relies on EditorConfig + ESLint
- ESLint with `airbnb` + `plugin:react/recommended` — see `.eslintrc.js`
- No semicolons (`semi: 0`)
- No comma-dangle enforcement (`comma-dangle: 0`)
- `max-len` disabled — long Tailwind class strings are accepted
- `react/prop-types` disabled — no PropTypes enforcement
- `no-console` disabled — console allowed
- `react/no-array-index-key` disabled — `key={i}` in map is accepted
## Import Organization
- `@` maps to `src/` — configured in `jsconfig.json` and `craco.config.js`
- In practice all internal imports use relative paths (`../i18n/`, `../data/`), not the `@` alias
## Component Structure Pattern
## State Management
- Global language state lives in `src/i18n/LanguageContext.js`
- `LanguageProvider` uses `useMemo` to memoize context value, `useCallback` to memoize `setLang`
- Language persisted to `localStorage` under key `cam-lang`; initialized from `localStorage` then `navigator.language` on mount
- Local state (`useState`) used only in `Experience.js` for the expand/collapse toggle: `const [expanded, setExpanded] = useState(false)`
## Data Layer
- `src/data/experience.js` exports `EXPERIENCE` — an array of plain objects with bilingual fields (`{ en, es }` per text property)
- `src/i18n/translations.js` exports a `translations` object keyed by `'en'` and `'es'`
- No API calls, no async data fetching in the current codebase (axios is a listed dependency but unused in source)
## Error Handling
- No error boundaries present
- No try/catch blocks in any component
- No null checks on translation keys — assumes `translations[lang]` always resolves
- `dangerouslySetInnerHTML` used in `About.js` for HTML-rich translation strings (`t.about.p1`, `t.about.p2`, `t.about.p3`) — no sanitization
## CSS / Styling
- No CSS Modules, no styled-components, no Emotion
- Custom Tailwind design tokens used throughout: `bg-ink-900`, `text-slate2-100`, `text-neon`, `bg-grad-neon`, `shadow-neon`, `animate-pulse2`, `animate-fadein`
- Custom tokens defined in `tailwind.config.js`
- Global base styles in `src/index.css`
## Comments
- No inline comments in component source files
- Entry point `src/index.js` retains the CRA-generated comment about `reportWebVitals`
- No JSDoc annotations anywhere in the codebase
## Module Design
- All components use `export default function ComponentName()` — named exports used only for the `LanguageProvider` and `useLanguage` hook in `src/i18n/LanguageContext.js`
- Data modules use `export default CONSTANT`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- No client-side router (React Router not used). All navigation is anchor-link scroll (`href="#section-id"`).
- State lives exclusively in `LanguageContext` (React Context API). No Redux, no Zustand, no external state manager.
- Content is entirely static. No API calls, no server-side rendering, no data fetching layer.
- All copy is driven by a centralized translation dictionary keyed by `lang` (`'en'` | `'es'`).
## Layers
- Purpose: Mount React tree into the DOM
- Location: `src/index.js`
- Contains: `ReactDOM.render`, `<React.StrictMode>`, global CSS import
- Depends on: `src/App.js`, `src/index.css`
- Purpose: Compose the full page layout and wrap the context provider
- Location: `src/App.js`
- Contains: `<LanguageProvider>` wrapping the ordered section components
- Depends on: All section components, `LanguageProvider`
- Purpose: Language selection and translation lookup
- Location: `src/i18n/LanguageContext.js`, `src/i18n/translations.js`
- Contains: `LanguageProvider`, `useLanguage` hook, full `en`/`es` translation tree
- Depends on: nothing (leaf dependency)
- Used by: every section component via `useLanguage()`
- Purpose: Structured experience entries with bilingual content
- Location: `src/data/experience.js`
- Contains: exported `EXPERIENCE` array — each entry carries `title`, `date`, `location`, `bullets` keyed by `'en'`/`'es'`, and a `featured` boolean
- Used by: `src/components/Experience.js` only
- Purpose: Render each portfolio section
- Location: `src/components/`
- Contains: `Nav`, `Hero`, `About`, `Skill`, `Experience`, `Contact`, `Footer`
- Depends on: `useLanguage()` hook, `EXPERIENCE` data (Experience only), FontAwesome (Contact, Footer)
## Data Flow
## Key Abstractions
- Purpose: Single access point for language state and translations
- Location: `src/i18n/LanguageContext.js`
- Pattern: React Context + custom hook. Every component calls `const { lang, setLang, t } = useLanguage()`.
- Purpose: All user-facing copy in both languages
- Location: `src/i18n/translations.js`
- Pattern: Flat JS object `{ en: {...}, es: {...} }` with nested keys per section. Skills `cards` array is embedded here (not in `src/data/`).
- Purpose: Structured career data with bilingual fields
- Location: `src/data/experience.js`
- Pattern: Array of plain objects. Each field that varies by language is an object `{ en: '...', es: '...' }`. `featured: true` marks the initially visible entries.
- Purpose: Consistent section header decoration (neon accent line + uppercase label)
- Pattern: Defined as a local function component inside `About.js`, `Skill.js`, `Experience.js`, and `Contact.js` — duplicated across files, not extracted to a shared file.
## Entry Points
- Location: `public/index.html`
- Triggers: CRA build injects bundled JS; browser loads and mounts React
- Location: `src/index.js`
- Triggers: Browser script execution
- Responsibilities: Render `<App>` into `#root` div, import global CSS
- Location: `src/App.js`
- Responsibilities: Declare page layout order (Nav → Hero → About → Skill → Experience → Contact → Footer), provide language context to all children
## Error Handling
- `localStorage` access is guarded with `typeof window !== 'undefined'` checks (SSR safety)
- External links use `rel="noopener noreferrer"` on `target="_blank"` anchors
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
