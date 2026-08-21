import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { AvatarPerfil } from '../../components/ui/AvatarPerfil'
import { useToast } from '../../components/ui/Toast'
import { useConfirmar } from '../../components/ui/Confirm'
import { MenuKebab } from '../../components/ui/controles'
import { tempoRelativo } from '../../lib/format'
import { IconCamera, IconX } from '../../components/ui/icons'
import {
  apagarComentario,
  chaveComentarios,
  comentar,
  editarComentario,
  fetchAtividades,
  fetchComentarios,
  subirFotoComentario,
  urlsDasFotos,
  type AlvoComentario,
} from './api'

/* Comentar deixou de pedir permissão: qualquer integrante logada escreve, aqui
   e na biblioteca. A chave `comentarios` virou moderação — apagar o alheio. */
export function Comentarios(alvo: AlvoComentario) {
  const { profile, can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const confirmar = useConfirmar()
  const inputFoto = useRef<HTMLInputElement>(null)
  const [texto, setTexto] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [editando, setEditando] = useState<string | null>(null)
  const [rascunho, setRascunho] = useState('')

  const chave = chaveComentarios(alvo)
  const { data: comentarios } = useQuery({
    queryKey: chave,
    queryFn: () => fetchComentarios(alvo),
  })

  const caminhos = (comentarios ?? []).filter((c) => c.foto_path).map((c) => c.foto_path!)
  const { data: fotos } = useQuery({
    queryKey: ['fotos-comentarios', caminhos.join(',')],
    queryFn: () => urlsDasFotos(caminhos),
    enabled: caminhos.length > 0,
  })

  const invalidar = () => qc.invalidateQueries({ queryKey: chave })

  const enviar = useMutation({
    mutationFn: async () => {
      // a foto só sobe no envio: cancelar não deixa arquivo órfão no bucket
      const caminho = foto ? await subirFotoComentario(foto) : null
      await comentar(alvo, profile!.id, texto.trim(), caminho)
    },
    onSuccess: () => {
      setTexto('')
      setFoto(null)
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
      toast('Comentário apagado')
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
        // apagar comentário alheio é o que a chave `comentarios` passou a valer
        const modera = can('comentarios')
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
                {(meu || modera) && editando !== c.id && (
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
                <>
                  {c.texto}
                  {c.foto_path && fotos?.get(c.foto_path) && (
                    <a
                      href={fotos.get(c.foto_path)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'block', marginTop: 8 }}
                    >
                      <img
                        src={fotos.get(c.foto_path)}
                        alt="Foto do comentário"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 220,
                          borderRadius: 8,
                          display: 'block',
                        }}
                      />
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (texto.trim() || foto) enviar.mutate()
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="field"
            style={{ borderRadius: 99, flex: 1 }}
            placeholder="Escrever um comentário…"
            aria-label="Escrever um comentário"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={enviar.isPending}
          />
          <input
            ref={inputFoto}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="pill ghost"
            aria-label="Anexar foto ao comentário"
            onClick={() => inputFoto.current?.click()}
            style={{ flex: 'none' }}
          >
            <IconCamera />
          </button>
          {/* antes só dava para enviar com Enter — no celular o botão é o caminho */}
          <button
            type="submit"
            className="pill"
            disabled={(!texto.trim() && !foto) || enviar.isPending}
            style={{ flex: 'none' }}
          >
            Enviar
          </button>
        </div>
        {foto && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 8,
              fontSize: 11.5,
              color: 'var(--muted)',
            }}
          >
            {foto.name}
            <button
              type="button"
              className="kebab"
              aria-label="Tirar a foto do comentário"
              onClick={() => {
                setFoto(null)
                if (inputFoto.current) inputFoto.current.value = ''
              }}
            >
              <IconX size={12} />
            </button>
          </div>
        )}
      </form>
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
