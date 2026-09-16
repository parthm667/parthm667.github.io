import { useEffect, useState } from 'react'
import { FileUser, Folder, Mail, Terminal as TerminalIcon } from 'lucide-react'
import { HOME } from './filesystem'
import Explorer from './Explorer'
import Terminal from './Terminal'
import FilePreview from './FilePreview'
import './desktop.css'

export default function Desktop() {
  const [mode, setMode] = useState('terminal')
  const [preview, setPreview] = useState(null)
  const [navigation, setNavigation] = useState({ paths: [HOME], index: 0 })
  const cwd = navigation.paths[navigation.index]

  useEffect(() => {
    document.documentElement.dataset.room = 'desktop'
    document.title = 'parth mhaske'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#101113')
    return () => { delete document.documentElement.dataset.room }
  }, [])

  function navigate(path) {
    if (!path) return
    setNavigation(previous => path === previous.paths[previous.index] ? previous : ({ paths: [...previous.paths.slice(0, previous.index + 1), path], index: previous.index + 1 }))
  }

  return <div className="desktop" data-view={mode}>
    <a className="skip-to-content" href={mode === 'terminal' ? '#terminal-command' : '#workspace'}>skip to {mode === 'terminal' ? 'command input' : 'files'}</a>
    <header className="desktop-header">
      <nav className="mode-switch" aria-label="website view">
        <button aria-pressed={mode === 'terminal'} onClick={() => setMode('terminal')}><TerminalIcon size={16} /><span>terminal</span></button>
        <button aria-pressed={mode === 'explorer'} onClick={() => setMode('explorer')}><Folder size={16} /><span>file explorer</span></button>
      </nav>
      <span className="window-session">{mode === 'terminal' ? `parth@portfolio: ${cwd.replace(HOME, '~')}` : 'file explorer'}</span>
      <div className="header-links"><a href="/resume.pdf" aria-label="résumé" title="résumé"><FileUser size={16} /></a><a href="mailto:pmhaske@umd.edu" aria-label="email parth" title="email parth"><Mail size={16} /></a></div>
    </header>
    <main className="desktop-workspace" id="workspace" tabIndex={-1}>
      <Terminal cwd={cwd} active={mode === 'terminal'} onNavigate={navigate} onMode={setMode} onPreview={setPreview} />
      <Explorer active={mode === 'explorer'} cwd={cwd} onNavigate={navigate} onPreview={setPreview} canBack={navigation.index > 0} canForward={navigation.index < navigation.paths.length - 1} onBack={() => setNavigation(previous => ({ ...previous, index: previous.index - 1 }))} onForward={() => setNavigation(previous => ({ ...previous, index: previous.index + 1 }))} />
    </main>
    {preview && <FilePreview path={preview} onClose={() => setPreview(null)} />}
  </div>
}
