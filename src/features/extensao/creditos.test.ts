import { describe, expect, it } from 'vitest'
import {
  avaliaRegra,
  detalheDaLinha,
  textoDaLinha,
  textoDoAlvo,
  type BlocoRegra,
} from './creditos'
import { resumoDaLinha, type AcaoAuditoria } from './creditosApi'

const entregas = (over: Partial<Record<'amigurumis' | 'faixas' | 'grannies', number>> = {}) => ({
  amigurumis: 0,
  faixas: 0,
  grannies: 0,
  total: 0,
  ...over,
})

/* A regra real da iniciante: "5 squares OU 1 faixa" E "75% de frequência" */
const REGRA_INICIANTE: BlocoRegra[] = [
  {
    id: 'b1',
    ordem: 0,
    linhas: [
      { id: 'l1', tipo: 'granny', quantidade: 5 },
      { id: 'l2', tipo: 'faixa', quantidade: 1 },
    ],
  },
  { id: 'b2', ordem: 1, linhas: [{ id: 'l3', tipo: 'frequencia', quantidade: 75 }] },
]

describe('avaliaRegra', () => {
  it('dentro do bloco basta uma alternativa', () => {
    // fez 1 faixa e nenhum square: o bloco fecha pela faixa
    const r = avaliaRegra(REGRA_INICIANTE, entregas({ faixas: 1 }), 80)
    expect(r.blocos[0].cumpriu).toBe(true)
    expect(r.cumpriu).toBe(true)
  })

  it('entre blocos, todos precisam fechar', () => {
    // as peças estão lá, mas a frequência não
    const r = avaliaRegra(REGRA_INICIANTE, entregas({ grannies: 5 }), 40)
    expect(r.blocos[0].cumpriu).toBe(true)
    expect(r.blocos[1].cumpriu).toBe(false)
    expect(r.cumpriu).toBe(false)
  })

  it('mostra todas as alternativas, mesmo as que ela não seguiu', () => {
    const r = avaliaRegra(REGRA_INICIANTE, entregas({ grannies: 3 }), 80)
    expect(r.blocos[0].linhas.map(textoDaLinha)).toEqual([
      '3/5 granny squares',
      '0/1 faixa de tricô',
    ])
    expect(r.cumpriu).toBe(false)
  })

  it('mentoria só conta quando a administradora marca', () => {
    const regra: BlocoRegra[] = [
      {
        id: 'b1',
        ordem: 0,
        linhas: [
          { id: 'l1', tipo: 'amigurumi', quantidade: 3 },
          { id: 'l2', tipo: 'mentoria', quantidade: 1 },
        ],
      },
    ]
    expect(avaliaRegra(regra, entregas(), 0).cumpriu).toBe(false)
    expect(avaliaRegra(regra, entregas(), 0, { mentoria: true, cumprido: false }).cumpriu).toBe(true)
  })

  it('dar como cumprido fecha a regra sem mexer no que a conta mostra', () => {
    const r = avaliaRegra(REGRA_INICIANTE, entregas(), 0, { mentoria: false, cumprido: true })
    expect(r.cumpriu).toBe(true)
    expect(r.manual).toBe(true)
    // o que falta continua visível: a marca não apaga o diagnóstico
    expect(r.blocos[0].cumpriu).toBe(false)
  })

  it('regra vazia não dá crédito a ninguém', () => {
    expect(avaliaRegra([], entregas({ grannies: 99 }), 100).cumpriu).toBe(false)
  })

  it('bloco sem linha nenhuma não fecha por vacuidade', () => {
    const r = avaliaRegra([{ id: 'b1', ordem: 0, linhas: [] }], entregas(), 100)
    expect(r.blocos[0].cumpriu).toBe(false)
    expect(r.cumpriu).toBe(false)
  })

  it('a ordem dos blocos manda no que a tela desenha', () => {
    const fora: BlocoRegra[] = [
      { id: 'b2', ordem: 1, linhas: [{ id: 'l3', tipo: 'frequencia', quantidade: 75 }] },
      { id: 'b1', ordem: 0, linhas: [{ id: 'l1', tipo: 'granny', quantidade: 5 }] },
    ]
    expect(avaliaRegra(fora, entregas(), 0).blocos.map((b) => b.id)).toEqual(['b1', 'b2'])
  })
})

describe('textoDoAlvo', () => {
  it('usa o singular quando a regra pede uma peça só', () => {
    expect(textoDoAlvo('faixa', 1)).toBe('1 faixa de tricô')
    expect(textoDoAlvo('granny', 1)).toBe('1 granny square')
  })

  it('usa o plural do dois em diante', () => {
    expect(textoDoAlvo('faixa', 2)).toBe('2 faixas de tricô')
    expect(textoDoAlvo('amigurumi', 3)).toBe('3 amigurumis')
  })

  it('frequência não leva espaço antes do por cento', () => {
    expect(textoDoAlvo('frequencia', 75)).toBe('75% de frequência')
  })

  it('mentoria não tem quantidade', () => {
    expect(textoDoAlvo('mentoria', 1)).toBe('mentorar uma iniciante')
  })
})

describe('textoDaLinha', () => {
  const linha = (over: Partial<Parameters<typeof textoDaLinha>[0]>) => ({
    tipo: 'granny' as const,
    feito: 0,
    alvo: 5,
    cumpriu: false,
    ...over,
  })

  it('escreve meio square com vírgula, como a tabela de entregas', () => {
    expect(textoDaLinha(linha({ feito: 3.5 }))).toBe('3,5/5 granny squares')
  })

  it('não passa do alvo, e guarda o número cheio no detalhe', () => {
    const l = linha({ tipo: 'amigurumi', feito: 14, alvo: 3, cumpriu: true })
    expect(textoDaLinha(l)).toBe('3/3 amigurumis')
    expect(detalheDaLinha(l)).toBe('entregou 14, a regra pede 3')
  })

  it('não inventa detalhe quando ela ainda não chegou lá', () => {
    expect(detalheDaLinha(linha({ feito: 2 }))).toBeUndefined()
  })

  it('diz se a mentoria foi marcada ou não', () => {
    expect(textoDaLinha(linha({ tipo: 'mentoria', alvo: 1, cumpriu: true }))).toBe(
      'mentoria marcada',
    )
    expect(textoDaLinha(linha({ tipo: 'mentoria', alvo: 1 }))).toBe('mentoria não marcada')
  })
})

describe('resumoDaLinha', () => {
  const linha = (acao: AcaoAuditoria, detalhe: Record<string, unknown>) => ({ acao, detalhe })

  it('traduz o nível em vez de mostrar o enum do banco', () => {
    expect(resumoDaLinha(linha('nivel', { de: 'experiente', para: 'iniciante' }))).toBe(
      'mudou de experiente para iniciante',
    )
  })

  it('traduz a chave da permissão, que é nome de coluna', () => {
    expect(resumoDaLinha(linha('permissao', { para: true, chave: 'presenca' }))).toBe(
      'ganhou "marcar chamada"',
    )
    expect(resumoDaLinha(linha('permissao', { para: false, chave: 'progresso' }))).toBe(
      'perdeu "registrar progresso"',
    )
  })

  it('traduz o tipo da entrega', () => {
    expect(resumoDaLinha(linha('entrega', { tipo: 'granny' }))).toBe('concluiu granny squares')
  })

  it('junta a marca e o motivo sem repetir o rótulo', () => {
    expect(resumoDaLinha(linha('credito', { cumprido: true, motivo: 'entregou atrasada' }))).toBe(
      'dada como cumprida — entregou atrasada',
    )
    expect(resumoDaLinha(linha('credito', {}))).toBe('marca removida')
  })
})
