/* A faixa que a pessoa vai tricotar — uma listra só, com a sequência de cores.
   Diferente de `PreviaFaixas`, que empilha as faixas para mostrar a manta
   montada: no criador de padrão o que importa é a peça, não o conjunto. */
export function PreviaFaixa({ seq, altura = 44 }: { seq: string[]; altura?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--sand)',
        padding: 6,
        borderRadius: 8,
        gap: 0,
      }}
    >
      {seq.map((c, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: altura,
            background: c,
            borderTopLeftRadius: i === 0 ? 4 : 0,
            borderBottomLeftRadius: i === 0 ? 4 : 0,
            borderTopRightRadius: i === seq.length - 1 ? 4 : 0,
            borderBottomRightRadius: i === seq.length - 1 ? 4 : 0,
          }}
        />
      ))}
    </div>
  )
}
