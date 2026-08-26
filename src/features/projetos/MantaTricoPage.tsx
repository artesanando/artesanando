import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { Avatar, Lbl, Progress } from '../../components/ui/bits'
import { ColorPicker } from '../../components/ui/controles'
import { useToast } from '../../components/ui/Toast'
import { useConfirmar } from '../../components/ui/Confirm'
import { ini } from '../../lib/format'
import { nomeDaCor, PALETTE } from '../../lib/paleta'
import { fmtMedida, tamanhoManta } from '../../lib/medida'
import { reordena } from '../../components/ui/useReordenar'
import { Comentarios, Historico } from './Comentarios'
import { IconArrastar, IconCheck, IconChevron, IconX } from '../../components/ui/icons'
import { AcoesProjeto, AvisoArquivado, ProgressoProjeto } from './CabecalhoProjeto'
import {
  fetchFaixas,
  inserirFaixa,
  mudarStatusFaixa,
  progressoFaixas,
  removerFaixa,
  reordenarFaixas,
  salvarFaixas,
  type Faixa,
  type Projeto,
} from './api'

/* O que dá para fazer com a estrutura da manta, além de pintar a faixa. */
type AcaoFaixa =
  | { tipo: 'inserir'; ordem: number; cores: string[] }
  | { tipo: 'remover'; id: string }
  | { tipo: 'mover'; de: number; para: number }

/* Editor da faixa selecionada. O estado das cores é local e só vai para o banco
   no Salvar; status e responsável gravam na hora, porque são o que destrava o
   progresso da manta. */
function Editor({ projeto, faixas }: { projeto: Projeto; faixas: Faixa[] }) {
  const { can, isAdmin, profile } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const confirmar = useConfirmar()

  const [rows, setRows] = useState<Record<string, string[]>>({})
  const [sel, setSel] = useState(0)
  const [arrastando, setArrastando] = useState<number | null>(null)
  const [sobre, setSobre] = useState<number | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  // a query revalida depois de pegar/concluir faixa: cores ainda não salvas
  // continuam valendo, o resto acompanha o banco
  useEffect(() => {
    setRows((atual) => Object.fromEntries(faixas.map((f) => [f.id, atual[f.id] ?? f.cores])))
  }, [faixas])

  const indice = Math.min(sel, faixas.length - 1)
  const faixaSel = faixas[indice]
  const coresSel = (faixaSel && rows[faixaSel.id]) ?? faixaSel?.cores ?? []

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['faixas', projeto.id] })
    qc.invalidateQueries({ queryKey: ['atividades', projeto.id] })
    qc.invalidateQueries({ queryKey: ['progresso-geral'] })
    qc.invalidateQueries({ queryKey: ['entregas-light'] })
  }

  const status = useMutation({
    mutationFn: (novo: Faixa['status']) =>
      mudarStatusFaixa({
        faixa: faixaSel,
        status: novo,
        perfilId: profile!.id,
        autorId: profile!.id,
      }),
    onSuccess: invalidar,
    onError: () => toast('Não foi possível mudar a faixa.', 'erro'),
  })

  const salvar = useMutation({
    mutationFn: () =>
      salvarFaixas(
        faixas
          .filter((f) => f.status !== 'feita' || isAdmin || f.responsavel_id === profile?.id)
          .filter((f) => JSON.stringify(rows[f.id]) !== JSON.stringify(f.cores))
          .map((f) => ({ id: f.id, cores: rows[f.id] })),
      ),
    onSuccess: () => {
      invalidar()
      toast('Ordem salva')
    },
    onError: () => toast('Não foi possível salvar.', 'erro'),
  })

  /* Estrutura da manta: onde a faixa entra, de onde sai e em que posição fica.
     Antes só dava para somar no fim e tirar a última, então uma faixa a mais no
     meio da manta — ou a ordem das cores trocada — pedia projeto novo. */
  const mexerNasFaixas = useMutation({
    mutationFn: async (acao: AcaoFaixa) => {
      if (acao.tipo === 'inserir') return inserirFaixa(projeto.id, acao.ordem, acao.cores)
      if (acao.tipo === 'remover') return removerFaixa(acao.id)
      return reordenarFaixas(
        projeto.id,
        reordena(
          faixas.map((f) => f.id),
          acao.de,
          acao.para,
        ),
      )
    },
    onSuccess: (_dado, acao) => {
      if (acao.tipo === 'inserir') setSel(acao.ordem - 1)
      if (acao.tipo === 'mover') setSel(acao.para)
      if (acao.tipo === 'remover') setSel((i) => Math.max(0, Math.min(i, faixas.length - 2)))
      invalidar()
    },
    onError: () => toast('Não foi possível mudar as faixas.', 'erro'),
  })

  /* Faixa que já saiu do 'a fazer' carrega trabalho de alguém: tirar do meio da
     manta avisa antes, como remover a última já avisava. */
  const removerComAviso = async (f: Faixa) => {
    if (
      f.status !== 'afazer' &&
      !(await confirmar({
        titulo: `Remover a faixa ${f.ordem}?`,
        descricao:
          f.status === 'feita'
            ? 'Ela já está feita — o trabalho dela sai da manta.'
            : 'Alguém está fazendo esta faixa.',
        okLabel: 'Remover',
        perigo: true,
      }))
    )
      return
    mexerNasFaixas.mutate({ tipo: 'remover', id: f.id })
  }

  if (!faixaSel) return null

  const podeReabrir = isAdmin || faixaSel.responsavel_id === profile?.id
  const feita = faixaSel.status === 'feita'
  const travada = feita && !podeReabrir
  const minha = faixaSel.responsavel_id === profile?.id
  const prog = progressoFaixas(faixas)
  const pctStr = `${prog.total === 0 ? 0 : Math.round((prog.done / prog.total) * 100)}%`

  const setCores = (cores: string[]) => setRows((r) => ({ ...r, [faixaSel.id]: cores }))

  const mover = (de: number, para: number) => {
    if (travada || para < 0 || para >= coresSel.length || de === para) return
    const arr = coresSel.slice()
    const [x] = arr.splice(de, 1)
    arr.splice(para, 0, x)
    setCores(arr)
  }

  const embaralhar = () => {
    if (travada) return
    const arr = coresSel.slice()
    for (let k = arr.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1))
      ;[arr[k], arr[j]] = [arr[j], arr[k]]
    }
    setCores(arr)
  }

  /* arrastar para reordenar — o índice sob o ponteiro vem do data-i da linha */
  const indiceSob = (x: number, y: number) => {
    const el = document.elementFromPoint?.(x, y)?.closest('[data-i]')
    return el ? Number((el as HTMLElement).dataset.i) : null
  }

  const removerCor = (i: number) => {
    if (travada || coresSel.length <= 2) return
    setCores(coresSel.filter((_, j) => j !== i))
  }

  return (
    <div className="pgrid" style={{ '--cols': '1.35fr 1fr', '--gap': '36px' } as CSSProperties}>
      <div>
        <div className="h" style={{ fontSize: 16, marginBottom: 4 }}>
          Prévia da manta
        </div>
        <div
          style={{
            border: '1.5px solid #D8C7BF',
            borderRadius: 8,
            overflow: 'hidden',
            maxWidth: 360,
          }}
        >
          {faixas.map((f, i) => {
            const isSel = i === indice
            const cores = rows[f.id] ?? f.cores
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSel(i)}
                aria-label={`Faixa ${f.ordem}, ${f.status === 'feita' ? 'feita' : f.status === 'fazendo' ? 'em andamento' : 'a fazer'}`}
                aria-pressed={isSel}
                style={{
                  position: 'relative',
                  display: 'flex',
                  width: '100%',
                  height: 34,
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  opacity: isSel ? 1 : f.status === 'afazer' ? 0.42 : 1,
                  boxShadow: isSel ? 'inset 0 0 0 2px var(--ink)' : 'none',
                  zIndex: isSel ? 1 : 0,
                  transition: 'opacity var(--dur-media) var(--ease-suave)',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 7,
                    top: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,.45)',
                  }}
                >
                  F{f.ordem}
                  {f.status === 'feita' && <IconCheck size={11} />}
                </span>
                {cores.map((c, j) => (
                  <span key={j} style={{ flex: 1, background: c }} />
                ))}
              </button>
            )
          })}
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, maxWidth: 360 }}
        >
          <Progress pct={pctStr} style={{ flex: 1, height: 7 }} />
          <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--accent)' }}>
            {prog.done}/{prog.total}
          </span>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, maxWidth: 360 }}>
            <button
              className="pill ghost"
              style={{ flex: 1 }}
              disabled={mexerNasFaixas.isPending}
              onClick={() =>
                mexerNasFaixas.mutate({
                  tipo: 'inserir',
                  ordem: faixas.length + 1,
                  cores: coresSel,
                })
              }
            >
              + Faixa no fim
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          background: 'var(--sand-soft)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '18px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
            gap: 8,
          }}
        >
          <div className="h" style={{ fontSize: 17 }}>
            Faixa {faixaSel.ordem}
          </div>
          <span
            className="tag"
            style={
              feita
                ? { background: 'var(--chip-green)', color: 'var(--green-dark)' }
                : faixaSel.status === 'fazendo'
                  ? { background: 'var(--chip-warn)', color: 'var(--gold-dark)' }
                  : { background: 'var(--chip-rose)', color: 'var(--accent)' }
            }
          >
            {feita
              ? travada
                ? 'FEITA · TRAVADA'
                : 'FEITA'
              : faixaSel.status === 'fazendo'
                ? 'EM ANDAMENTO'
                : 'A FAZER'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Avatar
            color={faixaSel.responsavel?.avatar_color ?? 'var(--fill)'}
            size={22}
            fontSize={9}
          >
            {ini(faixaSel.responsavel?.nome ?? '?')}
          </Avatar>
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>
            {faixaSel.responsavel?.nome ?? 'Sem responsável'}
          </span>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            <button
              className="pill ghost"
              style={{ padding: '7px 12px', fontSize: 11.5 }}
              aria-label={`Mover a faixa ${faixaSel.ordem} para cima`}
              disabled={indice === 0 || mexerNasFaixas.isPending}
              onClick={() => mexerNasFaixas.mutate({ tipo: 'mover', de: indice, para: indice - 1 })}
            >
              <IconChevron size={11} para="cima" />
            </button>
            <button
              className="pill ghost"
              style={{ padding: '7px 12px', fontSize: 11.5 }}
              aria-label={`Mover a faixa ${faixaSel.ordem} para baixo`}
              disabled={indice >= faixas.length - 1 || mexerNasFaixas.isPending}
              onClick={() => mexerNasFaixas.mutate({ tipo: 'mover', de: indice, para: indice + 1 })}
            >
              <IconChevron size={11} para="baixo" />
            </button>
            <button
              className="pill ghost"
              style={{ padding: '7px 12px', fontSize: 11.5 }}
              disabled={mexerNasFaixas.isPending}
              onClick={() =>
                mexerNasFaixas.mutate({
                  tipo: 'inserir',
                  ordem: faixaSel.ordem + 1,
                  cores: coresSel,
                })
              }
            >
              Inserir abaixo
            </button>
            <button
              className="pill ghost"
              style={{ padding: '7px 12px', fontSize: 11.5 }}
              disabled={faixas.length <= 1 || mexerNasFaixas.isPending}
              onClick={() => removerComAviso(faixaSel)}
            >
              Remover
            </button>
          </div>
        )}

        {can('progresso') && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {faixaSel.status === 'afazer' && (
              <button
                className="pill"
                disabled={status.isPending}
                onClick={() => status.mutate('fazendo')}
              >
                Pegar faixa
              </button>
            )}
            {faixaSel.status === 'fazendo' && (minha || isAdmin) && (
              <button
                className="pill"
                disabled={status.isPending}
                onClick={() => status.mutate('feita')}
              >
                Concluir
              </button>
            )}
            {feita && podeReabrir && (
              <button
                className="pill ghost"
                disabled={status.isPending}
                onClick={() => status.mutate('fazendo')}
              >
                Reabrir
              </button>
            )}
          </div>
        )}

        <Lbl style={{ marginBottom: 10 }}>ORDEM DAS CORES</Lbl>
        <div
          ref={listaRef}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          onPointerMove={(e) => {
            if (arrastando === null) return
            const i = indiceSob(e.clientX, e.clientY)
            if (i !== null && i !== sobre) setSobre(i)
          }}
          onPointerUp={() => {
            if (arrastando !== null && sobre !== null) mover(arrastando, sobre)
            setArrastando(null)
            setSobre(null)
          }}
          onPointerCancel={() => {
            setArrastando(null)
            setSobre(null)
          }}
        >
          {coresSel.map((c, i) => (
            <div
              key={`${c}-${i}`}
              data-i={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                background: 'var(--card)',
                border: `1px solid ${sobre === i && arrastando !== null ? 'var(--primary)' : '#E7D9D2'}`,
                borderRadius: 10,
                padding: '7px 11px',
                opacity: arrastando === i ? 0.4 : 1,
                transform:
                  sobre === i && arrastando !== null && arrastando !== i ? 'scale(1.02)' : 'none',
                transition:
                  'transform var(--dur-media) var(--ease-mola), opacity var(--dur-rapida)',
                touchAction: 'none',
              }}
            >
              <button
                type="button"
                aria-label={`Arrastar ${nomeDaCor(c)}`}
                disabled={travada}
                onPointerDown={() => !travada && setArrastando(i)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: travada ? 'default' : 'grab',
                  color: 'var(--faint-2)',
                  fontSize: 13,
                  padding: '2px 2px',
                  touchAction: 'none',
                }}
              >
                <IconArrastar />
              </button>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--faint-2)',
                  width: 12,
                  flex: 'none',
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {travada ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      fontSize: 12.5,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: c,
                        border: '1px solid rgba(59,52,47,.12)',
                        flex: 'none',
                      }}
                    />
                    {nomeDaCor(c)}
                  </span>
                ) : (
                  <ColorPicker
                    value={c}
                    ariaLabel={`Cor ${i + 1} da faixa`}
                    onChange={(hex) => setCores(coresSel.map((x, j) => (j === i ? hex : x)))}
                  />
                )}
              </div>
              <button
                type="button"
                aria-label={`Mover ${nomeDaCor(c)} para cima`}
                disabled={travada || i === 0}
                onClick={() => mover(i, i - 1)}
                style={setaStyle(travada || i === 0)}
              >
                <IconChevron size={11} para="cima" />
              </button>
              <button
                type="button"
                aria-label={`Mover ${nomeDaCor(c)} para baixo`}
                disabled={travada || i === coresSel.length - 1}
                onClick={() => mover(i, i + 1)}
                style={setaStyle(travada || i === coresSel.length - 1)}
              >
                <IconChevron size={11} para="baixo" />
              </button>
              {!travada && coresSel.length > 2 && (
                <button
                  type="button"
                  aria-label={`Remover ${nomeDaCor(c)}`}
                  onClick={() => removerCor(i)}
                  style={{ ...setaStyle(false), color: 'var(--faint-3)' }}
                >
                  <IconX size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        {!travada && (
          <button
            className="pill ghost"
            style={{ marginTop: 10, width: '100%' }}
            onClick={() => setCores([...coresSel, PALETTE[coresSel.length % PALETTE.length][0]])}
          >
            + Cor
          </button>
        )}

        {/* salvar é a ação principal; embaralhar é alternativa. Estava ao
            contrário: o sorteio preenchido e o salvar em fantasma. */}
        <div style={{ display: 'flex', gap: 9, marginTop: 18, flexWrap: 'wrap' }}>
          {can('progresso') && (
            <button
              className="pill"
              style={{ flex: 1, minWidth: 140 }}
              onClick={() => salvar.mutate()}
              disabled={salvar.isPending}
            >
              {salvar.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          )}
          <button
            className="pill ghost"
            style={{ padding: '10px 16px', opacity: travada ? 0.5 : 1 }}
            onClick={embaralhar}
            disabled={travada}
          >
            Embaralhar ordem
          </button>
        </div>
      </div>
    </div>
  )
}

const setaStyle = (inativo: boolean): CSSProperties => ({
  border: 'none',
  background: 'none',
  cursor: inativo ? 'default' : 'pointer',
  color: 'var(--accent)',
  fontWeight: 800,
  fontSize: 13,
  opacity: inativo ? 0.22 : 1,
  padding: '4px 5px',
  fontFamily: 'inherit',
})

export function MantaTricoPage({ projeto }: { projeto: Projeto }) {
  const navigate = useNavigate()
  const { data: faixas, isLoading } = useQuery({
    queryKey: ['faixas', projeto.id],
    queryFn: () => fetchFaixas(projeto.id),
  })

  const prog = progressoFaixas(faixas ?? [])
  const tamanho = tamanhoManta('manta_trico', 1, (faixas ?? []).length, {
    largura: projeto.peca_largura_cm,
    altura: projeto.peca_altura_cm,
  })

  return (
    <div className="pagina">
      <div className="crumb" onClick={() => navigate('/projetos')} style={{ marginBottom: 8 }}>
        <IconChevron size={11} para="esquerda" /> Projetos /{' '}
        <span style={{ color: 'var(--ink)' }}>{projeto.nome}</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="h titulo-pagina">{projeto.nome}</div>
          <span
            className="tag"
            style={{ border: '1px solid var(--chip-green-border)', color: 'var(--green-dark)' }}
          >
            TRICÔ
          </span>
        </div>
        <AcoesProjeto projeto={projeto} />
      </div>
      {/* mesma linha de subtítulo da manta de crochê: destino, peças e tamanho */}
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 18 }}>
        {projeto.destino ? `Destino: ${projeto.destino} · ` : ''}
        {prog.total} faixas
        {tamanho ? ` · ${fmtMedida(tamanho)}` : ''}
      </div>
      <AvisoArquivado projeto={projeto} />
      <ProgressoProjeto done={prog.done} total={prog.total} unidade="faixas" />
      {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>}
      {faixas && faixas.length > 0 && <Editor projeto={projeto} faixas={faixas} />}
      <div
        className="pgrid"
        style={
          {
            '--cols': '1.35fr 1fr',
            '--gap': '36px',
            marginTop: 30,
            paddingTop: 24,
            borderTop: '1px solid var(--border)',
          } as CSSProperties
        }
      >
        <Comentarios projetoId={projeto.id} />
        <Historico projetoId={projeto.id} />
      </div>
    </div>
  )
}
