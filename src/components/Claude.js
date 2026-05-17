import React, { useRef } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import useInView from '../hooks/useInView'
import { VALUES, SERVICES, APPS, COUNTERS, STACK_CHIPS } from '../data/claude'

export default function Claude() {
  const { lang, t } = useLanguage()
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { threshold: 0.15 })

  return (
    <section
      id="claude-code"
      ref={sectionRef}
      className="py-24 sm:py-32 bg-ink-950"
    >
      <div className="max-w-6xl mx-auto px-6">
        <PitchHero t={t} />

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 animate-on-scroll${inView ? ' is-visible' : ''}`}>
          {VALUES.map((v, i) => (
            <ValueCard
              key={v.key}
              id={v.id}
              title={t.claude.values[v.key]}
              desc={v.desc[lang]}
              index={i}
            />
          ))}
        </div>

        <ProofBlock t={t} counters={COUNTERS} />

        <p className="text-brand font-mono text-xs uppercase tracking-widest mt-12">
          {t.claude.servicesLabel}
        </p>
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 animate-on-scroll${inView ? ' is-visible' : ''}`}>
          {SERVICES.map((s, i) => (
            <ServiceCard
              key={s.key}
              title={t.claude.services[s.key]}
              desc={s.desc[lang]}
              index={i}
            />
          ))}
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 animate-on-scroll${inView ? ' is-visible' : ''}`}>
          {APPS.map((a, i) => (
            <FeaturedAppCard
              key={a.slug}
              name={a.name[lang]}
              tag={a.tag[lang]}
              desc={a.desc[lang]}
              stack={a.stack}
              index={i}
            />
          ))}
        </div>

        <StackStrip chips={STACK_CHIPS} />
      </div>
    </section>
  )
}

function PitchHero({ t }) {
  return (
    <div className="text-center max-w-3xl mx-auto bg-card-gradient rounded-2xl p-8 md:p-12 mb-12">
      <p className="text-brand font-mono text-xs uppercase tracking-widest">
        {t.claude.label}
      </p>
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-primary mt-4 leading-tight">
        {t.claude.h2Part1}
        {' '}
        <span className="bg-brand-gradient bg-clip-text text-transparent">
          {t.claude.h2Part2}
        </span>
      </h2>
      <p className="text-text-secondary text-lg mt-6 max-w-2xl mx-auto">
        {t.claude.subLead}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
        <a
          href="#contact"
          className="bg-brand-gradient text-ink-900 font-extrabold px-8 py-4 rounded-lg motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 shadow-brand"
        >
          {t.claude.ctaPrimary}
        </a>
        <a
          href="#projects"
          className="border border-ink-400 text-text-primary px-8 py-4 rounded-lg motion-safe:transition-colors hover:border-brand hover:text-brand"
        >
          {t.claude.ctaSecondary}
        </a>
      </div>
    </div>
  )
}

function ValueCard({ id, title, desc, index }) {
  return (
    <div
      style={{ transitionDelay: `${index * 100}ms` }}
      className="bg-ink-500 border border-ink-400 rounded-xl p-6 motion-safe:transition-all motion-safe:duration-300 hover:border-brand hover:-translate-y-1"
    >
      <div className="text-brand font-mono text-2xl font-extrabold">{id}</div>
      <h3 className="text-text-primary font-extrabold text-lg mt-3">{title}</h3>
      <p className="text-text-secondary text-base mt-2 leading-relaxed">{desc}</p>
    </div>
  )
}

function ProofBlock({ t, counters }) {
  return (
    <div className="mt-20 bg-[var(--color-ink-500-60)] border border-ink-400 rounded-2xl p-8 md:p-12">
      <p className="text-brand font-mono text-xs uppercase tracking-widest">
        {t.claude.proofLabel}
      </p>
      <h3 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-3">
        {t.claude.proofHeading}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6 mt-8">
        {counters.map((c) => (
          <div key={c.key} className="text-center">
            <div className="text-3xl md:text-4xl font-extrabold text-brand">{c.value}</div>
            <div className="text-xs text-text-secondary uppercase tracking-wide mt-1">
              {t.claude.counters[c.key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ServiceCard({ title, desc, index }) {
  return (
    <div
      style={{ transitionDelay: `${index * 100}ms` }}
      className="border-l-4 border-brand bg-ink-500 rounded-r-xl p-6 motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-1"
    >
      <h3 className="text-text-primary font-extrabold text-base">{title}</h3>
      <p className="text-text-secondary text-sm mt-2">{desc}</p>
    </div>
  )
}

function FeaturedAppCard({ name, tag, desc, stack, index }) {
  return (
    <div
      style={{ transitionDelay: `${index * 100}ms` }}
      className="bg-ink-500 border border-ink-400 rounded-xl p-6 motion-safe:transition-all motion-safe:duration-300 hover:border-brand"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-base font-extrabold text-text-primary">{name}</h3>
        <span className="font-mono text-xs px-2 py-1 rounded-md bg-brand-gradient text-ink-900 font-extrabold">
          {tag}
        </span>
      </div>
      <p className="text-text-secondary text-sm mt-3 leading-relaxed">{desc}</p>
      <div className="flex flex-wrap gap-2 mt-4">
        {stack.map((chip) => (
          <span
            key={chip}
            className="font-mono text-xs px-2 py-1 rounded-md bg-ink-400 text-text-secondary border border-ink-400"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

function StackStrip({ chips }) {
  return (
    <div className="mt-16 border-t border-ink-400 pt-10">
      <div className="flex flex-wrap justify-center gap-2">
        {chips.map((chip) => (
          <span
            key={chip}
            className="font-mono text-xs px-3 py-1.5 rounded-full bg-ink-500 text-text-secondary border border-ink-400"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}
