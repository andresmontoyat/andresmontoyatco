import React from 'react'

// Phase 22 WorldErrorBoundary — ported 1:1 from src/game/RendererErrorBoundary.js
// (Phase 17 inline class lift). React 17 class pattern (no hook equivalent).
// Catches: (a) lazy WebGL chunk fetch errors, (b) shader compile failures,
// (c) WebGL ctx creation failures, (d) runtime errors inside the rAF loop on
// next React commit. On catch, renders props.fallback (MarioWorld passes the
// SVG world-map fallback). Sticky: no auto-reset; only page reload escapes
// the fallback (D-17-ERRORBOUNDARY-INIT, Pitfall 5). Log prefix
// '[world-fallback]' is greppable in DevTools. Not bilingual, not translated.

export default class WorldErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[world-fallback]', error, info)
  }

  render() {
    const { hasError } = this.state
    const { fallback, children } = this.props
    if (hasError) return fallback
    return children
  }
}
