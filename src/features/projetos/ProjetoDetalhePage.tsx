import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MantaCrochePage } from './MantaCrochePage'
import { MantaTricoPage } from './MantaTricoPage'
import { AmigurumiPage } from './AmigurumiPage'
import { NotFoundPage } from '../NotFoundPage'
import { fetchProjeto } from './api'

/* Cada tipo de projeto abre a própria tela — Polvo Rosa abre o Polvo (bug 5.1) */
export function ProjetoDetalhePage() {
  const { id } = useParams()
  const { data: projeto, isLoading } = useQuery({
    queryKey: ['projeto', id],
    queryFn: () => fetchProjeto(id!),
    enabled: !!id,
  })

  if (isLoading)
    return <div style={{ padding: 40, fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>
  if (!projeto) return <NotFoundPage />

  if (projeto.tipo === 'manta_croche') return <MantaCrochePage projeto={projeto} />
  if (projeto.tipo === 'manta_trico') return <MantaTricoPage projeto={projeto} />
  return <AmigurumiPage projeto={projeto} />
}
