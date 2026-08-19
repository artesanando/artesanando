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
  cores: Record<string, { border: string; inner: string }>
  celula?: number
}) {
  const colunas = celulas[0]?.length ?? 1
  return (
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <div
        style={{
          display: 'inline-grid',
          gridTemplateColumns: `repeat(${colunas}, ${celula}px)`,
          gap: 2,
          background: 'var(--sand)',
          padding: 5,
          borderRadius: 6,
        }}
      >
        {celulas.flatMap((linha, l) =>
          linha.map((letra, c) => {
            const d = cores[letra]
            return (
              <span
                key={`${l}-${c}`}
                style={{
                  width: celula,
                  height: celula,
                  background: d?.border ?? '#ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                }}
              >
                <span
                  style={{
                    width: Math.round(celula * 0.5),
                    height: Math.round(celula * 0.5),
                    background: d?.inner ?? '#eee',
                  }}
                />
              </span>
            )
          }),
        )}
      </div>
    </div>
  )
}
