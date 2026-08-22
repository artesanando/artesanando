import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { retangulo } from '../../lib/grade'

export type ModoGrade = 'marcar' | 'mover' | 'pintar'

/* Motor de ponteiro da grade da manta, compartilhado pelo mapa do projeto e
   pelo editor de esquema da biblioteca. Os dois têm os mesmos três gestos e
   guardam coisas diferentes: o mapa grava no banco, o editor mexe num array
   local. Por isso o hook só reporta a intenção e quem chama decide o que fazer.
   A célula continua sendo um <button> na tela — o arrasto é reforço, não o
   único caminho. */
export function useGradeInterativa({
  colunas,
  modo,
  ativo,
  aoPintar,
  aoTrocar,
}: {
  colunas: number
  modo: ModoGrade
  ativo: boolean
  /** posições que devem receber o pincel */
  aoPintar?: (posicoes: number[]) => void
  /** duas posições que trocam de lugar */
  aoTrocar?: (de: number, para: number) => void
}) {
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [arrastado, setArrastado] = useState<number | null>(null)
  const [alvo, setAlvo] = useState<number | null>(null)

  const grade = useRef<HTMLDivElement>(null)
  const ancora = useRef<number | null>(null)
  const pressionado = useRef(false)
  /** houve arrasto de verdade? se sim, o clique que vem depois é ignorado */
  const arrastou = useRef(false)
  /* Com o ponteiro capturado pela grade, o navegador entrega o `click` à grade
     e não ao <button> da célula — o onClick dela nunca rodava, e marcar square
     por toque simplesmente não acontecia. O toque limpo passou a ser resolvido
     no `pointerup`; esta trava evita contar duas vezes onde o click chega. */
  const tratado = useRef(false)
  /** o pintar em área lê a seleção no pointerup, e o estado ainda não chegou lá */
  const pincelada = useRef<number[]>([])

  // trocar de modo zera o que estava no meio do caminho
  useEffect(() => {
    setSel(new Set())
    setArrastado(null)
    setAlvo(null)
    ancora.current = null
    pincelada.current = []
  }, [modo])

  /** posição sob o ponteiro — o mesmo caminho no mouse e no toque */
  const posSob = (x: number, y: number): number | null => {
    const el = document.elementFromPoint?.(x, y)?.closest('[data-pos]')
    return el ? Number((el as HTMLElement).dataset.pos) : null
  }

  const aoClicar = (pos: number) => {
    if (!ativo || arrastou.current || tratado.current) return
    if (modo === 'pintar') {
      aoPintar?.([pos])
      return
    }
    if (modo === 'mover') {
      if (arrastado === null) {
        setArrastado(pos)
      } else {
        if (arrastado !== pos) aoTrocar?.(arrastado, pos)
        setArrastado(null)
      }
      return
    }
    setSel((atual) => {
      const novo = new Set(atual)
      if (novo.has(pos)) novo.delete(pos)
      else novo.add(pos)
      return novo
    })
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!ativo) return
    const pos = posSob(e.clientX, e.clientY)
    if (pos === null) return
    grade.current?.setPointerCapture(e.pointerId)
    pressionado.current = true
    arrastou.current = false
    ancora.current = pos
    pincelada.current = []
    if (modo === 'mover') setArrastado(pos)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pressionado.current || ancora.current === null) return
    const pos = posSob(e.clientX, e.clientY)
    if (pos === null || pos === ancora.current) return
    arrastou.current = true

    if (modo === 'mover') {
      setAlvo(pos)
      return
    }
    const area = retangulo(ancora.current, pos, colunas)
    pincelada.current = area
    setSel(new Set(area))
  }

  const onPointerUp = () => {
    if (!pressionado.current) return
    pressionado.current = false

    if (arrastou.current) {
      if (modo === 'mover' && arrastado !== null && alvo !== null && alvo !== arrastado) {
        aoTrocar?.(arrastado, alvo)
      }
      if (modo === 'pintar' && pincelada.current.length > 0) {
        aoPintar?.(pincelada.current)
        setSel(new Set())
      }
      setArrastado(null)
    } else if (ancora.current !== null) {
      aoClicar(ancora.current)
      tratado.current = true
      setTimeout(() => {
        tratado.current = false
      }, 0)
    }
    setAlvo(null)
    ancora.current = null
    pincelada.current = []
    // o clique chega logo depois do pointerup; solta a trava no próximo tique
    setTimeout(() => {
      arrastou.current = false
    }, 0)
  }

  return {
    sel,
    setSel,
    arrastado,
    alvo,
    aoClicar,
    /** vai no contêiner da grade */
    propsGrade: {
      ref: grade,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  }
}
