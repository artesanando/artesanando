import { useQueryClient } from '@tanstack/react-query'
import { useConfirmar } from './Confirm'
import { useToast } from './Toast'
import { arquivar, desarquivar, excluir, podeExcluir } from '../../lib/arquivo'
import type { Arquivavel } from '../../types/database'
import type { AcaoMenu } from './controles'

/* Monta o Arquivar/Excluir do menu de ações do mesmo jeito em toda lista do app.
   A escolha entre os dois não é do chamador: `pode_excluir` no banco decide, e
   o que tem histórico só oferece arquivar — com o motivo escrito no diálogo. */

interface Opts {
  tabela: Arquivavel
  id: string
  /** aparece no diálogo: "Arquivar a manta Primavera?" */
  nome: string
  /** o que fica preso quando não dá para excluir: "a chamada já feita" */
  motivoHistorico: string
  arquivado?: boolean
  /** queries a revalidar depois */
  invalidar: string[]
}

export function useAcoesArquivo() {
  const confirmar = useConfirmar()
  const toast = useToast()
  const qc = useQueryClient()

  return ({ tabela, id, nome, motivoHistorico, arquivado, invalidar }: Opts): AcaoMenu[] => {
    const revalidar = () => invalidar.forEach((k) => qc.invalidateQueries({ queryKey: [k] }))

    const acaoArquivar: AcaoMenu = arquivado
      ? {
          label: 'Restaurar',
          onSelect: async () => {
            try {
              await desarquivar(tabela, id)
              revalidar()
              toast('Restaurado')
            } catch {
              toast('Não foi possível restaurar.', 'erro')
            }
          },
        }
      : {
          label: 'Arquivar',
          onSelect: async () => {
            const ok = await confirmar({
              titulo: `Arquivar ${nome}?`,
              okLabel: 'Arquivar',
            })
            if (!ok) return
            try {
              await arquivar(tabela, id)
              revalidar()
              toast('Arquivado')
            } catch {
              toast('Não foi possível arquivar.', 'erro')
            }
          },
        }

    const acaoExcluir: AcaoMenu = {
      label: 'Excluir',
      perigo: true,
      onSelect: async () => {
        if (!(await podeExcluir(tabela, id))) {
          await confirmar({
            titulo: `Não dá para excluir ${nome}`,
            descricao: `${motivoHistorico} ficaria sem referência. Arquive no lugar.`,
            okLabel: 'Entendi',
            cancelarLabel: 'Fechar',
          })
          return
        }
        const ok = await confirmar({
          titulo: `Excluir ${nome}?`,
          okLabel: 'Excluir',
          perigo: true,
        })
        if (!ok) return
        try {
          await excluir(tabela, id)
          revalidar()
          toast('Excluído')
        } catch {
          toast('Não foi possível excluir.', 'erro')
        }
      },
    }

    return [acaoArquivar, acaoExcluir]
  }
}
