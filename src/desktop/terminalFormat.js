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

function wrapWords(text, columns, indent = '') {
  const lines = []
  let line = indent
  for (const word of text.split(' ')) {
    if (line.length > indent.length && line.length + word.length + 1 > columns) {
      lines.push(line)
      line = indent
    }
    line += `${line.length > indent.length ? ' ' : ''}${word}`
  }
  return [...lines, line].join('\r\n')
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
    const sizes = sorted.map(node => node.type === 'folder' ? `${node.children.length} items` : `${new TextEncoder().encode(node.content ?? node.href ?? '').length} b`)
    const sizeWidth = Math.max(...sizes.map(size => String(size).length))
    return sorted.map((node, index) => {
      const directory = node.type === 'folder'
      return `${directory ? 'drwxr-xr-x' : '-rw-r--r--'} ${String(sizes[index]).padStart(sizeWidth)} ${entryName(node, path)}`
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
  if (line.type === 'overview') {
    const work = line.entries.map(entry => [
      hyperlink(`${ANSI.blue}${safeTerminalText(entry.title)}${ANSI.reset}`, `portfolio-view:${encodeURIComponent(entry.path)}`),
      wrapWords(entry.evidence, columns, '  '),
      wrapWords(entry.detail, columns, '  '),
    ].join('\r\n')).join('\r\n\r\n')
    const more = (line.more ?? []).map(entry => `${hyperlink(`${ANSI.blue}${safeTerminalText(entry.title)}${ANSI.reset}`, `portfolio-view:${encodeURIComponent(entry.path)}`)}\r\n${wrapWords(entry.detail, columns, '  ')}`).join('\r\n')
    return `parth mhaske\r\ncs + applied math, umd '28.\r\n\r\n${work}\r\n\r\n${more}\r\n\r\n${wrapWords('click a title to read. or type view uav / polymarket / order-book.', columns)}\r\n${wrapWords('ls explores everything. help shows commands. cat contact.txt to get in touch.', columns)}`
  }
  if (line.type === 'listing') return formatListing(line, columns)
  if (line.type === 'link') {
    const href = line.href ?? line.node?.href ?? ''
    return hyperlink(safeTerminalText(href).toLowerCase(), href)
  }
  const content = [line.node?.content ?? line.text ?? '', ...(line.node?.links ?? []).map(link => `${link.label}: ${link.href}`)].join('\n')
  const text = safeTerminalText(content).replaceAll('\n', '\r\n')
    .replace(/(?:https?:\/\/|mailto:)[^\s<>]+/g, target => hyperlink(target.toLowerCase(), target))
  return line.type === 'error' ? `${ANSI.red}${text}${ANSI.reset}` : text
}
