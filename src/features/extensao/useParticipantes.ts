import { useQuery } from '@tanstack/react-query'
import type { Profile } from '../../types/database'
import { fetchParticipacao } from './api'

/* Integrante de um semestre é quem apareceu em ao menos uma chamada dele.
 *
 * `profiles.ativo` é global e não serve: quem saiu do projeto sumiria também
 * dos relatórios dos semestres em que participou. A vista `participacao_semestre`
 * deduz o vínculo do que já está registrado, sem cadastro novo todo semestre. */
export function useParticipantes(semestreId: string | null): Set<string> | null {
  const { data } = useQuery({
    queryKey: ['participacao', semestreId],
    queryFn: () => fetchParticipacao(semestreId!),
    enabled: Boolean(semestreId),
  })
  return data ?? null
}

/* Enquanto a lista não chega — ou sem semestre escolhido — mostra todas: some
   com gente da tela é pior do que mostrar alguém a mais por um instante.
 *
 * `semestreLabel` acrescenta quem entrou neste semestre e ainda não foi a
 * encontro nenhum — o caso de quem acabou de se cadastrar em /cadastro, que
 * sumiria de Integrantes até alguém marcar presença nela. O relatório de
 * extensão não passa o label: lá participação é presença, e só. */
export function soDoSemestre<T extends Pick<Profile, 'id' | 'desde'>>(
  pessoas: T[],
  participantes: Set<string> | null,
  semestreId: string | null,
  semestreLabel?: string | null,
): T[] {
  if (!semestreId || !participantes) return pessoas
  return pessoas.filter(
    (p) => participantes.has(p.id) || (Boolean(semestreLabel) && p.desde === semestreLabel),
  )
}
