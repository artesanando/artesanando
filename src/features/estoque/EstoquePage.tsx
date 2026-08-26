import { useState, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import { useAuth } from '../../state/auth'
import { MenuKebab } from '../../components/ui/controles'
import { useAcoesArquivo } from '../../components/ui/useAcoesItem'
import { separaArquivados } from '../../lib/arquivo'
import { urlsDasCapas } from '../../lib/capa'
import type { EstoqueCategoria, EstoqueItem } from '../../types/database'
import { CabecalhoPagina } from '../../components/layout/CabecalhoPagina'
import { useOrdenacao } from '../../components/ui/useOrdenacao'
import { ColunaOrdenavel } from '../../components/ui/CabecalhoOrdenavel'
import {
  disponivel,
  emprestadoPorItem,
  fetchEmprestimosAtivos,
  fetchEstoque,
  saldoEmprestimo,
} from './api'

export const ESTO_TABS: [EstoqueCategoria, string][] = [
  ['novelos', 'Novelos'],
  ['agulhas', 'Agulhas'],
  ['outros', 'Outros'],
  ['feira', 'Itens de feira'],
]

/* As quatro colunas mudam de rótulo por aba, mas ordenam sempre o mesmo dado */
type ChaveEstoque = 'nome' | 'detalhe' | 'disponivel' | 'ultima'
const CHAVES: ChaveEstoque[] = ['nome', 'detalhe', 'disponivel', 'ultima']

const COLS: Record<EstoqueCategoria, [string, string, string, string]> = {
  novelos: ['MARCA / LINHA', 'COR', 'DISP.', 'EMPR.'],
  agulhas: ['TIPO', 'MEDIDA', 'DISP.', 'EMPR.'],
  outros: ['ITEM', 'DETALHE', 'DISP.', 'EMPR.'],
  feira: ['ITEM', 'DETALHE', 'DISP.', 'VENDIDOS'],
}

/* Unidade que aparece em "N ... em estoque". Agulha de tricô e gancho de crochê
   são coisas diferentes, e o projeto só tem agulha — a categoria fala só delas.
   Olhos e enchimento moravam em abas próprias quase vazias e agora dividem
   "Outros" com todo o resto; o que separa um do outro é o detalhe. */
const UNIT: Record<EstoqueCategoria, string> = {
  novelos: 'novelos',
  agulhas: 'agulhas',
  outros: 'itens',
  feira: 'itens de feira',
}

function fmtData(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export function EstoquePage() {
  const { isAdmin, openMaterial, openMovimentoEstoque, open, openDevolucao } = useStore()
  const { can } = useAuth()
  const acoesArquivo = useAcoesArquivo()
  const [estoTab, setEstoTab] = useState<EstoqueCategoria>('novelos')
  const ord = useOrdenacao<ChaveEstoque>('nome')
  const [verArquivados, setVerArquivados] = useState(false)

  const {
    data: itens,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['estoque'], queryFn: fetchEstoque })
  const { data: loans } = useQuery({ queryKey: ['emprestimos'], queryFn: fetchEmprestimosAtivos })

  const comCapa = (itens ?? []).filter((i) => i.capa_path).map((i) => i.capa_path!)
  const { data: capas } = useQuery({
    queryKey: ['capas-estoque', comCapa.join(',')],
    queryFn: () => urlsDasCapas(comCapa),
    enabled: comCapa.length > 0,
  })

  const emprestados = emprestadoPorItem(loans ?? [])
  const { ativos, arquivados } = separaArquivados(itens ?? [])
  const rows = (verArquivados ? arquivados : ativos).filter((i) => i.categoria === estoTab)
  const count = rows.reduce((s, i) => s + disponivel(i, emprestados.get(i.id) ?? 0), 0)

  const ordenados = ord.ordenar(rows, (i, k) =>
    k === 'nome'
      ? i.nome
      : k === 'detalhe'
        ? (i.detalhe ?? '')
        : k === 'disponivel'
          ? disponivel(i, emprestados.get(i.id) ?? 0)
          : i.categoria === 'feira'
            ? i.vendidos
            : (emprestados.get(i.id) ?? 0),
  )

  const podeMexer = can('devolucoes')

  const renderRow = (item: EstoqueItem) => {
    const emp = emprestados.get(item.id) ?? 0
    const disp = disponivel(item, emp)
    const ultima = item.categoria === 'feira' ? item.vendidos : emp
    const capa = item.capa_path ? capas?.get(item.capa_path) : null
    return (
      <div key={item.id} className="linha-estoque">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          {/* sem foto, a cor do item (ou a da categoria) já identifica a linha */}
          <span className="miniatura-item" style={{ background: item.cor_hex ?? 'var(--sand)' }}>
            {capa && <img src={capa} alt="" />}
          </span>
          <span style={{ fontWeight: 800, minWidth: 0 }}>{item.nome}</span>
        </div>
        {/* a cor do fio já está na miniatura; aqui fica só o texto */}
        <div style={{ fontWeight: 600, color: 'var(--ink-soft)' }}>{item.detalhe}</div>
        <div>
          <span
            className="tag"
            style={{ background: 'var(--chip-green)', color: 'var(--green-dark)' }}
          >
            {disp}
          </span>
        </div>
        <div style={{ fontSize: 12 }}>
          {ultima === 0 ? (
            <span style={{ color: 'var(--faint-3)', fontWeight: 700 }}>—</span>
          ) : (
            <span className="tag" style={{ background: 'var(--chip-rose)', color: 'var(--accent)' }}>
              {ultima}
            </span>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          {podeMexer && (
            <MenuKebab
              ariaLabel={`Ações de ${item.nome}`}
              acoes={[
                { label: 'Editar', onSelect: () => openMaterial(item.id) },
                {
                  label: 'Movimentar estoque',
                  onSelect: () => openMovimentoEstoque(item.id),
                },
                ...(isAdmin
                  ? acoesArquivo({
                      tabela: 'estoque_itens',
                      id: item.id,
                      nome: `o material "${item.nome}"`,
                      motivoHistorico: 'Os empréstimos e as movimentações dele',
                      arquivado: Boolean(item.arquivado_em),
                      invalidar: ['estoque'],
                    })
                  : []),
              ]}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="pagina">
      <CabecalhoPagina
        titulo="Estoque"
        sub={`${ativos.length} materiais cadastrados`}
        acoes={
          podeMexer && (
            <>
              <button className="pill ghost" onClick={() => openMaterial(null)}>
                + Material
              </button>
              <button className="pill ghost" onClick={() => openDevolucao(null)}>
                Devolução
              </button>
              <button className="pill" onClick={() => open('emprestimo')}>
                + Empréstimo
              </button>
            </>
          )
        }
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {ESTO_TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            className="chip"
            aria-pressed={k === estoTab}
            onClick={() => setEstoTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="pgrid" style={{ '--cols': '1.5fr 1fr', '--gap': '40px' } as CSSProperties}>
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              <b style={{ color: 'var(--ink)' }}>{count}</b> {UNIT[estoTab]}{' '}
              {verArquivados ? 'em itens arquivados' : 'em estoque'}
            </div>
            {arquivados.length > 0 && (
              <button
                className="crumb"
                style={{ border: 'none', background: 'none', fontFamily: 'inherit' }}
                onClick={() => setVerArquivados((v) => !v)}
              >
                {verArquivados ? 'Voltar aos ativos' : `Arquivados (${arquivados.length})`}
              </button>
            )}
          </div>

          <div className="lbl linha-estoque cabecalho" role="row">
            {COLS[estoTab].map((c, i) => {
              const k = CHAVES[i]
              return (
                <ColunaOrdenavel
                  key={c}
                  rotulo={c}
                  ativa={ord.coluna === k}
                  direcao={ord.direcao}
                  aoClicar={() => ord.alternar(k, k === 'nome' || k === 'detalhe' ? 'asc' : 'desc')}
                />
              )
            })}
            <div />
          </div>

          {isLoading && (
            <div style={{ padding: 18, fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>
          )}
          {isError && (
            <div style={{ padding: 18, fontSize: 13, color: 'var(--accent)' }}>
              Não foi possível carregar o estoque. Recarregue a página.
            </div>
          )}
          {rows.length === 0 && !isLoading && !isError && (
            <div style={{ padding: 18, fontSize: 13, color: 'var(--muted)' }}>
              Nada cadastrado nesta categoria ainda.
            </div>
          )}
          {ordenados.map(renderRow)}
        </div>

        <div>
          <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
            Empréstimos ativos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(loans ?? []).length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Nenhum empréstimo em aberto.</div>
            )}
            {(loans ?? []).map((e) => (
              <div key={e.id} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <b>{e.integrante?.nome ?? '—'}</b>
                  <span style={{ fontSize: 11, color: 'var(--faint)' }}>{fmtData(e.data)}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '3px 0 8px' }}>
                  {saldoEmprestimo(e)}× {e.item?.nome}
                  {e.item?.detalhe ? ` ${e.item.detalhe}` : ''}
                  {e.projeto_nome ? ` · ${e.projeto_nome}` : ''}
                </div>
                {can('devolucoes') && (
                  <button
                    style={{
                      minHeight: 'var(--toque)',
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      fontFamily: 'inherit',
                    }}
                    onClick={() => openDevolucao(e.id)}
                  >
                    Registrar devolução →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
