import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../services/attendanceService.js'

const DataContext = createContext(null)

/**
 * Shared server state: the student list and today's attendance summary.
 * Everything is loaded from the Spring Boot API; `version` increases after every
 * write so pages that show derived data (charts, reports) know to refetch.
 */
export function DataProvider({ children }) {
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState(null)
  const [today, setToday] = useState(api.todayIso())
  const [todaySummary, setTodaySummary] = useState(null)
  const [todayLoading, setTodayLoading] = useState(true)
  const [online, setOnline] = useState(true)
  const [version, setVersion] = useState(0)

  const reloadStudents = useCallback(async () => {
    setStudentsLoading(true)
    try {
      setStudents(await api.getStudents())
      setStudentsError(null)
      setOnline(true)
    } catch (err) {
      setStudentsError(api.getErrorMessage(err))
      if (!err.response) setOnline(false)
    } finally {
      setStudentsLoading(false)
    }
  }, [])

  const reloadToday = useCallback(async () => {
    const date = api.todayIso()
    setToday(date)
    try {
      setTodaySummary(await api.getAttendance(date))
      setOnline(true)
    } catch (err) {
      if (!err.response) setOnline(false)
    } finally {
      setTodayLoading(false)
    }
  }, [])

  useEffect(() => {
    reloadStudents()
    reloadToday()
  }, [reloadStudents, reloadToday])

  const addStudent = useCallback(
    async (student) => {
      const created = await api.addStudent(student)
      setStudents((prev) => [...prev, created].sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true })))
      await reloadToday()
      setVersion((v) => v + 1)
      return created
    },
    [reloadToday],
  )

  const removeStudent = useCallback(
    async (id) => {
      await api.deleteStudent(id)
      setStudents((prev) => prev.filter((s) => s.id !== id))
      await reloadToday()
      setVersion((v) => v + 1)
    },
    [reloadToday],
  )

  // Called by the attendance page after a successful save so the dashboard refreshes
  const attendanceChanged = useCallback(
    async (summary) => {
      if (summary.date === api.todayIso()) {
        setTodaySummary(summary)
      } else {
        await reloadToday()
      }
      setVersion((v) => v + 1)
    },
    [reloadToday],
  )

  const value = useMemo(
    () => ({
      students,
      studentsLoading,
      studentsError,
      reloadStudents,
      today,
      todaySummary,
      todayLoading,
      reloadToday,
      online,
      version,
      addStudent,
      removeStudent,
      attendanceChanged,
    }),
    [students, studentsLoading, studentsError, reloadStudents, today, todaySummary, todayLoading, reloadToday, online, version, addStudent, removeStudent, attendanceChanged],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)
