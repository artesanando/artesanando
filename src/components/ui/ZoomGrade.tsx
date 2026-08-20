import { useState } from 'react'

const PASSO = 6
const MIN = 18
const MAX = 64

/* Zoom da grade da manta. No celular, uma manta de 12 colunas em células de 26px
   não cabe na tela e uma de 4 colunas fica minúscula — o mesmo controle resolve
   os dois, funciona no toque e no teclado, e a grade rola no que não couber. */
export function useZoomGrade(inicial = 30) {
  const [celula, setCelula] = useState(inicial)
  return {
    celula,
    controles: (
      <ZoomGrade celula={celula} aoMudar={(v) => setCelula(Math.max(MIN, Math.min(MAX, v)))} />
    ),
  }
}

function ZoomGrade({ celula, aoMudar }: { celula: number; aoMudar: (v: number) => void }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <button
        type="button"
        className="kebab"
        aria-label="Diminuir a grade"
        disabled={celula <= MIN}
        onClick={() => aoMudar(celula - PASSO)}
      >
        −
      </button>
      <span className="lbl" aria-hidden>
        ZOOM
      </span>
      <button
        type="button"
        className="kebab"
        aria-label="Aumentar a grade"
        disabled={celula >= MAX}
        onClick={() => aoMudar(celula + PASSO)}
      >
        +
      </button>
    </div>
  )
}
