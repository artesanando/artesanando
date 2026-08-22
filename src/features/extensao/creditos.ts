import { fmtEntrega } from '../../lib/format'
import type { Entregas } from '../integrantes/api'

/* Regra de crédito do semestre.
 *
 * Uma EXIGÊNCIA (`credito_blocos`) é algo que a integrante precisa cumprir; as
 * FORMAS DE CUMPRIR dentro dela (`credito_linhas`) são caminhos alternativos.
 * Exigências se somam (E), formas se alternam (OU). Duas de exemplo real:
 * "5 granny squares OU 1 faixa" E "75% de frequência"; "3 amigurumis OU
 * mentorar uma iniciante" E "75% de frequência".
 *
 * Essa forma cobre os casos sem aninhamento, que é o que torna a regra legível
 * na tela e a conta possível de auditar.
 */

export type TipoLinha =
  | 'amigurumi'
  | 'granny'
  | 'faixa'
  | 'feira'
  | 'frequencia'
  | 'mentoria'

/** Plural — serve ao seletor de tipo, que fala do tipo sem quantidade */
export const TIPO_LABEL: Record<TipoLinha, string> = {
  amigurumi: 'amigurumis',
  granny: 'granny squares',
  faixa: 'faixas de tricô',
  feira: 'peças de feira',
  frequencia: '% de frequência',
  mentoria: 'mentorar uma iniciante',
}

const TIPO_SINGULAR: Record<TipoLinha, string> = {
  amigurumi: 'amigurumi',
  granny: 'granny square',
  faixa: 'faixa de tricô',
  feira: 'peça de feira',
  frequencia: '% de frequência',
  mentoria: 'mentorar uma iniciante',
}

/* Quantidade e unidade andam juntas: colar o rótulo plural na quantidade
   escrevia "1 faixas de tricô" e "75 % de frequência" (com espaço). Uma função
   só monta o texto, e ela serve tanto à regra escrita quanto ao diagnóstico. */

/** "5 granny squares", "1 faixa de tricô", "75% de frequência" */
export function textoDoAlvo(tipo: TipoLinha, quantidade: number): string {
  if (tipo === 'mentoria') return TIPO_LABEL.mentoria
  if (tipo === 'frequencia') return `${quantidade}% de frequência`
  const unidade = quantidade === 1 ? TIPO_SINGULAR[tipo] : TIPO_LABEL[tipo]
  return `${fmtEntrega(quantidade)} ${unidade}`
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

/** Quanto a pessoa já fez do que aquela forma de cumprir pede */
function feitoDe(tipo: TipoLinha, entregas: Entregas, freqPct: number, marca: Marca | null) {
  switch (tipo) {
    case 'amigurumi':
      return entregas.amigurumis
    case 'granny':
      return entregas.grannies
    case 'faixa':
      return entregas.faixas
    /* Peça de feira não fecha a exigência de amigurumi de projeto, mesmo sendo
       um amigurumi: são trabalhos diferentes, e a coordenação escolhe se quer
       exigir um, outro, ou os dois. */
    case 'feira':
      return entregas.feira
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
      /* Exigência sem forma nenhuma não é "cumprida por vacuidade": uma regra
         vazia não deve dar crédito a ninguém sem querer. */
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

/* "3/5 granny squares" — o texto de cada forma de cumprir na linha da pessoa.
   O feito é limitado ao alvo: "14/3 amigurumis" só faz o olho tropeçar, e o
   número cheio continua disponível em `detalheDaLinha`, no title. */
export function textoDaLinha(l: LinhaAvaliada): string {
  if (l.tipo === 'mentoria') return l.cumpriu ? 'mentoria marcada' : 'mentoria não marcada'
  if (l.tipo === 'frequencia') return `${l.feito}% de ${l.alvo}%`
  return `${fmtEntrega(Math.min(l.feito, l.alvo))}/${textoDoAlvo(l.tipo, l.alvo)}`
}

/** Só quando ela passou do alvo: "entregou 14, a regra pede 3" */
export function detalheDaLinha(l: LinhaAvaliada): string | undefined {
  if (l.tipo === 'mentoria' || l.tipo === 'frequencia' || l.feito <= l.alvo) return undefined
  return `entregou ${fmtEntrega(l.feito)}, a regra pede ${fmtEntrega(l.alvo)}`
}
