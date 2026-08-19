import { sequenciaDaFaixa } from '../../lib/grade'

/* Prévia da manta de tricô. Cada faixa repete a sequência de cores deslocada
   uma posição em relação à de baixo — é isso que faz as cores caminharem na
   diagonal ao longo da manta, em vez de virarem blocos retos. */
export function PreviaFaixas({
  seq,
  faixas,
  altura = 150,
}: {
  seq: string[]
  faixas: number
  /** altura total da prévia, em px */
  altura?: number
}) {
  const alturaFaixa = Math.max(4, Math.round(altura / Math.max(1, faixas)))
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        background: 'var(--sand)',
        padding: 6,
        borderRadius: 8,
      }}
    >
      {Array.from({ length: faixas }, (_, i) => (
        <div key={i} style={{ display: 'flex', borderRadius: 2, overflow: 'hidden' }}>
          {sequenciaDaFaixa(seq, i).map((c, j) => (
            <div key={j} style={{ flex: 1, height: alturaFaixa, background: c }} />
          ))}
        </div>
      ))}
    </div>
  )
}
