import { Search, X } from 'lucide-react'

// Small presentational building blocks shared by all pages

const AVATAR_TONES = [
  ['#eef2ff', '#4f46e5'],
  ['#ecfeff', '#0e7490'],
  ['#f0fdf4', '#15803d'],
  ['#fff7ed', '#c2410c'],
  ['#fdf2f8', '#be185d'],
  ['#f5f3ff', '#6d28d9'],
  ['#fefce8', '#a16207'],
  ['#f1f5f9', '#334155'],
]

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'

export function Avatar({ name, seed = name, size }) {
  const [bg, fg] = AVATAR_TONES[[...(seed || '')].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TONES.length]
  return (
    <span className={`avatar ${size === 'lg' ? 'lg' : ''}`} style={{ background: bg, color: fg }} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

const STATUS_LABEL = { PRESENT: 'Present', ABSENT: 'Absent' }

export function StatusBadge({ status, unsaved }) {
  if (!status) {
    return (
      <span className="badge pending">
        <span className="badge-dot" />
        Not marked
      </span>
    )
  }
  return (
    <span className={`badge ${status === 'PRESENT' ? 'present' : 'absent'} ${unsaved ? 'unsaved' : ''}`}>
      <span className="badge-dot" />
      {STATUS_LABEL[status]}
      {unsaved && <span className="sr-only"> (unsaved)</span>}
    </span>
  )
}

export function Skeleton({ width = '100%', height = 12, radius, style }) {
  return <span className="skeleton" style={{ width, height, borderRadius: radius, ...style }} aria-hidden="true" />
}

export function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="empty-icon">
          <Icon size={20} />
        </div>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children && <div className="empty-actions">{children}</div>}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder, label, inputRef, className = '', children }) {
  return (
    <div className={`search ${className}`}>
      <Search size={15} />
      <input
        ref={inputRef}
        type="search"
        className="input search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label || placeholder}
      />
      {value && !children && (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Clear search">
          <X size={14} />
        </button>
      )}
      {children}
    </div>
  )
}

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />
}

// Segmented radio group, e.g. theme or filter switches
export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}>
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}
