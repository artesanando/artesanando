import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { useStore } from '../../state/store'
import { useToast } from '../../components/ui/Toast'
import { useAcoesArquivo } from '../../components/ui/useAcoesItem'
import type { AcaoMenu } from '../../components/ui/controles'
import { atualizarProjeto, type Projeto } from './api'

/* As mesmas ações de projeto no cartão da lista e no cabeçalho do detalhe. */
export function useAcoesProjeto() {
  const { isAdmin } = useAuth()
  const { openFichaProjeto } = useStore()
  const qc = useQueryClient()
  const toast = useToast()
  const acoesArquivo = useAcoesArquivo()

  const mudarStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Projeto['status'] }) =>
      atualizarProjeto(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projetos'] })
      qc.invalidateQueries({ queryKey: ['projeto'] })
      toast('Projeto atualizado')
    },
    onError: () => toast('Não foi possível mudar o projeto.', 'erro'),
  })

  return (projeto: Projeto): AcaoMenu[] => {
    if (!isAdmin) return []
    const entregue = projeto.status === 'entregue'
    return [
      { label: 'Editar ficha', onSelect: () => openFichaProjeto(projeto.id) },
      {
        label: entregue ? 'Voltar para produção' : 'Marcar como entregue',
        onSelect: () =>
          mudarStatus.mutate({ id: projeto.id, status: entregue ? 'ativo' : 'entregue' }),
      },
      ...acoesArquivo({
        tabela: 'projetos',
        id: projeto.id,
        nome: `o projeto "${projeto.nome}"`,
        motivoHistorico: 'A produção registrada e os comentários',
        arquivado: Boolean(projeto.arquivado_em),
        invalidar: ['projetos', 'progresso-geral'],
      }),
    ]
  }
}
