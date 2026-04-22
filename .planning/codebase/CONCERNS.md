# Codebase Concerns

**Analysis Date:** 2026-04-21

## Tech Debt

**Parallel codebase — `website-new/` directory:**
- Issue: A complete, self-contained vanilla HTML/CSS/JS implementation of the entire portfolio exists at `website-new/index.html`. It duplicates all content (experience data, i18n strings, UI layout) that already lives in the React app. It is uncommitted but present in the repo root.
- Files: `website-new/index.html`, `website-new/CV_Carlos_Montoya_EN.docx`, `website-new/CV_Carlos_Montoya_ES.docx`
- Impact: Content edits must be applied in two places or will diverge. Causes confusion about which version is the authoritative source.
- Fix approach: Delete `website-new/` and add it to `.gitignore`, or commit it as the replacement and remove the React app. Choose one version.

**Outdated Tailwind CSS (v2 compat shim):**
- Issue: `tailwind.config.js` uses `purge:` (Tailwind v2 API) and `package.json` installs `tailwindcss` via `npm:@tailwindcss/postcss7-compat@^2.2.17` — a PostCSS 7 compatibility shim that is end-of-life. Tailwind v3 has been stable since 2021 and v4 since 2025.
- Files: `tailwind.config.js`, `package.json`
- Impact: Missing JIT engine performance, container queries, arbitrary value improvements. The compat shim may break with new PostCSS versions.
- Fix approach: Upgrade to Tailwind v3 (drop `variants` block, rename `purge` → `content`) or v4 (switch to CSS-first config).

**Outdated FontAwesome — v5 pinned:**
- Issue: `@fortawesome/free-brands-svg-icons@^5.15.4` and `@fortawesome/free-solid-svg-icons@^5.15.3` are FontAwesome 5, while FontAwesome 6 has been available for years.
- Files: `package.json`, `src/components/Contact.js`, `src/components/Footer.js`
- Impact: Missing newer icons; v5 packages are no longer receiving new icon additions.
- Fix approach: Upgrade to `@fortawesome/*@^6.x`.

**React 17 — three major versions behind:**
- Issue: `"react": "^17.0.2"` is installed. React 19 is current as of 2025.
- Files: `package.json`
- Impact: Missing concurrent rendering, Suspense improvements, Server Components capability.
- Fix approach: Upgrade to React 18 or 19 (requires checking for breaking changes in dependencies like `react-router-dom` v5 → v6/v7).

**`react-router-dom` v5 installed but not used:**
- Issue: `react-router-dom@^5.2.0` is a declared dependency but the app is a single-page scroll site with no `<BrowserRouter>` or `<Route>` anywhere in `src/`.
- Files: `package.json`
- Impact: Unnecessary bundle weight (~24 KB minified+gzipped). ESLint `import/no-unused-modules` would catch this if enabled.
- Fix approach: Remove from `package.json`.

**`axios` installed but not used:**
- Issue: `axios@^1.15.0` is declared in dependencies. No `import axios` exists anywhere in `src/`.
- Files: `package.json`
- Impact: Unnecessary bundle weight; increases attack surface for supply-chain issues.
- Fix approach: Remove from `package.json`.

**`react-hook-form` installed but not used:**
- Issue: `react-hook-form@^7.6.4` is declared in dependencies. There is no contact form in the app — the Contact section contains only static link cards (`mailto:`, `tel:`, LinkedIn).
- Files: `package.json`, `src/components/Contact.js`
- Impact: Unnecessary bundle weight.
- Fix approach: Remove from `package.json` unless a contact form is planned.

**`react-scroll` installed but not used:**
- Issue: `react-scroll@^1.8.4` is declared in dependencies. All navigation uses plain `<a href="#section">` anchor links.
- Files: `package.json`
- Impact: Unnecessary bundle weight.
- Fix approach: Remove from `package.json`.

**`@headlessui/react` installed but not used:**
- Issue: `@headlessui/react@^1.4.1` is declared in dependencies. No Headless UI components are imported anywhere in `src/`.
- Files: `package.json`
- Impact: Unnecessary bundle weight; v1.4.1 is three major versions behind current (v2.x).
- Fix approach: Remove from `package.json`.

**`SectionLabel` component duplicated across four files:**
- Issue: An identical `SectionLabel` functional component is copy-pasted verbatim into `src/components/About.js`, `src/components/Contact.js`, `src/components/Experience.js`, and `src/components/Skill.js`.
- Files: `src/components/About.js:4-11`, `src/components/Contact.js:7-14`, `src/components/Experience.js:5-12`, `src/components/Skill.js:4-11`
- Impact: Any visual change to the section label must be applied in four places.
- Fix approach: Extract to `src/components/SectionLabel.js` and import it.

**Experience data duplicated between React app and `website-new/`:**
- Issue: The full experience data (12 jobs, bilingual) is defined in `src/data/experience.js` and duplicated inside `website-new/index.html` as an inline `const EXPERIENCE` array. The two copies are already slightly out of sync — `website-new` is missing the 4th AI-tools bullet in the Coderio entry.
- Files: `src/data/experience.js`, `website-new/index.html:474-592`
- Impact: Content edits will desync silently.
- Fix approach: Remove `website-new/` (see above).

**i18n strings duplicated between React app and `website-new/`:**
- Issue: The full bilingual translation object is defined in `src/i18n/translations.js` and duplicated as `const I18N` inside `website-new/index.html`.
- Files: `src/i18n/translations.js`, `website-new/index.html:408-469`
- Impact: Same desync risk as experience data.
- Fix approach: Remove `website-new/`.

**`build/` directory committed to git:**
- Issue: `.gitignore` lists `/build` to exclude it, but the `build/` directory is present in the repository with production artifacts (`build/static/js/main.bfa48bea.js`, CSS, maps, CV `.docx` copies).
- Files: `build/` (entire directory)
- Impact: Every `npm run build` invocation will create a git diff with large binary/minified files. Build artifacts belong in CI/CD outputs, not source control.
- Fix approach: Run `git rm -r --cached build/` to untrack all build files; confirm `.gitignore` entry is correct.

**CV `.docx` files duplicated in three locations:**
- Issue: `CV_Carlos_Montoya_EN.docx` and `CV_Carlos_Montoya_ES.docx` exist in the repo root, in `public/`, in `build/`, and in `website-new/`. Only the `public/` copy is the correct one (served by Create React App).
- Files: Root-level `.docx` files, `website-new/*.docx`, `build/*.docx`
- Impact: Accidental edits to the wrong copy; unnecessary repo size.
- Fix approach: Keep only `public/CV_*.docx`. Remove root and `website-new` copies. Add the `build/` copies via `.gitignore`.

## Security Considerations

**Google Analytics tracking ID hardcoded in `public/index.html`:**
- Risk: The GA4 measurement ID `G-1GDDRC3G12` is embedded directly in `public/index.html`.
- Files: `public/index.html:26-32`
- Current mitigation: GA measurement IDs are not secret credentials — they are safe to expose publicly. However, having it hardcoded means changing analytics providers requires a code change and redeploy.
- Recommendations: For a static site this is acceptable. For flexibility, move to a `REACT_APP_GA_ID` env var injected at build time.

**Phone number exposed in source code:**
- Risk: `+57 324 442 2196` is hardcoded in `src/components/Contact.js`.
- Files: `src/components/Contact.js:26`
- Current mitigation: This is intentional for a portfolio contact page; the number is meant to be public.
- Recommendations: No action required unless the number changes — then it must be updated in both `src/components/Contact.js` and `website-new/index.html`.

**Email exposed in source code:**
- Risk: `andresmontoyat@gmail.com` is hardcoded as a `mailto:` link.
- Files: `src/components/Contact.js:25`
- Current mitigation: Intentional for a portfolio. No bot protection is in place (no honeypot, no rate limiting).
- Recommendations: Acceptable for a personal portfolio. If spam becomes an issue, obfuscate or replace with a contact form backed by a serverless function.

**`dangerouslySetInnerHTML` in About component:**
- Risk: `src/components/About.js` uses `dangerouslySetInnerHTML` to render the `about.p1`, `about.p2`, and `about.p3` translation strings which contain `<strong>` tags.
- Files: `src/components/About.js:22-24`
- Current mitigation: The HTML content comes from `src/i18n/translations.js` (a local static file), not from any user input or API. XSS risk is zero in current usage.
- Recommendations: If the translation source ever moves to a CMS or external API, sanitize with DOMPurify before rendering.

## Accessibility Gaps

**Mobile navigation is completely hidden with no alternative:**
- Issue: The `<nav>` in `src/components/Nav.js` applies `hidden md:flex` — it is invisible below the `md` (768 px) breakpoint with no hamburger menu, no drawer, and no off-canvas fallback.
- Files: `src/components/Nav.js:13`
- Impact: Mobile users have no way to navigate between sections other than manual scrolling. This is a WCAG 2.4.1 (Bypass Blocks) concern.
- Fix approach: Add a hamburger button + mobile drawer using Headless UI `Dialog` or a simple `useState` toggle, visible only below `md`.

**Language switcher buttons have only `aria-label` on the button element but the group has no role:**
- Issue: The EN/ES toggle in `src/components/Nav.js` is a pair of `<button>` elements inside a `<div>`. There is no `role="group"` or `aria-label` on the container.
- Files: `src/components/Nav.js:20-31`
- Impact: Screen readers announce two isolated buttons with no group context.
- Fix approach: Add `role="group" aria-label="Language"` to the wrapping `<div>`.

**`react/button-has-type` ESLint rule disabled:**
- Issue: `.eslintrc.js` disables `react/button-has-type: 0`. The expand/collapse button in `src/components/Experience.js:53` and the language buttons in `src/components/Nav.js` have no explicit `type` attribute.
- Files: `.eslintrc.js:38`, `src/components/Experience.js:53`, `src/components/Nav.js:21,27`
- Impact: Buttons inside or near forms default to `type="submit"`, which can trigger unexpected form submissions.
- Fix approach: Re-enable the rule, add `type="button"` to all buttons.

**`jsx-a11y/anchor-is-valid` ESLint rule disabled:**
- Issue: `.eslintrc.js` disables `jsx-a11y/anchor-is-valid: 0`. The Location card in `src/components/Contact.js` uses `href="#"` — a non-navigable anchor.
- Files: `.eslintrc.js:29`, `src/components/Contact.js:34`
- Impact: Screen readers announce it as a link but activating it does nothing useful.
- Fix approach: Change to a `<div>` or `<span>` styled like a card, or link to a Google Maps URL.

**`jsx-a11y/control-has-associated-label` and `heading-has-content` disabled:**
- Issue: Two a11y rules are blanket-disabled in `.eslintrc.js`.
- Files: `.eslintrc.js:43-44`
- Impact: Silences warnings that could catch unlabeled interactive elements or empty headings.
- Fix approach: Re-enable rules and fix any violations.

**Image has no `alt` text:**
- Issue: `public/images/me.webp` is present but not used by any component — the About section has no profile photo rendered in the React app (the `website-new` version also omits it). If the image is ever added to a component, an `alt` attribute is mandatory.
- Files: `public/images/me.webp`
- Recommendations: Either use the image with an appropriate `alt` or delete the file.

## Performance Bottlenecks

**Google Fonts loaded via render-blocking `<link>` in `public/index.html`:**
- Issue: Inter and JetBrains Mono are loaded from `fonts.googleapis.com` with a standard `<link rel="stylesheet">`. The `display=swap` parameter is present, but the preconnect hints are correct only if Google Fonts CDN is not cached.
- Files: `public/index.html:14-19`
- Impact: First Contentful Paint can be delayed by DNS + TLS + font fetch latency on first visit.
- Fix approach: Add `font-display: swap` is already handled by Google Fonts param. Consider self-hosting fonts via `fontsource` npm packages to eliminate external dependency and potential privacy concern (GDPR — IP sent to Google).

**Tailwind v2 JIT is not enabled:**
- Issue: `tailwind.config.js` does not set `mode: 'jit'` and uses the v2 purge API. Without JIT, the full Tailwind CSS is generated at dev time (multi-MB), with purge only running at production build.
- Files: `tailwind.config.js`
- Impact: Slow development CSS rebuilds; risk of large CSS if purge misses classes.
- Fix approach: Upgrade to Tailwind v3+ where JIT is the default.

## Fragile Areas

**`LanguageContext` hydrates from `localStorage` inside `useEffect` causing a flash:**
- Issue: `src/i18n/LanguageContext.js` initializes state to `'en'` and then reads `localStorage` in a `useEffect`. On a first render the component always shows English content, then switches to the saved language after mount.
- Files: `src/i18n/LanguageContext.js:11-21`
- Why fragile: Causes a visible language flash on page load for returning Spanish-speaking visitors. If server-side rendering is ever added, the mismatch will cause hydration errors.
- Fix approach: Initialize state lazily — pass a function to `useState` that reads `localStorage` synchronously: `useState(() => { ... })`. This eliminates the flash.

**ESLint is severely disabled — 20+ rules turned off:**
- Issue: `.eslintrc.js` disables 20 rules including `max-len`, `no-console`, `react/no-danger`, `react/no-array-index-key`, `react/prop-types`, and multiple a11y rules.
- Files: `.eslintrc.js`
- Impact: The linter provides minimal protection. Code quality regressions, accessibility issues, and unsafe patterns are not caught automatically.
- Fix approach: Re-enable rules incrementally, fix violations, and enforce via CI.

**Array index used as React `key` throughout:**
- Issue: `src/components/Experience.js:27`, `src/components/Skill.js:22` and the chip list in `Skill.js:33` use loop index `i`/`idx` as the `key` prop. The `react/no-array-index-key` rule is disabled.
- Files: `src/components/Experience.js:27`, `src/components/Skill.js:22,33`
- Impact: If items are reordered or filtered, React may fail to reconcile correctly, causing stale DOM.
- Fix approach: Use a stable unique identifier — for experience entries, a slug of `company + date`; for skill chips, the chip string itself.

## Test Coverage Gaps

**Zero tests exist:**
- What's not tested: The entire application — components, i18n context, language switching, experience data structure, CV download link logic.
- Files: No `*.test.js` or `*.spec.js` files found anywhere in `src/`.
- Risk: Any refactoring of `LanguageContext`, `translations.js`, or component props breaks silently.
- Priority: High for `LanguageContext` and `translations.js` (pure logic, easy to unit test). Medium for components (React Testing Library smoke tests).

**`craco test` is configured but produces no results:**
- Issue: `package.json` defines a `test` script using CRACO but there are no test files for it to run.
- Files: `package.json:17`
- Risk: CI pipelines that gate on `npm test` will pass vacuously (zero tests = zero failures).
- Fix approach: Add at minimum a smoke test for `<App />` rendering and one unit test for `useLanguage` context behavior.

---

*Concerns audit: 2026-04-21*
