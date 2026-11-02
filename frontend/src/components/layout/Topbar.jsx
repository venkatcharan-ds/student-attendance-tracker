import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronRight, Menu, Monitor, Moon, Settings, Sun } from 'lucide-react'
import GlobalSearch from './GlobalSearch.jsx'
import { Avatar } from '../ui/Primitives.jsx'
import { formatLongDate, todayIso } from '../../services/attendanceService.js'

const THEMES = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

function ProfileMenu({ profile, theme, onTheme, onNavigate }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="dropdown" ref={rootRef}>
      <button type="button" className="profile-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Avatar name={profile.name} seed="profile" />
        <span className="profile-meta">
          <strong>{profile.name}</strong>
          <span>{profile.role}</span>
        </span>
      </button>
      {open && (
        <div className="menu" role="menu" style={{ minWidth: 220 }}>
          <div className="menu-head">
            <strong>{profile.name}</strong>
            <span>{profile.role}</span>
          </div>
          <div className="menu-sep" />
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" role="menuitemradio" aria-checked={theme === value} className="menu-item" onClick={() => onTheme(value)}>
              <Icon size={15} /> {label} theme
              {theme === value && <span className="check">●</span>}
            </button>
          ))}
          <div className="menu-sep" />
          <button
            type="button"
            role="menuitem"
            className="menu-item"
            onClick={() => {
              setOpen(false)
              onNavigate('settings')
            }}
          >
            <Settings size={15} /> Settings
          </button>
        </div>
      )}
    </div>
  )
}

function Topbar({ title, onMenu, onNavigate, onPickStudent, profile, theme, onTheme }) {
  return (
    <header className="topbar">
      <button type="button" className="btn btn-ghost btn-icon menu-btn" onClick={onMenu} aria-label="Open navigation">
        <Menu size={18} />
      </button>
      <nav className="crumbs" aria-label="Breadcrumb">
        <span className="muted">Attendly</span>
        <ChevronRight size={14} />
        <strong aria-current="page">{title}</strong>
      </nav>
      <div className="topbar-right">
        <span className="today-chip">
          <CalendarDays size={14} />
          {formatLongDate(todayIso())}
        </span>
        <GlobalSearch onPick={onPickStudent} />
        <ProfileMenu profile={profile} theme={theme} onTheme={onTheme} onNavigate={onNavigate} />
      </div>
    </header>
  )
}

export default Topbar
