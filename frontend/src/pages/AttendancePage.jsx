import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Filter,
  Info,
  RotateCcw,
  Save,
  SearchX,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import AttendanceSummary from '../components/AttendanceSummary.jsx'
import CalendarPicker from '../components/ui/CalendarPicker.jsx'
import Dropdown from '../components/ui/Dropdown.jsx'
import { Avatar, EmptyState, SearchInput, Skeleton, Spinner, StatusBadge } from '../components/ui/Primitives.jsx'
import { useConfirm } from '../context/ConfirmContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import {
  formatLongDate,
  getAttendance,
  getErrorMessage,
  saveAttendance,
  shiftDate,
  todayIso,
} from '../services/attendanceService.js'

const toMarks = (summary) => Object.fromEntries((summary?.records ?? []).map((r) => [r.studentId, r.status]))

function MarkToggle({ name, value, onChange }) {
  return (
    <div className="mark" data-state={value ? value.toLowerCase() : 'none'} role="radiogroup" aria-label={`Attendance for ${name}`}>
      <span className="mark-thumb" aria-hidden="true" />
      <button type="button" role="radio" aria-checked={value === 'PRESENT'} onClick={() => onChange('PRESENT')}>
        <Check size={14} /> Present
      </button>
      <button type="button" role="radio" aria-checked={value === 'ABSENT'} onClick={() => onChange('ABSENT')}>
        <X size={14} /> Absent
      </button>
    </div>
  )
}

function AttendancePage({ date, initialQuery = '', onDateChange, onAddStudent, registerGuard }) {
  const { students, studentsLoading, attendanceChanged, version } = useData()
  const toast = useToast()
  const confirm = useConfirm()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [marks, setMarks] = useState({})
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState(initialQuery)
  const [filter, setFilter] = useState('ALL')
  const loadedDateRef = useRef(null)
  const summaryRef = useRef(null)
  const today = todayIso()

  useEffect(() => setQuery(initialQuery), [initialQuery])

  const load = useCallback(
    async (ignore = { current: false }) => {
      setLoading(true)
      try {
        const data = await getAttendance(date)
        if (ignore.current) return
        const sameDate = loadedDateRef.current === date
        const prevSaved = toMarks(summaryRef.current)
        const fresh = toMarks(data)
        // Refetch of the same date (e.g. a student was added): keep marks the user has not saved yet
        setMarks((prevMarks) =>
          sameDate
            ? { ...fresh, ...Object.fromEntries(Object.entries(prevMarks).filter(([id, st]) => prevSaved[id] !== st)) }
            : fresh,
        )
        setSummary(data)
        summaryRef.current = data
        loadedDateRef.current = date
        setLoadError(null)
      } catch (err) {
        if (!ignore.current) setLoadError(getErrorMessage(err))
      } finally {
        if (!ignore.current) setLoading(false)
      }
    },
    [date],
  )

  // Fetch the saved records whenever the date changes (or students are added / removed)
  useEffect(() => {
    const ignore = { current: false }
    load(ignore)
    return () => {
      ignore.current = true
    }
  }, [load, version])

  const savedMarks = useMemo(() => toMarks(summary), [summary])
  const changed = students.filter((s) => marks[s.id] && marks[s.id] !== savedMarks[s.id])
  const dirty = changed.length > 0
  const hasSaved = (summary?.records.length ?? 0) > 0

  // Ask before leaving the page or switching date with unsaved marks
  useEffect(() => {
    if (!dirty) {
      registerGuard(null)
      return
    }
    registerGuard(() =>
      confirm({
        title: 'Discard unsaved changes?',
        description: `${changed.length} attendance mark${changed.length > 1 ? 's are' : ' is'} not saved yet. Leaving will discard ${changed.length > 1 ? 'them' : 'it'}.`,
        confirmLabel: 'Discard changes',
        tone: 'warning',
      }),
    )
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty, changed.length, confirm, registerGuard])

  useEffect(() => () => registerGuard(null), [registerGuard])

  const handleSave = useCallback(async () => {
    if (!dirty || saving) return
    setSaving(true)
    try {
      const records = changed.map((s) => ({ studentId: s.id, status: marks[s.id] }))
      const data = await saveAttendance(date, records)
      setSummary(data)
      summaryRef.current = data
      setMarks(toMarks(data))
      await attendanceChanged(data)
      toast.success(
        hasSaved ? 'Attendance updated' : 'Attendance saved',
        `${formatLongDate(date)} · ${data.presentCount} present, ${data.absentCount} absent`,
      )
    } catch (err) {
      toast.error('Could not save attendance', getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }, [dirty, saving, changed, marks, date, attendanceChanged, toast, hasSaved])

  // Ctrl / Cmd + S saves
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handleSave])

  const statusOf = (s) => marks[s.id]
  const counts = {
    ALL: students.length,
    PRESENT: students.filter((s) => statusOf(s) === 'PRESENT').length,
    ABSENT: students.filter((s) => statusOf(s) === 'ABSENT').length,
    NONE: students.filter((s) => !statusOf(s)).length,
  }

  const q = query.trim().toLowerCase()
  const visible = students.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q) && !s.rollNumber.toLowerCase().includes(q)) return false
    if (filter === 'NONE') return !statusOf(s)
    if (filter !== 'ALL') return statusOf(s) === filter
    return true
  })

  const markAll = (status) => setMarks((prev) => ({ ...prev, ...Object.fromEntries(visible.map((s) => [s.id, status])) }))

  const filterOptions = [
    { value: 'ALL', label: 'All students', count: counts.ALL },
    { value: 'PRESENT', label: 'Present', count: counts.PRESENT },
    { value: 'ABSENT', label: 'Absent', count: counts.ABSENT },
    { value: 'NONE', label: 'Not marked', count: counts.NONE },
  ]

  const showSkeleton = studentsLoading || (loading && !summary)
  const marked = students.filter((s) => statusOf(s)).length

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Attendance</h1>
          <p>Mark each student present or absent, then save to the server.</p>
        </div>
        <div className="date-nav" role="group" aria-label="Session date">
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => onDateChange(shiftDate(date, -1))} aria-label="Previous day">
            <ChevronLeft size={16} />
          </button>
          <CalendarPicker value={date} max={today} onChange={onDateChange} refreshKey={version} />
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => onDateChange(shiftDate(date, 1))}
            disabled={date >= today}
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </button>
          <button type="button" className="btn btn-sm" onClick={() => onDateChange(today)} disabled={date === today}>
            Today
          </button>
        </div>
      </div>

      {!showSkeleton && students.length > 0 && (
        <div className={`notice ${hasSaved ? 'saved' : ''}`} role="note">
          {hasSaved ? <CircleCheck size={16} /> : <Info size={16} />}
          <span>
            {hasSaved
              ? `Attendance for ${formatLongDate(date)} is saved (${summary.records.length} of ${summary.totalStudents} students). Changes update the existing records — a student never gets two records for the same date.`
              : `No attendance saved for ${formatLongDate(date)} yet.`}
          </span>
        </div>
      )}

      <div className="grid-2">
        <div className="stack">
          <section className="card" aria-busy={loading}>
            <div className="card-header">
              <div>
                <h2>Class register</h2>
                <p>{formatLongDate(date)}</p>
              </div>
              {students.length > 0 && (
                <div className="header-actions">
                  <button type="button" className="btn btn-sm" onClick={() => markAll('PRESENT')} disabled={visible.length === 0}>
                    <Check size={14} /> Mark {q || filter !== 'ALL' ? 'shown' : 'all'} present
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => markAll('ABSENT')} disabled={visible.length === 0}>
                    <X size={14} /> Mark {q || filter !== 'ALL' ? 'shown' : 'all'} absent
                  </button>
                </div>
              )}
            </div>

            {students.length > 0 && (
              <div className="toolbar">
                <SearchInput value={query} onChange={setQuery} placeholder="Search by name or roll number" label="Search students" />
                <Dropdown value={filter} onChange={setFilter} options={filterOptions} label="Filter by status" icon={<Filter size={14} />} />
              </div>
            )}

            {loadError ? (
              <EmptyState icon={SearchX} title="Could not load attendance" description={loadError}>
                <button type="button" className="btn" onClick={() => load()}>
                  <RotateCcw size={14} /> Try again
                </button>
              </EmptyState>
            ) : showSkeleton ? (
              <div className="table-wrap" aria-label="Loading students">
                <table className="table responsive">
                  <tbody>
                    {[0, 1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td className="cell-full">
                          <div className="person">
                            <Skeleton width={32} height={32} radius="50%" />
                            <Skeleton width={140} />
                          </div>
                        </td>
                        <td className="cell-hide-sm"><Skeleton width={50} /></td>
                        <td><Skeleton width={80} height={22} radius={999} /></td>
                        <td><Skeleton width={196} height={36} radius={8} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : students.length === 0 ? (
              <EmptyState icon={Users} title="No students yet" description="Add your first student to start taking attendance.">
                <button type="button" className="btn btn-primary" onClick={onAddStudent}>
                  <UserPlus size={15} /> Add student
                </button>
              </EmptyState>
            ) : visible.length === 0 ? (
              <EmptyState icon={SearchX} title="No matching students" description="Try a different name or roll number, or clear the status filter.">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setQuery('')
                    setFilter('ALL')
                  }}
                >
                  Clear filters
                </button>
              </EmptyState>
            ) : (
              <div className="table-wrap">
                <table className="table responsive">
                  <thead>
                    <tr>
                      <th scope="col">Student</th>
                      <th scope="col">Roll no.</th>
                      <th scope="col">Status</th>
                      <th scope="col">Mark attendance</th>
                    </tr>
                  </thead>
                  <tbody style={{ opacity: loading ? 0.55 : 1, transition: 'opacity .15s' }}>
                    {visible.map((s) => {
                      const unsaved = Boolean(marks[s.id] && marks[s.id] !== savedMarks[s.id])
                      return (
                        <tr key={s.id} className={unsaved ? 'is-dirty' : ''}>
                          <td className="cell-full">
                            <div className="person">
                              <Avatar name={s.name} seed={s.rollNumber} />
                              <div style={{ minWidth: 0 }}>
                                <strong>{s.name}</strong>
                                <small className="mono">{s.rollNumber}</small>
                              </div>
                            </div>
                          </td>
                          <td className="cell-hide-sm">
                            <span className="mono">{s.rollNumber}</span>
                          </td>
                          <td>
                            <StatusBadge status={marks[s.id]} unsaved={unsaved} />
                          </td>
                          <td>
                            <MarkToggle name={s.name} value={marks[s.id]} onChange={(st) => setMarks((p) => ({ ...p, [s.id]: st }))} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!showSkeleton && students.length > 0 && (
              <div className="table-foot">
                <span>
                  Showing {visible.length} of {students.length} students
                </span>
                <span className="tabular">
                  {marked} / {students.length} marked
                </span>
              </div>
            )}
          </section>

          {students.length > 0 && !showSkeleton && (
            <div className="action-bar" role="region" aria-label="Save attendance">
              <div className="status" aria-live="polite">
                <span className={`dirty-dot ${dirty ? '' : 'clean'}`} />
                {dirty ? (
                  <span>
                    <strong>{changed.length}</strong> unsaved change{changed.length > 1 ? 's' : ''}
                  </span>
                ) : hasSaved ? (
                  <span>All changes saved</span>
                ) : (
                  <span>Mark students to begin</span>
                )}
              </div>
              <div className="actions">
                {dirty && (
                  <button type="button" className="btn" onClick={() => setMarks(savedMarks)} disabled={saving}>
                    <RotateCcw size={14} /> Discard
                  </button>
                )}
                <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!dirty || saving} title="Ctrl + S">
                  {saving ? <Spinner /> : <Save size={15} />}
                  {saving ? 'Saving…' : hasSaved ? 'Update attendance' : 'Save attendance'}
                </button>
              </div>
            </div>
          )}
        </div>

        <AttendanceSummary
          summary={summary}
          loading={showSkeleton}
          title="Saved summary"
          subtitle={`Stored records for ${formatLongDate(date)}`}
        />
      </div>
    </div>
  )
}

export default AttendancePage
