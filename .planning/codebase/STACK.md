# Technology Stack

**Analysis Date:** 2026-04-21

## Languages

**Primary:**
- JavaScript (ES2021) - All application source code in `src/`
- JSX - React component templates, co-located with JS files

**Secondary:**
- CSS - Global base styles in `src/index.css`
- HTML - Single entry template at `public/index.html`

## Runtime

**Environment:**
- Node.js (no version pin; `.nvmrc` not present)
- Browser target: >0.2% marketshare, last 1 Chrome/Firefox/Safari in dev (see `package.json` `browserslist`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 17.0.2 - UI rendering (`src/index.js` uses `ReactDOM.render`, not `createRoot`)
- react-dom 17.0.2 - DOM binding

**Routing:**
- react-router-dom 5.2.0 - Declared as dependency but not actively used in current source; all navigation is anchor hash-links via `react-scroll`

**Build/Dev:**
- react-scripts 5.0.1 (Create React App) - Webpack, Babel, Jest bundled
- @craco/craco 7.1.0 - CRA config override; configured in `craco.config.js`
  - Adds `@` alias pointing to `src/`
  - Injects Tailwind CSS via PostCSS plugin

## Key Dependencies

**UI / Styling:**
- tailwindcss (via `npm:@tailwindcss/postcss7-compat@^2.2.17`) - Utility CSS; config at `tailwind.config.js`
  - Custom color palette: `ink-*` (dark backgrounds), `neon-*` (accent), `slate2-*` (text)
  - Custom fonts: Inter, JetBrains Mono (loaded from Google Fonts CDN)
  - Dark mode via `darkMode: 'class'`
- autoprefixer 10.4.27 - PostCSS vendor prefixing
- postcss 7.0.39 - PostCSS pipeline; config at `postcss.config.js`
- @headlessui/react 1.4.1 - Accessible UI primitives (imported as dependency, not currently used in components)

**Icons:**
- @fortawesome/fontawesome-svg-core 1.2.35
- @fortawesome/react-fontawesome 0.1.14
- @fortawesome/free-solid-svg-icons 5.15.3 - Used: `faEnvelope`, `faPhone`, `faMapMarkerAlt`
- @fortawesome/free-brands-svg-icons 5.15.4 - Used: `faLinkedin`, `faGithub`, `faDocker`, `faYoutube`

**Forms:**
- react-hook-form 7.6.4 - Declared as dependency; contact form is currently static (no form submission implemented)

**HTTP:**
- axios 1.15.0 - Declared as dependency; no active usage found in `src/`

**Scroll:**
- react-scroll 1.8.4 - Declared as dependency; navigation uses plain anchor `href="#section"` links currently

**Metrics:**
- web-vitals 1.1.2 - Wired in `src/reportWebVitals.js`; called in `src/index.js` without a reporting endpoint (no-op in production)

## Configuration

**Build:**
- `craco.config.js` - PostCSS plugins + Webpack `@` alias
- `tailwind.config.js` - Theme extension, purge paths, no plugins
- `postcss.config.js` - Minimal: only `tailwindcss`
- `jsconfig.json` - Path alias `@/*` → `src/*` for IDE resolution

**Linting:**
- `.eslintrc.js` - Extends `plugin:react/recommended` + `airbnb`
  - Many airbnb rules disabled (see file for full list)
  - No Prettier config present

**No environment variables in use** - No `.env` files detected; no `process.env.REACT_APP_*` references in source

## Platform Requirements

**Development:**
- Node.js + npm
- `npm start` → `craco start` (CRA dev server with hot reload)
- `npm run build` → `craco build` (production bundle to `build/`)
- `npm test` → `craco test` (Jest via CRA)

**Production:**
- Static file hosting (output is `build/` directory — pure SPA with no SSR)
- CV files served as static assets: `public/CV_Carlos_Montoya_EN.docx`, `public/CV_Carlos_Montoya_ES.docx`

---

*Stack analysis: 2026-04-21*
