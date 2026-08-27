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
 * Só a Atividade de extensão usa isto. Integrantes mostra o cadastro inteiro, e
 * a chamada monta a turma do semestre por conta própria — ver `turmaDoSemestre`
 * em presenca/api.ts, que conta falta também, enquanto aqui participação é
 * presença. */
export function soDoSemestre<T extends Pick<Profile, 'id'>>(
  pessoas: T[],
  participantes: Set<string> | null,
  semestreId: string | null,
): T[] {
  if (!semestreId || !participantes) return pessoas
  return pessoas.filter((p) => participantes.has(p.id))
}
