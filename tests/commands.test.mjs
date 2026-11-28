import test from 'node:test'
import assert from 'node:assert/strict'
import { HOME } from '../src/desktop/filesystem.js'
import { completeCommand, executeCommand } from '../src/desktop/shell.js'
import { EXTRA_COMMANDS, MANUAL } from '../src/desktop/commands.js'

const run = (command, context) => executeCommand(command, HOME, context)
const output = (command, context) => run(command, context).lines.map(line => line.text).join('\n')
const failed = command => run(command).lines.some(line => line.type === 'error')

test('pipes pass plain text between commands', () => {
  assert.equal(output('cat about.txt | wc -w'), '72')
  assert.equal(output('ls | sort -r | head -n 2'), 'writing\nresearch')
  assert.equal(output('ls | grep txt'), 'about.txt\ncontact.txt')
  assert.equal(output('echo one two | rev'), 'owt eno')
  assert.match(output('cat about.txt | cowsay'), /\(oo\)/)
  assert.equal(output('whoami | head -1'), 'parth mhaske')
})

test('a pipe carries text only and stops at the first failure', () => {
  const piped = run('cd projects | cat')
  assert.equal(piped.cwd, HOME)
  assert.equal(run('view uav | cat').previewPath, undefined)
  assert.match(output('run maze | head'), /cannot be piped/)
  assert.match(output('cat missing.txt | wc -l'), /cannot find: missing.txt/)
  assert.match(output('ls |'), /missing command after the pipe/)
  assert.match(output('| ls'), /missing command before the pipe/)
  assert.equal(output('echo "a | b"'), 'a | b')
})

test('pipes combine with command chains', () => {
  assert.equal(output('echo a; echo b | rev && pwd | wc -c'), `a\nb\n${HOME.length}`)
  assert.equal(run('cd projects && ls | wc -l').cwd, `${HOME}/projects`)
})

test('text filters read files and report missing input', () => {
  assert.equal(output('head -n 1 about.txt'), 'hey, i’m parth.')
  assert.equal(output('head -1 about.txt'), 'hey, i’m parth.')
  assert.equal(output('tail -n 1 contact.txt'), 'linkedin: https://linkedin.com/in/pmhaske/')
  assert.match(output('wc about.txt'), /^\d+ 72 \d+ about.txt$/)
  assert.equal(output('wc -l contact.txt'), '3 contact.txt')
  assert.ok(failed('head'))
  assert.ok(failed('wc projects'))
  assert.ok(failed('tail missing.txt'))
  assert.ok(failed('head -n many about.txt'))
})

test('grep searches a file, a folder tree, and piped text', () => {
  assert.match(output('grep -n maryland about.txt'), /^3:/)
  assert.ok(output('grep -ri monte').split('\n').every(line => /monte/i.test(line) && line.includes(':')))
  assert.ok(output('grep -ri monte').includes('research/uav-suspension/readme.md:'))
  assert.ok(failed('grep zzzzzz about.txt'))
  assert.ok(failed('grep'))
  assert.equal(output('ls | grep -v t'), 'experience\nresearch')
})

test('find walks the virtual tree with name and type filters', () => {
  assert.ok(output('find . -name "*.url"').split('\n').includes('photography.url'))
  assert.deepEqual(output('find projects -type d').split('\n'), ['projects', 'projects/order-book', 'projects/maze-robot', 'projects/polymarket', 'projects/nj-hin-generator'])
  assert.ok(failed('find missing'))
  assert.ok(failed('find . -name nothing-here'))
})

test('system commands report the session honestly', () => {
  assert.equal(output('history', { history: ['ls', 'pwd'] }), '   1  ls\n   2  pwd')
  const now = () => new Date(2026, 10, 28, 9, 0)
  assert.match(output('cal', { now }), /november 2026\nsu mo tu we th fr sa\n 1  2/)
  assert.match(output('uptime', { now, startedAt: now().getTime() - 125000 }), /^up 2 minutes/)
  assert.equal(output('echo $USER at $PWD'), `parth at ${HOME}`)
  assert.equal(output('env HOME'), HOME)
  assert.equal(output('which grep'), '/usr/bin/grep')
  assert.ok(failed('which not-a-command'))
  assert.match(output('man parth'), /class of 2028/)
  assert.match(output('man grep'), /GREP\(1\)/)
  assert.ok(failed('man not-a-command'))
  assert.match(output('git log'), /corsha[\s\S]*nuntius[\s\S]*polymarket/)
  assert.match(output('df'), /read-only/)
  assert.match(output('du projects'), /projects\/order-book\n[\s\S]*projects$/)
})

test('nothing can write, fetch, or leave the virtual home directory', () => {
  for (const command of ['touch notes.txt', 'mkdir tmp', 'mv about.txt b.txt', 'cp about.txt b.txt', 'chmod 777 about.txt']) assert.match(output(command), /read-only/)
  assert.ok(failed('ls > files.txt'))
  assert.ok(failed('cat ../../etc/passwd'))
  assert.ok(failed('head /etc/passwd'))
  assert.ok(failed('grep root /etc/passwd'))
  assert.match(output('curl https://example.com'), /nothing is fetched/)
  assert.equal(run('touch notes.txt && ls').lines.at(-1).entries.some(entry => entry.name === 'notes.txt'), false)
})

test('every extra command answers and is described', () => {
  for (const command of EXTRA_COMMANDS) {
    const result = run(command)
    assert.equal(result.cwd, HOME, command)
    assert.ok(result.lines.every(line => typeof line.text === 'string'), command)
    assert.ok(!/command not found/.test(result.lines[0]?.text ?? ''), command)
  }
  for (const command of ['grep', 'find', 'head', 'tail', 'wc', 'history', 'man', 'git', 'run']) assert.ok(MANUAL[command], command)
})

test('completion covers new commands, demos, and pipes', () => {
  assert.deepEqual(completeCommand('gre'), ['grep'])
  assert.deepEqual(completeCommand('run '), ['run uav', 'run orderbook', 'run maze'])
  assert.deepEqual(completeCommand('run or'), ['run orderbook'])
  assert.ok(completeCommand('cat about.txt | w').includes('cat about.txt | wc'))
  assert.ok(completeCommand('head ab').includes('head about.txt'))
})
