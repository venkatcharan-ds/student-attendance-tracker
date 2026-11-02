import AnimatedNumber from './ui/AnimatedNumber.jsx'
import ProgressRing from './ui/ProgressRing.jsx'
import { Skeleton } from './ui/Primitives.jsx'

// Ring plus per-status breakdown for one date's saved attendance
function AttendanceSummary({ summary, loading, title = 'Attendance summary', subtitle }) {
  const present = summary?.presentCount ?? 0
  const absent = summary?.absentCount ?? 0
  const total = summary?.totalStudents ?? 0
  const notMarked = Math.max(total - present - absent, 0)
  const marked = present + absent
  const rate = marked === 0 ? null : Math.round((present / marked) * 100)
  const pct = (n) => (total === 0 ? 0 : (n / total) * 100)

  const rows = [
    { key: 'present', label: 'Present', value: present },
    { key: 'absent', label: 'Absent', value: absent },
    { key: 'none', label: 'Not marked', value: notMarked },
  ]

  return (
    <section className="card" aria-busy={loading}>
      <div className="card-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="card-body summary-body">
        {loading ? (
          <>
            <Skeleton width={112} height={112} radius="50%" />
            <div className="breakdown">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={26} />
              ))}
            </div>
          </>
        ) : (
          <>
            <ProgressRing present={present} absent={absent} total={total} size={112} stroke={11}>
              <div>
                <span className="ring-value">{rate === null ? '—' : <AnimatedNumber value={rate} suffix="%" />}</span>
                <span className="ring-caption">attendance</span>
              </div>
            </ProgressRing>
            <div className="breakdown">
              {rows.map((r) => (
                <div className="breakdown-row" key={r.key}>
                  <span className={`dot ${r.key}`} />
                  <span>{r.label}</span>
                  <strong>
                    <AnimatedNumber value={r.value} />
                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}> / {total}</span>
                  </strong>
                  <div className="meter" aria-hidden="true">
                    <span className={r.key} style={{ width: `${pct(r.value)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default AttendanceSummary
