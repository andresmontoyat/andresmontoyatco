import React, { useRef } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import useInView from '../hooks/useInView'
import SectionLabel from './_shared/SectionLabel'
import PROJECTS from '../data/projects'

export default function Projects() {
  const { lang, t } = useLanguage()
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { threshold: 0.25 })
  const gridRef = useRef(null)
  const inView = useInView(gridRef, { threshold: 0.1 })

  return (
    <section id="projects" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div
          ref={headerRef}
          className={`animate-on-scroll${headerInView ? ' is-visible' : ''}`}
        >
          <SectionLabel>{t.projects.label}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mt-4">
            {t.projects.h2}
          </h2>
          <p className="text-text-secondary mt-3 max-w-2xl">{t.projects.intro}</p>
        </div>

        <div
          ref={gridRef}
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 animate-on-scroll${inView ? ' is-visible' : ''}`}
        >
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} lang={lang} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectCard({ project, index, lang, t }) {
  return (
    <article
      style={{ transitionDelay: `${index * 100}ms` }}
      className="group bg-ink-500 border border-ink-400 rounded-xl overflow-hidden motion-safe:transition-all motion-safe:duration-300 hover:border-brand hover:-translate-y-1"
    >
      <div className="aspect-video w-full overflow-hidden bg-ink-400">
        {project.screenshot ? (
          <img
            src={project.screenshot}
            alt={project.title[lang]}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-brand-gradient flex items-center justify-center">
            <span className="font-mono text-base text-ink-900 px-4 text-center">
              {project.title[lang]}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-base font-extrabold text-text-primary">
          {project.title[lang]}
        </h3>
        <p className="text-base text-text-secondary mt-2">{project.desc[lang]}</p>

        <div className="flex flex-wrap gap-2 mt-4">
          {project.tech.map((tag) => (
            <span
              key={tag}
              className="font-mono text-xs px-2 py-1 rounded-md bg-ink-400 text-text-secondary border border-ink-400"
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
                className="text-sm font-semibold text-brand hover:underline"
              >
                {t.projects.live}
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-text-primary hover:text-brand hover:underline"
              >
                {t.projects.github}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
