import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface ToastItem {
  id: number
  msg: string
  tone: 'ok' | 'erro'
}

interface ToastCtx {
  toast: (msg: string, tone?: 'ok' | 'erro') => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const toast = useCallback((msg: string, tone: 'ok' | 'erro' = 'ok') => {
    const id = ++seq.current
    setItems((list) => [...list, { id, msg, tone }])
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 100,
        }}
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            style={{
              background: t.tone === 'ok' ? 'var(--chip-green)' : 'var(--chip-soft)',
              border: `1px solid ${t.tone === 'ok' ? 'var(--chip-green-border)' : 'var(--chip-rose-border)'}`,
              color: t.tone === 'ok' ? 'var(--green-dark)' : 'var(--primary-dark)',
              borderRadius: 12,
              padding: '11px 16px',
              fontSize: 13,
              fontWeight: 700,
              boxShadow: '0 10px 26px rgba(59,52,47,.18)',
              maxWidth: 320,
            }}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast fora do ToastProvider')
  return ctx.toast
}
