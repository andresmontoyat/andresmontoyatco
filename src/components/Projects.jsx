import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import data from '../data/projects.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}

function ProjectCard({ project, lang, ctaLive, ctaGithub }) {
  const title = pick(project.title, lang)
  const desc = pick(project.desc, lang)
  return (
    <article className="group bg-surface border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-accent hover:-translate-y-1">
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
  return (
    <section id="projects" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="font-mono text-xs uppercase tracking-[3px] text-accent flex items-center gap-3 mb-4">
          <span className="block w-10 h-0.5 bg-accent" /> {pick(data.label, lang)}
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-text mb-4 leading-tight">
          {pick(data.h2, lang)}
        </h2>
        <p className="text-muted max-w-[640px] mb-12 text-base">{pick(data.intro, lang)}</p>
        <div className="flex flex-wrap justify-center gap-6">
          {data.projects.map((p) => (
            <div key={p.id} className="w-full sm:w-[360px]">
              <ProjectCard project={p} lang={lang} ctaLive={ctaLive} ctaGithub={ctaGithub} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
