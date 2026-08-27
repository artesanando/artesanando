/* Guarda de celular: sobe o app com o fake do Supabase, entra como admin e
   percorre todas as telas em três larguras, cobrando duas coisas que só se veem
   no navegador — que nada role de lado e que todo alvo caiba no dedo.
   Uso: npm run check:mobile */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const PORTA = 5178
const BASE = `http://localhost:${PORTA}`

/* 320px é o iPhone SE, o menor aparelho que ainda aparece; 360 é o Android
   comum; 390 é o iPhone atual. */
const LARGURAS = [320, 360, 390]

const ROTAS = [
  '/', '/mural', '/projetos', '/integrantes', '/estoque', '/biblioteca',
  '/presenca', '/presenca/en1', '/financeiro', '/perfil', '/configuracoes', '/extensao',
  // en1 é um encontro do fake: é a chamada aberta, com os botões de montar a turma
]

/* Conferidas ANTES de entrar: logada elas redirecionam para dentro do app, e
   nunca chegariam a ser medidas. O cadastro é o caso que mais importa — o link
   vai no grupo do WhatsApp e quase todo mundo abre pelo celular. */
const ROTAS_PUBLICAS = ['/cadastro']

const TOQUE_ALTURA = 44
/* A largura mínima cede onde a geometria não deixa: sete colunas de calendário
   em 320px dão 35px por dia, e nenhum app resolve isso. */
const TOQUE_LARGURA = 34

const JS = `() => {
  const vw = document.documentElement.clientWidth
  const fora = []
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (r.right <= vw + 1) continue
    // quem vive dentro de uma faixa que rola de lado está no lugar certo
    let p = el.parentElement, emScroller = false
    while (p && p !== document.body) {
      const ps = getComputedStyle(p)
      if ((ps.overflowX === 'auto' || ps.overflowX === 'scroll') && p.scrollWidth > p.clientWidth + 1) { emScroller = true; break }
      p = p.parentElement
    }
    if (emScroller) continue
    fora.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().slice(0, 30) +
              ' "' + (el.innerText || '').trim().slice(0, 30) + '"')
  }
  // o ::after que estica a área clicável por fora conta como alvo
  const area = (el) => {
    let c = el.getBoundingClientRect()
    const cs = getComputedStyle(el, '::after')
    if (cs.content !== 'none' && cs.position === 'absolute') {
      const n = (v) => (v === 'auto' ? 0 : parseFloat(v) || 0)
      c = { width: c.width - n(cs.left) - n(cs.right), height: c.height - n(cs.top) - n(cs.bottom) }
    }
    return c
  }
  const pequenos = []
  for (const el of document.querySelectorAll('button, a[href], [role=button], [role=option], [role=menuitem]')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (getComputedStyle(el).visibility === 'hidden') continue
    const c = area(el)
    if (c.height < ${TOQUE_ALTURA} || c.width < ${TOQUE_LARGURA}) {
      pequenos.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().slice(0, 26) +
                    ' ' + Math.round(c.width) + 'x' + Math.round(c.height) +
                    ' "' + (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 24) + '"')
    }
  }
  return { vw, scrollW: document.documentElement.scrollWidth, fora: fora.slice(0, 4), pequenos }
}`

function sobeServidor() {
  // chama o binário da Vite direto, sem npx e sem shell: no Windows o shell
  // concatena os argumentos em vez de escapá-los
  const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
  const proc = spawn(
    process.execPath,
    [vite, '--config', 'vite.config.mock.ts', '--port', String(PORTA), '--strictPort'],
    { stdio: ['ignore', 'pipe', 'inherit'] },
  )
  return new Promise((ok, falhou) => {
    const limite = setTimeout(() => falhou(new Error('a Vite não subiu em 60s')), 60_000)
    proc.stdout.on('data', (d) => {
      if (d.toString().includes('ready in')) {
        clearTimeout(limite)
        ok(proc)
      }
    })
    proc.on('exit', (c) => falhou(new Error(`a Vite saiu com código ${c}`)))
  })
}

const problemas = []

async function confere(pg, rota, width) {
  await pg.goto(BASE + rota)
  await pg.waitForLoadState('networkidle')
  await pg.waitForTimeout(300)
  const r = await pg.evaluate(`(${JS})()`)
  if (r.scrollW > r.vw + 1) {
    problemas.push(`${width}px ${rota} rola de lado (${r.scrollW} numa tela de ${r.vw}): ${r.fora.join(' | ')}`)
  }
  for (const alvo of r.pequenos) {
    problemas.push(`${width}px ${rota} alvo pequeno: ${alvo}`)
  }
}

const servidor = await sobeServidor()
const navegador = await chromium.launch()

try {
  for (const width of LARGURAS) {
    const ctx = await navegador.newContext({
      viewport: { width, height: 780 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
      locale: 'pt-BR',
    })
    const pg = await ctx.newPage()

    for (const rota of ROTAS_PUBLICAS) await confere(pg, rota, width)

    await pg.goto(`${BASE}/login`)
    await pg.getByLabel('Usuário').fill('candida.prof')
    await pg.getByRole('textbox', { name: 'Senha' }).fill('12345678')
    await pg.getByRole('button', { name: 'Entrar' }).click()
    await pg.waitForSelector('main', { timeout: 20_000 })

    for (const rota of ROTAS) await confere(pg, rota, width)
    await ctx.close()
    console.log(`${width}px conferida`)
  }
} finally {
  await navegador.close()
  servidor.kill()
}

if (problemas.length) {
  console.error(`\n${problemas.length} problema(s) de celular:`)
  for (const p of problemas) console.error('  ' + p)
  process.exit(1)
}
console.log('\nCelular ok: nada rola de lado e todo alvo cabe no dedo.')
