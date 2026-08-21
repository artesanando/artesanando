import { describe, expect, it } from 'vitest'
import { reordena } from './useReordenar'

describe('reordena', () => {
  it('leva o item para a posição de destino', () => {
    expect(reordena(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })
  it('funciona de trás para frente', () => {
    expect(reordena(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })
  it('soltar no mesmo lugar não muda nada', () => {
    expect(reordena(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c'])
  })
  it('não perde nem duplica item', () => {
    const r = reordena([1, 2, 3, 4, 5], 4, 0)
    expect(r).toHaveLength(5)
    expect([...r].sort()).toEqual([1, 2, 3, 4, 5])
  })
})
