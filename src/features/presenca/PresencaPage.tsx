import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import { useAuth } from '../../state/auth'
import { Avatar, Lbl, Progress } from '../../components/ui/bits'
import { useToast } from '../../components/ui/Toast'
import { fmtDataCurta, fmtDataLonga, hojeIso, ini } from '../../lib/format'
import {
  encontrosPassados,
  fetchEncontros,
  fetchIntegrantesAtivas,
  fetchPresencas,
  marcarPresenca,
  mediaPresentes,
  presentesDe,
  proximoEncontro,
} from './api'

export function PresencaPage() {
  const { isAdmin, open } = useStore()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { encontroId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const hoje = hojeIso()

  const { data: encontros, isLoading } = useQuery({
    queryKey: ['encontros'],
    queryFn: fetchEncontros,
  })
  const { data: presencas } = useQuery({ queryKey: ['presencas'], queryFn: fetchPresencas })
  const { data: integrantes } = useQuery({
    queryKey: ['integrantes-chamada'],
    queryFn: fetchIntegrantesAtivas,
  })

  const passados = encontrosPassados(encontros ?? [], hoje)
  const proximo = proximoEncontro(encontros ?? [], hoje)
  const selecionado =
    (encontros ?? []).find((e) => e.id === encontroId) ?? passados[0] ?? proximo

  const marcar = useMutation({
    mutationFn: (opts: { integranteId: string; presente: boolean }) =>
      marcarPresenca({
        encontro_id: selecionado!.id,
        integrante_id: opts.integranteId,
        presente: opts.presente,
        marcado_por: profile!.id,
      }),
    onError: () => toast('Não foi possível marcar a presença.', 'erro'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['presencas'] }),
  })

  const presenteDe = (integranteId: string) =>
    (presencas ?? []).some(
      (p) => p.encontro_id === selecionado?.id && p.integrante_id === integranteId && p.presente,
    )

  const totalIntegrantes = (integrantes ?? []).length
  const presentesSel = selecionado ? presentesDe(presencas ?? [], selecionado.id) : 0

  return (
    <div style={{ padding: '30px 40px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 22,
        }}
      >
        <div>
          <div className="h" style={{ fontWeight: 500, fontSize: 28 }}>
            Presença
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {passados.length} encontros no semestre · média de{' '}
            {mediaPresentes(encontros ?? [], presencas ?? [], hoje)} presentes
          </div>
        </div>
        {isAdmin && (
          <button className="pill" onClick={() => open('encontro')}>
            + Novo encontro
          </button>
        )}
      </div>
      {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>}
      <div className="pgrid" style={{ '--cols': '1fr 1.3fr', '--gap': '40px' } as React.CSSProperties}>
        <div>
          {proximo && (
            <div
              onClick={() => navigate(`/presenca/${proximo.id}`)}
              style={{
                border: '1px solid var(--chip-rose-border)',
                background: 'var(--chip-rose)',
                borderRadius: 14,
                padding: '16px 18px',
                marginBottom: 16,
                cursor: 'pointer',
              }}
            >
              <Lbl style={{ color: 'var(--accent)' }}>PRÓXIMO ENCONTRO</Lbl>
              <div className="h" style={{ fontSize: 20, margin: '6px 0 2px' }}>
                {fmtDataLonga(proximo.data)}
                {proximo.hora ? ` · ${proximo.hora.slice(0, 5)}h` : ''}
              </div>
              <div style={{ fontSize: 12.5, color: '#8E6B70' }}>
                {proximo.local ?? ''}
                {proximo.pauta ? ` · pauta: ${proximo.pauta}` : ''}
              </div>
            </div>
          )}
          <div className="h" style={{ fontSize: 16, marginBottom: 10 }}>
            Encontros anteriores
          </div>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {passados.map((e) => {
              const n = presentesDe(presencas ?? [], e.id)
              const pct = totalIntegrantes === 0 ? 0 : Math.round((n / totalIntegrantes) * 100)
              const ativo = e.id === selecionado?.id
              return (
                <div
                  key={e.id}
                  onClick={() => navigate(`/presenca/${e.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '13px 2px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13.5, width: 74 }}>
                    {fmtDataCurta(e.data)}
                  </div>
                  <Progress
                    pct={`${pct}%`}
                    style={{ flex: 1 }}
                    fillStyle={ativo ? undefined : { background: '#D8A3AE' }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: ativo ? 800 : 700,
                      color: ativo ? 'var(--accent)' : 'var(--muted)',
                      width: 88,
                      textAlign: 'right',
                    }}
                  >
                    {n} presentes
                  </div>
                </div>
              )
            })}
            {passados.length === 0 && !isLoading && (
              <div style={{ padding: '13px 2px', fontSize: 13, color: 'var(--muted)' }}>
                Nenhum encontro registrado ainda.
              </div>
            )}
          </div>
        </div>
        <div>
          {selecionado ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 10,
                }}
              >
                <div className="h" style={{ fontSize: 16 }}>
                  Chamada · {fmtDataCurta(selecionado.data)}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                  {presentesSel}/{totalIntegrantes} presentes
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {(integrantes ?? []).map((p) => {
                  const presente = presenteDe(p.id)
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '11px 2px',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <Avatar color={p.avatar_color} size={26} fontSize={10}>
                        {ini(p.nome)}
                      </Avatar>
                      <div style={{ flex: 1, fontWeight: 700, fontSize: 13.5 }}>{p.nome}</div>
                      <div
                        role={isAdmin ? 'button' : undefined}
                        aria-label={isAdmin ? `Marcar presença de ${p.nome}` : undefined}
                        onClick={
                          isAdmin
                            ? () => marcar.mutate({ integranteId: p.id, presente: !presente })
                            : undefined
                        }
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          cursor: isAdmin ? 'pointer' : 'default',
                          ...(presente
                            ? {
                                background: 'var(--primary)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 800,
                              }
                            : { border: '1.5px dashed var(--field-border)' }),
                        }}
                      >
                        {presente ? '✓' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            !isLoading && (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Crie o primeiro encontro para abrir a chamada.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
