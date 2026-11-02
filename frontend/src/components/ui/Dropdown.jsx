import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

/**
 * Select-style dropdown with keyboard support (arrows, Enter, Escape).
 * options: [{ value, label, icon?, count? }]
 */
function Dropdown({ value, options, onChange, label, icon, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef(null)
  const listId = useId()
  const current = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    setActive(Math.max(options.findIndex((o) => o.value === value), 0))
    const onDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, options, value])

  const choose = (opt) => {
    onChange(opt.value)
    setOpen(false)
    rootRef.current?.querySelector('button')?.focus()
  }

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % options.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + options.length) % options.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      choose(options[active])
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className="dropdown" ref={rootRef} onKeyDown={onKeyDown}>
      <button
        type="button"
        className="btn dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          {icon}
          {current.label}
        </span>
        <ChevronDown size={14} className="chev" />
      </button>
      {open && (
        <ul className={`menu ${align === 'left' ? 'left' : ''}`} role="listbox" id={listId} aria-label={label}>
          {options.map((o, i) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                tabIndex={-1}
                className={`menu-item ${i === active ? 'active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o)}
              >
                {o.icon}
                {o.label}
                {o.count !== undefined && <span className="count tabular">{o.count}</span>}
                {o.value === value && <Check size={14} className="check" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Dropdown
