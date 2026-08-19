import { useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../state/store'
import { useAuth } from '../state/auth'
import { Lbl, Stepper } from '../components/ui/bits'
import { Select } from '../components/ui/controles'
import { ModalBox, ModalHeader } from './shared'
import { criarProjeto, fetchReceitasAmigurumi } from '../features/projetos/api'

const cardOn: CSSProperties = {
  border: '1px solid var(--chip-rose-border)',
  background: 'var(--chip-rose)',
  borderRadius: 12,
  padding: '14px 16px',
  cursor: 'pointer',
  color: 'var(--accent)',
}
const cardAmigOn: CSSProperties = {
  border: '1px solid #E0D3BC',
  background: '#FBF3E4',
  borderRadius: 12,
  padding: '14px 16px',
  cursor: 'pointer',
  color: 'var(--gold-dark)',
}
const cardOff: CSSProperties = {
  border: '1px solid var(--field-border)',
  borderRadius: 12,
  padding: '14px 16px',
  cursor: 'pointer',
  color: 'var(--ink)',
}

const tec = (on: boolean, c: string): CSSProperties =>
  on
    ? {
        flex: 1,
        textAlign: 'center',
        padding: 9,
        borderRadius: 10,
        background: c,
        color: '#fff',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 700,
      }
    : {
        flex: 1,
        textAlign: 'center',
        padding: 9,
        borderRadius: 10,
        border: '1px solid var(--field-border)',
        color: 'var(--ink-soft)',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 700,
      }

export function ModalProjeto() {
  const { projCat, projTec, setProjCat, setProjTec, openFaixa, faixaSeq, faixaCount, close } =
    useStore()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [nome, setNome] = useState('')
  const [destino, setDestino] = useState('')
  const [emoji, setEmoji] = useState('🧶')
  const [receitaId, setReceitaId] = useState('')
  const [meta, setMeta] = useState(12)
  const [erro, setErro] = useState<string | null>(null)

  const manta = projCat === 'manta'
  const { data: receitas } = useQuery({
    queryKey: ['receitas-amigurumi'],
    queryFn: fetchReceitasAmigurumi,
    enabled: !manta,
  })

  const criar = useMutation({
    mutationFn: () =>
      criarProjeto({
        nome: nome.trim(),
        tipo: manta ? (projTec === 'croche' ? 'manta_croche' : 'manta_trico') : 'amigurumi',
        destino: destino.trim() || null,
        emoji: manta ? (projTec === 'croche' ? '🌸' : '☁️') : emoji,
        receita_id: !manta && receitaId ? receitaId : null,
        meta: !manta ? meta : null,
        created_by: profile!.id,
        faixaSeq,
        faixaCount,
      }),
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ['projetos'] })
      qc.invalidateQueries({ queryKey: ['progresso-geral'] })
      close()
      navigate(`/projetos/${id}`)
    },
    onError: () => setErro('Não foi possível criar o projeto.'),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (!nome.trim()) {
      setErro('Dê um nome ao projeto.')
      return
    }
    criar.mutate()
  }

  return (
    <ModalBox maxWidth={600}>
      <ModalHeader title="Novo projeto" sub="Defina o tipo para configurar a produção" />
      <form onSubmit={submit}>
        <div className="grid2" style={{ gap: 10, marginBottom: 20 }}>
          <div onClick={() => setProjCat('manta')} style={manta ? cardOn : cardOff}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Manta</div>
            <div style={{ fontSize: 11.5, marginTop: 2 }}>dividida entre integrantes</div>
          </div>
          <div onClick={() => setProjCat('amig')} style={!manta ? cardAmigOn : cardOff}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Amigurumi</div>
            <div style={{ fontSize: 11.5, marginTop: 2 }}>unidades por integrante</div>
          </div>
        </div>
        <Lbl style={{ marginBottom: 7 }}>{manta ? 'NOME DO PROJETO' : 'NOME DO TIPO'}</Lbl>
        <input
          className="field"
          style={{ marginBottom: 18 }}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder={manta ? 'Manta Primavera' : 'Capivara'}
        />
        <div className="grid2" style={{ marginBottom: 18 }}>
          {manta ? (
            <div>
              <Lbl style={{ marginBottom: 7 }}>TÉCNICA</Lbl>
              <div style={{ display: 'flex', gap: 6 }}>
                <span
                  onClick={() => setProjTec('croche')}
                  style={tec(projTec === 'croche', 'var(--primary)')}
                >
                  Crochê
                </span>
                <span
                  onClick={() => setProjTec('trico')}
                  style={tec(projTec === 'trico', 'var(--green-dark)')}
                >
                  Tricô
                </span>
              </div>
            </div>
          ) : (
            <div>
              <Lbl style={{ marginBottom: 7 }}>RECEITA</Lbl>
              <Select
                ariaLabel="Receita"
                value={receitaId}
                onChange={setReceitaId}
                options={[
                  ['', 'Escolher…'],
                  ...(receitas ?? []).map((r) => [r.id, r.nome] as [string, string]),
                ]}
              />
            </div>
          )}
          <div>
            <Lbl style={{ marginBottom: 7 }}>DESTINO</Lbl>
            <input
              className="field"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Hospital Infantil"
            />
          </div>
        </div>
        {manta ? (
          projTec === 'croche' ? (
            <div
              style={{
                background: 'var(--chip-rose)',
                border: '1px solid var(--chip-rose-border)',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 20,
                fontSize: 12,
                color: 'var(--primary-dark)',
                lineHeight: 1.6,
              }}
            >
              A manta nasce com os padrões <b>A/B/C</b> (40 + 24 + 16 ={' '}
              <b style={{ color: 'var(--ink)' }}>80 squares</b>), todos em "a fazer" — a produção é
              registrada aos poucos pelos lotes.
            </div>
          ) : (
            <div
              style={{
                background: '#EEF3EA',
                border: '1px solid #D8E0D2',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 12, color: '#5E6E55', marginBottom: 10 }}>
                A manta nasce com <b>{faixaCount} faixas</b> usando a sequência de cores do padrão
                atual.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: '1px solid var(--field-border)',
                    flex: 1,
                    height: 22,
                  }}
                >
                  {faixaSeq.map((c, i) => (
                    <div key={i} style={{ flex: 1, background: c }} />
                  ))}
                </div>
                <span
                  onClick={() => openFaixa('projeto')}
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'var(--green-dark)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + Editar padrão
                </span>
              </div>
            </div>
          )
        ) : (
          <div className="grid2" style={{ marginBottom: 20 }}>
            <div>
              <Lbl style={{ marginBottom: 7 }}>META DE UNIDADES</Lbl>
              <Stepper value={meta} onChange={setMeta} min={1} max={99} />
            </div>
            <div>
              <Lbl style={{ marginBottom: 7 }}>EMOJI</Lbl>
              <input
                className="field"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
              />
            </div>
          </div>
        )}
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
          <button type="button" className="pill ghost" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="pill" disabled={criar.isPending}>
            {criar.isPending ? 'Criando…' : 'Criar projeto'}
          </button>
        </div>
      </form>
    </ModalBox>
  )
}
