import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { Avatar } from '../../components/ui/bits'
import { useToast } from '../../components/ui/Toast'
import { ini, tempoRelativo } from '../../lib/format'
import { comentar, fetchAtividades, fetchComentarios } from './api'

export function Comentarios({ projetoId }: { projetoId: string }) {
  const { profile, can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const [texto, setTexto] = useState('')

  const { data: comentarios } = useQuery({
    queryKey: ['comentarios', projetoId],
    queryFn: () => fetchComentarios(projetoId),
  })

  const enviar = useMutation({
    mutationFn: () => comentar(projetoId, profile!.id, texto.trim()),
    onSuccess: () => {
      setTexto('')
      qc.invalidateQueries({ queryKey: ['comentarios', projetoId] })
    },
    onError: () => toast('Não foi possível enviar o comentário.', 'erro'),
  })

  return (
    <div>
      <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
        Comentários
      </div>
      {(comentarios ?? []).map((c) => (
        <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <Avatar color={c.autor?.avatar_color ?? 'var(--fill)'} size={26} fontSize={10.5}>
            {ini(c.autor?.nome ?? '?')}
          </Avatar>
          <div
            className="card"
            style={{
              borderRadius: '0 12px 12px 12px',
              padding: '10px 13px',
              fontSize: 12.5,
              lineHeight: 1.5,
            }}
          >
            <b>{c.autor?.nome ?? '—'}</b>{' '}
            <span style={{ color: 'var(--faint)', fontSize: 11 }}>
              · {tempoRelativo(c.created_at)}
            </span>
            <br />
            {c.texto}
          </div>
        </div>
      ))}
      {can('comentarios') && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (texto.trim()) enviar.mutate()
          }}
        >
          <input
            className="field"
            style={{ borderRadius: 99 }}
            placeholder="Escrever um comentário…"
            aria-label="Escrever um comentário"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={enviar.isPending}
          />
        </form>
      )}
    </div>
  )
}

export function Historico({ projetoId, titulo = 'Histórico' }: { projetoId: string; titulo?: string }) {
  const { data: atividades } = useQuery({
    queryKey: ['atividades', projetoId],
    queryFn: () => fetchAtividades(projetoId),
  })

  return (
    <div>
      <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
        {titulo}
      </div>
      <div
        style={{
          borderLeft: '1px solid var(--border-strong)',
          paddingLeft: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {(atividades ?? []).length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Nada registrado ainda.</div>
        )}
        {(atividades ?? []).map((a) => (
          <div key={a.id} style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
            <b style={{ color: 'var(--ink)' }}>{a.autor?.nome ?? '—'}</b> {a.payload.texto}
            <div style={{ color: 'var(--faint)', fontSize: 11 }}>
              {a.payload.detalhe ? `${a.payload.detalhe} · ` : ''}
              {tempoRelativo(a.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
