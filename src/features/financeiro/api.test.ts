import { describe, expect, it } from 'vitest'
import { filtraPeriodo, limitesDoMes, saldo, totalDoMes, totalDoTipo } from './api'

const MOVS = [
  { tipo: 'entrada' as const, valor_centavos: 42000, data: '2026-07-08' },
  { tipo: 'saida' as const, valor_centavos: 24000, data: '2026-07-05' },
  { tipo: 'entrada' as const, valor_centavos: 26000, data: '2026-07-02' },
  { tipo: 'entrada' as const, valor_centavos: 80050, data: '2026-06-10' },
]

describe('kpis do financeiro', () => {
  it('saldo soma entradas e desconta saídas', () => {
    expect(saldo(MOVS)).toBe(42000 - 24000 + 26000 + 80050)
  })
  it('totais do mês filtram pela referência', () => {
    expect(totalDoMes(MOVS, 'entrada', '2026-07')).toBe(68000)
    expect(totalDoMes(MOVS, 'saida', '2026-07')).toBe(24000)
    expect(totalDoMes(MOVS, 'entrada', '2026-06')).toBe(80050)
  })
  it('uma saída de R$ 50 muda o saldo', () => {
    expect(saldo([...MOVS, { tipo: 'saida', valor_centavos: 5000, data: '2026-07-10' }])).toBe(
      saldo(MOVS) - 5000,
    )
  })
})

describe('filtro de período', () => {
  it('inclui as duas pontas do intervalo', () => {
    expect(filtraPeriodo(MOVS, '2026-07-02', '2026-07-08')).toHaveLength(3)
    expect(filtraPeriodo(MOVS, '2026-07-05', '2026-07-05')).toHaveLength(1)
  })

  it('período sem movimentação devolve lista vazia', () => {
    expect(filtraPeriodo(MOVS, '2026-08-01', '2026-08-31')).toEqual([])
  })

  it('os totais do período usam a lista já recortada', () => {
    const julho = filtraPeriodo(MOVS, '2026-07-01', '2026-07-31')
    expect(totalDoTipo(julho, 'entrada')).toBe(68000)
    expect(totalDoTipo(julho, 'saida')).toBe(24000)
  })

  it('limitesDoMes pega o último dia certo, inclusive em fevereiro', () => {
    expect(limitesDoMes('2026-07-15')).toEqual({ de: '2026-07-01', ate: '2026-07-31' })
    expect(limitesDoMes('2026-02-10')).toEqual({ de: '2026-02-01', ate: '2026-02-28' })
    expect(limitesDoMes('2024-02-10').ate).toBe('2024-02-29')
  })
})
