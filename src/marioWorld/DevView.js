// src/marioWorld/DevView.js
//
// Classic CV-style scroll view (Phase 21.10).
// Reads from `src/data/sections.js` + worldsData (Phase 21.5) and renders each
// section as a labeled <section> region plus an Experience section flattened
// from worlds[type=company].levels[]. Inline `<strong>` markers in About/Claude
// paragraphs are stripped here — the Mario-world overlay (Phase 22) preserves
// emphasis via a separate renderer if needed.
//
// Pure scroll layout: no overlay/dialog logic, no view-mode awareness. The
// caller decides when to render DevView vs the mario map.

import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import SECTIONS from '../data/sections'
import Nav from '../components/Nav'
import Hero from '../components/Hero'
import Footer from '../components/Footer'

function stripHtml(s) {
  return String(s).replace(/<[^>]+>/g, '')
}

function getLabel(s, lang) {
  if (typeof s.label === 'string') return s.label
  return s.label?.[lang] ?? s.label?.en ?? s.id
}

function renderSectionContent(content, lang) {
  const c = content?.[lang] ?? content?.en
  if (!c) return null

  const parts = []
  if (c.heading) parts.push(<h3 key="h" className="mb-3 text-lg font-bold">{stripHtml(c.heading)}</h3>)
  if (c.intro) parts.push(<p key="i" className="mb-4">{stripHtml(c.intro)}</p>)
  if (c.eyebrow) parts.push(<p key="ey" className="mb-2 text-sm uppercase">{c.eyebrow}</p>)
  if (c.headingPart1 || c.headingPart2) {
    parts.push(
      <h3 key="hp" className="mb-3 text-lg font-bold">
        {c.headingPart1 ?? ''} {c.headingPart2 ?? ''}
      </h3>,
    )
  }
  if (c.pitch) parts.push(<p key="pt" className="mb-4">{stripHtml(c.pitch)}</p>)
  if (Array.isArray(c.paragraphs)) {
    c.paragraphs.forEach((p, i) => parts.push(
      <p key={`p${i}`} className="mb-4">{stripHtml(p)}</p>,
    ))
  }
  if (Array.isArray(c.groups)) {
    c.groups.forEach((g, gi) => {
      parts.push(
        <div key={`g${gi}`} className="mb-6">
          <h4 className="text-base font-semibold">{g.title || g.category}</h4>
          <ul className="flex flex-wrap gap-2 mt-2">
            {g.skills.map((s) => (
              <li key={s} className="rounded-lg border border-ink-700 px-2 py-1 text-sm">{s}</li>
            ))}
          </ul>
        </div>,
      )
    })
  }
  if (Array.isArray(c.items)) {
    c.items.forEach((item, i) => parts.push(
      <article key={`it${i}`} className="mb-4">
        <h4 className="font-bold">{item.title}</h4>
        <p className="text-sm">{item.description}</p>
        {item.link && <a href={item.link} className="text-brand">Open</a>}
      </article>,
    ))
  }
  if (Array.isArray(c.values)) {
    c.values.forEach((v, i) => parts.push(
      <div key={`v${i}`} className="mb-3">
        <h4 className="font-semibold">{v.title}</h4>
        <p className="text-sm">{v.description}</p>
      </div>,
    ))
  }
  if (Array.isArray(c.services)) {
    c.services.forEach((sv, i) => parts.push(
      <div key={`sv${i}`} className="mb-3">
        <h4 className="font-semibold">{sv.title}</h4>
        <p className="text-sm">{sv.description}</p>
      </div>,
    ))
  }
  if (c.email) {
    parts.push(
      <p key="em" className="mb-2">
        <a href={`mailto:${c.email}`}>{c.emailLabel || c.email}</a>
      </p>,
    )
  }
  if (c.phone) {
    parts.push(
      <p key="ph" className="mb-2">{c.phoneLabel || c.phone}</p>,
    )
  }
  if (Array.isArray(c.social)) {
    parts.push(
      <ul key="so" className="mt-2 flex gap-3">
        {c.social.map((s) => (
          <li key={s.url}><a href={s.url}>{s.label}</a></li>
        ))}
      </ul>,
    )
  }
  if (c.cv) {
    parts.push(
      <p key="cv" className="mt-3"><a href={c.cv.url}>{c.cv.label}</a></p>,
    )
  }
  return parts
}

function ExperienceList({ worlds }) {
  const companyWorlds = (worlds ?? []).filter((w) => w.type === 'company')
  const allLevels = companyWorlds.flatMap((w) => w.levels.map((l) => ({ ...l, _company: w.label })))
  allLevels.sort((a, b) => b.period.start - a.period.start)
  return (
    <ol>
      {allLevels.map((entry, i) => (
        <li key={i} className="mb-6">
          <h3 className="font-bold">
            {entry._company}
            {' — '}
            {entry.title?.en ?? ''}
          </h3>
          <p className="text-sm">
            {entry.period.start}
            {' – '}
            {entry.period.end ?? 'Present'}
          </p>
          <ul className="mt-2 list-disc pl-5">
            {(entry.bullets?.en ?? []).map((b, j) => <li key={j}>{b}</li>)}
          </ul>
        </li>
      ))}
    </ol>
  )
}

export default function DevView({ worldsData }) {
  const { lang } = useLanguage()
  return (
    <>
      <Nav />
      <Hero />
      {SECTIONS.map((s) => (
        <section
          key={s.id}
          id={s.id}
          aria-label={getLabel(s, lang)}
          className="container mx-auto px-4 py-12"
        >
          <h2 className="mb-6 text-2xl font-bold">{getLabel(s, lang)}</h2>
          {renderSectionContent(s.content, lang)}
        </section>
      ))}
      <section
        id="experience"
        aria-label="Experience"
        className="container mx-auto px-4 py-12"
      >
        <h2 className="mb-6 text-2xl font-bold">Experience</h2>
        <ExperienceList worlds={worldsData?.worlds ?? []} />
      </section>
      <Footer />
    </>
  )
}
