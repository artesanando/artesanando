import { useStore } from '../state/store'
import { ModalProjeto } from './ModalProjeto'
import { ModalFin } from './ModalFin'
import {
  ModalDevolucao,
  ModalEmprestimo,
  ModalEncontro,
  ModalIntegrante,
  ModalMaterial,
  ModalReceita,
} from './forms'
import { ModalGranny } from './ModalGranny'
import { ModalFaixa } from './ModalFaixa'
import { ModalLayout } from './ModalLayout'

export function ModalRoot() {
  const { modal, close } = useStore()
  if (!modal) return null
  const modals = {
    projeto: <ModalProjeto />,
    financeiro: <ModalFin />,
    material: <ModalMaterial />,
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
    <div className="ov" onClick={close}>
      {modals[modal]}
    </div>
  )
}
