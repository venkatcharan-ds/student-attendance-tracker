import { useEffect, useState } from 'react'
import { CalendarRange, ChevronLeft, ChevronRight, ClipboardList, Percent, RotateCcw, SearchX, UserCheck, UserX } from 'lucide-react'
import DailyChart from '../components/DailyChart.jsx'
import KpiCard from '../components/KpiCard.jsx'
import { EmptyState, Skeleton } from '../components/ui/Primitives.jsx'
import { useData } from '../context/DataContext.jsx'
import { fromIso, getDays, getErrorMessage, toIso } from '../services/attendanceService.js'

function ReportsPage({ onNavigate }) {
  const { students, today, version } = useData()
  const [month, setMonth] = useState(() => {
    const d = fromIso(today)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [days, setDays] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const from = toIso(new Date(month.year, month.month, 1))
  const to = toIso(new Date(month.year, month.month + 1, 0))
  const isCurrentMonth = from <= today && today <= to

  useEffect(() => {
    let ignore = false
    setDays(null)
    getDays(from, to)
      .then((list) => {
        if (ignore) return
        setDays(list)
        setError(null)
      })
      .catch((err) => {
        if (ignore) return
        setDays([])
        setError(getErrorMessage(err))
      })
    return () => {
      ignore = true
    }
  }, [from, to, version, reloadKey])

  const move = (delta) =>
    setMonth(({ year, month: m }) => {
      const d = new Date(year, m + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  const list = days ?? []
  const totalPresent = list.reduce((s, d) => s + d.presentCount, 0)
  const totalAbsent = list.reduce((s, d) => s + d.absentCount, 0)
  const avgRate = totalPresent + totalAbsent ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : null
  const title = new Date(month.year, month.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const loading = days === null

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Monthly attendance from the saved records.</p>
        </div>
        <div className="date-nav" role="group" aria-label="Report month">
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => move(-1)} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <span className="cal-trigger" style={{ cursor: 'default', minWidth: 140, justifyContent: 'center' }} aria-live="polite">
            <CalendarRange size={15} /> {title}
          </span>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => move(1)} disabled={isCurrentMonth || from > today} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="kpis">
        <KpiCard label="Sessions recorded" value={list.length} icon={ClipboardList} loading={loading} foot={`Days with saved attendance in ${title}`} />
        <KpiCard label="Average attendance" value={avgRate} suffix="%" icon={Percent} tone="accent" loading={loading} foot="Present ÷ marked, all sessions" />
        <KpiCard label="Present marks" value={totalPresent} icon={UserCheck} tone="present" loading={loading} foot={`Across ${list.length} session${list.length === 1 ? '' : 's'}`} />
        <KpiCard label="Absent marks" value={totalAbsent} icon={UserX} tone="absent" loading={loading} foot={`Across ${list.length} session${list.length === 1 ? '' : 's'}`} />
      </div>

      <div className="stack">
        <section className="card">
          <div className="card-header">
            <div>
              <h2>Daily breakdown</h2>
              <p>Each bar is one saved session. Select a bar to open it.</p>
            </div>
          </div>
          <div className="card-body">
            {error ? (
              <EmptyState icon={SearchX} title="Could not load the report" description={error}>
                <button type="button" className="btn" onClick={() => setReloadKey((k) => k + 1)}>
                  <RotateCcw size={14} /> Try again
                </button>
              </EmptyState>
            ) : !loading && list.length === 0 ? (
              <EmptyState icon={ClipboardList} title={`No attendance in ${title}`} description="Saved sessions for this month will appear here.">
                <button type="button" className="btn" onClick={() => onNavigate('attendance', { date: today })}>
                  Take today’s attendance
                </button>
              </EmptyState>
            ) : (
              <DailyChart
                days={list}
                totalStudents={students.length}
                today={today}
                loading={loading}
                onSelect={(date) => onNavigate('attendance', { date })}
                labelFormat={{ day: 'numeric', month: 'short' }}
              />
            )}
          </div>
        </section>

        {!error && (loading || list.length > 0) && (
          <section className="card">
            <div className="card-header">
              <div>
                <h2>Sessions</h2>
                <p>{title}</p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col" className="num">Present</th>
                    <th scope="col" className="num">Absent</th>
                    <th scope="col" className="num">Rate</th>
                    <th scope="col" className="num"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [0, 1, 2].map((i) => (
                        <tr key={i}>
                          <td><Skeleton width={160} /></td>
                          <td className="num"><Skeleton width={30} style={{ marginLeft: 'auto' }} /></td>
                          <td className="num"><Skeleton width={30} style={{ marginLeft: 'auto' }} /></td>
                          <td className="num"><Skeleton width={40} style={{ marginLeft: 'auto' }} /></td>
                          <td />
                        </tr>
                      ))
                    : [...list].reverse().map((d) => {
                        const marked = d.presentCount + d.absentCount
                        const rate = Math.round((d.presentCount / marked) * 100)
                        return (
                          <tr key={d.date}>
                            <td>{fromIso(d.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long' })}</td>
                            <td className="num tabular" style={{ color: 'var(--present)', fontWeight: 600 }}>{d.presentCount}</td>
                            <td className="num tabular" style={{ color: 'var(--absent)', fontWeight: 600 }}>{d.absentCount}</td>
                            <td className="num tabular">{rate}%</td>
                            <td className="num">
                              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('attendance', { date: d.date })}>
                                Open
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default ReportsPage
