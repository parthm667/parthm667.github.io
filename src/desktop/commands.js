import { HOME, getNode, listDirectory, resolvePath } from './filesystem.js'

// Everyday Linux commands, answered against the virtual home directory. Text
// filters read a file argument or the output piped into them. Nothing here
// touches the visitor's machine, the network, or a real shell.
const LOADED_AT = Date.now()
const READ_ONLY = ['touch', 'mkdir', 'rmdir', 'mv', 'cp', 'chmod', 'chown', 'ln', 'dd', 'tee', 'truncate', 'shred']
const NOT_INSTALLED = ['python', 'python3', 'pip', 'node', 'npm', 'gcc', 'g++', 'make', 'cmake', 'cargo', 'go', 'java', 'docker', 'kubectl', 'apt', 'apt-get', 'brew', 'pacman', 'dnf', 'emacs', 'code']
const POWER = ['reboot', 'shutdown', 'poweroff', 'halt']

// One line each, shown by man, whatis, and help.
export const MANUAL = {
  help: 'list the commands that are useful here',
  overview: 'selected work, with links',
  view: 'open a project writeup in the reader',
  run: 'start a live demo: uav, orderbook, or maze',
  ls: 'list files and folders',
  cd: 'change folder',
  pwd: 'print the current folder',
  cat: 'print a file',
  less: 'print a file',
  more: 'print a file',
  open: 'show a link, or go into a folder',
  tree: 'show the folder tree',
  explorer: 'switch to the file explorer',
  clear: 'clear the terminal',
  whoami: 'a short introduction',
  echo: 'print its arguments',
  head: 'print the first lines of a file or of piped text',
  tail: 'print the last lines of a file or of piped text',
  wc: 'count lines, words, and bytes',
  grep: 'find lines that match a pattern, in a file, a folder, or piped text',
  sort: 'sort lines',
  uniq: 'drop repeated neighboring lines',
  rev: 'reverse each line',
  tac: 'print lines in reverse order',
  nl: 'number lines',
  find: 'list files under a folder, optionally by -name or -type',
  file: 'say what kind of file something is',
  stat: 'show details about a file or folder',
  du: 'show how much text a folder holds',
  df: 'show the size of this filesystem',
  which: 'say where a command lives',
  type: 'say what a command is',
  man: 'describe a command',
  whatis: 'describe a command in one line',
  history: 'list the commands typed in this session',
  date: 'print the date and time',
  cal: 'print a calendar for this month',
  uptime: 'how long this page has been open',
  uname: 'print system information',
  hostname: 'print the host name',
  id: 'print user and group ids',
  groups: 'print group membership',
  env: 'print environment variables',
  printenv: 'print environment variables',
  ps: 'list running processes',
  top: 'show what is taking attention right now',
  htop: 'show what is taking attention right now',
  free: 'show memory use',
  who: 'show who is logged in',
  w: 'show who is logged in',
  tty: 'print the terminal name',
  alias: 'list command aliases',
  git: 'git log prints the timeline; git status reports on this filesystem',
  ping: 'this terminal sends no packets',
  curl: 'this terminal fetches nothing',
  wget: 'this terminal fetches nothing',
  ssh: 'you are already logged in',
  ifconfig: 'show network interfaces',
  ip: 'show network interfaces',
  kill: 'nothing here can be killed',
  sleep: 'wait, in theory',
  true: 'succeed',
  false: 'fail quietly',
  yes: 'agree, briefly',
  seq: 'print a run of numbers',
  export: 'set a variable, in theory',
  su: 'switch user',
  passwd: 'change a password',
  rm: 'remove files; not here',
  sudo: 'ask nicely',
  cowsay: 'a cow says it',
  fortune: 'a short fortune',
  neofetch: 'system summary',
}

const TIMELINE = [
  ['may–aug 2026', 'corsha: software engineering intern. go services, disk-backed log ingestion, helm.'],
  ['2026', 'first-author paper at aiaa aviation: uav suspension optimization with monte carlo.'],
  ['nov 2025–may 2026', 'nuntius (yc s25): agent environments and tool-call evaluation.'],
  ['sep 2025', 'polymarket: analysis of 604,578 trader records.'],
  ['2023–2024', 'maze robot: third at the 2024 science olympiad national tournament.'],
]

const text = value => ({ text: value })
const fail = value => ({ error: value })
const lines = value => (value === '' ? [] : value.replace(/\n$/, '').split('\n'))
const bytes = value => new TextEncoder().encode(value).length
const contentOf = node => node.content ?? node.href ?? ''

function walk(path, visit) {
  const node = getNode(path)
  if (!node) return
  visit(node, path)
  if (node.type === 'folder') for (const child of listDirectory(path)) walk(`${path}/${child.name}`, visit)
}

const display = (path, cwd) => (path === cwd ? '.' : path.startsWith(`${cwd}/`) ? path.slice(cwd.length + 1) : `~${path.slice(HOME.length)}`)

// Separate -x style flags from operands. Flags that take a value are listed in takesValue.
function parse(args, takesValue = []) {
  const flags = {}, operands = []
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (/^-\d+$/.test(arg)) flags.n = arg.slice(1)
    else if (arg.length > 1 && arg.startsWith('-') && !/^-?\d/.test(arg.slice(1))) {
      const name = arg.replace(/^-+/, '')
      if (takesValue.includes(name)) flags[name] = args[++index]
      else for (const letter of arg.startsWith('--') ? [name] : name) flags[letter] = true
    } else operands.push(arg)
  }
  return { flags, operands }
}

// The text a filter works on: a named file, or whatever was piped in.
function source(command, operand, { cwd, stdin }) {
  if (operand === undefined) {
    if (stdin !== null && stdin !== undefined) return { content: stdin }
    return { error: `usage: ${command} <file>, or pipe text into it. try cat about.txt | ${command}.` }
  }
  const path = resolvePath(operand, cwd)
  const node = path && getNode(path)
  if (!node) return { error: `${command}: cannot find ${operand}. use ls to see what is here.` }
  if (node.type === 'folder') return { error: `${command}: ${operand} is a folder.` }
  return { content: contentOf(node) }
}

function grep(args, context) {
  const { flags, operands } = parse(args)
  const [pattern, target] = operands
  if (!pattern) return fail('usage: grep [-i] [-n] [-r] <text> [file or folder]. try grep -ri monte.')
  const needle = flags.i ? pattern.toLowerCase() : pattern
  const matches = line => (flags.i ? line.toLowerCase() : line).includes(needle) !== Boolean(flags.v)
  const found = []
  const scan = (content, label) => lines(content).forEach((line, index) => {
    if (matches(line)) found.push(`${label ? `${label}:` : ''}${flags.n ? `${index + 1}:` : ''}${line}`)
  })
  if (target === undefined && context.stdin !== null && context.stdin !== undefined && !flags.r) scan(context.stdin, '')
  else {
    const path = resolvePath(target ?? '.', context.cwd)
    const node = path && getNode(path)
    if (!node) return fail(`grep: cannot find ${target}. use ls to see what is here.`)
    if (node.type === 'folder') walk(path, (child, childPath) => { if (child.type !== 'folder') scan(contentOf(child), display(childPath, context.cwd)) })
    else scan(contentOf(node), '')
  }
  if (!found.length) return fail(`no lines match ${pattern}.`)
  return text(found.length > 60 ? [...found.slice(0, 60), `... ${found.length - 60} more lines`].join('\n') : found.join('\n'))
}

function find(args, { cwd }) {
  const { flags, operands } = parse(args, ['name', 'iname', 'type', 'maxdepth'])
  const start = resolvePath(operands[0] ?? '.', cwd)
  if (!start || !getNode(start)) return fail(`find: cannot find ${operands[0]}. use ls to see what is here.`)
  const glob = flags.name ?? flags.iname
  const pattern = glob === undefined ? null : new RegExp(`^${glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`, flags.iname === undefined ? '' : 'i')
  const found = []
  walk(start, (node, path) => {
    if (flags.type === 'f' && node.type === 'folder') return
    if (flags.type === 'd' && node.type !== 'folder') return
    if (pattern && !pattern.test(node.name)) return
    found.push(display(path, cwd))
  })
  return found.length ? text(found.join('\n')) : fail('find: nothing matched.')
}

function describe(node) {
  if (node.type === 'folder') return 'directory'
  if (node.type === 'link') return `link to ${node.href}`
  return node.name.endsWith('.md') ? 'markdown text' : 'utf-8 text'
}

function calendar(now) {
  const year = now.getFullYear(), month = now.getMonth()
  const title = now.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toLowerCase()
  const first = new Date(year, month, 1).getDay(), days = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(first).fill('  '), ...Array.from({ length: days }, (_, day) => String(day + 1).padStart(2))]
  const rows = []
  for (let index = 0; index < cells.length; index += 7) rows.push(cells.slice(index, index + 7).join(' '))
  return [title.padStart(Math.floor((20 + title.length) / 2)), 'su mo tu we th fr sa', ...rows].join('\n')
}

function duration(ms) {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

const environment = cwd => ({ USER: 'parth', HOME, PWD: cwd, SHELL: '/bin/pretend-bash', TERM: 'xterm-256color', LANG: 'en_US.UTF-8', EDITOR: 'vim', HOSTNAME: 'portfolio' })

function manual(name, known) {
  if (!name) return fail('usage: man <command>. try man grep, or help for the short list.')
  if (name === 'parth') return text('PARTH(1)\n\nname\n  parth mhaske: cs + applied math at umd, class of 2028.\n\nsynopsis\n  overview | view <project> | run <demo>\n\ndescription\n  works on trading systems, simulations, and agent evaluation.\n  looking for summer 2027 internships.\n\nsee also\n  cat about.txt, cat contact.txt')
  if (!known(name)) return fail(`no manual entry for ${name}. type help to see what works here.`)
  return text(`${name.toUpperCase()}(1)\n\n  ${name}: ${MANUAL[name] ?? 'answers, but keeps its secrets.'}`)
}

function git(args) {
  const [sub] = args
  if (sub === 'log') return text(TIMELINE.map(([when, what], index) => `commit ${String(TIMELINE.length - index).padStart(2, '0')}  ${when}\n    ${what}`).join('\n\n'))
  if (sub === 'status') return text('on branch main\nnothing to commit. this filesystem is read-only.')
  if (sub === 'branch') return text('* main')
  if (sub === 'blame') return text('parth wrote all of it.')
  if (['push', 'commit', 'add', 'merge', 'rebase', 'reset', 'pull', 'clone', 'checkout', 'stash'].includes(sub)) return text(`git ${sub}: this filesystem is read-only. git log still works.`)
  return text('usage: git log | status | branch | blame. git log prints the timeline.')
}

// Returns { text } or { error } for a known command, or null if it is not one of these.
export function runExtra(command, args, context) {
  const { cwd } = context
  const now = context.now?.() ?? new Date()
  if (READ_ONLY.includes(command)) return text(`${command}: this filesystem is read-only. nothing was changed.`)
  if (NOT_INSTALLED.includes(command)) return text(`${command} is not installed on a website. the real code is linked from each project: ls ~/projects.`)
  if (POWER.includes(command)) return text('the server would rather stay up. try clear.')
  switch (command) {
    case 'echo': {
      const variables = environment(cwd)
      return text(args.join(' ').replace(/\$(\w+)/g, (match, name) => variables[name] ?? ''))
    }
    case 'head': case 'tail': {
      const { flags, operands } = parse(args, ['n'])
      const total = flags.n === undefined ? 10 : Number(flags.n)
      if (!Number.isInteger(total) || total < 0) return fail(`usage: ${command} [-n lines] <file>.`)
      const input = source(command, operands[0], context)
      if (input.error) return fail(input.error)
      const all = lines(input.content)
      return text((command === 'head' ? all.slice(0, total) : total ? all.slice(-total) : []).join('\n'))
    }
    case 'wc': {
      const { flags, operands } = parse(args)
      const input = source('wc', operands[0], context)
      if (input.error) return fail(input.error)
      const counts = { l: lines(input.content).length, w: input.content.split(/\s+/).filter(Boolean).length, c: bytes(input.content) }
      const chosen = ['l', 'w', 'c'].filter(flag => flags[flag])
      return text(`${(chosen.length ? chosen : ['l', 'w', 'c']).map(flag => counts[flag]).join(' ')}${operands[0] ? ` ${operands[0]}` : ''}`)
    }
    case 'sort': case 'uniq': case 'rev': case 'tac': case 'nl': {
      const { flags, operands } = parse(args)
      const input = source(command, operands[0], context)
      if (input.error) return fail(input.error)
      let all = lines(input.content)
      if (command === 'sort') { all = [...all].sort((a, b) => a.localeCompare(b)); if (flags.r) all.reverse() }
      if (command === 'uniq') all = all.filter((line, index) => index === 0 || line !== all[index - 1])
      if (command === 'rev') all = all.map(line => Array.from(line).reverse().join(''))
      if (command === 'tac') all = [...all].reverse()
      if (command === 'nl') all = all.map((line, index) => `${String(index + 1).padStart(4)}  ${line}`)
      return text(all.join('\n'))
    }
    case 'grep': return grep(args, context)
    case 'find': return find(args, context)
    case 'file': case 'stat': {
      if (!args[0]) return fail(`usage: ${command} <file or folder>.`)
      const path = resolvePath(args[0], cwd)
      const node = path && getNode(path)
      if (!node) return fail(`${command}: cannot find ${args[0]}. use ls to see what is here.`)
      if (command === 'file') return text(`${args[0]}: ${describe(node)}`)
      const size = node.type === 'folder' ? `${node.children.length} items` : `${bytes(contentOf(node))} bytes`
      return text(`  file: ${path}\n  type: ${describe(node)}\n  size: ${size}\naccess: ${node.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--'}  parth parth\n  note: ${node.description}`)
    }
    case 'du': {
      const start = resolvePath(parse(args).operands[0] ?? '.', cwd)
      if (!start || !getNode(start)) return fail('du: cannot find that path. use ls to see what is here.')
      const rows = []
      const measure = path => {
        const node = getNode(path)
        if (node.type !== 'folder') return bytes(contentOf(node))
        const total = listDirectory(path).reduce((sum, child) => sum + measure(`${path}/${child.name}`), 0)
        rows.push(`${String(total).padStart(7)}  ${display(path, cwd)}`)
        return total
      }
      const total = measure(start)
      return text(rows.length ? rows.join('\n') : `${String(total).padStart(7)}  ${display(start, cwd)}`)
    }
    case 'df': {
      let used = 0
      walk(HOME, node => { if (node.type !== 'folder') used += bytes(contentOf(node)) })
      return text(`filesystem   used (bytes)  mounted on\nportfolio    ${String(used).padEnd(12)}  ${HOME} (read-only)`)
    }
    case 'which': case 'type': case 'whatis': {
      if (!args[0]) return fail(`usage: ${command} <command>.`)
      if (!context.known(args[0])) return fail(`${args[0]}: not found. type help to see what works here.`)
      if (command === 'whatis') return text(`${args[0]} (1) - ${MANUAL[args[0]] ?? 'answers, but keeps its secrets.'}`)
      return text(command === 'which' ? `/usr/bin/${args[0]}` : `${args[0]} is /usr/bin/${args[0]}`)
    }
    case 'man': return manual(args[0], context.known)
    case 'history': {
      const past = context.history ?? []
      return text(past.length ? past.map((entry, index) => `${String(index + 1).padStart(4)}  ${entry}`).join('\n') : 'no commands yet.')
    }
    case 'date': return text(now.toString().toLowerCase())
    case 'cal': return text(calendar(now))
    case 'uptime': return text(`up ${duration(now.getTime() - (context.startedAt ?? LOADED_AT))}, 1 user, load average: light`)
    case 'uname': return text(args.some(arg => /^-.*a/.test(arg)) ? 'portfolio 1.0 parth-website react + xterm.js, in your browser' : 'portfolio')
    case 'hostname': return text('portfolio')
    case 'id': return text('uid=1000(parth) gid=1000(parth) groups=1000(parth)')
    case 'groups': return text('parth')
    case 'tty': return text('/dev/pts/0')
    case 'who': case 'w': return text('parth    pts/0    you are reading this session')
    case 'env': case 'printenv': {
      const variables = environment(cwd)
      if (args[0]) return Object.hasOwn(variables, args[0]) ? text(variables[args[0]]) : fail(`${args[0]} is not set.`)
      return text(Object.entries(variables).map(([name, value]) => `${name}=${value}`).join('\n'))
    }
    case 'export': case 'alias': return text(command === 'alias' ? "alias work='overview'\nalias less='cat'\nalias more='cat'\nalias demo='run'" : 'noted, but variables do not persist here.')
    case 'ps': return text('  PID TTY      CMD\n    1 pts/0    pretend-bash\n   27 pts/0    internship-search --summer 2027\n   28 pts/0    ps')
    case 'top': case 'htop': return text('  PID  %CPU  COMMAND\n   27  61.0  internship-search --summer 2027\n   31  22.0  classes --umd\n   35  12.0  bike\n   36   5.0  birds\n\nrun uav, run orderbook, or run maze for something that actually computes.')
    case 'free': return text('memory is your browser\'s problem. this page keeps a few kilobytes of text.')
    case 'git': return git(args)
    case 'ping': return text('no packets leave this page. email answers more reliably: mailto:pmhaske@umd.edu')
    case 'curl': case 'wget': return text('nothing is fetched from this terminal. cat contact.txt has real links.')
    case 'ssh': return text('you are already in.')
    case 'ifconfig': case 'ip': return text('lo: 127.0.0.1\nno other interfaces. this terminal never touches the network.')
    case 'kill': return text('nothing here can be killed. q stops a running demo.')
    case 'sleep': return text('no need to wait.')
    case 'true': return text('')
    case 'false': return fail('false.')
    case 'yes': return text(Array(5).fill(args.join(' ') || 'y').join('\n') + '\n... and so on.')
    case 'seq': {
      const numbers = args.map(Number)
      if (!numbers.length || numbers.length > 2 || numbers.some(number => !Number.isInteger(number))) return fail('usage: seq <last> or seq <first> <last>.')
      const [first, last] = numbers.length === 1 ? [1, numbers[0]] : numbers
      if (last - first > 200) return fail('seq: that is a lot of numbers. keep it under 200.')
      return text(Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index).join('\n'))
    }
    case 'su': return text('there is only one user here.')
    case 'passwd': return text('there are no passwords in this home directory.')
    default: return null
  }
}

export const EXTRA_COMMANDS = [
  ...READ_ONLY, ...NOT_INSTALLED, ...POWER,
  'echo', 'head', 'tail', 'wc', 'sort', 'uniq', 'rev', 'tac', 'nl', 'grep', 'find', 'file', 'stat', 'du', 'df', 'which', 'type', 'whatis', 'man',
  'history', 'date', 'cal', 'uptime', 'uname', 'hostname', 'id', 'groups', 'tty', 'who', 'w', 'env', 'printenv', 'export', 'alias', 'ps', 'top', 'htop',
  'free', 'git', 'ping', 'curl', 'wget', 'ssh', 'ifconfig', 'ip', 'kill', 'sleep', 'true', 'false', 'yes', 'seq', 'su', 'passwd',
]
