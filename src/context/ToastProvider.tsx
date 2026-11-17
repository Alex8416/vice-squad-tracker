import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { errorMessage } from '../lib/format'
import NeonToast from '../components/NeonToast'

export type ToastVariant = 'passed' | 'wasted' | 'info' | 'error'
export interface Toast {
  id: number
  variant: ToastVariant
  title: string
  text?: string
}

interface ToastApi {
  show: (variant: ToastVariant, title: string, text?: string) => void
  error: (e: unknown, title?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const show = useCallback(
    (variant: ToastVariant, title: string, text?: string) => {
      const id = nextId.current++
      setToasts((t) => [...t.slice(-3), { id, variant, title, text }])
      window.setTimeout(() => dismiss(id), variant === 'error' ? 6000 : 3500)
    },
    [dismiss],
  )

  const error = useCallback(
    (e: unknown, title = 'FEHLER') => {
      console.error(e)
      show('error', title, errorMessage(e))
    },
    [show],
  )

  const api = useMemo(() => ({ show, error }), [show, error])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-3 px-4" aria-live="polite">
        {toasts.map((t) => (
          <NeonToast key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast muss innerhalb von ToastProvider genutzt werden')
  return ctx
}
