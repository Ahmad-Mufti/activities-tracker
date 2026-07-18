import { createContext, useCallback, useContext, useRef, useState } from 'react'
import Modal from '../components/Modal'

const ConfirmContext = createContext(undefined)

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null) // null = tertutup, {} = sedang menunggu jawaban
  const resolveRef = useRef(null)

  const confirm = useCallback((options) => {
    setRequest(typeof options === 'string' ? { message: options } : options)
    return new Promise((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  function answer(result) {
    setRequest(null)
    resolveRef.current?.(result)
    resolveRef.current = null
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <Modal title={request.title ?? 'Konfirmasi'} onClose={() => answer(false)}>
          <p className="text-sm text-gray-600">{request.message}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => answer(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              {request.cancelLabel ?? 'Batal'}
            </button>
            <button
              type="button"
              onClick={() => answer(true)}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                request.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {request.confirmLabel ?? 'Ya, Lanjutkan'}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (ctx === undefined) {
    throw new Error('useConfirm harus dipakai di dalam <ConfirmProvider>')
  }
  return ctx
}
