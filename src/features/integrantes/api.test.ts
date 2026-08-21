import { describe, expect, it } from 'vitest'
import { emprestadosDe, entregasDe, filtraIntegrantes } from './api'
import type { EmprestimoAtivo } from '../estoque/api'
import type { Profile } from '../../types/database'

describe('entregasDe', () => {
  // a peça herda o semestre do projeto a que pertence
  const s1 = { projetos: { semestre_id: 's1' } }
  const s2 = { projetos: { semestre_id: 's2' } }

  const dados = {
    unidades: [
      { ...s1, responsavel_id: 'a', status: 'concluida' },
      { ...s1, responsavel_id: 'a', status: 'em_producao' },
      { ...s1, responsavel_id: 'b', status: 'concluida' },
      { ...s2, responsavel_id: 'a', status: 'concluida' },
    ],
    faixas: [
      { ...s1, responsavel_id: 'a', status: 'feita' },
      { ...s1, responsavel_id: 'a', status: 'afazer' },
    ],
    /* Square guarda as duas metades: 'a' fez os dois inteiros (2,0) e o miolo de
       um terceiro (0,5); 'c' fez a borda desse mesmo terceiro (0,5). */
    squares: [
      { ...s1, responsavel_id: 'a', etapa: 'pronto', miolo_por: 'a', borda_por: 'a' },
      { ...s1, responsavel_id: 'a', etapa: 'pronto', miolo_por: 'a', borda_por: 'a' },
      { ...s1, responsavel_id: 'c', etapa: 'pronto', miolo_por: 'a', borda_por: 'c' },
      { ...s1, responsavel_id: 'b', etapa: 'afazer', miolo_por: null, borda_por: null },
    ],
  }

  it('conta amigurumis concluídos, faixas feitas e granny squares prontos', () => {
    // sem semestre, é o acumulado de sempre — os dois amigurumis dela
    expect(entregasDe('a', dados)).toEqual({
      amigurumis: 2,
      faixas: 1,
      grannies: 2.5,
      total: 5.5,
    })
  })

  it('meio square conta como meia entrega', () => {
    // 'c' só fez a borda de um square
    expect(entregasDe('c', dados).grannies).toBe(0.5)
  })

  it('com semestre, só conta peça de projeto daquele semestre', () => {
    expect(entregasDe('a', dados, 's1')).toEqual({
      amigurumis: 1,
      faixas: 1,
      grannies: 2.5,
      total: 4.5,
    })
    expect(entregasDe('a', dados, 's2')).toEqual({
      amigurumis: 1,
      faixas: 0,
      grannies: 0,
      total: 1,
    })
  })

  it('quem só fez granny square deixa de aparecer com zero entregas', () => {
    expect(entregasDe('c', dados)).toEqual({
      amigurumis: 0,
      faixas: 0,
      grannies: 0.5,
      total: 0.5,
    })
  })

  it('square que ninguém começou não conta para ninguém', () => {
    expect(entregasDe('b', dados).grannies).toBe(0)
  })
})

describe('emprestadosDe', () => {
  it('soma o saldo dos empréstimos ativos da integrante', () => {
    const loans = [
      {
        id: 'e1',
        item_id: 'i1',
        integrante_id: 'a',
        projeto_nome: null,
        quantidade: 3,
        data: '2026-07-01',
        encerrado_em: null,
        devolucoes: [{ id: 'd1', emprestimo_id: 'e1', quantidade: 1, data: '2026-07-02' }],
        integrante: null,
        item: null,
      },
      {
        id: 'e2',
        item_id: 'i2',
        integrante_id: 'a',
        projeto_nome: null,
        quantidade: 5,
        data: '2026-07-01',
        encerrado_em: '2026-07-03T00:00:00Z',
        devolucoes: [],
        integrante: null,
        item: null,
      },
    ] satisfies EmprestimoAtivo[]
    expect(emprestadosDe('a', loans)).toBe(2)
  })
})

describe('filtraIntegrantes', () => {
  const p = (nome: string, usuario: string) => ({ nome, usuario }) as Profile
  it('filtra por nome ou usuário, sem case', () => {
    const lista = [p('Beatriz Gomes', 'beatriz'), p('Camila Rocha', 'camila')]
    expect(filtraIntegrantes(lista, 'bea')).toHaveLength(1)
    expect(filtraIntegrantes(lista, 'CAMILA')).toHaveLength(1)
    expect(filtraIntegrantes(lista, '')).toHaveLength(2)
  })
})
