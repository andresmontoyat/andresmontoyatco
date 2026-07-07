import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import data from '../data/projects.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}

function TechTags({ tech }) {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {tech.map((tag) => (
        <span
          key={tag}
          className="font-mono text-xs px-2 py-1 rounded-md bg-bg text-muted border border-border transition-colors duration-150 group-hover:border-accent/40"
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

function FeaturedProjectCard({ project, lang, featuredLabel }) {
  const title = pick(project.title, lang)
  const desc = pick(project.desc, lang)
  return (
    <article
      data-featured="true"
      className="group relative w-full overflow-hidden rounded-2xl border border-accent/50 bg-surface shadow-[0_0_45px_-14px_var(--accent)] transition-all duration-300 hover:border-accent hover:-translate-y-1"
    >
      <span aria-hidden="true" className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-accent to-secondary" />
      <div className="grid md:grid-cols-[280px_1fr]">
        <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-bg md:aspect-auto">
          <div className="absolute inset-0 bg-grad-accent opacity-[0.16] transition-opacity duration-300 group-hover:opacity-25" />
          <span className="relative text-6xl transition-transform duration-300 group-hover:scale-110" aria-hidden="true">{project.icon || '◆'}</span>
        </div>
        <div className="p-8">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[2px] text-accent mb-3">
            <span aria-hidden="true">★</span> {featuredLabel}
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-text leading-tight">{title}</h3>
          <p className="text-base text-muted mt-2 leading-relaxed">{desc}</p>
          <TechTags tech={project.tech} />
        </div>
      </div>
    </article>
  )
}

function ProjectCard({ project, lang, ctaLive, ctaGithub }) {
  const title = pick(project.title, lang)
  const desc = pick(project.desc, lang)
  return (
    <article data-featured="false" className="group bg-surface border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-accent hover:-translate-y-1">
      <div className="relative aspect-video w-full overflow-hidden bg-bg">
        <div className="absolute inset-0 bg-grad-accent opacity-[0.12] transition-opacity duration-300 group-hover:opacity-20" />
        <div className="relative w-full h-full flex items-center justify-center">
          <span className="text-5xl" aria-hidden="true">{project.icon || '◆'}</span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-base font-extrabold text-text">{title}</h3>
        <p className="text-base text-muted mt-2">{desc}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {project.tech.map((tag) => (
            <span
              key={tag}
              className="font-mono text-xs px-2 py-1 rounded-md bg-bg text-muted border border-border"
            >
              {tag}
            </span>
          ))}
        </div>
        {(project.liveUrl || project.githubUrl) && (
          <div className="flex gap-3 mt-5">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-accent hover:underline"
              >
                {ctaLive}
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-text hover:text-accent hover:underline"
              >
                {ctaGithub}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default function Projects() {
  const { lang } = useLanguage()
  const ctaLive = pick(data.ctaLive, lang)
  const ctaGithub = pick(data.ctaGithub, lang)
  const featuredLabel = pick(data.featuredLabel, lang)
  const featured = data.projects.filter((p) => p.featured)
  const rest = data.projects.filter((p) => !p.featured)
  return (
    <section id="projects" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="font-pixel text-[10px] uppercase tracking-[1px] text-accent flex items-center gap-3 mb-4">
          <span className="block w-10 h-0.5 bg-accent" /> {pick(data.label, lang)}
        </div>
        <h2 className="font-pixel text-lg sm:text-xl md:text-2xl font-extrabold tracking-normal text-text mb-4 leading-tight">
          {pick(data.h2, lang)}
        </h2>
        <p className="text-muted max-w-[640px] mb-12 font-pixel text-[11px] leading-[2]">{pick(data.intro, lang)}</p>
        {featured.map((p) => (
          <div key={p.id} className="mb-6">
            <FeaturedProjectCard project={p} lang={lang} featuredLabel={featuredLabel} />
          </div>
        ))}
        <div className="flex flex-wrap justify-center gap-6">
          {rest.map((p) => (
            <div key={p.id} className="w-full sm:w-[360px]">
              <ProjectCard project={p} lang={lang} ctaLive={ctaLive} ctaGithub={ctaGithub} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
