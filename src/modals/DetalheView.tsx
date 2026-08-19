import type { ReactNode } from 'react'
import type { ReceitaCategoria, ReceitaConteudo } from '../types/database'
import { CAT_TAG } from '../features/biblioteca/meta'
import { Lbl } from '../components/ui/bits'
import { ModalBox } from './shared'

export interface DetalheProps {
  nome: string
  categoria: ReceitaCategoria
  sub: string | null
  resumo: string | null
  specs: [string, string][]
  conteudo: ReceitaConteudo
  onClose: () => void
  footerExtra?: ReactNode
}

export function DetalheView({
  nome,
  categoria,
  sub,
  resumo,
  specs,
  conteudo,
  onClose,
  footerExtra,
}: DetalheProps) {
  const meta = CAT_TAG[categoria]

  let body: ReactNode = null
  if (categoria === 'faixa' && conteudo.seq) {
    body = (
      <>
        <Lbl style={{ marginBottom: 9 }}>SEQUÊNCIA DE CORES</Lbl>
        <div
          style={{
            display: 'flex',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #E7D9D2',
            marginBottom: 22,
          }}
        >
          {conteudo.seq.map((c, i) => (
            <div key={i} style={{ flex: 1, height: 40, background: c }} />
          ))}
        </div>
        {conteudo.materiais && (
          <>
            <Lbl style={{ marginBottom: 10 }}>MATERIAIS</Lbl>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
              {conteudo.materiais.map((m) => (
                <div
                  key={m.name}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      background: m.c,
                      border: '1px solid rgba(0,0,0,.1)',
                      flex: 'none',
                    }}
                  />
                  <span style={{ flex: 1, fontWeight: 700 }}>{m.name}</span>
                  <span style={{ color: 'var(--muted)' }}>{m.qty}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    )
  } else if (categoria === 'manta') {
    const esquemaRows = conteudo.esquema
    const cells = conteudo.cells
    const modelos = conteudo.modelos
    body = (
      <>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 24,
            alignItems: 'start',
            marginBottom: 22,
          }}
        >
          <div>
            <Lbl style={{ marginBottom: 9 }}>ESQUEMA</Lbl>
            {esquemaRows && (
              <div
                style={{
                  border: '1.5px solid #D8C7BF',
                  borderRadius: 6,
                  overflow: 'hidden',
                  width: 150,
                }}
              >
                {esquemaRows.map((r, i) => (
                  <div key={i} style={{ display: 'flex', height: 20 }}>
                    {r.map((c, j) => (
                      <div key={j} style={{ flex: 1, background: c }} />
                    ))}
                  </div>
                ))}
              </div>
            )}
            {cells && modelos && (
              <div
                style={{
                  display: 'inline-grid',
                  gridTemplateColumns: `repeat(${cells[0]?.length ?? 1}, 16px)`,
                  gap: 2,
                  background: 'var(--sand)',
                  padding: 5,
                  borderRadius: 6,
                }}
              >
                {cells.flatMap((row, r) =>
                  row.map((m, c) => {
                    const md = modelos[m]
                    return (
                      <div
                        key={`${r}-${c}`}
                        style={{
                          width: 16,
                          height: 16,
                          background: md?.border ?? '#ccc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                        }}
                      >
                        <div style={{ width: 8, height: 8, background: md?.inner ?? '#eee' }} />
                      </div>
                    )
                  }),
                )}
              </div>
            )}
          </div>
          {conteudo.paleta && (
            <div>
              <Lbl style={{ marginBottom: 9 }}>PALETA</Lbl>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {conteudo.paleta.map((p) => (
                  <div
                    key={p.name}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        background: p.c,
                        border: '1px solid rgba(0,0,0,.1)',
                        flex: 'none',
                      }}
                    />
                    <span style={{ fontWeight: 700 }}>{p.name}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}>
                Toda faixa usa essas cores — só muda a ordem.
              </div>
            </div>
          )}
        </div>
        {conteudo.montagem && (
          <>
            <Lbl style={{ marginBottom: 11 }}>MONTAGEM</Lbl>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {conteudo.montagem.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 11,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: 'var(--ink-soft)',
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--chip-rose)',
                      color: 'var(--accent)',
                      fontWeight: 800,
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    )
  } else if (categoria === 'granny' && conteudo.rings) {
    const dr = conteudo.rings
    const squares = dr
      .map((r, i) => ({ c: r.c, sz: 132 - (dr.length - 1 - i) * (108 / dr.length) }))
      .reverse()
    body = (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 24,
          alignItems: 'start',
          marginBottom: 22,
        }}
      >
        <div>
          <Lbl style={{ marginBottom: 9 }}>PRÉVIA</Lbl>
          <div
            style={{
              width: 132,
              height: 132,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              overflow: 'hidden',
              background: 'var(--sand)',
            }}
          >
            {squares.map((ring, i) => (
              <div
                key={i}
                style={{ position: 'absolute', width: ring.sz, height: ring.sz, background: ring.c }}
              />
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
            centro → borda
          </div>
        </div>
        <div>
          <Lbl style={{ marginBottom: 9 }}>CARREIRAS</Lbl>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dr.map((r, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    background: r.c,
                    border: '1px solid rgba(0,0,0,.1)',
                    flex: 'none',
                  }}
                />
                <span style={{ flex: 1, fontWeight: 700 }}>
                  {r.name}{' '}
                  {r.role && (
                    <span style={{ color: 'var(--faint)', fontWeight: 600 }}>· {r.role}</span>
                  )}
                </span>
                <span style={{ color: 'var(--muted)' }}>{r.n}×</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <ModalBox maxWidth={600} noPadding>
      <div
        style={{
          background: meta.tBg,
          padding: '22px 26px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span className="tag" style={{ background: 'var(--card)', color: meta.tC }}>
            {meta.tag}
          </span>
          <div className="h" style={{ fontSize: 23, marginTop: 10 }}>
            {nome}
          </div>
          {sub && <div style={{ fontSize: 12, color: '#7A6C62', marginTop: 2 }}>{sub}</div>}
        </div>
        <button className="x" onClick={onClose}>
          ×
        </button>
      </div>
      <div style={{ padding: '22px 26px' }}>
        {resumo && (
          <div
            style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)', marginBottom: 20 }}
          >
            {resumo}
          </div>
        )}
        {specs.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: 10,
              marginBottom: 24,
            }}
          >
            {specs.map(([k, v]) => (
              <div
                key={k}
                style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}
              >
                <Lbl style={{ marginBottom: 4 }}>{k}</Lbl>
                <div className="h" style={{ fontSize: 15 }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
        )}
        {body}
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            marginTop: 24,
            paddingTop: 18,
            borderTop: '1px solid var(--border)',
          }}
        >
          <button className="pill ghost" onClick={onClose}>
            Fechar
          </button>
          {footerExtra}
        </div>
      </div>
    </ModalBox>
  )
}
