import { useEffect, useRef, useState } from 'react'
import { ModalBox } from '../../modals/shared'
import { recortarQuadrado } from './api'

/* Enquadramento da foto de perfil: arrasta para posicionar, zoom na barra,
   e o que sai é sempre um JPEG 256×256 — o mesmo círculo que aparece na
   sidebar, na chamada e nos comentários. */
export function RecorteFoto({
  arquivo,
  aoConfirmar,
  aoCancelar,
}: {
  arquivo: File
  aoConfirmar: (blob: Blob) => void
  aoCancelar: () => void
}) {
  const [src, setSrc] = useState<string>('')
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [salvando, setSalvando] = useState(false)
  const img = useRef<HTMLImageElement>(null)
  const arrastando = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(arquivo)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [arquivo])

  const LADO = 240

  const confirmar = async () => {
    if (!img.current) return
    setSalvando(true)
    try {
      aoConfirmar(await recortarQuadrado(img.current, { zoom, offsetX: pos.x, offsetY: pos.y }))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="ov ov-entrando" onClick={aoCancelar}>
      <ModalBox maxWidth={340} titulo="Enquadrar a foto">
        <div className="h" style={{ fontSize: 19, marginBottom: 4 }}>
          Enquadrar a foto
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>
          arraste para posicionar e use a barra para aproximar
        </div>

        <div
          style={{
            width: LADO,
            height: LADO,
            margin: '0 auto 16px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'var(--sand)',
            position: 'relative',
            cursor: 'grab',
            touchAction: 'none',
          }}
          onPointerDown={(e) => {
            arrastando.current = { x: e.clientX, y: e.clientY }
            e.currentTarget.setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            if (!arrastando.current) return
            const dx = (e.clientX - arrastando.current.x) / LADO
            const dy = (e.clientY - arrastando.current.y) / LADO
            arrastando.current = { x: e.clientX, y: e.clientY }
            // o recorte não sai da imagem: meia tela para cada lado, no máximo
            const limite = 0.5 - 0.5 / zoom
            setPos((p) => ({
              x: Math.max(-limite, Math.min(limite, p.x + dx)),
              y: Math.max(-limite, Math.min(limite, p.y + dy)),
            }))
          }}
          onPointerUp={() => {
            arrastando.current = null
          }}
        >
          {src && (
            <img
              ref={img}
              src={src}
              alt="Prévia da foto de perfil"
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                minWidth: '100%',
                minHeight: '100%',
                transform: `translate(-50%, -50%) translate(${pos.x * LADO}px, ${pos.y * LADO}px) scale(${zoom})`,
                userSelect: 'none',
              }}
            />
          )}
        </div>

        <label className="lbl" htmlFor="zoom-foto" style={{ display: 'block', marginBottom: 6 }}>
          APROXIMAR
        </label>
        <input
          id="zoom-foto"
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ width: '100%', marginBottom: 20, accentColor: 'var(--primary)' }}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="pill ghost" onClick={aoCancelar}>
            Cancelar
          </button>
          <button type="button" className="pill" onClick={confirmar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Usar esta foto'}
          </button>
        </div>
      </ModalBox>
    </div>
  )
}
