import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }, info) => {
  // Short viewports put the hero statistic below the former observer margin.
  await page.setViewportSize(info.project.name === 'mobile'
    ? { width: 390, height: 640 }
    : { width: 1440, height: 800 })
})

test('hero counter finishes without scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/public_remediation')
  await expect(page.locator('.rm-counter')).toHaveText('7,500', { timeout: 4000 })
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test('reduced motion shows the final statistic immediately without scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/public_remediation')
  await expect(page.locator('.rm-counter')).toHaveText('7,500', { timeout: 500 })
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test('residents can open the NJ crash-analysis tool beside the letter builder', async ({ page }) => {
  await page.goto('/public_remediation')
  const resident = page.locator('.rm-track-resident')
  await expect(resident.getByRole('link', { name: 'Explore the NJ High Injury Network' })).toHaveAttribute('href', '/nj-hin/')
  await expect(resident.getByRole('textbox', { name: /letter/i })).toHaveCount(1)
})
