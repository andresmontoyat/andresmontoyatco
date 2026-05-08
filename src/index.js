// Self-hosted fonts — replaces Google Fonts CDN (INFRA-05)
// Only 2 Inter weights active per Phase 2/3 contract: 400 (regular) + 800 (extrabold)
// JetBrains Mono: 400 only (mono base — no bold variant used in design system)
import '@fontsource/inter/400.css'
import '@fontsource/inter/800.css'
import '@fontsource/jetbrains-mono/400.css'

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
