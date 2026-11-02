import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// All calls go to the Spring Boot backend
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const getStudents = () => api.get('/students').then((res) => res.data)

export const addStudent = (student) => api.post('/students', student).then((res) => res.data)

export const deleteStudent = (id) => api.delete(`/students/${id}`)

// Returns { date, records, presentCount, absentCount, totalStudents }
export const getAttendance = (date) => api.get('/attendance', { params: { date } }).then((res) => res.data)

// Returns [{ date, presentCount, absentCount }] for dates in the range that have saved attendance
export const getDays = (from, to) => api.get('/attendance/days', { params: { from, to } }).then((res) => res.data)

// records: [{ studentId, status: 'PRESENT' | 'ABSENT' }]
export const saveAttendance = (date, records) =>
  api.post('/attendance', { date, records }).then((res) => res.data)

// Turns an Axios error into a readable message for the user
export const getErrorMessage = (error) => {
  if (!error.response) {
    return 'Cannot connect to the server. Make sure the backend is running on port 8080.'
  }
  return error.response.data?.message || `Request failed (${error.response.status})`
}

export const toIso = (d) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Parses yyyy-MM-dd as a local date (new Date('yyyy-MM-dd') would be UTC)
export const fromIso = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Today's date as yyyy-MM-dd in the user's local time zone
export const todayIso = () => toIso(new Date())

export const shiftDate = (iso, days) => {
  const d = fromIso(iso)
  d.setDate(d.getDate() + days)
  return toIso(d)
}

// e.g. "Monday, 2 November 2026"
export const formatLongDate = (iso) =>
  fromIso(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
