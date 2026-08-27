import { describe, expect, it } from 'vitest'
import {
  datasSemanais,
  encontrosPassados,
  frequenciaDe,
  mediaPresentes,
  presentesDe,
  proximoEncontro,
  proximosEncontros,
  turmaDoSemestre,
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
  turno: 'diurno',
  cancelado_em: null,
  serie_id: null,
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
  it('separa passados (mais recente primeiro) e os próximos', () => {
    expect(encontrosPassados(ENCONTROS, HOJE).map((e) => e.id)).toEqual(['e2', 'e1'])
    expect(proximosEncontros(ENCONTROS, HOJE).map((e) => e.id)).toEqual(['e3'])
    expect(proximoEncontro(ENCONTROS, HOJE)?.id).toBe('e3')
  })
  it('conta presentes por encontro e a média', () => {
    expect(presentesDe(PRESENCAS, 'e1')).toBe(1)
    expect(presentesDe(PRESENCAS, 'e2')).toBe(3)
    expect(mediaPresentes(ENCONTROS, PRESENCAS, HOJE)).toBe(2)
  })
  it('encontro cancelado sai da média', () => {
    const comCancelado = [enc('e1', '2026-06-23', { cancelado_em: '2026-06-20' }), ENCONTROS[1]]
    expect(mediaPresentes(comCancelado, PRESENCAS, HOJE)).toBe(3)
  })
})

describe('datasSemanais', () => {
  it('gera de sete em sete até o fim do semestre', () => {
    expect(datasSemanais('2026-08-03', '2026-08-25')).toEqual([
      '2026-08-03',
      '2026-08-10',
      '2026-08-17',
      '2026-08-24',
    ])
  })
  it('sem data de fim, cria só o encontro pedido', () => {
    expect(datasSemanais('2026-08-03', null)).toEqual(['2026-08-03'])
  })
  it('fim antes do início não gera série', () => {
    expect(datasSemanais('2026-08-03', '2026-07-01')).toEqual(['2026-08-03'])
  })
  it('respeita o limite para não criar centenas de linhas', () => {
    expect(datasSemanais('2026-01-01', '2030-01-01', 5)).toHaveLength(5)
  })
})

describe('frequência da integrante', () => {
  const MISTO: Encontro[] = [
    enc('d1', '2026-06-23', { turno: 'diurno' }),
    enc('d2', '2026-07-07', { turno: 'diurno' }),
    enc('n1', '2026-06-24', { turno: 'noturno' }),
    enc('n2', '2026-07-08', { turno: 'noturno' }),
  ]
  const PRES = [
    P('d1', 'dia', true),
    P('d2', 'dia', true),
    P('n1', 'noite', true),
    P('n2', 'noite', false),
    P('d1', 'ambas', true),
    P('n1', 'ambas', true),
  ]

  it('separa os dois turnos', () => {
    const f = frequenciaDe('dia', MISTO, PRES, HOJE, 'diurno')
    expect(f.diurno).toEqual({ presentes: 2, total: 2, pct: 100 })
    expect(f.noturno).toEqual({ presentes: 0, total: 2, pct: 0 })
  })

  it('quem é do noturno não leva falta por encontro diurno', () => {
    const f = frequenciaDe('noite', MISTO, PRES, HOJE, 'noturno')
    expect(f.total).toEqual({ presentes: 1, total: 2, pct: 50 })
  })

  it('quem é dos dois turnos conta os quatro encontros', () => {
    const f = frequenciaDe('ambas', MISTO, PRES, HOJE, 'ambos')
    expect(f.total).toEqual({ presentes: 2, total: 4, pct: 50 })
  })

  it('encontro cancelado não entra em nenhum denominador', () => {
    const comCancelado = MISTO.map((e) =>
      e.id === 'd2' ? { ...e, cancelado_em: '2026-07-01' } : e,
    )
    const f = frequenciaDe('dia', comCancelado, PRES, HOJE, 'diurno')
    expect(f.diurno).toEqual({ presentes: 1, total: 1, pct: 100 })
    expect(f.total).toEqual({ presentes: 1, total: 1, pct: 100 })
  })

  it('sem encontro nenhum a porcentagem é zero, não NaN', () => {
    expect(frequenciaDe('x', [], [], HOJE).total).toEqual({ presentes: 0, total: 0, pct: 0 })
  })
})

describe('turmaDoSemestre', () => {
  const encontros = [
    { id: 'a', semestre_id: 's1' },
    { id: 'b', semestre_id: 's1' },
    { id: 'c', semestre_id: 's2' },
  ] as Encontro[]

  it('reúne quem entrou em qualquer chamada do semestre', () => {
    const turma = turmaDoSemestre(
      [
        { encontro_id: 'a', integrante_id: 'u1', presente: true, marcado_por: null },
        { encontro_id: 'b', integrante_id: 'u2', presente: true, marcado_por: null },
      ] as Presenca[],
      encontros,
      's1',
    )
    expect([...turma].sort()).toEqual(['u1', 'u2'])
  })

  it('falta não tira da turma — é o que a faz reaparecer na próxima chamada', () => {
    const turma = turmaDoSemestre(
      [{ encontro_id: 'a', integrante_id: 'u1', presente: false, marcado_por: null }] as Presenca[],
      encontros,
      's1',
    )
    expect(turma.has('u1')).toBe(true)
  })

  it('ignora quem só apareceu em outro semestre', () => {
    const turma = turmaDoSemestre(
      [{ encontro_id: 'c', integrante_id: 'u9', presente: true, marcado_por: null }] as Presenca[],
      encontros,
      's1',
    )
    expect(turma.has('u9')).toBe(false)
  })
})
