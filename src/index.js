// Self-hosted fonts — replaces Google Fonts CDN (INFRA-05)
// Only 2 Inter weights active per Phase 2/3 contract: 400 (regular) + 800 (extrabold)
// JetBrains Mono: 400 only (mono base — no bold variant used in design system)
import '@fontsource/inter/400.css'
import '@fontsource/inter/800.css'
import '@fontsource/jetbrains-mono/400.css'

// Preload the 3 actively-used woff2 weights (latin subset) — match the URLs
// that @fontsource CSS will request, so the browser dedupes the fetch and
// resolves font-display: swap before first paint. ?url import = Vite-hashed URL.
import inter400Url from '@fontsource/inter/files/inter-latin-400-normal.woff2?url'
import inter800Url from '@fontsource/inter/files/inter-latin-800-normal.woff2?url'
import jbmRegularUrl from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url'

function preloadWoff2(href) {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'font'
  link.type = 'font/woff2'
  link.crossOrigin = 'anonymous'
  link.href = href
  document.head.appendChild(link)
}

;[inter400Url, inter800Url, jbmRegularUrl].forEach(preloadWoff2)

import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
