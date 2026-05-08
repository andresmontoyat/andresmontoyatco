import React, { Suspense } from 'react'

import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import { ThemeProvider } from './i18n/ThemeContext'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Skill from './components/Skill'

const Experience = React.lazy(() => import('./components/Experience'))
const Contact = React.lazy(() => import('./components/Contact'))
const Footer = React.lazy(() => import('./components/Footer'))

const SectionFallback = (
  <div className="py-20" aria-hidden="true" />
)

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
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-ink-900 text-text-primary font-sans antialiased bg-hero-gradient bg-grid-subtle">
          <SkipLink />
          <Nav />
          <main id="main">
            <Hero />
            <About />
            <Skill />
            <Suspense fallback={SectionFallback}>
              <Experience />
            </Suspense>
            <Suspense fallback={SectionFallback}>
              <Contact />
            </Suspense>
          </main>
          <Suspense fallback={SectionFallback}>
            <Footer />
          </Suspense>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}
