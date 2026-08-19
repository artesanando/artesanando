import { useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../state/store'
import { useAuth } from '../state/auth'
import { Stepper } from '../components/ui/bits'
import { Campo, LegendaObrigatorio, useFormulario } from '../components/ui/Campo'
import { ColorPicker, Select } from '../components/ui/controles'
import { ModalBox, ModalHeader } from './shared'
import { MODELS } from '../lib/paleta'
import { fetchReceitas } from '../features/biblioteca/api'
import {
  criarProjeto,
  fetchReceitasAmigurumi,
  gradePadrao,
  type ModeloNovo,
} from '../features/projetos/api'

const cardOn: CSSProperties = {
  border: '1px solid var(--chip-rose-border)',
  background: 'var(--chip-rose)',
  borderRadius: 12,
  padding: '14px 16px',
  cursor: 'pointer',
  color: 'var(--accent)',
  fontFamily: 'inherit',
  textAlign: 'left',
}
const cardAmigOn: CSSProperties = {
  ...cardOn,
  border: '1px solid #E0D3BC',
  background: '#FBF3E4',
  color: 'var(--gold-dark)',
}
const cardOff: CSSProperties = {
  border: '1px solid var(--field-border)',
  background: 'transparent',
  borderRadius: 12,
  padding: '14px 16px',
  cursor: 'pointer',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  textAlign: 'left',
}

const tec = (on: boolean, c: string): CSSProperties => ({
  flex: 1,
  textAlign: 'center',
  padding: 9,
  borderRadius: 10,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
  fontFamily: 'inherit',
  ...(on
    ? { background: c, color: '#fff', border: 'none' }
    : {
        border: '1px solid var(--field-border)',
        color: 'var(--ink-soft)',
        background: 'transparent',
      }),
})

const MODELOS_INICIAIS: ModeloNovo[] = [
  { letra: 'A', nome: 'Modelo A', cor_borda: MODELS.A.border, cor_miolo: MODELS.A.inner },
  { letra: 'B', nome: 'Modelo B', cor_borda: MODELS.B.border, cor_miolo: MODELS.B.inner },
]

const LETRAS = 'ABCDEFGH'.split('')

export function ModalProjeto() {
  const { projCat, projTec, setProjCat, setProjTec, openFaixa, faixaSeq, faixaCount, close } =
    useStore()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const form = useFormulario<'nome' | 'manta'>()

  const [nome, setNome] = useState('')
  const [destino, setDestino] = useState('')
  const [emoji, setEmoji] = useState('🧶')
  const [receitaId, setReceitaId] = useState('')
  const [meta, setMeta] = useState(12)
  const [erro, setErro] = useState<string | null>(null)

  /* Antes, a manta de crochê nascia com A/B/C e 80 squares fixos, sem nada
     configurável. Agora: do zero (tamanho + modelos) ou a partir de um esquema
     salvo na biblioteca — que até então não servia para nada. */
  const [origem, setOrigem] = useState<'zero' | 'esquema'>('zero')
  const [colunas, setColunas] = useState(8)
  const [linhas, setLinhas] = useState(10)
  const [modelos, setModelos] = useState<ModeloNovo[]>(MODELOS_INICIAIS)
  const [esquemaId, setEsquemaId] = useState('')

  const manta = projCat === 'manta'
  const croche = manta && projTec === 'croche'

  const { data: receitas } = useQuery({
    queryKey: ['receitas-amigurumi'],
    queryFn: fetchReceitasAmigurumi,
    enabled: !manta,
  })

  const { data: todasReceitas } = useQuery({
    queryKey: ['receitas'],
    queryFn: fetchReceitas,
    enabled: croche,
  })
  const esquemas = (todasReceitas ?? []).filter(
    (r) => r.categoria === 'manta' && r.conteudo.cells && r.conteudo.modelos,
  )
  const esquema = esquemas.find((e) => e.id === esquemaId)

  const criar = useMutation({
    mutationFn: () => {
      if (croche && origem === 'esquema' && esquema?.conteudo.cells && esquema.conteudo.modelos) {
        const cells = esquema.conteudo.cells
        const defs = esquema.conteudo.modelos
        return criarProjeto({
          nome: nome.trim(),
          tipo: 'manta_croche',
          destino: destino.trim() || null,
          emoji: '🌸',
          created_by: profile!.id,
          colunas: cells[0]?.length ?? 1,
          linhas: cells.length,
          modelos: Object.entries(defs).map(([letra, d]) => ({
            letra,
            nome: `Modelo ${letra}`,
            cor_borda: d.border,
            cor_miolo: d.inner,
          })),
          celulas: cells,
        })
      }
      return criarProjeto({
        nome: nome.trim(),
        tipo: manta ? (croche ? 'manta_croche' : 'manta_trico') : 'amigurumi',
        destino: destino.trim() || null,
        emoji: manta ? (croche ? '🌸' : '☁️') : emoji,
        receita_id: !manta && receitaId ? receitaId : null,
        meta: !manta ? meta : null,
        created_by: profile!.id,
        colunas,
        linhas,
        modelos,
        celulas: gradePadrao(
          colunas,
          linhas,
          modelos.map((m) => m.letra),
        ),
        faixaSeq,
        faixaCount,
      })
    },
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
    const ok = form.checar({
      nome: nome.trim() ? undefined : 'Dê um nome ao projeto.',
      manta:
        croche && origem === 'zero' && modelos.length === 0
          ? 'A manta precisa de pelo menos um modelo de granny.'
          : croche && origem === 'esquema' && !esquemaId
            ? 'Escolha um esquema da biblioteca.'
            : undefined,
    })
    if (!ok) return
    criar.mutate()
  }

  const mudarModelo = (i: number, patch: Partial<ModeloNovo>) =>
    setModelos((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)))

  return (
    <ModalBox maxWidth={600}>
      <ModalHeader title="Novo projeto" sub="Defina o tipo para configurar a produção" />
      <form onSubmit={submit}>
        <div className="grid2" style={{ gap: 10, marginBottom: 20 }}>
          <button type="button" onClick={() => setProjCat('manta')} style={manta ? cardOn : cardOff}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Manta</div>
            <div style={{ fontSize: 11.5, marginTop: 2 }}>dividida entre integrantes</div>
          </button>
          <button
            type="button"
            onClick={() => setProjCat('amig')}
            style={!manta ? cardAmigOn : cardOff}
          >
            <div style={{ fontWeight: 800, fontSize: 14 }}>Amigurumi</div>
            <div style={{ fontSize: 11.5, marginTop: 2 }}>unidades por integrante</div>
          </button>
        </div>

        <Campo
          label={manta ? 'NOME DO PROJETO' : 'NOME DO TIPO'}
          obrigatorio
          erro={form.erros.nome}
          style={{ marginBottom: 18 }}
        >
          {(p) => (
            <input
              {...p}
              className="field"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value)
                form.aoMudar('nome')
              }}
              placeholder={manta ? 'Manta Primavera' : 'Capivara'}
            />
          )}
        </Campo>

        <div className="grid2" style={{ marginBottom: 18 }}>
          {manta ? (
            <Campo label="TÉCNICA">
              {() => (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setProjTec('croche')}
                    style={tec(projTec === 'croche', 'var(--primary)')}
                  >
                    Crochê
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjTec('trico')}
                    style={tec(projTec === 'trico', 'var(--green-dark)')}
                  >
                    Tricô
                  </button>
                </div>
              )}
            </Campo>
          ) : (
            <Campo label="RECEITA (OPCIONAL)">
              {() => (
                <Select
                  ariaLabel="Receita"
                  value={receitaId}
                  onChange={setReceitaId}
                  options={[
                    ['', 'Escolher…'],
                    ...(receitas ?? []).map((r) => [r.id, r.nome] as [string, string]),
                  ]}
                />
              )}
            </Campo>
          )}
          <Campo label="DESTINO (OPCIONAL)">
            {(p) => (
              <input
                {...p}
                className="field"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Hospital Infantil"
              />
            )}
          </Campo>
        </div>

        {croche && (
          <div
            style={{
              background: 'var(--sand-soft)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="seg"
                aria-pressed={origem === 'zero'}
                onClick={() => setOrigem('zero')}
                style={
                  origem === 'zero'
                    ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                    : undefined
                }
              >
                Começar do zero
              </button>
              <button
                type="button"
                className="seg"
                aria-pressed={origem === 'esquema'}
                onClick={() => setOrigem('esquema')}
                style={
                  origem === 'esquema'
                    ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                    : undefined
                }
              >
                Usar um esquema salvo
              </button>
            </div>

            {origem === 'zero' ? (
              <>
                <div className="grid2" style={{ marginBottom: 14 }}>
                  <Campo label="COLUNAS">
                    {() => (
                      <Stepper
                        value={colunas}
                        onChange={setColunas}
                        min={2}
                        max={20}
                        ariaLabel="Colunas"
                      />
                    )}
                  </Campo>
                  <Campo label="LINHAS">
                    {() => (
                      <Stepper
                        value={linhas}
                        onChange={setLinhas}
                        min={2}
                        max={30}
                        ariaLabel="Linhas"
                      />
                    )}
                  </Campo>
                </div>

                <div className="lbl" style={{ marginBottom: 8 }}>
                  MODELOS DE GRANNY <span style={{ color: 'var(--accent)' }}>*</span>
                </div>
                {modelos.map((m, i) => (
                  <div
                    key={m.letra}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      marginBottom: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <b style={{ width: 16, flex: 'none' }}>{m.letra}</b>
                    <input
                      className="field"
                      style={{ flex: 1, minWidth: 110 }}
                      value={m.nome}
                      aria-label={`Nome do modelo ${m.letra}`}
                      onChange={(e) => mudarModelo(i, { nome: e.target.value })}
                    />
                    <span style={{ width: 124 }}>
                      <ColorPicker
                        value={m.cor_borda}
                        ariaLabel={`Cor da borda do modelo ${m.letra}`}
                        onChange={(cor_borda) => mudarModelo(i, { cor_borda })}
                      />
                    </span>
                    <span style={{ width: 124 }}>
                      <ColorPicker
                        value={m.cor_miolo}
                        ariaLabel={`Cor do miolo do modelo ${m.letra}`}
                        onChange={(cor_miolo) => mudarModelo(i, { cor_miolo })}
                      />
                    </span>
                    {modelos.length > 1 && (
                      <button
                        type="button"
                        className="kebab"
                        aria-label={`Remover modelo ${m.letra}`}
                        onClick={() => setModelos((ms) => ms.filter((_, j) => j !== i))}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {modelos.length < LETRAS.length && (
                  <button
                    type="button"
                    className="pill ghost"
                    style={{ padding: '6px 14px', fontSize: 12 }}
                    onClick={() =>
                      setModelos((ms) => [
                        ...ms,
                        {
                          letra: LETRAS[ms.length],
                          nome: `Modelo ${LETRAS[ms.length]}`,
                          cor_borda: '#B99BC4',
                          cor_miolo: '#E3C07A',
                        },
                      ])
                    }
                  >
                    + Modelo
                  </button>
                )}
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 10 }}>
                  A manta nasce com <b>{colunas * linhas} squares</b> em "a fazer", alternando os
                  modelos. Depois dá para arrastar, pintar e mudar o tamanho no mapa.
                </div>
              </>
            ) : (
              <>
                <Campo label="ESQUEMA" obrigatorio erro={form.erros.manta}>
                  {() => (
                    <Select
                      ariaLabel="Esquema de manta"
                      value={esquemaId}
                      onChange={(v) => {
                        setEsquemaId(v)
                        form.aoMudar('manta')
                      }}
                      options={[
                        ['', esquemas.length ? 'Escolher…' : 'Nenhum esquema salvo ainda'],
                        ...esquemas.map((e) => [e.id, e.nome] as [string, string]),
                      ]}
                    />
                  )}
                </Campo>
                {esquema?.conteudo.cells && (
                  <div style={{ marginTop: 12 }}>
                    <div className="lbl" style={{ marginBottom: 6 }}>
                      PRÉVIA
                    </div>
                    <div
                      style={{
                        display: 'inline-grid',
                        gridTemplateColumns: `repeat(${esquema.conteudo.cells[0]?.length ?? 1}, 14px)`,
                        gap: 2,
                        background: 'var(--sand)',
                        padding: 5,
                        borderRadius: 6,
                      }}
                    >
                      {esquema.conteudo.cells.flatMap((row, r) =>
                        row.map((letra, c) => {
                          const d = esquema.conteudo.modelos?.[letra]
                          return (
                            <span
                              key={`${r}-${c}`}
                              style={{
                                width: 14,
                                height: 14,
                                background: d?.border ?? '#ccc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span style={{ width: 7, height: 7, background: d?.inner ?? '#eee' }} />
                            </span>
                          )
                        }),
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
                      {esquema.conteudo.cells.length} linhas ×{' '}
                      {esquema.conteudo.cells[0]?.length ?? 0} colunas
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {manta && !croche && (
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
              A manta nasce com <b>{faixaCount} faixas</b> usando esta sequência de cores. Tudo
              continua editável depois.
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
              <button
                type="button"
                onClick={() => openFaixa('projeto')}
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'var(--green-dark)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: 'none',
                  background: 'none',
                  fontFamily: 'inherit',
                }}
              >
                + Editar padrão
              </button>
            </div>
          </div>
        )}

        {!manta && (
          <div className="grid2" style={{ marginBottom: 20 }}>
            <Campo label="META DE UNIDADES">
              {() => <Stepper value={meta} onChange={setMeta} min={1} max={999} ariaLabel="Meta" />}
            </Campo>
            <Campo label="EMOJI">
              {(p) => (
                <input
                  {...p}
                  className="field"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  maxLength={4}
                />
              )}
            </Campo>
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

        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <LegendaObrigatorio />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="pill ghost" onClick={close}>
              Cancelar
            </button>
            <button type="submit" className="pill" disabled={criar.isPending}>
              {criar.isPending ? 'Criando…' : 'Criar projeto'}
            </button>
          </div>
        </div>
      </form>
    </ModalBox>
  )
}
