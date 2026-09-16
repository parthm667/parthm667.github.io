import { ExternalLink } from 'lucide-react'

export function FileIcon({ node, size = 20 }) {
  const icon = node.type === 'folder' ? 'folder'
    : node.name.endsWith('.pdf') ? 'pdf'
      : node.name.includes('photography') ? 'image'
        : node.type === 'link' ? 'link' : 'text'
  return <img src={`/icons/yaru/${icon}.png`} width={size} height={size} alt="" aria-hidden="true" draggable={false} className="file-icon" />
}

export function FileLink({ href, children, className }) {
  const external = /^https?:\/\//.test(href)
  return <a className={className} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>{children}</a>
}

export function FileContent({ node }) {
  if (!node) return null
  const lines = node.content?.split('\n') ?? []
  return <div className="file-content">
    {lines.map((line, index) => {
      if (!line) return <div className="file-paragraph-break" key={index} />
      const Tag = index === 0 ? 'h3' : lines[index - 1] === '' && lines[index + 1] && line.length < 45 && !line.includes('/') ? 'h4' : 'p'
      return <Tag key={index}>{line.split(/(https?:\/\/[^\s]+|mailto:[^\s]+)/g).map((part, partIndex) => (
        /^(https?:\/\/|mailto:)/.test(part)
          ? <FileLink href={part} key={partIndex}>{part.toLowerCase()}</FileLink>
          : part
      ))}</Tag>
    })}
    {node.media?.map(media => <figure key={media.src}>
      <a href={media.src} target="_blank" rel="noopener noreferrer" aria-label="open full-size figure"><img src={media.src} alt={media.alt} width="2250" height="1500" /></a>
      <figcaption>{media.caption}</figcaption>
    </figure>)}
    {node.links?.length > 0 && <nav className="document-links" aria-label="sources">{node.links.map(link => <FileLink key={link.href} href={link.href}>{link.label} <ExternalLink size={13} aria-hidden="true" /></FileLink>)}</nav>}
    {node.href && <FileLink href={node.href} className="file-open-link">
      {node.name.endsWith('.pdf') ? 'open résumé' : 'open link'} <ExternalLink size={14} aria-hidden="true" />
    </FileLink>}
  </div>
}
