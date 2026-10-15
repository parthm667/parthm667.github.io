import { test, expect } from '@playwright/test'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Opt in to exercise the real encrypted bundle, not browser-test fixtures.
const password = process.env.RESUME_PICKER_TEST_PASSWORD
const pdfDirectory = process.env.RESUME_PICKER_TEST_PDF_DIR
test.skip(!password, 'Set RESUME_PICKER_TEST_PASSWORD to verify the bundled resumes.')

test('real lock, five protected PDFs, scoring, and logout work together', async ({ page }) => {
  const api = action => `/api/resume-picker?action=${action}`
  expect((await page.request.get(api('resumes'))).status()).toBe(401)
  expect((await page.request.get(api('pdf&resume=Defense'))).status()).toBe(401)
  await page.goto('/resume-picker')
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: /unlock/i }).click()
  await expect(page.getByLabel('Job description', { exact: false })).toBeVisible()
  const library = await page.request.get(api('resumes'))
  expect(library.status()).toBe(200)
  expect(library.headers()['cache-control']).toContain('no-store')
  expect(Object.keys((await library.json()).resumes)).toEqual(['SWE', 'AI', 'Defense', 'QD', 'Quant'])
  for (const variant of ['SWE', 'AI', 'Defense', 'QD', 'Quant']) {
    const pdf = await page.request.get(api(`pdf&resume=${variant}`))
    expect(pdf.status()).toBe(200)
    expect(pdf.headers()['content-type']).toContain('application/pdf')
    expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-')
    if (pdfDirectory) {
      const original = await readFile(join(pdfDirectory, `ParthMhaske${variant}Resume.pdf`))
      expect(createHash('sha256').update(await pdf.body()).digest('hex')).toBe(createHash('sha256').update(original).digest('hex'))
    }
  }
  await page.getByLabel('Job description', { exact: false }).fill('Must be a U.S. citizen.\nRequired: Python, C++, embedded systems, sensor fusion, path planning, control systems.\nBuild robotics systems.')
  const responsePromise = page.waitForResponse(response => response.url().includes('action=analyze'))
  await page.getByRole('button', { name: /compare|analy[sz]e/i }).click()
  const analysisResponse = await responsePromise
  expect(analysisResponse.status()).toBe(200)
  const result = await analysisResponse.json()
  expect(result.mode).toBe('local')
  expect(result.scorecard).toHaveLength(5)
  expect(result.winner).toBe('Defense')
  expect(result.scorecard.every(row => row.cosine >= 0 && row.cosine <= 1 && row.coverage >= 0 && row.coverage <= 100)).toBe(true)
  expect(result.evidence.some(entry => entry.resume === 'Defense' && entry.level > 0 && entry.quote)).toBe(true)
  await expect(page.getByRole('table').first()).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: /^lock(?: workspace)?$/i }).click()
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
  expect((await page.request.get(api('pdf&resume=Defense'))).status()).toBe(401)
})
