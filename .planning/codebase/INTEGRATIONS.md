# External Integrations

**Analysis Date:** 2026-04-21

## APIs & External Services

**Analytics:**
- Google Analytics 4 (GA4) - Page-view and event tracking
  - Script: loaded inline in `public/index.html` via `https://www.googletagmanager.com/gtag/js?id=G-1GDDRC3G12`
  - Measurement ID: `G-1GDDRC3G12` (hardcoded in HTML, not an env var)
  - Implementation: `gtag('config', ...)` inline script block in `public/index.html`
  - No server-side component; purely client-side tag

**Fonts:**
- Google Fonts CDN - Web font delivery
  - Loaded via `<link>` in `public/index.html`
  - Families: `Inter` (weights 400–800) and `JetBrains Mono` (weights 400–600)
  - Preconnect hints to `fonts.googleapis.com` and `fonts.gstatic.com` present

## Data Storage

**Databases:**
- None — all content is static data defined in `src/data/experience.js` and `src/i18n/translations.js`

**File Storage:**
- Local filesystem only — CV files served as static public assets:
  - `public/CV_Carlos_Montoya_EN.docx`
  - `public/CV_Carlos_Montoya_ES.docx`

**Caching:**
- `localStorage` (browser) — used exclusively for persisting the user's language preference
  - Key: `cam-lang` (values: `'en'` | `'es'`)
  - Implementation: `src/i18n/LanguageContext.js`

## Authentication & Identity

- None — fully public static portfolio, no login or protected routes

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, Datadog, or equivalent

**Performance:**
- web-vitals 1.1.2 wired in `src/reportWebVitals.js` and called in `src/index.js`
  - No reporting endpoint configured; metrics are collected but discarded in production

**Logs:**
- Browser console only (`no-console` ESLint rule is disabled)

## CI/CD & Deployment

**Hosting:**
- Not detected from source — no Netlify, Vercel, or GitHub Actions config files present
- Build output is a static bundle (`build/`) suitable for any static host

**CI Pipeline:**
- None detected — no `.github/workflows/`, `netlify.toml`, `vercel.json`, or equivalent

## Environment Configuration

**Required env vars:**
- None — the application does not read any `process.env.REACT_APP_*` variables

**Secrets location:**
- No secrets in use; GA4 Measurement ID `G-1GDDRC3G12` is public and hardcoded in `public/index.html`

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None — contact section (`src/components/Contact.js`) contains static `mailto:` and `tel:` links only; no form submission or API call is implemented

## Social Profile Links (Static External References)

The following external URLs are hardcoded as anchor links (no API calls):
- LinkedIn: `https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033/` — `src/components/Footer.js`, `src/components/Contact.js`
- GitHub: `https://github.com/andresmontoyat` — `src/components/Footer.js`
- Docker Hub: `https://hub.docker.com/u/codehunters` — `src/components/Footer.js`
- YouTube: `https://www.youtube.com/user/andresmontoyat` — `src/components/Footer.js`

---

*Integration audit: 2026-04-21*
