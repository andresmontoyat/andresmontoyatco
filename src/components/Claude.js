import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import data from '../data/claude.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}

function PitchHero({ lang }) {
  return (
    <div className="text-center max-w-3xl mx-auto bg-surface border border-border rounded-2xl p-8 md:p-12 mb-12">
      <p className="text-accent font-mono text-xs uppercase tracking-widest">{pick(data.label, lang)}</p>
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text mt-4 leading-tight">
        {pick(data.h2Part1, lang)}{' '}
        <span className="text-accent">{pick(data.h2Part2, lang)}</span>
      </h2>
      <p className="text-muted text-lg mt-6 max-w-2xl mx-auto">{pick(data.subLead, lang)}</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
        <a
          href="#contact"
          className="bg-accent text-bg font-extrabold px-8 py-4 rounded-lg transition-transform hover:-translate-y-0.5"
        >
          {pick(data.ctaPrimary, lang)}
        </a>
        <a
          href="#projects"
          className="border border-border text-text px-8 py-4 rounded-lg transition-colors hover:border-accent hover:text-accent"
        >
          {pick(data.ctaSecondary, lang)}
        </a>
      </div>
    </div>
  )
}

function ValueCard({ value, lang }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 hover:border-accent transition-colors">
      <div className="text-accent font-mono text-2xl font-extrabold">{value.id}</div>
      <h3 className="text-text font-extrabold text-lg mt-3">{pick(value.title, lang)}</h3>
      <p className="text-muted text-base mt-2 leading-relaxed">{pick(value.desc, lang)}</p>
    </div>
  )
}

function CapabilityCard({ capability, lang }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 hover:border-accent transition-colors">
      <h3 className="text-text font-extrabold text-lg">{pick(capability.title, lang)}</h3>
      <p className="text-muted text-base mt-2 leading-relaxed">{pick(capability.desc, lang)}</p>
    </div>
  )
}

function ServiceCard({ service, lang }) {
  return (
    <div className="border-l-4 border-accent bg-surface rounded-r-xl p-6">
      <h3 className="text-text font-extrabold text-base">{pick(service.title, lang)}</h3>
      <p className="text-muted text-sm mt-2">{pick(service.desc, lang)}</p>
    </div>
  )
}

function FeaturedAppCard({ app, lang }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 hover:border-accent transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-base font-extrabold text-text">{pick(app.name, lang)}</h3>
        <span className="font-mono text-xs px-2 py-1 rounded-md bg-accent text-bg font-extrabold">
          {pick(app.tag, lang)}
        </span>
      </div>
      <p className="text-muted text-sm mt-3 leading-relaxed">{pick(app.desc, lang)}</p>
      <div className="flex flex-wrap gap-2 mt-4">
        {app.stack.map((chip) => (
          <span
            key={chip}
            className="font-mono text-xs px-2 py-1 rounded-md bg-bg text-muted border border-border"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

function StackStrip() {
  return (
    <div className="mt-16 border-t border-border pt-10">
      <div className="flex flex-wrap justify-center gap-2">
        {data.stackChips.map((chip) => (
          <span
            key={chip}
            className="font-mono text-xs px-3 py-1.5 rounded-full bg-surface text-muted border border-border"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Claude() {
  const { lang } = useLanguage()
  return (
    <section id="claude-code" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <PitchHero lang={lang} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {data.values.map((v) => (
            <ValueCard key={v.id} value={v} lang={lang} />
          ))}
        </div>
        <p className="text-accent font-mono text-xs uppercase tracking-widest mt-12">
          {pick(data.aiLabel, lang)}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {data.aiCapabilities.map((c) => (
            <CapabilityCard key={c.id} capability={c} lang={lang} />
          ))}
        </div>
        <p className="text-accent font-mono text-xs uppercase tracking-widest mt-12">
          {pick(data.servicesLabel, lang)}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {data.services.map((s) => (
            <ServiceCard key={s.id} service={s} lang={lang} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {data.apps.map((a) => (
            <FeaturedAppCard key={a.id} app={a} lang={lang} />
          ))}
        </div>
        <StackStrip />
      </div>
    </section>
  )
}
