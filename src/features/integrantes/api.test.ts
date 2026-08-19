import { describe, expect, it } from 'vitest'
import { emprestadosDe, entregasDe, filtraIntegrantes } from './api'
import type { EmprestimoAtivo } from '../estoque/api'
import type { Profile } from '../../types/database'

describe('entregasDe', () => {
  const dados = {
    unidades: [
      { responsavel_id: 'a', status: 'concluida' },
      { responsavel_id: 'a', status: 'em_producao' },
      { responsavel_id: 'b', status: 'concluida' },
    ],
    faixas: [
      { responsavel_id: 'a', status: 'feita' },
      { responsavel_id: 'a', status: 'afazer' },
    ],
    squares: [
      { responsavel_id: 'a', etapa: 'pronto' },
      { responsavel_id: 'a', etapa: 'pronto' },
      { responsavel_id: 'a', etapa: 'borda' },
      { responsavel_id: 'c', etapa: 'pronto' },
    ],
  }

  it('conta amigurumis concluídos, faixas feitas e granny squares prontos', () => {
    expect(entregasDe('a', dados)).toEqual({
      amigurumis: 1,
      faixas: 1,
      grannies: 2,
      total: 4,
    })
  })

  it('quem só fez granny square deixa de aparecer com zero entregas', () => {
    expect(entregasDe('c', dados)).toEqual({
      amigurumis: 0,
      faixas: 0,
      grannies: 1,
      total: 1,
    })
  })

  it('square que ainda não está pronto não conta como entrega', () => {
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
