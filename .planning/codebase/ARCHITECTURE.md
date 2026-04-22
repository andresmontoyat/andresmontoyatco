# Architecture

**Analysis Date:** 2026-04-21

## Pattern Overview

**Overall:** Single-Page Application (SPA) — single-page, single-route, scroll-based navigation

**Key Characteristics:**
- No client-side router (React Router not used). All navigation is anchor-link scroll (`href="#section-id"`).
- State lives exclusively in `LanguageContext` (React Context API). No Redux, no Zustand, no external state manager.
- Content is entirely static. No API calls, no server-side rendering, no data fetching layer.
- All copy is driven by a centralized translation dictionary keyed by `lang` (`'en'` | `'es'`).

## Layers

**Entry / Bootstrap:**
- Purpose: Mount React tree into the DOM
- Location: `src/index.js`
- Contains: `ReactDOM.render`, `<React.StrictMode>`, global CSS import
- Depends on: `src/App.js`, `src/index.css`

**App Shell:**
- Purpose: Compose the full page layout and wrap the context provider
- Location: `src/App.js`
- Contains: `<LanguageProvider>` wrapping the ordered section components
- Depends on: All section components, `LanguageProvider`

**i18n / State Layer:**
- Purpose: Language selection and translation lookup
- Location: `src/i18n/LanguageContext.js`, `src/i18n/translations.js`
- Contains: `LanguageProvider`, `useLanguage` hook, full `en`/`es` translation tree
- Depends on: nothing (leaf dependency)
- Used by: every section component via `useLanguage()`

**Static Data Layer:**
- Purpose: Structured experience entries with bilingual content
- Location: `src/data/experience.js`
- Contains: exported `EXPERIENCE` array — each entry carries `title`, `date`, `location`, `bullets` keyed by `'en'`/`'es'`, and a `featured` boolean
- Used by: `src/components/Experience.js` only

**Section Components:**
- Purpose: Render each portfolio section
- Location: `src/components/`
- Contains: `Nav`, `Hero`, `About`, `Skill`, `Experience`, `Contact`, `Footer`
- Depends on: `useLanguage()` hook, `EXPERIENCE` data (Experience only), FontAwesome (Contact, Footer)

## Data Flow

**Language selection:**

1. User clicks EN/ES toggle in `Nav`
2. `setLang()` (from `useLanguage`) updates `LanguageContext` state, persists to `localStorage`, sets `document.documentElement.lang`
3. All components that call `useLanguage()` re-render with the new `t` translation object

**Initial language detection:**

1. `LanguageProvider` mounts and runs a `useEffect`
2. Reads `localStorage('cam-lang')` — uses it if present
3. Falls back to `navigator.language` — selects `'es'` if browser locale starts with `es`, otherwise `'en'`

**Experience expand/collapse:**

1. `Experience` holds local `useState(false)` for `expanded`
2. Entries where `job.featured === false` are hidden until `expanded === true`
3. Button toggles `expanded`, non-featured entries fade in via `animate-fadein`

**CV download:**

1. `Hero` reads `lang` from `useLanguage()`
2. Derives filename: `lang === 'es'` → `CV_Carlos_Montoya_ES.docx`, otherwise `CV_Carlos_Montoya_EN.docx`
3. Renders `<a href="/{filename}" download>` pointing to `public/` static assets

## Key Abstractions

**`useLanguage` hook:**
- Purpose: Single access point for language state and translations
- Location: `src/i18n/LanguageContext.js`
- Pattern: React Context + custom hook. Every component calls `const { lang, setLang, t } = useLanguage()`.

**`translations` dictionary:**
- Purpose: All user-facing copy in both languages
- Location: `src/i18n/translations.js`
- Pattern: Flat JS object `{ en: {...}, es: {...} }` with nested keys per section. Skills `cards` array is embedded here (not in `src/data/`).

**`EXPERIENCE` array:**
- Purpose: Structured career data with bilingual fields
- Location: `src/data/experience.js`
- Pattern: Array of plain objects. Each field that varies by language is an object `{ en: '...', es: '...' }`. `featured: true` marks the initially visible entries.

**`SectionLabel` component:**
- Purpose: Consistent section header decoration (neon accent line + uppercase label)
- Pattern: Defined as a local function component inside `About.js`, `Skill.js`, `Experience.js`, and `Contact.js` — duplicated across files, not extracted to a shared file.

## Entry Points

**Browser entry:**
- Location: `public/index.html`
- Triggers: CRA build injects bundled JS; browser loads and mounts React

**React entry:**
- Location: `src/index.js`
- Triggers: Browser script execution
- Responsibilities: Render `<App>` into `#root` div, import global CSS

**App root:**
- Location: `src/App.js`
- Responsibilities: Declare page layout order (Nav → Hero → About → Skill → Experience → Contact → Footer), provide language context to all children

## Error Handling

**Strategy:** None implemented. No error boundaries, no try/catch, no fallback UI.

**Patterns:**
- `localStorage` access is guarded with `typeof window !== 'undefined'` checks (SSR safety)
- External links use `rel="noopener noreferrer"` on `target="_blank"` anchors

## Cross-Cutting Concerns

**i18n:** Centralized in `src/i18n/` — `LanguageContext` + `translations.js`. All components consume via `useLanguage()`. Never hardcode user-facing strings in component JSX.

**Styling:** Tailwind CSS utility classes applied directly in JSX. Custom design tokens defined in `tailwind.config.js` (`ink`, `neon`, `slate2` color palettes; `grad-neon` gradient; `neon`/`neon-lg` shadows; `pulse2`/`fadein` animations).

**Static assets:** CV files served from `public/` directory at root path. Profile image at `public/images/me.webp`.

**Logging:** None.

**Validation:** None (no forms).

**Authentication:** None.

---

*Architecture analysis: 2026-04-21*
