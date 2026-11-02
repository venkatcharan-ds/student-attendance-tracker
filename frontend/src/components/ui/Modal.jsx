import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select, textarea, [href], [tabindex]:not([tabindex="-1"])'

/**
 * Accessible modal: Escape and backdrop click close it, focus is trapped inside
 * and returned to the element that opened it.
 */
function Modal({ title, description, icon, children, footer, onClose, role = 'dialog', as: Tag = 'div', onSubmit }) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Runs once per open: initial focus, focus trap, Escape, scroll lock
  useEffect(() => {
    const previous = document.activeElement
    const panel = panelRef.current
    const first = panel.querySelector('[data-autofocus]') || panel.querySelector(FOCUSABLE)
    first?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
      } else if (e.key === 'Tab') {
        const items = [...panel.querySelectorAll(FOCUSABLE)]
        if (items.length === 0) return
        const firstEl = items[0]
        const lastEl = items[items.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <Tag
        ref={panelRef}
        className="modal"
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onSubmit={onSubmit}
        noValidate={Tag === 'form' ? true : undefined}
      >
        <div className="modal-header">
          {icon}
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descId}>{description}</p>}
          </div>
          <button type="button" className="btn btn-ghost btn-icon btn-sm modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children && <div className="modal-body">{children}</div>}
        {!children && <div style={{ height: 18 }} />}
        {footer && <div className="modal-footer">{footer}</div>}
      </Tag>
    </div>
  )
}

export default Modal
