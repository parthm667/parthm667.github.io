import { useEffect, useRef, useState } from 'react'
import { Terminal as Xterm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { TerminalSession } from './terminalSession.js'
import '@xterm/xterm/css/xterm.css'

export default function Terminal({ cwd, active, onNavigate, onMode, onPreview }) {
  const hostRef = useRef(null)
  const sessionRef = useRef(null)
  const fitRef = useRef(null)
  const callbacksRef = useRef({ onNavigate, onMode, onPreview })
  const initialCwd = useRef(cwd)
  const [booting, setBooting] = useState(true)

  useEffect(() => { callbacksRef.current = { onNavigate, onMode, onPreview } }, [onNavigate, onMode, onPreview])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let disposed = false
    const openLink = (_event, uri) => {
      if (uri.startsWith('portfolio-view:')) {
        sessionRef.current?.previewVirtualLink(uri)
        return
      }
      if (uri.startsWith('portfolio:')) {
        sessionRef.current?.openVirtualLink(uri)
        return
      }
      const url = new URL(uri, window.location.origin)
      if (['https:', 'http:', 'mailto:'].includes(url.protocol)) window.open(url.href, '_blank', 'noopener,noreferrer')
    }
    const terminal = new Xterm({
      fontFamily: "'Ubuntu Mono', 'Site Mono', monospace",
      fontSize: 16,
      lineHeight: 1,
      fontWeight: '400',
      fontWeightBold: '700',
      cursorStyle: 'block',
      cursorBlink: !reducedMotion.matches,
      cursorInactiveStyle: 'outline',
      screenReaderMode: true,
      scrollback: 3000,
      scrollOnUserInput: true,
      theme: {
        background: '#101113', foreground: '#dedee3', cursor: '#dedee3', cursorAccent: '#101113',
        selectionBackground: '#ffffff30', black: '#17181b', red: '#db8585', green: '#a3b89a',
        yellow: '#c5b58b', blue: '#8faac7', magenta: '#b4a0bd', cyan: '#93b8bd', white: '#dedee3',
        brightBlack: '#85858d', brightRed: '#e59b9b', brightGreen: '#b4c7aa', brightYellow: '#d6c69c',
        brightBlue: '#a3bdd8', brightMagenta: '#c4b0cd', brightCyan: '#a4c9ce', brightWhite: '#f3f3f5',
      },
      linkHandler: { activate: openLink, allowNonHttpProtocols: true },
    })
    const fit = new FitAddon()
    terminal.loadAddon(fit)
    terminal.loadAddon(new WebLinksAddon(openLink))
    terminal.open(hostRef.current)
    terminal.textarea.setAttribute('aria-label', 'terminal command')
    terminal.textarea.id = 'terminal-command'
    terminal.textarea.setAttribute('spellcheck', 'false')
    fit.fit()
    const session = new TerminalSession(terminal, {
      cwd: initialCwd.current,
      onNavigate: path => callbacksRef.current.onNavigate(path),
      onMode: mode => callbacksRef.current.onMode(mode),
      onPreview: path => callbacksRef.current.onPreview?.(path),
      onBootComplete: () => {
        if (disposed) return
        setBooting(false)
        if (session.active && window.matchMedia('(pointer: fine)').matches) terminal.focus()
      },
    })
    sessionRef.current = session
    fitRef.current = fit
    const dataListener = terminal.onData(data => session.input(data))
    let physicalKey = false
    // xterm suppresses input-only insertText events in screen-reader mode.
    // Handle virtual keyboards/bulk insertion without duplicating physical keys
    // or IME composition, both of which already arrive through xterm.onData.
    const inputOnly = event => {
      if (event.inputType !== 'insertText' || !event.data || event.isComposing || physicalKey) return
      event.preventDefault()
      session.input(event.data)
    }
    terminal.textarea.addEventListener('beforeinput', inputOnly)
    terminal.attachCustomKeyEventHandler(event => {
      if (!session.active) return false
      if (event.type === 'keyup') physicalKey = false
      if (event.type !== 'keydown') return true
      physicalKey = event.key !== 'Unidentified' && event.keyCode !== 229
      if (event.key === 'Tab' && event.shiftKey) return false
      if (event.ctrlKey && event.key.toLowerCase() === 'c' && terminal.hasSelection()) return false
      if (session.booting && event.key === 'Escape') {
        event.preventDefault()
        session.skipIntro()
        return false
      }
      return true
    })
    const resize = () => {
      if (disposed || !session.active || !hostRef.current?.clientWidth || !hostRef.current?.clientHeight) return
      fit.fit()
      if (!session.booting) session.redraw()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(hostRef.current)
    const motionChanged = () => {
      terminal.options.cursorBlink = !reducedMotion.matches
      if (reducedMotion.matches) session.skipIntro()
    }
    reducedMotion.addEventListener('change', motionChanged)
    document.fonts.ready.then(resize)
    session.startIntro(reducedMotion.matches)
    if (window.matchMedia('(pointer: fine)').matches) terminal.focus()
    return () => {
      disposed = true
      observer.disconnect()
      reducedMotion.removeEventListener('change', motionChanged)
      dataListener.dispose()
      terminal.textarea?.removeEventListener('beforeinput', inputOnly)
      session.dispose()
      terminal.dispose()
      sessionRef.current = null
      fitRef.current = null
    }
  }, [])

  useEffect(() => {
    const session = sessionRef.current
    if (!session) return
    session.active = active
    session.setDirectory(cwd)
    if (active) {
      fitRef.current?.fit()
      session.redraw()
    }
  }, [cwd, active])

  return <section className="terminal-panel" aria-label="linux terminal" hidden={!active} data-booting={booting}>
    <div className="terminal-host" ref={hostRef} />
    {booting && <button className="skip-intro" onClick={() => sessionRef.current?.skipIntro()}>skip intro</button>}
  </section>
}
