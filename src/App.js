import React from 'react'

import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './i18n/ThemeContext'
import { ViewModeProvider } from './context/ViewModeContext'
import MarioWorld from './marioWorld/MarioWorld'

// Phase 21.13: MarioWorld is the single mount point. It reads viewMode
// internally and routes between HeroGameGate (null), DevView ('dev'), and
// the WorldMap placeholder ('game'). The classic Nav/Footer + section scroll
// now lives inside DevView, so App.js only wires the provider chain.
export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ViewModeProvider>
          <div className="min-h-screen bg-ink-900 text-text-primary font-sans antialiased bg-hero-gradient bg-grid-subtle">
            <MarioWorld />
          </div>
        </ViewModeProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
