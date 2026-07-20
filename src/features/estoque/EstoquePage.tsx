import { useState, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import type { EstoqueCategoria, EstoqueItem } from '../../types/database'
import {
  disponivel,
  emprestadoPorItem,
  estoqueBaixo,
  fetchEmprestimosAtivos,
  fetchEstoque,
  saldoEmprestimo,
} from './api'

export const ESTO_TABS: [EstoqueCategoria, string][] = [
  ['novelos', 'Novelos'],
  ['agulhas', 'Agulhas'],
  ['olhos', 'Olhos & segurança'],
  ['enchimento', 'Enchimento'],
  ['feira', 'Itens de feira'],
]

const COLS: Record<EstoqueCategoria, [string, string, string, string]> = {
  novelos: ['MARCA / LINHA', 'COR', 'DISP.', 'EMPR.'],
  agulhas: ['TIPO', 'MEDIDA', 'DISP.', 'EMPR.'],
  olhos: ['ITEM', 'TAMANHO', 'DISP.', 'EMPR.'],
  enchimento: ['ITEM', 'ESPECIFICAÇÃO', 'DISP.', 'EMPR.'],
  feira: ['ITEM', 'DETALHE', 'DISP.', 'VENDIDOS'],
}

const UNIT: Record<EstoqueCategoria, string> = {
  novelos: 'novelos',
  agulhas: 'agulhas e ganchos',
  olhos: 'olhos e itens de segurança',
  enchimento: 'enchimento',
  feira: 'itens de feira',
}

const tabStyle = (on: boolean): CSSProperties =>
  on
    ? {
        padding: '7px 15px',
        borderRadius: 99,
        background: 'var(--primary)',
        color: '#fff',
        fontWeight: 800,
        fontSize: 12.5,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }
    : {
        padding: '7px 15px',
        borderRadius: 99,
        border: '1px solid var(--field-border)',
        color: 'var(--ink-soft)',
        fontWeight: 700,
        fontSize: 12.5,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }

function fmtData(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export function EstoquePage() {
  const { isAdmin, open, openDevolucao } = useStore()
  const [estoTab, setEstoTab] = useState<EstoqueCategoria>('novelos')

  const { data: itens, isLoading, isError } = useQuery({ queryKey: ['estoque'], queryFn: fetchEstoque })
  const { data: loans } = useQuery({ queryKey: ['emprestimos'], queryFn: fetchEmprestimosAtivos })

  const emprestados = emprestadoPorItem(loans ?? [])
  const rows = (itens ?? []).filter((i) => i.categoria === estoTab)
  const count = rows.reduce((s, i) => s + disponivel(i, emprestados.get(i.id) ?? 0), 0)

  const renderRow = (item: EstoqueItem) => {
    const emp = emprestados.get(item.id) ?? 0
    const disp = disponivel(item, emp)
    const low = item.categoria !== 'feira' && estoqueBaixo(item, emp)
    const ultima = item.categoria === 'feira' ? item.vendidos : emp
    return (
      <div
        key={item.id}
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1.2fr .7fr .9fr',
          padding: '13px 2px',
          borderBottom: '1px solid var(--border)',
          fontSize: 13,
          alignItems: 'center',
        }}
      >
        <div style={{ fontWeight: 800 }}>{item.nome}</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 600,
            color: 'var(--ink-soft)',
          }}
        >
          {item.cor_hex && (
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: item.cor_hex,
                border: '1px solid rgba(0,0,0,.08)',
                flex: 'none',
              }}
            />
          )}
          {item.detalhe}
        </div>
        <div>
          <span
            className="tag"
            style={{
              background: low ? 'var(--chip-warn)' : 'var(--chip-green)',
              color: low ? 'var(--gold-dark)' : 'var(--green-dark)',
            }}
          >
            {disp}
            {low ? ' ⚠' : ''}
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
      </div>
    )
  }

  return (
    <div style={{ padding: '30px 40px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 22,
        }}
      >
        <div>
          <div className="h" style={{ fontWeight: 500, fontSize: 28 }}>
            Estoque
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Materiais e itens do projeto, organizados por tipo
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isAdmin && (
            <button className="pill ghost" onClick={() => open('material')}>
              + Material
            </button>
          )}
          <button className="pill ghost" onClick={() => openDevolucao(null)}>
            Devolução
          </button>
          <button className="pill" onClick={() => open('emprestimo')}>
            + Empréstimo
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {ESTO_TABS.map(([k, label]) => (
          <div key={k} onClick={() => setEstoTab(k)} style={tabStyle(k === estoTab)}>
            {label}
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: 40,
          alignItems: 'start',
        }}
      >
        <div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
            <b style={{ color: 'var(--ink)' }}>{count}</b> {UNIT[estoTab]} em estoque
          </div>
          <div
            className="lbl"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 1.2fr .7fr .9fr',
              padding: '8px 2px',
              borderBottom: '1px solid var(--border-strong)',
            }}
          >
            {COLS[estoTab].map((c) => (
              <div key={c}>{c}</div>
            ))}
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
          {rows.map(renderRow)}
        </div>
        <div>
          <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
            Empréstimos ativos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(loans ?? []).length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Nenhum empréstimo em aberto.
              </div>
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
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: 'var(--accent)',
                    cursor: 'pointer',
                  }}
                  onClick={() => openDevolucao(e.id)}
                >
                  Registrar devolução →
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
