import React from 'react'

import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './i18n/ThemeContext'
import Nav from './components/Nav'
import About from './components/About'
import Skill from './components/Skill'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Claude from './components/Claude'
import Contact from './components/Contact'
import Footer from './components/Footer'
import SectionPager from './components/SectionPager'

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-bg text-text font-sans antialiased">
          <Nav />
          <main>
            <About />
            <Skill />
            <Experience />
            <Projects />
            <Claude />
            <Contact />
          </main>
          <Footer />
          <SectionPager />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}
