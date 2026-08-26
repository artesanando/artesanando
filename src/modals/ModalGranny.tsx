import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../state/store'
import { useAuth } from '../state/auth'
import { Lbl } from '../components/ui/bits'
import { ColorPicker } from '../components/ui/controles'
import { CampoMedida } from '../components/ui/CampoMedida'
import { ModalBox, ModalHeader } from './shared'
import { SeletorCategoria } from './SeletorCategoria'
import { criarReceita } from '../features/biblioteca/api'
import { fmtMedida } from '../lib/medida'
import { IconX } from '../components/ui/icons'
import { useFios } from '../features/estoque/useFios'

const passo = (cor: string): React.CSSProperties => ({
  border: 'none',
  background: 'none',
  fontFamily: 'inherit',
  cursor: 'pointer',
  color: cor,
  fontWeight: 800,
  fontSize: 15,
  padding: '2px 5px',
})

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
  const fios = useFios()
  const qc = useQueryClient()
  const [nome, setNome] = useState('Novo granny')
  const [medida, setMedida] = useState<{ largura: number | null; altura: number | null }>({
    largura: null,
    altura: null,
  })
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
          ...(medida.largura && medida.altura
            ? ([['Tamanho', fmtMedida({ largura: medida.largura, altura: medida.altura })]] as [
                string,
                string,
              ][])
            : []),
        ],
        largura_cm: medida.largura,
        altura_cm: medida.altura,
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
  const preview = rings.map((r, i) => ({ c: r.c, sz: 128 - (n - 1 - i) * (104 / n) })).reverse()

  return (
    <ModalBox maxWidth={580}>
      <ModalHeader title="Adicionar à biblioteca" />
      <SeletorCategoria atual="granny" />
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
            <span className="lbl">CORES · DO CENTRO PARA FORA</span>
            <span className="lbl">CARREIRAS</span>
          </div>
          {rings.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid var(--field-border)',
                borderRadius: 12,
                background: 'var(--card)',
                padding: '9px 12px',
                marginBottom: 7,
                flexWrap: 'wrap',
              }}
            >
              {/* mesmo seletor do cadastro de novelo: a paleta de fios e, se
                  precisar, qualquer outra cor */}
              <span style={{ flex: 1, minWidth: 130 }}>
                <ColorPicker
                  fios={fios}
                  value={r.c}
                  ariaLabel={`Cor da carreira ${i + 1}${nameOf(i)}`}
                  onChange={(c) => grannySetColor(i, c)}
                />
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--faint)', fontWeight: 700 }}>
                {nameOf(i).replace(' · ', '')}
              </span>
              <button
                type="button"
                aria-label={`Menos uma carreira em ${r.name}`}
                onClick={() => grannyDec(i)}
                style={passo('var(--faint)')}
              >
                −
              </button>
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
              <button
                type="button"
                aria-label={`Mais uma carreira em ${r.name}`}
                onClick={() => grannyInc(i)}
                style={passo('var(--accent)')}
              >
                +
              </button>
              {rings.length > 1 && (
                <button
                  type="button"
                  aria-label={`Remover a carreira ${i + 1}`}
                  onClick={() => grannyDel(i)}
                  style={passo('var(--faint-3)')}
                >
                  <IconX size={12} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="pill ghost"
            style={{ padding: '6px 14px', fontSize: 12, marginTop: 4 }}
            onClick={grannyAdd}
          >
            + Cor
          </button>
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

          {/* a medida do square é o que dá tamanho às mantas feitas com ele */}
          <div style={{ marginTop: 14 }}>
            <CampoMedida
              largura={medida.largura}
              altura={medida.altura}
              rotuloLargura="LARGURA DO SQUARE (CM)"
              rotuloAltura="ALTURA DO SQUARE (CM)"
              aoMudar={(patch) => setMedida((m) => ({ ...m, ...patch }))}
            />
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
                style={{
                  position: 'absolute',
                  width: ring.sz,
                  height: ring.sz,
                  background: ring.c,
                }}
              />
            ))}
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
      <div className="modal-rodape" style={{ marginTop: 22 }}>
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
