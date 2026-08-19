import { describe, expect, it } from 'vitest'
import {
  gruposUnidades,
  progressoFaixas,
  progressoSquares,
  progressoUnidades,
  proximaEtapa,
  resumoPorEtapa,
  squaresPorResponsavel,
  type MantaModelo,
  type Square,
  type SquareEtapa,
  type Unidade,
} from './api'

const sq = (posicao: number, etapa: SquareEtapa, modelo = 'm1', resp: string | null = null): Square => ({
  id: `s${posicao}`,
  projeto_id: 'p1',
  modelo_id: modelo,
  posicao,
  etapa,
  responsavel_id: resp,
})

const modelo = (id: string, letra: string): MantaModelo => ({
  id,
  projeto_id: 'p1',
  letra,
  nome: `Modelo ${letra}`,
  cor_borda: '#000',
  cor_miolo: '#fff',
  responsavel_id: null,
  total: 0,
})

const und = (numero: number, nome: string, status: Unidade['status']): Unidade => ({
  id: `u${numero}`,
  projeto_id: 'p1',
  numero,
  responsavel_id: 'x',
  status,
  responsavel: { nome },
})

describe('progresso derivado', () => {
  it('conta squares prontos', () => {
    expect(
      progressoSquares([{ etapa: 'pronto' }, { etapa: 'pronto' }, { etapa: 'afazer' }]),
    ).toEqual({ done: 2, total: 3 })
  })
  it('conta faixas feitas', () => {
    expect(progressoFaixas([{ status: 'feita' }, { status: 'fazendo' }])).toEqual({
      done: 1,
      total: 2,
    })
  })
  it('unidades usam a meta como total', () => {
    expect(progressoUnidades([{ status: 'concluida' }, { status: 'em_producao' }], 12)).toEqual({
      done: 1,
      total: 12,
    })
  })
})

describe('proximaEtapa', () => {
  it('avança um passo no fluxo do square', () => {
    expect(proximaEtapa('afazer')).toBe('miolo')
    expect(proximaEtapa('miolo')).toBe('aguardando_borda')
    expect(proximaEtapa('aguardando_borda')).toBe('borda')
    expect(proximaEtapa('borda')).toBe('pronto')
  })
  it('pronto é o fim da linha', () => {
    expect(proximaEtapa('pronto')).toBe('pronto')
  })
})

describe('resumoPorEtapa', () => {
  it('conta squares por etapa e por modelo, cobrindo as cinco etapas', () => {
    const resumo = resumoPorEtapa(
      [sq(0, 'pronto'), sq(1, 'pronto', 'm2'), sq(2, 'afazer'), sq(3, 'borda')],
      [modelo('m1', 'A'), modelo('m2', 'B')],
    )
    expect(resumo).toHaveLength(5)
    const pronto = resumo.find((r) => r.etapa === 'pronto')!
    expect(pronto.total).toBe(2)
    expect(pronto.porModelo).toEqual([
      { letra: 'A', nome: 'Modelo A', total: 1 },
      { letra: 'B', nome: 'Modelo B', total: 1 },
    ])
    expect(resumo.find((r) => r.etapa === 'miolo')!.total).toBe(0)
  })
})

describe('squaresPorResponsavel', () => {
  it('só conta o que está pronto e tem dona', () => {
    const map = squaresPorResponsavel([
      sq(0, 'pronto', 'm1', 'u1'),
      sq(1, 'pronto', 'm1', 'u1'),
      sq(2, 'borda', 'm1', 'u1'),
      sq(3, 'pronto', 'm1', null),
    ])
    expect(map.get('u1')).toBe(2)
    expect(map.size).toBe(1)
  })
})

describe('gruposUnidades', () => {
  it('agrupa números consecutivos da mesma responsável', () => {
    const grupos = gruposUnidades([
      und(1, 'Ana', 'concluida'),
      und(2, 'Ana', 'concluida'),
      und(3, 'Bia', 'concluida'),
      und(4, 'Ana', 'em_producao'),
    ])
    expect(grupos).toHaveLength(3)
    expect(grupos[0]).toMatchObject({ ini: 1, fim: 2, nome: 'Ana', concluido: true })
    expect(grupos[1]).toMatchObject({ ini: 3, fim: 3, nome: 'Bia' })
    expect(grupos[2]).toMatchObject({ ini: 4, fim: 4, nome: 'Ana', concluido: false })
  })
  it('separa o que já foi concluído do que ainda está em produção', () => {
    const grupos = gruposUnidades([und(1, 'Ana', 'concluida'), und(2, 'Ana', 'em_producao')])
    expect(grupos).toHaveLength(2)
    expect(grupos[0]).toMatchObject({ ini: 1, fim: 1, concluido: true, ids: ['u1'] })
    expect(grupos[1]).toMatchObject({ ini: 2, fim: 2, concluido: false, ids: ['u2'] })
  })
})
