// Edge Function: cria o acesso de uma integrante e devolve o link (só admin).
// Usa a service role no servidor; o front chama via supabase.functions.invoke.
// Deploy: supabase functions deploy invite-member
import { createClient } from 'npm:@supabase/supabase-js@2'

/* O Auth exige um email por conta. Como o projeto não manda mensagem nenhuma,
   ele é só um identificador interno num domínio que não existe. Ninguém digita
   nem vê isto: o convite viaja pelo link, na mão. */
const identificador = (usuario: string) => `${usuario.toLowerCase()}@artesanando.local`

/* Sem i, l, o, 0 e 1: a senha é ditada no WhatsApp e copiada à mão, então o que
   se confunde na leitura vira chamado de "não consigo entrar". */
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789'

function senhaProvisoria() {
  const n = new Uint32Array(10)
  crypto.getRandomValues(n)
  return Array.from(n, (x) => ALFABETO[x % ALFABETO.length]).join('')
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Identifica quem chamou a partir do JWT do request
    const authHeader = req.headers.get('Authorization') ?? ''
    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await caller.auth.getUser()
    if (!user) return json({ error: 'Sua sessão expirou. Entre de novo.' }, 401)

    const admin = createClient(supabaseUrl, serviceRole)
    // `profiles.id` deixou de ser o id do auth na migration 130000 — quem
    // identifica a chamadora agora é `user_id`.
    const { data: profile } = await admin
      .from('profiles')
      .select('papel, ativo')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!profile || profile.papel !== 'admin' || !profile.ativo) {
      return json({ error: 'Só administradoras podem convidar.' }, 403)
    }

    const { nome, usuario, telefone, preferencia, turno, papel, profileId } = await req.json()
    if (!nome || !usuario) {
      return json({ error: 'Informe o nome e o usuário.' }, 400)
    }

    /* Convite de quem já entrou pela chamada: o perfil existe e o que falta é a
       conta. O id vai no metadata para o trigger ligar exatamente nele, em vez
       de tentar adivinhar pelo usuário e acabar criando ficha duplicada. */
    let contaExistente: string | null = null
    if (profileId) {
      const { data: alvo } = await admin
        .from('profiles')
        .select('id, user_id')
        .eq('id', profileId)
        .maybeSingle()
      if (!alvo) return json({ error: 'Integrante não encontrada.' }, 404)
      /* Já ter conta não barra mais. Antes barrava, e quem perdeu a senha
         provisória antes de entrar ficava sem saída nenhuma: nem por aqui, nem
         pelo cadastro, que recusa usuário repetido. Reemitir é o caso normal. */
      contaExistente = alvo.user_id
    }

    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('usuario', usuario)
      .maybeSingle()
    if (existing && existing.id !== profileId) {
      return json(
        { error: 'Já existe uma integrante com esse usuário. Gere o acesso pela ficha dela.' },
        409,
      )
    }

    const metadata = {
      nome,
      usuario,
      telefone: telefone ?? null,
      preferencia: preferencia ?? 'ambos',
      turno: turno ?? 'ambos',
    }

    /* Papel e ficha de destino viajam no app_metadata, não no user_metadata: o
       navegador escreve o segundo no `signUp` do cadastro público, e o trigger
       tem de saber distinguir o que veio daqui — de dentro da service role — do
       que veio de quem está se cadastrando. */
    const confianca = {
      papel: papel === 'admin' ? 'admin' : 'integrante',
      perfil_id: profileId ?? null,
    }

    /* O acesso viaja como usuário + senha provisória, ditos pela admin. Link de
       uso único não servia: o preview do WhatsApp busca a URL para montar o
       cartãozinho e gasta o token antes de a pessoa tocar nele — o convite
       chegava do outro lado já expirado. */
    const senha = senhaProvisoria()

    if (contaExistente) {
      const { error } = await admin.auth.admin.updateUserById(contaExistente, { password: senha })
      if (error) {
        console.error('updateUserById', error)
        return json({ error: 'Não foi possível gerar o acesso. Tente de novo.' }, 400)
      }
      await admin.from('profiles').update({ senha_provisoria: true }).eq('id', profileId)
      return json({ ok: true, usuario, senha })
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: identificador(usuario),
      password: senha,
      email_confirm: true,
      user_metadata: metadata,
      app_metadata: confianca,
    })
    if (error) {
      console.error('createUser', error)
      return json({ error: 'Não foi possível criar o acesso. Tente de novo.' }, 400)
    }

    /* O perfil nasce no trigger, dentro do createUser — depois desta linha ele
       já existe e dá para marcar que a senha ainda é a provisória. */
    await admin.from('profiles').update({ senha_provisoria: true }).eq('user_id', data.user!.id)

    return json({ ok: true, usuario, senha, userId: data.user?.id })
  } catch (e) {
    console.error(e)
    return json({ error: 'Não foi possível concluir. Tente de novo.' }, 500)
  }
})
