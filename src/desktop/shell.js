import { HOME, resolvePath, getNode, listDirectory, parentPath } from './filesystem.js'
import { EASTER_EGG_COMMANDS, easterEgg } from './easterEggs.js'

const aliases = {
  help: 'help', ls: 'ls', cd: 'cd', pwd: 'pwd', cat: 'cat',
  open: 'open', 'xdg-open': 'open', clear: 'clear', whoami: 'whoami',
  tree: 'tree', explorer: 'explorer', rm: 'rm',
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
use quotes around paths with spaces.
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

export function executeCommand(raw, cwd = HOME) {
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
    return error(`command not found: ${entered}. type help to see what works here.`)
  }
  if (command === 'rm') return text('nice try. i still need those files. nothing was deleted.')
  if (EASTER_EGG_COMMANDS.includes(command)) return text(easterEgg(command, rawArgs))
  if (command === 'ls' && rawArgs.some(arg => arg.startsWith('-') && !/^-[la]+$/.test(arg))) return error('unknown ls option. try ls, ls -l, ls -a, or ls -la.')
  const args = command === 'ls' ? rawArgs.filter(arg => !/^-[la]+$/.test(arg)) : rawArgs
  const takesPath = ['ls', 'cd', 'cat', 'open', 'tree', 'explorer'].includes(command)
  if (args.length > (takesPath ? 1 : 0)) return error('that is too many arguments. use quotes around paths with spaces, or type help.')
  if (command === 'help') return text(help)
  if (command === 'clear') return { ...result, clear: true }
  if (command === 'pwd') return text(cwd)
  if (command === 'whoami') return text('parth mhaske\ncs + applied math at umd, class of 2028.\nread about.txt for a little more.')
  if ((command === 'cat' || command === 'open') && !args[0]) return error(`usage: ${command} <file or path>. try ${command} about.txt.`)
  const path = resolvePath(args[0] ?? (command === 'cd' ? '~' : '.'), cwd)
  if (!path) return error('that path is outside this home directory or contains invalid characters. try cd ~.')
  const node = getNode(path)
  if (!node) return error(`cannot find: ${args[0]}. ${missingPathHint(entered, command, args[0], cwd)}`)
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
  if (!/\s/.test(raw.trimStart())) {
    return [
      ...Object.keys(aliases).filter(command => command.startsWith(raw.trim())),
      ...completeCommand(`cd ${raw.trim()}`, cwd).map(suggestion => suggestion.slice(3)),
    ]
  }
  const tokens = tokenize(raw.trimStart(), true)
  const [entered, ...rawArgs] = tokens
  const command = aliases[entered]
  const options = command === 'ls' ? rawArgs.filter(arg => /^-[la]+$/.test(arg)) : []
  const args = command === 'ls' ? rawArgs.filter(arg => !/^-[la]+$/.test(arg)) : rawArgs
  if (!['ls', 'cd', 'cat', 'open', 'tree', 'explorer'].includes(command) || args.length > 1) return []
  const partial = args[0] ?? ''
  const separator = partial.lastIndexOf('/')
  const prefix = partial.slice(0, separator + 1)
  const name = partial.slice(separator + 1)
  const directory = resolvePath(prefix || '.', cwd)
  if (!directory) return []
  return listDirectory(directory)
    .filter(node => node.name.startsWith(name) && (!['cd', 'explorer'].includes(command) || node.type === 'folder'))
    .map(node => {
      const path = `${prefix}${node.name}${node.type === 'folder' ? '/' : ''}`
      return `${[entered, ...options].join(' ')} ${/\s/.test(path) ? `"${path}"` : path}`
    })
}
