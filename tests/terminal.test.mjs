import test from 'node:test'
import assert from 'node:assert/strict'
import { HOME, listDirectory } from '../src/desktop/filesystem.js'
import { executeCommand } from '../src/desktop/shell.js'
import { formatListing, formatOutput, plainPrompt, safeTerminalText } from '../src/desktop/terminalFormat.js'
import { LineEditor } from '../src/desktop/terminalInput.js'

const plain = value => value.replace(/\x1b\][^\x07]*\x07/g, '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')

test('overview prose wraps at word boundaries on phone-width terminals', () => {
  const output = formatOutput(executeCommand('overview').lines[0], 38)
  assert.match(output, /portfolio-view:/)
  for (const line of plain(output).split('\r\n')) assert.ok(line.length <= 38, line)
  assert.ok(plain(output).includes('landings'))
  assert.ok(plain(output).includes('polymarket'))
})

test('normal ls is compact filenames with no descriptions or table heading', () => {
  const output = plain(formatListing({ entries: listDirectory(HOME), path: HOME }, 100))
  assert.match(output, /projects/)
  assert.match(output, /about\.txt/)
  assert.doesNotMatch(output, /directory:|permissions|drwx|things i have built/)
  assert.ok(output.split('\r\n').length < listDirectory(HOME).length)
  for (const line of output.split('\r\n')) assert.ok(line.length <= 100)
})

test('narrow ls layouts retain every name and fit one column', () => {
  const output = plain(formatListing({ entries: listDirectory(HOME), path: HOME }, 18))
  for (const entry of listDirectory(HOME)) assert.ok(output.includes(entry.name))
  assert.equal(output.split('\r\n').length, listDirectory(HOME).length)
})

test('ls -l prints permissions and actual content counts without invented dates', () => {
  const listing = executeCommand('ls -l', HOME).lines[0]
  assert.equal(listing.longFormat, true)
  assert.match(plain(formatListing(listing, 100)), /drwxr-xr-x\s+4 items projects/)
  assert.doesNotMatch(plain(formatListing(listing, 100)), /jul 29|4096/)
  assert.equal(executeCommand('ls', HOME).lines[0].longFormat, false)
})

test('file and link output are terminal text and real clickable targets', () => {
  const file = executeCommand('cat about.txt', HOME).lines[0]
  assert.equal(plain(formatOutput(file, 80)), file.node.content.replaceAll('\n', '\r\n'))
  const link = formatOutput(executeCommand('open resume.pdf', HOME).lines[0], 80)
  assert.ok(link.includes('/resume.pdf'))
  assert.ok(formatListing({ entries: listDirectory(HOME), path: HOME }, 100).includes('portfolio:'))
  const contact = formatOutput(executeCommand('cat contact.txt', HOME).lines[0], 80)
  assert.ok(contact.includes('\x1b]8;;mailto:pmhaske@umd.edu\x07'))
  const source = formatOutput(executeCommand('open projects/maze-robot/source.url', HOME).lines[0], 80)
  assert.equal(plain(source), 'https://github.com/parthm667/robottourmazesolver')
  assert.ok(source.includes('\x1b]8;;https://github.com/parthm667/RobotTourMazeSolver\x07'))
})

test('prompts use home shorthand and output cannot inject terminal controls', () => {
  assert.equal(plainPrompt(HOME), 'parth@portfolio:~$ ')
  assert.equal(plainPrompt(`${HOME}/projects`), 'parth@portfolio:~/projects$ ')
  assert.equal(safeTerminalText('hi\x1b[2J\x07there'), 'hi[2Jthere')
})

test('editor inserts and removes text at the cursor without corrupting Unicode', () => {
  const editor = new LineEditor()
  editor.insert('cat abot.txt')
  editor.move('home')
  for (let i = 0; i < 7; i++) editor.move('right')
  editor.insert('u')
  assert.equal(editor.value, 'cat about.txt')
  editor.move('end')
  editor.insert('🦉')
  editor.backspace()
  assert.equal(editor.value, 'cat about.txt')
  editor.move('home')
  editor.delete()
  assert.equal(editor.value, 'at about.txt')
})

test('history restores the in-progress draft and completion cycles predictably', () => {
  const editor = new LineEditor()
  editor.insert('ls')
  assert.equal(editor.submit(), 'ls')
  editor.insert('cd projects')
  editor.submit()
  editor.insert('cat ab')
  editor.recall(-1)
  assert.equal(editor.value, 'cd projects')
  editor.recall(-1)
  assert.equal(editor.value, 'ls')
  editor.recall(1)
  editor.recall(1)
  assert.equal(editor.value, 'cat ab')
  editor.complete(['cat about.txt', 'cat another.txt'])
  editor.complete([])
  assert.equal(editor.value, 'cat another.txt')
})

test('paste is inserted without submitting commands and Ctrl+U keeps the suffix', () => {
  const editor = new LineEditor()
  editor.insert('ls\nrm -rf ~\x1b[2J')
  assert.equal(editor.value, 'ls rm -rf ~[2J')
  assert.equal(editor.history.length, 0)
  editor.reset()
  editor.insert('cat about.txt')
  editor.move('home')
  for (let i = 0; i < 4; i++) editor.move('right')
  editor.clearBefore()
  assert.equal(editor.value, 'about.txt')
  assert.equal(editor.cursor, 0)
})
