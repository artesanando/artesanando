import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/auth'
import { Avatar } from '../ui/bits'
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
  { to: '/', label: 'Dashboard', Icon: IconDash },
  { to: '/projetos', label: 'Projetos', Icon: IconProj },
  { to: '/integrantes', label: 'Integrantes', Icon: IconInt },
  { to: '/estoque', label: 'Estoque', Icon: IconEst },
  { to: '/biblioteca', label: 'Biblioteca', Icon: IconBib },
  { to: '/presenca', label: 'Presença', Icon: IconPres },
  { to: '/financeiro', label: 'Financeiro', Icon: IconFin },
]

export function Sidebar() {
  const { profile, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))
  const go = (to: string) => {
    setMenu(false)
    navigate(to)
  }

  return (
    <div className="sidebar">
      <div
        className="h"
        style={{ fontSize: 19, letterSpacing: '-.2px', marginBottom: 28 }}
      >
        Artesanando<span style={{ color: 'var(--primary)' }}>.</span>
      </div>
      <div className="nav-list">
        {ITEMS.map(({ to, label, Icon }) => {
          const on = isActive(to)
          return (
            <div
              key={to}
              className="nav"
              onClick={() => go(to)}
              style={{ color: on ? 'var(--ink)' : 'var(--muted)' }}
            >
              <Icon />
              {label}
              {on && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    marginLeft: 'auto',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
      {menu && (
        <div className="menu">
          <div onClick={() => go('/perfil')}>Meu perfil</div>
          {isAdmin && <div onClick={() => go('/configuracoes')}>Configurações</div>}
          <div
            onClick={() => {
              setMenu(false)
              logout()
            }}
            style={{ borderTop: '1px solid var(--divider)', color: 'var(--accent)' }}
          >
            Sair
          </div>
        </div>
      )}
      <div className="sidebar-user" onClick={() => setMenu((m) => !m)}>
        <Avatar color={profile?.avatar_color ?? 'var(--fill)'} size={32} fontSize={12}>
          {profile ? ini(profile.nome) : '?'}
        </Avatar>
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
        <span style={{ color: 'var(--faint-2)', fontSize: 11 }}>▾</span>
      </div>
    </div>
  )
}
