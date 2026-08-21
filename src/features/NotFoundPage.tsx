import { Link } from 'react-router-dom'
import { IconChevron } from '../components/ui/icons'

export function NotFoundPage() {
  return (
    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
      <div className="h" style={{ fontSize: 34, marginBottom: 8 }}>
        Página não encontrada
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        O endereço que você tentou abrir não existe.
      </div>
      <Link to="/" style={{ fontWeight: 800, fontSize: 13 }}>
        <IconChevron size={12} para="esquerda" /> Voltar ao Dashboard
      </Link>
    </div>
  )
}
