import type { ReactNode } from 'react'

/* Cabeçalho de página, um só para todas.
   Eram nove blocos copiados com margens de 2 a 26px, uns com subtítulo e outros
   não, e dois deles dentro da coluna de menu de 180px — daí a sensação de que o
   título dançava de uma página para outra. */
export function CabecalhoPagina({
  titulo,
  sub,
  acoes,
}: {
  titulo: ReactNode
  sub?: ReactNode
  acoes?: ReactNode
}) {
  return (
    <div className="cabecalho-pagina">
      <div style={{ minWidth: 0 }}>
        <div className="h titulo-pagina">{titulo}</div>
        {/* a linha do subtítulo existe mesmo vazia: sem ela o título sobe e a
            altura do cabeçalho muda de página para página */}
        <div className="sub-pagina">{sub}</div>
      </div>
      {acoes && <div className="acoes-pagina">{acoes}</div>}
    </div>
  )
}
