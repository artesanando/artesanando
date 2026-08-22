import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

/* Irmão menor de `useGradeInterativa`: o mesmo motor de ponteiro — captura no
 * contêiner e `elementFromPoint` para saber o que está embaixo —, aqui para
 * cartões que caem dentro de colunas.
 *
 * Ponteiro, e não o drag-and-drop do HTML5, pela mesma razão da grade: aquele
 * não existe no toque. E, como lá, o arrasto é reforço: o cartão continua
 * sendo um <button> que seleciona no clique, e há um caminho sem arrastar.
 */
export function useArrastarCartao({
  ativo,
  aoSoltar,
  aoClicar,
}: {
  ativo: boolean
  /** o cartão arrastado caiu nesta coluna */
  aoSoltar: (cartaoId: string, coluna: string) => void
  /** toque limpo, sem arrasto — ver a nota sobre a captura de ponteiro */
  aoClicar: (cartaoId: string) => void
}) {
  const [arrastado, setArrastado] = useState<string | null>(null)
  const [alvo, setAlvo] = useState<string | null>(null)
  const area = useRef<HTMLDivElement>(null)
  /** houve arrasto de verdade? se sim, o clique que vem depois é ignorado */
  const arrastou = useRef(false)
  /* Com o ponteiro capturado pelo quadro, o navegador entrega o `click` ao
     quadro e não ao <button> do cartão. O toque limpo se resolve no
     `pointerup`; a trava evita contar duas vezes onde o click chega. */
  const tratado = useRef(false)

  const sob = (x: number, y: number, atributo: string) => {
    const el = document.elementFromPoint?.(x, y)?.closest(`[data-${atributo}]`)
    return el ? ((el as HTMLElement).dataset[atributo] ?? null) : null
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!ativo) return
    const cartao = sob(e.clientX, e.clientY, 'cartao')
    if (!cartao) return
    area.current?.setPointerCapture(e.pointerId)
    arrastou.current = false
    setArrastado(cartao)
  }

  /* Mexer dentro do próprio cartão não é arrastar: o clique do mouse manda um
     `pointermove` no mesmo lugar, e sem esta guarda ele engolia a seleção. */
  const onPointerMove = (e: ReactPointerEvent) => {
    if (arrastado === null) return
    if (sob(e.clientX, e.clientY, 'cartao') === arrastado && alvo === null) return
    arrastou.current = true
    setAlvo(sob(e.clientX, e.clientY, 'coluna'))
  }

  const terminar = (e: ReactPointerEvent) => {
    if (arrastado !== null && arrastou.current && alvo) {
      aoSoltar(arrastado, alvo)
    } else if (arrastado !== null && !arrastou.current) {
      clicar(arrastado)
      tratado.current = true
      setTimeout(() => {
        tratado.current = false
      }, 0)
    }
    setArrastado(null)
    setAlvo(null)
    if (area.current?.hasPointerCapture?.(e.pointerId)) {
      area.current.releasePointerCapture(e.pointerId)
    }
    // o clique chega logo depois do pointerup; solta a trava no próximo tique
    setTimeout(() => {
      arrastou.current = false
    }, 0)
  }

  const clicar = (id: string) => {
    if (!ativo || arrastou.current) return
    aoClicar(id)
  }

  return {
    arrastado,
    alvo,
    /** para o teclado: o <button> segue chamando, e a trava evita repetir */
    clicar: (id: string) => {
      if (tratado.current) return
      clicar(id)
    },
    propsArea: {
      ref: area,
      onPointerDown,
      onPointerMove,
      onPointerUp: terminar,
      onPointerCancel: terminar,
    },
  }
}
