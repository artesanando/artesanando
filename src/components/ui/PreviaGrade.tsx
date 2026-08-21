import { SquareGranny } from './SquareGranny'

/* Prévia da manta de crochê: grade reta, sem deslocamento nenhum. O que segue a
   diagonal é a POSIÇÃO dos modelos — `gradePadrao` avança uma letra por coluna e
   por linha, então a mesma cor sobe em diagonal. Mesmo desenho na biblioteca, no
   formulário do projeto e no detalhe da receita. */
export function PreviaGrade({
  celulas,
  cores,
  celula = 14,
}: {
  celulas: string[][]
  /** `cores` traz todas as carreiras quando o modelo veio de um granny salvo */
  cores: Record<string, { border: string; inner: string; cores?: string[] }>
  celula?: number
}) {
  const colunas = celulas[0]?.length ?? 1
  return (
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <div
        style={{
          display: 'inline-grid',
          gridTemplateColumns: `repeat(${colunas}, ${celula}px)`,
          gap: 1,
          background: 'var(--sand)',
          padding: 5,
          borderRadius: 6,
        }}
      >
        {celulas.flatMap((linha, l) =>
          linha.map((letra, c) => {
            const d = cores[letra]
            const aneis = d
              ? d.cores && d.cores.length > 0
                ? d.cores
                : [d.inner, d.border]
              : ['#eee', '#ccc']
            return (
              <SquareGranny key={`${l}-${c}`} cores={aneis} tamanho={celula} radius={1} />
            )
          }),
        )}
      </div>
    </div>
  )
}
