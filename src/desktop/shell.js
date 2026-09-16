import { HOME, FEATURED_WORK, resolvePath, getNode, listDirectory, parentPath } from './filesystem.js'
import { EASTER_EGG_COMMANDS, easterEgg } from './easterEggs.js'

const aliases = {
  help: 'help', ls: 'ls', cd: 'cd', pwd: 'pwd', cat: 'cat',
  open: 'open', 'xdg-open': 'open', clear: 'clear', whoami: 'whoami',
  tree: 'tree', explorer: 'explorer', rm: 'rm', overview: 'overview', work: 'overview', view: 'view',
  ...Object.fromEntries(EASTER_EGG_COMMANDS.map(command => [command, command])),
}

function tokenize(raw, allowUnclosed = false) {
  const tokens = []
  let token = '', quote = null, started = false
  for (const char of raw) {
    if (quote) {
      if (char === quote) quote = null
      else token += char
    } else if (char === '"' || char === "'") {
      quote = char
      started = true
    } else if (/\s/.test(char)) {
      if (started) tokens.push(token)
      token = ''
      started = false
    } else {
      token += char
      started = true
    }
  }
  if (quote && !allowUnclosed) return null
  if (started) tokens.push(token)
  return tokens
}

const help = `look around
  overview              selected work, with links
  view polymarket       open a project writeup
  view uav              read the paper + see the figure
  view nuntius          agent evaluation work
  ls                    list files and folders
  ls -la                list all files with details
  cd projects           go into a folder
  writing               a folder name works too
  cd ..                 go up one folder
  cd ~                  go home
  cat about.txt         read a file
  open resume.pdf       show a link to open
  open projects         go into a folder
  tree                  show the folder tree
  pwd                   show your location
  whoami                a short introduction
  clear                 clear the terminal
  explorer              switch to file explorer

tab completes commands, folders, and filenames. ↑ / ↓ recall commands.
use quotes around paths with spaces. chain commands with && or ;.
a few other commands work too.`

function treeLines(node, indent = '') {
  return (node.children ?? []).flatMap((child, index, children) => {
    const last = index === children.length - 1
    return [`${indent}${last ? '└── ' : '├── '}${child.name}`, ...treeLines(child, `${indent}${last ? '    ' : '│   '}`)]
  })
}

function missingPathHint(entered, command, input, cwd) {
  const path = resolvePath(input, cwd)
  const name = path.slice(path.lastIndexOf('/') + 1)
  const eligible = node => ['cd', 'explorer'].includes(command) ? node.type === 'folder' : command === 'cat' ? node.type !== 'folder' : true
  const directory = parentPath(path)
  let matches = listDirectory(directory)
    .filter(node => eligible(node) && node.name.startsWith(name))
    .map(node => `${directory}/${node.name}`)
  if (!matches.length && !input.includes('/')) {
    const findExact = folder => listDirectory(folder).flatMap(node => [
      ...(node.name === input && eligible(node) ? [`${folder}/${node.name}`] : []),
      ...(node.type === 'folder' ? findExact(`${folder}/${node.name}`) : []),
    ])
    matches = findExact(HOME)
  }
  if (matches.length !== 1) return 'use ls to see what is here. press tab to complete names.'
  const target = matches[0].startsWith(`${cwd}/`) ? matches[0].slice(cwd.length + 1) : `~${matches[0].slice(HOME.length)}`
  return `did you mean: ${entered} ${/\s/.test(target) ? `"${target}"` : target}? press tab to complete names.`
}

// Parse only the small shell language this portfolio supports. Quoted operators
// are ordinary text; no command is ever passed to a real shell.
function splitCommands(raw, incomplete = false) {
  const commands = []
  let quote = null, start = 0, operator = null
  for (let index = 0; index < raw.length; index++) {
    const char = raw[index]
    if (quote) { if (char === quote) quote = null; continue }
    if (char === '"' || char === "'") { quote = char; continue }
    if (char === ';' || (char === '&' && raw[index + 1] === '&')) {
      const command = raw.slice(start, index).trim()
      if (!command) return { error: 'missing command before the separator.' }
      commands.push({ command, operator })
      operator = char === ';' ? ';' : '&&'
      if (operator === '&&') index++
      start = index + 1
    } else if ('|&<>'.includes(char)) return { error: 'pipes, redirects, and background jobs are not supported here. use && to run commands in order.' }
  }
  if (quote && !incomplete) return { error: 'missing closing quote. put paths with spaces inside matching quotes.' }
  const last = raw.slice(start).trim()
  if (!last && operator === '&&' && !incomplete) return { error: 'missing command after &&.' }
  if (last) commands.push({ command: last, operator })
  return { commands, completionStart: start }
}

export function executeCommand(raw, cwd = HOME) {
  const parsed = splitCommands(raw)
  if (parsed.error) return { cwd, lines: [{ type: 'error', text: parsed.error }] }
  let result = { cwd, lines: [] }, failed = false
  for (const { command, operator } of parsed.commands) {
    if (operator === '&&' && failed) continue
    const next = executeSingle(command, result.cwd)
    failed = next.lines.some(line => line.type === 'error')
    result = { ...result, ...next, lines: [...(next.clear ? [] : result.lines), ...next.lines] }
  }
  return result
}

const projectShortcuts = {
  uav: `${HOME}/research/uav-suspension/readme.md`,
  polymarket: `${HOME}/projects/polymarket/readme.md`,
  nuntius: `${HOME}/experience/nuntius.txt`,
  'order-book': `${HOME}/projects/order-book/readme.md`,
}

function executeSingle(raw, cwd = HOME) {
  const result = { cwd, lines: [] }
  const error = text => ({ ...result, lines: [{ type: 'error', text }] })
  const text = value => ({ ...result, lines: [{ type: 'text', text: value }] })
  const tokens = tokenize(raw.trim())
  if (!tokens) return error('missing closing quote. put paths with spaces inside matching quotes.')
  if (!tokens.length) return result
  const [entered, ...rawArgs] = tokens
  const command = Object.hasOwn(aliases, entered) ? aliases[entered] : null
  if (!command) {
    const path = resolvePath(entered, cwd)
    if (!rawArgs.length && path && getNode(path)?.type === 'folder') return { ...result, cwd: path }
    if (!rawArgs.length && Object.hasOwn(projectShortcuts, entered)) return executeSingle(`view ${entered}`, cwd)
    return error(`command not found: ${entered}. type help to see what works here.`)
  }
  if (command === 'rm') return text('nice try. i still need those files. nothing was deleted.')
  if (EASTER_EGG_COMMANDS.includes(command)) return text(easterEgg(command, rawArgs))
  if (command === 'ls' && rawArgs.some(arg => arg.startsWith('-') && !/^-[la]+$/.test(arg))) return error('unknown ls option. try ls, ls -l, ls -a, or ls -la.')
  const args = command === 'ls' ? rawArgs.filter(arg => !/^-[la]+$/.test(arg)) : rawArgs
  const takesPath = ['ls', 'cd', 'cat', 'open', 'view', 'tree', 'explorer'].includes(command)
  if (args.length > (takesPath ? 1 : 0)) return error('that is too many arguments. use quotes around paths with spaces, or type help.')
  if (command === 'help') return text(help)
  if (command === 'overview') return { ...result, lines: [{ type: 'overview', entries: FEATURED_WORK }] }
  if (command === 'clear') return { ...result, clear: true }
  if (command === 'pwd') return text(cwd)
  if (command === 'whoami') return text('parth mhaske\ncs + applied math at umd, class of 2028.\nread about.txt for a little more.')
  if (['cat', 'open', 'view'].includes(command) && !args[0]) return error(`usage: ${command} <file or path>. try ${command} about.txt.`)
  let path = command === 'view' && Object.hasOwn(projectShortcuts, args[0]) ? projectShortcuts[args[0]] : resolvePath(args[0] ?? (command === 'cd' ? '~' : '.'), cwd)
  if (!path) return error('that path is outside this home directory or contains invalid characters. try cd ~.')
  let node = getNode(path)
  if (!node) return error(`cannot find: ${args[0]}. ${missingPathHint(entered, command, args[0], cwd)}`)
  if (command === 'view') {
    if (node.type === 'folder') { path = `${path}/readme.md`; node = getNode(path) }
    if (!node) return error('this folder has no readme. use ls to see its files.')
    return { ...result, previewPath: path }
  }
  if (command === 'cd' || command === 'explorer') {
    if (node.type !== 'folder') return error(`${node.name} is a file. use open "${args[0]}" to read it.`)
    return { ...result, cwd: path, ...(command === 'explorer' ? { mode: 'explorer' } : {}) }
  }
  if (command === 'ls') return { ...result, lines: [{ type: 'listing', entries: node.type === 'folder' ? listDirectory(path) : [node], path: node.type === 'folder' ? path : parentPath(path), longFormat: rawArgs.some(arg => /^-[la]+$/.test(arg) && arg.includes('l')) }] }
  if (command === 'tree') return text([node.name, ...treeLines(node)].join('\n'))
  if (node.type === 'folder') {
    if (command === 'open') return { ...result, cwd: path, openPath: path }
    return error(`${node.name} is a folder. use ls "${args[0]}" or cd "${args[0]}".`)
  }
  return { ...result, openPath: path, lines: [{ type: node.type === 'link' ? 'link' : 'file', node, path, text: node.content ?? node.description, ...(node.href ? { href: node.href } : {}) }] }
}

export function completeCommand(raw, cwd = HOME) {
  const parsed = splitCommands(raw, true)
  if (parsed.error) return []
  if (parsed.completionStart) {
    const prefix = raw.slice(0, parsed.completionStart)
    const current = raw.slice(parsed.completionStart)
    const spacing = current.match(/^\s*/)[0]
    // The shell is a pure virtual model: previewing its cwd cannot open a
    // reader, switch views, or execute anything on the visitor's computer.
    const directory = executeCommand(prefix.replace(/(?:;|&&)\s*$/, ''), cwd).cwd
    return completeCommand(current.trimStart(), directory).map(match => `${prefix}${spacing}${match}`)
  }
  if (!/\s/.test(raw.trimStart())) {
    return [
      ...[...Object.keys(aliases), ...Object.keys(projectShortcuts)].filter(command => command.startsWith(raw.trim())),
      ...completeCommand(`cd ${raw.trim()}`, cwd).map(suggestion => suggestion.slice(3)),
    ]
  }
  const tokens = tokenize(raw.trimStart(), true)
  const [entered, ...rawArgs] = tokens
  const command = aliases[entered]
  const options = command === 'ls' ? rawArgs.filter(arg => /^-[la]+$/.test(arg)) : []
  const args = command === 'ls' ? rawArgs.filter(arg => !/^-[la]+$/.test(arg)) : rawArgs
  if (!['ls', 'cd', 'cat', 'open', 'view', 'tree', 'explorer'].includes(command) || args.length > 1) return []
  const partial = args[0] ?? ''
  const separator = partial.lastIndexOf('/')
  const prefix = partial.slice(0, separator + 1)
  const name = partial.slice(separator + 1)
  const directory = resolvePath(prefix || '.', cwd)
  if (!directory) return []
  const shortcuts = command === 'view' && !prefix ? Object.keys(projectShortcuts).filter(key => key.startsWith(name)).map(key => `view ${key}`) : []
  return [...shortcuts, ...listDirectory(directory)
    .filter(node => node.name.startsWith(name) && (!['cd', 'explorer'].includes(command) || node.type === 'folder'))
    .map(node => {
      const path = `${prefix}${node.name}${node.type === 'folder' ? '/' : ''}`
      return `${[entered, ...options].join(' ')} ${/\s/.test(path) ? `"${path}"` : path}`
    })]
}
