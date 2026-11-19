// Renders the stills shown while the desk loads: public/desk/poster-{landscape,portrait}.webp
// Needs the dev server running (bun run dev) and a Playwright browser (bunx playwright install chromium).
// Usage: node scripts/desk-poster.mjs [base-url]
import { chromium } from 'playwright'
import sharp from 'sharp'
import { resolve } from 'node:path'

const base = process.argv[2] ?? 'http://localhost:3000'
const out = resolve(import.meta.dirname, '../public/desk')
const shots = [
  { name: 'landscape', width: 1600, height: 1000, scale: 1 },
  { name: 'portrait', width: 390, height: 844, scale: 2 },
]

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: s.scale })
  await page.goto(`${base}/?poster`, { waitUntil: 'load' })
  await page.waitForSelector('[data-ready]', { timeout: 60_000 })
  await page.waitForTimeout(500)
  const png = await page.locator('canvas').screenshot()
  await sharp(png).webp({ quality: 70 }).toFile(resolve(out, `poster-${s.name}.webp`))
  console.log(`ok    public/desk/poster-${s.name}.webp`)
  await page.close()
}
await browser.close()
