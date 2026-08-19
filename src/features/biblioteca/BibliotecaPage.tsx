import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import type { ReceitaCategoria } from '../../types/database'
import { abrirPdf, fetchReceitas, filtraReceitas } from './api'
import { CAT_CARD } from './meta'
import { DetalheView } from '../../modals/DetalheView'
import { IconPdf } from '../../components/ui/icons'
import { MenuKebab } from '../../components/ui/controles'
import { useAcoesArquivo } from '../../components/ui/useAcoesItem'
import { separaArquivados } from '../../lib/arquivo'

const CHIPS: [ReceitaCategoria | 'todos', string][] = [
  ['todos', 'Todos'],
  ['amigurumi', 'Amigurumis'],
  ['granny', 'Granny'],
  ['faixa', 'Faixas'],
  ['manta', 'Mantas'],
]

export function BibliotecaPage() {
  const { isAdmin, open, openGranny, openFaixa } = useStore()
  const [busca, setBusca] = useState('')
  const [cat, setCat] = useState<ReceitaCategoria | 'todos'>('todos')
  const [verArquivadas, setVerArquivadas] = useState(false)
  const acoesArquivo = useAcoesArquivo()
  const [params, setParams] = useSearchParams()

  const { data: receitas, isLoading, isError } = useQuery({
    queryKey: ['receitas'],
    queryFn: fetchReceitas,
  })

  const { ativos, arquivados } = separaArquivados(receitas ?? [])
  const filtradas = filtraReceitas(verArquivadas ? arquivados : ativos, busca, cat)
  const aberta = (receitas ?? []).find((r) => r.id === params.get('receita'))

  const abrir = (id: string) => setParams({ receita: id })
  const fechar = () => setParams({})

  return (
    <div className="pagina">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div className="h" style={{ fontWeight: 500, fontSize: 28 }}>
          Biblioteca
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="pill ghost"
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => openGranny(null)}
            >
              + Granny
            </button>
            <button
              className="pill ghost"
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => openFaixa(null)}
            >
              + Faixa
            </button>
            <button
              className="pill"
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => open('receita')}
            >
              + Receita
            </button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, alignItems: 'center' }}>
        <input
          className="field"
          style={{ flex: 1, borderRadius: 99 }}
          placeholder="🔍 Buscar receita ou padrão…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label="Buscar receita ou padrão"
        />
        {CHIPS.map(([k, label]) => (
          <span
            key={k}
            className="tag"
            onClick={() => setCat(k)}
            style={{
              cursor: 'pointer',
              padding: '6px 14px',
              whiteSpace: 'nowrap',
              ...(cat === k
                ? { background: 'var(--primary)', color: '#fff' }
                : { border: '1px solid var(--field-border)', color: 'var(--ink-soft)' }),
            }}
          >
            {label}
          </span>
        ))}
        {arquivados.length > 0 && (
          <button
            className="crumb"
            style={{ border: 'none', background: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            onClick={() => setVerArquivadas((v) => !v)}
          >
            {verArquivadas ? '‹ Ativas' : `Arquivadas (${arquivados.length}) ›`}
          </button>
        )}
      </div>
      {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>}
      {isError && (
        <div style={{ fontSize: 13, color: 'var(--accent)' }}>
          Não foi possível carregar a biblioteca. Recarregue a página.
        </div>
      )}
      <div
        className="pgrid"
        style={{ '--cols': 'repeat(4,1fr)', '--gap': '16px' } as React.CSSProperties}
      >
        {filtradas.map((r) => {
          const c = CAT_CARD[r.categoria]
          return (
            <div
              key={r.id}
              className="card"
              onClick={() => abrir(r.id)}
              style={{
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ height: 5, background: c.accent }} />
              <div
                style={{
                  padding: '16px 16px 14px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: c.fg,
                    background: c.chip,
                    padding: '4px 10px',
                    borderRadius: 99,
                  }}
                >
                  {c.lbl}
                </span>
                <div
                  style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25, margin: '12px 0 4px' }}
                >
                  {r.nome}
                </div>
                {r.sub && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.sub}</div>}
                <div style={{ flex: 1 }} />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid var(--divider)',
                  }}
                >
                  {r.pdf_path ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--accent)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <IconPdf />
                      PDF
                    </span>
                  ) : (
                    <span />
                  )}
                  <span
                    style={{ display: 'flex', alignItems: 'center', gap: 2 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      style={{ fontSize: 12, fontWeight: 700, color: c.fg, whiteSpace: 'nowrap' }}
                    >
                      Abrir →
                    </span>
                    <MenuKebab
                      ariaLabel={`Ações de ${r.nome}`}
                      acoes={acoesArquivo({
                        tabela: 'receitas',
                        id: r.id,
                        nome: `"${r.nome}"`,
                        rotulo: 'a receita',
                        motivoHistorico: 'Os projetos que usam esta receita',
                        arquivado: Boolean(r.arquivado_em),
                        invalidar: ['receitas'],
                      })}
                    />
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        {!isLoading && filtradas.length === 0 && !isError && (
          <div
            style={{
              gridColumn: '1 / -1',
              fontSize: 13,
              color: 'var(--muted)',
              padding: '18px 2px',
            }}
          >
            Nenhuma receita encontrada{busca ? ` para "${busca}"` : ''}.
          </div>
        )}
        {isAdmin && (
          <div
            onClick={() => open('receita')}
            style={{
              border: '2px dashed var(--field-border)',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: 'var(--faint)',
              cursor: 'pointer',
              minHeight: 150,
            }}
          >
            <div style={{ fontSize: 22 }}>+</div>
            <div style={{ fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
              Adicionar
              <br />
              receita ou padrão
            </div>
          </div>
        )}
      </div>
      {aberta && (
        <div className="ov" onClick={fechar}>
          <DetalheView
            nome={aberta.nome}
            categoria={aberta.categoria}
            sub={aberta.sub}
            resumo={aberta.resumo}
            specs={aberta.specs}
            conteudo={aberta.conteudo}
            onClose={fechar}
            footerExtra={
              aberta.pdf_path ? (
                <button className="pill" onClick={() => abrirPdf(aberta.pdf_path!)}>
                  Abrir PDF
                </button>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  )
}
