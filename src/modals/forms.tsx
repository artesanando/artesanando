import { useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Lbl, Stepper } from '../components/ui/bits'
import { DatePicker, Select, TimePicker } from '../components/ui/controles'
import { Campo, LegendaObrigatorio, useFormulario } from '../components/ui/Campo'
import { ModalBox, ModalHeader } from './shared'
import { supabase } from '../lib/supabase'
import { useStore } from '../state/store'
import type { Papel, Preferencia, ReceitaCategoria } from '../types/database'
import {
  criarEmprestimo,
  fetchEmprestimosAtivos,
  fetchEstoque,
  saldoEmprestimo,
} from '../features/estoque/api'
import { criarReceita, uploadPdf } from '../features/biblioteca/api'
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

const REC_CATS: [ReceitaCategoria, string][] = [
  ['amigurumi', 'Amigurumi'],
  ['granny', 'Granny square'],
  ['faixa', 'Faixa de tricô'],
  ['manta', 'Esquema de manta'],
]

export function ModalReceita() {
  const { close } = useStore()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [categoria, setCategoria] = useState<ReceitaCategoria>('amigurumi')
  const [nome, setNome] = useState('')
  const [obs, setObs] = useState('')
  const [pdf, setPdf] = useState<File | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const salvar = useMutation({
    mutationFn: async () => {
      const pdf_path = pdf ? await uploadPdf(pdf) : null
      await criarReceita({
        nome: nome.trim(),
        categoria,
        sub: null,
        resumo: obs.trim() || null,
        specs: [],
        conteudo: {},
        pdf_path,
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
    if (!nome.trim()) {
      setErro('Dê um nome à receita.')
      return
    }
    salvar.mutate()
  }

  return (
    <ModalBox maxWidth={560}>
      <ModalHeader title="Adicionar à biblioteca" sub="Receita de amigurumi ou padrão de manta" />
      <form onSubmit={submit}>
        <Lbl style={{ marginBottom: 7 }}>CATEGORIA</Lbl>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {REC_CATS.map(([k, label]) => (
            <div
              key={k}
              className="seg"
              onClick={() => setCategoria(k)}
              style={
                categoria === k
                  ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                  : undefined
              }
            >
              {label}
            </div>
          ))}
        </div>
        <Lbl style={{ marginBottom: 7 }}>NOME</Lbl>
        <input
          className="field"
          style={{ marginBottom: 18 }}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Capivara da Lú"
        />
        <Lbl style={{ marginBottom: 7 }}>PDF (OPCIONAL)</Lbl>
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
        <Lbl style={{ marginBottom: 7 }}>OBSERVAÇÕES</Lbl>
        <textarea
          className="field"
          style={{ minHeight: 52, marginBottom: 24, resize: 'vertical' }}
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Ex.: usar fio 4mm, olhos de segurança 9mm…"
        />
        {erro && <ErroBox>{erro}</ErroBox>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="pill ghost" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="pill" disabled={salvar.isPending}>
            {salvar.isPending ? 'Salvando…' : 'Salvar na biblioteca'}
          </button>
        </div>
      </form>
    </ModalBox>
  )
}

export function ModalEmprestimo() {
  const { close } = useStore()
  const qc = useQueryClient()
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
    if (!integranteId || !itemId) {
      setErro('Escolha a integrante e o material.')
      return
    }
    salvar.mutate()
  }

  return (
    <ModalBox maxWidth={520}>
      <ModalHeader
        title="Registrar empréstimo"
        sub="Saída de material para uma integrante levar para casa"
      />
      <form onSubmit={submit}>
        <Lbl style={{ marginBottom: 7 }}>INTEGRANTE</Lbl>
        <div style={{ marginBottom: 18 }}>
          <Select
            ariaLabel="Integrante"
            value={integranteId}
            onChange={setIntegranteId}
            options={[
              ['', 'Escolher…'],
              ...(integrantes ?? []).map((p) => [p.id, p.nome] as [string, string]),
            ]}
          />
        </div>
        <Lbl style={{ marginBottom: 7 }}>MATERIAL</Lbl>
        <div style={{ marginBottom: 18 }}>
          <Select
            ariaLabel="Material"
            value={itemId}
            onChange={setItemId}
            options={[
              ['', 'Escolher…'],
              ...emprestaveis.map(
                (i) => [i.id, `${i.nome}${i.detalhe ? ` · ${i.detalhe}` : ''}`] as [string, string],
              ),
            ]}
          />
        </div>
        <div className="grid2" style={{ marginBottom: 24 }}>
          <div>
            <Lbl style={{ marginBottom: 7 }}>QUANTIDADE</Lbl>
            <Stepper value={quantidade} onChange={setQuantidade} min={1} max={99} />
          </div>
          <div>
            <Lbl style={{ marginBottom: 7 }}>PROJETO (OPCIONAL)</Lbl>
            <input
              className="field"
              value={projeto}
              onChange={(e) => setProjeto(e.target.value)}
              placeholder="Manta Primavera"
            />
          </div>
        </div>
        {erro && <ErroBox>{erro}</ErroBox>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="pill ghost" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="pill" disabled={salvar.isPending}>
            {salvar.isPending ? 'Registrando…' : 'Registrar empréstimo'}
          </button>
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
              <div
                key={e.id}
                className="card"
                onClick={() => escolher(e.id)}
                style={{
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
              </div>
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

export function ModalIntegrante() {
  const { close } = useStore()
  const [nome, setNome] = useState('')
  const [usuario, setUsuario] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [preferencia, setPreferencia] = useState<Preferencia>('croche')
  const [papel, setPapel] = useState<Papel>('integrante')
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const cadastrar = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (!nome.trim() || !usuario.trim() || !email.includes('@')) {
      setErro('Preencha nome, usuário e um email válido.')
      return
    }
    setEnviando(true)
    const { data, error } = await supabase.functions.invoke('invite-member', {
      body: {
        nome: nome.trim(),
        usuario: usuario.trim().toLowerCase(),
        email: email.trim(),
        telefone: telefone.trim() || null,
        preferencia,
        papel,
        redirectTo: `${window.location.origin}/definir-senha`,
      },
    })
    setEnviando(false)
    const bodyErr = (data as { error?: string } | null)?.error
    if (error || bodyErr) {
      setErro(bodyErr ?? 'Não foi possível enviar o convite. Tente novamente.')
      return
    }
    setOk(true)
  }

  const segStyle = (on: boolean) =>
    on
      ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
      : undefined

  return (
    <ModalBox maxWidth={520}>
      <ModalHeader
        title="Cadastrar integrante"
        sub="Ela recebe um convite por email para criar a senha"
      />
      {ok ? (
        <>
          <div
            style={{
              background: 'var(--chip-green)',
              border: '1px solid var(--chip-green-border)',
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: 13,
              color: 'var(--green-dark)',
              marginBottom: 24,
            }}
          >
            ✓ Convite enviado para <b>{email}</b>. Ela define a senha pelo link do email.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="pill" onClick={close}>
              Fechar
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={cadastrar}>
          <div className="grid2" style={{ marginBottom: 18 }}>
            <div>
              <Lbl style={{ marginBottom: 7 }}>NOME COMPLETO</Lbl>
              <input
                className="field"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Giulia Santos"
              />
            </div>
            <div>
              <Lbl style={{ marginBottom: 7 }}>USUÁRIO</Lbl>
              <input
                className="field"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="giulia.santos"
              />
            </div>
          </div>
          <Lbl style={{ marginBottom: 7 }}>EMAIL</Lbl>
          <input
            className="field"
            type="email"
            style={{ marginBottom: 18 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="giulia@email.com"
          />
          <div className="grid2" style={{ marginBottom: 18 }}>
            <div>
              <Lbl style={{ marginBottom: 7 }}>TELEFONE / WHATSAPP</Lbl>
              <input
                className="field"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 9 8888-0000"
              />
            </div>
            <div>
              <Lbl style={{ marginBottom: 7 }}>PREFERÊNCIA</Lbl>
              <select
                className="field"
                value={preferencia}
                onChange={(e) => setPreferencia(e.target.value as Preferencia)}
                style={{ width: '100%', appearance: 'none', cursor: 'pointer' }}
              >
                <option value="croche">Crochê</option>
                <option value="trico">Tricô</option>
                <option value="ambos">Crochê e tricô</option>
              </select>
            </div>
          </div>
          <Lbl style={{ marginBottom: 7 }}>PERFIL</Lbl>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <div
              className="seg"
              onClick={() => setPapel('integrante')}
              style={segStyle(papel === 'integrante')}
            >
              Integrante
            </div>
            <div
              className="seg"
              onClick={() => setPapel('admin')}
              style={segStyle(papel === 'admin')}
            >
              Administradora
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
            <button type="submit" className="pill" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar convite'}
            </button>
          </div>
        </form>
      )}
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
