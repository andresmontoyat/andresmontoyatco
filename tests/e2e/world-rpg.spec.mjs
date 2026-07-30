import { test, expect } from '@playwright/test'

// The World RPG cover button label is locale-specific copy (see WorldRpg.jsx's COPY table),
// unlike the platformer's generic "Play" button — match by locale so this spec can be reused
// for /es/ later without relying on an accidental English substring match.
const PLAY_LABEL = {
  en: /explore my career world/i,
  es: /explora mi mundo de carrera/i,
}

// Same sequence as src/game/input/konami.js's KONAMI export — kept literal here (not imported)
// so this e2e spec exercises the real keyboard event path end-to-end rather than importing
// engine internals into the test file.
const KONAMI_SEQUENCE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a',
]

// Click the cover, wait for the engine + sprite atlas to mount, then skip the 3s cold-open
// cutscene directly through the exposed dev handle. Calling state.intro.skip() beats a keypress
// here: a keypress would also race onKey's own skip-intro branch and could double as an
// interact()/language toggle depending on which key fires first — evaluate() is deterministic.
async function loadWorldRpg(page, locale = 'en') {
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })

  await page.goto(`/${locale}/`)
  // The page hydrates client-side after load — wait for network idle so the click lands on the
  // settled DOM (same rationale as career-world.spec.mjs).
  await page.waitForLoadState('networkidle')
  const playButton = page.getByRole('button', { name: PLAY_LABEL[locale] })
  await playButton.scrollIntoViewIfNeeded()
  await playButton.click()

  const canvas = page.getByTestId('world-rpg-canvas')
  await expect(canvas).toBeVisible()
  await canvas.focus()

  // window.__worldRpg is only set once createWorldRpg() resolves (dynamic import + mount);
  // state.sprites is only set once the async sprite atlas finishes loading.
  await page.waitForFunction(() => window.__worldRpg?.state?.sprites)

  await page.evaluate(() => window.__worldRpg.state.intro.skip())
  await page.waitForFunction(() => window.__worldRpg.state.intro.done())
  await canvas.focus()

  return { canvas, errors }
}

test('mount + move: cover click loads the engine and the player walks right', async ({ page }) => {
  const { errors } = await loadWorldRpg(page, 'en')

  const xBefore = await page.evaluate(() => window.__worldRpg.state.player.x)
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(400)
  await page.keyboard.up('ArrowRight')
  const xAfter = await page.evaluate(() => window.__worldRpg.state.player.x)

  expect(xAfter).toBeGreaterThan(xBefore)
  expect(errors).toEqual([])
})

test('konami sequence reveals the hidden side-project sites', async ({ page }) => {
  const { errors } = await loadWorldRpg(page, 'en')

  const before = await page.evaluate(() => ({
    revealed: window.__worldRpg.state.revealed,
    activeCount: window.__worldRpg.activeSites().length,
    hiddenCount: window.__worldRpg.state.world.hiddenSites.length,
  }))
  expect(before.revealed).toBe(false)
  expect(before.hiddenCount).toBeGreaterThan(0)

  for (const key of KONAMI_SEQUENCE) {
    await page.keyboard.press(key)
  }

  await page.waitForFunction(() => window.__worldRpg.state.revealed === true)
  const activeCount = await page.evaluate(() => window.__worldRpg.activeSites().length)

  expect(activeCount).toBe(before.activeCount + before.hiddenCount)
  expect(errors).toEqual([])
})

test('L key toggles the in-game language', async ({ page }) => {
  const { errors } = await loadWorldRpg(page, 'en')

  const langBefore = await page.evaluate(() => window.__worldRpg.state.lang)
  expect(langBefore).toBe('en')

  await page.keyboard.press('l')
  await page.waitForFunction(
    (prev) => window.__worldRpg.state.lang !== prev,
    langBefore,
  )
  const langAfter = await page.evaluate(() => window.__worldRpg.state.lang)

  expect(langAfter).toBe('es')
  expect(errors).toEqual([])
})

test('reaching a site door and interacting marks it seen', async ({ page }) => {
  const { errors } = await loadWorldRpg(page, 'en')

  const seenBefore = await page.evaluate(() => window.__worldRpg.state.world.sites[0].seen)
  expect(seenBefore).toBe(false)

  // Teleport the player onto the first site's door point via state rather than walking the
  // overworld path — the path crosses several biomes and would make this test slow and coupled
  // to terrain/collision layout. Asserting the interact() contract via state is the non-flaky
  // option: it exercises the same nearestSite()/isPlayerAtDoor() logic the real walk would hit.
  await page.evaluate(() => {
    const { state } = window.__worldRpg
    const site = state.world.sites[0]
    state.player.x = site.cx
    state.player.y = site.cy + site.h / 2 + 20
  })
  await page.evaluate(() => window.__worldRpg.interact())

  const seenAfter = await page.evaluate(() => window.__worldRpg.state.world.sites[0].seen)
  expect(seenAfter).toBe(true)
  expect(errors).toEqual([])
})
