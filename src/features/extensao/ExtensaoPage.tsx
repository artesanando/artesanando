import { useState, type CSSProperties, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { AvatarPerfil } from '../../components/ui/AvatarPerfil'
import { Lbl, Stepper } from '../../components/ui/bits'
import { Campo, useFormulario } from '../../components/ui/Campo'
import { DatePicker, MenuKebab, Select } from '../../components/ui/controles'
import { useToast } from '../../components/ui/Toast'
import { useConfirmar } from '../../components/ui/Confirm'
import { fmtDataCurta, fmtDataLonga, hojeIso } from '../../lib/format'
import { fetchSemestres, useSemestreAtivo } from '../../lib/semestre'
import { NIVEL_LABEL, TURNO_LABEL, type Nivel } from '../../types/database'
import { entregasDe, fetchEntregasLight, fetchIntegrantes } from '../integrantes/api'
import { avaliaRegra, textoDaLinha, TIPO_LABEL, type TipoLinha } from './creditos'
import {
  ACAO_LABEL,
  criarBloco,
  criarLinha,
  fetchAuditoria,
  fetchMarcas,
  fetchRegras,
  filtraAuditoria,
  marcarCredito,
  removerBloco,
  removerLinha,
  resumoDaLinha,
  type AcaoAuditoria,
} from './creditosApi'
import {
  contaNaFrequencia,
  encontrosPassados,
  fetchEncontros,
  fetchPresencas,
  frequenciaDe,
  presentesDe,
} from '../presenca/api'
import {
  abrirArquivo,
  fetchArquivos,
  linhasDoRelatorio,
  removerArquivo,
  subirArquivo,
  urlsDosArquivos,
  type ArquivoExtensao,
  type TipoArquivo,
} from './api'

type Secao = 'creditos' | 'frequencia' | 'entregas' | 'chamadas' | 'arquivos' | 'auditoria'

const SECOES: [Secao, string][] = [
  ['creditos', 'Créditos'],
  ['frequencia', 'Frequência'],
  ['entregas', 'Entregas'],
  ['chamadas', 'Chamadas'],
  ['arquivos', 'Arquivos'],
  ['auditoria', 'Auditoria'],
]

const NIVEIS: Nivel[] = ['iniciante', 'experiente']

const TIPOS: [TipoLinha, string][] = (
  ['amigurumi', 'granny', 'faixa', 'frequencia', 'mentoria'] as TipoLinha[]
).map((t) => [t, TIPO_LABEL[t]])

const item = (on: boolean): CSSProperties => ({
  padding: '9px 12px',
  borderRadius: 10,
  border: 'none',
  width: '100%',
  textAlign: 'left',
  fontFamily: 'inherit',
  fontSize: 13,
  cursor: 'pointer',
  background: on ? 'var(--chip-rose)' : 'transparent',
  color: on ? 'var(--accent)' : 'var(--muted)',
  fontWeight: on ? 800 : 700,
  transition: 'background var(--dur-rapida) var(--ease-suave)',
})

/* Tudo que a coordenação precisa para prestar contas do semestre num lugar só.
   Não é configuração do app — é o produto do trabalho — e por isso tem tela
   própria em vez de virar mais uma aba de Ajustes. */
export function ExtensaoPage() {
  const [secao, setSecao] = useState<Secao>('creditos')
  const ativo = useSemestreAtivo()
  const { data: semestres } = useQuery({ queryKey: ['semestres'], queryFn: fetchSemestres })

  /* Lente de leitura, não troca de semestre ativo: dá para conferir o semestre
     passado sem mexer no que Projetos e Financeiro estão mostrando. */
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const semestreId = escolhido ?? ativo?.id ?? null

  return (
    <div
      className="pagina pgrid"
      style={{ '--cols': '180px 1fr', '--gap': '34px' } as CSSProperties}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="h titulo-pagina" style={{ marginBottom: 2 }}>
          Atividade de extensão
        </div>
        <div style={{ marginBottom: 12 }}>
          {(semestres ?? []).length > 0 ? (
            <Select
              value={semestreId ?? ''}
              onChange={setEscolhido}
              options={(semestres ?? []).map((s) => [s.id, s.label] as [string, string])}
              ariaLabel="Semestre"
            />
          ) : (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>sem semestre ativo</span>
          )}
        </div>
        {SECOES.map(([k, label]) => (
          <button key={k} style={item(secao === k)} onClick={() => setSecao(k)}>
            {label}
          </button>
        ))}
      </div>

      <div>
        {secao === 'creditos' && <Creditos semestreId={semestreId} />}
        {secao === 'frequencia' && <Frequencia semestreId={semestreId} />}
        {secao === 'entregas' && <Entregas semestreId={semestreId} />}
        {secao === 'chamadas' && <Chamadas semestreId={semestreId} />}
        {secao === 'arquivos' && <Arquivos semestreId={semestreId} />}
        {secao === 'auditoria' && <Auditoria />}
      </div>
    </div>
  )
}

/* ---------- Frequência ---------- */

/* Encontros do semestre escolhido. Antes as três primeiras seções somavam tudo
   desde o começo do app, apesar de o título dizer "do semestre". */
const doSemestre = <T extends { semestre_id: string | null }>(linhas: T[], id: string | null) =>
  id ? linhas.filter((l) => l.semestre_id === id) : linhas

function Frequencia({ semestreId }: { semestreId: string | null }) {
  const toast = useToast()
  const hoje = hojeIso()
  const { data: integrantes } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })
  const { data: encontros } = useQuery({ queryKey: ['encontros'], queryFn: fetchEncontros })
  const { data: presencas } = useQuery({ queryKey: ['presencas'], queryFn: fetchPresencas })
  const { data: entregas } = useQuery({ queryKey: ['entregas-light'], queryFn: fetchEntregasLight })

  const ativos = doSemestre(encontros ?? [], semestreId)
  const linhas = (integrantes ?? []).map((p) => {
    const f = frequenciaDe(p.id, ativos, presencas ?? [], hoje, p.turno)
    return {
      id: p.id,
      nome: p.nome,
      turno: p.turno,
      avatarColor: p.avatar_color,
      avatarUrl: p.avatar_url,
      f,
      entregas: entregas ? entregasDe(p.id, entregas, semestreId).total : 0,
    }
  })

  const copiar = async () => {
    const texto = linhasDoRelatorio(
      linhas.map((l) => ({
        nome: l.nome,
        diurno: `${l.f.diurno.presentes}/${l.f.diurno.total}`,
        noturno: `${l.f.noturno.presentes}/${l.f.noturno.total}`,
        total: `${l.f.total.pct}%`,
        entregas: l.entregas,
      })),
    )
    await navigator.clipboard?.writeText(texto)
    toast('Tabela copiada ✓')
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div className="h" style={{ fontSize: 18 }}>
          Frequência por integrante
        </div>
        <button className="pill ghost" onClick={copiar}>
          Copiar tabela
        </button>
      </div>

      <div className="card" style={{ borderRadius: 14, overflow: 'hidden' }}>
        <div className="lbl linha-extensao cabecalho">
          <div>INTEGRANTE</div>
          <div style={{ textAlign: 'center' }}>DIURNO</div>
          <div style={{ textAlign: 'center' }}>NOTURNO</div>
          <div style={{ textAlign: 'center' }}>TOTAL</div>
          <div style={{ textAlign: 'center' }}>ENTREGAS</div>
        </div>
        {linhas.length === 0 && (
          <div style={{ padding: 18, fontSize: 13, color: 'var(--muted)' }}>
            Nenhuma integrante cadastrada ainda.
          </div>
        )}
        {linhas.map((l) => (
          <div key={l.id} className="linha-extensao">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <AvatarPerfil
                nome={l.nome}
                avatarColor={l.avatarColor}
                avatarUrl={l.avatarUrl}
                size={28}
                fontSize={10}
              />
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 13 }}>{l.nome}</b>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{TURNO_LABEL[l.turno]}</div>
              </div>
            </div>
            <Celula rotulo="DIURNO" valor={`${l.f.diurno.presentes}/${l.f.diurno.total}`} />
            <Celula rotulo="NOTURNO" valor={`${l.f.noturno.presentes}/${l.f.noturno.total}`} />
            <Celula rotulo="TOTAL" valor={`${l.f.total.pct}%`} destaque />
            <Celula rotulo="ENTREGAS" valor={String(l.entregas)} />
          </div>
        ))}
      </div>
    </>
  )
}

function Celula({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string
  valor: string
  destaque?: boolean
}) {
  return (
    <div className="cel-extensao">
      <span className="rotulo-extensao">{rotulo}</span>
      <b style={{ fontSize: 13, color: destaque ? 'var(--accent)' : 'var(--ink-soft)' }}>{valor}</b>
    </div>
  )
}

/* ---------- Entregas ---------- */

function Entregas({ semestreId }: { semestreId: string | null }) {
  const { data: integrantes } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })
  const { data: entregas } = useQuery({ queryKey: ['entregas-light'], queryFn: fetchEntregasLight })

  const linhas = (integrantes ?? [])
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      ...(entregas
        ? entregasDe(p.id, entregas, semestreId)
        : { amigurumis: 0, faixas: 0, grannies: 0, total: 0 }),
    }))
    .sort((a, b) => b.total - a.total)

  const soma = linhas.reduce((s, l) => s + l.total, 0)

  return (
    <>
      <div className="h" style={{ fontSize: 18, marginBottom: 4 }}>
        Entregas do semestre
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>
        {soma} peças entregues no total
      </div>

      <div className="card" style={{ borderRadius: 14, overflow: 'hidden' }}>
        <div className="lbl linha-extensao cabecalho">
          <div>INTEGRANTE</div>
          <div style={{ textAlign: 'center' }}>AMIGURUMIS</div>
          <div style={{ textAlign: 'center' }}>FAIXAS</div>
          <div style={{ textAlign: 'center' }}>SQUARES</div>
          <div style={{ textAlign: 'center' }}>TOTAL</div>
        </div>
        {linhas.map((l) => (
          <div key={l.id} className="linha-extensao">
            <b style={{ fontSize: 13 }}>{l.nome}</b>
            <Celula rotulo="AMIGURUMIS" valor={String(l.amigurumis)} />
            <Celula rotulo="FAIXAS" valor={String(l.faixas)} />
            <Celula rotulo="SQUARES" valor={String(l.grannies)} />
            <Celula rotulo="TOTAL" valor={String(l.total)} destaque />
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------- Chamadas ---------- */

function Chamadas({ semestreId }: { semestreId: string | null }) {
  const hoje = hojeIso()
  const [aberto, setAberto] = useState<string | null>(null)
  const { data: encontros } = useQuery({ queryKey: ['encontros'], queryFn: fetchEncontros })
  const { data: presencas } = useQuery({ queryKey: ['presencas'], queryFn: fetchPresencas })
  const { data: integrantes } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })

  const ativos = doSemestre(encontros ?? [], semestreId)
  const lista = encontrosPassados(ativos, hoje)
  const nomePor = new Map((integrantes ?? []).map((p) => [p.id, p.nome]))

  const presentesDoDia = (encontroId: string) =>
    (presencas ?? [])
      .filter((p) => p.encontro_id === encontroId && p.presente)
      .map((p) => nomePor.get(p.integrante_id) ?? '—')
      .sort((a, b) => a.localeCompare(b))

  return (
    <>
      <div className="h" style={{ fontSize: 18, marginBottom: 16 }}>
        Chamadas do semestre
      </div>
      <div className="card" style={{ borderRadius: 14, overflow: 'hidden' }}>
        {lista.length === 0 && (
          <div style={{ padding: 18, fontSize: 13, color: 'var(--muted)' }}>
            Nenhum encontro registrado ainda.
          </div>
        )}
        {lista.map((e) => {
          const nomes = presentesDoDia(e.id)
          const cancelado = Boolean(e.cancelado_em)
          return (
            <div key={e.id} style={{ borderTop: '1px solid var(--divider)' }}>
              <button
                onClick={() => setAberto(aberto === e.id ? null : e.id)}
                aria-expanded={aberto === e.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '13px 18px',
                  border: 'none',
                  background: 'none',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <b
                  style={{
                    width: 92,
                    flex: 'none',
                    textDecoration: cancelado ? 'line-through' : undefined,
                  }}
                >
                  {fmtDataCurta(e.data)}
                </b>
                <span style={{ flex: 1, minWidth: 0, color: 'var(--muted)' }}>
                  {TURNO_LABEL[e.turno]}
                  {e.local ? ` · ${e.local}` : ''}
                  {e.pauta ? ` · ${e.pauta}` : ''}
                </span>
                <span style={{ fontWeight: 800, color: 'var(--accent)', flex: 'none' }}>
                  {cancelado ? 'cancelado' : `${presentesDe(presencas ?? [], e.id)} presentes`}
                </span>
              </button>
              {aberto === e.id && !cancelado && (
                <div
                  style={{
                    padding: '0 18px 14px',
                    fontSize: 12.5,
                    color: 'var(--ink-soft)',
                    lineHeight: 1.6,
                  }}
                >
                  {nomes.length > 0 ? nomes.join(' · ') : 'Ninguém marcado nesta chamada.'}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 10 }}>
        {lista.filter(contaNaFrequencia).length} encontros contam para a frequência.
      </div>
    </>
  )
}

/* ---------- Arquivos ---------- */

function Arquivos({ semestreId }: { semestreId: string | null }) {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const confirmar = useConfirmar()
  const form = useFormulario<'titulo' | 'arquivo'>()

  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<TipoArquivo>('foto')
  const [data, setData] = useState(hojeIso())
  const [arquivo, setArquivo] = useState<File | null>(null)

  const { data: arquivos } = useQuery({
    queryKey: ['arquivos-extensao', semestreId],
    queryFn: () => fetchArquivos(semestreId),
  })

  const fotos = (arquivos ?? []).filter((a) => a.tipo === 'foto')
  const { data: urls } = useQuery({
    queryKey: ['urls-extensao', fotos.map((f) => f.path).join(',')],
    queryFn: () => urlsDosArquivos(fotos.map((f) => f.path)),
    enabled: fotos.length > 0,
  })

  const invalidar = () => qc.invalidateQueries({ queryKey: ['arquivos-extensao'] })

  const enviar = useMutation({
    mutationFn: () =>
      subirArquivo(arquivo!, {
        titulo: titulo.trim(),
        tipo,
        data,
        semestreId: semestreId,
        criadoPor: profile!.id,
      }),
    onSuccess: () => {
      setTitulo('')
      setArquivo(null)
      invalidar()
      toast('Arquivo enviado ✓')
    },
    onError: () => toast('Não foi possível enviar o arquivo.', 'erro'),
  })

  const remover = useMutation({
    mutationFn: (a: ArquivoExtensao) => removerArquivo(a),
    onSuccess: () => {
      invalidar()
      toast('Arquivo removido ✓')
    },
    onError: () => toast('Não foi possível remover.', 'erro'),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const ok = form.checar({
      titulo: titulo.trim() ? undefined : 'Dê um título ao arquivo.',
      arquivo: arquivo ? undefined : 'Escolha o arquivo.',
    })
    if (!ok) return
    enviar.mutate()
  }

  return (
    <>
      <div className="h" style={{ fontSize: 18, marginBottom: 16 }}>
        Arquivos do semestre
      </div>

      <form
        onSubmit={submit}
        className="card"
        style={{ padding: '16px 18px', borderRadius: 14, marginBottom: 24 }}
      >
        <div className="grid2" style={{ marginBottom: 14 }}>
          <Campo label="TÍTULO" obrigatorio erro={form.erros.titulo}>
            {(p) => (
              <input
                {...p}
                className="field"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value)
                  form.aoMudar('titulo')
                }}
                placeholder="Doação ao Hospital Infantil"
              />
            )}
          </Campo>
          <Campo label="DATA">
            {() => <DatePicker value={data} onChange={setData} ariaLabel="Data do arquivo" />}
          </Campo>
        </div>

        <div className="grid2" style={{ marginBottom: 14 }}>
          <Campo label="TIPO">
            {() => (
              <Select<TipoArquivo>
                value={tipo}
                onChange={setTipo}
                ariaLabel="Tipo do arquivo"
                options={[
                  ['foto', 'Foto'],
                  ['documento', 'Documento (PDF)'],
                ]}
              />
            )}
          </Campo>
          <Campo label="ARQUIVO" obrigatorio erro={form.erros.arquivo}>
            {() => (
              <label
                className="field"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: arquivo ? 'var(--ink)' : 'var(--faint)',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {arquivo ? arquivo.name : 'Escolher…'}
                <input
                  type="file"
                  accept={tipo === 'foto' ? 'image/*' : 'application/pdf'}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    setArquivo(e.target.files?.[0] ?? null)
                    form.aoMudar('arquivo')
                  }}
                />
              </label>
            )}
          </Campo>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="pill" disabled={enviar.isPending}>
            {enviar.isPending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </form>

      {fotos.length > 0 && (
        <>
          <div className="lbl" style={{ marginBottom: 10 }}>
            FOTOS
          </div>
          <div
            className="pgrid"
            style={
              {
                '--cols': 'repeat(auto-fill, minmax(150px, 1fr))',
                '--gap': '12px',
                marginBottom: 24,
              } as CSSProperties
            }
          >
            {fotos.map((f) => (
              <figure key={f.id} className="card" style={{ margin: 0, overflow: 'hidden' }}>
                <button
                  onClick={() => abrirArquivo(f.path)}
                  aria-label={`Abrir ${f.titulo}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    border: 'none',
                    padding: 0,
                    background: 'var(--sand)',
                    cursor: 'pointer',
                  }}
                >
                  <img
                    src={urls?.get(f.path) ?? ''}
                    alt=""
                    style={{
                      width: '100%',
                      aspectRatio: '4 / 3',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </button>
                <figcaption
                  style={{
                    padding: '9px 11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12 }}>
                    <b style={{ display: 'block' }}>{f.titulo}</b>
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>
                      {fmtDataLonga(f.data)}
                    </span>
                  </span>
                  <MenuKebab
                    ariaLabel={`Ações de ${f.titulo}`}
                    acoes={[
                      { label: 'Abrir', onSelect: () => abrirArquivo(f.path) },
                      {
                        label: 'Remover',
                        perigo: true,
                        onSelect: async () => {
                          if (await confirmar({ titulo: `Remover "${f.titulo}"?`, perigo: true }))
                            remover.mutate(f)
                        },
                      },
                    ]}
                  />
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}

      <div className="lbl" style={{ marginBottom: 10 }}>
        DOCUMENTOS
      </div>
      <div className="card" style={{ borderRadius: 14, overflow: 'hidden' }}>
        {(arquivos ?? []).filter((a) => a.tipo === 'documento').length === 0 && (
          <div style={{ padding: 18, fontSize: 13, color: 'var(--muted)' }}>
            Nenhum documento enviado ainda.
          </div>
        )}
        {(arquivos ?? [])
          .filter((a) => a.tipo === 'documento')
          .map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 18px',
                borderTop: '1px solid var(--divider)',
                fontSize: 13,
              }}
            >
              <button
                onClick={() => abrirArquivo(a.path)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <b>{a.titulo}</b>
                <span style={{ color: 'var(--muted)' }}> · {fmtDataLonga(a.data)}</span>
              </button>
              <MenuKebab
                ariaLabel={`Ações de ${a.titulo}`}
                acoes={[
                  { label: 'Abrir', onSelect: () => abrirArquivo(a.path) },
                  {
                    label: 'Remover',
                    perigo: true,
                    onSelect: async () => {
                      if (await confirmar({ titulo: `Remover "${a.titulo}"?`, perigo: true }))
                        remover.mutate(a)
                    },
                  },
                ]}
              />
            </div>
          ))}
      </div>
    </>
  )
}

/* ---------- Créditos ---------- */

/* Duas metades: a regra do semestre por nível, e quem cumpriu.
   A regra é blocos (E) de alternativas (OU) — ver `creditos.ts`. */
function Creditos({ semestreId }: { semestreId: string | null }) {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const hoje = hojeIso()

  const { data: regras } = useQuery({
    queryKey: ['regras-credito', semestreId],
    queryFn: () => fetchRegras(semestreId!),
    enabled: Boolean(semestreId),
  })
  const { data: marcas } = useQuery({
    queryKey: ['credito-marcas', semestreId],
    queryFn: () => fetchMarcas(semestreId!),
    enabled: Boolean(semestreId),
  })
  const { data: integrantes } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })
  const { data: encontros } = useQuery({ queryKey: ['encontros'], queryFn: fetchEncontros })
  const { data: presencas } = useQuery({ queryKey: ['presencas'], queryFn: fetchPresencas })
  const { data: entregas } = useQuery({ queryKey: ['entregas-light'], queryFn: fetchEntregasLight })

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['regras-credito', semestreId] })
    qc.invalidateQueries({ queryKey: ['credito-marcas', semestreId] })
  }

  const mudar = useMutation({
    mutationFn: (acao: () => Promise<void>) => acao(),
    onSuccess: invalidar,
    onError: () => toast('Não foi possível salvar a regra.', 'erro'),
  })

  const marcar = useMutation({
    mutationFn: (m: {
      perfilId: string
      mentoria: boolean
      cumprido: boolean
      motivo: string | null
    }) => marcarCredito({ ...m, semestreId: semestreId!, por: profile!.id }),
    onSuccess: () => {
      invalidar()
      toast('Marca registrada ✓')
    },
    onError: () => toast('Não foi possível marcar.', 'erro'),
  })

  if (!semestreId) {
    return <div style={{ fontSize: 13, color: 'var(--muted)' }}>Crie um semestre em Ajustes.</div>
  }

  const doSem = doSemestre(encontros ?? [], semestreId)

  const linhas = (integrantes ?? []).map((p) => {
    const freq = frequenciaDe(p.id, doSem, presencas ?? [], hoje, p.turno)
    const dela = entregas
      ? entregasDe(p.id, entregas, semestreId)
      : { amigurumis: 0, faixas: 0, grannies: 0, total: 0 }
    const marca = marcas?.get(p.id) ?? null
    return { p, marca, av: avaliaRegra(regras?.[p.nivel] ?? [], dela, freq.total.pct, marca) }
  })

  return (
    <>
      <div className="h" style={{ fontSize: 17, marginBottom: 4 }}>
        Regras do semestre
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
        Cada bloco é obrigatório; dentro dele, basta cumprir uma linha.
      </div>

      <div
        className="pgrid"
        style={{ '--cols': '1fr 1fr', '--gap': '18px', marginBottom: 30 } as CSSProperties}
      >
        {NIVEIS.map((nivel) => (
          <div key={nivel}>
            <Lbl style={{ marginBottom: 8 }}>{NIVEL_LABEL[nivel].toUpperCase()}</Lbl>
            {(regras?.[nivel] ?? []).map((b, i) => (
              <div
                key={b.id}
                style={{
                  border: '1px solid var(--field-border)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  marginBottom: 8,
                  background: 'var(--card)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)' }}>
                    BLOCO {i + 1} · BASTA UMA
                  </span>
                  <button
                    type="button"
                    className="kebab"
                    aria-label={`Remover o bloco ${i + 1} de ${NIVEL_LABEL[nivel]}`}
                    onClick={() => mudar.mutate(() => removerBloco(b.id))}
                  >
                    ✕
                  </button>
                </div>
                {b.linhas.map((l) => (
                  <div
                    key={l.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12.5,
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ flex: 1 }}>
                      {l.tipo === 'mentoria'
                        ? TIPO_LABEL.mentoria
                        : `${l.quantidade} ${TIPO_LABEL[l.tipo]}`}
                    </span>
                    <button
                      type="button"
                      className="kebab"
                      aria-label={`Remover ${TIPO_LABEL[l.tipo]} do bloco ${i + 1}`}
                      onClick={() => mudar.mutate(() => removerLinha(l.id))}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <NovaLinha aoAdicionar={(t, q) => mudar.mutate(() => criarLinha(b.id, t, q))} />
              </div>
            ))}
            <button
              type="button"
              className="pill ghost"
              style={{ padding: '6px 14px', fontSize: 12 }}
              onClick={() =>
                mudar.mutate(() => criarBloco(semestreId, nivel, (regras?.[nivel] ?? []).length))
              }
            >
              + Bloco
            </button>
          </div>
        ))}
      </div>

      <div className="h" style={{ fontSize: 17, marginBottom: 12 }}>
        Quem cumpriu
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {linhas.map(({ p, marca, av }, i) => (
          <div
            key={p.id}
            style={{
              padding: '12px 14px',
              borderTop: i > 0 ? '1px solid var(--border)' : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <AvatarPerfil
                nome={p.nome}
                avatarColor={p.avatar_color}
                avatarUrl={p.avatar_url}
                size={26}
                fontSize={10}
              />
              <b style={{ fontSize: 13, flex: 1, minWidth: 120 }}>{p.nome}</b>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{NIVEL_LABEL[p.nivel]}</span>
              <span
                className="tag"
                style={
                  av.cumpriu
                    ? { background: 'var(--chip-green)', color: 'var(--green-dark)' }
                    : { background: 'var(--chip-warn)', color: 'var(--gold-dark)' }
                }
              >
                {av.cumpriu ? (av.manual ? 'CUMPRIU · MANUAL' : 'CUMPRIU') : 'FALTA'}
              </span>
              <MenuKebab
                ariaLabel={`Marcas de ${p.nome}`}
                acoes={[
                  {
                    label: marca?.mentoria ? 'Tirar a mentoria' : 'Marcar mentoria',
                    onSelect: () =>
                      marcar.mutate({
                        perfilId: p.id,
                        mentoria: !marca?.mentoria,
                        cumprido: marca?.cumprido ?? false,
                        motivo: marca?.motivo ?? null,
                      }),
                  },
                  {
                    label: marca?.cumprido ? 'Desfazer o cumprido' : 'Dar como cumprida',
                    onSelect: () =>
                      marcar.mutate({
                        perfilId: p.id,
                        mentoria: marca?.mentoria ?? false,
                        cumprido: !marca?.cumprido,
                        motivo: marca?.cumprido ? null : 'dada como cumprida pela coordenação',
                      }),
                  },
                ]}
              />
            </div>
            {/* todas as alternativas lado a lado: dá para ver quem está quase lá */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 7 }}>
              {av.blocos.length === 0 && (
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  Sem regra para {NIVEL_LABEL[p.nivel].toLowerCase()} neste semestre.
                </span>
              )}
              {av.blocos.map((b) => (
                <span
                  key={b.id}
                  style={{
                    fontSize: 11.5,
                    color: b.cumpriu ? 'var(--green-dark)' : 'var(--muted)',
                    fontWeight: b.cumpriu ? 800 : 600,
                  }}
                >
                  {b.linhas.map(textoDaLinha).join(' · ')}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function NovaLinha({
  aoAdicionar,
}: {
  aoAdicionar: (tipo: TipoLinha, quantidade: number) => void
}) {
  const [tipo, setTipo] = useState<TipoLinha>('granny')
  const [qtd, setQtd] = useState(5)
  // mentoria é marcada à mão pela coordenação, então não tem quantidade
  const semQuantidade = tipo === 'mentoria'

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
      <span style={{ flex: 1, minWidth: 120 }}>
        <Select value={tipo} onChange={setTipo} options={TIPOS} ariaLabel="Tipo da alternativa" />
      </span>
      {!semQuantidade && (
        <span style={{ width: 104 }}>
          <Stepper
            value={qtd}
            onChange={setQtd}
            min={1}
            max={tipo === 'frequencia' ? 100 : 99}
            ariaLabel="Quantidade da alternativa"
          />
        </span>
      )}
      <button
        type="button"
        className="pill ghost"
        style={{ padding: '6px 12px', fontSize: 12 }}
        onClick={() => aoAdicionar(tipo, semQuantidade ? 1 : qtd)}
      >
        + Alternativa
      </button>
    </div>
  )
}

/* ---------- Auditoria ---------- */

/* Diário do que mexe em quem leva crédito, ou em quem pode dar crédito. As
   linhas vêm de gatilhos do banco: não há como escrever nelas pela API. */
function Auditoria() {
  const [acao, setAcao] = useState<AcaoAuditoria | 'todas'>('todas')
  const [pessoa, setPessoa] = useState<string>('todas')

  const { data: linhas } = useQuery({ queryKey: ['auditoria'], queryFn: () => fetchAuditoria() })
  const { data: integrantes } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })

  const lista = filtraAuditoria(linhas ?? [], acao, pessoa)

  return (
    <>
      <div className="h" style={{ fontSize: 17, marginBottom: 12 }}>
        Auditoria
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ width: 160 }}>
          <Select
            value={acao}
            onChange={setAcao}
            options={[
              ['todas', 'Todas as ações'],
              ...(Object.entries(ACAO_LABEL) as [AcaoAuditoria, string][]),
            ]}
            ariaLabel="Ação"
          />
        </span>
        <span style={{ width: 200 }}>
          <Select
            value={pessoa}
            onChange={setPessoa}
            options={[
              ['todas', 'Todas as pessoas'],
              ...(integrantes ?? []).map((p) => [p.id, p.nome] as [string, string]),
            ]}
            ariaLabel="Pessoa"
          />
        </span>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {lista.length === 0 && (
          <div style={{ padding: '14px 16px', fontSize: 12.5, color: 'var(--muted)' }}>
            Nada registrado ainda.
          </div>
        )}
        {lista.map((l, i) => (
          <div
            key={l.id}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'baseline',
              padding: '10px 14px',
              fontSize: 12.5,
              flexWrap: 'wrap',
              borderTop: i > 0 ? '1px solid var(--border)' : undefined,
            }}
          >
            <span
              className="tag"
              style={{ background: 'var(--chip-soft)', color: 'var(--primary-dark)' }}
            >
              {ACAO_LABEL[l.acao]}
            </span>
            <b>{l.alvo?.nome ?? '—'}</b>
            <span style={{ flex: 1, minWidth: 140, color: 'var(--ink-soft)' }}>
              {resumoDaLinha(l)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              por {l.autor?.nome ?? 'sistema'} · {fmtDataCurta(l.created_at.slice(0, 10))}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
