import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/auth'
import { Avatar } from '../ui/bits'
import { Dica, MenuKebab } from '../ui/controles'
import { PAPEL_LABEL } from '../../types/database'
import { ini } from '../../lib/format'
import {
  IconBib,
  IconDash,
  IconEst,
  IconFin,
  IconInt,
  IconPres,
  IconProj,
} from '../ui/icons'

const ITEMS = [
  { to: '/', label: 'Início', Icon: IconDash },
  { to: '/projetos', label: 'Projetos', Icon: IconProj },
  { to: '/integrantes', label: 'Integrantes', Icon: IconInt },
  { to: '/estoque', label: 'Estoque', Icon: IconEst },
  { to: '/biblioteca', label: 'Biblioteca', Icon: IconBib },
  { to: '/presenca', label: 'Presença', Icon: IconPres },
  { to: '/financeiro', label: 'Financeiro', Icon: IconFin },
]

const CHAVE = 'artesanando:menu-encolhido'

export function useMenuEncolhido() {
  const [encolhido, setEncolhido] = useState(
    () => localStorage.getItem(CHAVE) === '1',
  )
  useEffect(() => {
    localStorage.setItem(CHAVE, encolhido ? '1' : '0')
  }, [encolhido])
  return [encolhido, () => setEncolhido((e) => !e)] as const
}

export function Sidebar({
  encolhido,
  aoAlternar,
  aoNavegar,
}: {
  encolhido: boolean
  aoAlternar: () => void
  /** no celular, navegar fecha a gaveta */
  aoNavegar?: () => void
}) {
  const { profile, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))
  const go = (to: string) => {
    navigate(to)
    aoNavegar?.()
  }

  return (
    <nav className={`sidebar${encolhido ? ' encolhida' : ''}`} aria-label="Navegação principal">
      <div className="sidebar-marca h">
        {encolhido ? (
          <span style={{ color: 'var(--primary)' }}>A.</span>
        ) : (
          <>
            Artesanando<span style={{ color: 'var(--primary)' }}>.</span>
          </>
        )}
      </div>

      <div className="nav-list">
        {ITEMS.map(({ to, label, Icon }) => {
          const on = isActive(to)
          const botao = (
            <button
              type="button"
              className="nav"
              onClick={() => go(to)}
              aria-current={on ? 'page' : undefined}
              aria-label={encolhido ? label : undefined}
              style={{ color: on ? 'var(--ink)' : 'var(--muted)' }}
            >
              <Icon />
              {!encolhido && label}
              {on && <span className="nav-marca" />}
            </button>
          )
          return (
            <div key={to}>
              {encolhido ? <Dica texto={label}>{botao}</Dica> : botao}
            </div>
          )
        })}
      </div>

      <div className="sidebar-user">
        <Avatar
          color={profile?.avatar_color ?? 'var(--fill)'}
          src={profile?.avatar_url}
          alt=""
          size={32}
          fontSize={12}
        >
          {profile ? ini(profile.nome) : '?'}
        </Avatar>
        {!encolhido && (
          <div style={{ lineHeight: 1.25, flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 12.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {profile?.nome ?? '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {profile ? PAPEL_LABEL[profile.papel] : ''}
            </div>
          </div>
        )}
        <MenuKebab
          ariaLabel="Menu da conta"
          acoes={[
            { label: 'Meu perfil', onSelect: () => go('/perfil') },
            ...(isAdmin
              ? [{ label: 'Configurações', onSelect: () => go('/configuracoes') }]
              : []),
            { label: 'Sair', onSelect: () => void logout(), perigo: true },
          ]}
        />
      </div>

      <button
        type="button"
        className="sidebar-encolher"
        onClick={aoAlternar}
        aria-label={encolhido ? 'Expandir menu' : 'Encolher menu'}
        aria-pressed={encolhido}
      >
        {encolhido ? '›' : '‹ Encolher'}
      </button>
    </nav>
  )
}
