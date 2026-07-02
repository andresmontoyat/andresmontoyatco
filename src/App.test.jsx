import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App (v4.0 Slice 1 — purge)', () => {
  it('renders Nav, Hero, and Footer without throwing', () => {
    expect(() => render(<App />)).not.toThrow()
  })

  it('mounts the canonical regions for an accessible scroll layout', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    // Nav may render as <header role="banner"> or <nav role="navigation"> — accept either
    const hasBannerOrNav = screen.queryByRole('banner') || screen.queryByRole('navigation')
    expect(hasBannerOrNav).toBeTruthy()
  })

  it('uses the v4.0 base palette utility classes on its outer shell', () => {
    const { container } = render(<App />)
    const shell = container.firstChild
    expect(shell.className).toContain('bg-bg')
    expect(shell.className).toContain('text-text')
    expect(shell.className).toContain('min-h-screen')
  })
})
