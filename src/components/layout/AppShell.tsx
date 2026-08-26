import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, useMenuEncolhido } from './Sidebar'
import { BarraAbas } from './BarraAbas'
import { ModalRoot } from '../../modals/ModalRoot'
import { ModalPrimeiraSenha } from '../../modals/ModalPrimeiraSenha'
import { useAuth } from '../../state/auth'

export function AppShell() {
  const { profile } = useAuth()
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
      {/* o hambúrguer saiu: quem abre a gaveta agora é o "Mais" da barra de
          abas, e ter os dois era o mesmo caminho em dois lugares */}
      <header className="topo-movel">
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
      <BarraAbas aoAbrirMais={() => setGaveta(true)} gavetaAberta={gaveta} />
      <ModalRoot />
      {profile?.senha_provisoria && <ModalPrimeiraSenha />}
    </>
  )
}
