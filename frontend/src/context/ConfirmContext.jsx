import { createContext, useCallback, useContext, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'

const ConfirmContext = createContext(null)

/**
 * confirm({ title, description, confirmLabel, tone }) opens a dialog and resolves to true / false.
 * Used before destructive actions instead of window.confirm.
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setState({ ...options, resolve })
      }),
    [],
  )

  const close = (result) => {
    state?.resolve(result)
    setState(null)
  }

  const tone = state?.tone ?? 'danger'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <Modal
          onClose={() => close(false)}
          role="alertdialog"
          icon={
            <div className={`modal-icon ${tone}`}>
              <TriangleAlert size={18} />
            </div>
          }
          title={state.title}
          description={state.description}
          footer={
            <>
              <button type="button" className="btn" onClick={() => close(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => close(true)}
                data-autofocus
              >
                {state.confirmLabel ?? 'Confirm'}
              </button>
            </>
          }
        />
      )}
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmContext)
