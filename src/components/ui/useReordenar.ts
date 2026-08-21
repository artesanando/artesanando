import { useRef, useState } from 'react'

/* Reordenar uma lista arrastando.
 *
 * A técnica é a mesma de `useGradeInterativa`: em vez de HTML5 drag-and-drop,
 * que não funciona em toque, acha o item sob o ponteiro por `elementFromPoint`
 * e um `data-i`. A página do projeto de tricô já fazia isso à mão — aqui vira
 * um hook, para o criador de padrão e o projeto seguirem o mesmo gesto. */
export function useReordenar(
  aoSoltar: (de: number, para: number) => void,
  /* Duas listas arrastáveis na mesma tela precisam de marcadores diferentes,
     senão soltar numa acha o índice da outra por `elementFromPoint`. */
  marcador = 'i',
) {
  const [arrastado, setArrastado] = useState<number | null>(null)
  const [alvo, setAlvo] = useState<number | null>(null)
  const origem = useRef<number | null>(null)

  const indiceSob = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y)?.closest(`[data-${marcador}]`)
    const i = el?.getAttribute(`data-${marcador}`)
    return i === null || i === undefined ? null : Number(i)
  }

  const alca = (i: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      origem.current = i
      setArrastado(i)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (origem.current === null) return
      setAlvo(indiceSob(e.clientX, e.clientY))
    },
    onPointerUp: (e: React.PointerEvent) => {
      const de = origem.current
      const para = indiceSob(e.clientX, e.clientY)
      origem.current = null
      setArrastado(null)
      setAlvo(null)
      if (de !== null && para !== null && de !== para) aoSoltar(de, para)
    },
    onPointerCancel: () => {
      origem.current = null
      setArrastado(null)
      setAlvo(null)
    },
  })

  return { arrastado, alvo, alca }
}

/** Tira o item de `de` e insere em `para`, preservando o resto da ordem */
export function reordena<T>(lista: T[], de: number, para: number): T[] {
  const copia = [...lista]
  const [item] = copia.splice(de, 1)
  copia.splice(para, 0, item)
  return copia
}
