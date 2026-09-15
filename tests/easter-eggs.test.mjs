import test from 'node:test'
import assert from 'node:assert/strict'
import { HOME, filesystem } from '../src/desktop/filesystem.js'
import { executeCommand, completeCommand } from '../src/desktop/shell.js'
import { formatOutput } from '../src/desktop/terminalFormat.js'

const output = command => executeCommand(command, HOME).lines[0].text

test('sudo is a joke, including the sandwich request', () => {
  assert.match(output('sudo'), /relationship with this website/)
  assert.match(output('sudo make me a sandwich'), /okay.*🥪/)
  assert.match(output('sudo rm -rf ~'), /relationship with this website/)
})

test('cowsay accepts quoted text and draws a small cow', () => {
  assert.match(output('cowsay'), /moo/)
  const cow = output('cowsay "hello there"')
  assert.match(cow, /< hello there >/)
  assert.ok(cow.includes('(oo)'))
  assert.ok(cow.includes('\\'))
})

test('cowsay wraps long words and limits the speech to 200 characters', () => {
  const cow = output(`cowsay "${'abcdefgh '.repeat(80)}"`)
  assert.ok(cow.split('\n').every(line => line.length <= 36))
  const words = cow.split('\n').filter(line => /^[<|/\\]/.test(line)).map(line => line.slice(2, -2).trim()).join(' ')
  assert.ok(words.length <= 200)
  const longWord = output(`cowsay ${'x'.repeat(500)}`)
  assert.ok(longWord.split('\n').every(line => line.length <= 36))
  assert.equal((longWord.match(/x/g) ?? []).length, 200)
  const wide = output(`cowsay ${'界'.repeat(40)}`)
  assert.ok(wide.includes('界'.repeat(16)))
  assert.ok(!wide.includes('界'.repeat(17)))
  const emoji = output(`cowsay ${'🦉'.repeat(30)}`)
  assert.ok(emoji.includes('🦉'.repeat(16)))
  assert.ok(!emoji.includes('🦉'.repeat(17)))
})

test('cowsay controls cannot clear the terminal or inject escape sequences', () => {
  const result = executeCommand('cowsay "hi\x1b[2J\x07there\nfriend"', HOME)
  assert.equal(result.clear, undefined)
  assert.ok(!result.lines[0].text.includes('\x1b'))
  assert.ok(!result.lines[0].text.includes('\x07'))
  const rendered = formatOutput(result.lines[0], 80)
  assert.ok(!rendered.includes('\x1b[2J'))
  assert.match(rendered, /friend/)
})

test('fortune uses a bounded set of lowercase jokes', t => {
  const random = t.mock.method(Math, 'random', () => 0)
  const first = output('fortune')
  random.mock.mockImplementation(() => 0.999)
  const last = output('fortune')
  assert.notEqual(first, last)
  for (const fortune of [first, last]) {
    assert.equal(fortune, fortune.toLowerCase())
    assert.ok(fortune.length > 10 && fortune.length < 140)
  }
})

test('train, exit, editor, and profile easter eggs are plain text', () => {
  assert.match(output('sl'), /you missed your stop\. try ls\./)
  assert.equal(output('exit'), 'you live here now.')
  assert.equal(output('logout'), output('exit'))
  assert.match(output('vim about.txt'), /:q/)
  assert.match(output('nano about.txt'), /:q/)
  assert.match(output(':q'), /escaped/)
  assert.match(output('neofetch'), /os: a website/)
  assert.match(output('neofetch'), /shell: pretend bash/)
})

test('easter eggs leave files and location unchanged and normal commands still work', () => {
  const snapshot = JSON.stringify(filesystem)
  const cwd = `${HOME}/writing`
  for (const command of ['sudo', 'sudo rm -rf /', 'cowsay hello', 'fortune', 'sl', 'exit', 'logout', 'vim about.txt', 'nano about.txt', ':q', 'neofetch', 'rm -rf ~']) {
    const result = executeCommand(command, cwd)
    assert.equal(result.cwd, cwd, command)
    assert.equal(result.lines[0].type, 'text', command)
    assert.equal(result.mode, undefined)
    assert.equal(result.clear, undefined)
  }
  assert.equal(JSON.stringify(filesystem), snapshot)
  assert.equal(executeCommand('ls', cwd).lines[0].type, 'listing')
  assert.equal(executeCommand('cd ..', cwd).cwd, HOME)
  assert.equal(executeCommand('cat about.txt', HOME).lines[0].type, 'file')
})

test('easter eggs are discoverable by completion without listing them in help', () => {
  for (const name of ['sudo', 'cowsay', 'fortune', 'sl', 'exit', 'logout', 'vim', 'nano', ':q', 'neofetch']) {
    assert.ok(completeCommand(name, HOME).includes(name))
    assert.ok(!output('help').includes(name + ' '))
  }
  assert.match(output('help'), /a few other commands work too\./)
})
