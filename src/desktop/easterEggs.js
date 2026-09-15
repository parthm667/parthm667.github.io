export const EASTER_EGG_COMMANDS = ['sudo', 'cowsay', 'fortune', 'sl', 'exit', 'logout', 'vim', 'nano', ':q', 'neofetch']

const fortunes = [
  'the bug is in the line you skipped.',
  'my code has no bugs. only undocumented wildlife.',
  'the shortest path is whichever one has a bike lane.',
  'went looking for a memory leak. found three more tabs.',
  'birdwatching is debugging with better scenery.',
]

function characterWidth(char) {
  if (/\p{Mark}/u.test(char) || char === '\u200d') return 0
  const code = char.codePointAt(0)
  if (/\p{Extended_Pictographic}/u.test(char) || /[\u1100-\u115f\u2329\u232a\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe10-\ufe19\ufe30-\ufe6f\uff00-\uff60\uffe0-\uffe6]/u.test(char) || code >= 0x20000) return 2
  return 1
}

const width = text => Array.from(text).reduce((total, char) => total + characterWidth(char), 0)

function cowsay(args) {
  const message = Array.from(args.join(' ')).map(char => {
    const code = char.codePointAt(0)
    return code < 32 || (code >= 127 && code < 160) ? ' ' : char
  }).join('').replace(/\s+/gu, ' ').trim()
  const characters = Array.from(message || 'moo. nice terminal.').slice(0, 200)
  const lines = []
  let line = ''
  for (const char of characters) {
    if (width(line) + characterWidth(char) > 32) {
      const space = line.lastIndexOf(' ')
      lines.push(space > 0 ? line.slice(0, space) : line)
      line = space > 0 ? line.slice(space + 1) : ''
    }
    line += char
  }
  if (line) lines.push(line.trimEnd())
  const size = Math.max(...lines.map(width))
  const bubble = lines.map((text, index) => {
    const left = lines.length === 1 ? '<' : index === 0 ? '/' : index === lines.length - 1 ? '\\' : '|'
    const right = lines.length === 1 ? '>' : index === 0 ? '\\' : index === lines.length - 1 ? '/' : '|'
    return `${left} ${text}${' '.repeat(size - width(text))} ${right}`
  })
  return [
    ` ${'_'.repeat(size + 2)}`,
    ...bubble,
    ` ${'-'.repeat(size + 2)}`,
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||',
  ].join('\n')
}

export function easterEgg(command, args) {
  switch (command) {
    case 'sudo': return args.join(' ') === 'make me a sandwich' ? 'okay. 🥪' : 'you don’t have that kind of relationship with this website.'
    case 'cowsay': return cowsay(args)
    case 'fortune': return fortunes[Math.floor(Math.random() * fortunes.length)]
    case 'sl': return '      (  )\n       )(\n   ____||_  ____\n  | []   | | [] |\n =|______|=|____|=\n    o  o     o o\n\nyou missed your stop. try ls.'
    case 'exit': case 'logout': return 'you live here now.'
    case 'vim': case 'nano': return 'bold choice. :q gets you out of this one.'
    case ':q': return 'you escaped. the files were never in danger.'
    case 'neofetch': return '   .----.  parth@portfolio\n   | >_ |  os: a website\n   \'----\'  shell: pretend bash\n  /______\\ home: /home/parth'
    default: return null
  }
}
