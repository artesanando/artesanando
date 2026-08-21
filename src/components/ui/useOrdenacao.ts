import { useState } from 'react'

export type Direcao = 'asc' | 'desc'

/* Ordenação por clique no cabeçalho, igual nas cinco tabelas do app.
 *
 * O comparador vem de quem chama porque cada tabela ordena coisas diferentes —
 * texto, número, data. Clicar de novo na mesma coluna inverte; clicar em outra
 * começa pela direção natural dela (texto sobe, número desce). */
export function useOrdenacao<K extends string>(inicial: K, direcaoInicial: Direcao = 'asc') {
  const [coluna, setColuna] = useState<K>(inicial)
  const [direcao, setDirecao] = useState<Direcao>(direcaoInicial)

  const alternar = (k: K, natural: Direcao = 'asc') => {
    if (k === coluna) setDirecao((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setColuna(k)
      setDirecao(natural)
    }
  }

  /** `aria-sort` do cabeçalho — é o que leitor de tela anuncia */
  const ariaSort = (k: K): 'ascending' | 'descending' | 'none' =>
    k === coluna ? (direcao === 'asc' ? 'ascending' : 'descending') : 'none'

  /* Ordena sem mexer no array de origem. O `sort` do JS é estável desde o ES2019,
     então empate preserva a ordem que veio do banco. */
  function ordenar<T>(itens: T[], valor: (item: T, k: K) => string | number): T[] {
    const sinal = direcao === 'asc' ? 1 : -1
    return [...itens].sort((a, b) => {
      const va = valor(a, coluna)
      const vb = valor(b, coluna)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sinal
      return String(va).localeCompare(String(vb), 'pt-BR') * sinal
    })
  }

  return { coluna, direcao, alternar, ariaSort, ordenar }
}
