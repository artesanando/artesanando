import { describe, expect, it } from 'vitest'
import { dataLocal, fmtCentavos, fmtDataCurta, fmtDataLonga, parseCentavos } from './format'

describe('dinheiro em centavos', () => {
  it('formata pt-BR com milhar e vírgula', () => {
    expect(fmtCentavos(124050)).toBe('R$ 1.240,50')
    expect(fmtCentavos(500)).toBe('R$ 5,00')
    expect(fmtCentavos(42000)).toBe('R$ 420,00')
    expect(fmtCentavos(-24000)).toBe('−R$ 240,00')
  })
  it('parseia texto digitado para centavos', () => {
    expect(parseCentavos('R$ 1.240,50')).toBe(124050)
    expect(parseCentavos('420,00')).toBe(42000)
    expect(parseCentavos('50')).toBe(50)
    expect(parseCentavos('')).toBe(0)
  })
  it('round-trip parse(fmt(x)) === x', () => {
    for (const x of [1, 99, 100, 124050, 999999999]) {
      expect(parseCentavos(fmtCentavos(x))).toBe(x)
    }
  })
})

describe('datas locais', () => {
  it('não desloca o dia por UTC', () => {
    const d = dataLocal('2026-07-14')
    expect(d.getDate()).toBe(14)
    expect(d.getMonth()).toBe(6)
  })
  it('formata curto e longo', () => {
    expect(fmtDataCurta('2026-07-08')).toBe('08 jul')
    expect(fmtDataLonga('2026-07-14')).toBe('Terça, 14 de julho')
  })
})
