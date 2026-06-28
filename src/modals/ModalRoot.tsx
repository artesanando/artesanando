import { useStore } from '../state/store'
import { ModalProjeto } from './ModalProjeto'
import { ModalFin } from './ModalFin'
import {
  ModalDevolucao,
  ModalEmprestimo,
  ModalEncontro,
  ModalIntegrante,
  ModalMaterial,
  ModalProducao,
  ModalReceita,
} from './forms'
import { ModalGranny } from './ModalGranny'
import { ModalFaixa } from './ModalFaixa'
import { ModalLayout } from './ModalLayout'
import { ModalDetalhe } from './ModalDetalhe'

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
    producao: <ModalProducao />,
    integrante: <ModalIntegrante />,
    encontro: <ModalEncontro />,
    granny: <ModalGranny />,
    faixa: <ModalFaixa />,
    layout: <ModalLayout />,
    detalhe: <ModalDetalhe />,
  }
  return (
    <div className="ov" onClick={close}>
      {modals[modal]}
    </div>
  )
}
