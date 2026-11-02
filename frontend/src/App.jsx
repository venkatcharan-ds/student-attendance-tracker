import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar, { NAV_ITEMS } from './components/layout/Sidebar.jsx'
import Topbar from './components/layout/Topbar.jsx'
import AddStudentModal from './components/AddStudentModal.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import StudentsPage from './pages/StudentsPage.jsx'
import AttendancePage from './pages/AttendancePage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import { todayIso } from './services/attendanceService.js'

const VIEWS = NAV_ITEMS.map((n) => n.id)
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// Routes live in the URL hash, e.g. #/attendance?date=2026-11-02&q=R01
const parseHash = () => {
  const [path, search = ''] = window.location.hash.replace(/^#\/?/, '').split('?')
  const params = Object.fromEntries(new URLSearchParams(search))
  const view = VIEWS.includes(path) ? path : 'dashboard'
  if (params.date && (!ISO_DATE.test(params.date) || params.date > todayIso())) delete params.date
  return { view, params }
}

const buildHash = (view, params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
  return `#/${view}${qs ? `?${qs}` : ''}`
}

// Per-browser preferences (theme, profile). Storage can be unavailable, so every access is guarded.
const readPref = (key, fallback) => {
  try {
    const raw = localStorage.getItem(`attendly.${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const writePref = (key, value) => {
  try {
    localStorage.setItem(`attendly.${key}`, JSON.stringify(value))
  } catch {
    // ignore - preferences just won't persist
  }
}

function App() {
  const [route, setRoute] = useState(parseHash)
  const [navOpen, setNavOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [theme, setTheme] = useState(() => readPref('theme', 'system'))
  const [profile, setProfile] = useState(() => readPref('profile', { name: 'Class Trainer', role: 'Trainer' }))
  const guardRef = useRef(null)

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (theme === 'system') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', theme)
    writePref('theme', theme)
  }, [theme])

  useEffect(() => writePref('profile', profile), [profile])

  const title = NAV_ITEMS.find((n) => n.id === route.view)?.label ?? 'Dashboard'

  useEffect(() => {
    document.title = `${title} · Attendly`
  }, [title])

  const registerGuard = useCallback((fn) => {
    guardRef.current = fn
  }, [])

  // Every in-app navigation goes through here so unsaved attendance is never lost silently
  const navigate = useCallback(async (view, params = {}) => {
    const next = buildHash(view, params)
    if (next === window.location.hash) {
      setNavOpen(false)
      return
    }
    if (guardRef.current && !(await guardRef.current())) return
    guardRef.current = null
    window.location.hash = next
    setNavOpen(false)
    window.scrollTo({ top: 0 })
  }, [])

  const openAdd = () => setAddOpen(true)
  const { view, params } = route
  const attendanceDate = params.date || todayIso()

  return (
    <div className={`shell ${navOpen ? 'nav-open' : ''}`}>
      <Sidebar current={view} onNavigate={navigate} />
      <div className="backdrop" onClick={() => setNavOpen(false)} aria-hidden="true" />

      <div className="content">
        <Topbar
          title={title}
          onMenu={() => setNavOpen(true)}
          onNavigate={navigate}
          onPickStudent={(s) => navigate('attendance', { date: attendanceDate, q: s.rollNumber })}
          profile={profile}
          theme={theme}
          onTheme={setTheme}
        />

        <main id="main">
          {view === 'dashboard' && <DashboardPage onNavigate={navigate} onAddStudent={openAdd} profileName={profile.name} />}
          {view === 'students' && <StudentsPage onNavigate={navigate} onAddStudent={openAdd} />}
          {view === 'attendance' && (
            <AttendancePage
              date={attendanceDate}
              initialQuery={params.q ?? ''}
              onDateChange={(date) => navigate('attendance', { date, q: params.q })}
              onAddStudent={openAdd}
              registerGuard={registerGuard}
            />
          )}
          {view === 'reports' && <ReportsPage onNavigate={navigate} />}
          {view === 'settings' && <SettingsPage theme={theme} onTheme={setTheme} profile={profile} onProfile={setProfile} />}
        </main>
      </div>

      {addOpen && <AddStudentModal onClose={() => setAddOpen(false)} />}
    </div>
  )
}

export default App
