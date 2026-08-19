import { describe, expect, it } from 'vitest'
import {
  encontrosPassados,
  filtraEncontros,
  frequenciaDe,
  mediaPresentes,
  presentesDe,
  proximoEncontro,
  type Encontro,
  type Presenca,
} from './api'

const HOJE = '2026-07-10'
const enc = (id: string, data: string, over: Partial<Encontro> = {}): Encontro => ({
  id,
  semestre_id: null,
  data,
  hora: null,
  local: null,
  pauta: null,
  arquivado_em: null,
  ...over,
})
const ENCONTROS: Encontro[] = [
  enc('e1', '2026-06-23', { local: 'Sala 203', pauta: 'Bordas do modelo A' }),
  enc('e2', '2026-07-07', { local: 'Ateliê', pauta: 'Montagem da manta' }),
  enc('e3', '2026-07-14'),
]
const P = (encontro: string, integrante: string, presente: boolean): Presenca => ({
  encontro_id: encontro,
  integrante_id: integrante,
  presente,
  marcado_por: null,
})
const PRESENCAS = [
  P('e1', 'a', true),
  P('e1', 'b', false),
  P('e2', 'a', true),
  P('e2', 'b', true),
  P('e2', 'c', true),
]

describe('encontros', () => {
  it('separa passados (mais recente primeiro) e o próximo', () => {
    expect(encontrosPassados(ENCONTROS, HOJE).map((e) => e.id)).toEqual(['e2', 'e1'])
    expect(proximoEncontro(ENCONTROS, HOJE)?.id).toBe('e3')
  })
  it('conta presentes por encontro e a média', () => {
    expect(presentesDe(PRESENCAS, 'e1')).toBe(1)
    expect(presentesDe(PRESENCAS, 'e2')).toBe(3)
    expect(mediaPresentes(ENCONTROS, PRESENCAS, HOJE)).toBe(2)
  })
})

describe('busca de encontro', () => {
  it('acha por data, sala ou pauta', () => {
    expect(filtraEncontros(ENCONTROS, '2026-07').map((e) => e.id)).toEqual(['e2', 'e3'])
    expect(filtraEncontros(ENCONTROS, 'ateliê').map((e) => e.id)).toEqual(['e2'])
    expect(filtraEncontros(ENCONTROS, 'bordas').map((e) => e.id)).toEqual(['e1'])
  })
  it('busca vazia devolve tudo e busca sem match devolve nada', () => {
    expect(filtraEncontros(ENCONTROS, '  ')).toHaveLength(3)
    expect(filtraEncontros(ENCONTROS, 'zzz')).toEqual([])
  })
})

describe('frequência da integrante', () => {
  it('divide presenças pelos encontros passados', () => {
    expect(frequenciaDe('a', ENCONTROS, PRESENCAS, HOJE)).toEqual({
      presentes: 2,
      total: 2,
      pct: 100,
    })
    expect(frequenciaDe('b', ENCONTROS, PRESENCAS, HOJE)).toEqual({
      presentes: 1,
      total: 2,
      pct: 50,
    })
  })
})
