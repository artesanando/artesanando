import type { Entregas } from '../integrantes/api'

/* Regra de crédito do semestre.
 *
 * Um BLOCO é uma exigência; as LINHAS dentro dele são jeitos alternativos de
 * atendê-la. Blocos se somam (E), linhas se alternam (OU). Duas linhas de
 * exemplo real: "5 granny squares OU 1 faixa" E "75% de frequência";
 * "3 amigurumis OU mentorar uma iniciante" E "75% de frequência".
 *
 * Essa forma cobre os casos sem aninhamento, que é o que torna a regra legível
 * na tela e a conta possível de auditar.
 */

export type TipoLinha = 'amigurumi' | 'granny' | 'faixa' | 'frequencia' | 'mentoria'

export const TIPO_LABEL: Record<TipoLinha, string> = {
  amigurumi: 'amigurumis',
  granny: 'granny squares',
  faixa: 'faixas de tricô',
  frequencia: '% de frequência',
  mentoria: 'mentorar uma iniciante',
}

export interface LinhaRegra {
  id: string
  tipo: TipoLinha
  quantidade: number
}

export interface BlocoRegra {
  id: string
  ordem: number
  linhas: LinhaRegra[]
}

export interface Marca {
  mentoria: boolean
  cumprido: boolean
}

export interface LinhaAvaliada {
  tipo: TipoLinha
  feito: number
  alvo: number
  cumpriu: boolean
}

export interface BlocoAvaliado {
  id: string
  cumpriu: boolean
  linhas: LinhaAvaliada[]
}

export interface Avaliacao {
  cumpriu: boolean
  /** verdadeiro quando o resultado veio do botão de dar como cumprido */
  manual: boolean
  blocos: BlocoAvaliado[]
}

/** Quanto a pessoa já fez do que aquela linha pede */
function feitoDe(tipo: TipoLinha, entregas: Entregas, freqPct: number, marca: Marca | null) {
  switch (tipo) {
    case 'amigurumi':
      return entregas.amigurumis
    case 'granny':
      return entregas.grannies
    case 'faixa':
      return entregas.faixas
    case 'frequencia':
      return freqPct
    case 'mentoria':
      // mentoria não se conta sozinha: é a administradora que marca
      return marca?.mentoria ? 1 : 0
  }
}

export function avaliaRegra(
  blocos: BlocoRegra[],
  entregas: Entregas,
  freqPct: number,
  marca: Marca | null = null,
): Avaliacao {
  const avaliados: BlocoAvaliado[] = [...blocos]
    .sort((a, b) => a.ordem - b.ordem)
    .map((b) => {
      const linhas = b.linhas.map((l) => {
        const feito = feitoDe(l.tipo, entregas, freqPct, marca)
        return { tipo: l.tipo, feito, alvo: l.quantidade, cumpriu: feito >= l.quantidade }
      })
      /* Bloco sem linha nenhuma não é "cumprido por vacuidade": uma regra vazia
         não deve dar crédito a ninguém sem querer. */
      return { id: b.id, cumpriu: linhas.length > 0 && linhas.some((l) => l.cumpriu), linhas }
    })

  // dar como cumprido curto-circuita a conta, mas a tela segue mostrando o que falta
  if (marca?.cumprido) return { cumpriu: true, manual: true, blocos: avaliados }

  return {
    cumpriu: avaliados.length > 0 && avaliados.every((b) => b.cumpriu),
    manual: false,
    blocos: avaliados,
  }
}

/** "3/5 granny squares" — o texto que a tabela mostra por alternativa */
export const textoDaLinha = (l: LinhaAvaliada) =>
  l.tipo === 'mentoria'
    ? TIPO_LABEL.mentoria
    : l.tipo === 'frequencia'
      ? `${l.feito}% de ${l.alvo}%`
      : `${l.feito}/${l.alvo} ${TIPO_LABEL[l.tipo]}`
