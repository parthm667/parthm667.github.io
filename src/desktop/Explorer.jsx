import { useEffect, useRef, useState } from 'react'
import { ArrowDownAZ, ArrowLeft, ArrowRight, ArrowUp, ChevronRight, FileText, FileUser, Folder, Home, LayoutGrid, List, PanelLeft, Search, X } from 'lucide-react'
import { HOME, breadcrumbs, filesystem, getNode, listDirectory, parentPath } from './filesystem'
import { FileIcon } from './FileContent'

function fileType(node) {
  return node.type === 'folder' ? 'file folder' : node.name.endsWith('.pdf') ? 'pdf document' : node.type === 'link' ? 'shortcut' : 'text document'
}

function fileSize(node) {
  if (node.type === 'folder') return `${node.children.length} ${node.children.length === 1 ? 'item' : 'items'}`
  if (node.type === 'link') return '—'
  return `${new TextEncoder().encode(node.content).length} b`
}

export default function Explorer({ active, cwd, onNavigate, onPreview, onBack, onForward, canBack, canForward }) {
  const [search, setSearch] = useState({ path: cwd, query: '' })
  const query = search.path === cwd ? search.query : ''
  const setQuery = query => setSearch({ path: cwd, query })
  const [searching, setSearching] = useState(false)
  const [layout, setLayout] = useState('grid')
  const [reverse, setReverse] = useState(false)
  const [sidebar, setSidebar] = useState(false)
  const searchRef = useRef(null)
  const searchToggleRef = useRef(null)
  const nodes = listDirectory(cwd)
  const visible = nodes.filter(node => `${node.name} ${node.description}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (a.type === 'folder' ? 0 : 1) - (b.type === 'folder' ? 0 : 1) || a.name.localeCompare(b.name) * (reverse ? -1 : 1))
  const current = getNode(cwd)

  useEffect(() => { if (searching) searchRef.current?.focus() }, [searching])

  function navigate(path) { setQuery(''); setSidebar(false); onNavigate(path) }
  function open(node, event) {
    if (event.detail > 1) return
    if (node.type === 'folder') navigate(`${cwd}/${node.name}`)
    else onPreview(`${cwd}/${node.name}`)
  }
  function toggleSearch() {
    setSearching(!searching)
    setQuery('')
    if (searching) searchToggleRef.current?.focus()
  }

  return <section className="explorer-panel" hidden={!active} aria-label="file explorer">
    <header className="explorer-header">
      <div className="explorer-sidebar-title">files</div>
      <div className="explorer-location-tools">
        <button className="sidebar-toggle" onClick={() => setSidebar(!sidebar)} aria-expanded={sidebar} aria-controls="explorer-folders" aria-label="toggle folder sidebar" title="folders"><PanelLeft size={18} /></button>
        <div className="explorer-navigation">
          <button title="back" aria-label="back" disabled={!canBack} onClick={onBack}><ArrowLeft size={17} /></button>
          <button title="forward" aria-label="forward" disabled={!canForward} onClick={onForward}><ArrowRight size={17} /></button>
          <button title="up one folder" aria-label="up one folder" disabled={cwd === HOME} onClick={() => navigate(parentPath(cwd))}><ArrowUp size={17} /></button>
        </div>
        {searching
          ? <label className="explorer-search"><Search size={16} aria-hidden="true" /><input ref={searchRef} aria-label="search current folder" value={query} onChange={event => setQuery(event.target.value)} placeholder={`search ${current?.name || 'parth'}`} onKeyDown={event => { if (event.key === 'Escape') toggleSearch() }} />{query && <button onClick={() => { setQuery(''); searchRef.current?.focus() }} aria-label="clear search"><X size={14} /></button>}</label>
          : <nav className="explorer-breadcrumbs" aria-label="folder path">{breadcrumbs(cwd).map((crumb, index) => <span key={crumb.path}>{index > 0 && <ChevronRight size={13} aria-hidden="true" />}<button onClick={() => navigate(crumb.path)} aria-current={crumb.path === cwd ? 'location' : undefined}>{index === 0 && <Home size={16} aria-hidden="true" />}{index === 0 ? 'home' : crumb.name}</button></span>)}</nav>}
        <div className="explorer-view-controls">
          <button ref={searchToggleRef} onClick={toggleSearch} aria-label="search files" title="search files" aria-pressed={searching}><Search size={17} /></button>
          <div className="explorer-layout-switch"><button onClick={() => setLayout('list')} aria-label="list view" title="list view" aria-pressed={layout === 'list'}><List size={18} /></button><button onClick={() => setLayout('grid')} aria-label="grid view" title="grid view" aria-pressed={layout === 'grid'}><LayoutGrid size={16} /></button></div>
          <button onClick={() => setReverse(!reverse)} title="reverse name order" aria-label="reverse name order" aria-pressed={reverse}><ArrowDownAZ size={18} /></button>
        </div>
      </div>
    </header>
    <div className="explorer-body">
      {sidebar && <button className="sidebar-scrim" aria-label="close folder sidebar" onClick={() => setSidebar(false)} />}
      <nav id="explorer-folders" className={`explorer-sidebar${sidebar ? ' sidebar-open' : ''}`} aria-label="folders">
        <button className={cwd === HOME ? 'sidebar-active' : ''} onClick={() => navigate(HOME)}><Home size={19} aria-hidden="true" /><span>home</span></button>
        {filesystem.children.filter(node => node.type === 'folder').map(node => <button key={node.name} className={cwd.startsWith(`${HOME}/${node.name}`) ? 'sidebar-active' : ''} onClick={() => navigate(`${HOME}/${node.name}`)}><Folder size={18} aria-hidden="true" /><span>{node.name}</span></button>)}
        <div className="sidebar-divider" />
        {['about.txt', 'contact.txt', 'resume.pdf'].map(name => {
          const Icon = name === 'resume.pdf' ? FileUser : FileText
          return <button key={name} aria-label={`open ${name}`} onClick={event => { if (event.detail <= 1) onPreview(`${HOME}/${name}`) }}><Icon size={18} aria-hidden="true" /><span>{name === 'resume.pdf' ? 'résumé' : name.replace('.txt', '')}</span></button>
        })}
      </nav>
      <div className="explorer-main">
        <h1 className="sr-only">{cwd === HOME ? 'home' : current?.name}</h1>
        {layout === 'list' && <div className="explorer-column-headings" aria-hidden="true"><span>name</span><span>size</span><span>type</span></div>}
        <div className={`explorer-files ${layout === 'grid' ? 'explorer-grid' : 'explorer-list'}`}>
          {visible.map(node => <button className="explorer-file" key={node.name} aria-label={`${node.name} ${fileType(node)} ${node.description}`} title={node.description} onClick={event => open(node, event)}>
            <span className="explorer-filename"><FileIcon node={node} size={layout === 'grid' ? 76 : 24} /><span>{node.name}</span></span>
            {layout === 'list' && <><span className="explorer-filesize">{fileSize(node)}</span><span className="explorer-filetype">{fileType(node)}</span></>}
          </button>)}
        </div>
        {!visible.length && <p className="explorer-empty">no files match “{query}”. <button onClick={() => setQuery('')}>clear search</button></p>}
      </div>
    </div>
  </section>
}
