import test from 'node:test'
import assert from 'node:assert/strict'
import { HOME } from '../src/desktop/filesystem.js'
import { TerminalSession } from '../src/desktop/terminalSession.js'

class TerminalOutput {
  constructor(delay = 1) {
    this.delay = delay
    this.writes = []
    this.cols = 80
    this.rows = 40
    this.buffer = { active: { cursorY: 0, baseY: 0 } }
  }
  write(text, callback) { this.writes.push(text); setTimeout(() => callback?.(), this.delay) }
  registerMarker() { return { line: 0, dispose() {} } }
  scrollToBottom() {}
  focus() {}
}

function createSession(options = {}) {
  const terminal = new TerminalOutput()
  const navigation = []
  const modes = []
  const session = new TerminalSession(terminal, {
    onNavigate: path => navigation.push(path),
    onMode: mode => modes.push(mode),
    onBootComplete() {},
    ...options,
  })
  session.booting = false
  return { terminal, session, navigation, modes }
}

test('rapid keys and one bulk insertion update the model immediately and coalesce output', async () => {
  const { terminal, session } = createSession()
  for (const char of 'x'.repeat(300)) session.input(char)
  session.input(' bulk input')
  assert.equal(session.editor.value, 'x'.repeat(300) + ' bulk input')
  await session.whenIdle()
  assert.ok(terminal.writes.join('').includes('x'.repeat(300) + ' bulk input'))
  assert.ok(terminal.writes.length <= 4, 'a burst must not render once per key')
  session.dispose()
})

test('burst commands execute in order without losing Enter or navigation', async () => {
  const { terminal, session, navigation } = createSession()
  session.input('cd projects\rpwd\rcd order-book\rcat readme.md\r')
  assert.equal(session.cwd, `${HOME}/projects/order-book`)
  assert.equal(session.editor.value, '')
  assert.deepEqual(navigation, [`${HOME}/projects`, `${HOME}/projects/order-book`])
  await session.whenIdle()
  const output = terminal.writes.join('')
  assert.ok(output.indexOf('cd projects') < output.indexOf('pwd'))
  assert.ok(output.includes('cat readme.md'))
  assert.ok(output.includes(`${HOME}/projects`))
  session.dispose()
})

test('clear removes pending output while preserving input that follows it', async () => {
  const { terminal, session } = createSession()
  session.input('whoami\rclear\rpwd\rcat about.txt')
  assert.equal(session.editor.value, 'cat about.txt')
  await session.whenIdle()
  const output = terminal.writes.join('')
  assert.ok(output.includes('\x1b[2J'))
  assert.ok(output.includes('\x1b[3J'))
  assert.ok(!output.includes('whoami'))
  assert.ok(output.includes('pwd'))
  assert.ok(output.includes('cat about.txt'))
  session.dispose()
})

test('startup writes the overview immediately and preserves input before that write settles', async () => {
  const { terminal, session } = createSession()
  terminal.delay = 20
  session.booting = true
  const startup = session.start()
  assert.equal(terminal.writes.length, 1)
  assert.ok(terminal.writes[0].includes('overview'))
  assert.ok(terminal.writes[0].includes('file explorer is in the top left.'))
  session.input('pwd\r')
  assert.equal(session.editor.history.at(-1), 'pwd')
  await startup
  await session.whenIdle()
  assert.ok(terminal.writes.join('').includes(`${HOME}\r\n`))
  session.dispose()
})

test('bracketed paste is inert across chunks and large input is bounded', async () => {
  const { session } = createSession()
  session.input('\x1b[200~cd projects\n')
  session.input('rm -rf ~\x1b[201~')
  assert.equal(session.cwd, HOME)
  assert.equal(session.editor.value, 'cd projects rm -rf ~')
  assert.equal(session.editor.history.length, 0)
  session.input('\x15')
  session.input('x'.repeat(100000))
  assert.ok(session.editor.value.length <= 1024)
  session.input('\x03pwd\r')
  assert.equal(session.editor.history.at(-1), 'pwd')
  await session.whenIdle()
  session.dispose()
})

test('cursor editing, completion and history survive coalesced updates', async () => {
  const { session } = createSession()
  session.input('c projects\x01\x1b[Cd\x05\r')
  assert.equal(session.cwd, `${HOME}/projects`)
  session.input('cd or\t\r')
  assert.equal(session.cwd, `${HOME}/projects/order-book`)
  session.input('cat readme.md\r\x1b[A')
  assert.equal(session.editor.value, 'cat readme.md')
  session.input('\x1b[B')
  assert.equal(session.editor.value, '')
  session.input('🦉界\x1b[D\x7f')
  assert.equal(session.editor.value, '界')
  await session.whenIdle()
  session.dispose()
})

test('switching modes preserves the command buffer and latest directory', async () => {
  const { session, modes } = createSession()
  session.input('cd projects\rexplorer\r')
  await session.whenIdle()
  assert.deepEqual(modes, ['explorer'])
  session.active = false
  session.setDirectory(`${HOME}/research`)
  session.active = true
  session.input('pwd\r')
  assert.equal(session.cwd, `${HOME}/research`)
  await session.whenIdle()
  assert.equal(session.editor.history.at(-1), 'pwd')
  session.dispose()
})

test('disposing releases pending output waits and prevents callbacks after disposal', async () => {
  let callbacks = 0
  const { session, terminal } = createSession({ onMode() { callbacks++ } })
  terminal.write = text => terminal.writes.push(text)
  session.input('explorer\r')
  const idle = session.whenIdle()
  session.dispose()
  await idle
  assert.equal(callbacks, 0)
})

test('clear in a command chain keeps later output and navigation', async () => {
  const { terminal, session } = createSession()
  session.input('clear; cd projects && pwd\r')
  assert.equal(session.cwd, `${HOME}/projects`)
  await session.whenIdle()
  const output = terminal.writes.join('')
  assert.ok(output.includes('\x1b[3J'))
  assert.ok(output.includes(`${HOME}/projects\r\n`))
  session.dispose()
})

test('preview links invoke the reader once after terminal output finishes', async () => {
  const previews = []
  const { session } = createSession({ onPreview: path => previews.push(path) })
  session.previewVirtualLink(`portfolio-view:${encodeURIComponent(`${HOME}/projects/order-book`)}`)
  assert.deepEqual(previews, [])
  await session.whenIdle()
  assert.deepEqual(previews, [`${HOME}/projects/order-book/readme.md`])
  assert.equal(session.cwd, HOME)
  session.dispose()
})

test('stale directory props cannot rewind a burst of navigation', async () => {
  const { session } = createSession()
  session.input('cd projects\rcd ..\r')
  session.setDirectory(`${HOME}/projects`)
  assert.equal(session.cwd, HOME)
  session.setDirectory(HOME)
  session.active = false
  session.setDirectory(`${HOME}/research`)
  assert.equal(session.cwd, `${HOME}/research`)
  await session.whenIdle()
  session.dispose()
})

const settle = ms => new Promise(resolve => setTimeout(resolve, ms))

test('a demo draws frames in place, ignores typing, and q returns the prompt with a summary', async () => {
  let clock = 0
  const { terminal, session } = createSession({ seed: () => 7, now: () => (clock += 400) })
  session.input('run maze\r')
  assert.ok(session.program, 'the demo owns the terminal')
  await settle(120)
  const live = terminal.writes.join('')
  assert.ok(live.includes('parth@portfolio:~$ run maze'))
  assert.ok(live.includes('\x1b[?25l'), 'the cursor is hidden while frames are drawn')
  assert.ok(live.includes('searching'))
  session.input('ls\r')
  assert.equal(session.editor.value, '', 'typing does not reach the prompt while a demo runs')
  assert.ok(session.program)
  session.input('q')
  assert.equal(session.program, null)
  await session.whenIdle()
  const output = terminal.writes.join('')
  assert.ok(output.includes('quarter turns'))
  assert.ok(output.includes('stopped early'))
  assert.ok(terminal.writes.at(-1).includes('\x1b[?25h'), 'the cursor returns with the prompt')
  session.input('pwd\r')
  await session.whenIdle()
  assert.ok(terminal.writes.join('').includes(HOME))
  session.dispose()
})

test('a demo ends on its own and leaves its summary in the scrollback', async () => {
  let clock = 0
  const { terminal, session } = createSession({ seed: () => 7, now: () => (clock += 3000) })
  session.input('run uav\r')
  for (let waited = 0; session.program && waited < 3000; waited += 20) await settle(20)
  assert.equal(session.program, null)
  await session.whenIdle()
  const output = terminal.writes.join('')
  assert.match(output, /1,000 landings, each sampled fresh/)
  assert.ok(!output.includes('stopped after'))
  session.dispose()
})

test('reduced motion and small terminals print the result without animating', async () => {
  for (const options of [{ reducedMotion: () => true }, { rows: 10 }]) {
    const { terminal, session } = createSession({ seed: () => 7, reducedMotion: options.reducedMotion })
    if (options.rows) terminal.rows = options.rows
    session.input('run orderbook\r')
    assert.equal(session.program, null)
    await session.whenIdle()
    const output = terminal.writes.join('')
    assert.match(output, /3,200 generated events/)
    assert.ok(!output.includes('\x1b[?25l'))
    session.dispose()
  }
})

test('a demo pauses while the terminal is hidden and is released on dispose', async () => {
  let clock = 0
  const { session } = createSession({ seed: () => 7, now: () => (clock += 50) })
  session.input('run orderbook\r')
  await settle(80)
  session.active = false
  await settle(40)
  const paused = session.program.instance.stats.events
  await settle(120)
  assert.equal(session.program.instance.stats.events, paused)
  session.active = true
  await settle(120)
  assert.ok(session.program.instance.stats.events > paused)
  session.dispose()
  assert.equal(session.program, null)
  assert.equal(session.programTimer, null)
})

test('opening a link from the scrollback stops a running demo first', async () => {
  const { session, navigation } = createSession({ seed: () => 7 })
  session.input('run maze\r')
  session.openVirtualLink(`portfolio:${encodeURIComponent(`${HOME}/projects`)}`)
  assert.equal(session.program, null)
  assert.deepEqual(navigation, [`${HOME}/projects`])
  await session.whenIdle()
  session.dispose()
})

test('history reaches the shell from the session', async () => {
  const { terminal, session } = createSession()
  session.input('pwd\rwhoami\rhistory\r')
  await session.whenIdle()
  assert.match(terminal.writes.join(''), / {3}1 {2}pwd\r\n {3}2 {2}whoami\r\n {3}3 {2}history/)
  session.dispose()
})
