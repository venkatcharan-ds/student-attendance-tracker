import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
const DURATION = 4000
const MAX_TOASTS = 3

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }

// Stacked toast notifications: toast.success(title, description), toast.error(...), toast.info(...)
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 180)
  }, [])

  const push = useCallback(
    (type, title, description) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((list) => [...list.slice(-(MAX_TOASTS - 1)), { id, type, title, description }])
      timers.current[id] = setTimeout(() => dismiss(id), DURATION)
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      success: (title, description) => push('success', title, description),
      error: (title, description) => push('error', title, description),
      info: (title, description) => push('info', title, description),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toaster" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => {
          const Icon = ICONS[t.type]
          return (
            <div key={t.id} className={`toast ${t.type} ${t.leaving ? 'leaving' : ''}`} role={t.type === 'error' ? 'alert' : 'status'}>
              <Icon size={18} className="toast-icon" aria-hidden="true" />
              <div className="toast-text">
                <strong>{t.title}</strong>
                {t.description && <span>{t.description}</span>}
              </div>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                <X size={14} />
              </button>
              <span className="toast-timer" style={{ animationDuration: `${DURATION}ms` }} />
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
