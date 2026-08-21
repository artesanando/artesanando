import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, useMenuEncolhido } from './Sidebar'
import { ModalRoot } from '../../modals/ModalRoot'
import { IconMenu } from '../ui/icons'

export function AppShell() {
  const [encolhido, alternarEncolhido] = useMenuEncolhido()
  const [gaveta, setGaveta] = useState(false)
  const { pathname } = useLocation()

  // no celular a gaveta some ao trocar de tela e no Esc
  useEffect(() => setGaveta(false), [pathname])
  useEffect(() => {
    if (!gaveta) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setGaveta(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [gaveta])

  return (
    <>
      <header className="topo-movel">
        <button
          type="button"
          className="hamburguer"
          aria-label="Abrir menu"
          aria-expanded={gaveta}
          onClick={() => setGaveta(true)}
        >
          <IconMenu />
        </button>
        <span className="h" style={{ fontSize: 17 }}>
          Artesanando<span style={{ color: 'var(--primary)' }}>.</span>
        </span>
      </header>

      <div className={`shell${gaveta ? ' gaveta-aberta' : ''}`}>
        <Sidebar
          encolhido={encolhido}
          aoAlternar={alternarEncolhido}
          aoNavegar={() => setGaveta(false)}
        />
        {gaveta && (
          <div
            className="gaveta-fundo"
            onClick={() => setGaveta(false)}
            aria-hidden="true"
          />
        )}
        <main style={{ flex: 1, minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
      <ModalRoot />
    </>
  )
}
