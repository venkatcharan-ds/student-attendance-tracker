import { CalendarCheck, ChartColumn, GraduationCap, LayoutDashboard, Settings, Users } from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'reports', label: 'Reports', icon: ChartColumn },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function Sidebar({ current, onNavigate }) {
  const { students, todaySummary, online } = useData()
  const unmarked = todaySummary
    ? Math.max(todaySummary.totalStudents - todaySummary.presentCount - todaySummary.absentCount, 0)
    : 0

  const counts = { students: students.length, attendance: unmarked || undefined }

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand">
        <span className="brand-mark">
          <GraduationCap size={17} />
        </span>
        <span className="brand-name">Attendly</span>
      </div>

      <div className="nav-label">Workspace</div>
      <nav className="nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#/${id}`}
            className="nav-item"
            aria-current={current === id ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault()
              onNavigate(id)
            }}
          >
            <Icon size={16} />
            {label}
            {counts[id] !== undefined && (
              <span className="nav-count tabular" title={id === 'attendance' ? 'Not marked today' : undefined}>
                {counts[id]}
              </span>
            )}
          </a>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="status-line" role="status">
          <span className={`pulse ${online ? '' : 'down'}`} />
          {online ? 'Connected to API' : 'API unreachable'}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
