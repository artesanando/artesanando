import type { ReceitaCategoria } from '../../types/database'

/* Metadados visuais por categoria de receita (cores do protótipo) */

export const CAT_CARD: Record<
  ReceitaCategoria,
  { lbl: string; fg: string; chip: string; accent: string }
> = {
  amigurumi: { lbl: 'Amigurumi', fg: '#A05666', chip: '#F6E4E6', accent: '#C4798A' },
  granny: { lbl: 'Granny square', fg: '#55704E', chip: '#EAF0E6', accent: '#7D9B76' },
  faixa: { lbl: 'Faixa de tricô', fg: '#9A7328', chip: '#F1EAE0', accent: '#C9B98F' },
  manta: { lbl: 'Esquema de manta', fg: '#5E7286', chip: '#E7EDF2', accent: '#8FA3B8' },
}

export const CAT_TAG: Record<ReceitaCategoria, { tag: string; tBg: string; tC: string }> = {
  amigurumi: { tag: 'AMIGURUMI', tBg: '#F6E4E6', tC: '#A05666' },
  granny: { tag: 'GRANNY SQUARE', tBg: '#EAF0E6', tC: '#55704E' },
  faixa: { tag: 'FAIXA DE TRICÔ', tBg: '#F1EAE0', tC: '#9A7328' },
  manta: { tag: 'ESQUEMA DE MANTA', tBg: '#F1EAE0', tC: '#9A7328' },
}
