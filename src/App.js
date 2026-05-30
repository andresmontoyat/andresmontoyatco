import React, { Suspense } from 'react'

import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import { ThemeProvider } from './i18n/ThemeContext'
import { ViewModeProvider, useViewMode } from './context/ViewModeContext'
import Nav from './components/Nav'

// WR-06: Hero/About/Skill are dev-mode-only. Default viewMode is 'game'
// which never mounts them. Lazy-load them so the initial JS bundle on the
// game route stays lean (Lighthouse-mobile gate downstream).
const Hero = React.lazy(() => import('./components/Hero'))
const About = React.lazy(() => import('./components/About'))
const Skill = React.lazy(() => import('./components/Skill'))
const Experience = React.lazy(() => import('./components/Experience'))
const Projects = React.lazy(() => import('./components/Projects'))
const Claude = React.lazy(() => import('./components/Claude'))
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

// Inner component that reads viewMode (must be inside ViewModeProvider)
// and branches the <main> content between the game-mode placeholder and
// the full dev-view sections. Mirrors the SkipLink inner-component pattern.
function MainContent() {
  const { viewMode } = useViewMode()
  const { t } = useLanguage()

  if (viewMode === 'game') {
    return (
      <main id="main">
        <section className="flex flex-col items-center justify-center min-h-screen px-6 py-20 text-center">
          <h1 className="text-3xl font-extrabold text-text-primary mb-4">
            {t.game.loadingTitle}
          </h1>
          <p className="text-text-secondary max-w-lg">
            {t.game.loadingBody}
          </p>
        </section>
      </main>
    )
  }

  return (
    <main id="main">
      <Suspense fallback={SectionFallback}>
        <Hero />
      </Suspense>
      <Suspense fallback={SectionFallback}>
        <About />
      </Suspense>
      <Suspense fallback={SectionFallback}>
        <Skill />
      </Suspense>
      <Suspense fallback={SectionFallback}>
        <Experience />
      </Suspense>
      <Suspense fallback={SectionFallback}>
        <Projects />
      </Suspense>
      <Suspense fallback={SectionFallback}>
        <Claude />
      </Suspense>
      <Suspense fallback={SectionFallback}>
        <Contact />
      </Suspense>
    </main>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ViewModeProvider>
          <div className="min-h-screen bg-ink-900 text-text-primary font-sans antialiased bg-hero-gradient bg-grid-subtle">
            <SkipLink />
            <Nav />
            <MainContent />
            <Suspense fallback={SectionFallback}>
              <Footer />
            </Suspense>
          </div>
        </ViewModeProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
