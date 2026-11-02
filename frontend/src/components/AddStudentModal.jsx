import { useState } from 'react'
import { CircleAlert, UserPlus } from 'lucide-react'
import Modal from './ui/Modal.jsx'
import { Spinner } from './ui/Primitives.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { getErrorMessage } from '../services/attendanceService.js'

const ROLL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9/_-]*$/

// Client-side checks mirror the backend rules (required, max length, unique roll number)
const validate = ({ name, rollNumber }, students) => {
  const errors = {}
  const n = name.trim()
  const r = rollNumber.trim()
  if (!n) errors.name = 'Student name is required.'
  else if (n.length < 2) errors.name = 'Name must be at least 2 characters.'
  else if (n.length > 100) errors.name = 'Name must be at most 100 characters.'

  if (!r) errors.rollNumber = 'Roll number is required.'
  else if (r.length > 30) errors.rollNumber = 'Roll number must be at most 30 characters.'
  else if (!ROLL_PATTERN.test(r)) errors.rollNumber = 'Use letters, numbers, "-", "_" or "/" only.'
  else if (students.some((s) => s.rollNumber.toLowerCase() === r.toLowerCase()))
    errors.rollNumber = `Roll number ${r} is already taken.`
  return errors
}

function AddStudentModal({ onClose }) {
  const { students, addStudent } = useData()
  const toast = useToast()
  const [values, setValues] = useState({ name: '', rollNumber: '' })
  const [touched, setTouched] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)

  const errors = validate(values, students)
  const show = (field) => touched[field] && errors[field]

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, rollNumber: true })
    if (Object.keys(errors).length > 0) return
    setSaving(true)
    try {
      const created = await addStudent({ name: values.name.trim(), rollNumber: values.rollNumber.trim() })
      toast.success('Student added', `${created.name} (${created.rollNumber}) can now be marked.`)
      onClose()
    } catch (err) {
      setServerError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      as="form"
      onSubmit={handleSubmit}
      onClose={onClose}
      icon={
        <div className="modal-icon">
          <UserPlus size={17} />
        </div>
      }
      title="Add student"
      description="The student will appear in the attendance list for every date."
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Spinner /> : <UserPlus size={15} />}
            {saving ? 'Adding…' : 'Add student'}
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="student-name">Student name</label>
        <input
          id="student-name"
          className="input"
          value={values.name}
          onChange={set('name')}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          placeholder="e.g. Anu Sharma"
          maxLength={100}
          autoComplete="off"
          aria-invalid={Boolean(show('name'))}
          aria-describedby={show('name') ? 'student-name-err' : undefined}
          data-autofocus
        />
        {show('name') && (
          <span className="field-error" id="student-name-err">
            <CircleAlert size={13} /> {errors.name}
          </span>
        )}
      </div>
      <div className="field">
        <label htmlFor="student-roll">Roll number</label>
        <input
          id="student-roll"
          className="input mono"
          value={values.rollNumber}
          onChange={set('rollNumber')}
          onBlur={() => setTouched((t) => ({ ...t, rollNumber: true }))}
          placeholder="e.g. R04"
          maxLength={30}
          autoComplete="off"
          aria-invalid={Boolean(show('rollNumber'))}
          aria-describedby={show('rollNumber') ? 'student-roll-err' : 'student-roll-hint'}
        />
        {show('rollNumber') ? (
          <span className="field-error" id="student-roll-err">
            <CircleAlert size={13} /> {errors.rollNumber}
          </span>
        ) : (
          <span className="field-hint" id="student-roll-hint">
            Must be unique. Letters, numbers, "-", "_" or "/".
          </span>
        )}
      </div>
      {serverError && (
        <span className="field-error" role="alert">
          <CircleAlert size={13} /> {serverError}
        </span>
      )}
    </Modal>
  )
}

export default AddStudentModal
