import { useEffect, useId, useRef, useState } from 'react'
import { useData } from '../../context/DataContext.jsx'
import { Avatar, SearchInput, StatusBadge } from '../ui/Primitives.jsx'

/**
 * Top-bar student search (Ctrl/Cmd + K). Picking a result opens the
 * attendance page filtered to that student.
 */
function GlobalSearch({ onPick }) {
  const { students, todaySummary } = useData()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const listId = useId()

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    const onDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [])

  const q = query.trim().toLowerCase()
  const results = q
    ? students.filter((s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q)).slice(0, 6)
    : []
  const statusOf = Object.fromEntries((todaySummary?.records ?? []).map((r) => [r.studentId, r.status]))

  const pick = (student) => {
    onPick(student)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      pick(results[active])
    }
  }

  return (
    <div className="global-search" ref={rootRef} onKeyDown={onKeyDown}>
      <SearchInput
        inputRef={inputRef}
        value={query}
        onChange={(v) => {
          setQuery(v)
          setActive(0)
          setOpen(true)
        }}
        placeholder="Search students…"
        label="Search students"
      >
        <span className="kbd">Ctrl K</span>
      </SearchInput>
      {open && q && (
        <ul className="menu" id={listId} role="listbox" aria-label="Matching students" style={{ width: '100%', minWidth: 280 }}>
          {results.length === 0 ? (
            <li className="menu-head">
              No students match “{query.trim()}”
            </li>
          ) : (
            <>
              <li className="menu-head">
                <span>Today’s status</span>
              </li>
              {results.map((s, i) => (
                <li key={s.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`menu-item ${i === active ? 'active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(s)}
                  >
                    <Avatar name={s.name} seed={s.rollNumber} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 500 }}>{s.name}</span>
                      <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                        {s.rollNumber}
                      </span>
                    </span>
                    <span style={{ marginLeft: 'auto' }}>
                      <StatusBadge status={statusOf[s.id]} />
                    </span>
                  </button>
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  )
}

export default GlobalSearch
