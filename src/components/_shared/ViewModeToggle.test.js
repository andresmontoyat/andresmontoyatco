import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewModeProvider } from '../../context/ViewModeContext'
import { LanguageProvider } from '../../i18n/LanguageContext'
import ViewModeToggle from './ViewModeToggle'

// Wrap both required providers
function Providers({ children }) {
  return (
    <ViewModeProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ViewModeProvider>
  )
}

beforeEach(() => {
  window.localStorage.clear()
  // WR-05: use the real History API instead of redefining window.location.
  // JSDOM keeps the Location object intact this way.
  window.history.pushState({}, '', '/')
})

afterEach(() => {
  window.localStorage.clear()
})

describe('ViewModeToggle — rendering', () => {
  test('renders a Game segment and a Dev segment as buttons', () => {
    render(<ViewModeToggle />, { wrapper: Providers })
    // EN default: "Game" and "Dev"
    const gameBtn = screen.getByRole('button', { name: /game/i })
    const devBtn = screen.getByRole('button', { name: /dev/i })
    expect(gameBtn).toBeInTheDocument()
    expect(devBtn).toBeInTheDocument()
    expect(gameBtn.tagName).toBe('BUTTON')
    expect(devBtn.tagName).toBe('BUTTON')
    expect(gameBtn).toHaveAttribute('type', 'button')
    expect(devBtn).toHaveAttribute('type', 'button')
  })

  test('Game segment shows aria-pressed="true" when viewMode is "game"', () => {
    window.localStorage.setItem('cam-viewmode', 'game')
    render(<ViewModeToggle />, { wrapper: Providers })
    const gameBtn = screen.getByRole('button', { name: /game/i })
    const devBtn = screen.getByRole('button', { name: /dev/i })
    expect(gameBtn).toHaveAttribute('aria-pressed', 'true')
    expect(devBtn).toHaveAttribute('aria-pressed', 'false')
  })

  test('pill-level aria-label announces the stable group PURPOSE (CR-02)', () => {
    render(<ViewModeToggle />, { wrapper: Providers })
    // The group's accessible name should describe the group's purpose, not
    // a state-dependent action. Per-button aria-pressed conveys the action.
    const pill = screen.getByRole('group')
    expect(pill).toHaveAttribute('aria-label', 'View mode')
  })
})

describe('ViewModeToggle — interaction', () => {
  test('clicking the Dev segment sets viewMode to "dev" (aria-pressed flips)', async () => {
    const user = userEvent.setup()
    render(<ViewModeToggle />, { wrapper: Providers })
    const devBtn = screen.getByRole('button', { name: /dev/i })
    await user.click(devBtn)
    expect(devBtn).toHaveAttribute('aria-pressed', 'true')
    const gameBtn = screen.getByRole('button', { name: /game|juego/i })
    expect(gameBtn).toHaveAttribute('aria-pressed', 'false')
  })

  test('clicking Dev segment persists "dev" to localStorage cam-viewmode', async () => {
    const user = userEvent.setup()
    render(<ViewModeToggle />, { wrapper: Providers })
    const devBtn = screen.getByRole('button', { name: /dev/i })
    await user.click(devBtn)
    expect(window.localStorage.getItem('cam-viewmode')).toBe('dev')
  })

  test('Game segment is keyboard-operable via Enter key', async () => {
    const user = userEvent.setup()
    // Start in dev mode so clicking Game is meaningful
    window.localStorage.setItem('cam-viewmode', 'dev')
    render(<ViewModeToggle />, { wrapper: Providers })
    const gameBtn = screen.getByRole('button', { name: /game|juego/i })
    gameBtn.focus()
    await user.keyboard('{Enter}')
    expect(gameBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('Dev segment is keyboard-operable via Space key', async () => {
    const user = userEvent.setup()
    render(<ViewModeToggle />, { wrapper: Providers })
    const devBtn = screen.getByRole('button', { name: /dev/i })
    devBtn.focus()
    await user.keyboard(' ')
    expect(devBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('pill aria-label stays stable across state changes (CR-02)', async () => {
    const user = userEvent.setup()
    render(<ViewModeToggle />, { wrapper: Providers })
    const devBtn = screen.getByRole('button', { name: /dev/i })
    await user.click(devBtn)
    const pill = screen.getByRole('group')
    // Group label is purpose, not action — must NOT mutate with state.
    expect(pill).toHaveAttribute('aria-label', 'View mode')
  })
})
