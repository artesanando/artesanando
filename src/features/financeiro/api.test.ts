import { describe, expect, it } from 'vitest'
import { saldo, totalDoMes } from './api'

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
