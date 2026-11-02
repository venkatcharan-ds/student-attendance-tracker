import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { fromIso, getDays, toIso } from '../../services/attendanceService.js'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

// Builds the 6x7 grid of dates shown for a month (weeks start on Monday)
const buildGrid = (year, month) => {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - offset)
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
}

/**
 * Date picker with a month calendar popover. Days that already have saved attendance
 * show a dot: green when everyone marked was present, amber when someone was absent.
 */
function CalendarPicker({ value, max, onChange, refreshKey }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => {
    const d = fromIso(value)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [days, setDays] = useState({})
  const rootRef = useRef(null)

  // Keep the visible month in sync when the date changes from outside (arrows, Today)
  useEffect(() => {
    const d = fromIso(value)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }, [value])

  useEffect(() => {
    if (!open) return
    let ignore = false
    const from = toIso(new Date(view.year, view.month, 1))
    const to = toIso(new Date(view.year, view.month + 1, 0))
    getDays(from, to)
      .then((list) => !ignore && setDays(Object.fromEntries(list.map((d) => [d.date, d]))))
      .catch(() => !ignore && setDays({}))
    return () => {
      ignore = true
    }
  }, [open, view, refreshKey])

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const moveMonth = (delta) =>
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  const grid = buildGrid(view.year, view.month)
  const maxDate = fromIso(max)
  const nextMonthDisabled = new Date(view.year, view.month + 1, 1) > maxDate
  const title = new Date(view.year, view.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const shortValue = fromIso(value).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="cal" ref={rootRef}>
      <button
        type="button"
        className="cal-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Session date ${shortValue}, open calendar`}
      >
        <CalendarDays size={15} />
        {shortValue}
      </button>

      {open && (
        <div className="cal-pop" role="dialog" aria-label="Choose session date">
          <div className="cal-head">
            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => moveMonth(-1)} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <span className="cal-title">{title}</span>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => moveMonth(1)}
              disabled={nextMonthDisabled}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="cal-grid">
            {WEEKDAYS.map((w) => (
              <span key={w} className="cal-wd">{w}</span>
            ))}
            {grid.map((d) => {
              const iso = toIso(d)
              const info = days[iso]
              const outside = d.getMonth() !== view.month
              const disabled = d > maxDate
              const cls = [
                'cal-day',
                outside && 'outside',
                iso === value && 'selected',
                iso === max && 'today',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <button
                  key={iso}
                  type="button"
                  className={cls}
                  disabled={disabled}
                  onClick={() => {
                    onChange(iso)
                    setOpen(false)
                  }}
                  title={info ? `${info.presentCount} present, ${info.absentCount} absent` : undefined}
                >
                  {d.getDate()}
                  {info && <span className={`cal-dot ${info.absentCount > 0 ? 'mixed' : 'full'}`} />}
                </button>
              )
            })}
          </div>
          <div className="cal-legend">
            <span><span className="cal-dot full" /> All present</span>
            <span><span className="cal-dot mixed" /> Some absent</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarPicker
