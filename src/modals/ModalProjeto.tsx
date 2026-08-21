import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../state/store'
import { useAuth } from '../state/auth'
import { Stepper } from '../components/ui/bits'
import { Campo, LegendaObrigatorio, useFormulario } from '../components/ui/Campo'
import { CampoMedida } from '../components/ui/CampoMedida'
import { PreviaFaixas } from '../components/ui/PreviaFaixas'
import { PreviaGrade } from '../components/ui/PreviaGrade'
import { Select } from '../components/ui/controles'
import { useConfirmar } from '../components/ui/Confirm'
import { ModalBox, ModalHeader } from './shared'
import { redimensionaCelulas } from '../lib/grade'
import { fmtMedida, gradeParaTamanho, tamanhoManta } from '../lib/medida'
import { tecnicaDoEsquema } from '../types/database'
import { fetchReceitas } from '../features/biblioteca/api'
import { criarProjeto, fetchReceitasAmigurumi } from '../features/projetos/api'

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

export function ModalProjeto() {
  const { projCat, projTec, setProjCat, setProjTec, openLayout, close } = useStore()
  const { profile } = useAuth()
  const confirmar = useConfirmar()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const form = useFormulario<'nome' | 'manta'>()

  const [nome, setNome] = useState('')
  const [destino, setDestino] = useState('')
  const [emoji, setEmoji] = useState('🧶')
  const [receitaId, setReceitaId] = useState('')
  const [meta, setMeta] = useState(12)
  const [erro, setErro] = useState<string | null>(null)

  /* Manta nasce sempre de um esquema salvo — nas duas técnicas. Montar cores e
     tamanho aqui dentro produzia mantas que ninguém conseguia repetir depois,
     porque o desenho não ficava guardado em lugar nenhum. */
  const [esquemaId, setEsquemaId] = useState('')
  /* Grade sobrescrita só para este projeto, quando alguém manda o tamanho final
     em vez da contagem de peças. O esquema salvo na biblioteca não muda. */
  const [redim, setRedim] = useState<{ colunas: number; linhas: number } | null>(null)
  /* A peça vem do padrão escolhido e pode ser ajustada só para este projeto: a
     mesma receita rende tamanhos diferentes conforme o fio e a mão. */
  const [peca, setPeca] = useState<{ largura: number | null; altura: number | null }>({
    largura: null,
    altura: null,
  })
  const [alvo, setAlvo] = useState<{ largura: number | null; altura: number | null }>({
    largura: null,
    altura: null,
  })

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
    enabled: manta,
  })
  /* Esquema antigo não guarda a técnica; `tecnicaDoEsquema` deduz pela forma do
     conteúdo, para que os de crochê salvos antes disso continuem aparecendo. */
  const esquemas = (todasReceitas ?? []).filter(
    (r) =>
      r.categoria === 'manta' &&
      !r.arquivado_em &&
      tecnicaDoEsquema(r.conteudo) === (croche ? 'croche' : 'trico'),
  )
  const esquema = esquemas.find((e) => e.id === esquemaId)

  const modelosDoEsquema = esquema?.conteudo.modelos ?? {}
  const letrasDoEsquema = Object.keys(modelosDoEsquema)
  const cellsBase = esquema?.conteudo.cells ?? null
  const celulas =
    cellsBase && redim
      ? redimensionaCelulas(cellsBase, redim.colunas, redim.linhas, letrasDoEsquema)
      : cellsBase

  const seqDoEsquema = esquema?.conteudo.seq ?? []
  const faixasDoEsquema = redim?.linhas ?? esquema?.conteudo.faixas ?? 0

  const grade = croche
    ? { colunas: celulas?.[0]?.length ?? 0, linhas: celulas?.length ?? 0 }
    : { colunas: 1, linhas: faixasDoEsquema }

  const tamanho =
    manta && esquema
      ? tamanhoManta(croche ? 'manta_croche' : 'manta_trico', grade.colunas, grade.linhas, peca)
      : null

  /* Herda a medida do esquema escolhido enquanto ninguém digitou a sua. */
  useEffect(() => {
    if (!esquema || peca.largura || peca.altura) return
    setPeca({ largura: esquema.largura_cm, altura: esquema.altura_cm })
  }, [esquema, peca.largura, peca.altura])

  /* Tamanho final editado à mão: recalcula a grade pela mais próxima e mostra o
     que deu antes de aplicar — o número quase nunca fecha redondo. */
  const aplicarAlvo = async () => {
    if (!alvo.largura || !alvo.altura || !peca.largura || !peca.altura) return
    const tipo = croche ? 'manta_croche' : 'manta_trico'
    const nova = gradeParaTamanho(
      tipo,
      { largura: alvo.largura, altura: alvo.altura },
      { largura: peca.largura, altura: peca.altura },
    )
    const resultado = tamanhoManta(tipo, nova.colunas, nova.linhas, peca)!
    const ok = await confirmar({
      titulo: croche
        ? `${nova.colunas} × ${nova.linhas} squares = ${fmtMedida(resultado)}`
        : `${nova.linhas} faixas = ${fmtMedida(resultado)}`,
      descricao: `Você pediu ${fmtMedida({ largura: alvo.largura, altura: alvo.altura })}.`,
      okLabel: 'Usar esta grade',
    })
    if (!ok) return
    setRedim(nova)
  }

  const criar = useMutation({
    mutationFn: () =>
      criarProjeto({
        nome: nome.trim(),
        tipo: manta ? (croche ? 'manta_croche' : 'manta_trico') : 'amigurumi',
        destino: destino.trim() || null,
        emoji: manta ? (croche ? '🌸' : '☁️') : emoji,
        receita_id: !manta && receitaId ? receitaId : null,
        meta: !manta ? meta : null,
        created_by: profile!.id,
        colunas: grade.colunas,
        linhas: grade.linhas,
        pecaLarguraCm: peca.largura,
        pecaAlturaCm: peca.altura,
        // o nome que a pessoa deu ao modelo no esquema é o que vai para o mapa
        modelos: Object.entries(modelosDoEsquema).map(([letra, d]) => ({
          letra,
          nome: d.nome ?? `Modelo ${letra}`,
          cor_borda: d.border,
          cor_miolo: d.inner,
        })),
        celulas: celulas ?? [],
        faixaSeq: seqDoEsquema,
        faixaCount: faixasDoEsquema,
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
    const ok = form.checar({
      nome: nome.trim() ? undefined : 'Dê um nome ao projeto.',
      manta: manta && !esquemaId ? 'Escolha um esquema da biblioteca.' : undefined,
    })
    if (!ok) return
    criar.mutate()
  }

  return (
    <ModalBox maxWidth={600}>
      <ModalHeader title="Novo projeto" />
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
              placeholder={manta ? 'Manta Ada' : 'Capivara'}
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
            <Campo label="RECEITA">
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
          <Campo label="DESTINO">
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

        {manta && (
          <div
            style={{
              background: croche ? 'var(--sand-soft)' : '#EEF3EA',
              border: `1px solid ${croche ? 'var(--border)' : '#D8E0D2'}`,
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <Campo label="ESQUEMA" obrigatorio erro={form.erros.manta}>
              {() => (
                <Select
                  ariaLabel="Esquema de manta"
                  value={esquemaId}
                  onChange={(v) => {
                    setEsquemaId(v)
                    setRedim(null)
                    form.aoMudar('manta')
                  }}
                  options={[
                    ['', esquemas.length ? 'Escolher…' : 'Nenhum esquema salvo ainda'],
                    ...esquemas.map((e) => [e.id, e.nome] as [string, string]),
                  ]}
                />
              )}
            </Campo>

            {/* Lista vazia não é beco sem saída: daqui se cria o esquema e o
                fluxo volta para cá, que é o mesmo ida-e-volta do SeletorCategoria. */}
            <button
              type="button"
              onClick={() => openLayout('projeto')}
              style={{
                marginTop: 10,
                fontSize: 12,
                fontWeight: 800,
                color: croche ? 'var(--accent)' : 'var(--green-dark)',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              + Criar esquema
            </button>

            {esquema && (
              <div style={{ marginTop: 14 }}>
                <div className="lbl" style={{ marginBottom: 6 }}>
                  PRÉVIA
                </div>
                {croche && celulas ? (
                  <>
                    <PreviaGrade celulas={celulas} cores={modelosDoEsquema} />
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
                      {grade.colunas} × {grade.linhas} · {grade.colunas * grade.linhas} squares
                    </div>
                  </>
                ) : (
                  <>
                    <PreviaFaixas seq={seqDoEsquema} faixas={grade.linhas} />
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
                      {grade.linhas} faixas · {seqDoEsquema.length} cores
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {manta && (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <CampoMedida
              largura={peca.largura}
              altura={peca.altura}
              rotuloLargura={croche ? 'LARGURA DO SQUARE (CM)' : 'LARGURA DA FAIXA (CM)'}
              rotuloAltura={croche ? 'ALTURA DO SQUARE (CM)' : 'ALTURA DA FAIXA (CM)'}
              aoMudar={(patch) => setPeca((m) => ({ ...m, ...patch }))}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--divider)',
                flexWrap: 'wrap',
                fontSize: 12.5,
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--muted)' }}>Manta</span>
              <b className="h" style={{ fontSize: 16, color: 'var(--accent)' }}>
                {fmtMedida(tamanho)}
              </b>
            </div>
            {tamanho && (
              <div style={{ marginTop: 12 }}>
                <div className="lbl" style={{ marginBottom: 7 }}>
                  OU MANDE O TAMANHO FINAL
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <span style={{ flex: 1, minWidth: 190 }}>
                    <CampoMedida
                      largura={alvo.largura}
                      altura={alvo.altura}
                      rotuloLargura="LARGURA DA MANTA (CM)"
                      rotuloAltura="ALTURA DA MANTA (CM)"
                      aoMudar={(patch) => setAlvo((m) => ({ ...m, ...patch }))}
                    />
                  </span>
                  <button
                    type="button"
                    className="pill ghost"
                    disabled={!alvo.largura || !alvo.altura}
                    onClick={aplicarAlvo}
                  >
                    Ajustar a grade
                  </button>
                </div>
              </div>
            )}
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
