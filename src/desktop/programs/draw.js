// Text drawing helpers for the terminal demos. Everything is built from glyphs
// the bundled Ubuntu Mono actually has (full block, shades, box drawing) and
// from the terminal theme's sixteen colors, so the grid never drifts.
const ESCAPE = String.fromCharCode(27)
const SGR = new RegExp(`${ESCAPE}\\[[0-9;]*m`, 'g')
const SGR_HERE = new RegExp(`${ESCAPE}\\[[0-9;]*m`, 'y')

export const STYLE = {
  dim: '90', red: '31', green: '32', yellow: '33', blue: '34', cyan: '36', bold: '1',
  onBlue: '44', onGray: '100', onWhite: '30;47', onGreen: '30;42', onYellow: '30;43', onRed: '30;41',
}

export const paint = (text, style) => (style && text ? `\x1b[${style}m${text}\x1b[0m` : text)
export const visibleWidth = text => Array.from(text.replace(SGR, '')).length
export const count = value => Math.round(value).toLocaleString('en-US')
export const repeat = (char, times) => char.repeat(Math.max(0, Math.round(times)))

// Cut a styled line to the terminal width without splitting an escape code.
export function fit(text, columns) {
  if (visibleWidth(text) <= columns) return text
  let out = '', used = 0, index = 0, styled = false
  while (index < text.length && used < columns) {
    SGR_HERE.lastIndex = index
    const match = SGR_HERE.exec(text)
    if (match) {
      out += match[0]
      styled = match[0] !== '\x1b[0m'
      index += match[0].length
      continue
    }
    const char = String.fromCodePoint(text.codePointAt(index))
    out += char
    used++
    index += char.length
  }
  return styled ? `${out}\x1b[0m` : out
}

export const padEnd = (text, columns) => text + ' '.repeat(Math.max(0, columns - visibleWidth(text)))
export const padStart = (text, columns) => ' '.repeat(Math.max(0, columns - visibleWidth(text))) + text

// Left text with a right-aligned hint when there is room for both.
export function headline(left, right, columns) {
  const gap = columns - visibleWidth(left) - visibleWidth(right)
  return gap >= 2 ? `${left}${' '.repeat(gap)}${right}` : fit(left, columns)
}

// Greedy word wrap for plain captions.
export function wrap(text, columns) {
  const lines = []
  let line = ''
  for (const word of text.split(' ')) {
    if (line && line.length + word.length + 1 > columns) { lines.push(line); line = '' }
    line += `${line ? ' ' : ''}${word}`
  }
  return line ? [...lines, line] : lines
}

// A horizontal bar with whole-cell resolution; a nonzero value always shows.
export function bar(value, max, columns) {
  if (!(value > 0) || !(max > 0)) return ''
  return repeat('█', Math.max(1, Math.round((value / max) * columns)))
}

export const STOP_HINT = paint('q stops', STYLE.dim)
