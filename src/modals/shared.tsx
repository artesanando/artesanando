import type { ReactNode } from 'react'
import { useStore } from '../state/store'

export function ModalHeader({ title, sub }: { title: string; sub: string }) {
  const { close } = useStore()
  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <div className="h" style={{ fontSize: 22 }}>
          {title}
        </div>
        <button className="x" onClick={close}>
          ×
        </button>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 }}>{sub}</div>
    </>
  )
}

export function ModalFooter({ okLabel, cancelLabel }: { okLabel: string; cancelLabel?: string }) {
  const { close } = useStore()
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <button className="pill ghost" onClick={close}>
        {cancelLabel || 'Cancelar'}
      </button>
      <button className="pill" onClick={close}>
        {okLabel}
      </button>
    </div>
  )
}

export function ModalBox({
  maxWidth,
  children,
  noPadding,
}: {
  maxWidth: number
  children: ReactNode
  noPadding?: boolean
}) {
  return (
    <div
      className="modal"
      style={{ maxWidth, ...(noPadding ? { padding: 0, overflow: 'hidden' } : {}) }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}
