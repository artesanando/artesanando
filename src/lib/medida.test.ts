import { describe, expect, it } from 'vitest'
import { fmtMedida, gradeParaTamanho, tamanhoManta } from './medida'

describe('tamanhoManta', () => {
  it('crochê multiplica a peça nos dois eixos', () => {
    expect(tamanhoManta('manta_croche', 9, 12, { largura: 15, altura: 15 })).toEqual({
      largura: 135,
      altura: 180,
    })
  })

  it('tricô empilha faixas: a largura é a da própria faixa', () => {
    expect(tamanhoManta('manta_trico', 1, 8, { largura: 120, altura: 18 })).toEqual({
      largura: 120,
      altura: 144,
    })
  })

  it('sem medida cadastrada não inventa tamanho', () => {
    expect(tamanhoManta('manta_croche', 9, 12, null)).toBeNull()
    expect(tamanhoManta('manta_croche', 9, 12, { largura: 15 })).toBeNull()
  })
})

describe('gradeParaTamanho', () => {
  it('escolhe a grade mais próxima do alvo, para cima ou para baixo', () => {
    // 130/15 = 8,67 → 9 colunas; 175/15 = 11,67 → 12 linhas
    expect(
      gradeParaTamanho('manta_croche', { largura: 130, altura: 175 }, { largura: 15, altura: 15 }),
    ).toEqual({ colunas: 9, linhas: 12 })
  })

  it('arredonda para baixo quando é o mais perto', () => {
    // 100/15 = 6,67 → 7; 130/30 = 4,33 → 4
    expect(
      gradeParaTamanho('manta_croche', { largura: 100, altura: 130 }, { largura: 15, altura: 30 }),
    ).toEqual({ colunas: 7, linhas: 4 })
  })

  it('no tricô só a altura tem grade', () => {
    expect(
      gradeParaTamanho('manta_trico', { largura: 200, altura: 150 }, { largura: 120, altura: 18 }),
    ).toEqual({ colunas: 1, linhas: 8 })
  })

  it('nunca devolve grade vazia', () => {
    expect(
      gradeParaTamanho('manta_croche', { largura: 1, altura: 1 }, { largura: 15, altura: 15 }),
    ).toEqual({ colunas: 1, linhas: 1 })
  })
})

describe('fmtMedida', () => {
  it('inteiro sai sem casa decimal', () => {
    expect(fmtMedida({ largura: 135, altura: 180 })).toBe('135 × 180 cm')
  })

  it('quebrado sai com vírgula', () => {
    expect(fmtMedida({ largura: 12.5, altura: 12.5 })).toBe('12,5 × 12,5 cm')
  })

  it('sem medida mostra travessão', () => {
    expect(fmtMedida(null)).toBe('—')
  })
})
