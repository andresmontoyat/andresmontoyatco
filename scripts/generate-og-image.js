/* eslint-disable no-console, import/no-extraneous-dependencies */
// One-shot OG image generator. NOT part of the production build.
// Run: `node scripts/generate-og-image.js`
//
// Requires Playwright (devDependency). Install with:
//   npm install --save-dev playwright
//   npx playwright install chromium
//
// Output: ./public/og-image.png (1200x630)
const path = require('path')
const { chromium } = require('playwright')

const TEMPLATE = path.resolve(__dirname, 'og-template.html')
const OUTPUT   = path.resolve(__dirname, '..', 'public', 'og-image.png')

async function run() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  await page.goto(`file://${TEMPLATE}`, { waitUntil: 'networkidle' })
  // Give web fonts a moment to settle
  await page.waitForTimeout(500)
  await page.screenshot({
    path: OUTPUT,
    type: 'png',
    omitBackground: false,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  })
  await browser.close()
  console.log(`OG image written: ${OUTPUT}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
