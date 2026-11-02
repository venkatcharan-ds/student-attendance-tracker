import { fromIso } from '../services/attendanceService.js'
import { Skeleton } from './ui/Primitives.jsx'

/**
 * Stacked bar per date (present + absent as a share of all students).
 * days: [{ date, presentCount, absentCount }] - one entry per date to show, empty ones allowed.
 */
function DailyChart({ days, totalStudents, today, loading, onSelect, labelFormat = { weekday: 'short' } }) {
  if (loading) {
    return (
      <div className="chart" aria-hidden="true">
        {Array.from({ length: Math.max(days.length, 7) }, (_, i) => (
          <div className="chart-col" key={i}>
            <Skeleton width="100%" height={`${40 + ((i * 37) % 50)}%`} style={{ maxWidth: 34, marginTop: 'auto' }} />
            <Skeleton width={24} height={10} />
          </div>
        ))}
      </div>
    )
  }

  const scale = Math.max(totalStudents, ...days.map((d) => d.presentCount + d.absentCount), 1)

  return (
    <div className="chart" role="list" aria-label="Daily attendance">
      {days.map((d) => {
        const date = fromIso(d.date)
        const label = date.toLocaleDateString(undefined, labelFormat)
        const marked = d.presentCount + d.absentCount
        const rate = marked ? Math.round((d.presentCount / marked) * 100) : null
        const description = marked
          ? `${date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}: ${d.presentCount} present, ${d.absentCount} absent (${rate}%)`
          : `${date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}: no attendance saved`
        return (
          <div className="chart-col" key={d.date} role="listitem">
            <button type="button" className="chart-bar" title={description} aria-label={description} onClick={() => onSelect?.(d.date)}>
              <span className="present" style={{ height: `${(d.presentCount / scale) * 100}%` }} />
              <span className="absent" style={{ height: `${(d.absentCount / scale) * 100}%` }} />
            </button>
            <span className={`chart-label ${d.date === today ? 'today' : ''}`}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default DailyChart
