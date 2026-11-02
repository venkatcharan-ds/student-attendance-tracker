import { useState } from 'react'
import { ArrowUpDown, CalendarCheck, RotateCcw, SearchX, Trash2, UserPlus, Users } from 'lucide-react'
import Dropdown from '../components/ui/Dropdown.jsx'
import { Avatar, EmptyState, SearchInput, Skeleton, StatusBadge } from '../components/ui/Primitives.jsx'
import { useConfirm } from '../context/ConfirmContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { getErrorMessage } from '../services/attendanceService.js'

const SORTS = [
  { value: 'roll', label: 'Roll number' },
  { value: 'name', label: 'Name (A–Z)' },
]

function StudentsPage({ onAddStudent, onNavigate }) {
  const { students, studentsLoading, studentsError, reloadStudents, todaySummary, today, removeStudent } = useData()
  const confirm = useConfirm()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('roll')
  const [removing, setRemoving] = useState(null)

  const statusOf = Object.fromEntries((todaySummary?.records ?? []).map((r) => [r.studentId, r.status]))
  const q = query.trim().toLowerCase()
  const visible = students
    .filter((s) => !q || s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q))
    .sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }),
    )

  const handleRemove = async (s) => {
    const ok = await confirm({
      title: `Remove ${s.name}?`,
      description: `${s.name} (${s.rollNumber}) and every attendance record for this student will be permanently deleted.`,
      confirmLabel: 'Remove student',
      tone: 'danger',
    })
    if (!ok) return
    setRemoving(s.id)
    try {
      await removeStudent(s.id)
      toast.success('Student removed', `${s.name} and their attendance history were deleted.`)
    } catch (err) {
      toast.error('Could not remove student', getErrorMessage(err))
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p>Everyone enrolled in this class, with today’s attendance status.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onAddStudent}>
          <UserPlus size={15} /> Add student
        </button>
      </div>

      <section className="card">
        <div className="toolbar">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by name or roll number" label="Search students" />
          <Dropdown value={sort} onChange={setSort} options={SORTS} label="Sort by" icon={<ArrowUpDown size={14} />} />
        </div>

        {studentsError ? (
          <EmptyState icon={SearchX} title="Could not load students" description={studentsError}>
            <button type="button" className="btn" onClick={reloadStudents}>
              <RotateCcw size={14} /> Try again
            </button>
          </EmptyState>
        ) : studentsLoading ? (
          <div className="table-wrap" aria-label="Loading students">
            <table className="table responsive">
              <tbody>
                {[0, 1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td className="cell-full">
                      <div className="person">
                        <Skeleton width={32} height={32} radius="50%" />
                        <Skeleton width={150} />
                      </div>
                    </td>
                    <td className="cell-hide-sm"><Skeleton width={60} /></td>
                    <td><Skeleton width={80} height={22} radius={999} /></td>
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : students.length === 0 ? (
          <EmptyState icon={Users} title="No students yet" description="Add students by name and roll number. They’ll appear in the attendance register for every date.">
            <button type="button" className="btn btn-primary" onClick={onAddStudent}>
              <UserPlus size={15} /> Add your first student
            </button>
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState icon={SearchX} title="No matching students" description={`Nothing matches “${query.trim()}”.`}>
            <button type="button" className="btn" onClick={() => setQuery('')}>
              Clear search
            </button>
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table responsive">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Roll number</th>
                  <th scope="col">Today</th>
                  <th scope="col" className="num">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s.id} style={{ opacity: removing === s.id ? 0.5 : 1 }}>
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
                      <StatusBadge status={statusOf[s.id]} />
                    </td>
                    <td className="num">
                      <div style={{ display: 'inline-flex', gap: 4 }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm row-action"
                          onClick={() => onNavigate('attendance', { date: today, q: s.rollNumber })}
                          aria-label={`Mark attendance for ${s.name}`}
                        >
                          <CalendarCheck size={14} /> Mark
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm row-action"
                          onClick={() => handleRemove(s)}
                          disabled={removing === s.id}
                          aria-label={`Remove ${s.name}`}
                          title="Remove student"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!studentsLoading && students.length > 0 && (
          <div className="table-foot">
            <span>
              {visible.length} of {students.length} student{students.length > 1 ? 's' : ''}
            </span>
            <span>Sorted by {SORTS.find((x) => x.value === sort).label.toLowerCase()}</span>
          </div>
        )}
      </section>
    </div>
  )
}

export default StudentsPage
