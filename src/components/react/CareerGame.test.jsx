import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CareerGame from './CareerGame'

// The real game module (src/game/careerGame.js) calls canvas.getContext('2d')
// during init() → resize(), and src/test/setup.jsx globally stubs
// HTMLCanvasElement.prototype.getContext to return null (for GameMode's WebGL
// probe). Against a real jsdom canvas that null ctx would crash inside
// resize()'s ctx.setTransform() call. This test only needs to verify the
// island's own contract — cover button, lazy mount, canvas appears — not the
// game engine's rendering, so the dynamic import target is mocked here per
// the task brief's guidance.
vi.mock('../../game/careerGame.js', () => ({
  init: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    setLocale: vi.fn(),
    setMuted: vi.fn(),
    getState: () => ({ input: { bindTouch: vi.fn() } }),
    tick: vi.fn(),
  })),
}))

describe('CareerGame island', () => {
  it('shows a play cover and does not load the game until clicked', () => {
    render(<CareerGame locale="en" />)
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
    expect(document.querySelector('canvas')).toBeNull()
  })
  it('mounts a canvas after pressing play', async () => {
    render(<CareerGame locale="en" />)
    fireEvent.click(screen.getByRole('button', { name: /play/i }))
    // canvas appears once the dynamic import resolves
    await screen.findByTestId('career-canvas')
    expect(document.querySelector('canvas')).not.toBeNull()
  })
})
