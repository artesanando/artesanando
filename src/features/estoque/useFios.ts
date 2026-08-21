import { useQuery } from '@tanstack/react-query'
import type { FioDoEstoque } from '../../components/ui/controles'
import { urlsDasCapas } from '../../lib/capa'
import { separaArquivados } from '../../lib/arquivo'
import { fetchEstoque } from './api'

/* Novelos do estoque prontos para o seletor de cor, com a foto de cada um.
 *
 * Reusa as mesmas query keys da tela de Estoque, então na maior parte da
 * navegação nem sai request novo — o cache já está quente. Fica aqui, e não
 * dentro do ColorPicker, para o componente de UI não passar a depender de
 * `features/estoque`. */
export function useFios(): FioDoEstoque[] {
  const { data: itens } = useQuery({ queryKey: ['estoque'], queryFn: fetchEstoque })

  const { ativos } = separaArquivados(itens ?? [])
  const novelos = ativos.filter((i) => i.categoria === 'novelos' && i.cor_hex)

  const comCapa = novelos.filter((i) => i.capa_path).map((i) => i.capa_path!)
  const { data: capas } = useQuery({
    queryKey: ['capas-estoque', comCapa.join(',')],
    queryFn: () => urlsDasCapas(comCapa),
    enabled: comCapa.length > 0,
  })

  return novelos.map((i) => ({
    id: i.id,
    nome: i.nome,
    detalhe: i.detalhe,
    cor_hex: i.cor_hex!,
    capa: i.capa_path ? (capas?.get(i.capa_path) ?? null) : null,
  }))
}
