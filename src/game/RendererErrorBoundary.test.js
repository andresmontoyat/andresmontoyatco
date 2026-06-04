import React from 'react'
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest'
import { render, screen } from '@testing-library/react'
import RendererErrorBoundary from './RendererErrorBoundary.js'

function Thrower() {
  throw new Error('test error')
}

describe('RendererErrorBoundary', () => {
  let consoleErrorSpy
  beforeEach(() => {
    // Pitfall 6: React ALWAYS logs caught errors to console.error even when an
    // ErrorBoundary handles them. Silence to keep test output clean.
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error is thrown', () => {
    render(
      <RendererErrorBoundary fallback={<div>FALLBACK</div>}>
        <div>CHILD</div>
      </RendererErrorBoundary>,
    )
    expect(screen.getByText('CHILD')).toBeInTheDocument()
    expect(screen.queryByText('FALLBACK')).not.toBeInTheDocument()
  })

  it('renders fallback when child throws', () => {
    render(
      <RendererErrorBoundary fallback={<div>FALLBACK</div>}>
        <Thrower />
      </RendererErrorBoundary>,
    )
    expect(screen.getByText('FALLBACK')).toBeInTheDocument()
  })

  it('logs caught error with [renderer-fallback] prefix (Pattern I)', () => {
    render(
      <RendererErrorBoundary fallback={<div>FB</div>}>
        <Thrower />
      </RendererErrorBoundary>,
    )
    // Find the call whose first arg includes the prefix — React itself logs
    // additional uncaught messages we should ignore for this assertion.
    const calls = consoleErrorSpy.mock.calls
    const prefixed = calls.find(
      (args) => typeof args[0] === 'string' && args[0].includes('[renderer-fallback]'),
    )
    expect(prefixed).toBeDefined()
    expect(prefixed[1]).toBeInstanceOf(Error)
  })

  it('stays in fallback state on rerender (sticky — UI-SPEC line 346, Pitfall 5)', () => {
    const { rerender } = render(
      <RendererErrorBoundary fallback={<div>FB</div>}>
        <Thrower />
      </RendererErrorBoundary>,
    )
    expect(screen.getByText('FB')).toBeInTheDocument()
    rerender(
      <RendererErrorBoundary fallback={<div>FB</div>}>
        <div>CHILD</div>
      </RendererErrorBoundary>,
    )
    // Sticky: still shows fallback even though child no longer throws.
    expect(screen.getByText('FB')).toBeInTheDocument()
    expect(screen.queryByText('CHILD')).not.toBeInTheDocument()
  })
})
