import { describe, expect, it } from 'vitest'
import {
  disponivel,
  emprestadoPorItem,
  estoqueBaixo,
  saldoEmprestimo,
  type EmprestimoAtivo,
} from './api'
import type { EstoqueItem } from '../../types/database'

const loan = (over: Partial<EmprestimoAtivo>): EmprestimoAtivo => ({
  id: 'e1',
  item_id: 'i1',
  integrante_id: 'u1',
  projeto_nome: null,
  quantidade: 5,
  data: '2026-07-01',
  encerrado_em: null,
  devolucoes: [],
  integrante: null,
  item: null,
  ...over,
})

const item = (over: Partial<EstoqueItem>): EstoqueItem => ({
  id: 'i1',
  categoria: 'novelos',
  nome: 'Novelo',
  detalhe: null,
  cor_hex: null,
  quantidade: 20,
  vendidos: 0,
  minimo: 5,
  custo_centavos: null,
  capa_path: null,
  arquivado_em: null,
  ...over,
})

describe('saldoEmprestimo', () => {
  it('sem devoluções o saldo é a quantidade toda', () => {
    expect(saldoEmprestimo(loan({}))).toBe(5)
  })
  it('devolução parcial mantém o restante do saldo', () => {
    expect(
      saldoEmprestimo(
        loan({
          devolucoes: [{ id: 'd1', emprestimo_id: 'e1', quantidade: 2, data: '2026-07-02' }],
        }),
      ),
    ).toBe(3)
  })
})

describe('emprestadoPorItem', () => {
  it('soma saldos de empréstimos do mesmo item e ignora encerrados', () => {
    const map = emprestadoPorItem([
      loan({ id: 'e1', quantidade: 2 }),
      loan({ id: 'e2', quantidade: 3 }),
      loan({ id: 'e3', quantidade: 9, encerrado_em: '2026-07-01T00:00:00Z' }),
      loan({ id: 'e4', item_id: 'i2', quantidade: 1 }),
    ])
    expect(map.get('i1')).toBe(5)
    expect(map.get('i2')).toBe(1)
  })
})

describe('disponível e estoque baixo', () => {
  it('disponível desconta o emprestado', () => {
    expect(disponivel(item({ quantidade: 20 }), 2)).toBe(18)
  })
  it('alerta quando disponível fica no mínimo ou abaixo', () => {
    expect(estoqueBaixo(item({ quantidade: 5, minimo: 3 }), 3)).toBe(true)
    expect(estoqueBaixo(item({ quantidade: 20, minimo: 5 }), 2)).toBe(false)
  })
})
