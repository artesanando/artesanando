import { useQuery } from '@tanstack/react-query'
import { hojeIso } from '../../lib/format'
import type { Profile } from '../../types/database'
import { entregasDe, fetchEntregasLight, fetchIntegrantes } from '../integrantes/api'
import { fetchEncontros, fetchPresencas, frequenciaDe } from '../presenca/api'
import { avaliaRegra, type Avaliacao } from './creditos'
import { fetchMarcas, fetchRegras, type CreditoMarca } from './creditosApi'
import { soDoSemestre, useParticipantes } from './useParticipantes'

export interface LinhaCredito {
  p: Profile
  marca: CreditoMarca | null
  av: Avaliacao
}

/* Encontros do semestre escolhido. Antes as seções somavam tudo desde o começo
   do app, apesar de o título dizer "do semestre". */
export const doSemestre = <T extends { semestre_id: string | null }>(
  linhas: T[],
  id: string | null,
) => (id ? linhas.filter((l) => l.semestre_id === id) : linhas)

/* A mesma conta serve às duas seções: "Regras" precisa saber quantas
   cumpririam a regra como ela está sendo escrita, e "Créditos" mostra quem
   cumpriu. Estava escrita uma vez só, dentro da tela de créditos. */
export function useLinhasDeCredito(semestreId: string | null): LinhaCredito[] {
  const hoje = hojeIso()
  const participantes = useParticipantes(semestreId)

  const { data: regras } = useQuery({
    queryKey: ['regras-credito', semestreId],
    queryFn: () => fetchRegras(semestreId!),
    enabled: Boolean(semestreId),
  })
  const { data: marcas } = useQuery({
    queryKey: ['credito-marcas', semestreId],
    queryFn: () => fetchMarcas(semestreId!),
    enabled: Boolean(semestreId),
  })
  const { data: integrantes } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })
  const { data: encontros } = useQuery({ queryKey: ['encontros'], queryFn: fetchEncontros })
  const { data: presencas } = useQuery({ queryKey: ['presencas'], queryFn: fetchPresencas })
  const { data: entregas } = useQuery({ queryKey: ['entregas-light'], queryFn: fetchEntregasLight })

  const doSem = doSemestre(encontros ?? [], semestreId)

  return soDoSemestre(integrantes ?? [], participantes, semestreId).map((p) => {
    const freq = frequenciaDe(p.id, doSem, presencas ?? [], hoje, p.turno)
    const dela = entregas
      ? entregasDe(p.id, entregas, semestreId)
      : { amigurumis: 0, faixas: 0, grannies: 0, total: 0 }
    const marca = marcas?.get(p.id) ?? null
    return { p, marca, av: avaliaRegra(regras?.[p.nivel] ?? [], dela, freq.total.pct, marca) }
  })
}
