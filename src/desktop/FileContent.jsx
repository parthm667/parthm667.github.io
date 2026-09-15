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
  return <div className="file-content">
    {node.content && node.content.split('\n').map((line, index) => (
      <p key={index}>{line.split(/(https?:\/\/[^\s]+|mailto:[^\s]+)/g).map((part, partIndex) => (
        /^(https?:\/\/|mailto:)/.test(part)
          ? <FileLink href={part} key={partIndex}>{part.toLowerCase()}</FileLink>
          : part
      ))}</p>
    ))}
    {node.href && <FileLink href={node.href} className="file-open-link">
      {node.name.endsWith('.pdf') ? 'open résumé' : 'open link'} <ExternalLink size={14} aria-hidden="true" />
    </FileLink>}
  </div>
}
