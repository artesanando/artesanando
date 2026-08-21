import { useStore } from '../state/store'
import type { ReceitaCategoria } from '../types/database'

/* A Biblioteca tem um botão só; a categoria é que troca a lógica. Cada
   categoria tem um editor próprio, então trocar aqui troca de modal levando
   junto o `creatorReturn` — quem veio do formulário de projeto volta para lá. */
export const CATEGORIAS: [ReceitaCategoria, string][] = [
  ['amigurumi', 'Receita'],
  ['granny', 'Granny square'],
  ['faixa', 'Faixa de tricô'],
  ['manta', 'Esquema de manta'],
]

export function SeletorCategoria({ atual }: { atual: ReceitaCategoria }) {
  const { open, openGranny, openFaixa, openLayout, creatorReturn } = useStore()

  const ir = (cat: ReceitaCategoria) => {
    if (cat === atual) return
    if (cat === 'granny') return openGranny(creatorReturn)
    if (cat === 'faixa') return openFaixa(creatorReturn)
    if (cat === 'manta') return openLayout(creatorReturn)
    open('receita')
  }

  return (
    <>
      <div className="lbl" style={{ marginBottom: 7 }}>
        CATEGORIA
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {CATEGORIAS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            className="seg"
            aria-pressed={atual === k}
            onClick={() => ir(k)}
            style={
              atual === k
                ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                : undefined
            }
          >
            {label}
          </button>
        ))}
      </div>
    </>
  )
}
