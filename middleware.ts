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
// D-04: runs on every page route; refreshes the cam-lang cookie on /en/* -> en, /es/* -> es.
//
// Matcher scoping (this plan's decision): a negative-lookahead excludes /_astro/ hashed
// assets and common static-file extensions so the cookie refresh still runs on every real
// page visit (D-04's actual purpose) without paying per-asset Edge invocations. Exact
// matcher string recorded verbatim in 21-03-SUMMARY.md for user sign-off.
export const config = {
  matcher: '/((?!_astro/|.*\\.(?:ico|png|jpg|jpeg|webp|svg|gif|woff|woff2|css|js|mjs|json|xml|txt|map)$).*)',
  // runtime defaults to 'edge' — do not set runtime: 'nodejs' here, Edge is required for
  // D-04's per-request cookie refresh to stay fast.
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
  const url = new URL(request.url)
  const pathLocale = url.pathname.match(/^\/(en|es)(\/|$)/)?.[1] as Locale | undefined
  const cookieLocale = parseCookie(request.headers.get('cookie'), COOKIE_NAME)

  // D-04: refresh the cookie on every /en/* or /es/* visit, regardless of the "/" redirect.
  if (pathLocale) {
    // NOTE (Assumption A2 / Open Question 1, RESEARCH.md): a bare 200 Response is NOT yet
    // confirmed to pass the request through to the underlying static file — this must be
    // validated against a real Vercel preview deploy in Plan 21-05. If the preview shows
    // the static page is NOT served (e.g. an empty body is returned instead), the documented
    // fallback is the `next()` helper exported from Vercel's Edge Functions runtime helper
    // package (see 21-RESEARCH.md). That dependency is intentionally NOT added in this plan
    // — implement the bare-200 approach now.
    const response = new Response(null, { status: 200 })
    response.headers.append('Set-Cookie', buildSetCookie(pathLocale))
    return response
  }

  if (url.pathname === '/') {
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

  // Same pass-through caveat as above applies here (Assumption A2) — validated in Plan 21-05.
  return new Response(null, { status: 200 })
}
