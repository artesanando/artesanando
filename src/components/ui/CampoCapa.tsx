import { useEffect, useState } from 'react'
import { RecorteImagem } from './RecorteImagem'
import { CAPA_PROPORCAO, CAPA_SAIDA, urlDaCapa } from '../../lib/capa'

/* Escolha da foto de capa. Guarda o Blob recortado e só sobe no salvar de quem
   chama — assim cancelar o formulário não deixa arquivo órfão no Storage. */
export function CampoCapa({
  atual,
  blob,
  aoEscolher,
  vazio = 'Foto de capa',
}: {
  /** caminho já salvo no banco, quando está editando */
  atual?: string | null
  blob: Blob | null
  aoEscolher: (blob: Blob | null) => void
  vazio?: string
}) {
  const [aRecortar, setARecortar] = useState<File | null>(null)
  const [urlSalva, setUrlSalva] = useState<string | null>(null)

  useEffect(() => {
    if (!atual) return setUrlSalva(null)
    let vivo = true
    void urlDaCapa(atual).then((u) => vivo && setUrlSalva(u))
    return () => {
      vivo = false
    }
  }, [atual])

  const [previa, setPrevia] = useState<string | null>(null)
  useEffect(() => {
    if (!blob) return setPrevia(null)
    const url = URL.createObjectURL(blob)
    setPrevia(url)
    return () => URL.revokeObjectURL(url)
  }, [blob])

  const mostrando = previa ?? urlSalva

  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div
          style={{
            width: 96,
            aspectRatio: String(CAPA_PROPORCAO),
            borderRadius: 10,
            overflow: 'hidden',
            background: 'var(--sand)',
            border: '1px solid var(--field-border)',
            flex: 'none',
          }}
        >
          {mostrando && (
            <img
              src={mostrando}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label className="pill ghost" style={{ cursor: 'pointer' }}>
            {mostrando ? 'Trocar foto' : vazio}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setARecortar(f)
                e.target.value = ''
              }}
            />
          </label>
          {previa && (
            <button type="button" className="pill ghost" onClick={() => aoEscolher(null)}>
              Remover
            </button>
          )}
        </div>
      </div>

      {aRecortar && (
        <RecorteImagem
          arquivo={aRecortar}
          proporcao={CAPA_PROPORCAO}
          saida={CAPA_SAIDA}
          titulo="Enquadrar a capa"
          aoConfirmar={(b) => {
            aoEscolher(b)
            setARecortar(null)
          }}
          aoCancelar={() => setARecortar(null)}
        />
      )}
    </>
  )
}
