import { test, expect } from '@playwright/test'

test('play → run → reach a company → panel', async ({ page }) => {
  await page.goto('/en/')
  // The page hydrates client-side after load (React island mismatch causes a
  // remount) — wait for network idle so the click lands on the settled DOM,
  // not a node about to be replaced mid-hydration.
  await page.waitForLoadState('networkidle')
  const playButton = page.getByRole('button', { name: /play/i })
  // The button is below the fold; scrolling it into view before clicking
  // avoids a flaky no-op click on the pre-scroll layout.
  await playButton.scrollIntoViewIfNeeded()
  await playButton.click()
  const canvas = page.getByTestId('career-canvas')
  await expect(canvas).toBeVisible()
  await canvas.focus()
  await page.keyboard.down('ArrowRight')
  for (let i = 0; i < 12; i++) {
    await page.keyboard.down('Space')
    await page.waitForTimeout(70)
    await page.keyboard.up('Space')
    await page.waitForTimeout(220)
  }
  await page.keyboard.up('ArrowRight')
  // the game exposes state on window for assertions in dev
  const coins = await page.evaluate(() => window.__career?.getState().coinCount ?? 0)
  expect(coins).toBeGreaterThan(0)
})

test('close panel button resumes the paused engine (touch/mobile deadlock regression)', async ({ page }) => {
  await page.goto('/en/')
  await page.waitForLoadState('networkidle')
  const playButton = page.getByRole('button', { name: /play/i })
  await playButton.scrollIntoViewIfNeeded()
  await playButton.click()
  const canvas = page.getByTestId('career-canvas')
  await expect(canvas).toBeVisible()
  await canvas.focus()

  // Run right until the player is within opening range of the first
  // company, then open its panel via the keyboard shortcut (Enter) — this
  // pauses the engine the same way a tap does on touch/mobile.
  await page.keyboard.down('ArrowRight')
  await page.waitForFunction(() => {
    const s = window.__career?.getState()
    const company = s?.level.companies[0]
    if (!s || !company) return false
    return Math.abs((s.player.x + s.player.w / 2) - company.cx) < 72
  }, null, { timeout: 15000 })
  await page.keyboard.up('ArrowRight')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  const pausedAfterOpen = await page.evaluate(() => window.__career?.getState().paused)
  expect(pausedAfterOpen).toBe(true)

  // Dismiss via the React overlay's ✕ close button — not Escape — so this
  // covers the touch/mobile path that never fires a keydown at all.
  await page.getByRole('button', { name: /close/i }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()

  const pausedAfterClose = await page.evaluate(() => window.__career?.getState().paused)
  expect(pausedAfterClose).toBe(false)

  // The player must be able to move again — a stale pause flag would freeze
  // the canvas even though React unmounted the panel.
  const xBefore = await page.evaluate(() => window.__career?.getState().player.x)
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(300)
  await page.keyboard.up('ArrowRight')
  const xAfter = await page.evaluate(() => window.__career?.getState().player.x)
  expect(xAfter).toBeGreaterThan(xBefore)
})
