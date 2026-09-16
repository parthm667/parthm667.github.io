import { test, expect } from '@playwright/test'

const screen = page => page.locator('.xterm-rows')
const input = page => page.getByRole('textbox', { name: 'terminal command' })
const ready = page => expect(page.getByRole('region', { name: 'linux terminal' })).toHaveAttribute('data-booting', 'false')

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await ready(page)
  await input(page).focus()
})

test('rapid typing has no per-key backlog at four times CPU slowdown', async ({ page }, info) => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const command = 'latency_probe_' + 'x'.repeat(220)
  const started = Date.now()
  await page.keyboard.type(command)
  const typingMs = Date.now() - started
  await page.keyboard.press('Enter')
  const submitted = Date.now()
  await expect(screen(page)).toContainText('command not found: latency_probe_', { timeout: 1500 })
  const drainMs = Date.now() - submitted
  console.log(`${info.project.name} 4x CPU: ${typingMs}ms typing, ${drainMs}ms drain`)
  expect(drainMs).toBeLessThan(1500)
})

test('bulk text input and rapid commands after clear are preserved', async ({ page }) => {
  await page.keyboard.insertText('clear')
  await page.keyboard.press('Enter')
  await page.keyboard.insertText('cd projects')
  await page.keyboard.press('Enter')
  await page.keyboard.insertText('pwd')
  await page.keyboard.press('Enter')
  await expect(screen(page)).toContainText('/home/parth/projects')
  await expect(screen(page)).not.toContainText('file explorer is in the top left.')
  await page.keyboard.insertText('cat /home/parth/about.txt')
  await page.keyboard.press('Enter')
  await expect(screen(page)).toContainText('class of 2028')
})

test('paste stays inert and wrapped Unicode edits do not lose the command', async ({ page }) => {
  await input(page).evaluate(element => {
    const clipboardData = new DataTransfer()
    clipboardData.setData('text/plain', 'cd projects\nrm -rf ~')
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }))
  })
  await expect(screen(page)).toContainText('cd projects rm -rf ~')
  await expect(screen(page)).not.toContainText('nothing was deleted')
  await page.keyboard.press('Control+c')
  await page.keyboard.insertText('cat /home/parth/projects/order-book/readme.md🦉界')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Delete')
  await page.keyboard.press('Enter')
  await expect(screen(page)).toContainText('c++')
  await expect(screen(page)).not.toContainText('cannot find:')
})

test('typing and Enter during the intro skip it without dropping the command', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.reload()
  await expect(page.getByRole('region', { name: 'linux terminal' })).toHaveAttribute('data-booting', 'true')
  await input(page).focus()
  await page.keyboard.insertText('pwd')
  await page.keyboard.press('Enter')
  await ready(page)
  await expect(screen(page)).toContainText('pwd')
  await expect(screen(page)).toContainText('/home/parth')
})
