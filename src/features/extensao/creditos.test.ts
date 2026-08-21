import { describe, expect, it } from 'vitest'
import { avaliaRegra, textoDaLinha, type BlocoRegra } from './creditos'

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
      '0/1 faixas de tricô',
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
