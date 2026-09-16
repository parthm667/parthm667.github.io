import { HOME, getNode, resolvePath } from './filesystem.js'
import { completeCommand, executeCommand } from './shell.js'
import { formatOutput, formatPrompt } from './terminalFormat.js'
import { LineEditor, MAX_INPUT_LENGTH } from './terminalInput.js'

const ESCAPE_KEYS = ['\x1b[3~', '\x1b[1~', '\x1b[4~', '\x1b[H', '\x1bOH', '\x1b[F', '\x1bOF', '\x1b[D', '\x1bOD', '\x1b[C', '\x1bOC', '\x1b[A', '\x1bOA', '\x1b[B', '\x1bOB']
const PASTE_START = '\x1b[200~'
const PASTE_END = '\x1b[201~'

export class TerminalSession {
  constructor(terminal, { cwd = HOME, onNavigate, onMode, onPreview, onBootComplete }) {
    this.terminal = terminal
    this.cwd = cwd
    this.onNavigate = onNavigate
    this.onMode = onMode
    this.onPreview = onPreview
    this.onBootComplete = onBootComplete
    this.editor = new LineEditor()
    this.active = true
    this.booting = true
    this.disposed = false
    this.marker = null
    this.records = []
    this.dirty = false
    this.rendering = false
    this.frame = null
    this.useFrames = typeof requestAnimationFrame === 'function'
    this.writeWaiters = new Set()
    this.idleWaiters = new Set()
    this.pasting = false
    this.pasteText = ''
    this.skipRequested = false
    this.clearPending = false
    this.requestedDirectory = null
  }

  write(text) {
    if (this.disposed) return Promise.resolve()
    return new Promise(resolve => {
      const finish = () => { this.writeWaiters.delete(finish); resolve() }
      this.writeWaiters.add(finish)
      this.terminal.write(text, finish)
    })
  }

  whenIdle() {
    if (this.disposed || (!this.booting && !this.dirty && !this.rendering && this.frame === null)) return Promise.resolve()
    return new Promise(resolve => this.idleWaiters.add(resolve))
  }

  settleIdle() {
    for (const resolve of this.idleWaiters) resolve()
    this.idleWaiters.clear()
  }

  redraw() {
    if (this.disposed) return
    this.dirty = true
    if (this.booting || this.rendering || this.frame !== null) return
    const render = () => { this.frame = null; void this.flush() }
    this.frame = this.useFrames ? requestAnimationFrame(render) : setTimeout(render, 0)
  }

  // One render is in flight at a time. Input never waits for xterm's parser.
  async flush() {
    if (this.disposed || this.booting) return
    this.rendering = true
    this.dirty = false
    const terminal = this.terminal
    const records = this.records.splice(0)
    const clear = this.clearPending
    this.clearPending = false
    const cwd = this.cwd
    const before = this.editor.characters.slice(0, this.editor.cursor).join('')
    const after = this.editor.characters.slice(this.editor.cursor).join('')
    try {
      terminal.scrollToBottom()
      const row = this.marker ? Math.max(0, this.marker.line - terminal.buffer.active.baseY) : terminal.buffer.active.cursorY
      let output = clear ? '\x1b[2J\x1b[H\x1b[3J' : `\x1b[${row + 1};1H\x1b[J`
      for (const record of records) {
        if (record.raw !== null) output += `${formatPrompt(record.cwd)}${record.raw}${record.interrupted ? '^C' : ''}\r\n`
        for (const line of record.result?.lines ?? []) {
          const text = formatOutput(line, terminal.cols)
          if (text) output += `${text}\r\n`
        }
      }
      this.marker?.dispose()
      this.marker = null
      await this.write(output)
      if (this.disposed) return
      this.marker = terminal.registerMarker(0)
      // xterm owns wide characters and wrapping: save the real cursor at the
      // edit point, write the suffix, then restore rather than estimating cells.
      await this.write(`${formatPrompt(cwd)}${before} \b\x1b7${after} \b\x1b8`)
      if (this.disposed) return
      for (const { result } of records) {
        if (result?.previewPath) this.onPreview?.(result.previewPath)
        if (result?.mode) this.onMode?.(result.mode)
      }
    } finally {
      this.rendering = false
      if (!this.disposed && this.dirty) this.redraw()
      else this.settleIdle()
    }
  }

  draw() { this.redraw(); return this.whenIdle() }

  setDirectory(cwd) {
    if (this.requestedDirectory && this.active && cwd !== this.requestedDirectory) return
    this.requestedDirectory = null
    if (cwd === this.cwd) return
    this.cwd = cwd
    this.redraw()
  }

  async startIntro(reducedMotion = false) {
    this.skipRequested ||= reducedMotion
    const pause = milliseconds => new Promise(resolve => {
      this.wakeIntro = resolve
      this.introTimer = setTimeout(resolve, milliseconds)
    })
    const type = async (text, delay) => {
      const chars = Array.from(text)
      const started = performance.now()
      let index = 0
      while (index < chars.length && !this.disposed) {
        const next = this.skipRequested ? chars.length : Math.min(chars.length, Math.floor((performance.now() - started) / delay) + 1)
        if (next > index) {
          this.terminal.write(chars.slice(index, next).join(''))
          index = next
        }
        if (index < chars.length) await pause(16)
      }
      await this.write('')
    }
    // Scripted startup only. Ordinary input updates the editor synchronously.
    await this.write('\x1b[?2004h')
    await this.write('file explorer is in the top left.\r\n\r\n')
    await this.write(formatPrompt(HOME))
    await type('overview', 32)
    await this.write(`\r\n${formatOutput(executeCommand('overview', HOME).lines[0], this.terminal.cols)}\r\n\r\n`)
    if (this.disposed) return
    this.booting = false
    await this.draw()
    if (!this.disposed) this.onBootComplete?.()
  }

  skipIntro() {
    this.skipRequested = true
    clearTimeout(this.introTimer)
    this.wakeIntro?.()
  }

  record(record) {
    this.records.push(record)
    // Like scrollback, only the latest pending output is retained under abuse.
    if (this.records.length > 100) this.records.shift()
    this.redraw()
  }

  clearOutput() {
    this.records.length = 0
    this.clearPending = true
    this.redraw()
  }

  submit() {
    const raw = this.editor.submit()
    const cwd = this.cwd
    const result = executeCommand(raw, cwd)
    if (result.clear) {
      this.clearOutput()
      if (result.lines?.length || result.mode || result.previewPath) this.record({ raw: null, cwd, result })
    } else this.record({ raw, cwd, result })
    if (result.cwd !== this.cwd) {
      this.cwd = result.cwd
      this.requestedDirectory = result.cwd
      this.onNavigate?.(result.cwd)
    }
  }

  key(data) {
    switch (data) {
      case '\r': case '\n': this.submit(); return
      case '\x03': {
        const raw = this.editor.value
        this.editor.reset()
        this.record({ raw, cwd: this.cwd, interrupted: true })
        break
      }
      case '\x0c': this.clearOutput(); break
      case '\x01': case '\x1b[H': case '\x1bOH': case '\x1b[1~': this.editor.move('home'); break
      case '\x05': case '\x1b[F': case '\x1bOF': case '\x1b[4~': this.editor.move('end'); break
      case '\x15': this.editor.clearBefore(); break
      case '\x7f': case '\b': this.editor.backspace(); break
      case '\x1b[3~': this.editor.delete(); break
      case '\x1b[D': case '\x1bOD': this.editor.move('left'); break
      case '\x1b[C': case '\x1bOC': this.editor.move('right'); break
      case '\x1b[A': case '\x1bOA': this.editor.recall(-1); break
      case '\x1b[B': case '\x1bOB': this.editor.recall(1); break
      case '\t': this.editor.complete(completeCommand(this.editor.value, this.cwd)); break
      case '\x1b': this.editor.completion = null; break
      default: break
    }
  }

  input(data) {
    if (!this.active || this.disposed || !data) return
    if (this.booting) this.skipIntro()
    let index = 0
    while (index < data.length) {
      if (this.pasting) {
        const end = data.indexOf(PASTE_END, index)
        const remaining = MAX_INPUT_LENGTH * 2 - this.pasteText.length
        this.pasteText += data.slice(index, end < 0 ? undefined : end).slice(0, remaining)
        if (end < 0) break
        this.pasting = false
        this.editor.insert(this.pasteText)
        this.pasteText = ''
        index = end + PASTE_END.length
      } else if (data.startsWith(PASTE_START, index)) {
        this.pasting = true
        this.pasteText = ''
        index += PASTE_START.length
      } else if (data[index] === '\x1b') {
        const key = ESCAPE_KEYS.find(sequence => data.startsWith(sequence, index)) ?? '\x1b'
        this.key(key)
        index += key.length
      } else if (data.charCodeAt(index) < 32 || data.charCodeAt(index) === 127) {
        this.key(data[index])
        if (data[index] === '\r' && data[index + 1] === '\n') index++
        index++
      } else {
        const next = data.slice(index).search(/\p{Cc}/u)
        const end = next < 0 ? data.length : index + next
        if (end === index) { index++; continue }
        this.editor.insert(data.slice(index, Math.min(end, index + MAX_INPUT_LENGTH * 2)))
        index = end
      }
    }
    this.redraw()
  }

  openVirtualLink(uri, preview = false) {
    const prefix = preview ? 'portfolio-view:' : 'portfolio:'
    if (!this.active || this.booting || !uri.startsWith(prefix)) return
    let path
    try { path = resolvePath(decodeURIComponent(uri.slice(prefix.length))) } catch { return }
    const node = path && getNode(path)
    if (!node) return
    this.editor.set(`${preview ? 'view' : node.type === 'folder' ? 'cd' : 'open'} "${path}"`)
    this.submit()
    this.terminal.focus()
  }

  previewVirtualLink(uri) { this.openVirtualLink(uri, true) }

  dispose() {
    this.disposed = true
    this.skipIntro()
    if (this.frame !== null) {
      if (this.useFrames) cancelAnimationFrame(this.frame)
      else clearTimeout(this.frame)
    }
    this.frame = null
    this.marker?.dispose()
    for (const finish of this.writeWaiters) finish()
    this.settleIdle()
  }
}
