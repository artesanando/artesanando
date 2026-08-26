/* O acesso novo viaja num link que a administradora manda. Usuário e senha vão
   no fragmento da URL, que o navegador nunca envia ao servidor: não entra em log
   e o crawler de preview do WhatsApp não o vê.

   O par mora aqui, e não solto em cada tela, porque quem monta o link e quem o lê
   precisam concordar no formato. */

const SEPARADOR = '#'

/** `https://…/acesso#u=ada.lovelace&s=xf7k2m9p` */
export function linkDeAcesso(usuario: string, senha: string) {
  const p = new URLSearchParams({ u: usuario, s: senha })
  return `${window.location.origin}/acesso${SEPARADOR}${p.toString()}`
}

/** Lê o fragmento; null quando o link chegou pela metade. */
export function lerAcesso(hash: string): { usuario: string; senha: string } | null {
  const p = new URLSearchParams(hash.replace(/^#/, ''))
  const usuario = p.get('u')
  const senha = p.get('s')
  return usuario && senha ? { usuario, senha } : null
}
