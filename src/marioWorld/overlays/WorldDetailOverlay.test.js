import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WorldDetailOverlay from './WorldDetailOverlay.js'
import { LanguageProvider } from '../../i18n/LanguageContext.js'

const COMPANY_WORLD = {
  id: 'company:acme',
  type: 'company',
  label: 'Acme',
  biome: 'selva',
  levels: [
    {
      title: { en: 'Dev', es: 'Dev' },
      period: { start: 2019, end: 2020 },
      location: { en: 'NYC', es: 'NYC' },
      bullets: { en: ['Built X', 'Shipped Y'], es: ['Construí X', 'Lancé Y'] },
      tech: ['Java', 'Spring'],
    },
  ],
}

const SECTION_WORLD = {
  id: 'section:about',
  type: 'section',
  label: { en: 'About', es: 'Sobre' },
  biome: 'pradera',
  icon: 'home',
  content: {
    en: { paragraphs: ['Hello'] },
    es: { paragraphs: ['Hola'] },
  },
}

const SECRET_WORLD = {
  id: 'secret:s1',
  type: 'secret',
  label: { en: 'Hidden', es: 'Oculto' },
  biome: 'cyber',
  command: '/x',
  content: { en: 'Found it', es: 'Lo encontraste' },
}

function renderOverlay(world, onClose = () => {}) {
  return render(
    <LanguageProvider>
      <WorldDetailOverlay world={world} onClose={onClose} />
    </LanguageProvider>,
  )
}

describe('WorldDetailOverlay', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('should_render_dialog_with_aria_modal_true', () => {
    renderOverlay(COMPANY_WORLD)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('should_render_company_world_fields_when_type_is_company', () => {
    renderOverlay(COMPANY_WORLD)
    expect(screen.getByText('Dev')).toBeInTheDocument()
    expect(screen.getByText(/2019/)).toBeInTheDocument()
    expect(screen.getByText('Built X')).toBeInTheDocument()
    expect(screen.getByText('Java')).toBeInTheDocument()
  })

  it('should_render_section_paragraph_when_type_is_section', () => {
    renderOverlay(SECTION_WORLD)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should_render_secret_content_when_type_is_secret', () => {
    renderOverlay(SECRET_WORLD)
    expect(screen.getByText('Found it')).toBeInTheDocument()
  })

  it('should_call_onClose_when_escape_key_pressed', () => {
    const onClose = vi.fn()
    renderOverlay(COMPANY_WORLD, onClose)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should_call_onClose_when_close_button_clicked', () => {
    const onClose = vi.fn()
    renderOverlay(COMPANY_WORLD, onClose)
    const closeBtn = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should_call_onClose_when_backdrop_clicked', () => {
    const onClose = vi.fn()
    const { container } = renderOverlay(COMPANY_WORLD, onClose)
    const backdrop = container.querySelector('[data-testid="overlay-backdrop"]')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should_keep_focus_inside_dialog_when_tabbing', () => {
    renderOverlay(COMPANY_WORLD)
    const dialog = screen.getByRole('dialog')
    const closeBtn = screen.getByRole('button', { name: /close/i })
    closeBtn.focus()
    expect(dialog.contains(document.activeElement)).toBe(true)
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('should_render_spanish_label_when_lang_is_es', () => {
    window.localStorage.setItem('cam-lang', 'es')
    renderOverlay(SECTION_WORLD)
    const sobre = screen.queryByText('Sobre')
    const hola = screen.queryByText('Hola')
    expect(sobre || hola).not.toBeNull()
  })

  it('should_render_no_content_message_when_company_has_empty_levels', () => {
    const broken = { id: 'company:empty', type: 'company', label: 'Empty', biome: 'selva', levels: [] }
    renderOverlay(broken)
    expect(screen.getByText(/no content/i)).toBeInTheDocument()
  })
})
