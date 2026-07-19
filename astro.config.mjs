import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

export default defineConfig({
  output: 'static', // default, but explicit — no adapter installed
  integrations: [react()],
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: true, // both /en/* and /es/* — no bare-root default-locale tree
      redirectToDefaultLocale: false, // the Vercel Edge Middleware (D-01..D-04) owns "/", not Astro's own i18n redirect
    },
  },
})
