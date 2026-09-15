import { HOME, getNode, resolvePath } from './filesystem.js'
import { completeCommand, executeCommand } from './shell.js'
import { formatOutput, formatPrompt } from './terminalFormat.js'
import { LineEditor } from './terminalInput.js'

export class TerminalSession {
  constructor(terminal, { cwd = HOME, onNavigate, onMode, onBootComplete }) {
    this.terminal = terminal
    this.cwd = cwd
    this.onNavigate = onNavigate
    this.onMode = onMode
    this.onBootComplete = onBootComplete
    this.editor = new LineEditor()
    this.active = true
    this.booting = true
    this.disposed = false
    this.pending = Promise.resolve()
    this.marker = null
    this.pasting = false
    this.pasteText = ''
    this.skipRequested = false
  }

  write(text) {
    if (this.disposed) return Promise.resolve()
    return new Promise(resolve => this.terminal.write(text, resolve))
  }

  enqueue(task) {
    this.pending = this.pending.then(() => this.disposed ? undefined : task())
    return this.pending
  }

  async draw() {
    if (this.disposed || this.booting) return
    const terminal = this.terminal
    terminal.scrollToBottom()
    const row = this.marker ? Math.max(0, this.marker.line - terminal.buffer.active.baseY) : terminal.buffer.active.cursorY
    await this.write(`\x1b[${row + 1};1H\x1b[J`)
    this.marker?.dispose()
    this.marker = terminal.registerMarker(0)
    const before = this.editor.characters.slice(0, this.editor.cursor).join('')
    const after = this.editor.characters.slice(this.editor.cursor).join('')
    // Save the actual terminal cursor so xterm handles wrapped and wide cells.
    await this.write(`${formatPrompt(this.cwd)}${before} \b\x1b7${after} \b\x1b8`)
  }

  redraw() { return this.enqueue(() => this.draw()) }

  setDirectory(cwd) {
    if (cwd === this.cwd) return
    this.cwd = cwd
    if (!this.booting) this.redraw()
  }

  async startIntro(reducedMotion = false) {
    this.skipRequested = reducedMotion
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
          // Batch due characters without waiting for a render for every letter.
          this.terminal.write(chars.slice(index, next).join(''))
          index = next
        }
        if (index < chars.length) await pause(16)
      }
      await this.write('')
    }
    await this.write('\x1b[?2004h')
    await this.write('prefer clicking around? switch to file explorer in the top left.\r\n\r\n')
    await this.write(formatPrompt(HOME))
    await type('cat about.txt', 35)
    await this.write('\r\n')
    await type(formatOutput(executeCommand('cat about.txt', HOME).lines[0], this.terminal.cols), 3)
    await this.write(`\r\n${formatPrompt(HOME)}`)
    await type('ls', 65)
    await this.write(`\r\n${formatOutput(executeCommand('ls', HOME).lines[0], this.terminal.cols)}\r\n`)
    if (this.disposed) return
    this.booting = false
    await this.draw()
    this.onBootComplete()
  }

  skipIntro() {
    this.skipRequested = true
    clearTimeout(this.introTimer)
    this.wakeIntro?.()
  }

  async submit() {
    this.editor.move('end')
    await this.draw()
    const raw = this.editor.submit()
    await this.write('\r\n')
    this.marker?.dispose()
    this.marker = null
    const result = executeCommand(raw, this.cwd)
    if (result.clear) await this.write('\x1b[2J\x1b[H\x1b[3J')
    else {
      for (const line of result.lines ?? []) {
        const output = formatOutput(line, this.terminal.cols)
        if (output) await this.write(`${output}\r\n`)
      }
    }
    if (result.cwd !== this.cwd) {
      this.cwd = result.cwd
      this.onNavigate(result.cwd)
    }
    await this.draw()
    if (result.mode) this.onMode(result.mode)
  }

  input(data) {
    if (!this.active || this.disposed) return
    if (this.booting) {
      if (data === '\r' || data === '\x1b') this.skipIntro()
      return
    }
    return this.enqueue(async () => {
      const pasteStart = '\x1b[200~'
      const pasteEnd = '\x1b[201~'
      if (data.startsWith(pasteStart)) {
        this.pasting = true
        this.pasteText = ''
        data = data.slice(pasteStart.length)
      }
      if (this.pasting) {
        const end = data.indexOf(pasteEnd)
        this.pasteText += end === -1 ? data : data.slice(0, end)
        if (end === -1) return
        this.pasting = false
        this.editor.insert(this.pasteText)
        this.pasteText = ''
      } else {
        switch (data) {
          case '\r': await this.submit(); return
          case '\x03':
            this.editor.move('end')
            await this.draw()
            await this.write('^C\r\n')
            this.editor.reset()
            this.marker?.dispose()
            this.marker = null
            break
          case '\x0c':
            await this.write('\x1b[2J\x1b[H\x1b[3J')
            this.marker?.dispose()
            this.marker = null
            break
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
          default:
            if (data.startsWith('\x1b')) return
            this.editor.insert(data)
        }
      }
      await this.draw()
    })
  }

  openVirtualLink(uri) {
    if (!this.active || this.booting || !uri.startsWith('portfolio:')) return
    let path
    try { path = resolvePath(decodeURIComponent(uri.slice('portfolio:'.length))) } catch { return }
    const node = path && getNode(path)
    if (!node) return
    this.enqueue(async () => {
      this.editor.set(`${node.type === 'folder' ? 'cd' : 'open'} "${path}"`)
      await this.submit()
      this.terminal.focus()
    })
  }

  dispose() {
    this.disposed = true
    this.skipIntro()
    this.marker?.dispose()
  }
}
