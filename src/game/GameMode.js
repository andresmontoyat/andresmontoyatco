import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { useTheme } from '../i18n/ThemeContext'
import { useViewMode } from '../context/ViewModeContext'
import EXPERIENCE from '../data/experience'
import { SKILLS } from '../data/skills'
import { CURRENT_YEAR } from './constellation.graph'
import ConstellationFallback from './ConstellationFallback'

// D-15-LAND-COPY: derive at module load from live data — never hardcode
const maxYear = Math.max(...EXPERIENCE.map((e) => e.period.end ?? CURRENT_YEAR))
const minYear = Math.min(...EXPERIENCE.map((e) => e.period.start))
export const yearsActive = maxYear - minYear

// D-15-LAND-COPY: canonical SKILLS catalog count (not graph node count)
export const skillCount = Object.keys(SKILLS).length

class ConstellationErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Constellation error:', error, info)
  }

  render() {
    const { hasError } = this.state
    const { fallback, children } = this.props
    if (hasError) return fallback
    return children
  }
}

export default function GameMode() {
  const { lang, t } = useLanguage()
  const { theme } = useTheme()
  const { setViewMode } = useViewMode()

  const h1Text = `${yearsActive} ${t.game.h1Years}. ${skillCount} ${t.game.h1Skills}. ${t.game.h1Tagline}`

  const errorFallback = (
    <p className="text-text-secondary text-base text-center py-8">
      {t.game.error}{' '}
      <button
        onClick={() => setViewMode('dev')}
        className="text-brand underline"
        type="button"
      >
        {t.nav.modeDev}
      </button>
    </p>
  )

  return (
    <section id="game-mode" className="min-h-screen flex flex-col items-center px-6 pt-12 pb-8">
      <div className="text-center mb-8 md:mb-12 max-w-2xl">
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary leading-tight mb-3">
          {h1Text}
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">{t.game.subCopy}</p>
      </div>

      <ConstellationErrorBoundary fallback={errorFallback}>
        <div
          className="w-full max-w-3xl relative"
          data-testid="renderer-slot"
          data-theme={theme}
        >
          <p
            className="text-text-secondary text-sm py-12 text-center"
            data-testid="renderer-placeholder"
          >
            {t.game.empty}
          </p>
        </div>
      </ConstellationErrorBoundary>

      <ConstellationFallback experiences={EXPERIENCE} lang={lang} t={t} />
    </section>
  )
}
