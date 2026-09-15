import { HOME } from './filesystem.js'

export const ANSI = { reset: '\x1b[0m', blue: '\x1b[1;34m', red: '\x1b[31m' }

export function safeTerminalText(value = '') {
  return Array.from(String(value)).filter(char => char === '\n' || char === '\t' || (char.codePointAt(0) >= 32 && char.codePointAt(0) !== 127 && !(char.codePointAt(0) >= 128 && char.codePointAt(0) < 160))).join('')
}

export function plainPrompt(cwd) {
  return `parth@portfolio:${cwd === HOME ? '~' : `~${cwd.slice(HOME.length)}`}$ `
}

export function formatPrompt(cwd) {
  return plainPrompt(cwd)
}

function hyperlink(label, target) {
  return `\x1b]8;;${target}\x07${label}\x1b]8;;\x07`
}

function entryName(entry, path) {
  const name = safeTerminalText(entry.name)
  const colored = entry.type === 'folder' ? `${ANSI.blue}${name}${ANSI.reset}` : name
  return hyperlink(colored, `portfolio:${encodeURIComponent(`${path}/${entry.name}`)}`)
}

export function formatListing({ entries = [], path = HOME, longFormat = false }, columns = 80) {
  if (!entries.length) return ''
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name))
  if (longFormat) {
    const sizes = sorted.map(node => node.type === 'folder' ? 4096 : new TextEncoder().encode(node.content ?? node.href ?? '').length)
    const sizeWidth = Math.max(...sizes.map(size => String(size).length))
    return sorted.map((node, index) => {
      const directory = node.type === 'folder'
      // Virtual file metadata uses the repository revision date, not work dates.
      return `${directory ? 'drwxr-xr-x' : '-rw-r--r--'} ${directory ? 2 : 1} parth parth ${String(sizes[index]).padStart(sizeWidth)} jul 29 2026 ${entryName(node, path)}`
    }).join('\r\n')
  }
  const width = Math.max(...sorted.map(node => node.name.length)) + 2
  const count = Math.max(1, Math.min(sorted.length, Math.floor((columns + 2) / width)))
  const rows = Math.ceil(sorted.length / count)
  return Array.from({ length: rows }, (_, row) => {
    const cells = []
    for (let column = 0; column < count; column++) {
      const node = sorted[row + column * rows]
      if (!node) continue
      const hasNext = row + (column + 1) * rows < sorted.length
      cells.push(entryName(node, path) + (hasNext ? ' '.repeat(width - node.name.length) : ''))
    }
    return cells.join('')
  }).join('\r\n')
}

export function formatOutput(line, columns) {
  if (line.type === 'listing') return formatListing(line, columns)
  if (line.type === 'link') {
    const href = line.href ?? line.node?.href ?? ''
    return hyperlink(safeTerminalText(href).toLowerCase(), href)
  }
  const text = safeTerminalText(line.node?.content ?? line.text ?? '').replaceAll('\n', '\r\n')
    .replace(/(?:https?:\/\/|mailto:)[^\s<>]+/g, target => hyperlink(target.toLowerCase(), target))
  return line.type === 'error' ? `${ANSI.red}${text}${ANSI.reset}` : text
}
