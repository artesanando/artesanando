import { describe, expect, it } from 'vitest'
import {
  gruposUnidades,
  progressoFaixas,
  progressoSquares,
  progressoUnidades,
  proximaEtapa,
  type Unidade,
} from './api'

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
  it('miolo concluído vai para aguardando borda', () => {
    expect(proximaEtapa('miolo')).toBe('aguardando_borda')
  })
  it('borda concluída vai para pronto', () => {
    expect(proximaEtapa('borda')).toBe('pronto')
    expect(proximaEtapa('pronto')).toBe('pronto')
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
  it('grupo com uma unidade em produção não fica concluído', () => {
    const grupos = gruposUnidades([und(1, 'Ana', 'concluida'), und(2, 'Ana', 'em_producao')])
    expect(grupos).toHaveLength(1)
    expect(grupos[0].concluido).toBe(false)
    expect(grupos[0].ids).toEqual(['u1', 'u2'])
  })
})
