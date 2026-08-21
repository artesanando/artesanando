/** Iniciais de um nome (até 2 letras): "Ana Luiza Prado" → "AL" */
export const ini = (n: string) =>
  n
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

/* ---------- Dinheiro (sempre em centavos int) ---------- */

/** 124050 → "R$ 1.240,50" */
export function fmtCentavos(centavos: number): string {
  const negativo = centavos < 0
  const abs = Math.abs(centavos)
  const reais = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const cents = String(abs % 100).padStart(2, '0')
  return `${negativo ? '−' : ''}R$ ${reais},${cents}`
}

/** dígitos digitados → centavos: "1240,50", "R$ 1.240,50" e "124050" → 124050 */
export function parseCentavos(texto: string): number {
  const digitos = texto.replace(/\D/g, '')
  return digitos ? parseInt(digitos, 10) : 0
}

/* ---------- Datas (date local, sem shift de UTC) ---------- */

const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MESES_LONGO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** 'YYYY-MM-DD' → Date local (nunca via new Date(iso), que desloca p/ UTC) */
export function dataLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** '2026-07-08' → "08 jul" */
export function fmtDataCurta(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d} ${MESES_CURTO[Number(m) - 1]}`
}

/** '2026-07-14' → "Terça, 14 de julho" */
export function fmtDataLonga(iso: string): string {
  const d = dataLocal(iso)
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES_LONGO[d.getMonth()]}`
}

/** '2026-07-08' → "08/07" */
export function fmtDataBarra(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

/** timestamp → "hoje" / "ontem" / "há N dias" */
export function tempoRelativo(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  return `há ${dias} dias`
}

/** hoje como 'YYYY-MM-DD' local */
export function hojeIso(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/* Entrega pode ser fracionária: meio square é meia entrega. Mostra "3,5" e
   "4", nunca "4,0" — o zero à direita só polui a tabela. */
export const fmtEntrega = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',')
