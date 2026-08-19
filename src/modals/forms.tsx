import { useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Lbl, Stepper } from '../components/ui/bits'
import { DatePicker, Select, TimePicker } from '../components/ui/controles'
import { Campo, LegendaObrigatorio, useFormulario } from '../components/ui/Campo'
import { ModalBox, ModalHeader } from './shared'
import { supabase } from '../lib/supabase'
import { useStore } from '../state/store'
import {
  criarEmprestimo,
  fetchEmprestimosAtivos,
  fetchEstoque,
  saldoEmprestimo,
} from '../features/estoque/api'
import { criarReceita, uploadPdf } from '../features/biblioteca/api'
import { CampoCapa } from '../components/ui/CampoCapa'
import { SeletorCategoria } from './SeletorCategoria'
import { ehLinkValido, subirCapa } from '../lib/capa'
import { fetchIntegrantesAtivas } from '../features/projetos/api'
import {
  atualizarEncontro,
  criarEncontro,
  fetchEncontros,
  type Encontro,
} from '../features/presenca/api'
import { hojeIso } from '../lib/format'
import { useAuth } from '../state/auth'

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
   circulam no grupo, e forçar PDF deixava metade do acervo de fora. */
export function ModalReceita() {
  const { close } = useStore()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const form = useFormulario<'nome' | 'video'>()
  const [nome, setNome] = useState('')
  const [obs, setObs] = useState('')
  const [fonte, setFonte] = useState<'pdf' | 'video'>('pdf')
  const [pdf, setPdf] = useState<File | null>(null)
  const [video, setVideo] = useState('')
  const [capa, setCapa] = useState<Blob | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const salvar = useMutation({
    mutationFn: async () => {
      const pdf_path = fonte === 'pdf' && pdf ? await uploadPdf(pdf) : null
      const capa_path = capa ? await subirCapa(capa) : null
      await criarReceita({
        nome: nome.trim(),
        categoria: 'amigurumi',
        sub: null,
        resumo: obs.trim() || null,
        specs: [],
        conteudo: {},
        pdf_path,
        video_url: fonte === 'video' ? video.trim() : null,
        capa_path,
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
      <ModalHeader title="Adicionar à biblioteca" />
      <form onSubmit={submit}>
        <SeletorCategoria atual="amigurumi" />

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
          COMO A RECEITA VEM
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
            {pdf ? `📄 ${pdf.name}` : '📄 Anexar PDF'}
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
          <CampoCapa blob={capa} aoEscolher={setCapa} />
        </div>

        <Lbl style={{ marginBottom: 7 }}>OBSERVAÇÕES</Lbl>
        <textarea
          className="field"
          style={{ minHeight: 52, marginBottom: 24, resize: 'vertical' }}
          value={obs}
          aria-label="Observações"
          onChange={(e) => setObs(e.target.value)}
          placeholder="Ex.: usar fio 4mm, olhos de segurança 9mm…"
        />
        {erro && <ErroBox>{erro}</ErroBox>}
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
            <button type="submit" className="pill" disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando…' : 'Salvar na biblioteca'}
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
      <ModalHeader
        title="Registrar empréstimo"
        sub="Saída de material para uma integrante levar para casa"
      />
      <form onSubmit={submit}>
        <Campo label="INTEGRANTE" obrigatorio erro={form.erros.integrante} style={{ marginBottom: 18 }}>
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
                  (i) => [i.id, `${i.nome}${i.detalhe ? ` · ${i.detalhe}` : ''}`] as [string, string],
                ),
              ]}
            />
          )}
        </Campo>
        <div className="grid2" style={{ marginBottom: 24 }}>
          <Campo label="QUANTIDADE">
            {() => (
              <Stepper value={quantidade} onChange={setQuantidade} min={1} max={99} ariaLabel="Quantidade" />
            )}
          </Campo>
          <Campo label="PROJETO (OPCIONAL)">
            {(p) => (
              <input
                {...p}
                className="field"
                value={projeto}
                onChange={(e) => setProjeto(e.target.value)}
                placeholder="Manta Primavera"
              />
            )}
          </Campo>
        </div>
        {erro && <ErroBox>{erro}</ErroBox>}
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
      <ModalHeader title="Registrar devolução" sub="Selecione o empréstimo a encerrar" />
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
                    ✓
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
            <Stepper value={devolvendo} onChange={setQtd} min={1} max={saldo} suffix={`de ${saldo}`} />
          </div>
        </>
      )}
      {erro && <ErroBox>{erro}</ErroBox>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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
  const form = useFormulario<'data'>()
  const editando = Boolean(encontro)

  const [data, setData] = useState(encontro?.data ?? hojeIso())
  const [hora, setHora] = useState(encontro?.hora?.slice(0, 5) ?? '14:00')
  const [local, setLocal] = useState(encontro?.local ?? '')
  const [pauta, setPauta] = useState(encontro?.pauta ?? '')
  const [erro, setErro] = useState<string | null>(null)

  const salvar = useMutation({
    mutationFn: () => {
      const campos = { data, hora, local: local.trim(), pauta: pauta.trim() }
      return encontro ? atualizarEncontro(encontro.id, campos) : criarEncontro(campos)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['encontros'] })
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
      <ModalHeader
        title={editando ? 'Editar encontro' : 'Novo encontro'}
        sub={editando ? 'A chamada já feita continua valendo' : 'Abre a chamada e a pauta do dia'}
      />
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
        <Campo label="SALA (OPCIONAL)" style={{ marginBottom: 18 }}>
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
        <Campo label="PAUTA (OPCIONAL)" style={{ marginBottom: 24 }}>
          {(p) => (
            <textarea
              {...p}
              className="field"
              style={{ minHeight: 52, resize: 'vertical' }}
              value={pauta}
              onChange={(e) => setPauta(e.target.value)}
              placeholder="Montagem da Manta Primavera"
            />
          )}
        </Campo>
        {erro && <ErroBox>{erro}</ErroBox>}
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
            <button type="submit" className="pill" disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando…' : editando ? 'Salvar' : 'Criar encontro'}
            </button>
          </div>
        </div>
      </form>
    </ModalBox>
  )
}
