import { useState, type CSSProperties, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { AvatarPerfil } from '../../components/ui/AvatarPerfil'
import { Campo, useFormulario } from '../../components/ui/Campo'
import { DatePicker, MenuKebab, Select } from '../../components/ui/controles'
import { useToast } from '../../components/ui/Toast'
import { useConfirmar } from '../../components/ui/Confirm'
import { fmtDataCurta, fmtDataLonga, hojeIso } from '../../lib/format'
import { useSemestreAtivo } from '../../lib/semestre'
import { separaArquivados } from '../../lib/arquivo'
import { TURNO_LABEL } from '../../types/database'
import { entregasDe, fetchEntregasLight, fetchIntegrantes } from '../integrantes/api'
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

type Secao = 'frequencia' | 'entregas' | 'chamadas' | 'arquivos'

const SECOES: [Secao, string][] = [
  ['frequencia', 'Frequência'],
  ['entregas', 'Entregas'],
  ['chamadas', 'Chamadas'],
  ['arquivos', 'Arquivos'],
]

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
  const [secao, setSecao] = useState<Secao>('frequencia')
  const semestre = useSemestreAtivo()

  return (
    <div
      className="pagina pgrid"
      style={{ '--cols': '180px 1fr', '--gap': '34px' } as CSSProperties}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="h titulo-pagina" style={{ marginBottom: 2 }}>
          Atividade de extensão
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          {semestre?.label ?? 'sem semestre ativo'}
        </div>
        {SECOES.map(([k, label]) => (
          <button key={k} style={item(secao === k)} onClick={() => setSecao(k)}>
            {label}
          </button>
        ))}
      </div>

      <div>
        {secao === 'frequencia' && <Frequencia />}
        {secao === 'entregas' && <Entregas />}
        {secao === 'chamadas' && <Chamadas />}
        {secao === 'arquivos' && <Arquivos />}
      </div>
    </div>
  )
}

/* ---------- Frequência ---------- */

function Frequencia() {
  const toast = useToast()
  const hoje = hojeIso()
  const { data: integrantes } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })
  const { data: encontros } = useQuery({ queryKey: ['encontros'], queryFn: fetchEncontros })
  const { data: presencas } = useQuery({ queryKey: ['presencas'], queryFn: fetchPresencas })
  const { data: entregas } = useQuery({ queryKey: ['entregas-light'], queryFn: fetchEntregasLight })

  const { ativos } = separaArquivados(encontros ?? [])
  const linhas = (integrantes ?? []).map((p) => {
    const f = frequenciaDe(p.id, ativos, presencas ?? [], hoje, p.turno)
    return {
      id: p.id,
      nome: p.nome,
      turno: p.turno,
      avatarColor: p.avatar_color,
      avatarUrl: p.avatar_url,
      f,
      entregas: entregas ? entregasDe(p.id, entregas).total : 0,
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

function Entregas() {
  const { data: integrantes } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })
  const { data: entregas } = useQuery({ queryKey: ['entregas-light'], queryFn: fetchEntregasLight })

  const linhas = (integrantes ?? [])
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      ...(entregas
        ? entregasDe(p.id, entregas)
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

function Chamadas() {
  const hoje = hojeIso()
  const [aberto, setAberto] = useState<string | null>(null)
  const { data: encontros } = useQuery({ queryKey: ['encontros'], queryFn: fetchEncontros })
  const { data: presencas } = useQuery({ queryKey: ['presencas'], queryFn: fetchPresencas })
  const { data: integrantes } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })

  const { ativos } = separaArquivados(encontros ?? [])
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

function Arquivos() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const confirmar = useConfirmar()
  const semestre = useSemestreAtivo()
  const form = useFormulario<'titulo' | 'arquivo'>()

  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<TipoArquivo>('foto')
  const [data, setData] = useState(hojeIso())
  const [arquivo, setArquivo] = useState<File | null>(null)

  const { data: arquivos } = useQuery({
    queryKey: ['arquivos-extensao', semestre?.id ?? null],
    queryFn: () => fetchArquivos(semestre?.id ?? null),
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
        semestreId: semestre?.id ?? null,
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
