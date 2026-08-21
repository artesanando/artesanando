import { faixasDaManta } from '../../lib/grade'

/* Prévia da manta de tricô. Sem faixas livres, cada faixa repete a sequência de
   cores deslocada uma posição em relação à de baixo — é isso que faz as cores
   caminharem na diagonal ao longo da manta, em vez de virarem blocos retos.
   `livres` sobrescreve as faixas que alguém editou uma a uma. */
export function PreviaFaixas({
  seq,
  faixas,
  altura = 150,
  livres,
  sel,
  aoSelecionar,
}: {
  seq: string[]
  faixas: number
  /** altura total da prévia, em px */
  altura?: number
  /** cores por faixa, para quem edita a manta faixa a faixa */
  livres?: string[][]
  /** índice da faixa em foco, quando a prévia é clicável */
  sel?: number
  aoSelecionar?: (i: number) => void
}) {
  const alturaFaixa = Math.max(4, Math.round(altura / Math.max(1, faixas)))
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        background: 'var(--sand)',
        padding: 6,
        borderRadius: 8,
      }}
    >
      {faixasDaManta(seq, faixas, livres).map((cores, i) => {
        const tiras = cores.map((c, j) => (
          <div key={j} style={{ flex: 1, height: alturaFaixa, background: c }} />
        ))
        return aoSelecionar ? (
          <button
            key={i}
            type="button"
            aria-label={`Faixa ${i + 1}`}
            aria-pressed={sel === i}
            onClick={() => aoSelecionar(i)}
            style={{
              display: 'flex',
              border: 'none',
              padding: 0,
              borderRadius: 2,
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: sel === i ? 'inset 0 0 0 2px var(--ink)' : 'none',
              position: 'relative',
              zIndex: sel === i ? 1 : 0,
            }}
          >
            {tiras}
          </button>
        ) : (
          <div key={i} style={{ display: 'flex', borderRadius: 2, overflow: 'hidden' }}>
            {tiras}
          </div>
        )
      })}
    </div>
  )
}
