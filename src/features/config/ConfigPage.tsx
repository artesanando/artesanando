import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ini } from '../../lib/format'
import { Avatar } from '../../components/ui/bits'
import { useToast } from '../../components/ui/Toast'
import { fetchPermissoes, togglePermissao, type PermCol } from './api'

const COLS: [PermCol, string][] = [
  ['progresso', 'PROGRESSO'],
  ['devolucoes', 'DEVOLUÇÕES'],
  ['comentarios', 'COMENTÁRIOS'],
  ['financeiro', 'FINANCEIRO'],
]

export function ConfigPage() {
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
    <div
      className="pagina pgrid"
      style={{ '--cols': '180px 1fr', '--gap': '34px' } as React.CSSProperties}
    >
      <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="h" style={{ fontWeight: 500, fontSize: 26, marginBottom: 12 }}>
          Ajustes
        </div>
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            background: 'var(--chip-rose)',
            color: 'var(--accent)',
            fontWeight: 800,
          }}
        >
          Permissões
        </div>
        <div style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 700 }}>Projeto</div>
        <div style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 700 }}>Encontros</div>
      </div>
      <div>
        <div className="h" style={{ fontSize: 18, marginBottom: 4 }}>
          Permissões das integrantes
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 8 }}>
          Defina o que cada integrante pode editar. O perfil de administradora é fixo.
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
            marginBottom: 20,
          }}
        >
          🔒 Apenas administradoras alteram permissões — o banco recusa qualquer outra escrita.
        </div>
        <div className="card" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr repeat(4,1fr)',
              padding: '10px 18px',
              background: 'var(--sand-head)',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '.4px',
              color: 'var(--faint)',
            }}
          >
            <div>INTEGRANTE</div>
            {COLS.map(([, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                {label}
              </div>
            ))}
          </div>
          {isLoading && (
            <div style={{ padding: '18px', fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>
          )}
          {isError && (
            <div style={{ padding: '18px', fontSize: 13, color: 'var(--accent)' }}>
              Não foi possível carregar as permissões. Recarregue a página.
            </div>
          )}
          {rows?.length === 0 && (
            <div style={{ padding: '18px', fontSize: 13, color: 'var(--muted)' }}>
              Nenhuma integrante cadastrada ainda.
            </div>
          )}
          {rows?.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr repeat(4,1fr)',
                padding: '13px 18px',
                borderTop: '1px solid var(--divider)',
                alignItems: 'center',
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar color={p.avatar_color} size={28} fontSize={10}>
                  {ini(p.nome)}
                </Avatar>
                <b>{p.nome}</b>
              </div>
              {COLS.map(([col]) => {
                const value = p.permissoes?.[col] ?? false
                return (
                  <div key={col} style={{ textAlign: 'center' }}>
                    <span
                      className="sw"
                      onClick={() => toggle.mutate({ id: p.id, col, value: !value })}
                      style={{
                        background: value ? 'var(--primary)' : '#E7DCCF',
                        cursor: 'pointer',
                        opacity: toggle.isPending ? 0.6 : 1,
                      }}
                    >
                      <span style={value ? { right: 2 } : { left: 2 }} />
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
