import { useEffect, useRef, useState } from 'react'
import { ModalBox } from '../../modals/shared'
import { encaixa, molduraInicial, recortar, type Moldura } from '../../lib/imagem'

type Puxador = 'mover' | 'ne' | 'nw' | 'se' | 'sw'

/* Enquadramento de foto: a imagem aparece INTEIRA e quem escolhe o pedaço é a
   moldura por cima, que se arrasta e se redimensiona pelos cantos. A versão
   anterior já entrava cortada e só oferecia uma barra de zoom — dava para
   aproximar, mas não para enxergar a foto e decidir. */
export function RecorteImagem({
  arquivo,
  proporcao = 1,
  redondo = false,
  saida,
  titulo = 'Enquadrar a foto',
  aoConfirmar,
  aoCancelar,
}: {
  arquivo: File
  /** largura ÷ altura do recorte */
  proporcao?: number
  /** máscara circular (foto de perfil) */
  redondo?: boolean
  /** tamanho do JPEG gerado */
  saida?: { largura: number; altura: number }
  titulo?: string
  aoConfirmar: (blob: Blob) => void
  aoCancelar: () => void
}) {
  const [src, setSrc] = useState('')
  const [moldura, setMoldura] = useState<Moldura | null>(null)
  const [salvando, setSalvando] = useState(false)
  const img = useRef<HTMLImageElement>(null)
  const palco = useRef<HTMLDivElement>(null)
  const gesto = useRef<{ puxador: Puxador; x: number; y: number; inicial: Moldura } | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(arquivo)
    setSrc(url)
    setMoldura(null)
    return () => URL.revokeObjectURL(url)
  }, [arquivo])

  const aoCarregar = () => {
    const el = img.current
    if (!el) return
    setMoldura(molduraInicial(el.naturalWidth, el.naturalHeight, proporcao))
  }

  /* O gesto vem em pixels do palco e vira fração — o mesmo código serve para o
     mouse e para o dedo, e a conta não depende do tamanho na tela. */
  const iniciar = (puxador: Puxador) => (e: React.PointerEvent) => {
    if (!moldura) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    gesto.current = { puxador, x: e.clientX, y: e.clientY, inicial: moldura }
  }

  const mover = (e: React.PointerEvent) => {
    const g = gesto.current
    const caixa = palco.current?.getBoundingClientRect()
    if (!g || !caixa) return
    const dx = (e.clientX - g.x) / caixa.width
    const dy = (e.clientY - g.y) / caixa.height
    const m = g.inicial

    if (g.puxador === 'mover') {
      setMoldura(encaixa({ ...m, x: m.x + dx, y: m.y + dy }))
      return
    }

    // canto: um lado manda e o outro acompanha para a proporção não escapar
    const daCaixa = caixa.width / caixa.height
    const oeste = g.puxador === 'nw' || g.puxador === 'sw'
    const norte = g.puxador === 'nw' || g.puxador === 'ne'
    const w = oeste ? m.w - dx : m.w + dx
    const h = (w * daCaixa) / proporcao
    const novo = {
      w,
      h,
      x: oeste ? m.x + m.w - w : m.x,
      y: norte ? m.y + m.h - h : m.y,
    }
    setMoldura(encaixa(novo))
  }

  const soltar = () => {
    gesto.current = null
  }

  const confirmar = async () => {
    if (!img.current || !moldura) return
    setSalvando(true)
    try {
      const larguraSaida = saida?.largura ?? 512
      aoConfirmar(
        await recortar(
          img.current,
          moldura,
          larguraSaida,
          saida?.altura ?? Math.round(larguraSaida / proporcao),
        ),
      )
    } finally {
      setSalvando(false)
    }
  }

  const canto = (p: Puxador, estilo: React.CSSProperties) => (
    <span
      role="presentation"
      className="canto-recorte"
      style={estilo}
      onPointerDown={iniciar(p)}
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerCancel={soltar}
    />
  )

  return (
    <div className="ov ov-entrando" onClick={aoCancelar}>
      <ModalBox maxWidth={420} titulo={titulo}>
        <div className="h" style={{ fontSize: 19, marginBottom: 14 }}>
          {titulo}
        </div>

        <div
          ref={palco}
          className="palco-recorte"
          onPointerMove={mover}
          onPointerUp={soltar}
          onPointerCancel={soltar}
        >
          {src && (
            <img
              ref={img}
              src={src}
              alt="Foto a recortar"
              draggable={false}
              onLoad={aoCarregar}
              style={{ display: 'block', width: '100%', height: 'auto', userSelect: 'none' }}
            />
          )}
          {moldura && (
            <>
              {/* o que fica de fora escurece, para a moldura ficar óbvia */}
              <div
                className="sombra-recorte"
                style={{
                  clipPath: `polygon(0% 0%, 0% 100%, ${pc(moldura.x)} 100%, ${pc(moldura.x)} ${pc(moldura.y)}, ${pc(moldura.x + moldura.w)} ${pc(moldura.y)}, ${pc(moldura.x + moldura.w)} ${pc(moldura.y + moldura.h)}, ${pc(moldura.x)} ${pc(moldura.y + moldura.h)}, ${pc(moldura.x)} 100%, 100% 100%, 100% 0%)`,
                }}
              />
              <div
                role="button"
                tabIndex={0}
                aria-label="Mover o recorte"
                className="moldura-recorte"
                style={{
                  left: pc(moldura.x),
                  top: pc(moldura.y),
                  width: pc(moldura.w),
                  height: pc(moldura.h),
                  borderRadius: redondo ? '50%' : 6,
                }}
                onPointerDown={iniciar('mover')}
                onKeyDown={(e) => {
                  const passo = 0.02
                  if (e.key === 'ArrowLeft') setMoldura(encaixa({ ...moldura, x: moldura.x - passo }))
                  if (e.key === 'ArrowRight') setMoldura(encaixa({ ...moldura, x: moldura.x + passo }))
                  if (e.key === 'ArrowUp') setMoldura(encaixa({ ...moldura, y: moldura.y - passo }))
                  if (e.key === 'ArrowDown') setMoldura(encaixa({ ...moldura, y: moldura.y + passo }))
                }}
              >
                {canto('nw', { left: -9, top: -9, cursor: 'nwse-resize' })}
                {canto('ne', { right: -9, top: -9, cursor: 'nesw-resize' })}
                {canto('sw', { left: -9, bottom: -9, cursor: 'nesw-resize' })}
                {canto('se', { right: -9, bottom: -9, cursor: 'nwse-resize' })}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button type="button" className="pill ghost" onClick={aoCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className="pill"
            onClick={confirmar}
            disabled={salvando || !moldura}
          >
            {salvando ? 'Salvando…' : 'Usar esta foto'}
          </button>
        </div>
      </ModalBox>
    </div>
  )
}

const pc = (v: number) => `${(v * 100).toFixed(3)}%`
