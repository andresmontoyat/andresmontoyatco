import React from 'react'

// Phase 17 RendererErrorBoundary — lifted from GameMode.js inline class
// (Phase 16 ConstellationErrorBoundary, lines 46-67 pre-Slice-1). React 17
// class pattern (no hook equivalent). Catches: (a) lazy WebGL chunk fetch
// errors, (b) shader compile failures, (c) WebGL ctx creation failures,
// (d) runtime errors inside the rAF loop on next React commit. On catch,
// renders props.fallback (GameMode passes <SvgConstellation .../>). Sticky:
// no auto-reset; only page reload escapes the fallback (D-17-ERRORBOUNDARY-INIT,
// UI-SPEC §"ErrorBoundary Fallback Visual Contract" line 346, Pitfall 5).
// Log prefix '[renderer-fallback]' is greppable in DevTools (Pattern I,
// UI-SPEC §"Copywriting Contract" line 432). Not bilingual, not translated.

export default class RendererErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[renderer-fallback]', error, info)
  }

  render() {
    const { hasError } = this.state
    const { fallback, children } = this.props
    if (hasError) return fallback
    return children
  }
}
