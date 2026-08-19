import { useEffect } from 'react'
import { useStore } from '../state/store'
import { ModalProjeto } from './ModalProjeto'
import { ModalFin } from './ModalFin'
import {
  ModalDevolucao,
  ModalEmprestimo,
  ModalEncontro,
  ModalIntegrante,
  ModalReceita,
} from './forms'
import { ModalMaterial, ModalMovimentoEstoque } from './ModalEstoque'
import { ModalFichaProjeto } from './ModalFichaProjeto'
import { ModalGranny } from './ModalGranny'
import { ModalFaixa } from './ModalFaixa'
import { ModalLayout } from './ModalLayout'

export function ModalRoot() {
  const { modal, close } = useStore()

  // Esc fecha qualquer modal. Os pop-ups internos param a propagação antes,
  // então o Esc de dentro de um Select não derruba o modal junto.
  useEffect(() => {
    if (!modal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [modal, close])

  if (!modal) return null

  const modals = {
    projeto: <ModalProjeto />,
    'ficha-projeto': <ModalFichaProjeto />,
    financeiro: <ModalFin />,
    material: <ModalMaterial />,
    'movimento-estoque': <ModalMovimentoEstoque />,
    receita: <ModalReceita />,
    emprestimo: <ModalEmprestimo />,
    devolucao: <ModalDevolucao />,
    integrante: <ModalIntegrante />,
    encontro: <ModalEncontro />,
    granny: <ModalGranny />,
    faixa: <ModalFaixa />,
    layout: <ModalLayout />,
  }

  return (
    <div className="ov ov-entrando" onClick={close}>
      {modals[modal]}
    </div>
  )
}
