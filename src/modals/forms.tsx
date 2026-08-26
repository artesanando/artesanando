import { useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Lbl, Stepper } from '../components/ui/bits'
import { DatePicker, Select, TimePicker } from '../components/ui/controles'
import { Campo, LegendaObrigatorio, useFormulario } from '../components/ui/Campo'
import { useToast } from '../components/ui/Toast'
import { ModalBox, ModalHeader } from './shared'
import { supabase } from '../lib/supabase'
import { useStore } from '../state/store'
import {
  criarEmprestimo,
  fetchEmprestimosAtivos,
  fetchEstoque,
  saldoEmprestimo,
} from '../features/estoque/api'
import {
  atualizarReceita,
  criarReceita,
  fetchReceitas,
  uploadPdf,
} from '../features/biblioteca/api'
import { CampoMedida } from '../components/ui/CampoMedida'
import type { Receita } from '../types/database'
import { CampoCapa } from '../components/ui/CampoCapa'
import { SeletorCategoria } from './SeletorCategoria'
import { ehLinkValido, subirCapa } from '../lib/capa'
import { fetchIntegrantesAtivas } from '../features/projetos/api'
import {
  atualizarEncontro,
  criarEncontro,
  datasSemanais,
  fetchEncontros,
  type Encontro,
} from '../features/presenca/api'
import { useSemestreAtivo } from '../lib/semestre'
import { TURNO_LABEL, type TurnoEncontro } from '../types/database'
import { hojeIso } from '../lib/format'
import { useAuth } from '../state/auth'
import { IconCheck, IconPdf } from '../components/ui/icons'

function ErroBox({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </div>
  )
}

/* Receita da biblioteca. Vem com PDF ou com link de vídeo — as duas coisas
   circulam no grupo, e forçar PDF deixava metade do acervo de fora.
   Também é por aqui que uma receita já salva ganha capa, medida ou correção:
   antes de existir edição, um nome errado ficava errado para sempre. */
export function ModalReceita() {
  const { receitaId } = useStore()

  const { data: receitas } = useQuery({
    queryKey: ['receitas'],
    queryFn: fetchReceitas,
    enabled: !!receitaId,
  })
  const atual = (receitas ?? []).find((r) => r.id === receitaId)
  const editando = !!receitaId

  // editando: espera a receita chegar para o estado nascer preenchido
  if (receitaId && !atual) return null
  return <FormReceita atual={atual} editando={editando} />
}

function FormReceita({ atual, editando }: { atual?: Receita; editando: boolean }) {
  const { close } = useStore()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const form = useFormulario<'nome' | 'video'>()

  const [nome, setNome] = useState(atual?.nome ?? '')
  const [obs, setObs] = useState(atual?.resumo ?? '')
  const [fonte, setFonte] = useState<'pdf' | 'video'>(atual?.video_url ? 'video' : 'pdf')
  const [pdf, setPdf] = useState<File | null>(null)
  const [video, setVideo] = useState(atual?.video_url ?? '')
  const [capa, setCapa] = useState<Blob | null>(null)
  const [medida, setMedida] = useState<{ largura: number | null; altura: number | null }>({
    largura: atual?.largura_cm ?? null,
    altura: atual?.altura_cm ?? null,
  })
  const [erro, setErro] = useState<string | null>(null)

  const salvar = useMutation({
    mutationFn: async () => {
      const pdf_path = fonte === 'pdf' && pdf ? await uploadPdf(pdf) : undefined
      const capa_path = capa ? await subirCapa(capa) : undefined
      const campos = {
        nome: nome.trim(),
        resumo: obs.trim() || null,
        video_url: fonte === 'video' ? video.trim() || null : null,
        largura_cm: medida.largura,
        altura_cm: medida.altura,
        ...(pdf_path !== undefined ? { pdf_path } : {}),
        ...(capa_path !== undefined ? { capa_path } : {}),
      }
      if (atual) {
        await atualizarReceita(atual.id, campos)
        return
      }
      await criarReceita({
        ...campos,
        categoria: 'amigurumi',
        sub: null,
        specs: [],
        conteudo: {},
        pdf_path: pdf_path ?? null,
        capa_path: capa_path ?? null,
        origem: 'manual',
        criado_por: profile!.id,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receitas'] })
      close()
    },
    onError: () => setErro('Não foi possível salvar a receita.'),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    const ok = form.checar({
      nome: nome.trim() ? undefined : 'Dê um nome à receita.',
      video:
        fonte === 'video' && video.trim() && !ehLinkValido(video)
          ? 'Cole o endereço completo do vídeo.'
          : undefined,
    })
    if (!ok) return
    salvar.mutate()
  }

  return (
    <ModalBox maxWidth={560}>
      <ModalHeader title={editando ? 'Editar receita' : 'Adicionar à biblioteca'} />
      <form onSubmit={submit}>
        {!editando && <SeletorCategoria atual="amigurumi" />}

        <Campo label="NOME" obrigatorio erro={form.erros.nome} style={{ marginBottom: 18 }}>
          {(p) => (
            <input
              {...p}
              className="field"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value)
                form.aoMudar('nome')
              }}
              placeholder="Capivara da Ada"
            />
          )}
        </Campo>

        <div className="lbl" style={{ marginBottom: 7 }}>
          FORMATO
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {(['pdf', 'video'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className="seg"
              aria-pressed={fonte === f}
              onClick={() => setFonte(f)}
              style={
                fonte === f
                  ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                  : undefined
              }
            >
              {f === 'pdf' ? 'PDF' : 'Vídeo'}
            </button>
          ))}
        </div>

        {fonte === 'pdf' ? (
          <label
            style={{
              display: 'block',
              border: '2px dashed var(--field-border)',
              borderRadius: 12,
              padding: 18,
              textAlign: 'center',
              fontSize: 12,
              color: pdf ? 'var(--accent)' : 'var(--faint)',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 18,
            }}
          >
            <IconPdf />
            {pdf ? pdf.name : 'Anexar PDF'}
            <input
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
            />
          </label>
        ) : (
          <Campo label="LINK DO VÍDEO" erro={form.erros.video} style={{ marginBottom: 18 }}>
            {(p) => (
              <input
                {...p}
                className="field"
                type="url"
                value={video}
                onChange={(e) => {
                  setVideo(e.target.value)
                  form.aoMudar('video')
                }}
                placeholder="https://youtube.com/watch?v=…"
              />
            )}
          </Campo>
        )}

        <div className="lbl" style={{ marginBottom: 7 }}>
          CAPA
        </div>
        <div style={{ marginBottom: 18 }}>
          <CampoCapa atual={atual?.capa_path} blob={capa} aoEscolher={setCapa} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <CampoMedida
            largura={medida.largura}
            altura={medida.altura}
            rotuloLargura="LARGURA DA PEÇA (CM)"
            rotuloAltura="ALTURA DA PEÇA (CM)"
            aoMudar={(patch) => setMedida((m) => ({ ...m, ...patch }))}
          />
        </div>

        <Lbl style={{ marginBottom: 7 }}>OBSERVAÇÕES</Lbl>
        <textarea
          className="field"
          style={{ minHeight: 52, marginBottom: 24, resize: 'vertical' }}
          value={obs}
          aria-label="Observações"
          onChange={(e) => setObs(e.target.value)}
          placeholder="usar fio 4mm, olhos de segurança 9mm…"
        />
        {erro && <ErroBox>{erro}</ErroBox>}
        <div className="modal-rodape com-legenda">
          <LegendaObrigatorio />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="pill ghost" onClick={close}>
              Cancelar
            </button>
            <button type="submit" className="pill" disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando…' : editando ? 'Salvar' : 'Salvar na biblioteca'}
            </button>
          </div>
        </div>
      </form>
    </ModalBox>
  )
}

export function ModalEmprestimo() {
  const { close } = useStore()
  const qc = useQueryClient()
  const form = useFormulario<'integrante' | 'material'>()
  const { data: integrantes } = useQuery({
    queryKey: ['integrantes-min'],
    queryFn: fetchIntegrantesAtivas,
  })
  const { data: itens } = useQuery({ queryKey: ['estoque'], queryFn: fetchEstoque })

  const [integranteId, setIntegranteId] = useState('')
  const [itemId, setItemId] = useState('')
  const [quantidade, setQuantidade] = useState(2)
  const [projeto, setProjeto] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const emprestaveis = (itens ?? []).filter((i) => i.categoria !== 'feira')

  const salvar = useMutation({
    mutationFn: () =>
      criarEmprestimo({
        item_id: itemId,
        integrante_id: integranteId,
        quantidade,
        projeto_nome: projeto || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emprestimos'] })
      close()
    },
    onError: () => setErro('Não foi possível registrar o empréstimo.'),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    const ok = form.checar({
      integrante: integranteId ? undefined : 'Escolha a integrante.',
      material: itemId ? undefined : 'Escolha o material.',
    })
    if (!ok) return
    salvar.mutate()
  }

  return (
    <ModalBox maxWidth={520}>
      <ModalHeader title="Registrar empréstimo" />
      <form onSubmit={submit}>
        <Campo
          label="INTEGRANTE"
          obrigatorio
          erro={form.erros.integrante}
          style={{ marginBottom: 18 }}
        >
          {() => (
            <Select
              ariaLabel="Integrante"
              value={integranteId}
              onChange={(v) => {
                setIntegranteId(v)
                form.aoMudar('integrante')
              }}
              options={[
                ['', 'Escolher…'],
                ...(integrantes ?? []).map((p) => [p.id, p.nome] as [string, string]),
              ]}
            />
          )}
        </Campo>
        <Campo label="MATERIAL" obrigatorio erro={form.erros.material} style={{ marginBottom: 18 }}>
          {() => (
            <Select
              ariaLabel="Material"
              value={itemId}
              onChange={(v) => {
                setItemId(v)
                form.aoMudar('material')
              }}
              options={[
                ['', 'Escolher…'],
                ...emprestaveis.map(
                  (i) =>
                    [i.id, `${i.nome}${i.detalhe ? ` · ${i.detalhe}` : ''}`] as [string, string],
                ),
              ]}
            />
          )}
        </Campo>
        <div className="grid2" style={{ marginBottom: 24 }}>
          <Campo label="QUANTIDADE">
            {() => (
              <Stepper
                value={quantidade}
                onChange={setQuantidade}
                min={1}
                max={99}
                ariaLabel="Quantidade"
              />
            )}
          </Campo>
          <Campo label="PROJETO">
            {(p) => (
              <input
                {...p}
                className="field"
                value={projeto}
                onChange={(e) => setProjeto(e.target.value)}
                placeholder="Manta Ada"
              />
            )}
          </Campo>
        </div>
        {erro && <ErroBox>{erro}</ErroBox>}
        <div className="modal-rodape com-legenda">
          <LegendaObrigatorio />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="pill ghost" onClick={close}>
              Cancelar
            </button>
            <button type="submit" className="pill" disabled={salvar.isPending}>
              {salvar.isPending ? 'Registrando…' : 'Registrar empréstimo'}
            </button>
          </div>
        </div>
      </form>
    </ModalBox>
  )
}

export function ModalDevolucao() {
  const { close, devolucaoId } = useStore()
  const qc = useQueryClient()
  const { data: loans } = useQuery({ queryKey: ['emprestimos'], queryFn: fetchEmprestimosAtivos })

  // o modal abre já com o empréstimo clicado selecionado (devolucaoId)
  const [selId, setSelId] = useState<string | null>(devolucaoId)
  const [qtd, setQtd] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const ativos = loans ?? []
  const sel = ativos.find((e) => e.id === selId) ?? ativos[0]
  const saldo = sel ? saldoEmprestimo(sel) : 0
  const devolvendo = qtd ?? saldo

  const confirmar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('devolucoes')
        .insert({ emprestimo_id: sel!.id, quantidade: devolvendo })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emprestimos'] })
      qc.invalidateQueries({ queryKey: ['estoque'] })
      close()
    },
    onError: () => setErro('Não foi possível registrar a devolução.'),
  })

  const escolher = (id: string) => {
    setSelId(id)
    setQtd(null)
  }

  return (
    <ModalBox maxWidth={520}>
      <ModalHeader title="Registrar devolução" />
      {ativos.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
          Nenhum empréstimo em aberto.
        </div>
      ) : (
        <>
          {ativos.map((e) => {
            const on = sel?.id === e.id
            return (
              <button
                key={e.id}
                type="button"
                className="card"
                aria-pressed={on}
                onClick={() => escolher(e.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  padding: '13px 15px',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  ...(on
                    ? { borderColor: 'var(--chip-rose-border)', background: 'var(--chip-soft)' }
                    : {}),
                }}
              >
                {on ? (
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      flex: 'none',
                    }}
                  >
                    <IconCheck size={12} />
                  </span>
                ) : (
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: '1.5px solid var(--field-border)',
                      flex: 'none',
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5 }}>
                    {e.integrante?.nome ?? '—'} · {saldoEmprestimo(e)}× {e.item?.nome}
                    {e.item?.detalhe ? ` ${e.item.detalhe}` : ''}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                    {e.projeto_nome ? `${e.projeto_nome} · ` : ''}emprestado {e.data.slice(8, 10)}/
                    {e.data.slice(5, 7)}
                  </div>
                </div>
              </button>
            )
          })}
          <Lbl style={{ margin: '10px 0 7px' }}>QUANTIDADE DEVOLVIDA</Lbl>
          <div style={{ marginBottom: 24 }}>
            <Stepper
              value={devolvendo}
              onChange={setQtd}
              min={1}
              max={saldo}
              suffix={`de ${saldo}`}
            />
          </div>
        </>
      )}
      {erro && <ErroBox>{erro}</ErroBox>}
      <div className="modal-rodape">
        <button type="button" className="pill ghost" onClick={close}>
          Cancelar
        </button>
        <button
          type="button"
          className="pill"
          disabled={!sel || confirmar.isPending}
          onClick={() => confirmar.mutate()}
        >
          {confirmar.isPending ? 'Registrando…' : 'Confirmar devolução'}
        </button>
      </div>
    </ModalBox>
  )
}

export function ModalEncontro() {
  const { encontroId } = useStore()
  const { data: encontros } = useQuery({ queryKey: ['encontros'], queryFn: fetchEncontros })
  const encontro = (encontros ?? []).find((e) => e.id === encontroId)

  // criando: monta direto. editando: espera o encontro para o estado nascer cheio
  if (encontroId && !encontro) return null
  return <FormEncontro encontro={encontro} />
}

function FormEncontro({ encontro }: { encontro?: Encontro }) {
  const { close } = useStore()
  const qc = useQueryClient()
  const toast = useToast()
  const form = useFormulario<'data'>()
  const editando = Boolean(encontro)

  const [data, setData] = useState(encontro?.data ?? hojeIso())
  const [hora, setHora] = useState(encontro?.hora?.slice(0, 5) ?? '14:00')
  const [local, setLocal] = useState(encontro?.local ?? '')
  const [pauta, setPauta] = useState(encontro?.pauta ?? '')
  const [turno, setTurno] = useState<TurnoEncontro>(encontro?.turno ?? 'diurno')
  /* O grupo se encontra toda semana; criar 18 encontros na mão é o tipo de
     trabalho que faz a admin desistir de usar o app. */
  const [repetir, setRepetir] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const semestre = useSemestreAtivo()
  const previstas = repetir ? datasSemanais(data, semestre?.fim ?? null).length : 1

  const salvar = useMutation({
    mutationFn: async () => {
      const campos = { data, hora, local: local.trim(), pauta: pauta.trim(), turno }
      if (encontro) {
        await atualizarEncontro(encontro.id, campos)
        return 1
      }
      return criarEncontro(campos, repetir)
    },
    onSuccess: (criados) => {
      qc.invalidateQueries({ queryKey: ['encontros'] })
      if (criados > 1) toast(`${criados} encontros criados`)
      close()
    },
    onError: () => setErro('Não foi possível salvar o encontro.'),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (!form.checar({ data: data ? undefined : 'Escolha a data do encontro.' })) return
    salvar.mutate()
  }

  return (
    <ModalBox maxWidth={520}>
      <ModalHeader title={editando ? 'Editar encontro' : 'Novo encontro'} />
      <form onSubmit={submit}>
        <div className="grid2" style={{ marginBottom: 18 }}>
          <Campo label="DATA" obrigatorio erro={form.erros.data}>
            {() => (
              <DatePicker
                value={data}
                onChange={(d) => {
                  setData(d)
                  form.aoMudar('data')
                }}
                ariaLabel="Data do encontro"
              />
            )}
          </Campo>
          <Campo label="HORÁRIO">
            {() => <TimePicker value={hora} onChange={setHora} ariaLabel="Horário do encontro" />}
          </Campo>
        </div>
        <div className="lbl" style={{ marginBottom: 7 }}>
          TURNO
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {(['diurno', 'noturno'] as TurnoEncontro[]).map((t) => (
            <button
              key={t}
              type="button"
              className="seg"
              aria-pressed={turno === t}
              onClick={() => setTurno(t)}
              style={
                turno === t
                  ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                  : undefined
              }
            >
              {TURNO_LABEL[t]}
            </button>
          ))}
        </div>

        <Campo label="SALA" style={{ marginBottom: 18 }}>
          {(p) => (
            <input
              {...p}
              className="field"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Sala 203"
            />
          )}
        </Campo>
        <Campo label="PAUTA" style={{ marginBottom: 24 }}>
          {(p) => (
            <textarea
              {...p}
              className="field"
              style={{ minHeight: 52, resize: 'vertical' }}
              value={pauta}
              onChange={(e) => setPauta(e.target.value)}
              placeholder="Montagem da Manta Ada"
            />
          )}
        </Campo>
        {!editando && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              marginBottom: 20,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={repetir}
              onChange={(e) => setRepetir(e.target.checked)}
              style={{ accentColor: 'var(--primary)', width: 17, height: 17 }}
            />
            <span>
              Repete toda semana
              {repetir && (
                <b style={{ color: 'var(--accent)' }}>
                  {' '}
                  — {previstas}{' '}
                  {previstas === 1
                    ? 'encontro até o fim do semestre'
                    : 'encontros até o fim do semestre'}
                </b>
              )}
            </span>
          </label>
        )}
        {erro && <ErroBox>{erro}</ErroBox>}
        <div className="modal-rodape com-legenda">
          <LegendaObrigatorio />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="pill ghost" onClick={close}>
              Cancelar
            </button>
            <button type="submit" className="pill" disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando…' : editando ? 'Salvar' : 'Criar encontro'}
            </button>
          </div>
        </div>
      </form>
    </ModalBox>
  )
}
