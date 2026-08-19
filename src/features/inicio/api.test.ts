import { describe, expect, it } from 'vitest'
import { novelosKpis, primeiroNome, projetosAtivos, saudacao } from './api'
import type { EstoqueItem } from '../../types/database'
import type { EmprestimoAtivo } from '../estoque/api'

const item = (id: string, categoria: EstoqueItem['categoria'], quantidade: number): EstoqueItem => ({
  id,
  categoria,
  nome: id,
  detalhe: null,
  cor_hex: null,
  quantidade,
  vendidos: 0,
  minimo: 0,
  custo_centavos: null,
  capa_path: null,
  arquivado_em: null,
})

const loan = (item_id: string, quantidade: number): EmprestimoAtivo => ({
  id: `e-${item_id}`,
  item_id,
  integrante_id: 'u1',
  projeto_nome: null,
  quantidade,
  data: '2026-07-01',
  encerrado_em: null,
  devolucoes: [],
  integrante: null,
  item: null,
})

describe('kpis da pagina inicial', () => {
  it('novelos em estoque descontam os emprestados; agulhas não contam', () => {
    const itens = [item('n1', 'novelos', 20), item('n2', 'novelos', 10), item('a1', 'agulhas', 8)]
    const loans = [loan('n1', 2), loan('a1', 3)]
    expect(novelosKpis(itens, loans)).toEqual({ emEstoque: 28, emprestados: 2 })
  })
  it('projetos ativos separam mantas de amigurumis e ignoram entregues', () => {
    expect(
      projetosAtivos([
        { tipo: 'manta_croche', status: 'ativo' },
        { tipo: 'manta_trico', status: 'ativo' },
        { tipo: 'amigurumi', status: 'ativo' },
        { tipo: 'amigurumi', status: 'entregue' },
      ]),
    ).toEqual({ mantas: 2, amigurumis: 1 })
  })
  it('saudação segue a hora do dia', () => {
    expect(saudacao(8)).toBe('Bom dia')
    expect(saudacao(15)).toBe('Boa tarde')
    expect(saudacao(20)).toBe('Boa noite')
  })
  it('primeiro nome para a saudação', () => {
    expect(primeiroNome('Cândida Nunes')).toBe('Cândida')
  })
})
