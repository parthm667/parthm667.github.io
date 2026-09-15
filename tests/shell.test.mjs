import test from 'node:test'
import assert from 'node:assert/strict'
import { HOME, filesystem, resolvePath, getNode, listDirectory, parentPath, breadcrumbs } from '../src/desktop/filesystem.js'
import { executeCommand, completeCommand } from '../src/desktop/shell.js'

test('home exposes the personal site sections', () => {
  assert.equal(HOME, '/home/parth')
  assert.equal(filesystem.type, 'folder')
  for (const name of ['projects', 'research', 'experience', 'about.txt', 'contact.txt', 'resume.pdf', 'photography.url']) {
    assert.ok(listDirectory(HOME).some(entry => entry.name === name), name)
  }
})

test('paths accept Linux absolute paths, tilde, slash, and dot segments', () => {
  assert.equal(resolvePath('projects/../research'), `${HOME}/research`)
  assert.equal(resolvePath('~/projects'), `${HOME}/projects`)
  assert.equal(resolvePath('..', `${HOME}/projects`), HOME)
  assert.equal(resolvePath('"/home/parth/about.txt"'), `${HOME}/about.txt`)
  assert.equal(resolvePath('./projects//order-book/.'), `${HOME}/projects/order-book`)
  assert.equal(getNode(`${HOME}/about.txt`).type, 'file')
})

test('paths cannot leave the virtual home or address other users', () => {
  for (const path of ['..', '../..', '/', '/etc/passwd', '/home/parth2', '/home/PARTH', '~/../secrets', 'projects/../../secrets', 'bad\0name']) {
    assert.equal(resolvePath(path), null, path)
  }
  assert.equal(getNode(`${HOME}/missing`), null)
  assert.deepEqual(listDirectory(`${HOME}/about.txt`), [])
})

test('parent and breadcrumbs produce navigable canonical paths', () => {
  assert.equal(parentPath(HOME), HOME)
  assert.equal(parentPath(`${HOME}/projects/order-book`), `${HOME}/projects`)
  assert.deepEqual(breadcrumbs(`${HOME}/projects`), [
    { name: 'parth', path: HOME }, { name: 'projects', path: `${HOME}/projects` },
  ])
})

test('navigation persists across relative commands and cd alone goes home', () => {
  const entered = executeCommand('cd projects', HOME)
  assert.equal(entered.cwd, `${HOME}/projects`)
  const listed = executeCommand('ls', entered.cwd)
  assert.equal(listed.lines[0].type, 'listing')
  assert.ok(listed.lines[0].entries.some(entry => entry.name === 'order-book'))
  assert.equal(executeCommand('pwd', entered.cwd).lines[0].text, entered.cwd)
  assert.equal(executeCommand('cd', entered.cwd).cwd, HOME)
})

test('commands and filenames are case-sensitive', () => {
  assert.equal(getNode(`${HOME}/ABOUT.TXT`), null)
  for (const command of ['LS', 'cd PROJECTS', 'cat ABOUT.TXT', 'Get-ChildItem', 'Set-Location projects']) {
    assert.equal(executeCommand(command, HOME).lines[0].type, 'error', command)
  }
})

test('ls accepts common Linux listing flags and rejects unknown options', () => {
  for (const flags of ['-l', '-a', '-la', '-al', '-l -a']) {
    const listing = executeCommand(`ls ${flags} projects`, HOME).lines[0]
    assert.equal(listing.type, 'listing', flags)
    assert.equal(listing.path, `${HOME}/projects`)
  }
  assert.equal(executeCommand('ls -z', HOME).lines[0].type, 'error')
})

test('navigation errors preserve the current location', () => {
  for (const command of ['cd missing', 'cd about.txt', 'cd ..', 'ls missing', 'cat projects']) {
    const result = executeCommand(command, HOME)
    assert.equal(result.cwd, HOME)
    assert.equal(result.lines[0].type, 'error', command)
  }
})

test('readable files and quoted paths return real content', () => {
  for (const path of ['"about.txt"', "'about.txt'"]) {
    const result = executeCommand(`cat ${path}`, HOME)
    assert.equal(result.lines[0].type, 'file')
    assert.match(result.lines[0].node.content, /university of maryland/)
  }
  const quoted = executeCommand('open "writing/road_design.url"', HOME)
  assert.equal(quoted.lines[0].href, '/public_remediation')
})

test('open enters folders and exposes real links without navigating the browser', () => {
  assert.equal(executeCommand('open projects', HOME).cwd, `${HOME}/projects`)
  assert.equal(executeCommand('xdg-open resume.pdf', HOME).lines[0].href, '/resume.pdf')
  assert.equal(executeCommand('open projects/order-book/source.url', HOME).lines[0].href, 'https://github.com/sujaykonda/crypto-hft')
  assert.equal(executeCommand('explorer', HOME).mode, 'explorer')
})

test('listing a file supplies its parent directory so the entry opens correctly', () => {
  const listing = executeCommand('ls about.txt', HOME).lines[0]
  assert.equal(listing.path, HOME)
  const opened = executeCommand(`open "${listing.path}/${listing.entries[0].name}"`, HOME)
  assert.equal(opened.lines[0].type, 'file')
  assert.equal(opened.lines[0].node.name, 'about.txt')
})

test('contact email has a clickable mailto target', () => {
  assert.match(getNode(`${HOME}/contact.txt`).content, /mailto:pmhaske@umd\.edu/)
})

test('clear asks the UI to clear output', () => {
  assert.equal(executeCommand('clear', HOME).clear, true)
})

test('empty commands are quiet and invalid syntax has a useful error', () => {
  assert.deepEqual(executeCommand('   ', HOME), { cwd: HOME, lines: [] })
  for (const command of ['cd "projects', 'cat', 'open', 'cd projects research', 'ls; alert(1)', 'fetch("https://example.com")']) {
    const result = executeCommand(command, HOME)
    assert.equal(result.lines[0].type, 'error', command)
    assert.ok(result.lines[0].text.length > 10)
  }
  assert.match(executeCommand('wat', HOME).lines[0].text, /help/)
})

test('remove commands are a harmless easter egg', () => {
  const before = JSON.stringify(filesystem)
  for (const command of ['rm -rf ~', 'rm -r projects', 'rm /']) {
    assert.match(executeCommand(command, HOME).lines[0].text, /delete|deleting|remove/i)
  }
  assert.equal(JSON.stringify(filesystem), before)
  assert.equal(listDirectory(HOME).length > 0, true)
})

test('help, identity, and tree give useful output', () => {
  assert.match(executeCommand('help', HOME).lines[0].text, /cd/)
  assert.match(executeCommand('whoami', HOME).lines[0].text, /parth/i)
  assert.match(executeCommand('tree projects', HOME).lines[0].text, /order-book/)
})

test('completion handles commands, directories, nested paths and quotes', () => {
  assert.ok(completeCommand('he', HOME).includes('help'))
  assert.ok(completeCommand('cd pro', HOME).includes('cd projects/'))
  assert.ok(completeCommand('cat ab', HOME).includes('cat about.txt'))
  assert.ok(completeCommand('cd projects/or', HOME).includes('cd projects/order-book/'))
  assert.ok(completeCommand('open "writing/road', HOME).includes('open writing/road_design.url'))
  assert.deepEqual(completeCommand('cd about', HOME), [])
  assert.deepEqual(completeCommand('cat missing/', HOME), [])
  assert.deepEqual(completeCommand('cat AB', HOME), [])
  assert.deepEqual(completeCommand('HE', HOME), [])
  assert.ok(completeCommand('ls -la pro', HOME).includes('ls -la projects/'))
  assert.ok(completeCommand('cd ~/pro', HOME).includes('cd ~/projects/'))
})

test('a bare folder enters it, while ls only lists and leaves the current location unchanged', () => {
  const listed = executeCommand('ls writing', HOME)
  assert.equal(listed.cwd, HOME)
  assert.equal(listed.lines[0].entries[0].name, 'road_design.url')
  const entered = executeCommand('writing', HOME)
  assert.equal(entered.cwd, `${HOME}/writing`)
  assert.equal(executeCommand('cat road_design.url', entered.cwd).lines[0].href, '/public_remediation')
  assert.equal(executeCommand('../projects/order-book', entered.cwd).cwd, `${HOME}/projects/order-book`)
  for (const command of ['writ', 'writing extra', 'about.txt']) {
    assert.equal(executeCommand(command, HOME).lines[0].type, 'error', command)
  }
})

test('Tab completes bare folder paths alongside command names', () => {
  assert.ok(completeCommand('wri', HOME).includes('writing/'))
  assert.ok(completeCommand('projects/or', HOME).includes('projects/order-book/'))
  assert.ok(completeCommand('~/wri', `${HOME}/projects`).includes('~/writing/'))
  assert.ok(completeCommand('ex', HOME).includes('explorer'))
  assert.ok(completeCommand('ex', HOME).includes('experience/'))
  assert.deepEqual(completeCommand('about', HOME), [])
})

test('a missing exact filename elsewhere suggests its path without executing it', () => {
  const result = executeCommand('cat road_design.url', HOME)
  assert.equal(result.cwd, HOME)
  assert.equal(result.lines[0].type, 'error')
  assert.match(result.lines[0].text, /cat writing\/road_design\.url/)
  assert.match(result.lines[0].text, /tab/)
  assert.equal(result.openPath, undefined)
})

test('a unique local prefix suggests the full filename without guessing ambiguous names', () => {
  const partial = executeCommand('cat roa', `${HOME}/writing`)
  assert.equal(partial.lines[0].type, 'error')
  assert.match(partial.lines[0].text, /cat road_design\.url/)
  assert.match(partial.lines[0].text, /tab/)
  assert.doesNotMatch(executeCommand('cat source.url', HOME).lines[0].text, /did you mean/)
  assert.doesNotMatch(executeCommand('cd p', HOME).lines[0].text, /photography/)
  assert.match(executeCommand('help', HOME).lines[0].text, /writing.*folder/i)
})

test('authored content and virtual filenames are lowercase while source URLs retain their case', () => {
  function check(node) {
    for (const value of [node.name, node.description, node.content].filter(Boolean)) assert.equal(value, value.toLowerCase())
    for (const child of node.children ?? []) check(child)
  }
  check(filesystem)
  assert.equal(executeCommand('cat projects/order-book/readme.md', HOME).lines[0].type, 'file')
  assert.equal(getNode(`${HOME}/projects/maze-robot/source.url`).href, 'https://github.com/parthm667/RobotTourMazeSolver')
  assert.equal(getNode(`${HOME}/projects/polymarket/source.url`).href, 'https://github.com/parthm667/PolymarketAnalysis')
  assert.equal(getNode(`${HOME}/research/uav-suspension/source.url`).href, 'https://github.com/parthm667/UAVSuspensionSystem')
  for (const command of ['help', 'whoami', 'cat missing', 'rm projects']) {
    const text = executeCommand(command, HOME).lines[0].text
    assert.equal(text, text.toLowerCase())
  }
})
