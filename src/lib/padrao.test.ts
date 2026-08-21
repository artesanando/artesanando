import { describe, expect, it } from 'vitest'
import { coresDoGranny, seqDaFaixa } from './padrao'
import type { Receita } from '../types/database'

const receita = (conteudo: Receita['conteudo']): Receita =>
  ({ id: 'r1', nome: 'X', categoria: 'granny', conteudo }) as Receita

describe('coresDoGranny', () => {
  it('devolve todas as carreiras, do miolo para fora', () => {
    // antes daqui saíam só a primeira e a última, e as do meio se perdiam
    const r = receita({
      rings: [
        { c: '#111', name: 'a', n: 1 },
        { c: '#222', name: 'b', n: 2 },
        { c: '#333', name: 'c', n: 1 },
        { c: '#444', name: 'd', n: 3 },
      ],
    })
    expect(coresDoGranny(r)).toEqual(['#111', '#222', '#333', '#444'])
  })

  it('padrão sem carreira nenhuma não vira modelo', () => {
    expect(coresDoGranny(receita({}))).toBeNull()
    expect(coresDoGranny(receita({ rings: [] }))).toBeNull()
  })
})

describe('seqDaFaixa', () => {
  it('exige pelo menos duas cores para ser uma faixa', () => {
    expect(seqDaFaixa(receita({ seq: ['#111', '#222'] }))).toEqual(['#111', '#222'])
    expect(seqDaFaixa(receita({ seq: ['#111'] }))).toBeNull()
  })
})
