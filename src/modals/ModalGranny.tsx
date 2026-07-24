import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../state/store'
import { useAuth } from '../state/auth'
import { PALETTE } from '../mocks/data'
import { Lbl } from '../components/ui/bits'
import { ModalBox, ModalHeader } from './shared'
import { criarReceita } from '../features/biblioteca/api'

export function ModalGranny() {
  const {
    grannyRings: rings,
    grannyInc,
    grannyDec,
    grannyDel,
    grannyAdd,
    grannySetColor,
    backToProjeto,
  } = useStore()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [nome, setNome] = useState('Novo granny')
  const [erro, setErro] = useState<string | null>(null)

  const total = rings.reduce((s, r) => s + r.n, 0)

  const salvar = useMutation({
    mutationFn: () =>
      criarReceita({
        nome: nome.trim() || 'Granny sem nome',
        categoria: 'granny',
        sub: `granny square · ${total} carreiras`,
        resumo: null,
        specs: [
          ['Carreiras', String(total)],
          ['Cores', String(rings.length)],
        ],
        conteudo: {
          rings: rings.map((r, i) => ({
            ...r,
            role: i === 0 ? 'miolo' : i === rings.length - 1 ? 'borda' : 'meio',
          })),
        },
        origem: 'criador',
        criado_por: profile!.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receitas'] })
      backToProjeto()
    },
    onError: () => setErro('Não foi possível salvar o padrão.'),
  })
  const nameOf = (i: number) => (i === 0 ? ' · miolo' : i === rings.length - 1 ? ' · borda' : '')
  // prévia: quadrados concêntricos, borda (última) por fora → miolo (primeira) no centro
  const n = rings.length
  const preview = rings
    .map((r, i) => ({ c: r.c, sz: 128 - (n - 1 - i) * (104 / n) }))
    .reverse()

  return (
    <ModalBox maxWidth={580}>
      <ModalHeader
        title="Padrão de granny square"
        sub="Vai para a biblioteca e pode ser usado em qualquer manta"
      />
      <Lbl style={{ marginBottom: 7 }}>NOME</Lbl>
      <input
        className="field"
        style={{ marginBottom: 20 }}
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="lbl">COR · DO CENTRO P/ FORA</span>
            <span className="lbl">CARREIRAS</span>
          </div>
          {rings.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: '1px solid var(--field-border)',
                borderRadius: 12,
                background: 'var(--card)',
                padding: '9px 12px',
                marginBottom: 7,
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: r.c,
                  border: '1px solid rgba(0,0,0,.1)',
                  flex: 'none',
                }}
              />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                {r.name}
                {nameOf(i)}
              </span>
              <span
                onClick={() => grannyDec(i)}
                style={{
                  cursor: 'pointer',
                  color: 'var(--faint)',
                  fontWeight: 800,
                  fontSize: 16,
                  padding: '0 4px',
                }}
              >
                −
              </span>
              <span
                style={{
                  border: '1px solid var(--field-border)',
                  borderRadius: 8,
                  padding: '3px 11px',
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'var(--accent)',
                  minWidth: 26,
                  textAlign: 'center',
                }}
              >
                {r.n}
              </span>
              <span
                onClick={() => grannyInc(i)}
                style={{
                  cursor: 'pointer',
                  color: 'var(--accent)',
                  fontWeight: 800,
                  fontSize: 16,
                  padding: '0 4px',
                }}
              >
                +
              </span>
              {rings.length > 1 && (
                <span
                  onClick={() => grannyDel(i)}
                  style={{ cursor: 'pointer', color: 'var(--faint-3)', fontSize: 15 }}
                >
                  ✕
                </span>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0 4px' }}>
            {PALETTE.map(([c, name]) => (
              <span
                key={c}
                onClick={() => grannySetColor(c, name)}
                title={name}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: c,
                  border: '1px solid rgba(0,0,0,.12)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
          <div
            onClick={grannyAdd}
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: 'var(--accent)',
              padding: '6px 2px',
              cursor: 'pointer',
            }}
          >
            + Adicionar cor
          </div>
          <div
            style={{
              borderTop: '1px dashed var(--field-border)',
              marginTop: 6,
              paddingTop: 10,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
            }}
          >
            <span style={{ color: 'var(--muted)', fontWeight: 700 }}>Total de carreiras</span>
            <b className="h" style={{ fontSize: 16 }}>
              {total}
            </b>
          </div>
        </div>
        <div style={{ width: 140, flex: 'none' }}>
          <Lbl style={{ marginBottom: 8 }}>PRÉVIA</Lbl>
          <div
            style={{
              width: 128,
              height: 128,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              overflow: 'hidden',
              background: 'var(--sand)',
            }}
          >
            {preview.map((ring, i) => (
              <div
                key={i}
                style={{ position: 'absolute', width: ring.sz, height: ring.sz, background: ring.c }}
              />
            ))}
          </div>
          <div
            style={{ fontSize: 10.5, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}
          >
            anéis do centro → borda
          </div>
        </div>
      </div>
      {erro && (
        <div
          role="alert"
          style={{
            background: 'var(--chip-soft)',
            border: '1px solid var(--chip-rose-border)',
            borderRadius: 10,
            padding: '9px 13px',
            fontSize: 12.5,
            color: 'var(--primary-dark)',
            marginTop: 16,
          }}
        >
          {erro}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
        <button className="pill ghost" onClick={backToProjeto}>
          Voltar
        </button>
        <button className="pill" disabled={salvar.isPending} onClick={() => salvar.mutate()}>
          {salvar.isPending ? 'Salvando…' : 'Salvar padrão'}
        </button>
      </div>
    </ModalBox>
  )
}
