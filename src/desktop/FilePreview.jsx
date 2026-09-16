import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { HOME, getNode } from './filesystem'
import { FileContent, FileIcon } from './FileContent'

export default function FilePreview({ path, onClose }) {
  const dialog = useRef(null)
  const trigger = useRef(null)
  const node = getNode(path)
  useEffect(() => {
    if (!node) return
    trigger.current ??= document.activeElement
    const element = dialog.current
    element.showModal()
    element.focus()
    return () => {
      element.close()
      if (trigger.current?.isConnected) trigger.current.focus()
    }
  }, [node])
  if (!node) return null
  return <dialog className="document-preview" ref={dialog} tabIndex={-1} aria-label={`preview of ${node.name}`}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => {
      if (event.detail > 1 || event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
    }}>
    <header><FileIcon node={node} size={23} /><h2>{path.replace(HOME, '~')}</h2><button onClick={onClose} aria-label="close preview" title="close preview"><X size={18} /></button></header>
    <div className="document-body"><FileContent node={node} /></div>
  </dialog>
}
