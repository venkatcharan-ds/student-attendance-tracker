import { useState } from 'react'
import { Monitor, Moon, PlugZap, Sun } from 'lucide-react'
import { Segmented, Spinner } from '../components/ui/Primitives.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { API_BASE_URL, getErrorMessage, getStudents } from '../services/attendanceService.js'

function SettingsPage({ theme, onTheme, profile, onProfile }) {
  const { reloadStudents, reloadToday } = useData()
  const toast = useToast()
  const [testing, setTesting] = useState(false)
  const [draft, setDraft] = useState(profile)

  const testConnection = async () => {
    setTesting(true)
    const started = performance.now()
    try {
      const list = await getStudents()
      const ms = Math.round(performance.now() - started)
      toast.success('API is reachable', `${list.length} students returned in ${ms} ms`)
      reloadStudents()
      reloadToday()
    } catch (err) {
      toast.error('API is not reachable', getErrorMessage(err))
    } finally {
      setTesting(false)
    }
  }

  const saveProfile = (e) => {
    e.preventDefault()
    const name = draft.name.trim()
    if (!name) {
      toast.error('Display name is required')
      return
    }
    onProfile({ name, role: draft.role.trim() || 'Trainer' })
    toast.success('Profile updated')
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Preferences are stored in this browser only.</p>
        </div>
      </div>

      <div className="settings">
        <section className="card">
          <div className="card-header">
            <h2>Appearance</h2>
          </div>
          <div className="setting-row">
            <div>
              <h3>Theme</h3>
              <p>System follows your operating system setting.</p>
            </div>
            <Segmented
              label="Theme"
              value={theme}
              onChange={onTheme}
              options={[
                { value: 'system', label: 'System', icon: <Monitor size={14} /> },
                { value: 'light', label: 'Light', icon: <Sun size={14} /> },
                { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
              ]}
            />
          </div>
        </section>

        <form className="card" onSubmit={saveProfile} noValidate>
          <div className="card-header">
            <h2>Profile</h2>
            <button type="submit" className="btn btn-sm btn-primary" disabled={draft.name === profile.name && draft.role === profile.role}>
              Save profile
            </button>
          </div>
          <div className="setting-row">
            <div>
              <h3>Display name</h3>
              <p>Shown in the top bar and dashboard greeting.</p>
            </div>
            <input
              className="input"
              aria-label="Display name"
              value={draft.name}
              maxLength={60}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <div className="setting-row">
            <div>
              <h3>Role</h3>
              <p>For example Trainer or Class teacher.</p>
            </div>
            <input
              className="input"
              aria-label="Role"
              value={draft.role}
              maxLength={40}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
            />
          </div>
        </form>

        <section className="card">
          <div className="card-header">
            <h2>Backend</h2>
          </div>
          <div className="setting-row">
            <div>
              <h3>API base URL</h3>
              <p>
                Set with <code>VITE_API_BASE_URL</code> in <code>frontend/.env</code>.
              </p>
            </div>
            <code className="mono">{API_BASE_URL}</code>
          </div>
          <div className="setting-row">
            <div>
              <h3>Connection</h3>
              <p>Calls the Spring Boot API and reloads the data.</p>
            </div>
            <button type="button" className="btn" onClick={testConnection} disabled={testing}>
              {testing ? <Spinner /> : <PlugZap size={15} />} Test connection
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default SettingsPage
