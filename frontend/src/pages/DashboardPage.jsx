import { useEffect, useState } from 'react'
import { ArrowRight, CalendarCheck, Percent, UserCheck, UserPlus, Users, UserX } from 'lucide-react'
import AttendanceSummary from '../components/AttendanceSummary.jsx'
import DailyChart from '../components/DailyChart.jsx'
import KpiCard from '../components/KpiCard.jsx'
import { Avatar, EmptyState, Skeleton } from '../components/ui/Primitives.jsx'
import { useData } from '../context/DataContext.jsx'
import { formatLongDate, getDays, shiftDate } from '../services/attendanceService.js'

const rateOf = (p, a) => (p + a === 0 ? null : Math.round((p / (p + a)) * 100))

function DashboardPage({ onNavigate, onAddStudent, profileName }) {
  const { students, studentsLoading, today, todaySummary, todayLoading, version } = useData()
  const [days, setDays] = useState(null)

  // Last 30 days of saved sessions: drives the 7-day chart and "vs previous session" trends
  useEffect(() => {
    let ignore = false
    getDays(shiftDate(today, -30), today)
      .then((list) => !ignore && setDays(list))
      .catch(() => !ignore && setDays([]))
    return () => {
      ignore = true
    }
  }, [today, version])

  const present = todaySummary?.presentCount ?? 0
  const absent = todaySummary?.absentCount ?? 0
  const total = todaySummary?.totalStudents ?? students.length
  const rate = rateOf(present, absent)
  const marked = present + absent

  const previous = (days ?? []).filter((d) => d.date < today).at(-1)
  const prevRate = previous ? rateOf(previous.presentCount, previous.absentCount) : null
  const vsLabel = previous
    ? `vs ${new Date(previous.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}`
    : 'No earlier session'

  const byDate = Object.fromEntries((days ?? []).map((d) => [d.date, d]))
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDate(today, i - 6)
    return byDate[date] ?? { date, presentCount: 0, absentCount: 0 }
  })

  const absentToday = (todaySummary?.records ?? []).filter((r) => r.status === 'ABSENT')
  const notMarked = Math.max(total - marked, 0)
  const loading = todayLoading || studentsLoading
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            {greeting}, {profileName.split(' ')[0]}
          </h1>
          <p>Here’s how attendance looks for {formatLongDate(today)}.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={onAddStudent}>
            <UserPlus size={15} /> Add student
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('attendance', { date: today })}>
            <CalendarCheck size={15} /> Take attendance
          </button>
        </div>
      </div>

      <div className="kpis">
        <KpiCard label="Total students" value={students.length} icon={Users} loading={studentsLoading} foot="Enrolled in this class" />
        <KpiCard
          label="Present today"
          value={present}
          icon={UserCheck}
          tone="present"
          loading={loading}
          delta={previous && marked ? present - previous.presentCount : undefined}
          foot={marked ? vsLabel : 'Not taken yet'}
        />
        <KpiCard
          label="Absent today"
          value={absent}
          icon={UserX}
          tone="absent"
          loading={loading}
          delta={previous && marked ? absent - previous.absentCount : undefined}
          deltaGood={false}
          foot={marked ? vsLabel : 'Not taken yet'}
        />
        <KpiCard
          label="Attendance rate"
          value={rate}
          suffix="%"
          icon={Percent}
          tone="accent"
          loading={loading}
          delta={rate !== null && prevRate !== null ? rate - prevRate : undefined}
          foot={rate === null ? 'No marks saved today' : `${marked} of ${total} marked · ${vsLabel}`}
        />
      </div>

      <div className="grid-2">
        <div className="stack">
          <section className="card">
            <div className="card-header">
              <div>
                <h2>Last 7 days</h2>
                <p>Saved attendance per day. Select a bar to open that date.</p>
              </div>
              <div className="legend">
                <span>
                  <span className="dot present" style={{ width: 8, height: 8, borderRadius: 2, display: 'inline-block' }} /> Present
                </span>
                <span>
                  <span className="dot absent" style={{ width: 8, height: 8, borderRadius: 2, display: 'inline-block' }} /> Absent
                </span>
              </div>
            </div>
            <div className="card-body">
              <DailyChart
                days={week}
                totalStudents={students.length}
                today={today}
                loading={days === null}
                onSelect={(date) => onNavigate('attendance', { date })}
              />
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h2>Needs attention</h2>
                <p>Absent or not yet marked today</p>
              </div>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => onNavigate('attendance', { date: today })}>
                Open register <ArrowRight size={14} />
              </button>
            </div>
            {loading ? (
              <div className="card-body">
                <Skeleton height={14} />
                <Skeleton height={14} width="70%" style={{ marginTop: 12 }} />
              </div>
            ) : students.length === 0 ? (
              <EmptyState icon={Users} title="No students yet" description="Add students to start tracking attendance.">
                <button type="button" className="btn btn-primary" onClick={onAddStudent}>
                  <UserPlus size={15} /> Add student
                </button>
              </EmptyState>
            ) : absentToday.length === 0 && notMarked === 0 ? (
              <EmptyState icon={UserCheck} title="Everyone is present" description="All students are marked present for today." />
            ) : (
              <ul className="list">
                {notMarked > 0 && (
                  <li>
                    <span className="kpi-icon" style={{ width: 32, height: 32 }}>
                      <CalendarCheck size={15} />
                    </span>
                    <div className="grow">
                      <strong style={{ fontWeight: 500 }}>
                        {notMarked} student{notMarked > 1 ? 's' : ''} not marked
                      </strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Attendance for today is incomplete</div>
                    </div>
                    <button type="button" className="btn btn-sm" onClick={() => onNavigate('attendance', { date: today })}>
                      Mark now
                    </button>
                  </li>
                )}
                {absentToday.map((r) => (
                  <li key={r.id}>
                    <Avatar name={r.name} seed={r.rollNumber} />
                    <div className="grow">
                      <strong style={{ fontWeight: 500 }}>{r.name}</strong>
                      <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                        {r.rollNumber}
                      </div>
                    </div>
                    <span className="badge absent">
                      <span className="badge-dot" /> Absent
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <AttendanceSummary summary={todaySummary} loading={loading} title="Today’s summary" subtitle={formatLongDate(today)} />
      </div>
    </div>
  )
}

export default DashboardPage
