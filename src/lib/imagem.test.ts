import { describe, expect, it } from 'vitest'
import { encaixa, molduraInicial } from './imagem'

describe('molduraInicial', () => {
  it('foto quadrada com recorte quadrado ocupa tudo', () => {
    expect(molduraInicial(800, 800, 1)).toEqual({ x: 0, y: 0, w: 1, h: 1 })
  })

  it('foto deitada com recorte quadrado sobra dos lados', () => {
    const m = molduraInicial(1600, 800, 1)
    expect(m.w).toBeCloseTo(0.5)
    expect(m.h).toBe(1)
    expect(m.x).toBeCloseTo(0.25)
  })

  it('foto em pé com recorte quadrado sobra em cima e embaixo', () => {
    const m = molduraInicial(800, 1600, 1)
    expect(m.w).toBe(1)
    expect(m.h).toBeCloseTo(0.5)
    expect(m.y).toBeCloseTo(0.25)
  })
})

describe('encaixa', () => {
  it('puxa a moldura de volta para dentro da foto', () => {
    expect(encaixa({ x: 0.8, y: -0.3, w: 0.5, h: 0.5 })).toEqual({
      x: 0.5,
      y: 0,
      w: 0.5,
      h: 0.5,
    })
  })

  it('não deixa encolher além do mínimo', () => {
    const m = encaixa({ x: 0.5, y: 0.5, w: 0.01, h: 0.01 }, 0.1)
    expect(m.w).toBe(0.1)
    expect(m.h).toBe(0.1)
  })

  it('não deixa passar do tamanho da foto', () => {
    const m = encaixa({ x: 0, y: 0, w: 2, h: 2 })
    expect(m).toEqual({ x: 0, y: 0, w: 1, h: 1 })
  })
})
