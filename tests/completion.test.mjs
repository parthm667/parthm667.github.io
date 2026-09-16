import test from 'node:test'
import assert from 'node:assert/strict'
import { HOME } from '../src/desktop/filesystem.js'
import { completeCommand } from '../src/desktop/shell.js'

test('completion keeps command chains and uses the preceding virtual directory', () => {
  assert.ok(completeCommand('cd projects; cd or').includes('cd projects; cd order-book/'))
  assert.ok(completeCommand('cd projects && cat order-book/re').includes('cd projects && cat order-book/readme.md'))
  assert.ok(completeCommand('cd projects; cd order-book; cat re').includes('cd projects; cd order-book; cat readme.md'))
  assert.ok(completeCommand('pwd && ').includes('pwd && help'))
  assert.ok(completeCommand('cd missing && cd projects; cat ab').includes('cd missing && cd projects; cat about.txt'))
})

test('completion treats quoted separators as text and preserves the completed prefix', () => {
  assert.ok(completeCommand('cowsay "a; b && c";  cat ab', HOME).includes('cowsay "a; b && c";  cat about.txt'))
  assert.ok(completeCommand('pwd; open "writing/road').includes('pwd; open writing/road_design.url'))
  assert.deepEqual(completeCommand('cat "about;'), [])
  assert.deepEqual(completeCommand('pwd | cat ab'), [])
})
