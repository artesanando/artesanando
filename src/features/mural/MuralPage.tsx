import { useRef, useState, type CSSProperties, type DragEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { CabecalhoPagina } from '../../components/layout/CabecalhoPagina'
import { MenuKebab } from '../../components/ui/controles'
import { useConfirmar } from '../../components/ui/Confirm'
import { useToast } from '../../components/ui/Toast'
import { fmtDataCurta, fmtDataLonga } from '../../lib/format'
import {
  apagarAlbum,
  apagarFoto,
  contaPorAlbum,
  criarAlbum,
  fetchAlbuns,
  fetchFotos,
  fotosDoAlbum,
  moverFoto,
  porDia,
  renomearAlbum,
  soltas,
  subirFotos,
  urlsDasFotos,
  type Foto,
} from './api'

const POR_PAGINA = 24

/* Mural do grupo: as fotos dos encontros, da mais nova para a mais antiga.
   Separado dos arquivos da extensão, que são comprovação e só admin lê. */
export function MuralPage() {
  const { profile, isAdmin } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const confirmar = useConfirmar()
  const inputArquivo = useRef<HTMLInputElement>(null)

  const [album, setAlbum] = useState<string | null>(null)
  const [quantas, setQuantas] = useState(POR_PAGINA)
  const [sobreALista, setSobreALista] = useState(false)
  const [aberta, setAberta] = useState<Foto | null>(null)
  const [arrastada, setArrastada] = useState<string | null>(null)
  /* `'novo'` é a criação; um id é o álbum sendo renomeado. O window.prompt que
     estava aqui é janela do sistema, que o app trocou por controle próprio. */
  const [editando, setEditando] = useState<string | null>(null)

  const { data: albuns } = useQuery({ queryKey: ['mural-albuns'], queryFn: fetchAlbuns })
  const { data: fotos, isLoading } = useQuery({ queryKey: ['mural-fotos'], queryFn: fetchFotos })

  const todas = fotos ?? []
  const daVez = fotosDoAlbum(todas, album)
  const visiveis = daVez.slice(0, quantas)

  const { data: urls } = useQuery({
    queryKey: ['mural-urls', visiveis.map((f) => f.path).join(',')],
    queryFn: () => urlsDasFotos(visiveis.map((f) => f.path)),
    enabled: visiveis.length > 0,
  })

  const contagem = contaPorAlbum(todas)
  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['mural-fotos'] })
    qc.invalidateQueries({ queryKey: ['mural-albuns'] })
  }

  const subir = useMutation({
    mutationFn: (arquivos: File[]) => subirFotos(arquivos, profile!.id, album),
    onSuccess: (n) => {
      invalidar()
      toast(n === 1 ? 'Foto no mural' : `${n} fotos no mural`)
    },
    onError: () => toast('Não foi possível subir as fotos.', 'erro'),
  })

  const mover = useMutation({
    mutationFn: ({ id, para }: { id: string; para: string | null }) => moverFoto(id, para),
    onSuccess: invalidar,
    onError: () => toast('Não foi possível mover a foto.', 'erro'),
  })

  const remover = useMutation({
    mutationFn: (f: Foto) => apagarFoto(f),
    onSuccess: () => {
      setAberta(null)
      invalidar()
      toast('Foto apagada')
    },
    onError: () => toast('Não foi possível apagar a foto.', 'erro'),
  })

  const albumMut = useMutation({
    mutationFn: (acao: () => Promise<void>) => acao(),
    onSuccess: invalidar,
    onError: () => toast('Não foi possível salvar o álbum.', 'erro'),
  })

  const escolher = (lista: FileList | null) => {
    const arquivos = [...(lista ?? [])].filter((f) => f.type.startsWith('image/'))
    if (arquivos.length > 0) subir.mutate(arquivos)
  }

  const salvarNome = (alvo: string, nome: string) => {
    setEditando(null)
    if (!nome.trim()) return
    albumMut.mutate(() =>
      alvo === 'novo' ? criarAlbum(nome, profile!.id) : renomearAlbum(alvo, nome),
    )
  }

  const excluirAlbum = async (id: string, nome: string) => {
    const ok = await confirmar({
      titulo: `Apagar o álbum "${nome}"?`,
      descricao: 'As fotos dele continuam no mural, fora de álbum.',
      okLabel: 'Apagar álbum',
      perigo: true,
    })
    if (ok) {
      if (album === id) setAlbum(null)
      albumMut.mutate(() => apagarAlbum(id))
    }
  }

  const soltarNoAlbum = (e: DragEvent, destino: string | null) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/foto') || arrastada
    setArrastada(null)
    if (id) mover.mutate({ id, para: destino })
  }

  return (
    <div className="pagina">
      <CabecalhoPagina
        titulo="Mural"
        sub={`${todas.length} fotos${soltas(todas) > 0 ? ` · ${soltas(todas)} fora de álbum` : ''}`}
      />
      <input
        ref={inputArquivo}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          escolher(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="pgrid" style={{ '--cols': '1fr 220px', '--gap': '32px' } as CSSProperties}>
        <div>
          {/* a caixa é o botão: arrastar do computador ou clicar para escolher —
              um botão à parte fazia a mesma coisa duas vezes */}
          <button
            type="button"
            onClick={() => inputArquivo.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setSobreALista(true)
            }}
            onDragLeave={() => setSobreALista(false)}
            onDrop={(e) => {
              e.preventDefault()
              setSobreALista(false)
              escolher(e.dataTransfer.files)
            }}
            style={{
              width: '100%',
              border: `1.5px dashed ${sobreALista ? 'var(--primary)' : 'var(--field-border)'}`,
              background: sobreALista ? 'var(--chip-rose)' : 'transparent',
              borderRadius: 12,
              padding: '16px',
              marginBottom: 18,
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 700,
              color: 'var(--muted)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'background var(--dur-rapida) var(--ease-suave)',
            }}
          >
            Arraste fotos aqui ou clique para escolher
            {album ? ' — elas entram neste álbum' : ''}
          </button>

          {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>}
          {!isLoading && daVez.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {album ? 'Este álbum ainda está vazio.' : 'Nenhuma foto no mural ainda.'}
            </div>
          )}

          {porDia(visiveis).map((bloco) => (
          <div key={bloco.dia} style={{ marginBottom: 22 }}>
          <div
            className="lbl"
            style={{ color: 'var(--faint)', fontSize: 10.5, marginBottom: 7 }}
          >
            {fmtDataLonga(bloco.dia)}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 10,
            }}
          >
            {bloco.fotos.map((f) => {
              const url = urls?.get(f.path)
              const minha = f.autor_id === profile?.id
              return (
                <div
                  key={f.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/foto', f.id)
                    setArrastada(f.id)
                  }}
                  onDragEnd={() => setArrastada(null)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: 'var(--sand)',
                    opacity: arrastada === f.id ? 0.45 : 1,
                    cursor: 'grab',
                  }}
                >
                  <button
                    type="button"
                    aria-label={`Abrir a foto de ${f.autor?.nome ?? 'integrante'}`}
                    onClick={() => setAberta(f)}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      padding: 0,
                      background: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {url && (
                      <img
                        src={url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    )}
                  </button>
                  {(minha || isAdmin) && (
                    <span style={{ position: 'absolute', top: 4, right: 4 }}>
                      <MenuKebab
                        ariaLabel={`Ações da foto de ${f.autor?.nome ?? 'integrante'}`}
                        acoes={[
                          ...(albuns ?? []).map((a) => ({
                            label: `Mover para ${a.nome}`,
                            onSelect: () => mover.mutate({ id: f.id, para: a.id }),
                          })),
                          ...(f.album_id
                            ? [
                                {
                                  label: 'Tirar do álbum',
                                  onSelect: () => mover.mutate({ id: f.id, para: null }),
                                },
                              ]
                            : []),
                          {
                            label: 'Apagar',
                            perigo: true,
                            onSelect: async () => {
                              const ok = await confirmar({
                                titulo: 'Apagar esta foto?',
                                okLabel: 'Apagar',
                                perigo: true,
                              })
                              if (ok) remover.mutate(f)
                            },
                          },
                        ]}
                      />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          </div>
          ))}

          {daVez.length > visiveis.length && (
            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <button className="pill ghost" onClick={() => setQuantas((q) => q + POR_PAGINA)}>
                Carregar mais {daVez.length - visiveis.length}
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="lbl" style={{ marginBottom: 8 }}>
            ÁLBUNS
          </div>
          {/* soltar uma foto sobre o álbum move ela para lá */}
          <BotaoAlbum
            rotulo="Tudo"
            contagem={todas.length}
            ativo={album === null}
            aoClicar={() => {
              setAlbum(null)
              setQuantas(POR_PAGINA)
            }}
            aoSoltar={(e) => soltarNoAlbum(e, null)}
          />
          {(albuns ?? []).map((a) => (
            <BotaoAlbum
              key={a.id}
              rotulo={a.nome}
              contagem={contagem.get(a.id) ?? 0}
              ativo={album === a.id}
              aoClicar={() => {
                setAlbum(a.id)
                setQuantas(POR_PAGINA)
              }}
              aoSoltar={(e) => soltarNoAlbum(e, a.id)}
              editando={editando === a.id}
              aoSalvarNome={(nome) => salvarNome(a.id, nome)}
              aoDesistir={() => setEditando(null)}
              acoes={[
                { label: 'Renomear', onSelect: () => setEditando(a.id) },
                {
                  label: 'Apagar álbum',
                  perigo: true,
                  onSelect: () => excluirAlbum(a.id, a.nome),
                },
              ]}
            />
          ))}
          {editando === 'novo' ? (
            <CampoNome
              inicial=""
              aoSalvar={(nome) => salvarNome('novo', nome)}
              aoDesistir={() => setEditando(null)}
            />
          ) : (
            <button
              className="pill ghost"
              style={{ marginTop: 8, padding: '6px 14px', fontSize: 12 }}
              onClick={() => setEditando('novo')}
            >
              + Novo álbum
            </button>
          )}
        </div>
      </div>

      {aberta && (
        <div className="ov" onClick={() => setAberta(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh', textAlign: 'center' }}
          >
            {urls?.get(aberta.path) && (
              <img
                src={urls.get(aberta.path)}
                alt=""
                style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12, display: 'block' }}
              />
            )}
            <div style={{ color: '#fff', fontSize: 12.5, marginTop: 10 }}>
              {aberta.autor?.nome ?? 'integrante'} · {fmtDataCurta(aberta.created_at.slice(0, 10))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* Nome do álbum: confirma no Enter, desiste no Esc — e some assim que perde o
   foco, para não ficar um campo aberto na lateral sem ninguém digitando. */
function CampoNome({
  inicial,
  aoSalvar,
  aoDesistir,
}: {
  inicial: string
  aoSalvar: (nome: string) => void
  aoDesistir: () => void
}) {
  const [nome, setNome] = useState(inicial)
  return (
    <input
      className="field"
      autoFocus
      value={nome}
      aria-label="Nome do álbum"
      placeholder="Nome do álbum"
      maxLength={60}
      onChange={(e) => setNome(e.target.value)}
      onBlur={() => (nome.trim() && nome !== inicial ? aoSalvar(nome) : aoDesistir())}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          aoSalvar(nome)
        }
        if (e.key === 'Escape') aoDesistir()
      }}
      style={{ marginTop: 8, fontSize: 13, padding: '8px 10px' }}
    />
  )
}

function BotaoAlbum({
  rotulo,
  contagem,
  ativo,
  aoClicar,
  aoSoltar,
  acoes,
  editando,
  aoSalvarNome,
  aoDesistir,
}: {
  rotulo: string
  contagem: number
  ativo: boolean
  aoClicar: () => void
  aoSoltar: (e: DragEvent) => void
  acoes?: { label: string; perigo?: boolean; onSelect: () => void }[]
  editando?: boolean
  aoSalvarNome?: (nome: string) => void
  aoDesistir?: () => void
}) {
  const [sobre, setSobre] = useState(false)

  if (editando && aoSalvarNome && aoDesistir) {
    return <CampoNome inicial={rotulo} aoSalvar={aoSalvarNome} aoDesistir={aoDesistir} />
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setSobre(true)
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => {
        setSobre(false)
        aoSoltar(e)
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 10,
        marginBottom: 2,
        background: sobre ? 'var(--chip-rose)' : ativo ? 'var(--sand)' : 'transparent',
        outline: sobre ? '1.5px dashed var(--primary)' : 'none',
      }}
    >
      <button
        type="button"
        onClick={aoClicar}
        aria-pressed={ativo}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          border: 'none',
          background: 'none',
          padding: '9px 10px',
          fontFamily: 'inherit',
          fontSize: 13,
          fontWeight: ativo ? 800 : 700,
          color: ativo ? 'var(--ink)' : 'var(--muted)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {rotulo}
        </span>
        <span style={{ color: 'var(--faint)', flex: 'none' }}>{contagem}</span>
      </button>
      {acoes && <MenuKebab ariaLabel={`Ações do álbum ${rotulo}`} acoes={acoes} />}
    </div>
  )
}
