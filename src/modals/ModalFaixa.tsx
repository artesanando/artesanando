import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../state/store'
import { useAuth } from '../state/auth'
import { Lbl } from '../components/ui/bits'
import { ModalBox, ModalHeader } from './shared'
import { SeletorCategoria } from './SeletorCategoria'
import { criarReceita } from '../features/biblioteca/api'

export function ModalFaixa() {
  const { faixaSeq, faixaCount, faixaCycle, faixaAdd, faixaDrop, incFaixa, decFaixa, backToProjeto } =
    useStore()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [nome, setNome] = useState('Novo padrão de faixa')
  const [erro, setErro] = useState<string | null>(null)

  const rowH = Math.max(5, Math.round(150 / faixaCount))

  const salvar = useMutation({
    mutationFn: () =>
      criarReceita({
        nome: nome.trim() || 'Faixa sem nome',
        categoria: 'faixa',
        sub: `faixa de tricô · ${faixaSeq.length} cores`,
        resumo: null,
        specs: [
          ['Faixas', String(faixaCount)],
          ['Cores', String(faixaSeq.length)],
        ],
        conteudo: { seq: faixaSeq, faixas: faixaCount },
        origem: 'criador',
        criado_por: profile!.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receitas'] })
      backToProjeto()
    },
    onError: () => setErro('Não foi possível salvar o padrão.'),
  })

  return (
    <ModalBox maxWidth={560}>
      <ModalHeader title="Adicionar à biblioteca" />
      <SeletorCategoria atual="faixa" />
      <Lbl style={{ marginBottom: 7 }}>NOME</Lbl>
      <input
        className="field"
        style={{ marginBottom: 18 }}
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <Lbl style={{ marginBottom: 9 }}>SEQUÊNCIA DE CORES DA FAIXA</Lbl>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            display: 'flex',
            borderRadius: 6,
            overflow: 'hidden',
            border: '1px solid var(--field-border)',
          }}
        >
          {faixaSeq.map((c, i) => (
            <div
              key={i}
              onClick={() => faixaCycle(i)}
              style={{ width: 36, height: 34, background: c, cursor: 'pointer' }}
            />
          ))}
        </div>
        <span
          onClick={faixaDrop}
          style={{
            cursor: 'pointer',
            color: 'var(--faint)',
            fontWeight: 800,
            fontSize: 18,
            padding: '0 4px',
          }}
        >
          −
        </span>
        <span
          onClick={faixaAdd}
          style={{
            cursor: 'pointer',
            color: 'var(--accent)',
            fontWeight: 800,
            fontSize: 18,
            padding: '0 4px',
          }}
        >
          +
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 20 }}>
        A sequência se repete ao longo da largura da manta.
      </div>
      <Lbl style={{ marginBottom: 7 }}>QUANTIDADE DE FAIXAS</Lbl>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div
          className="field"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: 120,
          }}
        >
          <span
            onClick={decFaixa}
            style={{ cursor: 'pointer', color: 'var(--faint)', fontWeight: 800 }}
          >
            −
          </span>
          <b>{faixaCount}</b>
          <span
            onClick={incFaixa}
            style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 800 }}
          >
            +
          </span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          uma faixa = uma linha inteira, feita por uma integrante
        </span>
      </div>
      <Lbl style={{ marginBottom: 9 }}>PRÉVIA DA MANTA</Lbl>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          background: 'var(--sand)',
          padding: 8,
          borderRadius: 8,
          marginBottom: 22,
        }}
      >
        {Array.from({ length: faixaCount }, (_, i) => (
          <div key={i} style={{ display: 'flex', borderRadius: 3, overflow: 'hidden' }}>
            {faixaSeq.map((c, j) => (
              <div key={j} style={{ flex: 1, height: rowH, background: c }} />
            ))}
          </div>
        ))}
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
            marginBottom: 14,
          }}
        >
          {erro}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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
