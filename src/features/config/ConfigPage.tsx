import { useState, type CSSProperties } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AvatarPerfil } from '../../components/ui/AvatarPerfil'
import { Campo, useFormulario } from '../../components/ui/Campo'
import { DatePicker } from '../../components/ui/controles'
import { useToast } from '../../components/ui/Toast'
import { useConfirmar } from '../../components/ui/Confirm'
import { hojeIso } from '../../lib/format'
import { ativarSemestre, atualizarSemestre, criarSemestre, fetchSemestres } from '../../lib/semestre'
import { fetchPermissoes, togglePermissao, type PermCol } from './api'
import { IconCadeado } from '../../components/ui/icons'

type Secao = 'permissoes' | 'projeto'

/* O alcance de cada chave cresceu quando as ações que antes não existiam
   ganharam caminho no app — este texto é o que a admin lê para decidir. */
const COLS: [PermCol, string, string][] = [
  [
    'progresso',
    'PROGRESSO',
    'marcar etapa e responsável dos squares, redesenhar a manta, pegar e concluir faixas, mexer nas unidades de amigurumi',
  ],
  ['devolucoes', 'MATERIAIS', 'registrar empréstimo e devolução, cadastrar e repor material'],
  ['presenca', 'PRESENÇA', 'marcar a chamada, agendar encontro e cancelar encontro'],
  ['comentarios', 'MODERAÇÃO', 'apagar comentário de outra integrante'],
  ['financeiro', 'FINANCEIRO', 'lançar entradas e saídas do caixa'],
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

export function ConfigPage() {
  const [secao, setSecao] = useState<Secao>('permissoes')

  return (
    <div className="pagina pgrid" style={{ '--cols': '180px 1fr', '--gap': '34px' } as CSSProperties}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="h titulo-pagina" style={{ marginBottom: 12 }}>
          Ajustes
        </div>
        <button style={item(secao === 'permissoes')} onClick={() => setSecao('permissoes')}>
          Permissões
        </button>
        <button style={item(secao === 'projeto')} onClick={() => setSecao('projeto')}>
          Semestre
        </button>
      </div>

      <div>
        {secao === 'permissoes' && <Permissoes />}
        {secao === 'projeto' && <SecaoProjeto />}
      </div>
    </div>
  )
}

/* ---------- Permissões ---------- */

function Permissoes() {
  const qc = useQueryClient()
  const toast = useToast()
  const {
    data: rows,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['permissoes'], queryFn: fetchPermissoes })

  const toggle = useMutation({
    mutationFn: ({ id, col, value }: { id: string; col: PermCol; value: boolean }) =>
      togglePermissao(id, col, value),
    onError: () => toast('Não foi possível alterar a permissão.', 'erro'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['permissoes'] }),
  })

  return (
    <>
      <div className="h" style={{ fontSize: 18, marginBottom: 4 }}>
        Permissões das integrantes
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--chip-soft)',
          border: '1px solid var(--chip-rose-border)',
          borderRadius: 10,
          padding: '9px 13px',
          fontSize: 12,
          color: 'var(--primary-dark)',
          marginBottom: 16,
        }}
      >
        <IconCadeado />
        Apenas administradoras alteram permissões — o banco recusa qualquer outra escrita.
      </div>

      <div style={{ marginBottom: 20 }}>
        {COLS.map(([col, label, descricao]) => (
          <div key={col} style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>
            <b style={{ color: 'var(--ink-soft)' }}>{label}</b> — {descricao}
          </div>
        ))}
      </div>

      <div className="card" style={{ borderRadius: 14, overflow: 'hidden' }}>
        <div className="lbl linha-perm cabecalho">
          <div>INTEGRANTE</div>
          {COLS.map(([, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              {label}
            </div>
          ))}
        </div>
        {isLoading && (
          <div style={{ padding: 18, fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>
        )}
        {isError && (
          <div style={{ padding: 18, fontSize: 13, color: 'var(--accent)' }}>
            Não foi possível carregar as permissões. Recarregue a página.
          </div>
        )}
        {rows?.length === 0 && (
          <div style={{ padding: 18, fontSize: 13, color: 'var(--muted)' }}>
            Nenhuma integrante cadastrada ainda.
          </div>
        )}
        {rows?.map((p) => {
          const admin = p.papel === 'admin'
          return (
          <div key={p.id} className="linha-perm">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <AvatarPerfil
                nome={p.nome}
                avatarColor={p.avatar_color}
                avatarUrl={p.avatar_url}
                size={28}
                fontSize={10}
              />
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 13 }}>{p.nome}</b>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {admin ? 'administradora — acesso total' : (p.email ?? 'ainda sem conta')}
                </div>
              </div>
            </div>
            {COLS.map(([col, label]) => {
              const value = admin || (p.permissoes?.[col] ?? false)
              return (
                <div key={col} className="cel-perm">
                  <span className="rotulo-perm">{label}</span>
                  <button
                    type="button"
                    className="sw"
                    role="switch"
                    aria-checked={value}
                    aria-label={`${label} de ${p.nome}`}
                    disabled={admin}
                    onClick={() => toggle.mutate({ id: p.id, col, value: !value })}
                    style={{
                      background: value ? 'var(--primary)' : '#E7DCCF',
                      cursor: admin ? 'default' : 'pointer',
                      border: 'none',
                      padding: 0,
                      opacity: admin ? 0.45 : toggle.isPending ? 0.6 : 1,
                      transition: 'background var(--dur-rapida) var(--ease-suave)',
                    }}
                  >
                    <span style={value ? { right: 2 } : { left: 2 }} />
                  </button>
                </div>
              )
            })}
          </div>
          )
        })}
      </div>
    </>
  )
}

/* ---------- Projeto (semestres) ---------- */

function SecaoProjeto() {
  const qc = useQueryClient()
  const toast = useToast()
  const confirmar = useConfirmar()
  const form = useFormulario<'label'>()

  const { data: semestres } = useQuery({ queryKey: ['semestres'], queryFn: fetchSemestres })
  const [label, setLabel] = useState('')
  const [inicio, setInicio] = useState(hojeIso())
  const [fim, setFim] = useState(hojeIso())

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['semestres'] })
    qc.invalidateQueries({ queryKey: ['semestre-ativo'] })
  }

  const criar = useMutation({
    mutationFn: () =>
      criarSemestre({ label: label.trim(), inicio, fim, ativo: (semestres ?? []).length === 0 }),
    onSuccess: () => {
      setLabel('')
      invalidar()
      toast('Semestre criado')
    },
    onError: () => toast('Não foi possível criar — o rótulo já existe?', 'erro'),
  })

  const ativar = useMutation({
    mutationFn: (id: string) => ativarSemestre(id),
    onSuccess: () => {
      invalidar()
      toast('Semestre ativo trocado')
    },
    onError: () => toast('Não foi possível ativar.', 'erro'),
  })

  const mudarDatas = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { inicio?: string; fim?: string } }) =>
      atualizarSemestre(id, patch),
    onSuccess: invalidar,
    onError: () => toast('Não foi possível salvar as datas.', 'erro'),
  })

  return (
    <>
      <div className="h" style={{ fontSize: 18, marginBottom: 4 }}>
        Semestre do projeto
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 18 }}>
        O semestre ativo é o que aparece em Projetos e no Financeiro, e o que os projetos e
        encontros novos recebem.
      </div>

      <div className="card" style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
        {(semestres ?? []).length === 0 && (
          <div style={{ padding: 18, fontSize: 13, color: 'var(--muted)' }}>
            Nenhum semestre cadastrado — crie o primeiro abaixo.
          </div>
        )}
        {(semestres ?? []).map((s) => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '13px 18px',
              borderTop: '1px solid var(--divider)',
              fontSize: 13,
              flexWrap: 'wrap',
            }}
          >
            <b style={{ minWidth: 60 }}>{s.label}</b>
            <span style={{ width: 130 }}>
              <DatePicker
                value={s.inicio ?? hojeIso()}
                ariaLabel={`Início de ${s.label}`}
                onChange={(inicio) => mudarDatas.mutate({ id: s.id, patch: { inicio } })}
              />
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>até</span>
            <span style={{ width: 130 }}>
              <DatePicker
                value={s.fim ?? hojeIso()}
                ariaLabel={`Fim de ${s.label}`}
                onChange={(fim) => mudarDatas.mutate({ id: s.id, patch: { fim } })}
              />
            </span>
            <span style={{ flex: 1 }} />
            {s.ativo ? (
              <span
                className="tag"
                style={{ background: 'var(--chip-green)', color: 'var(--green-dark)' }}
              >
                ATIVO
              </span>
            ) : (
              <button
                className="pill ghost"
                style={{ padding: '6px 14px', fontSize: 12 }}
                onClick={async () => {
                  const ok = await confirmar({
                    titulo: `Tornar ${s.label} o semestre ativo?`,
                    okLabel: 'Ativar',
                  })
                  if (ok) ativar.mutate(s.id)
                }}
              >
                Ativar
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
        Novo semestre
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!form.checar({ label: label.trim() ? undefined : 'Dê um rótulo, como 2026.2.' }))
            return
          criar.mutate()
        }}
        style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}
      >
        <Campo label="RÓTULO" obrigatorio erro={form.erros.label} style={{ width: 130 }}>
          {(p) => (
            <input
              {...p}
              className="field"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value)
                form.aoMudar('label')
              }}
              placeholder="2026.2"
            />
          )}
        </Campo>
        <Campo label="INÍCIO" style={{ width: 140 }}>
          {() => <DatePicker value={inicio} onChange={setInicio} ariaLabel="Início do semestre" />}
        </Campo>
        <Campo label="FIM" style={{ width: 140 }}>
          {() => <DatePicker value={fim} onChange={setFim} ariaLabel="Fim do semestre" />}
        </Campo>
        <button type="submit" className="pill" style={{ marginTop: 24 }} disabled={criar.isPending}>
          {criar.isPending ? 'Criando…' : 'Criar'}
        </button>
      </form>
    </>
  )
}
