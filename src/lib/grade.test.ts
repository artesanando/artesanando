import { describe, expect, it } from 'vitest'
import {
  coordenada,
  gradePadrao,
  redimensionaCelulas,
  retangulo,
  sequenciaDaFaixa,
} from './grade'

describe('geometria da grade', () => {
  it('traduz posição em linha e coluna a partir de 1', () => {
    expect(coordenada(0, 8)).toEqual({ linha: 1, coluna: 1 })
    expect(coordenada(7, 8)).toEqual({ linha: 1, coluna: 8 })
    expect(coordenada(8, 8)).toEqual({ linha: 2, coluna: 1 })
  })

  it('seleção por arrasto pega o retângulo entre os dois cantos', () => {
    // grade 4 de largura: de (1,2) até (2,3) são 4 squares
    expect(retangulo(1, 6, 4).sort((a, b) => a - b)).toEqual([1, 2, 5, 6])
  })

  it('o retângulo independe da ordem dos cantos', () => {
    expect(retangulo(6, 1, 4).sort((a, b) => a - b)).toEqual(
      retangulo(1, 6, 4).sort((a, b) => a - b),
    )
  })

  it('um canto só devolve um square', () => {
    expect(retangulo(3, 3, 4)).toEqual([3])
  })
})

describe('gradePadrao', () => {
  it('alterna os modelos em xadrez no tamanho pedido', () => {
    expect(gradePadrao(3, 2, ['A', 'B'])).toEqual([
      ['A', 'B', 'A'],
      ['B', 'A', 'B'],
    ])
  })

  it('com três modelos a mesma letra cai na diagonal', () => {
    const g = gradePadrao(3, 3, ['A', 'B', 'C'])
    expect(g[0][0]).toBe('A')
    expect(g[1][2]).toBe('A')
    expect(g[2][1]).toBe('A')
  })
})

describe('redimensionaCelulas', () => {
  it('preserva o que couber e completa o resto com o padrão', () => {
    const antes = [
      ['B', 'B'],
      ['B', 'B'],
    ]
    expect(redimensionaCelulas(antes, 3, 2, ['A', 'B'])).toEqual([
      ['B', 'B', 'A'],
      ['B', 'B', 'B'],
    ])
  })

  it('troca a letra que deixou de existir pelo padrão', () => {
    expect(redimensionaCelulas([['C']], 1, 1, ['A', 'B'])).toEqual([['A']])
  })
})

describe('sequenciaDaFaixa', () => {
  it('a primeira faixa sai como a sequência foi escrita', () => {
    expect(sequenciaDaFaixa(['a', 'b', 'c'], 0)).toEqual(['a', 'b', 'c'])
  })

  it('cada faixa desloca uma posição', () => {
    expect(sequenciaDaFaixa(['a', 'b', 'c'], 1)).toEqual(['b', 'c', 'a'])
    expect(sequenciaDaFaixa(['a', 'b', 'c'], 2)).toEqual(['c', 'a', 'b'])
  })

  it('depois de uma volta completa repete a primeira', () => {
    expect(sequenciaDaFaixa(['a', 'b', 'c'], 3)).toEqual(['a', 'b', 'c'])
  })

  it('sequência vazia não quebra', () => {
    expect(sequenciaDaFaixa([], 2)).toEqual([])
  })
})
