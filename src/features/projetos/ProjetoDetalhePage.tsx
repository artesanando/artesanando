import { useParams } from 'react-router-dom'
import { MantaCrochePage } from './MantaCrochePage'
import { MantaTricoPage } from './MantaTricoPage'
import { AmigurumiPage } from './AmigurumiPage'
import { NotFoundPage } from '../NotFoundPage'

/* No M0 os projetos são mockados; o dispatch por tipo (manta crochê /
   manta tricô / amigurumi) já segue a rota /projetos/:id do plano. */
const TIPO_POR_SLUG: Record<string, 'manta_croche' | 'manta_trico' | 'amigurumi'> = {
  primavera: 'manta_croche',
  nuvem: 'manta_trico',
  capivara: 'amigurumi',
  polvo: 'amigurumi',
  coelhinha: 'amigurumi',
}

export function ProjetoDetalhePage() {
  const { id } = useParams()
  const tipo = id ? TIPO_POR_SLUG[id] : undefined
  if (tipo === 'manta_croche') return <MantaCrochePage />
  if (tipo === 'manta_trico') return <MantaTricoPage />
  if (tipo === 'amigurumi') return <AmigurumiPage />
  return <NotFoundPage />
}
