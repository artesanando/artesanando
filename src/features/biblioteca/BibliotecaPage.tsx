import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import type { ReceitaCategoria } from '../../types/database'
import { abrirPdf, fetchReceitas, filtraReceitas } from './api'
import { CAT_CARD } from './meta'
import { DetalheView } from '../../modals/DetalheView'
import { IconPdf, IconVideo } from '../../components/ui/icons'
import { MenuKebab } from '../../components/ui/controles'
import { useAcoesArquivo } from '../../components/ui/useAcoesItem'
import { separaArquivados } from '../../lib/arquivo'
import { urlsDasCapas } from '../../lib/capa'
import { fmtMedida } from '../../lib/medida'
import { CabecalhoPagina } from '../../components/layout/CabecalhoPagina'

const CHIPS: [ReceitaCategoria | 'todos', string][] = [
  ['todos', 'Todos'],
  ['amigurumi', 'Amigurumis'],
  ['granny', 'Granny'],
  ['faixa', 'Faixas'],
  ['manta', 'Mantas'],
]

export function BibliotecaPage() {
  const { isAdmin, open, openGranny, openFaixa, openLayout, openReceita } = useStore()
  const [busca, setBusca] = useState('')
  const [cat, setCat] = useState<ReceitaCategoria | 'todos'>('todos')
  const [verArquivadas, setVerArquivadas] = useState(false)
  const acoesArquivo = useAcoesArquivo()
  const [params, setParams] = useSearchParams()

  const {
    data: receitas,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['receitas'],
    queryFn: fetchReceitas,
  })

  const { ativos, arquivados } = separaArquivados(receitas ?? [])
  const filtradas = filtraReceitas(verArquivadas ? arquivados : ativos, busca, cat)
  const aberta = (receitas ?? []).find((r) => r.id === params.get('receita'))

  /* Um botão só: a categoria é que troca o editor. Se já há um filtro de
     categoria ligado, ele começa por ela — e o seletor dentro do modal deixa
     mudar de ideia sem fechar nada. */
  const abrirCriador = () => {
    if (cat === 'granny') return openGranny(null)
    if (cat === 'faixa') return openFaixa(null)
    if (cat === 'manta') return openLayout(null)
    open('receita')
  }

  const comCapa = filtradas.filter((r) => r.capa_path).map((r) => r.capa_path!)
  const { data: capas } = useQuery({
    queryKey: ['capas-receitas', comCapa.join(',')],
    queryFn: () => urlsDasCapas(comCapa),
    enabled: comCapa.length > 0,
  })

  const abrir = (id: string) => setParams({ receita: id })
  const fechar = () => setParams({})

  return (
    <div className="pagina">
      <CabecalhoPagina
        titulo="Biblioteca"
        sub={`${ativos.length} receitas e padrões`}
        acoes={
          isAdmin && (
            <button className="pill" style={{ whiteSpace: 'nowrap' }} onClick={abrirCriador}>
              + Adicionar
            </button>
          )
        }
      />
      {/* No celular a busca ficava na mesma linha dos cinco chips, que nao
          quebram: sobravam 30px de campo, onde nao cabe nem uma letra. Agora a
          busca tem a linha dela e os chips rolam de lado. */}
      <div className="barra-filtros">
        <input
          className="field"
          style={{ borderRadius: 99 }}
          placeholder="Buscar receita ou padrão…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label="Buscar receita ou padrão"
        />
        <div className="chips-filtros">
          {CHIPS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              className="chip"
              aria-pressed={cat === k}
              onClick={() => setCat(k)}
            >
              {label}
            </button>
          ))}
          {arquivados.length > 0 && (
            <button
              className="crumb"
              style={{
                border: 'none',
                background: 'none',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
              onClick={() => setVerArquivadas((v) => !v)}
            >
              {verArquivadas ? 'Voltar às ativas' : `Arquivadas (${arquivados.length})`}
            </button>
          )}
        </div>
      </div>
      {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>}
      {isError && (
        <div style={{ fontSize: 13, color: 'var(--accent)' }}>
          Não foi possível carregar a biblioteca. Recarregue a página.
        </div>
      )}
      <div
        className="pgrid"
        style={
          {
            '--cols': 'repeat(auto-fill, minmax(190px, 1fr))',
            '--gap': '16px',
          } as React.CSSProperties
        }
      >
        {filtradas.map((r) => {
          const c = CAT_CARD[r.categoria]
          const capa = r.capa_path ? capas?.get(r.capa_path) : null
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
              {capa ? (
                <img
                  src={capa}
                  alt=""
                  style={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : (
                <div style={{ height: 5, background: c.accent }} />
              )}
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
                {r.largura_cm && r.altura_cm && (
                  <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 2 }}>
                    {fmtMedida({ largura: r.largura_cm, altura: r.altura_cm })}
                  </div>
                )}
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
                  {r.pdf_path || r.video_url ? (
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
                      {r.pdf_path ? <IconPdf /> : <IconVideo />}
                      {r.pdf_path ? 'PDF' : 'Vídeo'}
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
                      acoes={[
                        ...(r.origem === 'manual'
                          ? [{ label: 'Editar', onSelect: () => openReceita(r.id) }]
                          : []),
                        ...acoesArquivo({
                          tabela: 'receitas',
                          id: r.id,
                          nome: `"${r.nome}"`,
                          motivoHistorico: 'Os projetos que usam esta receita',
                          arquivado: Boolean(r.arquivado_em),
                          invalidar: ['receitas'],
                        }),
                      ]}
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
          <button
            className="card-adicionar"
            aria-label="Adicionar à biblioteca"
            onClick={abrirCriador}
          >
            <span aria-hidden style={{ fontSize: 22 }}>
              +
            </span>
            <span aria-hidden style={{ fontSize: 12, fontWeight: 700 }}>
              Adicionar
            </span>
          </button>
        )}
      </div>
      {aberta && (
        <div className="ov" onClick={fechar}>
          <DetalheView
            receitaId={aberta.id}
            nome={aberta.nome}
            categoria={aberta.categoria}
            sub={aberta.sub}
            resumo={aberta.resumo}
            specs={aberta.specs}
            conteudo={aberta.conteudo}
            onClose={fechar}
            capa={aberta.capa_path ? capas?.get(aberta.capa_path) : null}
            footerExtra={
              aberta.pdf_path ? (
                <button className="pill" onClick={() => abrirPdf(aberta.pdf_path!)}>
                  Abrir PDF
                </button>
              ) : aberta.video_url ? (
                <a
                  className="pill"
                  href={aberta.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir vídeo
                </a>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  )
}
