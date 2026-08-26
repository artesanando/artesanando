/* O nome de usuário vira o identificador interno da conta no Auth
   (`usuario@artesanando.local`), então o que não cabe num email não pode passar:
   espaço, acento, arroba. Minúsculas porque o login compara com `lower()`. */

export const USUARIO_MIN = 3
export const USUARIO_MAX = 20

/** blocos de letras e números separados por ponto — `ada.lovelace`, `ada2` */
const FORMATO = /^[a-z0-9]+(\.[a-z0-9]+)*$/

/** o que sobra do que a pessoa digitou; roda a cada tecla, sem brigar com ela */
export function normalizaUsuario(bruto: string): string {
  return bruto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // tira o acento antes de cortar
    .replace(/[^a-z0-9.]/g, '')
    .slice(0, USUARIO_MAX)
}

/** null quando serve; a frase de erro quando não */
export function erroDeUsuario(usuario: string): string | null {
  if (!usuario) return 'Escolha um nome de usuário.'
  if (usuario.length < USUARIO_MIN) return `Use pelo menos ${USUARIO_MIN} caracteres.`
  if (!FORMATO.test(usuario)) return 'Use letras minúsculas, números e ponto.'
  return null
}
