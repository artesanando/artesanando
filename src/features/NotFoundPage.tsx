import { Link } from 'react-router-dom'
import { IconChevron } from '../components/ui/icons'

export function NotFoundPage() {
  return (
    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
      <div className="h" style={{ fontSize: 34, marginBottom: 8 }}>
        Página não encontrada
      </div>
      <Link to="/" style={{ fontWeight: 800, fontSize: 13 }}>
        <IconChevron size={12} para="esquerda" /> Voltar ao Dashboard
      </Link>
    </div>
  )
}
