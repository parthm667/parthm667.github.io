import { safeTerminalText } from './terminalFormat.js'

export class LineEditor {
  constructor() {
    this.history = []
    this.reset()
  }

  get value() { return this.characters.join('') }

  reset() {
    this.characters = []
    this.cursor = 0
    this.historyIndex = -1
    this.draft = ''
    this.completion = null
  }

  set(value) {
    this.characters = Array.from(value)
    this.cursor = this.characters.length
  }

  insert(value) {
    const characters = Array.from(safeTerminalText(value.replace(/\r\n?|\n|\t/g, ' ')))
    this.characters.splice(this.cursor, 0, ...characters)
    this.cursor += characters.length
    this.completion = null
    this.historyIndex = -1
  }

  move(direction) {
    if (direction === 'home') this.cursor = 0
    if (direction === 'end') this.cursor = this.characters.length
    if (direction === 'left') this.cursor = Math.max(0, this.cursor - 1)
    if (direction === 'right') this.cursor = Math.min(this.characters.length, this.cursor + 1)
  }

  backspace() {
    if (this.cursor > 0) this.characters.splice(--this.cursor, 1)
    this.completion = null
  }

  delete() {
    this.characters.splice(this.cursor, 1)
    this.completion = null
  }

  clearBefore() {
    this.characters.splice(0, this.cursor)
    this.cursor = 0
    this.completion = null
  }

  recall(direction) {
    if (!this.history.length) return
    if (this.historyIndex === -1) this.draft = this.value
    if (direction < 0) this.historyIndex = this.historyIndex === -1 ? this.history.length - 1 : Math.max(0, this.historyIndex - 1)
    else this.historyIndex = this.historyIndex === -1 || this.historyIndex === this.history.length - 1 ? -1 : this.historyIndex + 1
    this.set(this.historyIndex === -1 ? this.draft : this.history[this.historyIndex])
    this.completion = null
  }

  complete(matches) {
    if (!this.completion && !matches.length) return
    this.completion = this.completion ? { ...this.completion, index: (this.completion.index + 1) % this.completion.matches.length } : { matches, index: 0 }
    this.set(this.completion.matches[this.completion.index])
  }

  submit() {
    const value = this.value
    if (value.trim() && this.history.at(-1) !== value) this.history = [...this.history, value].slice(-100)
    this.reset()
    return value
  }
}
