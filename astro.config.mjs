import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

export default defineConfig({
  output: 'static', // default, but explicit — no adapter installed
  // Inline all component CSS into each page's <head> instead of emitting a single
  // render-blocking <link> to the shared ~52KB Tailwind bundle. Removes the extra
  // critical-path round-trip that delayed first paint (LCP == FCP is the hero image)
  // on real Vercel latency, where local `astro preview` masked it (localhost = 0 RTT).
  build: { inlineStylesheets: 'always' },
  integrations: [react()],
  vite: {
    // Eagerly pre-bundle React + its JSX runtimes so `astro dev`'s first page
    // load never races Vite's on-demand optimizeDeps — that race served island
    // modules referencing an un-bundled `react/jsx-dev-runtime`, surfacing as
    // "TypeError: _jsxDEV is not a function" until a reload. Dev-only; the
    // production build is unaffected.
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
  },
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: true, // both /en/* and /es/* — no bare-root default-locale tree
      redirectToDefaultLocale: false, // the Vercel Edge Middleware (D-01..D-04) owns "/", not Astro's own i18n redirect
    },
  },
})
