import { useState, type CSSProperties, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { AvatarPerfil } from '../../components/ui/AvatarPerfil'
import { Campo, useFormulario } from '../../components/ui/Campo'
import { DatePicker, MenuKebab, Select } from '../../components/ui/controles'
import { useToast } from '../../components/ui/Toast'
import { useConfirmar, usePedirTexto } from '../../components/ui/Confirm'
import { fmtDataCurta, fmtDataLonga, fmtEntrega, hojeIso } from '../../lib/format'
import { fetchSemestres, useSemestreAtivo } from '../../lib/semestre'
import { NIVEL_LABEL, TURNO_LABEL } from '../../types/database'
import { entregasDe, fetchEntregasLight, fetchIntegrantes } from '../integrantes/api'
import { textoDaLinha } from './creditos'
import { CabecalhoPagina } from '../../components/layout/CabecalhoPagina'
import { AjudaCabecalho } from '../../components/ui/AjudaCabecalho'
import { fetchRas, raOuTraco } from './api'
import { soDoSemestre, useParticipantes } from './useParticipantes'
import { doSemestre, useLinhasDeCredito } from './useCredito'
import { RegrasDoSemestre } from './RegrasSecao'
import { CampoBusca, filtraLinhas } from './CampoBusca'
import { ColunaOrdenavel } from '../../components/ui/CabecalhoOrdenavel'
import { useOrdenacao } from '../../components/ui/useOrdenacao'
import {
  ACAO_LABEL,
  fetchAuditoria,
  filtraAuditoria,
  marcarCredito,
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

type Secao =
  'regras' | 'creditos' | 'frequencia' | 'entregas' | 'chamadas' | 'arquivos' | 'auditoria'

/* A regra vem antes de quem cumpriu: é ela que define o resto da página, e é a
   primeira coisa a montar quando o semestre começa. */
const SECOES: [Secao, string][] = [
  ['regras', 'Regras'],
  ['creditos', 'Créditos'],
  ['frequencia', 'Frequência'],
  ['entregas', 'Entregas'],
  ['chamadas', 'Chamadas'],
  ['arquivos', 'Arquivos'],
  ['auditoria', 'Auditoria'],
]

/* O que entra em cada coluna. O total não é a soma dos dois turnos, e entrega
   virou número quebrado quando o square passou a contar por metade — as duas
   coisas confundiram quem lê o relatório. */
async function copiarTabela(
  colunas: string[],
  linhas: (string | number)[][],
  toast: (t: string) => void,
) {
  await navigator.clipboard?.writeText(linhasDoRelatorio(colunas, linhas))
  toast('Tabela copiada')
}

const AJUDA_TOTAL =
  'Não é a soma de diurno e noturno: conta só os encontros do turno dela, então quem é só do noturno não leva falta por encontro diurno.'
const AJUDA_ENTREGAS =
  'Cada amigurumi concluído e cada faixa feita valem 1. No granny square, o miolo vale 0,5 e a borda 0,5.'
type Situacao = 'todas' | 'cumpriu' | 'andamento'

const SITUACOES: [Situacao, string][] = [
  ['todas', 'Todas'],
  ['cumpriu', 'Cumpriram'],
  ['andamento', 'Em andamento'],
]

const AJUDA_SQUARES = 'O square costuma ser dividido: o miolo vale 0,5 e a borda vale 0,5.'
const AJUDA_FEIRA =
  'Peças que ela fez e foram para a feira, na caixa ou já vendidas. Item de feira arquivado sai da conta.'

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
  const [secao, setSecao] = useState<Secao>('regras')
  const ativo = useSemestreAtivo()
  const { data: semestres } = useQuery({ queryKey: ['semestres'], queryFn: fetchSemestres })

  /* Lente de leitura, não troca de semestre ativo: dá para conferir o semestre
     passado sem mexer no que Projetos e Financeiro estão mostrando. */
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const semestreId = escolhido ?? ativo?.id ?? null

  return (
    <div className="pagina">
      <CabecalhoPagina
        titulo="Atividade de extensão"
        sub="Créditos, frequência, entregas e comprovação do semestre"
        acoes={
          (semestres ?? []).length > 0 ? (
            <span style={{ width: 150 }}>
              <Select
                value={semestreId ?? ''}
                onChange={setEscolhido}
                options={(semestres ?? []).map((s) => [s.id, s.label] as [string, string])}
                ariaLabel="Semestre"
              />
            </span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>sem semestre ativo</span>
          )
        }
      />
      <div className="pgrid" style={{ '--cols': '180px 1fr', '--gap': '34px' } as CSSProperties}>
        {/* sete botões empilhados ocupavam quase uma tela antes do conteúdo no
          celular; lá o menu vira uma faixa que rola de lado */}
        <div className="menu-extensao">
          {SECOES.map(([k, label]) => (
            <button key={k} style={item(secao === k)} onClick={() => setSecao(k)}>
              {label}
            </button>
          ))}
        </div>

        <div>
          {secao === 'creditos' && <Creditos semestreId={semestreId} />}
          {secao === 'regras' && <RegrasDoSemestre semestreId={semestreId} />}
          {secao === 'frequencia' && <Frequencia semestreId={semestreId} />}
          {secao === 'entregas' && <Entregas semestreId={semestreId} />}
          {secao === 'chamadas' && <Chamadas semestreId={semestreId} />}
          {secao === 'arquivos' && <Arquivos semestreId={semestreId} />}
          {secao === 'auditoria' && <Auditoria semestreId={semestreId} />}
        </div>
      </div>
    </div>
  )
}

/* ---------- Frequência ---------- */

function Frequencia({ semestreId }: { semestreId: string | null }) {
  const toast = useToast()
  const [busca, setBusca] = useState('')
  const ord = useOrdenacao<'nome' | 'diurno' | 'noturno' | 'total' | 'entregas'>('nome')
  const participantes = useParticipantes(semestreId)
  const hoje = hojeIso()
  const { data: integrantes } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })
  const { data: encontros } = useQuery({ queryKey: ['encontros'], queryFn: fetchEncontros })
  const { data: presencas } = useQuery({ queryKey: ['presencas'], queryFn: fetchPresencas })
  const { data: entregas } = useQuery({ queryKey: ['entregas-light'], queryFn: fetchEntregasLight })
  const { data: ras } = useQuery({ queryKey: ['ras'], queryFn: fetchRas })

  const ativos = doSemestre(encontros ?? [], semestreId)
  const linhas = soDoSemestre(integrantes ?? [], participantes, semestreId).map((p) => {
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

  const visiveis = ord.ordenar(filtraLinhas(linhas, busca), (l, k) =>
    k === 'nome'
      ? l.nome
      : k === 'entregas'
        ? l.entregas
        : k === 'total'
          ? l.f.total.pct
          : l.f[k].pct,
  )

  /* Copiava `linhas`: quem buscava um nome e clicava levava a tabela inteira. */
  const copiar = async () => {
    await copiarTabela(
      ['Integrante', 'Diurno', 'Noturno', 'Total', 'Entregas'],
      visiveis.map((l) => [
        l.nome,
        `${l.f.diurno.pct}%`,
        `${l.f.noturno.pct}%`,
        `${l.f.total.pct}%`,
        l.entregas,
      ]),
      toast,
    )
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

      <CampoBusca valor={busca} aoMudar={setBusca} />

      <div className="card" style={{ borderRadius: 14, overflow: 'hidden' }}>
        <div className="lbl linha-extensao cabecalho" role="row">
          <ColunaOrdenavel
            rotulo="INTEGRANTE"
            ativa={ord.coluna === 'nome'}
            direcao={ord.direcao}
            aoClicar={() => ord.alternar('nome')}
          />
          <ColunaOrdenavel
            rotulo="DIURNO"
            centro
            ativa={ord.coluna === 'diurno'}
            direcao={ord.direcao}
            aoClicar={() => ord.alternar('diurno', 'desc')}
          />
          <ColunaOrdenavel
            rotulo="NOTURNO"
            centro
            ativa={ord.coluna === 'noturno'}
            direcao={ord.direcao}
            aoClicar={() => ord.alternar('noturno', 'desc')}
          />
          <ColunaOrdenavel
            rotulo="TOTAL"
            centro
            ativa={ord.coluna === 'total'}
            direcao={ord.direcao}
            aoClicar={() => ord.alternar('total', 'desc')}
            extra={<AjudaCabecalho texto={AJUDA_TOTAL} />}
          />
          <ColunaOrdenavel
            rotulo="ENTREGAS"
            centro
            ativa={ord.coluna === 'entregas'}
            direcao={ord.direcao}
            aoClicar={() => ord.alternar('entregas', 'desc')}
            extra={<AjudaCabecalho texto={AJUDA_ENTREGAS} />}
          />
        </div>
        {visiveis.length === 0 && (
          <div style={{ padding: 18, fontSize: 13, color: 'var(--muted)' }}>
            {busca ? 'Ninguém com esse nome.' : 'Nenhuma integrante neste semestre ainda.'}
          </div>
        )}
        {visiveis.map((l) => (
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
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {raOuTraco(ras, l.id)} · {TURNO_LABEL[l.turno]}
                </div>
              </div>
            </div>
            {/* os três em %, com a fração no title de quem quiser conferir */}
            <Celula
              rotulo="DIURNO"
              valor={`${l.f.diurno.pct}%`}
              titulo={`${l.f.diurno.presentes} de ${l.f.diurno.total} encontros diurnos`}
            />
            <Celula
              rotulo="NOTURNO"
              valor={`${l.f.noturno.pct}%`}
              titulo={`${l.f.noturno.presentes} de ${l.f.noturno.total} encontros noturnos`}
            />
            <Celula
              rotulo="TOTAL"
              valor={`${l.f.total.pct}%`}
              titulo={`${l.f.total.presentes} de ${l.f.total.total} encontros`}
              destaque
            />
            <Celula rotulo="ENTREGAS" valor={fmtEntrega(l.entregas)} />
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
  titulo,
}: {
  rotulo: string
  valor: string
  destaque?: boolean
  titulo?: string
}) {
  return (
    <div className="cel-extensao" title={titulo}>
      <span className="rotulo-extensao">{rotulo}</span>
      <b style={{ fontSize: 13, color: destaque ? 'var(--accent)' : 'var(--ink-soft)' }}>{valor}</b>
    </div>
  )
}

/* ---------- Entregas ---------- */

function Entregas({ semestreId }: { semestreId: string | null }) {
  const toast = useToast()
  const [busca, setBusca] = useState('')
  const ord = useOrdenacao<'nome' | 'amigurumis' | 'faixas' | 'grannies' | 'feira' | 'total'>(
    'total',
    'desc',
  )
  const participantes = useParticipantes(semestreId)
  const { data: integrantes } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })
  const { data: entregas } = useQuery({ queryKey: ['entregas-light'], queryFn: fetchEntregasLight })
  const { data: ras } = useQuery({ queryKey: ['ras'], queryFn: fetchRas })

  const linhas = soDoSemestre(integrantes ?? [], participantes, semestreId).map((p) => ({
    id: p.id,
    nome: p.nome,
    ...(entregas
      ? entregasDe(p.id, entregas, semestreId)
      : { amigurumis: 0, faixas: 0, grannies: 0, feira: 0, total: 0 }),
  }))

  const visiveis = ord.ordenar(filtraLinhas(linhas, busca), (l, k) =>
    k === 'nome' ? l.nome : l[k],
  )
  const soma = linhas.reduce((s, l) => s + l.total, 0)

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
        <div>
          <div className="h" style={{ fontSize: 18, marginBottom: 4 }}>
            Entregas do semestre
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            {fmtEntrega(soma)} peças entregues no total
          </div>
        </div>
        <button
          className="pill ghost"
          onClick={() =>
            copiarTabela(
              ['Integrante', 'Amigurumis', 'Faixas', 'Squares', 'Feira', 'Total'],
              visiveis.map((l) => [l.nome, l.amigurumis, l.faixas, l.grannies, l.feira, l.total]),
              toast,
            )
          }
        >
          Copiar tabela
        </button>
      </div>

      <CampoBusca valor={busca} aoMudar={setBusca} />

      <div
        className="card"
        /* cinco colunas de valor agora, não quatro */
        style={{ borderRadius: 14, overflow: 'hidden', '--n-col': 5 } as CSSProperties}
      >
        <div className="lbl linha-extensao cabecalho" role="row">
          <ColunaOrdenavel
            rotulo="INTEGRANTE"
            ativa={ord.coluna === 'nome'}
            direcao={ord.direcao}
            aoClicar={() => ord.alternar('nome')}
          />
          {(
            [
              ['amigurumis', 'AMIGURUMIS'],
              ['faixas', 'FAIXAS'],
              ['grannies', 'SQUARES'],
              ['feira', 'FEIRA'],
              ['total', 'TOTAL'],
            ] as const
          ).map(([k, rotulo]) => (
            <ColunaOrdenavel
              key={k}
              rotulo={rotulo}
              centro
              ativa={ord.coluna === k}
              direcao={ord.direcao}
              aoClicar={() => ord.alternar(k, 'desc')}
              extra={
                k === 'grannies' ? (
                  <AjudaCabecalho texto={AJUDA_SQUARES} />
                ) : k === 'feira' ? (
                  <AjudaCabecalho texto={AJUDA_FEIRA} />
                ) : undefined
              }
            />
          ))}
        </div>
        {visiveis.length === 0 && (
          <div style={{ padding: 18, fontSize: 13, color: 'var(--muted)' }}>
            {busca ? 'Ninguém com esse nome.' : 'Nenhuma integrante neste semestre ainda.'}
          </div>
        )}
        {visiveis.map((l) => (
          <div key={l.id} className="linha-extensao">
            <div style={{ minWidth: 0 }}>
              <b style={{ fontSize: 13 }}>{l.nome}</b>
              <div style={{ fontSize: 11, color: 'var(--faint)' }}>{raOuTraco(ras, l.id)}</div>
            </div>
            <Celula rotulo="AMIGURUMIS" valor={String(l.amigurumis)} />
            <Celula rotulo="FAIXAS" valor={String(l.faixas)} />
            <Celula rotulo="SQUARES" valor={fmtEntrega(l.grannies)} />
            <Celula rotulo="FEIRA" valor={String(l.feira)} />
            <Celula rotulo="TOTAL" valor={fmtEntrega(l.total)} destaque />
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
  const { data: ras } = useQuery({ queryKey: ['ras'], queryFn: fetchRas })

  const ativos = doSemestre(encontros ?? [], semestreId)
  const lista = encontrosPassados(ativos, hoje)
  const nomePor = new Map((integrantes ?? []).map((p) => [p.id, p.nome]))

  /* O RA vem entre parênteses: a lista já usa ' · ' para separar as pessoas, e
     um segundo separador ali viraria uma fila de números soltos. */
  const presentesDoDia = (encontroId: string) =>
    (presencas ?? [])
      .filter((p) => p.encontro_id === encontroId && p.presente)
      .map((p) => `${nomePor.get(p.integrante_id) ?? '—'} (${raOuTraco(ras, p.integrante_id)})`)
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
      toast('Arquivo enviado')
    },
    onError: () => toast('Não foi possível enviar o arquivo.', 'erro'),
  })

  const remover = useMutation({
    mutationFn: (a: ArquivoExtensao) => removerArquivo(a),
    onSuccess: () => {
      invalidar()
      toast('Arquivo removido')
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

/* Quem cumpriu a regra do semestre. A regra em si tem seção própria — ver
   `RegrasSecao.tsx`; aqui só se lê o resultado dela. */
function Creditos({ semestreId }: { semestreId: string | null }) {
  const { profile } = useAuth()
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState<Situacao>('todas')
  const [ordem, setOrdem] = useState<'nome' | 'situacao'>('nome')
  const qc = useQueryClient()
  const toast = useToast()
  const perguntar = usePedirTexto()

  const { data: ras } = useQuery({ queryKey: ['ras'], queryFn: fetchRas })
  const { data: nomes } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })
  const linhas = useLinhasDeCredito(semestreId)

  const marcar = useMutation({
    mutationFn: (m: {
      perfilId: string
      mentoria: boolean
      cumprido: boolean
      motivo: string | null
    }) => marcarCredito({ ...m, semestreId: semestreId!, por: profile!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credito-marcas', semestreId] })
      toast('Marca registrada')
    },
    onError: () => toast('Não foi possível marcar.', 'erro'),
  })

  if (!semestreId) {
    return <div style={{ fontSize: 13, color: 'var(--muted)' }}>Crie um semestre em Ajustes.</div>
  }

  const cumpriram = linhas.filter((l) => l.av.cumpriu).length

  /* Ordenar por situação junta em cima quem ainda não fechou — que é a
     pergunta de quem está prestando contas do semestre. */
  const visiveis = filtraLinhas(
    linhas.map((l) => ({ ...l, nome: l.p.nome })),
    busca,
  )
    .filter((l) => situacao === 'todas' || (situacao === 'cumpriu') === l.av.cumpriu)
    .sort((a, b) =>
      ordem === 'nome'
        ? a.nome.localeCompare(b.nome)
        : Number(a.av.cumpriu) - Number(b.av.cumpriu) || a.nome.localeCompare(b.nome),
    )

  /* Dar o crédito à mão sem dizer por quê deixava a auditoria com uma linha que
     não explicava nada — a frase genérica de antes só repetia o rótulo. */
  const darComoCumprida = async (nome: string, perfilId: string, mentoria: boolean) => {
    const motivo = await perguntar({
      titulo: `Dar ${nome} como cumprida?`,
      descricao: 'Fica registrado na auditoria com o seu nome e a data.',
      campo: {
        rotulo: 'POR QUÊ?',
        placeholder: 'entregou fora do prazo, mas entregou',
        obrigatorio: true,
      },
      okLabel: 'Dar como cumprida',
    })
    if (motivo) marcar.mutate({ perfilId, mentoria, cumprido: true, motivo })
  }

  return (
    <>
      <div className="h" style={{ fontSize: 17, marginBottom: 4 }}>
        Quem cumpriu
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14 }}>
        {linhas.length === 0
          ? 'Nenhuma integrante neste semestre ainda.'
          : `${cumpriram} de ${linhas.length} ${
              linhas.length === 1 ? 'integrante cumpriu' : 'integrantes cumpriram'
            } a regra do semestre.`}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <span style={{ flex: 1, minWidth: 200 }}>
          <CampoBusca valor={busca} aoMudar={setBusca} />
        </span>
        <span style={{ width: 168 }}>
          <Select
            value={situacao}
            onChange={setSituacao}
            options={SITUACOES}
            ariaLabel="Situação"
          />
        </span>
        <span style={{ width: 156 }}>
          <Select
            value={ordem}
            onChange={setOrdem}
            options={[
              ['nome', 'Ordem: nome'],
              ['situacao', 'Ordem: situação'],
            ]}
            ariaLabel="Ordenar por"
          />
        </span>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {visiveis.length === 0 && (
          <div style={{ padding: 18, fontSize: 13, color: 'var(--muted)' }}>
            {linhas.length === 0
              ? 'Nenhuma integrante neste semestre ainda.'
              : 'Ninguém nesta situação.'}
          </div>
        )}
        {visiveis.map(({ p, marca, av }, i) => (
          <div
            key={p.id}
            className="linha-credito"
            style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <AvatarPerfil
                nome={p.nome}
                avatarColor={p.avatar_color}
                avatarUrl={p.avatar_url}
                size={26}
                fontSize={10}
              />
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 13 }}>{p.nome}</b>
                <div style={{ fontSize: 11, color: 'var(--faint)' }}>
                  {raOuTraco(ras, p.id)} · {NIVEL_LABEL[p.nivel]}
                </div>
              </div>
            </div>

            <div className="situacao-credito">
              <span
                className="tag"
                style={
                  av.cumpriu
                    ? { background: 'var(--chip-green)', color: 'var(--green-dark)' }
                    : { background: 'var(--chip-warn)', color: 'var(--gold-dark)' }
                }
              >
                {av.cumpriu ? (av.manual ? 'CUMPRIU · MANUAL' : 'CUMPRIU') : 'EM ANDAMENTO'}
              </span>
              <MenuKebab
                ariaLabel={`Marcas de ${p.nome}`}
                acoes={[
                  {
                    label: marca?.mentoria ? 'Remover mentoria' : 'Adicionar mentoria',
                    onSelect: () =>
                      marcar.mutate({
                        perfilId: p.id,
                        mentoria: !marca?.mentoria,
                        cumprido: marca?.cumprido ?? false,
                        motivo: marca?.motivo ?? null,
                      }),
                  },
                  marca?.cumprido
                    ? {
                        label: 'Desfazer o cumprido',
                        onSelect: () =>
                          marcar.mutate({
                            perfilId: p.id,
                            mentoria: marca?.mentoria ?? false,
                            cumprido: false,
                            motivo: null,
                          }),
                      }
                    : {
                        label: 'Dar como cumprida',
                        onSelect: () => darComoCumprida(p.nome, p.id, marca?.mentoria ?? false),
                      },
                ]}
              />
            </div>

            {/* o porquê estava só na auditoria: na linha, "MANUAL" não explicava nada */}
            {av.manual && marca && (
              <div className="detalhe-credito" style={{ color: 'var(--gold-dark)' }}>
                {marca.motivo ?? 'sem motivo registrado'} — por{' '}
                {nomes?.find((n) => n.id === marca.marcado_por)?.nome ?? 'coordenação'} em{' '}
                {fmtDataCurta(marca.marcado_em.slice(0, 10))}
              </div>
            )}

            {/* uma exigência por linha: lado a lado, ninguém via onde uma terminava */}
            <div className="detalhe-credito">
              {av.blocos.length === 0 ? (
                <span style={{ color: 'var(--muted)' }}>
                  Sem regra para {NIVEL_LABEL[p.nivel].toLowerCase()} neste semestre.
                </span>
              ) : (
                av.blocos.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      color: b.cumpriu ? 'var(--green-dark)' : 'var(--muted)',
                      fontWeight: b.cumpriu ? 800 : 600,
                    }}
                  >
                    <span aria-hidden style={{ marginRight: 5 }}>
                      {b.cumpriu ? '✓' : '·'}
                    </span>
                    {b.linhas.map((l, k) => (
                      <span key={l.tipo + k}>
                        {k > 0 && <span style={{ fontWeight: 600 }}> ou </span>}
                        {textoDaLinha(l)}
                      </span>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------- Auditoria ---------- */

/* Diário do que mexe em quem leva crédito, ou em quem pode dar crédito. As
   linhas vêm de gatilhos do banco: não há como escrever nelas pela API. */
function Auditoria({ semestreId }: { semestreId: string | null }) {
  const [acao, setAcao] = useState<AcaoAuditoria | 'todas'>('todas')
  const [pessoa, setPessoa] = useState<string>('todas')

  const { data: semestres } = useQuery({ queryKey: ['semestres'], queryFn: fetchSemestres })
  const sem = (semestres ?? []).find((s) => s.id === semestreId)

  const { data: linhas } = useQuery({
    queryKey: ['auditoria', semestreId],
    queryFn: () => fetchAuditoria(sem ? { inicio: sem.inicio, fim: sem.fim } : undefined),
  })
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
            Nada registrado {sem ? `em ${sem.label}` : 'ainda'}.
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
