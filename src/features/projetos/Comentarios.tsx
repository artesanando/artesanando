import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { AvatarPerfil } from '../../components/ui/AvatarPerfil'
import { useToast } from '../../components/ui/Toast'
import { useConfirmar } from '../../components/ui/Confirm'
import { MenuKebab } from '../../components/ui/controles'
import { tempoRelativo } from '../../lib/format'
import {
  apagarComentario,
  comentar,
  editarComentario,
  fetchAtividades,
  fetchComentarios,
} from './api'

export function Comentarios({ projetoId }: { projetoId: string }) {
  const { profile, can, isAdmin } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const confirmar = useConfirmar()
  const [texto, setTexto] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [rascunho, setRascunho] = useState('')

  const { data: comentarios } = useQuery({
    queryKey: ['comentarios', projetoId],
    queryFn: () => fetchComentarios(projetoId),
  })

  const invalidar = () => qc.invalidateQueries({ queryKey: ['comentarios', projetoId] })

  const enviar = useMutation({
    mutationFn: () => comentar(projetoId, profile!.id, texto.trim()),
    onSuccess: () => {
      setTexto('')
      invalidar()
    },
    onError: () => toast('Não foi possível enviar o comentário.', 'erro'),
  })

  const editar = useMutation({
    mutationFn: (id: string) => editarComentario(id, rascunho.trim()),
    onSuccess: () => {
      setEditando(null)
      invalidar()
    },
    onError: () => toast('Não foi possível editar o comentário.', 'erro'),
  })

  const apagar = useMutation({
    mutationFn: (id: string) => apagarComentario(id),
    onSuccess: () => {
      invalidar()
      toast('Comentário apagado ✓')
    },
    onError: () => toast('Não foi possível apagar o comentário.', 'erro'),
  })

  return (
    <div>
      <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
        Comentários
      </div>
      {(comentarios ?? []).map((c) => {
        const meu = c.autor_id === profile?.id
        return (
          <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <AvatarPerfil
              nome={c.autor?.nome ?? '?'}
              avatarColor={c.autor?.avatar_color ?? 'var(--fill)'}
              avatarUrl={c.autor?.avatar_url}
              size={26}
              fontSize={10.5}
            />
            <div
              className="card"
              style={{
                borderRadius: '0 12px 12px 12px',
                padding: '10px 13px',
                fontSize: 12.5,
                lineHeight: 1.5,
                flex: 1,
                minWidth: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <b>{c.autor?.nome ?? '—'}</b>
                <span style={{ color: 'var(--faint)', fontSize: 11, flex: 1 }}>
                  · {tempoRelativo(c.created_at)}
                </span>
                {(meu || isAdmin) && editando !== c.id && (
                  <MenuKebab
                    ariaLabel={`Ações do comentário de ${c.autor?.nome ?? 'integrante'}`}
                    acoes={[
                      ...(meu
                        ? [
                            {
                              label: 'Editar',
                              onSelect: () => {
                                setEditando(c.id)
                                setRascunho(c.texto)
                              },
                            },
                          ]
                        : []),
                      {
                        label: 'Apagar',
                        perigo: true,
                        onSelect: async () => {
                          const ok = await confirmar({
                            titulo: 'Apagar este comentário?',
                            descricao: 'Não tem volta.',
                            okLabel: 'Apagar',
                            perigo: true,
                          })
                          if (ok) apagar.mutate(c.id)
                        },
                      },
                    ]}
                  />
                )}
              </div>
              {editando === c.id ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <input
                    className="field"
                    style={{ flex: 1, minWidth: 140 }}
                    value={rascunho}
                    aria-label="Editar comentário"
                    onChange={(e) => setRascunho(e.target.value)}
                  />
                  <button
                    className="pill"
                    style={{ padding: '7px 14px', fontSize: 12 }}
                    disabled={!rascunho.trim() || editar.isPending}
                    onClick={() => editar.mutate(c.id)}
                  >
                    Salvar
                  </button>
                  <button
                    className="pill ghost"
                    style={{ padding: '7px 14px', fontSize: 12 }}
                    onClick={() => setEditando(null)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                c.texto
              )}
            </div>
          </div>
        )
      })}
      {can('comentarios') && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (texto.trim()) enviar.mutate()
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            className="field"
            style={{ borderRadius: 99, flex: 1 }}
            placeholder="Escrever um comentário…"
            aria-label="Escrever um comentário"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={enviar.isPending}
          />
          {/* antes só dava para enviar com Enter — no celular o botão é o caminho */}
          <button
            type="submit"
            className="pill"
            disabled={!texto.trim() || enviar.isPending}
            style={{ flex: 'none' }}
          >
            Enviar
          </button>
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
