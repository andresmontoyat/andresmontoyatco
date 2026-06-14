import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext'
import Projects from './Projects'
import data from '../data/projects.json'

function setLangBeforeRender(lang) {
  try {
    window.localStorage.setItem('cam-lang', lang)
  } catch (e) {
    // ignore
  }
}

function renderWithLang(lang = 'en') {
  setLangBeforeRender(lang)
  return render(
    <LanguageProvider>
      <Projects />
    </LanguageProvider>,
  )
}

describe('Projects (v4.0 Slice 6)', () => {
  it('renders the section with id="projects"', () => {
    const { container } = renderWithLang('en')
    expect(container.querySelector('section#projects')).toBeInTheDocument()
  })

  it('renders label + heading + intro (EN)', () => {
    renderWithLang('en')
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Selected work')).toBeInTheDocument()
    expect(screen.getByText(/A focused look at the systems/)).toBeInTheDocument()
  })

  it('renders all 4 project titles (EN)', () => {
    renderWithLang('en')
    expect(data.projects).toHaveLength(4)
    expect(screen.getAllByText('Person API').length).toBeGreaterThan(0)
    expect(screen.getAllByText('GUDD API').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Blockchain Credentials Platform').length).toBeGreaterThan(0)
    expect(screen.getAllByText('AI-Driven Coding Workflows').length).toBeGreaterThan(0)
  })

  it('renders each project description + tech chips', () => {
    renderWithLang('en')
    expect(screen.getByText(/40% latency reduction/)).toBeInTheDocument()
    expect(screen.getAllByText('Spring Boot').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Kotlin').length).toBeGreaterThan(0)
  })

  it('translates label/h2/intro + ES project titles when lang=es', () => {
    renderWithLang('es')
    expect(screen.getByText('Proyectos')).toBeInTheDocument()
    expect(screen.getByText('Trabajo destacado')).toBeInTheDocument()
    expect(screen.getByText(/mirada enfocada/)).toBeInTheDocument()
    expect(screen.getAllByText('Plataforma de Credenciales Blockchain').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Flujos de Desarrollo con IA').length).toBeGreaterThan(0)
  })

  it('no live/github CTAs render when URLs are null (current data state)', () => {
    renderWithLang('en')
    expect(screen.queryByText('View Live')).toBeNull()
    expect(screen.queryByText('GitHub')).toBeNull()
  })

  it('projects.json schema sanity — 4 projects each with required bilingual keys', () => {
    expect(Array.isArray(data.projects)).toBe(true)
    expect(data.projects).toHaveLength(4)
    for (const p of data.projects) {
      expect(typeof p.id).toBe('string')
      expect(typeof p.title.en).toBe('string')
      expect(typeof p.title.es).toBe('string')
      expect(typeof p.desc.en).toBe('string')
      expect(typeof p.desc.es).toBe('string')
      expect(Array.isArray(p.tech)).toBe(true)
    }
  })
})
