import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/auth'
import { IconMenu } from '../ui/icons'
import { ITEMS } from './Sidebar'

/* As quatro telas do encontro, na ordem em que se usa: chegar, ver o que tem
   para fazer, marcar a chamada, olhar as fotos. O resto do menu vive no "Mais",
   que abre a mesma gaveta do computador — no celular a navegação principal fica
   embaixo, ao alcance do polegar, e não escondida atrás de um hambúrguer. */
const PRINCIPAIS = ['/', '/projetos', '/presenca', '/mural']

export function BarraAbas({
  aoAbrirMais,
  gavetaAberta,
}: {
  aoAbrirMais: () => void
  gavetaAberta: boolean
}) {
  const { can } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const ativa = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))
  const abas = PRINCIPAIS.map((to) => ITEMS.find((i) => i.to === to)!).filter(
    (i) => !i.perm || can(i.perm),
  )
  // nenhuma aba acesa: quem está numa tela do "Mais" precisa ver onde está
  const noMais = !abas.some((i) => ativa(i.to))

  return (
    <nav className="barra-abas" aria-label="Telas principais">
      {abas.map(({ to, label, Icon }) => (
        <button
          key={to}
          type="button"
          className="aba-tab"
          aria-current={ativa(to) ? 'page' : undefined}
          onClick={() => navigate(to)}
        >
          <Icon />
          {label}
        </button>
      ))}
      <button
        type="button"
        className={`aba-tab${noMais ? ' acesa' : ''}`}
        aria-expanded={gavetaAberta}
        onClick={aoAbrirMais}
      >
        <IconMenu size={17} />
        Mais
      </button>
    </nav>
  )
}
