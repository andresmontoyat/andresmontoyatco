import React from 'react'

import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Skill from './components/Skill'
import Experience from './components/Experience'
import Contact from './components/Contact'
import Footer from './components/Footer'

function SkipLink() {
  const { t } = useLanguage()
  return (
    <a href="#main" className="skip-link">
      {t.nav.skipToContent}
    </a>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-ink-900 text-text-primary font-sans antialiased bg-hero-gradient bg-grid-subtle">
        <SkipLink />
        <Nav />
        <main id="main">
          <Hero />
          <About />
          <Skill />
          <Experience />
          <Contact />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  )
}
