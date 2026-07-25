// middleware.ts (repo root, next to package.json)
//
// Vercel-native Edge Middleware — NOT Astro's own middleware (src/middleware.ts is
// confirmed inert under output: 'static' and must not be confused with this file).
// Owns the "/" -> "/en" | "/es" redirect (ROUTE-02) and refreshes the cam-lang cookie
// on every locale page visit (D-04).
//
// D-01: cookie name = 'cam-lang' (same literal name as today's localStorage key)
// D-02: Accept-Language heuristic mirrors src/i18n/LanguageContext.jsx readInitialLang —
//       header.toLowerCase().includes('es') ? 'es' : 'en' — no q-value parser.
// D-03: the "/" redirect uses 302 (temporary — destination is visitor-dependent, never 301).
//
// HOTFIX (2026-07-25): the matcher previously ran on every page route and returned a bare
// `new Response(null, { status: 200 })` for /en, /es and the pass-through — Assumption A2.
// On real Vercel that empty Response does NOT fall through to the static file; it IS the
// response, so every page served a 0-byte body (the 21-05 risk that was never validated).
// Fix: scope the matcher to ONLY "/" so middleware handles nothing but the root redirect;
// /en, /es and every other route are served directly as static files, untouched by Edge.
// D-04 (cookie refresh on every page visit) is dropped — the cookie is still set on the "/"
// redirect and by the Nav LangPill click, so locale persistence is unaffected. A proper
// per-visit refresh can return later via the `next()` helper from @vercel/functions.
export const config = {
  matcher: '/',
}

const KNOWN_LOCALES = ['en', 'es'] as const
type Locale = (typeof KNOWN_LOCALES)[number]
const DEFAULT_LOCALE: Locale = 'en'
const COOKIE_NAME = 'cam-lang' // D-01: same name as today's localStorage key

function parseCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined
  const match = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  return match?.slice(name.length + 1)
}

function resolveLocaleFromAcceptLanguage(header: string | null): Locale {
  // D-02: mirrors readInitialLang() — header contains 'es' -> 'es', else 'en'. No q-value parsing.
  return header?.toLowerCase().includes('es') ? 'es' : DEFAULT_LOCALE
}

function isKnownLocale(value: string | undefined): value is Locale {
  // SECURITY (T-21-03-01, open redirect): never redirect to an unvalidated locale value.
  // A crafted cam-lang cookie or Accept-Language value that isn't a literal member of
  // KNOWN_LOCALES falls through to the Accept-Language heuristic / DEFAULT_LOCALE — it is
  // never reflected directly into the Location header. Mirrors the allowlist guard in
  // src/i18n/LanguageContext.jsx setLang (lines 41-47).
  return KNOWN_LOCALES.includes(value as Locale)
}

function buildSetCookie(locale: Locale): string {
  return `${COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`
}

export default function middleware(request: Request): Response {
  // The matcher scopes this to "/" only — every invocation is the root redirect.
  // No page route reaches here, so there is no pass-through Response to get wrong.
  const cookieLocale = parseCookie(request.headers.get('cookie'), COOKIE_NAME)
  const target = isKnownLocale(cookieLocale)
    ? (cookieLocale as Locale)
    : resolveLocaleFromAcceptLanguage(request.headers.get('accept-language'))

  return new Response(null, {
    status: 302, // D-03: temporary — destination is visitor-dependent, never 301
    headers: {
      Location: `/${target}`,
      'Set-Cookie': buildSetCookie(target),
    },
  })
}
