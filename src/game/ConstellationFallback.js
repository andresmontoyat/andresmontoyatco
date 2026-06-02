import React from 'react'

export default function ConstellationFallback({ experiences, lang, t }) {
  if (!experiences) return null

  return (
    <section aria-labelledby="constellation-fallback-heading" className="sr-only">
      <h2 id="constellation-fallback-heading">{t.game.fallbackHeading}</h2>
      <ol>
        {experiences.map((exp, i) => (
          <li key={`${exp.company}-${i}`}>
            <article>
              <h3>{exp.title[lang]} — {exp.company}</h3>
              <p>{exp.date[lang]} · {exp.location[lang]}</p>
              <ul>
                {exp.bullets[lang].map((b, j) => <li key={j}>{b}</li>)}
              </ul>
              <p>{exp.tech.join(', ')}</p>
            </article>
          </li>
        ))}
      </ol>
    </section>
  )
}
