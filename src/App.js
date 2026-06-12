import React from 'react'

import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './i18n/ThemeContext'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Footer from './components/Footer'

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-bg text-text font-sans antialiased">
          <Nav />
          <main>
            <Hero />
          </main>
          <Footer />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}
