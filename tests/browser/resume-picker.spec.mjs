import { test, expect } from '@playwright/test'

// Synthetic UI fixtures: these are not the user's resumes or a real analysis.
const resumes = Object.fromEntries(['SWE', 'AI', 'Defense', 'QD', 'Quant'].map(type => [type, `Synthetic ${type} resume: Python projects with measured results.`]))
const comparison = {
  mode: 'local', winner: 'SWE', rawWinner: 'SWE', why: 'The software version shows the requested systems work.', track: 'Backend engineering',
  eligibility: { status: 'Fail', explanation: 'This fixture requires an unavailable clearance.', checks: [{ requirement: 'Active clearance', status: 'Fail', explanation: 'No active clearance in supplied facts.' }] },
  concepts: [{ name: 'Python', weight: 3, category: 'explicitly_required' }],
  scorecard: Object.keys(resumes).map((resume, index) => ({ resume, coverage: 75 - index * 5, cosine: .85 - index * .05, humanRank: null, story: `Synthetic ${resume} recruiter story.` })),
  strongMatches: ['Python is demonstrated.'], underSignaled: [], realGaps: ['Active clearance is missing.'], edits: ['Keep the supported Python accomplishment.'], limitations: ['Fixed-rule analysis requires review.'],
  evidence: [{ concept: 'Python', resume: 'SWE', level: 'explicit_demonstrated', quote: 'Python projects with measured results.', reason: 'The skill appears in a project.' }],
}

async function mockApi(page, { authenticated = false } = {}) {
  const calls = []
  await page.route('**/api/resume-picker?*', async route => {
    const action = new URL(route.request().url()).searchParams.get('action')
    const body = route.request().postDataJSON()
    calls.push({ action, body })
    let json = {}
    if (action === 'session') json = { authenticated }
    if (action === 'login') {
      if (body.password !== 'test-password') return route.fulfill({ status: 401, json: { error: 'Incorrect password.' } })
      authenticated = true
      json = { authenticated: true }
    }
    if (action === 'resumes') json = { resumes, files: Object.fromEntries(Object.keys(resumes).map(type => [type, `fixture-${type}.pdf`])), facts: 'Synthetic facts: graduation May 2027.', aiAvailable: false }
    if (action === 'analyze') json = comparison
    if (action === 'logout') authenticated = false
    await route.fulfill({ json })
  })
  return calls
}

async function unlock(page) {
  await page.getByLabel('Password', { exact: true }).fill('test-password')
  await page.getByRole('button', { name: 'Unlock workspace' }).click()
  await expect(page.getByRole('heading', { name: 'The opportunity' })).toBeVisible()
}

test('private gate handles an incorrect password and clears sensitive state when locked', async ({ page }) => {
  const calls = await mockApi(page)
  await page.goto('/resume-picker')
  await expect(page.getByRole('heading', { name: 'Private resume picker' })).toBeVisible()
  expect(calls.some(call => call.action === 'resumes')).toBe(false)
  await page.getByLabel('Password', { exact: true }).fill('wrong')
  await page.getByRole('button', { name: 'Unlock workspace' }).click()
  await expect(page.getByRole('alert')).toHaveText('Incorrect password.')
  await unlock(page)
  await page.getByLabel('Job description', { exact: false }).fill('Python engineer building reliable services.')
  await page.getByRole('button', { name: 'Lock workspace' }).click()
  await expect(page.getByRole('heading', { name: 'Private resume picker' })).toBeVisible()
  await unlock(page)
  await expect(page.getByLabel('Job description', { exact: false })).toBeEmpty()
  await expect.poll(() => calls.some(call => call.action === 'logout')).toBe(true)
})

test('comparison exposes scores, failed eligibility, evidence and clears stale results', async ({ page }) => {
  const calls = await mockApi(page, { authenticated: true })
  await page.goto('/resume-picker')
  await expect(page.getByLabel('Your eligibility facts')).toHaveValue('Synthetic facts: graduation May 2027.')
  await page.getByLabel('Job description', { exact: false }).fill('Python engineer building reliable services.')
  await page.getByLabel('Company context').selectOption('startup')
  await page.getByRole('button', { name: 'Compare resumes' }).click()
  await expect(page.getByRole('heading', { name: 'Eligibility: Fail' })).toBeVisible()
  await expect(page.getByText('Resume changes cannot resolve a failed eligibility requirement.')).toBeVisible()
  const scorecard = page.getByRole('region', { name: 'Resume scorecard' })
  await expect(scorecard.getByRole('cell', { name: '75.0%', exact: true })).toBeVisible()
  await expect(scorecard.getByRole('cell', { name: '0.850', exact: true })).toBeVisible()
  await expect(page.getByText(/it is not a percentage qualified/)).toBeVisible()
  expect(calls.find(call => call.action === 'analyze').body).toMatchObject({ companyType: 'startup', mode: 'local', jd: 'Python engineer building reliable services.' })
  await page.getByText('Inspect resume evidence').click()
  await expect(page.getByRole('blockquote')).toHaveText('Python projects with measured results.')
  await page.getByLabel('Your eligibility facts').fill('Updated truthful facts.')
  await expect(page.getByRole('heading', { name: 'Your comparison' })).toHaveCount(0)
})

test('resume previews and AI inputs stay usable without horizontal page overflow', async ({ page }) => {
  await mockApi(page, { authenticated: true })
  await page.goto('/resume-picker')
  await page.getByRole('tab', { name: 'Defense', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Open protected PDF' })).toHaveAttribute('href', '/api/resume-picker?action=pdf&resume=Defense')
  await page.getByText('Read extracted resume text').click()
  await expect(page.getByText(resumes.Defense, { exact: true })).toBeVisible()
  await page.getByLabel('Analysis method').selectOption('ai')
  await expect(page.getByLabel('OpenAI API key')).toBeVisible()
  await expect(page.getByText(/Sends the job description, all five resume texts/)).toBeVisible()
  await page.getByLabel('OpenAI API key').fill('synthetic-key')
  await page.getByLabel('Job description', { exact: false }).fill('Python engineer building reliable services.')
  await page.getByRole('button', { name: 'Compare resumes' }).click()
  await expect(page.getByRole('heading', { name: 'Your comparison' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 })
})

test('an expired session removes private data and asks for another unlock', async ({ page }) => {
  await mockApi(page, { authenticated: true })
  await page.route('**/api/resume-picker?action=analyze', route => route.fulfill({ status: 401, json: { error: 'Session expired.' } }))
  await page.goto('/resume-picker')
  await page.getByLabel('Job description', { exact: false }).fill('A private job description.')
  await page.getByRole('button', { name: 'Compare resumes' }).click()
  await expect(page.getByRole('heading', { name: 'Private resume picker' })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveText('Your session expired. Unlock to continue.')
  await expect(page.getByText('Synthetic facts: graduation May 2027.')).toHaveCount(0)
  await unlock(page)
  await expect(page.getByLabel('Job description', { exact: false })).toBeEmpty()
})

test('the workspace waits for logout before allowing a new session', async ({ page }) => {
  await mockApi(page, { authenticated: true })
  let finishLogout
  await page.route('**/api/resume-picker?action=logout', async route => {
    await new Promise(resolve => { finishLogout = resolve })
    await route.fulfill({ json: { authenticated: false } })
  })
  await page.goto('/resume-picker')
  await page.getByRole('button', { name: 'Lock workspace' }).click()
  await expect(page.getByRole('button', { name: 'Locking…' })).toBeDisabled()
  await expect(page.getByLabel('Password', { exact: true })).toBeDisabled()
  await expect.poll(() => Boolean(finishLogout)).toBe(true)
  finishLogout()
  await expect(page.getByRole('button', { name: 'Unlock workspace' })).toBeEnabled()
  await unlock(page)
})
