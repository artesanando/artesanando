import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOrdenacao } from './useOrdenacao'

const pessoas = [
  { nome: 'Carla', entregas: 2 },
  { nome: 'Ada', entregas: 5 },
  { nome: 'Beatriz', entregas: 2 },
]
const valor = (p: (typeof pessoas)[number], k: 'nome' | 'entregas') => p[k]

describe('useOrdenacao', () => {
  it('ordena texto respeitando acento do português', () => {
    const { result } = renderHook(() => useOrdenacao<'nome' | 'entregas'>('nome'))
    expect(result.current.ordenar(pessoas, valor).map((p) => p.nome)).toEqual([
      'Ada',
      'Beatriz',
      'Carla',
    ])
  })

  it('clicar de novo na mesma coluna inverte', () => {
    const { result } = renderHook(() => useOrdenacao<'nome' | 'entregas'>('nome'))
    act(() => result.current.alternar('nome'))
    expect(result.current.direcao).toBe('desc')
    expect(result.current.ordenar(pessoas, valor)[0].nome).toBe('Carla')
  })

  it('clicar em outra coluna começa pela direção natural dela', () => {
    const { result } = renderHook(() => useOrdenacao<'nome' | 'entregas'>('nome'))
    act(() => result.current.alternar('entregas', 'desc'))
    expect(result.current.coluna).toBe('entregas')
    expect(result.current.ordenar(pessoas, valor)[0].entregas).toBe(5)
  })

  it('empate preserva a ordem que veio do banco', () => {
    const { result } = renderHook(() => useOrdenacao<'nome' | 'entregas'>('entregas'))
    // Carla e Beatriz têm 2; Carla veio antes
    expect(result.current.ordenar(pessoas, valor).map((p) => p.nome)).toEqual([
      'Carla',
      'Beatriz',
      'Ada',
    ])
  })

  it('anuncia a coluna ordenada para leitor de tela', () => {
    const { result } = renderHook(() => useOrdenacao<'nome' | 'entregas'>('nome'))
    expect(result.current.ariaSort('nome')).toBe('ascending')
    expect(result.current.ariaSort('entregas')).toBe('none')
  })

  it('não mexe no array de origem', () => {
    const { result } = renderHook(() => useOrdenacao<'nome' | 'entregas'>('nome'))
    result.current.ordenar(pessoas, valor)
    expect(pessoas[0].nome).toBe('Carla')
  })
})
