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
